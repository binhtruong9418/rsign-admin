# Admin Document List API Documentation

## Overview

This document covers the **Admin Document List API** with enhanced filtering and search capabilities. This endpoint is designed for administrators to monitor, manage, and search all documents in the system.

**Key Features:**

-   12+ filter parameters
-   Full-text search across title and creator info
-   Date range filtering
-   Batch operations support
-   Comprehensive document metadata

---

## Endpoint

### Get All Documents (Enhanced)

**GET** `/admin/documents`

Returns paginated list of all documents in the system with extensive filtering options.

**Access:** Admin only

---

## Request

### Headers

```
Authorization: Bearer <admin_jwt_token>
```

### Query Parameters

```typescript
{
  // Pagination
  page?: number;              // Default: 0
  limit?: number;             // Default: 10

  // Status Filters
  status?: string;            // "DRAFT" | "PENDING" | "COMPLETED" | "REJECTED" | "EXPIRED"
  signingMode?: string;       // "INDIVIDUAL" | "MULTI"
  signingFlow?: string;       // "PARALLEL" | "SEQUENTIAL"

  // Document Filters
  batchId?: string;           // Filter by batch ID
  createdById?: string;       // Filter by creator user ID
  assignedUserId?: string;    // Filter by assigned user ID
  isTemplate?: boolean;       // Filter templates

  // Search
  search?: string;            // Search in title, creator name, creator email

  // Date Range
  dateFrom?: string;          // ISO8601 date - documents created after
  dateTo?: string;            // ISO8601 date - documents created before

  // Deadline Filter
  hasDeadline?: boolean;      // true = only docs with deadline, false = only without
}
```

### Query Examples

**1. Get all pending documents:**

```
GET /admin/documents?status=PENDING&page=0&limit=20
```

**2. Search by title or creator:**

```
GET /admin/documents?search=contract&page=0
```

**3. Filter by date range:**

```
GET /admin/documents?dateFrom=2026-01-01&dateTo=2026-01-31
```

**4. Get documents in a specific batch:**

```
GET /admin/documents?batchId=batch-uuid-123
```

**5. Find overdue documents with deadline:**

```
GET /admin/documents?hasDeadline=true&status=PENDING
```

**6. Multi-signature documents only:**

```
GET /admin/documents?signingMode=MULTI&signingFlow=PARALLEL
```

---

## Response

### Success (200)

```json
{
    "items": [
        {
            "id": "doc-uuid-123",
            "title": "Q1 2026 Partnership Agreement",
            "originalFileUrl": "https://storage.example.com/original-123.pdf",
            "signedFileUrl": null,
            "status": "PENDING",
            "signingMode": "MULTI",
            "signingFlow": "PARALLEL",
            "currentStep": 1,
            "totalSteps": 3,
            "createdAt": "2026-01-05T10:00:00Z",
            "deadline": "2026-01-20T23:59:59Z",
            "completedAt": null,
            "batchId": "batch-uuid-456",
            "isTemplate": false,
            "templateName": null,

            "createdBy": {
                "id": "user-uuid-789",
                "fullName": "John Admin",
                "email": "john.admin@company.com"
            },

            "assignedUser": {
                "id": "user-uuid-101",
                "fullName": "Alice Employee",
                "email": "alice@company.com"
            },

            "totalSigners": 15,
            "completedSigners": 8
        },
        {
            "id": "doc-uuid-124",
            "title": "Employee NDA - Batch 2026-01",
            "originalFileUrl": "https://storage.example.com/original-124.pdf",
            "signedFileUrl": "https://storage.example.com/signed-124.pdf",
            "status": "COMPLETED",
            "signingMode": "INDIVIDUAL",
            "signingFlow": "PARALLEL",
            "currentStep": 1,
            "totalSteps": 1,
            "createdAt": "2026-01-03T08:00:00Z",
            "deadline": null,
            "completedAt": "2026-01-03T14:30:00Z",
            "batchId": "batch-uuid-789",
            "isTemplate": false,
            "templateName": null,

            "createdBy": {
                "id": "user-uuid-789",
                "fullName": "John Admin",
                "email": "john.admin@company.com"
            },

            "assignedUser": {
                "id": "user-uuid-202",
                "fullName": "Bob Employee",
                "email": "bob@company.com"
            },

            "totalSigners": 1,
            "completedSigners": 1
        }
    ],
    "page": 0,
    "limit": 10,
    "total": 142,
    "totalPages": 15,
    "hasNextPage": true,
    "hasPreviousPage": false
}
```

