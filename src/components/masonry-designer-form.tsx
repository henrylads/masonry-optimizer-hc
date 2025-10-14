"use client"

import { useState, useMemo } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2, Zap, CheckCircle, MessageSquare, Bot } from "lucide-react"
import * as React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { ClaritiLogo } from "@/components/clariti-logo"
import { ResultsDisplay } from "@/components/results-display"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"

// Import types and functions
import type { OptimisationResult, GenerationSummary } from '@/types/optimization-types'
import type { ChannelType } from '@/types/channelSpecs'
import { getChannelSpec } from '@/data/channelSpecs'
import { runBruteForce } from '@/calculations/bruteForceAlgorithm'
import { formSchema } from '@/types/form-schema'
import { getSectionSizes } from '@/data/steelSections'
import type { SteelSectionType } from '@/types/steelFixingTypes'

// Import chat interface components
import { ChatInterface } from '@/components/chat-interface'
import type { ExtractedParameter, InputMode, WorkflowMode, WorkflowConfig } from '@/types/chat-types'

// Import AI tools hook
import { useAITools } from '@/hooks/use-ai-tools'

// Import workflow toggle
import { WorkflowToggle } from '@/components/workflow-toggle'


interface MasonryDesignerFormProps {
  onTestSubmit?: (values: z.infer<typeof formSchema>) => void;
}

