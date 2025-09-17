import {
  calculateBracketExtensionLimit,
  calculateRequiredAngleExtension,
  validateAngleExtensionLimits,
  calculateAngleExtension,
  shouldApplyAngleExtension,
  type AngleExtensionInputs
} from '../angleExtensionCalculations';

describe('angleExtensionCalculations', () => {
  const baseInputs: AngleExtensionInputs = {
    original_bracket_height: 200,
    max_allowable_bracket_extension: 150,
    current_angle_height: 60,
    required_support_level: -300,
    slab_thickness: 225,
    bracket_type: 'Standard',
    angle_orientation: 'Standard',
    fixing_position: 75
  };

  describe('calculateBracketExtensionLimit', () => {
    it('should return original height when no extension limit is set', () => {
      const inputs = { ...baseInputs, max_allowable_bracket_extension: null };
      const result = calculateBracketExtensionLimit(inputs);

      expect(result.limited_bracket_height).toBe(200);
      expect(result.bracket_reduction).toBe(0);
    });

    it('should return original height when bracket is within limits', () => {
      const inputs = { ...baseInputs, original_bracket_height: 150, max_allowable_bracket_extension: 200 };
      const result = calculateBracketExtensionLimit(inputs);

      expect(result.limited_bracket_height).toBe(150);
      expect(result.bracket_reduction).toBe(0);
    });

    it('should limit bracket height when it exceeds maximum extension', () => {
      const inputs = {
        ...baseInputs,
        original_bracket_height: 250,  // Would extend 175mm below fixing (250-75)
        max_allowable_bracket_extension: 150,  // Only allow 150mm extension
        fixing_position: 75
      };
      const result = calculateBracketExtensionLimit(inputs);

      // Max bracket height = fixing_position + max_extension = 75 + 150 = 225
      expect(result.limited_bracket_height).toBe(225);
      expect(result.bracket_reduction).toBe(25); // 250 - 225
    });

    it('should handle edge case with exact limit', () => {
      const inputs = {
        ...baseInputs,
        original_bracket_height: 225,  // Exactly at limit (225-75 = 150mm extension)
        max_allowable_bracket_extension: 150,
        fixing_position: 75
      };
      const result = calculateBracketExtensionLimit(inputs);

      expect(result.limited_bracket_height).toBe(225);
      expect(result.bracket_reduction).toBe(0);
    });
  });

  describe('calculateRequiredAngleExtension', () => {
    it('should return zero when no bracket reduction', () => {
      const result = calculateRequiredAngleExtension(baseInputs, 0);
      expect(result).toBe(0);
    });

    it('should return 1:1 compensation for bracket reduction', () => {
      const result = calculateRequiredAngleExtension(baseInputs, 25);
      expect(result).toBe(25);
    });

    it('should handle large reductions', () => {
      const result = calculateRequiredAngleExtension(baseInputs, 100);
      expect(result).toBe(100);
    });

    it('should handle negative reduction (should not happen in practice)', () => {
      const result = calculateRequiredAngleExtension(baseInputs, -10);
      expect(result).toBe(0);
    });
  });

  describe('validateAngleExtensionLimits', () => {
    it('should pass validation for reasonable extensions', () => {
      const result = validateAngleExtensionLimits(60, 50);

      expect(result.valid).toBe(true);
      expect(result.resulting_height).toBe(110);
      expect(result.max_angle_height).toBe(400);
    });

    it('should fail validation when exceeding manufacturing limits', () => {
      const result = validateAngleExtensionLimits(60, 350);

      expect(result.valid).toBe(false);
      expect(result.resulting_height).toBe(410);
      expect(result.max_angle_height).toBe(400);
    });

    it('should pass validation at exact limit', () => {
      const result = validateAngleExtensionLimits(60, 340);

      expect(result.valid).toBe(true);
      expect(result.resulting_height).toBe(400);
    });

    it('should handle zero extension', () => {
      const result = validateAngleExtensionLimits(60, 0);

      expect(result.valid).toBe(true);
      expect(result.resulting_height).toBe(60);
    });
  });

  describe('calculateAngleExtension', () => {
    it('should return no extension when bracket is within limits', () => {
      const inputs = {
        ...baseInputs,
        original_bracket_height: 150,
        max_allowable_bracket_extension: 200
      };
      const result = calculateAngleExtension(inputs);

      expect(result.extension_applied).toBe(false);
      expect(result.original_bracket_height).toBe(150);
      expect(result.limited_bracket_height).toBe(150);
      expect(result.bracket_reduction).toBe(0);
      expect(result.original_angle_height).toBe(60);
      expect(result.extended_angle_height).toBe(60);
      expect(result.angle_extension).toBe(0);
    });

    it('should calculate proper extension when bracket exceeds limits', () => {
      const inputs = {
        ...baseInputs,
        original_bracket_height: 250,
        max_allowable_bracket_extension: 150,
        current_angle_height: 60,
        fixing_position: 75
      };
      const result = calculateAngleExtension(inputs);

      expect(result.extension_applied).toBe(true);
      expect(result.original_bracket_height).toBe(250);
      expect(result.limited_bracket_height).toBe(225); // 75 + 150
      expect(result.bracket_reduction).toBe(25); // 250 - 225
      expect(result.original_angle_height).toBe(60);
      expect(result.extended_angle_height).toBe(85); // 60 + 25
      expect(result.angle_extension).toBe(25);
      expect(result.max_extension_limit).toBe(150);
    });

    it('should throw error when extension exceeds manufacturing limits', () => {
      const inputs = {
        ...baseInputs,
        original_bracket_height: 500,  // Very large bracket
        max_allowable_bracket_extension: 50,  // Very restrictive limit
        current_angle_height: 60,
        fixing_position: 75
      };

      expect(() => calculateAngleExtension(inputs)).toThrow(
        /Angle extension would exceed manufacturing limits/
      );
    });

    it('should handle inverted bracket types', () => {
      const inputs = {
        ...baseInputs,
        bracket_type: 'Inverted',
        original_bracket_height: 250,
        max_allowable_bracket_extension: 150,
        fixing_position: 75
      };
      const result = calculateAngleExtension(inputs);

      expect(result.extension_applied).toBe(true);
      expect(result.bracket_reduction).toBe(25);
      expect(result.angle_extension).toBe(25);
    });

    it('should handle different angle orientations', () => {
      const inputs = {
        ...baseInputs,
        angle_orientation: 'Inverted',
        original_bracket_height: 250,
        max_allowable_bracket_extension: 150,
        fixing_position: 75
      };
      const result = calculateAngleExtension(inputs);

      expect(result.extension_applied).toBe(true);
      expect(result.bracket_reduction).toBe(25);
      expect(result.angle_extension).toBe(25);
    });
  });

  describe('shouldApplyAngleExtension', () => {
    it('should return true when enabled and limit is set', () => {
      const result = shouldApplyAngleExtension(true, 150);
      expect(result).toBe(true);
    });

    it('should return false when disabled', () => {
      const result = shouldApplyAngleExtension(false, 150);
      expect(result).toBe(false);
    });

    it('should return false when no limit is set', () => {
      const result = shouldApplyAngleExtension(true, null);
      expect(result).toBe(false);
    });

    it('should return false when limit is undefined', () => {
      const result = shouldApplyAngleExtension(true, undefined);
      expect(result).toBe(false);
    });

    it('should return false when both disabled and no limit', () => {
      const result = shouldApplyAngleExtension(false, null);
      expect(result).toBe(false);
    });

    it('should handle undefined enabled parameter', () => {
      const result = shouldApplyAngleExtension(undefined, 150);
      expect(result).toBe(false);
    });
  });

  describe('edge cases and precision', () => {
    it('should handle very small bracket reductions', () => {
      const inputs = {
        ...baseInputs,
        original_bracket_height: 225.001,  // Just over limit
        max_allowable_bracket_extension: 150,
        fixing_position: 75
      };
      const result = calculateAngleExtension(inputs);

      expect(result.extension_applied).toBe(true);
      expect(result.bracket_reduction).toBeCloseTo(0.001, 12);
      expect(result.angle_extension).toBeCloseTo(0.001, 12);
    });

    it('should maintain precision in calculations', () => {
      const inputs = {
        ...baseInputs,
        original_bracket_height: 237.123456789,
        max_allowable_bracket_extension: 150,
        fixing_position: 75
      };
      const result = calculateAngleExtension(inputs);

      expect(result.extension_applied).toBe(true);
      expect(result.bracket_reduction).toBeCloseTo(12.123456789, 10);
      expect(result.angle_extension).toBeCloseTo(12.123456789, 10);
    });

    it('should handle zero current angle height', () => {
      const inputs = {
        ...baseInputs,
        current_angle_height: 0,
        original_bracket_height: 250,
        max_allowable_bracket_extension: 150,
        fixing_position: 75
      };
      const result = calculateAngleExtension(inputs);

      expect(result.extension_applied).toBe(true);
      expect(result.original_angle_height).toBe(0);
      expect(result.extended_angle_height).toBe(25);
    });
  });
});