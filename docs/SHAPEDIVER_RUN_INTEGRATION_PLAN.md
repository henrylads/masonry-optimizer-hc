# ShapeDiver Long Run Integration - Implementation Plan

## Overview
Transform the current single-piece ShapeDiver visualization into a complete run visualization system that can display 20m+ masonry support runs with multiple angle pieces and brackets.

## Architecture Decisions (from user input)
- ✅ ShapeDiver model: **In progress** (parallel development)
- ✅ Run length: **Separate input field** in UI
- ✅ Run calculation: **Automatic always** during optimization
- ✅ Current phase: **Planning only** (no implementation yet)

---

## Current State Analysis

### JSON Template Files (`docs/json_tests/`)

#### 1. `angleJSON-template-v01.json` - Complete Angle Assembly
Defines the complete angle assembly for a run:

```json
{
  "anglesCount": {
    "description": "Number of different angle types in run",
    "value": 3,
    "unit": "count"
  },
  "angleInstancesCount": {
    "description": "Total angle pieces in run",
    "value": 7,
    "unit": "count"
  },
  "angles": [
    {
      "angleIndex": {"value": 0},
      "angleName": {"value": "Level-1-ANG-Type-00"},
      "anglePositions": {"value": [10]},  // Absolute X positions (mm from run start)
      "angleBracketLocations": {"value": [50]},  // Bracket positions relative to angle start
      "angleSKU": {"value": "AMS-86/80-4-670-A4"},
      "angleProperties": {
        "angleType": "Standard",
        "angleMaterial": "316",
        "angleProfileThickness": 4,
        "angleProfileLength": 86,  // Horizontal leg
        "angleProfileHeight": 80,  // Vertical leg
        "angleLength": 670  // Total piece length
      }
    }
  ]
}
```

**Key Concepts**:
- **Angle Types**: Groups of angles with identical dimensions (length, bracket count, spacing)
- **Angle Instances**: Individual pieces of each type positioned along the run
- **Absolute Positioning**: `anglePositions` are cumulative positions from run start
- **Relative Positioning**: `angleBracketLocations` are positions within each angle piece

#### 2. `bracketJSON-template-v01.json` - Bracket Specification
Defines bracket component used throughout run:

```json
{
  "bracketCount": {"value": 1},
  "brackets": [{
    "bracketIndex": {"value": 0},
    "bracketSKU": {"value": "AMS-S-4-311-413"},
    "bracketProperties": {
      "bracketType": "Standard",
      "bracketMaterial": "304",
      "bracketThickness": 4,
      "bracketLength": 311,
      "bracketHeight": 413,
      "fixingDiameter": 12,
      // ... notch parameters
    }
  }]
}
```

#### 3. `runJSON-template-v01.json` - Run Context
Defines structural context:

```json
{
  "runDetails": {
    "substructure": {
      "supportType": "Concrete",
      "supportDetails": {
        "slabLength": 6000,
        "slabWidth": 300,
        "slabDepth": 300,
        "slabLevel": 0
      }
    },
    "projection": 311
  }
}
```

### Current Architecture

#### ShapeDiver Integration (`/src/components/shapediver.tsx`)
- **Current State**: Single-piece visualization only
- **Model**: `e56ab1b1...` ticket
- **Parameters**: Maps to single bracket + single angle
- **Limitation**: Cannot show complete runs

#### Run Layout Logic (`/src/calculations/`)
- `runLayoutOptimizer.ts` - Multi-piece optimization
- `continuousRunLayout.ts` - Continuous run algorithm
- **Output**: `RunOptimizationResult` with array of `AnglePiece[]`

#### Data Structures

**Current `OptimisationResult`**:
```typescript
interface OptimisationResult {
  genetic: {
    bracket_centres: number;  // e.g., 500mm
    bracket_thickness: number;
    vertical_leg: number;
    horizontal_leg: number;
    // ... other optimized parameters
  };
  calculated: {
    bracket_height: number;
    bracket_projection: number;
    bracketLayout?: AngleLayoutResult;  // ⚠️ Single piece only
    // ... verification results
  };
}
```

**Existing `RunOptimizationResult`**:
```typescript
interface RunOptimizationResult {
  optimal: {
    totalLength: number;
    pieces: AnglePiece[];  // Array of angle pieces
    totalBrackets: number;
    pieceCount: number;
  };
  materialSummary: {
    totalAngleLength: number;
    totalPieces: number;
    totalBrackets: number;
  };
}

interface AnglePiece {
  length: number;          // This piece length (mm)
  bracketCount: number;    // Brackets on this piece
  spacing: number;         // Spacing on this piece
  startOffset: number;     // First bracket offset
  positions: number[];     // Bracket positions (relative to piece start)
  isStandard: boolean;
}
```

### Gap Analysis

**What's Missing**:
1. ❌ No connection from `RunOptimizationResult` to `OptimisationResult`
2. ❌ No transformation from run data to ShapeDiver JSON format
3. ❌ No UI for specifying run length
4. ❌ No component to visualize complete runs
5. ❌ No absolute position calculation (only piece-relative exists)

**What Exists**:
1. ✅ Run layout calculation logic
2. ✅ JSON template format defined
3. ✅ Single-piece ShapeDiver integration
4. ✅ Optimization algorithm

