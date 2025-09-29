// AI Tools utilities barrel export

// Tool implementations
export { runOptimization, validateOptimizationReadiness } from './runOptimization'
export { analyzeDesign } from './analyzeDesign'

// Parameter conversion utilities  
export { 
  convertChatParamsToBruteForceConfig,
  validateParametersForConversion 
} from '../parameter-conversion'

// Context management for Tool 2 support
export { 
  resultContextManager,
  generateSessionId,
  extractSessionId,
  setupContextCleanup
} from './result-context-manager'

// Type exports
export type {
  RunOptimizationParams,
  RunOptimizationResult,
  AnalyzeDesignParams,
  AnalyzeDesignResult,
  ProgressUpdate,
  AIToolsContext,
  ResultContextManager,
  AnalysisContext,
  AnalyzeDesignParamsWithContext,
  ToolResponse
} from '@/types/ai-tools' 