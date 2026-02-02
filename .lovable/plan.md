

# PBS Management Ecosystem - Enhancement Plan

## Overview
This plan addresses all the feedback points for the Super Admin portal, focusing on Center Management, Authorizations, Courses, and Coordinators enhancements.

---

## 1. Add Center Enhancements

### 1.1 Auto-Generate Center Code
**Current**: Manual entry of center code  
**Required**: Auto-generated with sequence logic (e.g., starts with "27" or alphabet pattern)

**Implementation**:
- Create a database function `generate_center_code()` similar to existing `generate_enrollment_no()`
- Pattern: `PBS27001`, `PBS27002`, etc. (PBS + year + sequence)
- Make the code field read-only in the form when creating
- Allow editing for existing centers if needed

### 1.2 State & City Dropdowns
**Current**: Manual text input for city and state  
**Required**: Dropdown selection for uniqueness

**Implementation**:
- Create `src/lib/constants/indianStates.ts` with all 28 states and 8 UTs
- Create `src/lib/constants/indianCities.ts` with major cities grouped by state
- Update `CenterForm.tsx`:
  - Replace State input with searchable Select dropdown
  - Replace City input with searchable combobox that filters based on selected state
  - Keep Pincode as manual entry

### 1.3 Set User ID and Password for Center
**Current**: No user creation when adding a center  
**Required**: Create login credentials during center creation

**Implementation**:
- Add fields to CenterForm: Login Email, Password, Confirm Password
- Create an Edge Function `create-center-admin` to:
  1. Create auth user with provided credentials
  2. Create profile with center_id linked
  3. Assign `center_admin` role in user_roles table
- Call this function after center creation succeeds
- Show generated credentials or confirmation

### 1.4 Remove Delete Button - Use Inactive Status
**Current**: Delete button exists in CentersTable  
**Required**: No delete, only set to Inactive

**Implementation**:
- Remove Delete option from CentersTable dropdown menu
- Add "Set Inactive" / "Set Active" toggle option instead
- Remove the delete confirmation dialog
- Update `handleDelete` to `handleToggleStatus`

### 1.5 Center Profile Page in Actions Menu
**Current**: Only Edit, Email, Delete in dropdown  
**Required**: Add "View Profile" option

**Implementation**:
- Add "View Profile" option to CentersTable dropdown
- Create a `CenterProfileDialog.tsx` component showing:
  - Full center details
  - Assigned courses (authorizations)
  - Student count
  - Coordinator assignment
  - Activity history

### 1.6 Assign Coordinator - Default or Dropdown
**Current**: No coordinator assignment in center form  
**Required**: Assign coordinator with "Proactive HO" as default

**Implementation**:
- Add `coordinator_id` column to centers table (nullable UUID)
- Add coordinator dropdown to CenterForm
- Fetch coordinators list for dropdown
- Create a default "Proactive HO" coordinator entry if not exists
- Pre-select "Proactive HO" when creating new center

---

## 2. Authorization Enhancements

### 2.1 Create New Authorization Feature
**Current**: Can only manage courses from center's dropdown  
**Required**: Dedicated "Create New Authorization" button

**Implementation**:
- Add "Create Authorization" button at page header level
- Create `AuthorizationForm` dialog with:
  - Center selection dropdown
  - Course selection dropdown
  - Registration Amount field
  - Commission Amount/Percent field
  - Kit Value field
  - Exam Value field
  - Validity (default 365 days) field
  - Status selection

### 2.2 Add Validity Field
**Current**: No validity/expiry tracking  
**Required**: 365 days default validity

**Implementation**:
- Add `valid_from` (date) and `valid_until` (date) columns to `center_courses` table
- Default `valid_from` to current date
- Default `valid_until` to current date + 365 days
- Show expiry status in the authorization list
- Add expired/expiring-soon badges

### 2.3 Download Authority E-Certificate
**Current**: Not available  
**Required**: Downloadable certificate PDF

**Implementation**:
- Create `AuthorityCertificate.tsx` component with certificate layout
- Include: Center name, Course name, Authorization date, Validity, Unique certificate number
- Use html2canvas + jsPDF to generate PDF
- Add "Download Certificate" button in authorization details

---

## 3. Course Enhancements

### 3.1 Split Course Fee: Exam Only vs Exam+Kit
**Current**: Single fee field  
**Required**: Two separate fee fields

**Implementation**:
- Add `exam_fee` column to courses table (keep existing `fee` as total/kit+exam)
- Rename existing `fee` to display as "Kit + Exam Fee"
- Update CourseForm with two fields: Exam Only Fee, Full Fee (Exam+Kit)
- Update CoursesTable to show both fees

### 3.2 Dropdown for Authorization
**Current**: Not present  
**Required**: Link to authorization from course view

**Implementation**:
- In course details/edit view, show which centers are authorized for this course
- Add quick-link to Authorizations page filtered by this course

### 3.3 Assign Syllabus/Topics to Course
**Current**: Only description field  
**Required**: Structured syllabus for marksheet printing

**Implementation**:
- Create `course_topics` table:
  - id, course_id, topic_name, max_marks, sort_order
