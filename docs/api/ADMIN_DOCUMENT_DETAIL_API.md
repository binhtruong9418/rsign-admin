# Admin Document Detail API

Tài liệu chi tiết về API lấy thông tin document dành cho admin với đầy đủ monitoring capabilities.

## Tổng quan

Admin có **1 API duy nhất** để xem toàn bộ thông tin document với quyền cao nhất:

| API              | Endpoint                   | Use Case                  | Response Size |
| ---------------- | -------------------------- | ------------------------- | ------------- |
| **Admin Detail** | `GET /admin/documents/:id` | Full monitoring & control | ~10-15KB      |

**Đặc điểm:**

-   ✅ Xem được tất cả signatures với playback
-   ✅ Full audit trail (tất cả activities)
-   ✅ Timeline milestones
-   ✅ Flat signers list (dễ monitoring)
-   ✅ Verification data (IP, device)

---

## Admin Document Detail

### Endpoint

```
GET /admin/documents/:documentId
```

### Authorization

```
Bearer <JWT_TOKEN>
```

Required roles: `ADMIN`

### Use Case

API này dùng cho **admin dashboard** để:

-   Monitor tiến độ ký của document
-   Xem chi tiết từng chữ ký (preview, playback, verification)
-   Audit trail đầy đủ (ai làm gì, khi nào)
-   Timeline tracking
-   Troubleshooting issues

### Request Example

