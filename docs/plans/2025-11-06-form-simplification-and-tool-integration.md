# Form Simplification & Tool Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Simplify the masonry designer form to show 5 core fields with progressive disclosure, and integrate density calculator and run layout tools inline.

**Architecture:** Refactor existing 2325-line masonry-designer-form.tsx to separate core fields from advanced options. Extract density calculator component to be embeddable inline. Integrate run layout visualization into results display.

**Tech Stack:** React, React Hook Form, Zod, shadcn/ui (Collapsible, Accordion components), TypeScript

---

## Task 1: Create Collapsible Advanced Options Component

**Files:**
- Create: `src/components/design/advanced-options.tsx`
- Ref: `src/components/masonry-designer-form.tsx` (existing form)
- Ref: `src/types/form-schema.ts` (field definitions)

**Step 1: Create advanced options wrapper component**

Create new file with collapsible sections for non-core fields:

```typescript
'use client'

import { useState } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { FormDataType } from '@/types/form-schema'

interface AdvancedOptionsProps {
  form: UseFormReturn<FormDataType>
  frameFixingType: string
}

export function AdvancedOptions({ form, frameFixingType }: AdvancedOptionsProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="w-full space-y-4"
    >
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="flex w-full justify-between items-center p-4 hover:bg-muted"
        >
          <div className="flex items-center gap-2">
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                isOpen ? 'transform rotate-180' : ''
              }`}
            />
            <span className="font-medium">Advanced Options</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {isOpen ? 'Hide' : 'Show'} additional parameters
          </span>
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="space-y-6 pt-4">
        {/* Field groups will go here in next steps */}
        <div className="text-sm text-muted-foreground px-4">
          Advanced options will be organized here by category
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
```

**Step 2: Verify component compiles**

Run: `npm run build`
Expected: Build succeeds, component exports correctly

**Step 3: Commit**

```bash
git add src/components/design/advanced-options.tsx
git commit -m "feat: add advanced options collapsible component structure"
```

---

## Task 2: Extract Core Form Fields Component

**Files:**
- Create: `src/components/design/core-fields.tsx`
- Ref: `src/components/masonry-designer-form.tsx:200-600` (existing field rendering)

**Step 1: Create core fields component with 5 essential fields**

```typescript
'use client'

import { UseFormReturn } from 'react-hook-form'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Calculator } from 'lucide-react'
import { FormDataType } from '@/types/form-schema'

interface CoreFieldsProps {
  form: UseFormReturn<FormDataType>
  onOpenDensityCalculator?: () => void
}

export function CoreFields({ form, onOpenDensityCalculator }: CoreFieldsProps) {
  const frameFixingType = form.watch('frame_fixing_type')
  const isConcreteType = frameFixingType?.startsWith('concrete')

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Field 1: Cavity Width */}
        <FormField
          control={form.control}
          name="cavity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cavity Width (mm) *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.5"
                  placeholder="e.g., 100"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                />
              </FormControl>
              <FormDescription>
                Distance between frame and masonry (50-400mm)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Field 2: Frame Fixing Type */}
        <FormField
          control={form.control}
          name="frame_fixing_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Frame Fixing Type *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select fixing type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="concrete-cast-in">Cast-in Channel</SelectItem>
                  <SelectItem value="concrete-post-fix">Post-fix Anchor</SelectItem>
                  <SelectItem value="concrete-all">All Concrete Options</SelectItem>
                  <SelectItem value="steel-ibeam">Steel I-Beam</SelectItem>
                  <SelectItem value="steel-rhs">Steel RHS</SelectItem>
                  <SelectItem value="steel-shs">Steel SHS</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Type of structural frame connection
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Field 3: Slab Thickness (conditional on concrete types) */}
        {isConcreteType && (
          <FormField
            control={form.control}
            name="slab_thickness"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Slab Thickness (mm) *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="e.g., 225"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  Concrete slab depth (150-500mm)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Field 4: Bracket Drop */}
        <FormField
          control={form.control}
          name="support_level"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bracket Drop (mm) *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="e.g., 0"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                />
              </FormControl>
              <FormDescription>
                Vertical offset from slab (-600 to 500mm)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Field 5: Characteristic Load */}
        <FormField
          control={form.control}
          name="characteristic_load"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Load (kN/m) *</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="e.g., 5.5"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                {onOpenDensityCalculator && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={onOpenDensityCalculator}
                    title="Calculate from masonry density"
                  >
                    <Calculator className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <FormDescription>
                Characteristic load per meter (1-50 kN/m)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}
