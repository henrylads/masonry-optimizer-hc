'use client'

import { useState } from 'react'
import { ChevronRight, CheckCircle, XCircle, Weight } from 'lucide-react'
import type { OptimisationResult } from '@/types/optimization-types'

interface ResultsTabProps {
  result: OptimisationResult
}

export function ResultsTab({ result }: ResultsTabProps) {
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

            <div className="grid grid-cols-2 gap-3 pt-3">
              <div>
                <p className="text-sm text-muted-foreground">Configuration</p>
                <p className="text-sm font-medium">
                  {result.genetic.bracket_type || 'Standard'} / {result.genetic.channel_type || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bracket Centres</p>
                <p className="text-sm font-medium">{result.genetic.bracket_centres}mm</p>
              </div>
            </div>

            {/* Applied Forces */}
            {result.calculated?.shear_load !== undefined && (
              <div className="pt-3 border-t">
                <p className="text-sm font-semibold mb-2">Applied Forces</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Shear Force (V_ed):</span>
                  <span className="font-medium">{result.calculated.shear_load.toFixed(3)} kN</span>

                  {result.calculated.detailed_verification_results?.momentResults?.M_ed_angle !== undefined && (
                    <>
                      <span className="text-muted-foreground">Fixing Moment (M_ed):</span>
                      <span className="font-medium">
                        {result.calculated.detailed_verification_results.momentResults.M_ed_angle.toFixed(3)} kNm
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

            {/* System Deflection */}
            {result.calculated.total_deflection !== undefined && (
              <div className="pt-3 border-t">
                <p className="text-sm font-semibold mb-2">System Deflection</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Total Deflection:</span>
                  <span className="font-medium">{result.calculated.total_deflection.toFixed(2)} mm</span>

                  {result.calculated.detailed_verification_results?.deflectionResults?.deflection_limit_ratio !== undefined && (
                    <>
                      <span className="text-muted-foreground">Utilization:</span>
                      <span className={`font-medium ${
                        result.calculated.detailed_verification_results.deflectionResults.deflection_limit_ratio <= 1
                          ? 'text-green-700'
                          : 'text-red-700'
                      }`}>
                        {(result.calculated.detailed_verification_results.deflectionResults.deflection_limit_ratio * 100).toFixed(1)}%
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="pt-3 border-t">
              <div className="flex items-center gap-2">
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
                {result.genetic.vertical_leg && result.genetic.horizontal_leg
                  ? `${result.genetic.vertical_leg}x${result.genetic.horizontal_leg}x${result.genetic.angle_thickness}mm`
                  : 'N/A'}
              </span>

              <span className="text-muted-foreground">Bracket Centres:</span>
              <span className="font-medium">{result.genetic.bracket_centres}mm</span>

              <span className="text-muted-foreground">Bracket Thickness:</span>
              <span className="font-medium">{result.genetic.bracket_thickness}mm</span>

              {result.genetic.channel_type && (
                <>
                  <span className="text-muted-foreground">Channel:</span>
                  <span className="font-medium">{result.genetic.channel_type}</span>
                </>
              )}

              <span className="text-muted-foreground">Bolt Diameter:</span>
              <span className="font-medium">M{result.genetic.bolt_diameter}</span>

              {result.calculated.rise_to_bolts !== undefined && (
                <>
                  <span className="text-muted-foreground">Rise to Bolts:</span>
                  <span className="font-medium">{result.calculated.rise_to_bolts.toFixed(1)}mm</span>
                </>
              )}

              {result.genetic.fixing_position !== undefined && (
                <>
                  <span className="text-muted-foreground">Fixing Position:</span>
                  <span className="font-medium">{result.genetic.fixing_position.toFixed(1)}mm</span>
                </>
              )}
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
              utilization={result.calculated.detailed_verification_results.momentResults?.utilisation}
            />
            <VerificationCheck
              name="Shear Check"
              passed={result.calculated.detailed_verification_results.shearResults?.passes ?? false}
              utilization={result.calculated.detailed_verification_results.shearResults?.utilisation}
            />
            <VerificationCheck
              name="Deflection Check"
              passed={result.calculated.detailed_verification_results.deflectionResults?.passes ?? false}
              utilization={result.calculated.detailed_verification_results.deflectionResults?.deflection_limit_ratio}
            />
            <VerificationCheck
              name="Connection Check"
              passed={result.calculated.detailed_verification_results.angleToBracketResults?.passes ?? false}
              utilization={result.calculated.detailed_verification_results.angleToBracketResults?.bearing_utilisation}
            />
            <VerificationCheck
              name="Combined Check"
              passed={result.calculated.detailed_verification_results.combinedResults?.passes ?? false}
              utilization={result.calculated.detailed_verification_results.combinedResults?.utilisation}
            />
            <VerificationCheck
              name="Fixing Check"
              passed={result.calculated.detailed_verification_results.fixingResults?.passes ?? false}
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
          {(utilization * 100).toFixed(1)}%
        </span>
      )}
    </div>
  )
}
