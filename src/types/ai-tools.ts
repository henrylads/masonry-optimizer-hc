import { z } from 'zod'
import type { DesignInputs } from './designInputs'
import type { OptimisationResult } from './optimization-types'

/**
 * Tool 1: Direct Algorithm Execution Parameters
 * These parameters are extracted from chat and passed directly to the brute force algorithm
 */
export interface RunOptimizationParams {
  // Required structural parameters
  slab_thickness: number // mm (150-500)
  cavity: number // mm (50-400, in 0.5mm increments)  
  support_level: number // mm (-600 to 500)
  
  // Load parameters (either characteristic_load OR masonry properties)
  characteristic_load?: string // kN/m (if known directly)
  masonry_density?: number // kg/m³ (1500-2500, for calculation)
  masonry_thickness?: number // mm (50-250, for calculation)
  masonry_height?: number // m (1-10, for calculation)
  
  // Optional structural features
  has_notch?: boolean
  notch_height?: number // mm (10-200, required if has_notch=true)
  notch_depth?: number // mm (10-200, required if has_notch=true)
  
  // Optional constraints
  is_angle_length_limited?: boolean
  fixed_angle_length?: number // mm (200-1490 in 5mm increments, required if is_angle_length_limited=true)
  
  // Fixing position optimization
  enable_fixing_optimization?: boolean
  fixing_position?: number // mm (75-400, distance from top of slab to fixing point)
}

/**
 * Zod schema for Tool 1 parameter validation
 */
export const RunOptimizationParamsSchema = z.object({
  slab_thickness: z.number()
    .min(150, "Slab thickness must be at least 150mm")
    .max(500, "Slab thickness must be at most 500mm"),
  
  cavity: z.number()
    .min(50, "Cavity width must be at least 50mm") 
    .max(400, "Cavity width must be at most 400mm")
    .refine(val => (val * 2) % 1 === 0, "Cavity width must be in 0.5mm increments"),
  
  support_level: z.number()
    .min(-600, "Support level must be at least -600mm")
    .max(500, "Support level must be at most 500mm"),
  
  characteristic_load: z.string().optional(),
  
  masonry_density: z.number()
    .min(1500, "Masonry density must be at least 1500 kg/m³")
    .max(2500, "Masonry density must be at most 2500 kg/m³")
    .optional(),
  
  masonry_thickness: z.number()
    .min(50, "Masonry thickness must be at least 50mm")
    .max(250, "Masonry thickness must be at most 250mm")
    .optional(),
  
  masonry_height: z.number()
    .min(1, "Masonry height must be at least 1m")
    .max(10, "Masonry height must be at most 10m")
    .optional(),
  
  has_notch: z.boolean().optional(),
  
  notch_height: z.number()
    .min(10, "Notch height must be at least 10mm")
    .max(200, "Notch height must be at most 200mm")
    .optional(),
  
  notch_depth: z.number()
    .min(10, "Notch depth must be at least 10mm") 
    .max(200, "Notch depth must be at most 200mm")
    .optional(),
  
  is_angle_length_limited: z.boolean().optional(),
  
  fixed_angle_length: z.number()
    .min(200, "Fixed angle length must be at least 200mm")
    .max(1490, "Fixed angle length must be at most 1490mm")
    .refine(val => val % 5 === 0, "Fixed angle length must be in 5mm increments")
    .optional(),
  
  enable_fixing_optimization: z.boolean().optional(),
  
  fixing_position: z.number()
    .min(75, "Fixing position must be at least 75mm from top of slab")
    .max(400, "Fixing position must be at most 400mm from top of slab")
    .optional()
}).refine(data => {
  // Validate load calculation requirements
  const hasCharacteristicLoad = data.characteristic_load !== undefined && data.characteristic_load !== ""
  const hasMasonryProperties = data.masonry_density !== undefined && 
                               data.masonry_thickness !== undefined && 
                               data.masonry_height !== undefined
  
  return hasCharacteristicLoad || hasMasonryProperties
}, {
  message: "Either characteristic_load or complete masonry properties (density, thickness, height) must be provided"
}).refine(data => {
  // Validate notch requirements
  if (data.has_notch === true) {
    return data.notch_height !== undefined && data.notch_depth !== undefined
  }
  return true
}, {
  message: "notch_height and notch_depth are required when has_notch is true"
}).refine(data => {
  // Validate angle length limitation requirements
  if (data.is_angle_length_limited === true) {
    return data.fixed_angle_length !== undefined
  }
  return true
}, {
  message: "fixed_angle_length is required when is_angle_length_limited is true"
})

/**
 * Tool 1 execution result
 */
export interface RunOptimizationResult {
  success: boolean
  result?: OptimisationResult
  error?: string
  executionTimeMs?: number
  parametersUsed?: DesignInputs
}

