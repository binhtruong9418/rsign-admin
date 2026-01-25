# Template System - Optimized API Documentation

## Overview

Template system đã được tối ưu để phân biệt rõ ràng 2 use cases:

### **INDIVIDUAL Mode** (Simple)
- Mỗi recipient nhận 1 document riêng
- Tất cả zones trong document đều do 1 user ký
- **Chỉ cần**: `recipients` (userIds hoặc signerGroupId)
- **Không cần**: gán user cho từng zone/step

### **SHARED Mode** (Complex)
- 1 document, nhiều người ký
- Mỗi zone/step có thể do user khác nhau ký
- **Cần**: `signingSteps` với user assignments chi tiết
- **Optional**: `recipients` (chỉ để gửi email notification)

---

## API Examples

### 1. INDIVIDUAL Mode - Simple API

Tạo document cho nhiều người, mỗi người ký tất cả zones trong document của họ.

```http
POST /admin/documents/from-template
Content-Type: application/json
Authorization: Bearer {token}

{
  "templateId": "template-uuid",
  "title": "Employment Contract 2024",  // Optional: override template title
  "deadline": "2024-12-31T23:59:59Z",
  "recipients": {
    "userIds": ["user-1-id", "user-2-id", "user-3-id"]
    // OR
    // "signerGroupId": "group-uuid"
  },
  "sendImmediately": true
}
```

**Response:**
```json
{
  "success": true,
  "batchId": "batch-uuid",
  "documentCount": 3,
  "documents": [
    {
      "id": "doc-1-id",
      "title": "Employment Contract 2024",
      "assignedUser": "user-1-id"
    },
    {
      "id": "doc-2-id",
      "title": "Employment Contract 2024",
      "assignedUser": "user-2-id"
    },
    {
      "id": "doc-3-id",
      "title": "Employment Contract 2024",
      "assignedUser": "user-3-id"
    }
  ],
  "templateUsed": {
    "id": "template-uuid",
    "name": "Employment Contract V2"
  }
}
```

**Luồng xử lý:**
1. Load template structure (zones + steps)
2. Collect recipients từ `userIds` và/hoặc `signerGroupId`
3. **Auto-generate** signingSteps từ template structure
4. Tạo N documents (1 per recipient)
5. Mỗi document: assignedUser ký TẤT CẢ zones

---

### 2. SHARED Mode - Detailed API

Tạo 1 document với nhiều người ký, mỗi người ký zones cụ thể.

```http
POST /admin/documents/from-template
Content-Type: application/json
Authorization: Bearer {token}

{
  "templateId": "template-uuid",
  "title": "Board Meeting Minutes - Jan 2024",
  "deadline": "2024-12-31T23:59:59Z",
  "signingSteps": [
    {
      "stepOrder": 1,
      "signers": [
        {
          "userId": "ceo-id",
          "zoneIndex": 0  // CEO signs zone 0
        },
        {
          "userId": "cfo-id",
          "zoneIndex": 1  // CFO signs zone 1
        }
      ]
    },
    {
      "stepOrder": 2,
      "signers": [
        {
          "userId": "secretary-id",
          "zoneIndex": 2  // Secretary signs zone 2
        }
      ]
    }
  ],
  "recipients": {  // Optional - for email notifications
    "userIds": ["ceo-id", "cfo-id", "secretary-id"]
  },
  "sendImmediately": true
}
```

**Response:**
```json
{
  "success": true,
  "document": {
    "id": "document-uuid",
    "title": "Board Meeting Minutes - Jan 2024",
    "status": "PENDING"
  },
  "templateUsed": {
    "id": "template-uuid",
    "name": "Board Meeting Template"
  }
}
```

**Luồng xử lý:**
1. Load template structure
2. **Validate** signingSteps match template:
   - Số steps phải bằng template
   - Số signers per step phải bằng template `signerCount`
   - Zone indices phải match template `zoneIndices`
3. Tạo 1 document SHARED
4. Gán users vào zones theo `signingSteps`

---

## Validation Rules

### INDIVIDUAL Mode

✅ **Required:**
- `recipients.userIds` (array) HOẶC `recipients.signerGroupId` (string)

❌ **Not Required:**
- `signingSteps` (sẽ bị ignore nếu có)

### SHARED Mode

✅ **Required:**
- `signingSteps` (array) với đầy đủ user assignments

**Validation chi tiết:**
```typescript
// 1. Số steps phải match template
if (data.signingSteps.length !== template.totalSteps) {
    throw Error("Step count mismatch");
}

// 2. Mỗi step phải có đúng số signers
if (step.signers.length !== templateStep.signerCount) {
    throw Error("Signer count mismatch");
}

// 3. Zone indices phải match template
const providedZones = step.signers.map(s => s.zoneIndex).sort();
const templateZones = templateStep.zoneIndices.sort();
if (JSON.stringify(providedZones) !== JSON.stringify(templateZones)) {
    throw Error("Zone indices mismatch");
}
```

---

## Use Case Examples

### Use Case 1: Bulk Employment Contracts (INDIVIDUAL)

**Scenario:** Gửi hợp đồng lao động cho 50 nhân viên mới

**Template:**
- 3 zones: Employee signature, Manager signature, HR signature
- 1 step: Employee ký tất cả 3 zones

**API Call:**
```json
{
  "templateId": "employment-contract-template",
  "recipients": {
    "signerGroupId": "new-employees-jan-2024"  // 50 users
  },
  "sendImmediately": true
}
```

**Result:** 50 documents, mỗi employee nhận 1 document và ký 3 zones

---

### Use Case 2: Board Resolution (SHARED)

**Scenario:** Nghị quyết hội đồng quản trị cần 5 chữ ký

