# Document Creation Workflow - Implementation Guide

## Overview

This document describes the complete rewrite of the document creation workflow with support for all edge cases including:
- Multiple signature zones per user
- Sequential signing with flexible step management
- Parallel signing with multiple zones per signer
- Individual and shared document modes

## Architecture

### File Structure

```
src/
├── types/
│   └── document-creation.ts          # Type definitions
├── components/
│   └── document-creation/
│       ├── index.ts                   # Component exports
│       ├── Step1TypeSelection.tsx     # Step 1: Choose document type
│       ├── Step2Upload.tsx            # Step 2: Upload PDF
│       ├── Step3Recipients.tsx        # Step 3: Select recipients/signers
│       ├── Step4Zones.tsx             # Step 4: Place signature zones
│       └── Step5Review.tsx            # Step 5: Review & send
└── pages/
    └── admin/
        ├── DocumentCreate.tsx         # Main orchestrator (NEW)
        └── DocumentCreate.old.tsx     # Backup of original
```

## Key Features

### 1. Enhanced Type System (`src/types/document-creation.ts`)

```typescript
// Signer with optional step assignment for sequential mode
interface Signer {
    id: string;
    userId: string;
    name: string;
    email: string;
    color: string;
    step?: number; // For sequential mode
}

// SigningStep allows multiple signers per step
interface SigningStep {
    stepOrder: number;
    signerIds: string[]; // Multiple signers can sign in same step
}

// API request builder handles all edge cases
function buildCreateDocumentRequest(data: DocumentData): CreateDocumentRequest
```

### 2. Step 3: Enhanced Signer Management

**Individual Mode:**
- Group selection or individual user selection
- Simple recipient list

**Parallel Mode:**
- Add multiple signers
- Each signer can have multiple zones
- All signers can sign simultaneously

**Sequential Mode (NEW):**
- Step-based signing workflow
- Each step can have multiple signers
- Signers in the same step can sign in parallel
- Next step is notified only after previous step completes
- Same user can appear in multiple steps (e.g., user-a signs step 1 and step 4)

Example Sequential Structure:
```typescript
signingSteps: [
    { stepOrder: 1, signerIds: ['signer-a', 'signer-b'] }, // Both sign step 1
    { stepOrder: 2, signerIds: ['signer-c'] },              // signer-c signs step 2
    { stepOrder: 3, signerIds: ['signer-a'] }               // signer-a signs again in step 3
]
```

### 3. Step 4: Multi-Zone Support

**Key Features:**
- Select signer from left panel
- Draw multiple zones for selected signer
- Each signer can have 1-N zones on any pages
- Visual indicators show which signers have zones
- Drag & drop, resize, and edit zones
- Multi-select zones with Ctrl/Cmd + Click
- Keyboard shortcuts (Delete, Escape, etc.)

**For Individual Mode:**
- All zones apply to all recipients
- Can place multiple zones (e.g., signature, initial, date)

**For Shared Mode:**
- Each signer must have at least one zone
- Zones are color-coded by signer
- Zones cannot overlap (enforced visually)

### 4. API Request Building

The `buildCreateDocumentRequest` function handles all edge cases:

**Individual Mode:**
```json
{
  "signingMode": "INDIVIDUAL",
  "recipients": {
    "userIds": ["user-1", "user-2"],
    "signerGroupId": "optional-group"
  },
  "signatureZones": [
    { "pageNumber": 1, "x": 100, "y": 100, ... }
  ],
  "signingSteps": [
    { "stepOrder": 1, "signers": [] }  // Dummy step
  ]
}
```

**Parallel Mode (user-a has 2 zones, user-b has 2 zones):**
```json
{
  "signingMode": "SHARED",
  "signingFlow": "PARALLEL",
  "signatureZones": [
    { "pageNumber": 1, "x": 100, ... },  // Index 0 - user-a zone 1
    { "pageNumber": 2, "x": 100, ... },  // Index 1 - user-a zone 2
    { "pageNumber": 1, "x": 300, ... },  // Index 2 - user-b zone 1
    { "pageNumber": 2, "x": 300, ... }   // Index 3 - user-b zone 2
  ],
  "signingSteps": [
    {
      "stepOrder": 1,
      "signers": [
        { "userId": "user-a", "zoneIndex": 0 },
        { "userId": "user-a", "zoneIndex": 1 },
        { "userId": "user-b", "zoneIndex": 2 },
        { "userId": "user-b", "zoneIndex": 3 }
      ]
    }
  ]
}
```

