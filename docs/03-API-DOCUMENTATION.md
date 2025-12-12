# RSign V2 - API Documentation

**Version:** 2.1
**Last Updated:** 2024-12-12
**Status:** Integrated with Backend Implementation

---

## Table of Contents

1. [Overview](#1-overview)
2. [Authentication](#2-authentication)
3. [Admin - User Management](#3-admin---user-management)
4. [Admin - File Upload](#4-admin---file-upload)
5. [Admin - Signer Groups](#5-admin---signer-groups)
6. [Admin - Document Management](#6-admin---document-management)
7. [User - Signing Workflow](#7-user---signing-workflow)
8. [Webhooks](#8-webhooks)
9. [Error Handling](#9-error-handling)

---

## 1. Overview

### 1.1 Base URL

```
Development: http://localhost:5531/api
Production: https://api.rsign.com/api
```

### 1.2 Request Format

All requests must include:

```http
Content-Type: application/json
Authorization: Bearer {token}
```

### 1.3 Response Format

**Standard Response:**
APIs return direct JSON objects representing the resource or operation result.

**Pagination Response (`PageDto`):**
List endpoints typically use this format:

```json
{
  "items": [], // Array of resources
  "page": 0, // Current page (0-indexed)
  "limit": 10, // Items per page
  "total": 100, // Total items in database
  "totalPages": 10, // Total pages
  "hasNextPage": true,
  "hasPreviousPage": false
}
```

---

## 2. Authentication

### 2.1 Login

```http
POST /auth/login
```

**Request:**

```json
{
  "email": "admin@company.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-123",
    "email": "admin@company.com",
    "role": "ADMIN"
  }
}
```

### 2.2 Register

```http
POST /auth/register
```

**Request:**

```json
{
  "email": "user@company.com",
  "password": "password123",
  "fullName": "Jane Smith"
}
```

**Response:**

```json
{
  "id": "new-user-uuid",
  "email": "user@company.com",
  "role": "USER"
}
```

### 2.3 Login with HUST

```http
POST /auth/login-hust
```

**Request:**

```json
{
  "email": "student@hust.edu.vn",
  "password": "hust_password"
}
```

**Response:** Same as 2.1 Login.

---

## 3. Admin - User Management

Base Path: `/admin`

### 3.1 List Users

```http
GET /admin/users?page=0&limit=10&email=example&status=ACTIVE&role=USER
```

**Query Parameters:**

- `page`: Page number (default: 0)
- `limit`: Items per page (default: 10)
- `email`: Search by email (partial match)
- `fullName`: Search by name (partial match)
- `status`: Filter by status (`ACTIVE`, `INACTIVE`)
- `role`: Filter by role (`ADMIN`, `USER`)

**Response:** `PageDto` containing user objects.

```json
{
  "items": [
    {
      "id": "user-uuid",
      "email": "user@example.com",
      "fullName": "User Name",
      "role": "USER",
      "status": "ACTIVE",
      "createdAt": "2024-12-01T00:00:00Z",
      "authProvider": "LOCAL"
    }
  ],
  "page": 0,
  "limit": 10,
  "total": 1,
  "totalPages": 1,
  "hasNextPage": false,
  "hasPreviousPage": false
}
```

---

## 4. Admin - File Upload

Base Path: `/admin`

### 4.1 Get Presigned URL

```http
POST /admin/documents/upload-url
```

**Request:**

```json
{
  "fileName": "contract.pdf",
  "purpose": "DOCUMENT" // or "TEMPLATE"
}
```

**Response:**

```json
{
  "presignedUrl": "https://minio.../contract.pdf?signature...",
  "fileUrl": "https://minio.../contract.pdf",
  "objectName": "documents/user-id/timestamp_contract.pdf",
  "expiresIn": 86400
}
```

---

## 5. Admin - Signer Groups

Base Path: `/admin/signer-groups`

### 5.1 Create Signer Group

```http
POST /admin/signer-groups
```

**Request:**

```json
{
  "name": "Engineering Team",
  "description": "All engineering members",
  "userIds": ["user-1", "user-2"] // Optional initial members
}
```

**Response:**

```json
{
  "id": "group-uuid",
  "name": "Engineering Team",
  "isActive": true,
  "createdAt": "..."
}
```

### 5.2 List Signer Groups

```http
GET /admin/signer-groups?page=0&limit=10
```

**Response:** `PageDto` containing group objects.

```json
{
  "items": [
    {
      "id": "group-uuid",
      "name": "Engineering Team",
      "description": "...",
      "memberCount": 5,
      "members": [
         { "id": "member-id", "user": { "id": "user-id", "email": "..." } }
      ]
    }
  ],
  "page": 0,
  ...
}
```

### 5.3 Get Group Details

```http
GET /admin/signer-groups/:groupId
```

### 5.4 Add Members

```http
POST /admin/signer-groups/:groupId/members
```

**Request:**

```json
{
  "userIds": ["user-3", "user-4"]
}
```

### 5.5 Remove Member

```http
DELETE /admin/signer-groups/:groupId/members/:userId
```

### 5.6 Deactivate Group

```http
DELETE /admin/signer-groups/:groupId
```

---

## 6. Admin - Document Management

Base Path: `/admin`

### 6.1 Create Documents

```http
POST /admin/documents
```

**Request (Individual or Shared):**

```json
{
  "title": "Contract",
  "fileUrl": "https://minio.../file.pdf",
  "deadline": "2024-12-31T23:59:59Z",
  "signingMode": "INDIVIDUAL", // or "SHARED"
  "signingFlow": "PARALLEL", // or "SEQUENTIAL"
  "signatureZones": [
    {
      "pageNumber": 1,
      "x": 100,
      "y": 100,
      "width": 200,
      "height": 50,
      "label": "Sign Here"
    }
  ],
  "signingSteps": [
    { "stepOrder": 1, "signers": [{ "userId": "user-1", "zoneIndex": 0 }] }
  ],
  "recipients": {
    "userIds": ["user-1"],
    "signerGroupId": "optional-group-id"
  },
  "saveAsTemplate": false
}
```

**Response (Individual):**

```json
{
  "success": true,
  "batchId": "batch-uuid",
  "documentCount": 1,
  "documents": [{ "id": "doc-uuid", "title": "Contract" }]
}
```

**Response (Shared):**

```json
{
  "success": true,
  "document": { "id": "doc-uuid", "title": "Contract", "status": "DRAFT" }
}
```

### 6.2 Quick Create (Individual)

```http
POST /admin/documents/individual
```

**Request:** Simplified body (title, fileUrl, signatureZones, recipients, deadline).

### 6.3 List Documents

```http
GET /admin/documents?page=0&limit=10&status=PENDING
```

**Response:** `PageDto` containing document objects.

### 6.4 Get Document Progress

```http
GET /admin/documents/:documentId/progress
```

**Response:**

```json
{
  "id": "doc-uuid",
  "status": "IN_PROGRESS",
  "currentStep": 1,
  "totalSteps": 2,
  "steps": [
    {
       "stepOrder": 1,
       "status": "COMPLETED",
       "signers": [{ "id": "signer-id", "status": "SIGNED", "user": {...} }]
    }
  ]
}
```

### 6.5 Send Document

```http
POST /admin/documents/:documentId/send
```

**Response:** `{ "success": true }`

### 6.6 Get Batch Documents

```http
GET /admin/documents/batch/:batchId
```

---

## 7. User - Signing Workflow

Base Path: `/documents`

### 7.1 List Pending Documents

```http
GET /documents/pending?page=0&limit=10
```

**Response:** `PageDto` containing signer items.

```json
{
  "items": [
    {
      "documentSignerId": "signer-uuid",
      "status": "PENDING",
      "document": {
        "id": "doc-uuid",
        "title": "Contract",
        "deadline": "...",
        "createdBy": "Admin Name"
      }
    }
  ],
  ...
}
```

### 7.2 Get Document Details for Signing

```http
GET /documents/:documentSignerId/details
```

**Response:** Includes document info and assigned signature zone.

```json
{
  "id": "signer-uuid",
  "status": "PENDING",
  "document": { "id": "...", "originalFileUrl": "..." },
  "signatureZone": { "x": 100, "y": 100, ... }
}
```

### 7.3 Checkout (Create Session)

```http
POST /documents/:documentSignerId/checkout
```

**Response:**

```json
{
  "sessionId": "session-uuid",
  "expiresIn": 600
}
```

### 7.4 Submit Signature

```http
POST /documents/sign
```

**Request:**

```json
{
  "sessionId": "session-uuid",
  "signatureData": {
    "strokes": [...],
    "color": "#000000",
    "width": 2
  }
}
```

**Response:** `{ "success": true }`

### 7.5 Decline Document

```http
POST /documents/:documentSignerId/decline
```

**Request:** `{ "reason": "Incorrect details" }`

### 7.6 Signing History

```http
GET /documents/history?page=0&limit=10
```

**Response:** `PageDto` (Currently empty implementation).

## 8. Error Handling

**Error Response Format:**

```json
{
  "code": "ERROR_CODE",
  "message": "Human readable message"
}
```

Common Codes: `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `BAD_REQUEST`, `VALIDATION_ERROR`.