---

## Implementation Plan

## Phase 1: Data Layer Foundation

### 1.1 Create TypeScript Type Definitions
**New file**: `/src/types/shapediver-json.ts`

Define exact types matching the JSON templates:

```typescript
export interface AngleAssemblyJSON {
  anglesCount: {
    description: string;
    value: number;
    unit: string;
  };
  angleInstancesCount: {
    description: string;
    value: number;
    unit: string;
  };
  angles: AngleTypeDefinition[];
}

export interface AngleTypeDefinition {
  angleIndex: {
    description: string;
    value: number;
    unit: string;
  };
  angleName: {
    description: string;
    value: string;
    unit: string;
  };
  anglePositions: {
    description: string;
    value: number[];  // Absolute positions from run start (mm)
    unit: string;
  };
  angleBracketLocations: {
    description: string;
    value: number[];  // Relative positions within angle (mm)
    unit: string;
  };
  angleSKU: {
    description: string;
    value: string;
    unit: string;
  };
  angleProperties: {
    angleType: {
      description: string;
      value: 'Standard' | 'Inverted';
      unit: string;
    };
    angleMaterial: {
      description: string;
      value: string;
      unit: string;
    };
    angleProfileThickness: {
      description: string;
      value: number;
      unit: string;
    };
    angleProfileLength: {
      description: string;
      value: number;
      unit: string;
    };
    angleProfileHeight: {
      description: string;
      value: number;
      unit: string;
    };
    angleLength: {
      description: string;
      value: number;
      unit: string;
    };
  };
}

export interface BracketSpecJSON {
  bracketCount: {
    description: string;
    value: number;
    unit: string;
  };
  brackets: BracketDefinition[];
}

export interface BracketDefinition {
  bracketIndex: {
    description: string;
    value: number;
    unit: string;
  };
  bracketSKU: {
    description: string;
    value: string;
    unit: string;
  };
  bracketProperties: {
    bracketType: {
      description: string;
      value: 'Standard' | 'Inverted';
      unit: string;
    };
    bracketMaterial: {
      description: string;
      value: string;
      unit: string;
    };
    bracketThickness: {
      description: string;
      value: number;
      unit: string;
    };
    bracketLength: {
      description: string;
      value: number;
      unit: string;
    };
    bracketHeight: {
      description: string;
      value: number;
      unit: string;
    };
    fixingDiameter: {
      description: string;
      value: number;
      unit: string;
    };
    toeNotchHeight: {
      description: string;
      value: number;
      unit: string;
    };
    toeNotchLength: {
      description: string;
      value: number;
      unit: string;
    };
    toeNotchOption: {
      description: string;
      value: boolean;
      unit: string;
    };
    backNotchHeight: {
      description: string;
      value: number;
      unit: string;
    };
    backNotchLength: {
      description: string;
      value: number;
      unit: string;
    };
    backNotchOption: {
      description: string;
      value: boolean;
      unit: string;
    };
  };
}

export interface RunContextJSON {
  runDetails: {
    substructure: {
      supportType: {
        description: string;
        value: 'Concrete' | 'I-Beam';
        unit: string;
      };
      supportDetails: {
        slabLength: {
          description: string;
          value: number;
          unit: string;
        };
        slabWidth: {
          description: string;
          value: number;
          unit: string;
        };
        slabDepth: {
          description: string;
          value: number;
          unit: string;
        };
        slabLevel: {
          description: string;
          value: number;
          unit: string;
        };
      };
    };
    projection: {
      description: string;
      value: number;
      unit: string;
    };
  };
}
```

### 1.2 Extend Optimization Result Types
**File**: `/src/types/optimization-types.ts`

Add to `OptimisationResult.calculated`:

```typescript
export interface OptimisationResult {
  genetic: { /* existing fields */ };
  calculated: {
    // ... existing fields
    bracketLayout?: AngleLayoutResult;  // Keep for backward compatibility
    runLayout?: RunOptimizationResult;  // NEW: Multi-piece run data
  };
  totalWeight: number;
  // ... other fields
}
```

### 1.3 Create Data Transformation Utilities
**New file**: `/src/utils/shapediver-run-transformer.ts`

**Main Transformer Function**:

```typescript
import { OptimisationResult } from '@/types/optimization-types';
import { RunOptimizationResult } from '@/types/runLayout';
import {
  AngleAssemblyJSON,
  BracketSpecJSON,
  RunContextJSON,
  AngleTypeDefinition
} from '@/types/shapediver-json';

export interface ShapeDiverJSONOutput {
  angleJSON: AngleAssemblyJSON;
  bracketJSON: BracketSpecJSON;
  runJSON: RunContextJSON;
}

/**
 * Main function to transform optimization result into ShapeDiver JSON format
 */
export function transformRunToShapeDiverJSON(
  optimizationResult: OptimisationResult,
  totalRunLength: number  // in meters
): ShapeDiverJSONOutput {

  // Ensure we have run layout data
  if (!optimizationResult.calculated.runLayout) {
    throw new Error('Run layout data not available in optimization result');
  }

  const runLayout = optimizationResult.calculated.runLayout;

  // Transform to JSON format
  const angleJSON = transformToAngleJSON(runLayout, optimizationResult);
  const bracketJSON = transformToBracketJSON(optimizationResult);
  const runJSON = transformToRunJSON(optimizationResult, totalRunLength);

  return { angleJSON, bracketJSON, runJSON };
}
```

