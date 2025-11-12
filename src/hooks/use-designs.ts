/**
 * Client-side React hooks for managing Designs
 * Uses browser localStorage instead of API routes
 */

import { useState, useEffect, useCallback } from 'react'
import { designStorage, type StoredDesign } from '@/lib/storage'

export function useDesigns(projectId: string) {
  const [designs, setDesigns] = useState<StoredDesign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load designs on mount or when projectId changes
  useEffect(() => {
    try {
      const loadedDesigns = designStorage.findMany(projectId)
      setDesigns(loadedDesigns.sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ))
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load designs')
      setLoading(false)
    }
  }, [projectId])

  // Create a new design
  const createDesign = useCallback((data: {
    name: string
    formParameters: unknown
    calculationResults?: unknown
  }) => {
    try {
      const newDesign = designStorage.create({
        projectId,
        name: data.name,
        formParameters: data.formParameters,
        calculationResults: data.calculationResults || null,
      })

      setDesigns(prev => [newDesign, ...prev])
      return { success: true, design: newDesign }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create design')
      return { success: false, error: err instanceof Error ? err.message : 'Failed to create design' }
    }
  }, [projectId])

  // Update a design
  const updateDesign = useCallback((designId: string, data: Partial<{
    name: string
    formParameters: unknown
    calculationResults: unknown
  }>) => {
    try {
      const updated = designStorage.update(designId, data)
      if (!updated) {
        throw new Error('Design not found')
      }

      setDesigns(prev => prev.map(d => d.id === designId ? updated : d))
      return { success: true, design: updated }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update design')
      return { success: false, error: err instanceof Error ? err.message : 'Failed to update design' }
    }
  }, [])

  // Delete a design
  const deleteDesign = useCallback((designId: string) => {
    try {
      const deleted = designStorage.delete(designId)
      if (!deleted) {
        throw new Error('Design not found')
      }

      setDesigns(prev => prev.filter(d => d.id !== designId))
      return { success: true }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete design')
      return { success: false, error: err instanceof Error ? err.message : 'Failed to delete design' }
    }
  }, [])

  // Get a single design
  const getDesign = useCallback((designId: string) => {
    return designStorage.findById(designId)
  }, [])

  return {
    designs,
    isLoading: loading,
    isError: error,
    error,
    createDesign,
    updateDesign,
    deleteDesign,
    getDesign,
    mutate: () => {
      // Refresh designs from storage
      const loadedDesigns = designStorage.findMany(projectId)
      setDesigns(loadedDesigns.sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ))
    }
  }
}
