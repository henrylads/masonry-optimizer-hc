import type {
  AIToolsContext,
  ResultContextManager,
  RunOptimizationParams,
  AnalysisContext
} from '@/types/ai-tools'
import type { OptimisationResult } from '@/types/optimization-types'

/**
 * In-memory context storage (in production, this would be replaced with Redis/database)
 * For the current implementation, we'll use a Map with session management
 */
class InMemoryResultContextManager implements ResultContextManager {
  private contexts: Map<string, AIToolsContext> = new Map()
  private readonly CONTEXT_EXPIRATION_MS = 24 * 60 * 60 * 1000 // 24 hours
  
  /**
   * Store optimization result in context with metadata
   */
  async storeResult(
    sessionId: string, 
    result: OptimisationResult, 
    parameters: RunOptimizationParams, 
    executionTimeMs: number
  ): Promise<void> {
    const now = new Date()
    const resultSummary = this.generateResultSummary(result, parameters)
    
    const context: AIToolsContext = {
      sessionId,
      currentResult: result,
      extractedParameters: parameters,
      conversationHistory: [],
      resultMetadata: {
        generatedAt: now,
        parametersUsed: parameters,
        executionTimeMs,
        resultSummary,
        isValidDesign: result.calculated.all_checks_pass ?? false,
        weightKgPerMeter: result.calculated.optimal_design_weight
      },
      lastActivity: now,
      contextExpiresAt: new Date(now.getTime() + this.CONTEXT_EXPIRATION_MS)
    }
    
    this.contexts.set(sessionId, context)
    console.log(`✅ Stored optimization result for session ${sessionId}`)
  }
  
  /**
   * Retrieve current result for analysis
   */
  async getCurrentResult(sessionId: string): Promise<AIToolsContext | null> {
    const context = this.contexts.get(sessionId)
    
    if (!context) {
      return null
    }
    
    // Check if context has expired
    if (context.contextExpiresAt && context.contextExpiresAt < new Date()) {
      this.contexts.delete(sessionId)
      console.log(`🗑️ Removed expired context for session ${sessionId}`)
      return null
    }
    
    // Update last activity
    context.lastActivity = new Date()
    this.contexts.set(sessionId, context)
    
    return context
  }
  
  /**
   * Check if context has valid result for Tool 2 analysis
   */
  async hasValidResult(sessionId: string): Promise<boolean> {
    const context = await this.getCurrentResult(sessionId)
    return context?.currentResult !== undefined
  }
  
  /**
   * Update context with conversation history
   */
  async updateConversationHistory(
    sessionId: string, 
    message: { role: 'user' | 'assistant' | 'tool', content: string, toolName?: string }
  ): Promise<void> {
    const context = await this.getCurrentResult(sessionId)
    
    if (context) {
      if (!context.conversationHistory) {
        context.conversationHistory = []
      }
      
      context.conversationHistory.push({
        ...message,
        timestamp: new Date()
      })
      
      // Keep only last 20 messages to prevent memory bloat
      if (context.conversationHistory.length > 20) {
        context.conversationHistory = context.conversationHistory.slice(-20)
      }
      
      context.lastActivity = new Date()
      this.contexts.set(sessionId, context)
    }
  }
  
  /**
   * Clear result context (when starting new optimization)
   */
  async clearResult(sessionId: string): Promise<void> {
    const context = this.contexts.get(sessionId)
    
    if (context) {
      // Keep session but clear result data
      context.currentResult = undefined
      context.extractedParameters = undefined
      context.resultMetadata = undefined
      context.conversationHistory = []
      context.lastActivity = new Date()
      
      this.contexts.set(sessionId, context)
      console.log(`🧹 Cleared result data for session ${sessionId}`)
    }
  }
  
  /**
   * Cleanup expired contexts
   */
  async cleanupExpiredContexts(): Promise<void> {
    const now = new Date()
    let cleaned = 0
    
    for (const [sessionId, context] of this.contexts.entries()) {
      if (context.contextExpiresAt && context.contextExpiresAt < now) {
        this.contexts.delete(sessionId)
        cleaned++
      }
    }
    
    if (cleaned > 0) {
      console.log(`🗑️ Cleaned up ${cleaned} expired contexts`)
    }
  }
  
