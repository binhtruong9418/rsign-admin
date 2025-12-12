# Document Detail API Documentation

## Get Document Details

Retrieves comprehensive information about a specific document including all related data such as signers, signature zones, and signing workflow steps.

### Endpoint

```
GET /admin/documents/{documentId}
```

### Authentication

- **Required**: Yes
- **Role**: Admin
- **Header**: `Authorization: Bearer <jwt-token>`

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `documentId` | string (UUID) | Yes | Unique identifier of the document |

### Response

**Status Code**: `200 OK`

**Content-Type**: `application/json`

### Response Schema

```json
{
  "id": "string (UUID)",
  "title": "string",
  "originalFileUrl": "string (URL)",
  "signedFileUrl": "string (URL) | null",
  "contentHash": "string",
  "status": "DocumentStatus",
  "signingMode": "SigningMode", 
  "signingFlow": "SigningFlow",
  "currentStep": "number",
  "totalSteps": "number",
  "deadline": "string (ISO 8601) | null",
  "completedAt": "string (ISO 8601) | null",
  "batchId": "string (UUID) | null",
  "isTemplate": "boolean",
  "templateName": "string | null",
  "createdAt": "string (ISO 8601)",
  "updatedAt": "string (ISO 8601)",
  "createdBy": {
    "id": "string (UUID)",
    "fullName": "string",
    "email": "string"
  },
  "assignedUser": {
    "id": "string (UUID)",
    "fullName": "string", 
    "email": "string"
  } | null,
  "signatureZones": [
    {
      "id": "string (UUID)",
      "pageNumber": "number",
      "x": "number (float)",
      "y": "number (float)", 
      "width": "number (float)",
      "height": "number (float)",
      "label": "string | null",
      "assignedTo": {
        "id": "string (UUID)",
        "user": {
          "id": "string (UUID)",
          "fullName": "string",
          "email": "string"
        },
        "status": "DocumentSignerStatus",
        "signedAt": "string (ISO 8601) | null"
      } | null
    }
  ],
  "signingSteps": [
    {
      "id": "string (UUID)",
      "stepOrder": "number", 
      "status": "SigningStepStatus",
      "totalSigners": "number",
      "completedSigners": "number",
      "signers": [
        {
          "id": "string (UUID)",
          "user": {
            "id": "string (UUID)",
            "fullName": "string",
            "email": "string"
          },
          "status": "DocumentSignerStatus",
          "signedAt": "string (ISO 8601) | null"
        }
      ]
    }
  ]
}
```

### Field Descriptions

#### Document Core Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique identifier for the document |
| `title` | string | Document title/name |
| `originalFileUrl` | URL | URL to the original unsigned document file |
| `signedFileUrl` | URL \| null | URL to the signed document file (null if not completed) |
| `contentHash` | string | SHA-256 hash of the document content for integrity verification |
| `status` | DocumentStatus | Current status of the document |
| `signingMode` | SigningMode | How the document is distributed to signers |
| `signingFlow` | SigningFlow | Whether signers can sign in parallel or must follow sequence |
| `currentStep` | number | Current active step in the signing workflow (1-based) |
| `totalSteps` | number | Total number of steps in the signing workflow |
| `deadline` | ISO 8601 \| null | Optional deadline for document completion |
| `completedAt` | ISO 8601 \| null | Timestamp when document was fully signed (null if pending) |
| `batchId` | UUID \| null | Groups related individual documents together |
| `isTemplate` | boolean | Whether this document is a reusable template |
| `templateName` | string \| null | Name of the template if `isTemplate` is true |
| `createdAt` | ISO 8601 | Document creation timestamp |
| `updatedAt` | ISO 8601 | Last modification timestamp |

#### User Objects

User objects contain basic information about users in the system:

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | User's unique identifier |
| `fullName` | string | User's display name |
| `email` | string | User's email address |

#### CreatedBy Object

Information about the user who created the document:

```json
{
  "id": "uuid",
  "fullName": "John Doe",
  "email": "john.doe@company.com"
}
```

#### AssignedUser Object

For **INDIVIDUAL** signing mode documents, this indicates which specific user this document copy is assigned to. **null** for **SHARED** documents.

```json
{
  "id": "uuid", 
  "fullName": "Jane Smith",
  "email": "jane.smith@company.com"
} | null
```

#### Signature Zones Array

Defines clickable areas on the document where signatures can be placed:

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique identifier for the signature zone |
| `pageNumber` | number | PDF page number (1-based) where zone is located |
| `x` | float | X coordinate of zone's top-left corner (in PDF units) |
| `y` | float | Y coordinate of zone's top-left corner (in PDF units) |
| `width` | float | Width of the signature zone (in PDF units) |
| `height` | float | Height of the signature zone (in PDF units) |
| `label` | string \| null | Optional descriptive label for the zone |
| `assignedTo` | DocumentSigner \| null | Which signer is assigned to this zone (null if unassigned) |