/**
 * Tool 2: Result Analysis Parameters  
 * Note: OptimisationResult data will be passed via chat context, not tool parameters
 */
export interface AnalyzeDesignParams {
  question: string // The user's question about the design/results
  analysisType?: 'improvement' | 'explanation' | 'comparison' | 'optimization' // Optional hint about analysis type
}

/**
 * Zod schema for Tool 2 parameter validation
 */
export const AnalyzeDesignParamsSchema = z.object({
  question: z.string()
    .min(5, "Question must be at least 5 characters")
    .max(500, "Question must be at most 500 characters"),
  
  analysisType: z.enum(['improvement', 'explanation', 'comparison', 'optimization']).optional()
})

/**
 * Tool 2 analysis result
 */
export interface AnalyzeDesignResult {
  success: boolean
  analysis?: string
  suggestions?: string[]
  quantitativeImpact?: {
    parameter: string
    currentValue: number | string
    suggestedValue: number | string
    estimatedChange: string // e.g., "15% weight increase", "20% cost reduction"
  }[]
  error?: string
}

/**
 * Progress update for long-running operations
 */
export interface ProgressUpdate {
  stage: 'validation' | 'conversion' | 'preparation' | 'execution' | 'completion'
  progress: number // 0-100
  message: string
  currentStep?: number
  totalSteps?: number
  // Enhanced progress tracking fields
  combinationsChecked?: number
  totalCombinations?: number
  currentBestWeight?: number
  estimatedTimeRemaining?: number
}

/**
 * AI Tools execution context with enhanced result management
 */
export interface AIToolsContext {
  sessionId: string
  currentResult?: OptimisationResult
  extractedParameters?: RunOptimizationParams
  conversationHistory?: Array<{
    role: 'user' | 'assistant' | 'tool'
    content: string
    timestamp: Date
    toolName?: string
  }>
  // Enhanced context management for Tool 2 support
  resultMetadata?: {
    generatedAt: Date
    parametersUsed: RunOptimizationParams
    executionTimeMs: number
    resultSummary: string // Human-readable summary of the optimization result
    isValidDesign: boolean
    weightKgPerMeter?: number
  }
  // Session persistence
  lastActivity: Date
  contextExpiresAt?: Date // Optional expiration for cleanup
}

/**
 * Context manager for handling OptimisationResult data across chat sessions
 */
export interface ResultContextManager {
  /**
   * Store optimization result in context with metadata
   */
  storeResult(
    sessionId: string, 
    result: OptimisationResult, 
    parameters: RunOptimizationParams, 
    executionTimeMs: number
  ): Promise<void>
  
  /**
   * Retrieve current result for analysis
   */
  getCurrentResult(sessionId: string): Promise<AIToolsContext | null>
  
  /**
   * Check if context has valid result for Tool 2 analysis
   */
  hasValidResult(sessionId: string): Promise<boolean>
  
  /**
   * Update context with conversation history
   */
  updateConversationHistory(
    sessionId: string, 
    message: { role: 'user' | 'assistant' | 'tool', content: string, toolName?: string }
  ): Promise<void>
  
  /**
   * Clear result context (when starting new optimization)
   */
  clearResult(sessionId: string): Promise<void>
  
  /**
   * Cleanup expired contexts
   */
  cleanupExpiredContexts(): Promise<void>
}

/**
 * Context-based result reference for Tool 2
 * This is passed to the AI along with the user's question to provide context
 */
export interface AnalysisContext {
  hasResult: boolean
  resultSummary?: string
  designStatus: 'valid' | 'invalid' | 'unknown'
  key_metrics?: {
    totalWeight?: number
    bracketCentres?: number
    angleThickness?: number
    bracketThickness?: number
    utilisation?: number
  }
  verification_status?: {
    all_checks_pass?: boolean
    failed_checks?: string[]
    critical_failures?: string[]
  }
  design_parameters?: {
    slab_thickness: number
    cavity: number
    support_level: number
    characteristic_load?: string
    has_notch?: boolean
    bracket_type?: 'Standard' | 'Inverted'
  }
  generatedAt?: Date
  executionTimeMs?: number
}

/**
 * Enhanced Tool 2 parameters with context awareness
 */
export interface AnalyzeDesignParamsWithContext extends AnalyzeDesignParams {
  context: AnalysisContext
  includeQuantitativeAnalysis?: boolean
  focusAreas?: ('weight' | 'verification' | 'cost' | 'performance' | 'alternatives')[]
}

/**
 * Tool execution status
 */
export type ToolExecutionStatus = 'idle' | 'running' | 'success' | 'error'

/**
 * Common tool response wrapper
 */
export interface ToolResponse<T = unknown> {
  toolName: string
  status: ToolExecutionStatus
  data?: T
  error?: string
  executionTimeMs?: number
  progress?: ProgressUpdate
} 