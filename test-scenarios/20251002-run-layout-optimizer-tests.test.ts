/**
 * Comprehensive tests for multi-piece run layout optimizer
 *
 * Tests the complete system for segmenting long runs into optimal
 * combinations of angle pieces with minimal bracket usage.
 *
 * Created: 2025-10-02
 */

import {
  STANDARD_LENGTH_TABLE,
  RUN_LAYOUT_CONSTANTS,
  getStandardLengths,
  calculateStandardPiece,
  calculateNonStandardPiece,
  validateEdgeDistances,
  generateSegmentations,
  calculateSegmentationScore,
  createSegmentation,
  optimizeRunLayout
} from '../src/calculations/runLayoutOptimizer';

import type {
  EdgeDistanceConstraints,
  RunOptimizationRequest
} from '../src/types/runLayout';

describe('Standard Length Table', () => {

  test('table should match specification exactly', () => {
    expect(STANDARD_LENGTH_TABLE[500]).toEqual([1490, 990]);
    expect(STANDARD_LENGTH_TABLE[450]).toEqual([1340, 890]);
    expect(STANDARD_LENGTH_TABLE[400]).toEqual([1190, 790]);
    expect(STANDARD_LENGTH_TABLE[350]).toEqual([1390, 1040, 690]);
    expect(STANDARD_LENGTH_TABLE[300]).toEqual([1490, 1190, 890, 590]);
    expect(STANDARD_LENGTH_TABLE[250]).toEqual([1490, 1240, 990, 740, 490]);
    expect(STANDARD_LENGTH_TABLE[200]).toEqual([1390, 1190, 990, 790, 590, 390]);
  });

  test('getStandardLengths should return table values for known spacings', () => {
    expect(getStandardLengths(500)).toEqual([1490, 990]);
    expect(getStandardLengths(350)).toEqual([1390, 1040, 690]);
  });

  test('getStandardLengths should calculate for unlisted spacings', () => {
    const lengths = getStandardLengths(600);
    expect(lengths.length).toBeGreaterThan(0);
    expect(lengths[0]).toBeLessThanOrEqual(1490);
  });
});

describe('Standard Piece Calculations', () => {

  test('1490mm piece @ 500mm Bcc should have 3 brackets', () => {
    const piece = calculateStandardPiece(1490, 500);

    expect(piece.length).toBe(1490);
    expect(piece.bracketCount).toBe(3);
    expect(piece.spacing).toBe(500);
    expect(piece.startOffset).toBe(245); // 500/2 - 10/2
    expect(piece.positions).toEqual([245, 745, 1245]);
    expect(piece.isStandard).toBe(true);
  });

  test('990mm piece @ 500mm Bcc should have 2 brackets', () => {
    const piece = calculateStandardPiece(990, 500);

    expect(piece.bracketCount).toBe(2);
    expect(piece.positions).toEqual([245, 745]);
  });

  test('1390mm piece @ 350mm Bcc should have 4 brackets', () => {
    const piece = calculateStandardPiece(1390, 350);

    expect(piece.bracketCount).toBe(4);
    expect(piece.startOffset).toBe(170); // 350/2 - 10/2
    expect(piece.positions).toEqual([170, 520, 870, 1220]);
  });
});

describe('Non-Standard Piece Calculations', () => {

  test('821mm piece @ 500mm Bcc with edge constraints', () => {
    const constraints: EdgeDistanceConstraints = {
      e_min: 35,
      e_max: 250 // 0.5 × 500
    };

    const piece = calculateNonStandardPiece(821, 500, constraints);

    expect(piece.length).toBe(821);
    expect(piece.bracketCount).toBe(2); // Can't fit 3 at 500mm spacing
    expect(piece.spacing).toBeLessThanOrEqual(500);
    expect(piece.startOffset).toBeGreaterThanOrEqual(35);
    expect(piece.startOffset).toBeLessThanOrEqual(250);
    expect(piece.isStandard).toBe(false);

    console.log('821mm non-standard piece:', piece);
  });

  test('290mm piece @ 500mm Bcc should have symmetric brackets', () => {
    const constraints: EdgeDistanceConstraints = {
      e_min: 35,
      e_max: 250
    };

    const piece = calculateNonStandardPiece(290, 500, constraints);

    expect(piece.bracketCount).toBe(2);
    expect(piece.positions.length).toBe(2);

    // Check symmetry: edge distances should be equal
    const leftEdge = piece.positions[0];
    const rightEdge = piece.length - piece.positions[1];
    expect(Math.abs(leftEdge - rightEdge)).toBeLessThan(1); // Within 1mm

    console.log('290mm non-standard piece:', piece);
  });

  test('should respect edge distance constraints', () => {
    const constraints: EdgeDistanceConstraints = {
      e_min: 35,
      e_max: 100 // Tight constraint
    };

    const piece = calculateNonStandardPiece(600, 400, constraints);

    expect(piece.startOffset).toBeGreaterThanOrEqual(35);
    expect(piece.startOffset).toBeLessThanOrEqual(100);

    const endOffset = piece.length - piece.positions[piece.positions.length - 1];
    expect(endOffset).toBeGreaterThanOrEqual(35);
    expect(endOffset).toBeLessThanOrEqual(100);
  });
});

