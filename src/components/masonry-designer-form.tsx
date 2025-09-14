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
      channel_family: 'all',
      enable_fixing_optimization: false,
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

      // Get channel specifications based on selected family
      const selectedFamily = values.channel_family;
      const channelType = selectedFamily === 'all' ? 'CPRO38' : selectedFamily;
      const bracketCentres = 500;
      const channelSpec = getChannelSpec(channelType, values.slab_thickness, bracketCentres);
      const criticalEdges = channelSpec ? 
        { top: channelSpec.edgeDistances.top, bottom: channelSpec.edgeDistances.bottom } : 
        { top: 75, bottom: 150 };

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
          enable_fixing_optimization: values.enable_fixing_optimization,
          fixing_position: values.fixing_position,
          showDetailedVerifications: true,
          allowed_channel_types: selectedFamily === 'all' ? ['CPRO38','CPRO50','R-HPTIII-70','R-HPTIII-90'] as ChannelType[] : [channelType as ChannelType]
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
                        {/* Primary Input Fields - 3 Column Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Slab Thickness */}
                          <FormField
                          control={form.control}
                          name="slab_thickness"
                          render={({ field }) => (
                            <FormItem>
                              <div className={cn(
                                "rounded-lg border p-4 h-full flex flex-col justify-between transition-all duration-200",
                                workflowMode === 'ai-assisted' && extractedParameters.some(p => p.field === 'slab_thickness') 
                                  ? 'border-[#c2f20e] bg-[#c2f20e]/5' 
                                  : ''
                              )}>
                                <div>
                                  <div className="flex justify-between items-center mb-2">
                                    <FormLabel className="flex items-center gap-2">
                                      Slab Thickness (mm)
                                      {workflowMode === 'ai-assisted' && extractedParameters.some(p => p.field === 'slab_thickness') && (
                                        <span className="text-xs bg-[#c2f20e] text-white px-1.5 py-0.5 rounded">AI</span>
                                      )}
                                    </FormLabel>
                                    <span className="text-sm tabular-nums">
                                      {field.value} mm
                                    </span>
                                  </div>
                                  <FormDescription className="mb-3">
                                    Height of the concrete slab the system is attaching to
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Slider
                                    min={150}
                                    max={500}
                                    step={5}
                                    value={[field.value]}
                                    onValueChange={(values) => field.onChange(values[0])}
                                    disabled={inputMode === 'chat' && isLoading}
                                  />
                                </FormControl>
                                <FormMessage />
                              </div>
                            </FormItem>
                          )}
                        />
                        
                        {/* Cavity Width */}
                        <FormField
                          control={form.control}
                          name="cavity"
                          render={({ field }) => (
                            <FormItem>
                              <div className={cn(
                                "rounded-lg border p-4 transition-all duration-200",
                                workflowMode === 'ai-assisted' && extractedParameters.some(p => p.field === 'cavity') 
                                  ? 'border-[#c2f20e] bg-[#c2f20e]/5' 
                                  : ''
                              )}>
                                <FormLabel className="flex items-center gap-2">
                                  Cavity Width (mm)
                                  {workflowMode === 'ai-assisted' && extractedParameters.some(p => p.field === 'cavity') && (
                                    <span className="text-xs bg-[#c2f20e] text-white px-1.5 py-0.5 rounded">AI</span>
                                  )}
                                </FormLabel>
                                <FormDescription className="mb-3">
                                  Distance between slab edge and masonry (min 50mm, in 0.5mm increments)
                                </FormDescription>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.5"
                                    placeholder="100"
                                    {...field}
                                    onChange={(e) => {
                                      // Allow empty string while typing
                                      const value = e.target.value;
                                      field.onChange(value === "" ? "" : value);
                                    }}
                                    onBlur={(e) => {
                                      // On blur, if empty or less than minimum, set to minimum value
                                      const value = e.target.value;
                                      if (value === "" || parseFloat(value) < 50) {
                                        field.onChange(100);
                                      }
                                    }}
                                    value={field.value === undefined ? "" : String(field.value)}
                                    disabled={workflowMode === 'ai-assisted' && combinedIsLoading}
                                  />
                                </FormControl>
                                <FormMessage />
                              </div>
                            </FormItem>
                          )}
                        />

                          {/* Support Level */}
                          <FormField
                            control={form.control}
                            name="support_level"
                            render={({ field }) => (
                              <FormItem>
                                <div className={cn(
                                  "rounded-lg border p-4 h-full flex flex-col justify-between transition-all duration-200",
                                  inputMode === 'chat' && extractedParameters.some(p => p.field === 'support_level') 
                                    ? 'border-[#c2f20e] bg-[#c2f20e]/5' 
                                    : ''
                                )}>
                                  <div>
                                    <div className="flex justify-between items-center mb-2">
                                      <FormLabel className="flex items-center gap-2">
                                        Support Level (mm)
                                        {inputMode === 'chat' && extractedParameters.some(p => p.field === 'support_level') && (
                                          <span className="text-xs bg-[#c2f20e] text-white px-1.5 py-0.5 rounded">AI</span>
                                        )}
                                      </FormLabel>
                                      <span className="text-sm tabular-nums">
                                        {field.value} mm
                                      </span>
                                    </div>
                                    <FormDescription className="mb-3">
                                      Distance from SSL to BSL (+ve above SSL)
                                    </FormDescription>
                                  </div>
                                  <FormControl>
                                    <Slider
                                      min={-600}
                                      max={500}
                                      step={5}
                                      value={[field.value]}
                                      onValueChange={(values) => field.onChange(values[0])}
                                      disabled={inputMode === 'chat' && isLoading}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </div>
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Characteristic Load Section */}
                        <div className="border-t pt-6 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Toggle */}
                            <div className="rounded-lg border p-4 h-full flex flex-col justify-between">
                              <div>
                                <div className="flex justify-between items-center mb-2">
                                  <Label htmlFor="use-characteristic-load" className="font-medium">Do you know your characteristic load?</Label>
                                  <Switch
                                    id="use-characteristic-load"
                                    checked={useCharacteristicLoad}
                                    onCheckedChange={setUseCharacteristicLoad}
                                  />
                                </div>
                                <p className="text-sm text-gray-500">
                                  Toggle to enter load directly or calculate it from masonry properties.
                                </p>
                              </div>
                            </div>
                            
                            {/* Conditional inputs */}
                            <div>
                              {useCharacteristicLoad ? (
                                <FormField
                                  control={form.control}
                                  name="characteristic_load"
                                  render={({ field }) => (
                                    <FormItem>
                                      <div className={cn(
                                        "rounded-lg border p-4 transition-all duration-200",
                                        inputMode === 'chat' && extractedParameters.some(p => p.field === 'characteristic_load') 
                                          ? 'border-[#c2f20e] bg-[#c2f20e]/5' 
                                          : ''
                                      )}>
                                        <FormLabel className="flex items-center gap-2">
                                          Characteristic Load (kN/m)
                                          {inputMode === 'chat' && extractedParameters.some(p => p.field === 'characteristic_load') && (
                                            <span className="text-xs bg-[#c2f20e] text-white px-1.5 py-0.5 rounded">AI</span>
                                          )}
                                        </FormLabel>
                                        <FormDescription className="mb-3">
                                          Enter if known (kN/m)
                                        </FormDescription>
                                        <FormControl>
                                          <Input
                                            type="number"
                                            placeholder="Enter characteristic load"
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
                                      </div>
                                    </FormItem>
                                  )}
                                />
                              ) : (
                                <div className="space-y-4">
                                  {/* Masonry Density */}
                                  <FormField
                                    control={form.control}
                                    name="masonry_density"
                                    render={({ field }) => (
                                      <FormItem>
                                        <div className="rounded-lg border p-4">
                                          <div className="flex justify-between items-center mb-2">
                                            <FormLabel>Masonry Density (kg/m³)</FormLabel>
                                            <span className="text-sm tabular-nums">
                                              {field.value} kg/m³
                                            </span>
                                          </div>
                                          <FormDescription className="mb-3">
                                            Enter the density of the masonry
                                          </FormDescription>
                                          <FormControl>
                                            <Slider
                                              min={1500}
                                              max={2500}
                                              step={10}
                                              value={[field.value]}
                                              onValueChange={(values) => field.onChange(values[0])}
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </div>
                                      </FormItem>
                                    )}
                                  />

                                  {/* Masonry Thickness */}
                                  <FormField
                                    control={form.control}
                                    name="masonry_thickness"
                                    render={({ field }) => (
                                      <FormItem>
                                        <div className="rounded-lg border p-4">
                                          <div className="flex justify-between items-center mb-2">
                                            <FormLabel>Masonry Thickness (mm)</FormLabel>
                                            <span className="text-sm tabular-nums">
                                              {field.value} mm
                                            </span>
                                          </div>
                                          <FormDescription className="mb-3">
                                            Enter the thickness of the masonry
                                          </FormDescription>
                                          <FormControl>
                                            <Slider
                                              min={50}
                                              max={250}
                                              step={0.5}
                                              value={[field.value]}
                                              onValueChange={(values) => field.onChange(values[0])}
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </div>
                                      </FormItem>
                                    )}
                                  />

                                  {/* Masonry Height */}
                                  <FormField
                                    control={form.control}
                                    name="masonry_height"
                                    render={({ field }) => (
                                      <FormItem>
                                        <div className="rounded-lg border p-4">
                                          <div className="flex justify-between items-center mb-2">
                                            <FormLabel>Masonry Height (m)</FormLabel>
                                            <span className="text-sm tabular-nums">
                                              {field.value} m
                                            </span>
                                          </div>
                                          <FormDescription className="mb-3">
                                            Enter the height of the masonry
                                          </FormDescription>
                                          <FormControl>
                                            <Slider
                                              min={1}
                                              max={10}
                                              step={0.1}
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
                        </div>
                        </div>

                        {/* Additional Settings - 2 Column Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Notch Toggle */}
                          <FormField
                            control={form.control}
                            name="has_notch"
                            render={({ field }) => (
                              <FormItem>
                                <div className="rounded-lg border p-4 h-full flex flex-col justify-between">
                                  <div>
                                    <div className="flex justify-between items-center mb-2">
                                      <FormLabel htmlFor="has-notch">Do you require a notch in the bracket?</FormLabel>
                                      <FormControl>
                                        <Switch
                                          id="has-notch"
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                        />
                                      </FormControl>
                                    </div>
                                    <FormDescription className="mb-3">
                                      Toggle if bracket needs a notch to avoid conflicts in the cavity
                                    </FormDescription>
                                  </div>
                                  <FormMessage />
                                </div>
                              </FormItem>
                            )}
                          />

                          {/* Channel Family Selection */}
                          <FormField
                            control={form.control}
                            name="channel_family"
                            render={({ field }) => (
                              <FormItem>
                                <div className="rounded-lg border p-4 h-full flex flex-col justify-between">
                                  <div>
                                    <div className="flex justify-between items-center mb-2">
                                      <FormLabel>Channel Family</FormLabel>
                                    </div>
                                    <FormDescription className="mb-3">
                                      Choose which channel families to include in optimization
                                    </FormDescription>
                                  </div>
                                  <FormControl>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="All channels" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="all">All channels</SelectItem>
                                        <SelectItem value="CPRO38">CPRO38 only</SelectItem>
                                        <SelectItem value="CPRO50">CPRO50 only</SelectItem>
                                        <SelectItem value="R-HPTIII-70">R-HPTIII-70 only</SelectItem>
                                        <SelectItem value="R-HPTIII-90">R-HPTIII-90 only</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                  <FormMessage />
                                </div>
                              </FormItem>
                            )}
                          />

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
                                        How deep does the notch extend into the bracket from the back?
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

                        {/* Fixing Position Optimization */}
                        <FormField
                          control={form.control}
                          name="enable_fixing_optimization"
                          render={({ field }) => (
                            <FormItem>
                              <div className="rounded-lg border p-4 h-full flex flex-col justify-between">
                                <div>
                                  <div className="flex justify-between items-center mb-2">
                                    <FormLabel htmlFor="enable-fixing-optimization" className="flex items-center gap-2">
                                      Optimize Fixing Position
                                      {form.watch('slab_thickness') > 250 && (
                                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-green-100 text-green-700">Recommended ≥ 250mm slabs</span>
                                      )}
                                    </FormLabel>
                                    <FormControl>
                                      <Switch
                                        id="enable-fixing-optimization"
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                  </div>
                                  <FormDescription className="mb-3">
                                    Allows the optimizer to lower the fixing point below 75mm from slab top in 5mm steps, while maintaining minimum bottom edge distance and ≥95mm rise to bolts. Useful on thicker slabs to reduce bracket height and weight.
                                  </FormDescription>
                                  <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                                    <span className="text-sm text-gray-600">Starting fixing position</span>
                                    <span className="text-sm font-semibold font-mono">{form.watch('fixing_position') ?? 75} mm</span>
                                  </div>
                                </div>
                                <FormMessage />
                              </div>
                            </FormItem>
                          )}
                        />

                          {/* Angle Length Limitation Toggle */}
                          <FormField
                            control={form.control}
                            name="is_angle_length_limited"
                            render={({ field }) => (
                              <FormItem>
                                <div className="rounded-lg border p-4 h-full flex flex-col justify-between">
                                  <div>
                                    <div className="flex justify-between items-center mb-2">
                                      <FormLabel htmlFor="is-angle-length-limited">Is there a limit to the angle length?</FormLabel>
                                      <FormControl>
                                        <Switch
                                          id="is-angle-length-limited"
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                        />
                                      </FormControl>
                                    </div>
                                    <FormDescription className="mb-3">
                                      Toggle if you have a fixed angle length due to site constraints
                                    </FormDescription>
                                  </div>
                                  <FormMessage />
                                </div>
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Fixed Angle Length - Conditional Field */}
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
