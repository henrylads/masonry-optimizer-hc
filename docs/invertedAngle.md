# Bracket Type and Angle Orientation Implementation

## Overview
This document explains the implementation of the bracket type and angle orientation selection logic for the masonry support system optimization.

## Key Concepts

### Fixing Point
- The fixing point is always at **-75mm from SSL** (Top Critical Edge Distance)
- This is a constant for all CPRO38 channel specifications

### BSL (Brick Support Level)
- The BSL is the `support_level` input from the user
- Measured as distance from SSL (Structural Slab Level)
- Can be positive (above SSL) or negative (below SSL)

### Bracket Type Selection
The bracket type is automatically determined based on BSL relative to the fixing point:

- **Standard Bracket**: Used when BSL ≤ -75mm (BSL is at or below the fixing point)
- **Inverted Bracket**: Used when BSL > -75mm (BSL is above the fixing point)

### Angle Orientation Options
The angle can be oriented in two ways:
- **Standard Angle**: Vertical leg above horizontal leg
- **Inverted Angle**: Vertical leg below horizontal leg

## Selection Logic

### Valid Angle Orientations by BSL Range
Based on the selection table from the project overview:

| BSL Range | Bracket Type | Valid Angle Orientations |
|-----------|-------------|-------------------------|
| ≥ 0mm | Inverted | Both (Standard, Inverted) |
| -25mm to -50mm | Inverted | Standard only |
| -75mm to -135mm | Standard | Inverted only |
| -150mm to -175mm | Standard | Both (Standard, Inverted) |
| < -175mm | Standard | Both (Standard, Inverted) |

### Bracket Height Calculation
The bracket height is calculated based on the combination of bracket type and angle orientation:

**Base calculation**: `Math.abs(support_level) - top_critical_edge_distance + distance_from_top_to_fixing`

**Adjustments**:
- **Standard bracket + Inverted angle**: Add vertical leg height to bracket height
- **Inverted bracket + Standard angle**: Add vertical leg height to bracket height
- **Standard bracket + Standard angle**: No adjustment
- **Inverted bracket + Inverted angle**: No adjustment

### Rise to Bolts Calculation
Rise to bolts = `bracket_height - (distance_from_top_to_fixing + worst_case_adjustment)`

Where:
- `distance_from_top_to_fixing` = 40mm
- `worst_case_adjustment` = 15mm (total = 55mm)

If the bracket projects below the slab, the rise to bolts is limited to the bottom critical edge distance.

## Implementation Files

### Core Files
1. **`src/calculations/bracketAngleSelection.ts`**: Utility functions for bracket and angle selection
2. **`src/calculations/bruteForceAlgorithm/combinationGeneration.ts`**: Updated combination generation
3. **`src/types/geneticAlgorithm.ts`**: Updated type definitions

### New Types
- `BracketType`: 'Standard' | 'Inverted'
- `AngleOrientation`: 'Standard' | 'Inverted'

### Updated GeneticParameters Interface
Added fields:
- `bracket_type: BracketType`
- `angle_orientation: AngleOrientation`

## Key Functions

### `determineBracketType(supportLevel: number): BracketType`
Determines if Standard or Inverted bracket should be used based on BSL.

### `getValidAngleOrientations(supportLevel: number): AngleOrientation[]`
Returns valid angle orientations for a given BSL value.

### `getValidBracketAngleCombinations(supportLevel: number)`
Returns all valid bracket type and angle orientation combinations for a BSL.

### `calculateBracketHeight(...)`
Calculates bracket height considering bracket type, angle orientation, and vertical leg size.

### `calculateRiseToBolts(...)`
Calculates rise to bolts with optional limiting to bottom critical edge distance.

## Impact on Combination Generation

### Before Implementation
- Fixed bracket calculations
- Single angle orientation
- ~140 combinations per parameter set

### After Implementation
- Dynamic bracket type selection based on BSL
- Multiple angle orientations where appropriate
- 140-280 combinations per parameter set (depending on "try both" scenarios)

### Example Results
For support level -25mm (Inverted bracket + Standard angle only):
- 140 total combinations

For support level -150mm (Standard bracket + both angles):
- 280 total combinations (double due to both angle orientations)

## Testing
Comprehensive tests ensure:
- Correct bracket type selection for all BSL ranges
- Proper angle orientation selection according to the table
- Accurate bracket height calculations
- Valid combination generation
- Load-based constraints are respected

## Next Steps
The existing genetic algorithm and other calculation modules will need to be updated to:
1. Handle the new bracket_type and angle_orientation fields
2. Use the new bracket height calculation logic
3. Account for the different combinations in fitness scoring

This implementation provides the foundation for the complete bracket and angle selection system as specified in the project requirements. 