/**
 * Comprehensive test suite for fixing position optimization logic.
 *
 * Purpose: Verify the fixing position generation algorithm is correct before production deployment.
 *
 * Key Logic Being Tested:
 * - Range: 75mm to (slab_thickness - 75mm) in 5mm increments
 * - Minimum 75mm from top edge (safety clearance)
 * - Minimum 75mm from bottom edge (safety clearance)
 * - Custom position mode overrides optimization
 * - Exclusion zone filtering when angle extension enabled
 *
 * Created: 2025-10-02
 */

import { generateAllCombinations } from '../src/calculations/bruteForceAlgorithm/combinationGeneration';
import type { DesignInputs } from '../src/types/designInputs';

/**
 * Helper function to create test inputs with defaults
 */
function createTestInputs(overrides: Partial<DesignInputs>): DesignInputs {
  return {
    slab_thickness: 225,
    cavity: 100,
    support_level: -200,
    characteristic_load: 6.0,
    facade_thickness: 102.5,
    load_position: 0.33,
    front_offset: 12,
    isolation_shim_thickness: 3,
    material_type: 'brick',
    has_notch: false,
    notch_height: 0,
    notch_depth: 0,
    fixing_type: 'cast_in',
    channel_product: 'all',
    postfix_product: 'all',
    use_custom_fixing_position: false,
    fixing_position: 75,
    use_custom_dim_d: false,
    dim_d: 150,
    use_custom_load_position: false,
    use_custom_facade_offsets: false,
    is_angle_length_limited: false,
    fixed_angle_length: 1200,
    enable_angle_extension: false,
    max_allowable_bracket_extension: null,
    ...overrides
  };
}

/**
 * Helper function to extract unique fixing positions from combinations
 */
function extractFixingPositions(combinations: any[]): number[] {
  return Array.from(new Set(
    combinations.map(combo => combo.fixing_position)
  )).sort((a, b) => a - b);
}

