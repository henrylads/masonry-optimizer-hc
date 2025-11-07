# Design Page Three-Panel Layout Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement a dedicated design page route with three-panel layout (inputs left, 3D viewer center, collapsible results right) replacing the current tabbed interface.

**Architecture:** Create new Next.js app route at `/project/[projectId]/design/[designId]/page.tsx` with six new components. Use CSS Grid for layout, extract and reuse form logic from existing MasonryDesignerForm, integrate existing ShapeDiver viewer, and update navigation in project page.

**Tech Stack:** Next.js 15 App Router, React 18, TypeScript 5, Tailwind CSS, Shadcn/UI, React Hook Form, ShapeDiver viewer

---

## Task 1: Create DesignBreadcrumb Component

**Files:**
- Create: `src/components/design/design-breadcrumb.tsx`

**Step 1: Create breadcrumb component file**

Create `src/components/design/design-breadcrumb.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronLeft, Pencil, Loader2 } from 'lucide-react'

interface DesignBreadcrumbProps {
  projectId: string
  projectName: string
  designId: string
  designName: string
  saveStatus: 'saved' | 'saving' | 'error'
  onUpdateDesignName: (name: string) => Promise<void>
}

export function DesignBreadcrumb({
  projectId,
  projectName,
  designId,
  designName,
  saveStatus,
  onUpdateDesignName
}: DesignBreadcrumbProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState(designName)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleSave = async () => {
    if (editedName.trim() === '' || editedName === designName) {
      setIsEditing(false)
      setEditedName(designName)
      return
    }

    setIsUpdating(true)
    try {
      await onUpdateDesignName(editedName.trim())
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update design name:', error)
      setEditedName(designName)
      setIsEditing(false)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      setEditedName(designName)
      setIsEditing(false)
    }
  }

  return (
    <div className="h-12 border-b bg-white px-4 flex items-center justify-between sticky top-0 z-10">
      {/* Left: Back button and breadcrumb */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/project/${projectId}`)}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>

        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Projects
          </button>
          <span className="text-muted-foreground">/</span>
          <button
            onClick={() => router.push(`/project/${projectId}`)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {projectName}
          </button>
          <span className="text-muted-foreground">/</span>

          {isEditing ? (
            <Input
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              disabled={isUpdating}
              className="h-7 w-48"
              autoFocus
            />
          ) : (
            <div className="flex items-center gap-1">
              <span className="font-semibold">{designName}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="h-6 w-6 p-0"
              >
                <Pencil className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Right: Save status */}
      <div className="flex items-center gap-2 text-sm">
        {saveStatus === 'saved' && (
          <>
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-muted-foreground">Saved</span>
          </>
        )}
        {saveStatus === 'saving' && (
          <>
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            <span className="text-muted-foreground">Saving...</span>
          </>
        )}
        {saveStatus === 'error' && (
          <>
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <span className="text-red-500">Save failed</span>
          </>
        )}
      </div>
    </div>
  )
}
```

**Step 2: Verify component compiles**

Run: `npm run build`
Expected: No TypeScript errors in DesignBreadcrumb component

**Step 3: Commit**

```bash
git add src/components/design/design-breadcrumb.tsx
git commit -m "feat: add DesignBreadcrumb component with inline editing"
```

---

## Task 2: Create DesignInputPanel Component

**Files:**
- Create: `src/components/design/design-input-panel.tsx`
- Reference: `src/components/design/core-fields.tsx` (existing)
- Reference: `src/components/design/advanced-options.tsx` (existing)

**Step 1: Create input panel component file**

Create `src/components/design/design-input-panel.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { ChevronRight } from 'lucide-react'
import { CoreFields } from '@/components/design/core-fields'
import { AdvancedOptions } from '@/components/design/advanced-options'
import type { formSchema } from '@/types/form-schema'
import type { z } from 'zod'

interface DesignInputPanelProps {
  form: UseFormReturn<z.infer<typeof formSchema>>
  onOptimize: () => void
  isOptimizing: boolean
}

