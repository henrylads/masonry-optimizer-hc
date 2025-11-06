'use client'

import { useState } from 'react'
import { Calculator, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import MasonryDensityCalculator from '@/components/masonry-density-calculator'

interface InlineDensityCalculatorProps {
  onValueSelect: (load: number) => void
}

export function InlineDensityCalculator({ onValueSelect }: InlineDensityCalculatorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [calculatedLoad, setCalculatedLoad] = useState<number | null>(null)

  const handleCalculation = (result: number) => {
    setCalculatedLoad(result)
  }

  const handleUseValue = () => {
    if (calculatedLoad !== null) {
      onValueSelect(calculatedLoad)
      setIsOpen(false)
      setCalculatedLoad(null)
    }
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <CollapsibleTrigger asChild>
        <Button
          type="button"
          variant={isOpen ? "secondary" : "outline"}
          className="w-full justify-start"
        >
          <Calculator className="mr-2 h-4 w-4" />
          {isOpen ? 'Hide' : 'Calculate load from'} masonry density
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="pt-4">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Masonry Density Calculator</CardTitle>
                <CardDescription>
                  Calculate characteristic load based on brick density and geometry
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Embed existing calculator component */}
            <MasonryDensityCalculator
              onCalculate={handleCalculation}
              compact
            />

            {calculatedLoad !== null && (
              <div className="mt-4 flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm font-medium">Calculated Load</p>
                  <p className="text-2xl font-bold">{calculatedLoad.toFixed(2)} kN/m</p>
                </div>
                <Button onClick={handleUseValue}>
                  Use This Value
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  )
}
