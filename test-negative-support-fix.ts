/**
 * Test for inverted bracket with negative support levels (-75mm to 0mm)
 */

import { calculateInvertedBracketHeight } from './src/calculations/bracketCalculations';
import { determineBracketType } from './src/calculations/bracketAngleSelection';

console.log('='.repeat(80));
console.log('TESTING INVERTED BRACKET WITH NEGATIVE SUPPORT LEVELS');
console.log('='.repeat(80));

const testCases = [
    {
        name: 'Support -50mm (between 0 and -75mm)',
        support_level: -50,
        angle_orientation: 'Standard' as const,
        expectedBracket: 'Inverted',
        description: 'Angle 50mm below SSL, should use inverted bracket per table'
    },
    {
        name: 'Support -25mm (between 0 and -75mm)',
        support_level: -25,
        angle_orientation: 'Standard' as const,
        expectedBracket: 'Inverted',
        description: 'Angle 25mm below SSL, should use inverted bracket per table'
    },
    {
        name: 'Support 0mm (at SSL)',
        support_level: 0,
        angle_orientation: 'Inverted' as const,
        expectedBracket: 'Inverted',
        description: 'Angle at SSL, should use inverted bracket'
    },
    {
        name: 'Support +50mm (above SSL)',
        support_level: 50,
        angle_orientation: 'Inverted' as const,
        expectedBracket: 'Inverted',
        description: 'Angle 50mm above SSL, should use inverted bracket'
    }
];

let allPass = true;

testCases.forEach(({ name, support_level, angle_orientation, expectedBracket, description }) => {
    console.log(`\n📋 Test: ${name}`);
    console.log('─'.repeat(80));
    console.log(`Description: ${description}`);

    // Check bracket type determination
    const bracketType = determineBracketType(support_level);
    const bracketTypeOk = bracketType === expectedBracket;

    console.log(`Bracket Type: ${bracketType} (expected ${expectedBracket}) ${bracketTypeOk ? '✅' : '❌'}`);

    if (!bracketTypeOk) {
        allPass = false;
        return;
    }

    // Calculate inverted bracket dimensions
    try {
        const result = calculateInvertedBracketHeight({
            support_level,
            angle_thickness: 5,
            top_critical_edge: 75,
            bottom_critical_edge: 150,
            fixing_position: 75,
            slab_thickness: 225,
            current_angle_height: 60,
            angle_orientation
        });

        console.log(`\nResults:`);
        console.log(`  Bracket Height: ${result.bracket_height} mm`);
        console.log(`  Height Above SSL: ${result.height_above_ssl} mm`);
        console.log(`  Height Below SSL: ${result.height_below_ssl} mm`);
        console.log(`  Dim D: ${result.dim_d} mm`);
        console.log(`  Rise to Bolts: ${result.rise_to_bolts} mm`);
        console.log(`  Extension Below Slab: ${result.extension_below_slab} mm`);

        // Validation checks
        const checks = [];

        // For negative support levels, height above SSL should be 0
        if (support_level < 0) {
            const heightAboveOk = result.height_above_ssl === 0;
            checks.push({
                name: 'Height above SSL = 0 (angle below SSL)',
                pass: heightAboveOk,
                value: result.height_above_ssl
            });
        }

        // Dim D should be within valid range
        const dimDOk = result.dim_d >= 130 && result.dim_d <= 450;
        checks.push({
            name: 'Dim D in valid range (130-450mm)',
            pass: dimDOk,
            value: result.dim_d
        });

        // Rise to bolts should be positive
        const riseToBoltsOk = result.rise_to_bolts > 0;
        checks.push({
            name: 'Rise to bolts > 0',
            pass: riseToBoltsOk,
            value: result.rise_to_bolts
        });

        console.log(`\nValidation Checks:`);
        checks.forEach(check => {
            const icon = check.pass ? '✅' : '❌';
            console.log(`  ${icon} ${check.name}: ${check.value}mm`);
            if (!check.pass) allPass = false;
        });

        console.log(`\n${checks.every(c => c.pass) ? '✅ PASS' : '❌ FAIL'}`);

    } catch (error) {
        console.log(`❌ ERROR: ${error.message}`);
        allPass = false;
    }
});

console.log('\n' + '='.repeat(80));
console.log('SUMMARY');
console.log('='.repeat(80));
console.log(allPass ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
console.log('='.repeat(80));

process.exit(allPass ? 0 : 1);
