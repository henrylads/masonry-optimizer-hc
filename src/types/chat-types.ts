import { Message } from 'ai';
import { z } from 'zod';

// Re-export the form schema type for consistency
import type { FormDataType as FormData } from '@/types/form-schema';
export type FormDataType = FormData;

// Chat message types extending the AI SDK Message type
export interface ChatMessage extends Message {
  timestamp?: Date;
}

// Parameter extraction result from AI
export interface ExtractedParameter {
  field: keyof FormDataType;
  value: string | number | boolean;
  confidence: 'high' | 'medium' | 'low';
  source: string; // The part of the message that led to this extraction
}

export interface ParameterExtractionResult {
  parameters: ExtractedParameter[];
  missingRequired: (keyof FormDataType)[];
  missingConditional: (keyof FormDataType)[];
  validationErrors: ValidationError[];
  nextQuestions: string[];
  isComplete: boolean;
}

// Validation error type
export interface ValidationError {
  field: keyof FormDataType;
  message: string;
  currentValue?: string | number | boolean;
}

// Chat state management
export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  extractedParameters: ExtractedParameter[];
  isComplete: boolean;
  requiresConfirmation: boolean;
  conversationPhase: ConversationPhase;
}

export type ConversationPhase = 
  | 'initial'          // Starting conversation
  | 'gathering'        // Collecting parameters
  | 'clarifying'       // Asking follow-up questions
  | 'validating'       // Checking parameter validity
  | 'confirming'       // Showing summary for confirmation
  | 'complete';        // Ready for optimization

// Form synchronization types
export interface FormSyncUpdate {
  field: keyof FormDataType;
  value: string | number | boolean;
  source: 'chat' | 'manual';
  timestamp: Date;
}

export interface FormSyncState {
  syncedFields: Set<keyof FormDataType>;
  lastUpdate: Map<keyof FormDataType, FormSyncUpdate>;
  conflicts: FormConflict[];
}

export interface FormConflict {
  field: keyof FormDataType;
  chatValue: string | number | boolean;
  manualValue: string | number | boolean;
  resolved: boolean;
}

// Parameter summary for confirmation
export interface ParameterSummary {
  required: {
    slab_thickness?: number;
    cavity?: number;
    support_level?: number;
    characteristic_load?: string | number;
  };
  masonry?: {
    density?: number;
    thickness?: number;
    height?: number;
  };
  optional: {
    has_notch?: boolean;
    notch_height?: number;
    notch_depth?: number;
    is_angle_length_limited?: boolean;
    fixed_angle_length?: number;
  };
  calculatedValues?: {
    calculated_characteristic_load?: number;
  };
}

// Chat component props
export interface ChatInterfaceProps {
  onParametersExtracted?: (parameters: ExtractedParameter[]) => void;
  onParametersConfirmed?: (summary: ParameterSummary) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
  sessionId?: string;
}

// Hook return types
export interface UseChatFormSyncReturn {
  syncedData: Partial<FormDataType>;
  updateFromChat: (parameters: ExtractedParameter[]) => void;
  updateFromForm: (field: keyof FormDataType, value: string | number | boolean) => void;
  clearSync: () => void;
  conflicts: FormConflict[];
  resolveConflict: (field: keyof FormDataType, useValue: 'chat' | 'manual') => void;
  syncState: FormSyncState;
}

// API response types
export interface ChatApiResponse {
  success: boolean;
  message?: string;
  extractedParameters?: ExtractedParameter[];
  nextQuestions?: string[];
  error?: string;
}

// Parameter validation schema for runtime checking
export const ExtractedParameterSchema = z.object({
  field: z.string(),
  value: z.union([z.string(), z.number(), z.boolean()]),
  confidence: z.enum(['high', 'medium', 'low']),
  source: z.string(),
});

export const ParameterExtractionResultSchema = z.object({
  parameters: z.array(ExtractedParameterSchema),
  missingRequired: z.array(z.string()),
  missingConditional: z.array(z.string()),
  validationErrors: z.array(z.object({
    field: z.string(),
    message: z.string(),
    currentValue: z.union([z.string(), z.number(), z.boolean()]).optional(),
  })),
  nextQuestions: z.array(z.string()),
  isComplete: z.boolean(),
});

// Event types for chat interactions
export type ChatEvent = 
  | { type: 'message_sent'; message: string }
  | { type: 'parameters_extracted'; parameters: ExtractedParameter[] }
  | { type: 'validation_error'; errors: ValidationError[] }
  | { type: 'confirmation_requested'; summary: ParameterSummary }
  | { type: 'conversation_reset' }
  | { type: 'error'; error: string };

// Workflow mode types
export type WorkflowMode = 'manual' | 'ai-assisted' | 'fully-automated';

// Legacy support - keeping InputMode for backward compatibility
export type InputMode = 'chat' | 'manual';

export interface ModeToggleProps {
  currentMode: InputMode;
  onModeChange: (mode: InputMode) => void;
  disabled?: boolean;
  chatProgress?: number; // 0-100 for parameters collected
}

// Workflow management types
export interface WorkflowConfig {
  mode: WorkflowMode;
  autoTriggerOptimization: boolean;
  requiresConfirmation: boolean;
  showManualControls: boolean;
}

export interface WorkflowToggleProps {
  currentMode: WorkflowMode;
  onModeChange: (mode: WorkflowMode) => void;
  disabled?: boolean;
  className?: string;
}

// Workflow descriptions for user guidance
export const WORKFLOW_DESCRIPTIONS: Record<WorkflowMode, {
  title: string;
  description: string;
  benefits: string[];
  bestFor: string;
}> = {
  'manual': {
    title: 'Manual Entry',
    description: 'Traditional form-based input with full manual control',
    benefits: ['Complete control over all parameters', 'No AI dependencies', 'Familiar interface'],
    bestFor: 'Experienced users who prefer traditional workflows'
  },
  'ai-assisted': {
    title: 'AI-Assisted',
    description: 'Chat with AI to populate form fields, then manually trigger optimization',
    benefits: ['Natural language input', 'Guided parameter collection', 'Manual optimization control'],
    bestFor: 'Users who want AI help with inputs but prefer manual optimization'
  },
  'fully-automated': {
    title: 'Fully Automated',
    description: 'AI handles parameter extraction and automatically triggers optimization',
    benefits: ['Fastest workflow', 'Complete automation', 'Instant results'],
    bestFor: 'Quick assessments and rapid design iterations'
  }
}; 