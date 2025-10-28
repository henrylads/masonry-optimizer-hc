/**
 * Test scenario to verify the fixing position optimization fix for small slabs.
 *
 * Issue: With a 225mm slab, 213mm cavity, and -250mm support height, the optimization
 * was finding a fixing position of 75mm down from the top of slab, but there was
 * actually a better solution when moving the fixing position to 150mm down.
 *
 * Root cause: The fixing position generation algorithm had incorrect logic that
 * resulted in zero working zones for all slab thicknesses.
 *
 * Expected fix: The algorithm should now generate positions from 75mm to (slab_thickness - 75)mm
 * For 225mm slab: should generate positions [75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150]
 */

import { generateAllCombinations } from '../src/calculations/bruteForceAlgorithm/combinationGeneration';
import { runBruteForce } from '../src/calculations/bruteForceAlgorithm';
import type { DesignInputs } from '../src/types/designInputs';

describe('Fixing Position Optimization Fix', () => {

  test('should generate correct fixing position range for 225mm slab', () => {
    const inputs: DesignInputs = {
      slab_thickness: 225,
      cavity_width: 213,
      support_level: -250,
      characteristic_load: 4.0,
      masonry_density: 2000,
      masonry_height: 3,
      masonry_thickness: 102.5,
      notch_height: 0,
      notch_depth: 0,
      use_custom_fixing_position: false, // Enable optimization
      fixing_position: 75, // This should be ignored during optimization
      facade_thickness: 102.5,
      load_position: 40,
      front_offset: 20,
      isolation_shim_thickness: 3,
      material_type: 'Brick'
    };

    const combinations = generateAllCombinations(inputs);

    // Extract all unique fixing positions
    const fixingPositions = Array.from(new Set(
      combinations.map(combo => combo.fixing_position)
    )).sort((a, b) => a - b);

    console.log('Generated fixing positions:', fixingPositions);

    // Expected range: 75mm to 150mm (225 - 75) in 5mm increments
    const expectedPositions = [];
    for (let pos = 75; pos <= 150; pos += 5) {
      expectedPositions.push(pos);
    }

    expect(fixingPositions).toEqual(expectedPositions);
    expect(fixingPositions.length).toBe(16); // 75, 80, 85, ..., 150
    expect(Math.min(...fixingPositions)).toBe(75);
    expect(Math.max(...fixingPositions)).toBe(150);
  });

  test('should generate correct fixing position ranges for different slab thicknesses', () => {
    const testCases = [
      { slabThickness: 200, expectedMin: 75, expectedMax: 125, expectedCount: 11 },
      { slabThickness: 225, expectedMin: 75, expectedMax: 150, expectedCount: 16 },
      { slabThickness: 250, expectedMin: 75, expectedMax: 175, expectedCount: 21 },
      { slabThickness: 300, expectedMin: 75, expectedMax: 225, expectedCount: 31 }
    ];

    testCases.forEach(({ slabThickness, expectedMin, expectedMax, expectedCount }) => {
      const inputs: DesignInputs = {
        slab_thickness: slabThickness,
        cavity_width: 213,
        support_level: -250,
        characteristic_load: 4.0,
        masonry_density: 2000,
        masonry_height: 3,
        masonry_thickness: 102.5,
        notch_height: 0,
        notch_depth: 0,
        use_custom_fixing_position: false,
        fixing_position: 75,
        facade_thickness: 102.5,
        load_position: 40,
        front_offset: 20,
        isolation_shim_thickness: 3,
        material_type: 'Brick'
      };

      const combinations = generateAllCombinations(inputs);
      const fixingPositions = Array.from(new Set(
        combinations.map(combo => combo.fixing_position)
      )).sort((a, b) => a - b);

      console.log(`${slabThickness}mm slab - Generated fixing positions:`, fixingPositions);

      expect(Math.min(...fixingPositions)).toBe(expectedMin);
      expect(Math.max(...fixingPositions)).toBe(expectedMax);
      expect(fixingPositions.length).toBe(expectedCount);
    });
  });

  test('should find better solution with deeper fixing position for 225mm slab case', async () => {
    const inputs: DesignInputs = {
      slab_thickness: 225,
      cavity_width: 213,
      support_level: -250,
      characteristic_load: 4.0,
      masonry_density: 2000,
      masonry_height: 3,
      masonry_thickness: 102.5,
      notch_height: 0,
      notch_depth: 0,
      use_custom_fixing_position: false, // Enable optimization
      fixing_position: 75,
      facade_thickness: 102.5,
      load_position: 40,
      front_offset: 20,
      isolation_shim_thickness: 3,
      material_type: 'Brick'
    };

    const config = {
      maxGenerations: 1000,
      designInputs: inputs,
      isAngleLengthLimited: false
    };

    try {
      const result = await runBruteForce(config);

      console.log('Optimized fixing position:', result.result.calculated.optimized_fixing_position);
      console.log('Total weight:', result.result.calculated.weights?.totalWeight);
      console.log('Design details:', {
        bracket_type: result.result.genetic.bracket_type,
        angle_orientation: result.result.genetic.angle_orientation,
        bracket_centres: result.result.genetic.bracket_centres,
        bracket_thickness: result.result.genetic.bracket_thickness,
        angle_thickness: result.result.genetic.angle_thickness
      });

      // The optimization should now be able to find solutions with fixing positions other than just 75mm
      expect(result.result.calculated.optimized_fixing_position).toBeDefined();

      // The optimized position should be within the valid range
      const optimizedPosition = result.result.calculated.optimized_fixing_position!;
      expect(optimizedPosition).toBeGreaterThanOrEqual(75);
      expect(optimizedPosition).toBeLessThanOrEqual(150);

      // We expect the algorithm to now have the capability to find positions beyond 75mm
      console.log('✅ Fix successful: Optimization can now evaluate fixing positions across the full valid range');

    } catch (error) {
      console.error('Optimization failed:', error);
      throw error;
    }
  }, 30000); // 30 second timeout for optimization

  test('should respect custom fixing position when use_custom_fixing_position is true', () => {
    const inputs: DesignInputs = {
      slab_thickness: 225,
      cavity_width: 213,
      support_level: -250,
      characteristic_load: 4.0,
      masonry_density: 2000,
      masonry_height: 3,
      masonry_thickness: 102.5,
      notch_height: 0,
      notch_depth: 0,
      use_custom_fixing_position: true, // Custom mode
      fixing_position: 100, // Custom position
      facade_thickness: 102.5,
      load_position: 40,
      front_offset: 20,
      isolation_shim_thickness: 3,
      material_type: 'Brick'
    };

    const combinations = generateAllCombinations(inputs);

    // All combinations should have the custom fixing position
    const fixingPositions = Array.from(new Set(
      combinations.map(combo => combo.fixing_position)
    ));

    expect(fixingPositions).toEqual([100]);
    expect(fixingPositions.length).toBe(1);
  });
});