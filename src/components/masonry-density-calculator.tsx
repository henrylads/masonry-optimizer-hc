'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowRight } from 'lucide-react';
import { calculateBrickDensity, calculateLineLoad } from '@/calculations/masonryDensity';
import type {
  BrickDensityInputs,
  LineLoadInputs,
  BrickDensityResults,
  LineLoadResults,
} from '@/types/masonryDensity';

const DEFAULT_BRICK_LENGTH = 225; // mm
const DEFAULT_BRICK_WIDTH = 75; // mm
const DEFAULT_BRICK_HEIGHT = 102.5; // mm
const DEFAULT_MORTAR_DENSITY = 2000; // kg/m3
const DEFAULT_NUMBER_OF_REVEALS = 2;
const DEFAULT_REVEAL_LENGTH = 215; // mm

export default function MasonryDensityCalculator() {
  const router = useRouter();

  // Brick Density Inputs
  const [weightPerPack, setWeightPerPack] = useState<number>(0);
  const [numberOfBricks, setNumberOfBricks] = useState<number>(0);
  const [mortarDensity, setMortarDensity] = useState<number>(DEFAULT_MORTAR_DENSITY);
  const [brickLength, setBrickLength] = useState<number>(DEFAULT_BRICK_LENGTH);
  const [brickWidth, setBrickWidth] = useState<number>(DEFAULT_BRICK_WIDTH);
  const [brickHeight, setBrickHeight] = useState<number>(DEFAULT_BRICK_HEIGHT);

  // Line Load Inputs
  const [elevationArea, setElevationArea] = useState<number>(0);
  const [pierWidth, setPierWidth] = useState<number>(0);
  const [numberOfReveals, setNumberOfReveals] = useState<number>(DEFAULT_NUMBER_OF_REVEALS);
  const [revealHeight, setRevealHeight] = useState<number>(0);
  const [revealLength, setRevealLength] = useState<number>(DEFAULT_REVEAL_LENGTH);

  // Results
  const [brickDensityResults, setBrickDensityResults] = useState<BrickDensityResults | null>(null);
  const [lineLoadResults, setLineLoadResults] = useState<LineLoadResults | null>(null);

  const handleCalculate = () => {
    // Calculate brick density
    const brickDensityInputs: BrickDensityInputs = {
      weightPerPack,
      numberOfBricks,
      mortarDensity,
      brickDimensions: {
        length: brickLength,
        width: brickWidth,
        height: brickHeight,
      },
    };

    const brickResults = calculateBrickDensity(brickDensityInputs);
    setBrickDensityResults(brickResults);

    // Calculate line load
    const lineLoadInputs: LineLoadInputs = {
      elevationArea,
      pierWidth,
      reveals: {
        numberOfReveals,
        revealHeight,
        revealLength,
      },
      brickDimensions: {
        length: brickLength,
        width: brickWidth,
        height: brickHeight,
      },
    };

    const lineResults = calculateLineLoad(lineLoadInputs, brickResults.areaLoadPer102_5);
    setLineLoadResults(lineResults);
  };

  const handleUseInDesigner = () => {
    if (lineLoadResults) {
      // Store the loading value in localStorage
      localStorage.setItem('characteristic_load', lineLoadResults.loadingPerMeter.toString());
      // Navigate to the Support Designer page
      router.push('/');
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Masonry Density Calculator</h1>
        <p className="text-muted-foreground">
          Calculate brick density and loading on piers for masonry support systems
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Brick Density Section */}
        <Card>
          <CardHeader>
            <CardTitle>Brick Density Calculation</CardTitle>
            <CardDescription>Input brick and mortar properties</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="weightPerPack">Weight per Pack (kg)</Label>
              <Input
                id="weightPerPack"
                type="number"
                step="0.01"
                value={weightPerPack || ''}
                onChange={(e) => setWeightPerPack(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="numberOfBricks">Number of Bricks</Label>
              <Input
                id="numberOfBricks"
                type="number"
                value={numberOfBricks || ''}
                onChange={(e) => setNumberOfBricks(parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mortarDensity">Density of Mortar (kg/m³)</Label>
              <Input
                id="mortarDensity"
                type="number"
                value={mortarDensity}
                onChange={(e) => setMortarDensity(parseFloat(e.target.value) || DEFAULT_MORTAR_DENSITY)}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Brick Dimensions (mm)</Label>
              <p className="text-xs text-muted-foreground">Standard dimensions: 225 × 75 × 102.5</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-2">
                <Label htmlFor="brickLength" className="text-xs">Length</Label>
                <Input
                  id="brickLength"
                  type="number"
                  step="0.1"
                  value={brickLength}
                  onChange={(e) => setBrickLength(parseFloat(e.target.value) || DEFAULT_BRICK_LENGTH)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brickWidth" className="text-xs">Width</Label>
                <Input
                  id="brickWidth"
                  type="number"
                  step="0.1"
                  value={brickWidth}
                  onChange={(e) => setBrickWidth(parseFloat(e.target.value) || DEFAULT_BRICK_WIDTH)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brickHeight" className="text-xs">Height</Label>
                <Input
                  id="brickHeight"
                  type="number"
                  step="0.1"
                  value={brickHeight}
                  onChange={(e) => setBrickHeight(parseFloat(e.target.value) || DEFAULT_BRICK_HEIGHT)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Line Load Section */}
        <Card>
          <CardHeader>
            <CardTitle>Line Load Calculation</CardTitle>
            <CardDescription>Input elevation and pier geometry</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="elevationArea">Elevation Area (m²)</Label>
              <Input
                id="elevationArea"
                type="number"
                step="0.000001"
                value={elevationArea || ''}
                onChange={(e) => setElevationArea(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pierWidth">Pier Width (mm)</Label>
              <Input
                id="pierWidth"
                type="number"
                step="1"
                value={pierWidth || ''}
                onChange={(e) => setPierWidth(parseFloat(e.target.value) || 0)}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Reveals</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="numberOfReveals">Number of Reveals</Label>
              <Input
                id="numberOfReveals"
                type="number"
                value={numberOfReveals}
                onChange={(e) => setNumberOfReveals(parseInt(e.target.value) || DEFAULT_NUMBER_OF_REVEALS)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="revealHeight">Reveal Height (m)</Label>
              <Input
                id="revealHeight"
                type="number"
                step="0.001"
                value={revealHeight || ''}
                onChange={(e) => setRevealHeight(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="revealLength">Reveal Length (mm)</Label>
              <Input
                id="revealLength"
                type="number"
                step="1"
                value={revealLength}
                onChange={(e) => setRevealLength(parseFloat(e.target.value) || DEFAULT_REVEAL_LENGTH)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center">
        <Button onClick={handleCalculate} size="lg" className="w-full md:w-auto">
          Calculate
        </Button>
      </div>

      {/* Results Section */}
      {brickDensityResults && lineLoadResults && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Brick Density Results */}
          <Card>
            <CardHeader>
              <CardTitle>Brick Density Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">Weight per Brick (Dry):</div>
                <div className="font-mono">{brickDensityResults.weightPerBrickDry.toFixed(5)} kg</div>

                <div className="text-muted-foreground">Weight per Brick (Saturated):</div>
                <div className="font-mono">{brickDensityResults.weightPerBrickSaturated.toFixed(5)} kg</div>

                <div className="text-muted-foreground">Weight of Mortar per Brick:</div>
                <div className="font-mono">{brickDensityResults.weightOfMortarPerBrick.toFixed(5)} kg</div>

                <div className="text-muted-foreground">Combined Weight:</div>
                <div className="font-mono">{brickDensityResults.combinedWeight.toFixed(5)} kg</div>

                <div className="text-muted-foreground">Density of Brick + Mortar:</div>
                <div className="font-mono">{brickDensityResults.densityOfBrickAndMortar.toFixed(5)} kN/m³</div>

                <div className="text-muted-foreground font-semibold">Area Load per {brickHeight}:</div>
                <div className="font-mono font-semibold">{brickDensityResults.areaLoadPer102_5.toFixed(5)} kN/m²</div>
              </div>
            </CardContent>
          </Card>

          {/* Line Load Results */}
          <Card>
            <CardHeader>
              <CardTitle>Line Load Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">Reveal Area:</div>
                <div className="font-mono">{lineLoadResults.revealArea.toFixed(5)} m²</div>

                <div className="text-muted-foreground">Total Area Supported:</div>
                <div className="font-mono">{lineLoadResults.totalAreaSupported.toFixed(5)} m²</div>

                <div className="text-muted-foreground">Loading:</div>
                <div className="font-mono">{lineLoadResults.loading.toFixed(5)} kN</div>

                <div className="text-muted-foreground font-semibold">Loading per m:</div>
                <div className="font-mono font-semibold text-lg">{lineLoadResults.loadingPerMeter.toFixed(5)} kN/m</div>
              </div>

              <Separator />

              <Button
                onClick={handleUseInDesigner}
                className="w-full"
                variant="default"
              >
                Use in Support Designer
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Transfer the loading value to the Support Designer as the characteristic load
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
