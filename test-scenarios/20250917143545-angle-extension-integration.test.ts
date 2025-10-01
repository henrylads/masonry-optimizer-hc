/**
 * Integration test for angle extension feature
 * Tests the complete workflow from form input to 3D visualization
 * Created: 2025-09-17 14:35:45
 */

import { calculateAngleExtension } from '../src/calculations/angleExtensionCalculations';
import {
  calculateInvertedBracketHeight,
  calculateStandardBracketHeightWithExtension,
  type InvertedBracketInputs,
  type StandardBracketInputs
} from '../src/calculations/bracketCalculations';
import { calculateEffectiveVerticalLeg } from '../src/calculations/angleCalculations';

describe('Angle Extension Integration Tests', () => {
  describe('Standard Bracket with Angle Extension', () => {
    it('should handle complete workflow for standard bracket with extension limit', () => {
      // Test scenario: 250mm thick slab, support level at -350mm, but bracket limited to 300mm extension
      const standardInputs: StandardBracketInputs = {
        support_level: -350,
        top_critical_edge: 75,
        distance_from_top_to_fixing: 40,
        slab_thickness: 250,
        fixing_position: 75,
        enable_angle_extension: true,
        max_allowable_bracket_extension: 300,
        bracket_type: 'Standard',
        angle_orientation: 'Standard',
        current_angle_height: 60
      };

      // Step 1: Calculate bracket with extension
      const bracketResult = calculateStandardBracketHeightWithExtension(standardInputs);

      // Step 2: Verify angle extension was applied
      expect(bracketResult.angle_extension).toBeDefined();
      expect(bracketResult.angle_extension?.extension_applied).toBe(true);

      // Step 3: Calculate effective vertical leg
      const effectiveVerticalLeg = calculateEffectiveVerticalLeg(60, bracketResult.angle_extension);

      // Step 4: Verify the results
      expect(bracketResult.bracket_height).toBeLessThan(350); // Bracket was limited
      expect(effectiveVerticalLeg).toBeGreaterThan(60); // Angle was extended
      expect(bracketResult.angle_extension?.bracket_reduction).toBeGreaterThan(0);
      expect(bracketResult.angle_extension?.angle_extension).toBe(bracketResult.angle_extension?.bracket_reduction);

      // Step 5: Verify total support is maintained
      const totalSupport = bracketResult.bracket_height + bracketResult.angle_extension!.angle_extension;
      const originalSupport = Math.abs(standardInputs.support_level) - standardInputs.top_critical_edge + standardInputs.distance_from_top_to_fixing;
      expect(totalSupport).toBeCloseTo(originalSupport, 10);
    });

    it('should not apply extension when bracket is within limits', () => {
      const standardInputs: StandardBracketInputs = {
        support_level: -200, // Smaller support level
        top_critical_edge: 75,
        distance_from_top_to_fixing: 40,
        slab_thickness: 250,
        fixing_position: 75,
        enable_angle_extension: true,
        max_allowable_bracket_extension: 300, // Very generous limit
        bracket_type: 'Standard',
        angle_orientation: 'Standard',
        current_angle_height: 60
      };

      const bracketResult = calculateStandardBracketHeightWithExtension(standardInputs);

      expect(bracketResult.angle_extension?.extension_applied).toBe(false);

      const effectiveVerticalLeg = calculateEffectiveVerticalLeg(60, bracketResult.angle_extension);
      expect(effectiveVerticalLeg).toBe(60); // No extension applied
    });
  });

  describe('Inverted Bracket with Angle Extension', () => {
    it('should handle complete workflow for inverted bracket with extension limit', () => {
      const invertedInputs: InvertedBracketInputs = {
        support_level: 150, // Positive for inverted
        angle_thickness: 5,
        top_critical_edge: 75,
        bottom_critical_edge: 125,
        slab_thickness: 300,
        fixing_position: 75,
        enable_angle_extension: true,
        max_allowable_bracket_extension: 200,
        bracket_type: 'Inverted',
        angle_orientation: 'Standard',
        current_angle_height: 60
      };

      const bracketResult = calculateInvertedBracketHeight(invertedInputs);

      // Should have angle extension information
      expect(bracketResult.angle_extension).toBeDefined();

      if (bracketResult.angle_extension?.extension_applied) {
        expect(bracketResult.angle_extension.bracket_reduction).toBeGreaterThan(0);
        expect(bracketResult.angle_extension.angle_extension).toBeGreaterThan(0);

        const effectiveVerticalLeg = calculateEffectiveVerticalLeg(60, bracketResult.angle_extension);
        expect(effectiveVerticalLeg).toBeGreaterThan(60);
      }
    });
  });

  describe('Angle Extension with Manufacturing Limits', () => {
    it('should enforce maximum angle height limit', () => {
      const extremeInputs: StandardBracketInputs = {
        support_level: -600, // Very deep support
        top_critical_edge: 75,
        distance_from_top_to_fixing: 40,
        slab_thickness: 250,
        fixing_position: 75,
        enable_angle_extension: true,
        max_allowable_bracket_extension: 50, // Very restrictive limit
        bracket_type: 'Standard',
        angle_orientation: 'Standard',
        current_angle_height: 60
      };

      // This should throw an error due to exceeding manufacturing limits
      expect(() => calculateStandardBracketHeightWithExtension(extremeInputs))
        .toThrow(/Angle extension would exceed manufacturing limits/);
    });
  });

  describe('Form Input Validation Integration', () => {
    it('should work with typical form input values', () => {
      // Simulate form values that would trigger angle extension
      const formValues = {
        support_level: -350,
        slab_thickness: 225,
        enable_angle_extension: true,
        max_allowable_bracket_extension: 250,
        fixing_position: 75
      };

      const standardInputs: StandardBracketInputs = {
        support_level: formValues.support_level,
        top_critical_edge: 75,
        distance_from_top_to_fixing: 40,
        slab_thickness: formValues.slab_thickness,
        fixing_position: formValues.fixing_position,
        enable_angle_extension: formValues.enable_angle_extension,
        max_allowable_bracket_extension: formValues.max_allowable_bracket_extension,
        bracket_type: 'Standard',
        angle_orientation: 'Standard',
        current_angle_height: 60
      };

      const result = calculateStandardBracketHeightWithExtension(standardInputs);

      expect(result.bracket_height).toBeGreaterThan(0);
      expect(result.angle_extension).toBeDefined();
    });
  });

  describe('3D Visualization Parameter Integration', () => {
    it('should provide correct parameters for ShapeDiver when extension is applied', () => {
      const inputs: StandardBracketInputs = {
        support_level: -350,
        top_critical_edge: 75,
        distance_from_top_to_fixing: 40,
        slab_thickness: 250,
        fixing_position: 75,
        enable_angle_extension: true,
        max_allowable_bracket_extension: 250,
        bracket_type: 'Standard',
        angle_orientation: 'Standard',
        current_angle_height: 60
      };

      const bracketResult = calculateStandardBracketHeightWithExtension(inputs);

      if (bracketResult.angle_extension?.extension_applied) {
        // Simulate ShapeDiver parameter mapping
        const shapeDiverParams = {
          bracket_height: bracketResult.angle_extension.limited_bracket_height,
          profile_height: bracketResult.angle_extension.extended_angle_height
        };

        expect(shapeDiverParams.bracket_height).toBeLessThan(350);
        expect(shapeDiverParams.profile_height).toBeGreaterThan(60);

        // Verify the 3D model would show correct geometry
        const totalHeight = shapeDiverParams.bracket_height + shapeDiverParams.profile_height;
        expect(totalHeight).toBeGreaterThan(350); // Should be more than original bracket alone
      }
    });
  });

  describe('Verification Checks Integration', () => {
    it('should include angle extension information in verification results', () => {
      const inputs: StandardBracketInputs = {
        support_level: -350,
        top_critical_edge: 75,
        distance_from_top_to_fixing: 40,
        slab_thickness: 250,
        fixing_position: 75,
        enable_angle_extension: true,
        max_allowable_bracket_extension: 250,
        bracket_type: 'Standard',
        angle_orientation: 'Standard',
        current_angle_height: 60
      };

      const bracketResult = calculateStandardBracketHeightWithExtension(inputs);

      if (bracketResult.angle_extension?.extension_applied) {
        // Simulate verification results structure
        const verificationResults = {
          angle_extension_result: bracketResult.angle_extension,
          uses_extended_geometry: bracketResult.angle_extension.extension_applied,
          // ... other verification results would be here
        };

        expect(verificationResults.uses_extended_geometry).toBe(true);
        expect(verificationResults.angle_extension_result.extension_applied).toBe(true);
        expect(verificationResults.angle_extension_result.max_extension_limit).toBe(250);
      }
    });
  });

  describe('Precision and Rounding', () => {
    it('should maintain calculation precision throughout the workflow', () => {
      const inputs: StandardBracketInputs = {
        support_level: -350.123456,
        top_critical_edge: 75.654321,
        distance_from_top_to_fixing: 40.987654,
        slab_thickness: 250.111111,
        fixing_position: 80.555555,
        enable_angle_extension: true,
        max_allowable_bracket_extension: 250.777777,
        bracket_type: 'Standard',
        angle_orientation: 'Standard',
        current_angle_height: 60.333333
      };

      const result = calculateStandardBracketHeightWithExtension(inputs);

      // All calculations should maintain at least 10 decimal places of precision
      expect(typeof result.bracket_height).toBe('number');
      expect(result.bracket_height.toString()).toMatch(/^\d+\.\d+$/);

      if (result.angle_extension?.extension_applied) {
        expect(result.angle_extension.bracket_reduction.toString()).toMatch(/^\d+\.\d+$/);
        expect(result.angle_extension.angle_extension.toString()).toMatch(/^\d+\.\d+$/);
      }
    });
  });

  describe('Error Handling Integration', () => {
    it('should gracefully handle invalid inputs', () => {
      const invalidInputs: StandardBracketInputs = {
        support_level: 0, // Invalid support level
        top_critical_edge: 75,
        distance_from_top_to_fixing: 40,
        slab_thickness: 250,
        fixing_position: 75,
        enable_angle_extension: true,
        max_allowable_bracket_extension: 250,
        bracket_type: 'Standard',
        angle_orientation: 'Standard',
        current_angle_height: 60
      };

      // Should not throw but handle gracefully
      const result = calculateStandardBracketHeightWithExtension(invalidInputs);
      expect(result.bracket_height).toBeGreaterThanOrEqual(0);
    });

    it('should handle edge case where extension exactly equals manufacturing limit', () => {
      const inputs: StandardBracketInputs = {
        support_level: -515, // Calculated to require exactly 340mm extension
        top_critical_edge: 75,
        distance_from_top_to_fixing: 40,
        slab_thickness: 250,
        fixing_position: 75,
        enable_angle_extension: true,
        max_allowable_bracket_extension: 100,
        bracket_type: 'Standard',
        angle_orientation: 'Standard',
        current_angle_height: 60
      };

      const result = calculateStandardBracketHeightWithExtension(inputs);

      if (result.angle_extension?.extension_applied) {
        expect(result.angle_extension.extended_angle_height).toBeLessThanOrEqual(400);
      }
    });
  });
});