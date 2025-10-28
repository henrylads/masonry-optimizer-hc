/**
 * Test case for 5.0725m run at 300mm centres
 * User reported an error with this configuration
 */

import { optimizeRunLayout } from '../src/calculations/runLayoutOptimizer';
import { describe, test, expect } from '@jest/globals';

describe('Run Layout - 5.0725m at 300mm centres', () => {
  test('should successfully optimize 5072.5mm run at 300mm centres', () => {
    const request = {
      totalRunLength: 5072.5, // 5.0725 meters in mm
      bracketCentres: 300,
      maxAngleLength: 1490,
      gapBetweenPieces: 10,
      minEdgeDistance: 35,
      maxEdgeDistance: 150 // 0.5 × 300
    };

    console.log('\n=== Testing 5072.5mm run at 300mm centres ===\n');

    const result = optimizeRunLayout(request);

    console.log('\nOptimal solution:');
    console.log(`  Total pieces: ${result.optimal.pieceCount}`);
    console.log(`  Total brackets: ${result.optimal.totalBrackets}`);
    console.log(`  Average spacing: ${result.optimal.averageSpacing.toFixed(2)}mm`);
    console.log(`  Score: ${result.optimal.score}`);
    console.log('\nPieces:');
    result.optimal.pieces.forEach((piece, i) => {
      console.log(`  ${i + 1}. ${piece.length}mm × ${piece.bracketCount} brackets`);
      console.log(`     Start edge: ${piece.startOffset.toFixed(2)}mm`);
      console.log(`     End edge: ${(piece.length - piece.positions[piece.positions.length - 1]).toFixed(2)}mm`);
    });

    // Verify the result is valid
    expect(result.optimal).toBeDefined();
    expect(result.optimal.totalLength).toBe(5072.5);
    expect(result.optimal.pieces.length).toBeGreaterThan(0);
    expect(result.optimal.totalBrackets).toBeGreaterThan(0);

    // Verify all pieces are within max length
    result.optimal.pieces.forEach(piece => {
      expect(piece.length).toBeLessThanOrEqual(1490);
      expect(piece.length).toBeGreaterThan(0);
    });
  });
});
