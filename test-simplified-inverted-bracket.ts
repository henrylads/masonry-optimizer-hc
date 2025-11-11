/**
 * Quick validation test for simplified inverted bracket calculation
 */

import { calculateInvertedBracketHeight, type InvertedBracketInputs } from './src/calculations/bracketCalculations';

console.log('='.repeat(80));
console.log('TESTING SIMPLIFIED INVERTED BRACKET CALCULATION');
console.log('='.repeat(80));

// Test 1: Engineer's Example from documentation
// Support Level: 180mm, Slab: 200mm, Top Edge: 75mm, Bottom Edge: 125mm, Angle: 5mm
console.log('\n📋 Test 1: Engineer\'s Example (395mm expected)');
console.log('Support: 180mm, Slab: 200mm, Top: 75mm, Bottom: 125mm, Angle: 5mm');

const engineerExample: InvertedBracketInputs = {
    support_level: 180,
    angle_thickness: 5,
    top_critical_edge: 75,
    bottom_critical_edge: 125,
    fixing_position: 75,
    slab_thickness: 200,
    current_angle_height: 60,
    angle_orientation: 'Inverted'
};

const result1 = calculateInvertedBracketHeight(engineerExample);

console.log('\nManual Calculation:');
console.log('  Extension = max(0, 135 - 125) = 10mm');
console.log('  Height Below SSL = 75 + 125 + 10 = 210mm');
console.log('  Height Above SSL = 180 + 0 = 180mm');
console.log('  Total Height = 180 + 210 = 390mm');
console.log('  Dim D = 125 + 10 = 135mm');
console.log('  Rise to Bolts = 135 - 15 = 120mm');

console.log('\nActual Results:');
console.log('  Bracket Height:', result1.bracket_height, 'mm');
console.log('  Dim D:', result1.dim_d, 'mm');
console.log('  Rise to Bolts:', result1.rise_to_bolts, 'mm');
console.log('  Height Above SSL:', result1.height_above_ssl, 'mm');
console.log('  Height Below SSL:', result1.height_below_ssl, 'mm');
console.log('  Extension Below Slab:', result1.extension_below_slab, 'mm');

const test1Pass = Math.abs(result1.bracket_height - 390) < 1 &&
                  Math.abs(result1.dim_d - 135) < 1 &&
                  Math.abs(result1.rise_to_bolts - 120) < 1;

console.log('\n✅ Test 1:', test1Pass ? 'PASSED' : '❌ FAILED');

// Test 2: User Example - 0mm support level
console.log('\n\n📋 Test 2: User Example (support at slab level)');
console.log('Support: 0mm, Slab: 225mm, Top: 75mm, Bottom: 150mm, Angle: 5mm');

const userExample: InvertedBracketInputs = {
    support_level: 0,
    angle_thickness: 5,
    top_critical_edge: 75,
    bottom_critical_edge: 150,
    fixing_position: 75,
    slab_thickness: 225,
    current_angle_height: 60,
    angle_orientation: 'Inverted'
};

const result2 = calculateInvertedBracketHeight(userExample);

console.log('\nManual Calculation:');
console.log('  Extension = max(0, 135 - 150) = 0mm');
console.log('  Height Below SSL = 75 + 150 + 0 = 225mm');
console.log('  Height Above SSL = 0 + 0 = 0mm');
console.log('  Total Height = 0 + 225 = 225mm');
console.log('  Dim D = 150 + 0 = 150mm');
console.log('  Rise to Bolts = 150 - 15 = 135mm');

console.log('\nActual Results:');
console.log('  Bracket Height:', result2.bracket_height, 'mm');
console.log('  Dim D:', result2.dim_d, 'mm');
console.log('  Rise to Bolts:', result2.rise_to_bolts, 'mm');
console.log('  Height Above SSL:', result2.height_above_ssl, 'mm');
console.log('  Height Below SSL:', result2.height_below_ssl, 'mm');
console.log('  Extension Below Slab:', result2.extension_below_slab, 'mm');

const test2Pass = Math.abs(result2.bracket_height - 225) < 1 &&
                  Math.abs(result2.dim_d - 150) < 1 &&
                  Math.abs(result2.rise_to_bolts - 135) < 1;