```

**Step 2: Verify component compiles**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/components/design/core-fields.tsx
git commit -m "feat: extract core form fields component (5 essential fields)"
```

---

## Task 3: Create Inline Density Calculator Component

**Files:**
- Create: `src/components/design/inline-density-calculator.tsx`
- Ref: `src/components/masonry-density-calculator.tsx` (existing calculator)
- Ref: `src/app/density-calculator/page.tsx`

**Step 1: Check existing density calculator component**

Read the file to understand its interface:

```bash
# Component exists at src/components/masonry-density-calculator.tsx
# We need to wrap it for inline use with "Use this value" button
```

**Step 2: Create inline wrapper component**

```typescript
'use client'

import { useState } from 'react'
import { Calculator, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import MasonryDensityCalculator from '@/components/masonry-density-calculator'

interface InlineDensityCalculatorProps {
  onValueSelect: (load: number) => void
}

export function InlineDensityCalculator({ onValueSelect }: InlineDensityCalculatorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [calculatedLoad, setCalculatedLoad] = useState<number | null>(null)

  const handleCalculation = (result: number) => {
    setCalculatedLoad(result)
  }

  const handleUseValue = () => {
    if (calculatedLoad !== null) {
      onValueSelect(calculatedLoad)
      setIsOpen(false)
      setCalculatedLoad(null)
    }
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <CollapsibleTrigger asChild>
        <Button
          type="button"
          variant={isOpen ? "secondary" : "outline"}
          className="w-full justify-start"
        >
          <Calculator className="mr-2 h-4 w-4" />
          {isOpen ? 'Hide' : 'Calculate load from'} masonry density
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="pt-4">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Masonry Density Calculator</CardTitle>
                <CardDescription>
                  Calculate characteristic load based on brick density and geometry
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Embed existing calculator component */}
            <MasonryDensityCalculator
              onCalculate={handleCalculation}
              compact
            />

            {calculatedLoad !== null && (
              <div className="mt-4 flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm font-medium">Calculated Load</p>
                  <p className="text-2xl font-bold">{calculatedLoad.toFixed(2)} kN/m</p>
                </div>
                <Button onClick={handleUseValue}>
                  Use This Value
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  )
}
```

**Step 3: Verify component compiles**

Run: `npm run build`
Expected: May fail if MasonryDensityCalculator doesn't accept props - we'll fix in next task

**Step 4: Commit**

```bash
git add src/components/design/inline-density-calculator.tsx
git commit -m "feat: create inline density calculator wrapper component"
```

---

## Task 4: Update Masonry Density Calculator for Inline Use

**Files:**
- Modify: `src/components/masonry-density-calculator.tsx`

**Step 1: Add props interface to existing calculator**

Locate the component export and add optional props:

```typescript
interface MasonryDensityCalculatorProps {
  onCalculate?: (result: number) => void
  compact?: boolean
}

export default function MasonryDensityCalculator({
  onCalculate,
  compact = false
}: MasonryDensityCalculatorProps = {}) {
  // existing code...

  // Find where result is calculated and add callback:
  // After calculation completes, call:
  // if (onCalculate && finalResult) {
  //   onCalculate(finalResult)
  // }
}
```

**Step 2: Locate calculation result section**

Search for where the final load value is calculated/displayed:

```bash
# The component calculates brick_density_at_height or similar
# Find this calculation and trigger callback
```

**Step 3: Add callback trigger after calculation**

```typescript
// In the calculation effect or submit handler:
useEffect(() => {
  if (calculatedValue) {
    onCalculate?.(calculatedValue)
  }
}, [calculatedValue, onCalculate])
```

**Step 4: Add compact mode styling (optional)**

```typescript
// Wrap component in conditional className:
<div className={cn(compact && "space-y-4", !compact && "container mx-auto py-8")}>
  {/* existing content */}
</div>
```

**Step 5: Verify component still works**

Run: `npm run dev`
Test: Navigate to `/density-calculator` page
Expected: Page loads without errors

**Step 6: Commit**

```bash
git add src/components/masonry-density-calculator.tsx
git commit -m "feat: add callback and compact mode props to density calculator"
```

---

## Task 5: Organize Advanced Options into Field Groups

**Files:**
- Modify: `src/components/design/advanced-options.tsx`

**Step 1: Create field group components within advanced options**

Replace placeholder content with organized sections:

