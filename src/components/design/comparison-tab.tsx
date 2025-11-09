'use client'

import type { OptimisationResult } from '@/types/optimization-types'

interface ComparisonTabProps {
  result: OptimisationResult | null
  alternatives: OptimisationResult[]
  onSelectAlternative: (index: number) => void
  selectedIndex: number
}

interface AlternativeDesign {
  design: {
    genetic: any
    calculated: any
  }
  totalWeight: number
  weightDifferencePercent: number
}

const groupAlternativesByFixingOption = (alternatives: AlternativeDesign[]) => {
  const steelBolts: { [key: string]: AlternativeDesign } = {}
  const concreteChannels: { [key: string]: AlternativeDesign } = {}

  alternatives.forEach(alt => {
    // Group steel bolt sizes + fixing methods (e.g., "M10-SET_SCREW", "M10-BLIND_BOLT")
    if (alt.design.genetic.steel_bolt_size) {
      const boltSize = alt.design.genetic.steel_bolt_size
      const fixingMethod = alt.design.genetic.steel_fixing_method || 'UNKNOWN'
      const key = `${boltSize}-${fixingMethod}`
      if (!steelBolts[key] || alt.totalWeight < steelBolts[key].totalWeight) {
        steelBolts[key] = alt
      }
    }

    // Group concrete channels (including R-HPTIII)
    if (alt.design.genetic.channel_type) {
      const channelType = alt.design.genetic.channel_type
      if (!concreteChannels[channelType] || alt.totalWeight < concreteChannels[channelType].totalWeight) {
        concreteChannels[channelType] = alt
      }
    }
  })

  return { steelBolts, concreteChannels }
}

