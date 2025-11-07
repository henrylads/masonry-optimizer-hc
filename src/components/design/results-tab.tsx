'use client'

import { useState } from 'react'
import { ChevronRight, CheckCircle, XCircle, Weight, DollarSign } from 'lucide-react'
import type { OptimisationResult } from '@/types/optimization-types'

interface ResultsTabProps {
  result: OptimisationResult
}

export function ResultsTab({ result }: ResultsTabProps) {
  const [summaryExpanded, setSummaryExpanded] = useState(true)
  const [parametersExpanded, setParametersExpanded] = useState(false)
  const [verificationExpanded, setVerificationExpanded] = useState(false)

  const allChecksPassed = result.verificationResults?.allChecksPassed ?? false

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
            <div className="flex items-center gap-3">
              <Weight className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Total Weight</p>
                <p className="text-2xl font-bold">
                  {result.totalWeight?.toFixed(2)} kg
                </p>
              </div>
            </div>

            {result.estimatedCost && (
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Estimated Cost</p>
                  <p className="text-xl font-semibold">
                    £{result.estimatedCost.toFixed(2)}
                  </p>
                </div>
              </div>
            )}

            <div className="pt-2 border-t">
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
              <span className="font-medium">{result.bracketType || 'N/A'}</span>

              <span className="text-muted-foreground">Angle Size:</span>
              <span className="font-medium">{result.angleSize || 'N/A'}</span>

              <span className="text-muted-foreground">Material:</span>
              <span className="font-medium">{result.material || 'N/A'}</span>

              {result.channelProduct && (
                <>
                  <span className="text-muted-foreground">Channel:</span>
                  <span className="font-medium">{result.channelProduct}</span>
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

        {verificationExpanded && result.verificationResults && (
          <div className="p-4 space-y-2">
            <VerificationCheck
              name="Shear Check"
              passed={result.verificationResults.shearCheck?.passed ?? false}
              utilization={result.verificationResults.shearCheck?.utilization}
            />
            <VerificationCheck
              name="Tension Check"
              passed={result.verificationResults.tensionCheck?.passed ?? false}
              utilization={result.verificationResults.tensionCheck?.utilization}
            />
            <VerificationCheck
              name="Moment Check"
              passed={result.verificationResults.momentCheck?.passed ?? false}
              utilization={result.verificationResults.momentCheck?.utilization}
            />
            <VerificationCheck
              name="Deflection Check"
              passed={result.verificationResults.deflectionCheck?.passed ?? false}
              utilization={result.verificationResults.deflectionCheck?.utilization}
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
