/**
 * Multi-piece run layout optimizer
 *
 * Optimizes the layout of angle pieces and brackets across long runs (0-250m+)
 * by minimizing material usage and component variety.
 */

import type {
  AnglePiece,
  RunSegmentation,
  EdgeDistanceConstraints,
  RunOptimizationRequest,
  RunOptimizationResult
} from '../types/runLayout';

/**
 * Standard angle length table based on bracket center-to-center spacing
 * These are the optimal standard lengths that can be manufactured
 *
 * Formula: L = k × C - 10mm (where k is number of brackets, C is spacing)
 * Maximum length: 1490mm (sheet manufacturing limit)
 */
export const STANDARD_LENGTH_TABLE: Record<number, number[]> = {
  500: [1490, 990],
  450: [1340, 890],
  400: [1190, 790],
  350: [1390, 1040, 690],
  300: [1490, 1190, 890, 590],
  250: [1490, 1240, 990, 740, 490],
  200: [1390, 1190, 990, 790, 590, 390]
};

/**
 * Constants for run layout calculations
 */
export const RUN_LAYOUT_CONSTANTS = {
  /** Maximum manufacturable angle length (mm) */
  MAX_ANGLE_LENGTH: 1490,
  /** Gap between adjacent angle pieces (mm) */
  GAP_BETWEEN_PIECES: 10,
  /** Manufacturing increment for angle lengths (mm) */
  LENGTH_INCREMENT: 5,
  /** Minimum distance from angle end to bracket (mm) */
  MIN_EDGE_DISTANCE: 35,
  /** Bracket slot pitch for adjustment (mm) */
  SLOT_PITCH: 50,
  /** Minimum number of brackets for angles > 150mm */
  MIN_BRACKETS_FOR_LONG_ANGLE: 2,
  /** Threshold length requiring minimum brackets (mm) */
  LONG_ANGLE_THRESHOLD: 150
} as const;

/**
 * Get standard angle lengths for a given bracket spacing
 * Uses the standard length table, or calculates if not in table
 *
 * @param bracketCentres Bracket center-to-center spacing (mm)
 * @param maxLength Maximum angle length (default 1490mm)
 * @returns Array of standard lengths in descending order
 */
export function getStandardLengths(
  bracketCentres: number,
  maxLength = RUN_LAYOUT_CONSTANTS.MAX_ANGLE_LENGTH
): number[] {
  // Try to get from table first
  if (STANDARD_LENGTH_TABLE[bracketCentres]) {
    return STANDARD_LENGTH_TABLE[bracketCentres];
  }

  // Calculate if not in table
  // Formula: L = k × Bcc - gap, where k is number of brackets
  const gap = RUN_LAYOUT_CONSTANTS.GAP_BETWEEN_PIECES;
  const lengths: number[] = [];
  const maxBrackets = Math.floor((maxLength + gap) / bracketCentres);

  for (let k = maxBrackets; k >= 1; k--) {
    const length = k * bracketCentres - gap;
    if (length > 0 && length <= maxLength) {
      // Round to nearest 5mm increment
      const rounded = Math.round(length / RUN_LAYOUT_CONSTANTS.LENGTH_INCREMENT)
        * RUN_LAYOUT_CONSTANTS.LENGTH_INCREMENT;
      if (rounded > 0 && rounded <= maxLength) {
        lengths.push(rounded);
      }
    }
  }

  return lengths;
}

/**
 * Calculate bracket positions for a standard angle piece
 *
 * @param length Angle length (mm)
 * @param bracketCentres Bracket spacing (mm)
 * @returns Angle piece with bracket positions
 */
export function calculateStandardPiece(
  length: number,
  bracketCentres: number
): AnglePiece {
  const gap = RUN_LAYOUT_CONSTANTS.GAP_BETWEEN_PIECES;

  // Calculate number of brackets: k = (L + gap) / Bcc
  const bracketCount = Math.round((length + gap) / bracketCentres);

  // First bracket offset: Bcc/2 - gap/2
  const startOffset = bracketCentres / 2 - gap / 2;

  // Generate positions
  const positions = Array.from(
    { length: bracketCount },
    (_, i) => startOffset + i * bracketCentres
  );

  return {
    length,
    bracketCount,
    spacing: bracketCentres,
    startOffset,
    positions,
    isStandard: true
  };
}