---

## Response Fields

### Document Fields

| Field             | Type            | Description                                            |
| ----------------- | --------------- | ------------------------------------------------------ |
| `id`              | string          | Document UUID                                          |
| `title`           | string          | Document title                                         |
| `originalFileUrl` | string          | URL to original unsigned PDF                           |
| `signedFileUrl`   | string \| null  | URL to signed PDF (only when completed)                |
| `status`          | string          | `DRAFT`, `PENDING`, `COMPLETED`, `REJECTED`, `EXPIRED` |
| `signingMode`     | string          | `INDIVIDUAL` or `MULTI`                                |
| `signingFlow`     | string          | `PARALLEL` or `SEQUENTIAL`                             |
| `currentStep`     | number          | Current signing step (1-based)                         |
| `totalSteps`      | number          | Total number of signing steps                          |
| `createdAt`       | ISO8601         | Document creation timestamp                            |
| `deadline`        | ISO8601 \| null | Signing deadline                                       |
| `completedAt`     | ISO8601 \| null | Completion timestamp                                   |
| `batchId`         | string \| null  | Batch ID for bulk operations                           |
| `isTemplate`      | boolean         | Whether document is a template                         |
| `templateName`    | string \| null  | Template name if `isTemplate = true`                   |

### Related Objects

**Creator (`createdBy`):**

```typescript
{
    id: string;
    fullName: string;
    email: string;
}
```

**Assigned User (`assignedUser`):**

```typescript
{
  id: string;
  fullName: string;
  email: string;
} | null
```

### Progress Fields

| Field              | Type   | Description                                  |
| ------------------ | ------ | -------------------------------------------- |
| `totalSigners`     | number | Total number of signers across all steps     |
| `completedSigners` | number | Number of signers who have completed signing |

---

## UI Integration Guide

### Admin Dashboard - Document Management

#### React Example

```tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface AdminDocumentListItem {
    id: string;
    title: string;
    originalFileUrl: string;
    signedFileUrl: string | null;
    status: string;
    signingMode: string;
    signingFlow: string;
    currentStep: number;
    totalSteps: number;
    createdAt: string;
    deadline: string | null;
    completedAt: string | null;
    batchId: string | null;
    isTemplate: boolean;
    templateName: string | null;
    createdBy: {
        id: string;
        fullName: string;
        email: string;
    };
    assignedUser: {
        id: string;
        fullName: string;
        email: string;
    } | null;
    totalSigners: number;
    completedSigners: number;
}

function AdminDocumentList() {
    const [filters, setFilters] = useState({
        status: "",
        search: "",
        signingMode: "",
        page: 0,
        limit: 20,
    });

    const { data, isLoading } = useQuery({
        queryKey: ["admin-documents", filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key, String(value));
            });

            const response = await fetch(`/admin/documents?${params}`, {
                headers: {
                    Authorization: `Bearer ${adminToken}`,
                },
            });
            return response.json();
        },
    });

    return (
        <div className="admin-documents">
            <FilterPanel>
                {/* Search */}
                <SearchInput
                    placeholder="Search title, creator name, or email..."
                    value={filters.search}
                    onChange={(e) =>
                        setFilters({ ...filters, search: e.target.value })
                    }
                />

                {/* Status Filter */}
                <Select
                    value={filters.status}
                    onChange={(e) =>
                        setFilters({ ...filters, status: e.target.value })
                    }>
                    <option value="">All Statuses</option>
                    <option value="DRAFT">Draft</option>
                    <option value="PENDING">Pending</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="EXPIRED">Expired</option>
                </Select>

                {/* Signing Mode Filter */}
                <Select
                    value={filters.signingMode}
                    onChange={(e) =>
                        setFilters({ ...filters, signingMode: e.target.value })
                    }>
                    <option value="">All Modes</option>
                    <option value="INDIVIDUAL">Individual</option>
                    <option value="MULTI">Multi-signature</option>
                </Select>
            </FilterPanel>

            <DataTable>
                <thead>
                    <tr>
                        <th>Document</th>
                        <th>Creator</th>
                        <th>Assigned To</th>
                        <th>Status</th>
                        <th>Progress</th>
                        <th>Created</th>
                        <th>Deadline</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {data?.items.map((doc: AdminDocumentListItem) => (
                        <tr key={doc.id}>
                            <td>
                                <div className="document-info">
                                    <strong>{doc.title}</strong>
                                    <div className="metadata">
                                        <Badge>{doc.signingMode}</Badge>
                                        <Badge>{doc.signingFlow}</Badge>
                                        {doc.batchId && (
                                            <Badge variant="outline">
                                                Batch
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </td>

                            <td>
                                <UserCell user={doc.createdBy} />
                            </td>

                            <td>
                                {doc.assignedUser ? (
                                    <UserCell user={doc.assignedUser} />
                                ) : (
                                    <span className="text-muted">-</span>
                                )}
                            </td>

                            <td>
                                <StatusBadge status={doc.status} />
                            </td>

                            <td>
                                <ProgressBar
                                    value={doc.completedSigners}
                                    max={doc.totalSigners}
                                    label={`${doc.completedSigners}/${doc.totalSigners}`}
                                />
                                {doc.signingFlow === "SEQUENTIAL" && (
                                    <div className="step-info">
                                        Step {doc.currentStep}/{doc.totalSteps}
                                    </div>
                                )}
                            </td>

                            <td>
                                <time dateTime={doc.createdAt}>
                                    {formatDate(doc.createdAt)}
                                </time>
                            </td>

                            <td>
                                {doc.deadline ? (
                                    <DeadlineCell deadline={doc.deadline} />
                                ) : (
                                    <span className="text-muted">
                                        No deadline
                                    </span>
                                )}
                            </td>

                            <td>
                                <ActionMenu>
                                    <MenuItem
                                        onClick={() => viewDetails(doc.id)}>
                                        View Details
                                    </MenuItem>
                                    {doc.status === "COMPLETED" &&
                                        doc.signedFileUrl && (
                                            <MenuItem
                                                onClick={() =>
                                                    downloadFile(
                                                        doc.signedFileUrl!
                                                    )
                                                }>
                                                Download Signed
                                            </MenuItem>
                                        )}
                                    <MenuItem
                                        onClick={() => viewAuditLog(doc.id)}>
                                        Audit Log
                                    </MenuItem>
                                </ActionMenu>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </DataTable>

            <Pagination
                page={data?.page}
                totalPages={data?.totalPages}
                hasNext={data?.hasNextPage}
                hasPrevious={data?.hasPreviousPage}
                onPageChange={(page) => setFilters({ ...filters, page })}
            />
        </div>
    );
}
```

### Advanced Filters Component

```tsx
function AdvancedFilters({ onApply }: { onApply: (filters: any) => void }) {
    const [expanded, setExpanded] = useState(false);
    const [formData, setFormData] = useState({
        status: "",
        signingMode: "",
        signingFlow: "",
        hasDeadline: undefined as boolean | undefined,
        dateFrom: "",
        dateTo: "",
        search: "",
        batchId: "",
    });

    const handleApply = () => {
        const cleanFilters = Object.fromEntries(
            Object.entries(formData).filter(
                ([_, v]) => v !== "" && v !== undefined
            )
        );
        onApply(cleanFilters);
    };

    return (
        <div className="advanced-filters">
            <button onClick={() => setExpanded(!expanded)}>
                Advanced Filters {expanded ? "▲" : "▼"}
            </button>

            {expanded && (
                <div className="filter-form">
                    <div className="filter-row">
                        <label>Status</label>
                        <Select
                            value={formData.status}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    status: e.target.value,
                                })
                            }>
                            <option value="">All</option>
                            <option value="DRAFT">Draft</option>
                            <option value="PENDING">Pending</option>
                            <option value="COMPLETED">Completed</option>
                        </Select>
                    </div>

                    <div className="filter-row">
                        <label>Signing Mode</label>
                        <Select
                            value={formData.signingMode}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    signingMode: e.target.value,
                                })
                            }>
                            <option value="">All</option>
                            <option value="INDIVIDUAL">Individual</option>
                            <option value="MULTI">Multi-signature</option>
                        </Select>
                    </div>

                    <div className="filter-row">
                        <label>Signing Flow</label>
                        <Select
                            value={formData.signingFlow}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    signingFlow: e.target.value,
                                })
                            }>
                            <option value="">All</option>
                            <option value="PARALLEL">Parallel</option>
                            <option value="SEQUENTIAL">Sequential</option>
                        </Select>
                    </div>

                    <div className="filter-row">
                        <label>Has Deadline</label>
                        <Select
                            value={
                                formData.hasDeadline === undefined
                                    ? ""
                                    : String(formData.hasDeadline)
                            }
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    hasDeadline:
                                        e.target.value === ""
                                            ? undefined
                                            : e.target.value === "true",
                                })
                            }>
                            <option value="">All</option>
                            <option value="true">With Deadline</option>
                            <option value="false">No Deadline</option>
                        </Select>
                    </div>

                    <div className="filter-row">
                        <label>Date Range</label>
                        <DateRangePicker
                            startDate={formData.dateFrom}
                            endDate={formData.dateTo}
                            onChange={({ start, end }) =>
                                setFormData({
                                    ...formData,
                                    dateFrom: start,
                                    dateTo: end,
                                })
                            }
                        />
                    </div>

                    <div className="filter-row">
                        <label>Batch ID</label>
                        <Input
                            value={formData.batchId}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    batchId: e.target.value,
                                })
                            }
                            placeholder="Enter batch ID..."
                        />
                    </div>

                    <div className="filter-actions">
                        <Button onClick={handleApply} variant="primary">
                            Apply Filters
                        </Button>
                        <Button
                            onClick={() => {
                                setFormData({
                                    status: "",
                                    signingMode: "",
                                    signingFlow: "",
                                    hasDeadline: undefined,
                                    dateFrom: "",
                                    dateTo: "",
                                    search: "",
                                    batchId: "",
                                });
                                onApply({});
                            }}
                            variant="secondary">
                            Clear All
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
```

