import { generateAllCombinations } from '../bruteForceAlgorithm/combinationGeneration';
import { calculateDependentParameters } from '../bruteForceAlgorithm';
import { calculateInvertedBracketHeight } from '../bracketCalculations';
import type { DesignInputs } from '@/types/designInputs';
import type { GeneticParameters } from '../bruteForceAlgorithm';

describe('Brute Force Algorithm - Combination Generation', () => {
  const baseInputs: DesignInputs = {
    characteristic_load: 4, // kN/m (≤ 5, so max bracket centres = 600)
    slab_thickness: 200,
    cavity_width: 100,
    masonry_thickness: 102.5,
    masonry_density: 2000,
    masonry_height: 3,
    notch_height: 0,
    notch_depth: 0,
    support_level: -100, // Will vary in tests
    top_critical_edge: 75,
    bottom_critical_edge: 125,
    enable_fixing_optimization: false // Disable to maintain original test behavior
  };

  // Base combination count calculation:
  // 7 bracket centres * 2 bracket thicknesses * 5 angle thicknesses * 2 bolt diameters
  // = 7 * 2 * 5 * 2 = 140 combinations per bracket/angle combination

  test('should generate single angle orientation for support level -100mm (Standard bracket + Inverted angle only)', () => {
    const inputs = { ...baseInputs, support_level: -100 };
    const combinations = generateAllCombinations(inputs);
    
    // Should have 1 bracket/angle combination * 140 base combinations = 140 total
    expect(combinations).toHaveLength(140);
    
    // All combinations should be Standard bracket + Inverted angle
    combinations.forEach(combo => {
      expect(combo.bracket_type).toBe('Standard');
      expect(combo.angle_orientation).toBe('Inverted');
    });
  });

  test('should generate single angle orientation for support level -25mm (Inverted bracket + Standard angle only)', () => {
    const inputs = { ...baseInputs, support_level: -25 };
    const combinations = generateAllCombinations(inputs);
    
    // Should have 1 bracket/angle combination * 140 base combinations = 140 total
    expect(combinations).toHaveLength(140);
    
    // All combinations should be Inverted bracket + Standard angle
    combinations.forEach(combo => {
      expect(combo.bracket_type).toBe('Inverted');
      expect(combo.angle_orientation).toBe('Standard');
    });
  });

  test('should generate both angle orientations for support level 0mm (Inverted bracket + both angles)', () => {
    const inputs = { ...baseInputs, support_level: 0 };
    const combinations = generateAllCombinations(inputs);
    
    // Should have 2 bracket/angle combinations * 140 base combinations = 280 total
    expect(combinations).toHaveLength(280);
    
    // Half should be Inverted bracket + Standard angle, half should be Inverted bracket + Inverted angle
    const standardAngleCombos = combinations.filter(c => c.angle_orientation === 'Standard');
    const invertedAngleCombos = combinations.filter(c => c.angle_orientation === 'Inverted');
    
    expect(standardAngleCombos).toHaveLength(140);
    expect(invertedAngleCombos).toHaveLength(140);
    
    // All should be Inverted bracket
    combinations.forEach(combo => {
      expect(combo.bracket_type).toBe('Inverted');
    });
  });

  test('should generate both angle orientations for support level -150mm (Standard bracket + both angles)', () => {
    const inputs = { ...baseInputs, support_level: -150 };
    const combinations = generateAllCombinations(inputs);
    
    // Should have 2 bracket/angle combinations * 140 base combinations = 280 total
    expect(combinations).toHaveLength(280);
    
    // Half should be Standard bracket + Standard angle, half should be Standard bracket + Inverted angle
    const standardAngleCombos = combinations.filter(c => c.angle_orientation === 'Standard');
    const invertedAngleCombos = combinations.filter(c => c.angle_orientation === 'Inverted');
    
    expect(standardAngleCombos).toHaveLength(140);
    expect(invertedAngleCombos).toHaveLength(140);
    
    // All should be Standard bracket
    combinations.forEach(combo => {
      expect(combo.bracket_type).toBe('Standard');
    });
  });

  test('should apply load constraints to bracket centres', () => {
    const highLoadInputs = { ...baseInputs, characteristic_load: 6 }; // > 5, so max bracket centres = 500
    const combinations = generateAllCombinations(highLoadInputs);
    
    // Should exclude 550 and 600mm bracket centres
    // Valid centres: 200, 250, 300, 350, 400, 450, 500 = 7 centres
    // 7 bracket centres * 2 bracket thicknesses * 5 angle thicknesses * 2 bolt diameters = 140 base combinations
    // 1 bracket/angle combination * 140 = 140 total (for -100mm support level)
    expect(combinations).toHaveLength(140);
    
    // Verify no bracket centres > 500mm
    combinations.forEach(combo => {
      expect(combo.bracket_centres).toBeLessThanOrEqual(500);
    });
  });

  test('should include all required genetic parameters', () => {
    const inputs = { ...baseInputs, support_level: -100 };
    const combinations = generateAllCombinations(inputs);
    
    const firstCombo = combinations[0];
    expect(firstCombo).toHaveProperty('bracket_centres');
    expect(firstCombo).toHaveProperty('bracket_thickness');
    expect(firstCombo).toHaveProperty('angle_thickness');
    expect(firstCombo).toHaveProperty('vertical_leg');
    expect(firstCombo).toHaveProperty('bolt_diameter');
    expect(firstCombo).toHaveProperty('bracket_type');
    expect(firstCombo).toHaveProperty('angle_orientation');
    expect(firstCombo).toHaveProperty('horizontal_leg');
    expect(firstCombo).toHaveProperty('channel_type');
    expect(firstCombo).toHaveProperty('fixing_position');
    
    // Verify types
    expect(typeof firstCombo.bracket_centres).toBe('number');
    expect(typeof firstCombo.bracket_thickness).toBe('number');
    expect(typeof firstCombo.angle_thickness).toBe('number');
    expect(typeof firstCombo.vertical_leg).toBe('number');
    expect(typeof firstCombo.bolt_diameter).toBe('number');
    expect(['Standard', 'Inverted']).toContain(firstCombo.bracket_type);
    expect(['Standard', 'Inverted']).toContain(firstCombo.angle_orientation);
  });

  test('should set vertical leg correctly based on angle thickness', () => {
    const inputs = { ...baseInputs, support_level: -100 };
    const combinations = generateAllCombinations(inputs);
    
    // Check vertical leg values
    combinations.forEach(combo => {
      if (combo.angle_thickness === 8) {
        expect(combo.vertical_leg).toBe(75);
      } else {
        expect(combo.vertical_leg).toBe(60);
      }
    });
  });

  test('should generate consistent results for same inputs', () => {
    const inputs = { ...baseInputs, support_level: -150 };
    
    const combinations1 = generateAllCombinations(inputs);
    const combinations2 = generateAllCombinations(inputs);
    
    expect(combinations1).toHaveLength(combinations2.length);
    expect(combinations1).toEqual(combinations2);
  });
});

