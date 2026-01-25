# RSign Admin - Codebase Analysis & Documentation

**Ngày phân tích**: 25/01/2026  
**Phiên bản**: 0.0.0  
**Người phân tích**: AI Assistant

---

## 📋 Tổng quan dự án

**RSign Admin** là một hệ thống quản lý chữ ký số (Digital Signature Management System) được xây dựng bằng React, TypeScript và các công nghệ web hiện đại. Đây là giao diện admin cho phép quản lý tài liệu, template, người dùng và quy trình ký số.

### Mục đích chính:
- Quản lý tài liệu cần ký số
- Tạo và quản lý template tài liệu có thể tái sử dụng
- Quản lý người dùng và nhóm người ký
- Theo dõi tiến độ ký tài liệu
- Xử lý batch documents

---

## 🏗️ Kiến trúc tổng quan

### Tech Stack

#### Core Technologies
- **React 18.3.1** - UI Library
- **TypeScript 5.9.3** - Type-safe JavaScript
- **Vite 7.2.4** - Build tool & dev server (fast HMR)

#### State Management & Data Fetching
- **TanStack React Query 5.8.0** - Server state management, caching, và data synchronization
- **React Router DOM 6.20.0** - Client-side routing
- **React Context API** - Authentication state

#### Styling
- **TailwindCSS 3.4.19** - Utility-first CSS framework
- **clsx + tailwind-merge** - Conditional className utilities
- **Google Fonts (Inter)** - Professional typography

#### Form Management
- **React Hook Form 7.47.0** - Form state management
- **Zod 3.22.0** - Schema validation
- **@hookform/resolvers** - Zod integration với React Hook Form

#### HTTP & APIs
- **Axios 1.6.0** - HTTP client với interceptors
- **JWT Authentication** - Token-based auth

#### PDF Handling
- **pdfjs-dist 5.4.296** - PDF rendering
- **react-pdf 10.2.0** - React wrapper cho PDF.js
- **react-draggable 4.5.0** - Draggable signature zones
- **react-resizable 3.0.5** - Resizable signature zones

#### UI/UX
- **Lucide React 0.560.0** - Icon library (modern, tree-shakeable)
- **React Hot Toast 2.4.0** - Toast notifications

#### Development Tools
- **ESLint 9.39.1** - Code linting
- **TypeScript ESLint** - TypeScript-specific linting
- **React Query Devtools** - Debug tool cho React Query

---

## 📁 Cấu trúc thư mục

```
rsign-admin/
├── src/
│   ├── assets/              # Static assets (images, fonts)
│   ├── components/          # Reusable React components
│   │   ├── document-creation/    # 7 components - Document creation wizard
│   │   ├── template-creation/    # 7 components - Template creation wizard
│   │   ├── layout/              # 1 component - AdminLayout
│   │   └── ui/                  # 11 components - Reusable UI components
│   ├── contexts/            # React Context providers
│   │   └── AuthContext.tsx      # Authentication context
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utilities và API clients
│   │   ├── api.ts              # API endpoints & axios config
│   │   ├── constant.ts         # Constants (storage keys)
│   │   ├── pdf-worker.ts       # PDF.js worker config
│   │   ├── toast.ts            # Toast configuration
│   │   └── utils.ts            # Utility functions
│   ├── pages/               # Page components
│   │   ├── LoginPage.tsx       # Public login page
│   │   └── admin/              # 13 admin pages
│   ├── types/               # TypeScript type definitions
│   │   ├── index.ts            # Main types (Document, User, etc.)
│   │   ├── admin-statistics.ts # Dashboard statistics types
│   │   ├── document-creation.ts # Document creation workflow types
│   │   └── template.ts         # Template types
│   ├── App.tsx              # Main app component (routing)
│   ├── main.tsx             # Application entry point
│   └── index.css            # Global styles & Tailwind config
├── docs/                    # Documentation (15 files)
├── public/                  # Public static files
├── dist/                    # Production build output
├── .env                     # Environment variables
├── vite.config.ts          # Vite configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration (project references)
├── tsconfig.app.json       # TypeScript config for app
├── tsconfig.node.json      # TypeScript config for Node (Vite)
└── package.json            # Dependencies & scripts
```

