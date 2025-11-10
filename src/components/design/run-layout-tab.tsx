'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { RunOptimizationResult } from '@/types/runLayout'

interface RunLayoutTabProps {
  runLayoutResult: RunOptimizationResult | null
  runLength: number
  bracketCentres: number
}

export function RunLayoutTab({ runLayoutResult, runLength, bracketCentres }: RunLayoutTabProps) {
  if (!runLayoutResult) {
    return (
      <div className="text-sm text-muted-foreground text-center py-8">
        No run layout data available
      </div>
    )
  }

  const { optimal } = runLayoutResult

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Run Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Run Length:</span>
            <span className="font-medium">{runLength.toFixed(0)}mm</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Bracket Centres:</span>
            <span className="font-medium">{bracketCentres.toFixed(0)}mm</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Number of Pieces:</span>
            <span className="font-medium">{optimal.pieceCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Brackets:</span>
            <span className="font-medium">{optimal.totalBrackets}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Unique Lengths:</span>
            <span className="font-medium">{optimal.uniquePieceLengths}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Avg Spacing:</span>
            <span className="font-medium">{optimal.averageSpacing.toFixed(1)}mm</span>
          </div>
        </CardContent>
      </Card>

      {/* Angle Pieces */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Angle Pieces</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {optimal.pieces.map((piece, index) => (
            <div
              key={index}
              className="p-3 border rounded-lg space-y-2 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">Piece {index + 1}</span>
                <Badge variant={piece.isStandard ? 'default' : 'secondary'}>
                  {piece.isStandard ? 'Standard' : 'Custom'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Length:</span>
                  <span className="ml-1 font-medium">{piece.length.toFixed(0)}mm</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Brackets:</span>
                  <span className="ml-1 font-medium">{piece.bracketCount}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Spacing:</span>
                  <span className="ml-1 font-medium">{piece.spacing.toFixed(0)}mm</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Start Offset:</span>
                  <span className="ml-1 font-medium">{piece.startOffset.toFixed(1)}mm</span>
                </div>
              </div>

              {/* Bracket Positions */}
              <div className="mt-2 pt-2 border-t">
                <div className="text-xs text-muted-foreground mb-1">
                  Bracket Positions (from piece start):
                </div>
                <div className="flex flex-wrap gap-1">
                  {piece.positions.map((pos, posIndex) => (
                    <Badge key={posIndex} variant="outline" className="text-xs">
                      {pos.toFixed(1)}mm
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Visual Representation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Visual Layout</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {optimal.pieces.map((piece, index) => {
              const relativeLength = (piece.length / runLength) * 100
              return (
                <div key={index} className="space-y-1">
                  <div className="text-xs text-muted-foreground">
                    Piece {index + 1} ({piece.length}mm)
                  </div>
                  <div className="relative h-8 bg-muted/30 rounded border">
                    <div
                      className="absolute h-full bg-blue-500/20 border-l-2 border-r-2 border-blue-500"
                      style={{ width: `${relativeLength}%` }}
                    >
                      {/* Bracket markers */}
                      {piece.positions.map((pos, posIndex) => {
                        const relativePos = (pos / piece.length) * 100
                        return (
                          <div
                            key={posIndex}
                            className="absolute top-0 bottom-0 w-0.5 bg-red-500"
                            style={{ left: `${relativePos}%` }}
                            title={`Bracket at ${pos.toFixed(1)}mm`}
                          />
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
