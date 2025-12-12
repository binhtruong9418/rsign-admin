// Types for Document Creation Workflow
// Import existing types from main types file
import type { SigningMode, SigningFlow as BaseSigningFlow, CreateDocumentRequest as APICreateDocumentRequest } from '@/types';

export type DocumentType = SigningMode;
export type SigningFlow = BaseSigningFlow;

// Simple user interface for form state (different from API User which has more fields)
export interface User {
    id: string;
    name: string;
    email: string;
}

// Simple signer group for form state
export interface SignerGroup {
    id: string;
    name: string;
    memberCount: number;
    members: User[];
}

// Enhanced Signer type with support for multiple zones
export interface Signer {
    id: string;
    userId: string;
    name: string;
    email: string;
    color: string;
    step?: number; // For sequential mode - which step this signer is in
}

// Signature Zone with signer reference (for form state)
export interface SignatureZone {
    id: string;
    signerId: string; // References Signer.id
    page: number;
    x: number;
    y: number;
    width: number;
    height: number;
    label?: string;
}

// For Sequential mode - a step can have multiple signers (form state)
export interface SigningStep {
    stepOrder: number;
    signerIds: string[]; // References to Signer.id
}

// Main document data structure (form state)
export interface DocumentData {
    // Step 1
    type: DocumentType | null;

    // Step 2
    title: string;
    file: File | null;
    fileUrl?: string;
    deadline?: string;
    signingFlow: SigningFlow;
    saveAsTemplate: boolean;
    templateName: string;

    // Step 3
    recipients: User[]; // For INDIVIDUAL mode
    selectedGroup?: SignerGroup; // For INDIVIDUAL mode
    signers: Signer[]; // For SHARED mode
    signingSteps: SigningStep[]; // For SEQUENTIAL mode

    // Step 4
    signatureZones: SignatureZone[];
    pageDimensions?: Map<number, { width: number; height: number }>; // PDF page dimensions in pixels

    // Step 5
    notifications: {
        onComplete: boolean;
        reminder: boolean;
        dailyReport: boolean;
    };
}

// Re-export the API request type
export type CreateDocumentRequest = APICreateDocumentRequest;

// Helper to build API request from DocumentData
export function buildCreateDocumentRequest(data: DocumentData): CreateDocumentRequest {
    if (!data.type || !data.fileUrl) {
        throw new Error('Document type and file URL are required');
    }

    if (!data.pageDimensions || data.pageDimensions.size === 0) {
        throw new Error('PDF page dimensions are required. Please wait for the document to fully load.');
    }

    const request: CreateDocumentRequest = {
        title: data.title,
        fileUrl: data.fileUrl,
        signingMode: data.type,
        signingFlow: data.signingFlow,
        deadline: data.deadline,
        signatureZones: data.signatureZones.map(zone => {
            // Get page dimensions for this zone's page
            const pageSize = data.pageDimensions!.get(zone.page);
            if (!pageSize) {
                throw new Error(`Page dimensions not found for page ${zone.page}`);
            }

            // Convert normalized coordinates (0-1) to actual PDF pixels
            // Backend expects absolute pixel coordinates based on PDF page dimensions
            return {
                pageNumber: zone.page,
                x: parseFloat((zone.x * pageSize.width).toFixed(2)),  // Pixels
                y: parseFloat((zone.y * pageSize.height).toFixed(2)),  // Pixels
                width: parseFloat((zone.width * pageSize.width).toFixed(2)),  // Pixels
                height: parseFloat((zone.height * pageSize.height).toFixed(2)),  // Pixels
                label: zone.label,
            };
        }),
        signingSteps: [],
        saveAsTemplate: data.saveAsTemplate,
        templateName: data.saveAsTemplate ? data.templateName : undefined,
    };

    if (data.type === 'INDIVIDUAL') {
        // For INDIVIDUAL mode
        request.recipients = {
            userIds: data.recipients.map(r => r.id),
            signerGroupId: data.selectedGroup?.id,
        };

        // Individual mode requires a dummy step (per API docs)
        request.signingSteps = [
            {
                stepOrder: 1,
                signers: [],
            },
        ];
    } else {
        // For SHARED mode
        if (data.signingFlow === 'PARALLEL') {
            // Group zones by signer, maintaining order
            const signerZoneMap = new Map<string, number[]>();

            data.signatureZones.forEach((zone, index) => {
                const zones = signerZoneMap.get(zone.signerId) || [];
                zones.push(index);
                signerZoneMap.set(zone.signerId, zones);
            });

            // Create single step with all signers and their zone indices
            const signers: Array<{ userId: string; zoneIndex: number }> = [];

            data.signers.forEach(signer => {
                const zoneIndices = signerZoneMap.get(signer.id) || [];
                zoneIndices.forEach(zoneIndex => {
                    signers.push({
                        userId: signer.userId,
                        zoneIndex: zoneIndex,
                    });
                });
            });

            request.signingSteps = [
                {
                    stepOrder: 1,
                    signers: signers,
                },
            ];
        } else {
            // SEQUENTIAL mode
            // Build steps based on signingSteps
            request.signingSteps = data.signingSteps.map(step => {
                const signers: Array<{ userId: string; zoneIndex: number }> = [];

                step.signerIds.forEach(signerId => {
                    const signer = data.signers.find(s => s.id === signerId);
                    if (!signer) return;

                    // Find all zones for this signer
                    data.signatureZones.forEach((zone, index) => {
                        if (zone.signerId === signerId) {
                            signers.push({
                                userId: signer.userId,
                                zoneIndex: index,
                            });
                        }
                    });
                });

                return {
                    stepOrder: step.stepOrder,
                    signers: signers,
                };
            });
        }
    }

    return request;
}
