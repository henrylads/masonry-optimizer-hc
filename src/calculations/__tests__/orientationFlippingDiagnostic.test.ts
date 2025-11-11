import { calculateInvertedBracketHeight } from '../bracketCalculations';

describe('Orientation Flipping Diagnostic - User Example', () => {
  test('user example: 225mm slab, 100mm cavity, 50mm support, 30mm exclusion', () => {
    console.log('\\n=== DIAGNOSTIC TEST: User Example Parameters ===');
    console.log('Slab: 225mm, Cavity: 100mm, Support: 50mm, Exclusion: 30mm');

    // User's exact parameters
    const userInputs = {
      support_level: 50,                    // POSITIVE = Inverted bracket should be used
      angle_thickness: 5,                   // Standard angle thickness
      top_critical_edge: 75,                // Standard top critical edge
      bottom_critical_edge: 125,            // Standard bottom critical edge
      slab_thickness: 225,                  // User's slab thickness
      current_angle_height: 60,             // Standard 60mm angle height
      enable_angle_extension: true,         // Exclusion zone enabled
      max_allowable_bracket_extension: -30, // User's exclusion zone: 30mm below slab
      bracket_type: 'Inverted' as const,    // Should be Inverted for positive support level
      angle_orientation: 'Standard' as const // Should flip to Inverted if extension needed
    };

    console.log('\\n--- INPUT ANALYSIS ---');
    console.log('Support level (positive):', userInputs.support_level, '-> Should use Inverted bracket');
    console.log('Bracket type set to:', userInputs.bracket_type);
    console.log('Angle orientation set to:', userInputs.angle_orientation);
    console.log('Exclusion zone:', userInputs.max_allowable_bracket_extension, 'mm below slab');

    // Calculate with diagnostic logging
    const results = calculateInvertedBracketHeight(userInputs);

    console.log('\\n--- RESULTS ANALYSIS ---');
    console.log('Final bracket height:', results.bracket_height, 'mm');
    console.log('Extension applied:', results.angle_extension?.extension_applied);
    console.log('Bracket reduction:', results.angle_extension?.bracket_reduction, 'mm');
    console.log('Angle extension needed:', results.angle_extension?.angle_extension, 'mm');
    console.log('');
    console.log('--- ORIENTATION ANALYSIS ---');
    console.log('Orientation flipped:', results.angle_extension?.angle_orientation_flipped);
    console.log('Original orientation:', results.angle_extension?.original_angle_orientation);
    console.log('Final orientation:', results.angle_extension?.final_angle_orientation);
    console.log('Flip reason:', results.angle_extension?.flip_reason);

    // Analysis
    if (results.angle_extension?.extension_applied) {
      console.log('\\n✅ Extension was applied - exclusion zone is working');

      if (results.angle_extension?.angle_orientation_flipped) {
        console.log('✅ Orientation was flipped - auto-flip is working');
      } else {
        console.log('❌ Orientation was NOT flipped - this is the issue!');
        console.log('   Expected: Standard → Inverted');
        console.log('   Actual: Remained', results.angle_extension?.final_angle_orientation);
      }
    } else {
      console.log('\\n❌ No extension applied - exclusion zone might not be triggered');
      console.log('   This means the bracket does not exceed the 30mm exclusion zone limit');
      console.log('   Need to check if exclusion zone is aggressive enough');
    }

    // Check if bracket would exceed exclusion zone without extension logic
    const bracket_bottom_estimate = userInputs.support_level + userInputs.top_critical_edge + userInputs.bottom_critical_edge;
    console.log('\\n--- EXCLUSION ZONE ANALYSIS ---');
    console.log('Estimated bracket bottom position:', bracket_bottom_estimate, 'mm from top of slab');
    console.log('Exclusion zone limit:', Math.abs(userInputs.max_allowable_bracket_extension), 'mm from top of slab');
    console.log('Should trigger extension:', bracket_bottom_estimate > Math.abs(userInputs.max_allowable_bracket_extension));

    console.log('\\n=== DIAGNOSTIC COMPLETE ===\\n');

    // Assertions to verify expected behavior
    expect(results.angle_extension?.extension_applied).toBe(true);
    expect(results.angle_extension?.angle_orientation_flipped).toBe(true);
    expect(results.angle_extension?.original_angle_orientation).toBe('Standard');
    expect(results.angle_extension?.final_angle_orientation).toBe('Inverted');
  });

  test('control test: same parameters but with loose exclusion zone', () => {
    console.log('\\n=== CONTROL TEST: Loose Exclusion Zone ===');

    const controlInputs = {
      support_level: 50,
      angle_thickness: 5,
      top_critical_edge: 75,
      bottom_critical_edge: 125,
      slab_thickness: 225,
      current_angle_height: 60,
      enable_angle_extension: true,
      max_allowable_bracket_extension: -500, // Very loose exclusion zone
      bracket_type: 'Inverted' as const,
      angle_orientation: 'Standard' as const
    };

    console.log('Using loose exclusion zone:', controlInputs.max_allowable_bracket_extension, 'mm');

    const results = calculateInvertedBracketHeight(controlInputs);

    console.log('\\n--- CONTROL RESULTS ---');
    console.log('Extension applied:', results.angle_extension?.extension_applied);
    console.log('Orientation flipped:', results.angle_extension?.angle_orientation_flipped);

    // With a loose exclusion zone, no extension should be needed
    expect(results.angle_extension?.extension_applied || false).toBe(false);
    expect(results.angle_extension?.angle_orientation_flipped || false).toBe(false);

    console.log('✅ Control test confirms: loose exclusion zone = no extension/flipping');
    console.log('=== CONTROL TEST COMPLETE ===\\n');
  });

  test('edge case test: tight exclusion zone should definitely trigger flipping', () => {
    console.log('\\n=== EDGE CASE TEST: Very Tight Exclusion Zone ===');

    const tightInputs = {
      support_level: 50,
      angle_thickness: 5,
      top_critical_edge: 75,
      bottom_critical_edge: 125,
      slab_thickness: 225,
      current_angle_height: 60,
      enable_angle_extension: true,
      max_allowable_bracket_extension: -10, // Very tight exclusion zone
      bracket_type: 'Inverted' as const,
      angle_orientation: 'Standard' as const
    };

    console.log('Using very tight exclusion zone:', tightInputs.max_allowable_bracket_extension, 'mm');

    const results = calculateInvertedBracketHeight(tightInputs);

    console.log('\\n--- TIGHT EXCLUSION RESULTS ---');
    console.log('Extension applied:', results.angle_extension?.extension_applied);
    console.log('Bracket reduction:', results.angle_extension?.bracket_reduction, 'mm');
    console.log('Angle extension:', results.angle_extension?.angle_extension, 'mm');
    console.log('Orientation flipped:', results.angle_extension?.angle_orientation_flipped);
    console.log('Final orientation:', results.angle_extension?.final_angle_orientation);

    // With a very tight exclusion zone, extension and flipping should definitely occur
    expect(results.angle_extension?.extension_applied).toBe(true);
    expect(results.angle_extension?.angle_orientation_flipped).toBe(true);
    expect(results.angle_extension?.final_angle_orientation).toBe('Inverted');

    console.log('✅ Tight exclusion zone test confirms: flipping logic works when triggered');
    console.log('=== EDGE CASE TEST COMPLETE ===\\n');
  });
});