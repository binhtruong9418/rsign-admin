// Types for Template Management

export type SigningMode = "INDIVIDUAL" | "SHARED";
export type SigningFlow = "SEQUENTIAL" | "PARALLEL";

// Template Signature Zone (không có signerId, chỉ có cấu trúc)
export interface TemplateSignatureZone {
    id?: string;
    pageNumber: number;
    x: number; // Percentage (0-100)
    y: number; // Percentage (0-100)
    width: number; // Percentage (0-100)
    height: number; // Percentage (0-100)
    label?: string;
}

// Template Step (chỉ lưu số lượng signers và zone indices)
export interface TemplateStep {
    id?: string;
    stepOrder: number;
    signerCount: number; // Số lượng signers cần thiết
    zoneIndices: number[]; // Các zone index mà step này sử dụng
}

// Template (full object returned from API)
export interface Template {
    id: string;
    name: string; // Template name
    templateName?: string; // Legacy field
    title?: string; // Legacy field
    fileUrl: string;
    signingMode: SigningMode;
    signingFlow: SigningFlow;
    totalSteps: number;
    signatureZones: TemplateSignatureZone[];
    signingSteps: TemplateStep[];
    signers?: TemplateSignerPlaceholder[]; // Signer role definitions
    description?: string;
    createdBy: {
        id: string;
        fullName: string;
        email: string;
    };
    createdAt: string;
    updatedAt: string;
}

// Template List Item (lighter version for list view)
export interface TemplateListItem {
    id: string;
    templateName: string;
    title: string;
    signingMode: SigningMode;
    signingFlow: SigningFlow;
    totalSteps: number;
    signatureZoneCount: number;
    createdBy: {
        id: string;
        fullName: string;
        email: string;
    };
    createdAt: string;
    updatedAt: string;
}

// Create Template Request
export interface CreateTemplateRequest {
    templateName: string;
    title: string;
    fileUrl: string;
    signingMode: SigningMode;
    signingFlow: SigningFlow;
    signatureZones: TemplateSignatureZone[];
    signingSteps: TemplateStep[];
    description?: string;
}

// Update Template Request
export interface UpdateTemplateRequest {
    templateName?: string;
    title?: string;
    fileUrl?: string;
    signingFlow?: SigningFlow;
    signatureZones?: TemplateSignatureZone[];
    signingSteps?: TemplateStep[];
    description?: string;
}

// Template Data (for form state - similar to DocumentData)
export interface TemplateData {
    // Step 1
    signingMode: SigningMode | null;

    // Step 2
    name: string;
    description: string;
    file: File | null;
    fileUrl: string;
    signingFlow: SigningFlow;

    // Step 3 - Define signer roles (placeholders, not actual users)
    signers: TemplateSignerPlaceholder[]; // Signer role definitions
    signingSteps: TemplateSigningStep[]; // For SEQUENTIAL mode

    // Step 4
    signatureZones: TemplateZoneData[];
    pageDimensions: Map<number, { width: number; height: number }>;
}

// Template Signer Placeholder (role definition, not actual user)
export interface TemplateSignerPlaceholder {
    role: string; // e.g., "Employee", "Manager"
    description: string; // Optional description of the role
    order: number; // Order in the signing flow
    color: string; // Color for signature zones
}

// Template Signing Step (for sequential flow)
export interface TemplateSigningStep {
    stepNumber: number;
    signers: TemplateSignerPlaceholder[];
}

// Template Zone Data (for form state)
export interface TemplateZoneData {
    id: string;
    signerId: string; // References signer by index: "signer-0", "signer-1", etc.
    page: number;
    x: number;
    y: number;
    width: number;
    height: number;
    label?: string;
}

// Template Step Data (for form state) - legacy, kept for compatibility
export interface TemplateStepData {
    stepOrder: number;
    signerIds: string[]; // References to TemplateSignerPlaceholder.id
}