**Sequential Mode (user-a signs step 1 and 4):**
```json
{
  "signingMode": "SHARED",
  "signingFlow": "SEQUENTIAL",
  "signatureZones": [
    { "pageNumber": 1, ... },  // Index 0 - user-a step 1
    { "pageNumber": 1, ... },  // Index 1 - user-b step 2
    { "pageNumber": 1, ... },  // Index 2 - user-c step 3
    { "pageNumber": 2, ... }   // Index 3 - user-a step 4
  ],
  "signingSteps": [
    { "stepOrder": 1, "signers": [{ "userId": "user-a", "zoneIndex": 0 }] },
    { "stepOrder": 2, "signers": [{ "userId": "user-b", "zoneIndex": 1 }] },
    { "stepOrder": 3, "signers": [{ "userId": "user-c", "zoneIndex": 2 }] },
    { "stepOrder": 4, "signers": [{ "userId": "user-a", "zoneIndex": 3 }] }
  ]
}
```

## Edge Cases Handled

### 1. Multiple Zones Per User
✅ Users can have multiple signature zones across different pages
✅ Each zone is independently draggable, resizable, and editable
✅ Zones are tracked by signer ID and mapped to zone indices in API request

### 2. Sequential Mode Edge Cases
✅ Multiple users can sign in the same step (parallel within step)
✅ Same user can appear in multiple steps
✅ Steps are dynamically reordered when a step is deleted
✅ Adding/removing signers updates the step structure

### 3. Parallel Mode Edge Cases
✅ Each signer can have N zones
✅ All signers are notified simultaneously
✅ Zones are grouped by signer in API request

### 4. Zone Validation
✅ Individual mode: At least 1 zone required
✅ Shared mode: Each signer must have at least 1 zone
✅ Visual indicators show missing zones
✅ Cannot proceed without meeting requirements

### 5. File Upload
✅ Two-phase upload: Get presigned URL → Upload to S3
✅ Progress tracking during upload
✅ Validation: PDF only, max 50MB
✅ Preview available before proceeding

## User Experience Improvements

### 1. Cleaner UI
- Removed unnecessary progress animations
- Streamlined step transitions
- Larger containers for better workspace
- Debug panel for development

### 2. Better Visual Feedback
- Color-coded signers
- Visual indicators for zone placement status
- Real-time validation feedback
- Toast notifications for actions

### 3. Keyboard Shortcuts
- Delete: Remove selected zones
- Escape: Deselect all zones
- Ctrl/Cmd + Click: Multi-select zones

### 4. Responsive Design
- Works on all screen sizes
- Mobile-friendly zone placement
- Adaptive layouts

## Testing Checklist

### Individual Mode
- [ ] Select group
- [ ] Select individual users
- [ ] Upload PDF
- [ ] Place multiple zones
- [ ] Review shows correct recipient count
- [ ] API request has correct structure

### Shared - Parallel Mode
- [ ] Add 3+ signers
- [ ] Place 2+ zones for each signer
- [ ] Verify color coding
- [ ] Review shows all signers with zone counts
- [ ] API request maps zones to signers correctly

### Shared - Sequential Mode
- [ ] Create 4+ steps
- [ ] Add multiple signers to step 2
- [ ] Add same user to step 1 and step 4
- [ ] Remove a step (verify reordering)
- [ ] Place 2+ zones for a signer
- [ ] Review shows step order correctly
- [ ] API request has correct step structure

### Zone Management
- [ ] Draw zones on different pages
- [ ] Resize zones
- [ ] Move zones with drag & drop
- [ ] Multi-select zones (Ctrl+Click)
- [ ] Delete zones
- [ ] Edit zone properties
- [ ] Quick resize with size controls

### Upload & Review
- [ ] Upload large PDF (test progress)
- [ ] Upload non-PDF (test validation)
- [ ] Set deadline
- [ ] Save as template
- [ ] Toggle notifications
- [ ] Send document
- [ ] Navigate after success

## Development Notes

### Debug Mode
The app includes a debug panel in development mode that shows:
- Current step
- Document data structure
- Signers and zones mapping

### Code Organization
- Each step is a separate component
- Types are centrally defined
- API request building is isolated
- Clean separation of concerns

### Performance
- React components are optimized
- PDF rendering uses react-pdf
- Zone operations are efficient
- No unnecessary re-renders

## Migration from Old Code

The old implementation is backed up as `DocumentCreate.old.tsx`. Key differences:

| Old | New |
|-----|-----|
| Single component file (2400+ lines) | 5 separate step components |
| Basic sequential mode | Full sequential with multi-signer steps |
| Limited multi-zone support | Complete multi-zone for all modes |
| Complex state management | Clean DocumentData type |
| Manual API request building | Centralized buildCreateDocumentRequest |

## Future Enhancements

Potential improvements:
1. Template library for common workflows
2. Auto-placement of zones using AI
3. Drag to reorder steps in sequential mode
4. Bulk zone operations
5. Zone templates (signature + date + initial combo)
6. Real-time collaboration for multi-admin setups

## Support

For issues or questions:
1. Check the debug panel in development mode
2. Review the console for API errors
3. Verify the API request structure matches documentation
4. Test with simple cases first before complex workflows
