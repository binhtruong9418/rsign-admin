# Frontend Template API Integration Guide

## Overview

Hướng dẫn tích hợp các API Template mới cho Admin Frontend. Template system cho phép:

- Tạo và quản lý templates (mẫu documents)
- Sử dụng templates để tạo documents nhanh chóng với cấu trúc định sẵn
- Templates chỉ lưu structure (zones + số lượng signers), không lưu users cụ thể

## Base URL

```
https://api.rsign.com/api/admin
```

## Authentication

Tất cả requests đều cần JWT token trong header:

```javascript
headers: {
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json'
}
```

---

## TypeScript Types

```typescript
// Template Types
interface SignatureZone {
    id?: string;
    pageNumber: number;
    x: number;
    y: number;
    width: number;
    height: number;
    label?: string;
}

interface TemplateStep {
    id?: string;
    stepOrder: number;
    signerCount: number; // Số lượng signers cần thiết
    zoneIndices: number[]; // Các zone index mà step này sử dụng
}

interface Template {
    id: string;
    templateName: string;
    title: string;
    fileUrl: string;
    signingMode: "INDIVIDUAL" | "SHARED";
    signingFlow: "SEQUENTIAL" | "PARALLEL";
    totalSteps: number;
    signatureZones: SignatureZone[];
    signingSteps: TemplateStep[];
    description?: string;
    createdBy: {
        id: string;
        fullName: string;
        email: string;
    };
    createdAt: string;
    updatedAt: string;
}

interface TemplateListItem {
    id: string;
    templateName: string;
    title: string;
    signingMode: "INDIVIDUAL" | "SHARED";
    signingFlow: "SEQUENTIAL" | "PARALLEL";
    totalSteps: number;
    signatureZoneCount: number;
    createdBy: {
        id: string;
        fullName: string;
        email: string;
    };
    createdAt: string;
    updatedAt: string;
}

// Document from Template Types
interface DocumentSigner {
    userId: string;
    zoneIndex: number;
}

interface DocumentStep {
    stepOrder: number;
    signers: DocumentSigner[];
}

interface CreateDocumentFromTemplateRequest {
    templateId: string;
    title?: string; // Optional: override template title
    deadline?: string; // ISO 8601 format
    signingSteps: DocumentStep[];
    recipients?: {
        userIds?: string[];
        signerGroupId?: string;
    };
    sendImmediately?: boolean; // true = PENDING, false = DRAFT
}
```

---

## API Endpoints

### 1. Get Presigned URL for Template Upload

**Endpoint:** `POST /templates/upload-url`

**Description:** Lấy presigned URL để upload file PDF template lên storage.

**Request Body:**

```typescript
{
    fileName: string;
}
```

**Response:**

```typescript
{
    success: true;
    presignedUrl: string; // URL để upload file (PUT request)
    fileUrl: string; // URL của file sau khi upload (dùng khi create template)
}
```

**Frontend Example:**

```typescript
// Step 1: Get presigned URL
async function uploadTemplateFile(file: File): Promise<string> {
    // Get presigned URL
    const { presignedUrl, fileUrl } = await fetch(
        "/api/admin/templates/upload-url",
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ fileName: file.name }),
        },
    ).then((res) => res.json());

    // Upload file to presigned URL
    await fetch(presignedUrl, {
        method: "PUT",
        body: file,
        headers: {
            "Content-Type": "application/pdf",
        },
    });

    return fileUrl; // Return fileUrl to use in template creation
}

// Usage in React component
const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
        const fileUrl = await uploadTemplateFile(file);
        setTemplateFileUrl(fileUrl);
        toast.success("File uploaded successfully");
    } catch (error) {
        toast.error("Failed to upload file");
    } finally {
        setUploading(false);
    }
};
```

---

### 2. Create Template

**Endpoint:** `POST /templates`

**Description:** Tạo mới template với cấu trúc signature zones và signing steps.

**Request Body:**

