# Analysis: Why Alternative 1 Shows as Identical to Optimal Design

## The Problem
Alternative 1 is appearing identical to the Optimal Design in the UI, which suggests either:
1. The optimal design is being included in the alternatives list
2. Two designs with identical parameters but different weights are being tracked
3. Some parameters that differ between designs aren't being displayed or compared

## Key Findings

### 1. How Alternatives are Tracked

From `runBruteForce` function analysis:

1. **All valid designs are added to `topDesigns` array** (line 373):
   - Every valid design gets pushed to `topDesigns`
   - Array is sorted by weight after each addition
   - Only top 10 are kept

2. **The optimal design IS included in `topDesigns`**:
   - When a design becomes the new best (line 342-346), it's still added to `topDesigns`
   - There's no logic to exclude the best design from being added to alternatives

3. **Alternatives are processed starting from index 1** (line 443):
   - `topDesigns.slice(1)` - this SHOULD exclude the first (optimal) design
   - But this assumes the optimal design is always at index 0

### 2. Potential Root Cause

The issue likely stems from the **two-tier selection logic** (lines 408-423):

1. First, the algorithm finds the absolute lightest design (`bestValidDesign`)
2. Then, if BSL is above slab bottom, it may select a different design (`bestStandardAngleDesign`)
3. The `finalSelectedDesign` might not be the same as `topDesigns[0]`

**Critical Issue**: `topDesigns` is sorted by weight, so `topDesigns[0]` is the lightest design overall. But if the two-tier logic selects a heavier standard angle design as `finalSelectedDesign`, then `topDesigns[0]` might not be the selected optimal design!

### 3. Missing Parameter Comparisons

The key differences logic (lines 447-476) only compares:
- bracket_type
- angle_orientation  
- bracket_centres
- bracket_thickness
- angle_thickness

It does NOT compare:
- **vertical_leg** (displayed in UI at line 1334 of results-display.tsx)
- **horizontal_leg** (displayed in UI at line 1338 of results-display.tsx)
- **bolt_diameter** (actually this IS compared at line 470-472)

### 4. Solution Approach

The fix needs to:
1. Ensure the selected design is excluded from alternatives, not just topDesigns[0]
2. Add vertical_leg and horizontal_leg to key differences comparison
3. Consider filtering out the finalSelectedDesign from topDesigns before processing alternatives

## Recommended Fix

```typescript
// Instead of:
const processedAlternatives = topDesigns.slice(1).map((alt) => {

// Should be:
const processedAlternatives = topDesigns
    .filter(alt => {
        // Exclude the selected design by comparing all genetic parameters
        return !(
            alt.design.genetic.bracket_centres === finalSelectedDesign.genetic.bracket_centres &&
            alt.design.genetic.bracket_type === finalSelectedDesign.genetic.bracket_type &&
            alt.design.genetic.angle_orientation === finalSelectedDesign.genetic.angle_orientation &&
            alt.design.genetic.bracket_thickness === finalSelectedDesign.genetic.bracket_thickness &&
            alt.design.genetic.angle_thickness === finalSelectedDesign.genetic.angle_thickness &&
            alt.design.genetic.vertical_leg === finalSelectedDesign.genetic.vertical_leg &&
            alt.design.genetic.horizontal_leg === finalSelectedDesign.genetic.horizontal_leg &&
            alt.design.genetic.bolt_diameter === finalSelectedDesign.genetic.bolt_diameter
        );
    })
    .slice(0, TOP_N_ALTERNATIVES - 1) // Take top N-1 since we excluded the optimal
    .map((alt) => {
```

And add vertical_leg and horizontal_leg comparisons to keyDifferences logic.