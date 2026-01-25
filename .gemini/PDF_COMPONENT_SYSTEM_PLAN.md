# PDF Component System - Implementation Plan

## 🎯 Objective
Tạo một bộ component PDF chuẩn chỉnh, tái sử dụng được cho toàn bộ hệ thống.

## 📊 Current State Analysis

### Các nơi sử dụng PDF Preview:

1. **DocumentDetail.tsx** (lines 252-369)
   - ✅ Pagination controls
   - ✅ Zoom controls
   - ✅ Show/Hide zones toggle
   - ✅ Zone overlay với colors
   - ✅ Zone legend
   - ✅ Read-only mode

2. **Step4Zones.tsx** (lines 571-830)
   - ✅ Pagination controls
   - ✅ Zoom controls
   - ✅ Zone overlay
   - ✅ **Drag & drop zones** (unique)
   - ✅ **Draw new zones** (unique)
   - ✅ **Edit/resize zones** (unique)
   - ✅ Interactive mode

3. **Step5Review.tsx** (lines 409-556)
   - ✅ Pagination controls
   - ✅ Zoom controls
   - ✅ Zone overlay
   - ✅ Zone legend
   - ✅ Read-only mode

4. **TemplateUseStep1.tsx** (current)
   - ✅ Using new PDFViewer component
   - ✅ Basic preview

### Code Duplication Issues:
- ❌ Pagination logic duplicated 4 times
- ❌ Zoom logic duplicated 4 times
- ❌ Zone rendering logic duplicated 3 times
- ❌ PDF loading states duplicated 4 times
- ❌ Controls UI duplicated 4 times

---

## 🏗️ Proposed Component Architecture

```
src/components/pdf/
├── PDFDocument.tsx              # Core PDF renderer (wrapper around react-pdf)
├── PDFControls.tsx              # Reusable controls (pagination, zoom, toggles)
├── PDFZoneOverlay.tsx           # Zone rendering overlay
├── PDFZoneEditor.tsx            # Interactive zone editor (drag, draw, resize)
├── PDFViewer.tsx                # Complete viewer (read-only with zones)
├── PDFEditor.tsx                # Complete editor (interactive zones)
└── index.ts                     # Exports
```

### Component Hierarchy:

```
PDFViewer (Read-only)
├── PDFControls
├── PDFDocument
└── PDFZoneOverlay

PDFEditor (Interactive)
├── PDFControls
├── PDFDocument
└── PDFZoneEditor
    └── PDFZoneOverlay
```

---

## 📝 Component Specifications

### 1. **PDFDocument** (Core Renderer)

**Purpose**: Wrapper around react-pdf Document/Page với loading states

```typescript
interface PDFDocumentProps {
    fileUrl: string;
    currentPage: number;
    scale: number;
    onLoadSuccess: (data: { numPages: number }) => void;
    onPageLoadSuccess?: (page: any) => void;
    renderTextLayer?: boolean;
    renderAnnotationLayer?: boolean;
    children?: React.ReactNode; // For overlays
}
```

**Features**:
- PDF rendering với react-pdf
- Loading states
- Error handling
- Page load callbacks
- Children support for overlays

---

### 2. **PDFControls** (Reusable Controls)

**Purpose**: Unified controls for pagination, zoom, and toggles

```typescript
interface PDFControlsProps {
    // Pagination
    currentPage: number;
    numPages: number | null;
    onPageChange: (page: number) => void;
    
    // Zoom
    scale: number;
    minScale?: number;
    maxScale?: number;
    onScaleChange: (scale: number) => void;
    
    // Toggles
    showZones?: boolean;
    onToggleZones?: () => void;
    hasZones?: boolean;
    
    // Additional controls
    additionalControls?: React.ReactNode;
}
```

**Features**:
- Prev/Next pagination
- Zoom in/out/reset
- Show/Hide zones toggle
- Extensible with additional controls

---

### 3. **PDFZoneOverlay** (Zone Rendering)

**Purpose**: Render signature zones on PDF

```typescript
interface Zone {
    id: string;
    page: number;
    x: number;        // Percentage 0-100
    y: number;        // Percentage 0-100
    width: number;    // Percentage 0-100
    height: number;   // Percentage 0-100
    label?: string;
    color?: string;
    signerId?: string;
    assignedUser?: {
        fullName?: string;
        email: string;
    };
}

interface PDFZoneOverlayProps {
    zones: Zone[];
    currentPage: number;
    scale: number;
    canvasWidth: number;
    canvasHeight: number;
    interactive?: boolean;
    selectedZones?: string[];
    onZoneClick?: (zoneId: string, multiSelect: boolean) => void;
    onZoneDoubleClick?: (zone: Zone) => void;
}
```

