'use client'

import { OptimisationResult, GenerationSummary } from '@/types/optimization-types'
import { FormDataType } from '@/types/form-schema'
import { ResultsDisplay } from '@/components/results-display'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'

interface IntegratedResultsProps {
  result: OptimisationResult
  history?: GenerationSummary[]
  designInputs?: FormDataType
  onCompare?: () => void
}

export function IntegratedResults({
  result,
  history = [],
  designInputs,
  onCompare
}: IntegratedResultsProps) {
  return (
    <div className="space-y-6 mt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Optimization Results</h2>
        {onCompare && (
          <Button variant="outline" onClick={onCompare}>
            Compare with Other Designs
          </Button>
        )}
      </div>

      <Tabs defaultValue="results" className="w-full">
        <TabsList>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="layout">Run Layout</TabsTrigger>
        </TabsList>

        <TabsContent value="results" className="space-y-4">
          <ResultsDisplay
            result={result}
            history={history}
            designInputs={designInputs}
          />
        </TabsContent>

        <TabsContent value="layout" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Run Layout Visualization</CardTitle>
              <CardDescription>
                Auto-generated bracket and angle arrangement
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Run layout component will go here */}
              <div className="text-center py-8 text-muted-foreground">
                Run layout visualization will be integrated here
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
