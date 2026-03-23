

# Enhancement Plan: Authorizations + Courses + Center Profile

## Summary

Three areas of work:
1. **Admin Authorizations** -- add validity, fees, commission fields; PDF certificate; assign authorization to center
2. **Admin Courses** -- add syllabus/topics management inline
3. **Center Profile** -- show validity/renewal info; allow PDF certificate download

---

## 1. Admin Authorizations -- New Fields

The `authorizations` table currently only has: name, code, description, status. The feedback asks for additional fields on the authorization itself.

### Database Migration
Add columns to `authorizations`:
- `validity_days` (integer, default 365)
- `fees` (numeric, default 0) -- authorization fees
- `commission_rate` (numeric, default 0) -- commission percentage

### UI Changes
- Update the authorization form (in `Authorizations.tsx` renderForm) to include:
  - Validity (days) -- numeric input, default 365
  - Authorization Fees (₹) -- numeric input
  - Commission Rate (%) -- numeric input
- Update the table to show these new columns
- Update `useAuthorizations.ts` interfaces to include new fields

---

## 2. Admin Authorizations -- Assign to Center

Currently `center_courses` links centers to individual courses. The feedback wants to assign an **authorization** (the parent category) to a center, which implicitly grants access to all courses under it.

### Approach
- The existing `AuthorizationForm.tsx` component already handles center-course assignment with financial details and validity. This is the "Assign Authorization to Center" flow.
- Update the Authorizations page to add an "Assign to Center" action in each row's dropdown menu
- When clicked, open a dialog using `AuthorizationForm.tsx` but pre-filter courses to only those under the selected authorization
- The `center_courses` table already has `valid_from`, `valid_until`, `registration_amount`, `commission_percent` etc.

### Implementation
- Add "Assign to Center" dropdown item in `Authorizations.tsx` table rows
- Open a dialog with center selection + course multi-select (filtered by authorization_id)
- Use existing `useAssignCourseToCenter` mutation

---

## 3. PDF Certificate Generation

Generate a downloadable PDF certificate for an authorization assignment.

### Implementation
- Install `jspdf` and `html2canvas` (or use jspdf directly with text layout)
- Create a utility function `generateAuthorityCertificate()` that produces a PDF with:
  - Certificate title, authorization name/code
  - Center name, validity dates, certificate number
  - Professional layout with borders
- Add "Download Certificate" button in the authorization assignment details and in center profile
- Use `jspdf` to create the PDF client-side

---

## 4. Admin Courses -- Syllabus Management

The `course_topics` table and `useCourseTopics.ts` hook already exist. The feedback wants syllabus topics to be manageable from the Courses page.

### Implementation
- The `CourseForm.tsx` already has a "Manage Syllabus" button placeholder
- Create a `CourseSyllabusDialog.tsx` component that:
  - Lists existing topics for a course
  - Allows add/edit/delete/reorder of topics
  - Each topic has: name, max_marks, sort_order
- Wire it up in `Courses.tsx` via the `onManageSyllabus` prop

---

## 5. Center Profile -- Validity & Certificate

### Show Validity for Renewal
- In the center profile's Authorizations section, show `valid_from` and `valid_until` dates for each authorization
- Add expiry status badges: "Active", "Expiring Soon" (< 30 days), "Expired"
- Show days remaining

### Allow PDF Certificate Download
- Add a "Download Certificate" button next to each authorization in the center profile
- Reuse the same PDF generation utility from item 3

---

## Files to Create/Modify

### New Files:
1. `src/lib/generateAuthorityCertificate.ts` -- PDF generation utility
2. `src/components/admin/CourseSyllabusDialog.tsx` -- Topic management dialog

### Modified Files:
1. `src/hooks/useAuthorizations.ts` -- add new fields to interfaces
2. `src/pages/admin/Authorizations.tsx` -- add form fields, assign-to-center action
3. `src/pages/admin/Courses.tsx` -- wire up syllabus dialog
4. `src/pages/center/Profile.tsx` -- add validity display, certificate download

### Database Migration:
- Add `validity_days`, `fees`, `commission_rate` to `authorizations` table

---

## Implementation Order

1. Database migration (add columns to authorizations)
2. Update authorization form with new fields + table columns
3. Add "Assign to Center" flow on Authorizations page
4. Build PDF certificate generation
5. Build syllabus management dialog for courses
6. Update center profile with validity display + certificate download

