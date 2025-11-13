/**
 * Test scenario: 2545mm run at 500mm bracket centres
 *
 * User reported asymmetry issue where first angle piece (1260mm)
 * had brackets at 15mm from start but 245mm from end.
 *
 * Expected: Edge pieces should have symmetrical bracket placement
 */

import { optimizeContinuousRunLayout } from '../src/calculations/continuousRunLayout';
import type { RunOptimizationRequest } from '../src/types/runLayout';

describe('Edge Piece Symmetry Fix - 2545mm @ 500mm centres', () => {
  it('should create symmetrical bracket placement on first piece', () => {
    const request: RunOptimizationRequest = {
      totalRunLength: 2545,
      bracketCentres: 500
    };

    const result = optimizeContinuousRunLayout(request);

    expect(result.optimal.pieces.length).toBeGreaterThan(0);

    // Get first piece
    const firstPiece = result.optimal.pieces[0];
    console.log('\nFirst Piece Details:');
    console.log(`  Length: ${firstPiece.length}mm`);
    console.log(`  Bracket count: ${firstPiece.bracketCount}`);
    console.log(`  Spacing: ${firstPiece.spacing}mm`);
    console.log(`  Positions: [${firstPiece.positions.join(', ')}]`);

    // Check symmetry on first piece
    if (firstPiece.bracketCount >= 2) {
      const startOffset = firstPiece.positions[0];
      const endOffset = firstPiece.length - firstPiece.positions[firstPiece.positions.length - 1];

      console.log(`  Start offset: ${startOffset.toFixed(1)}mm`);
      console.log(`  End offset: ${endOffset.toFixed(1)}mm`);
      console.log(`  Difference: ${Math.abs(startOffset - endOffset).toFixed(1)}mm`);

      // Edge distances should be equal (within 1mm tolerance for rounding)
      expect(Math.abs(startOffset - endOffset)).toBeLessThan(1);
    }
  });

  it('should create symmetrical bracket placement on last piece', () => {
    const request: RunOptimizationRequest = {
      totalRunLength: 2545,
      bracketCentres: 500
    };

    const result = optimizeContinuousRunLayout(request);

    expect(result.optimal.pieces.length).toBeGreaterThan(0);

    // Get last piece
    const lastPiece = result.optimal.pieces[result.optimal.pieces.length - 1];
    console.log('\nLast Piece Details:');
    console.log(`  Length: ${lastPiece.length}mm`);
    console.log(`  Bracket count: ${lastPiece.bracketCount}`);
    console.log(`  Spacing: ${lastPiece.spacing}mm`);
    console.log(`  Positions: [${lastPiece.positions.join(', ')}]`);

    // Check symmetry on last piece
    if (lastPiece.bracketCount >= 2) {
      const startOffset = lastPiece.positions[0];
      const endOffset = lastPiece.length - lastPiece.positions[lastPiece.positions.length - 1];

      console.log(`  Start offset: ${startOffset.toFixed(1)}mm`);
      console.log(`  End offset: ${endOffset.toFixed(1)}mm`);
      console.log(`  Difference: ${Math.abs(startOffset - endOffset).toFixed(1)}mm`);

      // Edge distances should be equal (within 1mm tolerance for rounding)
      expect(Math.abs(startOffset - endOffset)).toBeLessThan(1);
    }
  });

  it('should log all piece details for verification', () => {
    const request: RunOptimizationRequest = {
      totalRunLength: 2545,
      bracketCentres: 500
    };

    const result = optimizeContinuousRunLayout(request);

    console.log('\nAll Pieces:');
    result.optimal.pieces.forEach((piece, index) => {
      const isFirstPiece = index === 0;
      const isLastPiece = index === result.optimal.pieces.length - 1;
      const pieceType = isFirstPiece ? ' (FIRST)' : isLastPiece ? ' (LAST)' : '';

      console.log(`\nPiece ${index + 1}${pieceType}:`);
      console.log(`  Length: ${piece.length}mm${piece.isStandard ? ' (standard)' : ' (custom)'}`);
      console.log(`  Brackets: ${piece.bracketCount}`);
      console.log(`  Spacing: ${piece.spacing}mm`);
      console.log(`  Positions: [${piece.positions.map(p => p.toFixed(1)).join(', ')}]`);

      if (piece.bracketCount >= 2) {
        const startOffset = piece.positions[0];
        const endOffset = piece.length - piece.positions[piece.positions.length - 1];
        console.log(`  Edge distances: ${startOffset.toFixed(1)}mm (start), ${endOffset.toFixed(1)}mm (end)`);

        if (isFirstPiece || isLastPiece) {
          const isSymmetric = Math.abs(startOffset - endOffset) < 1;
          console.log(`  Symmetry: ${isSymmetric ? '✓ PASS' : '✗ FAIL'}`);
        }
      }
    });

    // This test always passes - it's just for logging
    expect(result.optimal.pieces.length).toBeGreaterThan(0);
  });
});
