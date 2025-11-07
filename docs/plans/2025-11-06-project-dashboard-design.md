# Project Dashboard & Design Management System

**Date:** 2025-11-06
**Status:** Approved for implementation

## Overview

Transform the single-page masonry designer into a multi-project workspace where users can create building/site projects and manage multiple facade design explorations within each project.

## Core Concept

**Project = Building/Site**
Each project represents a physical building where users explore multiple facade design variations. Projects are lightweight containers with basic metadata and optional AI-enriched information.

## User Experience

### 1. Dashboard (Home Page)

**Empty State:**
- Centered hero with "Create your first project" CTA
- Visual showing workflow: project → designs → optimization

**With Projects:**
- View toggle: Card grid / Table view
- Search and filter (by stage, value, date)
- "New Project" button

**Card View:**
- Responsive grid (1-3 columns)
- Each card: name, stage badge, total value, design count, last modified, actions menu
- Actions: rename, duplicate, export, delete

**Table View:**
- Columns: Name | Stage | Value | Designs | Last Modified | Actions
- Sortable, clickable rows

**Create Project Modal:**
- Name (required)
- Description (optional)
- Stage: Contract / Planning
- Total project value
- Creates and navigates to new project

### 2. Project Workspace

**Layout:**
- **Left sidebar (250px):** Project header + design list
- **Main area:** Active design form
- **Right drawer (on-demand):** Project info panel

**Sidebar Contents:**
- Project name (clickable → info drawer)
- Stage badge
- Actions menu (edit, enrich with AI, export, delete)
- "New Design" button
- Scrollable list of designs (active one highlighted)
- Per-design actions: rename, duplicate, delete

**Project Info Drawer:**
- Editable: name, description, stage, value
- "Enrich with Perplexity AI" button (on-demand)
- Structured enriched fields: location, architect, completion date, building type
- Save/cancel buttons

**New Design Modal:**
- Choice: "Start from scratch" or "Duplicate existing"
- If duplicate: select source design
- Name input (required)
- Create → opens in main area

### 3. Design Form (Simplified)

**Top Bar:**
- Design name (inline editable)
- Workflow toggle: Manual / AI Chat
- Auto-save indicator
- "Run Optimization" button (prominent)

**Core Fields (Always Visible):**
1. Cavity width (mm)
2. Frame fixing type (dropdown)
3. Slab thickness (mm)
4. Bracket drop (mm)
5. Load (kN/m²) with "Calculate from masonry" button

**Inline Density Calculator:**
- Opens below load field (no navigation)
- Shows current density calc interface
- "Use this value" populates load field
- Collapses after use

**Advanced Options (Collapsed):**
- Toggle reveals all current form fields not in core 5
- Organized in logical groups (Loads, Materials, Geometry, Safety)
- No new fields invented - just reorganizing existing ones

### 4. Results Integration

**After Running Optimization:**
- Results appear inline below form (no page navigation)
- Run layout visualization auto-generated at top
- Full optimization results (existing ResultsDisplay component)
- "Compare with other designs" button → modal with side-by-side comparison
- All results auto-save to design record

**AI Chat Mode:**
- Toggle shows ChatInterface component
- Saves to same design record
- Switch modes without losing work

## Technical Architecture

### Database Schema

```
projects
  - id (uuid)
  - userId (foreign key)
  - name (text)
  - description (text, nullable)
  - stage (enum: contract, planning)
  - totalValue (decimal)
  - enrichedData (jsonb: {location, architect, completionDate, buildingType})
  - createdAt, updatedAt

designs
  - id (uuid)
  - projectId (foreign key)
  - name (text)
  - formParameters (jsonb: all form values)
  - calculationResults (jsonb: optimization results, run layout, verification)
  - createdAt, updatedAt
```

### API Routes

- `/api/projects` - CRUD for projects
- `/api/projects/[id]/designs` - CRUD for designs
- `/api/projects/[id]/enrich` - Perplexity AI search
- Keep existing `/api/optimize` and `/api/chat` - integrate with design saves

### Component Structure

```
/components/dashboard/
  - project-card.tsx
  - project-table.tsx
  - project-grid.tsx
  - create-project-modal.tsx

/components/project/
  - project-sidebar.tsx
  - project-info-drawer.tsx
  - design-list.tsx
  - create-design-modal.tsx

/components/design/
  - design-form-simplified.tsx (refactored masonry-designer-form)
  - inline-density-calculator.tsx
  - integrated-results.tsx
```

### State Management

- Project/design data: SWR or React Query for caching
- Form state: React Hook Form (existing)
- Auto-save: Debounced (2-3 seconds) database updates
- Optimistic UI for quick actions

### Migration Path

1. Current masonry-designer-form → design workspace component
2. Existing pages (run-layout, results, density-calculator) → integrated components
3. Homepage → dashboard
4. Auth already exists - scope data by userId

## Key Design Principles

**Simplicity First:**
- Project metadata lightweight (no overbuilding)
- Core form fields surfaced, advanced tucked away
- No navigation jumps during design work

**Progressive Disclosure:**
- Start with 5 critical fields
- Advanced options available but hidden
- Empty states guide next actions

**Integrated Workflow:**
- Density calc inline, not separate page
- Results show immediately, not new route
- Run layout auto-generates from parameters

**Power User Features:**
- Full CRUD on projects and designs
- Duplicate/compare capabilities
- Export functionality
- AI enrichment on-demand

## Success Criteria

- Users can create and organize multiple building projects
- Within projects, easily explore design variations
- Simplified form reduces cognitive load for common cases
- Advanced users still have full control
- All work auto-saves, accessible across devices
- No regression in calculation accuracy or features

## Implementation Status

**Date Updated:** 2025-11-07

### Completed Tasks

**Form Simplification (100% Complete)**
- Core fields component with 5 essential fields
- Inline density calculator integration
- Advanced options with progressive disclosure
- Form auto-save with 2-second debounce
- Integrated results display with run layout tabs
- 51.6% code reduction from original form (970 lines → 470 lines)

**Components Created:**
- `/src/components/design/core-fields.tsx` - Core 5 fields
- `/src/components/design/inline-density-calculator.tsx` - Inline calculator wrapper
- `/src/components/design/advanced-options.tsx` - Progressive disclosure container
- `/src/components/design/integrated-results.tsx` - Results with tabs

**Database & Architecture (Partially Complete)**
- Database schema implemented (projects, designs tables)
- Project sidebar and design list components
- Create design modal with duplication support
- API routes for projects and designs CRUD

**Pending Tasks:**
- Dashboard homepage implementation
- Project card/table views
- AI enrichment with Perplexity integration
- Design comparison modal
- Export functionality