/**
 * Calculate bracket positions for a non-standard angle piece
 * Uses symmetric placement with edge distance constraints
 *
 * @param length Angle length (mm)
 * @param bracketCentres Maximum bracket spacing (mm)
 * @param constraints Edge distance constraints
 * @returns Angle piece with optimized bracket positions
 */
export function calculateNonStandardPiece(
  length: number,
  bracketCentres: number,
  constraints: EdgeDistanceConstraints
): AnglePiece {
  const { e_min, e_max } = constraints;
  const slotPitch = RUN_LAYOUT_CONSTANTS.SLOT_PITCH;

  // Calculate minimum number of brackets needed
  let bracketCount = Math.max(
    2, // Minimum 2 brackets for any piece
    Math.ceil(length / bracketCentres)
  );

  while (true) {
    // Strategy 1: Try to use exact bracketCentres spacing first (preferred)
    // This maintains consistent spacing across the entire run
    const spacingWithBcc = bracketCentres;
    const overhangWithBcc = (length - (bracketCount - 1) * spacingWithBcc) / 2;

    if (overhangWithBcc >= e_min && overhangWithBcc <= e_max) {
      // Perfect! Can use exact bracketCentres spacing
      const positions = Array.from(
        { length: bracketCount },
        (_, i) => overhangWithBcc + i * spacingWithBcc
      );

      return {
        length,
        bracketCount,
        spacing: spacingWithBcc,
        startOffset: overhangWithBcc,
        positions,
        isStandard: false
      };
    }

    // Strategy 2: Try spacing rounded to slot pitch (50mm increments)
    const idealSpacing = length / bracketCount;
    const spacing = Math.ceil(idealSpacing / slotPitch) * slotPitch;

    if (spacing <= bracketCentres) {
      const overhang = (length - (bracketCount - 1) * spacing) / 2;

      if (overhang >= e_min && overhang <= e_max) {
        // Valid configuration found with slot pitch alignment
        const positions = Array.from(
          { length: bracketCount },
          (_, i) => overhang + i * spacing
        );

        return {
          length,
          bracketCount,
          spacing,
          startOffset: overhang,
          positions,
          isStandard: false
        };
      }
    }

    // Add more brackets and try again
    bracketCount++;

    // Safety check to prevent infinite loop
    if (bracketCount > 100) {
      throw new Error(`Could not find valid bracket configuration for ${length}mm piece`);
    }
  }
}

/**
 * Calculate symmetrical bracket positions for the final piece in a run
 * Used for aesthetic and practical reasons on the last piece
 *
 * @param length Angle length (mm)
 * @param bracketCount Number of brackets
 * @param bracketCentres Bracket spacing (mm)
 * @param constraints Edge distance constraints
 * @returns Angle piece with symmetrical bracket positions
 */
