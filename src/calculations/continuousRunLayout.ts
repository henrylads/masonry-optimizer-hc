/**
 * Continuous Run Layout Optimizer
 *
 * This algorithm maintains consistent bracket spacing across the entire run,
 * with gaps positioned between brackets (not breaking the spacing rhythm).
 *
 * Algorithm:
 * 1. Calculate all bracket positions for the entire run (continuous spacing)
 * 2. Determine where to place 10mm gaps (between brackets)
 * 3. Segment the run into pieces around those gaps
 * 4. Optimize for minimum pieces using standard lengths
 */

import type {
  AnglePiece,
  RunSegmentation,
  RunOptimizationRequest,
  RunOptimizationResult
} from '../types/runLayout';

import { STANDARD_LENGTH_TABLE, RUN_LAYOUT_CONSTANTS } from './runLayoutOptimizer';

/**
 * Represents a bracket position in the continuous run
 */
interface BracketPosition {
  /** Position from start of brickwork (mm) */
  position: number;
  /** Bracket number (1-indexed) */
  number: number;
}

/**
 * Represents a gap between angle pieces
 */
interface Gap {
  /** Position where gap starts (mm from brickwork start) */
  position: number;
  /** Gap width (mm) */
  width: number;
}

/**
 * Represents a continuous segment (piece) between gaps
 */
interface Segment {
  /** Start position in brickwork (mm) */
  startPosition: number;
  /** End position in brickwork (mm) */
  endPosition: number;
  /** Length of this segment (mm) */
  length: number;
  /** Brackets within this segment */
  brackets: BracketPosition[];
}

/**
 * Calculate all bracket positions for a continuous run
 *
 * @param totalLength Total brickwork length (mm)
 * @param bracketCentres Bracket spacing (mm)
 * @param edgeDistance Maximum edge distance (mm) - typically 0.5 × Bcc
 * @returns Array of bracket positions
 */
export function calculateContinuousBracketPositions(
  totalLength: number,
  bracketCentres: number,
  edgeDistance: number = 0.5 * bracketCentres
): BracketPosition[] {
  const positions: BracketPosition[] = [];

  // Calculate number of brackets needed
  // First bracket at edgeDistance from start, then every bracketCentres
  let currentPosition = edgeDistance;
  let bracketNumber = 1;

  while (currentPosition <= totalLength - edgeDistance) {
    positions.push({
      position: currentPosition,
      number: bracketNumber
    });

    currentPosition += bracketCentres;
    bracketNumber++;
  }

  return positions;
}

/**
 * Find optimal gap positions between brackets
 * Gaps must be placed where they don't interfere with bracket positions
 * AND ensure each segment has minimum 2 brackets if length > 150mm
 *
 * Strategy: Place gaps to create pieces close to maxPieceLength while ensuring
 * minimum 2 brackets per piece (if > 150mm)
 *
 * @param brackets All bracket positions in the run
 * @param totalLength Total brickwork length
 * @param maxPieceLength Maximum angle piece length (default 1490mm)
 * @param gapWidth Gap width (default 10mm)
 * @returns Array of gap positions
 */
export function findOptimalGapPositions(
  brackets: BracketPosition[],
  totalLength: number,
  maxPieceLength: number = RUN_LAYOUT_CONSTANTS.MAX_ANGLE_LENGTH,
  gapWidth: number = RUN_LAYOUT_CONSTANTS.GAP_BETWEEN_PIECES
): Gap[] {
  const gaps: Gap[] = [];
  const minPieceLength = 150;

  // Start from position 0, try to place pieces of maxPieceLength
  let currentStart = 0;

  while (currentStart < totalLength) {
    const remainingLength = totalLength - currentStart;

    // If remaining length fits in one piece, we're done
    if (remainingLength <= maxPieceLength) {
      break;
    }

    // Find brackets in current segment
    const bracketsInSegment = brackets.filter(b => b.position >= currentStart);

    if (bracketsInSegment.length < 2) {
      // Not enough brackets to split further
      break;
    }

    // Strategy: Try to place gap around maxPieceLength, but ensure both sides have >= 2 brackets
    // Find the ideal gap position
    let idealGapPosition = currentStart + maxPieceLength;

    // If the remaining piece would be > 150mm with < 2 brackets, adjust gap position
    const bracketsAfterIdeal = brackets.filter(b => b.position >= (idealGapPosition + gapWidth));
    const lengthAfterIdeal = totalLength - (idealGapPosition + gapWidth);

    if (lengthAfterIdeal > minPieceLength && bracketsAfterIdeal.length < 2) {
      // Need to move gap earlier to ensure next piece gets enough brackets
      // Find position after at least 2 brackets but leaving at least 2 for next piece
      if (bracketsInSegment.length >= 4) {
        // Can split into 2×2 brackets
        const splitIndex = Math.floor(bracketsInSegment.length / 2);
        idealGapPosition = bracketsInSegment[splitIndex - 1].position + 100; // After first half of brackets
      } else if (bracketsInSegment.length === 3) {
        // Split 2-1, prefer first piece to be longer
        idealGapPosition = bracketsInSegment[1].position + 100; // After 2nd bracket
      } else {
        // Can't split properly, don't add gap
        break;
      }
    }

    // Find the nearest bracket-free zone for the gap
    const gapPosition = findNearestBracketFreeZone(
      idealGapPosition,
      brackets,
      gapWidth,
      currentStart,
      totalLength
    );

    if (gapPosition !== null) {
      gaps.push({
        position: gapPosition,
        width: gapWidth
      });

      // Next piece starts after this gap
      currentStart = gapPosition + gapWidth;
    } else {
      // Can't place gap, try moving forward
      currentStart += 100;
    }
  }

  return gaps;
}