describe('Brute Force Algorithm - Edge Cases', () => {
  const baseInputs: DesignInputs = {
    characteristic_load: 4,
    slab_thickness: 200,
    cavity_width: 100,
    masonry_thickness: 102.5,
    masonry_density: 2000,
    masonry_height: 3,
    notch_height: 0,
    notch_depth: 0,
    support_level: -100,
    top_critical_edge: 75,
    bottom_critical_edge: 125,
    enable_fixing_optimization: false // Disable to maintain original test behavior
  };

  test('should handle boundary values correctly', () => {
    // Test exact boundary values
    const boundaryLevels = [-75, -50, -25, -135, -150, -175];
    
    boundaryLevels.forEach(level => {
      const inputs = { ...baseInputs, support_level: level };
      const combinations = generateAllCombinations(inputs);
      
      // Should generate valid combinations for all boundary values
      expect(combinations.length).toBeGreaterThan(0);
      
      // All combinations should have valid bracket/angle pairings
      combinations.forEach(combo => {
        expect(['Standard', 'Inverted']).toContain(combo.bracket_type);
        expect(['Standard', 'Inverted']).toContain(combo.angle_orientation);
      });
    });
  });

  test('should handle very negative support levels', () => {
    const inputs = { ...baseInputs, support_level: -500 };
    const combinations = generateAllCombinations(inputs);
    
    // Should be Standard bracket with both angle orientations
    expect(combinations).toHaveLength(280); // 2 angle orientations * 140 base combinations
    
    combinations.forEach(combo => {
      expect(combo.bracket_type).toBe('Standard');
    });
  });

  test('should handle very positive support levels', () => {
    const inputs = { ...baseInputs, support_level: 200 };
    const combinations = generateAllCombinations(inputs);
    
    // Should be Inverted bracket with both angle orientations
    expect(combinations).toHaveLength(280); // 2 angle orientations * 140 base combinations
    
    combinations.forEach(combo => {
      expect(combo.bracket_type).toBe('Inverted');
    });
  });
});