export function calculateSymmetricalBracketPositions(
  length: number,
  bracketCount: number,
  bracketCentres: number,
  constraints: EdgeDistanceConstraints
): AnglePiece {
  const { e_min, e_max } = constraints;
  const positions: number[] = [];

  console.log(`\n=== Calculating symmetrical positions for ${length}mm, ${bracketCount} brackets, ${bracketCentres}mm centres ===`);
  console.log(`Constraints: e_min=${e_min}mm, e_max=${e_max}mm`);

  if (bracketCount % 2 === 1) {
    // ODD number of brackets: place middle bracket at center
    const middleIndex = Math.floor(bracketCount / 2);
    const centerPosition = length / 2;

    // Place middle bracket at center
    positions[middleIndex] = centerPosition;

    // Place other brackets symmetrically around center
    for (let i = 0; i < middleIndex; i++) {
      const offset = (middleIndex - i) * bracketCentres;
      positions[i] = centerPosition - offset;
      positions[bracketCount - 1 - i] = centerPosition + offset;
    }
  } else {
    // EVEN number of brackets: place middle two at ±0.5*bracketCentres from center
    const center = length / 2;
    const halfSpacing = bracketCentres / 2;

    const middleLeftIndex = (bracketCount / 2) - 1;
    const middleRightIndex = bracketCount / 2;

    positions[middleLeftIndex] = center - halfSpacing;
    positions[middleRightIndex] = center + halfSpacing;

    // Place other brackets symmetrically
    for (let i = 0; i < middleLeftIndex; i++) {
      const offset = (middleLeftIndex - i) * bracketCentres;
      positions[i] = positions[middleLeftIndex] - offset;
      positions[bracketCount - 1 - i] = positions[middleRightIndex] + offset;
    }
  }

  // Check edge distances and adjust if needed
  let startEdge = positions[0];
  let endEdge = length - positions[bracketCount - 1];

  console.log(`Initial positions:`, positions);
  console.log(`Initial edges: start=${startEdge.toFixed(2)}mm, end=${endEdge.toFixed(2)}mm`);

  // If edges violate constraints, shift all brackets equally by 1mm at a time
  let iterations = 0;
  const maxIterations = 1000; // Increased to handle larger adjustments

  while ((startEdge < e_min || startEdge > e_max || endEdge < e_min || endEdge > e_max) && iterations < maxIterations) {
    iterations++;

    if (iterations === 1 || iterations % 100 === 0) {
      console.log(`Iteration ${iterations}: start=${startEdge.toFixed(2)}mm, end=${endEdge.toFixed(2)}mm`);
    }

    // Determine how much to shift
    let shiftAmount = 0;

    if (startEdge < e_min) {
      // Start edge too small - shift all brackets right (increase positions)
      shiftAmount = 1;
    } else if (endEdge < e_min) {
      // End edge too small - shift all brackets left (decrease positions)
      shiftAmount = -1;
    } else if (startEdge > e_max && endEdge <= e_max) {
      // Start edge too large, end edge ok - shift left to reduce start edge
      shiftAmount = -1;
    } else if (endEdge > e_max && startEdge <= e_max) {
      // End edge too large, start edge ok - shift right to reduce end edge
      shiftAmount = 1;
    } else if (startEdge > e_max && endEdge > e_max) {
      // Both edges too large - shift toward the edge that's less over to balance them
      if (startEdge - e_max > endEdge - e_max) {
        shiftAmount = -1; // Start edge is more over, shift left to reduce it
      } else {
        shiftAmount = 1; // End edge is more over, shift right to reduce it
      }
    }

    // Apply shift to all brackets
    for (let i = 0; i < bracketCount; i++) {
      positions[i] += shiftAmount;
    }

    startEdge = positions[0];
    endEdge = length - positions[bracketCount - 1];
  }

  // If we couldn't find valid positions after max iterations, the configuration is impossible
  if (iterations >= maxIterations) {
    console.log(`FAILED after ${iterations} iterations. Final edges: start=${startEdge.toFixed(2)}mm, end=${endEdge.toFixed(2)}mm`);
    throw new Error(`Could not find valid symmetrical bracket configuration for ${length}mm piece with ${bracketCount} brackets after ${iterations} iterations`);
  }

  console.log(`SUCCESS after ${iterations} iterations! Final edges: start=${startEdge.toFixed(2)}mm, end=${endEdge.toFixed(2)}mm`);
  console.log(`Final positions:`, positions);

  return {
    length,
    bracketCount,
    spacing: bracketCentres,
    startOffset: positions[0],
    positions,
    isStandard: false
  };
}

/**
 * Validate edge distances for a piece
 *
 * @param piece Angle piece to validate
 * @param constraints Edge distance constraints
 * @returns True if valid, false otherwise
 */
export function validateEdgeDistances(
  piece: AnglePiece,
  constraints: EdgeDistanceConstraints
): boolean {
  const { e_min, e_max } = constraints;

  // Check first bracket (left edge)
  if (piece.positions[0] < e_min || piece.positions[0] > e_max) {
    return false;
  }

  // Check last bracket (right edge)
  const lastPos = piece.positions[piece.positions.length - 1];
  const edgeDistance = piece.length - lastPos;
  if (edgeDistance < e_min || edgeDistance > e_max) {
    return false;
  }

  return true;
}

