# Template System - Phân Tích Chi Tiết

**Ngày phân tích**: 25/01/2026  
**Nguồn**: `docs/template/PHUONG_AN_TOI_UU_TEMPLATE.md` & `TEMPLATE_SYSTEM_OPTIMIZED.md`

---

## 🎯 Vấn Đề Cốt Lõi

### API cũ (Trước khi tối ưu)
API `createDocumentFromTemplate` yêu cầu `signingSteps` chi tiết cho **CẢ 2 MODES**, dẫn đến:

```json
// INDIVIDUAL mode - Phải gán user cho TỪNG zone (REDUNDANT!)
{
  "templateId": "...",
  "signingSteps": [
    {
      "stepOrder": 1,
      "signers": [
        { "userId": "user-1", "zoneIndex": 0 },
        { "userId": "user-1", "zoneIndex": 1 },  // ❌ Cùng 1 user!
        { "userId": "user-1", "zoneIndex": 2 }   // ❌ Cùng 1 user!
      ]
    }
  ],
  "recipients": { "userIds": ["user-1", "user-2", "user-3"] }
}
```

**Vấn đề:**
- ❌ INDIVIDUAL mode: Phải lặp lại userId cho mỗi zone (redundant)
- ❌ Payload quá lớn khi có nhiều recipients (50 users × 3 zones = 150 signer objects!)
- ❌ Frontend phải biết template structure để build request
- ❌ Dễ sai khi gán user
- ❌ Nhiều validation errors

---

## ✅ Giải Pháp Tối Ưu

### Phân Biệt Rõ 2 Use Cases

#### **INDIVIDUAL Mode** (Đơn giản)
- Mỗi recipient = 1 document riêng
- User đó ký **TẤT CẢ** zones trong document của họ
- **Chỉ cần**: `recipients` (userIds hoặc signerGroupId)
- **Không cần**: `signingSteps` (backend tự động generate)

#### **SHARED Mode** (Phức tạp)
- 1 document, nhiều người ký
- Mỗi zone có thể do user khác nhau ký
- **Cần**: `signingSteps` với user assignments chi tiết
- **Optional**: `recipients` (chỉ để gửi email notification)

---

## 📝 API Mới

### 1. INDIVIDUAL Mode - Simple API

```json
POST /admin/documents/from-template

{
  "templateId": "employment-contract-template",
  "title": "Employment Contract 2024",  // Optional
  "deadline": "2024-12-31T23:59:59Z",
  "recipients": {
    "userIds": ["user-1", "user-2", "user-3"]
    // HOẶC
    // "signerGroupId": "new-employees-group"
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
    // ... 2 more documents
  ]
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

```json
POST /admin/documents/from-template

