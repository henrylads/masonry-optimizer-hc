"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Ruler, Package, Settings } from 'lucide-react';
import { optimizeRunLayout } from '@/calculations/runLayoutOptimizer';
import type { RunOptimizationRequest, RunOptimizationResult } from '@/types/runLayout';

interface RunLayoutDisplayProps {
  bracketCentres: number; // From optimization results
}

export function RunLayoutDisplay({ bracketCentres }: RunLayoutDisplayProps) {
  const [totalRunLength, setTotalRunLength] = useState<number>(2321); // Default to worked example
  const [result, setResult] = useState<RunOptimizationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const calculateLayout = () => {
    setIsCalculating(true);
    try {
      const request: RunOptimizationRequest = {
        totalRunLength,
        bracketCentres,
        minEdgeDistance: 35,
        maxEdgeDistance: 0.5 * bracketCentres
      };

      const optimizationResult = optimizeRunLayout(request);
      setResult(optimizationResult);
    } catch (error) {
      console.error('Run layout optimization failed:', error);
      alert('Failed to calculate run layout: ' + (error as Error).message);
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ruler className="h-5 w-5" />
          Multi-Piece Run Layout Optimizer
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Optimize angle piece layout for runs from 0 to 250+ meters
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Section */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalRunLength">Total Run Length (mm)</Label>
              <Input
                id="totalRunLength"
                type="number"
                value={totalRunLength}
                onChange={(e) => setTotalRunLength(Number(e.target.value))}
                min={0}
                max={250000}
                step={5}
              />
              <p className="text-xs text-muted-foreground">
                Range: 0 - 250,000mm (250m)
              </p>
            </div>

            <div className="space-y-2">
              <Label>Bracket Centres (from optimization)</Label>
              <Input
                type="number"
                value={bracketCentres}
                disabled
                className="bg-gray-100"
              />
              <p className="text-xs text-muted-foreground">
                From optimization results
              </p>
            </div>

            <div className="flex items-end">
              <Button
                onClick={calculateLayout}
                disabled={isCalculating || totalRunLength <= 0}
                className="w-full"
              >
                {isCalculating ? 'Calculating...' : 'Calculate Layout'}
              </Button>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {result && (
          <div className="space-y-6 pt-4 border-t">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Total Pieces</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {result.optimal.pieceCount}
                      </p>
                    </div>
                    <Package className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600 font-medium">Total Brackets</p>
                      <p className="text-2xl font-bold text-green-900">
                        {result.optimal.totalBrackets}
                      </p>
                    </div>
                    <Settings className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-600 font-medium">Angle Length</p>
                      <p className="text-2xl font-bold text-purple-900">
                        {(result.materialSummary.totalAngleLength / 1000).toFixed(2)}m
                      </p>
                    </div>
                    <Ruler className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-orange-600 font-medium">Avg Spacing</p>
                      <p className="text-2xl font-bold text-orange-900">
                        {result.optimal.averageSpacing.toFixed(0)}mm
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Piece Breakdown Table */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Piece Configuration</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Piece #</TableHead>
                    <TableHead>Length (mm)</TableHead>
                    <TableHead>Brackets</TableHead>
                    <TableHead>Spacing (mm)</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Positions (mm)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.optimal.pieces.map((piece, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{piece.length}</TableCell>
                      <TableCell>{piece.bracketCount}</TableCell>
                      <TableCell>{piece.spacing}</TableCell>
                      <TableCell>
                        <Badge variant={piece.isStandard ? "default" : "secondary"}>
                          {piece.isStandard ? 'Standard' : 'Non-Standard'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        [{piece.positions.map(p => p.toFixed(1)).join(', ')}]
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Visual Representation */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Visual Layout</h3>
              <div className="space-y-6">
                {/* Continuous layout visualization */}
                <div className="overflow-x-auto pb-4">
                  <div className="min-w-full pt-8" style={{ minWidth: '800px' }}>
                    <div className="relative h-32 bg-gray-100 border border-gray-300 rounded" style={{ marginTop: '24px' }}>
                      {(() => {
                        // Calculate total length including all gaps
                        const totalLength = result.optimal.totalLength;
                        let cumulativePosition = 10; // Start gap
                        const elements: JSX.Element[] = [];

                        // Add start gap indicator
                        elements.push(
                          <div
                            key="gap-start"
                            className="absolute h-full bg-orange-200 border-l-2 border-r-2 border-orange-400"
                            style={{
                              left: '0%',
                              width: `${(10 / totalLength) * 100}%`
                            }}
                            title="10mm gap"
                          />
                        );

                        result.optimal.pieces.forEach((piece, pieceIndex) => {
                          const pieceStartPercent = (cumulativePosition / totalLength) * 100;
                          const pieceWidthPercent = (piece.length / totalLength) * 100;

                          // Draw piece background
                          elements.push(
                            <div
                              key={`piece-${pieceIndex}`}
                              className="absolute h-full bg-blue-100 border-l-2 border-r-2 border-blue-300"
                              style={{
                                left: `${pieceStartPercent}%`,
                                width: `${pieceWidthPercent}%`
                              }}
                              title={`Piece ${pieceIndex + 1}: ${piece.length}mm`}
                            />
                          );

                          // Draw brackets within piece
                          piece.positions.forEach((pos, bracketIndex) => {
                            const absolutePos = cumulativePosition + pos;
                            const bracketPercent = (absolutePos / totalLength) * 100;

                            elements.push(
                              <div
                                key={`bracket-${pieceIndex}-${bracketIndex}`}
                                className="absolute h-full w-1 bg-[#c2f20e] border-l-2 border-r-2 border-gray-700 z-10"
                                style={{ left: `${bracketPercent}%` }}
                                title={`Bracket at ${absolutePos.toFixed(1)}mm`}
                              >
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-gray-700 whitespace-nowrap">
                                  {absolutePos.toFixed(0)}
                                </div>
                              </div>
                            );

                            // Draw spacing label between brackets
                            if (bracketIndex < piece.positions.length - 1) {
                              const nextPos = piece.positions[bracketIndex + 1];
                              const spacing = nextPos - pos;
                              const midpoint = cumulativePosition + pos + spacing / 2;
                              const midpointPercent = (midpoint / totalLength) * 100;

                              elements.push(
                                <div
                                  key={`spacing-${pieceIndex}-${bracketIndex}`}
                                  className="absolute -top-5 text-xs font-semibold text-blue-600"
                                  style={{ left: `${midpointPercent}%`, transform: 'translateX(-50%)' }}
                                >
                                  {spacing.toFixed(0)}
                                </div>
                              );
                            }
                          });

                          // Piece label at bottom
                          elements.push(
                            <div
                              key={`label-${pieceIndex}`}
                              className="absolute -bottom-8 text-xs text-gray-600"
                              style={{ left: `${pieceStartPercent + pieceWidthPercent / 2}%`, transform: 'translateX(-50%)' }}
                            >
                              Piece {pieceIndex + 1}: {piece.length}mm
                            </div>
                          );

                          // Add spacing label across gap to next piece
                          if (pieceIndex < result.optimal.pieces.length - 1) {
                            const nextPiece = result.optimal.pieces[pieceIndex + 1];
                            const lastBracketThisPiece = piece.positions[piece.positions.length - 1];
                            const firstBracketNextPiece = nextPiece.positions[0];

                            // Distance from last bracket of this piece to first bracket of next piece
                            // = (piece.length - lastBracketPos) + 10mm gap + firstBracketNextPiece
                            const gapSpacing = (piece.length - lastBracketThisPiece) + 10 + firstBracketNextPiece;

                            // Position for label is at the center of this cross-gap distance
                            const crossGapMidpoint = cumulativePosition + lastBracketThisPiece + gapSpacing / 2;
                            const crossGapMidpointPercent = (crossGapMidpoint / totalLength) * 100;

                            elements.push(
                              <div
                                key={`cross-gap-spacing-${pieceIndex}`}
                                className="absolute -top-5 text-xs font-bold text-orange-600 bg-white px-1 rounded border border-orange-300"
                                style={{ left: `${crossGapMidpointPercent}%`, transform: 'translateX(-50%)' }}
                              >
                                {gapSpacing.toFixed(0)}
                              </div>
                            );
                          }

                          cumulativePosition += piece.length + 10; // Add gap after piece

                          // Add gap indicator after piece (if not last)
                          if (pieceIndex < result.optimal.pieces.length - 1) {
                            const gapStartPercent = (cumulativePosition - 10) / totalLength * 100;
                            elements.push(
                              <div
                                key={`gap-${pieceIndex}`}
                                className="absolute h-full bg-orange-200 border-l-2 border-r-2 border-orange-400"
                                style={{
                                  left: `${gapStartPercent}%`,
                                  width: `${(10 / totalLength) * 100}%`
                                }}
                                title="10mm gap"
                              />
                            );
                          }
                        });

                        // Add end gap indicator
                        const endGapPercent = ((totalLength - 10) / totalLength) * 100;
                        elements.push(
                          <div
                            key="gap-end"
                            className="absolute h-full bg-orange-200 border-l-2 border-r-2 border-orange-400"
                            style={{
                              left: `${endGapPercent}%`,
                              width: `${(10 / totalLength) * 100}%`
                            }}
                            title="10mm gap"
                          />
                        );

                        return elements;
                      })()}
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-[#c2f20e] border border-gray-700"></div>
                    <span>Bracket</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-100 border border-blue-300"></div>
                    <span>Angle piece</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-orange-200 border border-orange-400"></div>
                    <span>10mm gap</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-blue-600">500</span>
                    <span>= Bracket centres within piece (mm)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-orange-600 bg-white px-1 border rounded">415</span>
                    <span>= Bracket centres across gap (mm)</span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Total run: {result.optimal.totalLength}mm ({result.optimal.gapCount} gaps × 10mm = {result.optimal.totalGapDistance}mm)
                </p>
              </div>
            </div>

            {/* Material Summary */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Material Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                {result.materialSummary.pieceLengthBreakdown.map((item, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">
                        {item.count}× {item.length}mm
                      </span>
                      <Badge variant={item.isStandard ? "default" : "outline"}>
                        {item.isStandard ? 'Standard' : 'Custom'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Alternative Options */}
            {result.allOptions.length > 1 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Alternative Options ({result.allOptions.length - 1} more)
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Option</TableHead>
                      <TableHead>Configuration</TableHead>
                      <TableHead>Pieces</TableHead>
                      <TableHead>Brackets</TableHead>
                      <TableHead>Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.allOptions.slice(0, 5).map((option, index) => (
                      <TableRow key={index} className={index === 0 ? 'bg-green-50' : ''}>
                        <TableCell>
                          {index === 0 ? (
                            <Badge className="bg-green-600">Optimal</Badge>
                          ) : (
                            `Option ${index + 1}`
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          {option.pieces.map(p => `${p.length}mm`).join(' + ')}
                        </TableCell>
                        <TableCell>{option.pieceCount}</TableCell>
                        <TableCell>{option.totalBrackets}</TableCell>
                        <TableCell>{option.score.toFixed(0)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}

        {!result && (
          <div className="text-center py-8 text-muted-foreground">
            <Ruler className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Enter a total run length and click "Calculate Layout" to optimize your run</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
