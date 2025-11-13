/**
 * Test scenario for angle extension with user's specific example
 *
 * Parameters:
 * - Slab thickness: 225mm
 * - Support level: -275mm (275mm below SSL)
 * - Max bracket position: -225mm (bottom of slab)
 * - Expected: Bracket limited to -225mm, angle extended 50mm (60mm → 110mm)
 *
 * Note: Support level -275mm should use STANDARD bracket (not inverted)
 * because -275 <= -75 (threshold for bracket type determination)
 */

import { calculateInvertedBracketHeight, calculateStandardBracketHeightWithExtension } from '../src/calculations/bracketCalculations';
import { determineBracketType } from '../src/calculations/bracketAngleSelection';

console.log('🧪 ANGLE EXTENSION TEST - User Example');
console.log('=====================================');

// First determine the correct bracket type
const support_level = -275; // 275mm below SSL
const correctBracketType = determineBracketType(support_level);

console.log(`🔍 BRACKET TYPE DETERMINATION:`);
console.log(`Support level: ${support_level}mm`);
console.log(`Threshold: -75mm`);
console.log(`Determined bracket type: ${correctBracketType}`);
console.log('');

const testInputs = {
    support_level: support_level,
    angle_thickness: 5,  // 5mm angle (common thickness)
    top_critical_edge: 75,    // Standard fixing distance from top of slab
    bottom_critical_edge: 150, // Standard bottom edge
    slab_thickness: 225,       // 225mm slab
    fixing_position: 75,       // 75mm from top of slab (same as top_critical_edge)

    // Angle extension parameters
    max_allowable_bracket_extension: -225, // -225mm = bottom of slab
    enable_angle_extension: true,
    bracket_type: correctBracketType,
    angle_orientation: 'Standard' as const,
    current_angle_height: 60 // Standard 60mm vertical leg
};

console.log('📋 Test Inputs:', testInputs);
console.log('');

console.log('🎯 Expected Results:');
console.log('- Bracket should be limited to stop at -225mm (bottom of slab)');
console.log('- Angle should extend by 50mm to reach -275mm support level');
console.log('- Final vertical leg should be 60mm + 50mm = 110mm');
console.log('');

try {
    let result;

    if (correctBracketType === 'Standard') {
        console.log('🔧 Using STANDARD bracket calculation with angle extension support');
        result = calculateStandardBracketHeightWithExtension({
            support_level: testInputs.support_level,
            top_critical_edge: testInputs.top_critical_edge,
            distance_from_top_to_fixing: 40, // Y constant from bracket angle selection
            slab_thickness: testInputs.slab_thickness,
            angle_thickness: testInputs.angle_thickness,
            fixing_position: testInputs.fixing_position,
            max_allowable_bracket_extension: testInputs.max_allowable_bracket_extension,
            enable_angle_extension: testInputs.enable_angle_extension,
            bracket_type: testInputs.bracket_type,
            angle_orientation: testInputs.angle_orientation,
            current_angle_height: testInputs.current_angle_height
        });
    } else {
        console.log('🔧 Using INVERTED bracket calculation');
        result = calculateInvertedBracketHeight(testInputs);
    }

    console.log('✅ TEST COMPLETED');
    console.log('================');

    if (result.angle_extension) {
        console.log(`📊 Extension Applied: ${result.angle_extension.extension_applied}`);
        console.log(`📊 Original Bracket Height: ${result.angle_extension.original_bracket_height}mm`);
        console.log(`📊 Limited Bracket Height: ${result.angle_extension.limited_bracket_height}mm`);
        console.log(`📊 Bracket Reduction: ${result.angle_extension.bracket_reduction}mm`);
        console.log(`📊 Original Angle Height: ${result.angle_extension.original_angle_height}mm`);
        console.log(`📊 Extended Angle Height: ${result.angle_extension.extended_angle_height}mm`);
        console.log(`📊 Angle Extension: ${result.angle_extension.angle_extension}mm`);

        // Verify expectations
        const expectedAngleHeight = 110;
        const actualAngleHeight = result.angle_extension.extended_angle_height;

        if (Math.abs(actualAngleHeight - expectedAngleHeight) < 0.01) {
            console.log('✅ PASS: Angle height is correct!');
        } else {
            console.log(`❌ FAIL: Expected angle height ${expectedAngleHeight}mm, got ${actualAngleHeight}mm`);
        }
    } else {
        console.log('❌ FAIL: No angle extension result found');
    }

} catch (error) {
    console.error('❌ TEST FAILED:', error);
}