---

## 🔐 Authentication Flow

### JWT-based Authentication

```typescript
// Storage keys
JWT_STORAGE_KEY = 'rsign_admin_token'
USER_STORAGE_KEY = 'rsign_admin_user'

// Flow:
1. User login → POST /users/login
2. Receive { token, user }
3. Store token & user in localStorage
4. Add token to all API requests via axios interceptor
5. On 401 → Clear storage & redirect to /login
```

### AuthContext Provider

```typescript
interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (credentials: LoginRequest) => Promise<void>;
    logout: () => void;
    updateUser: (user: User) => void;
}
```

### Protected Routes

```typescript
// App.tsx routing structure:
/login                          → Public
/admin/*                        → Protected (ProtectedRoute wrapper)
  /admin/dashboard             → Dashboard
  /admin/documents             → DocumentList
  /admin/documents/create      → DocumentCreate
  /admin/documents/:id         → DocumentDetail
  /admin/templates             → TemplateList
  /admin/templates/create      → TemplateCreate
  /admin/templates/:id/use     → TemplateUse
  /admin/users                 → UserManagement
  /admin/signer-groups         → SignerGroups
  /admin/document-batches      → DocumentBatches
```

---

## 📊 Data Flow & State Management

### React Query Configuration

```typescript
// main.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 minutes
      gcTime: 10 * 60 * 1000,        // 10 minutes (cache time)
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Don't retry on 401/403
        if (error?.response?.status === 401 || 403) return false;
        return failureCount < 3;
      },
    },
    mutations: {
      retry: 1,
    },
  },
})
```

### API Layer Structure

```typescript
// lib/api.ts - Centralized API client

// Axios instance với interceptors
export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    timeout: 10000,
})

// Request interceptor: Add JWT token
api.interceptors.request.use(config => {
    const token = storage.get(JWT_STORAGE_KEY);
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
})

// Response interceptor: Handle 401, format errors
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            // Clear auth & redirect to login
        }
        return Promise.reject(formatted_error);
    }
)

// API modules:
export const authAPI = { login, register, loginHust }
export const documentsAPI = { getDocuments, createDocument, ... }
export const templatesAPI = { getTemplates, createTemplate, ... }
export const usersAPI = { getUsers, getUser }
export const signerGroupsAPI = { getSignerGroups, addMembers, ... }
export const documentBatchAPI = { getDocumentBatches, sendBatch, ... }
export const statisticsAPI = { getDashboardStatistics, getTimeSeries }
```

### Pagination Convention

**QUAN TRỌNG**: API backend sử dụng 0-based pagination, nhưng UI sử dụng 1-based.

```typescript
// ❌ SAI - Gửi trực tiếp currentPage
page: currentPage  // UI: page 1 → API: page 1 (sai!)

// ✅ ĐÚNG - Convert từ 1-based sang 0-based
page: currentPage - 1  // UI: page 1 → API: page 0 (đúng!)

// Example trong DocumentList.tsx:
const { data } = useQuery({
    queryKey: ['documents', currentPage, filters],
    queryFn: () => documentsAPI.getDocuments({
        page: currentPage - 1,  // Convert to 0-based
        limit: pageSize,
        ...filters
    })
})
```

---

## 🎨 UI/UX Design System

### Color Palette

```javascript
// tailwind.config.js
colors: {
  primary: {
    500: '#2563eb',  // Primary Blue
    600: '#1d4ed8',  // Hover state
  },
  secondary: {
    50: '#f8fafc',   // Background
    900: '#0f172a',  // Text
  },
  accent: {
    500: '#f97316',  // CTA Orange
  },
  status: {
    draft: '#6b7280',
    pending: '#f59e0b',
    'in-progress': '#3b82f6',
    completed: '#10b981',
    cancelled: '#ef4444',
  },
  signer: {
    1: '#3b82f6',  // Blue
    2: '#10b981',  // Green
    3: '#f59e0b',  // Yellow
    4: '#ef4444',  // Red
    5: '#8b5cf6',  // Purple
    6: '#ec4899',  // Pink
  }
}
```

