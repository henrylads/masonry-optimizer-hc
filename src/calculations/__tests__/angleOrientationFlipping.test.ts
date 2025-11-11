import { calculateInvertedBracketHeight, calculateStandardBracketHeightWithExtension } from '../bracketCalculations';
import { shouldFlipAngleOrientation, calculateOptimalAngleOrientation } from '../angleOrientationOptimization';

describe('Angle Orientation Flipping Tests', () => {

  describe('shouldFlipAngleOrientation', () => {
    test('should flip inverted bracket with standard angle when extension needed', () => {
      const result = shouldFlipAngleOrientation('Inverted', 'Standard', 100);
      expect(result).toBe(true);
    });

    test('should not flip inverted bracket with standard angle when no extension needed', () => {
      const result = shouldFlipAngleOrientation('Inverted', 'Standard', 0);
      expect(result).toBe(false);
    });

    test('should not flip inverted bracket with inverted angle', () => {
      const result = shouldFlipAngleOrientation('Inverted', 'Inverted', 100);
      expect(result).toBe(false);
    });

    test('should not flip standard bracket with any angle orientation', () => {
      expect(shouldFlipAngleOrientation('Standard', 'Standard', 100)).toBe(false);
      expect(shouldFlipAngleOrientation('Standard', 'Inverted', 100)).toBe(false);
    });
  });

  describe('calculateOptimalAngleOrientation', () => {
    test('should flip orientation for inverted bracket with standard angle', () => {
      const result = calculateOptimalAngleOrientation('Inverted', 'Standard', 150);

      expect(result.final_orientation).toBe('Inverted');
      expect(result.orientation_flipped).toBe(true);
      expect(result.flip_reason).toContain('fixing point misalignment');
    });

    test('should not flip orientation when no extension needed', () => {
      const result = calculateOptimalAngleOrientation('Inverted', 'Standard', 0);

      expect(result.final_orientation).toBe('Standard');
      expect(result.orientation_flipped).toBe(false);
      expect(result.flip_reason).toBeUndefined();
    });

    test('should not flip already inverted angle orientation', () => {
      const result = calculateOptimalAngleOrientation('Inverted', 'Inverted', 150);

      expect(result.final_orientation).toBe('Inverted');
      expect(result.orientation_flipped).toBe(false);
      expect(result.flip_reason).toBeUndefined();
    });
  });

  describe('Inverted Bracket Integration Tests', () => {
    const baseInvertedInputs = {
      support_level: 300,
      angle_thickness: 5,
      top_critical_edge: 75,
      bottom_critical_edge: 125,
      slab_thickness: 225,
      current_angle_height: 60,
      enable_angle_extension: true,
      max_allowable_bracket_extension: -350 // Tight exclusion zone to trigger extension
    };

    test('inverted bracket with standard angle should auto-flip to inverted angle', () => {
      console.log('\\n=== TEST: Inverted Bracket + Standard Angle (Should Flip) ===');

      const inputs = {
        ...baseInvertedInputs,
        bracket_type: 'Inverted' as const,
        angle_orientation: 'Standard' as const
      };

      const results = calculateInvertedBracketHeight(inputs);

      console.log('Results:');
      console.log('  Angle orientation flipped:', results.angle_extension?.angle_orientation_flipped);
      console.log('  Original orientation:', results.angle_extension?.original_angle_orientation);
      console.log('  Final orientation:', results.angle_extension?.final_angle_orientation);
      console.log('  Flip reason:', results.angle_extension?.flip_reason);

      // Should have extension applied
      expect(results.angle_extension?.extension_applied).toBe(true);

      // Should have flipped orientation
      expect(results.angle_extension?.angle_orientation_flipped).toBe(true);
      expect(results.angle_extension?.original_angle_orientation).toBe('Standard');
      expect(results.angle_extension?.final_angle_orientation).toBe('Inverted');
      expect(results.angle_extension?.flip_reason).toContain('fixing point misalignment');

      // Should still provide angle extension
      expect(results.angle_extension?.angle_extension).toBeGreaterThan(0);
    });

    test('inverted bracket with inverted angle should not flip', () => {
      console.log('\\n=== TEST: Inverted Bracket + Inverted Angle (Should Not Flip) ===');

      const inputs = {
        ...baseInvertedInputs,
        bracket_type: 'Inverted' as const,
        angle_orientation: 'Inverted' as const
      };

      const results = calculateInvertedBracketHeight(inputs);

      console.log('Results:');
      console.log('  Angle orientation flipped:', results.angle_extension?.angle_orientation_flipped);
      console.log('  Original orientation:', results.angle_extension?.original_angle_orientation);
      console.log('  Final orientation:', results.angle_extension?.final_angle_orientation);

      // Should have extension applied
      expect(results.angle_extension?.extension_applied).toBe(true);

      // Should NOT have flipped orientation (already optimal)
      expect(results.angle_extension?.angle_orientation_flipped).toBe(false);
      expect(results.angle_extension?.original_angle_orientation).toBe('Inverted');
      expect(results.angle_extension?.final_angle_orientation).toBe('Inverted');
      expect(results.angle_extension?.flip_reason).toBeUndefined();

      // Should still provide angle extension
      expect(results.angle_extension?.angle_extension).toBeGreaterThan(0);
    });

    test('inverted bracket with no exclusion zone should not flip', () => {
      console.log('\\n=== TEST: Inverted Bracket + No Exclusion Zone (Should Not Flip) ===');

      const inputs = {
        ...baseInvertedInputs,
        bracket_type: 'Inverted' as const,
        angle_orientation: 'Standard' as const,
        enable_angle_extension: false,
        max_allowable_bracket_extension: null
      };

      const results = calculateInvertedBracketHeight(inputs);

      console.log('Results:');
      console.log('  Extension applied:', results.angle_extension?.extension_applied || false);
      console.log('  Angle orientation flipped:', results.angle_extension?.angle_orientation_flipped || false);

      // Should NOT have extension applied (no exclusion zone)
      expect(results.angle_extension?.extension_applied || false).toBe(false);

      // Should NOT have flipped orientation (no extension needed)
      expect(results.angle_extension?.angle_orientation_flipped || false).toBe(false);
    });
  });

  describe('Standard Bracket Integration Tests', () => {
    const baseStandardInputs = {
      support_level: -400,
      top_critical_edge: 75,
      distance_from_top_to_fixing: 40,
      slab_thickness: 225,
      current_angle_height: 60,
      enable_angle_extension: true,
      max_allowable_bracket_extension: -300 // Exclusion zone to trigger extension
    };

    test('standard bracket should never flip angle orientation', () => {
      console.log('\\n=== TEST: Standard Bracket (Should Never Flip) ===');

      const inputs = {
        ...baseStandardInputs,
        bracket_type: 'Standard' as const,
        angle_orientation: 'Standard' as const
      };

      const results = calculateStandardBracketHeightWithExtension(inputs);

      console.log('Results:');
      console.log('  Extension applied:', results.angle_extension?.extension_applied);
      console.log('  Angle orientation flipped:', results.angle_extension?.angle_orientation_flipped);
      console.log('  Original orientation:', results.angle_extension?.original_angle_orientation);
      console.log('  Final orientation:', results.angle_extension?.final_angle_orientation);

      // Should have extension applied (due to exclusion zone)
      expect(results.angle_extension?.extension_applied).toBe(true);

      // Should NOT flip orientation (standard brackets never flip)
      expect(results.angle_extension?.angle_orientation_flipped).toBe(false);
      expect(results.angle_extension?.original_angle_orientation).toBe('Standard');
      expect(results.angle_extension?.final_angle_orientation).toBe('Standard');
      expect(results.angle_extension?.flip_reason).toBeUndefined();

      // Should still provide angle extension
      expect(results.angle_extension?.angle_extension).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    test('should handle negative extension values gracefully', () => {
      const result = shouldFlipAngleOrientation('Inverted', 'Standard', -10);
      expect(result).toBe(false);
    });

    test('should handle zero extension values', () => {
      const result = shouldFlipAngleOrientation('Inverted', 'Standard', 0);
      expect(result).toBe(false);
    });

    test('should handle very small positive extension values', () => {
      const result = shouldFlipAngleOrientation('Inverted', 'Standard', 0.1);
      expect(result).toBe(true);
    });
  });
});