### Statistics Dashboard

```tsx
function DocumentStatistics() {
    const { data: allDocs } = useQuery({
        queryKey: ["admin-documents-stats"],
        queryFn: () =>
            fetch("/admin/documents?limit=1000").then((r) => r.json()),
    });

    const stats = useMemo(() => {
        if (!allDocs?.items) return null;

        const docs = allDocs.items;
        return {
            total: docs.length,
            pending: docs.filter((d: any) => d.status === "PENDING").length,
            completed: docs.filter((d: any) => d.status === "COMPLETED").length,
            overdue: docs.filter(
                (d: any) =>
                    d.deadline &&
                    new Date(d.deadline) < new Date() &&
                    d.status === "PENDING"
            ).length,
            avgCompletionRate:
                docs.length > 0
                    ? (docs.reduce(
                          (sum: number, d: any) =>
                              sum + d.completedSigners / d.totalSigners,
                          0
                      ) /
                          docs.length) *
                      100
                    : 0,
        };
    }, [allDocs]);

    if (!stats) return <Spinner />;

    return (
        <StatsGrid>
            <StatCard title="Total Documents" value={stats.total} icon="📄" />
            <StatCard
                title="Pending"
                value={stats.pending}
                icon="⏳"
                variant="warning"
            />
            <StatCard
                title="Completed"
                value={stats.completed}
                icon="✅"
                variant="success"
            />
            <StatCard
                title="Overdue"
                value={stats.overdue}
                icon="⚠️"
                variant="danger"
            />
            <StatCard
                title="Avg. Completion"
                value={`${stats.avgCompletionRate.toFixed(1)}%`}
                icon="📊"
            />
        </StatsGrid>
    );
}
```

---

## Use Cases

### 1. Monitor Document Progress

```tsx
function DocumentProgressMonitor() {
    const { data } = useQuery({
        queryKey: ["pending-docs"],
        queryFn: () =>
            fetch("/admin/documents?status=PENDING").then((r) => r.json()),
        refetchInterval: 30000, // Refresh every 30s
    });

    const sortedByProgress = data?.items.sort((a: any, b: any) => {
        const aProgress = a.completedSigners / a.totalSigners;
        const bProgress = b.completedSigners / b.totalSigners;
        return bProgress - aProgress;
    });

    return (
        <div>
            <h2>Document Progress</h2>
            {sortedByProgress?.map((doc: any) => (
                <ProgressCard key={doc.id}>
                    <h3>{doc.title}</h3>
                    <ProgressBar
                        value={doc.completedSigners}
                        max={doc.totalSigners}
                    />
                    <span>
                        {doc.completedSigners}/{doc.totalSigners} signatures (
                        {Math.round(
                            (doc.completedSigners / doc.totalSigners) * 100
                        )}
                        %)
                    </span>
                </ProgressCard>
            ))}
        </div>
    );
}
```

