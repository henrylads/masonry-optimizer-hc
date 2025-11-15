# Bracket/Angle Intersection Issue - UNRESOLVED

**Status:** IN PROGRESS - NOT FIXED
**Date Created:** 2024-11-14
**Priority:** HIGH

## Problem Description

When optimizing with thin RHS sections (e.g., RHS 100mm thick), the ShapeDiver 3D visualization shows the angle intersecting/going through the bracket, even though backend calculations appear correct.

## Test Case Parameters

```
Frame Type: Steel RHS
Slab/RHS Thickness: 100mm (using RHS 100x80, where 100mm is the structural height)
Support Level: -50mm (below SSL)
Cavity: 100mm
Load: 5kN
Bracket Centres: 500mm
Expected Result: Inverted bracket
```

## Backend Calculations (CORRECT)

The backend correctly:
1. Identifies need for inverted bracket
2. Calculates initial bracket height: ~160mm
3. Extends bracket to minimum height: 175mm
4. Adjusts bracket bottom downward by 15mm
5. Calculates all dimensions properly

Console output shows:
```
⚠️  Inverted bracket extended from 160mm to 175mm to meet minimum requirements
   Bracket bottom adjusted from -210mm to -225mm (extended 15mm downward)
   Bracket position adjustment: 15mm (move bracket down for ShapeDiver)
```

## ShapeDiver 3D Visualization (INCORRECT)

Despite correct calculations, the 3D model shows angle going through bracket.

## Attempted Fixes

### Fix Attempt #1: Adjusted Dim D
- **Approach:** Increased Dim D from 30mm to 45mm when bracket extends
- **File:** `src/calculations/bracketCalculations.ts`
- **Result:** FAILED - Still shows intersection

### Fix Attempt #2: Bracket Position Adjustment
- **Approach:** Keep Dim D at 30mm, move entire bracket down by adjusting `bracketFixingLevel`
- **Files Modified:**
  - `src/calculations/bracketCalculations.ts` - Added `bracket_position_adjustment` field
  - `src/utils/json-generators.ts` - Applied adjustment to `bracketFixingLevel`
- **Logic:**
  - Original fixing level: -75mm
  - Adjusted fixing level: -90mm (75 + 15)
- **Result:** FAILED - Still shows intersection

## Current Code State

### bracketCalculations.ts Changes
```typescript
// Lines 165-185: Track bracket position adjustment
let bracket_position_adjustment = 0;
if (final_bracket_height < required_min_height) {
    const extension_needed = required_min_height - final_bracket_height;
    final_bracket_height = required_min_height;
    adjusted_bracket_bottom_from_ssl = bracket_top_position_from_ssl - final_bracket_height;
    bracket_position_adjustment = extension_needed; // e.g., 15mm
}

// Return includes:
bracket_position_adjustment: bracket_position_adjustment > 0 ? roundToTwelveDecimals(bracket_position_adjustment) : undefined
```

### json-generators.ts Changes
```typescript
// Lines 246-256: Apply position adjustment to fixing level
const bracketPositionAdjustment = calculated.bracket_position_adjustment ?? 0
const bracketFixingLevel = -Math.round(fixingPosition + bracketPositionAdjustment)
```

## Hypotheses for Why It's Not Working

1. **ShapeDiver Model Interpretation**: The 3D model may interpret bracket positioning differently than we expect
2. **Missing Parameter**: There may be another ShapeDiver parameter we need to adjust (bracket top position? angle position?)
3. **Coordinate System Mismatch**: Our coordinate system (SSL-based) may not align with ShapeDiver's coordinate system
4. **Angle Positioning**: Perhaps we need to adjust the angle position, not the bracket position
5. **Timing Issue**: The ShapeDiver parameters might need to be updated in a specific order

## Next Steps to Investigate

1. **Inspect ShapeDiver JSON output**: Log the exact JSON being sent to ShapeDiver to verify values
2. **Compare working vs. broken cases**: Test with thicker slab (225mm) where it works, compare JSON output
3. **Review ShapeDiver model parameters**: Check if there are additional position parameters in the ShapeDiver model
4. **Test with different Dim D values**: Manually try different combinations of Dim D and fixing level
5. **Check angle vertical leg position**: Verify angle is positioned correctly relative to bracket
6. **Review ShapeDiver documentation**: Check if there's specific guidance on inverted bracket positioning

## Files to Review

- `/src/utils/json-generators.ts` - JSON generation for ShapeDiver
- `/src/calculations/bracketCalculations.ts` - Bracket height and position calculations
- `/src/components/shapediver.tsx` - ShapeDiver component integration
- `/src/types/optimization-types.ts` - Type definitions for results

## Related Issues

- RHS optimization was generating 0 combinations (FIXED - extended Dim D range to 30-450mm)
- Minimum bracket height enforcement (175mm) triggering the extension

## Key Insight from User

> "I think in this situation you need to move the bracket down by 15mm that appears to be the issue"

This suggests the bracket position adjustment approach is conceptually correct, but implementation may need refinement.

## Questions to Answer

1. Does ShapeDiver have a separate "bracket vertical position" parameter?
2. Should we be adjusting `supportLevel` in the runJSON instead?
3. Is the angle being positioned correctly relative to the adjusted bracket?
4. Does the toe plate position need adjustment too?

## Console Logs to Add for Debugging

```typescript
console.log('ShapeDiver JSON Bracket:', JSON.stringify(bracketJSON, null, 2))
console.log('ShapeDiver JSON Run:', JSON.stringify(runJSON, null, 2))
console.log('Bracket geometry:', {
  height: bracketHeight,
  dimD: dimD,
  fixingLevel: bracketFixingLevel,
  positionAdjustment: bracketPositionAdjustment
})
```