/**
 * Find nearest position between brackets where a gap can fit
 * Also ensures that pieces on both sides of the gap meet minimum bracket requirements
 *
 * @param idealPosition Ideal position for gap
 * @param brackets All brackets
 * @param gapWidth Width of gap to place
 * @param segmentStart Start of current segment
 * @param totalLength Total run length
 * @returns Position for gap, or null if no suitable position found
 */
function findNearestBracketFreeZone(
  idealPosition: number,
  brackets: BracketPosition[],
  gapWidth: number,
  segmentStart: number,
  totalLength: number
): number | null {
  const minClearance = 35; // Minimum 35mm clearance from bracket
  const minPieceLength = 150; // Minimum piece length requiring 2 brackets

  // Check if ideal position is clear and meets bracket requirements
  if (isPositionClear(idealPosition, brackets, gapWidth, minClearance) &&
      meetsMinimumBracketRequirements(idealPosition, gapWidth, brackets, segmentStart, totalLength, minPieceLength)) {
    return idealPosition;
  }

  // Search nearby positions (within ±200mm)
  const searchRange = 200;

  for (let offset = 5; offset <= searchRange; offset += 5) {
    // Try forward
    const forwardPos = idealPosition + offset;
    if (isPositionClear(forwardPos, brackets, gapWidth, minClearance) &&
        meetsMinimumBracketRequirements(forwardPos, gapWidth, brackets, segmentStart, totalLength, minPieceLength)) {
      return forwardPos;
    }

    // Try backward
    const backwardPos = idealPosition - offset;
    if (backwardPos > 0 &&
        isPositionClear(backwardPos, brackets, gapWidth, minClearance) &&
        meetsMinimumBracketRequirements(backwardPos, gapWidth, brackets, segmentStart, totalLength, minPieceLength)) {
      return backwardPos;
    }
  }

  return null;
}

/**
 * Check if placing a gap at this position would result in segments that meet minimum bracket requirements
 * Rule: Any piece > 150mm must have at least 2 brackets
 */
function meetsMinimumBracketRequirements(
  gapPosition: number,
  gapWidth: number,
  brackets: BracketPosition[],
  segmentStart: number,
  totalLength: number,
  minPieceLength: number
): boolean {
  // Check the piece before the gap (from segmentStart to gapPosition)
  const pieceLengthBefore = gapPosition - segmentStart;
  const bracketsBeforeCount = brackets.filter(
    b => b.position >= segmentStart && b.position < gapPosition
  ).length;

  // If piece is > 150mm, it must have at least 2 brackets
  if (pieceLengthBefore > minPieceLength && bracketsBeforeCount < 2) {
    return false;
  }

  // Check the piece after the gap (remaining run length)
  const nextSegmentStart = gapPosition + gapWidth;
  const remainingLength = totalLength - nextSegmentStart;

  // Find brackets in remaining segment
  const bracketsAfter = brackets.filter(b => b.position >= nextSegmentStart);

  // If remaining piece is > 150mm, it must have at least 2 brackets
  if (remainingLength > minPieceLength && bracketsAfter.length < 2) {
    return false;
  }

  return true;
}

/**
 * Check if a gap position is clear of brackets
 */