{
  "templateId": "board-resolution-template",
  "title": "Board Meeting Minutes - Jan 2024",
  "deadline": "2024-12-31T23:59:59Z",
  "signingSteps": [
    {
      "stepOrder": 1,
      "signers": [
        { "userId": "ceo-id", "zoneIndex": 0 },
        { "userId": "cfo-id", "zoneIndex": 1 }
      ]
    },
    {
      "stepOrder": 2,
      "signers": [
        { "userId": "secretary-id", "zoneIndex": 2 }
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

## 🔍 Validation Rules

### INDIVIDUAL Mode

✅ **Required:**
- `recipients.userIds` (array) HOẶC `recipients.signerGroupId` (string)

❌ **Not Required:**
- `signingSteps` (sẽ bị ignore nếu có)

**Errors:**
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
```

---

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

**Errors:**
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

## 📊 So Sánh Payload Size

### Scenario: 50 employees, template có 3 zones

#### Old API (INDIVIDUAL)
```json
{
  "templateId": "...",
  "signingSteps": [
    {
      "stepOrder": 1,
      "signers": [
        { "userId": "emp-1", "zoneIndex": 0 },
        { "userId": "emp-1", "zoneIndex": 1 },
        { "userId": "emp-1", "zoneIndex": 2 },
        // ... repeat for 50 employees × 3 zones = 150 objects
      ]
    }
  ],
  "recipients": { "userIds": ["emp-1", ..., "emp-50"] }
}
```
**Size:** ~5,000 bytes (150 signer objects)

#### New API (INDIVIDUAL)
```json
{
  "templateId": "...",
  "recipients": {
    "signerGroupId": "new-employees-jan-2024"
  }
}
```
**Size:** ~100 bytes

**Reduction:** **98%** 🎉

---

## 🎯 Use Cases

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

## 🏗️ Implementation Architecture

### Service Structure

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

## 🚀 Benefits

### 1. Giảm Complexity
- ✅ INDIVIDUAL mode: Giảm 98% payload size
- ✅ Frontend không cần biết template structure
- ✅ Ít validation errors

### 2. Better UX
- ✅ API rõ ràng: Simple cho INDIVIDUAL, Complex cho SHARED
- ✅ Ít bước hơn để tạo INDIVIDUAL documents
- ✅ Dễ debug hơn

### 3. Maintainability
- ✅ Code tách biệt rõ ràng (DocumentFromTemplateService)
- ✅ Dễ test (2 flows độc lập)
- ✅ Dễ extend (thêm modes mới)

---

## 📈 Developer Experience Comparison

| Aspect | Old API | New API |
|--------|---------|---------|
| **INDIVIDUAL payload** | ~5KB | ~100 bytes |
| **Frontend complexity** | Must know template structure | Just select recipients |
| **Error prone** | High (manual zone assignment) | Low (auto-generated) |
| **Validation errors** | Many (zone mismatch, etc) | Minimal |
| **Code clarity** | Confusing (same for both modes) | Clear (different by mode) |

---

## 🎓 Best Practices

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

## 📝 Frontend Implementation Notes

### TemplateUse.tsx - Current Implementation

File này hiện đang implement logic để tạo document from template. Cần cập nhật theo API mới:

#### INDIVIDUAL Mode (Simplified)
```typescript
// ✅ NEW - Simple request
const request = {
  templateId: templateId!,
  title: documentTitle,
  deadline: deadline,
  recipients: {
    userIds: recipientIds,
    // OR
    signerGroupId: selectedGroupId
  },
  sendImmediately: sendImmediately
};

const result = await templatesAPI.createDocumentFromTemplate(request);

// Navigate based on response
if (result.batchId) {
  navigate(`/admin/document-batches`);
}
```

#### SHARED Mode (Unchanged)
```typescript
// ✅ SHARED - Detailed request (giữ nguyên)
const request = {
  templateId: templateId!,
  title: documentTitle,
  deadline: deadline,
  signingSteps: template.signingSteps?.map((step, stepIndex) => ({
    stepOrder: step.stepNumber,
    signers: step.signers.map((signer) => {
      const globalIndex = template.signers?.findIndex(
        s => s.role === signer.role
      ) || 0;
      return {
        userId: signerAssignments[globalIndex],
        zoneIndex: signer.zoneIndex
      };
    })
  })),
  sendImmediately: sendImmediately
};

const result = await templatesAPI.createDocumentFromTemplate(request);

// Navigate to document detail
if (result.document?.id) {
  navigate(`/admin/documents/${result.document.id}`);
}
```

---

## 📊 Summary Table

| Feature | INDIVIDUAL Mode | SHARED Mode |
|---------|----------------|-------------|
| **API Complexity** | ⭐ Simple | ⭐⭐⭐ Complex |
| **Required Fields** | `recipients` | `signingSteps` |
| **Documents Created** | N (1 per recipient) | 1 |
| **User Assignment** | Auto (all zones) | Manual (per zone) |
| **Use Case** | Bulk sending | Multi-party signing |
| **Validation** | Minimal | Strict (match template) |
| **Payload Size** | ~100 bytes | ~500-1000 bytes |
| **Frontend Logic** | Simple (select users) | Complex (map roles to users) |

---

## ✅ Key Takeaways

1. **INDIVIDUAL mode đã được tối ưu hoàn toàn**:
   - Không cần `signingSteps` nữa
   - Chỉ cần `recipients` (userIds hoặc signerGroupId)
   - Backend tự động generate signingSteps

2. **SHARED mode giữ nguyên**:
   - Vẫn cần `signingSteps` chi tiết
   - Validation strict để đảm bảo match template structure

3. **API rõ ràng hơn**:
   - INDIVIDUAL = Simple (chỉ select users)
   - SHARED = Complex (map roles to users + assign zones)

4. **Performance improvement**:
   - Giảm 98% payload size cho INDIVIDUAL mode
   - Giảm network latency
   - Giảm validation errors

---

**Tài liệu này tóm tắt quy trình tối ưu cho Template System**  
**Nguồn**: `docs/template/` folder  
**Cập nhật lần cuối**: 25/01/2026
