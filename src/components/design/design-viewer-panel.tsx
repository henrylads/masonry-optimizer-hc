'use client'

import { useMemo } from 'react'
import dynamic from 'next/dynamic'
import { Loader2, Box } from 'lucide-react'
import type { OptimisationResult } from '@/types/optimization-types'

// Dynamically import ShapeDiver to avoid SSR issues
const ShapeDiver = dynamic(() => import('@/components/shapediver').then(mod => ({ default: mod.ShapeDiverCard })), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#e5e7eb]">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  )
})

interface DesignViewerPanelProps {
  optimizationResult: OptimisationResult | null
  isOptimizing: boolean
  progress: number
}

export function DesignViewerPanel({
  optimizationResult,
  isOptimizing,
  progress
}: DesignViewerPanelProps) {
  // Memoize parameters to prevent ShapeDiver from recreating session on every render
  const shapeDiverParams = useMemo(() => {
    if (!optimizationResult) return undefined

    // Base parameters
    const params = {
      // Add unique identifier to force React to detect parameter changes
      // This ensures ShapeDiver properly updates when parameters change (e.g., removing notch)
      _updateKey: Date.now(),

      bracket_thickness: optimizationResult.genetic?.bracket_thickness ?? 3,
      fixing_diameter: optimizationResult.genetic?.bolt_diameter ?? 10,
      bracket_length: optimizationResult.calculated?.bracket_projection ?? 150,
      bracket_height: (() => {
        // Use limited bracket height if angle extension was applied
        const angleExtension = optimizationResult?.calculated?.angle_extension_result;
        if (angleExtension?.extension_applied) {
          return angleExtension.limited_bracket_height;
        }
        // Otherwise use the original bracket height
        return optimizationResult.calculated?.bracket_height ?? 150;
      })(),
      slab_thickness: optimizationResult.calculated?.slab_thickness ?? 225,

      // Dim D parameters - ONLY for inverted brackets
      // ShapeDiver needs BOTH boolean override AND numeric value
      ...(() => {
        const bracketType = optimizationResult.calculated?.bracket_type ?? optimizationResult.genetic?.bracket_type;

        // Only include dim_d parameters for inverted brackets
        if (bracketType === 'Inverted') {
          const dimDValue = optimizationResult.calculated?.dim_d ?? optimizationResult.genetic?.dim_d ?? 130;
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
        const optimizedPos = optimizationResult.calculated?.optimized_fixing_position;
        const geneticPos = optimizationResult.genetic?.fixing_position;
        const baseFixingPos = optimizedPos ?? geneticPos ?? 75;

        // Check if exclusion zone constraints are active
        const angleExtension = optimizationResult?.calculated?.angle_extension_result;
        const hasExclusionZone = angleExtension?.extension_applied && angleExtension?.max_extension_limit !== null;

        if (hasExclusionZone) {
          const exclusionLimit = angleExtension!.max_extension_limit;
          const heightAboveSSL = optimizationResult.calculated?.height_above_ssl ?? 0;

          // For exclusion zones at or above slab top (≥ 0mm), adjust fixing position
          // to ensure bracket top doesn't exceed the exclusion limit
          if (exclusionLimit >= 0) {
            // Calculate required adjustment to position bracket top at exclusion limit
            const effectiveHeightAboveSSL = Math.min(heightAboveSSL, exclusionLimit);

            // Adjust fixing position to account for reduced height above SSL
            const heightReduction = heightAboveSSL - effectiveHeightAboveSSL;
            const adjustedFixingPos = baseFixingPos + heightReduction;

            return adjustedFixingPos;
          }
        }

        return baseFixingPos;
      })(),

      // Notch parameters - only include when notch exists
      ...(() => {
        const notchHeight = optimizationResult.calculated?.detailed_verification_results?.droppingBelowSlabResults?.H_notch ?? 0;

        if (notchHeight > 0) {
          // Include notch parameters with valid values
          return {
            back_notch_height: Math.max(10, notchHeight),
            back_notch_length: 25,
            back_notch_option: true
          };
        } else {
          // Don't include notch parameters at all when no notch exists
          // This prevents ShapeDiver from receiving invalid values (0 is below minimum of 10)
          return {
            back_notch_option: false
          };
        }
      })(),

      // Material grades - use separate parameters for bracket and angle
      bracket_material_grade: '316',
      angle_material_grade: '316',

      // Support type from calculation results, with fallback to 'Standard'
      support_type: optimizationResult.calculated?.bracket_type === 'Inverted' ? 'Inverted' : 'Standard',
      toe_plate_type: 'Standard',

      // Angle-specific parameters from genetic results
      angle_type: optimizationResult.genetic?.angle_orientation || 'Standard', // Use actual angle orientation from genetic results
      profile_thickness: optimizationResult.genetic?.angle_thickness ?? 4,
      profile_length: optimizationResult.genetic?.horizontal_leg ?? 75,  // Horizontal leg of angle
      profile_height: (() => {
        // Use extended angle height if angle extension was applied
        const angleExtension = optimizationResult?.calculated?.angle_extension_result;
        if (angleExtension?.extension_applied) {
          return angleExtension.extended_angle_height;
        }
        // Otherwise use the original vertical leg
        return optimizationResult.genetic?.vertical_leg ?? 60;
      })(),   // Vertical leg of angle (potentially extended)

      // Add bracket positioning parameters if available
      ...(optimizationResult.calculated?.bracketLayout && {
        angle_length: optimizationResult.calculated.bracketLayout.angleLength,
        bracket_count: optimizationResult.calculated.bracketLayout.bracketCount,
        bracket_spacing: optimizationResult.calculated.bracketLayout.spacing,
        start_offset: optimizationResult.calculated.bracketLayout.startOffset,
        spacing_gap: 10 // Default gap between angles
      })
    };

    return params;
  }, [optimizationResult])

  return (
    <div className="absolute inset-0 bg-[#e5e7eb]">
      {/* Empty State */}
      {!optimizationResult && !isOptimizing && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Box className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-lg">
            Run optimization to view 3D model
          </p>
        </div>
      )}

      {/* Optimization Progress Overlay */}
      {isOptimizing && (
        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center z-10">
          <Loader2 className="h-12 w-12 animate-spin text-white mb-4" />
          <p className="text-white text-lg mb-2">Optimizing...</p>
          <div className="w-64 h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-white/80 text-sm mt-2">{Math.round(progress)}% complete</p>
        </div>
      )}

      {/* 3D Viewer */}
      {shapeDiverParams && (
        <div className="absolute inset-0">
          <ShapeDiver
            initialParameters={shapeDiverParams}
            title=""
            className="border-0 shadow-none"
          />
        </div>
      )}
    </div>
  )
}