```typescript
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
// ... other imports

export function AdvancedOptions({ form, frameFixingType }: AdvancedOptionsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const isConcreteType = frameFixingType?.startsWith('concrete')
  const isSteelType = frameFixingType?.startsWith('steel')

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      {/* CollapsibleTrigger from before */}

      <CollapsibleContent className="space-y-6 pt-4">
        <Accordion type="multiple" className="w-full">
          {/* Group 1: Project Information */}
          <AccordionItem value="project-info">
            <AccordionTrigger>Project Information</AccordionTrigger>
            <AccordionContent className="space-y-4">
              <FormField
                control={form.control}
                name="project_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="section_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Section Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Add remaining project info fields: client_name, project_location, project_reference, designer_name */}
            </AccordionContent>
          </AccordionItem>

          {/* Group 2: Geometry & Dimensions */}
          <AccordionItem value="geometry">
            <AccordionTrigger>Geometry & Dimensions</AccordionTrigger>
            <AccordionContent className="space-y-4 grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="facade_thickness"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Facade Thickness (mm)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="front_offset"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Front Offset (mm)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Add: isolation_shim_thickness, load_position, use_custom_load_position, use_custom_facade_offsets */}
            </AccordionContent>
          </AccordionItem>

          {/* Group 3: Fixing Configuration */}
          <AccordionItem value="fixing-config">
            <AccordionTrigger>Fixing Configuration</AccordionTrigger>
            <AccordionContent className="space-y-4">
              <FormField
                control={form.control}
                name="fixing_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fixing Type</FormLabel>
                    {/* Add Select component */}
                    <FormMessage />
                  </FormItem>
                )}
              />
              {isConcreteType && (
                <>
                  <FormField control={form.control} name="channel_product" /* ... */ />
                  <FormField control={form.control} name="postfix_product" /* ... */ />
                </>
              )}
              <FormField
                control={form.control}
                name="use_custom_fixing_position"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <FormLabel>Custom Fixing Position</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              {/* Add: fixing_position (conditional), use_custom_dim_d, dim_d */}
            </AccordionContent>
          </AccordionItem>

          {/* Group 4: Material & Loading */}
          <AccordionItem value="material-loading">
            <AccordionTrigger>Material & Loading</AccordionTrigger>
            <AccordionContent className="space-y-4">
              <FormField control={form.control} name="material_type" /* ... */ />
            </AccordionContent>
          </AccordionItem>

          {/* Group 5: Notch Configuration */}
          <AccordionItem value="notch">
            <AccordionTrigger>Notch Configuration</AccordionTrigger>
            <AccordionContent className="space-y-4">
              <FormField
                control={form.control}
                name="has_notch"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <FormLabel>Enable Notch</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              {form.watch('has_notch') && (
                <>
                  <FormField control={form.control} name="notch_height" /* ... */ />
                  <FormField control={form.control} name="notch_depth" /* ... */ />
                </>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* Group 6: Angle Configuration */}
          <AccordionItem value="angle">
            <AccordionTrigger>Angle Configuration</AccordionTrigger>
            <AccordionContent className="space-y-4">
              <FormField control={form.control} name="is_angle_length_limited" /* ... */ />
              {form.watch('is_angle_length_limited') && (
                <FormField control={form.control} name="fixed_angle_length" /* ... */ />
              )}
              <FormField control={form.control} name="enable_angle_extension" /* ... */ />
              {form.watch('enable_angle_extension') && (
                <FormField control={form.control} name="max_allowable_bracket_extension" /* ... */ />
              )}
            </AccordionContent>
          </AccordionItem>

          {/* Group 7: Steel Section Configuration (conditional on steel types) */}
          {isSteelType && (
            <AccordionItem value="steel-config">
              <AccordionTrigger>Steel Section Configuration</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <FormField control={form.control} name="steel_section_type" /* ... */ />
                <FormField control={form.control} name="use_custom_steel_section" /* ... */ />
                {form.watch('use_custom_steel_section') ? (
                  <FormField control={form.control} name="custom_steel_height" /* ... */ />
                ) : (
                  <FormField control={form.control} name="steel_section_size" /* ... */ />
                )}
                <FormField control={form.control} name="steel_bolt_size" /* ... */ />
                <FormField control={form.control} name="steel_fixing_method" /* ... */ />
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </CollapsibleContent>
    </Collapsible>
  )
}
```