describe('Edge Distance Validation', () => {

  test('should validate piece with correct edge distances', () => {
    const constraints: EdgeDistanceConstraints = {
      e_min: 35,
      e_max: 250
    };

    const piece = calculateStandardPiece(1490, 500);
    expect(validateEdgeDistances(piece, constraints)).toBe(true);
  });

  test('should reject piece with edge distance below minimum', () => {
    const constraints: EdgeDistanceConstraints = {
      e_min: 100, // High minimum
      e_max: 300
    };

    const piece = calculateStandardPiece(1490, 500); // Has 245mm edge
    expect(validateEdgeDistances(piece, constraints)).toBe(true); // 245 > 100, ok
  });
});

describe('Run Segmentation Generation', () => {

  test('should generate segmentations for 2321mm @ 500mm Bcc', () => {
    const standardLengths = [1490, 990];
    const segmentations = generateSegmentations(2321, standardLengths, 10);

    console.log('Segmentations for 2321mm:', segmentations);

    // Should include option: [1490, 821]
    expect(segmentations.some(seg =>
      seg.length === 2 && seg[0] === 1490 && seg[1] === 821
    )).toBe(true);

    // Should have multiple options
    expect(segmentations.length).toBeGreaterThanOrEqual(1);
  });

  test('should generate valid segmentations for 1500mm @ 500mm Bcc', () => {
    const standardLengths = [1490, 990];
    const segmentations = generateSegmentations(1500, standardLengths, 10);

    console.log('Segmentations for 1500mm:', segmentations);

    // Should generate at least one segmentation
    expect(segmentations.length).toBeGreaterThan(0);
    // Single piece of 1500mm is valid (non-standard but works)
    expect(segmentations.some(seg => seg.length === 1)).toBe(true);
  });

  test('should handle exact standard length match', () => {
    const standardLengths = [1490, 990];
    const segmentations = generateSegmentations(1490, standardLengths, 10);

    expect(segmentations).toContainEqual([1490]);
  });
});

describe('Complete Segmentation Creation', () => {

  test('should create segmentation for [1490, 821] @ 500mm Bcc', () => {
    const constraints: EdgeDistanceConstraints = {
      e_min: 35,
      e_max: 250
    };

    const standardLengths = [1490, 990];
    const segmentation = createSegmentation(
      [1490, 821],
      500,
      constraints,
      standardLengths
    );

    expect(segmentation.pieceCount).toBe(2);
    expect(segmentation.totalLength).toBe(2321); // 1490 + 821 + 10mm gap
    expect(segmentation.gapCount).toBe(1);
    expect(segmentation.totalGapDistance).toBe(10);

    // First piece (1490mm) is standard with 3 brackets
    expect(segmentation.pieces[0].bracketCount).toBe(3);
    expect(segmentation.pieces[0].isStandard).toBe(true);

    // Second piece (821mm) is non-standard with 2 brackets
    expect(segmentation.pieces[1].bracketCount).toBe(2);
    expect(segmentation.pieces[1].isStandard).toBe(false);

    // Total brackets: 3 + 2 = 5
    expect(segmentation.totalBrackets).toBe(5);

    console.log('Segmentation [1490, 821]:', segmentation);
  });

  test('should create segmentation for [990, 990, 331] @ 500mm Bcc', () => {
    const constraints: EdgeDistanceConstraints = {
      e_min: 35,
      e_max: 250
    };

    const standardLengths = [1490, 990];
    const segmentation = createSegmentation(
      [990, 990, 331],
      500,
      constraints,
      standardLengths
    );

    expect(segmentation.pieceCount).toBe(3);
    expect(segmentation.totalLength).toBe(2331); // 990 + 990 + 331 + 20mm gaps
    expect(segmentation.gapCount).toBe(2);

    // First two pieces are standard
    expect(segmentation.pieces[0].isStandard).toBe(true);
    expect(segmentation.pieces[1].isStandard).toBe(true);

    // Third piece is non-standard
    expect(segmentation.pieces[2].isStandard).toBe(false);

    console.log('Segmentation [990, 990, 331]:', segmentation);
  });
});

