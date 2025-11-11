/**
 * User Example Validation Test
 *
 * Tests the corrected inverted bracket calculation with the user's specific example:
 * - Support level: 0mm (angle at slab level)
 * - Slab thickness: 225mm
 * - Fixing position: 75mm from top of slab
 * - Expected Dim D: 150mm
 * - Expected bracket height: 225mm
 */

import { calculateInvertedBracketHeight, type InvertedBracketInputs } from '../src/calculations/bracketCalculations';

describe('User Example Validation - Corrected Calculation', () => {
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

    console.log('🧪 Testing User Example:');
    console.log('Support Level:', userExample.support_level, 'mm');
    console.log('Slab Thickness:', userExample.slab_thickness, 'mm');
    console.log('Fixing Position:', userExample.fixing_position, 'mm from top');
    console.log('Angle: 5mm thickness, 60mm height');
    console.log('Expected: Dim D = 150mm, Bracket Height = 225mm');
    console.log('');

    const result = calculateInvertedBracketHeight(userExample);

    console.log('📊 Results:');
    console.log('Dim D:', result.dim_d, 'mm');
    console.log('Bracket Height:', result.bracket_height, 'mm');
    console.log('Rise to Bolts:', result.rise_to_bolts, 'mm');
    console.log('Extension Below Slab:', result.extension_below_slab, 'mm');
    console.log('Height Above SSL:', result.height_above_ssl, 'mm');
    console.log('Height Below SSL:', result.height_below_ssl, 'mm');

    // Main validation: Dim D should be 150mm
    expect(result.dim_d).toBeCloseTo(150, 1);

    // Bracket height should be 225mm (no extension needed)
    expect(result.bracket_height).toBeCloseTo(225, 1);

    // Rise to bolts should be 135mm (150 - 15 worst case)
    expect(result.rise_to_bolts).toBeCloseTo(135, 1);

    // Extension below slab should be 0 (bracket fits in slab)
    expect(result.extension_below_slab).toBeCloseTo(0, 1);

    // Height above SSL should be 55mm for standard angle positioning
    // (angle_height - angle_thickness) = 60 - 5 = 55mm
    expect(result.height_above_ssl).toBeCloseTo(55, 1);

    console.log('✅ All validations passed!');
  });

  test('should handle Dim D constraint violations by extending bracket height', () => {
    // Test case where required Dim D would be too small
    const constraintTest: InvertedBracketInputs = {
      support_level: 0,
      angle_thickness: 5,
      top_critical_edge: 75,
      bottom_critical_edge: 150,
      fixing_position: 100,       // Deeper fixing position
      slab_thickness: 225,
      current_angle_height: 60
    };

    console.log('🧪 Testing Constraint Handling:');
    console.log('Fixing Position:', constraintTest.fixing_position, 'mm (deeper)');
    console.log('This should require Dim D < 130mm, triggering bracket extension');

    const result = calculateInvertedBracketHeight(constraintTest);

    console.log('📊 Constraint Test Results:');
    console.log('Dim D:', result.dim_d, 'mm (should be 130mm minimum)');
    console.log('Bracket Height:', result.bracket_height, 'mm (should be > 225mm)');

    // Dim D should be clamped to minimum 130mm
    expect(result.dim_d).toBe(130);

    // Bracket height should be extended beyond 225mm
    expect(result.bracket_height).toBeGreaterThan(225);

    console.log('✅ Constraint handling validated!');
  });

  test('should calculate geometry correctly for different support levels', () => {
    // Test with positive support level (bracket extends above slab)
    const aboveSlabTest: InvertedBracketInputs = {
      support_level: 50,          // 50mm above slab
      angle_thickness: 5,
      top_critical_edge: 75,
      bottom_critical_edge: 150,
      fixing_position: 75,
      slab_thickness: 225,
      current_angle_height: 60
    };

    console.log('🧪 Testing Above Slab Support Level:');
    console.log('Support Level:', aboveSlabTest.support_level, 'mm above slab');

    const result = calculateInvertedBracketHeight(aboveSlabTest);

    console.log('📊 Above Slab Results:');
    console.log('Height Above SSL:', result.height_above_ssl, 'mm');
    console.log('Bracket Height:', result.bracket_height, 'mm');
    console.log('Dim D:', result.dim_d, 'mm');

    // Height above SSL should include support level + bracket extension
    // = 50 + (60 - 5) = 105mm
    expect(result.height_above_ssl).toBeCloseTo(105, 1);

    // Bracket height should be greater than 225mm due to extension above slab
    expect(result.bracket_height).toBeGreaterThan(225);

    console.log('✅ Above slab geometry validated!');
  });
});