**Helper Functions**:

```typescript
/**
 * Group angle pieces by unique characteristics to create angle types
 */
interface AngleTypeGroup {
  typeIndex: number;
  length: number;
  bracketCount: number;
  spacing: number;
  startOffset: number;
  positions: number[];  // Relative bracket positions within angle
  instances: number[];  // Absolute positions where this type appears in run
}

function groupAnglePiecesByType(
  pieces: AnglePiece[],
  gapWidth: number = 10
): AngleTypeGroup[] {
  const typeMap = new Map<string, AngleTypeGroup>();
  let currentPosition = 0;  // Track absolute position in run
  let typeIndex = 0;

  pieces.forEach((piece, index) => {
    // Create unique key for this piece type
    const key = `${piece.length}-${piece.bracketCount}-${piece.spacing}-${piece.startOffset}`;

    if (!typeMap.has(key)) {
      // New angle type discovered
      typeMap.set(key, {
        typeIndex: typeIndex++,
        length: piece.length,
        bracketCount: piece.bracketCount,
        spacing: piece.spacing,
        startOffset: piece.startOffset,
        positions: piece.positions,  // Bracket positions relative to angle start
        instances: []  // Will fill with absolute positions
      });
    }

    // Add this instance's absolute position to the type
    typeMap.get(key)!.instances.push(currentPosition);

    // Update position for next piece (add piece length + gap)
    currentPosition += piece.length + (index < pieces.length - 1 ? gapWidth : 0);
  });

  return Array.from(typeMap.values());
}

/**
 * Generate SKU code for angle
 * Format: AMS-{horizLeg}/{vertLeg}-{thickness}-{length}-{material}
 */
function generateAngleSKU(
  horizontalLeg: number,
  verticalLeg: number,
  thickness: number,
  length: number,
  material: string
): string {
  return `AMS-${horizontalLeg}/${verticalLeg}-${thickness}-${length}-${material}`;
}

/**
 * Generate SKU code for bracket
 * Format: AMS-S-{thickness}-{length}-{height}
 */
function generateBracketSKU(
  thickness: number,
  length: number,
  height: number
): string {
  return `AMS-S-${thickness}-${length}-${height}`;
}

/**
 * Transform run layout to angle assembly JSON
 */
function transformToAngleJSON(
  runLayout: RunOptimizationResult,
  optimizationResult: OptimisationResult
): AngleAssemblyJSON {

  const angleTypes = groupAnglePiecesByType(runLayout.optimal.pieces);

  const angles: AngleTypeDefinition[] = angleTypes.map((type) => ({
    angleIndex: {
      description: 'Angle type index',
      value: type.typeIndex,
      unit: 'index'
    },
    angleName: {
      description: 'Angle type name',
      value: `Level-1-ANG-Type-${String(type.typeIndex).padStart(2, '0')}`,
      unit: 'text'
    },
    anglePositions: {
      description: 'Absolute X-positions of angle instances in run',
      value: type.instances,
      unit: 'mm'
    },
    angleBracketLocations: {
      description: 'Bracket positions relative to angle start',
      value: type.positions,
      unit: 'mm'
    },
    angleSKU: {
      description: 'Angle product SKU',
      value: generateAngleSKU(
        optimizationResult.genetic.horizontal_leg ?? 75,
        optimizationResult.genetic.vertical_leg ?? 60,
        optimizationResult.genetic.angle_thickness ?? 4,
        type.length,
        optimizationResult.genetic.angle_material ?? '316'
      ),
      unit: 'SKU'
    },
    angleProperties: {
      angleType: {
        description: 'Angle orientation type',
        value: optimizationResult.genetic.angle_orientation === 'Inverted' ? 'Inverted' : 'Standard',
        unit: 'text'
      },
      angleMaterial: {
        description: 'Angle material grade',
        value: optimizationResult.genetic.angle_material ?? '316',
        unit: 'text'
      },
      angleProfileThickness: {
        description: 'Angle profile thickness',
        value: optimizationResult.genetic.angle_thickness ?? 4,
        unit: 'mm'
      },
      angleProfileLength: {
        description: 'Angle horizontal leg length',
        value: optimizationResult.genetic.horizontal_leg ?? 75,
        unit: 'mm'
      },
      angleProfileHeight: {
        description: 'Angle vertical leg height',
        value: optimizationResult.genetic.vertical_leg ?? 60,
        unit: 'mm'
      },
      angleLength: {
        description: 'Total angle piece length',
        value: type.length,
        unit: 'mm'
      }
    }
  }));

  return {
    anglesCount: {
      description: 'Number of different angle types',
      value: angleTypes.length,
      unit: 'count'
    },
    angleInstancesCount: {
      description: 'Total number of angle pieces in run',
      value: runLayout.optimal.pieces.length,
      unit: 'count'
    },
    angles
  };
}

/**
 * Transform optimization result to bracket specification JSON
 */
function transformToBracketJSON(
  optimizationResult: OptimisationResult
): BracketSpecJSON {

  const backNotchHeight = optimizationResult.calculated?.detailed_verification_results
    ?.droppingBelowSlabResults?.H_notch ?? 0;

  return {
    bracketCount: {
      description: 'Number of bracket types',
      value: 1,
      unit: 'count'
    },
    brackets: [{
      bracketIndex: {
        description: 'Bracket type index',
        value: 0,
        unit: 'index'
      },
      bracketSKU: {
        description: 'Bracket product SKU',
        value: generateBracketSKU(
          optimizationResult.genetic.bracket_thickness ?? 3,
          Math.round(optimizationResult.calculated.bracket_projection ?? 150),
          Math.round(optimizationResult.calculated.bracket_height ?? 150)
        ),
        unit: 'SKU'
      },
      bracketProperties: {
        bracketType: {
          description: 'Bracket orientation type',
          value: optimizationResult.genetic.bracket_type === 'Inverted' ? 'Inverted' : 'Standard',
          unit: 'text'
        },
        bracketMaterial: {
          description: 'Bracket material grade',
          value: optimizationResult.genetic.bracket_material ?? '304',
          unit: 'text'
        },
        bracketThickness: {
          description: 'Bracket plate thickness',
          value: optimizationResult.genetic.bracket_thickness ?? 3,
          unit: 'mm'
        },
        bracketLength: {
          description: 'Bracket projection from slab',
          value: Math.round(optimizationResult.calculated.bracket_projection ?? 150),
          unit: 'mm'
        },
        bracketHeight: {
          description: 'Bracket vertical height',
          value: Math.round(optimizationResult.calculated.bracket_height ?? 150),
          unit: 'mm'
        },
        fixingDiameter: {
          description: 'Fixing bolt diameter',
          value: optimizationResult.genetic.bolt_diameter ?? 10,
          unit: 'mm'
        },
        toeNotchHeight: {
          description: 'Toe notch height',
          value: 0,  // Not currently used
          unit: 'mm'
        },
        toeNotchLength: {
          description: 'Toe notch length',
          value: 0,
          unit: 'mm'
        },
        toeNotchOption: {
          description: 'Toe notch enabled',
          value: false,
          unit: 'boolean'
        },
        backNotchHeight: {
          description: 'Back notch height',
          value: Math.max(0, backNotchHeight),
          unit: 'mm'
        },
        backNotchLength: {
          description: 'Back notch length',
          value: backNotchHeight > 0 ? 25 : 0,
          unit: 'mm'
        },
        backNotchOption: {
          description: 'Back notch enabled',
          value: backNotchHeight > 0,
          unit: 'boolean'
        }
      }
    }]
  };
}

/**
 * Transform to run context JSON
 */
function transformToRunJSON(
  optimizationResult: OptimisationResult,
  totalRunLength: number  // meters
): RunContextJSON {

  return {
    runDetails: {
      substructure: {
        supportType: {
          description: 'Type of support structure',
          value: 'Concrete',  // Could be parameterized if needed
          unit: 'text'
        },
        supportDetails: {
          slabLength: {
            description: 'Slab length',
            value: totalRunLength * 1000,  // Convert m to mm
            unit: 'mm'
          },
          slabWidth: {
            description: 'Slab width',
            value: 300,  // Default, could be parameterized
            unit: 'mm'
          },
          slabDepth: {
            description: 'Slab depth',
            value: optimizationResult.calculated.slab_thickness ?? 225,
            unit: 'mm'
          },
          slabLevel: {
            description: 'Slab level elevation',
            value: 0,
            unit: 'mm'
          }
        }
      },
      projection: {
        description: 'Bracket projection distance',
        value: Math.round(optimizationResult.calculated.bracket_projection ?? 150),
        unit: 'mm'
      }
    }
  };
}
```