/**
 * Generate all possible segmentations of a total run into pieces
 *
 * @param totalLength Total run length (mm)
 * @param standardLengths Available standard lengths (descending order)
 * @param gap Gap between pieces (mm)
 * @returns Array of possible piece combinations
 */
export function generateSegmentations(
  totalLength: number,
  standardLengths: number[],
  gap = RUN_LAYOUT_CONSTANTS.GAP_BETWEEN_PIECES
): number[][] {
  const segmentations: number[][] = [];

  // Recursive function to build combinations
  function buildCombinations(
    remaining: number,
    current: number[],
    startIndex: number
  ): void {
    // Base case: if remaining is small enough, add as final piece
    if (remaining <= standardLengths[0] + gap) {
      if (remaining > 0) {
        segmentations.push([...current, remaining]);
      } else if (remaining === 0) {
        segmentations.push([...current]);
      }
      return;
    }

    // Try each standard length
    for (let i = startIndex; i < standardLengths.length; i++) {
      const length = standardLengths[i];
      if (length + gap <= remaining) {
        // Use this length and recurse
        buildCombinations(
          remaining - length - gap,
          [...current, length],
          i // Allow reusing same length
        );
      }
    }
  }

  buildCombinations(totalLength, [], 0);

  // Filter out invalid combinations (too many pieces, negative remainders, etc.)
  return segmentations.filter(seg => {
    // IMPORTANT: Gaps at both ends AND between pieces = (numPieces + 1) gaps total
    const totalWithGaps = seg.reduce((sum, len) => sum + len, 0) + (seg.length + 1) * gap;
    // Increased max pieces from 50 to 200 to support longer runs (up to 250m+)
    return totalWithGaps === totalLength && seg.length <= 200;
  });
}

/**
 * Calculate score for a segmentation option
 * Lower score is better
 *
 * Scoring criteria:
 * 1. Primary: Total bracket count (lower is better)
 * 2. Secondary: Total piece count (lower is better)
 * 3. Tertiary: Average spacing (higher is better, so inverse)
 * 4. Quaternary: Number of unique piece lengths (lower is better)
 *
 * @param segmentation Segmentation to score
 * @returns Score value (lower is better)
 */
export function calculateSegmentationScore(segmentation: RunSegmentation): number {
  // Primary: Total brackets (weight: 10000)
  const bracketScore = segmentation.totalBrackets * 10000;

  // Secondary: Total pieces (weight: 100)
  const pieceScore = segmentation.pieceCount * 100;

  // Tertiary: Average spacing (inverse, weight: 10)
  // Higher average spacing is better, so we subtract from max
  const spacingScore = (600 - segmentation.averageSpacing) * 10;

  // Quaternary: Unique piece count (weight: 1)
  const varietyScore = segmentation.uniquePieceLengths;

  return bracketScore + pieceScore + spacingScore + varietyScore;
}

/**
 * Create a complete segmentation from piece lengths
 *
 * @param pieceLengths Array of piece lengths (mm)
 * @param bracketCentres Bracket spacing (mm)
 * @param constraints Edge distance constraints
 * @param standardLengths Array of standard lengths for checking
 * @returns Complete segmentation with all pieces and brackets
 */