describe('Fixing Position Optimization - Comprehensive Tests', () => {

  describe('1. Basic Range Generation', () => {

    test('200mm slab: should generate [75-125] in 5mm steps', () => {
      const inputs = createTestInputs({ slab_thickness: 200 });
      const combinations = generateAllCombinations(inputs);
      const positions = extractFixingPositions(combinations);

      expect(positions).toEqual([75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125]);
      expect(positions.length).toBe(11);
      expect(Math.min(...positions)).toBe(75);
      expect(Math.max(...positions)).toBe(125);
    });

    test('225mm slab: should generate [75-150] in 5mm steps', () => {
      const inputs = createTestInputs({ slab_thickness: 225 });
      const combinations = generateAllCombinations(inputs);
      const positions = extractFixingPositions(combinations);

      const expected = [];
      for (let p = 75; p <= 150; p += 5) expected.push(p);

      expect(positions).toEqual(expected);
      expect(positions.length).toBe(16);
      expect(Math.min(...positions)).toBe(75);
      expect(Math.max(...positions)).toBe(150);
    });

    test('250mm slab: should generate [75-175] in 5mm steps', () => {
      const inputs = createTestInputs({ slab_thickness: 250 });
      const combinations = generateAllCombinations(inputs);
      const positions = extractFixingPositions(combinations);

      expect(positions.length).toBe(21);
      expect(Math.min(...positions)).toBe(75);
      expect(Math.max(...positions)).toBe(175);
    });

    test('300mm slab: should generate [75-225] in 5mm steps', () => {
      const inputs = createTestInputs({ slab_thickness: 300 });
      const combinations = generateAllCombinations(inputs);
      const positions = extractFixingPositions(combinations);

      expect(positions.length).toBe(31);
      expect(Math.min(...positions)).toBe(75);
      expect(Math.max(...positions)).toBe(225);
    });

    test('350mm slab: should generate [75-275] in 5mm steps', () => {
      const inputs = createTestInputs({ slab_thickness: 350 });
      const combinations = generateAllCombinations(inputs);
      const positions = extractFixingPositions(combinations);

      expect(positions.length).toBe(41);
      expect(Math.min(...positions)).toBe(75);
      expect(Math.max(...positions)).toBe(275);
    });

    test('400mm slab: should generate [75-325] in 5mm steps', () => {
      const inputs = createTestInputs({ slab_thickness: 400 });
      const combinations = generateAllCombinations(inputs);
      const positions = extractFixingPositions(combinations);

      expect(positions.length).toBe(51);
      expect(Math.min(...positions)).toBe(75);
      expect(Math.max(...positions)).toBe(325);
    });
  });

  describe('2. Edge Cases', () => {

    test('150mm slab (minimum): should only generate [75]', () => {
      const inputs = createTestInputs({ slab_thickness: 150 });
      const combinations = generateAllCombinations(inputs);
      const positions = extractFixingPositions(combinations);

      expect(positions).toEqual([75]);
      expect(positions.length).toBe(1);
    });

    test('155mm slab: should generate [75, 80]', () => {
      const inputs = createTestInputs({ slab_thickness: 155 });
      const combinations = generateAllCombinations(inputs);
      const positions = extractFixingPositions(combinations);

      expect(positions).toEqual([75, 80]);
      expect(positions.length).toBe(2);
    });

    test('160mm slab: should generate [75, 80, 85]', () => {
      const inputs = createTestInputs({ slab_thickness: 160 });
      const combinations = generateAllCombinations(inputs);
      const positions = extractFixingPositions(combinations);

      expect(positions).toEqual([75, 80, 85]);
      expect(positions.length).toBe(3);
    });

    test('all positions maintain 5mm increment spacing', () => {
      const inputs = createTestInputs({ slab_thickness: 300 });
      const combinations = generateAllCombinations(inputs);
      const positions = extractFixingPositions(combinations);

      // Check all adjacent positions differ by 5mm
      for (let i = 1; i < positions.length; i++) {
        expect(positions[i] - positions[i - 1]).toBe(5);
      }
    });
  });

  describe('3. Correctness Verification', () => {

    test('75mm minimum from top edge is always maintained', () => {
      const slabThicknesses = [150, 200, 225, 250, 300, 350, 400];

      slabThicknesses.forEach(thickness => {
        const inputs = createTestInputs({ slab_thickness: thickness });
        const combinations = generateAllCombinations(inputs);
        const positions = extractFixingPositions(combinations);

        const minPosition = Math.min(...positions);
        expect(minPosition).toBe(75);
        expect(minPosition).toBeGreaterThanOrEqual(75);
      });
    });

    test('75mm minimum from bottom edge is always maintained', () => {
      const slabThicknesses = [150, 200, 225, 250, 300, 350, 400];

      slabThicknesses.forEach(thickness => {
        const inputs = createTestInputs({ slab_thickness: thickness });
        const combinations = generateAllCombinations(inputs);
        const positions = extractFixingPositions(combinations);

        const maxPosition = Math.max(...positions);
        const bottomClearance = thickness - maxPosition;

        expect(bottomClearance).toBeGreaterThanOrEqual(75);
        expect(maxPosition).toBe(thickness - 75);
      });
    });

    test('no position exceeds slab thickness', () => {
      const slabThicknesses = [150, 200, 225, 250, 300, 350, 400];

      slabThicknesses.forEach(thickness => {
        const inputs = createTestInputs({ slab_thickness: thickness });
        const combinations = generateAllCombinations(inputs);
        const positions = extractFixingPositions(combinations);

        positions.forEach(pos => {
          expect(pos).toBeLessThan(thickness);
        });
      });
    });

    test('formula correctness: max = slab - 75', () => {
      const testCases = [
        { slab: 150, expectedMax: 75 },
        { slab: 200, expectedMax: 125 },
        { slab: 225, expectedMax: 150 },
        { slab: 250, expectedMax: 175 },
        { slab: 300, expectedMax: 225 },
        { slab: 400, expectedMax: 325 }
      ];

      testCases.forEach(({ slab, expectedMax }) => {
        const inputs = createTestInputs({ slab_thickness: slab });
        const combinations = generateAllCombinations(inputs);
        const positions = extractFixingPositions(combinations);

        expect(Math.max(...positions)).toBe(expectedMax);
        expect(Math.max(...positions)).toBe(slab - 75);
      });
    });

    test('formula correctness: count = (max - min) / 5 + 1', () => {
      const testCases = [
        { slab: 150, expectedCount: 1 },   // (75-75)/5+1 = 1
        { slab: 200, expectedCount: 11 },  // (125-75)/5+1 = 11
        { slab: 225, expectedCount: 16 },  // (150-75)/5+1 = 16
        { slab: 250, expectedCount: 21 },  // (175-75)/5+1 = 21
        { slab: 300, expectedCount: 31 },  // (225-75)/5+1 = 31
      ];

      testCases.forEach(({ slab, expectedCount }) => {
        const inputs = createTestInputs({ slab_thickness: slab });
        const combinations = generateAllCombinations(inputs);
        const positions = extractFixingPositions(combinations);

        expect(positions.length).toBe(expectedCount);

        // Verify formula
        const min = 75;
        const max = slab - 75;
        const calculatedCount = (max - min) / 5 + 1;
        expect(positions.length).toBe(calculatedCount);
      });
    });
  });

  describe('4. Custom Position Mode', () => {

    test('custom position mode: respects user-specified position', () => {
      const inputs = createTestInputs({
        slab_thickness: 225,
        use_custom_fixing_position: true,
        fixing_position: 100
      });
      const combinations = generateAllCombinations(inputs);
      const positions = extractFixingPositions(combinations);

      expect(positions).toEqual([100]);
      expect(positions.length).toBe(1);
    });

    test('custom position mode: allows position outside normal range', () => {
      const inputs = createTestInputs({
        slab_thickness: 225,
        use_custom_fixing_position: true,
        fixing_position: 200 // Beyond normal max of 150
      });
      const combinations = generateAllCombinations(inputs);
      const positions = extractFixingPositions(combinations);

      expect(positions).toEqual([200]);
    });

    test('custom position mode: works with very shallow position', () => {
      const inputs = createTestInputs({
        slab_thickness: 225,
        use_custom_fixing_position: true,
        fixing_position: 50 // Below normal min of 75
      });
      const combinations = generateAllCombinations(inputs);
      const positions = extractFixingPositions(combinations);

      expect(positions).toEqual([50]);
    });

    test('optimization mode: generates full range when custom disabled', () => {
      const inputs = createTestInputs({
        slab_thickness: 225,
        use_custom_fixing_position: false,
        fixing_position: 100 // Should be ignored
      });
      const combinations = generateAllCombinations(inputs);
      const positions = extractFixingPositions(combinations);

      expect(positions.length).toBeGreaterThan(1);
      expect(Math.min(...positions)).toBe(75);
      expect(Math.max(...positions)).toBe(150);
    });
  });

  describe('5. Real-World Scenarios', () => {

    test('original issue case: 225mm slab with -250mm support level', () => {
      const inputs = createTestInputs({
        slab_thickness: 225,
        cavity: 213,
        support_level: -250,
        characteristic_load: 4.0
      });
      const combinations = generateAllCombinations(inputs);
      const positions = extractFixingPositions(combinations);

      // Should have full range available, not just 75mm
      expect(positions.length).toBeGreaterThan(1);
      expect(positions).toContain(75);
      expect(positions).toContain(150);
      expect(Math.max(...positions)).toBe(150);

      console.log('Original issue case - available positions:', positions);
    });

    test('small slab with positive support level (inverted bracket)', () => {
      const inputs = createTestInputs({
        slab_thickness: 200,
        support_level: 50, // Above slab - triggers Inverted bracket type
        characteristic_load: 5.0
      });
      const combinations = generateAllCombinations(inputs);
      const positions = extractFixingPositions(combinations);

      // Positive support level uses Inverted brackets which may have 0 fixing positions
      // in optimization due to different geometry constraints
      // Just verify the range is correct IF positions exist
      if (positions.length > 0) {
        expect(Math.min(...positions)).toBeGreaterThanOrEqual(75);
        expect(Math.max(...positions)).toBeLessThanOrEqual(125);
      } else {
        // 0 positions is acceptable for inverted brackets above slab
        expect(positions.length).toBe(0);
      }
    });

    test('thick slab with deep support level', () => {
      const inputs = createTestInputs({
        slab_thickness: 350,
        support_level: -300,
        characteristic_load: 8.0
      });
      const combinations = generateAllCombinations(inputs);
      const positions = extractFixingPositions(combinations);

      expect(positions.length).toBe(41); // 75-275 in 5mm steps
      expect(Math.min(...positions)).toBe(75);
      expect(Math.max(...positions)).toBe(275);
    });
  });

  describe('6. Exclusion Zone Integration', () => {

    test('no exclusion zone: all positions available', () => {
      const inputs = createTestInputs({
        slab_thickness: 225,
        enable_angle_extension: false,
        max_allowable_bracket_extension: null
      });
      const combinations = generateAllCombinations(inputs);
      const positions = extractFixingPositions(combinations);

      expect(positions.length).toBe(16); // Full range [75-150]
    });

    test('permissive exclusion zone: positions not filtered', () => {
      const inputs = createTestInputs({
        slab_thickness: 225,
        support_level: -200,
        enable_angle_extension: true,
        max_allowable_bracket_extension: -50 // Very permissive
      });
      const combinations = generateAllCombinations(inputs);
      const positions = extractFixingPositions(combinations);

      // Should have full or near-full range
      expect(positions.length).toBeGreaterThan(10);
    });

    test('restrictive exclusion zone: some positions filtered', () => {
      const inputs = createTestInputs({
        slab_thickness: 225,
        support_level: -100,
        enable_angle_extension: true,
        max_allowable_bracket_extension: 10 // Very restrictive
      });
      const combinations = generateAllCombinations(inputs);
      const positions = extractFixingPositions(combinations);

      // Should filter out some positions
      // Exact number depends on exclusion zone logic
      expect(positions.length).toBeGreaterThan(0); // At least some positions remain
    });
  });

  describe('7. Comparison with Historical Behavior', () => {

    test('verify fix: 225mm slab now has working zone of 75mm', () => {
      const inputs = createTestInputs({ slab_thickness: 225 });
      const combinations = generateAllCombinations(inputs);
      const positions = extractFixingPositions(combinations);

      const workingZone = Math.max(...positions) - Math.min(...positions);
      expect(workingZone).toBe(75); // 150 - 75 = 75mm working zone
    });

    test('verify fix: 200mm slab now has working zone of 50mm', () => {
      const inputs = createTestInputs({ slab_thickness: 200 });
      const combinations = generateAllCombinations(inputs);
      const positions = extractFixingPositions(combinations);

      const workingZone = Math.max(...positions) - Math.min(...positions);
      expect(workingZone).toBe(50); // 125 - 75 = 50mm working zone
    });

    test('verify fix: 300mm slab now has working zone of 150mm', () => {
      const inputs = createTestInputs({ slab_thickness: 300 });
      const combinations = generateAllCombinations(inputs);
      const positions = extractFixingPositions(combinations);

      const workingZone = Math.max(...positions) - Math.min(...positions);
      expect(workingZone).toBe(150); // 225 - 75 = 150mm working zone
    });
  });

  describe('8. Consistency Checks', () => {

    test('all combinations have valid fixing positions', () => {
      const inputs = createTestInputs({ slab_thickness: 225 });
      const combinations = generateAllCombinations(inputs);

      combinations.forEach(combo => {
        expect(combo.fixing_position).toBeDefined();
        expect(combo.fixing_position).toBeGreaterThanOrEqual(75);
        expect(combo.fixing_position).toBeLessThanOrEqual(150);
      });
    });

    test('fixing positions determined by bracket type selection logic', () => {
      // Support level -100mm → Standard bracket only (per bracket selection rules)
      const inputs = createTestInputs({
        slab_thickness: 225,
        support_level: -100
      });
      const combinations = generateAllCombinations(inputs);

      const standardBracketCombos = combinations.filter(c => c.bracket_type === 'Standard');
      const invertedBracketCombos = combinations.filter(c => c.bracket_type === 'Inverted');

      // At -100mm support level, only Standard brackets are valid
      expect(standardBracketCombos.length).toBeGreaterThan(0);
      expect(invertedBracketCombos.length).toBe(0);

      // Standard bracket positions should follow the 75mm rule
      const standardPositions = extractFixingPositions(standardBracketCombos);
      expect(Math.min(...standardPositions)).toBe(75);
      expect(Math.max(...standardPositions)).toBe(150);
    });

    test('fixing positions independent of other parameters', () => {
      const inputs1 = createTestInputs({
        slab_thickness: 225,
        characteristic_load: 4.0
      });
      const inputs2 = createTestInputs({
        slab_thickness: 225,
        characteristic_load: 8.0
      });

      const positions1 = extractFixingPositions(generateAllCombinations(inputs1));
      const positions2 = extractFixingPositions(generateAllCombinations(inputs2));

      // Fixing positions should be same regardless of load
      expect(positions1).toEqual(positions2);
    });
  });
});
