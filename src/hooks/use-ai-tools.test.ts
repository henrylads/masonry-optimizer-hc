import { renderHook, act } from '@testing-library/react'
import { useAITools } from './use-ai-tools'
import type { RunOptimizationParams, AnalyzeDesignParams } from '@/types/ai-tools'

// Mock the AI tools
jest.mock('@/utils/ai-tools', () => ({
  runOptimization: jest.fn(),
  analyzeDesign: jest.fn()
}))

describe('useAITools', () => {
  const mockRunOptimization = jest.requireMock('@/utils/ai-tools').runOptimization
  const mockAnalyzeDesign = jest.requireMock('@/utils/ai-tools').analyzeDesign

  const validOptimizationParams: RunOptimizationParams = {
    slab_thickness: 200,
    cavity: 100,
    support_level: 50,
    characteristic_load: '5.0',
    has_notch: false,
    is_angle_length_limited: false
  }

  const validAnalysisParams: AnalyzeDesignParams = {
    question: 'Is this design optimized?',
    analysisType: 'optimization'
  }

  const mockOptimizationResult = {
    genetic: {
      bracket_centres: 300 as const,
      bracket_thickness: 3 as const,
      angle_thickness: 4 as const,
      vertical_leg: 75,
      bolt_diameter: 10 as const,
      bracket_type: 'Standard' as const,
      angle_orientation: 'Standard' as const
    },
    calculated: {
      bracket_height: 125.5,
      bracket_projection: 90,
      rise_to_bolts: 100.5,
      drop_below_slab: 0,
      bracket_projection_at_fixing: 90,
      shear_load: 2.25,
      total_deflection: 1.5,
      characteristic_load: 5.0,
      area_load: 6.0,
      characteristic_udl: 5.0,
      design_udl: 6.75,
      E: 200000,
      n: 8,
      slab_thickness: 200,
      support_level: 50,
      cavity_width: 100,
      notch_height: 0,
      notch_depth: 0,
      moment_resistance_check: true,
      shear_resistance_check: true,
      angle_deflection_check: true,
      bracket_connection_check: true,
      shear_reduction_check: true,
      bracket_design_check: true,
      fixing_check: true,
      combined_tension_shear_check: true,
      all_checks_pass: true
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useAITools())

      expect(result.current.isOptimizing).toBe(false)
      expect(result.current.optimizationProgress).toBeNull()
      expect(result.current.optimizationResult).toBeNull()
      expect(result.current.optimizationError).toBeNull()
      expect(result.current.isAnalyzing).toBe(false)
      expect(result.current.analysisHistory).toEqual([])
      expect(result.current.analysisError).toBeNull()
      expect(result.current.sessionId).toBeNull()
      expect(result.current.hasOptimizationResult).toBe(false)
      expect(result.current.isToolActive).toBe(false)
    })
  })

  describe('runOptimization', () => {
    it('should handle successful optimization', async () => {
      mockRunOptimization.mockResolvedValue({
        success: true,
        result: mockOptimizationResult,
        executionTimeMs: 5000
      })

      const { result } = renderHook(() => useAITools())

      await act(async () => {
        const optimizationResult = await result.current.runOptimization(validOptimizationParams)
        expect(optimizationResult.success).toBe(true)
      })

      expect(result.current.isOptimizing).toBe(false)
      expect(result.current.optimizationResult).toEqual(mockOptimizationResult)
      expect(result.current.optimizationError).toBeNull()
      expect(result.current.hasOptimizationResult).toBe(true)
      expect(result.current.isToolActive).toBe(false)
    })

    it('should handle optimization failure', async () => {
      const errorMessage = 'No valid design found'
      mockRunOptimization.mockResolvedValue({
        success: false,
        error: errorMessage,
        executionTimeMs: 2000
      })

      const { result } = renderHook(() => useAITools())

      await act(async () => {
        const optimizationResult = await result.current.runOptimization(validOptimizationParams)
        expect(optimizationResult.success).toBe(false)
      })

      expect(result.current.isOptimizing).toBe(false)
      expect(result.current.optimizationResult).toBeNull()
      expect(result.current.optimizationError).toBe(errorMessage)
      expect(result.current.hasOptimizationResult).toBe(false)
      expect(result.current.isToolActive).toBe(false)
    })

    it('should handle optimization exception', async () => {
      const error = new Error('Network error')
      mockRunOptimization.mockRejectedValue(error)

      const { result } = renderHook(() => useAITools())

      await act(async () => {
        const optimizationResult = await result.current.runOptimization(validOptimizationParams)
        expect(optimizationResult.success).toBe(false)
        expect(optimizationResult.error).toBe('Network error')
      })

      expect(result.current.isOptimizing).toBe(false)
      expect(result.current.optimizationError).toBe('Network error')
      expect(result.current.isToolActive).toBe(false)
    })

    it('should update state during optimization', async () => {
      let resolveOptimization: (value: unknown) => void
      const optimizationPromise = new Promise(resolve => {
        resolveOptimization = resolve
      })
      mockRunOptimization.mockReturnValue(optimizationPromise)

      const { result } = renderHook(() => useAITools())

      act(() => {
        result.current.runOptimization(validOptimizationParams)
      })

      // Check state during optimization
      expect(result.current.isOptimizing).toBe(true)
      expect(result.current.isToolActive).toBe(true)
      expect(result.current.optimizationError).toBeNull()

      // Resolve the optimization
      await act(async () => {
        resolveOptimization({
          success: true,
          result: mockOptimizationResult,
          executionTimeMs: 3000
        })
      })

      expect(result.current.isOptimizing).toBe(false)
      expect(result.current.isToolActive).toBe(false)
    })
  })

  describe('analyzeDesign', () => {
    it('should handle successful analysis', async () => {
      const analysisResult = {
        success: true,
        analysis: 'This design is well optimized',
        suggestions: ['Consider reducing bracket thickness'],
        quantitativeImpact: []
      }
      mockAnalyzeDesign.mockResolvedValue(analysisResult)

      const { result } = renderHook(() => useAITools())

      // Set session ID first
      act(() => {
        result.current.setSessionId('test-session-123')
      })

      await act(async () => {
        const response = await result.current.analyzeDesign(validAnalysisParams)
        expect(response.success).toBe(true)
      })

      expect(result.current.isAnalyzing).toBe(false)
      expect(result.current.analysisHistory).toHaveLength(1)
      expect(result.current.analysisHistory[0]).toEqual(analysisResult)
      expect(result.current.analysisError).toBeNull()
      expect(result.current.isToolActive).toBe(false)
    })

    it('should handle analysis failure', async () => {
      const errorMessage = 'No optimization result found'
      mockAnalyzeDesign.mockResolvedValue({
        success: false,
        error: errorMessage,
        analysis: '',
        suggestions: []
      })

      const { result } = renderHook(() => useAITools())

      await act(async () => {
        const response = await result.current.analyzeDesign(validAnalysisParams)
        expect(response.success).toBe(false)
      })

      expect(result.current.isAnalyzing).toBe(false)
      expect(result.current.analysisHistory).toHaveLength(0)
      expect(result.current.analysisError).toBe(errorMessage)
      expect(result.current.isToolActive).toBe(false)
    })

    it('should handle analysis exception', async () => {
      const error = new Error('Analysis service unavailable')
      mockAnalyzeDesign.mockRejectedValue(error)

      const { result } = renderHook(() => useAITools())

      await act(async () => {
        const response = await result.current.analyzeDesign(validAnalysisParams)
        expect(response.success).toBe(false)
        expect(response.error).toBe('Analysis service unavailable')
      })

      expect(result.current.isAnalyzing).toBe(false)
      expect(result.current.analysisError).toBe('Analysis service unavailable')
    })
  })

  describe('session management', () => {
    it('should set session ID', () => {
      const { result } = renderHook(() => useAITools())
      const sessionId = 'test-session-456'

      act(() => {
        result.current.setSessionId(sessionId)
      })

      expect(result.current.sessionId).toBe(sessionId)
    })

    it('should clear optimization result', () => {
      const { result } = renderHook(() => useAITools())

      // Set up some state first
      act(() => {
        result.current.reset()
      })

      // Manually set some state for testing
      act(() => {
        result.current.clearOptimizationResult()
      })

      expect(result.current.optimizationResult).toBeNull()
      expect(result.current.optimizationError).toBeNull()
      expect(result.current.optimizationProgress).toBeNull()
      expect(result.current.hasOptimizationResult).toBe(false)
    })

    it('should clear analysis history', () => {
      const { result } = renderHook(() => useAITools())

      act(() => {
        result.current.clearAnalysisHistory()
      })

      expect(result.current.analysisHistory).toEqual([])
      expect(result.current.analysisError).toBeNull()
    })

    it('should reset all state', () => {
      const { result } = renderHook(() => useAITools())

      // Set some state first
      act(() => {
        result.current.setSessionId('test-session')
      })

      act(() => {
        result.current.reset()
      })

      expect(result.current.isOptimizing).toBe(false)
      expect(result.current.optimizationProgress).toBeNull()
      expect(result.current.optimizationResult).toBeNull()
      expect(result.current.optimizationError).toBeNull()
      expect(result.current.isAnalyzing).toBe(false)
      expect(result.current.analysisHistory).toEqual([])
      expect(result.current.analysisError).toBeNull()
      expect(result.current.sessionId).toBeNull()
      expect(result.current.hasOptimizationResult).toBe(false)
      expect(result.current.isToolActive).toBe(false)
    })
  })
}) 