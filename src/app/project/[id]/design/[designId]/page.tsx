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
  const [rightPanelOpen, setRightPanelOpen] = useState(true)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved')
  const [leftPanelWidth, setLeftPanelWidth] = useState(320)
  const [isResizing, setIsResizing] = useState(false)

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

  // Restore left panel width from localStorage
  useEffect(() => {
    const savedWidth = localStorage.getItem('design-left-panel-width')
    if (savedWidth !== null) {
      const width = parseInt(savedWidth, 10)
      if (width >= 280 && width <= 600) {
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
        steelSection = {
          sectionType: values.steel_section_type as 'I-BEAM' | 'RHS' | 'SHS',
          size: values.use_custom_steel_section ? null : (values.steel_section_size as any),
          customHeight: values.use_custom_steel_section ? values.custom_steel_height : undefined,
          effectiveHeight: effectiveSlabThickness
        };
      }

      // Enumerate allowed channel types based on form selections
      const fixingType = values.fixing_type
      const channelProduct = values.channel_product
      const postfixProduct = values.postfix_product

      const allowed_channel_types = (() => {
        const channelTypes: string[] = []

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
        notch_height: values.notch_height,
        notch_depth: values.notch_depth,
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

  // Handle left panel resize
  const handleMouseDown = useCallback(() => {
    setIsResizing(true)
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return

    const newWidth = e.clientX
    // Constrain width between 280px and 600px
    const constrainedWidth = Math.max(280, Math.min(600, newWidth))
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

      <div className="flex-1 flex overflow-hidden min-h-0">
        <div
          className="h-full border-r bg-white flex-shrink-0 relative overflow-hidden"
          style={{ width: `${leftPanelWidth}px` }}
        >
          <Form {...form}>
            <DesignInputPanel
              form={form}
              onOptimize={handleOptimize}
              isOptimizing={isOptimizing}
            />
          </Form>

          {/* Resize Handle */}
          <div
            onMouseDown={handleMouseDown}
            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500/50 transition-colors group"
          >
            <div className="absolute right-0 top-0 bottom-0 w-4 -mr-2" />
          </div>
        </div>

        <div className="flex-1 relative">
          <DesignViewerPanel
            optimizationResult={optimizationResult}
            isOptimizing={isOptimizing}
            progress={progress}
          />
        </div>

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