### Component Variants

```typescript
// Button variants
'primary'   → bg-primary-600 text-white
'secondary' → bg-secondary-100 text-secondary-900
'outline'   → border bg-white text-secondary-700
'ghost'     → bg-transparent text-secondary-700
'danger'    → bg-red-600 text-white

// Button sizes
'sm' → h-8 px-3 text-sm
'md' → h-10 px-4 text-sm
'lg' → h-12 px-6 text-base

// Badge variants
'default'   → bg-primary-100 text-primary-800
'secondary' → bg-secondary-100 text-secondary-800
'success'   → bg-green-100 text-green-800
'warning'   → bg-yellow-100 text-yellow-800
'danger'    → bg-red-100 text-red-800
```

### Utility Classes

```css
/* index.css - Custom utilities */
.btn                → Base button styles
.btn-primary        → Primary button
.btn-secondary      → Secondary button
.card               → Card container
.card-hover         → Card with hover effect
.form-input         → Form input styles
.form-label         → Form label styles
.status-dot         → Status indicator dot
.signature-zone     → PDF signature zone
```

---

## 📝 Type System & Data Models

### Core Types

```typescript
// types/index.ts

// Enums (as const objects)
export const SigningMode = {
    INDIVIDUAL: "INDIVIDUAL",  // Mỗi người nhận 1 bản riêng
    SHARED: "SHARED",          // Tất cả ký chung 1 bản (legacy)
    MULTI: "MULTI",            // Tất cả ký chung 1 bản (new format)
} as const;

export const SigningFlow = {
    PARALLEL: "PARALLEL",      // Ký đồng thời
    SEQUENTIAL: "SEQUENTIAL",  // Ký tuần tự theo thứ tự
} as const;

export const DocumentStatus = {
    DRAFT: "DRAFT",
    PENDING: "PENDING",
    IN_PROGRESS: "IN_PROGRESS",
    COMPLETED: "COMPLETED",
    CANCELLED: "CANCELLED",
    REJECTED: "REJECTED",
    EXPIRED: "EXPIRED",
} as const;

// Main entities
export interface Document extends BaseEntity {
    title: string;
    originalFileUrl: string;
    signedFileUrl?: string;
    status: DocumentStatus;
    signingMode: SigningMode;
    signingFlow: SigningFlow;
    currentStep: number;
    totalSteps: number;
    deadline?: string;
    batchId?: string;
    createdBy?: User;
    assignedUser?: User;
    signingSteps?: SigningStep[];
    signatureZones?: SignatureZone[];
    totalSigners?: number;
    completedSigners?: number;
}

export interface SignatureZone extends BaseEntity {
    pageNumber: number;
    x: number;        // Percentage (0-100)
    y: number;        // Percentage (0-100)
    width: number;    // Percentage (0-100)
    height: number;   // Percentage (0-100)
    label?: string;
    assignedTo?: DocumentSigner | null;
}
```

### Document Creation Types

```typescript
// types/document-creation.ts

export interface DocumentData {
    // Step 1: Type selection
    type: DocumentType | null;
    
    // Step 2: Upload & basic info
    title: string;
    file: File | null;
    fileUrl?: string;
    deadline?: string;
    signingFlow: SigningFlow;
    
    // Step 3: Recipients/Signers
    recipients: User[];           // For INDIVIDUAL mode
    selectedGroup?: SignerGroup;  // For INDIVIDUAL mode
    signers: Signer[];           // For SHARED mode
    signingSteps: SigningStep[]; // For SEQUENTIAL mode
    
    // Step 4: Signature zones
    signatureZones: SignatureZone[];
    pageDimensions?: Map<number, { width: number; height: number }>;
    
    // Step 5: Review & notifications
    notifications: {
        onComplete: boolean;
        reminder: boolean;
        dailyReport: boolean;
    };
}

// Helper function để convert form data → API request
export function buildCreateDocumentRequest(
    data: DocumentData,
    sendImmediately?: boolean
): CreateDocumentRequest
```

### Template Types

