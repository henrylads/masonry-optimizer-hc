import { calculateInvertedBracketHeight } from '../bracketCalculations';

describe('Exclusion Zone - Slab Top Restrictions', () => {
  test('exclusion zone at slab top (0mm) should restrict bracket height', () => {
    console.log('\n=== TEST: Exclusion Zone at Slab Top (0mm) ===');
    console.log('User Parameters: 225mm slab, 100mm cavity, 50mm support, 0mm exclusion');

    const inputs = {
      support_level: 50,                    // Positive = Inverted bracket
      angle_thickness: 5,
      top_critical_edge: 75,
      bottom_critical_edge: 150,
      slab_thickness: 225,
      fixing_position: 75,                  // 75mm from top of slab
      current_angle_height: 60,
      enable_angle_extension: true,
      max_allowable_bracket_extension: 0,   // 0mm = level with top of slab
      bracket_type: 'Inverted' as const,
      angle_orientation: 'Standard' as const
    };

    console.log('\n--- INPUT ANALYSIS ---');
    console.log('Exclusion zone at:', inputs.max_allowable_bracket_extension, 'mm (slab top)');
    console.log('Fixing position:', inputs.fixing_position, 'mm from slab top');
    console.log('Expected: Bracket bottom should NOT go above slab top');

    const results = calculateInvertedBracketHeight(inputs);

    console.log('\n--- RESULTS ANALYSIS ---');
    console.log('Bracket height:', results.bracket_height, 'mm');
    console.log('Extension below slab:', results.extension_below_slab, 'mm');

    if (results.angle_extension) {
      console.log('Angle extension applied:', results.angle_extension.extension_applied);
      console.log('Bracket reduction:', results.angle_extension.bracket_reduction, 'mm');
      console.log('Angle extension:', results.angle_extension.angle_extension, 'mm');
    }

    // Calculate where the bracket bottom would be
    const bracket_bottom_from_slab_top = results.extension_below_slab;
    console.log('Bracket bottom position:', bracket_bottom_from_slab_top, 'mm from slab top');

    console.log('\n--- VERIFICATION ---');

    // CRITICAL TEST: Bracket bottom should NOT exceed 0mm from slab top
    expect(bracket_bottom_from_slab_top).toBeLessThanOrEqual(0);
    console.log('✅ Bracket bottom is at/below slab top');

    // For slab top restriction, should have bracket reduction, not angle extension
    if (results.angle_extension?.extension_applied) {
      console.log('ℹ️  Angle extension was applied, but this should be bracket height reduction instead');
      console.log('   Bracket reduction:', results.angle_extension.bracket_reduction, 'mm');
      // The system should be reducing bracket height, not extending angles upward
      expect(results.angle_extension.bracket_reduction).toBeGreaterThan(0);
    }

    console.log('=== TEST COMPLETE ===\n');
  });

  test('exclusion zone above slab top (+10mm) should restrict bracket height', () => {
    console.log('\n=== TEST: Exclusion Zone Above Slab Top (+10mm) ===');

    const inputs = {
      support_level: 50,
      angle_thickness: 5,
      top_critical_edge: 75,
      bottom_critical_edge: 150,
      slab_thickness: 225,
      fixing_position: 75,
      current_angle_height: 60,
      enable_angle_extension: true,
      max_allowable_bracket_extension: 10,  // 10mm above slab top
      bracket_type: 'Inverted' as const,
      angle_orientation: 'Standard' as const
    };

    console.log('Exclusion zone at:', inputs.max_allowable_bracket_extension, 'mm above slab top');
    console.log('Expected: Bracket bottom should NOT go above 10mm from slab top');

    const results = calculateInvertedBracketHeight(inputs);

    const bracket_bottom_from_slab_top = results.extension_below_slab;
    console.log('Bracket bottom position:', bracket_bottom_from_slab_top, 'mm from slab top');

    // CRITICAL TEST: Bracket bottom should NOT exceed +10mm from slab top
    expect(bracket_bottom_from_slab_top).toBeLessThanOrEqual(10);
    console.log('✅ Bracket bottom respects +10mm exclusion zone');

    console.log('=== TEST COMPLETE ===\n');
  });

  test('exclusion zone below slab top (-30mm) should work as before', () => {
    console.log('\n=== TEST: Exclusion Zone Below Slab Top (-30mm) - Control Test ===');

    const inputs = {
      support_level: 50,
      angle_thickness: 5,
      top_critical_edge: 75,
      bottom_critical_edge: 150,
      slab_thickness: 225,
      fixing_position: 75,
      current_angle_height: 60,
      enable_angle_extension: true,
      max_allowable_bracket_extension: -30, // 30mm below slab (original test case)
      bracket_type: 'Inverted' as const,
      angle_orientation: 'Standard' as const
    };

    console.log('Exclusion zone at:', inputs.max_allowable_bracket_extension, 'mm below slab');
    console.log('Expected: Should work as before (angle extension + orientation flip)');

    const results = calculateInvertedBracketHeight(inputs);

    if (results.angle_extension) {
      console.log('Angle extension applied:', results.angle_extension.extension_applied);
      console.log('Orientation flipped:', results.angle_extension.angle_orientation_flipped);
      console.log('Final orientation:', results.angle_extension.final_angle_orientation);

      // This should trigger orientation flipping as before
      expect(results.angle_extension.extension_applied).toBe(true);
      expect(results.angle_extension.angle_orientation_flipped).toBe(true);
      expect(results.angle_extension.final_angle_orientation).toBe('Inverted');
      console.log('✅ Control test: Below-slab exclusion zone works as expected');
    }

    console.log('=== TEST COMPLETE ===\n');
  });
});