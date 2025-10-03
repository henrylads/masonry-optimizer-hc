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
    return totalWithGaps === totalLength && seg.length <= 50; // Max 50 pieces
  });
}

/**
 * Calculate score for a segmentation option
 * Lower score is better
 *
 * Scoring criteria:
 * 1. Primary: Total bracket count (lower is better)
 * 2. Secondary: Average spacing (higher is better, so inverse)
 * 3. Tertiary: Number of unique piece lengths (lower is better)
 *
 * @param segmentation Segmentation to score
 * @returns Score value (lower is better)
 */
export function calculateSegmentationScore(segmentation: RunSegmentation): number {
  // Primary: Total brackets (weight: 1000)
  const bracketScore = segmentation.totalBrackets * 1000;

  // Secondary: Average spacing (inverse, weight: 10)
  // Higher average spacing is better, so we subtract from max
  const spacingScore = (600 - segmentation.averageSpacing) * 10;

  // Tertiary: Unique piece count (weight: 1)
  const varietyScore = segmentation.uniquePieceLengths;

  return bracketScore + spacingScore + varietyScore;
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

      piece = calculateNonStandardPiece(length, bracketCentres, constraints);

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
        } else if (isLast && !isFirst) {
          // Last piece: only start edge is inner (adjacent to gap)
          startEdge = targetInnerEdge;
          endEdge = length - (piece.bracketCount - 1) * bracketCentres - startEdge;
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

  // Calculate average spacing
  const totalSpacings = pieces.reduce((sum, p) => sum + p.spacing * (p.bracketCount - 1), 0);
  const totalSpacingCount = pieces.reduce((sum, p) => sum + (p.bracketCount - 1), 0);
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

  // Try different piece counts
  for (let numPieces = minPieces; numPieces <= Math.min(minPieces + 3, 10); numPieces++) {
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

        if (rounded > maxAngleLength || rounded <= RUN_LAYOUT_CONSTANTS.LONG_ANGLE_THRESHOLD) {
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
    if (evenPieceLength <= maxAngleLength && evenPieceLength > RUN_LAYOUT_CONSTANTS.LONG_ANGLE_THRESHOLD) {
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