export default function MasonryDesignerForm({
  onTestSubmit
}: MasonryDesignerFormProps) {
  // AI Tools hook for handling AI-generated optimization results
  const {
    isOptimizing: aiIsOptimizing,
    optimizationResult: aiOptimizationResult,
    optimizationError: aiOptimizationError,
    optimizationProgress: aiOptimizationProgress,
    clearOptimizationResult: clearAIOptimizationResult,
    setSessionId,
    sessionId
  } = useAITools()

  // Debug when AI optimization result changes
  React.useEffect(() => {
    console.log("🤖 AI Tools state changed:", {
      isOptimizing: aiIsOptimizing,
      hasResult: !!aiOptimizationResult,
      hasError: !!aiOptimizationError,
      progressStage: aiOptimizationProgress?.stage,
      progressPercent: aiOptimizationProgress?.progress
    });
  }, [aiIsOptimizing, aiOptimizationResult, aiOptimizationError, aiOptimizationProgress])

  // Local state for manual optimization
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<OptimisationResult | null>(null)
  const [generationHistory, setGenerationHistory] = useState<GenerationSummary[]>([])
  const [activeTab, setActiveTab] = useState("input")

  // Chat-specific state
  const [inputMode, setInputMode] = useState<InputMode>('manual')
  const [extractedParameters, setExtractedParameters] = useState<ExtractedParameter[]>([])

  // Workflow state
  const [workflowMode, setWorkflowMode] = useState<WorkflowMode>('manual')
  const [workflowConfig, setWorkflowConfig] = useState<WorkflowConfig>({
    mode: 'manual',
    autoTriggerOptimization: false,
    requiresConfirmation: true,
    showManualControls: true
  })

  // Progress state
  const [progress, setProgress] = useState(0);
  const [currentGeneration, setCurrentGeneration] = useState(0);
  const [totalGenerations, setTotalGenerations] = useState(100);
  const [showProgress, setShowProgress] = useState(false);

  // Create stable IDs for results to prevent unnecessary re-renders when object reference changes but content is same
  const aiResultId = aiOptimizationResult ? JSON.stringify(aiOptimizationResult.genetic) : null;
  const manualResultId = result ? JSON.stringify(result.genetic) : null;
  
  // Derived state - combine manual and AI results (memoized to prevent frequent ShapeDriver re-renders)
  const combinedResult = useMemo(() => {
    console.log("🔄 MasonryForm: combinedResult recalculating", {
      aiOptimizationResult: !!aiOptimizationResult,
      result: !!result,
      aiResultId,
      manualResultId
    });
    return aiOptimizationResult || result;
  }, [aiResultId, manualResultId])
  const combinedError = aiOptimizationError || error
  const combinedIsLoading = isLoading || aiIsOptimizing
  const resultSource = aiOptimizationResult ? 'ai' : result ? 'manual' : null

  // Client-side debug logging (no hydration issues)
  React.useEffect(() => {
    console.log('🚨 COMPONENT MOUNTED - TIMESTAMP:', new Date().toISOString());
  }, []);

  // Debug loading states
  React.useEffect(() => {
    console.log('🔵 LOADING STATES DEBUG:', {
      isLoading,
      aiIsOptimizing,
      combinedIsLoading,
      result: !!result,
      aiOptimizationResult: !!aiOptimizationResult,
      combinedResult: !!combinedResult,
      buttonDisabled: combinedIsLoading
    });
  }, [isLoading, aiIsOptimizing, combinedIsLoading, result, aiOptimizationResult, combinedResult]);


  // Initialize the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      frame_fixing_type: 'concrete-all',
      slab_thickness: 225,
      cavity: 100,
      support_level: -200,
      characteristic_load: 6,
      has_notch: false,
      notch_height: 0,
      notch_depth: 0,
      is_angle_length_limited: false,
      fixed_angle_length: 750,
      fixing_type: 'all',
      channel_product: 'all',
      postfix_product: 'all',
      use_custom_fixing_position: false,
      fixing_position: 75,
      use_custom_dim_d: false,
      dim_d: 130,
      facade_thickness: 102.5,
      load_position: 1/3,
      front_offset: 12,
      isolation_shim_thickness: 3,
      material_type: 'brick',
      use_custom_load_position: false,
      use_custom_facade_offsets: false,
      enable_angle_extension: false,
      max_allowable_bracket_extension: -200,
      // Steel fixing defaults
      steel_section_type: 'I-BEAM',
      use_custom_steel_section: false,
      steel_section_size: '127x76',
      custom_steel_height: 127,
      steel_bolt_size: 'all',
    },
  })

  // Calculate dynamic fixing position constraints based on frame type
  const fixingPositionConstraints = useMemo(() => {
    const frameType = form.watch('frame_fixing_type');
    const slabThickness = form.watch('slab_thickness');
    const steelSectionSize = form.watch('steel_section_size');
    const useCustomSteel = form.watch('use_custom_steel_section');
    const customSteelHeight = form.watch('custom_steel_height');

    // Steel fixing constraints (based on M16 bolt edge distance)
    if (frameType?.startsWith('steel')) {
      const M16_EDGE_DISTANCE_PER_SIDE = 21.6 / 2; // 10.8mm per side

      // Get effective steel section height
      let steelHeight = 127; // default
      if (useCustomSteel && customSteelHeight) {
        steelHeight = customSteelHeight;
      } else if (steelSectionSize) {
        steelHeight = parseInt(steelSectionSize.split('x')[0]) || 127;
      }

      const min = Math.ceil(M16_EDGE_DISTANCE_PER_SIDE / 5) * 5; // Round up to nearest 5mm (15mm)
      const max = Math.floor((steelHeight - M16_EDGE_DISTANCE_PER_SIDE) / 5) * 5; // Round down to nearest 5mm

      return {
        min,
        max,
        default: Math.min(75, max), // Use 75 or max, whichever is smaller
        description: `Based on M16 bolt edge distance and ${steelHeight}mm section height`,
        unit: 'mm from top of steel section'
      };
    }

    // Concrete fixing constraints (based on slab thickness and edge distances)
    if (frameType?.startsWith('concrete')) {
      const TOP_CRITICAL_EDGE = 75; // Typical minimum for concrete
      const BOTTOM_BUFFER = 50; // Buffer from bottom of slab

      const min = TOP_CRITICAL_EDGE;
      const max = Math.max(slabThickness - BOTTOM_BUFFER, min + 5);

      return {
        min,
        max,
        default: TOP_CRITICAL_EDGE,
        description: `Based on ${slabThickness}mm slab thickness and edge distances`,
        unit: 'mm from top of slab'
      };
    }

    // Fallback
    return {
      min: 15,
      max: 400,
      default: 75,
      description: 'Default range',
      unit: 'mm'
    };
  }, [
    form.watch('frame_fixing_type'),
    form.watch('slab_thickness'),
    form.watch('steel_section_size'),
    form.watch('use_custom_steel_section'),
    form.watch('custom_steel_height')
  ]);

  // Check for characteristic_load from density calculator on mount
  React.useEffect(() => {
    const storedLoad = localStorage.getItem('characteristic_load');
    if (storedLoad) {
      const loadValue = parseFloat(storedLoad);
      if (!isNaN(loadValue)) {
        form.setValue('characteristic_load', loadValue);
        // Clear the value from localStorage after using it
        localStorage.removeItem('characteristic_load');
      }
    }
  }, [form]);

  // Watch form values and clear results when they change
  React.useEffect(() => {
    const subscription = form.watch(() => {
      if (result) {
        setResult(null);
        setGenerationHistory([]);
      }
      if (aiOptimizationResult) {
        clearAIOptimizationResult();
      }
      if (activeTab === "results") {
        setActiveTab("input");
      }
    });
    return () => subscription.unsubscribe();
  }, [form, result, aiOptimizationResult, activeTab, clearAIOptimizationResult]);

  // Watch angle extension fields specifically for debugging
  React.useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (name === 'enable_angle_extension' || name === 'max_allowable_bracket_extension') {
        console.log('🟡 ANGLE EXTENSION FIELD CHANGED:', {
          fieldName: name,
          changeType: type,
          newValue: value[name],
          enable_angle_extension: value.enable_angle_extension,
          max_allowable_bracket_extension: value.max_allowable_bracket_extension,
          formErrors: form.formState.errors,
          isValid: form.formState.isValid
        });
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Validate and adjust fixing_position when constraints change
  React.useEffect(() => {
    const currentFixingPosition = form.getValues('fixing_position');
    const useCustom = form.getValues('use_custom_fixing_position');

    // Only adjust if using custom position
    if (useCustom && currentFixingPosition) {
      if (currentFixingPosition < fixingPositionConstraints.min) {
        form.setValue('fixing_position', fixingPositionConstraints.min);
      } else if (currentFixingPosition > fixingPositionConstraints.max) {
        form.setValue('fixing_position', fixingPositionConstraints.max);
      }
    } else if (!useCustom) {
      // Reset to default when not using custom
      form.setValue('fixing_position', fixingPositionConstraints.default);
    }
  }, [fixingPositionConstraints, form]);

  // Sync frame_fixing_type with fixing_type and steel_section_type fields
  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'frame_fixing_type') {
        const frameType = value.frame_fixing_type;

        // Map frame_fixing_type to fixing_type for backend (concrete types)
        if (frameType === 'concrete-cast-in') {
          form.setValue('fixing_type', 'channel-fix');
        } else if (frameType === 'concrete-post-fix') {
          form.setValue('fixing_type', 'post-fix');
        } else if (frameType === 'concrete-all') {
          form.setValue('fixing_type', 'all');
        }

        // Map frame_fixing_type to steel_section_type (steel types)
        if (frameType === 'steel-ibeam') {
          form.setValue('steel_section_type', 'I-BEAM');
        } else if (frameType === 'steel-rhs') {
          form.setValue('steel_section_type', 'RHS');
        } else if (frameType === 'steel-shs') {
          form.setValue('steel_section_type', 'SHS');
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Switch to results tab when AI optimization completes successfully
  React.useEffect(() => {
    if (aiOptimizationResult && !aiIsOptimizing) {
      setActiveTab("results");
    }
  }, [aiOptimizationResult, aiIsOptimizing]);

  // Generate session ID for AI tools (can be based on form data hash or timestamp)
  React.useEffect(() => {
    // Only generate a new session ID if we don't have one
    if (!sessionId) {
      const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      setSessionId(newSessionId);
      console.log(`🆔 Generated new session ID: ${newSessionId}`);
    } else {
      console.log(`🆔 Using existing session ID: ${sessionId}`);
    }
  }, [sessionId, setSessionId]);

  // Handle workflow mode changes
  const handleWorkflowModeChange = (mode: WorkflowMode) => {
    setWorkflowMode(mode);
    
    // Update workflow configuration based on mode
    const newConfig: WorkflowConfig = {
      mode,
      autoTriggerOptimization: mode === 'fully-automated',
      requiresConfirmation: mode !== 'fully-automated',
      showManualControls: mode === 'manual' || mode === 'ai-assisted'
    };
    setWorkflowConfig(newConfig);
    
    // Update input mode for backward compatibility
    if (mode === 'manual') {
      setInputMode('manual');
    } else {
      setInputMode('chat');
    }
  };

  // Handle form submission
  const onSubmit = React.useCallback(async (values: z.infer<typeof formSchema>) => {
    console.log('🚀 FORM SUBMIT STARTED - onSubmit function called');
    console.log('🚀 Submitted values:', values);

    if (onTestSubmit) {
      console.log('🚀 Using test submit function');
      onTestSubmit(values);
      return;
    }

    console.log('🚀 Starting real optimization process');
    setIsLoading(true);
    setError(null);
    setProgress(0);
    setCurrentGeneration(0);
    setGenerationHistory([]);
    setShowProgress(true);
    
    // Clear AI results when starting manual optimization
    if (aiOptimizationResult) {
      clearAIOptimizationResult();
    }

    try {
      // Use characteristic load directly from form
      const characteristicLoad = values.characteristic_load;

      // Get channel specifications based on selected fixing type and products
      const fixingType = values.fixing_type;
      const channelProduct = values.channel_product;
      const postfixProduct = values.postfix_product;

      // Determine channel type for edge distance lookup (use first available)
      let channelType: string;
      if (fixingType === 'all') {
        channelType = 'CPRO38'; // Default to CPRO38 for edge distance lookup
      } else if (fixingType === 'post-fix') {
        channelType = postfixProduct && postfixProduct !== 'all' ? postfixProduct : 'R-HPTIII-70';
      } else if (fixingType === 'channel-fix') {
        channelType = channelProduct && channelProduct !== 'all' ? channelProduct : 'CPRO38';
      } else {
        channelType = 'CPRO38';
      }
      const bracketCentres = 500;

      // For steel frames, use effective height; for concrete, use slab thickness
      const effectiveThicknessForLookup = values.frame_fixing_type?.startsWith('steel')
        ? (values.use_custom_steel_section && values.custom_steel_height
            ? values.custom_steel_height
            : parseInt(values.steel_section_size?.split('x')[0] || '0'))
        : values.slab_thickness;

      const channelSpec = getChannelSpec(channelType, effectiveThicknessForLookup, bracketCentres);
      const criticalEdges = channelSpec ? 
        { top: channelSpec.edgeDistances.top, bottom: channelSpec.edgeDistances.bottom } : 
        { top: 75, bottom: 150 };

      // Determine the actual fixing position to use
      const actualFixingPosition = values.use_custom_fixing_position ? values.fixing_position : 75;

      // Determine the actual Dim D to use
      const actualDimD = values.use_custom_dim_d ? values.dim_d : 130;

      // Debug logging for fixing position values
      console.log('🔧 Fixing Position Debug:', {
        use_custom_fixing_position: values.use_custom_fixing_position,
        form_fixing_position: values.fixing_position,
        actual_fixing_position: actualFixingPosition,
      });

      // Debug logging for Dim D values
      console.log('🔧 Dim D Debug:', {
        use_custom_dim_d: values.use_custom_dim_d,
        form_dim_d: values.dim_d,
        actual_dim_d: actualDimD,
      });

      console.log('🔍 FORM SUBMIT DEBUG: Form values:', {
        facade_thickness: values.facade_thickness,
        material_type: values.material_type,
        load_position: values.load_position,
        front_offset: values.front_offset,
        isolation_shim_thickness: values.isolation_shim_thickness
      });

      // Calculate effective height for steel fixings and build steel_section object
      const isSteelFrame = values.frame_fixing_type?.startsWith('steel');
      let effectiveSlabThickness = values.slab_thickness;
      let steelSection = null;

      if (isSteelFrame) {
        if (values.use_custom_steel_section && values.custom_steel_height) {
          effectiveSlabThickness = values.custom_steel_height;
        } else if (values.steel_section_size) {
          // Extract height from steel section size (e.g., "203x133" -> 203)
          const height = parseInt(values.steel_section_size.split('x')[0]);
          effectiveSlabThickness = height || values.slab_thickness;
        }
        console.log('🔩 STEEL FRAME: Using effective height:', effectiveSlabThickness, 'mm');

        // Build steel_section object for the algorithm
        steelSection = {
          sectionType: values.steel_section_type,
          size: values.use_custom_steel_section ? null : values.steel_section_size,
          customHeight: values.use_custom_steel_section ? values.custom_steel_height : undefined,
          effectiveHeight: effectiveSlabThickness
        };
        console.log('🔩 STEEL SECTION OBJECT:', steelSection);
      }

      // Prepare configuration
      const optimizationConfig = {
        maxGenerations: 100,
        designInputs: {
          support_level: values.support_level,
          cavity_width: values.cavity,
          slab_thickness: effectiveSlabThickness,
          characteristic_load: characteristicLoad,
          top_critical_edge: criticalEdges.top,
          bottom_critical_edge: criticalEdges.bottom,
          notch_height: values.has_notch ? values.notch_height : 0,
          notch_depth: values.has_notch ? values.notch_depth : 0,
          fixing_position: actualFixingPosition,
          use_custom_fixing_position: values.use_custom_fixing_position,
          dim_d: actualDimD,
          use_custom_dim_d: values.use_custom_dim_d,
          showDetailedVerifications: true,
          // Add facade parameters for dynamic horizontal leg calculation
          facade_thickness: values.facade_thickness,
          load_position: values.load_position,
          front_offset: values.front_offset,
          isolation_shim_thickness: values.isolation_shim_thickness,
          material_type: values.material_type,
          // Add angle extension parameters for exclusion zones
          enable_angle_extension: values.enable_angle_extension,
          max_allowable_bracket_extension: values.enable_angle_extension ? values.max_allowable_bracket_extension : null,
          // Add steel fixing parameters
          frame_fixing_type: values.frame_fixing_type,
          steel_section: steelSection, // Pass the constructed steel_section object
          steel_bolt_size: values.steel_bolt_size,
          allowed_channel_types: (() => {
            const channelTypes: ChannelType[] = [];

            if (fixingType === 'all') {
              // Include channels based on both dropdown selections
              if (channelProduct !== 'all') {
                channelTypes.push(channelProduct as ChannelType);
              } else {
                channelTypes.push('CPRO38', 'CPRO50', 'CPRO52');
              }

              if (postfixProduct !== 'all') {
                channelTypes.push(postfixProduct as ChannelType);
              } else {
                channelTypes.push('R-HPTIII-70', 'R-HPTIII-90');
              }
            } else if (fixingType === 'post-fix') {
              if (postfixProduct && postfixProduct !== 'all') {
                channelTypes.push(postfixProduct as ChannelType);
              } else {
                channelTypes.push('R-HPTIII-70', 'R-HPTIII-90');
              }
            } else if (fixingType === 'channel-fix') {
              if (channelProduct && channelProduct !== 'all') {
                channelTypes.push(channelProduct as ChannelType);
              } else {
                channelTypes.push('CPRO38', 'CPRO50', 'CPRO52');
              }
            }

            return channelTypes.length > 0 ? channelTypes : ['CPRO38','CPRO50','CPRO52','R-HPTIII-70','R-HPTIII-90'] as ChannelType[];
          })()
        },
        isAngleLengthLimited: values.is_angle_length_limited,
        fixedAngleLength: values.is_angle_length_limited ? values.fixed_angle_length : undefined,
        onProgress: (step: number, maxSteps: number) => {
          const progressPercentage = Math.round((step / maxSteps) * 100);
          setProgress(progressPercentage);
          setCurrentGeneration(step);
          setTotalGenerations(maxSteps);
        },
        onGenerationComplete: (genSummary: GenerationSummary) => {
          setGenerationHistory(prev => [...prev, genSummary]);
        }
      };

      // Debug logging for optimization configuration
      console.log('🚀 OPTIMIZATION TRIGGER: About to run brute force with config:', {
        facade_thickness: optimizationConfig.designInputs.facade_thickness,
        load_position: optimizationConfig.designInputs.load_position,
        front_offset: optimizationConfig.designInputs.front_offset,
        isolation_shim_thickness: optimizationConfig.designInputs.isolation_shim_thickness,
        material_type: optimizationConfig.designInputs.material_type,
        support_level: optimizationConfig.designInputs.support_level,
        cavity_width: optimizationConfig.designInputs.cavity_width,
        slab_thickness: optimizationConfig.designInputs.slab_thickness,
        characteristic_load: optimizationConfig.designInputs.characteristic_load,
        enable_angle_extension: optimizationConfig.designInputs.enable_angle_extension,
        max_allowable_bracket_extension: optimizationConfig.designInputs.max_allowable_bracket_extension,
        frame_fixing_type: optimizationConfig.designInputs.frame_fixing_type,
        steel_section: optimizationConfig.designInputs.steel_section,
        steel_bolt_size: optimizationConfig.designInputs.steel_bolt_size
      });

      // Run optimization
      const optimizationOutput: { result: OptimisationResult; history: GenerationSummary[] } = await runBruteForce(optimizationConfig);
      const optimizationResult = optimizationOutput.result;
      
      setResult(optimizationResult);
      setActiveTab("results");
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred during optimization';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setShowProgress(false);
    }
  }, [onTestSubmit, clearAIOptimizationResult, aiOptimizationResult])

  // Auto-trigger optimization for fully automated mode
  React.useEffect(() => {
    if (workflowConfig.autoTriggerOptimization && 
        extractedParameters.length > 0 && 
        !combinedIsLoading &&
        workflowMode === 'fully-automated') {
      
      // Check if we have the minimum required parameters
      const hasRequiredParams = extractedParameters.some(p => 
        ['slab_thickness', 'cavity', 'support_level'].includes(p.field)
      );
      
      if (hasRequiredParams) {
        // Small delay to ensure UI updates
        setTimeout(() => {
          form.handleSubmit(onSubmit)();
        }, 500);
      }
    }
  }, [extractedParameters, workflowConfig.autoTriggerOptimization, combinedIsLoading, workflowMode, form, onSubmit]);

  // Handle chat parameter extraction
  const handleParametersExtracted = (parameters: ExtractedParameter[]) => {
    console.log('📥 Received extracted parameters:', parameters)
    setExtractedParameters(parameters)
    // Auto-fill form with extracted parameters
    parameters.forEach(param => {
      if (param.field in form.getValues()) {
        console.log(`🔧 Setting form field ${param.field} = ${param.value}`)
        form.setValue(param.field, param.value)
      } else {
        console.log(`⚠️ Field ${param.field} not found in form`)
      }
    })
  }

  // Handle chat parameter confirmation
  const handleParametersConfirmed = () => {
    // Parameter confirmation handled by chat interface
  }

  // Handle chat errors
  const handleChatError = (error: string) => {
    setError(`Chat Error: ${error}`)
  }

  // Dynamic text based on context
  const progressLabel = aiIsOptimizing 
    ? aiOptimizationProgress?.message || "Processing..."
    : currentGeneration === totalGenerations ? "Finalizing" : "Processing generation";
  
  const loadingButtonText = aiIsOptimizing 
    ? "AI is optimizing..."
    : currentGeneration === totalGenerations ? "Finalizing..." : "Optimizing...";
  
  const idleButtonText = combinedResult ? "Run New Optimization" : "Start Optimization";

  // Current progress (AI or manual)
  const currentProgress = aiIsOptimizing 
    ? aiOptimizationProgress?.progress || 0
    : progress;

  const shouldShowProgress = showProgress || aiIsOptimizing;

  return (
    <div className="px-4 py-4 lg:px-8">
      <div className="flex justify-between items-center mb-6 pr-28">
        <ClaritiLogo className="h-8" />
        <h1 className="text-3xl font-bold">Masonry Support Designer</h1>
      </div>


      {/* Workflow Mode Toggle */}
      <div className="mb-6 flex justify-end">
        <WorkflowToggle
          currentMode={workflowMode}
          onModeChange={handleWorkflowModeChange}
          disabled={combinedIsLoading}
        />
      </div>

      {/* Main Content */}
      <div className={cn(
        "transition-all duration-300",
        workflowMode === 'manual' ? '' : '',
        workflowMode === 'ai-assisted' ? 'lg:grid lg:grid-cols-[30%_1fr] lg:gap-8' : '',
        workflowMode === 'fully-automated' ? 'lg:grid lg:grid-cols-[2fr_3fr] lg:gap-8' : ''
      )}>
        {/* Chat Interface (when in AI modes) */}
        {(workflowMode === 'ai-assisted' || workflowMode === 'fully-automated') && (
          <div className="mb-6 lg:mb-0 lg:h-[calc(100vh-140px)] lg:flex lg:flex-col">
            <ChatInterface
              onParametersExtracted={handleParametersExtracted}
              onParametersConfirmed={handleParametersConfirmed}
              onError={handleChatError}
              disabled={isLoading}
              className="h-[calc(100vh-180px)] lg:h-full"
              workflowMode={workflowMode}
              sessionId={sessionId || undefined}
            />
          </div>
        )}

        {/* Form Interface - hide completely in fully-automated mode */}
        {workflowMode !== 'fully-automated' && (
          <div className="lg:overflow-auto">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Masonry Support Designer
                  {workflowMode === 'ai-assisted' && extractedParameters.length > 0 && (
                    <span className="text-sm bg-[#c2f20e]/20 text-[#c2f20e] px-2 py-1 rounded-full">
                      {extractedParameters.length} parameter{extractedParameters.length !== 1 ? 's' : ''} extracted
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  {workflowMode === 'manual' 
                    ? 'Enter your project specifications to design the optimal bracket'
                    : extractedParameters.length > 0 
                      ? 'Values are automatically populated as you chat. Click &quot;Start Optimization&quot; when ready.'
                      : 'Start chatting to automatically populate form fields with extracted parameters'
                  }
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="input">Input Parameters</TabsTrigger>
                    <TabsTrigger value="results" disabled={!combinedResult}>
                      Results {combinedResult && "✓"}
                      {resultSource === 'ai' && combinedResult && (
                        <span className="ml-1 text-xs bg-[#c2f20e] text-white px-1.5 py-0.5 rounded">AI</span>
                      )}
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="input">
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Frame Fixing Type Section */}
                        <div className="col-span-full">
                          <div className="rounded-lg border p-6 bg-gradient-to-br from-primary/5 to-primary/10">
                            <FormField
                              control={form.control}
                              name="frame_fixing_type"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-lg font-semibold">Frame Fixing Type</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger className="h-12 text-base font-medium">
                                        <SelectValue placeholder="Select frame fixing type" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="concrete-cast-in">Concrete (Cast-in Channel)</SelectItem>
                                      <SelectItem value="concrete-post-fix">Concrete (Post-Fix)</SelectItem>
                                      <SelectItem value="concrete-all">Concrete (All)</SelectItem>
                                      <SelectItem value="steel-ibeam">Steelwork (I-Beam)</SelectItem>
                                      <SelectItem value="steel-rhs">Steelwork (RHS)</SelectItem>
                                      <SelectItem value="steel-shs">Steelwork (SHS)</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormDescription>
                                    Select the type of structural frame and fixing method
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        {/* Steel Section Configuration (only for steel fixing types) */}
                        {form.watch('frame_fixing_type')?.startsWith('steel') && (
                          <div className="col-span-full">
                            <div className="rounded-lg border p-6">
                              <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 rounded-lg bg-orange-500/10">
                                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                  </svg>
                                </div>
                                <div>
                                  <h3 className="text-lg font-semibold">Steel Section Configuration</h3>
                                  <p className="text-sm text-muted-foreground">Specify the steel section type and size</p>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Steel Section Size or Custom Height */}
                                {!form.watch('use_custom_steel_section') ? (
                                  <FormField
                                    control={form.control}
                                    name="steel_section_size"
                                    render={({ field }) => {
                                      const frameType = form.watch('frame_fixing_type');
                                      let availableSizes: string[] = [];
                                      let sectionLabel = 'Standard Size';

                                      if (frameType === 'steel-ibeam') {
                                        availableSizes = getSectionSizes('I-BEAM');
                                        sectionLabel = 'I-Beam Size';
                                      } else if (frameType === 'steel-rhs') {
                                        availableSizes = getSectionSizes('RHS');
                                        sectionLabel = 'RHS Size';
                                      } else if (frameType === 'steel-shs') {
                                        availableSizes = getSectionSizes('SHS');
                                        sectionLabel = 'SHS Size';
                                      }

                                      return (
                                        <FormItem>
                                          <FormLabel>{sectionLabel}</FormLabel>
                                          <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                              <SelectTrigger>
                                                <SelectValue placeholder="Select size" />
                                              </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="max-h-60">
                                              {availableSizes.map(size => (
                                                <SelectItem key={size} value={size}>{size}</SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                          <FormMessage />
                                        </FormItem>
                                      );
                                    }}
                                  />
                                ) : (
                                  <FormField
                                    control={form.control}
                                    name="custom_steel_height"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Custom Height (mm)</FormLabel>
                                        <FormControl>
                                          <Input
                                            type="number"
                                            step="1"
                                            placeholder="e.g. 150"
                                            value={field.value}
                                            onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                )}

                                {/* Bolt Size Selection */}
                                <FormField
                                  control={form.control}
                                  name="steel_bolt_size"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Bolt Size Options</FormLabel>
                                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select bolt sizes" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          <SelectItem value="all">All Bolt Sizes (M10/M12/M16)</SelectItem>
                                          <SelectItem value="M10">M10 Only</SelectItem>
                                          <SelectItem value="M12">M12 Only</SelectItem>
                                          <SelectItem value="M16">M16 Only</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <FormDescription className="text-xs">
                                        Algorithm will test selected bolt sizes
                                      </FormDescription>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                {/* Fixing Method Selection - Only for I-Beam */}
                                {form.watch('frame_fixing_type') === 'steel-ibeam' && (
                                  <FormField
                                    control={form.control}
                                    name="steel_fixing_method"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Fixing Method (I-Beam)</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                          <FormControl>
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select fixing method" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            <SelectItem value="SET_SCREW">Set Screws Only</SelectItem>
                                            <SelectItem value="BLIND_BOLT">Blind Bolts Only</SelectItem>
                                            <SelectItem value="both">Test Both (Optimize)</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <FormDescription className="text-xs">
                                          I-Beam can use set screws or blind bolts. RHS/SHS must use blind bolts.
                                        </FormDescription>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                )}
                              </div>

                              {/* Custom Section Toggle */}
                              <div className="mt-4">
                                <FormField
                                  control={form.control}
                                  name="use_custom_steel_section"
                                  render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                      <div className="space-y-0.5">
                                        <FormLabel>Use Custom Section Height</FormLabel>
                                        <FormDescription className="text-xs">
                                          Enter a custom height instead of selecting a standard size
                                        </FormDescription>
                                      </div>
                                      <FormControl>
                                        <Switch
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              </div>

                              {/* Display Calculated Steel Section Height */}
                              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="text-sm font-medium text-blue-900">Effective Section Height</div>
                                    <div className="text-xs text-blue-700 mt-1">
                                      {form.watch('use_custom_steel_section')
                                        ? 'From custom height input'
                                        : 'Extracted from selected steel section size'}
                                    </div>
                                  </div>
                                  <div className="text-2xl font-bold text-blue-900 font-mono">
                                    {(() => {
                                      const useCustom = form.watch('use_custom_steel_section');
                                      const customHeight = form.watch('custom_steel_height');
                                      const sectionSize = form.watch('steel_section_size');
                                      const sectionType = form.watch('steel_section_type');

                                      if (useCustom) {
                                        return customHeight ? `${customHeight}mm` : '—';
                                      } else if (sectionSize) {
                                        // Extract first number from size (e.g., "203x133" -> 203)
                                        const height = parseInt(sectionSize.split('x')[0]);
                                        return height ? `${height}mm` : '—';
                                      }
                                      return '—';
                                    })()}
                                  </div>
                                </div>
                                <div className="text-xs text-blue-600 mt-2">
                                  ℹ️ This height replaces slab thickness for steel frame calculations
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Fixing Customization - for concrete and steel fixings */}
                        {(form.watch('frame_fixing_type')?.startsWith('concrete') || form.watch('frame_fixing_type')?.startsWith('steel')) && (
                          <div className="col-span-full">
                            <div className="rounded-lg border p-6">
                              <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 rounded-lg bg-primary/10">
                                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                </div>
                                <div>
                                  <h3 className="text-lg font-semibold">Fixing Customization</h3>
                                  <p className="text-sm text-muted-foreground">Customize fixing position and dimensions</p>
                                </div>
                              </div>

                              {/* Fixing Position Configuration */}
                              <div className="mt-4">
                                <div className="rounded-lg border p-4">
                                  <div className="space-y-3">
                                    <Label className="text-sm font-medium">Fixing Position</Label>
                                    <ToggleGroup
                                      type="single"
                                      value={form.watch("use_custom_fixing_position") ? "custom" : "default"}
                                      onValueChange={(value) => {
                                        if (value) {
                                          const useCustom = value === "custom";
                                          form.setValue("use_custom_fixing_position", useCustom);
                                          if (!useCustom) {
                                            form.setValue("fixing_position", fixingPositionConstraints.default);
                                          } else {
                                            // When switching to custom, set a reasonable default if current value is the default
                                            const currentFixingPosition = form.getValues("fixing_position");
                                            if (currentFixingPosition === fixingPositionConstraints.default) {
                                              form.setValue("fixing_position", Math.min(100, fixingPositionConstraints.max));
                                            }
                                          }
                                        }
                                      }}
                                      className="justify-start gap-2 mb-3"
                                      variant="outline"
                                      size="sm"
                                    >
                                      <ToggleGroupItem
                                        value="default"
                                        aria-label="Find Optimal Position"
                                        className={cn(
                                          "min-w-[120px] text-xs",
                                          !form.watch("use_custom_fixing_position") && "bg-[rgb(194,242,14)] text-black hover:brightness-95"
                                        )}
                                      >
                                        Find Optimal Position
                                      </ToggleGroupItem>
                                      <ToggleGroupItem
                                        value="custom"
                                        aria-label="Custom Position"
                                        className={cn(
                                          "min-w-[120px] text-xs",
                                          form.watch("use_custom_fixing_position") && "bg-[rgb(194,242,14)] text-black hover:brightness-95"
                                        )}
                                      >
                                        Custom Position
                                      </ToggleGroupItem>
                                    </ToggleGroup>

                                    {/* Conditional Custom Input */}
                                    {form.watch("use_custom_fixing_position") ? (
                                      <FormField
                                        control={form.control}
                                        name="fixing_position"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel className="text-sm">Custom Fixing Position (mm)</FormLabel>
                                            <FormControl>
                                              <Input
                                                type="number"
                                                step="5"
                                                min={fixingPositionConstraints.min}
                                                max={fixingPositionConstraints.max}
                                                placeholder="e.g. 100"
                                                value={field.value}
                                                onChange={(e) => {
                                                  const inputValue = e.target.value;
                                                  if (inputValue === '') {
                                                    field.onChange(fixingPositionConstraints.min); // Set to minimum valid value when empty
                                                  } else {
                                                    const value = Number(inputValue);
                                                    if (!isNaN(value) && value >= fixingPositionConstraints.min) {
                                                      field.onChange(value);
                                                    }
                                                  }
                                                }}
                                                disabled={inputMode === 'chat' && isLoading}
                                                className="text-sm"
                                              />
                                            </FormControl>
                                            <FormDescription className="text-xs">
                                              {fixingPositionConstraints.description} ({fixingPositionConstraints.min}-{fixingPositionConstraints.max}mm)
                                            </FormDescription>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                    ) : (
                                      <div className="flex items-center justify-between py-2 px-3 bg-blue-50 rounded">
                                        <span className="text-sm text-gray-600">Finding optimal fixing position</span>
                                        <span className="text-sm font-semibold text-blue-700">Auto-optimizing</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Dim D Section - Only for inverted brackets */}
                                <div className="rounded-lg border p-4">
                                  <div className="space-y-3">
                                    <Label className="text-sm font-medium flex items-center gap-1">
                                      Dim D (Inverted Brackets Only)
                                      <span className="text-xs text-blue-600 cursor-help" title="Distance from bracket bottom to fixing point for inverted brackets">ⓘ</span>
                                    </Label>

                                    <div className="flex items-center space-x-2">
                                      <FormField
                                        control={form.control}
                                        name="use_custom_dim_d"
                                        render={({ field }) => (
                                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                            <FormControl>
                                              <Switch
                                                checked={field.value}
                                                onCheckedChange={(checked) => {
                                                  field.onChange(checked);
                                                  if (!checked) {
                                                    form.setValue("dim_d", 130);
                                                  } else {
                                                    const currentDimD = form.getValues("dim_d");
                                                    if (currentDimD === 130) {
                                                      form.setValue("dim_d", 200);
                                                    }
                                                  }
                                                }}
                                                disabled={inputMode === 'chat' && isLoading}
                                              />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                              <FormLabel>Custom Dim D</FormLabel>
                                              <FormDescription>
                                                Override auto-optimized Dim D value
                                              </FormDescription>
                                            </div>
                                          </FormItem>
                                        )}
                                      />
                                    </div>

                                    {/* Conditional Custom Input */}
                                    {form.watch("use_custom_dim_d") ? (
                                      <FormField
                                        control={form.control}
                                        name="dim_d"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel className="text-sm">Custom Dim D (mm)</FormLabel>
                                            <FormControl>
                                              <Input
                                                type="number"
                                                min="130"
                                                max="450"
                                                step="5"
                                                placeholder="130"
                                                value={field.value || ''}
                                                onChange={(e) => {
                                                  const inputValue = e.target.value;
                                                  if (inputValue === '') {
                                                    field.onChange(130); // Set to minimum valid value when empty
                                                  } else {
                                                    const value = Number(inputValue);
                                                    if (!isNaN(value) && value >= 130) {
                                                      field.onChange(value);
                                                    }
                                                  }
                                                }}
                                                disabled={inputMode === 'chat' && isLoading}
                                                className="text-sm"
                                              />
                                            </FormControl>
                                            <FormDescription className="text-xs">
                                              Distance from bracket bottom to fixing point (130-450mm, in 5mm increments)
                                            </FormDescription>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                    ) : (
                                      <div className="flex items-center justify-between py-2 px-3 bg-blue-50 rounded">
                                        <span className="text-sm text-gray-600">Auto-optimizing Dim D values</span>
                                        <span className="text-sm font-semibold text-blue-700">130-450mm range</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Concrete Product Selection - for all concrete types */}
                        {form.watch('frame_fixing_type')?.startsWith('concrete') && (
                          <div className="col-span-full">
                            <div className="rounded-lg border p-6">
                              <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 rounded-lg bg-primary/10">
                                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                  </svg>
                                </div>
                                <div>
                                  <h3 className="text-lg font-semibold">Product Selection</h3>
                                  <p className="text-sm text-muted-foreground">Select which products to consider</p>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Channel Fix Type - show for cast-in and all */}
                                {(form.watch('frame_fixing_type') === 'concrete-cast-in' || form.watch('frame_fixing_type') === 'concrete-all') && (
                                  <FormField
                                    control={form.control}
                                    name="channel_product"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Channel Fix Type</FormLabel>
                                        <FormControl>
                                          <Select
                                            value={field.value}
                                            onValueChange={field.onChange}
                                          >
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select channel type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="all">All Channels</SelectItem>
                                              <SelectItem value="CPRO38">CPRO38</SelectItem>
                                              <SelectItem value="CPRO50">CPRO50</SelectItem>
                                              <SelectItem value="CPRO52">CPRO52</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                )}

                                {/* Post Fix Type - show for post-fix and all */}
                                {(form.watch('frame_fixing_type') === 'concrete-post-fix' || form.watch('frame_fixing_type') === 'concrete-all') && (
                                  <FormField
                                    control={form.control}
                                    name="postfix_product"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Post Fix Type</FormLabel>
                                        <FormControl>
                                          <Select
                                            value={field.value}
                                            onValueChange={field.onChange}
                                          >
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select post type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="all">All Post-Fix</SelectItem>
                                              <SelectItem value="R-HPTIII-70">R-HPTIII-70</SelectItem>
                                              <SelectItem value="R-HPTIII-90">R-HPTIII-90</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Design Parameters Section */}
                        <div className="col-span-full">
                          <div className="rounded-lg border p-6">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="p-2 rounded-lg bg-primary/10">
                                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold">Design Parameters</h3>
                                <p className="text-sm text-muted-foreground">Basic structural dimensions and measurements</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {/* Slab Thickness - only for concrete types */}
                              {form.watch('frame_fixing_type')?.startsWith('concrete') && (
                                <FormField
                                  control={form.control}
                                  name="slab_thickness"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Slab Thickness (mm)</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          step="5"
                                          placeholder="e.g. 200"
                                          value={field.value}
                                          onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                                          disabled={inputMode === 'chat' && isLoading}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              )}

                              {/* Cavity Width */}
                              <FormField
                                control={form.control}
                                name="cavity"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Cavity Width (mm)</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        step="0.5"
                                        placeholder="e.g. 100"
                                        value={field.value}
                                        onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                                        disabled={inputMode === 'chat' && isLoading}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              {/* Support Level */}
                              <FormField
                                control={form.control}
                                name="support_level"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Support Level (mm)</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        step="5"
                                        placeholder="e.g. -50"
                                        value={field.value}
                                        onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                                        disabled={inputMode === 'chat' && isLoading}
                                      />
                                    </FormControl>
                                    <FormDescription className="mt-1 text-xs text-muted-foreground">
                                      0 is at top of slab (often negative)
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Load Information Section */}
                        <div className="col-span-full">
                          <div className="rounded-lg border p-6">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="p-2 rounded-lg bg-primary/10">
                                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold">Load Information</h3>
                                <p className="text-sm text-muted-foreground">Specify load characteristics or material properties</p>
                              </div>
                            </div>

                            {/* Characteristic Load Input */}
                            <FormField
                              control={form.control}
                              name="characteristic_load"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Characteristic Load (kN/m)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      placeholder="e.g. 6"
                                      {...field}
                                      onChange={(e) => {
                                        const value = e.target.value === "" ? 0 : Number(e.target.value)
                                        field.onChange(value)
                                      }}
                                      value={field.value}
                                      disabled={inputMode === 'chat' && isLoading}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        {/* Facade Configuration Section */}
                        <div className="col-span-full">
                          <div className="rounded-lg border p-6">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="p-2 rounded-lg bg-primary/10">
                                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold">Facade Configuration</h3>
                                <p className="text-sm text-muted-foreground">Configure facade material and load position parameters</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Material Type */}
                              <FormField
                                control={form.control}
                                name="material_type"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Material Type</FormLabel>
                                    <Select
                                      onValueChange={(value) => {
                                        field.onChange(value);
                                        // Auto-update load position based on material type
                                        if (!form.watch('use_custom_load_position')) {
                                          const loadPositions = {
                                            'brick': 1/3,
                                            'precast': 1/2,
                                            'stone': 1/2
                                          };
                                          form.setValue('load_position', loadPositions[value as keyof typeof loadPositions] || 1/3);
                                        }
                                        // Auto-update facade thickness based on material type
                                        const facadeThicknesses = {
                                          'brick': 102.5,
                                          'precast': 250,
                                          'stone': 150
                                        };
                                        form.setValue('facade_thickness', facadeThicknesses[value as keyof typeof facadeThicknesses] || 102.5);
                                      }}
                                      value={field.value}
                                      disabled={inputMode === 'chat' && isLoading}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select material type" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="brick">Brick</SelectItem>
                                        <SelectItem value="precast">Precast Concrete</SelectItem>
                                        <SelectItem value="stone">Stone</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormDescription>
                                      Material type affects default load position and facade thickness
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              {/* Facade Thickness */}
                              <FormField
                                control={form.control}
                                name="facade_thickness"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Facade Thickness (mm)</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        placeholder="e.g. 102.5"
                                        value={field.value}
                                        onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                                        disabled={inputMode === 'chat' && isLoading}
                                        min="50"
                                        max="300"
                                        step="0.5"
                                      />
                                    </FormControl>
                                    <FormDescription>
                                      Overall thickness of the facade system
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            {/* Load Position Configuration */}
                            <div className="mt-6">
                              <div className="space-y-4">
                                <div className="flex items-center space-x-2">
                                  <FormField
                                    control={form.control}
                                    name="use_custom_load_position"
                                    render={({ field }) => (
                                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                        <FormControl>
                                          <Switch
                                            checked={field.value}
                                            onCheckedChange={(checked) => {
                                              field.onChange(checked);
                                              if (!checked) {
                                                // Reset to material-based default
                                                const materialType = form.watch('material_type');
                                                const loadPositions = {
                                                  'brick': 1/3,
                                                  'precast': 1/2,
                                                  'stone': 1/2
                                                };
                                                form.setValue('load_position', loadPositions[materialType as keyof typeof loadPositions] || 1/3);
                                              }
                                            }}
                                            disabled={inputMode === 'chat' && isLoading}
                                          />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                          <FormLabel>Custom Load Position</FormLabel>
                                          <FormDescription>
                                            Override material-based default load position
                                          </FormDescription>
                                        </div>
                                      </FormItem>
                                    )}
                                  />
                                </div>

                                {form.watch('use_custom_load_position') && (
                                  <FormField
                                    control={form.control}
                                    name="load_position"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Load Position (fraction of facade thickness)</FormLabel>
                                        <FormControl>
                                          <div className="space-y-2">
                                            <Slider
                                              min={0.1}
                                              max={0.9}
                                              step={0.05}
                                              value={[field.value]}
                                              onValueChange={(value) => field.onChange(value[0])}
                                              disabled={inputMode === 'chat' && isLoading}
                                              className="w-full"
                                            />
                                            <div className="flex justify-between text-xs text-muted-foreground">
                                              <span>0.1 (outer edge)</span>
                                              <span className="font-medium">{field.value.toFixed(2)}</span>
                                              <span>0.9 (inner edge)</span>
                                            </div>
                                          </div>
                                        </FormControl>
                                        <FormDescription>
                                          Position where load acts as fraction of facade thickness (0.33 = 1/3, 0.5 = 1/2)
                                        </FormDescription>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                )}

                                {!form.watch('use_custom_load_position') && (
                                  <div className="p-3 bg-muted rounded-md">
                                    <div className="text-sm">
                                      <span className="font-medium">Auto Load Position: </span>
                                      <span className="text-muted-foreground">
                                        {(() => {
                                          const materialType = form.watch('material_type');
                                          const positions = { 'brick': '1/3', 'precast': '1/2', 'stone': '1/2' };
                                          return positions[materialType as keyof typeof positions] || '1/3';
                                        })()}
                                        ({form.watch('load_position')?.toFixed(2)}) based on {form.watch('material_type')} material
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Advanced Facade Offsets Toggle */}
                            <div className="mt-6">
                              <div className="space-y-4">
                                <div className="flex items-center space-x-2">
                                  <FormField
                                    control={form.control}
                                    name="use_custom_facade_offsets"
                                    render={({ field }) => (
                                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                        <FormControl>
                                          <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            disabled={inputMode === 'chat' && isLoading}
                                          />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                          <FormLabel>Custom Facade Offsets</FormLabel>
                                          <FormDescription>
                                            Adjust front offset and isolation shim thickness
                                          </FormDescription>
                                        </div>
                                      </FormItem>
                                    )}
                                  />
                                </div>

                              {/* Conditional Facade Offset Fields */}
                              {form.watch("use_custom_facade_offsets") && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <FormField
                                    control={form.control}
                                    name="front_offset"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Front Offset (mm)</FormLabel>
                                        <FormControl>
                                          <Input
                                            type="number"
                                            placeholder="12"
                                            value={field.value}
                                            onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                                            disabled={inputMode === 'chat' && isLoading}
                                            min="-50"
                                            max="100"
                                            step="1"
                                          />
                                        </FormControl>
                                        <FormDescription>
                                          Additional projection adjustment
                                        </FormDescription>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <FormField
                                    control={form.control}
                                    name="isolation_shim_thickness"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Isolation Shim Thickness (mm)</FormLabel>
                                        <FormControl>
                                          <Input
                                            type="number"
                                            placeholder="3"
                                            value={field.value}
                                            onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                                            disabled={inputMode === 'chat' && isLoading}
                                            min="0"
                                            max="20"
                                            step="0.5"
                                          />
                                        </FormControl>
                                        <FormDescription>
                                          Thickness of isolation material
                                        </FormDescription>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                              )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Advanced Options Section */}
                        <div className="col-span-full">
                          <div className="rounded-lg border p-6">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="p-2 rounded-lg bg-primary/10">
                                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold">Advanced Options</h3>
                                <p className="text-sm text-muted-foreground">Load position and evaluation parameters</p>
                              </div>
                            </div>

                            {/* Notch Configuration */}
                            <div className="mb-6">
                              <Label className="text-base font-medium mb-4 block">Do you require a notch?</Label>
                              <ToggleGroup
                                type="single"
                                value={form.watch("has_notch") ? "yes" : "no"}
                                onValueChange={(value) => {
                                  if (value) {
                                    form.setValue("has_notch", value === "yes");
                                  }
                                }}
                                className="justify-start gap-2 mb-4"
                                variant="outline"
                                size="default"
                              >
                                <ToggleGroupItem
                                  value="yes"
                                  aria-label="Yes"
                                  className={cn(
                                    "min-w-[80px]",
                                    form.watch("has_notch") && "bg-[rgb(194,242,14)] text-black hover:brightness-95"
                                  )}
                                >
                                  Yes
                                </ToggleGroupItem>
                                <ToggleGroupItem
                                  value="no"
                                  aria-label="No"
                                  className={cn(
                                    "min-w-[80px]",
                                    !form.watch("has_notch") && "bg-[rgb(194,242,14)] text-black hover:brightness-95"
                                  )}
                                >
                                  No
                                </ToggleGroupItem>
                              </ToggleGroup>

                              {/* Conditional Notch Fields */}
                              {form.watch("has_notch") && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Notch Height */}
                                  <FormField
                                    control={form.control}
                                    name="notch_height"
                                    render={({ field }) => (
                                      <FormItem>
                                        <div className="rounded-lg border p-4 h-full flex flex-col justify-between">
                                          <div>
                                            <div className="flex justify-between items-center mb-2">
                                              <FormLabel>Notch Height (mm)</FormLabel>
                                              <span className="text-sm tabular-nums">
                                                {field.value} mm
                                              </span>
                                            </div>
                                            <FormDescription className="mb-3">
                                              How high does the notch extend from the bottom of the bracket?
                                            </FormDescription>
                                          </div>
                                          <FormControl>
                                            <Slider
                                              min={10}
                                              max={200}
                                              step={5}
                                              value={[field.value]}
                                              onValueChange={(values) => field.onChange(values[0])}
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </div>
                                      </FormItem>
                                    )}
                                  />

                                  {/* Notch Depth */}
                                  <FormField
                                    control={form.control}
                                    name="notch_depth"
                                    render={({ field }) => (
                                      <FormItem>
                                        <div className="rounded-lg border p-4 h-full flex flex-col justify-between">
                                          <div>
                                            <div className="flex justify-between items-center mb-2">
                                              <FormLabel>Notch Depth (mm)</FormLabel>
                                              <span className="text-sm tabular-nums">
                                                {field.value} mm
                                              </span>
                                            </div>
                                            <FormDescription className="mb-3">
                                              How deep does the notch cut into the bracket?
                                            </FormDescription>
                                          </div>
                                          <FormControl>
                                            <Slider
                                              min={10}
                                              max={200}
                                              step={5}
                                              value={[field.value]}
                                              onValueChange={(values) => field.onChange(values[0])}
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </div>
                                      </FormItem>
                                    )}
                                  />
                                </div>
                              )}
                            </div>

                            {/* Angle Length Configuration */}
                            <div className="mb-6">
                              <Label className="text-base font-medium mb-4 block">Is there a limit to the angle length?</Label>
                              <ToggleGroup
                                type="single"
                                value={form.watch("is_angle_length_limited") ? "yes" : "no"}
                                onValueChange={(value) => {
                                  if (value) {
                                    form.setValue("is_angle_length_limited", value === "yes");
                                  }
                                }}
                                className="justify-start gap-2 mb-4"
                                variant="outline"
                                size="default"
                              >
                                <ToggleGroupItem
                                  value="yes"
                                  aria-label="Yes"
                                  className={cn(
                                    "min-w-[80px]",
                                    form.watch("is_angle_length_limited") && "bg-[rgb(194,242,14)] text-black hover:brightness-95"
                                  )}
                                >
                                  Yes
                                </ToggleGroupItem>
                                <ToggleGroupItem
                                  value="no"
                                  aria-label="No"
                                  className={cn(
                                    "min-w-[80px]",
                                    !form.watch("is_angle_length_limited") && "bg-[rgb(194,242,14)] text-black hover:brightness-95"
                                  )}
                                >
                                  No
                                </ToggleGroupItem>
                              </ToggleGroup>

                              {/* Conditional Fixed Angle Length Field */}
                              {form.watch("is_angle_length_limited") && (
                                <FormField
                                  control={form.control}
                                  name="fixed_angle_length"
                                  render={({ field }) => (
                                    <FormItem>
                                      <div className="rounded-lg border p-4 h-full flex flex-col justify-between">
                                        <div>
                                          <div className="flex justify-between items-center mb-2">
                                            <FormLabel>Fixed Angle Length (mm)</FormLabel>
                                            <span className="text-sm tabular-nums">
                                              {field.value ?? 750} mm
                                            </span>
                                          </div>
                                          <FormDescription className="mb-3">
                                            Maximum angle length in 5mm increments (200-1490mm)
                                          </FormDescription>
                                        </div>
                                        <FormControl>
                                          <Slider
                                            min={200}
                                            max={1490}
                                            step={5}
                                            value={[field.value ?? 750]}
                                            onValueChange={(values) => field.onChange(values[0])}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </div>
                                    </FormItem>
                                  )}
                                />
                              )}
                            </div>

                            {/* Angle Extension Configuration for Exclusion Zones */}
                            <div className="mb-6">
                              <Label className="text-base font-medium mb-4 block">Angle Extension for Exclusion Zones</Label>
                              <p className="text-sm text-muted-foreground mb-4">
                                Enable this feature when brackets cannot extend fully due to SFS or other building elements.
                                The system will limit bracket extension and compensate by extending the angle height instead.
                              </p>

                              <ToggleGroup
                                type="single"
                                value={form.watch("enable_angle_extension") ? "yes" : "no"}
                                onValueChange={(value) => {
                                  if (value) {
                                    const enableExtension = value === "yes";
                                    console.log('🟡 ANGLE EXTENSION TOGGLE:', {
                                      newValue: value,
                                      enableExtension,
                                      currentMaxBracketExtension: form.getValues("max_allowable_bracket_extension"),
                                      currentFormValues: form.getValues(),
                                      formErrors: form.formState.errors
                                    });

                                    form.setValue("enable_angle_extension", enableExtension);

                                    // Set default value for max_allowable_bracket_extension when enabling
                                    if (enableExtension && !form.getValues("max_allowable_bracket_extension")) {
                                      console.log('🟡 Setting default max_allowable_bracket_extension to -200');
                                      form.setValue("max_allowable_bracket_extension", -200);
                                    }

                                    // Log form state after changes
                                    setTimeout(() => {
                                      console.log('🟡 ANGLE EXTENSION TOGGLE AFTER:', {
                                        enable_angle_extension: form.getValues("enable_angle_extension"),
                                        max_allowable_bracket_extension: form.getValues("max_allowable_bracket_extension"),
                                        formErrors: form.formState.errors,
                                        isValid: form.formState.isValid
                                      });
                                    }, 100);
                                  }
                                }}
                                className="justify-start gap-2 mb-4"
                                variant="outline"
                                size="default"
                              >
                                <ToggleGroupItem
                                  value="yes"
                                  aria-label="Enable Angle Extension"
                                  className={cn(
                                    "min-w-[80px]",
                                    form.watch("enable_angle_extension") && "bg-[rgb(194,242,14)] text-black hover:brightness-95"
                                  )}
                                >
                                  Enable
                                </ToggleGroupItem>
                                <ToggleGroupItem
                                  value="no"
                                  aria-label="Disable Angle Extension"
                                  className={cn(
                                    "min-w-[80px]",
                                    !form.watch("enable_angle_extension") && "bg-[rgb(194,242,14)] text-black hover:brightness-95"
                                  )}
                                >
                                  Disable
                                </ToggleGroupItem>
                              </ToggleGroup>

                              {/* Conditional Max Bracket Extension Field */}
                              {form.watch("enable_angle_extension") && (
                                <FormField
                                  control={form.control}
                                  name="max_allowable_bracket_extension"
                                  render={({ field }) => (
                                    <FormItem>
                                      <div className="rounded-lg border p-4 h-full flex flex-col justify-between">
                                        <div>
                                          <div className="flex justify-between items-center mb-2">
                                            <FormLabel>Max Bracket Position (mm)</FormLabel>
                                            <span className="text-sm tabular-nums">
                                              {field.value ?? -200} mm
                                            </span>
                                          </div>
                                          <FormDescription className="mb-3">
                                            Maximum allowable bracket position in 5mm increments.
                                            0 is at top of slab (often negative). When exceeded, the angle will be extended to compensate.
                                          </FormDescription>
                                        </div>
                                        <FormControl>
                                          <Slider
                                            min={-1000}
                                            max={500}
                                            step={5}
                                            value={[field.value ?? -200]}
                                            onValueChange={(values) => field.onChange(values[0])}
                                            disabled={inputMode === 'chat' && isLoading}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </div>
                                    </FormItem>
                                  )}
                                />
                              )}
                            </div>
                          </div>
                        </div>

                        {combinedError && (
                          <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">
                            {aiOptimizationError && <span className="font-medium">AI Optimization: </span>}
                            {combinedError}
                          </div>
                        )}

                        {/* Progress indicator */}
                        {shouldShowProgress && (
                          <div className="mt-4 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">
                                {aiIsOptimizing ? "AI Optimizing Design..." : "Optimizing Design..."}
                                {aiIsOptimizing && (
                                  <span className="ml-2 text-xs bg-[#c2f20e] text-white px-1.5 py-0.5 rounded">AI</span>
                                )}
                              </span>
                              <span className="text-sm tabular-nums">{Math.round(currentProgress)}%</span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-[#c2f20e] transition-all duration-300" 
                                style={{ width: `${currentProgress}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {aiIsOptimizing 
                                ? aiOptimizationProgress?.message || "Processing..."
                                : `${progressLabel} ${currentGeneration} of ${totalGenerations}`
                              }
                            </p>
                          </div>
                        )}

                        {/* Debug info for button state */}
                        {combinedIsLoading && (
                          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex justify-between items-center">
                              <p className="text-sm text-yellow-800">
                                🔄 Button disabled - Loading state:
                                {isLoading && " Manual Loading"}
                                {aiIsOptimizing && " AI Optimizing"}
                              </p>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  console.log('🔧 MANUALLY RESETTING LOADING STATES');
                                  setIsLoading(false);
                                  // Note: aiIsOptimizing is external state, handled by AI context
                                }}
                                className="text-xs"
                              >
                                Reset
                              </Button>
                            </div>
                          </div>
                        )}

                        {workflowConfig.showManualControls && (
                          <Button
                            type="submit"
                            disabled={combinedIsLoading}
                            className="w-full"
                            onClick={(e) => {
                              console.log('🔴 BUTTON CLICKED - Form submission attempt');
                              console.log('🔴 Current form values:', form.getValues());
                              console.log('🔴 Form validation state:', form.formState);
                              console.log('🔴 Form errors:', form.formState.errors);

                              // Check if angle extension is enabled and what the value is
                              const formValues = form.getValues();
                              console.log('🔴 ANGLE EXTENSION DEBUG:', {
                                enable_angle_extension: formValues.enable_angle_extension,
                                max_allowable_bracket_extension: formValues.max_allowable_bracket_extension,
                                support_level: formValues.support_level,
                                slab_thickness: formValues.slab_thickness
                              });

                              // Trigger form validation and check result
                              form.trigger().then((isValid) => {
                                console.log('🔴 FORM VALIDATION RESULT:', {
                                  isValid,
                                  errors: form.formState.errors,
                                  dirtyFields: form.formState.dirtyFields,
                                  touchedFields: form.formState.touchedFields
                                });

                                // Show specific angle extension validation status
                                if (formValues.enable_angle_extension) {
                                  console.log('🔴 ANGLE EXTENSION VALIDATION CHECK:', {
                                    enable_angle_extension: formValues.enable_angle_extension,
                                    max_allowable_bracket_extension: formValues.max_allowable_bracket_extension,
                                    max_bracket_extension_defined: formValues.max_allowable_bracket_extension !== undefined,
                                    max_bracket_extension_in_range: formValues.max_allowable_bracket_extension >= -1000 && formValues.max_allowable_bracket_extension <= 500,
                                    validation_should_pass: formValues.max_allowable_bracket_extension !== undefined &&
                                                           formValues.max_allowable_bracket_extension >= -1000 &&
                                                           formValues.max_allowable_bracket_extension <= 500
                                  });
                                }
                              });
                            }}
                          >
                            {combinedIsLoading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {loadingButtonText}
                              </>
                            ) : (
                              idleButtonText
                            )}
                          </Button>
                        )}
                      </form>
                    </Form>
                  </TabsContent>
                  <TabsContent value="results">
                    {combinedResult && (
                      <ResultsDisplay
                        result={combinedResult}
                        history={generationHistory}
                        designInputs={form.getValues()}
                      />
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Results Display for fully-automated mode - always show */}
        {workflowMode === 'fully-automated' && (
          <div className="lg:overflow-auto">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {combinedResult ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Optimization Results
                    </>
                  ) : (
                    <>
                      <Zap className="h-5 w-5 text-purple-600" />
                      {combinedIsLoading ? 'Optimizing Design' : 'Awaiting Parameters'}
                    </>
                  )}

                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                    Auto-mode
                  </span>
                </CardTitle>
                <CardDescription>
                  {combinedResult 
                    ? 'Your design has been automatically optimized based on the parameters from your conversation.'
                    : combinedIsLoading
                      ? 'AI is running optimization based on your chat parameters...'
                      : 'Results will appear here once parameters are gathered and optimization completes.'
                  }
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {/* Show automation workflow while waiting for parameters */}
                {!combinedResult && !combinedIsLoading && extractedParameters.length === 0 && (
                  <div className="py-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                      <div className="flex flex-col items-center text-center p-4 rounded-lg bg-purple-50 border border-purple-200">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                          <MessageSquare className="h-6 w-6 text-purple-600" />
                        </div>
                        <h4 className="font-medium text-purple-900 mb-1">1. Chat with me</h4>
                        <p className="text-sm text-purple-600">Describe your project naturally</p>
                      </div>
                      
                      <div className="flex flex-col items-center text-center p-4 rounded-lg bg-blue-50 border border-blue-200">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                          <Bot className="h-6 w-6 text-blue-600" />
                        </div>
                        <h4 className="font-medium text-blue-900 mb-1">2. I&apos;ll extract parameters</h4>
                        <p className="text-sm text-blue-600">And tell you if I&apos;m missing anything</p>
                      </div>
                      
                      <div className="flex flex-col items-center text-center p-4 rounded-lg bg-green-50 border border-green-200">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                          <Zap className="h-6 w-6 text-green-600" />
                        </div>
                        <h4 className="font-medium text-green-900 mb-1">3. I&apos;ll run optimization</h4>
                        <p className="text-sm text-green-600">And show you the results</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Show progress while parameters are gathered but optimization hasn't started */}
                {!combinedResult && !combinedIsLoading && extractedParameters.length > 0 && (
                  <div className="text-center py-12">
                    <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                      <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">Parameters Gathered</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {extractedParameters.length} parameters extracted. Starting optimization automatically...
                    </p>
                  </div>
                )}

                {/* Show loading state during optimization */}
                {!combinedResult && combinedIsLoading && (
                  <div className="text-center py-12">
                    <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                      <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">Running Optimization</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {aiOptimizationProgress?.message || "Processing your design parameters..."}
                    </p>
                    {currentProgress > 0 && (
                      <div className="w-full max-w-md mx-auto">
                        <div className="flex justify-between text-sm mb-2">
                          <span>Progress</span>
                          <span>{currentProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${currentProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Show actual results when available */}
                {combinedResult && (
                  <ResultsDisplay
                    result={combinedResult}
                    history={generationHistory}
                    designInputs={form.getValues()}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
} 