**Step 2: Verify component compiles**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/components/design/advanced-options.tsx
git commit -m "feat: organize advanced form fields into logical groups"
```

---

## Task 6: Integrate Components into Main Form

**Files:**
- Modify: `src/components/masonry-designer-form.tsx`

**Step 1: Import new components**

Add imports at top of file:

```typescript
import { CoreFields } from '@/components/design/core-fields'
import { AdvancedOptions } from '@/components/design/advanced-options'
import { InlineDensityCalculator } from '@/components/design/inline-density-calculator'
```

**Step 2: Add density calculator state**

After existing useState declarations (around line 95):

```typescript
const [showDensityCalculator, setShowDensityCalculator] = useState(false)
```

**Step 3: Add callback for density calculator value selection**

Before the return statement:

```typescript
const handleDensityCalculatorValue = (load: number) => {
  form.setValue('characteristic_load', load)
  setShowDensityCalculator(false)
}
```

**Step 4: Replace form fields section**

Find the large section rendering all form fields (likely around lines 500-1500).
Replace with:

```typescript
{/* Core Fields */}
<CoreFields
  form={form}
  onOpenDensityCalculator={() => setShowDensityCalculator(!showDensityCalculator)}
/>

{/* Inline Density Calculator */}
{showDensityCalculator && (
  <InlineDensityCalculator
    onValueSelect={handleDensityCalculatorValue}
  />
)}

{/* Advanced Options */}
<AdvancedOptions
  form={form}
  frameFixingType={form.watch('frame_fixing_type')}
/>
```

**Step 5: Verify form loads without errors**

Run: `npm run dev`
Test: Navigate to project with design, form should load
Expected: Form displays with 5 core fields and collapsible sections

**Step 6: Commit**

```bash
git add src/components/masonry-designer-form.tsx
git commit -m "feat: integrate progressive disclosure form components"
```

---

## Task 7: Test Form Functionality

**Files:**
- Test: All form components

**Step 1: Manual testing checklist**

Test the following scenarios:
1. Core fields accept valid input
2. Core fields show validation errors for invalid input
3. "Advanced Options" button toggles visibility
4. Density calculator button opens inline calculator
5. Density calculator "Use This Value" populates load field
6. Form submission works with only core fields filled
7. Form submission works with advanced options
8. Steel-specific fields show only for steel types
9. Concrete-specific fields show only for concrete types

**Step 2: Create test scenarios document**

```bash
# Document any issues found in:
docs/test-results/form-simplification-manual-tests.md
```

**Step 3: Fix any bugs discovered**

```bash
# Create bug fix commits as needed
git commit -m "fix: [specific issue]"
```

---

## Task 8: Update Design State Persistence

**Files:**
- Modify: `src/app/project/[id]/page.tsx`
- Create: `src/hooks/use-design-autosave.ts`

**Step 1: Create autosave hook**

```typescript
import { useEffect, useRef } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { FormDataType } from '@/types/form-schema'

interface UseDesignAutosaveProps {
  designId: string | null
  projectId: string
  form: UseFormReturn<FormDataType>
}

