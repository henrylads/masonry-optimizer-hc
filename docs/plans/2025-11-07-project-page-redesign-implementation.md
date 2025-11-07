# Project Page Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign project page with tabbed interface (Designs/Intelligence), prominent project header, and design cards grid replacing sidebar navigation.

**Architecture:** Build four new React components (ProjectHeader, DesignCard, DesignsTab, IntelligenceTab), integrate them into the existing project page, and remove the ProjectSidebar component. Uses shadcn/ui Tabs component for navigation and maintains existing state management patterns.

**Tech Stack:** Next.js 15, React 18, TypeScript 5, shadcn/ui (Tabs, Card, Badge, Button), Tailwind CSS, Lucide React icons

---

## Task 1: Create ProjectHeader Component

**Files:**
- Create: `src/components/project/project-header.tsx`

**Step 1: Create ProjectHeader component file**

Create the file with complete implementation:

```typescript
'use client'

import { Project } from '@/types/project-types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pencil } from 'lucide-react'

interface ProjectHeaderProps {
  project: Project
  onDelete: () => void
  onClearData?: () => void
  onChangeProject?: () => void
}

export function ProjectHeader({
  project,
  onDelete,
  onClearData,
  onChangeProject
}: ProjectHeaderProps) {
  return (
    <div className="border-b pb-6 mb-6">
      <div className="flex items-start justify-between">
        {/* Left: Project title and metadata */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-muted-foreground mb-3">Construction Drawing Intelligence</p>
          <div className="flex gap-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
              Active
            </Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
              {project.stage === 'contract' ? 'Construction' : 'Planning'}
            </Badge>
          </div>
        </div>

        {/* Right: Action buttons */}
        <div className="flex gap-2">
          <Button
            variant="destructive"
            onClick={onDelete}
          >
            Delete Project
          </Button>
          {onClearData && (
            <Button
              variant="outline"
              onClick={onClearData}
            >
              Clear Data
            </Button>
          )}
          {onChangeProject && (
            <Button
              variant="outline"
              onClick={onChangeProject}
            >
              Change Project
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Verify file was created**

Run: `ls -la src/components/project/project-header.tsx`
Expected: File exists

**Step 3: Commit**

```bash
git add src/components/project/project-header.tsx
git commit -m "feat: add ProjectHeader component with title, badges, and actions

- Display project name with edit icon
- Show Construction Drawing Intelligence subtitle
- Active and stage badges (green/blue)
- Action buttons for delete, clear data, change project"
```

---

## Task 2: Create DesignCard Component

**Files:**
- Create: `src/components/project/design-card.tsx`

**Step 1: Create DesignCard component file**

Create the file with complete implementation:

```typescript
'use client'

import { Design } from '@/types/design-types'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MoreVertical, FileText, Weight, DollarSign } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface DesignCardProps {
  design: Design
  onOpen: (designId: string) => void
  onDelete: (designId: string) => void
}

export function DesignCard({ design, onOpen, onDelete }: DesignCardProps) {
  // Derive status from design data (basic logic - can be enhanced)
  const getStatus = () => {
    if (design.calculationResults) return 'Optimized'
    if (design.formParameters && Object.keys(design.formParameters).length > 0) return 'Draft'
    return 'New'
  }

  const status = getStatus()

  // Status badge colors
  const statusColors = {
    'New': 'bg-gray-100 text-gray-800',
    'Draft': 'bg-yellow-100 text-yellow-800',
    'Optimized': 'bg-green-100 text-green-800',
    'In Review': 'bg-blue-100 text-blue-800',
  }

  const handleOpenClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onOpen(design.id)
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-1">{design.name}</h3>
          <p className="text-sm text-muted-foreground">Masonry Support Design</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation()
              onDelete(design.id)
            }}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Badge
            variant="secondary"
            className={`${statusColors[status as keyof typeof statusColors]} hover:${statusColors[status as keyof typeof statusColors]}`}
          >
            {status}
          </Badge>
        </div>

        {/* Placeholder for future metrics */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center">
            <Weight className="h-4 w-4 mr-1" />
            <span>TBD</span>
          </div>
          <div className="flex items-center">
            <DollarSign className="h-4 w-4 mr-1" />
            <span>TBD</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Updated {new Date(design.updatedAt).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })}
        </p>

        <Button
          className="w-full bg-black hover:bg-black/90 text-white"
          onClick={handleOpenClick}
        >
          Open Design
        </Button>
      </CardContent>
    </Card>
  )
}
```

**Step 2: Verify file was created**

Run: `ls -la src/components/project/design-card.tsx`
Expected: File exists

**Step 3: Commit**

```bash
git add src/components/project/design-card.tsx
git commit -m "feat: add DesignCard component for design grid display

