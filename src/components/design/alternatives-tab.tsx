'use client'

import { CheckCircle, AlertTriangle } from 'lucide-react'
import type { OptimisationResult } from '@/types/optimization-types'

interface AlternativesTabProps {
  alternatives: OptimisationResult[]
  selectedIndex: number
  onSelect: (index: number) => void
}

export function AlternativesTab({
  alternatives,
  selectedIndex,
  onSelect
}: AlternativesTabProps) {
  if (alternatives.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">
          Run optimization to see alternatives
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground mb-3">
        Top {alternatives.length} solutions (click to select)
      </p>

      {alternatives.map((alt, index) => {
        const isSelected = index === selectedIndex
        const allPassed = alt.calculated.detailed_verification_results?.passes ??
                          alt.calculated.all_checks_pass ??
                          false
        const totalWeight = alt.calculated.weights?.totalWeight

        // Extract key differentiators
        const channelType = alt.genetic.channel_type
        const steelBoltSize = alt.genetic.steel_bolt_size
        const steelFixingMethod = alt.genetic.steel_fixing_method
        const bracketThickness = alt.genetic.bracket_thickness
        const angleThickness = alt.genetic.angle_thickness

        // Build description based on what's different
        const description = []
        if (channelType) {
          description.push(channelType)
        }
        if (steelBoltSize) {
          description.push(steelBoltSize)
        }
        if (steelFixingMethod) {
          const methodLabel = steelFixingMethod === 'SET_SCREW' ? 'Set Screw' : 'Blind Bolt'
          description.push(methodLabel)
        }
        if (bracketThickness) {
          description.push(`${bracketThickness}mm bracket`)
        }
        if (angleThickness) {
          description.push(`${angleThickness}mm angle`)
        }

        return (
          <button
            key={index}
            onClick={() => onSelect(index)}
            className={`w-full p-3 rounded-lg border transition-all ${
              isSelected
                ? 'border-black bg-black/5'
                : 'border-border hover:border-black/30 hover:bg-muted/30'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? 'border-black' : 'border-muted-foreground'
                  }`}>
                    {isSelected && (
                      <div className="h-2 w-2 rounded-full bg-black" />
                    )}
                  </div>
                  <span className="font-medium">Solution {index + 1}</span>
                </div>

                <div className="flex items-center gap-3">
                  {totalWeight !== undefined && (
                    <span className="text-sm font-semibold">
                      {totalWeight.toFixed(1)} kg/m
                    </span>
                  )}
                  {allPassed ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  )}
                </div>
              </div>

              {description.length > 0 && (
                <div className="pl-7">
                  <p className="text-xs text-muted-foreground">
                    {description.join(' • ')}
                  </p>
                </div>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