  /**
   * Convert stored context to analysis context for Tool 2
   */
  async getAnalysisContext(sessionId: string): Promise<AnalysisContext> {
    const context = await this.getCurrentResult(sessionId)
    
    if (!context || !context.currentResult) {
      return {
        hasResult: false,
        designStatus: 'unknown'
      }
    }
    
    const result = context.currentResult
    const metadata = context.resultMetadata
    
    // Extract failed checks
    const failedChecks: string[] = []
    const criticalFailures: string[] = []
    
    if (!result.calculated.moment_resistance_check) {
      failedChecks.push('Moment Resistance')
      criticalFailures.push('Moment Resistance')
    }
    if (!result.calculated.shear_resistance_check) {
      failedChecks.push('Shear Resistance')
      criticalFailures.push('Shear Resistance')
    }
    if (!result.calculated.angle_deflection_check) {
      failedChecks.push('Angle Deflection')
    }
    if (!result.calculated.bracket_connection_check) {
      failedChecks.push('Bracket Connection')
      criticalFailures.push('Bracket Connection')
    }
    if (!result.calculated.shear_reduction_check) {
      failedChecks.push('Shear Reduction')
    }
    if (!result.calculated.bracket_design_check) {
      failedChecks.push('Bracket Design')
    }
    if (!result.calculated.fixing_check) {
      failedChecks.push('Fixing')
    }
    if (!result.calculated.combined_tension_shear_check) {
      failedChecks.push('Combined Tension/Shear')
    }
    
    return {
      hasResult: true,
      resultSummary: metadata?.resultSummary,
      designStatus: metadata?.isValidDesign ? 'valid' : 'invalid',
      key_metrics: {
        totalWeight: result.calculated.optimal_design_weight,
        bracketCentres: result.genetic.bracket_centres,
        angleThickness: result.genetic.angle_thickness,
        bracketThickness: result.genetic.bracket_thickness,
        utilisation: result.calculated.angle_utilisation
      },
      verification_status: {
        all_checks_pass: result.calculated.all_checks_pass,
        failed_checks: failedChecks.length > 0 ? failedChecks : undefined,
        critical_failures: criticalFailures.length > 0 ? criticalFailures : undefined
      },
      design_parameters: context.extractedParameters ? {
        slab_thickness: context.extractedParameters.slab_thickness,
        cavity: context.extractedParameters.cavity,
        support_level: context.extractedParameters.support_level,
        characteristic_load: context.extractedParameters.characteristic_load,
        has_notch: context.extractedParameters.has_notch,
        bracket_type: result.calculated.bracket_type
      } : undefined,
      generatedAt: metadata?.generatedAt,
      executionTimeMs: metadata?.executionTimeMs
    }
  }
  
  /**
   * Generate human-readable summary of optimization result
   */
  private generateResultSummary(result: OptimisationResult, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _parameters: RunOptimizationParams): string {
    const isValid = result.calculated.all_checks_pass ?? false
    const weight = result.calculated.optimal_design_weight
    const centres = result.genetic.bracket_centres
    const angleThickness = result.genetic.angle_thickness
    const bracketThickness = result.genetic.bracket_thickness
    
    if (isValid) {
      return `✅ Valid design found: ${weight?.toFixed(2)} kg/m total weight with ${centres}mm bracket centres, ${angleThickness}mm angle thickness, and ${bracketThickness}mm bracket thickness.`
    } else {
      return `❌ No valid design found. All parameter combinations failed verification checks. Consider adjusting structural requirements or constraints.`
    }
  }
  
  /**
   * Get context storage statistics (for debugging/monitoring)
   */
  getStorageStats(): { totalSessions: number, withResults: number, expired: number } {
    const now = new Date()
    let withResults = 0
    let expired = 0
    
    for (const context of this.contexts.values()) {
      if (context.currentResult) {
        withResults++
      }
      if (context.contextExpiresAt && context.contextExpiresAt < now) {
        expired++
      }
    }
    
    return {
      totalSessions: this.contexts.size,
      withResults,
      expired
    }
  }
}

// Singleton instance for the application
export const resultContextManager = new InMemoryResultContextManager()

/**
 * Utility functions for context management
 */

/**
 * Generate a session ID from request headers or create a new one
 */
export function generateSessionId(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _request?: Request): string {
  // In a real implementation, you might extract from cookies, headers, etc.
  // For now, generate a random session ID
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
}

/**
 * Extract session ID from chat messages or headers
 */
export function extractSessionId(headers?: Headers, fallback?: string): string {
  // Check for existing session ID in headers
  const sessionId = headers?.get('x-session-id') || fallback
  
  if (sessionId) {
    return sessionId
  }
  
  // Generate new session ID
  return generateSessionId()
}

/**
 * Middleware to cleanup expired contexts periodically
 */
export function setupContextCleanup(intervalMs: number = 60 * 60 * 1000): void {
  setInterval(async () => {
    await resultContextManager.cleanupExpiredContexts()
  }, intervalMs)
  
  console.log(`🧹 Context cleanup scheduled every ${intervalMs / 1000 / 60} minutes`)
}

// Force file to be treated as a module
export {}