- Display design name and subtitle
- Show status badge (New/Draft/Optimized)
- Placeholder metrics (weight, cost)
- Last updated date in DD/MM/YYYY format
- Open Design button with delete menu"
```

---

## Task 3: Create DesignsTab Component

**Files:**
- Create: `src/components/project/designs-tab.tsx`

**Step 1: Create DesignsTab component file**

Create the file with complete implementation:

```typescript
'use client'

import { Design } from '@/types/design-types'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { DesignCard } from './design-card'

interface DesignsTabProps {
  designs: Design[]
  onOpenDesign: (designId: string) => void
  onNewDesign: () => void
  onDeleteDesign: (designId: string) => void
}

export function DesignsTab({
  designs,
  onOpenDesign,
  onNewDesign,
  onDeleteDesign
}: DesignsTabProps) {
  if (designs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <h2 className="text-2xl font-bold mb-4">No designs yet</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Create your first design to start optimizing masonry support systems for this project.
        </p>
        <Button
          size="lg"
          onClick={onNewDesign}
          className="bg-accent hover:bg-accent/90"
        >
          <Plus className="mr-2 h-5 w-5" />
          Create First Design
        </Button>
      </div>
    )
  }

  return (
    <div>
      {/* Header with design count and new button */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">
          Designs ({designs.length})
        </h2>
        <Button
          onClick={onNewDesign}
          className="bg-black hover:bg-black/90 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Design
        </Button>
      </div>

      {/* Design cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {designs.map((design) => (
          <DesignCard
            key={design.id}
            design={design}
            onOpen={onOpenDesign}
            onDelete={onDeleteDesign}
          />
        ))}
      </div>
    </div>
  )
}
```

**Step 2: Verify file was created**

Run: `ls -la src/components/project/designs-tab.tsx`
Expected: File exists

**Step 3: Commit**

```bash
git add src/components/project/designs-tab.tsx
git commit -m "feat: add DesignsTab component with grid layout

- Display designs count and New Design button
- Grid layout (3 cols lg, 2 cols md, 1 col sm)
- Empty state with Create First Design CTA
- Maps designs to DesignCard components"
```

---

## Task 4: Create IntelligenceTab Component

**Files:**
- Create: `src/components/project/intelligence-tab.tsx`

**Step 1: Create IntelligenceTab component file**

Create the file with complete implementation:

```typescript
'use client'

import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, Brain, BookOpen, TrendingUp, HelpCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function IntelligenceTab() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h2 className="text-2xl font-bold">Project Intelligence</h2>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Coming Soon
          </Badge>
        </div>
        <p className="text-muted-foreground">
          AI-powered research and insights about this construction project
        </p>
      </div>

      {/* Disabled search interface */}
      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Ask questions about this project..."
            disabled
            className="pl-10 h-12 text-base cursor-not-allowed opacity-60"
            title="Perplexity integration coming soon"
          />
        </div>
        <p className="text-sm text-muted-foreground mt-2 text-center">
          Search functionality will be available once Perplexity integration is complete
        </p>
      </div>

      {/* Feature preview */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Upcoming Features
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <BookOpen className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">Research building codes and regulations</p>
              <p className="text-sm text-muted-foreground">
                Get instant access to relevant building standards and compliance requirements
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">Find similar projects and case studies</p>
              <p className="text-sm text-muted-foreground">
                Discover comparable construction projects and learn from their approaches
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Search className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">Get real-time construction industry insights</p>
              <p className="text-sm text-muted-foreground">
                Stay updated with latest trends, materials, and construction methods
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <HelpCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">Answer technical questions about materials and methods</p>
              <p className="text-sm text-muted-foreground">
                Get expert answers to specific technical queries about your project
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

**Step 2: Verify file was created**

Run: `ls -la src/components/project/intelligence-tab.tsx`
Expected: File exists

**Step 3: Commit**

```bash
git add src/components/project/intelligence-tab.tsx
git commit -m "feat: add IntelligenceTab component with coming soon state

- Header with Coming Soon badge
- Disabled search input with tooltip
- Feature preview card with 4 upcoming capabilities
- Icons for visual interest
- Ready for Perplexity integration"
```

---

## Task 5: Update Project Page with New Components

**Files:**
- Modify: `src/app/project/[id]/page.tsx`

**Step 1: Read current page implementation**

Run: `cat src/app/project/[id]/page.tsx`
Expected: See current implementation with ProjectSidebar

**Step 2: Replace page implementation**

Replace entire file content with:

```typescript
'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { AppSidebar } from '@/components/app-sidebar'
import { ProjectHeader } from '@/components/project/project-header'
import { DesignsTab } from '@/components/project/designs-tab'
import { IntelligenceTab } from '@/components/project/intelligence-tab'
import { CreateDesignModal } from '@/components/project/create-design-modal'
import { useProject } from '@/hooks/use-project'
import { CreateDesignInput } from '@/types/design-types'
import { AuthHeader } from '@/components/auth-header'
import { MainNavigation } from '@/components/main-navigation'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChevronLeft } from 'lucide-react'
import MasonryDesignerForm from '@/components/masonry-designer-form'
import { useRouter } from 'next/navigation'

export default function ProjectPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const [activeTab, setActiveTab] = useState<'designs' | 'intelligence'>('designs')
  const [activeDesignId, setActiveDesignId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const { project, designs, isLoading, mutate } = useProject(projectId)

  const handleCreateDesign = async (data: CreateDesignInput) => {
    const response = await fetch(`/api/projects/${projectId}/designs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (response.ok) {
      const { design } = await response.json()
      mutate()
      setActiveDesignId(design.id)
    }
  }

  const handleDeleteDesign = async (designId: string) => {
    if (!confirm('Are you sure you want to delete this design?')) return

    await fetch(`/api/designs/${designId}`, { method: 'DELETE' })
    if (activeDesignId === designId) {
      setActiveDesignId(null)
    }
    mutate()
  }

  const handleDeleteProject = async () => {
    if (!confirm('Are you sure you want to delete this project? This cannot be undone.')) return

    await fetch(`/api/projects/${projectId}`, { method: 'DELETE' })
    router.push('/dashboard')
  }

  const handleBackToDesigns = () => {
    setActiveDesignId(null)
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!project) {
    return <div className="min-h-screen flex items-center justify-center">Project not found</div>
  }

  const showDesignForm = activeDesignId !== null && activeTab === 'designs'

  return (
    <div className="min-h-screen flex flex-col">
      <AuthHeader />
      <MainNavigation hideNavTabs />

      <div className="flex-1 flex">
        <AppSidebar />

        <main className="flex-1 p-8 overflow-auto">
          {/* Project Header */}
          <ProjectHeader
            project={project}
            onDelete={handleDeleteProject}
          />

          {/* Tabs Navigation */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'designs' | 'intelligence')}>
            <TabsList className="mb-6">
              <TabsTrigger value="designs">Designs</TabsTrigger>
              <TabsTrigger value="intelligence">Intelligence</TabsTrigger>
            </TabsList>

            {/* Designs Tab Content */}
            <TabsContent value="designs">
              {showDesignForm ? (
                <div>
                  {/* Back button */}
                  <Button
                    variant="ghost"
                    onClick={handleBackToDesigns}
                    className="mb-4"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back to Designs
                  </Button>

                  {/* Design Form */}
                  <MasonryDesignerForm
                    designId={activeDesignId}
                    projectId={projectId}
                  />
                </div>
              ) : (
                <DesignsTab
                  designs={designs}
                  onOpenDesign={setActiveDesignId}
                  onNewDesign={() => setModalOpen(true)}
                  onDeleteDesign={handleDeleteDesign}
                />
              )}
            </TabsContent>

            {/* Intelligence Tab Content */}
            <TabsContent value="intelligence">
              <IntelligenceTab />
            </TabsContent>
          </Tabs>
        </main>
      </div>

      <CreateDesignModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={handleCreateDesign}
        existingDesigns={designs}
      />
    </div>
  )
}
```

**Step 3: Verify page compiles without errors**

Run: `cd "/Users/henrychart/Downloads/masonry-optimizer-hc-main 3/.worktrees/project-dashboard" && npm run build`
Expected: Build succeeds with no TypeScript errors

**Step 4: Commit**

```bash
git add src/app/project/[id]/page.tsx
git commit -m "feat: redesign project page with tabbed interface