---

## Phase 2: Automatic Run Calculation

### 2.1 Integrate into Optimization Flow
**File**: `/src/calculations/bruteForceAlgorithm/index.ts`

Add after optimization completes:

```typescript
import { optimizeContinuousRunLayout } from '../continuousRunLayout';

// After finding optimal design...
const calculatedResults = {
  // ... existing calculated fields
};

// ALWAYS calculate run layout automatically with default 20m length
const DEFAULT_RUN_LENGTH_MM = 20000;  // 20 meters

try {
  const runLayout = optimizeContinuousRunLayout({
    totalRunLength: DEFAULT_RUN_LENGTH_MM,
    bracketCentres: optimalDesign.bracket_centres,
    maxAngleLength: 1490,  // Standard max angle length
    gapBetweenPieces: 10,  // 10mm gap between pieces
    minBracketsPerAngle: 2  // Minimum 2 brackets per piece
  });

  calculatedResults.runLayout = runLayout;
} catch (error) {
  console.error('Error calculating run layout:', error);
  // Don't fail optimization if run layout calculation fails
  calculatedResults.runLayout = undefined;
}

return {
  genetic: optimalDesign,
  calculated: calculatedResults,
  totalWeight: totalWeight
};
```

### 2.2 Update API Response
**File**: `/src/app/api/optimize/route.ts`

