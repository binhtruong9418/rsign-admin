# 📊 Admin Statistics API Documentation

## Overview
API cung cấp thống kê toàn diện cho Admin Dashboard. Tất cả endpoints yêu cầu xác thực với role **ADMIN**.

---

## Endpoints

### 1. GET `/api/admin/statistics/dashboard`

**Description:** Lấy toàn bộ thống kê cho trang dashboard admin.

**Authentication:** Required (Admin role)

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response:** `200 OK`

```typescript
{
  // Tổng quan số liệu chính
  overview: {
    totalDocuments: number;      // Tổng số documents (không tính template)
    totalUsers: number;           // Tổng số users
    totalSignatures: number;      // Tổng số chữ ký đã ký
    totalTemplates: number;       // Tổng số templates
  };

  // Thống kê documents theo status
  documents: {
    draft: number;                // Số documents ở trạng thái DRAFT
    pending: number;              // Số documents ở trạng thái PENDING
    inProgress: number;           // Số documents ở trạng thái IN_PROGRESS
    completed: number;            // Số documents ở trạng thái COMPLETED
    cancelled: number;            // Số documents ở trạng thái CANCELLED
    completionRate: number;       // Tỷ lệ hoàn thành (%) = completed / (total - draft)
  };

  // Hoạt động gần đây theo thời gian
  recentActivity: {
    last24Hours: {
      documentsCreated: number;   // Số documents được tạo trong 24h
      documentsSigned: number;    // Số documents được ký xong trong 24h
      newUsers: number;           // Số users mới đăng ký trong 24h
    };
    last7Days: {
      documentsCreated: number;   // Số documents được tạo trong 7 ngày
      documentsSigned: number;    // Số documents được ký xong trong 7 ngày
      newUsers: number;           // Số users mới đăng ký trong 7 ngày
    };
    last30Days: {
      documentsCreated: number;   // Số documents được tạo trong 30 ngày
      documentsSigned: number;    // Số documents được ký xong trong 30 ngày
      newUsers: number;           // Số users mới đăng ký trong 30 ngày
    };
  };

  // Tiến độ ký
  signingProgress: {
    awaitingSignature: number;    // Tổng số chữ ký đang chờ (status = PENDING)
    signedToday: number;          // Số chữ ký được ký hôm nay
    averageSigningTime: number;   // Thời gian ký trung bình (giờ), từ lúc tạo đến hoàn thành
  };

  // Thống kê users
  users: {
    active: number;               // Số users active
    inactive: number;             // Số users inactive
    suspended: number;            // Số users bị suspended
    totalAdmins: number;          // Tổng số admins
  };

  // Top metrics - các chỉ số hàng đầu
  topMetrics: {
    // Top 5 users có nhiều chữ ký nhất
    mostActiveUsers: Array<{
      userId: string;             // UUID của user
      userName: string;           // Tên đầy đủ của user
      email: string;              // Email của user
      signaturesCount: number;    // Số chữ ký đã thực hiện
    }>;

    // Top 5 documents sắp hết hạn (trong vòng 3 ngày)
    documentsNearDeadline: Array<{
      documentId: string;         // UUID của document
      title: string;              // Tiêu đề document
      deadline: string;           // ISO 8601 datetime (VD: "2026-01-12T00:00:00.000Z")
      daysRemaining: number;      // Số ngày còn lại (1, 2, 3)
      status: string;             // Status hiện tại: PENDING hoặc IN_PROGRESS
    }>;

    // Top 5 documents vừa hoàn thành gần đây
    recentCompletedDocuments: Array<{
      documentId: string;         // UUID của document
      title: string;              // Tiêu đề document
      completedAt: string;        // ISO 8601 datetime khi hoàn thành
      totalSigners: number;       // Tổng số người ký trên document này
    }>;

    // Top 5 documents mới nhất (tất cả trạng thái)
    recentDocuments: Array<{
      documentId: string;         // UUID của document
      title: string;              // Tiêu đề document
      status: string;             // DRAFT | PENDING | IN_PROGRESS | COMPLETED | CANCELLED
      signingMode: string;        // INDIVIDUAL | SHARED
      createdAt: string;          // ISO 8601 datetime khi tạo
      createdBy: {
        id: string;               // UUID của người tạo
        fullName: string;         // Tên đầy đủ
        email: string;            // Email
      };
      progress?: {                // Chỉ có khi có signers
        totalSigners: number;     // Tổng số người cần ký
        completedSigners: number; // Số người đã ký
        completionPercentage: number; // Phần trăm hoàn thành (0-100)
      };
    }>;
  };
}
```

