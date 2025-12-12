# RSign V2 - Frontend Types

This document contains standard TypeScript interfaces and enums for Frontend integration.

## Enums (`enums.ts`)

```typescript
export enum AppRole {
  USER = "user",
  ADMIN = "admin",
}

export enum AuthProvider {
  LOCAL = "local",
  HUST = "hust",
}

export enum SigningMode {
  INDIVIDUAL = "INDIVIDUAL", // Each recipient gets their own document copy
  SHARED = "SHARED", // All recipients sign the same document
}

export enum SigningFlow {
  PARALLEL = "PARALLEL", // All signers can sign simultaneously
  SEQUENTIAL = "SEQUENTIAL", // Signers must sign in specific order
}

export enum DocumentStatus {
  DRAFT = "DRAFT",
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum SigningStepStatus {
  WAITING = "WAITING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
}

export enum DocumentSignerStatus {
  WAITING = "WAITING",
  PENDING = "PENDING",
  SIGNED = "SIGNED",
  DECLINED = "DECLINED",
}


export enum UserStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
}
```

## Interfaces (`types.ts`)

### Common

```typescript
export interface BaseEntity {
  id: string;
  createdAt: string; // ISO Date string
  updatedAt: string; // ISO Date string
}

export interface PaginationResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
```

### User Entities

```typescript
export interface User extends BaseEntity {
  email: string;
  fullName?: string;
  role: AppRole;
  status: UserStatus;
  authProvider?: string;
  hustEmailId?: string;
}
```

### Document Entities

```typescript
export interface Document extends BaseEntity {
  title: string;
  originalFileUrl: string;
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
}

export interface SignatureZone extends BaseEntity {
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;

  // Relationships
  documentId: string;
  assignedTo?: DocumentSigner;
}

export interface SigningStep extends BaseEntity {
  stepOrder: number;
  status: SigningStepStatus;
  totalSigners: number;

  // Relationships
  documentId: string;
  signers: DocumentSigner[];
}
```

### Signing Process

```typescript
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
```

### Signer Groups

```typescript
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
```

### DTOs (Request Payloads)

```typescript
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
}

export interface SignDocumentRequest {
  sessionId: string;
  signatureData: SignatureData;
  metadata?: string;
}
```
