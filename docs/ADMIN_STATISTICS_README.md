# 📊 Admin Statistics API - Quick Start Guide

## 🚀 Tổng Quan

API cung cấp thống kê toàn diện cho Admin Dashboard với 2 endpoints chính:

1. **Dashboard Statistics** - Tất cả metrics cần thiết cho trang chủ admin
2. **Time Series Data** - Dữ liệu theo thời gian để vẽ charts

---

## 📁 Files Liên Quan

- **[ADMIN_STATISTICS_API.md](./ADMIN_STATISTICS_API.md)** - Tài liệu API đầy đủ với examples
- **[ADMIN_STATISTICS_TYPES.ts](./ADMIN_STATISTICS_TYPES.ts)** - TypeScript types cho Frontend
- **[src/services/statistics.service.ts](./src/services/statistics.service.ts)** - Service logic
- **[src/controllers/admin-document.controller.ts](./src/controllers/admin-document.controller.ts)** - API endpoints

---

## 🎯 Endpoints

### 1. Dashboard Statistics
```
GET /api/admin/statistics/dashboard
```

**Response bao gồm:**
- ✅ Overview: totalDocuments, totalUsers, totalSignatures, totalTemplates
- ✅ Documents by status: draft, pending, inProgress, completed, cancelled, completionRate
- ✅ Recent activity: last24Hours, last7Days, last30Days
- ✅ Signing progress: awaitingSignature, signedToday, averageSigningTime
- ✅ User stats: active, inactive, suspended, totalAdmins
- ✅ Top 5 most active users
- ✅ Top 5 documents near deadline (trong 3 ngày)
- ✅ Top 5 recent completed documents
- ✅ **Top 5 recent documents (mới thêm)** - với progress tracking

### 2. Time Series Data
```
GET /api/admin/statistics/time-series?days=30
```

**Response:** Array của daily statistics để vẽ charts

---

## 💻 Quick Integration

### React Example

```typescript
import axios from 'axios';
import { DashboardStatistics } from './types/admin-statistics';

const api = axios.create({
  baseURL: 'http://localhost:5531/api',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Fetch dashboard stats
const stats: DashboardStatistics = await api.get('/admin/statistics/dashboard');

// Use the data
console.log(stats.overview.totalDocuments);
console.log(stats.topMetrics.recentDocuments); // New feature!
```

### Vue.js Example

```typescript
import { ref, onMounted } from 'vue';

const stats = ref(null);

const loadStats = async () => {
  const response = await fetch('/api/admin/statistics/dashboard', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  stats.value = await response.json();
};

onMounted(loadStats);
```

---

## 🎨 UI Components Suggestions

### Dashboard Layout

```
┌─────────────────────────────────────────────────────────┐
│  📊 ADMIN DASHBOARD                                     │
├─────────────────────────────────────────────────────────┤
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                  │
│  │ 📄   │ │ 👥   │ │ ✍️    │ │ 📋   │  Overview Cards │
│  └──────┘ └──────┘ └──────┘ └──────┘                  │
│                                                         │
│  ┌──────────────┐ ┌──────────────┐                    │
│  │ Pie Chart    │ │ Line Chart   │  Charts            │
│  │ Status       │ │ Trends       │                    │
│  └──────────────┘ └──────────────┘                    │
│                                                         │
│  ┌───────────────────────────────────────────────┐    │
│  │ 📋 Recent Documents (NEW!)                    │    │
│  │  • Document 1 [Progress: 30%]                 │    │
│  │  • Document 2 [Progress: 75%]                 │    │
│  │  • Document 3 [Status: DRAFT]                 │    │
│  └───────────────────────────────────────────────┘    │
│                                                         │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐        │
│  │Active Users│ │Near Deadline│ │Completed   │        │
│  │Top 5       │ │Top 5        │ │Top 5       │        │
│  └────────────┘ └────────────┘ └────────────┘        │
└─────────────────────────────────────────────────────────┘
```

---

## 🆕 New Feature: Recent Documents

Trong `topMetrics.recentDocuments`, bạn nhận được **5 documents mới nhất** với thông tin:

```typescript
{
  documentId: string;
  title: string;
  status: "DRAFT" | "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  signingMode: "INDIVIDUAL" | "SHARED";
  createdAt: string; // ISO datetime
  createdBy: {
    id: string;
    fullName: string;
    email: string;
  };
  progress?: {  // Chỉ có khi document có signers
    totalSigners: number;
    completedSigners: number;
    completionPercentage: number;  // 0-100
  };
}
```

### Use Cases:

1. **Recent Activity Feed** - Hiển thị documents mới nhất trên dashboard
2. **Progress Tracking** - Show progress bars cho từng document
3. **Quick Actions** - Link nhanh đến document details
4. **Status Indicators** - Color-coded status badges

