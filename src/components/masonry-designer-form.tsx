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

// Import chat interface components
import { ChatInterface } from '@/components/chat-interface'
import type { ExtractedParameter, InputMode, WorkflowMode, WorkflowConfig } from '@/types/chat-types'

// Import AI tools hook
import { useAITools } from '@/hooks/use-ai-tools'

// Import workflow toggle
import { WorkflowToggle } from '@/components/workflow-toggle'

// Calculate characteristic load from masonry properties
function calculateCharacteristicLoad(values: {
  masonry_density: number;
  masonry_thickness: number;
  masonry_height: number;
}): number {
  const density = values.masonry_density;
  const thickness = values.masonry_thickness / 1000;
  const height = values.masonry_height;
  const gravity = 9.81;
  return (density * thickness * height * gravity) / 1000;
}

interface MasonryDesignerFormProps {
  onTestSubmit?: (values: z.infer<typeof formSchema>) => void;
  useCharacteristicLoad?: boolean;
  onUseCharacteristicLoadChange?: (value: boolean) => void;
}

export default function MasonryDesignerForm({ 
  onTestSubmit, 
  useCharacteristicLoad: externalUseCharacteristicLoad,
  onUseCharacteristicLoadChange 
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
  const [internalUseCharacteristicLoad, setInternalUseCharacteristicLoad] = useState(true)
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

  // Use either external or internal state
  const useCharacteristicLoad = externalUseCharacteristicLoad ?? internalUseCharacteristicLoad
  const setUseCharacteristicLoad = (value: boolean) => {
    if (onUseCharacteristicLoadChange) {
      onUseCharacteristicLoadChange(value)
    } else {
      setInternalUseCharacteristicLoad(value)
    }
  }

  // Initialize the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      slab_thickness: 225,
      cavity: 100,
      support_level: -200,
      characteristic_load: "14",
      masonry_density: 2000,
      masonry_thickness: 102.5,
      masonry_height: 6,
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
    },
  })

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
    if (onTestSubmit) {
      onTestSubmit(values);
      return;
    }

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
      // Determine characteristic load
      let characteristicLoad: number;
      if (useCharacteristicLoad && values.characteristic_load) {
        characteristicLoad = Number(values.characteristic_load);
      } else {
        characteristicLoad = calculateCharacteristicLoad({
          masonry_density: values.masonry_density,
          masonry_thickness: values.masonry_thickness,
          masonry_height: values.masonry_height,
        });
      }

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
      const channelSpec = getChannelSpec(channelType, values.slab_thickness, bracketCentres);
      const criticalEdges = channelSpec ? 
        { top: channelSpec.edgeDistances.top, bottom: channelSpec.edgeDistances.bottom } : 
        { top: 75, bottom: 150 };

      // Determine the actual fixing position to use
      const actualFixingPosition = values.use_custom_fixing_position ? values.fixing_position : 75;

      // Debug logging for fixing position values
      console.log('🔧 Fixing Position Debug:', {
        use_custom_fixing_position: values.use_custom_fixing_position,
        form_fixing_position: values.fixing_position,
        actual_fixing_position: actualFixingPosition,
      });

      // Prepare configuration
      const optimizationConfig = {
        maxGenerations: 100,
        designInputs: {
          support_level: values.support_level,
          cavity_width: values.cavity,
          slab_thickness: values.slab_thickness,
          characteristic_load: characteristicLoad,
          top_critical_edge: criticalEdges.top,
          bottom_critical_edge: criticalEdges.bottom,
          notch_height: values.has_notch ? values.notch_height : 0,
          notch_depth: values.has_notch ? values.notch_depth : 0,
          fixing_position: actualFixingPosition,
          use_custom_fixing_position: values.use_custom_fixing_position,
          showDetailedVerifications: true,
          allowed_channel_types: (() => {
            const channelTypes: ChannelType[] = [];

            if (fixingType === 'all') {
              // Include channels based on both dropdown selections
              if (channelProduct !== 'all') {
                channelTypes.push(channelProduct as ChannelType);
              } else {
                channelTypes.push('CPRO38', 'CPRO50');
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
                channelTypes.push('CPRO38', 'CPRO50');
              }
            }

            return channelTypes.length > 0 ? channelTypes : ['CPRO38','CPRO50','R-HPTIII-70','R-HPTIII-90'] as ChannelType[];
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
  }, [onTestSubmit, useCharacteristicLoad, clearAIOptimizationResult, aiOptimizationResult])

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
                              {/* Slab Thickness */}
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

                            {/* Characteristic Load Known Radio Buttons */}
                            <div className="mb-6">
                              <Label className="text-base font-medium mb-4 block">Characteristic Load Known?</Label>
                              <ToggleGroup
                                type="single"
                                value={useCharacteristicLoad ? "yes" : "no"}
                                onValueChange={(value) => {
                                  if (value) {
                                    setUseCharacteristicLoad(value === "yes");
                                  }
                                }}
                                className="justify-start gap-2"
                                variant="outline"
                                size="default"
                              >
                                <ToggleGroupItem
                                  value="yes"
                                  aria-label="Yes"
                                  className={cn(
                                    "min-w-[80px]",
                                    useCharacteristicLoad && "bg-[rgb(194,242,14)] text-black hover:brightness-95"
                                  )}
                                >
                                  Yes
                                </ToggleGroupItem>
                                <ToggleGroupItem
                                  value="no"
                                  aria-label="No"
                                  className={cn(
                                    "min-w-[80px]",
                                    !useCharacteristicLoad && "bg-[rgb(194,242,14)] text-black hover:brightness-95"
                                  )}
                                >
                                  No
                                </ToggleGroupItem>
                              </ToggleGroup>
                            </div>

                            {/* Conditional Inputs */}
                            {useCharacteristicLoad ? (
                              <FormField
                                control={form.control}
                                name="characteristic_load"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Characteristic Load (kN/m)</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        placeholder="e.g. 2.5"
                                        {...field}
                                        onChange={(e) => {
                                          const value = e.target.value === "" ? "" : e.target.value
                                          field.onChange(value)
                                        }}
                                        value={field.value === undefined ? "" : field.value}
                                        disabled={inputMode === 'chat' && isLoading}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Masonry Density */}
                                <FormField
                                  control={form.control}
                                  name="masonry_density"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Density (kg/m³)</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          placeholder="e.g. 2400"
                                          value={field.value}
                                          onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                                          disabled={inputMode === 'chat' && isLoading}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                {/* Masonry Thickness */}
                                <FormField
                                  control={form.control}
                                  name="masonry_thickness"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Thickness (mm)</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
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

                                {/* Masonry Height */}
                                <FormField
                                  control={form.control}
                                  name="masonry_height"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Height (m)</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          placeholder="e.g. 3000"
                                          value={field.value}
                                          onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                                          disabled={inputMode === 'chat' && isLoading}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Fixing Options Section */}
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
                                  <h3 className="text-lg font-semibold">Fixing Options</h3>
                                  <p className="text-sm text-muted-foreground">Select fixing types and configuration options</p>
                                </div>
                              </div>

                              {/* Fixing Type Toggle */}
                              <FormField
                                control={form.control}
                                name="fixing_type"
                                render={({ field }) => (
                                  <FormItem className="mb-6">
                                    <FormLabel>Fixing Type</FormLabel>
                                    <FormControl>
                                      <ToggleGroup
                                        type="single"
                                        value={field.value || "all"}
                                        onValueChange={(value) => {
                                          if (value) {
                                            field.onChange(value);
                                          }
                                        }}
                                        className="justify-start gap-2"
                                        variant="outline"
                                        size="default"
                                      >
                                        <ToggleGroupItem
                                          value="post-fix"
                                          aria-label="Post Fix"
                                          className={cn(
                                            "min-w-[100px]",
                                            field.value === "post-fix" && "bg-[rgb(194,242,14)] text-black hover:brightness-95"
                                          )}
                                        >
                                          Post Fix
                                        </ToggleGroupItem>
                                        <ToggleGroupItem
                                          value="channel-fix"
                                          aria-label="Channel Fix"
                                          className={cn(
                                            "min-w-[100px]",
                                            field.value === "channel-fix" && "bg-[rgb(194,242,14)] text-black hover:brightness-95"
                                          )}
                                        >
                                          Channel Fix
                                        </ToggleGroupItem>
                                        <ToggleGroupItem
                                          value="all"
                                          aria-label="All Options"
                                          className={cn(
                                            "min-w-[100px]",
                                            field.value === "all" && "bg-[rgb(194,242,14)] text-black hover:brightness-95"
                                          )}
                                        >
                                          All Options
                                        </ToggleGroupItem>
                                      </ToggleGroup>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              {/* Side-by-side Product Selection */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Channel Fix Type */}
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
                                          disabled={form.watch("fixing_type") === 'post-fix'}
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select channel type" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="all">All Channels</SelectItem>
                                            <SelectItem value="CPRO38">CPRO38</SelectItem>
                                            <SelectItem value="CPRO50">CPRO50</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                {/* Post Fix Type */}
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
                                          disabled={form.watch("fixing_type") === 'channel-fix'}
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
                                            form.setValue("fixing_position", 75);
                                          } else {
                                            // When switching to custom, set a reasonable default if current value is the default
                                            const currentFixingPosition = form.getValues("fixing_position");
                                            if (currentFixingPosition === 75) {
                                              form.setValue("fixing_position", 100);
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
                                                min="75"
                                                max="400"
                                                placeholder="e.g. 100"
                                                value={field.value}
                                                onChange={(e) => {
                                                  const inputValue = e.target.value;
                                                  if (inputValue === '') {
                                                    field.onChange(75); // Set to minimum valid value when empty
                                                  } else {
                                                    const value = Number(inputValue);
                                                    if (!isNaN(value) && value >= 75) {
                                                      field.onChange(value);
                                                    }
                                                  }
                                                }}
                                                disabled={inputMode === 'chat' && isLoading}
                                                className="text-sm"
                                              />
                                            </FormControl>
                                            <FormDescription className="text-xs">
                                              Distance from top of slab to fixing point (75-400mm, in 5mm increments)
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

                        {workflowConfig.showManualControls && (
                          <Button
                            type="submit"
                            disabled={combinedIsLoading}
                            className="w-full"
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