```typescript
{
  templateName: string;           // Unique name
  title: string;                  // Document title (dùng làm default khi tạo document)
  fileUrl: string;                // From upload-url endpoint
  signingMode: 'INDIVIDUAL' | 'SHARED';
  signingFlow: 'SEQUENTIAL' | 'PARALLEL';
  signatureZones: SignatureZone[];
  signingSteps: TemplateStep[];
  description?: string;
}
```

**Response:**

```typescript
{
    success: true;
    template: Template;
}
```

**Frontend Example:**

```typescript
interface CreateTemplateFormData {
  templateName: string;
  title: string;
  fileUrl: string;
  signingMode: 'INDIVIDUAL' | 'SHARED';
  signingFlow: 'SEQUENTIAL' | 'PARALLEL';
  signatureZones: SignatureZone[];
  signingSteps: TemplateStep[];
  description?: string;
}

async function createTemplate(data: CreateTemplateFormData) {
  const response = await fetch('/api/admin/templates', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create template');
  }

  return response.json();
}

// React Component Example
function CreateTemplateForm() {
  const [formData, setFormData] = useState<CreateTemplateFormData>({
    templateName: '',
    title: '',
    fileUrl: '',
    signingMode: 'SHARED',
    signingFlow: 'SEQUENTIAL',
    signatureZones: [],
    signingSteps: [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const result = await createTemplate(formData);
      toast.success('Template created successfully');
      navigate(`/templates/${result.template.id}`);
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={formData.templateName}
        onChange={(e) => setFormData({ ...formData, templateName: e.target.value })}
        placeholder="Template Name (unique)"
        required
      />

      <input
        type="text"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        placeholder="Document Title"
        required
      />

      <select
        value={formData.signingMode}
        onChange={(e) => setFormData({ ...formData, signingMode: e.target.value as any })}
      >
        <option value="SHARED">Shared (One document, multiple signers)</option>
        <option value="INDIVIDUAL">Individual (Separate documents per signer)</option>
      </select>

      <select
        value={formData.signingFlow}
        onChange={(e) => setFormData({ ...formData, signingFlow: e.target.value as any })}
      >
        <option value="SEQUENTIAL">Sequential (Step by step)</option>
        <option value="PARALLEL">Parallel (All sign at once)</option>
      </select>

      {/* Zone editor component */}
      <SignatureZoneEditor
        zones={formData.signatureZones}
        onChange={(zones) => setFormData({ ...formData, signatureZones: zones })}
      />

      {/* Steps editor component */}
      <SigningStepsEditor
        steps={formData.signingSteps}
        totalZones={formData.signatureZones.length}
        onChange={(steps) => setFormData({ ...formData, signingSteps: steps })}
      />

      <button type="submit">Create Template</button>
    </form>
  );
}
```

**Example Request:**

```json
{
    "templateName": "Employment Contract 2024",
    "title": "Employment Contract",
    "fileUrl": "https://storage.../templates/contract.pdf",
    "signingMode": "SHARED",
    "signingFlow": "SEQUENTIAL",
    "signatureZones": [
        {
            "pageNumber": 1,
            "x": 100,
            "y": 500,
            "width": 200,
            "height": 60,
            "label": "Employee Signature"
        },
        {
            "pageNumber": 3,
            "x": 100,
            "y": 500,
            "width": 200,
            "height": 60,
            "label": "Manager Signature"
        }
    ],
    "signingSteps": [
        {
            "stepOrder": 1,
            "signerCount": 1,
            "zoneIndices": [0]
        },
        {
            "stepOrder": 2,
            "signerCount": 1,
            "zoneIndices": [1]
        }
    ],
    "description": "Standard employment contract for new hires"
}
```

---

### 3. List Templates

**Endpoint:** `GET /templates`

**Description:** Lấy danh sách templates với pagination, search và filter.

**Query Parameters:**

