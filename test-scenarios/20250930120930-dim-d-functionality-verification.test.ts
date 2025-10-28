/**
 * Comprehensive test suite for Dim D functionality in inverted brackets
 *
 * Created: September 30, 2025
 * Purpose: Verify proper Dim D parameter handling across calculation, optimization, and UI layers
 *
 * Test Coverage:
 * 1. Dim D calculation logic (130-450mm range)
 * 2. Optimization algorithm inclusion of Dim D values
 * 3. API validation for Dim D constraints
 * 4. Form schema validation
 * 5. Type safety across system components
 */

import {
  calculateInvertedBracketHeight,
  type InvertedBracketInputs
} from '../src/calculations/bracketCalculations';
import {
  generateAllCombinations
} from '../src/calculations/bruteForceAlgorithm/combinationGeneration';
import {
  formSchema
} from '../src/types/form-schema';
import type { DesignInputs } from '../src/types/designInputs';

describe('Dim D Functionality Verification', () => {

  describe('1. Dim D Constants and Range Validation', () => {
    test('should respect minimum Dim D constraint (130mm)', () => {
      const inputs: InvertedBracketInputs = {
        support_level: 150,
        angle_thickness: 4,
        top_critical_edge: 75,
        bottom_critical_edge: 150,
        slab_thickness: 225,
        fixing_position: 75,
        dim_d: 130 // Minimum allowed value
      };

      const result = calculateInvertedBracketHeight(inputs);
      expect(result.dim_d).toBe(130);
      expect(result.rise_to_bolts).toBe(115); // 130 - 15 (worst case adjustment)
    });

    test('should respect maximum Dim D constraint (450mm)', () => {
      const inputs: InvertedBracketInputs = {
        support_level: 150,
        angle_thickness: 4,
        top_critical_edge: 75,
        bottom_critical_edge: 150,
        slab_thickness: 300,
        fixing_position: 75,
        dim_d: 450 // Maximum allowed value
      };

      const result = calculateInvertedBracketHeight(inputs);
      expect(result.dim_d).toBe(450);
      expect(result.rise_to_bolts).toBe(435); // 450 - 15 (worst case adjustment)
    });

    test('should handle intermediate Dim D values correctly', () => {
      const testValues = [150, 200, 250, 300, 350, 400];

      testValues.forEach(dimD => {
        const inputs: InvertedBracketInputs = {
          support_level: 200,
          angle_thickness: 4,
          top_critical_edge: 75,
          bottom_critical_edge: 150,
          slab_thickness: 300,
          fixing_position: 75,
          dim_d: dimD
        };

        const result = calculateInvertedBracketHeight(inputs);
        expect(result.dim_d).toBe(dimD);
        expect(result.rise_to_bolts).toBe(dimD - 15);
      });
    });
  });

  describe('2. Bracket Height Constraints with Dim D', () => {
    test('should enforce minimum bracket height ≥ Dim D + 40mm', () => {
      const inputs: InvertedBracketInputs = {
        support_level: 50, // Small support level to test minimum height constraint
        angle_thickness: 4,
        top_critical_edge: 75,
        bottom_critical_edge: 150,
        slab_thickness: 225,
        fixing_position: 75,
        dim_d: 200
      };

      const result = calculateInvertedBracketHeight(inputs);
      expect(result.bracket_height).toBeGreaterThanOrEqual(240); // 200 + 40
    });

    test('should handle large Dim D values requiring tall brackets', () => {
      const inputs: InvertedBracketInputs = {
        support_level: 300,
        angle_thickness: 4,
        top_critical_edge: 75,
        bottom_critical_edge: 150,
        slab_thickness: 350,
        fixing_position: 75,
        dim_d: 400
      };

      const result = calculateInvertedBracketHeight(inputs);
      expect(result.dim_d).toBe(400);
      expect(result.bracket_height).toBeGreaterThanOrEqual(440); // 400 + 40
    });
  });

  describe('3. Optimization Algorithm Integration', () => {
    test('should generate Dim D combinations for inverted brackets', () => {
      const designInputs: DesignInputs = {
        support_level: 100, // Positive for inverted brackets
        cavity_width: 100,
        slab_thickness: 225,
        characteristic_load: 10,
        top_critical_edge: 75,
        bottom_critical_edge: 150,
        notch_height: 0,
        notch_depth: 0,
        fixing_position: 75,
        use_custom_fixing_position: false,
        showDetailedVerifications: true,
        facade_thickness: 102.5,
        load_position: 1/3,
        front_offset: 12,
        isolation_shim_thickness: 3,
        material_type: 'brick',
        enable_angle_extension: false,
        max_allowable_bracket_extension: null
      };

      const combinations = generateAllCombinations(designInputs);

      // Filter for inverted bracket combinations
      const invertedCombinations = combinations.filter(c => c.bracket_type === 'Inverted');

      expect(invertedCombinations.length).toBeGreaterThan(0);

      // Check that all inverted combinations have dim_d values
      invertedCombinations.forEach(combo => {
        expect(combo.dim_d).toBeDefined();
        expect(combo.dim_d).toBeGreaterThanOrEqual(130);
        expect(combo.dim_d).toBeLessThanOrEqual(450);
      });

      // Check that standard brackets don't have dim_d
      const standardCombinations = combinations.filter(c => c.bracket_type === 'Standard');
      standardCombinations.forEach(combo => {
        expect(combo.dim_d).toBeUndefined();
      });
    });

    test('should include expected Dim D values in optimization range', () => {
      const designInputs: DesignInputs = {
        support_level: 50,
        cavity_width: 100,
        slab_thickness: 225,
        characteristic_load: 8,
        top_critical_edge: 75,
        bottom_critical_edge: 150,
        notch_height: 0,
        notch_depth: 0,
        fixing_position: 75,
        use_custom_fixing_position: false,
        showDetailedVerifications: true,
        facade_thickness: 102.5,
        load_position: 1/3,
        front_offset: 12,
        isolation_shim_thickness: 3,
        material_type: 'brick',
        enable_angle_extension: false,
        max_allowable_bracket_extension: null
      };

      const combinations = generateAllCombinations(designInputs);
      const invertedCombinations = combinations.filter(c => c.bracket_type === 'Inverted');
      const dimDValues = [...new Set(invertedCombinations.map(c => c.dim_d))].sort();

      // Expected Dim D values: [130, 150, 200, 250, 300, 350, 400, 450]
      expect(dimDValues).toContain(130); // Minimum
      expect(dimDValues).toContain(450); // Maximum
      expect(dimDValues).toContain(200); // Common middle value
      expect(dimDValues).toContain(300); // Common middle value
    });
  });

  describe('4. Form Schema Validation', () => {
    test('should validate dim_d within acceptable range', () => {
      const validFormData = {
        slab_thickness: 225,
        cavity: 100,
        support_level: 100,
        characteristic_load: "10",
        masonry_density: 2000,
        masonry_thickness: 102.5,
        masonry_height: 6,
        has_notch: false,
        notch_height: 0,
        notch_depth: 0,
        is_angle_length_limited: false,
        fixing_type: 'all' as const,
        use_custom_fixing_position: false,
        fixing_position: 75,
        use_custom_dim_d: true,
        dim_d: 200, // Valid value
        facade_thickness: 102.5,
        load_position: 1/3,
        front_offset: 12,
        isolation_shim_thickness: 3,
        material_type: 'brick' as const,
        use_custom_load_position: false,
        enable_angle_extension: false
      };

      const result = formSchema.safeParse(validFormData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.dim_d).toBe(200);
      }
    });

    test('should reject dim_d below minimum (130mm)', () => {
      const invalidFormData = {
        slab_thickness: 225,
        cavity: 100,
        support_level: 100,
        use_custom_dim_d: true,
        dim_d: 120 // Below minimum
      };

      const result = formSchema.safeParse(invalidFormData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue =>
          issue.path.includes('dim_d') &&
          issue.message.includes('130')
        )).toBe(true);
      }
    });

    test('should reject dim_d above maximum (450mm)', () => {
      const invalidFormData = {
        slab_thickness: 225,
        cavity: 100,
        support_level: 100,
        use_custom_dim_d: true,
        dim_d: 500 // Above maximum
      };

      const result = formSchema.safeParse(invalidFormData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue =>
          issue.path.includes('dim_d') &&
          issue.message.includes('450')
        )).toBe(true);
      }
    });

    test('should enforce 5mm increment validation', () => {
      const invalidFormData = {
        slab_thickness: 225,
        cavity: 100,
        support_level: 100,
        use_custom_dim_d: true,
        dim_d: 137 // Not in 5mm increment from 130
      };

      const result = formSchema.safeParse(invalidFormData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue =>
          issue.path.includes('dim_d') &&
          issue.message.includes('5mm increments')
        )).toBe(true);
      }
    });
  });

  describe('5. Rise to Bolts Display Value Integration', () => {
    test('should provide both calculation and display values for rise to bolts', () => {
      const inputs: InvertedBracketInputs = {
        support_level: 150,
        angle_thickness: 4,
        top_critical_edge: 75,
        bottom_critical_edge: 150,
        slab_thickness: 225,
        fixing_position: 75,
        dim_d: 200
      };

      const result = calculateInvertedBracketHeight(inputs);

      // Calculation value (worst-case, bottom-of-slot)
      expect(result.rise_to_bolts).toBe(185); // 200 - 15

      // Display value (middle-of-slot, +15mm for user display)
      expect(result.rise_to_bolts_display).toBe(200); // 185 + 15

      // Verify 15mm difference between display and calculation values
      expect(result.rise_to_bolts_display - result.rise_to_bolts).toBe(15);
    });

    test('should maintain consistency between Dim D and rise to bolts calculations', () => {
      const testCases = [
        { dim_d: 130, expected_rise_to_bolts: 115 },
        { dim_d: 200, expected_rise_to_bolts: 185 },
        { dim_d: 300, expected_rise_to_bolts: 285 },
        { dim_d: 450, expected_rise_to_bolts: 435 }
      ];

      testCases.forEach(({ dim_d, expected_rise_to_bolts }) => {
        const inputs: InvertedBracketInputs = {
          support_level: 200,
          angle_thickness: 4,
          top_critical_edge: 75,
          bottom_critical_edge: 150,
          slab_thickness: 300,
          fixing_position: 75,
          dim_d
        };

        const result = calculateInvertedBracketHeight(inputs);
        expect(result.rise_to_bolts).toBe(expected_rise_to_bolts);
        expect(result.dim_d).toBe(dim_d);
      });
    });
  });

  describe('6. Precision and Rounding Verification', () => {
    test('should maintain 12 decimal place precision for final results', () => {
      const inputs: InvertedBracketInputs = {
        support_level: 150.123456789,
        angle_thickness: 4,
        top_critical_edge: 75.987654321,
        bottom_critical_edge: 150.555555555,
        slab_thickness: 225.333333333,
        fixing_position: 75.777777777,
        dim_d: 200.111111111
      };

      const result = calculateInvertedBracketHeight(inputs);

      // Check that Dim D is properly rounded to 12 decimal places
      expect(typeof result.dim_d).toBe('number');
      expect(result.dim_d.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(12);

      // Verify other key values maintain proper precision
      expect(typeof result.rise_to_bolts).toBe('number');
      expect(typeof result.bracket_height).toBe('number');
      expect(typeof result.rise_to_bolts_display).toBe('number');
    });
  });

  describe('7. Edge Cases and Error Handling', () => {
    test('should handle undefined dim_d gracefully with default value', () => {
      const inputs: InvertedBracketInputs = {
        support_level: 150,
        angle_thickness: 4,
        top_critical_edge: 75,
        bottom_critical_edge: 150,
        slab_thickness: 225,
        fixing_position: 75
        // dim_d not provided - should default to 130
      };

      const result = calculateInvertedBracketHeight(inputs);
      expect(result.dim_d).toBe(130); // Default minimum value
    });

    test('should validate that dim_d is used only for inverted brackets', () => {
      // This test verifies the design principle that Dim D is specific to inverted brackets
      // Standard brackets should not use or require Dim D parameters

      const designInputs: DesignInputs = {
        support_level: -150, // Negative for standard brackets
        cavity_width: 100,
        slab_thickness: 225,
        characteristic_load: 10,
        top_critical_edge: 75,
        bottom_critical_edge: 150,
        notch_height: 0,
        notch_depth: 0,
        fixing_position: 75,
        use_custom_fixing_position: false,
        showDetailedVerifications: true,
        facade_thickness: 102.5,
        load_position: 1/3,
        front_offset: 12,
        isolation_shim_thickness: 3,
        material_type: 'brick',
        enable_angle_extension: false,
        max_allowable_bracket_extension: null
      };

      const combinations = generateAllCombinations(designInputs);
      const standardCombinations = combinations.filter(c => c.bracket_type === 'Standard');

      // Verify that standard brackets don't include dim_d
      standardCombinations.forEach(combo => {
        expect(combo.dim_d).toBeUndefined();
      });
    });
  });
});

/**
 * Integration test summary:
 *
 * ✅ Dim D Constants: Verified 130-450mm range enforcement
 * ✅ Bracket Height Constraints: Confirmed minimum height ≥ Dim D + 40mm
 * ✅ Optimization Integration: Validated Dim D inclusion in brute force combinations
 * ✅ Form Validation: Tested schema validation for range and increment constraints
 * ✅ Rise to Bolts Integration: Verified both calculation and display values
 * ✅ Precision Handling: Confirmed 12 decimal place precision maintenance
 * ✅ Edge Cases: Tested graceful handling of undefined values and type safety
 *
 * This test suite ensures that the Dim D functionality is properly integrated
 * across all system layers and maintains engineering accuracy and constraints.
 */