describe('Brute Force Algorithm - Angle orientation adjustments', () => {
  test('preserves inverted rise to bolts after vertical leg adjustment', () => {
    const designInputs: DesignInputs = {
      support_level: 75,
      cavity_width: 100,
      slab_thickness: 225,
      characteristic_load: 4,
      top_critical_edge: 75,
      bottom_critical_edge: 150,
      notch_height: 0,
      notch_depth: 0,
      masonry_density: 2000,
      masonry_height: 3,
      masonry_thickness: 102.5,
      fixing_position: 75,
      use_custom_fixing_position: true
    };

    const geneticParameters: GeneticParameters = {
      bracket_centres: 200,
      bracket_thickness: 4,
      angle_thickness: 6,
      vertical_leg: 60,
      bolt_diameter: 12,
      bracket_type: 'Inverted',
      angle_orientation: 'Standard',
      horizontal_leg: 110,
      channel_type: 'CPRO38',
      fixing_position: 75
    };

    const baseInverted = calculateInvertedBracketHeight({
      support_level: designInputs.support_level,
      angle_thickness: geneticParameters.angle_thickness,
      top_critical_edge: designInputs.top_critical_edge,
      bottom_critical_edge: designInputs.bottom_critical_edge,
      slab_thickness: designInputs.slab_thickness,
      fixing_position: geneticParameters.fixing_position
    });

    const calculated = calculateDependentParameters(geneticParameters, designInputs);

    expect(calculated.bracket_height).toBeCloseTo(
      baseInverted.bracket_height + geneticParameters.vertical_leg,
      12
    );
    expect(calculated.rise_to_bolts).toBeCloseTo(150, 12);
    expect(calculated.rise_to_bolts).toBeCloseTo(baseInverted.rise_to_bolts, 12);
  });
});