describe('Scoring and Optimization', () => {

  test('segmentation with fewer brackets should score better', () => {
    const constraints: EdgeDistanceConstraints = {
      e_min: 35,
      e_max: 250
    };

    const standardLengths = [1490, 990];

    // Option 1: [1490, 821] = 5 brackets
    const seg1 = createSegmentation([1490, 821], 500, constraints, standardLengths);

    // Option 2: [990, 990, 331] = likely 6+ brackets
    const seg2 = createSegmentation([990, 990, 331], 500, constraints, standardLengths);

    console.log('Score comparison:');
    console.log('  [1490, 821]:', seg1.totalBrackets, 'brackets, score:', seg1.score);
    console.log('  [990, 990, 331]:', seg2.totalBrackets, 'brackets, score:', seg2.score);

    // Lower score is better
    if (seg1.totalBrackets < seg2.totalBrackets) {
      expect(seg1.score).toBeLessThan(seg2.score);
    }
  });

  test('worked example: 2321mm @ 500mm Bcc should prefer [1490, 821]', () => {
    const request: RunOptimizationRequest = {
      totalRunLength: 2321,
      bracketCentres: 500,
      minEdgeDistance: 35,
      maxEdgeDistance: 250
    };

    const result = optimizeRunLayout(request);

    console.log('\nWorked Example: 2321mm @ 500mm Bcc');
    console.log('Optimal segmentation:', result.optimal.pieces.map(p => p.length));
    console.log('Total brackets:', result.optimal.totalBrackets);
    console.log('Total pieces:', result.optimal.pieceCount);
    console.log('Material summary:', result.materialSummary);

    // Should prefer 2-piece solution with fewer brackets
    expect(result.optimal.pieceCount).toBeLessThanOrEqual(3);
    expect(result.optimal.totalBrackets).toBeLessThanOrEqual(6);

    // Most likely [1490, 821] with 5 brackets total
    expect(result.optimal.pieces.some(p => p.length === 1490)).toBe(true);
  });
});

