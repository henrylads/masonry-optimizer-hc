# Project Page Redesign

**Date:** 2025-11-07
**Status:** Approved Design
**Author:** Design Session with User

## Overview

Redesign the project page to provide a cleaner, more modern interface with tabbed navigation for Designs and Intelligence features. Remove the ProjectSidebar and consolidate all content into the main area with a prominent project header.

## Goals

1. Improve visual hierarchy with prominent project title and metadata
2. Organize project content into clear tabs (Designs, Intelligence)
3. Display designs as cards similar to project cards on dashboard
4. Prepare UI for future Perplexity Intelligence integration
5. Maintain smooth navigation and state management

## Design Decisions

### Layout Structure

**Approved:** Option A - Keep AppSidebar, move everything to main content
- Left: AppSidebar (unchanged - Projects/Knowledge Base/Settings)
- Main: Project header → Tabs → Tab content
- Remove ProjectSidebar entirely

**Why:** Provides cleaner, more modern layout while maintaining consistent navigation pattern established in dashboard.

### Project Header

**Approved:** Option A - Minimal header, focus on title
- Project name (large, editable with pencil icon)
- "Construction Drawing Intelligence" subtitle
- Badges: Green "Active" + Blue stage badge ("Construction"/"Planning")
- Right-aligned buttons: "Delete Project", "Clear Data", "Change Project"

**Why:** Keeps header clean and focused, matching modern dashboard design. Additional details can be added to future tabs if needed.

### Design Cards

**Approved:** Option A - Similar to project cards
- Design name (e.g., "MSD01", "MSD02")
- Status badge (e.g., "Draft", "Optimized", "In Review")
- Key metrics preview (Weight, Cost if available)
- Last updated date (DD/MM/YYYY)
- "Open Design" button

**Why:** Provides useful at-a-glance information without overwhelming, matches approved project card styling.

### Design Opening Behavior

**Approved:** Option A - Stay on same page, show form
- Design cards fade out, form slides in
- Tabs and header remain visible
- Back button to return to cards view

**Why:** Smooth transitions, maintains context (tabs, project header) while working on design.

### Intelligence Tab

**Approved:** Option A - Coming Soon with basic UI
- "Project Intelligence" heading with "Coming Soon" badge
- Disabled search interface showing future functionality
- Feature preview section listing capabilities

**Why:** Visualizes future feature and sets up UI structure for easy integration later.

## Component Architecture

### New Components

1. **ProjectHeader** (`src/components/project/project-header.tsx`)
   - Project name (editable inline with pencil icon)
   - Subtitle: "Construction Drawing Intelligence"
   - Status badges (Active, stage)
   - Action buttons
   - Props: `project`, `onDelete`, `onClearData`, `onChangeProject`

2. **DesignCard** (`src/components/project/design-card.tsx`)
   - Design name as heading
   - "Masonry Support Design" subtitle
   - Status badge with colors
   - Key metrics (weight, cost)
   - Last updated date (DD/MM/YYYY format)
   - "Open Design" button (black with white text)
   - Delete menu (three dots, top right)
   - Props: `design`, `onOpen`, `onDelete`

3. **DesignsTab** (`src/components/project/designs-tab.tsx`)
   - Header: "Designs (count)" + "New Design" button
   - Grid layout: 3 cols (lg), 2 cols (md), 1 col (sm)
   - Maps designs to DesignCard components
   - Empty state: "No designs yet" with "Create First Design" button
   - Props: `designs`, `onOpenDesign`, `onNewDesign`, `onDeleteDesign`

4. **IntelligenceTab** (`src/components/project/intelligence-tab.tsx`)
   - Header: "Project Intelligence" + "Coming Soon" badge
   - Subtitle describing feature
   - Disabled search input with placeholder
   - Feature preview card with bullet list
   - No props needed (static content)

### Modified Components

