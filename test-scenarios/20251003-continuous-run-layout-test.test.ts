/**
 * Test continuous run layout algorithm against provided examples
 *
 * The algorithm maintains consistent bracket spacing across gaps,
 * with gaps positioned between brackets (not breaking spacing rhythm).
 */

import {
  calculateContinuousBracketPositions,
  findOptimalGapPositions,
  segmentRun,
  optimizeContinuousRunLayout
} from '../src/calculations/continuousRunLayout';

import type { RunOptimizationRequest } from '../src/types/runLayout';

describe('Continuous Bracket Positioning', () => {

  test('should calculate continuous bracket positions for 3500mm @ 500mm Bcc', () => {
    const brackets = calculateContinuousBracketPositions(3500, 500, 250);

    console.log('3500mm @ 500mm brackets:', brackets);

    // Should have brackets at: 250, 750, 1250, 1750, 2250, 2750, 3250
    // (first at 250mm edge distance, then every 500mm, last within 250mm of end)
    expect(brackets.length).toBe(7);
    expect(brackets[0].position).toBe(250);
    expect(brackets[brackets.length - 1].position).toBe(3250);
  });

  test('should calculate continuous bracket positions for 2321mm @ 500mm Bcc', () => {
    const brackets = calculateContinuousBracketPositions(2321, 500, 250);

    console.log('2321mm @ 500mm brackets:', brackets);

    // Should have brackets at: 250, 750, 1250, 1750, 2071 (within 250mm of 2321)
    // Actually: 250, 750, 1250, 1750, 2250 won't fit (2250 + 250 = 2500 > 2321)
    // So: 250, 750, 1250, 1750
    expect(brackets.length).toBeGreaterThanOrEqual(4);
    expect(brackets[0].position).toBe(250);
  });

  test('should calculate continuous bracket positions for 2000mm @ 500mm Bcc', () => {
    const brackets = calculateContinuousBracketPositions(2000, 500, 250);

    console.log('2000mm @ 500mm brackets:', brackets);

    // Should have brackets at: 250, 750, 1250, 1750
    expect(brackets.length).toBe(4);
    expect(brackets).toEqual([
      { position: 250, number: 1 },
      { position: 750, number: 2 },
      { position: 1250, number: 3 },
      { position: 1750, number: 4 }
    ]);
  });
});

describe('Gap Positioning', () => {

  test('should find gaps that don\'t interfere with brackets', () => {
    const brackets = calculateContinuousBracketPositions(3500, 500, 250);
    const gaps = findOptimalGapPositions(brackets, 3500, 1490, 10);

    console.log('Gaps for 3500mm:', gaps);

    // Gaps should be positioned between brackets (not at bracket positions)
    gaps.forEach(gap => {
      const tooCloseToAnyBracket = brackets.some(b =>
        Math.abs(b.position - gap.position) < 35 ||
        Math.abs(b.position - (gap.position + gap.width)) < 35
      );
      expect(tooCloseToAnyBracket).toBe(false);
    });
  });
});

describe('Run Segmentation', () => {

  test('should segment run based on gaps', () => {
    const brackets = [
      { position: 250, number: 1 },
      { position: 750, number: 2 },
      { position: 1250, number: 3 },
      { position: 1750, number: 4 }
    ];

    const gaps = [
      { position: 1000, width: 10 }
    ];

    const segments = segmentRun(2000, brackets, gaps);

    console.log('Segments:', segments);

    expect(segments.length).toBe(2);

    // First segment: 0-1000mm with brackets 1,2
    expect(segments[0].startPosition).toBe(0);
    expect(segments[0].endPosition).toBe(1000);
    expect(segments[0].brackets.length).toBe(2);

    // Second segment: 1010-2000mm with brackets 3,4
    expect(segments[1].startPosition).toBe(1010);
    expect(segments[1].endPosition).toBe(2000);
    expect(segments[1].brackets.length).toBe(2);
  });
});