**Zone Assignment Object:**
```json
{
  "id": "signer-uuid",
  "user": {
    "id": "user-uuid", 
    "fullName": "Signer Name",
    "email": "signer@company.com"
  },
  "status": "PENDING|SIGNED|DECLINED",
  "signedAt": "2025-12-12T10:30:00Z | null"
}
```

#### Signing Steps Array

Represents the workflow steps for document signing:

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique identifier for the signing step |
| `stepOrder` | number | Order of this step in the workflow (1-based) |
| `status` | SigningStepStatus | Current status of this step |
| `totalSigners` | number | Total number of signers in this step |
| `completedSigners` | number | Number of signers who have completed signing |
| `signers` | DocumentSigner[] | Array of signers assigned to this step |

**Signer Object:**
```json
{
  "id": "signer-uuid",
  "user": {
    "id": "user-uuid",
    "fullName": "Signer Name", 
    "email": "signer@company.com"
  },
  "status": "WAITING|PENDING|SIGNED|DECLINED",
  "signedAt": "2025-12-12T10:30:00Z | null"
}
```

### Enum Values

#### DocumentStatus
- `DRAFT` - Document is being prepared
- `PENDING` - Document is ready for signing but not yet sent
- `IN_PROGRESS` - Document has been sent and signing is in progress  
- `COMPLETED` - All required signatures have been collected
- `CANCELLED` - Document signing process has been cancelled

#### SigningMode
- `INDIVIDUAL` - Each recipient gets their own copy of the document
- `SHARED` - All recipients sign the same document instance

#### SigningFlow  
- `PARALLEL` - All signers can sign simultaneously
- `SEQUENTIAL` - Signers must sign in a specific order (step by step)

#### SigningStepStatus
- `WAITING` - Step is waiting for previous step to complete
- `IN_PROGRESS` - Step is currently active and accepting signatures
- `COMPLETED` - All signers in this step have completed signing

#### DocumentSignerStatus
- `WAITING` - Signer is waiting for their turn (sequential flow)
- `PENDING` - Signer has been notified and can now sign
- `SIGNED` - Signer has successfully signed the document
- `DECLINED` - Signer has declined to sign the document

### Example Response

