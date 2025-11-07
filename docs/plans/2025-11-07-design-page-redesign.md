# Design Page Redesign - Three-Panel Layout with 3D Viewer

**Date:** 2025-11-07
**Status:** Approved Design
**Author:** Design Session with User

## Overview

Redesign the design editing experience to move away from tabbed interface to a dedicated page with three-panel layout: inputs on left, full-screen 3D viewer in center, and collapsible results panel on right. This provides a CAD-like workflow optimized for iterative design work.

## Goals

1. Maximize 3D viewer visibility with full-screen center panel
2. Keep design inputs always accessible in left panel
3. Provide quick access to results and alternatives in collapsible right panel
4. Enable proper URL routing for bookmarking and sharing designs
5. Remove project information fields (handled by project page now)
6. Enhance 3D viewer with advanced ShapeDiver features

## Design Decisions Summary

All decisions made with user during brainstorming session:

1. **Route Structure:** New dedicated route `/project/[projectId]/design/[designId]` ✓
2. **Left Panel:** Single scrollable panel with core fields and collapsible advanced options ✓
3. **Right Panel:** Slide-out panel with toggle button, fully collapsible ✓
4. **Alternatives:** Inline comparison in right panel "Alternatives" tab ✓
5. **Header:** Minimal breadcrumb header, AppSidebar hidden in design view ✓

## Page Layout & Architecture

### Overall Structure

```
┌──────────────────────────────────────────────────────────────┐
│ AuthHeader (logout, user info)                               │
├──────────────────────────────────────────────────────────────┤
│ ← Back  Projects / Test / MSD01  [Edit]    ● Saved          │
├──────────┬─────────────────────────────┬────────────────────┤
│          │                             │                    │
│  Left    │      Center Panel           │  Right Panel       │
│  Panel   │      3D Viewer              │  (Collapsible)     │
│  320px   │      (flex-1)               │  350px        [>]  │
│          │                             │                    │
│ [Run]    │   ShapeDiver Viewer         │ Results | Alt      │
│          │   Full Height               │                    │
│ Inputs   │   Background: #e5e7eb       │ - Summary          │
│ - Core   │                             │ - Parameters       │
│ - Adv    │   Enhanced Controls         │ - Verification     │
│          │                             │                    │
│ [Run]    │                             │                    │
│          │                             │                    │
└──────────┴─────────────────────────────┴────────────────────┘
```

### Layout Implementation

**CSS Grid:**
```css
display: grid;
grid-template-columns: 320px 1fr 350px; /* right panel collapses to 0 */
```

**Responsive Breakpoints:**
- Desktop (>1280px): All three panels visible
- Tablet (768-1280px): Left panel becomes drawer, right auto-collapses
- Mobile (<768px): Stack vertically

### Route Structure

**New Route:** `/app/project/[projectId]/design/[designId]/page.tsx`

**Benefits:**
- Bookmarkable URLs for specific designs
- Browser back button works naturally
- Shareable links to specific designs
- Maintains project context in URL hierarchy

## Header & Navigation

### AuthHeader
- Reuse existing component
- Clariti logo left, user profile/logout right
- Consistent across all pages

### Breadcrumb Bar

**Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│ ← Back    Projects / Test Project / MSD01 [✏️]    ● Saved   │
└──────────────────────────────────────────────────────────────┘
```

**Elements:**

1. **Back Button**
   - Icon: `← Back`
   - Action: `router.push(/project/${projectId})`
   - Returns to project designs tab

2. **Breadcrumb Path**
   - "Projects" → clickable → `/dashboard`
   - "Test Project" → clickable → `/project/[projectId]`
   - "MSD01" → current design name → editable with pencil icon

3. **Design Name Editing**
   - Click pencil icon → inline input appears
   - Enter/blur saves, Esc cancels
   - Updates design name in database
   - Breadcrumb updates immediately

4. **Save Status Indicator** (right side)
   - ● Green + "Saved" (idle, all changes saved)
   - ⏳ Spinner + "Saving..." (actively saving)
   - ● Red + "Save failed" (error state)

**Styling:**
- Height: 48px (compact)
- Background: White with subtle bottom border
- Sticky positioning (stays visible on scroll)
- Text: muted-foreground for path, bold for current design

### AppSidebar Visibility

**Hidden in design view** to maximize horizontal space:
- No Projects/Knowledge Base/Settings sidebar
- Maximum space for three-panel layout
- Breadcrumb provides navigation back up
- Consistent with CAD/design tool patterns

## Left Panel - Design Inputs

### Panel Structure

**Dimensions:**
- Fixed width: 320px
- Full height with internal scroll
- White background, subtle right border
- Padding: 16px

### Content Organization

**1. Run Optimization Button (Top)**
```
┌──────────────────────────────┐
│  [Run Optimization]          │
└──────────────────────────────┘
```
- Primary action button
- Black background, white text
- Shows loading spinner when running
- Disabled if form has validation errors
- Easy to find without scrolling

**2. Core Input Fields**
- Reuse `CoreFields` component
- **Remove project information fields** (name, description)
- Essential parameters only:
  - Building height, floor-to-floor
  - Facade thickness
  - Material type
  - Load values
  - Frame fixing type
  - Channel products
- Clean vertical stack
- Inline validation (red text for errors)

**3. Advanced Options**
- Collapsible section with chevron icon
- Header: "Advanced Options ›"
- Collapsed by default
- When expanded: shows `AdvancedOptions` component
  - Custom steel sections
  - Fixing position overrides
  - Dim D customization
  - Load modifiers
  - Inline density calculator
- State persists in session storage

**4. Run Optimization Button (Bottom)**
```
┌──────────────────────────────┐
│  [Run Optimization]          │
└──────────────────────────────┘
```
- Duplicate of top button
- Appears after scrolling through all inputs
- Both buttons trigger same action
- Prevents need to scroll back up

### Form Behavior

- Auto-save continues to work (existing hook)
- Real-time validation
- Changes trigger "Saving..." status in header
- No separate submit button needed

## Center Panel - 3D Viewer

### Panel Structure

**Dimensions:**
- Flexible width: `flex-1` (takes remaining space)
- Full height from header to bottom
- No padding (viewer fills entire area)
- Background: `#e5e7eb` (gray-200)

### ShapeDiver Viewer

**Integration:**
- Reuse existing `ShapeDiver` component
- Mounted directly without card wrapper
- Full width and height of panel
- Maintains aspect ratio automatically

### Viewer States