export function createSegmentation(
  pieceLengths: number[],
  bracketCentres: number,
  constraints: EdgeDistanceConstraints,
  standardLengths: number[]
): RunSegmentation {
  const pieces: AnglePiece[] = [];
  let totalBrackets = 0;
  const gap = RUN_LAYOUT_CONSTANTS.GAP_BETWEEN_PIECES;

  for (let i = 0; i < pieceLengths.length; i++) {
    const length = pieceLengths[i];
    let piece: AnglePiece;

    // Check if this is a standard length
    if (standardLengths.includes(length)) {
      piece = calculateStandardPiece(length, bracketCentres);
    } else {
      // For non-standard pieces in multi-piece runs, adjust edges to maintain Bcc across gaps
      const isFirst = i === 0;
      const isLast = i === pieceLengths.length - 1;
      const isMultiPiece = pieceLengths.length > 1;

      // For single-piece runs OR last piece in multi-piece runs: use symmetrical placement
      if (!isMultiPiece || (isLast && !isFirst)) {
        // Calculate optimal bracket count for symmetrical placement
        // Start with minimum needed, try increasing until we find a valid configuration
        let optimalBracketCount = Math.max(2, Math.ceil(length / bracketCentres));
        let validPiece = null;

        // Try decreasing bracket count first (prefer fewer brackets)
        for (let tryCount = optimalBracketCount; tryCount >= 2; tryCount--) {
          try {
            validPiece = calculateSymmetricalBracketPositions(length, tryCount, bracketCentres, constraints);
            console.log(`  Successfully placed ${tryCount} brackets symmetrically in ${!isMultiPiece ? 'single' : 'last'} piece (${length}mm)`);
            break;
          } catch (error) {
            // This bracket count doesn't work, try fewer
            continue;
          }
        }

        if (!validPiece) {
          // Could not achieve symmetrical placement - fall back to standard non-symmetrical placement
          console.log(`  ⚠️ Could not place brackets symmetrically in ${!isMultiPiece ? 'single' : 'last'} piece (${length}mm) - falling back to non-symmetrical placement`);
          piece = calculateNonStandardPiece(length, bracketCentres, constraints);
        } else {
          piece = validPiece;
        }

        pieces.push(piece);
        totalBrackets += piece.bracketCount;
        continue; // Skip to next piece
      }

      // Calculate initial piece to get bracket count for multi-piece middle/first pieces
      const initialPiece = calculateNonStandardPiece(length, bracketCentres, constraints);

      piece = initialPiece;

      // If multi-piece run, adjust edge distances to maintain 500mm across gaps
      if (isMultiPiece && piece.bracketCount >= 2) {
        // Target: inner_edge + gap + inner_edge_next = bracketCentres
        // So: inner_edge = (bracketCentres - gap) / 2 = (500 - 10) / 2 = 245mm
        const targetInnerEdge = (bracketCentres - gap) / 2;

        // Recalculate with asymmetric edges
        let startEdge = piece.startOffset;
        let endEdge = length - piece.positions[piece.positions.length - 1];

        // Adjust edges adjacent to gaps to be targetInnerEdge
        // First piece: start=outer, end=inner (adjacent to gap)
        // Last piece: start=inner (adjacent to gap), end=outer
        // Middle piece: both inner (both adjacent to gaps)

        // Leave outer edges as-is, only adjust inner edges
        if (isFirst && !isLast) {
          // First piece: only end edge is inner (adjacent to gap)
          endEdge = targetInnerEdge;
          startEdge = length - (piece.bracketCount - 1) * bracketCentres - endEdge;
        } else if (!isFirst && !isLast) {
          // Middle piece: both edges inner
          startEdge = targetInnerEdge;
          endEdge = length - (piece.bracketCount - 1) * bracketCentres - startEdge;
        }
        // else: single piece, keep symmetric edges

        // Recalculate bracket positions with these edges
        const newPositions: number[] = [];
        for (let j = 0; j < piece.bracketCount; j++) {
          newPositions.push(startEdge + j * bracketCentres);
        }

        // Verify the new positions fit within the piece length
        const calculatedLength = startEdge + (piece.bracketCount - 1) * bracketCentres + endEdge;

        // Allow small rounding differences
        if (Math.abs(calculatedLength - length) < 5) {
          // Update piece with new positions
          piece = {
            ...piece,
            startOffset: startEdge,
            positions: newPositions
          };
        } else {
          console.log(`Warning: Could not adjust edges for piece ${i+1} (${length}mm). Calculated: ${calculatedLength}mm, Diff: ${calculatedLength - length}mm`);
        }
      }
    }

    pieces.push(piece);
    totalBrackets += piece.bracketCount;
  }

  const totalLength = pieceLengths.reduce((sum, len) => sum + len, 0);
  // IMPORTANT: Gaps at both ends AND between pieces = (numPieces + 1) gaps total
  const gapCount = pieces.length + 1;
  const totalGapDistance = gapCount * RUN_LAYOUT_CONSTANTS.GAP_BETWEEN_PIECES;

  // Calculate average spacing including cross-gap spacings
  let totalSpacings = 0;
  let totalSpacingCount = 0;

  for (let pieceIndex = 0; pieceIndex < pieces.length; pieceIndex++) {
    const piece = pieces[pieceIndex];

    // Calculate spacings within the piece
    for (let i = 0; i < piece.positions.length - 1; i++) {
      const spacing = piece.positions[i + 1] - piece.positions[i];
      totalSpacings += spacing;
      totalSpacingCount++;
    }

    // Calculate cross-gap spacing to next piece (if not last piece)
    if (pieceIndex < pieces.length - 1) {
      const nextPiece = pieces[pieceIndex + 1];
      const lastBracketThisPiece = piece.positions[piece.positions.length - 1];
      const firstBracketNextPiece = nextPiece.positions[0];

      // Cross-gap spacing = (piece length - last bracket position) + gap + first bracket position of next piece
      const edgeDistanceThisPiece = piece.length - lastBracketThisPiece;
      const edgeDistanceNextPiece = firstBracketNextPiece;
      const crossGapSpacing = edgeDistanceThisPiece + gap + edgeDistanceNextPiece;

      totalSpacings += crossGapSpacing;
      totalSpacingCount++;
    }
  }

  const averageSpacing = totalSpacingCount > 0 ? totalSpacings / totalSpacingCount : 0;

  // Count unique piece lengths
  const uniqueLengths = new Set(pieceLengths);

  const segmentation: RunSegmentation = {
    totalLength: totalLength + totalGapDistance,
    pieces,
    totalBrackets,
    pieceCount: pieces.length,
    gapCount,
    totalGapDistance,
    averageSpacing,
    uniquePieceLengths: uniqueLengths.size,
    score: 0 // Will be calculated
  };

  segmentation.score = calculateSegmentationScore(segmentation);

  return segmentation;
}

