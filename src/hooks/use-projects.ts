/**
 * Client-side React hooks for managing Projects
 * Uses browser localStorage instead of API routes
 */

import { useState, useEffect, useCallback } from 'react'
import { projectStorage, type StoredProject } from '@/lib/storage'

const TEST_USER_ID = 'test-user-id'  // Hardcoded user ID for now

export function useProjects() {
  const [projects, setProjects] = useState<StoredProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load projects on mount
  useEffect(() => {
    try {
      const loadedProjects = projectStorage.findMany(TEST_USER_ID)
      setProjects(loadedProjects.sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ))
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects')
      setLoading(false)
    }
  }, [])

  // Create a new project
  const createProject = useCallback((data: {
    name: string
    description?: string
    stage: string
    totalValue?: string
  }) => {
    try {
      const newProject = projectStorage.create({
        userId: TEST_USER_ID,
        name: data.name,
        description: data.description || null,
        stage: data.stage,
        totalValue: data.totalValue || null,
        enrichedData: null,
      })

      setProjects(prev => [newProject, ...prev])
      return { success: true, project: newProject }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project')
      return { success: false, error: err instanceof Error ? err.message : 'Failed to create project' }
    }
  }, [])

  // Update a project
  const updateProject = useCallback((projectId: string, data: Partial<{
    name: string
    description: string | null
    stage: string
    totalValue: string | null
    enrichedData: unknown
  }>) => {
    try {
      const updated = projectStorage.update(projectId, data)
      if (!updated) {
        throw new Error('Project not found')
      }

      setProjects(prev => prev.map(p => p.id === projectId ? updated : p))
      return { success: true, project: updated }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project')
      return { success: false, error: err instanceof Error ? err.message : 'Failed to update project' }
    }
  }, [])

  // Delete a project
  const deleteProject = useCallback((projectId: string) => {
    try {
      const deleted = projectStorage.delete(projectId)
      if (!deleted) {
        throw new Error('Project not found')
      }

      setProjects(prev => prev.filter(p => p.id !== projectId))
      return { success: true }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project')
      return { success: false, error: err instanceof Error ? err.message : 'Failed to delete project' }
    }
  }, [])

  // Get a single project
  const getProject = useCallback((projectId: string) => {
    return projectStorage.findById(projectId)
  }, [])

  // Maintain backward compatibility with SWR API
  return {
    projects,
    isLoading: loading,
    isError: error,
    error,
    createProject,
    updateProject,
    deleteProject,
    getProject,
    mutate: () => {
      // Refresh projects from storage
      const loadedProjects = projectStorage.findMany(TEST_USER_ID)
      setProjects(loadedProjects.sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ))
    }
  }
}