### 2. Batch Management

```tsx
function BatchDocuments({ batchId }: { batchId: string }) {
    const { data } = useQuery({
        queryKey: ["batch-docs", batchId],
        queryFn: () =>
            fetch(`/admin/documents?batchId=${batchId}`).then((r) => r.json()),
    });

    const batchStats = useMemo(() => {
        if (!data?.items) return null;
        const docs = data.items;
        return {
            total: docs.length,
            completed: docs.filter((d: any) => d.status === "COMPLETED").length,
            pending: docs.filter((d: any) => d.status === "PENDING").length,
            draft: docs.filter((d: any) => d.status === "DRAFT").length,
        };
    }, [data]);

    return (
        <div>
            <BatchHeader>
                <h2>Batch: {batchId}</h2>
                {batchStats && (
                    <Stats>
                        <Stat label="Total" value={batchStats.total} />
                        <Stat label="Completed" value={batchStats.completed} />
                        <Stat label="Pending" value={batchStats.pending} />
                        <Stat label="Draft" value={batchStats.draft} />
                    </Stats>
                )}
            </BatchHeader>

            <DocumentTable documents={data?.items} />
        </div>
    );
}
```

### 3. Search & Export

```tsx
function DocumentSearchExport() {
    const [search, setSearch] = useState("");
    const [debouncedSearch] = useDebounce(search, 500);

    const { data } = useQuery({
        queryKey: ["admin-docs-search", debouncedSearch],
        queryFn: () =>
            fetch(`/admin/documents?search=${debouncedSearch}&limit=100`).then(
                (r) => r.json()
            ),
        enabled: debouncedSearch.length > 2,
    });

    const handleExport = () => {
        if (!data?.items) return;

        const csv = [
            [
                "ID",
                "Title",
                "Status",
                "Creator",
                "Progress",
                "Created",
                "Deadline",
            ].join(","),
            ...data.items.map((doc: any) =>
                [
                    doc.id,
                    `"${doc.title}"`,
                    doc.status,
                    `"${doc.createdBy.fullName}"`,
                    `${doc.completedSigners}/${doc.totalSigners}`,
                    doc.createdAt,
                    doc.deadline || "N/A",
                ].join(",")
            ),
        ].join("\n");

        downloadFile(csv, "documents.csv", "text/csv");
    };

    return (
        <div>
            <SearchBar>
                <Input
                    placeholder="Search documents by title, creator name, or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <Button onClick={handleExport} disabled={!data?.items?.length}>
                    Export to CSV
                </Button>
            </SearchBar>

            {data?.items && (
                <SearchResults>
                    <p>Found {data.total} documents</p>
                    <DocumentTable documents={data.items} />
                </SearchResults>
            )}
        </div>
    );
}
```

### 4. Overdue Documents Alert

```tsx
function OverdueDocumentsAlert() {
    const { data } = useQuery({
        queryKey: ["overdue-docs"],
        queryFn: async () => {
            const response = await fetch(
                "/admin/documents?status=PENDING&hasDeadline=true&limit=100"
            );
            const result = await response.json();

            // Filter overdue on client side
            const now = new Date();
            return result.data.filter(
                (doc: any) => new Date(doc.deadline) < now
            );
        },
        refetchInterval: 60000, // Check every minute
    });

    if (!data || data.length === 0) return null;

    return (
        <Alert variant="danger">
            <AlertIcon>⚠️</AlertIcon>
            <AlertContent>
                <h3>Overdue Documents: {data.length}</h3>
                <ul>
                    {data.slice(0, 5).map((doc: any) => (
                        <li key={doc.id}>
                            <strong>{doc.title}</strong> - Overdue by{" "}
                            {getDaysOverdue(doc.deadline)} days
                        </li>
                    ))}
                </ul>
                {data.length > 5 && (
                    <Link to="/admin/documents?overdue=true">
                        View all {data.length} overdue documents →
                    </Link>
                )}
            </AlertContent>
        </Alert>
    );
}
```

---

## TypeScript Types

