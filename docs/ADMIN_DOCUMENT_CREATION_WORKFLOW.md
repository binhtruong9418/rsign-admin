# Admin Document Creation Workflow

This guide details the standard workflows for Administrators to create and send documents, covering all supported modes (Individual/Shared) and flows (Parallel/Sequential).

## 1. Concepts

- **Signing Mode**:

  - `INDIVIDUAL`: Bulk sending. Each recipient gets a _unique copy_ of the document to sign. (e.g., sending new policy to all employees).
  - `SHARED`: Collaboration. Multiple people sign the _exact same_ document. (e.g., a contract between Party A and Party B).

- **Signing Flow** (Mainly for Shared mode):
  - `PARALLEL`: Order doesn't matter. A pushes "Send", B and C receive it immediately and can sign anytime.
  - `SEQUENTIAL`: Order matters. A sends -> B signs -> C signs. C cannot sign until B touches it.

---

## 2. Workflow: Bulk Send (Individual Mode)

**Scenario:** HR wants to send an "Employment Contract" to 50 employees. Each employee signs their own copy.

### UI/UX Steps

1.  **Step 1: Upload & Info**

    - Admin uploads PDF (`fileUrl`).
    - Enters Title ("Employment Contract 2024").
    - Sets Deadline (Optional).

2.  **Step 2: Signature Placement**

    - Admin sees the document preview.
    - **Action**: Drags a "Signature Box" onto the page (e.g., Page 1, bottom right).
    - _Note_: In Individual mode, you define _where_ the recipient signs. You don't pick _who_ signs here, because the "who" is dynamic (the list of recipients).
    - **System**: user creates 1 zone.

3.  **Step 3: Select Recipients**

    - Admin selects "Individual Mode".
    - **Action**:
      - Option A: Select specific users (Search & Add).
      - Option B: Select a "Signer Group" (e.g., "Engineering Team").
    - **System**: Resolves group to list of User IDs.

4.  **Step 4: Review & Send**
    - Summary: "Sending to 50 recipients."
    - Click "Create".

### API Request

```json
POST /api/admin/documents
{
  "title": "Employment Contract 2024",
  "fileUrl": "https://minio.../contract.pdf",
  "signingMode": "INDIVIDUAL",
  "signingFlow": "PARALLEL", // Default for individual
  "recipients": {
    "userIds": ["user-1", "user-2", "user-3"],
    "signerGroupId": "optional-group-id" // If using group
  },
  "signatureZones": [
    {
      "pageNumber": 1,
      "x": 400,
      "y": 700,
      "width": 150,
      "height": 50,
      "label": "Employee Signature"
    }
  ],
  // Note: signingSteps is required by schema but ignored for logic in Individual mode.
  // FE can send a dummy step.
  "signingSteps": [
    { "stepOrder": 1, "signers": [] }
  ]
}
```

---

## 3. Workflow: Collaborative Signing (Shared - Parallel)

**Scenario:** A "Partnership Agreement" needs to be signed by **User A** (Partner) and **User B** (Witness). It doesn't matter who signs first.

### UI/UX Steps

1.  **Step 1: Upload & Info**

    - Upload PDF. Title: "Partnership Agreement".

2.  **Step 2: Add Signers**

    - Select "Shared Mode" -> "Parallel Flow".
    - **Action**: Add 2 Signers.
      - Row 1: Select User A. Color code: Blue.
      - Row 2: Select User B. Color code: Orange.

3.  **Step 3: Signature Placement**

    - Admin sees document preview.
    - **Action**:
      - Select "User A" from toolbar. Drag box to Page 1. (Zone 1).
      - Select "User B" from toolbar. Drag box to Page 2. (Zone 2).
    - **System**: Maps Zone 1 -> User A (Index 0), Zone 2 -> User B (Index 1).

4.  **Step 4: Review & Send**
    - Click "Create".

### API Request

**Key Logic**: `zoneIndex` in `signingSteps` maps to the index of the zone in the `signatureZones` array.

```json
POST /api/admin/documents
{
  "title": "Partnership Agreement",
  "fileUrl": "...",
  "signingMode": "SHARED",
  "signingFlow": "PARALLEL",
  // Define positions
  "signatureZones": [
    { "pageNumber": 1, "x": 100, "y": 100, ... }, // Index 0 (For User A)
    { "pageNumber": 2, "x": 100, "y": 100, ... }  // Index 1 (For User B)
  ],
  // Define who signs what
  "signingSteps": [
    {
      "stepOrder": 1,
      "signers": [
        { "userId": "user-a-uuid", "zoneIndex": 0 },
        { "userId": "user-b-uuid", "zoneIndex": 1 }
      ]
    }
  ]
}
```

---

## 4. Workflow: Approval Chain (Shared - Sequential)

**Scenario:** A "Budget Approval" needs to go from **Employee** -> **Manager** -> **Director**.

### UI/UX Steps

1.  **Step 1: Upload & Info**

    - Upload PDF.

2.  **Step 2: Configure Workflow**

    - Select "Shared Mode" -> "Sequential Flow".
    - **Action**: Create Steps.
      - **Step 1**: Add Signer "Employee".
      - **Step 2**: Add Signer "Manager".
      - **Step 3**: Add Signer "Director".

3.  **Step 3: Signature Placement**

    - **Action**:
      - Select "Employee". Drag box (Zone A).
      - Select "Manager". Drag box (Zone B).
      - Select "Director". Drag box (Zone C).

4.  **Step 4: Review & Send**
    - Visual representation: `Employee -> Manager -> Director`.

### API Request

```json
POST /api/admin/documents
{
  "title": "Budget Approval",
  "fileUrl": "...",
  "signingMode": "SHARED",
  "signingFlow": "SEQUENTIAL",
  "signatureZones": [
    { "x": 100, ... }, // Index 0 (Employee)
    { "x": 100, ... }, // Index 1 (Manager)
    { "x": 100, ... }  // Index 2 (Director)
  ],
  "signingSteps": [
    {
      "stepOrder": 1,
      "signers": [{ "userId": "employee-id", "zoneIndex": 0 }]
    },
    {
      "stepOrder": 2,
      "signers": [{ "userId": "manager-id", "zoneIndex": 1 }]
    },
    {
      "stepOrder": 3,
      "signers": [{ "userId": "director-id", "zoneIndex": 2 }]
    }
  ]
}
```
