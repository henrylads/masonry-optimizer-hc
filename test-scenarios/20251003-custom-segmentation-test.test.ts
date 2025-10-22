import { optimizeRunLayout, generateCustomSegmentations } from '../src/calculations/runLayoutOptimizer';

describe('Custom Segmentation Options', () => {
  test('should generate custom even-split for 2321mm @ 500mm Bcc', () => {
    const customOptions = generateCustomSegmentations(2321, 500, 1490, 10);

    console.log('Custom segmentations for 2321mm:', customOptions);

    // Should generate at least one custom option
    expect(customOptions.length).toBeGreaterThan(0);
  });

  test('2321mm @ 500mm Bcc - should consider custom even-split option', () => {
    const result = optimizeRunLayout({
      totalRunLength: 2321,
      bracketCentres: 500,
      minEdgeDistance: 35,
      maxEdgeDistance: 250
    });

    console.log('\n=== 2321mm @ 500mm Bcc Optimization ===');
    console.log('Optimal solution:');
    console.log(`  Pieces: ${result.optimal.pieces.map(p => `${p.length}mm (${p.bracketCount} brackets)`).join(' + ')}`);
    console.log(`  Total brackets: ${result.optimal.totalBrackets}`);
    console.log(`  Score: ${result.optimal.score}`);

    console.log('\nTop 5 options:');
    result.allOptions.slice(0, 5).forEach((opt, i) => {
      const piecesStr = opt.pieces.map(p => `${p.length}mm`).join('+');
      const standardness = opt.pieces.every(p => p.isStandard) ? '(all standard)' :
                           opt.pieces.some(p => p.isStandard) ? '(mixed)' : '(all custom)';
      console.log(`  ${i + 1}. [${piecesStr}] - ${opt.totalBrackets} brackets, score: ${opt.score} ${standardness}`);
    });

    // Show optimal piece details
    console.log('\nOptimal piece details:');
    result.optimal.pieces.forEach((piece, i) => {
      const lastBracketPos = piece.positions[piece.positions.length - 1];
      const endEdge = piece.length - lastBracketPos;
      console.log(`  Piece ${i + 1}: ${piece.length}mm, ${piece.bracketCount} brackets`);
      console.log(`    Positions: [${piece.positions.map(p => p.toFixed(1)).join(', ')}]`);
      console.log(`    Spacing: ${piece.spacing}mm, Start edge: ${piece.startOffset.toFixed(1)}mm, End edge: ${endEdge.toFixed(1)}mm`);
      console.log(`    Standard: ${piece.isStandard}`);
    });

    // Should have a valid result
    expect(result.optimal).toBeDefined();
    expect(result.optimal.totalBrackets).toBeGreaterThan(0);
    expect(result.allOptions.length).toBeGreaterThan(0);
  });

  test('3500mm @ 500mm Bcc - should consider custom options', () => {
    const result = optimizeRunLayout({
      totalRunLength: 3500,
      bracketCentres: 500,
      minEdgeDistance: 35,
      maxEdgeDistance: 250
    });

    console.log('\n=== 3500mm @ 500mm Bcc Optimization ===');
    console.log('Optimal solution:');
    console.log(`  Pieces: ${result.optimal.pieces.map(p => `${p.length}mm (${p.bracketCount} brackets)`).join(' + ')}`);
    console.log(`  Total brackets: ${result.optimal.totalBrackets}`);

    expect(result.optimal).toBeDefined();
  });
});