/**
 * Generate fully custom segmentations with varied splits
 * These may be more optimal than standard + makeup combinations
 *
 * Strategy: For each piece count, try different bracket count distributions
 * that maintain proper Bcc and edge distances
 *
 * @param totalLength Total run length (mm)
 * @param bracketCentres Bracket spacing (mm)
 * @param maxAngleLength Maximum piece length (mm)
 * @param gap Gap between pieces (mm)
 * @returns Array of custom piece length combinations
 */
export function generateCustomSegmentations(
  totalLength: number,
  bracketCentres: number,
  maxAngleLength: number,
  gap: number
): number[][] {
  const customOptions: number[][] = [];

  // Calculate minimum number of pieces needed
  const minPieces = Math.ceil(totalLength / (maxAngleLength + gap));

  // Try different piece counts (increased limit from 10 to support longer runs)
  for (let numPieces = minPieces; numPieces <= Math.min(minPieces + 3, 200); numPieces++) {
    // IMPORTANT: Gaps at both ends AND between pieces = (numPieces + 1) gaps total
    const totalGapLength = (numPieces + 1) * gap;
    const availableLength = totalLength - totalGapLength;

    // Strategy 1: Calculate exact piece lengths for bracket distributions
    // Working backwards: totalLength = sum of pieces + gaps
    // Each piece: length = (brackets - 1) × Bcc + 2 × edge

    const minTotalBrackets = Math.ceil(availableLength / bracketCentres);
    const maxTotalBrackets = Math.floor(availableLength / (bracketCentres * 0.4));

    for (let totalBrackets = minTotalBrackets; totalBrackets <= Math.min(maxTotalBrackets, minTotalBrackets + 5); totalBrackets++) {
      // Try to distribute brackets across pieces (minimum 2 per piece)
      const bracketsPerPiece = Math.floor(totalBrackets / numPieces);

      if (bracketsPerPiece < 2) continue; // Each piece needs min 2 brackets

      const extraBrackets = totalBrackets % numPieces;

      // Create bracket distribution
      const bracketDistribution: number[] = [];
      for (let i = 0; i < numPieces; i++) {
        bracketDistribution.push(bracketsPerPiece + (i < extraBrackets ? 1 : 0));
      }

      // Strategy: Maintain Bcc spacing WITHIN pieces AND across gaps
      // Inner edges (adjacent to gaps) must = (Bcc - gap) / 2 to maintain 500mm across gap
      // Outer edges (at start/end of run) can be whatever's left

      const totalSpacingWithinPieces = (totalBrackets - numPieces) * bracketCentres;
      const innerEdge = (bracketCentres - gap) / 2; // 245mm for 500mm Bcc, 10mm gap

      // Number of gaps between pieces (not counting start/end gaps)
      const gapsBetweenPieces = numPieces - 1;

      // Total for inner edges (2 per gap between pieces)
      const totalInnerEdges = 2 * gapsBetweenPieces * innerEdge;

      // Remaining for outer edges (start of first piece, end of last piece)
      const totalOuterEdges = availableLength - totalSpacingWithinPieces - totalInnerEdges;

      // Each outer edge gets half
      const outerEdge = totalOuterEdges / 2;

      // Check if outer edge is reasonable
      if (outerEdge < 35 || outerEdge > bracketCentres * 0.6) continue;

      // Calculate each piece length with correct asymmetric edges
      const pieceLengths: number[] = [];
      let valid = true;

      for (let i = 0; i < bracketDistribution.length; i++) {
        const brackets = bracketDistribution[i];
        const isFirst = i === 0;
        const isLast = i === bracketDistribution.length - 1;

        let length: number;
        if (isFirst && isLast) {
          // Only one piece: both edges are outer
          length = outerEdge + (brackets - 1) * bracketCentres + outerEdge;
        } else if (isFirst) {
          // First piece: outer edge + spacing + inner edge
          length = outerEdge + (brackets - 1) * bracketCentres + innerEdge;
        } else if (isLast) {
          // Last piece: inner edge + spacing + outer edge
          length = innerEdge + (brackets - 1) * bracketCentres + outerEdge;
        } else {
          // Middle piece: both edges are inner
          length = innerEdge + (brackets - 1) * bracketCentres + innerEdge;
        }

        // Round to 1mm (we'll adjust at the end)
        const rounded = Math.round(length);

        // Calculate minimum piece length needed for 2 brackets (minimum viable)
        // Min length = 2 * min_edge + bracketCentres (for 2 brackets)
        const minPieceLength = 2 * RUN_LAYOUT_CONSTANTS.MIN_EDGE_DISTANCE + bracketCentres;

        if (rounded > maxAngleLength || rounded < minPieceLength) {
          valid = false;
          break;
        }

        pieceLengths.push(rounded);
      }

      if (!valid) continue;

      // Adjust lengths to match totalLength exactly
      const currentTotal = pieceLengths.reduce((sum, len) => sum + len, 0) + totalGapLength;
      const diff = totalLength - currentTotal;

      // Distribute difference across pieces (prefer adding to longest)
      if (Math.abs(diff) <= 100) {
        // Add difference to longest piece
        const longestIndex = pieceLengths.indexOf(Math.max(...pieceLengths));
        pieceLengths[longestIndex] += diff;

        // Round all to 5mm
        for (let i = 0; i < pieceLengths.length; i++) {
          pieceLengths[i] = Math.round(pieceLengths[i] / RUN_LAYOUT_CONSTANTS.LENGTH_INCREMENT)
            * RUN_LAYOUT_CONSTANTS.LENGTH_INCREMENT;
        }

        // Final adjustment to make total exact
        const finalTotal = pieceLengths.reduce((sum, len) => sum + len, 0) + totalGapLength;
        const finalDiff = totalLength - finalTotal;
        if (Math.abs(finalDiff) <= 10) {
          pieceLengths[longestIndex] += finalDiff;
        }

        // Verify all pieces still valid
        if (pieceLengths.every(p => p <= maxAngleLength && p > RUN_LAYOUT_CONSTANTS.LONG_ANGLE_THRESHOLD)) {
          // Verify total is correct
          const checkTotal = pieceLengths.reduce((sum, len) => sum + len, 0) + totalGapLength;
          if (checkTotal === totalLength) {
            customOptions.push([...pieceLengths]);
          }
        }
      }
    }

    // Strategy 2: Even split (original approach)
    const evenPieceLength = availableLength / numPieces;
    const minPieceLength = 2 * RUN_LAYOUT_CONSTANTS.MIN_EDGE_DISTANCE + bracketCentres;
    if (evenPieceLength <= maxAngleLength && evenPieceLength >= minPieceLength) {
      const roundedLength = Math.round(evenPieceLength / RUN_LAYOUT_CONSTANTS.LENGTH_INCREMENT)
        * RUN_LAYOUT_CONSTANTS.LENGTH_INCREMENT;
      const pieces = Array(numPieces).fill(roundedLength);
      const total = pieces.reduce((sum, len) => sum + len, 0) + totalGapLength;

      if (Math.abs(total - totalLength) <= 5) {
        const diff = totalLength - total;
        pieces[pieces.length - 1] += diff;

        if (pieces.every(p => p <= maxAngleLength && p > RUN_LAYOUT_CONSTANTS.LONG_ANGLE_THRESHOLD)) {
          customOptions.push(pieces);
        }
      }
    }
  }

  // Remove duplicates
  const uniqueOptions = customOptions.filter((option, index) => {
    const optionStr = option.join(',');
    return customOptions.findIndex(opt => opt.join(',') === optionStr) === index;
  });

  return uniqueOptions;
}

