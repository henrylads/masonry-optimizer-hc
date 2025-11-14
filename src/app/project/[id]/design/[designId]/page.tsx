'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronLeft, ChevronRight, Wrench, Settings, MessageSquare, Pencil, Loader2 } from 'lucide-react'
import { formSchema } from '@/types/form-schema'
import { runBruteForce } from '@/calculations/bruteForceAlgorithm'
import { optimizeRunLayout } from '@/calculations/runLayoutOptimizer'
import { useDesignAutosave } from '@/hooks/use-design-autosave'
import { AuthHeader } from '@/components/auth-header'
import { DesignInputPanel } from '@/components/design/design-input-panel'
import { DesignViewerPanel } from '@/components/design/design-viewer-panel'
import { DesignResultsPanel } from '@/components/design/design-results-panel'
import { PDFDownloadButton } from '@/components/pdf-download-button'
import { Form } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { OptimisationResult } from '@/types/optimization-types'
import type { Design } from '@/types/design-types'
import type { Project } from '@/types/project-types'
import type { RunOptimizationResult } from '@/types/runLayout'
import type { ShapeDiverOutputs } from '@/components/shapediver'
import type { z } from 'zod'
import { getSteelSectionTypeFromFrameType } from '@/utils/steelSectionHelpers'

