'use client'

import dynamic from 'next/dynamic'
import { Loader2, Box } from 'lucide-react'
import type { OptimisationResult } from '@/types/optimization-types'
import type { ShapeDiverOutputs } from '@/components/shapediver'

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
  onOutputsChange?: (outputs: ShapeDiverOutputs) => void
  bracketJSON?: string
  angleJSON?: string
  runJSON?: string
}

export function DesignViewerPanel({
  optimizationResult,
  isOptimizing,
  progress,
  onOutputsChange,
  bracketJSON,
  angleJSON,
  runJSON
}: DesignViewerPanelProps) {
  // Note: The new JSON-based model receives JSON strings directly as props
  // No need to build individual parameters anymore

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

      {/* 3D Viewer - Now uses JSON-based model */}
      {bracketJSON && angleJSON && runJSON && (
        <div className="absolute inset-0">
          <ShapeDiver
            bracketJSON={bracketJSON}
            angleJSON={angleJSON}
            runJSON={runJSON}
            title=""
            onOutputsChange={onOutputsChange}
          />
        </div>
      )}

      {/* Show loading message if we have optimization result but JSON not yet generated */}
      {optimizationResult && (!bracketJSON || !angleJSON || !runJSON) && !isOptimizing && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#e5e7eb]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Generating 3D model...</p>
        </div>
      )}
    </div>
  )
}