Ensure `runLayout` is included in response (should happen automatically if added to `OptimisationResult`).

---

## Phase 3: UI Components

### 3.1 Add Run Length Input Field
**File**: `/src/components/design/core-fields.tsx` OR `/src/components/design/advanced-options.tsx`

Add new field (suggest adding to Advanced Options):

```typescript
<FormField
  control={form.control}
  name="run_visualization_length"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Run Visualization Length (m)</FormLabel>
      <FormControl>
        <Input
          type="number"
          placeholder="20"
          value={field.value ?? 20}
          onChange={(e) => field.onChange(Number(e.target.value) || 20)}
          min="1"
          max="100"
          step="1"
        />
      </FormControl>
      <FormDescription>
        Total run length for 3D visualization (1-100 meters)
      </FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>
```

**Update form schema** (`/src/types/form-schema.ts`):

```typescript
export const formSchema = z.object({
  // ... existing fields
  run_visualization_length: z.number().min(1).max(100).default(20).optional()
});
```

### 3.2 Create Run Viewer Component
**New file**: `/src/components/shapediver-run-viewer.tsx`

```typescript
'use client'

import React, { useMemo } from 'react'
import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'
import { OptimizationResult } from '@/types/optimization-types'
import { transformRunToShapeDiverJSON } from '@/utils/shapediver-run-transformer'

// Dynamically import ShapeDiver to avoid SSR issues
const ShapeDiver = dynamic(() => import('@/components/shapediver').then(mod => ({ default: mod.ShapeDiverCard })), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#e5e7eb]">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  )
})

interface ShapeDiverRunViewerProps {
  optimizationResult: OptimizationResult
  totalRunLength: number  // in meters
}

export function ShapeDiverRunViewer({
  optimizationResult,
  totalRunLength
}: ShapeDiverRunViewerProps) {

  // Transform optimization result to ShapeDiver JSON format
  const shapeDiverParams = useMemo(() => {
    try {
      if (!optimizationResult?.calculated?.runLayout) {
        console.warn('No run layout data available');
        return null;
      }

      const { angleJSON, bracketJSON, runJSON } = transformRunToShapeDiverJSON(
        optimizationResult,
        totalRunLength
      );

      // Return as ShapeDiver parameters (JSON strings)
      return {
        angleAssembly: JSON.stringify(angleJSON),
        bracketSpec: JSON.stringify(bracketJSON),
        runContext: JSON.stringify(runJSON),
        // Add update key to force re-render when params change
        _updateKey: Date.now()
      };

    } catch (error) {
      console.error('Error transforming run data for ShapeDiver:', error);
      return null;
    }
  }, [optimizationResult, totalRunLength]);

  if (!shapeDiverParams) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#e5e7eb]">
        <div className="text-center">
          <p className="text-muted-foreground">
            Run visualization not available
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Run layout data is missing from optimization result
          </p>
        </div>
      </div>
    );
  }

  // Display run metadata
  const runLayout = optimizationResult.calculated.runLayout;
  if (runLayout) {
    console.log('Run Layout Summary:', {
      totalLength: `${runLayout.optimal.totalLength}mm (${(runLayout.optimal.totalLength / 1000).toFixed(1)}m)`,
      pieces: runLayout.optimal.pieceCount,
      totalBrackets: runLayout.optimal.totalBrackets,
      averageSpacing: `${runLayout.optimal.averageSpacing.toFixed(1)}mm`
    });
  }

  return (
    <div className="relative w-full h-full">
      {/* Run metadata overlay (optional) */}
      {runLayout && (
        <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <div className="text-xs space-y-1">
            <div className="font-semibold">Run Summary</div>
            <div>Length: {(runLayout.optimal.totalLength / 1000).toFixed(1)}m</div>
            <div>Pieces: {runLayout.optimal.pieceCount}</div>
            <div>Brackets: {runLayout.optimal.totalBrackets}</div>
            <div>Avg Spacing: {runLayout.optimal.averageSpacing.toFixed(0)}mm</div>
          </div>
        </div>
      )}

      {/* ShapeDiver viewer with run parameters */}
      <ShapeDiver
        ticket="NEW_RUN_MODEL_TICKET"  // ⚠️ REPLACE with actual ticket when model ready
        modelUrl="https://sdr8euc1.eu-central-1.shapediver.com"
        initialParameters={shapeDiverParams}
        title=""
        className="border-0 shadow-none"
      />
    </div>
  )
}
```

### 3.3 Add View Toggle to Design Viewer
**File**: `/src/components/design/design-viewer-panel.tsx`

Add toggle between single-piece and run view:

