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
