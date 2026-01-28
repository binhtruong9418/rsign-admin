// Error response interface
export interface ApiError {
    error: string;
    message?: string;
    statusCode?: number;
}

// Constants acting as enums
export const AppRole = {
    USER: "USER",
    ADMIN: "ADMIN",
} as const;

export const AuthProvider = {
    LOCAL: "LOCAL",
    HUST: "HUST",
} as const;

export const SigningMode = {
    INDIVIDUAL: "INDIVIDUAL", // Each recipient gets their own document copy
    SHARED: "SHARED", // All recipients sign the same document (legacy)
    MULTI: "MULTI", // All recipients sign the same document (new API format)
} as const;

export const SigningFlow = {
    PARALLEL: "PARALLEL", // All signers can sign simultaneously
    SEQUENTIAL: "SEQUENTIAL", // Signers must sign in specific order
} as const;

export const DocumentStatus = {
    DRAFT: "DRAFT",
    PENDING: "PENDING",
    IN_PROGRESS: "IN_PROGRESS",
    COMPLETED: "COMPLETED",
    CANCELLED: "CANCELLED",
    REJECTED: "REJECTED", // Document was rejected by a signer
    EXPIRED: "EXPIRED", // Document deadline has passed
} as const;

export const SigningStepStatus = {
    WAITING: "WAITING",
    IN_PROGRESS: "IN_PROGRESS",
    COMPLETED: "COMPLETED",
} as const;

export const DocumentSignerStatus = {
    WAITING: "WAITING",
    PENDING: "PENDING",
    SIGNED: "SIGNED",
    DECLINED: "DECLINED",
} as const;

export const UserStatus = {
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE",
    SUSPENDED: "SUSPENDED",
} as const;

// Type exports for the constants
export type AppRole = (typeof AppRole)[keyof typeof AppRole];
export type AuthProvider = (typeof AuthProvider)[keyof typeof AuthProvider];
export type SigningMode = (typeof SigningMode)[keyof typeof SigningMode];
export type SigningFlow = (typeof SigningFlow)[keyof typeof SigningFlow];
export type DocumentStatus =
    (typeof DocumentStatus)[keyof typeof DocumentStatus];
export type SigningStepStatus =
    (typeof SigningStepStatus)[keyof typeof SigningStepStatus];
export type DocumentSignerStatus =
    (typeof DocumentSignerStatus)[keyof typeof DocumentSignerStatus];
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

// Base Interfaces
export interface BaseEntity {
    id: string;
    createdAt: string; // ISO Date string
    updatedAt: string; // ISO Date string
}

// API Response Types
export interface User extends BaseEntity {
    email: string;
    fullName?: string;
    phoneNumber?: string;
    role: AppRole;
    status: UserStatus;
    authProvider?: AuthProvider;
    hustEmailId?: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    token: string;
    user: User;
}

// Document Types
export interface Document extends BaseEntity {
    title: string;
    originalFileUrl: string;
    displayFileUrl: string; // New field for progressive signing
    currentFileUrl?: string; // New field for tracking current state
    signedFileUrl?: string; // Available only after completion
    status: DocumentStatus;
    signingMode: SigningMode;
    signingFlow: SigningFlow;
    currentStep: number;
    totalSteps: number;
    deadline?: string; // ISO Date string
    completedAt?: string; // ISO Date string
    batchId?: string; // For INDIVIDUAL mode

    // Relationships (Expandable)
    createdBy?: User;
    assignedUser?: User; // For INDIVIDUAL mode
    signingSteps?: SigningStep[];
    signatureZones?: SignatureZone[];

    // Template fields
    isTemplate: boolean;
    templateName?: string;

    // Progress tracking (for list views)
    totalSigners?: number;
    completedSigners?: number;
}

export interface SignatureZone extends BaseEntity {
    pageNumber: number;
    x: number;
    y: number;
    width: number;
    height: number;
    label?: string;

    // Relationships
    documentId?: string;
    assignedTo?: DocumentSigner | null;
}