export function ComparisonTab({
  result,
  alternatives,
  onSelectAlternative,
  selectedIndex
}: ComparisonTabProps) {
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">
          Run optimization to see comparison
        </p>
      </div>
    )
  }

  // Include the optimal design in the comparison
  const optimalDesign: AlternativeDesign = {
    design: { genetic: result.genetic, calculated: result.calculated },
    totalWeight: result.calculated?.weights?.totalWeight || 0,
    weightDifferencePercent: 0
  }

  const allDesigns = [optimalDesign, ...alternatives.map((alt, idx) => ({
    design: { genetic: alt.genetic, calculated: alt.calculated },
    totalWeight: alt.calculated?.weights?.totalWeight || 0,
    weightDifferencePercent: ((alt.calculated?.weights?.totalWeight || 0) - optimalDesign.totalWeight) / optimalDesign.totalWeight * 100
  }))]

  const { steelBolts, concreteChannels } = groupAlternativesByFixingOption(allDesigns)

  const hasSteelOptions = Object.keys(steelBolts).length > 0
  const hasConcreteOptions = Object.keys(concreteChannels).length > 0

  if (!hasSteelOptions && !hasConcreteOptions) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">
          No fixing options to compare
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground mb-4">
          Compare best designs across different fixing options
        </p>
      </div>

      {/* Steel Bolt Options */}
      {hasSteelOptions && (
        <div>
          <h4 className="font-semibold mb-3">Steel Bolt Options</h4>
          {Object.keys(steelBolts).length === 1 && (
            <p className="text-xs text-muted-foreground mb-3 italic">
              Optimization found only {Object.keys(steelBolts)[0]} produces valid designs. Other bolt sizes were eliminated as heavier or invalid.
            </p>
          )}
          <div className="grid grid-cols-1 gap-3">
            {Object.keys(steelBolts).sort().map(key => {
              const design = steelBolts[key]

              // Parse the key to extract bolt size and fixing method
              const [boltSize, fixingMethod] = key.split('-')
              const fixingLabel = fixingMethod === 'SET_SCREW' ? 'Set Screw' :
                                 fixingMethod === 'BLIND_BOLT' ? 'Blind Bolt' :
                                 fixingMethod

              const isOptimal = design.weightDifferencePercent === 0

              // Find the index of this design in the alternatives array
              const designIndex = isOptimal ? 0 : alternatives.findIndex(alt =>
                alt.genetic?.steel_bolt_size === boltSize &&
                alt.genetic?.steel_fixing_method === fixingMethod
              ) + 1

              // Check if this design is currently displayed
              const isCurrentlyViewed = selectedIndex === (designIndex - 1)

              const handleClick = () => {
                onSelectAlternative(designIndex - 1)
              }

              return (
                <button
                  key={key}
                  onClick={handleClick}
                  className={`p-4 rounded-lg border-2 transition-all text-left w-full ${
                    isCurrentlyViewed
                      ? 'border-black bg-black/5'
                      : isOptimal
                        ? 'border-green-500 bg-green-50 hover:bg-green-100'
                        : 'border-border hover:border-black/30 hover:bg-muted/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-bold text-base">{boltSize}</span>
                      <span className="block text-xs text-muted-foreground mt-0.5">{fixingLabel}</span>
                    </div>
                    <div className="flex gap-1">
                      {isCurrentlyViewed && (
                        <span className="text-xs font-semibold px-2 py-1 bg-black text-white rounded">VIEWING</span>
                      )}
                      {isOptimal && (
                        <span className="text-xs font-semibold px-2 py-1 bg-green-600 text-white rounded">OPTIMAL</span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Weight:</span>
                      <span className="font-semibold">{design.totalWeight.toFixed(2)} kg/m</span>
                    </div>
                    {!isOptimal && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">vs Optimal:</span>
                        <span className="text-amber-600 font-semibold">+{design.weightDifferencePercent.toFixed(1)}%</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bracket:</span>
                      <span className="text-xs">{design.design.genetic.bracket_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Centres:</span>
                      <span className="text-xs">{design.design.genetic.bracket_centres} mm</span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Concrete Channel Options */}
      {hasConcreteOptions && (
        <div>
          <h4 className="font-semibold mb-3">Concrete Channel Options</h4>
          {Object.keys(concreteChannels).length === 1 && (
            <p className="text-xs text-muted-foreground mb-3 italic">
              Optimization found only {Object.keys(concreteChannels)[0]} produces valid designs. Other channel types were eliminated as heavier or invalid.
            </p>
          )}
          <div className="grid grid-cols-1 gap-3">
            {Object.keys(concreteChannels).sort().map(channelType => {
              const design = concreteChannels[channelType]
              const isOptimal = design.weightDifferencePercent === 0
              const isRHPTIII = channelType.startsWith('R-HPTIII')

              // Find the index of this design in the alternatives array
              const designIndex = isOptimal ? 0 : alternatives.findIndex(alt =>
                alt.genetic?.channel_type === channelType
              ) + 1

              // Check if this design is currently displayed
              const isCurrentlyViewed = selectedIndex === (designIndex - 1)

              const handleClick = () => {
                onSelectAlternative(designIndex - 1)
              }

              return (
                <button
                  key={channelType}
                  onClick={handleClick}
                  className={`p-4 rounded-lg border-2 transition-all text-left w-full ${
                    isCurrentlyViewed
                      ? 'border-black bg-black/5'
                      : isOptimal
                        ? 'border-green-500 bg-green-50 hover:bg-green-100'
                        : isRHPTIII
                          ? 'border-orange-300 bg-orange-50 hover:bg-orange-100'
                          : 'border-border hover:border-black/30 hover:bg-muted/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-bold text-base">{channelType}</span>
                      {isRHPTIII && (
                        <span className="block text-xs text-orange-700 mt-0.5">Post-fix Anchor</span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {isCurrentlyViewed && (
                        <span className="text-xs font-semibold px-2 py-1 bg-black text-white rounded">VIEWING</span>
                      )}
                      {isOptimal && (
                        <span className="text-xs font-semibold px-2 py-1 bg-green-600 text-white rounded">OPTIMAL</span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Weight:</span>
                      <span className="font-semibold">{design.totalWeight.toFixed(2)} kg/m</span>
                    </div>
                    {!isOptimal && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">vs Optimal:</span>
                        <span className="text-amber-600 font-semibold">+{design.weightDifferencePercent.toFixed(1)}%</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bracket:</span>
                      <span className="text-xs">{design.design.genetic.bracket_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Centres:</span>
                      <span className="text-xs">{design.design.genetic.bracket_centres} mm</span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