- Add "Manage Syllabus" button in course details
- Create `CourseSyllabusForm.tsx` for adding/editing topics
- These topics will be used for marksheet generation

### 3.4 Exam Assignment (Exam Portal Integration)
**Current**: Not available  
**Required**: Link course to exam portal

**Implementation**:
- Add `exam_portal_id` column to courses table
- Add Exam Portal ID field in CourseForm
- This will be used for future exam portal integration

### 3.5 Remove Delete - Use Inactive Status
**Current**: Delete button exists (disabled when students enrolled)  
**Required**: No delete, only Inactive status

**Implementation**:
- Remove Delete option from CoursesTable dropdown
- Add "Set Inactive" toggle instead
- Same pattern as centers

---

## 4. Coordinators Enhancements

### 4.1 Show Assigned Centers
**Current**: Shows count only in table  
**Required**: Show actual center names/list

**Implementation**:
- In the table, show first 2-3 center names with "+X more" badge
- In View Details dialog, already shows full list (verify working)
- Add ability to assign/unassign centers from edit dialog

### 4.2 Center Assignment in Edit Form
**Current**: Can only view assigned centers  
**Required**: Edit assigned centers from form

**Implementation**:
- Add multi-select checkbox list or transfer list for centers
- Save selected center IDs to `assigned_centers` array
- Update coordinator on save

---

## Database Changes Required

```sql
-- 1. Add coordinator_id to centers
ALTER TABLE centers ADD COLUMN coordinator_id uuid REFERENCES coordinators(id);

-- 2. Add validity dates to center_courses (authorizations)
ALTER TABLE center_courses ADD COLUMN valid_from date DEFAULT CURRENT_DATE;
ALTER TABLE center_courses ADD COLUMN valid_until date DEFAULT (CURRENT_DATE + INTERVAL '365 days');
ALTER TABLE center_courses ADD COLUMN registration_amount numeric DEFAULT 0;
ALTER TABLE center_courses ADD COLUMN certificate_no text;

-- 3. Add exam_fee to courses
ALTER TABLE courses ADD COLUMN exam_fee numeric DEFAULT 0;
ALTER TABLE courses ADD COLUMN exam_portal_id text;

-- 4. Create course_topics table for syllabus
CREATE TABLE course_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  topic_name text NOT NULL,
  max_marks integer DEFAULT 100,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 5. Create function to generate center code
CREATE OR REPLACE FUNCTION generate_center_code() RETURNS text ...

-- 6. Enable RLS on new table
ALTER TABLE course_topics ENABLE ROW LEVEL SECURITY;
```

---

## Files to Create/Modify

### New Files:
1. `src/lib/constants/indianStates.ts` - State/UT list
2. `src/lib/constants/indianCities.ts` - Cities by state
3. `src/components/admin/CenterProfileDialog.tsx` - Full center view
4. `src/components/admin/AuthorizationForm.tsx` - Create authorization
5. `src/components/admin/AuthorityCertificate.tsx` - PDF certificate
6. `src/components/admin/CourseSyllabusForm.tsx` - Topic management
7. `src/hooks/useCourseTopics.ts` - Syllabus CRUD operations
8. `supabase/functions/create-center-admin/index.ts` - User creation

### Modified Files:
1. `src/components/admin/CenterForm.tsx` - Add dropdowns, coordinator, user fields
2. `src/components/admin/CentersTable.tsx` - Remove delete, add profile view
3. `src/pages/admin/Centers.tsx` - Handle new actions
4. `src/pages/admin/Authorizations.tsx` - Add create button, validity display
5. `src/components/admin/CourseForm.tsx` - Add exam fee, syllabus link
6. `src/components/admin/CoursesTable.tsx` - Remove delete, add inactive toggle
7. `src/pages/admin/Coordinators.tsx` - Add center assignment in edit
8. `src/hooks/useCenters.ts` - Add toggle status mutation
9. `src/hooks/useCourses.ts` - Add toggle status mutation
10. `src/hooks/useCenterCourses.ts` - Add validity fields

---

## Implementation Order

**Phase 1 - Database & Core Changes**:
1. Run database migrations for all new columns/tables
2. Create center code generation function
3. Create edge function for center admin user creation

**Phase 2 - Center Enhancements**:
1. Add Indian states/cities constants
2. Update CenterForm with dropdowns and coordinator
3. Update CentersTable (remove delete, add profile view)
4. Create CenterProfileDialog

**Phase 3 - Authorization Enhancements**:
1. Create AuthorizationForm component
2. Add validity display and filtering
3. Create certificate generation

**Phase 4 - Course Enhancements**:
1. Update CourseForm with exam fee
2. Create syllabus management
3. Update CoursesTable (remove delete)

**Phase 5 - Coordinator Enhancements**:
1. Update edit form with center assignment
2. Improve assigned centers display

---

## Technical Considerations

- **Edge Function for User Creation**: Required because Supabase auth user creation with admin SDK needs server-side execution
- **PDF Generation**: Will use html2canvas + jsPDF libraries (need to add to dependencies)
- **Searchable Dropdowns**: Will use the existing `cmdk` command component for better UX with large lists
- **State Management**: All changes leverage existing React Query patterns for consistency