/**
 * Main optimization function for multi-piece runs
 *
 * @param request Run optimization parameters
 * @returns Optimal segmentation with all evaluated options
 */
export function optimizeRunLayout(request: RunOptimizationRequest): RunOptimizationResult {
  const {
    totalRunLength,
    bracketCentres,
    maxAngleLength = RUN_LAYOUT_CONSTANTS.MAX_ANGLE_LENGTH,
    gapBetweenPieces = RUN_LAYOUT_CONSTANTS.GAP_BETWEEN_PIECES,
    minEdgeDistance = RUN_LAYOUT_CONSTANTS.MIN_EDGE_DISTANCE,
    maxEdgeDistance
  } = request;

  // Calculate edge distance constraints
  const e_max = maxEdgeDistance ?? (0.5 * bracketCentres);
  const constraints: EdgeDistanceConstraints = {
    e_min: minEdgeDistance,
    e_max
  };

  // Get standard lengths for this bracket spacing
  const standardLengths = getStandardLengths(bracketCentres, maxAngleLength);

  // Generate standard-based segmentations
  const standardSegmentations = generateSegmentations(
    totalRunLength,
    standardLengths,
    gapBetweenPieces
  );

  // Generate fully custom even-split segmentations
  const customSegmentations = generateCustomSegmentations(
    totalRunLength,
    bracketCentres,
    maxAngleLength,
    gapBetweenPieces
  );

  // Combine all segmentation options
  const allSegmentations = [...standardSegmentations, ...customSegmentations];

  // Create complete segmentations with bracket calculations
  const allOptions = allSegmentations.map(pieceLengths =>
    createSegmentation(pieceLengths, bracketCentres, constraints, standardLengths)
  );

  // Sort by score (lower is better)
  allOptions.sort((a, b) => a.score - b.score);

  // Select optimal (lowest score)
  const optimal = allOptions[0];

  if (!optimal) {
    throw new Error(`No valid segmentation found for ${totalRunLength}mm run`);
  }

  // Calculate material summary
  const pieceLengthCounts = new Map<number, number>();
  for (const piece of optimal.pieces) {
    pieceLengthCounts.set(piece.length, (pieceLengthCounts.get(piece.length) || 0) + 1);
  }

  const pieceLengthBreakdown = Array.from(pieceLengthCounts.entries()).map(([length, count]) => ({
    length,
    count,
    isStandard: standardLengths.includes(length)
  }));

  const totalAngleLength = optimal.pieces.reduce((sum, p) => sum + p.length, 0);

  return {
    optimal,
    allOptions,
    materialSummary: {
      totalAngleLength,
      totalPieces: optimal.pieceCount,
      totalBrackets: optimal.totalBrackets,
      pieceLengthBreakdown
    }
  };
}
