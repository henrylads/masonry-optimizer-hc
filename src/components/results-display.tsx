"use client"

import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { Check, X, AlertTriangle, TrendingUp, Zap, Target, Scale, Leaf, Ruler, Settings, Wrench, Box, Edit3, Save, XCircle, RotateCcw, Loader2, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShapeDiverCard, ShapeDiverOutputs } from './shapediver'
import { Button } from "@/components/ui/button"
import type { OptimisationResult, GenerationSummary } from '@/types/optimization-types'
import { calculateBracketPositioning } from '@/calculations/angleLayout';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { verifyWithModifiedParameters, type ParameterVerificationResult, type ModifiedParameters } from '@/calculations/parameterVerification'
import { DesignComparison } from './design-comparison'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectLabel,
} from "@/components/ui/select"
import { PDFDownloadButton } from '@/components/pdf-download-button'
import { FormDataType } from '@/types/form-schema'

interface ResultsDisplayProps {
  result: OptimisationResult | null
  history: GenerationSummary[]
  designInputs?: FormDataType // Optional for backward compatibility
}

export function ResultsDisplay({ result, history, designInputs }: ResultsDisplayProps) {
  // Add a reference to track if we've logged success
  const didLogSuccessRef = useRef(false);
  
  // State to store ShapeDiver outputs
  const [shapeDiverOutputs, setShapeDiverOutputs] = useState<ShapeDiverOutputs>({});

  // Alternative design selection state
  const [selectedDesignIndex, setSelectedDesignIndex] = useState<number>(0); // 0 = optimal design
  const [displayedResult, setDisplayedResult] = useState<OptimisationResult | null>(result);

  // Parameter editing state
  const [editingParam, setEditingParam] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({
    bracket_centres: result?.genetic?.bracket_centres ?? 0,
    bracket_thickness: result?.genetic?.bracket_thickness ?? 0,
    angle_thickness: result?.genetic?.angle_thickness ?? 0,
    bolt_diameter: result?.genetic?.bolt_diameter ?? 0,
  });

  // Verification state
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<ParameterVerificationResult | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  // Callback to receive ShapeDiver outputs - NOW PROPERLY MEMOIZED
  const handleShapeDiverOutputs = useCallback((outputs: ShapeDiverOutputs) => {
    console.log("Received ShapeDiver outputs:", outputs);
    setShapeDiverOutputs(outputs);
  }, []); // Empty dependency array since setShapeDiverOutputs is stable

  // Helper function to check if a parameter has been modified from original
  const isParameterModified = useCallback((paramName: string): boolean => {
    if (!result?.genetic) return false;
    
    const originalValue = result.genetic[paramName as keyof typeof result.genetic];
    const currentValue = editValues[paramName as keyof typeof editValues];
    
    return originalValue !== currentValue;
  }, [result?.genetic, editValues]);

  // Get the original value for a parameter
  const getOriginalValue = useCallback((paramName: string): number => {
    if (!result?.genetic) return 0;
    return result.genetic[paramName as keyof typeof result.genetic] as number ?? 0;
  }, [result?.genetic]);

  // Parameter editing functions
  const startEditing = (paramName: string) => {
    setEditingParam(paramName);
  };

  const cancelEditing = () => {
    setEditingParam(null);
    // Reset values to original
    setEditValues({
      bracket_centres: result?.genetic?.bracket_centres ?? 0,
      bracket_thickness: result?.genetic?.bracket_thickness ?? 0,
      angle_thickness: result?.genetic?.angle_thickness ?? 0,
      bolt_diameter: result?.genetic?.bolt_diameter ?? 0,
    });
  };

  // Function to run verification with modified parameters
  const runVerification = useCallback(async (modifiedParams: ModifiedParameters) => {
    if (!result) return;

    setIsVerifying(true);
    setVerificationError(null);

    try {
      const verificationResult = await verifyWithModifiedParameters(
        result,
        modifiedParams,
        false, // isLengthLimited - could be made configurable
        undefined // fixedLength
      );

      setVerificationResult(verificationResult);
      
      if (verificationResult.errors && verificationResult.errors.length > 0) {
        setVerificationError(verificationResult.errors.join('; '));
      }

      console.log('Verification completed:', verificationResult);
    } catch (error) {
      console.error('Verification failed:', error);
      setVerificationError(`Verification failed: ${error}`);
    } finally {
      setIsVerifying(false);
    }
  }, [result]);

  const saveEdit = useCallback(async () => {
    console.log('Saving edited parameters:', editValues);
    setEditingParam(null);

    // Check if any parameters have actually changed
    const hasChanges = Object.keys(editValues).some(key => 
      isParameterModified(key)
    );

    if (hasChanges && result) {
      // Run verification with the modified parameters
      const modifiedParams: ModifiedParameters = {
        bracket_centres: editValues.bracket_centres,
        bracket_thickness: editValues.bracket_thickness,
        angle_thickness: editValues.angle_thickness,
        bolt_diameter: editValues.bolt_diameter,
      };

      await runVerification(modifiedParams);
    }
  }, [editValues, result, runVerification, isParameterModified]);

  const handleInputChange = (paramName: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) || value === '') {
      setEditValues(prev => ({
        ...prev,
        [paramName]: numValue || 0
      }));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, paramName: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const validation = validateInput(paramName, editValues[paramName as keyof typeof editValues]);
      if (validation.isValid) {
        saveEdit();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditing();
    }
  };



  const getParameterConstraints = (paramName: string) => {
    switch (paramName) {
      case 'bracket_centres':
        return {
          min: 200,
          max: 600, // Max 600mm, or 500mm for loads > 5kN/m
          step: 50,  // Must be in 50mm increments only
          unit: 'mm',
          description: 'Distance between bracket centers',
          engineeringNote: 'Must be in 50mm increments. Max 500mm for loads > 5kN/m',
          validValues: [200, 250, 300, 350, 400, 450, 500, 550, 600]
        };
      case 'bracket_thickness':
        return {
          min: 3,
          max: 4,
          step: 1,
          unit: 'mm',
          description: 'Thickness of steel bracket plate',
          engineeringNote: '3mm default, 4mm required if shear load > 4kN per bracket',
          validValues: [3, 4] // Only 3mm or 4mm allowed
        };
      case 'angle_thickness':
        return {
          min: 3,
          max: 12,
          step: 1,
          unit: 'mm',
          description: 'Thickness of angle steel section',
          engineeringNote: 'Based on standard steel sheet sizes only',
          validValues: [3, 4, 5, 6, 8, 10, 12] // Discrete steel sheet sizes only
        };
      case 'bolt_diameter':
        return {
          min: 10,
          max: 12,
          step: 2,
          unit: 'mm',
          description: 'Diameter of fixing bolt',
          engineeringNote: 'M10 standard, M12 only if M10 solution not found',
          validValues: [10, 12], // M10 (10mm) or M12 (12mm) only
          labels: ['M10', 'M12'] // Display labels
        };
      default:
        return { min: 0, max: 1000, step: 1, unit: 'mm', description: '', engineeringNote: '', validValues: [] };
    }
  };

  const validateInput = (paramName: string, value: number): { isValid: boolean; error: string | null; warning: string | null } => {
    const constraints = getParameterConstraints(paramName);
    
    // Check if value is a number
    if (isNaN(value)) {
      return { isValid: false, error: 'Please enter a valid number', warning: null };
    }

    // For parameters with validValues, check against those instead of min/max/step
    if (constraints.validValues && constraints.validValues.length > 0) {
      if (!constraints.validValues.includes(value)) {
        const validValuesStr = constraints.validValues.join(', ');
        return { 
          isValid: false, 
          error: `Value must be one of: ${validValuesStr}${constraints.unit}`, 
          warning: null 
        };
      }
    } else {
      // Fallback to traditional min/max/step validation for parameters without validValues
      if (value < constraints.min) {
        return { 
          isValid: false, 
          error: `Minimum value is ${constraints.min}${constraints.unit}`, 
          warning: null 
        };
      }

      if (value > constraints.max) {
        return { 
          isValid: false, 
          error: `Maximum value is ${constraints.max}${constraints.unit}`, 
          warning: null 
        };
      }

      // Check step validation
      const remainder = (value - constraints.min) % constraints.step;
      if (Math.abs(remainder) > 0.001 && Math.abs(remainder - constraints.step) > 0.001) {
        return { 
          isValid: false, 
          error: `Value must be in increments of ${constraints.step}${constraints.unit}`, 
          warning: null 
        };
      }
    }

    // Engineering-specific validation and warnings
    switch (paramName) {
      case 'bracket_centres':
        if (value > 500) {
          return { 
            isValid: true, 
            error: null, 
            warning: 'For loads > 5kN/m, maximum spacing should be 500mm' 
          };
        }
        if (value > 450) {
          return { 
            isValid: true, 
            error: null, 
            warning: 'Large spacing may increase deflection - verify structural performance' 
          };
        }
        break;
      case 'bracket_thickness':
        if (value === 3) {
          return { 
            isValid: true, 
            error: null, 
            warning: '3mm thickness requires shear load ≤ 4kN per bracket' 
          };
        }
        break;
      case 'angle_thickness':
        if (value <= 4) {
          return { 
            isValid: true, 
            error: null, 
            warning: 'Thin angles may require closer bracket spacing' 
          };
        }
        break;
      case 'bolt_diameter':
        if (value === 12) {
          return { 
            isValid: true, 
            error: null, 
            warning: 'M12 bolts used when M10 solution not feasible' 
          };
        }
        break;
    }

    return { isValid: true, error: null, warning: null };
  };

  // Define the shape of ShapeDiver parameters
  type ShapeDiverParams = Partial<Record<
    'support_type' | 'bracket_thickness' | 'bracket_length' |
    'back_notch_height' | 'fixing_diameter' |
    'back_notch_length' | 'toe_plate_type' | 'back_notch_option' |
    'bracket_height' | 'angle_length' | 'bracket_count' | 'bracket_spacing' |
    'start_offset' | 'spacing_gap' | 'bracket_material_grade' | 'angle_material_grade' |
    'angle_type' | 'profile_thickness' | 'profile_length' | 'profile_height' | 'slab_thickness' | 'fixing_position',
    string | number | boolean
  >>;

  // Create the parameter object with useMemo to avoid recreating on every render
  const shapeDiverParams = useMemo(() => {
    console.log("📊 ResultsDisplay: shapeDiverParams recalculating due to result change");
    if (!displayedResult) {
      console.log("📊 ResultsDisplay: No displayedResult, returning empty params");
      return {};
    }

    console.log("📊 ResultsDisplay: Creating params from displayedResult:", displayedResult);
    // Base parameters
    const params: ShapeDiverParams = {
      bracket_thickness: displayedResult.genetic?.bracket_thickness ?? 3,
      fixing_diameter: displayedResult.genetic?.bolt_diameter ?? 10,
      bracket_length: displayedResult.calculated?.bracket_projection ?? 150,
      bracket_height: (() => {
        // Use limited bracket height if angle extension was applied
        const angleExtension = displayedResult?.calculated?.angle_extension_result;
        if (angleExtension?.extension_applied) {
          return angleExtension.limited_bracket_height;
        }
        // Otherwise use the original bracket height
        return displayedResult.calculated?.bracket_height ?? 150;
      })(),
      slab_thickness: displayedResult.calculated?.slab_thickness ?? 225,

      // Dim D parameters - ONLY for inverted brackets
      // ShapeDiver needs BOTH boolean override AND numeric value
      ...(() => {
        const bracketType = displayedResult.calculated?.bracket_type ?? displayedResult.genetic?.bracket_type;

        // Only include dim_d parameters for inverted brackets
        if (bracketType === 'Inverted') {
          const dimDValue = displayedResult.calculated?.dim_d ?? displayedResult.genetic?.dim_d ?? 130;
          return {
            // Boolean override: Enable override if we have a custom dim_d value different from default (130mm)
            dim_d: dimDValue > 130, // Enable override if value is greater than default minimum
            // Numeric Dim D value: The actual calculated Dim D value to use when override is enabled
            dim_d_value: dimDValue
          };
        }

        // For standard brackets, don't include dim_d parameters at all
        return {};
      })(),

      // Fixing position - distance from top of slab to fixing point
      // Adjusted for exclusion zone constraints to ensure bracket top stays within limits
      fixing_position: (() => {
        const optimizedPos = displayedResult.calculated?.optimized_fixing_position;
        const geneticPos = displayedResult.genetic?.fixing_position;
        const baseFixingPos = optimizedPos ?? geneticPos ?? 75;

        // Check if exclusion zone constraints are active
        const angleExtension = displayedResult?.calculated?.angle_extension_result;
        const hasExclusionZone = angleExtension?.extension_applied && angleExtension?.max_extension_limit !== null;

        if (hasExclusionZone) {
          const exclusionLimit = angleExtension!.max_extension_limit;
          const heightAboveSSL = displayedResult.calculated?.height_above_ssl ?? 0;

          // For exclusion zones at or above slab top (≥ 0mm), adjust fixing position
          // to ensure bracket top doesn't exceed the exclusion limit
          if (exclusionLimit >= 0) {
            // Calculate required adjustment to position bracket top at exclusion limit
            // For inverted brackets: bracket_top = slab_top - height_above_ssl_effective
            // We want: bracket_top ≤ exclusion_limit (from slab top)
            // So: -height_above_ssl_effective ≤ exclusion_limit
            // Therefore: height_above_ssl_effective ≥ -exclusion_limit

            // With exclusion zone constraints, height_above_ssl should be limited to exclusion_limit
            const effectiveHeightAboveSSL = Math.min(heightAboveSSL, exclusionLimit);

            // Adjust fixing position to account for reduced height above SSL
            const heightReduction = heightAboveSSL - effectiveHeightAboveSSL;
            const adjustedFixingPos = baseFixingPos + heightReduction;

            console.log(`🔧 ShapeDiver fixing_position (exclusion zone adjusted):`, {
              baseFixingPos,
              exclusionLimit,
              heightAboveSSL,
              effectiveHeightAboveSSL,
              heightReduction,
              adjustedFixingPos,
              explanation: `Adjusted for ${exclusionLimit}mm exclusion zone`
            });

            return adjustedFixingPos;
          }
        }

        console.log(`🔧 ShapeDiver fixing_position: optimized=${optimizedPos}mm, genetic=${geneticPos}mm, final=${baseFixingPos}mm`);
        return baseFixingPos;
      })(),
      
      back_notch_height: Math.max(10, displayedResult.calculated?.detailed_verification_results?.droppingBelowSlabResults?.H_notch ?? 25),
      back_notch_length: Math.max(10, 25), // Default notch depth
      back_notch_option: ((displayedResult.calculated?.detailed_verification_results?.droppingBelowSlabResults?.H_notch ?? 0) > 0),
      
      // Material grades - use separate parameters for bracket and angle
      bracket_material_grade: '316',
      angle_material_grade: '316',
      
      // Support type from calculation results, with fallback to 'Standard'
      support_type: displayedResult.calculated?.bracket_type === 'Inverted' ? 'Inverted' : 'Standard',
      toe_plate_type: 'Standard',
      
      // Angle-specific parameters from genetic results
      angle_type: displayedResult.genetic?.angle_orientation || 'Standard', // Use actual angle orientation from genetic results
      profile_thickness: displayedResult.genetic?.angle_thickness ?? 4,
      profile_length: displayedResult.genetic?.horizontal_leg ?? 75,  // Horizontal leg of angle
      profile_height: (() => {
        // Use extended angle height if angle extension was applied
        const angleExtension = displayedResult?.calculated?.angle_extension_result;
        if (angleExtension?.extension_applied) {
          return angleExtension.extended_angle_height;
        }
        // Otherwise use the original vertical leg
        return displayedResult.genetic?.vertical_leg ?? 60;
      })(),   // Vertical leg of angle (potentially extended)
      
      // Add bracket positioning parameters if available
      ...(displayedResult.calculated?.bracketLayout && {
        angle_length: displayedResult.calculated.bracketLayout.angleLength,
        bracket_count: displayedResult.calculated.bracketLayout.bracketCount,
        bracket_spacing: displayedResult.calculated.bracketLayout.spacing,
        start_offset: displayedResult.calculated.bracketLayout.startOffset,
        spacing_gap: 10 // Default gap between angles
      })
    };

    // Check if we have bracket layout parameters
    if (!params.angle_length || !params.bracket_count) {
      // If bracketLayout is not available, calculate it directly
      try {
        const bracketLayout = calculateBracketPositioning({
          isLengthLimited: false,
          centerToCenter: displayedResult.genetic?.bracket_centres || 300,
        });
        
        console.log("Generated fallback bracket layout:", bracketLayout);
        
        // Create a new object with all existing params plus the bracket layout
        return {
          ...params,
          angle_length: bracketLayout.angleLength,
          bracket_count: bracketLayout.bracketCount,
          bracket_spacing: bracketLayout.spacing,
          start_offset: bracketLayout.startOffset,
          spacing_gap: 10 // Default gap
        };
      } catch (error) {
        console.error("Failed to generate fallback bracket layout:", error);
      }
    }

    return params;
  }, [displayedResult]);  // Only recalculate when displayedResult changes

  // Effect to log when the component renders with ShapeDiver parameters
  useEffect(() => {
    if (result && !didLogSuccessRef.current) {
      console.log("ResultsDisplay rendering with data:", { 
        bracketLayout: result.calculated?.bracketLayout,
        shapeDiverParams
      });
      didLogSuccessRef.current = true;
    }
  }, [result, shapeDiverParams]);

  // Add more detailed debugging for ShapeDriver parameters
  useEffect(() => {
    if (result && shapeDiverParams) {
      console.log("🔍 ShapeDriver Debug Info:");
      console.log("- Has result:", !!result);
      console.log("- Has shapeDiverParams:", !!shapeDiverParams);
      console.log("- shapeDiverParams keys:", Object.keys(shapeDiverParams));
      console.log("- shapeDiverParams values:", shapeDiverParams);
      console.log("- Result structure:");
      console.log("  - genetic:", result.genetic ? Object.keys(result.genetic) : 'missing');
      console.log("  - calculated:", result.calculated ? Object.keys(result.calculated) : 'missing');
      console.log("  - bracketLayout:", result.calculated?.bracketLayout);
    }
  }, [result, shapeDiverParams]);

  // Update edit values when result changes
  useEffect(() => {
    if (result) {
      setEditValues({
        bracket_centres: result.genetic?.bracket_centres ?? 0,
        bracket_thickness: result.genetic?.bracket_thickness ?? 0,
        angle_thickness: result.genetic?.angle_thickness ?? 0,
        bolt_diameter: result.genetic?.bolt_diameter ?? 0,
      });
    }
  }, [result]);

  // Handle design selection changes
  useEffect(() => {
    if (!result) return;
    
    if (selectedDesignIndex === 0) {
      // Show the optimal design
      setDisplayedResult(result);
    } else if (result.alternatives && result.alternatives[selectedDesignIndex - 1]) {
      // Show the selected alternative design
      const alternative = result.alternatives[selectedDesignIndex - 1];
      // Create a new result object with the alternative design data
      const alternativeResult: OptimisationResult = {
        genetic: alternative.design.genetic,
        calculated: alternative.design.calculated,
        verificationSteps: result.verificationSteps,
        alternatives: result.alternatives
      };
      setDisplayedResult(alternativeResult);
    }
    
    // Update edit values for the new design
    const currentDesign = selectedDesignIndex === 0 ? result : 
      (result.alternatives?.[selectedDesignIndex - 1]?.design || result);
    
    setEditValues({
      bracket_centres: currentDesign.genetic?.bracket_centres ?? 0,
      bracket_thickness: currentDesign.genetic?.bracket_thickness ?? 0,
      angle_thickness: currentDesign.genetic?.angle_thickness ?? 0,
      bolt_diameter: currentDesign.genetic?.bolt_diameter ?? 0,
    });
  }, [selectedDesignIndex, result]);

  // Inline editing component
  const InlineEditParameter = ({ 
    paramName, 
    label, 
    value, 
    unit = 'mm' 
  }: { 
    paramName: string; 
    label: string; 
    value: number | string; 
    unit?: string;
  }) => {
    const isEditing = editingParam === paramName;
    const editValue = editValues[paramName as keyof typeof editValues];
    const constraints = getParameterConstraints(paramName);
    const validation = editValue ? validateInput(paramName, editValue) : { isValid: true, error: null, warning: null };
    const isModified = isParameterModified(paramName);
    const originalValue = getOriginalValue(paramName);

    if (isEditing) {
      return (
        <div 
          className={`relative flex justify-between items-center py-2 px-3 rounded border-2 ${
            validation.isValid 
              ? 'border-blue-300 bg-blue-50' 
              : 'border-red-300 bg-red-50'
          }`}
          role="group"
          aria-labelledby={`label-${paramName}`}
          aria-describedby={`description-${paramName}`}
        >
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  <span 
                    id={`label-${paramName}`}
                    className="text-sm text-gray-600 cursor-help"
                  >
                    {label}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <div className="space-y-1">
                  <p className="font-medium">{constraints.description}</p>
                  <p className="text-xs">Range: {constraints.min}-{constraints.max}{constraints.unit}</p>
                  <p className="text-xs">Step: {constraints.step}{constraints.unit}</p>
                  <p className="text-xs text-gray-400">{constraints.engineeringNote}</p>
                  {isModified && (
                    <div className="pt-1 border-t border-amber-200">
                      <p className="text-xs text-amber-600 font-medium">
                        Original: {originalValue}{unit}
                      </p>
                      <p className="text-xs text-amber-600">
                        Current: {editValue}{unit}
                      </p>
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={editValue || ''}
                onChange={(e) => handleInputChange(paramName, e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, paramName)}
                className={`w-20 h-8 text-sm font-mono ${
                  validation.isValid ? 'border-blue-300' : 'border-red-300'
                }`}
                min={constraints.min}
                max={constraints.max}
                step={constraints.step}
                autoFocus
                aria-label={`Edit ${label.toLowerCase()}`}
                aria-describedby={`description-${paramName} ${validation.error ? `error-${paramName}` : ''} ${validation.warning ? `warning-${paramName}` : ''}`}
                aria-invalid={!validation.isValid}
              />
              <span className="text-sm text-gray-500" aria-hidden="true">{unit}</span>
            </div>
            <div className="flex flex-col gap-1" role="group" aria-label="Edit controls">
              <div className="flex items-center gap-1">
                <button 
                  className="p-1 hover:bg-green-200 rounded text-green-600 hover:text-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Save changes (Enter)"
                  onClick={saveEdit}
                  disabled={!validation.isValid || isVerifying}
                  aria-label={`Save changes to ${label.toLowerCase()}`}
                  tabIndex={0}
                >
                  {isVerifying ? (
                    <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                  ) : (
                    <Save className="h-3 w-3" aria-hidden="true" />
                  )}
                </button>
                <button 
                  className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1"
                  title="Cancel editing (Escape)"
                  onClick={cancelEditing}
                  aria-label={`Cancel editing ${label.toLowerCase()}`}
                  tabIndex={0}
                >
                  <XCircle className="h-3 w-3" aria-hidden="true" />
                </button>
              </div>
              {isModified && (
                <div className="flex justify-center">
                  <button 
                    className="p-1 hover:bg-amber-200 rounded text-amber-600 hover:text-amber-700 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1"
                    title="Reset to original value"
                    onClick={() => handleInputChange(paramName, originalValue.toString())}
                    aria-label={`Reset ${label.toLowerCase()} to original value of ${originalValue}${unit}`}
                    tabIndex={0}
                  >
                    <RotateCcw className="h-3 w-3" aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          </div>
          <div 
            id={`description-${paramName}`} 
            className="sr-only"
          >
            {constraints.description}. Valid range: {constraints.min} to {constraints.max} {constraints.unit}. {constraints.engineeringNote}
            {isModified && ` Current value: ${editValue}${unit}. Original value: ${originalValue}${unit}.`}
          </div>
          {(validation.error || validation.warning) && (
            <div 
              className="absolute left-0 top-full mt-1 p-2 bg-white border rounded shadow-lg z-10 min-w-64"
              role="alert"
              aria-live="polite"
            >
              {validation.error && (
                <p 
                  id={`error-${paramName}`}
                  className="text-sm text-red-600 flex items-center gap-1"
                  role="alert"
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                  {validation.error}
                </p>
              )}
              {validation.warning && (
                <p 
                  id={`warning-${paramName}`}
                  className="text-sm text-amber-600 flex items-center gap-1"
                  role="alert"
                >
                  <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                  {validation.warning}
                </p>
              )}
            </div>
          )}
        </div>
      );
    }

    return (
      <div 
        className={`flex justify-between items-center py-2 px-3 rounded ${
          isModified 
            ? 'bg-amber-50 border border-amber-200' 
            : 'bg-gray-50'
        }`}
        role="group"
        aria-labelledby={`display-label-${paramName}`}
        aria-describedby={`display-description-${paramName}`}
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2">
                <span 
                  id={`display-label-${paramName}`}
                  className="text-sm text-gray-600 cursor-help"
                >
                  {label}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              <div className="space-y-1">
                <p className="font-medium">{constraints.description}</p>
                <p className="text-xs">Range: {constraints.min}-{constraints.max}{constraints.unit}</p>
                <p className="text-xs">Step: {constraints.step}{constraints.unit}</p>
                <p className="text-xs text-gray-400">{constraints.engineeringNote}</p>
                {isModified && (
                  <div className="pt-1 border-t border-amber-200">
                    <p className="text-xs text-amber-600 font-medium">
                      Original: {originalValue}{unit}
                    </p>
                    <p className="text-xs text-amber-600">
                      Current: {editValue}{unit}
                    </p>
                  </div>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <span 
              className={`text-sm font-semibold font-mono ${
                isModified ? 'text-amber-700' : ''
              }`}
              aria-label={`Current value: ${editValue || value} ${unit}`}
            >
              {editValue || value} {unit}
            </span>
            {isModified && (
              <div className="flex items-center gap-1" aria-label={`Original value was ${originalValue}${unit}`}>
                <span className="text-xs text-gray-400" aria-hidden="true">was</span>
                <span className="text-xs text-gray-500 line-through" aria-hidden="true">
                  {originalValue}{unit}
                </span>
              </div>
            )}
          </div>
          <button 
            className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            title={`Edit ${label.toLowerCase()} (${constraints.min}-${constraints.max}${constraints.unit})`}
            onClick={() => startEditing(paramName)}
            aria-label={`Edit ${label.toLowerCase()}. Current value is ${editValue || value} ${unit}. Valid range: ${constraints.min} to ${constraints.max} ${constraints.unit}`}
            tabIndex={0}
          >
            <Edit3 className="h-3 w-3" aria-hidden="true" />
          </button>
        </div>
        <div 
          id={`display-description-${paramName}`} 
          className="sr-only"
        >
          {constraints.description}. Current value: {editValue || value} {unit}. 
          {isModified ? `Modified from original value of ${originalValue}${unit}. ` : ''}
          Valid range: {constraints.min} to {constraints.max} {constraints.unit}. {constraints.engineeringNote}
        </div>
      </div>
    );
  };

  if (!result) {
    return <div>Loading results...</div>;
  }

  const allChecksPass = displayedResult?.calculated?.all_checks_pass ?? 
    displayedResult?.calculated?.detailed_verification_results?.passes ?? 
    (displayedResult?.calculated ? Object.entries(displayedResult.calculated)
      .filter(([key]) => key.endsWith("_check"))
      .every(([, value]) => value === true) : false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Optimisation Results</h2>
        <div className="flex space-x-4">
          <Button variant="outline" onClick={() => window.print()}>
            Print Results
          </Button>
          {result && result.calculated?.detailed_verification_results && (
            <PDFDownloadButton
              optimizationResult={result}
              designInputs={designInputs || {} as FormDataType} // Use empty object if not available
              variant="outline"
              disabled={!designInputs} // Disable if no design inputs available
            />
          )}
        </div>
      </div>

      {/* Hero Section - Key Results Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Total Weight</p>
                <p className="text-2xl font-bold text-green-900">
                  {displayedResult?.calculated?.weights?.totalWeight?.toFixed(1) ?? '---'} kg/m
                </p>
              </div>
              <Scale className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Configuration</p>
                <p className="text-lg font-bold text-blue-900">
                  {displayedResult?.genetic?.bracket_type} / {displayedResult?.genetic?.angle_orientation}
                </p>
              </div>
              <Settings className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Bracket Centers</p>
                <p className="text-2xl font-bold text-purple-900">
                  {displayedResult?.genetic?.bracket_centres} mm
                </p>
              </div>
              <Ruler className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className={allChecksPass ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{color: allChecksPass ? '#16a34a' : '#dc2626'}}>
                  Verification Status
                </p>
                <p className="text-lg font-bold" style={{color: allChecksPass ? '#166534' : '#991b1b'}}>
                  {allChecksPass ? 'All Checks Pass' : 'Checks Failed'}
                </p>
              </div>
              {allChecksPass ? (
                <CheckCircle className="h-8 w-8 text-green-600" />
              ) : (
                <X className="h-8 w-8 text-red-600" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Important Alerts */}
      {result?.alerts && result.alerts.length > 0 && (
        <Card className="border-amber-300 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-5 w-5" />
              Important Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {result.alerts.map((alert, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-amber-100 border border-amber-300 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-amber-800">{alert}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Section - 2 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Design Parameters (1/3) */}
        <div className="lg:col-span-1 space-y-4">
          {/* Design Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                Design Parameters
                {(() => {
                  const init = displayedResult?.calculated?.initial_weight;
                  const opt = displayedResult?.calculated?.optimal_design_weight;
                  if (typeof init === 'number' && typeof opt === 'number' && init > 0 && opt <= init) {
                    const pct = Math.round(((init - opt) / init) * 100);
                    return (
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">-{pct}% weight</span>
                    );
                  }
                  return null;
                })()}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                <span className="text-sm text-gray-600">Bracket Height</span>
                <span className="text-sm font-semibold font-mono">{displayedResult?.calculated?.bracket_height ?? "N/A"} mm</span>
              </div>
              <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                <span className="text-sm text-gray-600">Bracket Projection</span>
                <span className="text-sm font-semibold font-mono">{displayedResult?.calculated?.bracket_projection ?? "N/A"} mm</span>
              </div>
              <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                <span className="text-sm text-gray-600">Rise to Bolts</span>
                <span className="text-sm font-semibold font-mono">{displayedResult?.calculated?.rise_to_bolts_display ?? displayedResult?.calculated?.rise_to_bolts ?? "N/A"} mm</span>
              </div>
              {/* Show Dim D only for inverted brackets */}
              {(displayedResult?.genetic?.bracket_type === 'Inverted' || displayedResult?.calculated?.bracket_type === 'Inverted') && (
                <div className="flex justify-between items-center py-2 px-3 bg-blue-50 rounded">
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    Dim D
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="text-xs text-blue-600 cursor-help">ⓘ</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Distance from bracket bottom to fixing point (130-450mm range)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </span>
                  <span className="text-sm font-semibold font-mono">{displayedResult?.calculated?.dim_d ?? displayedResult?.genetic?.dim_d ?? "130"} mm</span>
                </div>
              )}
              <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                <span className="text-sm text-gray-600">Fixing Position</span>
                <span className="text-sm font-semibold font-mono flex items-center gap-2">
                  {(() => {
                    const optimizedPos = displayedResult?.calculated?.optimized_fixing_position;
                    const geneticPos = displayedResult?.genetic?.fixing_position;
                    const val = optimizedPos ?? geneticPos ?? 75;

                    // Debug logging for results display
                    console.log('🔧 Results Display Debug:', {
                      optimized_fixing_position: optimizedPos,
                      genetic_fixing_position: geneticPos,
                      final_displayed_value: val,
                      fallback_used: optimizedPos ? 'optimized' : geneticPos ? 'genetic' : 'default_75'
                    });

                    return <>{val} mm</>;
                  })()}
                  {(() => {
                    const optPos = displayedResult?.calculated?.optimized_fixing_position;
                    if (typeof optPos === 'number' && optPos > 75) {
                      return <span className="text-[11px] px-1.5 py-0.5 rounded bg-green-100 text-green-700">Optimized</span>;
                    }
                    return null;
                  })()}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                <span className="text-sm text-gray-600">Bracket Thickness</span>
                <span className="text-sm font-semibold font-mono">{displayedResult?.genetic?.bracket_thickness ?? "N/A"} mm</span>
              </div>
              <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                <span className="text-sm text-gray-600">Angle Thickness</span>
                <span className="text-sm font-semibold font-mono">{displayedResult?.genetic?.angle_thickness ?? "N/A"} mm</span>
              </div>
              <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                <span className="text-sm text-gray-600">Vertical Leg</span>
                <span className="text-sm font-semibold font-mono flex items-center gap-2">
                  {(() => {
                    // Show effective vertical leg accounting for angle extension
                    const angleExtension = displayedResult?.calculated?.angle_extension_result;
                    if (angleExtension?.extension_applied) {
                      return angleExtension.extended_angle_height;
                    }
                    return displayedResult?.genetic?.vertical_leg ?? "N/A";
                  })()} mm
                  {(() => {
                    // Check if angle extension was applied
                    const angleExtension = displayedResult?.calculated?.angle_extension_result;
                    if (angleExtension?.extension_applied) {
                      return (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <span className="text-[11px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">Extended</span>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <p>Angle height extended by {angleExtension.angle_extension}mm due to bracket limit</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    }
                    return null;
                  })()}
                </span>
              </div>

              {/* Angle Extension Information */}
              {(() => {
                const angleExtension = displayedResult?.calculated?.angle_extension_result;
                if (angleExtension?.extension_applied) {
                  return (
                    <div className="space-y-2 p-3 bg-blue-50 border border-blue-200 rounded">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">Angle Extension Applied</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-blue-600">Original Bracket Height:</span>
                          <span className="font-mono">{angleExtension.original_bracket_height} mm</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-600">Limited Bracket Height:</span>
                          <span className="font-mono">{angleExtension.limited_bracket_height} mm</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-600">Bracket Reduction:</span>
                          <span className="font-mono text-red-600">-{angleExtension.bracket_reduction} mm</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-600">Angle Extension:</span>
                          <span className="font-mono text-green-600">+{angleExtension.angle_extension} mm</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-600">Original Angle Height:</span>
                          <span className="font-mono">{angleExtension.original_angle_height} mm</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-600">Extended Angle Height:</span>
                          <span className="font-mono">{angleExtension.extended_angle_height} mm</span>
                        </div>
                      </div>
                      <p className="text-xs text-blue-700 mt-2">
                        Bracket extension was limited to {angleExtension.max_extension_limit}mm.
                        The angle height was extended to compensate and maintain structural support.
                      </p>
                    </div>
                  );
                }
                return null;
              })()}

              <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                <span className="text-sm text-gray-600">Bolt Diameter</span>
                <span className="text-sm font-semibold font-mono">{displayedResult?.genetic?.bolt_diameter ?? "N/A"} mm</span>
              </div>
            </CardContent>
          </Card>

          {/* Verification Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Verification Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { name: "Moment Resistance", check: displayedResult?.calculated?.moment_resistance_check },
                  { name: "Shear Resistance", check: displayedResult?.calculated?.shear_resistance_check },
                  { name: "Angle Deflection", check: displayedResult?.calculated?.angle_deflection_check },
                  { name: "Bracket Connection", check: displayedResult?.calculated?.bracket_connection_check },
                  { name: "Fixing", check: displayedResult?.calculated?.fixing_check },
                  { name: "Combined Tension/Shear", check: displayedResult?.calculated?.combined_tension_shear_check }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-1">
                    <span className="text-sm">{item.name}</span>
                    {item.check ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                ))}

                {/* Angle Extension Notice */}
                {(() => {
                  const usesExtendedGeometry = displayedResult?.verification?.uses_extended_geometry;
                  if (usesExtendedGeometry) {
                    return (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">Extended Geometry Applied</span>
                        </div>
                        <p className="text-xs text-blue-700 mt-1">
                          This design uses modified geometry due to bracket extension limits.
                          All verification checks account for the extended angle height.
                        </p>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - 3D Visualization (2/3) */}
        <div className="lg:col-span-2">
          {displayedResult && shapeDiverParams ? (
            <ShapeDiverCard 
              key="shapediver-main"
              initialParameters={shapeDiverParams} 
              onOutputsChange={handleShapeDiverOutputs}
              className="h-full min-h-[600px]"
            />
          ) : (
            <Card className="h-full min-h-[600px] flex items-center justify-center">
              <CardContent>
                <div className="text-center">
                  <p className="text-gray-500 mb-2">3D Model Loading...</p>
                  {!displayedResult && <p className="text-sm text-gray-400">No result data</p>}
                  {displayedResult && !shapeDiverParams && <p className="text-sm text-gray-400">No ShapeDriver parameters</p>}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Design Insights - Now Collapsible */}
      {result?.alternatives && result.alternatives.length > 0 && (
        <Card className="border-2 border-purple-200 bg-purple-50/30">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="design-insights" className="border-0">
              <AccordionTrigger className="hover:no-underline px-6 py-4 hover:bg-purple-100/50 transition-colors">
                <div className="flex items-center gap-2 text-left">
                  <Zap className="h-5 w-5 text-purple-600" />
                  <span className="font-semibold text-purple-900">Design Insights & Recommendations</span>
                  <span className="text-sm text-purple-600 ml-2">Click to expand</span>
                </div>
              </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-4">
              {/* Optimal Design Confidence */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-900">Optimal Design Confidence</h4>
                    <p className="text-sm text-green-700 mt-1">
                      The selected optimal design is <strong>{result.calculated?.weights?.totalWeight?.toFixed(1)} kg/m</strong>{' '}
                      and represents the lightest solution that passes all structural verification checks.
                    </p>
                  </div>
                </div>
              </div>

              {/* Alternative Designs Analysis */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Alternative Designs Available</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Found <strong>{result.alternatives.length} alternative designs</strong> that also pass all checks.
                      Weight penalties range from <strong>+{result.alternatives[0]?.weightDifferencePercent.toFixed(1)}%</strong> to{' '}
                      <strong>+{result.alternatives[result.alternatives.length - 1]?.weightDifferencePercent.toFixed(1)}%</strong>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Key Patterns in Alternatives */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-900">Design Pattern Analysis</h4>
                    <div className="text-sm text-amber-700 mt-1 space-y-2">
                      {(() => {
                        // Analyze patterns in alternatives
                        const invertedAngleCount = result.alternatives.filter(alt => 
                          alt.design.genetic.angle_orientation === 'Inverted'
                        ).length;
                        const invertedBracketCount = result.alternatives.filter(alt => 
                          alt.design.genetic.bracket_type === 'Inverted'
                        ).length;
                        const thickerBracketCount = result.alternatives.filter(alt => 
                          alt.design.genetic.bracket_thickness > result.genetic.bracket_thickness
                        ).length;
                        
                        return (
                          <div className="space-y-1">
                            {invertedAngleCount > 0 && (
                              <p>• <strong>{invertedAngleCount}</strong> alternatives use inverted angles (typically heavier due to increased bracket height)</p>
                            )}
                            {invertedBracketCount > 0 && (
                              <p>• <strong>{invertedBracketCount}</strong> alternatives use inverted brackets (may be required for specific support levels)</p>
                            )}
                            {thickerBracketCount > 0 && (
                              <p>• <strong>{thickerBracketCount}</strong> alternatives use thicker brackets (providing higher capacity)</p>
                            )}
                            <p className="mt-2 font-medium">
                              {result.genetic.angle_orientation === 'Inverted' || result.genetic.bracket_type === 'Inverted' 
                                ? "⚠️ The optimal design uses inverted configuration - consider if standard alternatives are more practical"
                                : "✅ The optimal design uses standard configuration, which is typically easier to install"
                              }
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Practical Considerations */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Wrench className="h-5 w-5 text-gray-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900">Practical Considerations</h4>
                    <div className="text-sm text-gray-600 mt-1 space-y-1">
                      <p>• <strong>Installation complexity:</strong> Standard brackets and angles are typically easier to install</p>
                      <p>• <strong>Material availability:</strong> Common thicknesses may be more readily available</p>
                      <p>• <strong>Cost implications:</strong> Heavier designs increase material costs but may reduce installation time</p>
                      <p>• <strong>Future modifications:</strong> Standard configurations offer more flexibility for changes</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Engineering Judgment */}
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Target className="h-5 w-5 text-indigo-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-indigo-900">Engineering Recommendation</h4>
                    <p className="text-sm text-indigo-700 mt-1">
                      {(() => {
                        const hasInvertedConfig = result.genetic.angle_orientation === 'Inverted' || result.genetic.bracket_type === 'Inverted';
                        const hasStandardAlternative = result.alternatives.some(alt => 
                          alt.design.genetic.angle_orientation === 'Standard' && alt.design.genetic.bracket_type === 'Standard'
                        );
                        
                        if (hasInvertedConfig && hasStandardAlternative) {
                          const standardAlt = result.alternatives.find(alt => 
                            alt.design.genetic.angle_orientation === 'Standard' && alt.design.genetic.bracket_type === 'Standard'
                          );
                          return `Consider reviewing Alternative ${result.alternatives.indexOf(standardAlt!) + 1} (standard configuration) 
                                  which adds only ${standardAlt?.weightDifferencePercent.toFixed(1)}% weight but may be more practical to install.`;
                        } else if (!hasInvertedConfig) {
                          return "The optimal design uses standard configuration, which is generally preferred for ease of installation and future modifications.";
                        } else {
                          return "The optimal design requires inverted configuration. Review project-specific constraints to confirm this is necessary.";
                        }
                      })()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
      )}

      {/* Design Selector */}
      {result?.alternatives && result.alternatives.length > 0 && (
        <Card className="border-2 border-blue-200 bg-blue-50/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-blue-600" />
              Compare Design Alternatives
            </CardTitle>
            <CardDescription>
              Review and compare the optimal design against {result.alternatives.length} alternative configurations. 
              Select any alternative below to see a detailed side-by-side comparison.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-100/30 p-4 rounded-lg mb-4">
              <p className="text-sm text-blue-800">
                <span className="font-medium">💡 Tip:</span> Alternative designs may offer practical advantages despite higher weight. 
                Use the dropdown to explore different configurations and understand their trade-offs.
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-gray-700">Select design to compare:</span>
                </div>
                <Select 
                  value={selectedDesignIndex.toString()} 
                  onValueChange={(value) => setSelectedDesignIndex(parseInt(value))}
                >
                  <SelectTrigger className="w-full md:w-[820px] max-w-full border-2 border-blue-300 bg-white hover:bg-blue-50 transition-colors">
                    <SelectValue placeholder="Choose a design to compare" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {/* Lightweight header row for consistency */}
                      <SelectLabel>
                        <div className="grid w-full text-xs font-medium text-gray-500 grid-cols-[140px_150px_90px_160px_100px_70px] gap-3 pl-2 pr-8">
                          <span>Design</span>
                          <span className="text-right">Weight</span>
                          <span>Channel</span>
                          <span>Config</span>
                          <span>Centres</span>
                          <span>Bolt</span>
                        </div>
                      </SelectLabel>

                      {/* Optimal (selected) design */}
                      <SelectItem
                        value="0"
                        textValue={`Optimal · ${result.calculated?.weights?.totalWeight?.toFixed(1) ?? '—'} kg/m · ${result.genetic?.channel_type ?? ''}`}
                      >
                        <div className="grid w-full items-center gap-3 grid-cols-[140px_150px_90px_160px_100px_70px]">
                          <div>
                            <span className="inline-flex items-center rounded-full bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5">🏆 Optimal</span>
                          </div>
                          <div className="text-sm font-medium tabular-nums text-right">
                            {result.calculated?.weights?.totalWeight?.toFixed(1) ?? '—'} <span className="text-gray-500">kg/m</span>
                            <span className="text-gray-400 ml-1">(+0.0%)</span>
                          </div>
                          <div>
                            <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs">{result.genetic?.channel_type ?? '—'}</span>
                          </div>
                          <div className="text-sm text-gray-700">
                            {(result.genetic?.bracket_type ?? '—') + ' / ' + (result.genetic?.angle_orientation ?? '—')}
                          </div>
                          <div className="text-sm text-gray-700">{result.genetic?.bracket_centres ?? '—'} mm</div>
                          <div className="text-sm text-gray-700">{result.genetic?.bolt_diameter ? `M${result.genetic.bolt_diameter}` : '—'}</div>
                        </div>
                      </SelectItem>

                      {/* Alternatives list */}
                      {result.alternatives.map((alt, index) => (
                        <SelectItem
                          key={index + 1}
                          value={(index + 1).toString()}
                          textValue={`Alternative ${index + 1} · ${alt.totalWeight.toFixed(1)} kg/m · ${alt.design.genetic.channel_type ?? ''}`}
                        >
                          <div className="grid w-full items-center gap-3 grid-cols-[140px_150px_90px_160px_100px_70px]">
                            <div>
                              <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5">Alternative {index + 1}</span>
                            </div>
                            <div className="text-sm font-medium tabular-nums text-right">
                              {alt.totalWeight.toFixed(1)} <span className="text-gray-500">kg/m</span>
                              <span className="text-green-600 ml-1">(+{alt.weightDifferencePercent.toFixed(1)}%)</span>
                            </div>
                            <div>
                              <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs">{alt.design.genetic.channel_type ?? '—'}</span>
                            </div>
                            <div className="text-sm text-gray-700">{`${alt.design.genetic.bracket_type} / ${alt.design.genetic.angle_orientation}`}</div>
                            <div className="text-sm text-gray-700">{alt.design.genetic.bracket_centres} mm</div>
                            <div className="text-sm text-gray-700">M{alt.design.genetic.bolt_diameter}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              
              {selectedDesignIndex > 0 && result.alternatives[selectedDesignIndex - 1] && (
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    <span>Weight: +{result.alternatives[selectedDesignIndex - 1].weightDifferencePercent.toFixed(1)}%</span>
                  </div>
                  {result.alternatives[selectedDesignIndex - 1].keyDifferences.length > 0 && (
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Key differences: {result.alternatives[selectedDesignIndex - 1].keyDifferences.join(', ')}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alternative Design Comparison */}
      {selectedDesignIndex > 0 && result?.alternatives && result.alternatives[selectedDesignIndex - 1] && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-orange-600" />
              Design Comparison: Optimal vs Alternative {selectedDesignIndex}
            </CardTitle>
            <CardDescription>
              Compare the optimal design with the selected alternative to understand the trade-offs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Optimal Design Column */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="default" className="bg-green-600">🏆 Optimal Design</Badge>
                  <span className="text-sm text-gray-600">
                    {result.calculated?.weights?.totalWeight?.toFixed(1) ?? '---'} kg/m
                  </span>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="font-medium">Bracket Centers</span>
                    <span className="font-mono">{result.genetic.bracket_centres}mm</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="font-medium">Bracket Type</span>
                    <span className="font-mono">{result.genetic.bracket_type}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="font-medium">Angle Orientation</span>
                    <span className="font-mono">{result.genetic.angle_orientation}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="font-medium">Bracket Thickness</span>
                    <span className="font-mono">{result.genetic.bracket_thickness}mm</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="font-medium">Angle Thickness</span>
                    <span className="font-mono">{result.genetic.angle_thickness}mm</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="font-medium">Bolt Diameter</span>
                    <span className="font-mono">M{result.genetic.bolt_diameter}</span>
                  </div>
                </div>
              </div>

              {/* Alternative Design Column */}
              <div className="space-y-4">
                {(() => {
                  const alternative = result.alternatives[selectedDesignIndex - 1];
                  return (
                    <>
                      <div className="flex items-center gap-2 mb-4">
                        <Badge variant="outline">Alternative {selectedDesignIndex}</Badge>
                        <span className="text-sm text-gray-600">
                          {alternative.totalWeight.toFixed(1)} kg/m
                        </span>
                        <span className={`text-sm ${alternative.weightDifferencePercent > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          ({alternative.weightDifferencePercent > 0 ? '+' : ''}{alternative.weightDifferencePercent.toFixed(1)}%)
                        </span>
                      </div>
                      
                      <div className="space-y-3">
                        <div className={`flex justify-between items-center p-3 rounded-lg ${
                          alternative.design.genetic.bracket_centres !== result.genetic.bracket_centres
                            ? 'bg-yellow-50 border-l-4 border-yellow-400'
                            : 'bg-gray-50'
                        }`}>
                          <span className="font-medium">Bracket Centers</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono">{alternative.design.genetic.bracket_centres}mm</span>
                            {alternative.design.genetic.bracket_centres !== result.genetic.bracket_centres && (
                              <Badge variant="secondary" className="text-xs">
                                {alternative.design.genetic.bracket_centres > result.genetic.bracket_centres ? '↑' : '↓'}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className={`flex justify-between items-center p-3 rounded-lg ${
                          alternative.design.genetic.bracket_type !== result.genetic.bracket_type
                            ? 'bg-yellow-50 border-l-4 border-yellow-400'
                            : 'bg-gray-50'
                        }`}>
                          <span className="font-medium">Bracket Type</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono">{alternative.design.genetic.bracket_type}</span>
                            {alternative.design.genetic.bracket_type !== result.genetic.bracket_type && (
                              <Badge variant="secondary" className="text-xs">Changed</Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className={`flex justify-between items-center p-3 rounded-lg ${
                          alternative.design.genetic.angle_orientation !== result.genetic.angle_orientation
                            ? 'bg-yellow-50 border-l-4 border-yellow-400'
                            : 'bg-gray-50'
                        }`}>
                          <span className="font-medium">Angle Orientation</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono">{alternative.design.genetic.angle_orientation}</span>
                            {alternative.design.genetic.angle_orientation !== result.genetic.angle_orientation && (
                              <Badge variant="secondary" className="text-xs">Changed</Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className={`flex justify-between items-center p-3 rounded-lg ${
                          alternative.design.genetic.bracket_thickness !== result.genetic.bracket_thickness
                            ? 'bg-yellow-50 border-l-4 border-yellow-400'
                            : 'bg-gray-50'
                        }`}>
                          <span className="font-medium">Bracket Thickness</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono">{alternative.design.genetic.bracket_thickness}mm</span>
                            {alternative.design.genetic.bracket_thickness !== result.genetic.bracket_thickness && (
                              <Badge variant="secondary" className="text-xs">
                                {alternative.design.genetic.bracket_thickness > result.genetic.bracket_thickness ? '↑' : '↓'}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className={`flex justify-between items-center p-3 rounded-lg ${
                          alternative.design.genetic.angle_thickness !== result.genetic.angle_thickness
                            ? 'bg-yellow-50 border-l-4 border-yellow-400'
                            : 'bg-gray-50'
                        }`}>
                          <span className="font-medium">Angle Thickness</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono">{alternative.design.genetic.angle_thickness}mm</span>
                            {alternative.design.genetic.angle_thickness !== result.genetic.angle_thickness && (
                              <Badge variant="secondary" className="text-xs">
                                {alternative.design.genetic.angle_thickness > result.genetic.angle_thickness ? '↑' : '↓'}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className={`flex justify-between items-center p-3 rounded-lg ${
                          alternative.design.genetic.bolt_diameter !== result.genetic.bolt_diameter
                            ? 'bg-yellow-50 border-l-4 border-yellow-400'
                            : 'bg-gray-50'
                        }`}>
                          <span className="font-medium">Bolt Diameter</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono">M{alternative.design.genetic.bolt_diameter}</span>
                            {alternative.design.genetic.bolt_diameter !== result.genetic.bolt_diameter && (
                              <Badge variant="secondary" className="text-xs">
                                {alternative.design.genetic.bolt_diameter > result.genetic.bolt_diameter ? '↑' : '↓'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Verification Margins */}
                      {alternative.verificationMargins && (
                        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                          <h4 className="font-medium text-blue-900 mb-3">Verification Margins</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex justify-between">
                              <span>Moment:</span>
                              <span className="font-mono">{alternative.verificationMargins.momentMargin.toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Shear:</span>
                              <span className="font-mono">{alternative.verificationMargins.shearMargin.toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Deflection:</span>
                              <span className="font-mono">{alternative.verificationMargins.deflectionMargin.toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Fixing:</span>
                              <span className="font-mono">{alternative.verificationMargins.fixingMargin.toFixed(1)}%</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
            
            {/* Summary */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
              <div className="text-sm text-gray-600">
                {(() => {
                  const alternative = result.alternatives[selectedDesignIndex - 1];
                  const weightIncrease = alternative.weightDifferencePercent;
                  const keyDiffs = alternative.keyDifferences;
                  
                  return (
                    <>
                      <p>
                        This alternative design is <strong>{Math.abs(weightIncrease).toFixed(1)}% {weightIncrease > 0 ? 'heavier' : 'lighter'}</strong> than the optimal solution
                        {keyDiffs.length > 0 && (
                          <>
                            {' '}due to: <strong>{keyDiffs.join(', ')}</strong>
                          </>
                        )}.
                      </p>
                      <p className="mt-2">
                        {weightIncrease > 0 
                          ? 'Despite being heavier, this design may offer practical advantages in specific installation scenarios.'
                          : 'This lighter design may have been rejected due to failing certain verification checks or other constraints.'
                        }
                      </p>
                    </>
                  );
                })()}
              </div>
            </div>
          </CardContent>
        </Card>
      )}


      {/* ShapeDiver Model Outputs - Full Width */}
      {(shapeDiverOutputs.totalSystemWeight !== undefined || 
        shapeDiverOutputs.totalSystemEmbodiedCarbon !== undefined || 
        shapeDiverOutputs.totalSystemPerimeterLength !== undefined) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Box className="h-5 w-5 text-blue-600" />
              ShapeDiver Model Outputs
            </CardTitle>
            <CardDescription>Real-time calculated values from the 3D model</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3">
                  <Scale className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-gray-700">Total System Weight</span>
                </div>
                <span className="text-lg font-bold text-blue-700 font-mono">
                  {shapeDiverOutputs.totalSystemWeight !== undefined 
                    ? `${shapeDiverOutputs.totalSystemWeight.toFixed(2)} kg` 
                    : "Calculating..."}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
                <div className="flex items-center gap-3">
                  <Leaf className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-gray-700">Embodied Carbon</span>
                </div>
                <span className="text-lg font-bold text-green-700 font-mono">
                  {shapeDiverOutputs.totalSystemEmbodiedCarbon !== undefined 
                    ? `${shapeDiverOutputs.totalSystemEmbodiedCarbon.toFixed(2)} kg CO₂e` 
                    : "Calculating..."}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                <div className="flex items-center gap-3">
                  <Ruler className="h-5 w-5 text-purple-600" />
                  <span className="font-medium text-gray-700">Perimeter Length</span>
                </div>
                <span className="text-lg font-bold text-purple-700 font-mono">
                  {shapeDiverOutputs.totalSystemPerimeterLength !== undefined 
                    ? `${shapeDiverOutputs.totalSystemPerimeterLength.toFixed(0)} mm` 
                    : "Calculating..."}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Design Parameters - Full Width */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-600" />
            Design Parameters
          </CardTitle>
          <CardDescription>Optimized design specifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Bracket Configuration */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Wrench className="h-4 w-4 text-orange-600" />
                <h3 className="font-semibold text-sm text-gray-700 uppercase tracking-wide">Bracket Configuration</h3>
              </div>
              <div className="space-y-3">
                <InlineEditParameter
                  paramName="bracket_centres"
                  label="Centres (B_cc)"
                  value={displayedResult?.genetic?.bracket_centres ?? 'N/A'}
                />
                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">Height (L)</span>
                  <span className="text-sm font-semibold font-mono">{displayedResult?.genetic?.bracket_height || displayedResult?.calculated?.bracket_height || "N/A"} mm</span>
                </div>
                <InlineEditParameter
                  paramName="bracket_thickness"
                  label="Thickness (t)"
                  value={displayedResult?.genetic?.bracket_thickness ?? 'N/A'}
                />
                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">Projection (D)</span>
                  <span className="text-sm font-semibold font-mono">{displayedResult?.genetic?.bracket_projection || displayedResult?.calculated?.bracket_projection || "N/A"} mm</span>
                </div>
                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">Type</span>
                  <span className="text-sm font-semibold">{displayedResult?.calculated?.bracket_type || "N/A"}</span>
                </div>
              </div>
            </div>

            {/* Angle Configuration */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Box className="h-4 w-4 text-blue-600" />
                <h3 className="font-semibold text-sm text-gray-700 uppercase tracking-wide">Angle Configuration</h3>
              </div>
              <div className="space-y-3">
                <InlineEditParameter
                  paramName="angle_thickness"
                  label="Thickness (T)"
                  value={displayedResult?.genetic?.angle_thickness ?? 'N/A'}
                />
                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">Vertical leg (A)</span>
                  <span className="text-sm font-semibold font-mono">
                    {(() => {
                      // Show effective vertical leg accounting for angle extension
                      const angleExtension = displayedResult?.calculated?.angle_extension_result;
                      if (angleExtension?.extension_applied) {
                        return angleExtension.extended_angle_height;
                      }
                      return displayedResult?.genetic?.vertical_leg ?? 'N/A';
                    })()} mm
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">Horizontal leg (B)</span>
                  <span className="text-sm font-semibold font-mono">{displayedResult?.genetic?.horizontal_leg || "N/A"} mm</span>
                </div>
                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">Orientation</span>
                  <span className="text-sm font-semibold">{displayedResult?.genetic?.angle_orientation || "Standard"}</span>
                </div>
              </div>
            </div>

            {/* Connection Details */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Target className="h-4 w-4 text-green-600" />
                <h3 className="font-semibold text-sm text-gray-700 uppercase tracking-wide">Connection Details</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">Rise to bolts (X)</span>
                  <span className="text-sm font-semibold font-mono">{displayedResult?.calculated?.rise_to_bolts_display ?? displayedResult?.genetic?.rise_to_bolts || displayedResult?.calculated?.rise_to_bolts || "N/A"} mm</span>
                </div>
                {/* Show Dim D only for inverted brackets */}
                {(displayedResult?.genetic?.bracket_type === 'Inverted' || displayedResult?.calculated?.bracket_type === 'Inverted') && (
                  <div className="flex justify-between items-center py-2 px-3 bg-blue-50 rounded">
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      Dim D
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <span className="text-xs text-blue-600 cursor-help">ⓘ</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Distance from bracket bottom to fixing point for inverted brackets (130-450mm)</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </span>
                    <span className="text-sm font-semibold font-mono">{displayedResult?.calculated?.dim_d ?? displayedResult?.genetic?.dim_d ?? "130"} mm</span>
                  </div>
                )}
                <InlineEditParameter
                  paramName="bolt_diameter"
                  label="Bolt diameter (d_p)"
                  value={displayedResult?.genetic?.bolt_diameter ?? 'N/A'}
                />
                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">Notch height</span>
                  <span className="text-sm font-semibold font-mono">{displayedResult?.calculated?.detailed_verification_results?.droppingBelowSlabResults?.H_notch ?? "0"} mm</span>
                </div>
                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">Channel type</span>
                  <span className="text-sm font-semibold">{displayedResult?.genetic?.channel_type || "Standard"}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Design Comparison - Show when parameters have been modified and verified */}
      {verificationResult && (
        <DesignComparison 
          originalResult={result}
          modifiedResult={verificationResult}
          modifiedParams={editValues}
        />
      )}

      {/* Full width section: Design Summary and remaining calculations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Design Summary
          </CardTitle>
          <CardDescription>Key calculated values for your optimized design</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Forces Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-blue-600" />
                <h3 className="font-semibold text-sm text-gray-700">Applied Forces</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-600">Shear Force (V_ed)</span>
                  <span className="text-sm font-mono font-semibold">
                    {result.calculated?.v_ed !== undefined ? `${result.calculated.v_ed.toFixed(3)} kN` : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-600">Moment (M_ed)</span>
                  <span className="text-sm font-mono font-semibold">
                    {result.calculated?.m_ed !== undefined ? `${result.calculated.m_ed.toFixed(3)} kNm` : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-600">Tension (N_ed)</span>
                  <span className="text-sm font-mono font-semibold">
                    {result.calculated?.n_ed !== undefined ? `${result.calculated.n_ed.toFixed(3)} kN` : "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Deflection Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-orange-600" />
                <h3 className="font-semibold text-sm text-gray-700">System Deflection</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-600">Total Deflection</span>
                  <span className="text-sm font-mono font-semibold">
                    {result.calculated?.detailed_verification_results?.totalDeflectionResults?.Total_deflection_of_system !== undefined &&
                    result.calculated.detailed_verification_results.totalDeflectionResults.Total_deflection_of_system !== null
                      ? `${result.calculated.detailed_verification_results.totalDeflectionResults.Total_deflection_of_system.toFixed(2)} mm`
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-600">Utilization</span>
                  <span className="text-sm font-mono font-semibold">
                    {result.calculated?.detailed_verification_results?.totalDeflectionResults?.Total_deflection_of_system !== undefined && 
                    result.calculated.detailed_verification_results.totalDeflectionResults.Total_deflection_of_system !== null
                      ? `${((result.calculated.detailed_verification_results.totalDeflectionResults.Total_deflection_of_system / 1.5) * 100).toFixed(1)}%`
                      : "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Status Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Check className="h-4 w-4 text-green-600" />
                <h3 className="font-semibold text-sm text-gray-700">Verification Status</h3>
              </div>
              <div className="flex justify-center">
                <Badge 
                  variant={allChecksPass ? "default" : "destructive"} 
                  className={`px-6 py-2 text-lg font-semibold ${
                    allChecksPass 
                      ? 'bg-green-100 text-green-800 hover:bg-green-200 border-green-300' 
                      : 'bg-red-100 text-red-800 hover:bg-red-200 border-red-300'
                  }`}
                >
                  {allChecksPass ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      PASS
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      FAIL
                    </>
                  )}
                </Badge>
              </div>
              <p className="text-xs text-gray-500 text-center mt-2">
                {allChecksPass 
                  ? "All structural verification checks passed" 
                  : "Some verification checks failed - review detailed results below"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={allChecksPass ? "border-green-500" : "border-red-500"}>
        <CardHeader className={`${allChecksPass ? "bg-green-50" : "bg-red-50"} rounded-t-lg`}>
          <div className="flex items-center justify-between">
            <CardTitle>Verification Checks</CardTitle>
            <div className={`flex items-center ${allChecksPass ? "text-green-600" : "text-red-600"}`}>
              {allChecksPass ? (
                <>
                  <Check className="mr-2 h-5 w-5" />
                  <span>All checks passed</span>
                </>
              ) : (
                <>
                  <X className="mr-2 h-5 w-5" />
                  <span>Some checks failed</span>
                </>
              )}
            </div>
          </div>
          <CardDescription>Verification of design against structural requirements</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.calculated ? Object.entries(result.calculated)
              .filter(([key]) => key.endsWith("_check"))
              .map(([key, value]) => {
                let displayValue = value;
                let isBracketDesignCheck = false;
                let isClass1 = true;

                if (result.calculated?.detailed_verification_results) {
                  if (key === "shear_reduction_check" && result.calculated.detailed_verification_results.packerResults?.passes !== undefined) {
                    displayValue = result.calculated.detailed_verification_results.packerResults.passes;
                  } else if (key === "bracket_design_check") {
                    isBracketDesignCheck = true;
                    if (result.calculated.detailed_verification_results.bracketDesignResults?.passes !== undefined) {
                      displayValue = result.calculated.detailed_verification_results.bracketDesignResults.passes;
                    }
                    if (result.calculated.detailed_verification_results.bracketDesignResults?.is_class_1 === false) {
                      isClass1 = false;
                    }
                  }
                }
                
                const formattedKey = key
                  .replace("_check", "")
                  .split("_")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ");

                return (
                  <div key={key} className="flex items-center justify-between p-3 border rounded">
                    <span className="font-medium">{formattedKey}</span>
                    <div className="flex items-center">
                      {displayValue ? (
                        <div className="flex items-center text-green-600">
                          <Check className="mr-1 h-4 w-4" />
                          <span>Pass</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-red-600">
                          <X className="mr-1 h-4 w-4" />
                          <span>Fail</span>
                        </div>
                      )}
                      {isBracketDesignCheck && !isClass1 && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <AlertTriangle className="h-4 w-4 text-orange-500 ml-2 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Not Class 1 - Please Review</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>
                );
              }) : null}
          </div>
        </CardContent>
      </Card>
      {history && history.length > 0 && (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <Card>
              <AccordionTrigger className="w-full px-6 py-4 hover:no-underline">
                <div className="flex justify-between items-center w-full">
                  <div>
                    <CardTitle>Generation History</CardTitle>
                    <CardDescription className="text-left mt-1">
                      Evolution of fitness scores and parameters over generations (Click to expand)
                    </CardDescription>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <CardContent className="pt-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Generation</TableHead>
                        <TableHead>Best Weight (kg/m)</TableHead>
                        <TableHead>B_cc (mm)</TableHead>
                        <TableHead>L (mm)</TableHead>
                        <TableHead>t (mm)</TableHead>
                        <TableHead>T (mm)</TableHead>
                        <TableHead>Best Fitness</TableHead>
                        <TableHead>Average Fitness</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.map((gen) => (
                        <TableRow key={gen.generation}>
                          <TableCell className="font-medium">{gen.generation}</TableCell>
                          <TableCell>{gen.bestWeight.toFixed(4)}</TableCell>
                          <TableCell>{gen.bracketCentres}</TableCell>
                          <TableCell>{gen.bracketHeight}</TableCell>
                          <TableCell>{gen.bracketThickness}</TableCell>
                          <TableCell>{gen.angleThickness}</TableCell>
                          <TableCell>{gen.bestFitness.toFixed(6)}</TableCell>
                          <TableCell>{gen.averageFitness.toFixed(6)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>
        </Accordion>
      )}
      
      {result.calculated.detailed_verification_results && (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-2">
            <Card>
              <AccordionTrigger className="w-full px-6 py-4 hover:no-underline">
                <div className="flex justify-between items-center w-full">
                  <div>
                    <CardTitle>Detailed Verification Steps</CardTitle>
                    <CardDescription className="text-left mt-1">
                      Intermediate calculation steps for the final design (Click to expand)
                    </CardDescription>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <CardContent className="pt-4">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Loading Calculations</h3>
                      <div className="grid grid-cols-2 gap-2 pl-4">
                        <div className="font-medium">Characteristic Load</div>
                        <div>{result.calculated.characteristic_load?.toFixed(9) || "N/A"} kN/m</div>
                        
                        <div className="font-medium">Design Load (with 1.35 safety factor)</div>
                        <div>{result.calculated.characteristic_load ? (result.calculated.characteristic_load * 1.35).toFixed(9) : "N/A"} kN/m</div>
                        
                        <div className="font-medium">Shear Force per Bracket</div>
                        <div>{result.calculated.shear_load?.toFixed(9) || "N/A"} kN</div>

                        <div className="font-medium">Bracket Centres</div>
                        <div>{result.genetic.bracket_centres || "N/A"} mm</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Moment Resistance</h3>
                      <div className="grid grid-cols-2 gap-2 pl-4">
                        <div className="font-medium">V_ed</div>
                        <div>{result.calculated.detailed_verification_results.shearResults?.appliedShear?.toFixed(9) || result.calculated.v_ed?.toFixed(9) || "N/A"} kN</div>
                        
                        <div className="font-medium">L_1 (related to Ecc.)</div>
                        <div>{result.calculated.detailed_verification_results.momentResults?.L_1?.toFixed(9) || "N/A"} mm</div>
                        
                        <div className="font-medium">M_ed</div>
                        <div>{result.calculated.detailed_verification_results.momentResults?.M_ed_angle?.toFixed(12) || result.calculated.m_ed?.toFixed(12) || "N/A"} kNm</div>
                        
                        <div className="font-medium">Moment Resistance</div>
                        <div>{result.calculated.detailed_verification_results.momentResults?.Mc_rd_angle?.toFixed(9) || "N/A"} kNm</div>
                        
                        <div className="font-medium">Utilization</div>
                        <div>{result.calculated.detailed_verification_results.momentResults?.utilization 
                          ? result.calculated.detailed_verification_results.momentResults.utilization.toFixed(6) + "%"
                          : "N/A"}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Shear Resistance</h3>
                      <div className="grid grid-cols-2 gap-2 pl-4">
                        <div className="font-medium">Applied Shear (V_ed)</div>
                        <div>{result.calculated.detailed_verification_results.shearResults?.appliedShear?.toFixed(9) || result.calculated.v_ed?.toFixed(9) || "N/A"} kN</div>
                        
                        <div className="font-medium">Shear Resistance (VR_d)</div>
                        <div>{result.calculated.detailed_verification_results.shearResults?.VR_d_angle?.toFixed(9) || "N/A"} kN</div>
                        
                        <div className="font-medium">Utilization</div>
                        <div>{result.calculated.detailed_verification_results.shearResults?.utilization 
                          ? result.calculated.detailed_verification_results.shearResults.utilization.toFixed(6) + "%"
                          : "N/A"}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Angle Deflection</h3>
                      <div className="grid grid-cols-2 gap-2 pl-4">
                        <div className="font-medium">Characteristic Shear</div>
                        <div>{result.calculated.detailed_verification_results.deflectionResults?.V_ek?.toFixed(9) || "N/A"} kN</div>
                        
                        <div className="font-medium">Characteristic Moment</div>
                        <div>{result.calculated.detailed_verification_results.deflectionResults?.M_ek?.toFixed(12) || "N/A"} kNm</div>
                        
                        <div className="font-medium">Total Deflection</div>
                        <div>{result.calculated.detailed_verification_results.deflectionResults?.totalDeflection?.toFixed(9) || "N/A"} mm</div>
                        
                        <div className="font-medium">Utilization</div>
                        <div>{result.calculated.detailed_verification_results.deflectionResults?.utilization 
                          ? result.calculated.detailed_verification_results.deflectionResults.utilization.toFixed(6) + "%"
                          : "N/A"}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Angle to Bracket Connection</h3>
                      <div className="grid grid-cols-2 gap-2 pl-4">
                        <div className="font-medium">Applied Shear</div>
                        <div>{result.calculated.detailed_verification_results.shearResults?.appliedShear?.toFixed(9) || result.calculated.v_ed?.toFixed(9) || "N/A"} kN</div>
                        
                        <div className="font-medium">Tension Force</div>
                        <div>{result.calculated.detailed_verification_results.angleToBracketResults?.N_bolt?.toFixed(9) || result.calculated.n_ed?.toFixed(9) || "N/A"} kN</div>
                        
                        <div className="font-medium">Bolt Shear Resistance</div>
                        <div>{result.calculated.detailed_verification_results.angleToBracketResults?.V_bolt_resistance?.toFixed(6) || "N/A"} kN</div>
                        
                        <div className="font-medium">Bolt Tension Resistance</div>
                        <div>{result.calculated.detailed_verification_results.angleToBracketResults?.N_bolt_resistance?.toFixed(6) || "N/A"} kN</div>
                        
                        <div className="font-medium">Combined Utilization</div>
                        <div>{result.calculated.detailed_verification_results.angleToBracketResults?.U_c_bolt
                          ? result.calculated.detailed_verification_results.angleToBracketResults.U_c_bolt.toFixed(6) + "%"
                          : "N/A"}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Total System Deflection</h3>
                      <div className="grid grid-cols-2 gap-2 pl-4">
                        <div className="font-medium">Total Vertical Deflection</div>
                        <div>{result.calculated.detailed_verification_results.totalDeflectionResults?.Total_Vertical_Deflection?.toFixed(9) || "N/A"} mm</div>
                        
                        <div className="font-medium">Additional Deflection Span</div>
                        <div>{result.calculated.detailed_verification_results.totalDeflectionResults?.Addition_deflection_span?.toFixed(9) || "N/A"} mm</div>
                        
                        <div className="font-medium">Total System Deflection</div>
                        <div>{result.calculated.detailed_verification_results.totalDeflectionResults?.Total_deflection_of_system?.toFixed(9) || "N/A"} mm</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Combined Tension-Shear Check</h3>
                      <div className="grid grid-cols-2 gap-2 pl-4">
                        <div className="font-medium">Tension Ratio (N_ratio)</div>
                        <div>{result.calculated.detailed_verification_results.combinedResults?.N_ratio?.toFixed(9) || "N/A"}</div>
                        
                        <div className="font-medium">Shear Ratio (V_ratio)</div>
                        <div>{result.calculated.detailed_verification_results.combinedResults?.V_ratio?.toFixed(9) || "N/A"}</div>
                        
                        <div className="font-medium">Formula 1 Check (≤ 1.0)</div>
                        <div>{result.calculated.detailed_verification_results.combinedResults?.U_combined_1?.toFixed(9) || "N/A"}</div>
                        
                        <div className="font-medium">Formula 2 Check (≤ 1.2)</div>
                        <div>{result.calculated.detailed_verification_results.combinedResults?.U_combined_2?.toFixed(9) || "N/A"}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Fixing Check</h3>
                      <div className="grid grid-cols-2 gap-2 pl-4">
                        <div className="font-medium">Applied Shear</div>
                        <div>{result.calculated.detailed_verification_results.fixingResults?.appliedShear?.toFixed(9) || "N/A"} kN</div>
                        
                        <div className="font-medium">Applied Moment</div>
                        <div>{result.calculated.detailed_verification_results.fixingResults?.appliedMoment?.toFixed(12) || "N/A"} kNm</div>
                        
                        <div className="font-medium">Tensile Force</div>
                        <div>{result.calculated.detailed_verification_results.fixingResults?.tensileForce?.toFixed(9) || "N/A"} kN</div>
                        
                        <div className="font-medium">Compression Zone Length</div>
                        <div>{result.calculated.detailed_verification_results.fixingResults?.tensileLoadResults?.compressionZoneLength?.toFixed(12) || "N/A"} mm</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Packer Effects</h3>
                      <div className="grid grid-cols-2 gap-2 pl-4">
                        <div className="font-medium">Packer Thickness</div>
                        <div>{result.calculated.detailed_verification_results.packerResults?.t_p?.toFixed(2) || "0.00"} mm</div>
                        
                        <div className="font-medium">Bolt Diameter</div>
                        <div>{result.calculated.detailed_verification_results.packerResults?.d_p?.toFixed(2) || "N/A"} mm</div>
                        
                        <div className="font-medium">Reduction Factor (β)</div>
                        <div>{result.calculated.detailed_verification_results.packerResults?.beta_p?.toFixed(6) || "N/A"}</div>
                        
                        <div className="font-medium">Reduced Shear Resistance</div>
                        <div>{result.calculated.detailed_verification_results.packerResults?.V_rd?.toFixed(6) || "N/A"} kN</div>
                        
                        <div className="font-medium">Reduced Tension Resistance</div>
                        <div>{result.calculated.detailed_verification_results.packerResults?.T_rd?.toFixed(6) || "N/A"} kN</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Dropping Below Slab Check</h3>
                      <div className="grid grid-cols-2 gap-2 pl-4">
                        <div className="font-medium">Drop Below Slab</div>
                        <div>{result.calculated.detailed_verification_results.droppingBelowSlabResults?.P?.toFixed(2) || "0.00"} mm</div>
                        
                        <div className="font-medium">Notch Height</div>
                        <div>{result.calculated.detailed_verification_results.droppingBelowSlabResults?.H_notch?.toFixed(2) || "0.00"} mm</div>
                        
                        <div className="font-medium">Characteristic Shear</div>
                        <div>{result.calculated.detailed_verification_results.droppingBelowSlabResults?.V_ek?.toFixed(9) || "N/A"} kN</div>
                        
                        <div className="font-medium">Drop Moment</div>
                        <div>{result.calculated.detailed_verification_results.droppingBelowSlabResults?.M_ek_drop?.toFixed(12) || "N/A"} kNm</div>
                        
                        <div className="font-medium">Effective Length</div>
                        <div>{result.calculated.detailed_verification_results.droppingBelowSlabResults?.L_d?.toFixed(3) || "N/A"} mm</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Bracket Design</h3>
                      <div className="grid grid-cols-2 gap-2 pl-4">
                        <div className="font-medium">Applied Moment</div>
                        <div>{result.calculated.detailed_verification_results.bracketDesignResults?.M_ed_bracket?.toFixed(12) || "N/A"} kNm</div>
                        
                        <div className="font-medium">Plastic Section Modulus</div>
                        <div>{result.calculated.detailed_verification_results.bracketDesignResults?.W_pl_c?.toFixed(6) || "N/A"} mm³</div>
                        
                        <div className="font-medium">Moment Resistance</div>
                        <div>{result.calculated.detailed_verification_results.bracketDesignResults?.M_rd_bracket?.toFixed(9) || "N/A"} kNm</div>
                        
                        <div className="font-medium">Class 1 Section</div>
                        <div className="flex items-center">
                          <span>
                            {result.calculated.detailed_verification_results.bracketDesignResults?.is_class_1 ? "Yes" : "No"}
                          </span>
                          {!result.calculated.detailed_verification_results.bracketDesignResults?.is_class_1 && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <AlertTriangle className="h-4 w-4 text-orange-500 ml-2 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Not Class 1 - Please Review</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mt-6 border-t pt-4">
                      <h3 className="text-lg font-semibold">Overall Verification Results</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pl-4">
                        <div className="flex flex-col items-center p-2 border rounded">
                          <span className="font-medium">Moment Resistance</span>
                          <div className={`mt-1 flex items-center ${result.calculated.detailed_verification_results.momentResults?.passes ? "text-green-600" : "text-red-600"}`}>
                            {result.calculated.detailed_verification_results.momentResults?.passes ? (
                              <Check className="h-5 w-5" />
                            ) : (
                              <X className="h-5 w-5" />
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-center p-2 border rounded">
                          <span className="font-medium">Shear Resistance</span>
                          <div className={`mt-1 flex items-center ${result.calculated.detailed_verification_results.shearResults?.passes ? "text-green-600" : "text-red-600"}`}>
                            {result.calculated.detailed_verification_results.shearResults?.passes ? (
                              <Check className="h-5 w-5" />
                            ) : (
                              <X className="h-5 w-5" />
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-center p-2 border rounded">
                          <span className="font-medium">Angle Deflection</span>
                          <div className={`mt-1 flex items-center ${result.calculated.detailed_verification_results.deflectionResults?.passes ? "text-green-600" : "text-red-600"}`}>
                            {result.calculated.detailed_verification_results.deflectionResults?.passes ? (
                              <Check className="h-5 w-5" />
                            ) : (
                              <X className="h-5 w-5" />
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-center p-2 border rounded">
                          <span className="font-medium">Bracket Connection</span>
                          <div className={`mt-1 flex items-center ${result.calculated.detailed_verification_results.angleToBracketResults?.passes ? "text-green-600" : "text-red-600"}`}>
                            {result.calculated.detailed_verification_results.angleToBracketResults?.passes ? (
                              <Check className="h-5 w-5" />
                            ) : (
                              <X className="h-5 w-5" />
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-center p-2 border rounded">
                          <span className="font-medium">Combined Tension/Shear</span>
                          <div className={`mt-1 flex items-center ${result.calculated.detailed_verification_results.combinedResults?.passes ? "text-green-600" : "text-red-600"}`}>
                            {result.calculated.detailed_verification_results.combinedResults?.passes ? (
                              <Check className="h-5 w-5" />
                            ) : (
                              <X className="h-5 w-5" />
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-center p-2 border rounded">
                          <span className="font-medium">Fixing Check</span>
                          <div className={`mt-1 flex items-center ${result.calculated.detailed_verification_results.fixingResults?.passes ? "text-green-600" : "text-red-600"}`}>
                            {result.calculated.detailed_verification_results.fixingResults?.passes ? (
                              <Check className="h-5 w-5" />
                            ) : (
                              <X className="h-5 w-5" />
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-center p-2 border rounded">
                          <span className="font-medium">Dropping Below Slab</span>
                          <div className={`mt-1 flex items-center ${result.calculated.detailed_verification_results.droppingBelowSlabResults?.passes ? "text-green-600" : "text-red-600"}`}>
                            {result.calculated.detailed_verification_results.droppingBelowSlabResults?.passes ? (
                              <Check className="h-5 w-5" />
                            ) : (
                              <X className="h-5 w-5" />
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-center p-2 border rounded">
                          <span className="font-medium">Total Deflection</span>
                          <div className={`mt-1 flex items-center ${result.calculated.detailed_verification_results.totalDeflectionResults?.passes ? "text-green-600" : "text-red-600"}`}>
                            {result.calculated.detailed_verification_results.totalDeflectionResults?.passes ? (
                              <Check className="h-5 w-5" />
                            ) : (
                              <X className="h-5 w-5" />
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-center p-2 border rounded">
                          <span className="font-medium">Packer Effects</span>
                          <div className={`mt-1 flex items-center ${result.calculated.detailed_verification_results.packerResults?.passes ? "text-green-600" : "text-red-600"}`}>
                            {result.calculated.detailed_verification_results.packerResults?.passes ? (
                              <Check className="h-5 w-5" />
                            ) : (
                              <X className="h-5 w-5" />
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-center p-2 border rounded">
                          <span className="font-medium">Bracket Design</span>
                          <div className={`mt-1 flex items-center ${result.calculated.detailed_verification_results.bracketDesignResults?.passes ? "text-green-600" : "text-red-600"}`}>
                            {result.calculated.detailed_verification_results.bracketDesignResults?.passes ? (
                              <Check className="h-5 w-5" />
                            ) : (
                              <X className="h-5 w-5" />
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-center p-2 border rounded md:col-span-3 bg-gray-50">
                          <span className="font-medium">OVERALL RESULT</span>
                          <div className={`mt-1 flex items-center ${result.calculated.detailed_verification_results.passes ? "text-green-600" : "text-red-600"}`}>
                            {result.calculated.detailed_verification_results.passes ? (
                              <Check className="h-6 w-6" />
                            ) : (
                              <X className="h-6 w-6" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mt-6 border-t pt-4">
                      <h3 className="text-lg font-semibold">Weight Information</h3>
                      <div className="grid grid-cols-2 gap-2 pl-4">
                        <div className="font-medium">Angle Weight</div>
                        <div>
                          {result.calculated.weights?.angleWeight !== undefined 
                            ? `${result.calculated.weights.angleWeight.toFixed(6)} kg/m` 
                            : "N/A"}
                        </div>
                        
                        <div className="font-medium">Bracket Weight</div>
                        <div>
                          {result.calculated.weights?.bracketWeight !== undefined
                            ? `${result.calculated.weights.bracketWeight.toFixed(6)} kg/bracket`
                            : "N/A"}
                        </div>
                        
                        <div className="font-medium">Total System Weight</div>
                        <div>
                          {result.calculated.weights?.totalWeight !== undefined
                            ? `${result.calculated.weights.totalWeight.toFixed(6)} kg/m`
                            : "N/A"}
                        </div>
                      </div>
                    </div>

                    {/* Verification Results Section */}
                    {(verificationResult || verificationError || isVerifying) && (
                      <div className="space-y-4 mt-6 border-t pt-4">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold">Modified Design Verification</h3>
                          {isVerifying && (
                            <div className="flex items-center gap-2 text-blue-600">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="text-sm">Verifying...</span>
                            </div>
                          )}
                        </div>

                        {verificationError && (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                            <div className="flex items-center gap-2 text-red-700">
                              <X className="h-4 w-4" />
                              <span className="font-medium">Verification Error</span>
                            </div>
                            <p className="text-sm text-red-600 mt-1">{verificationError}</p>
                          </div>
                        )}

                        {verificationResult && !isVerifying && (
                          <div className="space-y-4">
                            {/* Overall Status */}
                            <div className={`p-3 rounded-md border ${
                              verificationResult.isValid 
                                ? 'bg-green-50 border-green-200' 
                                : 'bg-red-50 border-red-200'
                            }`}>
                              <div className={`flex items-center gap-2 ${
                                verificationResult.isValid ? 'text-green-700' : 'text-red-700'
                              }`}>
                                {verificationResult.isValid ? (
                                  <Check className="h-5 w-5" />
                                ) : (
                                  <X className="h-5 w-5" />
                                )}
                                <span className="font-medium">
                                  Modified Design {verificationResult.isValid ? 'PASSES' : 'FAILS'} Verification
                                </span>
                              </div>
                            </div>

                            {/* Weight Comparison */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <h4 className="font-medium text-gray-700">Weight Comparison</h4>
                                <div className="bg-gray-50 p-3 rounded-md space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span>Original Total Weight:</span>
                                    <span className="font-mono">
                                      {result?.calculated?.weights?.totalWeight?.toFixed(3) || 'N/A'} kg/m
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span>Modified Total Weight:</span>
                                    <span className="font-mono">
                                      {verificationResult.weights.totalWeight.toFixed(3)} kg/m
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sm font-medium border-t pt-2">
                                    <span>Weight Change:</span>
                                    <span className={`font-mono ${
                                      (verificationResult.weights.totalWeight - (result?.calculated?.weights?.totalWeight || 0)) > 0 
                                        ? 'text-red-600' 
                                        : 'text-green-600'
                                    }`}>
                                      {((verificationResult.weights.totalWeight - (result?.calculated?.weights?.totalWeight || 0)) >= 0 ? '+' : '')}
                                      {(verificationResult.weights.totalWeight - (result?.calculated?.weights?.totalWeight || 0)).toFixed(3)} kg/m
                                      {result?.calculated?.weights?.totalWeight && (
                                        <span className="ml-1">
                                          ({(((verificationResult.weights.totalWeight - result.calculated.weights.totalWeight) / result.calculated.weights.totalWeight) * 100).toFixed(1)}%)
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <h4 className="font-medium text-gray-700">Key Values</h4>
                                <div className="bg-gray-50 p-3 rounded-md space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span>Applied Shear (V_ed):</span>
                                    <span className="font-mono">{verificationResult.calculatedValues.v_ed.toFixed(2)} kN</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Applied Moment (M_ed):</span>
                                    <span className="font-mono">{verificationResult.calculatedValues.m_ed.toFixed(3)} kNm</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Tensile Force (N_ed):</span>
                                    <span className="font-mono">{verificationResult.calculatedValues.n_ed.toFixed(2)} kN</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Total Deflection:</span>
                                    <span className="font-mono">{verificationResult.calculatedValues.total_deflection.toFixed(3)} mm</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Verification Checks Summary */}
                            <div className="space-y-2">
                              <h4 className="font-medium text-gray-700">Verification Checks</h4>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                <div className={`flex items-center gap-2 p-2 rounded text-sm ${
                                  verificationResult.verificationResults.momentResults.passes 
                                    ? 'bg-green-50 text-green-700' 
                                    : 'bg-red-50 text-red-700'
                                }`}>
                                  {verificationResult.verificationResults.momentResults.passes ? (
                                    <Check className="h-4 w-4" />
                                  ) : (
                                    <X className="h-4 w-4" />
                                  )}
                                  <span>Moment</span>
                                </div>
                                <div className={`flex items-center gap-2 p-2 rounded text-sm ${
                                  verificationResult.verificationResults.shearResults.passes 
                                    ? 'bg-green-50 text-green-700' 
                                    : 'bg-red-50 text-red-700'
                                }`}>
                                  {verificationResult.verificationResults.shearResults.passes ? (
                                    <Check className="h-4 w-4" />
                                  ) : (
                                    <X className="h-4 w-4" />
                                  )}
                                  <span>Shear</span>
                                </div>
                                <div className={`flex items-center gap-2 p-2 rounded text-sm ${
                                  verificationResult.verificationResults.deflectionResults.passes 
                                    ? 'bg-green-50 text-green-700' 
                                    : 'bg-red-50 text-red-700'
                                }`}>
                                  {verificationResult.verificationResults.deflectionResults.passes ? (
                                    <Check className="h-4 w-4" />
                                  ) : (
                                    <X className="h-4 w-4" />
                                  )}
                                  <span>Deflection</span>
                                </div>
                                <div className={`flex items-center gap-2 p-2 rounded text-sm ${
                                  verificationResult.verificationResults.angleToBracketResults.passes 
                                    ? 'bg-green-50 text-green-700' 
                                    : 'bg-red-50 text-red-700'
                                }`}>
                                  {verificationResult.verificationResults.angleToBracketResults.passes ? (
                                    <Check className="h-4 w-4" />
                                  ) : (
                                    <X className="h-4 w-4" />
                                  )}
                                  <span>Connection</span>
                                </div>
                                <div className={`flex items-center gap-2 p-2 rounded text-sm ${
                                  verificationResult.verificationResults.fixingResults.passes 
                                    ? 'bg-green-50 text-green-700' 
                                    : 'bg-red-50 text-red-700'
                                }`}>
                                  {verificationResult.verificationResults.fixingResults.passes ? (
                                    <Check className="h-4 w-4" />
                                  ) : (
                                    <X className="h-4 w-4" />
                                  )}
                                  <span>Fixing</span>
                                </div>
                                <div className={`flex items-center gap-2 p-2 rounded text-sm ${
                                  verificationResult.verificationResults.bracketDesignResults.passes 
                                    ? 'bg-green-50 text-green-700' 
                                    : 'bg-red-50 text-red-700'
                                }`}>
                                  {verificationResult.verificationResults.bracketDesignResults.passes ? (
                                    <Check className="h-4 w-4" />
                                  ) : (
                                    <X className="h-4 w-4" />
                                  )}
                                  <span>Bracket</span>
                                </div>
                              </div>
                            </div>


                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>
        </Accordion>
      )}

      {/* Bracket Positioning Section */}
      {result.calculated.bracketLayout && (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-3">
            <Card>
              <AccordionTrigger className="w-full px-6 py-4 hover:no-underline">
                <div className="flex justify-between items-center w-full">
                  <div>
                    <CardTitle>Bracket Positioning</CardTitle>
                    <CardDescription className="text-left mt-1">
                      Layout and placement of brackets on the angle (Click to expand)
                    </CardDescription>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <CardContent className="pt-4">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Angle Configuration</h3>
                      <div className="grid grid-cols-2 gap-2 pl-4">
                        <div className="font-medium">Angle Length</div>
                        <div>{result.calculated.bracketLayout?.angleLength} mm</div>
                        
                        <div className="font-medium">Number of Brackets</div>
                        <div>{result.calculated.bracketLayout?.bracketCount}</div>
                        
                        <div className="font-medium">Bracket Spacing</div>
                        <div>{result.calculated.bracketLayout?.spacing} mm</div>
                        
                        <div className="font-medium">Start Offset</div>
                        <div>{result.calculated.bracketLayout?.startOffset} mm</div>
                        
                        <div className="font-medium">Run Type</div>
                        <div>{result.calculated.bracketLayout?.isStandardRun ? 'Standard Run' : 'Fixed Length'}</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Bracket Positions</h3>
                      <div className="bg-gray-50 p-4 rounded-md overflow-x-auto">
                        <div className="w-full relative h-16 mb-2 bg-white border rounded">
                          <div className="absolute top-0 left-0 w-full h-full flex items-center">
                            {/* Visual representation of angle with brackets */}
                            <div className="w-full h-6 bg-gray-200 relative">
                              {result.calculated.bracketLayout?.positions.map((pos: number, index: number) => {
                                const positionPercent = (pos / (result.calculated.bracketLayout?.angleLength || 1)) * 100;
                                return (
                                  <div
                                    key={index}
                                    className="absolute h-10 w-2 bg-[#c2f20e] -top-2 border border-gray-600"
                                    style={{ left: `${positionPercent}%` }}
                                    title={`Bracket ${index + 1}: ${pos}mm from left`}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        </div>
                        <table className="min-w-full">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="px-4 py-2 text-left">Bracket #</th>
                              <th className="px-4 py-2 text-left">Position from Left (mm)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {result.calculated.bracketLayout?.positions.map((pos: number, index: number) => (
                              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="px-4 py-2">{index + 1}</td>
                                <td className="px-4 py-2">{pos.toFixed(1)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  )
} 
