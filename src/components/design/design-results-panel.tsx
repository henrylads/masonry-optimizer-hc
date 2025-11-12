'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ResultsTab } from './results-tab'
import { AlternativesTab } from './alternatives-tab'
import { ComparisonTab } from './comparison-tab'
import { RunLayoutTab } from './run-layout-tab'
import type { OptimisationResult } from '@/types/optimization-types'
import type { RunOptimizationResult } from '@/types/runLayout'
import type { ShapeDiverOutputs } from '@/components/shapediver'

interface DesignResultsPanelProps {
  optimizationResult: OptimisationResult | null
  alternatives: OptimisationResult[]
  selectedIndex: number
  onSelectAlternative: (index: number) => void
  isOpen: boolean
  onToggle: () => void
  runLayoutResult: RunOptimizationResult | null
  runLength: number
  shapeDiverOutputs?: ShapeDiverOutputs | null
}

export function DesignResultsPanel({
  optimizationResult,
  alternatives,
  selectedIndex,
  onSelectAlternative,
  isOpen,
  onToggle,
  runLayoutResult,
  runLength,
  shapeDiverOutputs
}: DesignResultsPanelProps) {
  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full h-20 w-6 bg-white border border-r-0 rounded-l-lg shadow-sm hover:bg-muted/30 transition-colors flex items-center justify-center z-20"
        aria-label={isOpen ? 'Close results panel' : 'Open results panel'}
      >
        {isOpen ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>

      {/* Panel Content */}
      <div
        className={`h-full border-l bg-white transition-all duration-300 ${
          isOpen ? 'w-[350px]' : 'w-0 border-l-0'
        }`}
      >
        {isOpen && (
          <div className="h-full overflow-y-auto">
            {optimizationResult ? (
              <div className="p-4">
                <Tabs defaultValue="results" className="w-full">
                  <TabsList className="w-full grid grid-cols-4 mb-4">
                    <TabsTrigger value="results">Results</TabsTrigger>
                    <TabsTrigger value="alternatives">Alts</TabsTrigger>
                    <TabsTrigger value="comparison">Compare</TabsTrigger>
                    <TabsTrigger value="runlayout">Run</TabsTrigger>
                  </TabsList>

                  <TabsContent value="results">
                    <ResultsTab result={optimizationResult} shapeDiverOutputs={shapeDiverOutputs} />
                  </TabsContent>

                  <TabsContent value="alternatives">
                    <AlternativesTab
                      alternatives={alternatives}
                      selectedIndex={selectedIndex}
                      onSelect={onSelectAlternative}
                    />
                  </TabsContent>

                  <TabsContent value="comparison">
                    <ComparisonTab
                      result={optimizationResult}
                      alternatives={alternatives}
                      selectedIndex={selectedIndex}
                      onSelectAlternative={onSelectAlternative}
                    />
                  </TabsContent>

                  <TabsContent value="runlayout">
                    <RunLayoutTab
                      runLayoutResult={runLayoutResult}
                      runLength={runLength}
                      bracketCentres={optimizationResult?.genetic.bracket_centres ?? 0}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <div className="p-4 flex items-center justify-center h-full">
                <p className="text-sm text-muted-foreground text-center">
                  Run optimization to view results
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
