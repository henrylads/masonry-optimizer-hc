# Form Simplification Manual Test Results

**Test Date:** 2025-11-06
**Testing Branch:** project-dashboard (worktree)
**Plan Reference:** docs/plans/2025-11-06-form-simplification-and-tool-integration.md (Task 7)

## Test Environment
- **Dev Server:** http://localhost:3000
- **Test Page:** /project/[id] (Masonry Designer Form)
- **Tester:** [To be filled in]
- **Browser:** [To be filled in]

---

## Manual Test Scenarios

### 1. Core Fields Accept Valid Input
**Status:** [ ] Pass [ ] Fail [ ] Not Tested

**Test Steps:**
1. Navigate to project page with an active design
2. Fill in all core fields with valid values:
   - Support Level (mm): 3000
   - Cavity Width (mm): 50
   - Slab Thickness (mm): 250
   - Characteristic Load (kN/m): 10
   - Top Critical Edge (mm): 100
   - Bottom Critical Edge (mm): 100
   - Notch Height (mm): 50

**Expected Result:**
- All fields accept the input without validation errors
- No red error messages appear
- Field values are retained

**Actual Result:**
[To be filled in]

**Notes:**
[Any observations]

---

### 2. Core Fields Show Validation Errors for Invalid Input
**Status:** [ ] Pass [ ] Fail [ ] Not Tested

**Test Steps:**
1. Navigate to project page with an active design
2. Test each core field with invalid values:
   - Support Level: -100 (negative)
   - Cavity Width: 0 (zero)
   - Slab Thickness: "abc" (non-numeric)
   - Characteristic Load: blank (empty)
3. Attempt to move to next field or submit

**Expected Result:**
- Validation errors appear for each invalid field
- Error messages are clear and descriptive
- Form prevents submission with invalid data

**Actual Result:**
[To be filled in]

**Notes:**
[Any observations]

---

### 3. "Advanced Options" Button Toggles Visibility
**Status:** [ ] Pass [ ] Fail [ ] Not Tested

**Test Steps:**
1. Navigate to project page with an active design
2. Locate the "Advanced Options" button/toggle
3. Click to expand advanced options
4. Click again to collapse advanced options

**Expected Result:**
- Advanced fields are hidden by default
- Clicking expands to show advanced fields (bracket centers, material properties, etc.)
- Clicking again collapses the section
- Button icon/text indicates current state

**Actual Result:**
[To be filled in]

**Notes:**
[Any observations]

---

### 4. Density Calculator Button Opens Inline Calculator
**Status:** [ ] Pass [ ] Fail [ ] Not Tested

**Test Steps:**
1. Navigate to project page with an active design
2. Locate the density calculator button (likely near characteristic load field)
3. Click the calculator button

**Expected Result:**
- Inline calculator appears in the form
- Calculator shows input fields for wall thickness, mortar density, and brick density
- Calculator UI is clearly visible and accessible

**Actual Result:**
[To be filled in]

**Notes:**
[Any observations]

---

### 5. Density Calculator "Use This Value" Populates Load Field
**Status:** [ ] Pass [ ] Fail [ ] Not Tested

**Test Steps:**
1. Open the density calculator (per Test 4)
2. Enter values in calculator:
   - Wall Thickness: 100 mm
   - Mortar Density: 2000 kg/m³
   - Brick Density: 1800 kg/m³
3. Click "Use This Value" or similar action button

**Expected Result:**
- Calculator computes the characteristic load
- Computed value is inserted into the characteristic load field
- Calculator closes or collapses
- Form shows the new value

**Actual Result:**
[To be filled in]

**Notes:**
[Calculated value: ___]

---

### 6. Form Submission Works with Only Core Fields Filled
**Status:** [ ] Pass [ ] Fail [ ] Not Tested

**Test Steps:**
1. Navigate to project page with an active design
2. Fill in ONLY the core fields with valid values
3. Leave all advanced options at default/empty
4. Click "Optimize" or form submission button

**Expected Result:**
- Form validates successfully
- Optimization process begins
- No errors about missing advanced fields
- Results are generated

**Actual Result:**
[To be filled in]

**Notes:**
[Any observations]

---

### 7. Form Submission Works with Advanced Options
**Status:** [ ] Pass [ ] Fail [ ] Not Tested

**Test Steps:**
1. Navigate to project page with an active design
2. Fill in core fields with valid values
3. Expand advanced options
4. Modify some advanced fields (e.g., bracket centers, wind load multiplier)
5. Click "Optimize" or form submission button

**Expected Result:**
- Form validates successfully with advanced options
- Advanced values are included in optimization
- Results reflect the custom advanced settings
- No errors occur

**Actual Result:**
[To be filled in]

**Notes:**
[Which advanced fields were modified: ___]

---

### 8. Steel-Specific Fields Show Only for Steel Types
**Status:** [ ] Pass [ ] Fail [ ] Not Tested

**Test Steps:**
1. Navigate to project page with an active design
2. Select a steel bracket type from material dropdown
3. Observe which fields are visible
4. Select a concrete bracket type
5. Observe which fields are visible/hidden

**Expected Result:**
- When steel is selected, steel-specific fields appear (e.g., steel fixing method, bolt specifications)
- When concrete is selected, steel-specific fields are hidden
- Conditional fields are clearly organized
- No orphaned labels or inputs

**Actual Result:**
[To be filled in]

**Notes:**
[List steel-specific fields observed: ___]

---

### 9. Concrete-Specific Fields Show Only for Concrete Types
**Status:** [ ] Pass [ ] Fail [ ] Not Tested

**Test Steps:**
1. Navigate to project page with an active design
2. Select a concrete bracket type from material dropdown
3. Observe which fields are visible
4. Select a steel bracket type
5. Observe which fields are visible/hidden

**Expected Result:**
- When concrete is selected, concrete-specific fields appear (e.g., concrete strength, embedment depth)
- When steel is selected, concrete-specific fields are hidden
- Conditional fields are clearly organized
- No orphaned labels or inputs

**Actual Result:**
[To be filled in]

**Notes:**
[List concrete-specific fields observed: ___]

---

## Overall Test Summary

**Total Tests:** 9
**Passed:** ___
**Failed:** ___
**Not Tested:** ___

### Critical Issues Found
[List any blocking issues that prevent basic functionality]

### Minor Issues Found
[List any non-blocking issues, UI inconsistencies, or suggestions]

### Browser Compatibility Notes
[Any browser-specific issues observed]

### Recommendations
[Suggestions for improvements or additional testing needed]

---

## Sign-off

**Tested By:** _______________
**Date:** _______________
**Approved:** [ ] Yes [ ] No [ ] With Conditions

**Notes:**
