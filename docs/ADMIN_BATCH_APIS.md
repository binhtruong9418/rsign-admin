# Admin Document Batch Management APIs

## Overview

Đã thêm các API mới cho admin để quản lý document batches và tăng cường khả năng filter documents. Các API này giúp admin theo dõi và quản lý hiệu quả các batch documents, đặc biệt hữu ích cho bulk operations.

## Implementation Status

✅ **IMPLEMENTED** - All APIs have been integrated into the frontend codebase:

-   Types added to `/src/types/index.ts`
-   API functions added to `/src/lib/api.ts`
-   New DocumentBatches page created at `/src/pages/admin/DocumentBatches.tsx`
-   Navigation updated in AdminLayout
-   Dashboard enhanced with batch statistics
-   Enhanced DocumentList with advanced filtering

## New APIs Added

### 1. 🗂️ Get Document Batches List

```
GET /api/admin/document-batches
```

**Purpose**: Lấy danh sách các document batch với thống kê tổng quan

**Query Parameters**:

-   `page` (optional): Số trang (default: 0)
-   `limit` (optional): Số items per page (default: 10)
-   `status` (optional): Filter theo status (COMPLETED, PENDING, IN_PROGRESS)
-   `search` (optional): Tìm kiếm theo title hoặc creator name
-   `dateFrom` (optional): Filter từ ngày (YYYY-MM-DD)
-   `dateTo` (optional): Filter đến ngày (YYYY-MM-DD)

**Response**:

```json
{
    "items": [
        {
            "batchId": "batch_123",
            "documentCount": 25,
            "completedCount": 20,
            "pendingCount": 3,
            "inProgressCount": 2,
            "createdAt": "2024-12-18T10:00:00Z",
            "deadline": "2024-12-25T23:59:59Z",
            "createdBy": {
                "id": "user_123",
                "fullName": "Admin User",
                "email": "admin@example.com"
            },
            "completionRate": 80,
            "status": "IN_PROGRESS"
        }
    ],
    "page": 0,
    "limit": 10,
    "total": 50,
    "totalPages": 5
}
```

### 2. 📋 Enhanced Documents List

```
GET /api/admin/documents
```

**Purpose**: Lấy danh sách documents với nhiều filter options

**Enhanced Query Parameters**:

-   `page`, `limit`: Pagination
-   `status`: Document status
-   `signingMode`: MULTI_SIGNER | INDIVIDUAL
-   `signingFlow`: SEQUENTIAL | PARALLEL
-   `batchId`: Filter by specific batch
-   `createdById`: Filter by creator
-   `assignedUserId`: Filter by assigned user
-   `search`: Search in title, creator name/email
-   `dateFrom`, `dateTo`: Date range filter
-   `hasDeadline`: boolean - documents with/without deadline
-   `isTemplate`: boolean - filter templates

**Response**: Enhanced document objects với thêm thông tin:

```json
{
    "items": [
        {
            "id": "doc_123",
            "title": "Contract ABC",
            "status": "IN_PROGRESS",
            "signingMode": "MULTI_SIGNER",
            "signingFlow": "SEQUENTIAL",
            "currentStep": 2,
            "totalSteps": 3,
            "batchId": "batch_123",
            "totalSigners": 5,
            "completedSigners": 3,
            "createdBy": { "id": "...", "fullName": "...", "email": "..." },
            "assignedUser": { "id": "...", "fullName": "...", "email": "..." }
        }
    ]
}
```

### 3. 📤 Send Document Batch

```
POST /api/admin/document-batches/{batchId}/send
```

**Purpose**: Gửi tất cả documents trong batch để ký (bulk operation)

**Path Parameters**:

-   `batchId`: ID của batch cần send

**Response**:

```json
{
    "success": true,
    "sentCount": 23,
    "failedCount": 2,
    "results": [
        {
            "documentId": "doc_1",
            "success": true
        },
        {
            "documentId": "doc_2",
            "success": false,
            "error": "Document not in DRAFT status"
        }
    ]
}
```

## Use Cases

### 1. Admin Dashboard - Batch Overview

```javascript
// Lấy tất cả batches với pagination
const batches = await fetch("/api/admin/document-batches?page=0&limit=20");

// Filter batches có completion rate thấp
const incompleteBatches = await fetch(
    "/api/admin/document-batches?status=IN_PROGRESS"
);
```

### 2. Batch Management

```javascript
// Xem chi tiết documents trong batch
const batchDocs = await fetch("/api/admin/documents?batchId=batch_123");

// Gửi toàn bộ batch để ký
const sendResult = await fetch("/api/admin/document-batches/batch_123/send", {
    method: "POST",
});
```

### 3. Advanced Document Search

```javascript
// Tìm documents của user cụ thể trong khoảng thời gian
const userDocs = await fetch(
    "/api/admin/documents?" +
        new URLSearchParams({
            createdById: "user_123",
            dateFrom: "2024-12-01",
            dateTo: "2024-12-31",
            status: "COMPLETED",
        })
);

// Tìm documents có deadline
const urgentDocs = await fetch(
    "/api/admin/documents?hasDeadline=true&status=PENDING"
);
```

## Benefits

1. **Admin Monitoring**: Dễ dàng theo dõi progress của các document batches
2. **Bulk Operations**: Gửi nhiều documents cùng lúc thay vì từng cái một
3. **Advanced Filtering**: Tìm kiếm và filter documents theo nhiều tiêu chí
4. **Performance**: Batch operations giảm workload cho admin
5. **Reporting**: Thống kê chi tiết để đánh giá hiệu quả

## Technical Notes

-   Sử dụng SQL aggregation cho batch statistics để tối ưu performance
-   Batch send operation có error handling riêng cho từng document
-   Enhanced filtering hỗ trợ search text và date range
-   Pagination được implement cho tất cả list APIs
-   Response format consistent với existing APIs