function isPositionClear(
  gapPosition: number,
  brackets: BracketPosition[],
  gapWidth: number,
  minClearance: number
): boolean {
  const gapStart = gapPosition;
  const gapEnd = gapPosition + gapWidth;

  for (const bracket of brackets) {
    // Check if bracket is too close to gap
    if (
      (bracket.position >= gapStart - minClearance && bracket.position <= gapEnd + minClearance)
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Segment the run into pieces based on gap positions
 *
 * @param totalLength Total run length
 * @param brackets All bracket positions
 * @param gaps Gap positions
 * @returns Array of segments
 */
export function segmentRun(
  totalLength: number,
  brackets: BracketPosition[],
  gaps: Gap[]
): Segment[] {
  const segments: Segment[] = [];

  // Sort gaps by position
  const sortedGaps = [...gaps].sort((a, b) => a.position - b.position);

  let segmentStart = 0;

  for (const gap of sortedGaps) {
    // Create segment from segmentStart to gap
    const segmentEnd = gap.position;
    const segmentBrackets = brackets.filter(
      b => b.position >= segmentStart && b.position < segmentEnd
    );

    if (segmentEnd > segmentStart) {
      segments.push({
        startPosition: segmentStart,
        endPosition: segmentEnd,
        length: segmentEnd - segmentStart,
        brackets: segmentBrackets
      });
    }

    // Next segment starts after gap
    segmentStart = gap.position + gap.width;
  }

  // Add final segment
  const finalBrackets = brackets.filter(b => b.position >= segmentStart);
  if (totalLength > segmentStart) {
    segments.push({
      startPosition: segmentStart,
      endPosition: totalLength,
      length: totalLength - segmentStart,
      brackets: finalBrackets
    });
  }

  return segments;
}

/**
 * Convert segment to angle piece with bracket positions
 *
 * @param segment Segment to convert
 * @param standardLengths Available standard lengths
 * @returns Angle piece
 */
export function segmentToAnglePiece(
  segment: Segment,
  standardLengths: number[]
): AnglePiece {
  const { length, brackets, startPosition } = segment;

  // Check if segment length matches a standard length
  const isStandard = standardLengths.includes(length);

  // Calculate bracket positions relative to piece start (not brickwork start)
  const relativeBracketPositions = brackets.map(b => b.position - startPosition);

  // Calculate spacing (distance between consecutive brackets)
  let spacing = 0;
  if (brackets.length >= 2) {
    spacing = brackets[1].position - brackets[0].position;
  }

  // Start offset is position of first bracket from piece start
  const startOffset = relativeBracketPositions.length > 0 ? relativeBracketPositions[0] : 0;

  return {
    length,
    bracketCount: brackets.length,
    spacing,
    startOffset,
    positions: relativeBracketPositions,
    isStandard
  };
}

/**
 * Main optimization function for continuous run layout
 *
 * @param request Run optimization parameters
 * @returns Optimal run layout
 */
export function optimizeContinuousRunLayout(
  request: RunOptimizationRequest
): RunOptimizationResult {
  const {
    totalRunLength,
    bracketCentres,
    maxAngleLength = RUN_LAYOUT_CONSTANTS.MAX_ANGLE_LENGTH,
    gapBetweenPieces = RUN_LAYOUT_CONSTANTS.GAP_BETWEEN_PIECES,
    maxEdgeDistance
  } = request;

  const edgeDistance = maxEdgeDistance ?? (0.5 * bracketCentres);

  // Step 1: Calculate all bracket positions (continuous)
  const allBrackets = calculateContinuousBracketPositions(
    totalRunLength,
    bracketCentres,
    edgeDistance
  );

  console.log(`Total brackets for ${totalRunLength}mm run @ ${bracketCentres}mm Bcc: ${allBrackets.length}`);
  console.log('Bracket positions:', allBrackets.map(b => b.position));

  // Step 2: Find optimal gap positions
  const gaps = findOptimalGapPositions(
    allBrackets,
    totalRunLength,
    maxAngleLength,
    gapBetweenPieces
  );

  console.log(`Gaps placed: ${gaps.length} at positions:`, gaps.map(g => g.position));

  // Step 3: Segment run into pieces
  const segments = segmentRun(totalRunLength, allBrackets, gaps);

  console.log(`Segments: ${segments.length}`);
  segments.forEach((seg, i) => {
    console.log(`  Segment ${i + 1}: ${seg.startPosition}-${seg.endPosition} (${seg.length}mm, ${seg.brackets.length} brackets)`);
  });

  // Step 4: Get standard lengths
  const standardLengths = STANDARD_LENGTH_TABLE[bracketCentres] || [];

  // Step 5: Convert segments to angle pieces
  const pieces = segments.map(seg => segmentToAnglePiece(seg, standardLengths));

  // Calculate totals
  const totalBrackets = allBrackets.length;
  const totalAngleLength = pieces.reduce((sum, p) => sum + p.length, 0);
  const gapCount = gaps.length;
  const totalGapDistance = gaps.reduce((sum, g) => sum + g.width, 0);

  // Calculate average spacing
  const totalSpacings = pieces.reduce((sum, p) => sum + p.spacing * (p.bracketCount - 1), 0);
  const totalSpacingCount = pieces.reduce((sum, p) => sum + (p.bracketCount - 1), 0);
  const averageSpacing = totalSpacingCount > 0 ? totalSpacings / totalSpacingCount : 0;

  // Count unique piece lengths
  const uniqueLengths = new Set(pieces.map(p => p.length));

  const optimal: RunSegmentation = {
    totalLength: totalRunLength,
    pieces,
    totalBrackets,
    pieceCount: pieces.length,
    gapCount,
    totalGapDistance,
    averageSpacing,
    uniquePieceLengths: uniqueLengths.size,
    score: 0 // Not using score in this version
  };

  // Material summary
  const pieceLengthCounts = new Map<number, number>();
  for (const piece of pieces) {
    pieceLengthCounts.set(piece.length, (pieceLengthCounts.get(piece.length) || 0) + 1);
  }

  const pieceLengthBreakdown = Array.from(pieceLengthCounts.entries()).map(([length, count]) => ({
    length,
    count,
    isStandard: standardLengths.includes(length)
  }));

  return {
    optimal,
    allOptions: [optimal], // Only one option in this algorithm
    materialSummary: {
      totalAngleLength,
      totalPieces: pieces.length,
      totalBrackets,
      pieceLengthBreakdown
    }
  };
}