```typescript
// types/template.ts

export interface Template {
    id: string;
    name: string;
    fileUrl: string;
    signingMode: SigningMode;
    signingFlow: SigningFlow;
    totalSteps: number;
    signatureZones: TemplateSignatureZone[];
    signingSteps: TemplateStep[];
    signers?: TemplateSignerPlaceholder[];  // Role definitions
    description?: string;
    createdBy: { id: string; fullName: string; email: string };
    createdAt: string;
    updatedAt: string;
}

export interface TemplateSignerPlaceholder {
    role: string;        // e.g., "Employee", "Manager"
    description: string;
    order: number;
    color: string;
}

// Template không lưu user cụ thể, chỉ lưu role
// Khi sử dụng template → map role to actual users
```

---

## 🔄 Workflows

### 1. Document Creation Workflow (5 Steps)

```
Step 1: Type Selection (Step1TypeSelection.tsx)
├─ INDIVIDUAL mode → Mỗi người nhận 1 bản riêng
└─ SHARED mode → Tất cả ký chung 1 bản

Step 2: Upload & Info (Step2Upload.tsx)
├─ Upload PDF file
├─ Enter title
├─ Set deadline (optional)
└─ Choose signing flow (PARALLEL/SEQUENTIAL)

Step 3: Recipients/Signers (Step3Recipients.tsx)
├─ INDIVIDUAL mode:
│  ├─ Select users OR select signer group
│  └─ All recipients get same document structure
└─ SHARED mode:
   ├─ Add signers (assign colors)
   └─ For SEQUENTIAL: Organize into steps

Step 4: Signature Zones (Step4Zones.tsx)
├─ View PDF pages
├─ Drag & drop signature zones
├─ Resize zones
├─ Assign zones to signers
└─ Coordinates stored as percentages (0-100)

Step 5: Review & Submit (Step5Review.tsx)
├─ Review all information
├─ Configure notifications
└─ Submit → Create document
   ├─ INDIVIDUAL → Creates batch of documents
   └─ SHARED → Creates single document
```

### 2. Template Creation Workflow (5 Steps)

```
Step 1: Type Selection
└─ Same as document creation

Step 2: Upload & Info
├─ Upload PDF template
├─ Enter template name
└─ Choose signing flow

Step 3: Signer Roles (Step3SignerRoles.tsx)
├─ Define signer ROLES (not actual users)
├─ Example: "Employee", "Manager", "HR"
└─ Assign colors to roles

Step 4: Signature Zones
├─ Same as document creation
└─ Assign zones to ROLES (not users)

Step 5: Review & Save
└─ Save template (không gửi document)

Using Template:
1. Navigate to template detail
2. Click "Use Template"
3. Map roles to actual users
4. Create document from template
```

### 3. Document Signing Flow

```
Backend handles signing process:
1. Admin creates document
2. Backend sends email to signers
3. Signers access signing page (separate app)
4. Signers draw signature on zones
5. Backend validates & updates status
6. Admin tracks progress in DocumentDetail page
```

---

## 🎯 Code Conventions

### Naming Conventions

```typescript
// Files
PascalCase for components:     Button.tsx, DocumentList.tsx
camelCase for utilities:       utils.ts, api.ts
kebab-case for types:          document-creation.ts

// Variables & Functions
camelCase:                     const userData = ...
                              function handleSubmit() {}

// Constants
UPPER_SNAKE_CASE:             JWT_STORAGE_KEY, VITE_API_URL

// Types & Interfaces
PascalCase:                   interface User {}
                              type DocumentStatus = ...

// React Components
PascalCase:                   function DocumentList() {}
                              const Button = forwardRef(...)
```

### Import Organization

```typescript
// 1. External libraries
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Internal utilities & types
import { documentsAPI } from '@/lib/api';
import type { Document } from '@/types';

// 3. Components
import { Button } from '@/components/ui/Button';

// 4. Relative imports (if needed)
import { Step1 } from './Step1';
```

### Component Structure

