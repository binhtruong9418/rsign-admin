# Admin Frontend Integration Guide

> **API Base URL:** `http://localhost:5531/api`  
> **Auth:** Bearer Token (JWT) - Role: `ADMIN`

---

## 1. 📝 Edit Document (DRAFT Only)

### Endpoint

```
PUT /api/admin/documents/:documentId
```

### Headers

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Request Body (All Optional)

```typescript
{
  title?: string;
  fileUrl?: string;
  deadline?: string;  // ISO 8601
  signingFlow?: "PARALLEL" | "SEQUENTIAL";
  signatureZones?: Array<{
    pageNumber: number;
    x: number;        // 0-100 (%)
    y: number;        // 0-100 (%)
    width: number;    // 0-100 (%)
    height: number;   // 0-100 (%)
    label?: string;
  }>;
  signingSteps?: Array<{
    stepOrder: number;
    signers: Array<{
      userId: string;
      zoneIndex: number;  // 0-based index
    }>;
  }>;
}
```

### Response

```json
{
    "success": true,
    "document": {
        "id": "uuid",
        "title": "...",
        "status": "DRAFT",
        "signingMode": "SHARED",
        "signingFlow": "SEQUENTIAL",
        "totalSteps": 2
    }
}
```

### Errors

```json
// 400 - Not DRAFT
{
  "success": false,
  "message": "Only documents in DRAFT status can be edited",
  "statusCode": 400
}

// 400 - Invalid zone index
{
  "success": false,
  "message": "Invalid zoneIndex: 5. Must be between 0 and 3",
  "statusCode": 400
}
```

### UI Implementation

**Check status before allowing edit:**

```typescript
const canEdit = document.status === "DRAFT";

// Show edit button only for DRAFT
{canEdit && (
  <Button onClick={handleEdit}>
    <PencilIcon /> Edit
  </Button>
)}
```

**Validate before submit:**

```typescript
const validateEdit = (data: EditDocumentForm) => {
    if (data.signatureZones && data.signingSteps) {
        const totalZones = data.signatureZones.length;

        // Check zone indices
        data.signingSteps.forEach((step) => {
            step.signers.forEach((signer) => {
                if (signer.zoneIndex >= totalZones) {
                    throw new Error(`Invalid zone index ${signer.zoneIndex}`);
                }
            });
        });

        // Check duplicate zones
        const usedZones = new Set<number>();
        data.signingSteps.forEach((step) => {
            step.signers.forEach((signer) => {
                if (usedZones.has(signer.zoneIndex)) {
                    throw new Error(`Zone ${signer.zoneIndex} assigned twice`);
                }
                usedZones.add(signer.zoneIndex);
            });
        });
    }
};
```

**API Call:**

```typescript
const editDocument = async (documentId: string, data: EditDocumentForm) => {
    const response = await fetch(
        `${API_URL}/api/admin/documents/${documentId}`,
        {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
    }

    return response.json();
};
```

---

## 2. 👁️ View Declined Signatures

### Endpoint

```
GET /api/admin/documents/:documentId
```

### Response (with declined signatures)

```json
{
    "id": "doc-uuid",
    "title": "Contract 2026",
    "status": "IN_PROGRESS",
    "steps": [
        {
            "stepOrder": 1,
            "signers": [
                {
                    "id": "signer-1",
                    "user": {
                        "fullName": "John Doe",
                        "email": "john@example.com"
                    },
                    "status": "SIGNED",
                    "signedAt": "2026-01-15T10:30:00Z"
                },
                {
                    "id": "signer-2",
                    "user": {
                        "fullName": "Jane Smith",
                        "email": "jane@example.com"
                    },
                    "status": "DECLINED",
                    "declinedAt": "2026-01-16T14:20:00Z",
                    "declineReason": "I don't agree with clause 3.2..."
                }
            ]
        }
    ]
}
```

### UI Components

**Signer Status Badge:**

```tsx
const getStatusBadge = (status: string) => {
    const styles = {
        SIGNED: "bg-green-100 text-green-800",
        DECLINED: "bg-red-100 text-red-800",
        PENDING: "bg-yellow-100 text-yellow-800",
        WAITING: "bg-gray-100 text-gray-800",
    };

    const labels = {
        SIGNED: "✓ Signed",
        DECLINED: "✗ Declined",
        PENDING: "⏳ Pending",
        WAITING: "⏸ Waiting",
    };

    return (
        <span className={`px-2 py-1 rounded text-sm ${styles[status]}`}>
            {labels[status]}
        </span>
    );
};
```

**Declined Info Display:**

```tsx
{
    signer.status === "DECLINED" && (
        <Alert variant="warning" className="mt-3">
            <AlertTriangle className="h-4 w-4" />
            <div className="ml-2">
                <p className="font-medium">Declined Reason:</p>
                <p className="text-sm mt-1">{signer.declineReason}</p>
                <p className="text-xs text-gray-500 mt-2">
                    {formatDate(signer.declinedAt)}
                </p>
            </div>
        </Alert>
    );
}
```

**Progress Bar with Declined:**

