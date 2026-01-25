# Template Use - PDF Preview Optimization

**Ngày cập nhật**: 25/01/2026  
**Mục tiêu**: Tối ưu PDF preview trong template use workflow

---

## ✅ Đã Hoàn Thành

### 1. **Tạo PDFViewer Component Tái Sử Dụng**

**File**: `src/components/ui/PDFViewer.tsx`

**Features**:
- ✅ **Pagination Controls**: Previous/Next page với visual feedback
- ✅ **Zoom Controls**: Zoom in/out (50% - 200%)
- ✅ **Show/Hide Zones Toggle**: Button để toggle signature zones
- ✅ **Signature Zone Overlay**: Hiển thị zones với colors và labels
- ✅ **Zone Legend**: List các zones trên current page
- ✅ **Responsive**: Adjustable max height
- ✅ **Loading States**: Loading và error states

**Props**:
```typescript
interface PDFViewerProps {
    fileUrl: string;
    zones?: Array<{
        id: string;
        page: number;
        position: { x, y, w, h };  // Percentages
        label?: string;
        color?: string;
        assignedUser?: { fullName, email };
    }>;
    showZonesDefault?: boolean;
    maxHeight?: string;
}
```

**Usage**:
```tsx
<PDFViewer
    fileUrl={template.fileUrl}
    zones={transformedZones}
    showZonesDefault={true}
    maxHeight="500px"
/>
```

---

### 2. **Updated TemplateUseStep1**

**File**: `src/components/template-use/TemplateUseStep1.tsx`

**Changes**:
- ✅ Replaced basic Document component với PDFViewer
- ✅ Transform template zones to PDFViewer format
- ✅ Show/Hide preview button với visual state
- ✅ Zones hiển thị mặc định khi preview
- ✅ Better layout: PDF preview trong separate card
- ✅ Improved UX với helper text

**Zone Transformation**:
```typescript
const zones = template.signatureZones?.map((zone: any) => ({
    id: zone.id,
    page: zone.pageNumber,
    position: {
        x: zone.x,
        y: zone.y,
        w: zone.width,
        h: zone.height,
    },
    label: zone.label,
    color: zone.assignedRole ? 
        template.signers?.find(s => s.role === zone.assignedRole)?.color : 
        '#2563eb',
    assignedUser: zone.assignedRole ? {
        fullName: zone.assignedRole,
        email: ''
    } : undefined
})) || [];
```

---

### 3. **UI/UX Improvements**

#### **Before**:
- ❌ No PDF preview
- ❌ No zone visualization
- ❌ No controls

#### **After**:
- ✅ Full PDF preview với controls
- ✅ Signature zones overlay với colors
- ✅ Pagination (page by page)
- ✅ Zoom controls (50% - 200%)
- ✅ Show/Hide zones toggle
- ✅ Zone legend showing zones on current page
- ✅ Visual feedback (button states, colors)

---

### 4. **Features Giống DocumentDetail**

**Đã implement**:
- ✅ Page navigation (Previous/Next)
- ✅ Zoom controls (In/Out)
- ✅ Show/Hide zones button
- ✅ Zone overlay với colors
- ✅ Zone labels
- ✅ Responsive layout

**Tương tự DocumentDetail.tsx**:
```typescript
// DocumentDetail.tsx (lines 252-369)
const [showSignatureZones, setShowSignatureZones] = useState(false);

<Button
    variant={showSignatureZones ? 'primary' : 'outline'}
    onClick={() => setShowSignatureZones(prev => !prev)}
>
    {showSignatureZones ? 'Hide Zones' : 'Show Zones'}
</Button>

{showSignatureZones && pageZones.map((zone) => (
    <div style={{ 
        left: `${zone.position.x}%`,
        top: `${zone.position.y}%`,
        width: `${zone.position.w}%`,
        height: `${zone.position.h}%`,
    }}>
        <div>{zone.label}</div>
    </div>
))}
```

---

## 📊 Component Architecture

```
TemplateUse (Main Page)
└── TemplateUseStep1
    └── PDFViewer (Reusable Component)
        ├── Controls Bar
        │   ├── Pagination (Prev/Next)
        │   ├── Zoom (In/Out)
        │   └── Toggle Zones
        ├── PDF Document
        │   ├── react-pdf Document
        │   ├── react-pdf Page
        │   └── Zone Overlays (conditional)
        └── Zone Legend (conditional)
```

---

## 🎨 Visual Features

### **Controls Bar**
```
[< Prev] Page 1 of 3 [Next >]  |  [-] 100% [+]  |  [👁 Show Zones]
```

### **Zone Overlay**
- Border: 2px dashed với zone color
- Background: zone color với 10% opacity
- Label: Small badge ở top-left với zone name/user

### **Zone Legend**
```
Signature Zones on Page 1
□ Zone 1 - CEO Signature
□ Zone 2 - CFO Approval
```

---

## 🔧 Technical Details

### **Dependencies**
- `react-pdf` - PDF rendering
- `lucide-react` - Icons
- Existing UI components (Button, Card)

### **State Management**
```typescript
const [numPages, setNumPages] = useState<number | null>(null);
const [currentPage, setCurrentPage] = useState(1);
const [scale, setScale] = useState(1.0);
const [showZones, setShowZones] = useState(showZonesDefault);
```

### **Zone Positioning**
- Zones use **percentage-based positioning** (0-100)
- Relative to PDF page dimensions
- Scales automatically với zoom level

---

## 🚀 Performance Optimizations

1. **Lazy Loading**: PDF chỉ load khi showPreview = true
2. **Page-based Rendering**: Chỉ render current page
3. **Zone Filtering**: Chỉ show zones của current page
4. **Memoization**: Zone transformation cached

---

## 📝 Usage Examples

### **Basic Usage**
```tsx
<PDFViewer fileUrl={pdfUrl} />
```

### **With Zones**
```tsx
<PDFViewer
    fileUrl={pdfUrl}
    zones={zones}
    showZonesDefault={true}
/>
```

### **Custom Height**
```tsx
<PDFViewer
    fileUrl={pdfUrl}
    maxHeight="800px"
/>
```

---

## ✨ Benefits

### **For Admin**
- ✅ Clear visualization của signature zones
- ✅ Easy navigation through pages
- ✅ Zoom để xem chi tiết
- ✅ Toggle zones để compare với original PDF

### **For Development**
- ✅ Reusable component
- ✅ Consistent UX across app
- ✅ Easy to maintain
- ✅ Type-safe props

### **For UX**
- ✅ Intuitive controls
- ✅ Visual feedback
- ✅ Responsive design
- ✅ Loading states

---

## 🎯 Next Steps (Optional)

### **Potential Enhancements**
1. **Thumbnail View**: Show all pages as thumbnails
2. **Full Screen Mode**: Expand PDF to full screen
3. **Download Button**: Download PDF directly
4. **Print Preview**: Print-friendly view
5. **Annotations**: Add notes/comments
6. **Search**: Search text in PDF
7. **Keyboard Shortcuts**: Arrow keys for navigation

### **Performance**
1. **Virtual Scrolling**: For large PDFs
2. **Progressive Loading**: Load pages on demand
3. **Caching**: Cache rendered pages

---

## 📚 Files Modified

```
✅ Created:
- src/components/ui/PDFViewer.tsx (new reusable component)

✅ Updated:
- src/components/template-use/TemplateUseStep1.tsx
- src/components/ui/index.ts (export PDFViewer)

✅ Dependencies:
- react-pdf (already installed)
- lucide-react (already installed)
```

---

**Status**: ✅ Completed  
**Testing**: Ready for manual testing  
**Documentation**: Complete