#### Individual Document Example

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Employment Contract - John Doe",
  "originalFileUrl": "https://s3.example.com/documents/contract.pdf",
  "signedFileUrl": null,
  "contentHash": "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456",
  "status": "IN_PROGRESS", 
  "signingMode": "INDIVIDUAL",
  "signingFlow": "PARALLEL",
  "currentStep": 1,
  "totalSteps": 1,
  "deadline": "2025-12-20T23:59:59Z",
  "completedAt": null,
  "batchId": "987fcdeb-51a2-43d7-8f9e-123456789abc",
  "isTemplate": false,
  "templateName": null,
  "createdAt": "2025-12-12T08:30:00Z",
  "updatedAt": "2025-12-12T09:15:00Z",
  "createdBy": {
    "id": "admin-uuid",
    "fullName": "HR Administrator", 
    "email": "hr@company.com"
  },
  "assignedUser": {
    "id": "employee-uuid",
    "fullName": "John Doe",
    "email": "john.doe@company.com"  
  },
  "signatureZones": [
    {
      "id": "zone-uuid-1",
      "pageNumber": 1,
      "x": 100.5,
      "y": 200.0,
      "width": 150.0, 
      "height": 50.0,
      "label": "Employee Signature",
      "assignedTo": {
        "id": "signer-uuid-1",
        "user": {
          "id": "employee-uuid",
          "fullName": "John Doe",
          "email": "john.doe@company.com"
        },
        "status": "PENDING",
        "signedAt": null
      }
    },
    {
      "id": "zone-uuid-2", 
      "pageNumber": 1,
      "x": 400.0,
      "y": 200.0,
      "width": 150.0,
      "height": 50.0,
      "label": "HR Manager Signature",
      "assignedTo": {
        "id": "signer-uuid-2",
        "user": {
          "id": "hr-manager-uuid",
          "fullName": "Jane Smith",
          "email": "jane.smith@company.com"
        },
        "status": "SIGNED", 
        "signedAt": "2025-12-12T09:30:00Z"
      }
    }
  ],
  "signingSteps": [
    {
      "id": "step-uuid-1",
      "stepOrder": 1,
      "status": "IN_PROGRESS",
      "totalSigners": 2,
      "completedSigners": 1,
      "signers": [
        {
          "id": "signer-uuid-1",
          "user": {
            "id": "employee-uuid", 
            "fullName": "John Doe",
            "email": "john.doe@company.com"
          },
          "status": "PENDING",
          "signedAt": null
        },
        {
          "id": "signer-uuid-2",
          "user": {
            "id": "hr-manager-uuid",
            "fullName": "Jane Smith", 
            "email": "jane.smith@company.com"
          },
          "status": "SIGNED",
          "signedAt": "2025-12-12T09:30:00Z"
        }
      ]
    }
  ]
}
```

#### Shared Document Example (Sequential Flow)

```json
{
  "id": "456e7890-12ab-34cd-56ef-789012345678",
  "title": "Board Resolution - Q4 Budget Approval",
  "originalFileUrl": "https://s3.example.com/documents/resolution.pdf",
  "signedFileUrl": null,
  "contentHash": "f1e2d3c4b5a6789012345678901234567890fedcba1234567890fedcba123456",
  "status": "IN_PROGRESS",
  "signingMode": "SHARED", 
  "signingFlow": "SEQUENTIAL",
  "currentStep": 2,
  "totalSteps": 3,
  "deadline": "2025-12-15T17:00:00Z",
  "completedAt": null,
  "batchId": null,
  "isTemplate": false,
  "templateName": null,
  "createdAt": "2025-12-10T14:00:00Z",
  "updatedAt": "2025-12-12T10:30:00Z",
  "createdBy": {
    "id": "ceo-uuid",
    "fullName": "CEO", 
    "email": "ceo@company.com"
  },
  "assignedUser": null,
  "signatureZones": [
    {
      "id": "zone-uuid-1",
      "pageNumber": 2,
      "x": 100.0,
      "y": 650.0,
      "width": 140.0,
      "height": 45.0,
      "label": "CFO Signature",
      "assignedTo": {
        "id": "signer-uuid-1", 
        "user": {
          "id": "cfo-uuid",
          "fullName": "Chief Financial Officer",
          "email": "cfo@company.com"
        },
        "status": "SIGNED",
        "signedAt": "2025-12-11T16:45:00Z"
      }
    },
    {
      "id": "zone-uuid-2",
      "pageNumber": 2, 
      "x": 300.0,
      "y": 650.0,
      "width": 140.0,
      "height": 45.0,
      "label": "COO Signature",
      "assignedTo": {
        "id": "signer-uuid-2",
        "user": {
          "id": "coo-uuid", 
          "fullName": "Chief Operating Officer",
          "email": "coo@company.com"
        },
        "status": "PENDING",
        "signedAt": null
      }
    },
    {
      "id": "zone-uuid-3",
      "pageNumber": 2,
      "x": 500.0, 
      "y": 650.0,
      "width": 140.0,
      "height": 45.0,
      "label": "CEO Signature",
      "assignedTo": {
        "id": "signer-uuid-3",
        "user": {
          "id": "ceo-uuid",
          "fullName": "CEO",
          "email": "ceo@company.com"
        },
        "status": "WAITING",
        "signedAt": null
      }
    }
  ],
  "signingSteps": [
    {
      "id": "step-uuid-1",
      "stepOrder": 1, 
      "status": "COMPLETED",
      "totalSigners": 1,
      "completedSigners": 1,
      "signers": [
        {
          "id": "signer-uuid-1",
          "user": {
            "id": "cfo-uuid",
            "fullName": "Chief Financial Officer",
            "email": "cfo@company.com"
          },
          "status": "SIGNED",
          "signedAt": "2025-12-11T16:45:00Z"
        }
      ]
    },
    {
      "id": "step-uuid-2",
      "stepOrder": 2,
      "status": "IN_PROGRESS", 
      "totalSigners": 1,
      "completedSigners": 0,
      "signers": [
        {
          "id": "signer-uuid-2", 
          "user": {
            "id": "coo-uuid",
            "fullName": "Chief Operating Officer",
            "email": "coo@company.com"
          },
          "status": "PENDING",
          "signedAt": null
        }
      ]
    },
    {
      "id": "step-uuid-3",
      "stepOrder": 3,
      "status": "WAITING",
      "totalSigners": 1, 
      "completedSigners": 0,
      "signers": [
        {
          "id": "signer-uuid-3",
          "user": {
            "id": "ceo-uuid",
            "fullName": "CEO", 
            "email": "ceo@company.com"
          },
          "status": "WAITING",
          "signedAt": null
        }
      ]
    }
  ]
}
```

### Error Responses

#### 401 Unauthorized
```json
{
  "success": false,
  "message": "You must be logged in to access this resource",
  "statusCode": "401"
}
```

#### 403 Forbidden  
```json
{
  "success": false,
  "message": "You do not have permission to access this resource",
  "statusCode": "403"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "message": "Document not found", 
  "statusCode": "404"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error",
  "statusCode": "500"
}
```

### Usage Notes

1. **Individual vs Shared Documents**:
   - **Individual**: `assignedUser` is populated, `batchId` groups related documents
   - **Shared**: `assignedUser` is null, all signers work on the same document

2. **Signing Flow Behavior**:
   - **Parallel**: All signers in all steps can sign simultaneously
   - **Sequential**: Only signers in the current step can sign, others must wait

3. **Signature Zone Assignment**:
   - Each zone can be assigned to exactly one signer
   - Zones without assignment have `assignedTo: null`
   - Zone coordinates are in PDF coordinate system

4. **Step Progression**:
   - `currentStep` indicates which step is currently active
   - In sequential flow, only current step signers have `PENDING` status
   - Future step signers have `WAITING` status

5. **Completion Status**:
   - Document is `COMPLETED` when all required signatures are collected
   - `completedAt` timestamp is set when document reaches completion
   - `signedFileUrl` becomes available after completion (if system generates signed copies)

This API provides complete visibility into document status and signing workflow for administrative monitoring and management.