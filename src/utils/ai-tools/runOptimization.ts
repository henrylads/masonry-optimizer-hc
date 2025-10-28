import { runBruteForce } from '@/calculations/bruteForceAlgorithm'
import type { 
  RunOptimizationParams, 
  RunOptimizationResult,
  ProgressUpdate 
} from '@/types/ai-tools'
import { RunOptimizationParamsSchema } from '@/types/ai-tools'
import { 
  convertChatParamsToBruteForceConfig,
  validateParametersForConversion 
} from '@/utils/parameter-conversion'

/**
 * Configuration for algorithm execution timeouts
 */
const EXECUTION_CONFIG = {
  DEFAULT_TIMEOUT_MS: 300000, // 5 minutes default timeout
  PROGRESS_REPORT_INTERVAL_MS: 500, // Report progress every 500ms
  MAX_COMBINATIONS_BEFORE_WARNING: 50000, // Warn if too many combinations
}

/**
 * Tool 1: Direct Algorithm Execution with Enhanced Progress Tracking
 * Converts extracted chat parameters to BruteForceConfig and executes optimization
 * with real-time progress updates and streaming support
 */
export async function runOptimization(
  params: RunOptimizationParams,
  onProgress?: (update: ProgressUpdate) => void,
  timeoutMs: number = EXECUTION_CONFIG.DEFAULT_TIMEOUT_MS
): Promise<RunOptimizationResult> {
  const startTime = Date.now()
  const progressTracker = new ProgressTracker(startTime, onProgress)
  
  try {
    // Stage 1: Parameter validation with detailed progress
    progressTracker.updateStage('validation', 5, 'Starting parameter validation...')
    
    const validatedParams = RunOptimizationParamsSchema.parse(params)
    progressTracker.updateStage('validation', 15, 'Parameters validated successfully')
    
    // Stage 2: Parameter conversion with progress tracking
    progressTracker.updateStage('conversion', 20, 'Converting parameters to algorithm format...')
    
    const bruteForceConfig = convertChatParamsToBruteForceConfig(validatedParams, (update) => {
      // Forward conversion progress updates
      progressTracker.updateStage('conversion', 20 + (update.progress * 0.1), update.message)
    })
    
    progressTracker.updateStage('conversion', 30, 'Parameter conversion completed')
    
    // Stage 3: Algorithm preparation with combination count estimation
    progressTracker.updateStage('preparation', 35, 'Preparing optimization algorithm...')
    
    // Estimate the number of combinations for progress tracking
    const estimatedCombinations = estimateCombinationCount(bruteForceConfig)
    
    if (estimatedCombinations > EXECUTION_CONFIG.MAX_COMBINATIONS_BEFORE_WARNING) {
      progressTracker.updateStage('preparation', 38, 
        `Large parameter space detected (${estimatedCombinations.toLocaleString()} combinations). This may take several minutes...`)
    }
    
    progressTracker.updateStage('preparation', 40, 
      `Ready to evaluate ${estimatedCombinations.toLocaleString()} combinations`)
    
    // Stage 4: Algorithm execution with streaming progress
    progressTracker.updateStage('execution', 40, 'Starting optimization algorithm...')
    
    // Set up algorithm progress tracking
    let lastProgressUpdate = Date.now()
    let bestWeightFound: number | undefined
    
    const algorithmConfig = {
      ...bruteForceConfig,
      onProgress: (generation: number, maxGenerations: number, bestFitness: number) => {
        const now = Date.now()
        
        // Throttle progress updates to avoid overwhelming the UI
        if (now - lastProgressUpdate >= EXECUTION_CONFIG.PROGRESS_REPORT_INTERVAL_MS) {
          const algorithmProgress = (generation / maxGenerations) * 100
          const overallProgress = 40 + (algorithmProgress * 0.5) // Algorithm takes 50% of total progress
          
          bestWeightFound = bestFitness > -Infinity ? -bestFitness : undefined
          
          const estimatedTimeRemaining = progressTracker.estimateTimeRemaining(overallProgress)
          
          progressTracker.updateStage('execution', overallProgress, 
            `Evaluating combinations... (${generation.toLocaleString()}/${maxGenerations.toLocaleString()})`, {
              combinationsChecked: generation,
              totalCombinations: maxGenerations,
              currentBestWeight: bestWeightFound,
              estimatedTimeRemaining
            })
          
          lastProgressUpdate = now
        }
      }
    }
    
    // Execute with timeout protection
    const algorithmResult = await executeWithTimeout(
      runBruteForce(algorithmConfig),
      timeoutMs,
      'Algorithm execution timed out. Try reducing the parameter ranges or constraints.'
    )
    
    progressTracker.updateStage('completion', 95, 'Optimization completed, preparing results...')
    
    const executionTime = Date.now() - startTime
    
    progressTracker.updateStage('completion', 100, 'Results ready!', {
      currentBestWeight: bestWeightFound
    })
    
    return {
      success: true,
      result: algorithmResult.result,
      executionTimeMs: executionTime,
      parametersUsed: bruteForceConfig.designInputs
    }
    
  } catch (error) {
    const executionTime = Date.now() - startTime
    const errorMessage = formatAlgorithmError(error)
    
    console.error('runOptimization error:', error)
    
    // Report error through progress system
    if (onProgress) {
      progressTracker.updateStage('completion', 0, `Error: ${errorMessage}`)
    }
    
    return {
      success: false,
      error: errorMessage,
      executionTimeMs: executionTime,
      parametersUsed: undefined
    }
  }
}