**Example Response:**
```json
{
  "overview": {
    "totalDocuments": 150,
    "totalUsers": 45,
    "totalSignatures": 320,
    "totalTemplates": 12
  },
  "documents": {
    "draft": 10,
    "pending": 25,
    "inProgress": 30,
    "completed": 80,
    "cancelled": 5,
    "completionRate": 57
  },
  "recentActivity": {
    "last24Hours": {
      "documentsCreated": 5,
      "documentsSigned": 8,
      "newUsers": 2
    },
    "last7Days": {
      "documentsCreated": 23,
      "documentsSigned": 45,
      "newUsers": 7
    },
    "last30Days": {
      "documentsCreated": 95,
      "documentsSigned": 180,
      "newUsers": 18
    }
  },
  "signingProgress": {
    "awaitingSignature": 65,
    "signedToday": 12,
    "averageSigningTime": 18.5
  },
  "users": {
    "active": 40,
    "inactive": 3,
    "suspended": 2,
    "totalAdmins": 3
  },
  "topMetrics": {
    "mostActiveUsers": [
      {
        "userId": "550e8400-e29b-41d4-a716-446655440000",
        "userName": "John Doe",
        "email": "john@example.com",
        "signaturesCount": 45
      },
      {
        "userId": "550e8400-e29b-41d4-a716-446655440001",
        "userName": "Jane Smith",
        "email": "jane@example.com",
        "signaturesCount": 38
      }
    ],
    "documentsNearDeadline": [
      {
        "documentId": "650e8400-e29b-41d4-a716-446655440000",
        "title": "Contract ABC - Urgent",
        "deadline": "2026-01-12T00:00:00.000Z",
        "daysRemaining": 3,
        "status": "PENDING"
      },
      {
        "documentId": "650e8400-e29b-41d4-a716-446655440001",
        "title": "Agreement XYZ",
        "deadline": "2026-01-11T00:00:00.000Z",
        "daysRemaining": 2,
        "status": "IN_PROGRESS"
      }
    ],
    "recentCompletedDocuments": [
      {
        "documentId": "750e8400-e29b-41d4-a716-446655440000",
        "title": "Partnership Agreement",
        "completedAt": "2026-01-09T10:30:00.000Z",
        "totalSigners": 5
      },
      {
        "documentId": "750e8400-e29b-41d4-a716-446655440001",
        "title": "Service Contract",
        "completedAt": "2026-01-08T14:20:00.000Z",
        "totalSigners": 3
      }
    ],
    "recentDocuments": [
      {
        "documentId": "850e8400-e29b-41d4-a716-446655440000",
        "title": "New Contract 2026",
        "status": "PENDING",
        "signingMode": "SHARED",
        "createdAt": "2026-01-09T08:15:00.000Z",
        "createdBy": {
          "id": "550e8400-e29b-41d4-a716-446655440002",
          "fullName": "Admin User",
          "email": "admin@example.com"
        },
        "progress": {
          "totalSigners": 10,
          "completedSigners": 3,
          "completionPercentage": 30
        }
      },
      {
        "documentId": "850e8400-e29b-41d4-a716-446655440001",
        "title": "Draft Document",
        "status": "DRAFT",
        "signingMode": "INDIVIDUAL",
        "createdAt": "2026-01-09T07:00:00.000Z",
        "createdBy": {
          "id": "550e8400-e29b-41d4-a716-446655440002",
          "fullName": "Admin User",
          "email": "admin@example.com"
        }
      }
    ]
  }
}
```

