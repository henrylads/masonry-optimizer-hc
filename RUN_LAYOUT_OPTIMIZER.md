# Run Layout Optimizer

## Overview

The Run Layout Optimizer is a feature that calculates optimal angle piece segmentation for long masonry support runs (0-250+ meters). It works in conjunction with the main masonry optimization system to determine how to split long runs into manufacturable pieces while maintaining consistent bracket spacing.

## Key Concepts

### 1. Expansion Gaps
- **10mm gaps** are placed between all angle pieces (5mm each side for masonry detailing)
- Gaps exist at:
  - Start of run (before first piece)
  - Between each piece
  - End of run (after last piece)
- Total gaps = `(numPieces + 1) × 10mm`

### 2. Bracket Spacing
The optimizer maintains **500mm bracket centres (Bcc)** both:
- **Within pieces**: Standard 500mm spacing between brackets on the same angle
- **Across gaps**: 500mm spacing between the last bracket of one piece and the first bracket of the next piece

This is achieved through **asymmetric edge distances**:
- **Inner edges** (adjacent to gaps): 245mm = (500-10)/2
- **Outer edges** (at run start/end): Use remaining available space

### 3. Standard Lengths
Pre-calculated standard angle lengths based on bracket spacing:
- **500mm Bcc**: [1490mm, 990mm, 490mm]
- **400mm Bcc**: [1390mm, 1040mm, 690mm, 340mm]

The optimizer prioritizes using standard lengths to minimize component variety.

### 4. Non-Standard Pieces
When standard lengths don't fit, the optimizer generates custom "makeup" pieces:
- Maintains exact Bcc spacing if possible (preferred)
- Falls back to slot pitch alignment (50mm increments)
- Respects edge distance constraints:
  - Minimum edge: 35mm
  - Maximum edge: 0.5 × Bcc (e.g., 250mm for 500mm Bcc)

## Algorithm Logic

### Phase 1: Standard Segmentation
1. Try combinations of standard lengths
2. For each combination:
   - Calculate if pieces fit within run length (accounting for gaps)
   - Verify all pieces are within max length (1490mm)
   - Score based on: bracket count, piece count, standard vs custom pieces

### Phase 2: Custom Segmentation
For runs that don't fit standard combinations:

1. **Calculate bracket distribution**:
   ```
   availableLength = totalRunLength - (numPieces + 1) × 10mm
   totalBrackets = ceil(availableLength / Bcc)
   ```

2. **Distribute brackets across pieces**:
   - Aim for equal distribution
   - Each piece needs ≥2 brackets (if >150mm)

3. **Calculate piece lengths with asymmetric edges**:
   ```
   innerEdge = (Bcc - gap) / 2  // 245mm for 500mm Bcc
   outerEdge = (availableLength - totalSpacing - totalInnerEdges) / 2

   For each piece:
   - First piece: outerEdge + spacing + innerEdge
   - Middle pieces: innerEdge + spacing + innerEdge
   - Last piece: innerEdge + spacing + outerEdge
   ```

4. **Adjust piece edge distances**:
   - After calculating piece, recalculate bracket positions to maintain asymmetric edges
   - Ensures 500mm spacing maintained across gaps

### Phase 3: Optimization
1. Generate all valid segmentation options
2. Score each option:
   ```
   score = totalBrackets × 100 + pieceCount × 10 + nonStandardPieces × 5
   ```
3. Select option with lowest score (minimizes brackets, then pieces, then non-standard pieces)

## Cross-Gap Spacing Verification

For 2321mm run with 5 brackets (example):
```
Total spacing within pieces: 4 × 500 = 2000mm
Total gaps: 3 × 10 = 30mm
Available for edges: 2321 - 2000 - 30 = 291mm

Inner edges (2×): 2 × 245 = 490mm
Outer edges: 291 - 490 = -199mm ❌ (would be negative)

Solution: Use asymmetric edges where:
- Piece 1: 151mm start + 500mm + 500mm + 245mm end = 1396mm
- Piece 2: 245mm start + 500mm + 150mm end = 895mm
- Cross-gap: 245 + 10 + 245 = 500mm ✓
```

## Key Functions

### `runLayoutOptimizer.ts`

**`optimizeRunLayout(request: RunOptimizationRequest)`**
- Main entry point
- Generates standard and custom segmentations
- Returns optimal solution with all alternatives

**`generateSegmentations(totalRunLength, bracketCentres, ...)`**
- Creates standard length combinations
- Tries all permutations of standard lengths

**`generateCustomSegmentations(totalRunLength, bracketCentres, ...)`**
- Creates custom segmentations when standard doesn't fit
- Generates bracket distributions
- Calculates piece lengths with asymmetric edges

**`createSegmentation(pieceLengths, bracketCentres, ...)`**
- Converts piece lengths to full segmentation with bracket positions
- Applies asymmetric edge distance adjustments
- Validates all constraints

**`calculateNonStandardPiece(length, bracketCentres, ...)`**
- Calculates bracket layout for non-standard pieces
- Prioritizes exact Bcc spacing
- Falls back to slot pitch alignment

## UI Components

### `run-layout-display.tsx`
Visual representation showing:
- Angle pieces (blue bars)
- 10mm gaps (orange indicators)
- Bracket positions (green lines with position labels)
- Spacing labels:
  - **Blue labels**: Within-piece spacing (500mm)
  - **Orange labels**: Cross-gap spacing (500mm)

### Navigation
- **From optimization results**: "Run Layout Optimizer" button passes Bcc via URL parameter
- Opens in new tab to preserve optimization results
- **Close Window** button closes the tab to return to results

## Testing

Test scenarios located in `/test-scenarios/`:
- `20251003-custom-segmentation-test.test.ts`: Validates 2321mm example
- Verifies asymmetric edge distances
- Confirms 500mm cross-gap spacing

## Usage Example

```typescript
import { optimizeRunLayout } from '@/calculations/runLayoutOptimizer';

const result = optimizeRunLayout({
  totalRunLength: 2321,
  bracketCentres: 500,
  minEdgeDistance: 35,
  maxEdgeDistance: 250  // 0.5 × Bcc
});

// Result includes:
// - optimal: Best segmentation
// - allOptions: All valid alternatives
// - materialSummary: Piece breakdown for ordering
```

## Design Constraints

1. **Maximum piece length**: 1490mm (manufacturing limit)
2. **Minimum edge distance**: 35mm
3. **Maximum edge distance**: 0.5 × Bcc (typically 250mm)
4. **Minimum brackets per piece**: 2 (for pieces >150mm)
5. **Gap between pieces**: 10mm (fixed)
6. **Bracket spacing**: Must maintain Bcc across gaps

## Integration Points

1. **Main optimizer** (`masonry-designer-form.tsx`):
   - Calculates optimal Bcc
   - Passes to run layout via URL parameter

2. **Results display** (`results-display.tsx`):
   - Shows "Run Layout Optimizer" button
   - Opens in new tab with Bcc pre-filled

3. **Run layout page** (`/run-layout/page.tsx`):
   - Reads Bcc from URL
   - Allows manual override
   - Displays visual layout and material summary