```typescript
'use client'

import { useState } from 'react'
import { useMemo } from 'react'
import dynamic from 'next/dynamic'
import { Loader2, Box, Building2, Package } from 'lucide-react'
import { OptimisationResult } from '@/types/optimization-types'
import { Button } from '@/components/ui/button'

// Import both viewers
const ShapeDiver = dynamic(() => import('@/components/shapediver').then(mod => ({ default: mod.ShapeDiverCard })), {
  ssr: false,
  loading: () => <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
})

const ShapeDiverRunViewer = dynamic(() => import('@/components/shapediver-run-viewer').then(mod => ({ default: mod.ShapeDiverRunViewer })), {
  ssr: false,
  loading: () => <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
})

type ViewMode = 'single' | 'run'

interface DesignViewerPanelProps {
  optimizationResult: OptimisationResult | null
  isOptimizing: boolean
  progress: number
  runVisualizationLength?: number  // NEW: Run length from form
}

export function DesignViewerPanel({
  optimizationResult,
  isOptimizing,
  progress,
  runVisualizationLength = 20  // Default 20m
}: DesignViewerPanelProps) {

  const [viewMode, setViewMode] = useState<ViewMode>('single')

  // Check if run view is available
  const hasRunLayout = optimizationResult?.calculated?.runLayout !== undefined

  // ... existing single-piece shapeDiverParams logic ...

  return (
    <div className="absolute inset-0 bg-[#e5e7eb]">
      {/* View Mode Toggle */}
      {optimizationResult && hasRunLayout && (
        <div className="absolute top-4 left-4 z-20 flex gap-2 bg-white rounded-lg shadow-md p-1">
          <Button
            size="sm"
            variant={viewMode === 'single' ? 'default' : 'ghost'}
            onClick={() => setViewMode('single')}
            className="flex items-center gap-2"
          >
            <Package className="h-4 w-4" />
            Single Piece
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'run' ? 'default' : 'ghost'}
            onClick={() => setViewMode('run')}
            className="flex items-center gap-2"
          >
            <Building2 className="h-4 w-4" />
            Full Run
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!optimizationResult && !isOptimizing && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Box className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-lg">
            Run optimization to view 3D model
          </p>
        </div>
      )}

      {/* Optimization Progress Overlay */}
      {isOptimizing && (
        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center z-10">
          {/* ... existing progress UI ... */}
        </div>
      )}

      {/* 3D Viewer - Conditional based on view mode */}
      {optimizationResult && (
        <div className="absolute inset-0">
          {viewMode === 'single' && shapeDiverParams && (
            <ShapeDiver
              initialParameters={shapeDiverParams}
              title=""
              className="border-0 shadow-none"
            />
          )}

          {viewMode === 'run' && hasRunLayout && (
            <ShapeDiverRunViewer
              optimizationResult={optimizationResult}
              totalRunLength={runVisualizationLength}
            />
          )}
        </div>
      )}
    </div>
  )
}
```

**Update usage in design page**:

```typescript
<DesignViewerPanel
  optimizationResult={optimizationResult}
  isOptimizing={isOptimizing}
  progress={progress}
  runVisualizationLength={form.watch('run_visualization_length') ?? 20}
/>
```

---

## Phase 4: ShapeDiver Integration (when model ready)

### 4.1 ShapeDiver Model Requirements

The new ShapeDiver model must accept **3 JSON string parameters**:

#### Parameter 1: `angleAssembly` (string)
JSON string containing the complete angle assembly definition (matching `angleJSON-template-v01.json` format)

#### Parameter 2: `bracketSpec` (string)
JSON string containing bracket specification (matching `bracketJSON-template-v01.json` format)

#### Parameter 3: `runContext` (string)
JSON string containing run context (matching `runJSON-template-v01.json` format)

### Expected ShapeDiver Model Behavior

**Input Processing**:
1. Parse all 3 JSON strings
2. Validate structure and required fields
3. Extract angle types, positions, and bracket locations

**3D Model Generation**:
1. Create slab/support structure based on `runContext`
2. For each angle type in `angleAssembly.angles[]`:
   - For each position in `anglePositions[]`:
     - Place angle piece at absolute X position
     - For each bracket location in `angleBracketLocations[]`:
       - Place bracket on angle at relative position
       - Connect bracket to slab at `projection` distance
3. Apply materials, colors, proper spacing
4. Generate complete assembly

**Output**:
- Complete 3D visualization of entire run
- All components positioned correctly
- Proper gaps between angle pieces
- Realistic materials and rendering

### 4.2 Update ShapeDiverRunViewer Component

Replace placeholder ticket with actual ticket when model is ready:

```typescript
<ShapeDiver
  ticket="ACTUAL_RUN_MODEL_TICKET_HERE"  // Get from ShapeDiver team
  modelUrl="https://sdr8euc1.eu-central-1.shapediver.com"
  initialParameters={shapeDiverParams}
  title=""
  className="border-0 shadow-none"
/>
```

---

## Phase 5: Testing & Validation

### 5.1 Create Test Scenarios
**New file**: `/test-scenarios/[timestamp]-run-visualization-test.ts`

