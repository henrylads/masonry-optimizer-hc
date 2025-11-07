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
import { IntegratedResults } from "@/components/design/integrated-results"
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

// Import progressive disclosure form components
import { CoreFields } from '@/components/design/core-fields'
import { AdvancedOptions } from '@/components/design/advanced-options'
import { InlineDensityCalculator } from '@/components/design/inline-density-calculator'

// Import autosave hook
import { useDesignAutosave } from '@/hooks/use-design-autosave'


interface MasonryDesignerFormProps {
  designId?: string | null
  projectId?: string
  onTestSubmit?: (values: z.infer<typeof formSchema>) => void;
}

export default function MasonryDesignerForm({
  designId,
  projectId,
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

  // Density calculator state
  const [showDensityCalculator, setShowDensityCalculator] = useState(false)

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
      // Project information defaults
      project_name: '',
      section_name: '',
      client_name: '',
      project_location: '',
      project_reference: '',
      designer_name: '',
      // Frame and structural defaults
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

  // Use autosave hook when design context is provided
  useDesignAutosave({
    designId: designId || null,
    projectId: projectId || '',
    form
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
          steel_fixing_method: values.steel_fixing_method, // CRITICAL: Pass the fixing method selection
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

  // Callback handler for density calculator value selection
  const handleDensityCalculatorValue = (load: number) => {
    form.setValue('characteristic_load', load)
    setShowDensityCalculator(false)
  }

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
                        {/* Core Fields */}
                        <CoreFields
                          form={form}
                          onOpenDensityCalculator={() => setShowDensityCalculator(!showDensityCalculator)}
                        />

                        {/* Inline Density Calculator */}
                        {showDensityCalculator && (
                          <InlineDensityCalculator
                            onValueSelect={handleDensityCalculatorValue}
                          />
                        )}

                        {/* Advanced Options */}
                        <AdvancedOptions
                          form={form}
                          frameFixingType={form.watch('frame_fixing_type')}
                        />

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
                      <IntegratedResults
                        result={combinedResult}
                        history={generationHistory}
                        designInputs={form.getValues()}
                        onCompare={() => {
                          // TODO: Implement design comparison modal
                          console.log('Compare designs')
                        }}
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
                  <IntegratedResults
                    result={combinedResult}
                    history={generationHistory}
                    designInputs={form.getValues()}
                    onCompare={() => {
                      // TODO: Implement design comparison modal
                      console.log('Compare designs')
                    }}
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
