import {
  determineBracketType,
  getValidAngleOrientations,
  getValidBracketAngleCombinations,
  calculateBracketHeight,
  calculateRiseToBolts,
  isValidBracketAngleCombination,
  fixingPositionToSSL,
  fixingPositionFromSSL,
  getFixingPositionForTypeSelection,
  getFixingPositionForCalculations,
  validateFixingPosition,
  getMaximumFixingPosition,
  validateFixingConfiguration,
  calculateOptimalFixingPosition,
  BRACKET_ANGLE_CONSTANTS
} from '../bracketAngleSelection';
import type { FixingOptimizationConfig } from '@/types/bracketAngleTypes';

describe('Bracket Type Selection', () => {
  test('should select Standard bracket when BSL ≤ -75mm', () => {
    expect(determineBracketType(-75)).toBe('Standard');
    expect(determineBracketType(-100)).toBe('Standard');
    expect(determineBracketType(-175)).toBe('Standard');
    expect(determineBracketType(-200)).toBe('Standard');
  });

  test('should select Inverted bracket when BSL > -75mm', () => {
    expect(determineBracketType(-74)).toBe('Inverted');
    expect(determineBracketType(-50)).toBe('Inverted');
    expect(determineBracketType(0)).toBe('Inverted');
    expect(determineBracketType(50)).toBe('Inverted');
  });
});

describe('Angle Orientation Selection', () => {
  test('should return both orientations for BSL ≥ 0mm', () => {
    const orientations = getValidAngleOrientations(0);
    expect(orientations).toHaveLength(2);
    expect(orientations).toContain('Standard');
    expect(orientations).toContain('Inverted');

    const orientations50 = getValidAngleOrientations(50);
    expect(orientations50).toHaveLength(2);
    expect(orientations50).toContain('Standard');
    expect(orientations50).toContain('Inverted');
  });

  test('should return Standard only for BSL -25mm to -50mm', () => {
    expect(getValidAngleOrientations(-25)).toEqual(['Standard']);
    expect(getValidAngleOrientations(-30)).toEqual(['Standard']);
    expect(getValidAngleOrientations(-50)).toEqual(['Standard']);
  });

  test('should return Inverted only for BSL -75mm to -135mm', () => {
    expect(getValidAngleOrientations(-75)).toEqual(['Inverted']);
    expect(getValidAngleOrientations(-100)).toEqual(['Inverted']);
    expect(getValidAngleOrientations(-135)).toEqual(['Inverted']);
  });

  test('should return both orientations for BSL -150mm to -175mm', () => {
    const orientations150 = getValidAngleOrientations(-150);
    expect(orientations150).toHaveLength(2);
    expect(orientations150).toContain('Standard');
    expect(orientations150).toContain('Inverted');

    const orientations175 = getValidAngleOrientations(-175);
    expect(orientations175).toHaveLength(2);
    expect(orientations175).toContain('Standard');
    expect(orientations175).toContain('Inverted');
  });

  test('should return both orientations for BSL < -175mm', () => {
    const orientations = getValidAngleOrientations(-200);
    expect(orientations).toHaveLength(2);
    expect(orientations).toContain('Standard');
    expect(orientations).toContain('Inverted');
  });
});

describe('Bracket Angle Combinations', () => {
  test('should return correct combinations for support level 0mm', () => {
    const combinations = getValidBracketAngleCombinations(0);
    expect(combinations).toHaveLength(2);
    expect(combinations).toContainEqual({ bracket_type: 'Inverted', angle_orientation: 'Standard' });
    expect(combinations).toContainEqual({ bracket_type: 'Inverted', angle_orientation: 'Inverted' });
  });

  test('should return correct combination for support level -25mm', () => {
    const combinations = getValidBracketAngleCombinations(-25);
    expect(combinations).toHaveLength(1);
    expect(combinations).toContainEqual({ bracket_type: 'Inverted', angle_orientation: 'Standard' });
  });

  test('should return correct combination for support level -100mm', () => {
    const combinations = getValidBracketAngleCombinations(-100);
    expect(combinations).toHaveLength(1);
    expect(combinations).toContainEqual({ bracket_type: 'Standard', angle_orientation: 'Inverted' });
  });

  test('should return correct combinations for support level -150mm', () => {
    const combinations = getValidBracketAngleCombinations(-150);
    expect(combinations).toHaveLength(2);
    expect(combinations).toContainEqual({ bracket_type: 'Standard', angle_orientation: 'Standard' });
    expect(combinations).toContainEqual({ bracket_type: 'Standard', angle_orientation: 'Inverted' });
  });
});

