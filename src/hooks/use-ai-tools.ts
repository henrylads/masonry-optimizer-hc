import { useState, useCallback, useRef, useEffect } from 'react'
import type { 
  RunOptimizationParams, 
  RunOptimizationResult,
  AnalyzeDesignParams,
  AnalyzeDesignResult,
  ProgressUpdate 
} from '@/types/ai-tools'
import type { OptimisationResult } from '@/types/optimization-types'

export interface AIToolsState {
  // Optimization state
  isOptimizing: boolean
  optimizationProgress: ProgressUpdate | null
  optimizationResult: OptimisationResult | null
  optimizationError: string | null
  
  // Analysis state
  isAnalyzing: boolean
  analysisHistory: AnalyzeDesignResult[]
  analysisError: string | null
  
  // Session state
  sessionId: string | null
  hasOptimizationResult: boolean
  
  // General state
  isToolActive: boolean
}

export interface AIToolsActions {
  // Optimization actions
  runOptimization: (params: RunOptimizationParams) => Promise<RunOptimizationResult>
  clearOptimizationResult: () => void
  
  // Analysis actions
  analyzeDesign: (params: AnalyzeDesignParams) => Promise<AnalyzeDesignResult>
  clearAnalysisHistory: () => void
  
  // Session actions
  setSessionId: (sessionId: string) => void
  reset: () => void
}

export interface UseAIToolsReturn extends AIToolsState, AIToolsActions {}

/**
 * Custom hook for managing AI tools state and execution
 * Provides a unified interface for optimization and analysis operations
 */
export function useAITools(): UseAIToolsReturn {
  // State management
  const [state, setState] = useState<AIToolsState>({
    isOptimizing: false,
    optimizationProgress: null,
    optimizationResult: null,
    optimizationError: null,
    isAnalyzing: false,
    analysisHistory: [],
    analysisError: null,
    sessionId: null,
    hasOptimizationResult: false,
    isToolActive: false
  })
  
  const progressCallbackRef = useRef<((update: ProgressUpdate) => void) | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  
  // Set up progress callback
  useEffect(() => {
    progressCallbackRef.current = (update: ProgressUpdate) => {
      setState(prev => ({
        ...prev,
        optimizationProgress: update
      }))
    }
  }, [])
  
  // Optimization execution
  const runOptimization = useCallback(async (params: RunOptimizationParams): Promise<RunOptimizationResult> => {
    // Clean up any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    abortControllerRef.current = new AbortController()
    
    setState(prev => ({
      ...prev,
      isOptimizing: true,
      isToolActive: true,
      optimizationError: null,
      optimizationProgress: {
        stage: 'preparation',
        progress: 0,
        message: 'Preparing optimization...'
      }
    }))
    
    try {
      const { runOptimization: runOptTool } = await import('@/utils/ai-tools')
      
      const result = await runOptTool(
        params,
        progressCallbackRef.current || undefined,
        300000 // 5 minute timeout
      )
      
      setState(prev => ({
        ...prev,
        isOptimizing: false,
        isToolActive: false,
        optimizationResult: result.success && result.result ? result.result : null,
        optimizationError: result.success ? null : result.error || 'Optimization failed',
        hasOptimizationResult: result.success && !!result.result,
        optimizationProgress: result.success ? {
          stage: 'completion',
          progress: 100,
          message: 'Optimization completed!'
        } : null
      }))
      
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown optimization error'
      
      setState(prev => ({
        ...prev,
        isOptimizing: false,
        isToolActive: false,
        optimizationError: errorMessage,
        optimizationProgress: null
      }))
      
      return {
        success: false,
        error: errorMessage,
        executionTimeMs: 0,
        parametersUsed: undefined
      }
    }
  }, [])
  
  // Analysis execution
  const analyzeDesign = useCallback(async (params: AnalyzeDesignParams): Promise<AnalyzeDesignResult> => {
    setState(prev => ({
      ...prev,
      isAnalyzing: true,
      isToolActive: true,
      analysisError: null
    }))
    
    try {
      const { analyzeDesign: analyzeDesignTool } = await import('@/utils/ai-tools')
      
      const result = await analyzeDesignTool(params, state.sessionId || '')
      
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        isToolActive: false,
        analysisHistory: result.success 
          ? [...prev.analysisHistory, result]
          : prev.analysisHistory,
        analysisError: result.success ? null : result.error || 'Analysis failed'
      }))
      
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown analysis error'
      
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        isToolActive: false,
        analysisError: errorMessage
      }))
      
      return {
        success: false,
        error: errorMessage,
        analysis: '',
        suggestions: [],
        quantitativeImpact: undefined
      }
    }
  }, [state.sessionId])
  
  // Clear optimization result
  const clearOptimizationResult = useCallback(() => {
    setState(prev => ({
      ...prev,
      optimizationResult: null,
      optimizationError: null,
      optimizationProgress: null,
      hasOptimizationResult: false
    }))
  }, [])
  
  // Clear analysis history
  const clearAnalysisHistory = useCallback(() => {
    setState(prev => ({
      ...prev,
      analysisHistory: [],
      analysisError: null
    }))
  }, [])
  
  // Set session ID
  const setSessionId = useCallback((sessionId: string) => {
    setState(prev => ({
      ...prev,
      sessionId
    }))
  }, [])
  
  // Reset all state
  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    setState({
      isOptimizing: false,
      optimizationProgress: null,
      optimizationResult: null,
      optimizationError: null,
      isAnalyzing: false,
      analysisHistory: [],
      analysisError: null,
      sessionId: null,
      hasOptimizationResult: false,
      isToolActive: false
    })
  }, [])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])
  
  return {
    // State
    ...state,
    
    // Actions
    runOptimization,
    clearOptimizationResult,
    analyzeDesign,
    clearAnalysisHistory,
    setSessionId,
    reset
  }
} 