**Features**:
- Render zones với colors
- Zone labels
- Interactive vs read-only mode
- Selection support
- Click handlers

---

### 4. **PDFZoneEditor** (Interactive Editor)

**Purpose**: Full zone editing capabilities

```typescript
interface PDFZoneEditorProps extends PDFZoneOverlayProps {
    // Drawing
    drawMode: boolean;
    selectedSignerId?: string;
    onZoneCreate: (zone: Omit<Zone, 'id'>) => void;
    
    // Editing
    onZoneUpdate: (zoneId: string, updates: Partial<Zone>) => void;
    onZoneDelete: (zoneId: string) => void;
    
    // Drag & Drop
    enableDrag?: boolean;
    
    // Resize
    enableResize?: boolean;
}
```

**Features**:
- Draw new zones (drag to create rectangle)
- Move zones (drag & drop)
- Resize zones (corner handles)
- Delete zones
- Multi-select support
- Keyboard shortcuts

---

### 5. **PDFViewer** (Complete Read-only Viewer)

**Purpose**: High-level component for viewing PDFs with zones

```typescript
interface PDFViewerProps {
    fileUrl: string;
    zones?: Zone[];
    showZonesDefault?: boolean;
    maxHeight?: string;
    showControls?: boolean;
    showLegend?: boolean;
}
```

**Features**:
- Complete viewer with controls
- Zone overlay
- Zone legend
- Responsive
- Easy to use

---

### 6. **PDFEditor** (Complete Interactive Editor)

**Purpose**: High-level component for editing zones

```typescript
interface PDFEditorProps {
    fileUrl: string;
    zones: Zone[];
    onZonesChange: (zones: Zone[]) => void;
    signers: Array<{
        id: string;
        name: string;
        color: string;
    }>;
    selectedSignerId?: string;
    onSignerSelect?: (signerId: string) => void;
    maxHeight?: string;
}
```

**Features**:
- Complete editor with all tools
- Signer selection
- Zone management
- Keyboard shortcuts
- Validation

---

## 🔄 Migration Strategy

### Phase 1: Create Core Components
1. ✅ Create `PDFDocument.tsx`
2. ✅ Create `PDFControls.tsx`
3. ✅ Create `PDFZoneOverlay.tsx`
4. ✅ Test individually

### Phase 2: Create High-level Components
1. ✅ Create `PDFViewer.tsx` (using core components)
2. ✅ Create `PDFZoneEditor.tsx`
3. ✅ Create `PDFEditor.tsx`
4. ✅ Test integration

### Phase 3: Migrate Existing Code
1. ✅ Update `DocumentDetail.tsx` → use `PDFViewer`
2. ✅ Update `Step5Review.tsx` → use `PDFViewer`
3. ✅ Update `Step4Zones.tsx` → use `PDFEditor`
4. ✅ Update `TemplateUseStep1.tsx` → use `PDFViewer`

### Phase 4: Cleanup
1. ✅ Remove duplicate code
2. ✅ Update imports
3. ✅ Test all pages
4. ✅ Documentation

---

## 📊 Benefits

### Code Reduction
- **Before**: ~1500 lines of duplicated PDF code
- **After**: ~800 lines in reusable components
- **Reduction**: ~47% code reduction

### Maintainability
- ✅ Single source of truth
- ✅ Easier to fix bugs
- ✅ Easier to add features
- ✅ Consistent UX

### Performance
- ✅ Shared logic optimization
- ✅ Memoization opportunities
- ✅ Lazy loading support

### Developer Experience
- ✅ Simple API
- ✅ Type-safe
- ✅ Well-documented
- ✅ Easy to test

---

## 🎯 Success Criteria

1. ✅ All 4 pages use new components
2. ✅ No duplicate PDF rendering logic
3. ✅ All features working (view, edit, zones)
4. ✅ Performance maintained or improved
5. ✅ Type-safe APIs
6. ✅ Comprehensive documentation

---

**Status**: Ready to implement  
**Priority**: High  
**Estimated Time**: 4-6 hours
