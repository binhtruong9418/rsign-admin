# Template Use Workflow - Implementation Plan

## 🎯 Objective
Rebuild TemplateUse page với workflow rõ ràng, preview PDF, và UX tối ưu theo API docs mới.

## 📋 Workflow Steps

### Step 1: Template Overview & Basic Info
- Display template information (name, description, mode, flow)
- Input: Document title (optional override)
- Input: Deadline (optional)
- Preview template PDF
- Show template structure (zones, steps)

### Step 2: Assign Recipients/Signers
**INDIVIDUAL Mode:**
- Select recipients (individual users OR signer group)
- Simple selection, no zone assignment needed

**SHARED Mode:**
- Map template roles to actual users
- Assign user for each role/zone
- Respect signing steps if sequential

### Step 3: Review & Submit
- Review all information
- Preview document with assignments
- Show what will be created:
  - INDIVIDUAL: N documents (batch)
  - SHARED: 1 document
- Submit button

## 🏗️ Component Structure

```
TemplateUse.tsx (Main page - orchestrator)
├── TemplateUseStep1.tsx (Overview & Basic Info)
├── TemplateUseStep2Individual.tsx (Recipients selection)
├── TemplateUseStep2Shared.tsx (Role mapping)
└── TemplateUseStep3Review.tsx (Review & Submit)
```

## 📊 State Management

```typescript
interface TemplateUseData {
  // Step 1
  title: string;              // Optional override
  deadline: string;           // Optional
  
  // Step 2 - INDIVIDUAL
  recipientIds: string[];     // Selected user IDs
  signerGroupId?: string;     // OR selected group ID
  
  // Step 2 - SHARED
  roleAssignments: Record<string, string>;  // roleId -> userId
  
  // UI State
  currentStep: number;
  sendImmediately: boolean;
}
```

## 🎨 Key Features

### 1. PDF Preview
- Show template PDF in all steps
- Highlight signature zones with colors
- Show zone labels and assigned users

### 2. Smart Validation
- INDIVIDUAL: Require at least 1 recipient
- SHARED: Require all roles assigned
- Clear error messages

### 3. Optimized API Calls
- INDIVIDUAL: Simple request with recipients only
- SHARED: Detailed request with signingSteps

### 4. Better UX
- Progress indicator (Step 1 of 3, etc.)
- Back/Next navigation
- Loading states
- Success/Error feedback
- Auto-navigation after success

## 📝 Implementation Order

1. ✅ Create component files
2. ✅ Implement Step 1 (Overview)
3. ✅ Implement Step 2 Individual
4. ✅ Implement Step 2 Shared
5. ✅ Implement Step 3 Review
6. ✅ Integrate PDF preview
7. ✅ Add validation
8. ✅ Test workflows
9. ✅ Polish UI/UX

## 🔧 Technical Details

### API Integration
```typescript
// INDIVIDUAL
const request = {
  templateId,
  title,
  deadline,
  recipients: {
    userIds: recipientIds,
    // OR
    signerGroupId: groupId
  },
  sendImmediately: true
};

// SHARED
const request = {
  templateId,
  title,
  deadline,
  signingSteps: [
    {
      stepOrder: 1,
      signers: [
        { userId: "...", zoneIndex: 0 },
        // ...
      ]
    }
  ],
  sendImmediately: true
};
```

### Navigation Logic
```typescript
const result = await templatesAPI.createDocumentFromTemplate(request);

if (result.batchId) {
  // INDIVIDUAL → Batch list
  navigate('/admin/document-batches');
} else if (result.document?.id) {
  // SHARED → Document detail
  navigate(`/admin/documents/${result.document.id}`);
}
```

---

**Status**: Ready to implement
**Estimated Time**: 2-3 hours
**Priority**: High