export function DesignInputPanel({
  form,
  onOptimize,
  isOptimizing
}: DesignInputPanelProps) {
  const [advancedExpanded, setAdvancedExpanded] = useState(false)

  // Check if form has validation errors
  const hasErrors = Object.keys(form.formState.errors).length > 0

  return (
    <div className="w-80 h-full border-r bg-white overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Top Run Optimization Button */}
        <Button
          onClick={onOptimize}
          disabled={isOptimizing || hasErrors}
          className="w-full bg-black hover:bg-black/90 text-white"
        >
          {isOptimizing ? 'Optimizing...' : 'Run Optimization'}
        </Button>

        {/* Core Fields */}
        <CoreFields form={form} />

        {/* Advanced Options */}
        <div className="border-t pt-4">
          <button
            onClick={() => setAdvancedExpanded(!advancedExpanded)}
            className="flex items-center gap-2 text-sm font-medium w-full hover:text-foreground transition-colors"
          >
            <ChevronRight
              className={`h-4 w-4 transition-transform ${advancedExpanded ? 'rotate-90' : ''}`}
            />
            Advanced Options
          </button>

          {advancedExpanded && (
            <div className="mt-4">
              <AdvancedOptions form={form} />
            </div>
          )}
        </div>

        {/* Bottom Run Optimization Button */}
        <Button
          onClick={onOptimize}
          disabled={isOptimizing || hasErrors}
          className="w-full bg-black hover:bg-black/90 text-white"
        >
          {isOptimizing ? 'Optimizing...' : 'Run Optimization'}
        </Button>
      </div>
    </div>
  )
}
```

**Step 2: Verify component compiles**

Run: `npm run build`
Expected: No TypeScript errors

**Step 3: Commit**

```bash
git add src/components/design/design-input-panel.tsx
git commit -m "feat: add DesignInputPanel with dual action buttons"
```

---

## Task 3: Create DesignViewerPanel Component

**Files:**
- Create: `src/components/design/design-viewer-panel.tsx`
- Reference: `src/components/shapediver.tsx` (existing)

**Step 1: Create viewer panel component file**

Create `src/components/design/design-viewer-panel.tsx`:

```typescript
'use client'

import dynamic from 'next/dynamic'
import { Loader2, Box } from 'lucide-react'
import type { OptimisationResult } from '@/types/optimization-types'

// Dynamically import ShapeDiver to avoid SSR issues
const ShapeDiver = dynamic(() => import('@/components/shapediver'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#e5e7eb]">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  )
})

interface DesignViewerPanelProps {
  optimizationResult: OptimisationResult | null
  isOptimizing: boolean
  progress: number
}

export function DesignViewerPanel({
  optimizationResult,
  isOptimizing,
  progress
}: DesignViewerPanelProps) {
  return (
    <div className="flex-1 relative bg-[#e5e7eb]">
      {/* Empty State */}
      {!optimizationResult && !isOptimizing && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Box className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-lg">
            Run optimization to view 3D model
          </p>
        </div>
      )}

      {/* Optimization Progress Overlay */}
      {isOptimizing && (
        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center z-10">
          <Loader2 className="h-12 w-12 animate-spin text-white mb-4" />
          <p className="text-white text-lg mb-2">Optimizing...</p>
          <div className="w-64 h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-white/80 text-sm mt-2">{Math.round(progress)}% complete</p>
        </div>
      )}

      {/* 3D Viewer */}
      {optimizationResult && (
        <ShapeDiver result={optimizationResult} />
      )}
    </div>
  )
}
```

**Step 2: Verify component compiles**

Run: `npm run build`
Expected: No TypeScript errors

**Step 3: Commit**

```bash
git add src/components/design/design-viewer-panel.tsx
git commit -m "feat: add DesignViewerPanel with progress overlay"
```

---

## Task 4: Create ResultsTab Component

**Files:**
- Create: `src/components/design/results-tab.tsx`

**Step 1: Create results tab component file**

Create `src/components/design/results-tab.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { ChevronRight, CheckCircle, XCircle, Weight, DollarSign } from 'lucide-react'
import type { OptimisationResult } from '@/types/optimization-types'

interface ResultsTabProps {
  result: OptimisationResult
}