```typescript
// types/admin-documents.ts

export interface AdminDocumentListItem {
    id: string;
    title: string;
    originalFileUrl: string;
    signedFileUrl: string | null;
    status: DocumentStatus;
    signingMode: SigningMode;
    signingFlow: SigningFlow;
    currentStep: number;
    totalSteps: number;
    createdAt: string;
    deadline: string | null;
    completedAt: string | null;
    batchId: string | null;
    isTemplate: boolean;
    templateName: string | null;
    createdBy: UserInfo;
    assignedUser: UserInfo | null;
    totalSigners: number;
    completedSigners: number;
}

export interface UserInfo {
    id: string;
    fullName: string;
    email: string;
}

export type DocumentStatus =
    | "DRAFT"
    | "PENDING"
    | "COMPLETED"
    | "REJECTED"
    | "EXPIRED";

export type SigningMode = "INDIVIDUAL" | "MULTI";
export type SigningFlow = "PARALLEL" | "SEQUENTIAL";

export interface AdminDocumentListQuery {
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

export interface AdminDocumentListResponse {
    items: AdminDocumentListItem[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}
```

---

## API Hooks

```typescript
// hooks/useAdminDocuments.ts
import { useQuery } from "@tanstack/react-query";

export function useAdminDocuments(query: AdminDocumentListQuery) {
    return useQuery({
        queryKey: ["admin-documents", query],
        queryFn: async () => {
            const params = new URLSearchParams();
            Object.entries(query).forEach(([key, value]) => {
                if (value !== undefined && value !== "") {
                    params.append(key, String(value));
                }
            });

            const response = await fetch(`/admin/documents?${params}`, {
                headers: {
                    Authorization: `Bearer ${getAdminToken()}`,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch documents");
            }

            return response.json() as Promise<AdminDocumentListResponse>;
        },
        staleTime: 30000, // 30 seconds
        refetchOnWindowFocus: true,
    });
}

// Specialized hooks

export function usePendingDocuments(page: number = 0, limit: number = 20) {
    return useAdminDocuments({ status: "PENDING", page, limit });
}

export function useDocumentsByBatch(batchId: string) {
    return useAdminDocuments({ batchId, limit: 100 });
}

export function useDocumentSearch(search: string) {
    return useQuery({
        queryKey: ["admin-documents-search", search],
        queryFn: () => useAdminDocuments({ search, limit: 50 }),
        enabled: search.length > 2,
    });
}
```

---

## Performance Optimization

### Response Size

**Single document item:** ~0.6-0.8 KB
**10 items:** ~6-8 KB
**100 items:** ~60-80 KB

### Caching Strategy

```typescript
const CACHE_CONFIG = {
    staleTime: 30000, // 30s
    cacheTime: 300000, // 5min
    refetchOnWindowFocus: true,
    refetchOnMount: false,
};
```

### Pagination Best Practices

-   **Default limit:** 10-20 items
-   **Max limit:** 100 items
-   Use infinite scroll for better UX
-   Cache pages individually

### Search Optimization

```typescript
// Debounce search input
const [debouncedSearch] = useDebounce(searchValue, 500);

// Only search when input has 3+ characters
const { data } = useQuery({
    queryKey: ["search", debouncedSearch],
    queryFn: () => searchDocuments(debouncedSearch),
    enabled: debouncedSearch.length >= 3,
});
```

---

## Error Handling

### Common Errors

**401 Unauthorized:**

```json
{
    "error": "Unauthorized",
    "message": "Admin access required"
}
```

**403 Forbidden:**

```json
{
    "error": "Forbidden",
    "message": "Insufficient permissions"
}
```

**400 Bad Request:**

```json
{
    "error": "Bad Request",
    "message": "Invalid query parameter: status"
}
```

### Error Handling Example

```typescript
function DocumentList() {
    const { data, error, isLoading } = useAdminDocuments({ page: 0 });

    if (isLoading) return <Spinner />;

    if (error) {
        if (error.status === 401) {
            redirectToLogin();
            return null;
        }

        return (
            <ErrorState>
                <h3>Failed to load documents</h3>
                <p>{error.message}</p>
                <Button onClick={() => refetch()}>Retry</Button>
            </ErrorState>
        );
    }

    return <DocumentTable documents={data.items} />;
}
```

---

## Testing