// Helper to build API request from TemplateData
export function buildCreateTemplateRequest(
    data: TemplateData,
): CreateTemplateRequest {
    if (!data.signingMode || !data.fileUrl || !data.name) {
        throw new Error(
            "Template name, signing mode, and file URL are required",
        );
    }

    const request: CreateTemplateRequest = {
        templateName: data.name,
        title: data.name, // Use name as title
        fileUrl: data.fileUrl,
        signingMode: data.signingMode,
        signingFlow: data.signingFlow,
        description: data.description,
        signatureZones: data.signatureZones.map((zone) => ({
            pageNumber: zone.page,
            x: parseFloat(zone.x.toFixed(2)),
            y: parseFloat(zone.y.toFixed(2)),
            width: parseFloat(zone.width.toFixed(2)),
            height: parseFloat(zone.height.toFixed(2)),
            label: zone.label,
        })),
        signingSteps: [],
    };

    if (data.signingMode === "INDIVIDUAL") {
        // For INDIVIDUAL mode: single step
        request.signingSteps = [
            {
                stepOrder: 1,
                signerCount: 1, // Individual mode has 1 signer role that maps to multiple recipients
                zoneIndices: data.signatureZones.map((_, index) => index),
            },
        ];
    } else {
        // For SHARED mode
        if (data.signingFlow === "PARALLEL") {
            // Parallel signing: single step with all signers
            request.signingSteps = [
                {
                    stepOrder: 1,
                    signerCount: data.signers.length,
                    zoneIndices: data.signatureZones.map((_, index) => index),
                },
            ];
        } else {
            // Sequential signing: multiple steps
            request.signingSteps = data.signingSteps.map((step) => {
                // Find zones for signers in this step
                const zoneIndices: number[] = [];

                step.signers.forEach((signer, signerIdx) => {
                    const globalSignerIndex = data.signers.findIndex(
                        (s) =>
                            s.role === signer.role && s.order === signer.order,
                    );
                    const signerId = `signer-${globalSignerIndex}`;

                    data.signatureZones.forEach((zone, zoneIdx) => {
                        if (zone.signerId === signerId) {
                            zoneIndices.push(zoneIdx);
                        }
                    });
                });

                return {
                    stepOrder: step.stepNumber,
                    signerCount: step.signers.length,
                    zoneIndices:
                        zoneIndices.length > 0
                            ? zoneIndices
                            : data.signatureZones.map((_, index) => index),
                };
            });
        }
    }

    return request;
}

// Helper to build update request
export function buildUpdateTemplateRequest(
    data: TemplateData,
): UpdateTemplateRequest {
    const request: UpdateTemplateRequest = {};

    if (data.name) {
        request.templateName = data.name;
        request.title = data.name;
    }
    if (data.fileUrl) request.fileUrl = data.fileUrl;
    if (data.signingFlow) request.signingFlow = data.signingFlow;
    if (data.description !== undefined) request.description = data.description;

    if (data.signatureZones) {
        request.signatureZones = data.signatureZones.map((zone) => ({
            pageNumber: zone.page,
            x: parseFloat(zone.x.toFixed(2)),
            y: parseFloat(zone.y.toFixed(2)),
            width: parseFloat(zone.width.toFixed(2)),
            height: parseFloat(zone.height.toFixed(2)),
            label: zone.label,
        }));
    }

    // Build signing steps based on mode
    if (data.signingMode === "INDIVIDUAL") {
        request.signingSteps = [
            {
                stepOrder: 1,
                signerCount: 1,
                zoneIndices: data.signatureZones.map((_, index) => index),
            },
        ];
    } else if (data.signingFlow === "PARALLEL") {
        request.signingSteps = [
            {
                stepOrder: 1,
                signerCount: data.signers.length,
                zoneIndices: data.signatureZones.map((_, index) => index),
            },
        ];
    } else {
        request.signingSteps = data.signingSteps.map((step) => {
            const zoneIndices: number[] = [];

            step.signers.forEach((signer) => {
                const globalSignerIndex = data.signers.findIndex(
                    (s) => s.role === signer.role && s.order === signer.order,
                );
                const signerId = `signer-${globalSignerIndex}`;

                data.signatureZones.forEach((zone, zoneIdx) => {
                    if (zone.signerId === signerId) {
                        zoneIndices.push(zoneIdx);
                    }
                });
            });

            return {
                stepOrder: step.stepNumber,
                signerCount: step.signers.length,
                zoneIndices:
                    zoneIndices.length > 0
                        ? zoneIndices
                        : data.signatureZones.map((_, index) => index),
            };
        });
    }

    return request;
}
