# Negative Support Level Fix Summary

## Date: September 30, 2025

## Problem

The **simplified inverted bracket calculation** (`calculateInvertedBracketHeight()`) was not working correctly for **negative support levels between 0 and -75mm**.

According to the **Bracket and Angle Selection Table** in projectOverview.md:
- Support levels **-25mm and -50mm** should use **Inverted brackets**
- But the calculation was producing incorrect results

### Example Problem (Support Level -50mm)

**Before Fix:**
```typescript
const height_above_ssl_raw = Math.max(0, support_level) + angle_adjustment;
// Math.max(0, -50) + 55 = 0 + 55 = 55mm above SSL ❌
```

**Result**: Bracket incorrectly extends 55mm above SSL, but the angle should be 50mm **below** SSL (inside the slab)!

## Root Cause

The simplified calculation logic (line 109) used `Math.max(0, support_level)` which:
- Works correctly for **positive** support levels (angle above SSL)
- **Fails** for **negative** support levels (angle below SSL)
- Was designed only for angles mounted above the structural slab level

However, per the project table:
- **-50mm and -25mm** support levels require **inverted brackets**
- These represent angles positioned **below SSL but above the fixing point**
- The calculation needs to handle this scenario correctly

## Solution

**Delegated to proven calculation logic** instead of duplicating complex geometry calculations.

### Changes Made (bracketCalculations.ts)

#### 1. Import Working Function (lines 7-11)
```typescript
import {
    BRACKET_ANGLE_CONSTANTS,
    calculateBracketHeight,        // ← Added
    type BracketHeightCalculationParams  // ← Added
} from './bracketAngleSelection';
```

#### 2. Replace Simplified Logic with Proven Function (lines 104-116)
**Before** (lines 102-125):
```typescript
const angle_adjustment = (inputs.angle_orientation === 'Standard')
    ? (angle_height - angle_thickness)
    : 0;

const height_above_ssl_raw = Math.max(0, support_level) + angle_adjustment;
// ... more manual calculations
```

**After**:
```typescript
// Use the proven calculation logic that handles both positive and negative support levels
const bracketHeightParams: BracketHeightCalculationParams = {
    support_level,
    top_critical_edge_distance: effectiveFixingPosition,
    distance_from_top_to_fixing: 40,
    vertical_leg: angle_height,
    bracket_type: 'Inverted',
    angle_orientation: inputs.angle_orientation || 'Inverted',
    fixing_position: effectiveFixingPosition
};

const minimum_bracket_height = calculateBracketHeight(bracketHeightParams);
```

#### 3. Correct Height Distribution (lines 118-135)
```typescript
// Calculate Height Above and Below SSL based on support level
let height_above_ssl_raw: number;
let height_below_ssl_raw: number;

if (support_level >= 0) {
    // Angle is above SSL
    const angle_adjustment = (inputs.angle_orientation === 'Standard')
        ? (angle_height - angle_thickness)
        : 0;
    height_above_ssl_raw = support_level + angle_adjustment;
    height_below_ssl_raw = minimum_bracket_height - height_above_ssl_raw;
} else {
    // Angle is below SSL (inside slab) - bracket doesn't extend above SSL
    height_above_ssl_raw = 0;
    height_below_ssl_raw = minimum_bracket_height;
}
```

## Test Results

### All Tests Pass ✅

**Test Case 1: Support -50mm**
- Bracket Type: Inverted ✅
- Height Above SSL: 0mm ✅ (angle is below SSL)
- Bracket Height: 225mm
- Dim D: 150mm ✅
- Rise to Bolts: 135mm ✅

**Test Case 2: Support -25mm**
- Bracket Type: Inverted ✅
- Height Above SSL: 0mm ✅ (angle is below SSL)
- Bracket Height: 200mm
- Dim D: 150mm ✅
- Rise to Bolts: 135mm ✅

**Test Case 3: Support 0mm (boundary)**
- Bracket Type: Inverted ✅
- Height Above SSL: 0mm
- Bracket Height: 115mm
- Dim D: 150mm ✅
- Rise to Bolts: 135mm ✅

**Test Case 4: Support +50mm**
- Bracket Type: Inverted ✅
- Height Above SSL: 50mm ✅ (angle is above SSL)
- Bracket Height: 165mm
- Dim D: 150mm ✅
- Rise to Bolts: 135mm ✅

## Benefits

1. **Correctness**: Now properly handles negative support levels per project table
2. **Reliability**: Uses proven calculation logic instead of simplified (broken) approach
3. **Maintainability**: Single source of truth for bracket height calculations
4. **Completeness**: Works for full range of support levels (-75mm to +∞)

## Verification

Run the test:
```bash
npx tsx test-negative-support-fix.ts
```

Result: **✅ ALL TESTS PASSED**

## Server Status

Development server running at: **http://localhost:3002**

The fix is now live. You can test with support levels between **-75mm and 0mm** (like -50mm, -25mm) and they will:
- Correctly use **Inverted bracket** type
- Position the angle **below SSL** (inside the slab zone)
- Calculate **height_above_ssl = 0mm** (nothing extends above SSL)
- Produce correct bracket heights and Dim D values

## Files Modified

1. **src/calculations/bracketCalculations.ts**:
   - Lines 7-11: Added imports
   - Lines 104-135: Replaced manual calculation with `calculateBracketHeight()` delegation
   - Conditional logic for height distribution based on positive vs negative support

2. **Test file**: `test-negative-support-fix.ts` (for validation)