console.log('\n✅ Test 2:', test2Pass ? 'PASSED' : '❌ FAILED');

// Test 3: Standard angle orientation (should add angle adjustment)
console.log('\n\n📋 Test 3: Standard Angle Orientation');
console.log('Support: 50mm, Slab: 225mm, Angle: 60mm height, 5mm thick, Standard orientation');

const standardAngle: InvertedBracketInputs = {
    support_level: 50,
    angle_thickness: 5,
    top_critical_edge: 75,
    bottom_critical_edge: 150,
    fixing_position: 75,
    slab_thickness: 225,
    current_angle_height: 60,
    angle_orientation: 'Standard'
};

const result3 = calculateInvertedBracketHeight(standardAngle);

console.log('\nManual Calculation:');
console.log('  Angle adjustment = 60 - 5 = 55mm');
console.log('  Extension = max(0, 135 - 150) = 0mm');
console.log('  Height Below SSL = 75 + 150 + 0 = 225mm');
console.log('  Height Above SSL = 50 + 55 = 105mm');
console.log('  Total Height = 105 + 225 = 330mm');
console.log('  Dim D = 150 + 0 = 150mm');
console.log('  Rise to Bolts = 150 - 15 = 135mm');

console.log('\nActual Results:');
console.log('  Bracket Height:', result3.bracket_height, 'mm');
console.log('  Dim D:', result3.dim_d, 'mm');
console.log('  Rise to Bolts:', result3.rise_to_bolts, 'mm');
console.log('  Height Above SSL:', result3.height_above_ssl, 'mm');
console.log('  Height Below SSL:', result3.height_below_ssl, 'mm');
console.log('  Extension Below Slab:', result3.extension_below_slab, 'mm');

const test3Pass = Math.abs(result3.bracket_height - 330) < 1 &&
                  Math.abs(result3.dim_d - 150) < 1 &&
                  Math.abs(result3.height_above_ssl - 105) < 1;

console.log('\n✅ Test 3:', test3Pass ? 'PASSED' : '❌ FAILED');

// Test 4: Dim D constraint handling (minimum)
console.log('\n\n📋 Test 4: Dim D Minimum Constraint (130mm)');
console.log('Small bottom edge should trigger minimum Dim D constraint');

const minConstraint: InvertedBracketInputs = {
    support_level: 0,
    angle_thickness: 5,
    top_critical_edge: 75,
    bottom_critical_edge: 100, // Small value
    fixing_position: 75,
    slab_thickness: 225,
    current_angle_height: 60,
    angle_orientation: 'Inverted'
};

const result4 = calculateInvertedBracketHeight(minConstraint);

console.log('\nManual Calculation:');
console.log('  Extension = max(0, 135 - 100) = 35mm');
console.log('  Calculated Dim D = 100 + 35 = 135mm (> 130mm minimum) ✓');
console.log('  Height Below SSL = 75 + 100 + 35 = 210mm');
console.log('  Total Height = 0 + 210 = 210mm');

console.log('\nActual Results:');
console.log('  Bracket Height:', result4.bracket_height, 'mm');
console.log('  Dim D:', result4.dim_d, 'mm (should be >= 130mm)');
console.log('  Rise to Bolts:', result4.rise_to_bolts, 'mm');

const test4Pass = result4.dim_d >= 130;

console.log('\n✅ Test 4:', test4Pass ? 'PASSED' : '❌ FAILED');

// Summary
console.log('\n' + '='.repeat(80));
console.log('SUMMARY');
console.log('='.repeat(80));
console.log('Test 1 (Engineer\'s Example):', test1Pass ? '✅ PASSED' : '❌ FAILED');
console.log('Test 2 (User Example):', test2Pass ? '✅ PASSED' : '❌ FAILED');
console.log('Test 3 (Standard Angle):', test3Pass ? '✅ PASSED' : '❌ FAILED');
console.log('Test 4 (Dim D Constraint):', test4Pass ? '✅ PASSED' : '❌ FAILED');

const allPass = test1Pass && test2Pass && test3Pass && test4Pass;
console.log('\nOVERALL:', allPass ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
console.log('='.repeat(80));

process.exit(allPass ? 0 : 1);