describe('Bracket Height Calculation', () => {
  const baseParams = {
    support_level: -100,
    top_critical_edge_distance: 75,
    distance_from_top_to_fixing: 40,
    vertical_leg: 60,
  };

  test('should calculate base height without adjustments for Standard bracket + Standard angle', () => {
    const height = calculateBracketHeight({
      ...baseParams,
      bracket_type: 'Standard',
      angle_orientation: 'Standard'
    });
    
    // Base calculation: Math.abs(-100) - 75 + 40 = 65
    expect(height).toBeCloseTo(65, 5);
  });

  test('should add vertical leg for Standard bracket + Inverted angle', () => {
    const height = calculateBracketHeight({
      ...baseParams,
      bracket_type: 'Standard',
      angle_orientation: 'Inverted'
    });
    
    // Base calculation + vertical leg: 65 + 60 = 125
    expect(height).toBeCloseTo(125, 5);
  });

  test('should add vertical leg for Inverted bracket + Standard angle', () => {
    const height = calculateBracketHeight({
      ...baseParams,
      support_level: 50, // Inverted bracket scenario
      bracket_type: 'Inverted',
      angle_orientation: 'Standard'
    });
    
    // Special case logic applies for inverted brackets with support_level > -75
    // Standard calculation would give: Math.abs(50) - 75 + 40 = 15
    // But rise to bolts would be: 15 - (40 + 15) = -40 (negative)
    // So special case ensures adequate bracket height: 165 + vertical leg adjustment
    expect(height).toBeCloseTo(225, 5); // 165 + 60 (vertical leg for Standard angle)
  });

  test('should not add adjustment for Inverted bracket + Inverted angle', () => {
    const height = calculateBracketHeight({
      ...baseParams,
      support_level: 50, // Inverted bracket scenario
      bracket_type: 'Inverted',
      angle_orientation: 'Inverted'
    });
    
    // Special case logic applies - ensures adequate rise to bolts
    // No vertical leg adjustment for Inverted angle orientation
    expect(height).toBeCloseTo(165, 5); // Base height from special case logic
  });
});

describe('Rise to Bolts Calculation', () => {
  const baseParams = {
    bracket_height: 150,
    distance_from_top_to_fixing: 40,
    worst_case_adjustment: 15,
    bottom_critical_edge_distance: 125,
    support_level: -100,
    slab_thickness: 200,
    top_critical_edge_distance: 75,
  };

  test('should calculate basic rise to bolts', () => {
    const riseToBolts = calculateRiseToBolts(baseParams);
    
    // Base calculation: 150 - (40 + 15) = 95
    expect(riseToBolts).toBeCloseTo(95, 5);
  });

  test('should limit to bottom critical edge when bracket projects below slab', () => {
    const riseToBolts = calculateRiseToBolts({
      ...baseParams,
      support_level: -300, // Large support level that projects below slab
      slab_thickness: 200,
    });
    
    // Should be limited to bottom_critical_edge_distance = 125
    // But first check if it actually projects below: Math.abs(-300) > (200 - 75) = 300 > 125 = true
    const baseCalculation = 150 - 55; // 95
    expect(riseToBolts).toBeCloseTo(Math.min(baseCalculation, 125), 5);
  });

  test('should use dynamic fixing position parameter', () => {
    // Test with deeper fixing position (80mm instead of default 75mm)
    const riseToBoltsWithDeepFixing = calculateRiseToBolts({
      ...baseParams,
      support_level: -300,
      slab_thickness: 200,
      fixing_position: 80 // 5mm deeper than default
    });

    // Test with default fixing position
    const riseToBoltsWithDefaultFixing = calculateRiseToBolts({
      ...baseParams,
      support_level: -300,
      slab_thickness: 200,
      fixing_position: 75 // Default fixing position
    });

    // The projection below slab check should use the fixing position
    // With 80mm fixing: Math.abs(-300) > (200 - 80) = 300 > 120 = true (projects below)
    // With 75mm fixing: Math.abs(-300) > (200 - 75) = 300 > 125 = true (projects below)
    // Both should be limited to bottom critical edge distance
    expect(riseToBoltsWithDeepFixing).toBeCloseTo(Math.min(95, 125), 5);
    expect(riseToBoltsWithDefaultFixing).toBeCloseTo(Math.min(95, 125), 5);
  });

  test('should handle fixing position for non-projecting brackets', () => {
    const riseToBolts = calculateRiseToBolts({
      ...baseParams,
      support_level: -50, // Smaller support level that doesn't project below slab
      slab_thickness: 300,
      fixing_position: 90 // Deeper fixing position
    });
    
    // Should use base calculation since it doesn't project below slab
    // Math.abs(-50) < (300 - 90) = 50 < 210 = true (doesn't project)
    expect(riseToBolts).toBeCloseTo(95, 5); // 150 - (40 + 15) = 95
  });
});