```bash
curl -X GET \
  'https://api.rsign.com/admin/documents/123e4567-e89b-12d3-a456-426614174000' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

### Response Schema

```typescript
{
  document: {
    id: string;
    title: string;
    status: 'DRAFT' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    mode: 'INDIVIDUAL' | 'SHARED';
    flow: 'PARALLEL' | 'SEQUENTIAL';
    createdAt: string;           // ISO 8601
    createdBy: {
      id: string;
      fullName: string;
      email: string;
    };
    deadline: string | null;     // ISO 8601
    completedAt: string | null;  // ISO 8601
  };

  files: {
    original: string;            // URL
    signed: string | null;       // URL
    contentHash: string;         // SHA256
  };

  progress: {
    current: number;             // Current step
    total: number;               // Total steps
    signed: number;              // Số người đã ký
    declined: number;            // Số người từ chối
    pending: number;             // Số người chưa ký
    percentage: number;          // % hoàn thành (0-100)
  };

  timeline: {
    created: {
      at: string;                // ISO 8601
      by: {
        id: string;
        fullName: string;
        email: string;
      };
    };
    deadline?: string;           // ISO 8601
    isOverdue?: boolean;
    completed?: string;          // ISO 8601
  };

  signers: Array<{               // Flat list - dễ scan
    id: string;
    user: {
      id: string;
      fullName: string;
      email: string;
    };
    status: 'WAITING' | 'PENDING' | 'SIGNED' | 'DECLINED';
    signedAt: string | null;     // ISO 8601
    stepOrder: number;
    zoneId: string;
  }>;

  zones: Array<{
    id: string;
    page: number;
    position: {
      x: number;
      y: number;
      w: number;
      h: number;
    };
    label: string | null;
    signer?: {                   // Nếu đã assign
      id: string;
      user: {
        id: string;
        fullName: string;
        email: string;
      };
      status: 'WAITING' | 'PENDING' | 'SIGNED' | 'DECLINED';
      signedAt: string | null;
      signature?: {              // Nếu đã ký
        previewUrl: string;      // Lazy-loaded SVG
        hash: string;            // SHA256
        playback: {              // Animation data
          strokes: Array<{
            points: Array<{ x: number; y: number }>;
          }>;
          color: string;
          width: number;
        };
      };
      ip?: string;               // Verification
      device?: {
        fingerprint: string;
        userAgent: string;
      };
    };
  }>;

  steps: Array<{
    order: number;
    status: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED';
    signers: Array<{
      id: string;
      user: {
        id: string;
        fullName: string;
        email: string;
      };
      status: 'WAITING' | 'PENDING' | 'SIGNED' | 'DECLINED';
      signedAt: string | null;
      zoneId: string;
    }>;
  }>;

  activities: Array<{
    type: 'DOCUMENT_CREATED' | 'DOCUMENT_SENT' | 'SESSION_CREATED' |
          'SIGNATURE_APPLIED' | 'SIGNATURE_DECLINED' | 'STEP_COMPLETED' |
          'DOCUMENT_COMPLETED' | 'DOCUMENT_VIEWED' | 'SESSION_EXPIRED';
    time: string;                // ISO 8601
    actor: {
      id: string;
      fullName: string;
      email: string;
    } | null;
    description: string;
    metadata: Record<string, any>;
  }>;

  batchId?: string;              // Nếu là INDIVIDUAL mode
  assignedTo?: {                 // Nếu là INDIVIDUAL mode
    id: string;
    fullName: string;
    email: string;
  };
  template?: {                   // Nếu là template
    name: string;
  };
}
```

### Response Example

```json
{
    "document": {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "title": "Hợp đồng thuê nhà 2026 - Batch #1",
        "status": "IN_PROGRESS",
        "mode": "SHARED",
        "flow": "SEQUENTIAL",
        "createdAt": "2026-01-08T10:00:00Z",
        "createdBy": {
            "id": "admin-001",
            "fullName": "Nguyễn Quản Trị",
            "email": "admin@example.com"
        },
        "deadline": "2026-01-15T23:59:59Z",
        "completedAt": null
    },
    "files": {
        "original": "https://storage.rsign.com/documents/contract-original.pdf",
        "signed": null,
        "contentHash": "sha256:a1b2c3d4e5f6789..."
    },
    "progress": {
        "current": 2,
        "total": 3,
        "signed": 2,
        "declined": 0,
        "pending": 1,
        "percentage": 67
    },
    "timeline": {
        "created": {
            "at": "2026-01-08T10:00:00Z",
            "by": {
                "id": "admin-001",
                "fullName": "Nguyễn Quản Trị",
                "email": "admin@example.com"
            }
        },
        "deadline": "2026-01-15T23:59:59Z",
        "isOverdue": false
    },
    "signers": [
        {
            "id": "signer-001",
            "user": {
                "id": "user-100",
                "fullName": "Nguyễn Văn A",
                "email": "nguyenvana@example.com"
            },
            "status": "SIGNED",
            "signedAt": "2026-01-08T11:30:00Z",
            "stepOrder": 1,
            "zoneId": "zone-001"
        },
        {
            "id": "signer-002",
            "user": {
                "id": "user-200",
                "fullName": "Trần Thị B",
                "email": "tranthib@example.com"
            },
            "status": "SIGNED",
            "signedAt": "2026-01-08T14:15:00Z",
            "stepOrder": 2,
            "zoneId": "zone-002"
        },
        {
            "id": "signer-003",
            "user": {
                "id": "user-300",
                "fullName": "Lê Văn C",
                "email": "levanc@example.com"
            },
            "status": "PENDING",
            "signedAt": null,
            "stepOrder": 2,
            "zoneId": "zone-003"
        }
    ],
    "zones": [
        {
            "id": "zone-001",
            "page": 5,
            "position": { "x": 100, "y": 500, "w": 150, "h": 50 },
            "label": "Chữ ký bên cho thuê",
            "signer": {
                "id": "signer-001",
                "user": {
                    "id": "user-100",
                    "fullName": "Nguyễn Văn A",
                    "email": "nguyenvana@example.com"
                },
                "status": "SIGNED",
                "signedAt": "2026-01-08T11:30:00Z",
                "signature": {
                    "previewUrl": "/api/signatures/signer-001/preview",
                    "hash": "sha256:abc123def456...",
                    "playback": {
                        "strokes": [
                            {
                                "points": [
                                    { "x": 0, "y": 0 },
                                    { "x": 10, "y": 5 },
                                    { "x": 20, "y": 10 }
                                ]
                            }
                        ],
                        "color": "#000000",
                        "width": 2
                    }
                },
                "ip": "192.168.1.100",
                "device": {
                    "fingerprint": "fp_abc123xyz789",
                    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)..."
                }
            }
        },
        {
            "id": "zone-002",
            "page": 5,
            "position": { "x": 300, "y": 500, "w": 150, "h": 50 },
            "label": "Chữ ký bên thuê 1",
            "signer": {
                "id": "signer-002",
                "user": {
                    "id": "user-200",
                    "fullName": "Trần Thị B",
                    "email": "tranthib@example.com"
                },
                "status": "SIGNED",
                "signedAt": "2026-01-08T14:15:00Z",
                "signature": {
                    "previewUrl": "/api/signatures/signer-002/preview",
                    "hash": "sha256:def789ghi012...",
                    "playback": {
                        "strokes": [
                            {
                                "points": [
                                    { "x": 0, "y": 0 },
                                    { "x": 15, "y": 8 }
                                ]
                            }
                        ],
                        "color": "#0000FF",
                        "width": 2
                    }
                },
                "ip": "192.168.1.200",
                "device": {
                    "fingerprint": "fp_def456abc123",
                    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)..."
                }
            }
        },
        {
            "id": "zone-003",
            "page": 5,
            "position": { "x": 500, "y": 500, "w": 150, "h": 50 },
            "label": "Chữ ký bên thuê 2"
            // Không có signer - chưa ký
        }
    ],
    "steps": [
        {
            "order": 1,
            "status": "COMPLETED",
            "signers": [
                {
                    "id": "signer-001",
                    "user": {
                        "id": "user-100",
                        "fullName": "Nguyễn Văn A",
                        "email": "nguyenvana@example.com"
                    },
                    "status": "SIGNED",
                    "signedAt": "2026-01-08T11:30:00Z",
                    "zoneId": "zone-001"
                }
            ]
        },
        {
            "order": 2,
            "status": "IN_PROGRESS",
            "signers": [
                {
                    "id": "signer-002",
                    "user": {
                        "id": "user-200",
                        "fullName": "Trần Thị B",
                        "email": "tranthib@example.com"
                    },
                    "status": "SIGNED",
                    "signedAt": "2026-01-08T14:15:00Z",
                    "zoneId": "zone-002"
                },
                {
                    "id": "signer-003",
                    "user": {
                        "id": "user-300",
                        "fullName": "Lê Văn C",
                        "email": "levanc@example.com"
                    },
                    "status": "PENDING",
                    "signedAt": null,
                    "zoneId": "zone-003"
                }
            ]
        },
        {
            "order": 3,
            "status": "WAITING",
            "signers": []
        }
    ],
    "activities": [
        {
            "type": "DOCUMENT_CREATED",
            "time": "2026-01-08T10:00:00Z",
            "actor": {
                "id": "admin-001",
                "fullName": "Nguyễn Quản Trị",
                "email": "admin@example.com"
            },
            "description": "Document được tạo",
            "metadata": {
                "mode": "SHARED",
                "flow": "SEQUENTIAL"
            }
        },
        {
            "type": "DOCUMENT_SENT",
            "time": "2026-01-08T10:05:00Z",
            "actor": {
                "id": "admin-001",
                "fullName": "Nguyễn Quản Trị",
                "email": "admin@example.com"
            },
            "description": "Document được gửi cho 3 người ký",
            "metadata": {
                "totalSigners": 3
            }
        },
        {
            "type": "SESSION_CREATED",
            "time": "2026-01-08T11:25:00Z",
            "actor": {
                "id": "user-100",
                "fullName": "Nguyễn Văn A",
                "email": "nguyenvana@example.com"
            },
            "description": "Bắt đầu phiên ký",
            "metadata": {
                "sessionId": "session-abc123",
                "ipAddress": "192.168.1.100"
            }
        },
        {
            "type": "SIGNATURE_APPLIED",
            "time": "2026-01-08T11:30:00Z",
            "actor": {
                "id": "user-100",
                "fullName": "Nguyễn Văn A",
                "email": "nguyenvana@example.com"
            },
            "description": "Đã ký tại zone-001 trên trang 5",
            "metadata": {
                "signerId": "signer-001",
                "zoneId": "zone-001",
                "pageNumber": 5,
                "signatureHash": "sha256:abc123def456..."
            }
        },
        {
            "type": "STEP_COMPLETED",
            "time": "2026-01-08T11:30:01Z",
            "actor": null,
            "description": "Bước 1 hoàn thành",
            "metadata": {
                "stepOrder": 1
            }
        },
        {
            "type": "SESSION_CREATED",
            "time": "2026-01-08T14:10:00Z",
            "actor": {
                "id": "user-200",
                "fullName": "Trần Thị B",
                "email": "tranthib@example.com"
            },
            "description": "Bắt đầu phiên ký",
            "metadata": {
                "sessionId": "session-def456",
                "ipAddress": "192.168.1.200"
            }
        },
        {
            "type": "SIGNATURE_APPLIED",
            "time": "2026-01-08T14:15:00Z",
            "actor": {
                "id": "user-200",
                "fullName": "Trần Thị B",
                "email": "tranthib@example.com"
            },
            "description": "Đã ký tại zone-002 trên trang 5",
            "metadata": {
                "signerId": "signer-002",
                "zoneId": "zone-002",
                "pageNumber": 5,
                "signatureHash": "sha256:def789ghi012..."
            }
        }
    ]
}
```

### Error Responses

**403 Forbidden** - User không phải admin

```json
{
    "error": "Forbidden",
    "message": "Admin access required"
}
```

**404 Not Found** - Document không tồn tại

```json
{
    "error": "NotFound",
    "message": "Document not found"
}
```

---

## Data Sections Explained

### 1. Document Info

Thông tin cơ bản về document:

-   **status**: Trạng thái hiện tại
-   **mode**: INDIVIDUAL (mỗi người 1 bản) hoặc SHARED (chung 1 bản)
-   **flow**: PARALLEL (ký đồng thời) hoặc SEQUENTIAL (lần lượt)

### 2. Files

URLs và hash của files:

-   **original**: File gốc chưa ký
-   **signed**: File đã ký (null nếu chưa hoàn thành)
-   **contentHash**: SHA256 hash để verify integrity

### 3. Progress

Tổng quan tiến độ:

-   **current/total**: Đang ở step nào / tổng bao nhiêu steps
-   **signed/declined/pending**: Phân bổ người ký
-   **percentage**: % hoàn thành (0-100)

### 4. Timeline

Milestones quan trọng:

-   **created**: Ai tạo, khi nào
-   **deadline**: Hạn chót (nếu có)
-   **isOverdue**: Đã quá hạn chưa
-   **completed**: Khi nào hoàn thành (nếu đã xong)

### 5. Signers (Flat List)

Danh sách tất cả người ký, **không phân cấp theo steps**:

-   Dễ scan nhanh
-   Sort theo stepOrder nếu cần
-   Link đến zone qua zoneId

### 6. Zones

Chi tiết từng vị trí chữ ký trên PDF:

-   **position**: Tọa độ và kích thước
-   **signer**: Người được assign (nếu có)
-   **signature**: Preview + playback + hash (nếu đã ký)
-   **ip/device**: Verification data

### 7. Steps

Phân cấp theo workflow:

-   **order**: Thứ tự step
-   **status**: Trạng thái step
-   **signers**: Danh sách người trong step này

### 8. Activities

Audit trail đầy đủ:

-   Tất cả events (không chỉ của 1 user)
-   Chronological order
-   Metadata chi tiết

---

## Signature Preview & Playback

### Preview Image (Lazy Loading)

**Không inline SVG** trong response. Admin fetch riêng khi cần:

```html
<img src="/api/signatures/signer-001/preview" alt="Chữ ký" loading="lazy" />
```

**Endpoint:** `GET /api/signatures/:signerId/preview`

-   Response: SVG image
-   Cache: 1 year
-   Auth: Required

### Playback Animation

**Full stroke data** được include trong response:

```typescript
function SignaturePlayback({ playback }: { playback: any }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const animate = () => {
        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, 300, 150);
        ctx.strokeStyle = playback.color;
        ctx.lineWidth = playback.width;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        playback.strokes.forEach((stroke, i) => {
            setTimeout(() => {
                ctx.beginPath();
                stroke.points.forEach((p, j) => {
                    if (j === 0) ctx.moveTo(p.x, p.y);
                    else ctx.lineTo(p.x, p.y);
                });
                ctx.stroke();
            }, i * 200);
        });
    };

    return (
        <div>
            <canvas ref={canvasRef} width={300} height={150} />
            <button onClick={animate}>▶ Replay</button>
        </div>
    );
}
```

---

## Frontend Integration

### React Admin Dashboard Example

```typescript
import { useQuery } from "@tanstack/react-query";

