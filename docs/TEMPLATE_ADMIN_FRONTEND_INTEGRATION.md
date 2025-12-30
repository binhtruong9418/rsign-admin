# Template Feature - Admin Frontend Integration Guide

## Overview

This guide provides complete API integration details and workflow diagrams for frontend developers implementing the template management feature in the RSign admin panel.

**Target Audience**: Frontend developers working on the admin dashboard
**Backend Version**: v1.0.50+
**Last Updated**: 2024-12-30

---

## Table of Contents

1. [Authentication & Headers](#authentication--headers)
2. [User Workflows](#user-workflows)
3. [API Endpoints Reference](#api-endpoints-reference)
4. [Frontend Implementation Guide](#frontend-implementation-guide)
5. [UI/UX Recommendations](#uiux-recommendations)
6. [Error Handling](#error-handling)
7. [Code Examples](#code-examples)
8. [Testing Checklist](#testing-checklist)

---

## Authentication & Headers

All template API endpoints require admin authentication.

### Required Headers

```typescript
const headers = {
  'Authorization': `Bearer ${adminJwtToken}`,
  'Content-Type': 'application/json'
};
```

### Role Requirements

- **Required Role**: `ADMIN`
- **Forbidden Roles**: `USER` (will receive 403 Forbidden)

### JWT Token Structure

```typescript
interface JWTPayload {
  id: string;        // Admin user ID
  email: string;     // Admin email
  role: 'ADMIN';     // Must be ADMIN
  fullName: string;  // Admin name
  iat: number;       // Issued at
  exp: number;       // Expires at (7 days)
}
```

---

## User Workflows

### Workflow 1: Create Template from New Document

```
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: Admin Creates Document                                  │
│                                                                  │
│ UI: "Create Document" page                                      │
│ - Upload PDF/DOCX file                                          │
│ - Define signature zones (drag & drop on canvas)               │
│ - Configure signing workflow (steps, signers)                   │
│ - ☑️ "Save as template" checkbox                                │
│ - Input: Template name                                          │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 2: Frontend Uploads File                                   │
│                                                                  │
│ POST /api/admin/documents/upload-url                            │
│ Body: { fileName, purpose: "TEMPLATE" }                         │
│ Response: { uploadUrl, objectName }                             │
│                                                                  │
│ Then: PUT to uploadUrl (presigned URL)                          │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 3: Frontend Submits Document Creation                      │
│                                                                  │
│ POST /api/admin/documents                                       │
│ Body: {                                                          │
│   title, fileUrl, signingMode, signingFlow,                    │
│   signatureZones[], signingSteps[],                            │
│   saveAsTemplate: true,                                         │
│   templateName: "employment_contract_v1"                        │
│ }                                                                │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 4: Backend Creates Document + Template                     │
│                                                                  │
│ Response: {                                                      │
│   success: true,                                                 │
│   document: { id, title, status },                              │
│   template: { id, templateName, isTemplate }                    │
│ }                                                                │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 5: Frontend Shows Success                                  │
│                                                                  │
│ ✅ "Document created"                                            │
│ ✅ "Template 'employment_contract_v1' saved"                     │
│ Options:                                                         │
│ - View document                                                  │
│ - View template                                                  │
│ - Create another                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### Workflow 2: Browse and Manage Templates

```
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: Admin Navigates to Templates Page                       │
│                                                                  │
│ UI: "Templates" section in admin panel                          │
│ - Sidebar: "Templates" menu item                                │
│ - URL: /admin/templates                                         │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 2: Frontend Fetches Templates                              │
│                                                                  │
│ GET /api/admin/templates?page=0&limit=10                        │
│                                                                  │
│ Response: {                                                      │
│   data: [                                                        │
│     {                                                            │
│       id, title, originalFileUrl, templateName,                 │
│       createdAt, createdBy, stepsCount                          │
│     }                                                            │
│   ],                                                             │
│   metadata: { total, page, limit, totalPages }                  │
│ }                                                                │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 3: Frontend Displays Template Cards/Table                  │
│                                                                  │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ Template: employment_contract_v1                         │   │
│ │ Created: 2024-12-20 by admin@company.com                 │   │
│ │ Steps: 2                                                  │   │
│ │                                                           │   │
│ │ [Use Template] [Edit] [Delete]                           │   │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│ Pagination: [< Prev] [1] [2] [3] [Next >]                      │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ├──────── User clicks "Use Template" ──────────┐
                  │                                               │
                  ├──────── User clicks "Edit" ──────────────────┤
                  │                                               │
                  └──────── User clicks "Delete" ────────────────┘
```

---

### Workflow 3: Create Document from Template

```
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: Admin Clicks "Use Template"                             │
│                                                                  │
│ From: Templates list page                                       │
│ Selected: employment_contract_v1 (template-uuid-123)           │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 2: Frontend Fetches Template Details                       │
│                                                                  │
│ GET /api/admin/documents/template-uuid-123                      │
│                                                                  │
│ Response: {                                                      │
│   id, title, signingMode, signingFlow, totalSteps,             │
│   signatureZones: [                                             │
│     { id, pageNumber, x, y, width, height, label }             │
│   ],                                                             │
│   signingSteps: [                                               │
│     { id, stepOrder, totalSigners }                             │
│   ]                                                              │
│ }                                                                │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 3: Frontend Shows Template Configuration Form              │
│                                                                  │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ Create Document from Template: employment_contract_v1      │ │
│ │                                                             │ │
│ │ Document Title:                                             │ │
│ │ [Employment Contract - Jane Smith____________]             │ │
│ │                                                             │ │
│ │ Deadline (optional):                                        │ │
│ │ [2024-12-31________________] 📅                             │ │
│ │                                                             │ │
│ │ ───────────────────────────────────────                    │ │
│ │                                                             │ │
│ │ Template Structure: 2 steps, 2 signature zones             │ │
│ │                                                             │ │
│ │ Step 1: Employee Signature                                 │ │
│ │   Zone 1: "Employee Signature" (Page 1)                    │ │
│ │   Assign to: [Select User ▼] → Jane Smith                 │ │
│ │                                                             │ │
│ │ Step 2: HR Manager Signature                               │ │
│ │   Zone 2: "HR Manager Signature" (Page 1)                  │ │
│ │   Assign to: [Select User ▼] → John Manager               │ │
│ │                                                             │ │
│ │ [Cancel] [Create Document]                                 │ │
│ └────────────────────────────────────────────────────────────┘ │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 4: Frontend Submits Document Creation                      │
│                                                                  │
│ POST /api/admin/documents/from-template/template-uuid-123       │
│ Body: {                                                          │
│   title: "Employment Contract - Jane Smith",                   │
│   deadline: "2024-12-31T23:59:59Z",                            │
│   signingSteps: [                                               │
│     {                                                            │
│       stepOrder: 1,                                             │
│       signers: [{ userId: "jane-uuid", zoneIndex: 0 }]         │
│     },                                                           │
│     {                                                            │
│       stepOrder: 2,                                             │
│       signers: [{ userId: "john-uuid", zoneIndex: 1 }]         │
│     }                                                            │
│   ]                                                              │
│ }                                                                │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 5: Backend Creates Document                                │
│                                                                  │
│ Response: {                                                      │
│   success: true,                                                 │
│   document: {                                                    │
│     id: "new-doc-uuid",                                         │
│     title: "Employment Contract - Jane Smith",                 │
│     status: "DRAFT",                                            │
│     templateDocument: "template-uuid-123",                      │
│     signingMode: "SHARED",                                      │
│     signingFlow: "SEQUENTIAL"                                   │
│   }                                                              │
│ }                                                                │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 6: Frontend Shows Success & Next Actions                   │
│                                                                  │
│ ✅ "Document created successfully"                               │
│ ℹ️  "Created from template: employment_contract_v1"             │
│                                                                  │
│ Options:                                                         │
│ - [Send for Signing] → POST /api/admin/documents/:id/send      │
│ - [View Document] → Navigate to document detail                 │
│ - [Create Another] → Return to template selection               │
└─────────────────────────────────────────────────────────────────┘
```

---

### Workflow 4: Edit Template

```
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: Admin Clicks "Edit" on Template                         │
│                                                                  │
│ From: Templates list                                            │
│ Action: Edit button clicked                                     │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 2: Frontend Fetches Full Template Details                  │
│                                                                  │
│ GET /api/admin/documents/template-uuid-123                      │
│                                                                  │
│ Loads: zones, steps, metadata                                   │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 3: Frontend Shows Template Editor                          │
│                                                                  │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ Edit Template: employment_contract_v1                      │ │
│ │                                                             │ │
│ │ Title:                                                      │ │
│ │ [Employment Contract Template______________]               │ │
│ │                                                             │ │
│ │ Template Name:                                              │ │
│ │ [employment_contract_v2____________________]               │ │
│ │                                                             │ │
│ │ Signature Zones:                                            │ │
│ │ [PDF Canvas with draggable zones]                          │ │
│ │                                                             │ │
│ │ Signing Steps:                                              │ │
│ │ Step 1: 1 signer                                            │ │
│ │ Step 2: 1 signer                                            │ │
│ │ [Add Step]                                                  │ │
│ │                                                             │ │
│ │ [Cancel] [Save Changes]                                    │ │
│ └────────────────────────────────────────────────────────────┘ │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 4: Frontend Submits Update                                 │
│                                                                  │
│ PUT /api/admin/templates/template-uuid-123                      │
│ Body: {                                                          │
│   title: "Employment Contract Template",                       │
│   templateName: "employment_contract_v2",                       │
│   signatureZones: [                                             │
│     { pageNumber: 1, x: 20, y: 80, width: 30, height: 10,     │
│       label: "Employee Signature" }                             │
│   ],                                                             │
│   signingSteps: [                                               │
│     { stepOrder: 1, totalSigners: 1 },                         │
│     { stepOrder: 2, totalSigners: 1 }                          │
│   ]                                                              │
│ }                                                                │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 5: Backend Updates Template                                │
│                                                                  │
│ Response: {                                                      │
│   success: true,                                                 │
│   template: {                                                    │
│     id, title, templateName, isTemplate                         │
│   }                                                              │
│ }                                                                │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 6: Frontend Shows Success                                  │
│                                                                  │
│ ✅ "Template updated successfully"                               │
│ → Navigate back to templates list                               │
└─────────────────────────────────────────────────────────────────┘
```

---

### Workflow 5: Delete Template

```
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: Admin Clicks "Delete" on Template                       │
│                                                                  │
│ From: Templates list or template detail                         │
│ Action: Delete button clicked                                   │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 2: Frontend Shows Confirmation Dialog                      │
│                                                                  │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ ⚠️  Delete Template?                                        │ │
│ │                                                             │ │
│ │ Are you sure you want to delete this template?             │ │
│ │                                                             │ │
│ │ Template: employment_contract_v1                            │ │
│ │                                                             │ │
│ │ ℹ️  Documents created from this template will not be       │ │
│ │    affected, but the template reference will be cleared.   │ │
│ │                                                             │ │
│ │ [Cancel] [Delete Template]                                 │ │
│ └────────────────────────────────────────────────────────────┘ │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 3: Frontend Sends Delete Request                           │
│                                                                  │
│ DELETE /api/admin/templates/template-uuid-123                   │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 4: Backend Deletes Template                                │
│                                                                  │
│ - Finds all documents using this template                       │
│ - Clears templateDocument reference                             │
│ - Deletes template                                              │
│                                                                  │
│ Response: {                                                      │
│   success: true,                                                 │
│   message: "Template deleted successfully",                     │
│   affectedDocuments: 5                                          │
│ }                                                                │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 5: Frontend Shows Success                                  │
│                                                                  │
│ ✅ "Template deleted successfully"                               │
│ ℹ️  "5 documents were using this template"                      │
│ → Remove template from list                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints Reference

### 1. List Templates

**Endpoint**: `GET /api/admin/templates`

**Query Parameters**:
```typescript
interface ListTemplatesQuery {
  page?: number;    // Default: 0
  limit?: number;   // Default: 10
}
```

**Request Example**:
```typescript
const response = await fetch(
  'https://api.rsign.com/api/admin/templates?page=0&limit=10',
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
);
```

**Response**:
```typescript
interface ListTemplatesResponse {
  data: Array<{
    id: string;                    // UUID
    title: string;                 // Template title
    originalFileUrl: string;       // MinIO URL
    templateName: string;          // Unique template name
    createdAt: string;             // ISO 8601
    createdBy: {
      id: string;
      fullName: string;
      email: string;
    };
    stepsCount: number;            // Total signing steps
  }>;
  metadata: {
    total: number;                 // Total templates
    page: number;                  // Current page (0-indexed)
    limit: number;                 // Items per page
    totalPages: number;            // Total pages
  };
}
```

**Example Response**:
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Employment Contract Template",
      "originalFileUrl": "https://minio.example.com/rsign-be/documents/admin/template_employment.pdf",
      "templateName": "employment_contract_v2",
      "createdAt": "2024-12-20T10:30:00.000Z",
      "createdBy": {
        "id": "admin-uuid",
        "fullName": "John Admin",
        "email": "admin@company.com"
      },
      "stepsCount": 2
    }
  ],
  "metadata": {
    "total": 15,
    "page": 0,
    "limit": 10,
    "totalPages": 2
  }
}
```

**Status Codes**:
- `200 OK`: Success
- `401 Unauthorized`: Missing or invalid JWT
- `403 Forbidden`: Not admin role

---

### 2. Get Template Details

**Endpoint**: `GET /api/admin/documents/:templateId`

**Path Parameters**:
- `templateId`: string (UUID)

**Request Example**:
```typescript
const response = await fetch(
  `https://api.rsign.com/api/admin/documents/${templateId}`,
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
);
```

**Response**: See [Document Detail API docs](./api/document-detail.md)

Includes:
- Full document/template metadata
- All signature zones with coordinates
- All signing steps with structure
- Created by info

---

### 3. Create Document from Template

**Endpoint**: `POST /api/admin/documents/from-template/:templateId`

**Path Parameters**:
- `templateId`: string (UUID)

**Request Body**:
```typescript
interface CreateFromTemplateRequest {
  title: string;                          // New document title
  deadline?: string;                      // ISO 8601, optional
  signingSteps: Array<{
    stepOrder: number;                    // Must match template
    signers: Array<{
      userId: string;                     // User UUID
      zoneIndex: number;                  // 0-based index
    }>;
  }>;
  recipients?: {                          // For INDIVIDUAL mode
    userIds?: string[];                   // Array of user UUIDs
    signerGroupId?: string;               // Or signer group UUID
  };
}
```

**Validation Rules**:
1. `signingSteps.length` must equal template's `totalSteps`
2. Each step's `signers.length` must match template step's `totalSigners`
3. All `zoneIndex` values must be valid (< template's zones count)
4. All `userId` values must exist in database

**Request Example**:
```typescript
const response = await fetch(
  `https://api.rsign.com/api/admin/documents/from-template/${templateId}`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: 'Employment Contract - Jane Smith',
      deadline: '2024-12-31T23:59:59Z',
      signingSteps: [
        {
          stepOrder: 1,
          signers: [
            { userId: 'jane-uuid', zoneIndex: 0 }
          ]
        },
        {
          stepOrder: 2,
          signers: [
            { userId: 'hr-manager-uuid', zoneIndex: 1 }
          ]
        }
      ]
    })
  }
);
```

**Response**:
```typescript
interface CreateFromTemplateResponse {
  success: true;
  document: {
    id: string;                           // New document UUID
    title: string;
    status: 'DRAFT';
    templateDocument: string;             // Template UUID
    signingMode: 'INDIVIDUAL' | 'SHARED';
    signingFlow: 'PARALLEL' | 'SEQUENTIAL';
  };
}
```

**Example Response**:
```json
{
  "success": true,
  "document": {
    "id": "new-doc-uuid",
    "title": "Employment Contract - Jane Smith",
    "status": "DRAFT",
    "templateDocument": "template-uuid-123",
    "signingMode": "SHARED",
    "signingFlow": "SEQUENTIAL"
  }
}
```

**Error Responses**:
```typescript
// 400 Bad Request - Validation errors
{
  "error": "BadRequestError",
  "message": "Number of signing steps must match template (expected 2, got 1)"
}

{
  "error": "BadRequestError",
  "message": "Step 2 requires 1 signers, got 2"
}

{
  "error": "BadRequestError",
  "message": "Invalid zone index: 5 (template has 2 zones)"
}

// 404 Not Found
{
  "error": "NotFoundError",
  "message": "Template not found"
}

{
  "error": "NotFoundError",
  "message": "Signer user not found: jane-uuid"
}
```

**Status Codes**:
- `200 OK`: Document created successfully
- `400 Bad Request`: Validation error (see error message)
- `401 Unauthorized`: Missing or invalid JWT
- `403 Forbidden`: Not admin role
- `404 Not Found`: Template or user not found

---

### 4. Update Template

**Endpoint**: `PUT /api/admin/templates/:templateId`

**Path Parameters**:
- `templateId`: string (UUID)

**Request Body**:
```typescript
interface UpdateTemplateRequest {
  title?: string;                         // Update title
  templateName?: string;                  // Update template name
  signatureZones?: Array<{                // Replace all zones
    pageNumber: number;
    x: number;                            // Percentage 0-100
    y: number;                            // Percentage 0-100
    width: number;                        // Percentage
    height: number;                       // Percentage
    label?: string;
  }>;
  signingSteps?: Array<{                  // Replace all steps
    stepOrder: number;
    totalSigners: number;
  }>;
}
```

**Notes**:
- All fields are optional
- If `signatureZones` provided, all existing zones are deleted and replaced
- If `signingSteps` provided, all existing steps are deleted and replaced
- Partial updates supported (only update provided fields)

**Request Example**:
```typescript
const response = await fetch(
  `https://api.rsign.com/api/admin/templates/${templateId}`,
  {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: 'Employment Contract Template (Updated)',
      templateName: 'employment_contract_v3',
      signatureZones: [
        {
          pageNumber: 1,
          x: 20,
          y: 80,
          width: 30,
          height: 10,
          label: 'Employee Signature'
        },
        {
          pageNumber: 1,
          x: 60,
          y: 80,
          width: 30,
          height: 10,
          label: 'HR Manager Signature'
        }
      ]
    })
  }
);
```

**Response**:
```typescript
interface UpdateTemplateResponse {
  success: true;
  template: {
    id: string;
    title: string;
    templateName: string;
    isTemplate: true;
  };
}
```

**Example Response**:
```json
{
  "success": true,
  "template": {
    "id": "template-uuid-123",
    "title": "Employment Contract Template (Updated)",
    "templateName": "employment_contract_v3",
    "isTemplate": true
  }
}
```

**Status Codes**:
- `200 OK`: Template updated successfully
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Missing or invalid JWT
- `403 Forbidden`: Not admin role
- `404 Not Found`: Template not found

---

### 5. Delete Template

**Endpoint**: `DELETE /api/admin/templates/:templateId`

**Path Parameters**:
- `templateId`: string (UUID)

**Request Example**:
```typescript
const response = await fetch(
  `https://api.rsign.com/api/admin/templates/${templateId}`,
  {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
);
```

**Response**:
```typescript
interface DeleteTemplateResponse {
  success: true;
  message: string;
  affectedDocuments: number;              // Count of documents using this template
}
```

**Example Response**:
```json
{
  "success": true,
  "message": "Template deleted successfully",
  "affectedDocuments": 5
}
```

**Notes**:
- Documents created from this template are NOT deleted
- Their `templateDocument` reference is cleared (set to null)
- Orphaned documents remain functional

**Status Codes**:
- `200 OK`: Template deleted successfully
- `401 Unauthorized`: Missing or invalid JWT
- `403 Forbidden`: Not admin role
- `404 Not Found`: Template not found

---

### 6. Create Document with Template Save

**Endpoint**: `POST /api/admin/documents`

**Additional Fields** (beyond normal document creation):
```typescript
interface CreateDocumentRequest {
  // ... all normal document creation fields
  saveAsTemplate?: boolean;               // Set to true
  templateName?: string;                  // Required if saveAsTemplate is true
}
```

**Request Example**:
```typescript
const response = await fetch(
  'https://api.rsign.com/api/admin/documents',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: 'Employment Contract - John Doe',
      fileUrl: 'https://minio.example.com/rsign-be/documents/admin/contract.pdf',
      signingMode: 'SHARED',
      signingFlow: 'SEQUENTIAL',
      signatureZones: [
        {
          pageNumber: 1,
          x: 20,
          y: 80,
          width: 30,
          height: 10,
          label: 'Employee Signature'
        }
      ],
      signingSteps: [
        {
          stepOrder: 1,
          signers: [
            { userId: 'john-uuid', zoneIndex: 0 }
          ]
        }
      ],
      saveAsTemplate: true,
      templateName: 'employment_contract_v1'
    })
  }
);
```

**Response** (when saveAsTemplate is true):
```typescript
interface CreateDocumentWithTemplateResponse {
  success: true;
  document: {
    id: string;
    title: string;
    status: string;
  };
  template: {                             // Only present if saveAsTemplate was true
    id: string;
    templateName: string;
    isTemplate: true;
  };
}
```

**Example Response**:
```json
{
  "success": true,
  "document": {
    "id": "document-uuid",
    "title": "Employment Contract - John Doe",
    "status": "DRAFT"
  },
  "template": {
    "id": "template-uuid",
    "templateName": "employment_contract_v1",
    "isTemplate": true
  }
}
```

---

## Frontend Implementation Guide

### State Management

#### Template List State

```typescript
interface TemplateListState {
  templates: Template[];
  loading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

interface Template {
  id: string;
  title: string;
  originalFileUrl: string;
  templateName: string;
  createdAt: string;
  createdBy: {
    id: string;
    fullName: string;
    email: string;
  };
  stepsCount: number;
}
```

#### Template Details State

```typescript
interface TemplateDetailsState {
  template: TemplateDetails | null;
  loading: boolean;
  error: string | null;
}

interface TemplateDetails {
  id: string;
  title: string;
  originalFileUrl: string;
  signedFileUrl: string | null;
  contentHash: string;
  status: DocumentStatus;
  signingMode: 'INDIVIDUAL' | 'SHARED';
  signingFlow: 'PARALLEL' | 'SEQUENTIAL';
  currentStep: number;
  totalSteps: number;
  deadline: string | null;
  completedAt: string | null;
  isTemplate: boolean;
  templateName: string;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    fullName: string;
    email: string;
  };
  signatureZones: SignatureZone[];
  signingSteps: SigningStep[];
}