export default function DesignPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
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
  const [leftPanelOpen, setLeftPanelOpen] = useState(true)
  const [rightPanelOpen, setRightPanelOpen] = useState(true)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved')
  const [leftPanelWidth, setLeftPanelWidth] = useState(380)
  const [isResizing, setIsResizing] = useState(false)
  const [runLayoutResult, setRunLayoutResult] = useState<RunOptimizationResult | null>(null)
  const [shapeDiverOutputs, setShapeDiverOutputs] = useState<ShapeDiverOutputs | null>(null)
  const [shapeDiverJSONs, setShapeDiverJSONs] = useState<{bracketJSON?: string, angleJSON?: string, runJSON?: string}>({})
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [isUpdatingName, setIsUpdatingName] = useState(false)

  // Form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {}
  })

  // Autosave
  useDesignAutosave({
    designId,
    projectId,
    form,
    onSaveStart: () => setSaveStatus('saving'),
    onSaveSuccess: () => setSaveStatus('saved'),
    onSaveError: () => setSaveStatus('error')
  })

  // Load design and project data from localStorage
  useEffect(() => {
    const loadData = () => {
      try {
        // Import storage functions
        const { designStorage, projectStorage } = require('@/lib/storage')

        // Load design
        const loadedDesign = designStorage.findById(designId)
        if (!loadedDesign) {
          router.push('/dashboard')
          return
        }
        setDesign(loadedDesign as any)

        // Load project
        const loadedProject = projectStorage.findById(projectId)
        if (!loadedProject) {
          router.push('/dashboard')
          return
        }
        setProject(loadedProject as any)

        // Load form parameters
        if (loadedDesign.formParameters) {
          form.reset(loadedDesign.formParameters as any)
        }

        // Load last optimization result if exists
        if (loadedDesign.calculationResults) {
          setOptimizationResult(loadedDesign.calculationResults as any)
        }

        setIsLoading(false)
      } catch (error) {
        console.error('Error loading design:', error)
        router.push('/dashboard')
      }
    }

    loadData()
  }, [designId, projectId, router, form])

  // Restore left panel state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('design-left-panel-open')
    if (savedState !== null) {
      setLeftPanelOpen(savedState === 'true')
    }
  }, [])

  // Save left panel state to localStorage
  useEffect(() => {
    localStorage.setItem('design-left-panel-open', String(leftPanelOpen))
  }, [leftPanelOpen])

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

  // Restore left panel width from localStorage
  useEffect(() => {
    const savedWidth = localStorage.getItem('design-left-panel-width')
    if (savedWidth !== null) {
      const width = parseInt(savedWidth, 10)
      if (width >= 350 && width <= 600) {
        setLeftPanelWidth(width)
      }
    }
  }, [])

  // Save left panel width to localStorage
  useEffect(() => {
    localStorage.setItem('design-left-panel-width', String(leftPanelWidth))
  }, [leftPanelWidth])

  // Handle optimization
  const handleOptimize = useCallback(async () => {
    const values = form.getValues()

    setIsOptimizing(true)
    setProgress(0)
    setOptimizationResult(null)
    setAlternatives([])
    setSelectedAlternativeIndex(0)

    try {
      // Calculate effective height for steel fixings and build steel_section object
      const isSteelFrame = values.frame_fixing_type?.startsWith('steel');
      let effectiveSlabThickness = values.slab_thickness;
      let steelSection = undefined;

      if (isSteelFrame) {
        if (values.use_custom_steel_section && values.custom_steel_height) {
          effectiveSlabThickness = values.custom_steel_height;
        } else if (values.steel_section_size) {
          // Extract height from steel section size (e.g., "203x133" -> 203)
          const height = parseInt(values.steel_section_size.split('x')[0]);
          effectiveSlabThickness = height || values.slab_thickness;
        }

        // Build steel_section object for the algorithm
        const derivedSectionType = getSteelSectionTypeFromFrameType(values.frame_fixing_type);
        steelSection = {
          sectionType: derivedSectionType as 'I-BEAM' | 'RHS' | 'SHS',
          size: values.use_custom_steel_section ? null : (values.steel_section_size as any),
          customHeight: values.use_custom_steel_section ? values.custom_steel_height : undefined,
          effectiveHeight: effectiveSlabThickness
        };
      }

      // Enumerate allowed channel types based on frame_fixing_type
      const frameFixingType = values.frame_fixing_type
      const channelProduct = values.channel_product
      const postfixProduct = values.postfix_product

      const allowed_channel_types = (() => {
        const channelTypes: string[] = []

        // Determine fixing type from frame_fixing_type
        let fixingType: 'all' | 'post-fix' | 'channel-fix'

        if (frameFixingType === 'concrete-cast-in') {
          fixingType = 'channel-fix'
        } else if (frameFixingType === 'concrete-post-fix') {
          fixingType = 'post-fix'
        } else if (frameFixingType === 'concrete-all') {
          fixingType = 'all'
        } else {
          // Steel types - no channel types needed
          return []
        }

        if (fixingType === 'all') {
          // Include channels based on both dropdown selections
          if (channelProduct !== 'all') {
            channelTypes.push(channelProduct)
          } else {
            channelTypes.push('CPRO38', 'CPRO50', 'CPRO52')
          }

          if (postfixProduct !== 'all') {
            channelTypes.push(postfixProduct)
          } else {
            channelTypes.push('R-HPTIII-70', 'R-HPTIII-90')
          }
        } else if (fixingType === 'post-fix') {
          if (postfixProduct && postfixProduct !== 'all') {
            channelTypes.push(postfixProduct)
          } else {
            channelTypes.push('R-HPTIII-70', 'R-HPTIII-90')
          }
        } else if (fixingType === 'channel-fix') {
          if (channelProduct && channelProduct !== 'all') {
            channelTypes.push(channelProduct)
          } else {
            channelTypes.push('CPRO38', 'CPRO50', 'CPRO52')
          }
        }

        return channelTypes.length > 0 ? channelTypes : ['CPRO38', 'CPRO50', 'CPRO52', 'R-HPTIII-70', 'R-HPTIII-90']
      })()

      // Map form fields to DesignInputs format
      const designInputs = {
        // Map cavity to cavity_width
        cavity_width: values.cavity,

        // Add required edge distances (constants from form validation)
        top_critical_edge: 75,
        bottom_critical_edge: 50,

        // Pass through all other matching fields
        support_level: values.support_level,
        slab_thickness: effectiveSlabThickness,
        characteristic_load: values.characteristic_load,
        has_notch: values.has_notch,
        notch_height: values.has_notch ? values.notch_height : 0,
        notch_depth: values.has_notch ? values.notch_depth : 0,
        fixing_position: values.fixing_position,
        use_custom_fixing_position: values.use_custom_fixing_position,
        dim_d: values.dim_d,
        use_custom_dim_d: values.use_custom_dim_d,
        facade_thickness: values.facade_thickness,
        load_position: values.load_position,
        front_offset: values.front_offset,
        isolation_shim_thickness: values.isolation_shim_thickness,
        material_type: values.material_type,
        max_allowable_bracket_extension: values.max_allowable_bracket_extension,
        enable_angle_extension: values.enable_angle_extension,
        frame_fixing_type: values.frame_fixing_type,
        steel_section: steelSection,
        steel_bolt_size: values.steel_bolt_size,
        steel_fixing_method: values.steel_fixing_method,
        allowed_channel_types: allowed_channel_types as any,
      }

      // Run optimization with proper config structure
      const output = await runBruteForce({
        maxGenerations: 1000,
        designInputs,
        onProgress: (generation, maxGenerations) => {
          setProgress((generation / maxGenerations) * 100)
        }
      })

      // Extract result from GeneticAlgorithmOutput
      const result = output.result

      // Use algorithm's returned alternatives and extract the design from each AlternativeDesign
      const alternatives = (result.alternatives || []).map(alt => ({
        ...alt.design,
        totalWeight: alt.totalWeight
      }))

      setOptimizationResult(result)
      setAlternatives(alternatives)
      setSelectedAlternativeIndex(0)

      // Calculate run layout for visualization
      const runLength = values.run_length ?? 1000
      const bracketCentres = result.genetic.bracket_centres
      const runLayout = optimizeRunLayout({
        totalRunLength: runLength,
        bracketCentres: bracketCentres,
      })
      setRunLayoutResult(runLayout)

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

      // Generate ShapeDiver JSON data locally for visualization
      try {
        // Import JSON generators
        const { generateBracketJSON, generateAngleJSON, generateRunJSON } = await import('@/utils/json-generators')

        // Generate the three JSON structures
        const bracketJSON = generateBracketJSON(result, values)
        const angleJSON = generateAngleJSON(result, runLayout)
        const runJSON = generateRunJSON(values, result, runLength)

        // Store as stringified JSON for ShapeDiver
        setShapeDiverJSONs({
          bracketJSON: JSON.stringify(bracketJSON),
          angleJSON: JSON.stringify(angleJSON),
          runJSON: JSON.stringify(runJSON)
        })

        console.log('✅ ShapeDiver JSON data generated for visualization')

        // Also save JSON files to disk (non-blocking, don't wait for response)
        fetch('/api/shapediver-json', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            optimizationResult: result,
            formInputs: values,
            designName: design?.name,
            projectName: project?.name
          })
        }).then(async (jsonResponse) => {
          if (jsonResponse.ok) {
            const jsonData = await jsonResponse.json()
            console.log('ShapeDiver JSON files saved to disk:', jsonData.files)
          }
        }).catch(err => console.warn('Failed to save JSON files:', err))

      } catch (jsonError) {
        console.error('Error generating ShapeDiver JSON data:', jsonError)
        // Don't fail the optimization if JSON generation fails
      }
    } catch (error) {
      console.error('Optimization failed:', error)
      alert('Optimization failed. Please check your inputs and try again.')
    } finally {
      setIsOptimizing(false)
    }
  }, [form, designId, rightPanelOpen, design, project])

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

  // Handle inline name editing
  const handleSaveDesignName = useCallback(async () => {
    if (!design || editedName.trim() === '' || editedName === design.name) {
      setIsEditingName(false)
      setEditedName(design?.name || '')
      return
    }

    setIsUpdatingName(true)
    try {
      await handleUpdateDesignName(editedName.trim())
      setIsEditingName(false)
    } catch (error) {
      console.error('Failed to update design name:', error)
      setEditedName(design.name)
      setIsEditingName(false)
    } finally {
      setIsUpdatingName(false)
    }
  }, [design, editedName, handleUpdateDesignName])

  const handleNameKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveDesignName()
    } else if (e.key === 'Escape') {
      setEditedName(design?.name || '')
      setIsEditingName(false)
    }
  }, [design, handleSaveDesignName])

  // Handle left panel resize
  const handleMouseDown = useCallback(() => {
    setIsResizing(true)
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return

    const newWidth = e.clientX
    // Constrain width between 350px and 600px
    const constrainedWidth = Math.max(350, Math.min(600, newWidth))
    setLeftPanelWidth(constrainedWidth)
  }, [isResizing])

  const handleMouseUp = useCallback(() => {
    setIsResizing(false)
  }, [])

  // Add/remove mouse event listeners for resizing
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    } else {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing, handleMouseMove, handleMouseUp])

  if (isLoading || !design || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <AuthHeader
        leftContent={
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
                {project.name}
              </button>
              <span className="text-muted-foreground">/</span>

              {isEditingName ? (
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onBlur={handleSaveDesignName}
                  onKeyDown={handleNameKeyDown}
                  disabled={isUpdatingName}
                  className="h-7 w-48"
                  autoFocus
                />
              ) : (
                <div className="flex items-center gap-1">
                  <span className="font-semibold">{design.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditedName(design.name)
                      setIsEditingName(true)
                    }}
                    className="h-6 w-6 p-0"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            {/* Save status indicator */}
            <div className="flex items-center gap-2 text-sm ml-4">
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
        }
        rightActions={
          optimizationResult && (
            <PDFDownloadButton
              optimizationResult={optimizationResult}
              designInputs={form.getValues()}
              projectName={project.name}
              designName={design.name}
              variant="outline"
              size="sm"
              shapeDiverOutputs={shapeDiverOutputs ?? undefined}
              className="bg-black text-white hover:bg-black/90 border-black"
            />
          )
        }
      />

      <div className="flex-1 grid min-h-0 overflow-hidden transition-[grid-template-columns] duration-300" style={{ gridTemplateColumns: leftPanelOpen ? `${leftPanelWidth}px 1fr auto` : '48px 1fr auto' }}>
        <div className="relative h-full">
          {/* Panel Content */}
          <div className="h-full border-r bg-white relative overflow-hidden">
            {leftPanelOpen ? (
              <>
                <Form {...form}>
                  <div className="h-full">
                    <DesignInputPanel
                      form={form}
                      onOptimize={handleOptimize}
                      isOptimizing={isOptimizing}
                    />
                  </div>
                </Form>

                {/* Resize Handle */}
                <div
                  onMouseDown={handleMouseDown}
                  className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500/50 transition-colors group z-10"
                >
                  <div className="absolute right-0 top-0 bottom-0 w-4 -mr-2" />
                </div>
              </>
            ) : (
              <div className="h-full w-12 bg-muted/10 flex flex-col items-center py-4 gap-2">
                <button
                  onClick={() => setLeftPanelOpen(true)}
                  className="p-2 hover:bg-muted/30 rounded-md transition-colors"
                  title="Design Parameters"
                >
                  <Wrench className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setLeftPanelOpen(true)}
                  className="p-2 hover:bg-muted/30 rounded-md transition-colors"
                  title="Advanced Options"
                >
                  <Settings className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setLeftPanelOpen(true)}
                  className="p-2 hover:bg-muted/30 rounded-md transition-colors"
                  title="AI Chat"
                >
                  <MessageSquare className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>

          {/* Toggle Button */}
          <button
            onClick={() => setLeftPanelOpen(!leftPanelOpen)}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full h-20 w-6 bg-white border border-l-0 rounded-r-lg shadow-sm hover:bg-muted/30 transition-colors flex items-center justify-center z-20"
            aria-label={leftPanelOpen ? 'Close input panel' : 'Open input panel'}
          >
            {leftPanelOpen ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </div>

        <div className="relative h-full min-w-0 overflow-hidden">
          <DesignViewerPanel
            optimizationResult={optimizationResult}
            isOptimizing={isOptimizing}
            progress={progress}
            onOutputsChange={setShapeDiverOutputs}
            bracketJSON={shapeDiverJSONs.bracketJSON}
            angleJSON={shapeDiverJSONs.angleJSON}
            runJSON={shapeDiverJSONs.runJSON}
          />
        </div>

        <DesignResultsPanel
          optimizationResult={optimizationResult}
          alternatives={alternatives}
          selectedIndex={selectedAlternativeIndex}
          onSelectAlternative={handleSelectAlternative}
          isOpen={rightPanelOpen}
          onToggle={() => setRightPanelOpen(!rightPanelOpen)}
          runLayoutResult={runLayoutResult}
          runLength={form.watch('run_length') ?? 1000}
          shapeDiverOutputs={shapeDiverOutputs}
        />
      </div>
    </div>
  )
}