---

### 2. GET `/api/admin/statistics/time-series`

**Description:** Lấy dữ liệu chuỗi thời gian để vẽ charts/graphs.

**Authentication:** Required (Admin role)

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters:**
| Parameter | Type   | Required | Default | Description                      |
|-----------|--------|----------|---------|----------------------------------|
| days      | number | No       | 30      | Số ngày lấy dữ liệu (1-90)      |

**Response:** `200 OK`

```typescript
Array<{
  date: string;                   // YYYY-MM-DD format (VD: "2025-12-10")
  documentsCreated: number;       // Số documents được tạo trong ngày
  documentsCompleted: number;     // Số documents hoàn thành trong ngày
  signaturesCreated: number;      // Số chữ ký được tạo trong ngày
}>
```

**Example Request:**
```bash
GET /api/admin/statistics/time-series?days=7
```

**Example Response:**
```json
[
  {
    "date": "2026-01-03",
    "documentsCreated": 3,
    "documentsCompleted": 2,
    "signaturesCreated": 8
  },
  {
    "date": "2026-01-04",
    "documentsCreated": 5,
    "documentsCompleted": 4,
    "signaturesCreated": 12
  },
  {
    "date": "2026-01-05",
    "documentsCreated": 2,
    "documentsCompleted": 3,
    "signaturesCreated": 9
  },
  {
    "date": "2026-01-06",
    "documentsCreated": 4,
    "documentsCompleted": 5,
    "signaturesCreated": 15
  },
  {
    "date": "2026-01-07",
    "documentsCreated": 6,
    "documentsCompleted": 3,
    "signaturesCreated": 10
  },
  {
    "date": "2026-01-08",
    "documentsCreated": 3,
    "documentsCompleted": 6,
    "signaturesCreated": 18
  },
  {
    "date": "2026-01-09",
    "documentsCreated": 5,
    "documentsCompleted": 4,
    "signaturesCreated": 14
  }
]
```

**Use Cases for Time-Series Data:**
- Line charts showing document creation trends
- Bar charts comparing daily activities
- Area charts for signature growth
- Multi-line charts comparing creation vs completion

---

## Error Responses

### 401 Unauthorized
Khi không có token hoặc token không hợp lệ:
```json
{
  "success": false,
  "message": "You must be logged in to access this resource",
  "statusCode": 401
}
```

### 403 Forbidden
Khi user không phải admin:
```json
{
  "success": false,
  "message": "You do not have permission to access this resource",
  "statusCode": 403
}
```

### 500 Internal Server Error
Khi có lỗi server:
```json
{
  "success": false,
  "message": "Error message here",
  "statusCode": 500
}
```

---

## Integration Guide

### React Example (with Axios)

```typescript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5531/api';

// Axios instance với JWT token
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
  }
});

// Get dashboard statistics
async function getDashboardStats() {
  try {
    const response = await api.get('/admin/statistics/dashboard');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    throw error;
  }
}

// Get time-series data
async function getTimeSeriesData(days = 30) {
  try {
    const response = await api.get('/admin/statistics/time-series', {
      params: { days }
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch time-series data:', error);
    throw error;
  }
}

// Usage in React component
function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (error) {
        // Handle error
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Dashboard</h1>

      {/* Overview Cards */}
      <div className="overview-cards">
        <Card title="Total Documents" value={stats.overview.totalDocuments} />
        <Card title="Total Users" value={stats.overview.totalUsers} />
        <Card title="Total Signatures" value={stats.overview.totalSignatures} />
        <Card title="Templates" value={stats.overview.totalTemplates} />
      </div>

      {/* Document Status */}
      <div className="document-stats">
        <PieChart data={stats.documents} />
      </div>

      {/* Recent Activity */}
      <div className="recent-activity">
        <ActivityTimeline data={stats.recentActivity} />
      </div>

      {/* Top Metrics */}
      <div className="top-metrics">
        <MostActiveUsers users={stats.topMetrics.mostActiveUsers} />
        <DocumentsNearDeadline docs={stats.topMetrics.documentsNearDeadline} />
        <RecentDocuments docs={stats.topMetrics.recentDocuments} />
      </div>
    </div>
  );
}
```