```typescript
// 1. Imports
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Types/Interfaces
interface Props {
    userId: string;
}

// 3. Main Component
export default function ComponentName({ userId }: Props) {
    // 3.1. Hooks (useState, useQuery, etc.)
    const [state, setState] = useState();
    const { data } = useQuery(...);
    
    // 3.2. Event handlers
    const handleClick = () => {};
    
    // 3.3. Effects
    useEffect(() => {}, []);
    
    // 3.4. Render logic
    if (loading) return <Skeleton />;
    if (error) return <Error />;
    
    // 3.5. JSX
    return (
        <div>...</div>
    );
}

// 4. Sub-components (if any)
function SubComponent() {}
```

### State Management Patterns

```typescript
// ✅ ĐÚNG: Use React Query for server state
const { data, isLoading, error } = useQuery({
    queryKey: ['documents', filters],
    queryFn: () => documentsAPI.getDocuments(filters)
});

// ✅ ĐÚNG: Use useState for UI state
const [currentPage, setCurrentPage] = useState(1);
const [filters, setFilters] = useState({});

// ✅ ĐÚNG: Use Context for global app state
const { user, isAuthenticated } = useAuth();

// ❌ SAI: Don't use useState for server data
const [documents, setDocuments] = useState([]);
useEffect(() => {
    documentsAPI.getDocuments().then(setDocuments);
}, []);
```

### Error Handling

```typescript
// API errors are formatted by axios interceptor
try {
    await documentsAPI.createDocument(data);
    showToast.success('Document created!');
} catch (error: any) {
    // error.error contains formatted message
    showToast.error(error.error || 'Failed to create document');
}

// React Query error handling
const { data, error } = useQuery({
    queryKey: ['documents'],
    queryFn: documentsAPI.getDocuments
});

if (error) {
    return <ErrorMessage error={error} />;
}
```

### Toast Notifications

```typescript
// lib/toast.ts provides utilities

// Success
showToast.success('Document created successfully!');

// Error
showToast.error('Failed to create document');

// Promise-based (auto loading/success/error)
showToast.promise(
    documentsAPI.createDocument(data),
    {
        loading: 'Creating document...',
        success: 'Document created!',
        error: (err) => err?.error || 'Failed'
    }
);
```

---

## 🔧 Utility Functions

### Date Formatting

```typescript
// lib/utils.ts

formatDate(date, 'short')     → "Jan 15, 2026"
formatDate(date, 'long')      → "Monday, January 15, 2026"
formatDate(date, 'relative')  → "2 hours ago"
```

### Status Utilities

```typescript
getStatusColor(status)  → Returns Tailwind classes
getStatusLabel(status)  → Returns human-readable label

// Example:
getStatusColor('IN_PROGRESS')  
→ "text-status-in-progress bg-status-in-progress/10"

getStatusLabel('IN_PROGRESS')  
→ "In Progress"
```

### Storage Utilities

```typescript
// Safe localStorage wrapper with error handling
storage.set(key, value)      // Stores as JSON
storage.get<T>(key)          // Returns parsed value
storage.remove(key)
storage.clear()
```

### Class Name Utilities

```typescript
// cn() - Merge Tailwind classes intelligently
import { cn } from '@/lib/utils';

cn(
    'base-class',
    condition && 'conditional-class',
    'override-class'
)
// Uses clsx + tailwind-merge to handle conflicts
```

---

## 📦 Build & Deployment

### Development

```bash
npm run dev
# Starts Vite dev server at http://localhost:5173
# Hot Module Replacement (HMR) enabled
```

### Production Build

```bash
npm run build
# 1. Runs TypeScript compiler: tsc -b
# 2. Runs Vite build
# Output: dist/ folder
```

### Environment Variables

```bash
# .env file
VITE_API_URL=http://localhost:3000/api

# Access in code:
import.meta.env.VITE_API_URL
import.meta.env.DEV  # true in development
```

### Build Configuration

```typescript
// vite.config.ts
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    optimizeDeps: {
        include: ['pdfjs-dist'],
        exclude: ['pdfjs-dist/build/pdf.worker.min.mjs'],
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    pdfjs: ['pdfjs-dist'],
                    'react-pdf': ['react-pdf'],
                },
            },
        },
    },
})
```

---