interface SignatureZone {
  id: string;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string | null;
}

interface SigningStep {
  id: string;
  stepOrder: number;
  status: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED';
  totalSigners: number;
  completedSigners: number;
}
```

### React Example - Template List Component

```typescript
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface TemplateListProps {
  authToken: string;
}

const TemplateList: React.FC<TemplateListProps> = ({ authToken }) => {
  const [state, setState] = useState<TemplateListState>({
    templates: [],
    loading: true,
    error: null,
    pagination: {
      currentPage: 0,
      totalPages: 0,
      totalItems: 0,
      itemsPerPage: 10
    }
  });

  const navigate = useNavigate();

  const fetchTemplates = async (page: number = 0) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/templates?page=${page}&limit=${state.pagination.itemsPerPage}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      setState(prev => ({
        ...prev,
        templates: data.data,
        loading: false,
        pagination: {
          currentPage: data.metadata.page,
          totalPages: data.metadata.totalPages,
          totalItems: data.metadata.total,
          itemsPerPage: data.metadata.limit
        }
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
    }
  };

  useEffect(() => {
    fetchTemplates(0);
  }, []);

  const handleUseTemplate = (templateId: string) => {
    navigate(`/admin/templates/${templateId}/use`);
  };

  const handleEditTemplate = (templateId: string) => {
    navigate(`/admin/templates/${templateId}/edit`);
  };

  const handleDeleteTemplate = async (templateId: string, templateName: string) => {
    if (!confirm(`Delete template "${templateName}"? Documents using this template will not be affected.`)) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/templates/${templateId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      alert(`Template deleted successfully. ${data.affectedDocuments} documents were using this template.`);

      // Refresh list
      fetchTemplates(state.pagination.currentPage);
    } catch (error) {
      alert(`Error deleting template: ${error.message}`);
    }
  };

  if (state.loading) {
    return <div>Loading templates...</div>;
  }

  if (state.error) {
    return <div>Error: {state.error}</div>;
  }

  return (
    <div className="template-list">
      <h1>Document Templates</h1>

      <div className="templates-grid">
        {state.templates.map(template => (
          <div key={template.id} className="template-card">
            <h3>{template.templateName}</h3>
            <p className="template-title">{template.title}</p>
            <p className="template-meta">
              Created by {template.createdBy.fullName} on{' '}
              {new Date(template.createdAt).toLocaleDateString()}
            </p>
            <p className="template-steps">Steps: {template.stepsCount}</p>

            <div className="template-actions">
              <button onClick={() => handleUseTemplate(template.id)}>
                Use Template
              </button>
              <button onClick={() => handleEditTemplate(template.id)}>
                Edit
              </button>
              <button
                className="danger"
                onClick={() => handleDeleteTemplate(template.id, template.templateName)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {state.pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            disabled={state.pagination.currentPage === 0}
            onClick={() => fetchTemplates(state.pagination.currentPage - 1)}
          >
            Previous
          </button>
          <span>
            Page {state.pagination.currentPage + 1} of {state.pagination.totalPages}
          </span>
          <button
            disabled={state.pagination.currentPage >= state.pagination.totalPages - 1}
            onClick={() => fetchTemplates(state.pagination.currentPage + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default TemplateList;
```

### React Example - Create from Template Component

```typescript
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface UseTemplateProps {
  authToken: string;
}

const UseTemplate: React.FC<UseTemplateProps> = ({ authToken }) => {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();

  const [template, setTemplate] = useState<TemplateDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    deadline: '',
    signerAssignments: [] as Array<{ stepOrder: number; userId: string; zoneIndex: number }>
  });

  useEffect(() => {
    fetchTemplateDetails();
  }, [templateId]);

  const fetchTemplateDetails = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/documents/${templateId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setTemplate(data);

      // Initialize signer assignments based on template structure
      const initialAssignments = data.signingSteps.flatMap((step: SigningStep) =>
        Array.from({ length: step.totalSigners }, (_, i) => ({
          stepOrder: step.stepOrder,
          userId: '',
          zoneIndex: -1  // To be assigned
        }))
      );

      setFormData(prev => ({
        ...prev,
        signerAssignments: initialAssignments
      }));

      setLoading(false);
    } catch (error) {
      alert(`Error loading template: ${error.message}`);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // Group signers by step
    const signingSteps = template!.signingSteps.map(step => ({
      stepOrder: step.stepOrder,
      signers: formData.signerAssignments
        .filter(a => a.stepOrder === step.stepOrder)
        .map((a, index) => ({
          userId: a.userId,
          zoneIndex: a.zoneIndex >= 0 ? a.zoneIndex : index
        }))
    }));

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/documents/from-template/${templateId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: formData.title,
            deadline: formData.deadline || undefined,
            signingSteps
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();

      alert('Document created successfully!');
      navigate(`/admin/documents/${data.document.id}`);
    } catch (error) {
      alert(`Error creating document: ${error.message}`);
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div>Loading template...</div>;
  }

  if (!template) {
    return <div>Template not found</div>;
  }

  return (
    <div className="use-template">
      <h1>Create Document from Template: {template.templateName}</h1>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Document Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
            required
          />
        </div>

        <div className="form-group">
          <label>Deadline (optional)</label>
          <input
            type="datetime-local"
            value={formData.deadline}
            onChange={e => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
          />
        </div>

        <div className="template-structure">
          <h3>Template Structure</h3>
          <p>
            {template.signingMode} mode, {template.signingFlow} flow
            <br />
            {template.totalSteps} steps, {template.signatureZones.length} signature zones
          </p>
        </div>

        <div className="signer-assignments">
          <h3>Assign Signers</h3>
          {template.signingSteps.map((step, stepIndex) => (
            <div key={step.id} className="signing-step">
              <h4>Step {step.stepOrder}</h4>
              {Array.from({ length: step.totalSigners }, (_, signerIndex) => {
                const assignmentIndex = formData.signerAssignments.findIndex(
                  a => a.stepOrder === step.stepOrder
                );
                const zone = template.signatureZones[signerIndex];

                return (
                  <div key={signerIndex} className="signer-assignment">
                    <label>
                      {zone?.label || `Signer ${signerIndex + 1}`}
                      {zone && ` (Page ${zone.pageNumber})`}
                    </label>
                    <select
                      value={formData.signerAssignments[assignmentIndex + signerIndex]?.userId || ''}
                      onChange={e => {
                        const newAssignments = [...formData.signerAssignments];
                        newAssignments[assignmentIndex + signerIndex] = {
                          stepOrder: step.stepOrder,
                          userId: e.target.value,
                          zoneIndex: signerIndex
                        };
                        setFormData(prev => ({ ...prev, signerAssignments: newAssignments }));
                      }}
                      required
                    >
                      <option value="">Select User</option>
                      {/* Populate with user list from API */}
                    </select>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate('/admin/templates')}>
            Cancel
          </button>
          <button type="submit" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Document'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UseTemplate;
```

---

## UI/UX Recommendations

### Template List Page

**Layout**:
```
┌─────────────────────────────────────────────────────────────────┐
│ 🏠 Dashboard > Templates                           [+ New Template]│
├─────────────────────────────────────────────────────────────────┤
│ Search: [___________________] 🔍                                 │
│ Sort by: [Most Recent ▼]                                        │
├─────────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────┐                      │
│ │ 📄 employment_contract_v2               │                      │
│ │ Employment Contract Template            │                      │
│ │ Created: Dec 20, 2024 by admin@...     │                      │
│ │ Steps: 2 | Zones: 2                     │                      │
│ │ [Use Template] [Edit] [Delete]          │                      │
│ └────────────────────────────────────────┘                      │
│                                                                  │
│ ┌────────────────────────────────────────┐                      │
│ │ 📄 nda_standard                         │                      │
│ │ Non-Disclosure Agreement                │                      │
│ │ Created: Dec 15, 2024 by admin@...     │                      │
│ │ Steps: 1 | Zones: 1                     │                      │
│ │ [Use Template] [Edit] [Delete]          │                      │
│ └────────────────────────────────────────┘                      │
├─────────────────────────────────────────────────────────────────┤
│ [< Previous] Page 1 of 3 [Next >]                               │
└─────────────────────────────────────────────────────────────────┘
```

**Recommendations**:
1. **Card/Grid Layout**: Show templates as cards with preview thumbnails (if possible)
2. **Quick Actions**: Primary action = "Use Template", secondary = Edit/Delete
3. **Template Info**: Show creation date, creator, step count prominently
4. **Search/Filter**: Allow searching by template name or title
5. **Pagination**: Use page-based pagination (already supported by API)

### Create from Template Page

**Recommendations**:
1. **Show Template Preview**: Display PDF preview with signature zones highlighted
2. **Visual Zone Assignment**: Show zones on PDF, assign users by clicking
3. **Step-by-Step Wizard**:
   - Step 1: Document details (title, deadline)
   - Step 2: Assign signers (with visual zone reference)
   - Step 3: Review and create
4. **Validation Feedback**: Show real-time validation (e.g., "Step 2 requires 1 signer")
5. **User Selection**: Use searchable dropdown with user avatars

### Template Editor

**Recommendations**:
1. **PDF Canvas**: Allow drag-and-drop signature zones
2. **Zone Properties Panel**: Edit x, y, width, height, label
3. **Step Configuration**: Add/remove/reorder steps
4. **Live Preview**: Show how zones appear on the PDF
5. **Save Indication**: Show "Unsaved changes" warning

---

## Error Handling

### Error Response Format

All errors follow this structure:

```typescript
interface ErrorResponse {
  error: string;        // Error type (e.g., "BadRequestError")
  message: string;      // Human-readable error message
}
```

### Common Errors

#### 400 Bad Request

```json
{
  "error": "BadRequestError",
  "message": "Number of signing steps must match template (expected 2, got 1)"
}
```

**Frontend Handling**:
```typescript
if (response.status === 400) {
  const errorData = await response.json();
  showValidationError(errorData.message);
}
```

#### 401 Unauthorized

```json
{
  "error": "Unauthorized",
  "message": "Missing or invalid authentication token"
}
```

**Frontend Handling**:
```typescript
if (response.status === 401) {
  // Token expired or invalid
  redirectToLogin();
}
```

#### 403 Forbidden

```json
{
  "error": "Forbidden",
  "message": "Admin role required"
}
```

**Frontend Handling**:
```typescript
if (response.status === 403) {
  showError("You don't have permission to access this resource");
}
```

#### 404 Not Found

```json
{
  "error": "NotFoundError",
  "message": "Template not found"
}
```

**Frontend Handling**:
```typescript
if (response.status === 404) {
  showError("Template not found or has been deleted");
  redirectToTemplatesList();
}
```

### Error Handling Best Practices

```typescript
async function apiCall<T>(
  url: string,
  options: RequestInit
): Promise<T> {
  try {
    const response = await fetch(url, options);

    // Handle different status codes
    if (response.status === 401) {
      // Redirect to login
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    if (response.status === 403) {
      throw new Error('You do not have permission to perform this action');
    }

    if (response.status === 404) {
      throw new Error('Resource not found');
    }

    if (!response.ok) {
      // Try to get error message from response
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    // Network errors or JSON parsing errors
    if (error instanceof TypeError) {
      throw new Error('Network error. Please check your connection.');
    }
    throw error;
  }
}
```

---

## Code Examples

### TypeScript API Client

```typescript
// api/templateApi.ts
export class TemplateAPI {
  private baseUrl: string;
  private authToken: string;

  constructor(baseUrl: string, authToken: string) {
    this.baseUrl = baseUrl;
    this.authToken = authToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return await response.json();
  }

  // List templates
  async listTemplates(page: number = 0, limit: number = 10) {
    return this.request<ListTemplatesResponse>(
      `/api/admin/templates?page=${page}&limit=${limit}`,
      { method: 'GET' }
    );
  }

  // Get template details
  async getTemplate(templateId: string) {
    return this.request<TemplateDetails>(
      `/api/admin/documents/${templateId}`,
      { method: 'GET' }
    );
  }

  // Create document from template
  async createFromTemplate(
    templateId: string,
    data: CreateFromTemplateRequest
  ) {
    return this.request<CreateFromTemplateResponse>(
      `/api/admin/documents/from-template/${templateId}`,
      {
        method: 'POST',
        body: JSON.stringify(data)
      }
    );
  }

  // Update template
  async updateTemplate(
    templateId: string,
    data: UpdateTemplateRequest
  ) {
    return this.request<UpdateTemplateResponse>(
      `/api/admin/templates/${templateId}`,
      {
        method: 'PUT',
        body: JSON.stringify(data)
      }
    );
  }

  // Delete template
  async deleteTemplate(templateId: string) {
    return this.request<DeleteTemplateResponse>(
      `/api/admin/templates/${templateId}`,
      { method: 'DELETE' }
    );
  }

  // Create document with template save
  async createDocumentWithTemplate(data: CreateDocumentRequest) {
    return this.request<CreateDocumentWithTemplateResponse>(
      '/api/admin/documents',
      {
        method: 'POST',
        body: JSON.stringify(data)
      }
    );
  }
}

// Usage
const api = new TemplateAPI('https://api.rsign.com', userJWT);

// List templates
const templates = await api.listTemplates(0, 10);

// Create from template
const document = await api.createFromTemplate('template-uuid', {
  title: 'New Document',
  signingSteps: [...]
});
```

### React Hook for Template Management

```typescript
// hooks/useTemplates.ts
import { useState, useEffect } from 'react';
import { TemplateAPI } from '../api/templateApi';

export function useTemplates(authToken: string) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const api = new TemplateAPI(process.env.REACT_APP_API_URL!, authToken);

  const fetchTemplates = async (page: number = 0) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.listTemplates(page, 10);
      setTemplates(response.data);
      setCurrentPage(response.metadata.page);
      setTotalPages(response.metadata.totalPages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteTemplate = async (templateId: string) => {
    try {
      const response = await api.deleteTemplate(templateId);
      alert(`Template deleted. ${response.affectedDocuments} documents were using it.`);
      await fetchTemplates(currentPage);
      return true;
    } catch (err) {
      alert(`Error deleting template: ${err.message}`);
      return false;
    }
  };

  useEffect(() => {
    fetchTemplates(0);
  }, [authToken]);

  return {
    templates,
    loading,
    error,
    currentPage,
    totalPages,
    fetchTemplates,
    deleteTemplate,
    goToPage: (page: number) => fetchTemplates(page),
    nextPage: () => fetchTemplates(currentPage + 1),
    prevPage: () => fetchTemplates(currentPage - 1)
  };
}

// Usage in component
function TemplateListPage() {
  const { authToken } = useAuth();
  const {
    templates,
    loading,
    error,
    currentPage,
    totalPages,
    deleteTemplate,
    nextPage,
    prevPage
  } = useTemplates(authToken);

  if (loading) return <Loading />;
  if (error) return <Error message={error} />;

  return (
    <div>
      {templates.map(template => (
        <TemplateCard
          key={template.id}
          template={template}
          onDelete={() => deleteTemplate(template.id)}
        />
      ))}
      <Pagination
        current={currentPage}
        total={totalPages}
        onNext={nextPage}
        onPrev={prevPage}
      />
    </div>
  );
}
```

---

## Testing Checklist

### Manual Testing

#### Template List
- [ ] List templates displays correctly
- [ ] Pagination works (prev/next buttons)
- [ ] Empty state shows when no templates
- [ ] Loading state shows during fetch
- [ ] Error state shows on fetch failure

#### Create from Template
- [ ] Template details load correctly
- [ ] Signature zones display on PDF preview
- [ ] Signer assignment form validates correctly
- [ ] Document created successfully
- [ ] Error messages display for validation failures
- [ ] Redirect to document detail after creation

#### Template Update
- [ ] Template editor loads with current data
- [ ] Zone edits save correctly
- [ ] Step configuration updates correctly
- [ ] Success message shows after update

#### Template Delete
- [ ] Confirmation dialog appears
- [ ] Template deleted successfully
- [ ] Affected documents count shown
- [ ] Template removed from list after deletion

#### Error Scenarios
- [ ] 401 - Redirects to login
- [ ] 403 - Shows permission error
- [ ] 404 - Shows not found error
- [ ] 400 - Shows validation error with details
- [ ] Network error - Shows connection error

### API Integration Testing

```bash
# Test list templates
curl -X GET 'http://localhost:5530/api/admin/templates?page=0&limit=10' \
  -H 'Authorization: Bearer YOUR_TOKEN'

# Test create from template
curl -X POST 'http://localhost:5530/api/admin/documents/from-template/TEMPLATE_ID' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "Test Document",
    "signingSteps": [...]
  }'

# Test update template
curl -X PUT 'http://localhost:5530/api/admin/templates/TEMPLATE_ID' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "Updated Template"
  }'

# Test delete template
curl -X DELETE 'http://localhost:5530/api/admin/templates/TEMPLATE_ID' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

---

## Appendix

### API Base URL

```typescript
// Development
const API_BASE_URL = 'http://localhost:5530';

// Production
const API_BASE_URL = 'https://api.rsign.com';
```

### Swagger Documentation

Access interactive API documentation at:
```
http://localhost:5530/swagger-ui
```

All template endpoints are under the **"Admin - Templates"** tag.

### Support

For backend API issues, contact the backend team or file an issue in the repository.

For frontend integration questions, refer to:
- [Template Feature Documentation](./TEMPLATE_FEATURE.md)
- [Document Detail API](./api/document-detail.md)
- [Multi-Signature Workflow](./MULTI_SIGNATURE_WORKFLOW.md)

---

**Document Version**: 1.0
**Last Updated**: 2024-12-30
**Maintained By**: RSign Backend Team