### Vue.js Example (with Fetch)

```typescript
import { ref, onMounted } from 'vue';

export default {
  setup() {
    const stats = ref(null);
    const loading = ref(true);
    const error = ref(null);

    const fetchDashboardStats = async () => {
      try {
        const token = localStorage.getItem('jwt_token');
        const response = await fetch('http://localhost:5531/api/admin/statistics/dashboard', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch statistics');
        }

        stats.value = await response.json();
      } catch (err) {
        error.value = err.message;
      } finally {
        loading.value = false;
      }
    };

    onMounted(() => {
      fetchDashboardStats();
    });

    return {
      stats,
      loading,
      error
    };
  }
};
```

---

## UI/UX Suggestions

### Dashboard Layout

```
┌─────────────────────────────────────────────────────────────┐
│  ADMIN DASHBOARD                                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ 📄 150   │  │ 👥 45    │  │ ✍️ 320   │  │ 📋 12    │  │
│  │ Documents│  │ Users    │  │ Signatures│  │ Templates│  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│                                                             │
│  ┌─────────────────────────┐  ┌─────────────────────────┐ │
│  │  📊 Documents by Status │  │  📈 Activity Trends     │ │
│  │  - Completed: 57%       │  │  [Line Chart]           │ │
│  │  - In Progress: 21%     │  │                         │ │
│  │  - Pending: 18%         │  │                         │ │
│  └─────────────────────────┘  └─────────────────────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  ⭐ Top Metrics                                      │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐│  │
│  │  │Most Active   │ │Near Deadline │ │Recent Docs   ││  │
│  │  │Users         │ │Documents     │ │              ││  │
│  │  └──────────────┘ └──────────────┘ └──────────────┘│  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Recommended Charts

1. **Overview Cards**: Big numbers với icons
2. **Pie Chart**: Document status distribution
3. **Line Chart**: Time-series trends (7/30 days)
4. **Bar Chart**: Recent activity comparison
5. **Table**: Most active users with avatars
6. **List**: Documents near deadline với countdown
7. **Timeline**: Recent completed documents

### Color Scheme Suggestions

- **DRAFT**: 🟦 Blue (#3B82F6)
- **PENDING**: 🟨 Yellow (#F59E0B)
- **IN_PROGRESS**: 🟧 Orange (#F97316)
- **COMPLETED**: 🟩 Green (#10B981)
- **CANCELLED**: 🟥 Red (#EF4444)

---

## Performance Notes

- **Cache**: Recommend caching dashboard data for 30-60 seconds
- **Polling**: If implementing real-time updates, poll every 30-60 seconds
- **Loading States**: Always show skeleton loaders while fetching
- **Error Handling**: Implement retry logic for failed requests
- **Response Time**: Typically < 500ms for dashboard endpoint

---

## Testing with cURL

```bash
# Get dashboard statistics
curl -X GET "http://localhost:5531/api/admin/statistics/dashboard" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"

# Get time-series data (last 7 days)
curl -X GET "http://localhost:5531/api/admin/statistics/time-series?days=7" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

---

## Swagger UI

Truy cập Swagger UI để test trực tiếp:
```
http://localhost:5531/swagger-ui
```

Tìm section **"Admin - Statistics"** để xem và test các endpoints.

---

## Support

Nếu gặp vấn đề, liên hệ dev team hoặc tạo issue trên repository.

**API Version**: 1.0.0
**Last Updated**: 2026-01-09
