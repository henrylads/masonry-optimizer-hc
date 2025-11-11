import { calculateStandardBracketHeightWithExtension, calculateInvertedBracketHeight } from '../bracketCalculations';

describe('Exclusion Zone Tests', () => {
  test('exclusion zones should work for both standard and inverted brackets', () => {
    console.log('=== TESTING EXCLUSION ZONE FEATURE ===');
    console.log('Verifying that both standard and inverted brackets handle exclusion zones correctly');

// Common test parameters
const commonParams = {
    slab_thickness: 225,
    top_critical_edge: 75,
    bottom_critical_edge: 125,
    angle_thickness: 5,
    current_angle_height: 60,
    enable_angle_extension: true,
    max_allowable_bracket_extension: -350, // 350mm below slab (exclusion zone)
    bracket_type: 'Standard' as const,
    angle_orientation: 'Standard' as const
};

console.log('\n--- TEST 1: STANDARD BRACKET WITH EXCLUSION ZONE ---');
const standardInputs = {
    support_level: -400, // Larger negative support level to trigger exclusion zone
    top_critical_edge: commonParams.top_critical_edge,
    distance_from_top_to_fixing: 40, // Y constant
    slab_thickness: commonParams.slab_thickness,
    max_allowable_bracket_extension: -300, // Smaller exclusion zone limit (300mm below slab)
    enable_angle_extension: commonParams.enable_angle_extension,
    bracket_type: commonParams.bracket_type,
    angle_orientation: commonParams.angle_orientation,
    current_angle_height: commonParams.current_angle_height
};

console.log('Standard bracket inputs:', {
    support_level: standardInputs.support_level,
    exclusion_zone_limit: standardInputs.max_allowable_bracket_extension,
    Y_constant: standardInputs.distance_from_top_to_fixing
});

const standardResults = calculateStandardBracketHeightWithExtension(standardInputs);

console.log('Standard bracket results:');
console.log('  Original calculation would be:', Math.abs(standardInputs.support_level) - standardInputs.top_critical_edge + standardInputs.distance_from_top_to_fixing, 'mm');
console.log('  Final bracket height:', standardResults.bracket_height, 'mm');
console.log('  Extension applied:', standardResults.angle_extension?.extension_applied);
console.log('  Bracket reduction:', standardResults.angle_extension?.bracket_reduction, 'mm');
console.log('  Angle extension:', standardResults.angle_extension?.angle_extension, 'mm');

console.log('\n--- TEST 2: INVERTED BRACKET WITH EXCLUSION ZONE ---');
const invertedInputs = {
    support_level: 300, // Inverted bracket with positive support level
    angle_thickness: commonParams.angle_thickness,
    top_critical_edge: commonParams.top_critical_edge,
    bottom_critical_edge: commonParams.bottom_critical_edge,
    slab_thickness: commonParams.slab_thickness,
    max_allowable_bracket_extension: commonParams.max_allowable_bracket_extension,
    enable_angle_extension: commonParams.enable_angle_extension,
    bracket_type: 'Inverted' as const,
    angle_orientation: commonParams.angle_orientation,
    current_angle_height: commonParams.current_angle_height
};

console.log('Inverted bracket inputs:', {
    support_level: invertedInputs.support_level,
    exclusion_zone_limit: invertedInputs.max_allowable_bracket_extension,
    angle_thickness: invertedInputs.angle_thickness
});

const invertedResults = calculateInvertedBracketHeight(invertedInputs);

console.log('Inverted bracket results:');
console.log('  Total bracket height:', invertedResults.bracket_height, 'mm');
console.log('  Extension below slab:', invertedResults.extension_below_slab, 'mm');
console.log('  Rise to bolts:', invertedResults.rise_to_bolts, 'mm');
console.log('  Extension applied:', invertedResults.angle_extension?.extension_applied);
console.log('  Bracket reduction:', invertedResults.angle_extension?.bracket_reduction, 'mm');
console.log('  Angle extension:', invertedResults.angle_extension?.angle_extension, 'mm');

console.log('\n--- TEST 3: NO EXCLUSION ZONE (CONTROL TEST) ---');
const noExclusionStandard = calculateStandardBracketHeightWithExtension({
    ...standardInputs,
    enable_angle_extension: false,
    max_allowable_bracket_extension: null
});

const noExclusionInverted = calculateInvertedBracketHeight({
    ...invertedInputs,
    enable_angle_extension: false,
    max_allowable_bracket_extension: null
});

console.log('Control test (no exclusion zones):');
console.log('  Standard bracket height:', noExclusionStandard.bracket_height, 'mm');
console.log('  Inverted bracket height:', noExclusionInverted.bracket_height, 'mm');
console.log('  Standard extension applied:', noExclusionStandard.angle_extension?.extension_applied || false);
console.log('  Inverted extension applied:', noExclusionInverted.angle_extension?.extension_applied || false);

console.log('\n--- VALIDATION SUMMARY ---');

// Check that both bracket types are handling exclusion zones
const standardUsesExtension = standardResults.angle_extension?.extension_applied || false;
const invertedUsesExtension = invertedResults.angle_extension?.extension_applied || false;

console.log('✓ Standard bracket exclusion zone handling:', standardUsesExtension ? 'WORKING' : 'NOT WORKING');
console.log('✓ Inverted bracket exclusion zone handling:', invertedUsesExtension ? 'WORKING' : 'NOT WORKING');

// Check that exclusion zones reduce bracket heights when triggered
const standardReduced = (standardResults.angle_extension?.bracket_reduction || 0) > 0;
const invertedReduced = (invertedResults.angle_extension?.bracket_reduction || 0) > 0;

console.log('✓ Standard bracket height reduction:', standardReduced ? 'APPLIED' : 'NOT APPLIED');
console.log('✓ Inverted bracket height reduction:', invertedReduced ? 'APPLIED' : 'NOT APPLIED');

// Check that angle extensions compensate for reductions
const standardAngleExt = standardResults.angle_extension?.angle_extension || 0;
const invertedAngleExt = invertedResults.angle_extension?.angle_extension || 0;

console.log('✓ Standard angle extension compensation:', standardAngleExt > 0 ? 'PROVIDED' : 'NOT PROVIDED');
console.log('✓ Inverted angle extension compensation:', invertedAngleExt > 0 ? 'PROVIDED' : 'NOT PROVIDED');

const overallSuccess = standardUsesExtension && invertedUsesExtension &&
                      standardReduced && invertedReduced &&
                      standardAngleExt > 0 && invertedAngleExt > 0;

console.log('\n🎯 OVERALL TEST RESULT:', overallSuccess ? 'PASS ✅' : 'FAIL ❌');

if (overallSuccess) {
    console.log('Both standard and inverted brackets are correctly handling exclusion zones with:');
    console.log('  - Extension detection and application');
    console.log('  - Bracket height reduction when needed');
    console.log('  - Compensating angle extension');
} else {
    console.log('Issues detected with exclusion zone handling. Check the individual test results above.');
}

console.log('\n=== TEST COMPLETE ===');

    // Jest assertions
    expect(standardUsesExtension).toBe(true);
    expect(invertedUsesExtension).toBe(true);
    expect(standardReduced).toBe(true);
    expect(invertedReduced).toBe(true);
    expect(standardAngleExt).toBeGreaterThan(0);
    expect(invertedAngleExt).toBeGreaterThan(0);
    expect(overallSuccess).toBe(true);
  });
});