function AdminDocumentDetail({ documentId }: { documentId: string }) {
    const { data, isLoading } = useQuery({
        queryKey: ["admin", "document", documentId],
        queryFn: () =>
            fetch(`/admin/documents/${documentId}`, {
                headers: { Authorization: `Bearer ${token}` },
            }).then((res) => res.json()),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    if (isLoading) return <Loading />;

    return (
        <div className="admin-document-detail">
            {/* Header */}
            <header>
                <h1>{data.document.title}</h1>
                <StatusBadge status={data.document.status} />
                {data.timeline.isOverdue && (
                    <Alert variant="warning">⚠️ Quá hạn deadline!</Alert>
                )}
            </header>

            {/* Progress Overview */}
            <section className="progress">
                <h2>Tiến độ</h2>
                <ProgressBar value={data.progress.percentage} />
                <div className="stats">
                    <StatCard
                        label="Đã ký"
                        value={data.progress.signed}
                        color="green"
                    />
                    <StatCard
                        label="Chưa ký"
                        value={data.progress.pending}
                        color="orange"
                    />
                    <StatCard
                        label="Từ chối"
                        value={data.progress.declined}
                        color="red"
                    />
                </div>
                <p>
                    Bước {data.progress.current} / {data.progress.total}
                </p>
            </section>

            {/* Timeline */}
            <section className="timeline">
                <h2>Timeline</h2>
                <Timeline>
                    <TimelineItem
                        icon="📝"
                        title="Tạo document"
                        time={data.timeline.created.at}
                        user={data.timeline.created.by.fullName}
                    />
                    {data.timeline.deadline && (
                        <TimelineItem
                            icon={data.timeline.isOverdue ? "🔴" : "⏰"}
                            title="Deadline"
                            time={data.timeline.deadline}
                            isOverdue={data.timeline.isOverdue}
                        />
                    )}
                    {data.timeline.completed && (
                        <TimelineItem
                            icon="✅"
                            title="Hoàn thành"
                            time={data.timeline.completed}
                        />
                    )}
                </Timeline>
            </section>

            {/* Signers Table */}
            <section className="signers">
                <h2>Người ký ({data.signers.length})</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Tên</th>
                            <th>Email</th>
                            <th>Bước</th>
                            <th>Trạng thái</th>
                            <th>Thời gian ký</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.signers.map((signer) => (
                            <tr key={signer.id}>
                                <td>{signer.user.fullName}</td>
                                <td>{signer.user.email}</td>
                                <td>Bước {signer.stepOrder}</td>
                                <td>
                                    <StatusBadge status={signer.status} />
                                </td>
                                <td>{formatDateTime(signer.signedAt)}</td>
                                <td>
                                    {signer.status === "SIGNED" && (
                                        <Button
                                            size="sm"
                                            onClick={() =>
                                                viewSignature(signer.zoneId)
                                            }>
                                            Xem chữ ký
                                        </Button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            {/* Zones with Signatures */}
            <section className="zones">
                <h2>Vị trí chữ ký</h2>
                <div className="zones-grid">
                    {data.zones.map((zone) => (
                        <ZoneCard key={zone.id} zone={zone}>
                            {zone.signer ? (
                                <>
                                    <SignaturePreview
                                        src={zone.signer.signature?.previewUrl}
                                    />
                                    <SignaturePlayback
                                        playback={
                                            zone.signer.signature?.playback
                                        }
                                    />
                                    <div className="verification">
                                        <p>
                                            Hash: {zone.signer.signature?.hash}
                                        </p>
                                        <p>IP: {zone.signer.ip}</p>
                                        <p>
                                            Device:{" "}
                                            {zone.signer.device?.fingerprint}
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <div className="empty-zone">Chưa ký</div>
                            )}
                        </ZoneCard>
                    ))}
                </div>
            </section>

            {/* Steps Flow */}
            <section className="steps">
                <h2>Workflow</h2>
                <Stepper currentStep={data.progress.current}>
                    {data.steps.map((step) => (
                        <Step
                            key={step.order}
                            order={step.order}
                            status={step.status}
                            signers={step.signers}
                        />
                    ))}
                </Stepper>
            </section>

            {/* Activity Log */}
            <section className="activities">
                <h2>Lịch sử hoạt động</h2>
                <ActivityTimeline activities={data.activities} />
            </section>

            {/* Files */}
            <section className="files">
                <h2>Files</h2>
                <FileCard
                    label="File gốc"
                    url={data.files.original}
                    hash={data.files.contentHash}
                />
                {data.files.signed && (
                    <FileCard
                        label="File đã ký"
                        url={data.files.signed}
                        badge="Completed"
                    />
                )}
            </section>
        </div>
    );
}
```

### Components Example

```typescript
// SignaturePreview Component
function SignaturePreview({ src }: { src?: string }) {
    if (!src) return null;

    return (
        <div className="signature-preview">
            <img
                src={src}
                alt="Signature preview"
                loading="lazy"
                style={{ maxWidth: 200, border: "1px solid #ccc" }}
            />
        </div>
    );
}

// ActivityTimeline Component
function ActivityTimeline({ activities }: { activities: any[] }) {
    return (
        <div className="activity-timeline">
            {activities.map((activity, i) => (
                <div key={i} className="activity-item">
                    <div className="activity-icon">
                        {getActivityIcon(activity.type)}
                    </div>
                    <div className="activity-content">
                        <h4>{activity.description}</h4>
                        {activity.actor && (
                            <p className="actor">
                                {activity.actor.fullName} (
                                {activity.actor.email})
                            </p>
                        )}
                        <time>{formatDateTime(activity.time)}</time>
                        {activity.metadata && (
                            <details>
                                <summary>Metadata</summary>
                                <pre>
                                    {JSON.stringify(activity.metadata, null, 2)}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

// Helper functions
function getActivityIcon(type: string) {
    const icons = {
        DOCUMENT_CREATED: "📝",
        DOCUMENT_SENT: "📧",
        SESSION_CREATED: "🔓",
        SIGNATURE_APPLIED: "✍️",
        SIGNATURE_DECLINED: "❌",
        STEP_COMPLETED: "✅",
        DOCUMENT_COMPLETED: "🎉",
        DOCUMENT_VIEWED: "👁️",
        SESSION_EXPIRED: "⏰",
    };
    return icons[type] || "•";
}
```

---

## Performance & Caching

### Response Metrics

-   **Size**: ~10-15KB (excluding SVG previews)
-   **Response Time**: 100-200ms
-   **Database Queries**: 3-4 queries with proper indexes

### Caching Strategy

**Server-side:**

```typescript
// Cache document data for 5 minutes
Cache-Control: private, max-age=300

// Activity logs có thể cache riêng với TTL ngắn hơn
Cache-Control: private, max-age=60
```

**Client-side (React Query):**

```typescript
const { data } = useQuery({
    queryKey: ["admin", "document", id],
    queryFn: fetchDocument,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // Keep in cache 30 min
    refetchInterval: 60 * 1000, // Auto-refresh every 1 min for active monitoring
});
```

**SVG Previews:**

```
Cache-Control: public, max-age=31536000, immutable
```

---

## Use Cases

### 1. Monitoring Dashboard

```typescript
// Real-time monitoring với auto-refresh
const { data } = useQuery({
    queryKey: ["admin", "document", id],
    queryFn: fetchDocument,
    refetchInterval: 30000, // 30 seconds
});
```

### 2. Troubleshooting

```typescript
// Analyze why document stuck
function analyzeProblem(data) {
    // Check overdue
    if (data.timeline.isOverdue) {
        console.log("⚠️ Document quá deadline");
    }

    // Check stuck signers
    const stuckSigners = data.signers.filter(
        (s) => s.status === "PENDING" && daysSince(data.document.createdAt) > 3
    );

    if (stuckSigners.length > 0) {
        console.log("⚠️ Người ký chưa ký:", stuckSigners);
    }

    // Check declined
    if (data.progress.declined > 0) {
        const declined = data.signers.filter((s) => s.status === "DECLINED");
        console.log("❌ Người từ chối:", declined);
    }
}
```

### 3. Signature Verification

```typescript
// Verify signature integrity
async function verifySignature(zone) {
    const signer = zone.signer;
    if (!signer?.signature) return;

    // Check hash
    const hash = await calculateHash(signer.signature.playback);
    if (hash !== signer.signature.hash) {
        alert("⚠️ Signature hash mismatch!");
    }

    // Check device
    console.log("Signed from IP:", signer.ip);
    console.log("Device:", signer.device.fingerprint);
}
```

### 4. Export Report

```typescript
// Generate PDF report
function generateReport(data) {
    return {
        title: data.document.title,
        status: data.document.status,
        completionRate: data.progress.percentage,
        timeline: {
            created: data.timeline.created.at,
            deadline: data.timeline.deadline,
            completed: data.timeline.completed,
        },
        signers: data.signers.map((s) => ({
            name: s.user.fullName,
            email: s.user.email,
            status: s.status,
            signedAt: s.signedAt,
        })),
        activities: data.activities,
    };
}
```

---

## Best Practices

### 1. Auto-refresh cho monitoring

```typescript
// Only refresh when tab is active
const { data } = useQuery({
    queryKey: ["admin", "document", id],
    queryFn: fetchDocument,
    refetchInterval: (data) => {
        // Nếu completed thì không cần refresh nữa
        if (data?.document.status === "COMPLETED") return false;
        // Nếu pending/in-progress thì refresh mỗi 30s
        return 30000;
    },
    refetchIntervalInBackground: false, // Tắt khi minimize tab
});
```

### 2. Filter & Search

```typescript
// Filter signers
const pendingSigners = data.signers.filter((s) => s.status === "PENDING");
const signedSigners = data.signers.filter((s) => s.status === "SIGNED");

// Search signer
const searchSigner = (query: string) => {
    return data.signers.filter(
        (s) =>
            s.user.fullName.toLowerCase().includes(query.toLowerCase()) ||
            s.user.email.toLowerCase().includes(query.toLowerCase())
    );
};
```

### 3. Export functionality

```typescript
// Export to CSV
function exportToCSV(data) {
    const rows = data.signers.map((s) => [
        s.user.fullName,
        s.user.email,
        s.stepOrder,
        s.status,
        s.signedAt || "N/A",
    ]);

    const csv = [["Name", "Email", "Step", "Status", "Signed At"], ...rows]
        .map((row) => row.join(","))
        .join("\n");

    downloadFile("signers.csv", csv);
}
```

### 4. Notifications

```typescript
// Check for issues
useEffect(() => {
    if (!data) return;

    // Notify overdue
    if (data.timeline.isOverdue && !notified) {
        showNotification({
            title: "Document quá hạn!",
            message: `${data.document.title} đã quá deadline`,
            type: "warning",
        });
        setNotified(true);
    }

    // Notify declined
    if (data.progress.declined > 0) {
        showNotification({
            title: "Có người từ chối ký",
            message: `${data.progress.declined} người đã từ chối`,
            type: "error",
        });
    }
}, [data]);
```

---

## Comparison: Admin vs User APIs

| Feature           | Admin API         | User Pending | User Completed    |
| ----------------- | ----------------- | ------------ | ----------------- |
| **Access Level**  | Full              | Own only     | Own only          |
| **Signers**       | All               | Current step | N/A               |
| **Signatures**    | All with playback | N/A          | Own with playback |
| **Activities**    | All events        | N/A          | Own events        |
| **Verification**  | IP, device        | N/A          | Basic             |
| **Timeline**      | Full milestones   | Basic        | N/A               |
| **Response Size** | 10-15KB           | 2-4KB        | 6-10KB            |
| **Use Case**      | Monitoring        | Signing prep | History review    |

---

## Migration Notes

Nếu bạn đang dùng service cũ `document.service.ts -> getDocumentById()`:

### Before

```typescript
// Old service trả cả user + admin data lẫn lộn
async getDocumentById(id: string) {
  return { /* mixed data */ };
}
```

### After

```typescript
// Tách rõ ràng admin endpoint
GET /admin/documents/:id      // Admin full access
GET /api/documents/:id/pending    // User pending
GET /api/documents/:id/completed  // User completed
```

---

## Troubleshooting

### Issue: Activities list quá dài

**Solution:** Implement pagination hoặc limit

```typescript
activities: data.activities.slice(0, 20); // First 20 only
```

### Issue: Response time chậm

**Solution:**

-   Check database indexes
-   Optimize populate queries
-   Consider pagination for large documents

### Issue: Signature preview không load

**Solution:**

-   Check CORS cho `/api/signatures/*` endpoint
-   Verify authentication header
-   Check image src URL format
