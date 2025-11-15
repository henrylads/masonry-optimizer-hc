/**
 * Test Scenario: RHS 100mm Rise to Bolts Fix Verification
 *
 * This test verifies that for RHS 100mm tall beam with fixing at 90mm from top,
 * the rise to bolts is correctly calculated as 10mm (not 135mm).
 *
 * Date: 2025-11-15
 */

import { calculateInvertedBracketHeightHeight } from '../src/calculations/bracketCalculations';

describe('RHS 100mm Rise to Bolts Fix', () => {

  test('RHS 100mm with fixing at 90mm should give rise to bolts ~10mm', () => {
    // Test parameters matching the user's scenario
    const support_level = -50;  // 50mm below SSL (top of RHS beam)
    const cavity = 100;
    const slab_thickness = 100;  // RHS 100mm tall used as structural support
    const fixing_position = 90;  // Optimized fixing position (moved from 75mm)
    const bracket_thickness = 10;
    const masonry_thickness = 102;
    const rise_from_top_of_slab_to_base_of_angle = 0;
    const angle_horizontal_leg = 90;
    const angle_thickness = 8;

    const result = calculateInvertedBracketHeight({
      support_level,
      cavity,
      slab_thickness,
      fixing_position,
      bracket_thickness,
      masonry_thickness,
      rise_from_top_of_slab_to_base_of_angle,
      angle_horizontal_leg,
      angle_thickness,
      required_min_height: 175,
      enable_angle_extension: false,
      max_allowable_bracket_extension: null,
      vertical_leg: 150,
      load: 5.0
    });

    console.log('\n=== RHS 100mm Test Results ===');
    console.log(`Support Level: ${support_level}mm`);
    console.log(`Slab Thickness (RHS height): ${slab_thickness}mm`);
    console.log(`Fixing Position: ${fixing_position}mm from top`);
    console.log(`Bracket Height: ${result.bracket_height}mm`);
    console.log(`Dim D: ${result.dim_d}mm`);
    console.log(`Optimized Fixing Position: ${result.optimized_fixing_position ?? 'N/A'}mm`);
    console.log(`Rise to Bolts (calculation): ${result.rise_to_bolts.toFixed(2)}mm`);
    console.log(`Rise to Bolts (display): ${result.rise_to_bolts_display.toFixed(2)}mm`);
    console.log('================================\n');

    // Expected: rise_to_bolts = slab_thickness - fixing_position - SLOT_TOLERANCE
    // = 100 - 90 - 15 = -5mm (worst case)
    // rise_to_bolts_display = -5 + 15 = 10mm (middle of slot)

    expect(result.rise_to_bolts_display).toBeCloseTo(10, 1);

    // Calculation value should be 15mm less (bottom of slot)
    expect(result.rise_to_bolts).toBeCloseTo(-5, 1);

    // Bracket should be extended to minimum height
    expect(result.bracket_height).toBe(175);

    // Fixing position should be optimized to 90mm
    expect(result.optimized_fixing_position).toBeCloseTo(90, 1);
  });

  test('Standard inverted bracket without minimum height adjustment', () => {
    // Test case where bracket is already tall enough, no optimization needed
    const support_level = -250;
    const cavity = 100;
    const slab_thickness = 300;  // Thick slab
    const fixing_position = 75;
    const bracket_thickness = 10;
    const masonry_thickness = 102;
    const rise_from_top_of_slab_to_base_of_angle = 0;
    const angle_horizontal_leg = 90;
    const angle_thickness = 8;

    const result = calculateInvertedBracketHeight({
      support_level,
      cavity,
      slab_thickness,
      fixing_position,
      bracket_thickness,
      masonry_thickness,
      rise_from_top_of_slab_to_base_of_angle,
      angle_horizontal_leg,
      angle_thickness,
      required_min_height: 175,
      enable_angle_extension: false,
      max_allowable_bracket_extension: null,
      vertical_leg: 150,
      load: 5.0
    });

    console.log('\n=== Standard Inverted Bracket Test ===');
    console.log(`Support Level: ${support_level}mm`);
    console.log(`Slab Thickness: ${slab_thickness}mm`);
    console.log(`Fixing Position: ${fixing_position}mm`);
    console.log(`Bracket Height: ${result.bracket_height}mm`);
    console.log(`Optimized Fixing Position: ${result.optimized_fixing_position ?? 'Not adjusted'}mm`);
    console.log(`Rise to Bolts (calculation): ${result.rise_to_bolts.toFixed(2)}mm`);
    console.log(`Rise to Bolts (display): ${result.rise_to_bolts_display.toFixed(2)}mm`);
    console.log('======================================\n');

    // Expected: rise_to_bolts = slab_thickness - fixing_position - SLOT_TOLERANCE
    // = 300 - 75 - 15 = 210mm (worst case)
    // rise_to_bolts_display = 210 + 15 = 225mm (middle of slot)

    expect(result.rise_to_bolts_display).toBeCloseTo(225, 1);
    expect(result.rise_to_bolts).toBeCloseTo(210, 1);

    // No fixing position optimization should occur (bracket already tall enough)
    expect(result.optimized_fixing_position).toBeUndefined();
  });
});