- Remove ProjectSidebar, use main content area
- Add ProjectHeader at top
- Implement Designs and Intelligence tabs
- Show design cards grid in Designs tab
- Show form when design opened with back button
- Maintain all existing functionality"
```

---

## Task 6: Remove ProjectSidebar Component

**Files:**
- Delete: `src/components/project/project-sidebar.tsx`

**Step 1: Delete the ProjectSidebar component**

Run: `rm src/components/project/project-sidebar.tsx`
Expected: File deleted

**Step 2: Verify no imports remain**

Run: `grep -r "ProjectSidebar" src/`
Expected: No matches (only if no other files import it)

**Step 3: Commit**

```bash
git add src/components/project/project-sidebar.tsx
git commit -m "refactor: remove ProjectSidebar component

ProjectSidebar replaced by tabbed interface with design cards.
Functionality moved to DesignsTab and DesignCard components."
```

---

## Task 7: Manual Testing Verification

**Step 1: Start dev server**

Run: `npm run dev`
Expected: Server starts on http://localhost:3005

**Step 2: Test project page navigation**

1. Navigate to http://localhost:3005/dashboard
2. Click on a project card "Open Project"
3. Verify:
   - ✓ Project header displays correctly (title, badges, buttons)
   - ✓ Tabs show "Designs" and "Intelligence"
   - ✓ Designs tab shows design cards in grid

**Step 3: Test design cards**

1. Click "Open Design" on a design card
2. Verify:
   - ✓ Design cards fade out, form appears
   - ✓ "Back to Designs" button visible
   - ✓ Tabs remain at top
   - ✓ Form loads correctly

**Step 4: Test back navigation**

1. Click "Back to Designs" button
2. Verify:
   - ✓ Form disappears, design cards reappear
   - ✓ All cards still visible

**Step 5: Test Intelligence tab**

1. Click "Intelligence" tab
2. Verify:
   - ✓ Coming soon message displays
   - ✓ Disabled search input visible
   - ✓ Feature preview card shows

**Step 6: Test new design creation**

1. Go back to Designs tab
2. Click "New Design" button
3. Fill in design name, submit
4. Verify:
   - ✓ Modal closes
   - ✓ New design card appears
   - ✓ Form opens automatically

**Step 7: Test delete functionality**

1. Click three-dot menu on a design card
2. Click "Delete"
3. Confirm deletion
4. Verify:
   - ✓ Design card removed from grid

**Step 8: Test empty state**

1. Delete all designs (if needed)
2. Verify:
   - ✓ "No designs yet" message shows
   - ✓ "Create First Design" button visible

**Step 9: Test project deletion**

1. Click "Delete Project" button in header
2. Confirm deletion
3. Verify:
   - ✓ Redirects to dashboard
   - ✓ Project removed from list

**Step 10: Document any issues**

If any bugs found, create issues in docs/issues/ with:
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable

---

## Verification Checklist

Before considering this complete, verify:

- [ ] All 4 new components created and compile without errors
- [ ] Project page updated to use new components
- [ ] ProjectSidebar component removed
- [ ] All TypeScript types correct
- [ ] No console errors in browser
- [ ] Design cards display correctly
- [ ] Tab navigation works smoothly
- [ ] Back button returns to design cards
- [ ] Empty state shows when no designs
- [ ] New design creation works
- [ ] Design deletion works
- [ ] Project deletion works and redirects
- [ ] Intelligence tab shows coming soon state
- [ ] Responsive design works on mobile/tablet
- [ ] All styling matches design document

---

## Known Limitations

1. **Metrics in DesignCard:** Weight and Cost show "TBD" as placeholders. These need to be extracted from `design.calculationResults` once we understand the data structure better.

2. **Project name editing:** Pencil icon is visible but not wired up. This requires implementing an inline edit feature or modal, which is beyond the scope of this initial redesign.

3. **Status derivation:** Design status is derived from basic logic (has results = Optimized, has params = Draft). This may need refinement based on actual workflow.

4. **Clear Data button:** ProjectHeader includes onClearData prop but it's not passed from page. This functionality needs to be defined and implemented.

5. **Change Project button:** Similar to Clear Data, this is present but not implemented.

---

## Future Enhancements

After this implementation is complete and tested:

1. **Implement metrics extraction** from `design.calculationResults` to show actual weight and cost
2. **Add inline project name editing** functionality
3. **Implement Clear Data** functionality for projects
4. **Add search/filter** for designs when list grows large
5. **Add design duplication** feature from card menu
6. **Integrate Perplexity API** for Intelligence tab
7. **Add loading states** for async operations
8. **Add animations** for tab transitions and card appearance
9. **Add keyboard shortcuts** for power users
10. **Implement design status workflow** (Draft → In Review → Optimized)
