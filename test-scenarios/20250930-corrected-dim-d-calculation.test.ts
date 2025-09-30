/**
 * Corrected Dim D Calculation Test
 *
 * Tests the corrected inverted bracket calculation where Dim D is calculated
 * based on geometry requirements rather than being a fixed input parameter.
 *
 * Created: September 30, 2025
 * Purpose: Validate the corrected calculation approach
 */

import { calculateInvertedBracketHeight, type InvertedBracketInputs } from '../src/calculations/bracketCalculations';

describe('Corrected Dim D Calculation Logic', () => {

  describe('1. User Example Validation', () => {
    test('should match user example: 0mm support, 225mm slab, 75mm fixing → Dim D=150mm', () => {
      const userExample: InvertedBracketInputs = {
        support_level: 0,           // Angle at slab level (SSL = BSL)
        angle_thickness: 5,         // 5mm angle thickness
        top_critical_edge: 75,      // Standard top edge
        bottom_critical_edge: 150,  // Standard for 225mm slab
        fixing_position: 75,        // 75mm from top of slab (key requirement)
        slab_thickness: 225,        // 225mm slab
        current_angle_height: 60    // Standard 60mm angle height
      };

      console.log('🧪 Testing User Example (Corrected Logic):');
      console.log('Expected: Dim D = 150mm, Bracket Height = 225mm');

      const result = calculateInvertedBracketHeight(userExample);

      console.log('Results:', {
        dim_d: result.dim_d,
        bracket_height: result.bracket_height,
        rise_to_bolts: result.rise_to_bolts,
        extension_below_slab: result.extension_below_slab
      });

      // Main validation: Dim D should be 150mm
      expect(result.dim_d).toBe(150);

      // Bracket height should be 225mm (minimum needed)
      expect(result.bracket_height).toBe(225);

      // Rise to bolts should be 135mm (150 - 15 worst case)
      expect(result.rise_to_bolts).toBe(135);

      // Extension below slab should be 0 (bracket fits in slab)
      expect(result.extension_below_slab).toBe(0);

      console.log('✅ User example validated with corrected logic!');
    });
  });

  describe('2. Geometry-First Calculation Method', () => {
    test('should calculate minimum bracket height based on support level', () => {
      const testCases = [
        { support_level: 0, slab_thickness: 225, expected_min_height: 225 },
        { support_level: 50, slab_thickness: 225, expected_min_height: 275 },
        { support_level: -50, slab_thickness: 225, expected_min_height: 225 }, // Negative ignored
        { support_level: 100, slab_thickness: 300, expected_min_height: 400 }
      ];

      testCases.forEach(({ support_level, slab_thickness, expected_min_height }) => {
        const inputs: InvertedBracketInputs = {
          support_level,
          angle_thickness: 5,
          top_critical_edge: 75,
          bottom_critical_edge: 150,
          fixing_position: 75,
          slab_thickness,
          current_angle_height: 60
        };

        const result = calculateInvertedBracketHeight(inputs);

        console.log(`Support Level ${support_level}mm → Min Height ${expected_min_height}mm → Got ${result.bracket_height}mm`);

        // Bracket height should be at least the minimum (could be extended for Dim D constraints)
        expect(result.bracket_height).toBeGreaterThanOrEqual(expected_min_height);
      });
    });

    test('should calculate Dim D from bracket height and fixing position', () => {
      const inputs: InvertedBracketInputs = {
        support_level: 0,
        angle_thickness: 5,
        top_critical_edge: 75,
        bottom_critical_edge: 150,
        fixing_position: 100,       // Different fixing position
        slab_thickness: 225,
        current_angle_height: 60
      };

      const result = calculateInvertedBracketHeight(inputs);

      // Expected: min_height = 225, fixing = 100, so Dim D = 225 - 100 = 125
      // But 125 < 130 (min), so Dim D = 130, bracket extended to 230
      expect(result.dim_d).toBe(130);  // Minimum constraint applied
      expect(result.bracket_height).toBe(230);  // Extended by 5mm
      expect(result.rise_to_bolts).toBe(115);  // 130 - 15

      console.log('Dim D constraint handling validated:', {
        calculated_dim_d: 225 - 100,
        final_dim_d: result.dim_d,
        bracket_extension: result.bracket_height - 225
      });
    });
  });

  describe('3. Dim D Constraint Handling', () => {
    test('should extend bracket when required Dim D is below minimum (130mm)', () => {
      const inputs: InvertedBracketInputs = {
        support_level: 0,
        angle_thickness: 5,
        top_critical_edge: 75,
        bottom_critical_edge: 150,
        fixing_position: 110,       // Deep fixing → small Dim D
        slab_thickness: 225,
        current_angle_height: 60
      };

      const result = calculateInvertedBracketHeight(inputs);

      // Required Dim D = 225 - 110 = 115mm, which is < 130mm
      // Should clamp to 130mm and extend bracket by 15mm
      expect(result.dim_d).toBe(130);
      expect(result.bracket_height).toBe(240);  // 225 + 15
      expect(result.extension_below_slab).toBe(15);  // 240 - 225

      console.log('Below minimum constraint:', {
        required_dim_d: 225 - 110,
        final_dim_d: result.dim_d,
        bracket_extension: 15,
        final_height: result.bracket_height
      });
    });

    test('should extend bracket when required Dim D exceeds maximum (450mm)', () => {
      const inputs: InvertedBracketInputs = {
        support_level: 200,         // Large support level
        angle_thickness: 5,
        top_critical_edge: 75,
        bottom_critical_edge: 150,
        fixing_position: 50,        // Shallow fixing → large Dim D
        slab_thickness: 225,
        current_angle_height: 60
      };

      const result = calculateInvertedBracketHeight(inputs);

      // Required bracket height = 225 + 200 = 425mm
      // Required Dim D = 425 - 50 = 375mm (within limits)
      expect(result.dim_d).toBe(375);
      expect(result.bracket_height).toBe(425);

      console.log('Within maximum constraint:', {
        min_bracket_height: 425,
        required_dim_d: 375,
        final_dim_d: result.dim_d
      });

      // Test with even larger requirement
      const extremeInputs: InvertedBracketInputs = {
        ...inputs,
        support_level: 300,
        fixing_position: 25
      };

      const extremeResult = calculateInvertedBracketHeight(extremeInputs);

      // Required height = 225 + 300 = 525mm
      // Required Dim D = 525 - 25 = 500mm > 450mm
      // Should clamp to 450mm and extend bracket by 50mm
      expect(extremeResult.dim_d).toBe(450);
      expect(extremeResult.bracket_height).toBe(575);  // 525 + 50

      console.log('Above maximum constraint:', {
        required_dim_d: 500,
        final_dim_d: extremeResult.dim_d,
        bracket_extension: 50,
        final_height: extremeResult.bracket_height
      });
    });

    test('should use calculated Dim D when within constraints', () => {
      const inputs: InvertedBracketInputs = {
        support_level: 50,
        angle_thickness: 5,
        top_critical_edge: 75,
        bottom_critical_edge: 150,
        fixing_position: 75,
        slab_thickness: 225,
        current_angle_height: 60
      };

      const result = calculateInvertedBracketHeight(inputs);

      // Min height = 225 + 50 = 275mm
      // Required Dim D = 275 - 75 = 200mm (within 130-450 range)
      expect(result.dim_d).toBe(200);
      expect(result.bracket_height).toBe(275);
      expect(result.rise_to_bolts).toBe(185);  // 200 - 15

      console.log('Within constraints - no extension needed:', {
        min_height: 275,
        required_dim_d: 200,
        final_values: {
          dim_d: result.dim_d,
          bracket_height: result.bracket_height
        }
      });
    });
  });

  describe('4. Integration with Different Support Levels', () => {
    test('should handle various support levels correctly', () => {
      const testCases = [
        { support_level: -25, expected_note: 'below slab top' },
        { support_level: 0, expected_note: 'at slab level' },
        { support_level: 25, expected_note: 'above slab' },
        { support_level: 100, expected_note: 'well above slab' }
      ];

      testCases.forEach(({ support_level, expected_note }) => {
        const inputs: InvertedBracketInputs = {
          support_level,
          angle_thickness: 5,
          top_critical_edge: 75,
          bottom_critical_edge: 150,
          fixing_position: 75,
          slab_thickness: 225,
          current_angle_height: 60
        };

        const result = calculateInvertedBracketHeight(inputs);

        console.log(`Support Level ${support_level}mm (${expected_note}):`, {
          bracket_height: result.bracket_height,
          dim_d: result.dim_d,
          extension_below_slab: result.extension_below_slab
        });

        // All should have valid Dim D within constraints
        expect(result.dim_d).toBeGreaterThanOrEqual(130);
        expect(result.dim_d).toBeLessThanOrEqual(450);

        // Rise to bolts should always be Dim D - 15
        expect(result.rise_to_bolts).toBe(result.dim_d - 15);
      });
    });
  });

  describe('5. Backwards Compatibility', () => {
    test('should ignore input dim_d parameter (for backwards compatibility)', () => {
      const inputs: InvertedBracketInputs = {
        support_level: 0,
        angle_thickness: 5,
        top_critical_edge: 75,
        bottom_critical_edge: 150,
        fixing_position: 75,
        slab_thickness: 225,
        current_angle_height: 60,
        dim_d: 999  // This should be ignored in favor of calculated value
      };

      const result = calculateInvertedBracketHeight(inputs);

      // Should calculate Dim D = 225 - 75 = 150, ignoring the input value of 999
      expect(result.dim_d).toBe(150);
      expect(result.bracket_height).toBe(225);

      console.log('Input dim_d ignored:', {
        input_dim_d: inputs.dim_d,
        calculated_dim_d: result.dim_d,
        note: 'Input value ignored in favor of geometry-based calculation'
      });
    });
  });
});