### Example UI Component (React):

```typescript
function RecentDocuments({ documents }) {
  return (
    <div className="recent-documents">
      <h3>📋 Recent Documents</h3>
      {documents.map(doc => (
        <div key={doc.documentId} className="document-item">
          <div className="doc-header">
            <h4>{doc.title}</h4>
            <StatusBadge status={doc.status} />
          </div>

          <div className="doc-meta">
            <span>Created by: {doc.createdBy.fullName}</span>
            <span>{formatDate(doc.createdAt)}</span>
          </div>

          {doc.progress && (
            <ProgressBar
              value={doc.progress.completionPercentage}
              label={`${doc.progress.completedSigners}/${doc.progress.totalSigners} signed`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## 🎨 Color Scheme

```typescript
const STATUS_COLORS = {
  DRAFT: "#3B82F6",        // 🟦 Blue
  PENDING: "#F59E0B",      // 🟨 Yellow
  IN_PROGRESS: "#F97316",  // 🟧 Orange
  COMPLETED: "#10B981",    // 🟩 Green
  CANCELLED: "#EF4444",    // 🟥 Red
};
```

---

## ⚡ Performance Tips

1. **Cache** dashboard data for 30-60 seconds
2. **Polling**: Refresh every 30-60 seconds for real-time feel
3. **Skeleton Loaders**: Show while loading
4. **Error Retry**: Implement exponential backoff
5. **Pagination**: Recent documents only shows top 5

---

## 🧪 Testing

### Via cURL:
```bash
curl -X GET "http://localhost:5531/api/admin/statistics/dashboard" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Via Swagger UI:
```
http://localhost:5531/swagger-ui
```
Look for **"Admin - Statistics"** section

---

## 📊 Data Flow

```
Frontend Request
    ↓
Admin Auth Middleware (JWT + Role Check)
    ↓
Statistics Service
    ↓
Parallel Database Queries (Promise.all)
    ├─ Overview metrics
    ├─ Document counts
    ├─ Activity metrics
    ├─ User stats
    └─ Top 5 lists (including recent documents)
    ↓
Response (< 500ms)
    ↓
Frontend Rendering
```

---

## 🔐 Security

- **Authentication**: JWT Bearer token required
- **Authorization**: ADMIN role only
- **Rate Limiting**: Consider implementing if needed
- **Data Privacy**: Only admins can see all user data

---

## 📈 Metrics Explained

### Overview
- **Total Documents**: Không tính templates, chỉ documents thực
- **Total Signatures**: Chỉ đếm signatures đã ký (status = SIGNED)
- **Total Templates**: Documents được đánh dấu là template

### Document Stats
- **Completion Rate**: (completed / (total - draft)) * 100

### Signing Progress
- **Average Signing Time**: Thời gian trung bình từ khi tạo đến hoàn thành (giờ)
- **Awaiting Signature**: Tổng số chữ ký có status = PENDING
- **Signed Today**: Số signatures được ký từ 00:00 hôm nay

### Recent Documents (NEW!)
- **Sort**: Mới nhất → cũ nhất (by createdAt DESC)
- **Limit**: Top 5 documents
- **Statuses**: Tất cả status (DRAFT, PENDING, IN_PROGRESS, COMPLETED, CANCELLED)
- **Progress**: Tự động tính % completion nếu có signers

---

## 🐛 Troubleshooting

### 401 Unauthorized
- Check JWT token validity
- Ensure token is in Authorization header

### 403 Forbidden
- User must have ADMIN role
- Check role in JWT payload

### Empty Data
- Database might be empty
- Check if documents/users exist

### Slow Response
- Check database indexes
- Consider adding Redis caching
- Monitor database query performance

---

## 📞 Support

- **API Docs**: [ADMIN_STATISTICS_API.md](./ADMIN_STATISTICS_API.md)
- **Types**: [ADMIN_STATISTICS_TYPES.ts](./ADMIN_STATISTICS_TYPES.ts)
- **Swagger**: http://localhost:5531/swagger-ui
- **Issues**: Report on GitHub repository

---

## ✅ Checklist for Frontend Integration

- [ ] Copy TypeScript types to your project
- [ ] Set up API client with JWT authentication
- [ ] Implement dashboard page layout
- [ ] Add overview cards (4 metrics)
- [ ] Add pie chart for document status
- [ ] Add line chart for time-series trends
- [ ] Add most active users list
- [ ] Add documents near deadline list
- [ ] Add recent completed documents list
- [ ] **Add recent documents list (NEW!)**
- [ ] Implement loading states
- [ ] Implement error handling
- [ ] Add auto-refresh (30-60s)
- [ ] Test with real data

---

**Version**: 1.0.0
**Last Updated**: 2026-01-09
**Author**: RSign Backend Team