/**
 * Progress tracking utility class for managing complex progress updates
 */
class ProgressTracker {
  private startTime: number
  private onProgress?: (update: ProgressUpdate) => void
  
  constructor(startTime: number, onProgress?: (update: ProgressUpdate) => void) {
    this.startTime = startTime
    this.onProgress = onProgress
  }
  
  updateStage(
    stage: ProgressUpdate['stage'], 
    progress: number, 
    message: string, 
    additional?: Partial<ProgressUpdate>
  ) {
    if (this.onProgress) {
      this.onProgress({
        stage,
        progress: Math.min(100, Math.max(0, progress)),
        message,
        ...additional
      })
    }
  }
  
  estimateTimeRemaining(currentProgress: number): number | undefined {
    if (currentProgress <= 0 || currentProgress >= 100) return undefined
    
    const elapsedTime = Date.now() - this.startTime
    const estimatedTotalTime = elapsedTime / (currentProgress / 100)
    const remainingTime = estimatedTotalTime - elapsedTime
    
    return Math.max(0, remainingTime)
  }
}

/**
 * Estimate the number of combinations the brute force algorithm will evaluate
 * This helps provide better progress tracking and user expectations
 */
function estimateCombinationCount(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  _config: any): number {
  // This is a simplified estimation - in practice, the actual count comes from generateAllCombinations
  // But we can provide a rough estimate for progress tracking purposes
  const bracketCentresOptions = 9 // 200-600 in 50mm steps
  const bracketThicknessOptions = 2 // 3mm, 4mm
  const angleThicknessOptions = 5 // 3, 4, 5, 6, 8mm
  const verticalLegOptions = 15 // Typical range 50-200mm in various steps
  const boltDiameterOptions = 2 // 10mm, 12mm
  const bracketTypeOptions = 2 // Standard, Inverted
  const angleOrientationOptions = 2 // Standard, Inverted
  
  return bracketCentresOptions * bracketThicknessOptions * angleThicknessOptions * 
         verticalLegOptions * boltDiameterOptions * bracketTypeOptions * angleOrientationOptions
}

/**
 * Execute a promise with timeout protection
 */
async function executeWithTimeout<T>(
  promise: Promise<T>, 
  timeoutMs: number, 
  timeoutMessage: string
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
  })
  
  return Promise.race([promise, timeoutPromise])
}

/**
 * Format algorithm errors into user-friendly messages
 */
function formatAlgorithmError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes('timeout')) {
      return 'The optimization is taking longer than expected. Try reducing the parameter ranges or using more specific constraints.'
    }
    
    if (error.message.includes('No valid design found')) {
      return 'No valid design was found with the given parameters. Try relaxing some constraints or adjusting the input values.'
    }
    
    if (error.message.includes('validation')) {
      return `Parameter validation failed: ${error.message}`
    }
    
    return error.message
  }
  
  return 'An unexpected error occurred during optimization'
}

/**
 * Validate that required parameters are present for optimization
 * Wrapper around the utility function for backwards compatibility
 */
export function validateOptimizationReadiness(params: Partial<RunOptimizationParams>): {
  isReady: boolean
  missingParams: string[]
  errors: string[]
} {
  const result = validateParametersForConversion(params)
  return {
    isReady: result.isValid,
    missingParams: result.missingParams,
    errors: result.validationErrors
  }
} 