```typescript
import { transformRunToShapeDiverJSON } from '@/utils/shapediver-run-transformer';
import { OptimisationResult } from '@/types/optimization-types';

describe('ShapeDiver Run Transformation', () => {

  test('should transform 5m run correctly', () => {
    // Create mock optimization result with run layout
    const mockResult: OptimisationResult = {
      // ... mock data
    };

    const { angleJSON, bracketJSON, runJSON } = transformRunToShapeDiverJSON(
      mockResult,
      5  // 5 meters
    );

    // Validate structure
    expect(angleJSON.anglesCount.value).toBeGreaterThan(0);
    expect(angleJSON.angles.length).toBe(angleJSON.anglesCount.value);

    // Validate positions are sequential
    angleJSON.angles.forEach(angle => {
      const positions = angle.anglePositions.value;
      for (let i = 1; i < positions.length; i++) {
        expect(positions[i]).toBeGreaterThan(positions[i - 1]);
      }
    });

    // Validate bracket positions are within angle length
    angleJSON.angles.forEach(angle => {
      const angleLength = angle.angleProperties.angleLength.value;
      const bracketPositions = angle.angleBracketLocations.value;

      bracketPositions.forEach(pos => {
        expect(pos).toBeGreaterThanOrEqual(0);
        expect(pos).toBeLessThanOrEqual(angleLength);
      });
    });

    // Validate SKU format
    angleJSON.angles.forEach(angle => {
      expect(angle.angleSKU.value).toMatch(/^AMS-\d+\/\d+-\d+-\d+-\w+$/);
    });
  });

  test('should transform 20m run correctly', () => {
    // Test standard case
  });

  test('should transform 50m run correctly', () => {
    // Test large run
  });

  test('should handle edge cases', () => {
    // Test minimum run, maximum run, etc.
  });
});
```

### 5.2 JSON Validation Function

```typescript
export function validateAngleAssemblyJSON(json: AngleAssemblyJSON): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check required fields
  if (!json.anglesCount || typeof json.anglesCount.value !== 'number') {
    errors.push('Missing or invalid anglesCount');
  }

  if (!json.angles || !Array.isArray(json.angles)) {
    errors.push('Missing or invalid angles array');
  }

  // Validate angle count matches array length
  if (json.angles.length !== json.anglesCount.value) {
    errors.push(`Angle count mismatch: declared ${json.anglesCount.value}, found ${json.angles.length}`);
  }

  // Validate each angle
  json.angles.forEach((angle, index) => {
    if (!angle.anglePositions?.value || !Array.isArray(angle.anglePositions.value)) {
      errors.push(`Angle ${index}: missing or invalid anglePositions`);
    }

    if (!angle.angleBracketLocations?.value || !Array.isArray(angle.angleBracketLocations.value)) {
      errors.push(`Angle ${index}: missing or invalid angleBracketLocations`);
    }

    // Validate positions are sequential
    const positions = angle.anglePositions.value;
    for (let i = 1; i < positions.length; i++) {
      if (positions[i] <= positions[i - 1]) {
        errors.push(`Angle ${index}: positions not sequential at index ${i}`);
      }
    }

    // Validate bracket positions within angle length
    const angleLength = angle.angleProperties.angleLength.value;
    angle.angleBracketLocations.value.forEach((pos, bIndex) => {
      if (pos < 0 || pos > angleLength) {
        errors.push(`Angle ${index}: bracket position ${bIndex} (${pos}mm) outside angle length (${angleLength}mm)`);
      }
    });

    // Validate SKU format
    if (!angle.angleSKU.value.match(/^AMS-\d+\/\d+-\d+-\d+-\w+$/)) {
      errors.push(`Angle ${index}: invalid SKU format "${angle.angleSKU.value}"`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}
```

---

## Implementation Timeline

### **Current: Planning Phase**
- ✅ Review comprehensive plan
- ✅ Validate JSON template format with ShapeDiver team
- ✅ Confirm SKU naming convention
- ✅ Define exact ShapeDiver model parameter interface
- ✅ Get estimated timeline for ShapeDiver model completion

### **Phase 1: Data Foundation** (1-2 weeks)
- Create type definitions (`shapediver-json.ts`)
- Extend `OptimisationResult` type
- Build transformation utilities (`shapediver-run-transformer.ts`)
- Create unit tests for transformers
- Validate JSON output matches templates exactly

### **Phase 2: Backend Integration** (1 week)
- Integrate run calculation into optimization flow
- Update API responses to include `runLayout`
- Test with existing optimizations
- Verify performance impact (should be minimal)

### **Phase 3: UI Components** (1-2 weeks)
- Add run length input field to form
- Create `ShapeDiverRunViewer` component skeleton
- Add view toggle to design viewer panel
- Wire up complete data flow
- Test UI responsiveness

### **Phase 4: ShapeDiver Connection** (1-2 weeks, when model ready)
- Integrate new ShapeDiver model ticket
- Connect JSON parameters to ShapeDiver
- Test visualization with various run lengths
- Handle edge cases and error states
- Performance optimization

### **Phase 5: Testing & Polish** (1 week)
- Comprehensive test scenarios
- Validation functions
- Documentation
- User acceptance testing

**Total Estimated Timeline**: 5-8 weeks (depending on ShapeDiver model readiness)

---

## Key Technical Considerations

### SKU Generation Logic

**Current Understanding** (from templates):
- Angle: `AMS-{horizLeg}/{vertLeg}-{thickness}-{length}-{material}`
  - Example: `AMS-86/80-4-1490-316`
  - 86mm horizontal leg / 80mm vertical leg
  - 4mm thickness
  - 1490mm length
  - 316 stainless steel

- Bracket: `AMS-S-{thickness}-{projection}-{height}`
  - Example: `AMS-S-4-311-413`
  - S = Standard bracket
  - 4mm thickness
  - 311mm projection
  - 413mm height

