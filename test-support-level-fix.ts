/**
 * Test for support level between 0 and -75mm fix
 */

import { determineBracketType } from './src/calculations/bracketAngleSelection';

console.log('='.repeat(80));
console.log('TESTING SUPPORT LEVEL FIX (0 to -75mm range)');
console.log('='.repeat(80));

// Test bracket type determination
console.log('\n📋 Test 1: Bracket Type Determination');
console.log('─'.repeat(80));

const testCases = [
  { level: 100, expected: 'Inverted', desc: 'Far above SSL' },
  { level: 50, expected: 'Inverted', desc: 'Above SSL' },
  { level: 0, expected: 'Inverted', desc: 'At SSL (boundary)' },
  { level: -25, expected: 'Standard', desc: 'Below SSL, above fixing' },
  { level: -50, expected: 'Standard', desc: 'Below SSL, above fixing' },
  { level: -75, expected: 'Standard', desc: 'At fixing point (baseline)' },
  { level: -100, expected: 'Standard', desc: 'Below fixing point' },
  { level: -150, expected: 'Standard', desc: 'Far below fixing point' }
];

let allPass = true;

testCases.forEach(({ level, expected, desc }) => {
  const result = determineBracketType(level);
  const pass = result === expected;
  allPass = allPass && pass;

  const icon = pass ? '✅' : '❌';
  console.log(`${icon} Support ${level.toString().padStart(4)}mm: ${result.padEnd(8)} (expected ${expected}) - ${desc}`);
});

console.log('\n' + '='.repeat(80));
console.log('SUMMARY');
console.log('='.repeat(80));
console.log('Bracket Type Determination:', allPass ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');

console.log('\n📝 Key Changes:');
console.log('  • Support level ≥ 0mm  → Inverted bracket (angle at or above SSL)');
console.log('  • Support level < 0mm  → Standard bracket (angle below SSL)');
console.log('  • Previous logic used -75mm as cutoff, now uses 0mm (SSL) as cutoff');

process.exit(allPass ? 0 : 1);
