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

    // Check if there's a notch (notch_height and notch_depth > 0)
    const hasNotch = (optimizationResult.genetic.notch_height > 0 && optimizationResult.genetic.notch_depth > 0)

    const dimDValue = optimizationResult.genetic.dim_d || optimizationResult.calculated.dim_d
    const dimDOverride = dimDValue !== undefined && dimDValue > 0

    const baseParams = {
      support_type: optimizationResult.genetic.bracket_type === 'Inverted' ? 'I' : 'S',
      bracket_thickness: optimizationResult.genetic.bracket_thickness,
      bracket_height: optimizationResult.genetic.bracket_height || optimizationResult.calculated.bracket_height,
      bracket_length: optimizationResult.calculated.bracket_projection,
      bracket_spacing: optimizationResult.genetic.bracket_centres,
      profile_thickness: optimizationResult.genetic.angle_thickness,
      profile_height: optimizationResult.genetic.vertical_leg,
      profile_length: optimizationResult.genetic.horizontal_leg,
      fixing_diameter: optimizationResult.genetic.bolt_diameter,
      slab_thickness: optimizationResult.calculated.slab_thickness,
      fixing_position: optimizationResult.genetic.fixing_position || optimizationResult.calculated.optimized_fixing_position,
      dim_d: dimDOverride,
      dim_d_value: dimDValue || 0,
      back_notch_option: hasNotch
    }

    // Only include notch dimensions if there's actually a notch
    // (ShapeDiver has minimum values of 10mm and rejects 0)
    if (hasNotch) {
      return {
        ...baseParams,
        back_notch_height: optimizationResult.genetic.notch_height,
        back_notch_length: optimizationResult.genetic.notch_depth
      }
    }

    return baseParams
  }, [
    optimizationResult?.genetic.bracket_type,
    optimizationResult?.genetic.bracket_thickness,
    optimizationResult?.genetic.bracket_height,
    optimizationResult?.calculated.bracket_height,
    optimizationResult?.calculated.bracket_projection,
    optimizationResult?.genetic.bracket_centres,
    optimizationResult?.genetic.angle_thickness,
    optimizationResult?.genetic.vertical_leg,
    optimizationResult?.genetic.horizontal_leg,
    optimizationResult?.genetic.bolt_diameter,
    optimizationResult?.calculated.slab_thickness,
    optimizationResult?.genetic.fixing_position,
    optimizationResult?.calculated.optimized_fixing_position,
    optimizationResult?.genetic.dim_d,
    optimizationResult?.calculated.dim_d,
    optimizationResult?.genetic.notch_height,
    optimizationResult?.genetic.notch_depth
  ])

  return (
    <div className="flex-1 relative bg-[#e5e7eb]">
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