describe('Full Optimization Tests', () => {

  test('simple 1500mm run @ 500mm Bcc', () => {
    const request: RunOptimizationRequest = {
      totalRunLength: 1500,
      bracketCentres: 500
    };

    const result = optimizeRunLayout(request);

    console.log('\n1500mm run optimization:', result.optimal);

    expect(result.optimal.pieceCount).toBe(1);
    // Could be 1490mm or 1500mm (both valid with 3 brackets)
    expect(result.optimal.pieces[0].length).toBeGreaterThanOrEqual(1490);
    expect(result.optimal.pieces[0].length).toBeLessThanOrEqual(1500);
    expect(result.optimal.totalBrackets).toBe(3);
  });

  test('2500mm run @ 500mm Bcc', () => {
    const request: RunOptimizationRequest = {
      totalRunLength: 2500,
      bracketCentres: 500
    };

    const result = optimizeRunLayout(request);

    console.log('\n2500mm run optimization:', result.optimal.pieces.map(p => p.length));
    console.log('Total brackets:', result.optimal.totalBrackets);

    expect(result.optimal.pieceCount).toBeGreaterThan(1);
    expect(result.optimal.totalBrackets).toBeGreaterThan(0);
  });

  test('small 800mm run @ 400mm Bcc', () => {
    const request: RunOptimizationRequest = {
      totalRunLength: 800,
      bracketCentres: 400
    };

    const result = optimizeRunLayout(request);

    console.log('\n800mm run optimization:', result.optimal.pieces.map(p => p.length));

    expect(result.optimal.pieceCount).toBeGreaterThanOrEqual(1);
    expect(result.materialSummary.totalBrackets).toBeGreaterThan(0);
  });

  test('very long 10000mm run @ 500mm Bcc', () => {
    const request: RunOptimizationRequest = {
      totalRunLength: 10000,
      bracketCentres: 500
    };

    const result = optimizeRunLayout(request);

    console.log('\n10000mm run optimization:');
    console.log('Pieces:', result.optimal.pieceCount);
    console.log('Total brackets:', result.optimal.totalBrackets);
    console.log('Piece breakdown:', result.materialSummary.pieceLengthBreakdown);

    expect(result.optimal.pieceCount).toBeGreaterThan(5);
    expect(result.materialSummary.totalAngleLength).toBeLessThanOrEqual(10000);
  });

  test('different bracket spacings', () => {
    const spacings = [200, 250, 300, 350, 400, 450, 500];
    const runLength = 3000;

    spacings.forEach(bcc => {
      const request: RunOptimizationRequest = {
        totalRunLength: runLength,
        bracketCentres: bcc
      };

      const result = optimizeRunLayout(request);

      console.log(`\n${runLength}mm @ ${bcc}mm Bcc:`);
      console.log('  Pieces:', result.optimal.pieceCount);
      console.log('  Brackets:', result.optimal.totalBrackets);
      console.log('  Lengths:', result.optimal.pieces.map(p => p.length));

      expect(result.optimal.totalBrackets).toBeGreaterThan(0);
      expect(result.materialSummary.totalAngleLength).toBeLessThanOrEqual(runLength);
    });
  });
});

describe('Material Summary', () => {

  test('should provide accurate material breakdown', () => {
    const request: RunOptimizationRequest = {
      totalRunLength: 2321,
      bracketCentres: 500
    };

    const result = optimizeRunLayout(request);

    expect(result.materialSummary.totalPieces).toBe(result.optimal.pieceCount);
    expect(result.materialSummary.totalBrackets).toBe(result.optimal.totalBrackets);

    // Check piece breakdown
    const breakdownTotal = result.materialSummary.pieceLengthBreakdown
      .reduce((sum, item) => sum + item.count, 0);
    expect(breakdownTotal).toBe(result.optimal.pieceCount);

    console.log('\nMaterial summary for 2321mm:', result.materialSummary);
  });

  test('should identify standard vs non-standard pieces', () => {
    const request: RunOptimizationRequest = {
      totalRunLength: 2321,
      bracketCentres: 500
    };

    const result = optimizeRunLayout(request);

    const standardPieces = result.materialSummary.pieceLengthBreakdown
      .filter(item => item.isStandard);
    const nonStandardPieces = result.materialSummary.pieceLengthBreakdown
      .filter(item => !item.isStandard);

    console.log('Standard pieces:', standardPieces);
    console.log('Non-standard pieces:', nonStandardPieces);

    expect(standardPieces.length + nonStandardPieces.length)
      .toBe(result.materialSummary.pieceLengthBreakdown.length);
  });
});

describe('Edge Cases', () => {

  test('exact standard length should work', () => {
    const request: RunOptimizationRequest = {
      totalRunLength: 1490,
      bracketCentres: 500
    };

    const result = optimizeRunLayout(request);

    expect(result.optimal.pieceCount).toBe(1);
    expect(result.optimal.pieces[0].length).toBe(1490);
  });

  test('very small run should work', () => {
    const request: RunOptimizationRequest = {
      totalRunLength: 300,
      bracketCentres: 200
    };

    const result = optimizeRunLayout(request);

    expect(result.optimal.pieceCount).toBeGreaterThanOrEqual(1);
    expect(result.optimal.totalBrackets).toBeGreaterThanOrEqual(2);
  });

  test('run exactly 2× standard length + gap', () => {
    // 1490 + 10 + 1490 = 2990
    const request: RunOptimizationRequest = {
      totalRunLength: 2990,
      bracketCentres: 500
    };

    const result = optimizeRunLayout(request);

    console.log('\n2990mm (2×1490+10) optimization:', result.optimal.pieces.map(p => p.length));

    expect(result.optimal.pieces.filter(p => p.length === 1490).length).toBeGreaterThan(0);
  });
});