**`src/app/project/[id]/page.tsx`** - Main page changes:
- Remove: ProjectSidebar import and usage
- Add: ProjectHeader component at top of main content
- Add: Tab state management using shadcn/ui Tabs component
- Add: Conditional rendering of DesignsTab or IntelligenceTab
- Add: "Back to Designs" button when design form is open
- Keep: Existing activeDesignId state and design form logic
- Keep: CreateDesignModal and handleCreateDesign logic

## State Management

```typescript
// Page state
const [activeTab, setActiveTab] = useState<'designs' | 'intelligence'>('designs')
const [activeDesignId, setActiveDesignId] = useState<string | null>(null)
const [modalOpen, setModalOpen] = useState(false)

// Derived state
const showDesignForm = activeDesignId !== null

// When opening design: setActiveDesignId(designId)
// When closing design: setActiveDesignId(null)
// Tab switching preserves activeDesignId
```

## URL Structure

- Base: `/project/[id]` - Shows Designs tab by default
- Optional query param: `/project/[id]?tab=intelligence` for deep linking
- Optional query param: `/project/[id]?design=[designId]` for sharing specific design

## Styling Guidelines

### Colors
- Black buttons with white text: `className="bg-black hover:bg-black/90 text-white"`
- Active badge (green): `className="bg-green-100 text-green-800"`
- Stage badge (blue): `className="bg-blue-100 text-blue-800"`
- Status badges: Use appropriate colors (yellow for draft, green for optimized, etc.)

### Layout
- Main content padding: `p-8`
- Project header margin bottom: `mb-6`
- Tabs margin bottom: `mb-6`
- Design cards grid gap: `gap-6`
- Card hover effect: `hover:shadow-md transition-shadow`

### Typography
- Project name: `text-3xl font-bold`
- Subtitle: `text-muted-foreground`
- Section headings: `text-2xl font-bold`
- Card titles: `text-lg font-semibold`

## User Flow Examples

### Creating First Design
1. User navigates to `/project/[id]`
2. Sees empty state: "No designs yet"
3. Clicks "Create First Design" button
4. Modal opens for design creation
5. Submits form
6. Design card appears in grid
7. Automatically opens design form

### Working on Existing Design
1. User navigates to `/project/[id]`
2. Sees grid of design cards
3. Clicks "Open Design" on a card
4. Design cards fade out, form slides in
5. Tabs and header remain visible
6. Works on design in form
7. Clicks "← Back to Designs"
8. Form fades out, design cards reappear

### Switching to Intelligence Tab
1. User on Designs tab (with or without open design)
2. Clicks "Intelligence" tab
3. Sees coming soon interface
4. Can switch back to Designs tab
5. If design was open, it remains open when returning

## Future Enhancements

1. **Intelligence Tab Integration**
   - Connect to Perplexity API
   - Enable search input
   - Display search results and AI responses
   - Save search history per project

2. **Design Card Enhancements**
   - Add 3D model thumbnail preview
   - Show more detailed metrics
   - Add tags/labels for organization
   - Implement search/filter for designs

3. **Project Header**
   - Make project name inline-editable
   - Add project description field
   - Show more metadata in expandable section

4. **Additional Tabs**
   - Documents tab for project files
   - Settings tab for project configuration
   - Activity/History tab for audit trail

## Technical Notes

- Use existing shadcn/ui Tabs component for tab navigation
- Reuse Card, Badge, Button components from shadcn/ui
- Match existing transition animations from project cards
- Ensure responsive design works on tablet and mobile
- Test keyboard navigation for accessibility
- Handle loading states for project and designs data

## Success Criteria

- ✅ Project header prominently displays project information
- ✅ Tabs clearly separate Designs and Intelligence features
- ✅ Design cards provide useful at-a-glance information
- ✅ Smooth transitions between card view and form view
- ✅ Intelligence tab clearly indicates coming soon status
- ✅ All interactions are intuitive and responsive
- ✅ Styling is consistent with dashboard design
- ✅ No loss of existing functionality
