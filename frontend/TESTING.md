# Testing Guide — NDA Creator Frontend

## Automated Tests

Run with:
```bash
cd frontend
npm test
```

### Test Suites

| Suite | File | Tests | Covers |
|-------|------|-------|--------|
| Template Library | `src/__tests__/template.test.ts` | 24 | `getTemplate`, `getDefaultValues`, `fillTemplate`, date formatting, NDA type formatting, edge cases |
| NdaForm | `src/__tests__/NdaForm.test.tsx` | 16 | Rendering all input types, labels, required indicators, user interactions, onChange callbacks |
| NdaPreview | `src/__tests__/NdaPreview.test.tsx` | 14 | Section rendering, variable substitution, placeholder highlighting, date/type formatting, ref attachment |
| NdaPage | `src/__tests__/NdaPage.test.tsx` | 14 | Full integration: form + preview wiring, button state, PDF download mock, loading state |

**Total: 68 automated tests**

---

## Manual Test Plan

### Prerequisites
1. `cd frontend && npm install && npm run dev`
2. Open `http://localhost:3000` in browser

---

### MT-1: Initial Page Load
- [ ] Page loads without errors
- [ ] Header shows "Prelegal" title and "Non-Disclosure Agreement Generator" subtitle
- [ ] Left panel shows the form with "Document Details" heading
- [ ] Right panel shows the NDA document preview
- [ ] Download PDF button is visible in the header and is **disabled**
- [ ] Form fields show default values: Confidentiality Period = 2, NDA Type = Mutual

### MT-2: Form Fields — Text Inputs
- [ ] Type "Acme Corporation" in Disclosing Party Name → preview updates in real time
- [ ] Type "123 Main Street, Suite 100, New York, NY 10001" in Disclosing Party Address → preview updates
- [ ] Type "Widget Industries" in Receiving Party Name → preview updates
- [ ] Type "456 Oak Avenue, San Francisco, CA 94102" in Receiving Party Address → preview updates
- [ ] Type "Delaware" in Governing Law field → preview updates in the Governing Law section
- [ ] All text inputs have placeholder text matching the label

### MT-3: Form Fields — Date Input
- [ ] Click the Effective Date field → date picker opens
- [ ] Select April 15, 2026 → preview shows **"April 15, 2026"** (not "2026-04-15")
- [ ] Clear the date → placeholder `{{effective_date}}` reappears highlighted in yellow

### MT-4: Form Fields — Number Input
- [ ] Confidentiality Period defaults to 2
- [ ] Change to 5 → preview updates "5 year(s)" in Term and Termination section
- [ ] Minimum value is 1 (cannot enter 0 via spinner)

### MT-5: Form Fields — Select (NDA Type)
- [ ] Default value is "Mutual"
- [ ] Change to "One-way" → Recitals section now shows "This One-Way Non-Disclosure Agreement"
- [ ] Change back to "Mutual" → Recitals shows "This Mutual Non-Disclosure Agreement"

### MT-6: Preview — Placeholder Highlighting
- [ ] With all fields empty, unfilled placeholders (e.g., `{{disclosing_party_name}}`) are highlighted with yellow background
- [ ] As each field is filled in, corresponding placeholders disappear from the preview
- [ ] When all fields are filled, no yellow highlights remain in the preview

### MT-7: Preview — Document Structure
- [ ] Document title "NON-DISCLOSURE AGREEMENT" appears centered at top
- [ ] All 11 sections are numbered and displayed:
  1. Recitals
  2. Definition of Confidential Information
  3. Obligations of the Receiving Party
  4. Exclusions from Confidential Information
  5. Required Disclosures
  6. Term and Termination
  7. Return or Destruction of Materials
  8. No License or Warranty
  9. Remedies
  10. Governing Law
  11. Signatures
- [ ] Signatures section shows party names and signature lines
- [ ] Document uses serif font (Georgia/Times New Roman)

### MT-8: Download PDF Button — Disabled State
- [ ] Button is disabled (gray) when any required field is empty
- [ ] Fill all required fields except one → button remains disabled
- [ ] Fill the last required field → button becomes enabled (blue)

### MT-9: Download PDF — Success
- [ ] Fill all required fields with valid data
- [ ] Click "Download PDF"
- [ ] Button text changes to "Generating..." while PDF is being created
- [ ] A PDF file downloads with name like `Mutual_NDA_Acme_Corporation.pdf`
- [ ] Open the PDF and verify:
  - [ ] All entered values appear correctly
  - [ ] Date is formatted as long date
  - [ ] NDA type appears in Recitals
  - [ ] Document is on A4-sized pages
  - [ ] No yellow placeholder highlights appear (all fields were filled)
  - [ ] Text is readable and properly formatted

### MT-10: Download PDF — Filename
- [ ] With Disclosing Party Name = "Acme Corporation" → filename is `Mutual_NDA_Acme_Corporation.pdf`
- [ ] With Disclosing Party Name empty → filename is `Mutual_NDA_NDA.pdf`
- [ ] With Disclosing Party Name containing spaces → spaces replaced with underscores

### MT-11: Responsive Layout
- [ ] On desktop (>1024px): two-column layout, form on left, preview on right
- [ ] On mobile (<1024px): single column, form above preview
- [ ] Form sidebar is sticky on desktop when scrolling
- [ ] Preview remains readable at all viewport widths

### MT-12: Edge Cases
- [ ] Very long party names (100+ characters) → preview wraps correctly, no overflow
- [ ] Special characters in fields (quotes, ampersands, angle brackets) → rendered safely, no XSS
- [ ] Rapidly filling and clearing fields → preview stays in sync, no stale data
- [ ] Multiple rapid clicks on Download PDF → only one PDF generated (button disabled during generation)

### MT-13: Browser Compatibility
- [ ] Chrome (latest) — all features work
- [ ] Firefox (latest) — all features work
- [ ] Safari (latest) — all features work
- [ ] Edge (latest) — all features work
