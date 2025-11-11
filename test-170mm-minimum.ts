/**
 * Test for 170mm minimum height enforcement on inverted brackets
 */

import { calculateInvertedBracketHeight } from './src/calculations/bracketCalculations';

console.log('='.repeat(80));
console.log('TESTING 170MM MINIMUM HEIGHT FOR INVERTED BRACKETS');
console.log('='.repeat(80));

const testCases = [
    {
        name: 'Support -25mm (should enforce 170mm minimum)',
        support_level: -25,
        angle_orientation: 'Inverted' as const,
        expectedMin: 170,
        description: 'Low bracket height case - should be extended to 170mm'
    },
    {
        name: 'Support -50mm (already above 170mm)',
        support_level: -50,
        angle_orientation: 'Inverted' as const,
        expectedMin: 170,
        description: 'Already meets minimum, no extension needed'
    },
    {
        name: 'Support 0mm (may need extension)',
        support_level: 0,
        angle_orientation: 'Inverted' as const,
        expectedMin: 170,
        description: 'Boundary case at SSL'
    },
    {
        name: 'Support +50mm (likely above 170mm)',
        support_level: 50,
        angle_orientation: 'Inverted' as const,
        expectedMin: 170,
        description: 'Angle above SSL, should meet minimum'
    }
];

let allPass = true;

testCases.forEach(({ name, support_level, angle_orientation, expectedMin, description }) => {
    console.log(`\n📋 Test: ${name}`);
    console.log('─'.repeat(80));
    console.log(`Description: ${description}`);

    try {
        const result = calculateInvertedBracketHeight({
            support_level,
            angle_thickness: 6,
            top_critical_edge: 75,
            bottom_critical_edge: 150,
            fixing_position: 75,
            slab_thickness: 225,
            current_angle_height: 60,
            angle_orientation
        });

        console.log(`\nResults:`);
        console.log(`  Bracket Height: ${result.bracket_height} mm`);
        console.log(`  Minimum Required: ${expectedMin} mm`);
        console.log(`  Height Above SSL: ${result.height_above_ssl} mm`);
        console.log(`  Height Below SSL: ${result.height_below_ssl} mm`);
        console.log(`  Dim D: ${result.dim_d} mm`);
        console.log(`  Rise to Bolts: ${result.rise_to_bolts} mm`);

        // Main validation: bracket height should be >= 170mm
        const meetsMinimum = result.bracket_height >= expectedMin;

        if (meetsMinimum) {
            console.log(`\n✅ PASS - Bracket height ${result.bracket_height}mm >= ${expectedMin}mm minimum`);
        } else {
            console.log(`\n❌ FAIL - Bracket height ${result.bracket_height}mm < ${expectedMin}mm minimum`);
            allPass = false;
        }

        // Additional checks
        const checks = [];

        // Rise to bolts should be reasonable
        const riseToBoltsOk = result.rise_to_bolts >= 95; // Minimum viable rise
        checks.push({
            name: 'Rise to bolts >= 95mm',
            pass: riseToBoltsOk,
            value: result.rise_to_bolts
        });

        // Dim D should be within range
        const dimDOk = result.dim_d >= 130 && result.dim_d <= 450;
        checks.push({
            name: 'Dim D in range (130-450mm)',
            pass: dimDOk,
            value: result.dim_d
        });

        if (checks.some(c => !c.pass)) {
            console.log(`\nAdditional Checks:`);
            checks.forEach(check => {
                const icon = check.pass ? '✅' : '⚠️';
                console.log(`  ${icon} ${check.name}: ${check.value}mm`);
            });
        }

    } catch (error) {
        console.log(`❌ ERROR: ${error.message}`);
        allPass = false;
    }
});

console.log('\n' + '='.repeat(80));
console.log('SUMMARY');
console.log('='.repeat(80));
console.log(allPass ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
console.log('\nKey Requirement: All inverted brackets must be >= 170mm');
console.log('Reason: 130mm Dim D + 40mm clearance above fixing = 170mm minimum');
console.log('='.repeat(80));

process.exit(allPass ? 0 : 1);