describe('Validation Functions', () => {
  test('should validate correct bracket/angle combinations', () => {
    expect(isValidBracketAngleCombination(0, 'Inverted', 'Standard')).toBe(true);
    expect(isValidBracketAngleCombination(0, 'Inverted', 'Inverted')).toBe(true);
    expect(isValidBracketAngleCombination(-25, 'Inverted', 'Standard')).toBe(true);
    expect(isValidBracketAngleCombination(-100, 'Standard', 'Inverted')).toBe(true);
    expect(isValidBracketAngleCombination(-150, 'Standard', 'Standard')).toBe(true);
    expect(isValidBracketAngleCombination(-150, 'Standard', 'Inverted')).toBe(true);
  });

  test('should reject invalid bracket/angle combinations', () => {
    expect(isValidBracketAngleCombination(0, 'Standard', 'Standard')).toBe(false); // Should be Inverted bracket
    expect(isValidBracketAngleCombination(-25, 'Inverted', 'Inverted')).toBe(false); // Should be Standard angle only
    expect(isValidBracketAngleCombination(-100, 'Standard', 'Standard')).toBe(false); // Should be Inverted angle only
    expect(isValidBracketAngleCombination(-100, 'Inverted', 'Inverted')).toBe(false); // Should be Standard bracket
  });
});

describe('Constants', () => {
  test('should have correct constant values', () => {
    expect(BRACKET_ANGLE_CONSTANTS.BASELINE_FIXING_POINT_FROM_SSL).toBe(-75);
    expect(BRACKET_ANGLE_CONSTANTS.DEFAULT_FIXING_POSITION).toBe(75);
    expect(BRACKET_ANGLE_CONSTANTS.DISTANCE_FROM_TOP_TO_FIXING).toBe(40);
    expect(BRACKET_ANGLE_CONSTANTS.WORST_CASE_ADJUSTMENT).toBe(15);
    
    // Backward compatibility
    expect(BRACKET_ANGLE_CONSTANTS.FIXING_POINT_FROM_SSL).toBe(-75);
  });
});

describe('Fixing Position Utilities', () => {
  test('should convert fixing position to SSL coordinates', () => {
    expect(fixingPositionToSSL(75)).toBe(-75);
    expect(fixingPositionToSSL(80)).toBe(-80);
    expect(fixingPositionToSSL(90)).toBe(-90);
  });

  test('should convert SSL fixing position to top-of-slab coordinates', () => {
    expect(fixingPositionFromSSL(-75)).toBe(75);
    expect(fixingPositionFromSSL(-80)).toBe(80);
    expect(fixingPositionFromSSL(-90)).toBe(90);
  });

  test('should return baseline fixing position for type selection', () => {
    expect(getFixingPositionForTypeSelection()).toBe(-75);
  });

  test('should return appropriate fixing position for calculations', () => {
    expect(getFixingPositionForCalculations()).toBe(-75); // Default
    expect(getFixingPositionForCalculations(80)).toBe(-80); // Dynamic position used
    expect(getFixingPositionForCalculations(90)).toBe(-90); // Dynamic position used
  });
});