## 🐛 Common Issues & Solutions

### 1. Pagination starts from 0 instead of 1

**Problem**: API uses 0-based pagination, UI uses 1-based

**Solution**:
```typescript
// ✅ Always convert when calling API
page: currentPage - 1
```

### 2. TypeScript errors with 'any' type

**Problem**: Implicit 'any' type errors

**Solution**:
```typescript
// ❌ BAD
.map((item, index) => ...)

// ✅ GOOD
.map((item: any, index: number) => ...)
```

### 3. Document property 'fileUrl' doesn't exist

**Problem**: Document type uses 'originalFileUrl', not 'fileUrl'

**Solution**:
```typescript
// ❌ BAD
document.fileUrl

// ✅ GOOD
document.originalFileUrl
```

### 4. Filter changes don't reset page

**Problem**: When filters change, user stays on current page (might be empty)

**Solution**:
```typescript
const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);  // Reset to page 1
};
```

---

## 📚 Best Practices

### 1. React Query Usage

```typescript
// ✅ GOOD: Proper query key structure
useQuery({
    queryKey: ['documents', currentPage, filters],
    queryFn: () => documentsAPI.getDocuments({ page, ...filters })
})

// Query key should include all dependencies
// React Query auto-refetches when key changes
```

### 2. Form Handling

```typescript
// ✅ GOOD: Use React Hook Form + Zod
const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { ... }
});

// Validation happens automatically
// Type-safe form data
```

### 3. Component Composition

```typescript
// ✅ GOOD: Small, focused components
function DocumentList() {
    return (
        <>
            <DocumentFilters />
            <DocumentTable />
            <Pagination />
        </>
    );
}

// Each component has single responsibility
```

### 4. Error Boundaries

```typescript
// ✅ GOOD: Wrap PDF components in error boundary
<PDFErrorBoundary>
    <PDFViewer />
</PDFErrorBoundary>

// PDF.js can crash, error boundary prevents full app crash
```

### 5. Loading States

```typescript
// ✅ GOOD: Show skeleton while loading
if (isLoading) return <DocumentListSkeleton />;
if (error) return <ErrorMessage />;
return <DocumentTable data={data} />;

// Better UX than spinner
```

---

## 🔍 Key Files to Understand

### Must-read files:
1. `src/types/index.ts` - Core type definitions
2. `src/lib/api.ts` - API client & endpoints
3. `src/App.tsx` - Routing structure
4. `src/contexts/AuthContext.tsx` - Authentication
5. `src/types/document-creation.ts` - Document workflow types

### Important workflows:
1. `src/components/document-creation/` - Document creation wizard
2. `src/components/template-creation/` - Template creation wizard
3. `src/pages/admin/DocumentDetail.tsx` - Document detail & tracking

---

## 📝 Notes & Observations

### Strengths:
- ✅ Well-structured type system
- ✅ Consistent naming conventions
- ✅ Good separation of concerns
- ✅ Proper use of React Query for server state
- ✅ Comprehensive error handling
- ✅ Professional UI/UX design system

### Areas for improvement:
- ⚠️ Some components are large (50KB+) - could be split
- ⚠️ Limited test coverage (no test files found)
- ⚠️ Some 'any' types could be more specific
- ⚠️ Documentation could be more inline (JSDoc comments)

### Security considerations:
- ✅ JWT stored in localStorage (standard practice)
- ✅ Auto-logout on 401
- ✅ Protected routes with ProtectedRoute wrapper
- ⚠️ No CSRF protection visible (might be handled by backend)

---

## 🎓 Learning Resources

### For new developers:
1. Read `README.md` first
2. Study `src/types/index.ts` to understand data models
3. Follow a document creation flow in the code
4. Understand React Query patterns
5. Review Tailwind CSS configuration

### Key concepts to understand:
- React Query (server state management)
- React Hook Form + Zod (form validation)
- PDF.js (PDF rendering & manipulation)
- JWT authentication flow
- Percentage-based coordinates for PDF zones

---

**Tài liệu này được tạo tự động bởi AI Assistant**  
**Cập nhật lần cuối**: 25/01/2026