**1. Initial State (No Optimization Yet)**
- Gray background (#e5e7eb)
- Centered message: "Run optimization to view 3D model"
- Icon: Box or 3D cube icon
- Subtle, non-intrusive

**2. During Optimization**
- Loading overlay with progress
- "Optimizing... 45% complete"
- Semi-transparent dark overlay
- Progress bar
- Model may show previous result or empty

**3. After Optimization**
- Display optimized 3D model
- Interactive controls active
- Auto-updates when switching alternatives
- Smooth transitions on model updates

### Enhanced Viewer Controls

**Beyond ShapeDiver defaults, explore adding:**
- **View Presets**: Front, Top, Right, Isometric buttons
- **Section Cuts**: Toggle section plane for internal views
- **Exploded View**: Show assembly separated (if supported)
- **Measurements**: Click-to-measure distances
- **Annotations**: Show/hide dimension labels
- **Camera**: Save/restore camera positions
- **Export**: Screenshot, 3D model export

*(Note: Need to verify ShapeDiver API capabilities - some may require custom implementation)*

### Model Updates

**Triggers:**
- Optimization completes → load best result
- User selects alternative → load that solution
- Debounced updates (300ms) to prevent thrashing

**Behavior:**
- Shows loading state during parameter updates
- Smooth transitions between solutions
- Maintains camera position when switching alternatives
- Performance optimized (lazy load SDK, cleanup on unmount)

## Right Panel - Results & Alternatives

### Panel Structure

**Dimensions:**
- Fixed width when open: 350px
- Full height with internal scroll
- White background, subtle left border
- Padding: 16px
- Slide animation on collapse/expand

### Toggle Button

**Appearance:**
```
[>]  ← Button on left edge
```
- Positioned at vertical center of panel
- Icon changes based on state:
  - `>` when open (click to close)
  - `<` when closed (click to open)
- Floating button on left edge
- White background with shadow
- Always visible even when collapsed

**Behavior:**
- Click to toggle panel open/closed
- State saved to localStorage
- When closed: 3D viewer expands to full width
- When open: Shows 350px panel

### Panel Tabs

**When open, show tabs at top:**
```
┌─────────────────────────────┐
│ Results | Alternatives      │
├─────────────────────────────┤
```

### Results Tab Content

**Three collapsible accordion sections:**

**1. Design Summary** (expanded by default)
- **Total Weight** (kg) - prominent display
- Estimated cost (if available)
- Key metrics at a glance
- Visual indicators (icons, colors)
- Material efficiency score
- Clean, scannable format

**2. Design Parameters** (collapsed by default)
- Key dimensions from optimized solution
- Bracket type and size
- Angle type and size
- Material specifications
- Channel product used
- Displayed as label-value pairs
- Organized by category

**3. Verification Checks** (collapsed by default)
- List of all structural checks
- Pass/fail status with icons:
  - ✓ Green checkmark for pass
  - ✗ Red X for fail
- Click to expand section for details
- Shows:
  - Shear check
  - Tension check
  - Moment check
  - Deflection check
- Utilization ratios displayed
- Color-coded by severity

### Alternatives Tab Content

**Purpose:**
- Compare multiple optimization solutions
- Quick switching between alternatives

**Layout:**
Compact table showing top 5 solutions:

```
┌─────────────────────────────┐
│ ○ Solution 1  245kg  ✓      │
│ ● Solution 2  248kg  ✓      │ ← Selected
│ ○ Solution 3  251kg  ✓      │
│ ○ Solution 4  253kg  ✓      │
│ ○ Solution 5  255kg  ⚠      │
└─────────────────────────────┘
```

**Columns:**
- Radio button for selection
- Solution number
- Total weight
- Status icon (all checks pass/warning)

**Behavior:**
- Selected solution highlighted
- Click to select different solution
- Updates 3D viewer immediately
- Updates Results tab with selected solution data

**Empty State:**
- "Run optimization to see alternatives"
- Shown if no optimization run yet

## Component Architecture

### New Components to Create

**1. DesignBreadcrumb** (`src/components/design/design-breadcrumb.tsx`)
- Displays breadcrumb navigation
- Handles design name inline editing
- Shows save status indicator
- Props:
  - `projectId: string`
  - `projectName: string`
  - `designId: string`
  - `designName: string`
  - `saveStatus: 'saved' | 'saving' | 'error'`
  - `onUpdateDesignName: (name: string) => void`

**2. DesignInputPanel** (`src/components/design/design-input-panel.tsx`)
- Left panel container
- Contains form with CoreFields and AdvancedOptions
- Dual "Run Optimization" buttons (top and bottom)
- Props:
  - `designId: string`
  - `form: UseFormReturn`
  - `onOptimize: () => void`
  - `isOptimizing: boolean`

**3. DesignViewerPanel** (`src/components/design/design-viewer-panel.tsx`)
- Center panel wrapper for ShapeDiver viewer
- Handles loading states and empty state
- Shows optimization progress overlay
- Props:
  - `optimizationResult: OptimisationResult | null`
  - `isOptimizing: boolean`
  - `progress: number`

**4. DesignResultsPanel** (`src/components/design/design-results-panel.tsx`)
- Right panel with slide-in/out functionality
- Contains tabs for Results and Alternatives
- Manages panel open/close state
- Props:
  - `optimizationResult: OptimisationResult | null`
  - `alternatives: OptimisationResult[]`
  - `selectedIndex: number`
  - `onSelectAlternative: (index: number) => void`
  - `isOpen: boolean`
  - `onToggle: () => void`

**5. ResultsTab** (`src/components/design/results-tab.tsx`)
- Summary, Parameters, Verification sections
- Accordion-style collapsible sections
- Props:
  - `result: OptimisationResult`

**6. AlternativesTab** (`src/components/design/alternatives-tab.tsx`)
- Table of alternative solutions with selection
- Props:
  - `alternatives: OptimisationResult[]`
  - `selectedIndex: number`
  - `onSelect: (index: number) => void`

### Components to Reuse

**From existing codebase:**
- `CoreFields` - design inputs (modified to remove project info fields)
- `AdvancedOptions` - advanced settings (unchanged)
- `ShapeDiver` - 3D viewer (unchanged)
- `InlineDensityCalculator` - density tool (unchanged)
- Form validation schemas and hooks
- Autosave hook (`useDesignAutosave`)

### Main Page Component

**Path:** `/app/project/[projectId]/design/[designId]/page.tsx`

**Responsibilities:**
- Orchestrates all panels
- Manages optimization state
- Handles data fetching and saving
- Coordinates state between panels

## State Management & Data Flow

### Page-Level State

```typescript
// Main state in page.tsx
const [optimizationResult, setOptimizationResult] = useState<OptimisationResult | null>(null)
const [alternatives, setAlternatives] = useState<OptimisationResult[]>([])
const [selectedAlternativeIndex, setSelectedAlternativeIndex] = useState(0)
const [isOptimizing, setIsOptimizing] = useState(false)
const [progress, setProgress] = useState(0)
const [rightPanelOpen, setRightPanelOpen] = useState(true)
const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved')
```

### Data Flow Scenarios

**1. On Page Load:**
- Fetch design data: `GET /api/designs/[designId]`
- Load saved form parameters into form
- Load last optimization result if exists
- Restore right panel state from localStorage
- Initialize form with validation

**2. When User Changes Inputs:**
- Form updates immediately (controlled inputs)
- Autosave hook debounces (500ms) and saves to database
- Save status updates: saved → saving → saved
- Breadcrumb shows save status
- 3D viewer does NOT update (waits for optimization)

**3. When User Clicks "Run Optimization":**
- Validate form inputs
- If invalid: show validation errors, prevent run
- If valid:
  - Set `isOptimizing = true`
  - Clear previous results
  - Call optimization algorithm with current form values
  - Update `progress` state as optimization runs
  - Show progress overlay on 3D viewer
  - On completion:
    - Set `optimizationResult` to best solution (index 0)
    - Set `alternatives` to top 5 solutions
    - Set `selectedAlternativeIndex = 0`
    - Update 3D viewer with result
    - Auto-open right panel if closed
    - Save result to database
  - Set `isOptimizing = false`

**4. When User Selects Alternative:**
- Update `selectedAlternativeIndex` to clicked index
- Update `optimizationResult` to `alternatives[index]`
- Update 3D viewer with new solution parameters
- Results tab automatically updates (using optimizationResult)
- Debounce viewer updates (300ms)

**5. When User Toggles Right Panel:**
- Update `rightPanelOpen` state
- Trigger CSS animation (slide in/out)
- Save preference to localStorage
- 3D viewer automatically resizes (flex-1)

**6. When User Edits Design Name:**
- Update breadcrumb inline input
- On save (Enter/blur):
  - Call `PATCH /api/designs/[designId]` with new name
  - Update local state
  - Show save status in breadcrumb

## Navigation & Integration

### Changes to Existing Components

**1. DesignCard Component** (`src/components/project/design-card.tsx`)

Change "Open Design" button behavior:
```typescript
// OLD: onOpen(design.id)
// NEW:
const router = useRouter()
const handleOpenClick = () => {
  router.push(`/project/${projectId}/design/${design.id}`)
}
```

**2. Project Page** (`src/app/project/[id]/page.tsx`)

Remove design editing UI:
- Remove `activeDesignId` state
- Remove `MasonryDesignerForm` rendering
- Remove "Back to Designs" button
- Remove tab content switching logic
- DesignsTab shows only cards, clicking navigates

**3. DesignsTab Component** (`src/components/project/designs-tab.tsx`)

Update to pass projectId to DesignCard:
```typescript
<DesignCard
  design={design}
  projectId={projectId}  // Add this
  onDelete={onDeleteDesign}
/>
```

### URL Structure

```
/dashboard                                    # Dashboard page
/project/[projectId]                          # Project page (Designs, Intelligence tabs)
/project/[projectId]/design/[designId]        # Design page (NEW)
```

### Browser Behavior

- **Back button** from design page → returns to project page
- **Refresh** on design page → reloads same design
- **Shareable URLs** for specific designs
- **Browser history** tracks navigation properly

### Deep Linking

- Share direct link: `/project/abc123/design/xyz789`
- Auth middleware checks user has access to project
- 404 page if design doesn't exist or user lacks permission
- Maintains project context in URL hierarchy

## API Requirements

### Existing Endpoints (Reuse)

- `GET /api/designs/[designId]` - Fetch design data
- `PATCH /api/designs/[designId]` - Update design (name, parameters, result)
- `POST /api/projects/[projectId]/designs` - Create new design
- `DELETE /api/designs/[designId]` - Delete design

### Data to Save

**Design record includes:**
- `formParameters` - Current input values (autosaved)
- `calculationResults` - Last optimization result
- `name` - Design name (editable in breadcrumb)
- `updatedAt` - Timestamp (shown in cards)

**Note:** Alternatives are derived from optimization run, not stored separately. Only best result saved to database.

## Styling Guidelines

### Colors

- Background gray: `#e5e7eb` (gray-200) for 3D viewer
- Panel backgrounds: White
- Borders: Subtle gray dividers
- Primary action button: Black background, white text
- Success: Green for pass, checkmarks
- Error: Red for fail, errors
- Warning: Yellow/orange for warnings

### Typography

- Breadcrumb path: muted-foreground
- Current design name: font-bold
- Section headings: text-lg font-semibold
- Labels: text-sm text-muted-foreground
- Values: text-sm font-medium

### Spacing

- Panel padding: 16px
- Section spacing: mb-6
- Field spacing: mb-4
- Button spacing: gap-2

### Animations

- Panel slide: 300ms ease-in-out transform
- Model updates: Fade transition on ShapeDiver
- Button states: Standard hover/active transitions
- Accordion expand/collapse: 200ms ease

## User Flow Examples

### Creating and Optimizing First Design

1. User on project page clicks "New Design" button
2. Modal appears, user enters design name "MSD01"
3. Design created, user redirected to `/project/abc/design/xyz`
4. Design page loads with empty form
5. User fills in core parameters
6. Form auto-saves, breadcrumb shows "Saving..." then "Saved"
7. User expands "Advanced Options", adjusts settings
8. User clicks "Run Optimization" (top or bottom button)
9. Progress overlay appears on 3D viewer
10. Optimization completes, 3D model appears
11. Right panel auto-opens showing results
12. User reviews Design Summary, checks Verification
13. User switches to "Alternatives" tab, selects Solution 3
14. 3D viewer updates, results update
15. User satisfied, clicks breadcrumb back to project page

### Editing Existing Design

1. User on project page sees "MSD01" card
2. Clicks "Open Design" button
3. Navigates to `/project/abc/design/xyz`
4. Page loads with saved parameters and last optimization result
5. 3D viewer shows previous optimized model
6. Right panel shows last result (collapsed or expanded based on localStorage)
7. User changes facade thickness value
8. Form auto-saves, breadcrumb shows "Saving..."
9. User clicks "Run Optimization"
10. New optimization runs with updated parameters
11. 3D model updates, results update
12. User compares alternatives, selects preferred solution
13. User closes right panel for full-screen 3D view
14. User clicks "← Back" to return to project

### Sharing Design with Colleague

1. User copies URL from browser: `/project/abc123/design/xyz789`
2. Shares link via email/Slack
3. Colleague clicks link
4. Auth middleware verifies access
5. Design page loads with same parameters and results
6. Colleague can view 3D model, review results
7. If colleague edits and re-runs optimization, creates new fork/version (future enhancement)

## Success Criteria

- ✅ 3D viewer prominently displayed, full-screen center panel
- ✅ Design inputs always accessible in left panel, no tab switching
- ✅ Results easily accessible but collapsible for maximum viewer space
- ✅ Proper URL routing enables bookmarking and sharing
- ✅ Smooth workflow: change inputs → run optimization → view results → compare alternatives
- ✅ All existing functionality preserved (autosave, validation, optimization)
- ✅ Clean separation of concerns in component architecture
- ✅ Responsive design works on different screen sizes
- ✅ No loss of features from current implementation

## Future Enhancements

**Not included in this redesign but worth considering:**

1. **Design Versioning**
   - Save optimization history
   - Compare different optimization runs
   - Revert to previous configurations

2. **Collaborative Features**
   - Real-time updates when multiple users viewing
   - Comments/annotations on designs
   - Change tracking and audit log

3. **Enhanced 3D Features**
   - Multiple 3D view configurations
   - Custom camera presets per design
   - 3D annotations and markup
   - AR preview on mobile devices

4. **Export & Reporting**
   - PDF report generation
   - BIM/IFC export
   - Drawing package export
   - Cost estimation integration

5. **Comparison Tools**
   - Side-by-side 3D comparison
   - Overlay different solutions
   - Cost/weight/performance trade-off charts

6. **AI Suggestions**
   - Parameter recommendations
   - Design optimization suggestions
   - Automatic constraint detection