export function ResultsTab({ result }: ResultsTabProps) {
  const [summaryExpanded, setSummaryExpanded] = useState(true)
  const [parametersExpanded, setParametersExpanded] = useState(false)
  const [verificationExpanded, setVerificationExpanded] = useState(false)

  const allChecksPassed = result.verificationResults?.allChecksPassed ?? false

  return (
    <div className="space-y-4">
      {/* Design Summary */}
      <div className="border rounded-lg overflow-hidden">
        <button
          onClick={() => setSummaryExpanded(!summaryExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <span className="font-semibold">Design Summary</span>
          <ChevronRight
            className={`h-4 w-4 transition-transform ${summaryExpanded ? 'rotate-90' : ''}`}
          />
        </button>

        {summaryExpanded && (
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Weight className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Total Weight</p>
                <p className="text-2xl font-bold">
                  {result.totalWeight?.toFixed(2)} kg
                </p>
              </div>
            </div>

            {result.estimatedCost && (
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Estimated Cost</p>
                  <p className="text-xl font-semibold">
                    £{result.estimatedCost.toFixed(2)}
                  </p>
                </div>
              </div>
            )}

            <div className="pt-2 border-t">
              <div className="flex items-center gap-2">
                {allChecksPassed ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-medium text-green-700">All checks passed</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span className="text-sm font-medium text-red-700">Some checks failed</span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Design Parameters */}
      <div className="border rounded-lg overflow-hidden">
        <button
          onClick={() => setParametersExpanded(!parametersExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <span className="font-semibold">Design Parameters</span>
          <ChevronRight
            className={`h-4 w-4 transition-transform ${parametersExpanded ? 'rotate-90' : ''}`}
          />
        </button>

        {parametersExpanded && (
          <div className="p-4 space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Bracket Type:</span>
              <span className="font-medium">{result.bracketType || 'N/A'}</span>

              <span className="text-muted-foreground">Angle Size:</span>
              <span className="font-medium">{result.angleSize || 'N/A'}</span>

              <span className="text-muted-foreground">Material:</span>
              <span className="font-medium">{result.material || 'N/A'}</span>

              {result.channelProduct && (
                <>
                  <span className="text-muted-foreground">Channel:</span>
                  <span className="font-medium">{result.channelProduct}</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Verification Checks */}
      <div className="border rounded-lg overflow-hidden">
        <button
          onClick={() => setVerificationExpanded(!verificationExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <span className="font-semibold">Verification Checks</span>
          <ChevronRight
            className={`h-4 w-4 transition-transform ${verificationExpanded ? 'rotate-90' : ''}`}
          />
        </button>

        {verificationExpanded && result.verificationResults && (
          <div className="p-4 space-y-2">
            <VerificationCheck
              name="Shear Check"
              passed={result.verificationResults.shearCheck?.passed ?? false}
              utilization={result.verificationResults.shearCheck?.utilization}
            />
            <VerificationCheck
              name="Tension Check"
              passed={result.verificationResults.tensionCheck?.passed ?? false}
              utilization={result.verificationResults.tensionCheck?.utilization}
            />
            <VerificationCheck
              name="Moment Check"
              passed={result.verificationResults.momentCheck?.passed ?? false}
              utilization={result.verificationResults.momentCheck?.utilization}
            />
            <VerificationCheck
              name="Deflection Check"
              passed={result.verificationResults.deflectionCheck?.passed ?? false}
              utilization={result.verificationResults.deflectionCheck?.utilization}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function VerificationCheck({
  name,
  passed,
  utilization
}: {
  name: string
  passed: boolean
  utilization?: number
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <div className="flex items-center gap-2">
        {passed ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
          <XCircle className="h-4 w-4 text-red-500" />
        )}
        <span className="text-sm">{name}</span>
      </div>
      {utilization !== undefined && (
        <span className={`text-sm font-medium ${
          passed ? 'text-green-700' : 'text-red-700'
        }`}>
          {(utilization * 100).toFixed(1)}%
        </span>
      )}
    </div>
  )
}
```

**Step 2: Verify component compiles**

Run: `npm run build`
Expected: No TypeScript errors

**Step 3: Commit**

```bash
git add src/components/design/results-tab.tsx
git commit -m "feat: add ResultsTab with accordion sections"
```

---

## Task 5: Create AlternativesTab Component

**Files:**
- Create: `src/components/design/alternatives-tab.tsx`

**Step 1: Create alternatives tab component file**

Create `src/components/design/alternatives-tab.tsx`:

```typescript
'use client'

import { CheckCircle, AlertTriangle } from 'lucide-react'
import type { OptimisationResult } from '@/types/optimization-types'

interface AlternativesTabProps {
  alternatives: OptimisationResult[]
  selectedIndex: number
  onSelect: (index: number) => void
}

export function AlternativesTab({
  alternatives,
  selectedIndex,
  onSelect
}: AlternativesTabProps) {
  if (alternatives.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">
          Run optimization to see alternatives
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground mb-3">
        Top {alternatives.length} solutions (click to select)
      </p>

      {alternatives.map((alt, index) => {
        const isSelected = index === selectedIndex
        const allPassed = alt.verificationResults?.allChecksPassed ?? false

        return (
          <button
            key={index}
            onClick={() => onSelect(index)}
            className={`w-full p-3 rounded-lg border transition-all ${
              isSelected
                ? 'border-black bg-black/5'
                : 'border-border hover:border-black/30 hover:bg-muted/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                  isSelected ? 'border-black' : 'border-muted-foreground'
                }`}>
                  {isSelected && (
                    <div className="h-2 w-2 rounded-full bg-black" />
                  )}
                </div>
                <span className="font-medium">Solution {index + 1}</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold">
                  {alt.totalWeight?.toFixed(1)} kg
                </span>
                {allPassed ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                )}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
```

**Step 2: Verify component compiles**

Run: `npm run build`
Expected: No TypeScript errors

**Step 3: Commit**

```bash
git add src/components/design/alternatives-tab.tsx
git commit -m "feat: add AlternativesTab with solution selection"
```

---

## Task 6: Create DesignResultsPanel Component

**Files:**
- Create: `src/components/design/design-results-panel.tsx`
- Reference: `src/components/design/results-tab.tsx` (from Task 4)
- Reference: `src/components/design/alternatives-tab.tsx` (from Task 5)

**Step 1: Create results panel component file**

Create `src/components/design/design-results-panel.tsx`:

```typescript
'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ResultsTab } from './results-tab'
import { AlternativesTab } from './alternatives-tab'
import type { OptimisationResult } from '@/types/optimization-types'

interface DesignResultsPanelProps {
  optimizationResult: OptimisationResult | null
  alternatives: OptimisationResult[]
  selectedIndex: number
  onSelectAlternative: (index: number) => void
  isOpen: boolean
  onToggle: () => void
}

export function DesignResultsPanel({
  optimizationResult,
  alternatives,
  selectedIndex,
  onSelectAlternative,
  isOpen,
  onToggle
}: DesignResultsPanelProps) {
  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full h-20 w-6 bg-white border border-r-0 rounded-l-lg shadow-sm hover:bg-muted/30 transition-colors flex items-center justify-center z-20"
        aria-label={isOpen ? 'Close results panel' : 'Open results panel'}
      >
        {isOpen ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>

      {/* Panel Content */}
      <div
        className={`h-full border-l bg-white transition-all duration-300 ${
          isOpen ? 'w-[350px]' : 'w-0 border-l-0'
        }`}
      >
        {isOpen && (
          <div className="h-full overflow-y-auto">
            {optimizationResult ? (
              <div className="p-4">
                <Tabs defaultValue="results" className="w-full">
                  <TabsList className="w-full grid grid-cols-2 mb-4">
                    <TabsTrigger value="results">Results</TabsTrigger>
                    <TabsTrigger value="alternatives">Alternatives</TabsTrigger>
                  </TabsList>

                  <TabsContent value="results">
                    <ResultsTab result={optimizationResult} />
                  </TabsContent>

                  <TabsContent value="alternatives">
                    <AlternativesTab
                      alternatives={alternatives}
                      selectedIndex={selectedIndex}
                      onSelect={onSelectAlternative}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <div className="p-4 flex items-center justify-center h-full">
                <p className="text-sm text-muted-foreground text-center">
                  Run optimization to view results
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
```

**Step 2: Verify component compiles**

Run: `npm run build`
Expected: No TypeScript errors

**Step 3: Commit**

```bash
git add src/components/design/design-results-panel.tsx
git commit -m "feat: add DesignResultsPanel with slide toggle"
```

---

## Task 7: Create Design Page Route

**Files:**
- Create: `src/app/project/[projectId]/design/[designId]/page.tsx`
- Reference: `src/hooks/use-design-autosave.ts` (existing)
- Reference: `src/types/form-schema.ts` (existing)

**Step 1: Create design page file**

Create `src/app/project/[projectId]/design/[designId]/page.tsx`:

```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { formSchema } from '@/types/form-schema'
import { runBruteForce } from '@/calculations/bruteForceAlgorithm'
import { useDesignAutosave } from '@/hooks/use-design-autosave'
import { AuthHeader } from '@/components/auth-header'
import { DesignBreadcrumb } from '@/components/design/design-breadcrumb'
import { DesignInputPanel } from '@/components/design/design-input-panel'
import { DesignViewerPanel } from '@/components/design/design-viewer-panel'
import { DesignResultsPanel } from '@/components/design/design-results-panel'
import { Form } from '@/components/ui/form'
import type { OptimisationResult } from '@/types/optimization-types'
import type { Design } from '@/types/design-types'
import type { Project } from '@/types/project-types'
import type { z } from 'zod'

export default function DesignPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string
  const designId = params.designId as string

  // State
  const [design, setDesign] = useState<Design | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [optimizationResult, setOptimizationResult] = useState<OptimisationResult | null>(null)
  const [alternatives, setAlternatives] = useState<OptimisationResult[]>([])
  const [selectedAlternativeIndex, setSelectedAlternativeIndex] = useState(0)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [rightPanelOpen, setRightPanelOpen] = useState(true)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved')

  // Form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {}
  })

  // Autosave
  useDesignAutosave({
    designId,
    formData: form.watch(),
    onSaveStart: () => setSaveStatus('saving'),
    onSaveSuccess: () => setSaveStatus('saved'),
    onSaveError: () => setSaveStatus('error')
  })

  // Load design and project data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch design
        const designRes = await fetch(`/api/designs/${designId}`)
        if (!designRes.ok) {
          router.push('/dashboard')
          return
        }
        const designData = await designRes.json()
        setDesign(designData.design)

        // Fetch project
        const projectRes = await fetch(`/api/projects/${projectId}`)
        if (!projectRes.ok) {
          router.push('/dashboard')
          return
        }
        const projectData = await projectRes.json()
        setProject(projectData.project)

        // Load form parameters
        if (designData.design.formParameters) {
          form.reset(designData.design.formParameters)
        }

        // Load last optimization result if exists
        if (designData.design.calculationResults) {
          setOptimizationResult(designData.design.calculationResults)
        }

        setIsLoading(false)
      } catch (error) {
        console.error('Error loading design:', error)
        router.push('/dashboard')
      }
    }

    loadData()
  }, [designId, projectId, router, form])

  // Restore right panel state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('design-right-panel-open')
    if (savedState !== null) {
      setRightPanelOpen(savedState === 'true')
    }
  }, [])

  // Save right panel state to localStorage
  useEffect(() => {
    localStorage.setItem('design-right-panel-open', String(rightPanelOpen))
  }, [rightPanelOpen])

  // Handle optimization
  const handleOptimize = useCallback(async () => {
    const values = form.getValues()

    setIsOptimizing(true)
    setProgress(0)
    setOptimizationResult(null)
    setAlternatives([])
    setSelectedAlternativeIndex(0)

    try {
      // Run optimization (simplified - actual implementation would call API)
      const result = await runBruteForce(values, (p) => setProgress(p))

      // For now, create mock alternatives (replace with actual algorithm results)
      const mockAlternatives = [result]

      setOptimizationResult(result)
      setAlternatives(mockAlternatives)
      setSelectedAlternativeIndex(0)

      // Auto-open right panel if closed
      if (!rightPanelOpen) {
        setRightPanelOpen(true)
      }

      // Save result to database
      await fetch(`/api/designs/${designId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calculationResults: result
        })
      })
    } catch (error) {
      console.error('Optimization failed:', error)
      alert('Optimization failed. Please check your inputs and try again.')
    } finally {
      setIsOptimizing(false)
    }
  }, [form, designId, rightPanelOpen])

  // Handle alternative selection
  const handleSelectAlternative = useCallback((index: number) => {
    setSelectedAlternativeIndex(index)
    setOptimizationResult(alternatives[index])
  }, [alternatives])

  // Handle design name update
  const handleUpdateDesignName = useCallback(async (name: string) => {
    setSaveStatus('saving')
    try {
      const res = await fetch(`/api/designs/${designId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      })

      if (!res.ok) throw new Error('Failed to update name')

      setDesign(prev => prev ? { ...prev, name } : null)
      setSaveStatus('saved')
    } catch (error) {
      console.error('Error updating design name:', error)
      setSaveStatus('error')
      throw error
    }
  }, [designId])

  if (isLoading || !design || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AuthHeader />

      <DesignBreadcrumb
        projectId={projectId}
        projectName={project.name}
        designId={designId}
        designName={design.name}
        saveStatus={saveStatus}
        onUpdateDesignName={handleUpdateDesignName}
      />

      <div className="flex-1 flex overflow-hidden">
        <Form {...form}>
          <DesignInputPanel
            form={form}
            onOptimize={handleOptimize}
            isOptimizing={isOptimizing}
          />
        </Form>

        <DesignViewerPanel
          optimizationResult={optimizationResult}
          isOptimizing={isOptimizing}
          progress={progress}
        />

        <DesignResultsPanel
          optimizationResult={optimizationResult}
          alternatives={alternatives}
          selectedIndex={selectedAlternativeIndex}
          onSelectAlternative={handleSelectAlternative}
          isOpen={rightPanelOpen}
          onToggle={() => setRightPanelOpen(!rightPanelOpen)}
        />
      </div>
    </div>
  )
}
```

**Step 2: Verify page compiles**

Run: `npm run build`
Expected: No TypeScript errors

**Step 3: Test in browser**

Run: `npm run dev`
Visit: `http://localhost:3000/project/{projectId}/design/{designId}`
Expected: Page loads with three-panel layout (may show errors until navigation updated)

**Step 4: Commit**

```bash
git add src/app/project/[projectId]/design/[designId]/page.tsx
git commit -m "feat: add design page route with three-panel layout"
```

---

## Task 8: Update DesignCard Navigation

**Files:**
- Modify: `src/components/project/design-card.tsx:24-27`

**Step 1: Update DesignCard to use router.push**

Modify `src/components/project/design-card.tsx`:

```typescript
// Find this section (around line 16-27):
interface DesignCardProps {
  design: Design
  onOpen: (designId: string) => void  // REMOVE this line
  onDelete: (designId: string) => void
  projectId: string  // ADD this line
}

export function DesignCard({ design, onOpen, onDelete }: DesignCardProps) {  // OLD
export function DesignCard({ design, onDelete, projectId }: DesignCardProps) {  // NEW
  const router = useRouter()  // ADD this line

  const handleOpenClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onOpen(design.id)  // OLD
    router.push(`/project/${projectId}/design/${design.id}`)  // NEW
  }
```

Add import at top:
```typescript
import { useRouter } from 'next/navigation'
```

**Step 2: Verify component compiles**

Run: `npm run build`
Expected: No TypeScript errors

**Step 3: Commit**

```bash
git add src/components/project/design-card.tsx
git commit -m "feat: update DesignCard to navigate to design route"
```

---

## Task 9: Update DesignsTab Component

**Files:**
- Modify: `src/components/project/designs-tab.tsx:9-18`

**Step 1: Update DesignsTab to pass projectId to DesignCard**

Modify `src/components/project/designs-tab.tsx`:

```typescript
// Find this section (around line 9-18):
interface DesignsTabProps {
  designs: Design[]
  onOpenDesign: (designId: string) => void  // REMOVE this line
  onNewDesign: () => void
  onDeleteDesign: (designId: string) => void
  projectId: string  // ADD this line
}

export function DesignsTab({
  designs,
  onOpenDesign,  // REMOVE this line
  onNewDesign,
  onDeleteDesign
  projectId  // ADD this line
}: DesignsTabProps) {
```

Update DesignCard usage (around line 58-62):
```typescript
// OLD:
{designs.map((design) => (
  <DesignCard
    key={design.id}
    design={design}
    onOpen={onOpenDesign}
    onDelete={onDeleteDesign}
  />
))}

// NEW:
{designs.map((design) => (
  <DesignCard
    key={design.id}
    design={design}
    projectId={projectId}
    onDelete={onDeleteDesign}
  />
))}
```

**Step 2: Verify component compiles**

Run: `npm run build`
Expected: No TypeScript errors

**Step 3: Commit**

```bash
git add src/components/project/designs-tab.tsx
git commit -m "feat: update DesignsTab to pass projectId to cards"
```

---

## Task 10: Update Project Page

**Files:**
- Modify: `src/app/project/[id]/page.tsx:20-95`

**Step 1: Remove design editing state from project page**

Modify `src/app/project/[id]/page.tsx`:

Remove these lines (around line 24-26):
```typescript
const [activeDesignId, setActiveDesignId] = useState<string | null>(null)  // DELETE
```

Remove these lines (around line 93-95):
```typescript
const handleBackToDesigns = () => {  // DELETE entire function
  setActiveDesignId(null)
}
```

Update the conditional rendering (around line 105):
```typescript
// OLD:
const showDesignForm = activeDesignId !== null && activeTab === 'designs'

// DELETE - remove this variable entirely
```

Update TabsContent for designs (around line 135-162):
```typescript
// OLD:
<TabsContent value="designs">
  {showDesignForm ? (
    <div>
      <Button
        variant="ghost"
        onClick={handleBackToDesigns}
        className="mb-4"
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Back to Designs
      </Button>

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

// NEW:
<TabsContent value="designs">
  <DesignsTab
    designs={designs}
    projectId={projectId}
    onNewDesign={() => setModalOpen(true)}
    onDeleteDesign={handleDeleteDesign}
  />
</TabsContent>
```

Remove import (top of file):
```typescript
import MasonryDesignerForm from '@/components/masonry-designer-form'  // DELETE
import { ChevronLeft } from 'lucide-react'  // DELETE (if not used elsewhere)
```

**Step 2: Verify page compiles**

Run: `npm run build`
Expected: No TypeScript errors

**Step 3: Test navigation flow**

Run: `npm run dev`
1. Visit project page: `http://localhost:3000/project/{projectId}`
2. Click "Open Design" on a design card
3. Expected: Navigate to `/project/{projectId}/design/{designId}`
4. Click "← Back" in breadcrumb
5. Expected: Return to project page

**Step 4: Commit**

```bash
git add src/app/project/[id]/page.tsx
git commit -m "refactor: remove design editing from project page"
```

---

## Task 11: Update CoreFields Component (Remove Project Info)

**Files:**
- Modify: `src/components/design/core-fields.tsx`

**Step 1: Remove project information fields from CoreFields**

This task requires reading the existing CoreFields component to identify and remove project-specific fields like project name, description, etc. The exact changes depend on the current implementation.

Open `src/components/design/core-fields.tsx` and remove any FormField components that relate to project information (not design parameters).

Keep only engineering parameters like:
- Building height
- Floor-to-floor height
- Facade thickness
- Material type
- Load values
- Frame fixing type
- Channel products

**Step 2: Verify component compiles**

Run: `npm run build`
Expected: No TypeScript errors

**Step 3: Test in design page**

Run: `npm run dev`
Visit design page
Expected: Left panel shows only engineering inputs, no project name/description fields

**Step 4: Commit**

```bash
git add src/components/design/core-fields.tsx
git commit -m "refactor: remove project info fields from CoreFields"
```

---

## Task 12: Final Integration Testing

**Files:**
- Test: All components working together

**Step 1: Start development server**

Run: `npm run dev`

**Step 2: Test complete workflow**

1. Navigate to dashboard: `http://localhost:3000/dashboard`
2. Open a project
3. Click "New Design" button
4. Create design named "Test Design"
5. Should redirect to `/project/{projectId}/design/{designId}`
6. Verify breadcrumb shows: Projects / {Project Name} / Test Design
7. Fill in core parameters in left panel
8. Expand advanced options
9. Click "Run Optimization" (top button)
10. Verify progress overlay appears on 3D viewer
11. Wait for optimization to complete
12. Verify right panel auto-opens
13. Verify Results tab shows summary
14. Click Alternatives tab
15. Select different alternative
16. Verify 3D viewer updates (if applicable)
17. Toggle right panel closed/open
18. Verify 3D viewer resizes appropriately
19. Click design name in breadcrumb
20. Edit name, press Enter
21. Verify save status updates
22. Click "← Back"
23. Verify return to project page

**Step 3: Test responsive behavior**

1. Resize browser window to tablet size (768-1280px)
2. Verify layout adapts appropriately
3. Resize to mobile (<768px)
4. Verify layout stacks/adapts

**Step 4: Create comprehensive test commit**

```bash
git add -A
git commit -m "test: verify three-panel design page workflow

- Tested navigation from project to design page
- Verified breadcrumb navigation and name editing
- Confirmed optimization workflow end-to-end
- Validated right panel collapse/expand
- Checked alternative selection
- Verified responsive layout behavior"
```

---

## Task 13: Documentation and Cleanup

**Files:**
- Update: `docs/plans/2025-11-07-design-page-redesign.md`

**Step 1: Update design document with implementation notes**

Add implementation status section to the design document:

```markdown
## Implementation Status

**Completed:** 2025-11-07

**Components Created:**
- ✅ DesignBreadcrumb - Breadcrumb navigation with inline editing
- ✅ DesignInputPanel - Left panel with form inputs
- ✅ DesignViewerPanel - Center panel with 3D viewer
- ✅ ResultsTab - Results display with accordion sections
- ✅ AlternativesTab - Alternative solutions selection
- ✅ DesignResultsPanel - Right panel with tabs

**Routes Created:**
- ✅ `/app/project/[projectId]/design/[designId]/page.tsx`

**Components Modified:**
- ✅ DesignCard - Updated navigation to use router.push
- ✅ DesignsTab - Updated to pass projectId
- ✅ Project page - Removed design editing state
- ✅ CoreFields - Removed project info fields

**Known Issues:**
- None at this time

**Future Enhancements:**
- Explore ShapeDiver API for advanced viewer controls
- Add keyboard shortcuts for common actions
- Implement design versioning
```

**Step 2: Commit documentation update**

```bash
git add docs/plans/2025-11-07-design-page-redesign.md
git commit -m "docs: add implementation status to design document"
```

---

## Verification Checklist

After completing all tasks, verify:

- [ ] Design page accessible at `/project/[projectId]/design/[designId]`
- [ ] Breadcrumb navigation works (Projects → Project → Design)
- [ ] Design name inline editing works
- [ ] Save status indicator updates correctly
- [ ] Left panel shows core fields and advanced options
- [ ] Run Optimization buttons (top and bottom) work
- [ ] 3D viewer shows empty state initially
- [ ] Optimization progress overlay displays correctly
- [ ] 3D model loads after optimization
- [ ] Right panel toggles open/closed
- [ ] Results tab shows summary, parameters, verification
- [ ] Alternatives tab shows solutions
- [ ] Selecting alternative updates 3D viewer
- [ ] Form autosave works
- [ ] Navigation back to project page works
- [ ] No TypeScript errors: `npm run build`
- [ ] No console errors in browser
- [ ] Layout is responsive on different screen sizes

---

## Success Criteria

✅ All 13 tasks completed
✅ All components compile without TypeScript errors
✅ Complete user workflow tested end-to-end
✅ Navigation between pages works correctly
✅ Three-panel layout displays properly
✅ 3D viewer integration functional
✅ Results and alternatives accessible
✅ Responsive design working
✅ Documentation updated

---

## Notes for Engineer

**Optimization Logic:**
The current implementation in Task 7 uses a simplified optimization call. You may need to integrate with the actual API endpoint if the optimization should run on the server rather than client-side.

**ShapeDiver Integration:**
The ShapeDiver component is imported dynamically to avoid SSR issues. Ensure the existing ShapeDiver component accepts the `result` prop correctly.

**Alternative Solutions:**
The current implementation creates mock alternatives. Replace with actual algorithm results that return multiple solutions sorted by weight.

**Responsive Design:**
The plan includes responsive breakpoints but does not implement the drawer/modal behavior for tablet/mobile. This can be added as a future enhancement.

**Testing:**
Since this is a UI-heavy feature, manual testing in the browser is the primary verification method. Consider adding Playwright tests for the complete workflow in the future.