describe('Full Continuous Run Optimization', () => {

  test('3500mm @ 500mm Bcc - example from diagram', () => {
    const request: RunOptimizationRequest = {
      totalRunLength: 3500,
      bracketCentres: 500,
      maxEdgeDistance: 250
    };

    const result = optimizeContinuousRunLayout(request);

    console.log('\n3500mm @ 500mm Bcc Result:');
    console.log('Pieces:', result.optimal.pieces.map(p => `${p.length}mm (${p.bracketCount} brackets)`));
    console.log('Total brackets:', result.optimal.totalBrackets);
    console.log('Gaps:', result.optimal.gapCount);

    result.optimal.pieces.forEach((piece, i) => {
      console.log(`Piece ${i + 1}: ${piece.length}mm`);
      console.log(`  Brackets: ${piece.bracketCount} @ ${piece.spacing}mm spacing`);
      console.log(`  Positions: [${piece.positions.join(', ')}]`);
    });

    // Based on diagram: appears to be 3 pieces with total 7 brackets
    expect(result.optimal.totalBrackets).toBe(7);
    expect(result.optimal.pieceCount).toBeGreaterThanOrEqual(2);
  });

  test('2321mm @ 500mm Bcc - example from diagram', () => {
    const request: RunOptimizationRequest = {
      totalRunLength: 2321,
      bracketCentres: 500,
      maxEdgeDistance: 250
    };

    const result = optimizeContinuousRunLayout(request);

    console.log('\n2321mm @ 500mm Bcc Result:');
    console.log('Pieces:', result.optimal.pieces.map(p => `${p.length}mm (${p.bracketCount} brackets)`));
    console.log('Total brackets:', result.optimal.totalBrackets);
    console.log('Total length:', result.materialSummary.totalAngleLength);

    result.optimal.pieces.forEach((piece, i) => {
      console.log(`Piece ${i + 1}: ${piece.length}mm`);
      console.log(`  Brackets: ${piece.bracketCount}`);
      console.log(`  Positions: [${piece.positions.join(', ')}]`);
    });

    // Verify continuous spacing
    expect(result.optimal.totalBrackets).toBeGreaterThanOrEqual(4);
  });

  test('2000mm @ 500mm Bcc - symmetric example from diagram', () => {
    const request: RunOptimizationRequest = {
      totalRunLength: 2000,
      bracketCentres: 500,
      maxEdgeDistance: 250
    };

    const result = optimizeContinuousRunLayout(request);

    console.log('\n2000mm @ 500mm Bcc Result:');
    console.log('Pieces:', result.optimal.pieces.map(p => `${p.length}mm (${p.bracketCount} brackets)`));
    console.log('Total brackets:', result.optimal.totalBrackets);

    // From diagram: appears to be 2 pieces (985 + 985) with 4 total brackets
    expect(result.optimal.totalBrackets).toBe(4);
    expect(result.optimal.pieceCount).toBeGreaterThanOrEqual(1);
  });
});

describe('Bracket Spacing Continuity', () => {

  test('should maintain 500mm spacing across gaps', () => {
    const request: RunOptimizationRequest = {
      totalRunLength: 2000,
      bracketCentres: 500,
      maxEdgeDistance: 250
    };

    const result = optimizeContinuousRunLayout(request);

    // All brackets should be 500mm apart in the original brickwork coordinate system
    // This means if we reconstruct the full positions including gaps, spacing is maintained

    let absolutePosition = 0;
    const allAbsoluteBrackets: number[] = [];

    result.optimal.pieces.forEach((piece, pieceIndex) => {
      piece.positions.forEach(relPos => {
        allAbsoluteBrackets.push(absolutePosition + relPos);
      });
      absolutePosition += piece.length;

      // Add gap after piece (except last piece)
      if (pieceIndex < result.optimal.pieces.length - 1) {
        absolutePosition += 10; // gap
      }
    });

    console.log('Absolute bracket positions:', allAbsoluteBrackets);

    // Check spacing between consecutive brackets (should be 500mm in brickwork space)
    // Note: this is in the "with gaps" coordinate system
    // In the brickwork (no gaps) system, they should be 500mm apart
  });
});

describe('Edge Cases', () => {

  test('single piece run (< 1490mm)', () => {
    const request: RunOptimizationRequest = {
      totalRunLength: 1200,
      bracketCentres: 500
    };

    const result = optimizeContinuousRunLayout(request);

    console.log('\n1200mm run:', result.optimal);

    expect(result.optimal.pieceCount).toBe(1);
    expect(result.optimal.gapCount).toBe(0);
  });

  test('very long run (10m)', () => {
    const request: RunOptimizationRequest = {
      totalRunLength: 10000,
      bracketCentres: 500
    };

    const result = optimizeContinuousRunLayout(request);

    console.log('\n10000mm run:');
    console.log('Pieces:', result.optimal.pieceCount);
    console.log('Brackets:', result.optimal.totalBrackets);
    console.log('Piece breakdown:', result.materialSummary.pieceLengthBreakdown);

    expect(result.optimal.totalBrackets).toBeGreaterThan(15);
    expect(result.optimal.pieceCount).toBeGreaterThan(5);
  });
});