describe('Brute Force Algorithm - Fixing Position Optimization', () => {
  const baseInputs: DesignInputs = {
    characteristic_load: 4,
    slab_thickness: 300, // Thick slab to allow optimization
    cavity_width: 100,
    masonry_thickness: 102.5,
    masonry_density: 2000,
    masonry_height: 3,
    notch_height: 0,
    notch_depth: 0,
    support_level: -100,
    top_critical_edge: 75,
    bottom_critical_edge: 125
  };

  test('should use default fixing position when optimization is disabled', () => {
    const inputs = { 
      ...baseInputs, 
      enable_fixing_optimization: false 
    };
    const combinations = generateAllCombinations(inputs);
    
    // All combinations should use the default fixing position (75mm)
    combinations.forEach(combo => {
      expect(combo.fixing_position).toBe(75);
    });
    
    // Should have standard combination count (140)
    expect(combinations).toHaveLength(140);
  });

  test('should generate multiple fixing positions when optimization is enabled', () => {
    const inputs = { 
      ...baseInputs, 
      enable_fixing_optimization: true,
      slab_thickness: 300 // Allows positions 75, 80, 85, 90...up to 225mm (300-75)
    };
    const combinations = generateAllCombinations(inputs);
    
    // Should have significantly more combinations due to multiple fixing positions
    expect(combinations.length).toBeGreaterThan(140);
    
    // Should have multiple unique fixing positions
    const uniqueFixingPositions = new Set(combinations.map(c => c.fixing_position));
    expect(uniqueFixingPositions.size).toBeGreaterThan(1);
    
    // All fixing positions should be valid (>= 75mm and <= slab_thickness - 75)
    combinations.forEach(combo => {
      expect(combo.fixing_position).toBeGreaterThanOrEqual(75);
      expect(combo.fixing_position).toBeLessThanOrEqual(225); // 300 - 75
    });
  });

  test('should generate fixing positions in 5mm increments', () => {
    const inputs = { 
      ...baseInputs, 
      enable_fixing_optimization: true,
      slab_thickness: 200 // Allows positions 75, 80, 85...up to 125mm (200-75)
    };
    const combinations = generateAllCombinations(inputs);
    
    // Get unique fixing positions
    const uniqueFixingPositions = Array.from(new Set(combinations.map(c => c.fixing_position).filter((pos): pos is number => pos !== undefined))).sort((a, b) => a - b);
    
    // Should start at 75mm
    expect(uniqueFixingPositions[0]).toBe(75);
    
    // Should increment by 5mm
    for (let i = 1; i < uniqueFixingPositions.length; i++) {
      expect(uniqueFixingPositions[i] - uniqueFixingPositions[i-1]).toBe(5);
    }
    
    // Maximum should be 125mm (200 - 75)
    expect(Math.max(...uniqueFixingPositions)).toBe(125);
  });

  test('should calculate correct combination counts with fixing optimization', () => {
    const inputs = { 
      ...baseInputs, 
      enable_fixing_optimization: true,
      slab_thickness: 200 // Allows 11 fixing positions (75, 80, 85...125)
    };
    const combinations = generateAllCombinations(inputs);
    
    // Base combinations: 7 centres * 2 thicknesses * 5 angles * 2 bolts = 140
    // With 11 fixing positions: 140 * 11 = 1540 combinations
    // With 1 bracket/angle combo: 1540 total
    expect(combinations).toHaveLength(1540);
  });

  test('should handle thin slab with optimization enabled', () => {
    const inputs = { 
      ...baseInputs, 
      enable_fixing_optimization: true,
      slab_thickness: 150 // Only allows fixing position 75mm (150-75=75, so only one position)
    };
    const combinations = generateAllCombinations(inputs);
    
    // Should fall back to single position (75mm) and warn
    combinations.forEach(combo => {
      expect(combo.fixing_position).toBe(75);
    });
    
    // Should have normal combination count (only one fixing position available)
    expect(combinations).toHaveLength(140);
  });

  test('should respect custom starting fixing position', () => {
    const inputs = { 
      ...baseInputs, 
      enable_fixing_optimization: true,
      fixing_position: 80, // Start at 80mm instead of default 75mm
      slab_thickness: 200
    };
    const combinations = generateAllCombinations(inputs);
    
    // Get unique fixing positions
    const uniqueFixingPositions = Array.from(new Set(combinations.map(c => c.fixing_position).filter((pos): pos is number => pos !== undefined))).sort((a, b) => a - b);
    
    // Should start at 80mm (custom position)
    expect(uniqueFixingPositions[0]).toBe(80);
    
    // Should not have 75mm position
    expect(uniqueFixingPositions).not.toContain(75);
    
    // Maximum should still be 125mm (200 - 75)
    expect(Math.max(...uniqueFixingPositions)).toBe(125);
  });

  test('should maintain bracket/angle combination logic with fixing optimization', () => {
    const inputs = { 
      ...baseInputs, 
      enable_fixing_optimization: true,
      support_level: -100, // Should produce Standard bracket + Inverted angle only
      slab_thickness: 200
    };
    const combinations = generateAllCombinations(inputs);
    
    // All combinations should still respect bracket/angle selection logic
    combinations.forEach(combo => {
      expect(combo.bracket_type).toBe('Standard');
      expect(combo.angle_orientation).toBe('Inverted');
    });
    
    // Should have multiple fixing positions but consistent bracket/angle types
    const uniqueFixingPositions = new Set(combinations.map(c => c.fixing_position));
    expect(uniqueFixingPositions.size).toBeGreaterThan(1);
  });

  test('should handle edge case where fixing position equals maximum depth', () => {
    const inputs = { 
      ...baseInputs, 
      enable_fixing_optimization: true,
      fixing_position: 125, // Exactly at maximum depth for 200mm slab
      slab_thickness: 200
    };
    const combinations = generateAllCombinations(inputs);
    
    // Should only have one fixing position (125mm)
    combinations.forEach(combo => {
      expect(combo.fixing_position).toBe(125);
    });
    
    // Should have normal combination count
    expect(combinations).toHaveLength(140);
  });

  test('should handle invalid starting position gracefully', () => {
    const inputs = { 
      ...baseInputs, 
      enable_fixing_optimization: true,
      fixing_position: 200, // Too deep for 200mm slab (would exceed bottom edge distance)
      slab_thickness: 200
    };
    const combinations = generateAllCombinations(inputs);
    
    // Should fall back to using the invalid position (which will be caught later in validation)
    // or handle it appropriately in the generation logic
    expect(combinations.length).toBeGreaterThan(0);
    
    // All combinations should have fixing positions
    combinations.forEach(combo => {
      expect(combo.fixing_position).toBeDefined();
      expect(typeof combo.fixing_position).toBe('number');
    });
  });
});