```typescript
{
  page?: number;              // Default: 1
  limit?: number;             // Default: 10
  search?: string;            // Search in templateName and title
  signingMode?: 'INDIVIDUAL' | 'SHARED';
  signingFlow?: 'SEQUENTIAL' | 'PARALLEL';
}
```

**Response:**

```typescript
{
  success: true;
  data: TemplateListItem[];
  total: number;
  page: number;
  limit: number;
}
```

**Frontend Example:**

```typescript
interface TemplateFilters {
  page: number;
  limit: number;
  search: string;
  signingMode?: 'INDIVIDUAL' | 'SHARED';
  signingFlow?: 'SEQUENTIAL' | 'PARALLEL';
}

async function fetchTemplates(filters: TemplateFilters) {
  const params = new URLSearchParams();
  params.append('page', filters.page.toString());
  params.append('limit', filters.limit.toString());
  if (filters.search) params.append('search', filters.search);
  if (filters.signingMode) params.append('signingMode', filters.signingMode);
  if (filters.signingFlow) params.append('signingFlow', filters.signingFlow);

  const response = await fetch(`/api/admin/templates?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  return response.json();
}

// React Component with useQuery (React Query)
function TemplateList() {
  const [filters, setFilters] = useState<TemplateFilters>({
    page: 1,
    limit: 10,
    search: '',
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['templates', filters],
    queryFn: () => fetchTemplates(filters),
  });

  if (isLoading) return <Spinner />;
  if (error) return <Error message={error.message} />;

  return (
    <div>
      <SearchBar
        value={filters.search}
        onChange={(search) => setFilters({ ...filters, search, page: 1 })}
        placeholder="Search templates..."
      />

      <FilterBar
        signingMode={filters.signingMode}
        signingFlow={filters.signingFlow}
        onChangeMode={(mode) => setFilters({ ...filters, signingMode: mode, page: 1 })}
        onChangeFlow={(flow) => setFilters({ ...filters, signingFlow: flow, page: 1 })}
      />

      <table>
        <thead>
          <tr>
            <th>Template Name</th>
            <th>Title</th>
            <th>Mode</th>
            <th>Flow</th>
            <th>Steps</th>
            <th>Zones</th>
            <th>Created By</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.data.map((template) => (
            <tr key={template.id}>
              <td>{template.templateName}</td>
              <td>{template.title}</td>
              <td><Badge>{template.signingMode}</Badge></td>
              <td><Badge>{template.signingFlow}</Badge></td>
              <td>{template.totalSteps}</td>
              <td>{template.signatureZoneCount}</td>
              <td>{template.createdBy.fullName}</td>
              <td>{formatDate(template.createdAt)}</td>
              <td>
                <ActionMenu template={template} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Pagination
        currentPage={data.page}
        totalPages={Math.ceil(data.total / data.limit)}
        onPageChange={(page) => setFilters({ ...filters, page })}
      />
    </div>
  );
}
```

---

### 4. Get Template Detail

**Endpoint:** `GET /templates/:id`

**Description:** Lấy chi tiết template bao gồm zones và steps structure.

**Response:**

```typescript
{
    success: true;
    template: Template;
}
```

**Frontend Example:**

```typescript
async function fetchTemplateById(templateId: string): Promise<Template> {
  const response = await fetch(`/api/admin/templates/${templateId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Template not found');
  }

  const result = await response.json();
  return result.template;
}

// React Component
function TemplateDetail({ templateId }: { templateId: string }) {
  const { data: template, isLoading } = useQuery({
    queryKey: ['template', templateId],
    queryFn: () => fetchTemplateById(templateId),
  });

  if (isLoading) return <Spinner />;
  if (!template) return <NotFound />;

  return (
    <div>
      <h1>{template.templateName}</h1>
      <p>{template.description}</p>

      <InfoCard>
        <InfoRow label="Title" value={template.title} />
        <InfoRow label="Signing Mode" value={template.signingMode} />
        <InfoRow label="Signing Flow" value={template.signingFlow} />
        <InfoRow label="Total Steps" value={template.totalSteps} />
        <InfoRow label="Created By" value={template.createdBy.fullName} />
      </InfoCard>

      <Section title="Signature Zones">
        <ZoneList zones={template.signatureZones} />
      </Section>

      <Section title="Signing Steps">
        <StepList
          steps={template.signingSteps}
          zones={template.signatureZones}
        />
      </Section>

      <ButtonGroup>
        <Button onClick={() => navigate(`/templates/${templateId}/edit`)}>
          Edit Template
        </Button>
        <Button onClick={() => handleDuplicate(templateId)}>
          Duplicate
        </Button>
        <Button onClick={() => navigate(`/documents/create?templateId=${templateId}`)}>
          Create Document from Template
        </Button>
        <Button variant="danger" onClick={() => handleDelete(templateId)}>
          Delete
        </Button>
      </ButtonGroup>
    </div>
  );
}
```

---

### 5. Update Template

**Endpoint:** `PUT /templates/:id`

**Description:** Cập nhật template. Partial update - chỉ gửi fields cần thay đổi.

**Request Body:**

```typescript
{
  templateName?: string;
  title?: string;
  fileUrl?: string;
  signingFlow?: 'SEQUENTIAL' | 'PARALLEL';
  signatureZones?: SignatureZone[];
  signingSteps?: TemplateStep[];
  description?: string;
}
```

**Note:** Không thể thay đổi `signingMode` sau khi template đã được tạo.

**Response:**

```typescript
{
    success: true;
    template: Template;
}
```

**Frontend Example:**

```typescript
async function updateTemplate(templateId: string, updates: Partial<Template>) {
  const response = await fetch(`/api/admin/templates/${templateId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return response.json();
}

// React Component
function EditTemplateForm({ templateId }: { templateId: string }) {
  const queryClient = useQueryClient();
  const { data: template } = useQuery({
    queryKey: ['template', templateId],
    queryFn: () => fetchTemplateById(templateId),
  });

  const [formData, setFormData] = useState<Partial<Template>>({});

  useEffect(() => {
    if (template) {
      setFormData({
        templateName: template.templateName,
        title: template.title,
        signingFlow: template.signingFlow,
        signatureZones: template.signatureZones,
        signingSteps: template.signingSteps,
        description: template.description,
      });
    }
  }, [template]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateTemplate(templateId, formData);
      queryClient.invalidateQueries(['template', templateId]);
      queryClient.invalidateQueries(['templates']);
      toast.success('Template updated successfully');
      navigate(`/templates/${templateId}`);
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Similar form fields as create, but signingMode is disabled */}
      <input
        type="text"
        value={formData.templateName}
        onChange={(e) => setFormData({ ...formData, templateName: e.target.value })}
      />

      <select
        value={formData.signingFlow}
        onChange={(e) => setFormData({ ...formData, signingFlow: e.target.value as any })}
      >
        <option value="SEQUENTIAL">Sequential</option>
        <option value="PARALLEL">Parallel</option>
      </select>

      <button type="submit">Update Template</button>
    </form>
  );
}
```

---

### 6. Delete Template

**Endpoint:** `DELETE /templates/:id`

**Description:** Xóa template. Sẽ fail nếu template đang được sử dụng bởi documents.

**Response:**

```typescript
{
    success: true;
    message: string;
}
```

**Error Response (Template in use):**

```typescript
{
    error: string;
    message: "Cannot delete template. Template is being used by 5 active documents";
}
```

**Frontend Example:**

```typescript
async function deleteTemplate(templateId: string) {
  const response = await fetch(`/api/admin/templates/${templateId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return response.json();
}

// React Component with confirmation dialog
function DeleteTemplateButton({ template }: { template: TemplateListItem }) {
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    const confirmed = await confirmDialog({
      title: 'Delete Template',
      message: `Are you sure you want to delete "${template.templateName}"?`,
      confirmText: 'Delete',
      confirmVariant: 'danger',
    });

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await deleteTemplate(template.id);
      queryClient.invalidateQueries(['templates']);
      toast.success('Template deleted successfully');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Button
      variant="danger"
      onClick={handleDelete}
      loading={isDeleting}
    >
      Delete
    </Button>
  );
}
```

---

### 7. Duplicate Template

**Endpoint:** `POST /templates/:id/duplicate`

**Description:** Nhân bản template với tên mới.

**Request Body:**

```typescript
{
    newTemplateName: string;
}
```

**Response:**

```typescript
{
    success: true;
    template: Template;
}
```

**Frontend Example:**

```typescript
async function duplicateTemplate(templateId: string, newName: string) {
  const response = await fetch(`/api/admin/templates/${templateId}/duplicate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ newTemplateName: newName }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return response.json();
}

// React Component
function DuplicateTemplateDialog({ template }: { template: Template }) {
  const [newName, setNewName] = useState(`${template.templateName} - Copy`);
  const queryClient = useQueryClient();

  const handleDuplicate = async () => {
    try {
      const result = await duplicateTemplate(template.id, newName);
      queryClient.invalidateQueries(['templates']);
      toast.success('Template duplicated successfully');
      navigate(`/templates/${result.template.id}`);
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <Dialog>
      <DialogTitle>Duplicate Template</DialogTitle>
      <DialogContent>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New template name"
          required
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleDuplicate}>Duplicate</Button>
      </DialogActions>
    </Dialog>
  );
}
```

---

### 8. Create Document from Template

**Endpoint:** `POST /documents/from-template`

**Description:** Tạo document từ template, gán actual users vào zones và steps.

**Request Body:**

```typescript
{
  templateId: string;
  title?: string;              // Optional: override template title
  deadline?: string;           // ISO 8601 format
  signingSteps: DocumentStep[];
  recipients?: {
    userIds?: string[];
    signerGroupId?: string;
  };
  sendImmediately?: boolean;   // true = PENDING, false = DRAFT
}
```

**Response:**

```typescript
{
    success: true;
    document: Document; // or documents: Document[] for INDIVIDUAL mode
}
```

**Validation Rules:**

1. Số lượng signing steps phải match template
2. Mỗi step phải có đúng số signers theo `signerCount` của template
3. Zone indices trong signers phải match `zoneIndices` của template step

**Frontend Example:**

```typescript
// Step component để user chọn signers cho mỗi step
function StepSignerSelector({
  step,
  templateStep,
  zones,
  onChange
}: {
  step: DocumentStep;
  templateStep: TemplateStep;
  zones: SignatureZone[];
  onChange: (step: DocumentStep) => void;
}) {
  const [signers, setSigners] = useState<DocumentSigner[]>([]);

  useEffect(() => {
    // Initialize with empty signers based on template signerCount
    if (signers.length === 0) {
      const initialSigners = Array.from({ length: templateStep.signerCount }, (_, i) => ({
        userId: '',
        zoneIndex: templateStep.zoneIndices[i] || 0,
      }));
      setSigners(initialSigners);
    }
  }, [templateStep]);

  const handleSignerChange = (index: number, userId: string, zoneIndex: number) => {
    const updated = [...signers];
    updated[index] = { userId, zoneIndex };
    setSigners(updated);
    onChange({ stepOrder: step.stepOrder, signers: updated });
  };

  return (
    <div className="step-signer-selector">
      <h3>Step {step.stepOrder}</h3>
      <p>Required signers: {templateStep.signerCount}</p>
      <p>Available zones: {templateStep.zoneIndices.map(i => zones[i].label).join(', ')}</p>

      {signers.map((signer, index) => (
        <div key={index} className="signer-row">
          <label>Signer {index + 1}:</label>
          <UserSelect
            value={signer.userId}
            onChange={(userId) => handleSignerChange(index, userId, signer.zoneIndex)}
            placeholder="Select user"
          />

          <select
            value={signer.zoneIndex}
            onChange={(e) => handleSignerChange(index, signer.userId, parseInt(e.target.value))}
          >
            {templateStep.zoneIndices.map((zoneIdx) => (
              <option key={zoneIdx} value={zoneIdx}>
                {zones[zoneIdx].label || `Zone ${zoneIdx}`}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}

// Main form component
function CreateDocumentFromTemplate({ templateId }: { templateId: string }) {
  const { data: template } = useQuery({
    queryKey: ['template', templateId],
    queryFn: () => fetchTemplateById(templateId),
  });

  const [formData, setFormData] = useState<CreateDocumentFromTemplateRequest>({
    templateId,
    title: '',
    deadline: '',
    signingSteps: [],
    sendImmediately: false,
  });

  useEffect(() => {
    if (template) {
      // Initialize with template title and empty steps
      setFormData({
        ...formData,
        title: template.title,
        signingSteps: template.signingSteps.map(step => ({
          stepOrder: step.stepOrder,
          signers: Array.from({ length: step.signerCount }, (_, i) => ({
            userId: '',
            zoneIndex: step.zoneIndices[i] || 0,
          })),
        })),
      });
    }
  }, [template]);

  const handleStepChange = (stepOrder: number, updatedStep: DocumentStep) => {
    const updated = formData.signingSteps.map(step =>
      step.stepOrder === stepOrder ? updatedStep : step
    );
    setFormData({ ...formData, signingSteps: updated });
  };

  const validateForm = (): boolean => {
    // Check all steps have all signers assigned
    for (const step of formData.signingSteps) {
      if (step.signers.some(s => !s.userId)) {
        toast.error('Please assign all signers');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const response = await fetch('/api/admin/documents/from-template', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const result = await response.json();
      toast.success('Document created successfully');
      navigate(`/documents/${result.document.id}`);
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (!template) return <Spinner />;

  return (
    <form onSubmit={handleSubmit}>
      <h1>Create Document from Template: {template.templateName}</h1>

      <input
        type="text"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        placeholder="Document title (optional)"
      />

      <input
        type="datetime-local"
        value={formData.deadline}
        onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
      />

      <div className="signing-steps">
        {formData.signingSteps.map((step, index) => (
          <StepSignerSelector
            key={index}
            step={step}
            templateStep={template.signingSteps[index]}
            zones={template.signatureZones}
            onChange={(updatedStep) => handleStepChange(step.stepOrder, updatedStep)}
          />
        ))}
      </div>

      <label>
        <input
          type="checkbox"
          checked={formData.sendImmediately}
          onChange={(e) => setFormData({ ...formData, sendImmediately: e.target.checked })}
        />
        Send immediately (otherwise save as draft)
      </label>

      <button type="submit">Create Document</button>
    </form>
  );
}
```

---

## Error Handling

### Common Error Responses

```typescript
interface ErrorResponse {
  error: string;          // Error type
  message: string;        // Human-readable message
}

// Example errors:
{
  error: "NotFoundError",
  message: "Template not found"
}

{
  error: "BadRequestError",
  message: "Template name 'Contract V2' already exists"
}

{
  error: "BadRequestError",
  message: "Step 1 requires 2 signers, but 1 provided"
}

{
  error: "BadRequestError",
  message: "Cannot delete template. Template is being used by 5 active documents"
}
```

### Frontend Error Handler

```typescript
async function apiRequest<T>(
    url: string,
    options: RequestInit = {},
): Promise<T> {
    const response = await fetch(url, {
        ...options,
        headers: {
            Authorization: `Bearer ${getToken()}`,
            "Content-Type": "application/json",
            ...options.headers,
        },
    });

    if (!response.ok) {
        const error: ErrorResponse = await response.json();

        // Map error types to user-friendly messages
        const errorMessages: Record<string, string> = {
            NotFoundError: "Resource not found",
            BadRequestError: error.message,
            UnauthorizedError: "Please login again",
            ForbiddenError: "You do not have permission",
        };

        const message = errorMessages[error.error] || "An error occurred";
        throw new Error(message);
    }

    return response.json();
}
```

---

## UI/UX Flow Examples

### Flow 1: Create Template from Scratch

1. **Upload PDF**: User clicks "Create Template" → selects PDF file
2. **File Upload**: Show progress bar during upload
3. **Template Form**: After upload, show form with:
    - Template name (unique)
    - Document title
    - Signing mode (INDIVIDUAL/SHARED)
    - Signing flow (SEQUENTIAL/PARALLEL)
    - Description
4. **Zone Editor**: PDF viewer with drag-and-drop zone placement
    - Show PDF pages
    - Click to add zones
    - Drag to position/resize zones
    - Label each zone
5. **Steps Configuration**:
    - Add steps with order
    - For each step: set signerCount and select which zones to use
    - Validate: each zone should be used by at least one step
6. **Submit**: Create template → redirect to template detail page

### Flow 2: Create Document from Template

1. **Select Template**: From templates list or template detail page
2. **Review Structure**: Show template structure (zones, steps)
3. **Assign Users**: For each step:
    - Show required signer count
    - Show available zones
    - User selects signers and assigns to zones
4. **Configure Document**:
    - Override title (optional)
    - Set deadline
    - Choose to send immediately or save as draft
5. **Submit**: Create document → redirect to document detail/list

### Flow 3: Duplicate & Modify Template

1. **Duplicate**: From template detail, click "Duplicate"
2. **Name New Template**: Enter new unique name
3. **Edit Structure**: Modify zones/steps if needed
4. **Save**: Create new template

---

## Validation & Business Rules

### Template Creation

- ✅ Template name must be unique
- ✅ `signingMode` is immutable after creation
- ✅ Each step must have `signerCount >= 1`
- ✅ Zone indices must be valid (0 to zones.length - 1)
- ✅ At least 1 signature zone required
- ✅ At least 1 signing step required

### Template Update

- ✅ Cannot change `signingMode`
- ✅ New template name must be unique (if changing)
- ✅ Same validation rules as creation for zones/steps

### Template Deletion

- ✅ Cannot delete if used by active documents
- ✅ Active = status NOT IN (COMPLETED, CANCELLED)

### Document from Template

- ✅ Must provide exact number of steps as template
- ✅ Each step must have exact `signerCount` from template
- ✅ Zone indices must match template's `zoneIndices` for each step
- ✅ All user IDs must exist
- ✅ Deadline must be in the future (optional validation)

---

## Best Practices

### 1. Template Naming Convention

```typescript
// Good
"Employment Contract 2024"
"NDA - Standard v2"
"Vendor Agreement Template"

// Avoid
"template1"
"test"
"Contract" (too generic)
```

### 2. Zone Labels

```typescript
// Be specific and descriptive
"Employee Signature";
"Manager Approval";
"Legal Department Review";

// Avoid
"Zone 1";
"Signature";
"Sign here";
```

### 3. State Management

```typescript
// Use React Query for server state
const { data, isLoading, error } = useQuery(["template", id], fetchTemplate);

// Use local state for form data
const [formData, setFormData] = useState<FormData>({});

// Invalidate cache after mutations
await createTemplate(data);
queryClient.invalidateQueries(["templates"]);
```

### 4. Error Boundaries

```typescript
function TemplateRoutes() {
  return (
    <ErrorBoundary fallback={<ErrorPage />}>
      <Routes>
        <Route path="/templates" element={<TemplateList />} />
        <Route path="/templates/:id" element={<TemplateDetail />} />
        <Route path="/templates/create" element={<CreateTemplate />} />
      </Routes>
    </ErrorBoundary>
  );
}
```

### 5. Optimistic Updates

```typescript
const { mutate } = useMutation({
    mutationFn: updateTemplate,
    onMutate: async (newData) => {
        // Cancel outgoing refetches
        await queryClient.cancelQueries(["template", id]);

        // Snapshot previous value
        const previous = queryClient.getQueryData(["template", id]);

        // Optimistically update
        queryClient.setQueryData(["template", id], newData);

        return { previous };
    },
    onError: (err, newData, context) => {
        // Rollback on error
        queryClient.setQueryData(["template", id], context.previous);
    },
    onSettled: () => {
        // Refetch after error or success
        queryClient.invalidateQueries(["template", id]);
    },
});
```

---

## Testing Examples

### Unit Tests

```typescript
describe("Template API", () => {
    it("should create template successfully", async () => {
        const mockTemplate = {
            templateName: "Test Template",
            title: "Test",
            fileUrl: "https://...",
            signingMode: "SHARED",
            signingFlow: "SEQUENTIAL",
            signatureZones: [
                /* ... */
            ],
            signingSteps: [
                /* ... */
            ],
        };

        const result = await createTemplate(mockTemplate);

        expect(result.success).toBe(true);
        expect(result.template.templateName).toBe("Test Template");
    });

    it("should throw error for duplicate template name", async () => {
        await expect(createTemplate(duplicateData)).rejects.toThrow(
            "Template name already exists",
        );
    });

    it("should validate step signer count", async () => {
        const invalidData = {
            templateId: "template-id",
            signingSteps: [
                { stepOrder: 1, signers: [] }, // Empty signers!
            ],
        };

        await expect(createDocumentFromTemplate(invalidData)).rejects.toThrow(
            "requires 1 signers, but 0 provided",
        );
    });
});
```

### Integration Tests

```typescript
describe("Template Workflow", () => {
    it("should complete full template creation flow", async () => {
        // 1. Upload file
        const fileUrl = await uploadTemplateFile(mockFile);
        expect(fileUrl).toContain("templates/");

        // 2. Create template
        const template = await createTemplate({ ...mockData, fileUrl });
        expect(template.id).toBeDefined();

        // 3. Fetch template detail
        const detail = await fetchTemplateById(template.id);
        expect(detail.templateName).toBe(mockData.templateName);

        // 4. Create document from template
        const document = await createDocumentFromTemplate({
            templateId: template.id,
            signingSteps: [
                /* with users */
            ],
        });
        expect(document.id).toBeDefined();
    });
});
```

---

## Quick Reference

### API Endpoints Summary

| Method | Endpoint                   | Purpose                           |
| ------ | -------------------------- | --------------------------------- |
| POST   | `/templates/upload-url`    | Get presigned URL for file upload |
| POST   | `/templates`               | Create new template               |
| GET    | `/templates`               | List templates (paginated)        |
| GET    | `/templates/:id`           | Get template detail               |
| PUT    | `/templates/:id`           | Update template                   |
| DELETE | `/templates/:id`           | Delete template                   |
| POST   | `/templates/:id/duplicate` | Duplicate template                |
| POST   | `/documents/from-template` | Create document from template     |

### Key Concepts

- **Template** = Blueprint (structure only: zones + signerCount + zoneIndices)
- **Document** = Instance (actual users assigned to zones)
- **signerCount** = How many signers needed for this step
- **zoneIndices** = Which zones (by index) this step uses
- **signingMode** = INDIVIDUAL (separate docs) vs SHARED (one doc)
- **signingFlow** = SEQUENTIAL (step by step) vs PARALLEL (all at once)

### Common Pitfalls

❌ Trying to change `signingMode` after template creation
❌ Providing wrong number of signers when creating document
❌ Using invalid zone indices
❌ Deleting template that's in use
❌ Duplicate template names

✅ Validate form data before submit
✅ Show helpful error messages
✅ Use optimistic updates for better UX
✅ Cache template data with React Query
✅ Handle loading and error states properly
