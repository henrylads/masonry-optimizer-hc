/**
 * Hook for managing a single Project and its Designs
 * Uses browser localStorage instead of API routes
 */

import { useState, useEffect, useCallback } from 'react'
import { projectStorage, designStorage, type StoredProject, type StoredDesign } from '@/lib/storage'
import { useProjects } from './use-projects'
import { useDesigns } from './use-designs'

export function useProject(projectId: string) {
  const { getProject, deleteProject: deleteProjectFn } = useProjects()
  const {
    designs,
    isLoading: designsLoading,
    createDesign,
    deleteDesign,
    mutate: mutateDesigns
  } = useDesigns(projectId)

  const [project, setProject] = useState<StoredProject | null>(null)
  const [loading, setLoading] = useState(true)

  // Load project on mount or when projectId changes
  useEffect(() => {
    const loadedProject = getProject(projectId)
    setProject(loadedProject)
    setLoading(false)
  }, [projectId, getProject])

  const mutate = useCallback(() => {
    const loadedProject = getProject(projectId)
    setProject(loadedProject)
    mutateDesigns()
  }, [projectId, getProject, mutateDesigns])

  return {
    project,
    designs,
    isLoading: loading || designsLoading,
    isError: null,
    mutate,
    createDesign,
    deleteDesign,
    deleteProject: () => deleteProjectFn(projectId)
  }
}