export function useDesignAutosave({
  designId,
  projectId,
  form,
}: UseDesignAutosaveProps) {
  const timeoutRef = useRef<NodeJS.Timeout>()
  const formValues = form.watch()

  useEffect(() => {
    if (!designId) return

    // Debounce save by 2 seconds
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(async () => {
      try {
        await fetch(`/api/designs/${designId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            formParameters: formValues,
          }),
        })
        console.log('Design auto-saved')
      } catch (error) {
        console.error('Auto-save failed:', error)
      }
    }, 2000)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [designId, formValues])
}
```

**Step 2: Integrate autosave into form component**

In `masonry-designer-form.tsx`, add prop for design context:

```typescript
interface MasonryDesignerFormProps {
  designId?: string | null
  projectId?: string
  onTestSubmit?: (values: z.infer<typeof formSchema>) => void
}

// In component:
if (designId && projectId) {
  useDesignAutosave({ designId, projectId, form })
}
```

**Step 3: Pass design context from project page**

In `src/app/project/[id]/page.tsx`, update form rendering:

```typescript
<MasonryDesignerForm
  designId={activeDesignId}
  projectId={projectId}
/>
```

**Step 4: Test autosave**

1. Edit form field
2. Wait 2 seconds
3. Check browser network tab for PATCH request
4. Refresh page, verify value persisted

**Step 5: Commit**

```bash
git add src/hooks/use-design-autosave.ts src/components/masonry-designer-form.tsx src/app/project/[id]/page.tsx
git commit -m "feat: add form auto-save with 2-second debounce"
```

---

## Task 9: Create Results Integration Component

**Files:**
- Create: `src/components/design/integrated-results.tsx`
- Ref: `src/components/results-display.tsx`
- Ref: `src/app/run-layout/page.tsx`

**Step 1: Create results wrapper component**

```typescript
'use client'

import { OptimisationResult } from '@/types/optimization-types'
import { ResultsDisplay } from '@/components/results-display'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface IntegratedResultsProps {
  result: OptimisationResult
  onCompare?: () => void
}

export function IntegratedResults({ result, onCompare }: IntegratedResultsProps) {
  return (
    <div className="space-y-6 mt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Optimization Results</h2>
        {onCompare && (
          <Button variant="outline" onClick={onCompare}>
            Compare with Other Designs
          </Button>
        )}
      </div>

      <Tabs defaultValue="results" className="w-full">
        <TabsList>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="layout">Run Layout</TabsTrigger>
        </TabsList>

        <TabsContent value="results" className="space-y-4">
          <ResultsDisplay result={result} />
        </TabsContent>

        <TabsContent value="layout" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Run Layout Visualization</CardTitle>
              <CardDescription>
                Auto-generated bracket and angle arrangement
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Run layout component will go here */}
              <div className="text-center py-8 text-muted-foreground">
                Run layout visualization will be integrated here
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

**Step 2: Verify component compiles**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/components/design/integrated-results.tsx
git commit -m "feat: create integrated results component with tabs"
```

---

## Task 10: Update Main Form to Use Integrated Results

**Files:**
- Modify: `src/components/masonry-designer-form.tsx`

**Step 1: Import integrated results component**

```typescript
import { IntegratedResults } from '@/components/design/integrated-results'
```

**Step 2: Replace results display section**

Find where ResultsDisplay is rendered (likely near end of component).
Replace with:

```typescript
{(result || aiOptimizationResult) && (
  <IntegratedResults
    result={result || aiOptimizationResult}
    onCompare={() => {
      // TODO: Implement design comparison modal
      console.log('Compare designs')
    }}
  />
)}
```

**Step 3: Test results display**

1. Fill form and run optimization
2. Verify results show in new tabbed layout
3. Verify can switch between Results and Run Layout tabs

**Step 4: Commit**

```bash
git add src/components/masonry-designer-form.tsx
git commit -m "feat: integrate results with run layout tabs"
```

---

## Task 11: Hide Navigation Tabs in Project Workspace (Already Done)

**Status:** ✓ Complete (MainNavigation already updated with hideNavTabs prop)

---

## Task 12: Final Testing & Documentation

**Files:**
- Create: `docs/user-guide/simplified-form.md`
- Update: `docs/plans/2025-11-06-project-dashboard-design.md`

**Step 1: Comprehensive testing**

Test all workflows:
1. Create project → Create design → Fill core fields → Run optimization
2. Create design → Use density calculator → Auto-populate load field
3. Create design → Expand advanced options → Modify settings → Run optimization
4. Verify form auto-saves every 2 seconds
5. Verify results display inline with run layout tab
6. Test with different frame fixing types (concrete vs steel)

**Step 2: Create user guide**

```markdown
# Simplified Form User Guide

## Core Fields

The form now shows 5 essential fields by default:

1. **Cavity Width** - Distance between frame and masonry
2. **Frame Fixing Type** - Structural connection method
3. **Slab Thickness** - Concrete depth (for concrete types)
4. **Bracket Drop** - Vertical offset from slab
5. **Load** - Characteristic load per meter

## Density Calculator

Click the calculator icon next to the Load field to:
- Calculate load from brick density and geometry
- Click "Use This Value" to populate the load field automatically

## Advanced Options

Click "Advanced Options" to access additional parameters organized by category:
- Project Information
- Geometry & Dimensions
- Fixing Configuration
- Material & Loading
- Notch Configuration
- Angle Configuration
- Steel Section Configuration (steel types only)

## Auto-Save

Form changes automatically save every 2 seconds.
```

**Step 3: Update design document status**

Mark tasks as implemented in `docs/plans/2025-11-06-project-dashboard-design.md`

**Step 4: Commit documentation**

```bash
git add docs/
git commit -m "docs: add user guide for simplified form"
```

---

## Verification Steps

After completing all tasks, verify:

- [ ] Form shows only 5 core fields by default
- [ ] Advanced options collapse/expand correctly
- [ ] Density calculator opens inline and populates load
- [ ] Form validates all fields correctly
- [ ] Auto-save works (check network tab)
- [ ] Results display inline after optimization
- [ ] Run layout tab shows in results
- [ ] Navigation tabs hidden in project workspace
- [ ] Form works with both concrete and steel frame types
- [ ] No console errors during normal operation

## Success Criteria

1. Users can complete basic design with only 5 visible fields
2. Advanced users can access all parameters via organized groups
3. Density calculator integrated inline (no navigation away)
4. Results display immediately without page changes
5. Form auto-saves prevent data loss
6. All existing functionality preserved