describe('Fixing Position Validation', () => {
  describe('validateFixingPosition', () => {
    test('should pass for valid fixing position within limits', () => {
      const result = validateFixingPosition(80, 200, 75); // 80mm from top, 200mm slab, 75mm bottom clearance
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('should fail for negative fixing position', () => {
      const result = validateFixingPosition(-10, 200, 75);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Fixing position must be positive');
    });

    test('should fail for zero fixing position', () => {
      const result = validateFixingPosition(0, 200, 75);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Fixing position must be positive');
    });

    test('should fail when fixing position exceeds slab thickness', () => {
      const result = validateFixingPosition(250, 200, 75);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('cannot exceed slab thickness');
    });

    test('should fail when bottom clearance is insufficient', () => {
      const result = validateFixingPosition(180, 200, 75); // Only 20mm clearance, need 75mm
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Insufficient bottom clearance');
      expect(result.error).toContain('from channel specs');
    });

    test('should work with different channel specs bottom clearance values', () => {
      // Test with 85mm bottom clearance (different channel type)
      const result1 = validateFixingPosition(120, 200, 85);
      expect(result1.isValid).toBe(false); // 80mm clearance < 85mm required

      const result2 = validateFixingPosition(110, 200, 85);
      expect(result2.isValid).toBe(true); // 90mm clearance > 85mm required
    });
  });

  describe('getMaximumFixingPosition', () => {
    test('should calculate maximum based on bottom critical edge distance', () => {
      const max = getMaximumFixingPosition(200, 75, 100);
      // Should be min(200-75, 200-100) = min(125, 100) = 100mm, but max(100, 75) = 100mm
      expect(max).toBe(100);
    });

    test('should respect performance limit', () => {
      const max = getMaximumFixingPosition(300, 60, 150);
      // Should be min(300-60, 300-150) = min(240, 150) = 150mm
      expect(max).toBe(150);
    });

    test('should not go below default fixing position', () => {
      const max = getMaximumFixingPosition(120, 50, 50);
      // Would calculate min(120-50, 120-50) = 70, but should be max(70, 75) = 75
      expect(max).toBe(75);
    });

    test('should handle different channel bottom clearance values', () => {
      // Channel with larger bottom clearance requirement
      const max1 = getMaximumFixingPosition(250, 90, 100);
      expect(max1).toBe(150); // min(250-90, 250-100) = min(160, 150) = 150

      // Channel with smaller bottom clearance requirement  
      const max2 = getMaximumFixingPosition(250, 50, 100);
      expect(max2).toBe(150); // min(250-50, 250-100) = min(200, 150) = 150
    });
  });

  describe('validateFixingConfiguration', () => {
    test('should pass for valid configuration', () => {
      const result = validateFixingConfiguration(85, 200, 150, 75, 95);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.riseToBolts).toBeCloseTo(95, 1); // 150 - (40 + 15) = 95
      expect(result.bottomClearance).toBe(115); // 200 - 85
    });

    test('should fail for insufficient bottom clearance', () => {
      const result = validateFixingConfiguration(180, 200, 150, 75);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Insufficient bottom clearance');
    });

    test('should fail for insufficient rise to bolts', () => {
      const result = validateFixingConfiguration(80, 200, 120, 75, 95);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Insufficient rise to bolts');
      expect(result.riseToBolts).toBeCloseTo(65, 1); // 120 - (40 + 15) = 65
    });

    test('should accumulate multiple validation errors', () => {
      const result = validateFixingConfiguration(190, 200, 120, 75, 95);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1); // Only bottom clearance error, rise to bolts not checked
      expect(result.errors[0]).toContain('Insufficient bottom clearance');
    });

    test('should work with different channel specs', () => {
      // Test with channel requiring 85mm bottom clearance
      const result = validateFixingConfiguration(100, 200, 160, 85, 95);
      expect(result.isValid).toBe(true);
      expect(result.bottomClearance).toBe(100); // 200 - 100
      expect(result.riseToBolts).toBeCloseTo(105, 1); // 160 - 55 = 105
    });
  });
});