**Template:**
- 5 zones: CEO, CFO, CTO, COO, Board Chair
- 2 steps:
  - Step 1: CEO, CFO, CTO (parallel)
  - Step 2: COO, Board Chair (sequential)

**API Call:**
```json
{
  "templateId": "board-resolution-template",
  "signingSteps": [
    {
      "stepOrder": 1,
      "signers": [
        { "userId": "ceo-id", "zoneIndex": 0 },
        { "userId": "cfo-id", "zoneIndex": 1 },
        { "userId": "cto-id", "zoneIndex": 2 }
      ]
    },
    {
      "stepOrder": 2,
      "signers": [
        { "userId": "coo-id", "zoneIndex": 3 },
        { "userId": "chair-id", "zoneIndex": 4 }
      ]
    }
  ],
  "sendImmediately": true
}
```

**Result:** 1 document, 5 người ký theo thứ tự

---

## Error Responses

### INDIVIDUAL Mode Errors

```json
// Missing recipients
{
  "error": "BadRequestError",
  "message": "INDIVIDUAL mode requires recipients (userIds or signerGroupId)"
}

// No recipients found
{
  "error": "BadRequestError",
  "message": "No recipients specified for individual documents"
}

// Signer group not found
{
  "error": "NotFoundError",
  "message": "Signer group not found"
}
```

### SHARED Mode Errors

```json
// Missing signingSteps
{
  "error": "BadRequestError",
  "message": "SHARED mode requires signingSteps with user assignments for each zone"
}

// Step count mismatch
{
  "error": "BadRequestError",
  "message": "Template requires 2 signing steps, but 1 provided"
}

// Signer count mismatch
{
  "error": "BadRequestError",
  "message": "Step 1 requires 2 signers, but 1 provided"
}

// Zone indices mismatch
{
  "error": "BadRequestError",
  "message": "Step 1 zone indices mismatch. Expected: 0,1, Got: 0"
}
```

---

## Migration Guide

### Old API (Complex for both modes)

```json
// INDIVIDUAL - Phải gán user cho từng zone (redundant!)
{
  "templateId": "...",
  "signingSteps": [
    {
      "stepOrder": 1,
      "signers": [
        { "userId": "user-1", "zoneIndex": 0 },
        { "userId": "user-1", "zoneIndex": 1 },
        { "userId": "user-1", "zoneIndex": 2 }
      ]
    }
  ],
  "recipients": { "userIds": ["user-1"] }
}
```

### New API (Simple for INDIVIDUAL)

```json
// INDIVIDUAL - Chỉ cần recipients!
{
  "templateId": "...",
  "recipients": { "userIds": ["user-1"] }
}
```

**Benefits:**
- ✅ Giảm 90% payload size cho INDIVIDUAL mode
- ✅ Không cần biết template structure khi tạo INDIVIDUAL documents
- ✅ API rõ ràng hơn: INDIVIDUAL = simple, SHARED = complex
- ✅ Ít lỗi validation hơn

---

## Best Practices

### 1. Chọn đúng mode

**INDIVIDUAL khi:**
- Gửi cùng 1 loại document cho nhiều người
- Mỗi người ký độc lập
- VD: Employment contracts, NDAs, Onboarding forms

**SHARED khi:**
- Nhiều người cùng ký 1 document
- Có workflow approval (sequential)
- VD: Board resolutions, Contracts với nhiều bên, Meeting minutes

### 2. Template design

**INDIVIDUAL templates:**
- Zones nên được label rõ ràng (vì 1 user ký nhiều zones)
- VD: "Employee Signature - Page 1", "Employee Initial - Page 3"

**SHARED templates:**
- Zones nên được label theo role
- VD: "CEO Signature", "CFO Approval", "Legal Review"

### 3. Error handling

```typescript
try {
  const result = await createFromTemplate(templateId, data, userId);
  // Success
} catch (error) {
  if (error.message.includes("requires recipients")) {
    // INDIVIDUAL mode - cần recipients
  } else if (error.message.includes("requires signingSteps")) {
    // SHARED mode - cần signingSteps
  } else if (error.message.includes("mismatch")) {
    // Validation error - check template structure
  }
}
```

---

## Implementation Notes

### Service Architecture

```
DocumentFromTemplateService
├── createFromTemplate()
│   ├── Load template
│   └── Route by mode
│       ├── createIndividualFromTemplate()
│       │   ├── Validate recipients
│       │   ├── Auto-generate signingSteps
│       │   └── Create N documents
│       └── createSharedFromTemplate()
│           ├── Validate signingSteps
│           ├── Validate against template
│           └── Create 1 document
```

### Auto-generation Logic (INDIVIDUAL)

```typescript
// Template có:
// - 3 zones: [0, 1, 2]
// - 1 step với zoneIndices: [0, 1, 2]

// Auto-generate cho mỗi recipient:
signingSteps = [
  {
    stepOrder: 1,
    signers: [
      { userId: recipientId, zoneIndex: 0 },
      { userId: recipientId, zoneIndex: 1 },
      { userId: recipientId, zoneIndex: 2 }
    ]
  }
]
```

---

## Summary

| Feature | INDIVIDUAL Mode | SHARED Mode |
|---------|----------------|-------------|
| **API Complexity** | ⭐ Simple | ⭐⭐⭐ Complex |
| **Required Fields** | `recipients` | `signingSteps` |
| **Documents Created** | N (1 per recipient) | 1 |
| **User Assignment** | Auto (all zones) | Manual (per zone) |
| **Use Case** | Bulk sending | Multi-party signing |
| **Validation** | Minimal | Strict (match template) |

**Key Improvement:** INDIVIDUAL mode API giảm từ ~100 lines JSON xuống ~10 lines! 🎉