**Need Confirmation**:
- Material suffix format? (A4, 316, 304, etc.)
- Inverted bracket prefix? (S vs I?)
- Custom length angle suffix?

### Absolute Position Calculation

**Critical Algorithm**:
```typescript
// Starting at position 0
let currentPosition = 0;
const gapWidth = 10;  // mm between pieces

pieces.forEach((piece, index) => {
  // This piece starts at currentPosition
  absolutePositions.push(currentPosition);

  // Next piece starts after: piece length + gap
  // (except last piece has no gap after it)
  if (index < pieces.length - 1) {
    currentPosition += piece.length + gapWidth;
  }
});
```

**Example**:
- Piece 1 (670mm): position 0
- Gap: 10mm
- Piece 2 (1490mm): position 680
- Gap: 10mm
- Piece 3 (1490mm): position 2180
- etc.

### Performance Considerations

**Run Calculation**:
- 20m run ≈ 40 angle pieces ≈ 200 brackets
- Calculation time: <100ms (negligible impact)
- Transformation to JSON: <50ms
- Total overhead: ~150ms (acceptable)

**ShapeDiver Rendering**:
- Large runs may take longer to render
- ShapeDiver handles 100+ components well
- Consider progressive loading for very long runs (>50m)

### Error Handling

**Graceful Degradation**:
1. If run layout calculation fails → show single-piece view only
2. If transformation fails → log error, disable run view toggle
3. If ShapeDiver model not available → fallback to single-piece
4. If run length invalid → use default 20m

---

## Questions for Confirmation

### 1. SKU Format
**Q**: What is the exact SKU naming convention?
- Angle material suffix: "316", "A4", "304"?
- Inverted bracket prefix?
- Custom vs standard length indicators?

**Current Assumption**: `AMS-{horizLeg}/{vertLeg}-{thickness}-{length}-{material}`

### 2. ShapeDiver Model Timeline
**Q**: When will the new ShapeDiver model be ready?
- Estimated completion date?
- Will it match JSON template format exactly?
- Any limitations on run length or piece count?

### 3. Default Run Length
**Q**: What should the automatic calculation use for default run length?
- Suggestion: 20m (produces reasonable ~40 pieces)
- Alternative: Make configurable in settings?

### 4. Run Length Limits
**Q**: What are reasonable min/max limits for run visualization?
- Minimum: 1m (very short, 2-3 pieces)
- Maximum: 100m (very long, 200+ pieces)
- Recommended range: 5m - 50m?

### 5. Integration Approach
**Q**: Should run view completely replace single-piece, or coexist?
- **Recommendation**: Coexist with toggle (maintain backward compatibility)
- Users can choose appropriate view for their needs

---

## Next Actions

1. **Validate with ShapeDiver Team**:
   - Confirm JSON template format is correct
   - Get model parameter names and ticket
   - Understand any model limitations

2. **Finalize SKU Logic**:
   - Document exact naming convention
   - Update transformer functions accordingly

3. **Begin Phase 1**:
   - Start with type definitions
   - Build transformation utilities
   - Create comprehensive tests

4. **Coordinate Timeline**:
   - Align backend/frontend development with ShapeDiver model completion
   - Plan testing phase

---

## Files Summary

### New Files to Create
1. `/src/types/shapediver-json.ts` - Complete type definitions
2. `/src/utils/shapediver-run-transformer.ts` - Data transformation utilities
3. `/src/components/shapediver-run-viewer.tsx` - Run visualization component
4. `/test-scenarios/[timestamp]-run-visualization.ts` - Test scenarios

### Files to Modify
1. `/src/types/optimization-types.ts` - Add `runLayout` field to `OptimisationResult`
2. `/src/calculations/bruteForceAlgorithm/index.ts` - Auto-calculate run layout
3. `/src/types/form-schema.ts` - Add `run_visualization_length` field
4. `/src/components/design/advanced-options.tsx` - Add run length input
5. `/src/components/design/design-viewer-panel.tsx` - Add view toggle and conditional rendering
6. `/src/app/api/optimize/route.ts` - Ensure `runLayout` in API response

### Files Created (Templates)
1. `/docs/json_tests/angleJSON-template-v01.json` ✅
2. `/docs/json_tests/bracketJSON-template-v01.json` ✅
3. `/docs/json_tests/runJSON-template-v01.json` ✅

---

## Summary

This implementation plan provides a complete roadmap for transforming the current single-piece ShapeDiver visualization into a full-run visualization system. The approach is:

- **Incremental**: Phases can be completed independently
- **Backward Compatible**: Existing single-piece view remains functional
- **Well-Typed**: Strong TypeScript types throughout
- **Tested**: Comprehensive test coverage
- **Performant**: Minimal overhead on optimization
- **Flexible**: User can choose run length for visualization

The foundation already exists in the codebase (run layout optimizer, calculation logic). We just need to:
1. Connect the data flow
2. Transform to ShapeDiver JSON format
3. Build UI components
4. Integrate when ShapeDiver model is ready

Estimated 5-8 weeks for complete implementation, with phases deliverable incrementally.