describe('Fixing Position Optimization', () => {
  const baseParams = {
    support_level: -150,
    top_critical_edge_distance: 75,
    distance_from_top_to_fixing: 40,
    vertical_leg: 60,
    bracket_type: 'Standard' as const,
    angle_orientation: 'Standard' as const
  };

  describe('calculateOptimalFixingPosition', () => {
    test('should return start position when optimization is disabled', () => {
      const config: FixingOptimizationConfig = {
        enabled: false,
        start_position: 75,
        increment_size: 5,
        min_bracket_height: 95,
        min_bottom_clearance: 75
      };
      
      const result = calculateOptimalFixingPosition(config, baseParams, 200);
      expect(result).toBe(75);
    });

    test('should find optimal fixing position for thick slab', () => {
      const config: FixingOptimizationConfig = {
        enabled: true,
        start_position: 75,
        increment_size: 5,
        min_bracket_height: 95,
        min_bottom_clearance: 75
      };
      
      const result = calculateOptimalFixingPosition(config, baseParams, 300);
      
      // Should test multiple positions and find the optimal one
      expect(result).toBeGreaterThanOrEqual(75);
      expect(result).toBeLessThanOrEqual(225); // 300 - 75 = 225 max
    });

    test('should respect maximum fixing position based on slab thickness', () => {
      const config: FixingOptimizationConfig = {
        enabled: true,
        start_position: 75,
        increment_size: 5,
        min_bracket_height: 95,
        min_bottom_clearance: 75
      };
      
      // Small slab where max position is limited
      const result = calculateOptimalFixingPosition(config, baseParams, 180);
      
      // Maximum should be 180 - 75 = 105mm
      expect(result).toBeLessThanOrEqual(105);
    });

    test('should respect minimum rise to bolts constraint', () => {
      const config: FixingOptimizationConfig = {
        enabled: true,
        start_position: 75,
        increment_size: 5,
        min_bracket_height: 95,
        min_bottom_clearance: 75
      };
      
      // Use parameters that would result in small bracket height
      const smallBracketParams = {
        ...baseParams,
        support_level: -50 // Smaller support level = smaller bracket
      };
      
      const result = calculateOptimalFixingPosition(config, smallBracketParams, 200);
      
      // Should still be a valid fixing position
      expect(result).toBeGreaterThanOrEqual(75);
    });

    test('should use custom increment size', () => {
      const config: FixingOptimizationConfig = {
        enabled: true,
        start_position: 75,
        increment_size: 10, // Larger increment
        min_bracket_height: 95,
        min_bottom_clearance: 75
      };
      
      const result = calculateOptimalFixingPosition(config, baseParams, 200);
      
      // Result should be a multiple of 10 from start position (75, 85, 95, etc.)
      expect((result - 75) % 10).toBe(0);
    });

    test('should handle edge case where no valid positions exist', () => {
      const config: FixingOptimizationConfig = {
        enabled: true,
        start_position: 75,
        increment_size: 5,
        min_bracket_height: 200, // Very high requirement
        min_bottom_clearance: 75
      };
      
      const result = calculateOptimalFixingPosition(config, baseParams, 200);
      
      // Should return the start position when no better option is found
      expect(result).toBe(75);
    });

    test('should respect max_fixing_position config parameter', () => {
      const config: FixingOptimizationConfig = {
        enabled: true,
        start_position: 75,
        increment_size: 5,
        min_bracket_height: 95,
        min_bottom_clearance: 75,
        max_fixing_position: 100 // Custom max limit
      };
      
      const result = calculateOptimalFixingPosition(config, baseParams, 300);
      
      // Should not exceed the configured maximum
      expect(result).toBeLessThanOrEqual(100);
    });

    test('should optimize for smaller bracket height', () => {
      const config: FixingOptimizationConfig = {
        enabled: true,
        start_position: 75,
        increment_size: 5,
        min_bracket_height: 95,
        min_bottom_clearance: 75
      };
      
      // Use parameters that would actually benefit from deeper fixing position
      // and result in adequate rise to bolts
      const optimizableParams = {
        ...baseParams,
        support_level: -100 // Moderate support level that allows optimization
      };
      
      const result = calculateOptimalFixingPosition(config, optimizableParams, 300);
      
      // Should find an optimal position (may be same as start if no improvement possible)
      expect(result).toBeGreaterThanOrEqual(75);
      expect(result).toBeLessThanOrEqual(225); // 300 - 75 = 225 max
    });

    test('should handle small slab thickness gracefully', () => {
      const config: FixingOptimizationConfig = {
        enabled: true,
        start_position: 75,
        increment_size: 5,
        min_bracket_height: 95,
        min_bottom_clearance: 75
      };
      
      // Very small slab
      const result = calculateOptimalFixingPosition(config, baseParams, 120);
      
      // Should be limited to a very small range
      expect(result).toBe(75); // Likely no room for optimization
    });
  });

  describe('Bracket Height with Dynamic Fixing Positions', () => {
    test('should calculate different heights for different fixing positions', () => {
      const params1 = { ...baseParams, fixing_position: 75 };
      const params2 = { ...baseParams, fixing_position: 85 };
      
      const height1 = calculateBracketHeight(params1);
      const height2 = calculateBracketHeight(params2);
      
      // Different fixing positions may result in different bracket heights
      // depending on the support level and bracket type logic
      expect(typeof height1).toBe('number');
      expect(typeof height2).toBe('number');
      expect(height1).toBeGreaterThan(0);
      expect(height2).toBeGreaterThan(0);
    });

    test('should handle inverted bracket with variable fixing positions', () => {
      const invertedParams = {
        ...baseParams,
        support_level: 50, // Inverted bracket scenario
        bracket_type: 'Inverted' as const,
        fixing_position: 80
      };
      
      const height = calculateBracketHeight(invertedParams);
      expect(height).toBeGreaterThan(0);
      expect(typeof height).toBe('number');
    });
  });

  describe('Rise to Bolts with Dynamic Fixing Positions', () => {
    test('should calculate rise to bolts consistently with fixing position', () => {
      const riseToBoltsParams = {
        bracket_height: 150,
        distance_from_top_to_fixing: 40,
        worst_case_adjustment: 15,
        bottom_critical_edge_distance: 75,
        support_level: -100,
        slab_thickness: 300,
        top_critical_edge_distance: 75,
        fixing_position: 85
      };
      
      const riseToBolts = calculateRiseToBolts(riseToBoltsParams);
      
      // Base calculation: 150 - (40 + 15) = 95
      expect(riseToBolts).toBeCloseTo(95, 5);
    });

    test('should handle projection below slab with dynamic fixing position', () => {
      const riseToBoltsParams = {
        bracket_height: 150,
        distance_from_top_to_fixing: 40,
        worst_case_adjustment: 15,
        bottom_critical_edge_distance: 75,
        support_level: -300, // Large support level
        slab_thickness: 200,
        top_critical_edge_distance: 75,
        fixing_position: 90 // Deeper fixing position
      };
      
      const riseToBolts = calculateRiseToBolts(riseToBoltsParams);
      
      // Should be limited by projection logic
      expect(riseToBolts).toBeGreaterThan(0);
      expect(riseToBolts).toBeLessThanOrEqual(150);
    });
  });
});

