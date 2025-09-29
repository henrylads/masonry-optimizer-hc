# Inverted Angle and Bracket Implementation Summary

## Overview
This document summarizes the implementation of the sophisticated bracket type and angle orientation selection logic as described in `docs/invertedAngle.md`. The implementation replaces the simplified bracket height calculations with a comprehensive system that considers all bracket and angle combinations based on BSL (Brick Support Level) ranges.

## Files Created/Modified

### New Files Created
1. **`src/types/bracketAngleTypes.ts`** - Type definitions for bracket and angle selection
2. **`src/calculations/bracketAngleSelection.ts`** - Core selection logic and calculations
3. **`src/calculations/__tests__/bracketAngleSelection.test.ts`** - Comprehensive tests
4. **`src/calculations/__tests__/bruteForceAlgorithm.test.ts`** - Updated combination generation tests

### Modified Files
1. **`src/calculations/bruteForceAlgorithm/index.ts`** - Updated type definitions and parameter calculations
2. **`src/calculations/bruteForceAlgorithm/combinationGeneration.ts`** - Enhanced to generate bracket/angle combinations

## Key Implementation Details

### 1. Selection Table Implementation
The BSL range-based selection table is now fully implemented:

| BSL Range | Bracket Type | Valid Angle Orientations |
|-----------|-------------|-------------------------|
| ≥ 0mm | Inverted | Both (Standard, Inverted) |
| -25mm to -50mm | Inverted | Standard only |
| -75mm to -135mm | Standard | Inverted only |
| -150mm to -175mm | Standard | Both (Standard, Inverted) |
| < -175mm | Standard | Both (Standard, Inverted) |

### 2. Bracket Height Calculation
Implemented sophisticated bracket height calculation with adjustments:

- **Base calculation**: `Math.abs(support_level) - top_critical_edge_distance + distance_from_top_to_fixing`
- **Adjustments**:
  - Standard bracket + Inverted angle: Add vertical leg height
  - Inverted bracket + Standard angle: Add vertical leg height
  - Standard bracket + Standard angle: No adjustment
  - Inverted bracket + Inverted angle: No adjustment

### 3. Rise to Bolts Calculation
Enhanced rise to bolts calculation with proper limiting logic:
- Base: `bracket_height - (distance_from_top_to_fixing + worst_case_adjustment)`
- Limited to bottom critical edge distance when bracket projects below slab

### 4. Type System Updates
- Added `BracketType` and `AngleOrientation` types
- Updated `GeneticParameters` interface to include `bracket_type` and `angle_orientation`
- Updated `CalculatedParameters` interface to store angle orientation

### 5. Combination Generation Enhancement
The brute force algorithm now generates:
- **140 combinations** for single angle orientation scenarios (e.g., -100mm support level)
- **280 combinations** for dual angle orientation scenarios (e.g., 0mm or -150mm support level)
- Proper load-based constraints (max 500mm bracket centres for loads > 5kN/m)

## Constants and Configuration

### Key Constants
- **Fixing point from SSL**: -75mm (Top Critical Edge Distance)
- **Distance from top to fixing**: 40mm
- **Worst case adjustment**: 15mm

### Validation Rules
- Bracket type determined by BSL relative to fixing point (-75mm)
- Angle orientations filtered based on BSL ranges
- All combinations validated against engineering constraints

## Testing Coverage

### Core Function Tests (22 tests)
- Bracket type selection for all BSL ranges
- Angle orientation selection according to selection table
- Bracket height calculations with all adjustment scenarios
- Rise to bolts calculations with limiting logic
- Validation functions for combination checking

### Integration Tests (11 tests)
- Combination generation for different support levels
- Load constraint application
- Edge case handling (boundary values, extreme support levels)
- Parameter validation and consistency

**Total: 33 tests passing**

## Expected Performance Impact

### Combination Count Changes
- **Before**: ~140 combinations per parameter set
- **After**: 140-280 combinations per parameter set (depending on BSL range)

### Design Space Coverage
- More comprehensive exploration of design options
- Multiple angle orientations where beneficial
- Better optimization potential through increased variety

## Precision and Accuracy
- All calculations maintain 12 decimal place precision
- Proper rounding only at final results
- Engineering calculation accuracy preserved
- Full compliance with project calculation rules

## Next Steps for Integration

1. **Genetic Algorithm Update**: The genetic algorithm needs to be updated to handle the new `bracket_type` and `angle_orientation` fields
2. **Fitness Scoring**: Update fitness scoring to account for the new calculation methods
3. **UI Updates**: Results display may need updates to show bracket type and angle orientation
4. **Performance Testing**: Test the algorithm with the increased combination count

## Validation

The implementation has been thoroughly tested and validated against:
- The selection table from the project overview
- The bracket height adjustment rules from the documentation
- All BSL boundary conditions
- Load-based constraints
- Precision requirements

All tests pass successfully, confirming the implementation correctly follows the engineering specifications in `docs/invertedAngle.md`. 