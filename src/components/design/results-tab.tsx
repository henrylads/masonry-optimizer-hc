'use client'

import { useState } from 'react'
import { ChevronRight, CheckCircle, XCircle, Weight, Ruler, ArrowDown, Leaf } from 'lucide-react'
import type { OptimisationResult } from '@/types/optimization-types'
import type { ShapeDiverOutputs } from '@/components/shapediver'

interface ResultsTabProps {
  result: OptimisationResult
  shapeDiverOutputs?: ShapeDiverOutputs | null
}

export function ResultsTab({ result, shapeDiverOutputs }: ResultsTabProps) {
  const [summaryExpanded, setSummaryExpanded] = useState(true)
  const [parametersExpanded, setParametersExpanded] = useState(false)
  const [verificationExpanded, setVerificationExpanded] = useState(false)

  const allChecksPassed = result.calculated.detailed_verification_results?.passes ??
                          result.calculated.all_checks_pass ??
                          false
  const totalWeight = result.calculated.weights?.totalWeight

  return (
    <div className="space-y-4">
      {/* Design Summary */}
      <div className="border rounded-lg overflow-hidden">
        <button
          onClick={() => setSummaryExpanded(!summaryExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <span className="font-semibold">Design Summary</span>
          <ChevronRight
            className={`h-4 w-4 transition-transform ${summaryExpanded ? 'rotate-90' : ''}`}
          />
        </button>

        {summaryExpanded && (
          <div className="p-4 space-y-3">
            {totalWeight !== undefined && (
              <div className="flex items-center gap-3">
                <Weight className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Weight</p>
                  <p className="text-2xl font-bold">
                    {totalWeight.toFixed(2)} kg/m
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Ruler className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Bracket Centres</p>
                <p className="text-2xl font-bold">
                  {result.genetic.bracket_centres}mm
                </p>
              </div>
            </div>

            {result.calculated.detailed_verification_results?.totalDeflectionResults !== undefined && (
              <div className="flex items-center gap-3">
                <ArrowDown className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Total System Deflection</p>
                  <p className="text-2xl font-bold">
                    {result.calculated.detailed_verification_results.totalDeflectionResults.Total_deflection_of_system.toFixed(2)} mm
                  </p>
                </div>
              </div>
            )}

            {/* ShapeDiver Outputs */}
            {shapeDiverOutputs?.totalSystemWeight !== undefined && (
              <div className="flex items-center gap-3">
                <Weight className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Total System Weight</p>
                  <p className="text-2xl font-bold">
                    {shapeDiverOutputs.totalSystemWeight.toFixed(2)} kg
                  </p>
                </div>
              </div>
            )}

            {shapeDiverOutputs?.totalSystemEmbodiedCarbon !== undefined && (
              <div className="flex items-center gap-3">
                <Leaf className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Embodied Carbon</p>
                  <p className="text-2xl font-bold">
                    {shapeDiverOutputs.totalSystemEmbodiedCarbon.toFixed(2)} kgCO2e
                  </p>
                </div>
              </div>
            )}

            {/* Applied Forces */}
            {result.calculated?.shear_load !== undefined && (
              <div className="pt-3 border-t">
                <p className="text-sm font-semibold mb-2">Applied Forces</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Shear Force (V_ed):</span>
                  <span className="font-medium">{result.calculated.shear_load.toFixed(3)} kN</span>

                  {result.calculated?.m_ed !== undefined && (
                    <>
                      <span className="text-muted-foreground">Fixing Moment (M_ed):</span>
                      <span className="font-medium">
                        {result.calculated.m_ed.toFixed(3)} kNm
                      </span>
                    </>
                  )}

                  {result.calculated.detailed_verification_results?.combinedResults?.N_ed !== undefined && (
                    <>
                      <span className="text-muted-foreground">Tension (N_ed):</span>
                      <span className="font-medium">
                        {result.calculated.detailed_verification_results.combinedResults.N_ed.toFixed(3)} kN
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}


            <div className="pt-3 border-t">
              <div className="flex items-center gap-2 mb-2">
                {allChecksPassed ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-medium text-green-700">All checks passed</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span className="text-sm font-medium text-red-700">Some checks failed</span>
                  </>
                )}
              </div>

              {/* Verification Check Utilizations */}
              {result.calculated.detailed_verification_results && (
                <div className="space-y-1 text-xs">
                  {result.calculated.detailed_verification_results.momentResults?.utilisation !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Moment:</span>
                      <span className={`font-medium ${result.calculated.detailed_verification_results.momentResults.passes ? 'text-green-600' : 'text-red-600'}`}>
                        {result.calculated.detailed_verification_results.momentResults.utilisation.toFixed(1)}%
                      </span>
                    </div>
                  )}
                  {result.calculated.detailed_verification_results.shearResults?.utilisation !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Shear:</span>
                      <span className={`font-medium ${result.calculated.detailed_verification_results.shearResults.passes ? 'text-green-600' : 'text-red-600'}`}>
                        {result.calculated.detailed_verification_results.shearResults.utilisation.toFixed(1)}%
                      </span>
                    </div>
                  )}
                  {result.calculated.detailed_verification_results.deflectionResults?.utilization !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Deflection:</span>
                      <span className={`font-medium ${result.calculated.detailed_verification_results.deflectionResults.passes ? 'text-green-600' : 'text-red-600'}`}>
                        {result.calculated.detailed_verification_results.deflectionResults.utilization.toFixed(1)}%
                      </span>
                    </div>
                  )}
                  {result.calculated.detailed_verification_results.angleToBracketResults?.U_c_bolt !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Connection:</span>
                      <span className={`font-medium ${result.calculated.detailed_verification_results.angleToBracketResults.passes ? 'text-green-600' : 'text-red-600'}`}>
                        {result.calculated.detailed_verification_results.angleToBracketResults.U_c_bolt.toFixed(1)}%
                      </span>
                    </div>
                  )}
                  {result.calculated.detailed_verification_results.combinedResults?.U_c !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Combined:</span>
                      <span className={`font-medium ${result.calculated.detailed_verification_results.combinedResults.passes ? 'text-green-600' : 'text-red-600'}`}>
                        {result.calculated.detailed_verification_results.combinedResults.U_c.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Design Parameters */}
      <div className="border rounded-lg overflow-hidden">
        <button
          onClick={() => setParametersExpanded(!parametersExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <span className="font-semibold">Design Parameters</span>
          <ChevronRight
            className={`h-4 w-4 transition-transform ${parametersExpanded ? 'rotate-90' : ''}`}
          />
        </button>

        {parametersExpanded && (
          <div className="p-4 space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Bracket Type:</span>
              <span className="font-medium">{result.genetic.bracket_type || 'Standard'}</span>

              <span className="text-muted-foreground">Angle Size:</span>
              <span className="font-medium">
                {(() => {
                  // Use extended angle height if angle extension was applied
                  const angleExtension = result.calculated?.angle_extension_result;
                  const verticalLeg = angleExtension?.extension_applied
                    ? angleExtension.extended_angle_height
                    : result.genetic.vertical_leg;

                  return verticalLeg && result.genetic.horizontal_leg
                    ? `${verticalLeg}x${result.genetic.horizontal_leg}x${result.genetic.angle_thickness}mm`
                    : 'N/A';
                })()}
              </span>

              <span className="text-muted-foreground">Bracket Centres:</span>
              <span className="font-medium">{result.genetic.bracket_centres}mm</span>

              <span className="text-muted-foreground">Bracket Thickness:</span>
              <span className="font-medium">{result.genetic.bracket_thickness}mm</span>

              {(result.genetic.bracket_height || result.calculated.bracket_height) && (
                <>
                  <span className="text-muted-foreground">Bracket Height:</span>
                  <span className="font-medium">
                    {(result.genetic.bracket_height || result.calculated.bracket_height)?.toFixed(1)}mm
                  </span>
                </>
              )}

              {(result.calculated.facade_thickness || result.calculated.masonry_thickness) && (
                <>
                  <span className="text-muted-foreground">Facade Thickness:</span>
                  <span className="font-medium">
                    {(result.calculated.facade_thickness || result.calculated.masonry_thickness)}mm
                  </span>
                </>
              )}

              {result.genetic.channel_type && (
                <>
                  <span className="text-muted-foreground">Channel:</span>
                  <span className="font-medium">{result.genetic.channel_type}</span>
                </>
              )}

              <span className="text-muted-foreground">Bolt Diameter:</span>
              <span className="font-medium">M{result.genetic.bolt_diameter}</span>

              {result.calculated.rise_to_bolts_display !== undefined && (
                <>
                  <span className="text-muted-foreground">Rise to Bolts:</span>
                  <span className="font-medium">{result.calculated.rise_to_bolts_display.toFixed(1)}mm</span>
                </>
              )}

              {result.genetic.fixing_position !== undefined && (
                <>
                  <span className="text-muted-foreground">Fixing Position:</span>
                  <span className="font-medium">{result.genetic.fixing_position.toFixed(1)}mm</span>
                </>
              )}

              <span className="text-muted-foreground">Load Position:</span>
              <span className="font-medium">
                {((result.calculated.load_position ?? (1/3)) * 100).toFixed(0)}% from edge
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Verification Checks */}
      <div className="border rounded-lg overflow-hidden">
        <button
          onClick={() => setVerificationExpanded(!verificationExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <span className="font-semibold">Verification Checks</span>
          <ChevronRight
            className={`h-4 w-4 transition-transform ${verificationExpanded ? 'rotate-90' : ''}`}
          />
        </button>

        {verificationExpanded && result.calculated.detailed_verification_results && (
          <div className="p-4 space-y-2">
            <VerificationCheck
              name="Moment Check"
              passed={result.calculated.detailed_verification_results.momentResults?.passes ?? false}
              utilization={result.calculated.detailed_verification_results.momentResults?.utilization}
            />
            <VerificationCheck
              name="Shear Check"
              passed={result.calculated.detailed_verification_results.shearResults?.passes ?? false}
              utilization={result.calculated.detailed_verification_results.shearResults?.utilization}
            />
            <VerificationCheck
              name="Deflection Check"
              passed={result.calculated.detailed_verification_results.totalDeflectionResults?.passes ?? false}
              utilization={result.calculated.detailed_verification_results.totalDeflectionResults?.Total_deflection_of_system ? (result.calculated.detailed_verification_results.totalDeflectionResults.Total_deflection_of_system / 2) * 100 : undefined}
            />
            <VerificationCheck
              name="Connection Check"
              passed={result.calculated.detailed_verification_results.angleToBracketResults?.passes ?? false}
              utilization={result.calculated.detailed_verification_results.angleToBracketResults?.U_c_bolt}
            />
            <VerificationCheck
              name="Combined Check"
              passed={result.calculated.detailed_verification_results.combinedResults?.passes ?? false}
              utilization={result.calculated.detailed_verification_results.combinedResults?.U_c}
            />
            <VerificationCheck
              name="Fixing Check"
              passed={result.calculated.detailed_verification_results.fixingResults?.passes ?? false}
              utilization={result.calculated.detailed_verification_results.fixingResults?.utilization}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function VerificationCheck({
  name,
  passed,
  utilization
}: {
  name: string
  passed: boolean
  utilization?: number
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <div className="flex items-center gap-2">
        {passed ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
          <XCircle className="h-4 w-4 text-red-500" />
        )}
        <span className="text-sm">{name}</span>
      </div>
      {utilization !== undefined && (
        <span className={`text-sm font-medium ${
          passed ? 'text-green-700' : 'text-red-700'
        }`}>
          {utilization.toFixed(1)}%
        </span>
      )}
    </div>
  )
}
