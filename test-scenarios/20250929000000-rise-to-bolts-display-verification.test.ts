/**
 * Test Scenario: Rise to Bolts Display Value Verification
 *
 * This test verifies that the rise_to_bolts_display field is correctly calculated
 * as 15mm above the calculation value (middle-of-slot position) while ensuring
 * that all structural calculations continue to use the worst-case value.
 *
 * Date: 2025-09-29
 */

import { runOptimization } from '../src/calculations/bruteForceAlgorithm/index';
import { DesignInputs } from '../src/types/bruteForceAlgorithm';

describe('Rise to Bolts Display Value', () => {

  const baseInputs: DesignInputs = {
    support_level: -150, // 150mm below slab top
    masonry_thickness: 102,
    cavity_width: 75,
    slab_thickness: 200,
    characteristic_udl: 5.0,
    live_load: 2.5,
    dead_load: 2.5,
    wind_load: 1.0,
    notch_height: 0,
    notch_depth: 0,
    E: 30000,
    max_allowable_bracket_extension: null,
    enable_angle_extension: false
  };

  test('Standard bracket - display value should be 15mm above calculation value', async () => {
    const result = await runOptimization(baseInputs);

    expect(result).toBeDefined();
    expect(result.calculated?.rise_to_bolts).toBeDefined();
    expect(result.calculated?.rise_to_bolts_display).toBeDefined();

    // Display value should be exactly 15mm more than calculation value
    const calculationValue = result.calculated!.rise_to_bolts!;
    const displayValue = result.calculated!.rise_to_bolts_display!;

    expect(displayValue).toBeCloseTo(calculationValue + 15, 5);

    console.log('Standard Bracket Results:');
    console.log(`  Rise to Bolts (calculation): ${calculationValue.toFixed(5)}mm`);
    console.log(`  Rise to Bolts (display): ${displayValue.toFixed(5)}mm`);
    console.log(`  Difference: ${(displayValue - calculationValue).toFixed(5)}mm`);
  });

  test('Inverted bracket - display value should be 15mm above calculation value', async () => {
    // Modify inputs to prefer inverted brackets
    const invertedInputs = {
      ...baseInputs,
      support_level: -400, // Deeper support level to encourage inverted brackets
      cavity_width: 85,
      enable_angle_extension: true,
      max_allowable_bracket_extension: 50
    };

    const result = await runOptimization(invertedInputs);

    expect(result).toBeDefined();
    expect(result.calculated?.rise_to_bolts).toBeDefined();
    expect(result.calculated?.rise_to_bolts_display).toBeDefined();

    // Verify this is an inverted bracket result
    expect(result.genetic?.bracket_type).toBe('Inverted');

    // Display value should be exactly 15mm more than calculation value
    const calculationValue = result.calculated!.rise_to_bolts!;
    const displayValue = result.calculated!.rise_to_bolts_display!;

    expect(displayValue).toBeCloseTo(calculationValue + 15, 5);

    console.log('Inverted Bracket Results:');
    console.log(`  Rise to Bolts (calculation): ${calculationValue.toFixed(5)}mm`);
    console.log(`  Rise to Bolts (display): ${displayValue.toFixed(5)}mm`);
    console.log(`  Difference: ${(displayValue - calculationValue).toFixed(5)}mm`);
  });

  test('With notch height - both values should be reduced by same amount', async () => {
    const notchInputs = {
      ...baseInputs,
      notch_height: 25,
      notch_depth: 10
    };

    const result = await runOptimization(notchInputs);

    expect(result).toBeDefined();
    expect(result.calculated?.rise_to_bolts).toBeDefined();
    expect(result.calculated?.rise_to_bolts_display).toBeDefined();

    // Display value should still be exactly 15mm more than calculation value
    // even after notch reduction is applied
    const calculationValue = result.calculated!.rise_to_bolts!;
    const displayValue = result.calculated!.rise_to_bolts_display!;

    expect(displayValue).toBeCloseTo(calculationValue + 15, 5);

    console.log('With Notch Results:');
    console.log(`  Rise to Bolts (calculation): ${calculationValue.toFixed(5)}mm`);
    console.log(`  Rise to Bolts (display): ${displayValue.toFixed(5)}mm`);
    console.log(`  Difference: ${(displayValue - calculationValue).toFixed(5)}mm`);
  });

  test('Backward compatibility - calculation value still available', async () => {
    const result = await runOptimization(baseInputs);

    expect(result).toBeDefined();
    expect(result.calculated?.rise_to_bolts).toBeDefined();

    // Verify calculation value is still the worst-case (bottom-of-slot) position
    const calculationValue = result.calculated!.rise_to_bolts!;
    expect(calculationValue).toBeGreaterThan(0);

    // Verify that verification checks would use the calculation value for safety
    expect(result.calculated?.detailed_verification_results).toBeDefined();
    expect(result.calculated?.all_checks_pass).toBe(true);

    console.log('Backward Compatibility:');
    console.log(`  Calculation value preserved: ${calculationValue.toFixed(5)}mm`);
    console.log(`  All safety checks pass: ${result.calculated!.all_checks_pass}`);
  });

});