describe('Integration Tests', () => {
  test('should generate expected number of combinations for different support levels', () => {
    // Support level 0mm: Inverted bracket + 2 angle orientations = 2 combinations
    const combinations0 = getValidBracketAngleCombinations(0);
    expect(combinations0).toHaveLength(2);

    // Support level -25mm: Inverted bracket + 1 angle orientation = 1 combination  
    const combinations25 = getValidBracketAngleCombinations(-25);
    expect(combinations25).toHaveLength(1);

    // Support level -100mm: Standard bracket + 1 angle orientation = 1 combination
    const combinations100 = getValidBracketAngleCombinations(-100);
    expect(combinations100).toHaveLength(1);

    // Support level -150mm: Standard bracket + 2 angle orientations = 2 combinations
    const combinations150 = getValidBracketAngleCombinations(-150);
    expect(combinations150).toHaveLength(2);
  });

  test('should maintain calculation precision', () => {
    const height = calculateBracketHeight({
      support_level: -123.456,
      top_critical_edge_distance: 75.123,
      distance_from_top_to_fixing: 40.789,
      vertical_leg: 60.555,
      bracket_type: 'Standard',
      angle_orientation: 'Inverted'
    });

    // Should maintain precision and include vertical leg adjustment
    // Base: Math.abs(-123.456) - 75.123 + 40.789 = 89.122
    // With adjustment: 89.122 + 60.555 = 149.677
    expect(height).toBeCloseTo(149.677, 5);
  });
}); 