export interface SigningStep extends BaseEntity {
    stepOrder: number;
    status: SigningStepStatus;
    totalSigners: number;
    completedSigners: number;

    // Relationships
    documentId: string;
    signers: DocumentSigner[];
}

// Signing Process
export interface DocumentSigner extends BaseEntity {
    status: DocumentSignerStatus;
    signedAt?: string; // ISO Date string
    ipAddress?: string;
    deviceInfo?: any;
    signatureHash?: string;

    // Relationships
    user: User;
    signatureZone?: SignatureZone;
    signatureData?: SignatureData;
}

export interface SignatureData {
    strokes: Stroke[];
    color: string;
    width: number;
}

export interface Stroke {
    id: string;
    points: Point[];
}

export interface Point {
    x: number;
    y: number;
    timestamp: number;
}

// Signer Group Types
export interface SignerGroup extends BaseEntity {
    name: string;
    description?: string;
    isActive: boolean;
    memberCount?: number; // Often computed in API responses

    // Relationships
    createdBy?: User;
    members?: SignerGroupMember[];
}

export interface SignerGroupMember extends BaseEntity {
    user: User;
    group?: SignerGroup;
}

// Pagination Types
export interface PaginationResponse<T> {
    items: T[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

// DTOs (Request Payloads)
export interface CreateDocumentRequest {
    title: string;
    fileUrl: string;
    deadline?: string;
    signingMode: SigningMode;
    signingFlow: SigningFlow;
    signatureZones: {
        pageNumber: number;
        x: number;
        y: number;
        width: number;
        height: number;
        label?: string;
    }[];
    signingSteps: {
        stepOrder: number;
        signers: {
            userId: string;
            zoneIndex: number;
        }[];
    }[];
    recipients?: {
        userIds?: string[];
        signerGroupId?: string;
    };
    saveAsTemplate?: boolean;
    templateName?: string;
    sendImmediately?: boolean;
}

export interface SignDocumentRequest {
    sessionId: string;
    signatureData: SignatureData;
    metadata?: string;
}

export interface CreateSignerGroupRequest {
    name: string;
    description?: string;
    userIds?: string[]; // Optional initial members
}

export interface AddMembersRequest {
    userIds: string[];
}

// File Upload Types
export interface UploadUrlRequest {
    fileName: string;
    purpose: "DOCUMENT" | "TEMPLATE";
}

export interface UploadUrlResponse {
    presignedUrl: string;
    fileUrl: string;
}

// UI State Types
export interface DocumentFilters {
    status?: DocumentStatus;
    signingMode?: SigningMode;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
}

// API Response Types for specific endpoints
export interface DocumentCreateResponse {
    success: boolean;
    batchId?: string; // For INDIVIDUAL mode
    documentCount?: number; // For INDIVIDUAL mode
    documents?: Array<{ id: string; title: string }>; // For INDIVIDUAL mode
    document?: Document; // For SHARED mode
}

export interface DocumentProgressResponse {
    id: string;
    status: DocumentStatus;
    currentStep: number;
    totalSteps: number;
    steps: Array<{
        stepOrder: number;
        status: SigningStepStatus;
        signers: Array<{
            id: string;
            status: DocumentSignerStatus;
            user: User;
        }>;
    }>;
}

export interface PendingDocumentItem {
    documentSignerId: string;
    status: DocumentSignerStatus;
    document: {
        id: string;
        title: string;
        deadline?: string;
        createdBy: string;
    };
}

export interface DocumentSigningDetails {
    id: string;
    status: DocumentSignerStatus;
    document: {
        id: string;
        originalFileUrl: string;
    };
    signatureZone: {
        x: number;
        y: number;
        width: number;
        height: number;
        pageNumber: number;
    };
}

export interface CheckoutResponse {
    sessionId: string;
    expiresIn: number;
}

// Document Batch Types
export interface DocumentBatch {
    batchId: string;
    documentCount: number;
    completedCount: number;
    pendingCount: number;
    inProgressCount: number;
    createdAt: string;
    deadline?: string;
    createdBy: {
        id: string;
        fullName: string;
        email: string;
    };
    completionRate: number;
    status: "DRAFT" | "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
    title?: string;
}

export interface DocumentBatchFilters {
    page?: number;
    limit?: number;
    status?: "COMPLETED" | "PENDING" | "IN_PROGRESS" | "DRAFT" | "CANCELLED";
    search?: string;
    dateFrom?: string;
    dateTo?: string;
}

export interface EnhancedDocumentFilters {
    page?: number;
    limit?: number;
    status?: DocumentStatus;
    signingMode?: SigningMode;
    signingFlow?: SigningFlow;
    batchId?: string;
    createdById?: string;
    assignedUserId?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    hasDeadline?: boolean;
    isTemplate?: boolean;
}

export interface BatchSendResponse {
    success: boolean;
    sentCount: number;
    failedCount: number;
    results: Array<{
        documentId: string;
        success: boolean;
        error?: string;
    }>;
}

// Admin Document Detail API - New nested structure
export interface AdminDocumentDetail {
    document: {
        id: string;
        title: string;
        status: DocumentStatus;
        mode: "INDIVIDUAL" | "SHARED" | "MULTI";
        flow: "PARALLEL" | "SEQUENTIAL";
        createdAt: string;
        createdBy: {
            id: string;
            fullName: string;
            email: string;
        };
        deadline: string | null;
        completedAt: string | null;
    };
    files: {
        original: string;
        display: string;
        current: string | null;
        signed: string | null;
    };
    progress: {
        current: number;
        total: number;
        signed: number;
        declined: number;
        pending: number;
        percentage: number;
    };
    timeline: {
        created: {
            at: string;
            by: {
                id: string;
                fullName: string;
                email: string;
            };
        };
        deadline?: string;
        isOverdue?: boolean;
        completed?: string;
    };
    signers: Array<{
        id: string;
        user: {
            id: string;
            fullName: string;
            email: string;
        };
        status: DocumentSignerStatus;
        signedAt: string | null;
        stepOrder: number;
        zoneId: string;
    }>;
    zones: Array<{
        id: string;
        page: number;
        position: {
            x: number;
            y: number;
            w: number;
            h: number;
        };
        label: string | null;
        signer?: {
            id: string;
            user: {
                id: string;
                fullName: string;
                email: string;
            };
            status: DocumentSignerStatus;
            signedAt: string | null;
            signature?: {
                previewUrl: string;
                hash: string;
                playback: {
                    strokes: Array<{
                        points: Array<{ x: number; y: number }>;
                    }>;
                    color: string;
                    width: number;
                };
            };
            ip?: string;
            device?: {
                fingerprint: string;
                userAgent: string;
            };
        };
    }>;
    steps: Array<{
        order: number;
        status: "WAITING" | "IN_PROGRESS" | "COMPLETED";
        signers: Array<{
            id: string;
            user: {
                id: string;
                fullName: string;
                email: string;
            };
            status: DocumentSignerStatus;
            signedAt: string | null;
            zoneId: string;
        }>;
    }>;
    activities: Array<{
        type:
            | "DOCUMENT_CREATED"
            | "DOCUMENT_SENT"
            | "SESSION_CREATED"
            | "SIGNATURE_APPLIED"
            | "SIGNATURE_DECLINED"
            | "STEP_COMPLETED"
            | "DOCUMENT_COMPLETED"
            | "DOCUMENT_VIEWED"
            | "SESSION_EXPIRED";
        time: string;
        actor: {
            id: string;
            fullName: string;
            email: string;
        } | null;
        description: string;
        metadata: Record<string, any>;
    }>;
    batchId?: string;
    assignedTo?: {
        id: string;
        fullName: string;
        email: string;
    };
    template?: {
        name: string;
    };
}

export * from "./admin-statistics";
