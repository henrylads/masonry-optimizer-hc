/**
 * Final Fix Validation Test
 *
 * Tests the corrected approach where:
 * 1. User's formula calculates bracket height (275mm/329mm)
 * 2. Rise to bolts is calculated from geometry (135mm)
 * 3. Dim D is derived from rise_to_bolts + 15 (150mm)
 * 4. No slab geometry violations occur
 */

import { calculateInvertedBracketHeight, type InvertedBracketInputs } from './calculations/bracketCalculations';

describe('Final Fix - Correct Calculation Flow', () => {

  describe('Inverted Angle - Final Validation', () => {
    test('should produce 275mm bracket height with 150mm Dim D and no violations', () => {
      const userExample: InvertedBracketInputs = {
        support_level: 50,
        angle_thickness: 6,
        top_critical_edge: 75,
        bottom_critical_edge: 150,
        fixing_position: 75,
        slab_thickness: 225,
        current_angle_height: 60,
        angle_orientation: 'Inverted'
      };

      console.log('🧪 Final Test - Inverted Angle');
      console.log('Expected: 275mm bracket, 150mm Dim D, 135mm rise_to_bolts, no violations');

      const result = calculateInvertedBracketHeight(userExample);

      console.log('Final Results:', {
        bracket_height: result.bracket_height,
        dim_d: result.dim_d,
        rise_to_bolts: result.rise_to_bolts,
        extension_below_slab: result.extension_below_slab,
        formula_check: `150 + 75 + 50 + 0 = ${150 + 75 + 50 + 0}`
      });

      // User's exact requirements
      expect(result.bracket_height).toBe(275);
      expect(result.dim_d).toBe(150);
      expect(result.rise_to_bolts).toBe(135);
      expect(result.extension_below_slab).toBe(50); // 275mm bracket - 225mm slab = 50mm extension

      console.log('✅ Inverted angle: Exact user requirements met!');
    });
  });

  describe('Standard Angle - Final Validation', () => {
    test('should produce 329mm bracket height with 150mm Dim D and no violations', () => {
      const userExample: InvertedBracketInputs = {
        support_level: 50,
        angle_thickness: 6,
        top_critical_edge: 75,
        bottom_critical_edge: 150,
        fixing_position: 75,
        slab_thickness: 225,
        current_angle_height: 60,
        angle_orientation: 'Standard'
      };

      console.log('🧪 Final Test - Standard Angle');
      console.log('Expected: 329mm bracket, 150mm Dim D, 135mm rise_to_bolts, no violations');

      const result = calculateInvertedBracketHeight(userExample);

      console.log('Final Results:', {
        bracket_height: result.bracket_height,
        dim_d: result.dim_d,
        rise_to_bolts: result.rise_to_bolts,
        extension_below_slab: result.extension_below_slab,
        formula_check: `150 + 75 + 50 + 54 = ${150 + 75 + 50 + 54}`
      });

      // User's exact requirements
      expect(result.bracket_height).toBe(329);
      expect(result.dim_d).toBe(150);
      expect(result.rise_to_bolts).toBe(135);
      expect(result.extension_below_slab).toBe(104); // 329mm bracket - 225mm slab = 104mm extension

      console.log('✅ Standard angle: Exact user requirements met!');
    });
  });

  describe('Slab Geometry Validation', () => {
    test('should not trigger slab geometry violations with new approach', () => {
      const testInputs: InvertedBracketInputs = {
        support_level: 50,
        angle_thickness: 6,
        top_critical_edge: 75,
        bottom_critical_edge: 150,
        fixing_position: 75,
        slab_thickness: 225,
        current_angle_height: 60,
        angle_orientation: 'Inverted'
      };

      const result = calculateInvertedBracketHeight(testInputs);

      // Verify no slab geometry extensions occurred
      const max_dim_d_for_slab = testInputs.slab_thickness - testInputs.fixing_position; // 225 - 75 = 150

      console.log('Slab Geometry Check:', {
        max_dim_d_for_slab: max_dim_d_for_slab,
        actual_dim_d: result.dim_d,
        violation: result.dim_d > max_dim_d_for_slab,
        bracket_height: result.bracket_height,
        user_formula_height: 275
      });

      // Key validations
      expect(result.dim_d).toBeLessThanOrEqual(max_dim_d_for_slab); // No slab violation
      expect(result.bracket_height).toBe(275); // User's exact requirement
      expect(result.dim_d).toBe(150); // Exactly as expected

      console.log('✅ No slab geometry violations detected!');
    });
  });

  describe('Rise to Bolts Derivation', () => {
    test('should correctly derive Dim D from rise_to_bolts (135 + 15 = 150)', () => {
      const result = calculateInvertedBracketHeight({
        support_level: 50,
        angle_thickness: 6,
        top_critical_edge: 75,
        bottom_critical_edge: 150,
        fixing_position: 75,
        slab_thickness: 225,
        current_angle_height: 60,
        angle_orientation: 'Inverted'
      });

      // Verify the calculation flow
      const expected_rise_to_bolts = 135;
      const expected_dim_d = expected_rise_to_bolts + 15; // 150

      console.log('Calculation Flow Verification:', {
        rise_to_bolts: result.rise_to_bolts,
        expected_rise_to_bolts: expected_rise_to_bolts,
        dim_d: result.dim_d,
        expected_dim_d: expected_dim_d,
        derivation: `${expected_rise_to_bolts} + 15 = ${expected_dim_d}`
      });

      expect(result.rise_to_bolts).toBe(expected_rise_to_bolts);
      expect(result.dim_d).toBe(expected_dim_d);

      console.log('✅ Correct derivation: Dim D from rise_to_bolts confirmed!');
    });
  });
});