```tsx
const calculateProgress = (signers: Signer[]) => {
    const total = signers.length;
    const signed = signers.filter((s) => s.status === "SIGNED").length;
    const declined = signers.filter((s) => s.status === "DECLINED").length;
    const pending = signers.filter((s) => s.status === "PENDING").length;

    return {
        total,
        signed,
        declined,
        pending,
        signedPercent: (signed / total) * 100,
        declinedPercent: (declined / total) * 100,
        pendingPercent: (pending / total) * 100,
    };
};

<div className="w-full h-3 bg-gray-200 rounded-full flex overflow-hidden">
    <div
        className="bg-green-500"
        style={{ width: `${progress.signedPercent}%` }}
    />
    <div
        className="bg-red-500"
        style={{ width: `${progress.declinedPercent}%` }}
    />
    <div
        className="bg-yellow-500"
        style={{ width: `${progress.pendingPercent}%` }}
    />
</div>;
```

**Statistics Summary:**

```tsx
const DocumentStats = ({ signers }: { signers: Signer[] }) => {
    const stats = calculateProgress(signers);

    return (
        <div className="grid grid-cols-4 gap-4">
            <StatCard label="Total" value={stats.total} icon={<Users />} />
            <StatCard
                label="Signed"
                value={stats.signed}
                icon={<CheckCircle />}
                color="green"
            />
            <StatCard
                label="Declined"
                value={stats.declined}
                icon={<XCircle />}
                color="red"
            />
            <StatCard
                label="Pending"
                value={stats.pending}
                icon={<Clock />}
                color="yellow"
            />
        </div>
    );
};
```

---

## 3. 📊 Audit Logs (Decline Events)

**Filter decline events:**

```typescript
const declineEvents = auditLogs.filter(
    (log) => log.eventType === "SIGNATURE_DECLINED"
);
```

**Timeline Display:**

```tsx
{
    declineEvents.map((log, idx) => (
        <div key={idx} className="flex gap-3 border-l-2 pl-4 pb-4">
            <XCircle className="text-red-500 mt-1" />
            <div className="flex-1">
                <p className="font-medium">
                    {log.actor.fullName} declined to sign
                </p>
                <div className="mt-2 p-3 bg-red-50 rounded border-l-4 border-red-500">
                    <p className="text-sm font-medium">Reason:</p>
                    <p className="text-sm mt-1">{log.metadata.reason}</p>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                    {formatDateTime(log.timestamp)}
                </p>
            </div>
        </div>
    ));
}
```

---

## 4. 🔍 Document List Filters

**Filter by declined status:**

```typescript
const DocumentListPage = () => {
  const [filters, setFilters] = useState({
    status: '',
    hasDeclined: false,
  });

  // Backend should support this filter
  const { data } = useQuery({
    queryKey: ['documents', filters],
    queryFn: () => fetchDocuments({
      ...filters,
      page: 0,
      limit: 10,
    }),
  });

  return (
    <div>
      <Filters>
        <Select
          value={filters.status}
          onChange={(e) => setFilters(prev => ({
            ...prev,
            status: e.target.value
          }))}
        >
          <option value="">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="PENDING">Pending</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
        </Select>

        <Checkbox
          checked={filters.hasDeclined}
          onChange={(e) => setFilters(prev => ({
            ...prev,
            hasDeclined: e.target.checked
          }))}
          label="Has declined signatures"
        />
      </Filters>

      <DocumentTable data={data.documents} />
    </div>
  );
};
```

---

## 5. TypeScript Types

```typescript
interface DocumentSigner {
    id: string;
    user: {
        id: string;
        fullName: string;
        email: string;
    };
    status: "WAITING" | "PENDING" | "SIGNED" | "DECLINED";
    signatureZone?: SignatureZone;
    signedAt?: string;
    declinedAt?: string;
    declineReason?: string;
}

interface EditDocumentForm {
    title?: string;
    fileUrl?: string;
    deadline?: string;
    signingFlow?: "PARALLEL" | "SEQUENTIAL";
    signatureZones?: SignatureZone[];
    signingSteps?: SigningStep[];
}

interface SignatureZone {
    pageNumber: number;
    x: number;
    y: number;
    width: number;
    height: number;
    label?: string;
}

interface SigningStep {
    stepOrder: number;
    signers: Array<{
        userId: string;
        zoneIndex: number;
    }>;
}
```

---

## 6. Error Handling

```typescript
const handleApiError = (error: any) => {
    const message = error.response?.data?.message || error.message;

    if (message.includes("DRAFT status")) {
        toast.error("Can only edit documents in DRAFT status");
    } else if (message.includes("Invalid zoneIndex")) {
        toast.error("Invalid signature zone assignment");
    } else if (message.includes("assigned to multiple")) {
        toast.error("Each zone can only be assigned once");
    } else {
        toast.error(message || "An error occurred");
    }
};
```

---

## 7. Quick Checklist

**Edit Document:**

- [ ] Only show edit button for DRAFT status
- [ ] Validate zone indices before submit
- [ ] Show success message after edit
- [ ] Refresh document detail after success

**View Declined:**

- [ ] Show declined badge with red color
- [ ] Display decline reason in alert box
- [ ] Show decline timestamp
- [ ] Include in progress calculations
- [ ] Show in audit logs timeline

**General:**

- [ ] Handle 401 (redirect to login)
- [ ] Handle 403 (show permission error)
- [ ] Handle 404 (show not found)
- [ ] Loading states for API calls
- [ ] Error messages user-friendly

---

## Support

- **Swagger:** http://localhost:5531/swagger-ui
- **Backend Team:** backend-team@example.com