```typescript
describe("Admin Document List API", () => {
    let adminToken: string;

    beforeAll(async () => {
        const response = await request(app)
            .post("/users/login")
            .send({ email: "admin@test.com", password: "admin123" });
        adminToken = response.body.token;
    });

    describe("GET /admin/documents", () => {
        it("should return paginated documents", async () => {
            const response = await request(app)
                .get("/admin/documents?page=0&limit=10")
                .set("Authorization", `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.items).toBeInstanceOf(Array);
            expect(response.body).toMatchObject({
                page: 0,
                limit: 10,
                total: expect.any(Number),
                totalPages: expect.any(Number),
                hasNextPage: expect.any(Boolean),
                hasPreviousPage: expect.any(Boolean),
            });
        });

        it("should filter by status", async () => {
            const response = await request(app)
                .get("/admin/documents?status=PENDING")
                .set("Authorization", `Bearer ${adminToken}`)
                .expect(200);

            response.body.items.forEach((doc: any) => {
                expect(doc.status).toBe("PENDING");
            });
        });

        it("should search by title", async () => {
            const response = await request(app)
                .get("/admin/documents?search=contract")
                .set("Authorization", `Bearer ${adminToken}`)
                .expect(200);

            response.body.items.forEach((doc: any) => {
                expect(doc.title.toLowerCase()).toContain("contract");
            });
        });

        it("should filter by date range", async () => {
            const response = await request(app)
                .get("/admin/documents?dateFrom=2026-01-01&dateTo=2026-01-31")
                .set("Authorization", `Bearer ${adminToken}`)
                .expect(200);

            response.body.items.forEach((doc: any) => {
                const date = new Date(doc.createdAt);
                expect(date >= new Date("2026-01-01")).toBe(true);
                expect(date <= new Date("2026-01-31")).toBe(true);
            });
        });

        it("should reject non-admin users", async () => {
            const userToken = await getUserToken();

            await request(app)
                .get("/admin/documents")
                .set("Authorization", `Bearer ${userToken}`)
                .expect(403);
        });
    });
});
```

---

## Comparison: Admin vs User List API

| Feature           | Admin List API         | User List API         |
| ----------------- | ---------------------- | --------------------- |
| **Access**        | Admin only             | Authenticated users   |
| **Scope**         | All documents          | User's documents only |
| **Filters**       | 12+ parameters         | Basic (status only)   |
| **Search**        | Title + Creator        | Not available         |
| **Creator Info**  | Full details           | Not shown             |
| **File URLs**     | Both original & signed | Not shown             |
| **Batch Info**    | Yes                    | No                    |
| **Template Info** | Yes                    | No                    |
| **Response Size** | ~0.7KB/item            | ~0.4KB/item           |

---

## FAQ

### Q: Can I get all documents without pagination?

**A:** Set `limit=1000` (reasonable max), but be aware of response size. For exports, better to paginate and merge on client side.

### Q: How do I find documents created by a specific admin?

**A:** Use `createdById` parameter: `/admin/documents?createdById=user-uuid-123`

### Q: Can I filter by multiple statuses?

**A:** No, currently single status only. To get multiple statuses, make separate requests or filter on client side.

### Q: How to find all overdue documents?

**A:** Fetch pending documents with deadline: `/admin/documents?status=PENDING&hasDeadline=true`, then filter client-side where `deadline < now`.

### Q: What's the difference between totalSteps and currentStep?

**A:**

-   **totalSteps:** Total number of signing steps in workflow
-   **currentStep:** Which step is currently active (SEQUENTIAL mode)

### Q: Can I sort the results?

**A:** Currently sorted by `createdAt DESC`. Custom sorting coming in future version.

---

## Related Documentation

-   [User Document List API](./USER_DOCUMENT_LIST_API.md) - List endpoints for regular users
-   [Admin Document Detail API](./ADMIN_DOCUMENT_DETAIL_API.md) - Full document details for admin
-   [Admin Batch APIs](./ADMIN_BATCH_APIS.md) - Batch operations documentation

---

## Changelog

### v2.0.0 (2026-01-08)

-   ✅ Enhanced filtering with 12+ parameters
-   ✅ Full-text search across title and creator info
-   ✅ Date range filtering
-   ✅ Batch ID filtering
-   ✅ Template filtering
-   ✅ Optimized response format
-   ✅ Added progress fields (totalSigners, completedSigners)
-   ✅ Added file URLs for download capability
