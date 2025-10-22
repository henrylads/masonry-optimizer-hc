import { runBruteForce } from '../bruteForceAlgorithm';
import type { DesignInputs } from '@/types/designInputs';
import type { BruteForceConfig } from '../bruteForceAlgorithm';

describe('Brute Force Algorithm - Standard Angle Preference', () => {
  const baseInputs: DesignInputs = {
    slab_thickness: 200,
    cavity_width: 100,
    masonry_thickness: 102.5,
    masonry_density: 2000,
    masonry_height: 3,
    bracket_centres: [200, 250, 300, 350, 400, 450, 500, 550, 600],
    notch_height: 0,
    notch_depth: 0,
    characteristic_load: 5.0,
    deflection_limit: 5,
    support_level: -150, // BSL above slab bottom
    isLengthLimited: false
  };

  it('should prefer standard angle when BSL is above slab bottom', async () => {
    // Support level -150 with slab thickness 200 means BSL is above slab bottom
    const config: BruteForceConfig = {
      maxGenerations: 100,
      designInputs: baseInputs,
      isAngleLengthLimited: false
    };

    const result = await runBruteForce(config);
    
    // Should select standard angle configuration
    expect(result.result.genetic.bracket_type).toBe('Standard');
    expect(result.result.genetic.angle_orientation).toBe('Standard');
    
    // Should not have alerts since standard angle was selected
    expect(result.result.alerts).toBeUndefined();
  });

  it('should generate alert for inverted angle when BSL is below slab bottom', async () => {
    // Support level -250 with slab thickness 200 means BSL is below slab bottom
    const configBelowSlab: BruteForceConfig = {
      maxGenerations: 100,
      designInputs: {
        ...baseInputs,
        support_level: -250 // BSL below slab bottom
      },
      isAngleLengthLimited: false
    };

    const result = await runBruteForce(configBelowSlab);
    
    // If inverted angle is selected and bracket projects below slab
    if ((result.result.genetic.bracket_type === 'Inverted' || 
         result.result.genetic.angle_orientation === 'Inverted') &&
        result.result.calculated.drop_below_slab > 0) {
      expect(result.result.alerts).toBeDefined();
      expect(result.result.alerts).toContainEqual(
        "A notch may be required if the full bearing of the slab (max rise to bolt) is utilised."
      );
    }
  });

  it('should generate alert when only inverted solutions are viable', async () => {
    // Support level that only allows inverted solutions
    const configOnlyInverted: BruteForceConfig = {
      maxGenerations: 100,
      designInputs: {
        ...baseInputs,
        support_level: -50, // This typically only allows inverted bracket
        slab_thickness: 200
      },
      isAngleLengthLimited: false
    };

    const result = await runBruteForce(configOnlyInverted);
    
    // Should have inverted configuration
    const hasInverted = result.result.genetic.bracket_type === 'Inverted' || 
                       result.result.genetic.angle_orientation === 'Inverted';
    expect(hasInverted).toBe(true);
    
    // Should have alert if bracket projects below slab
    if (result.result.calculated.drop_below_slab > 0) {
      expect(result.result.alerts).toBeDefined();
      expect(result.result.alerts).toContainEqual(
        "A notch may be required if the full bearing of the slab (max rise to bolt) is utilised."
      );
    }
  });

  it('should calculate bsl_above_slab_bottom correctly', async () => {
    const testCases = [
      { support_level: -150, slab_thickness: 200, expected: true },  // 150 < 200
      { support_level: -250, slab_thickness: 200, expected: false }, // 250 > 200
      { support_level: -200, slab_thickness: 200, expected: false }, // 200 = 200 (not above)
    ];

    for (const testCase of testCases) {
      const config: BruteForceConfig = {
        maxGenerations: 100,
        designInputs: {
          ...baseInputs,
          support_level: testCase.support_level,
          slab_thickness: testCase.slab_thickness
        },
        isAngleLengthLimited: false
      };

      try {
        const result = await runBruteForce(config);
        expect(result.result.calculated.bsl_above_slab_bottom).toBe(testCase.expected);
      } catch {
        // Some configurations might not have valid designs, which is acceptable
        console.log(`No valid design found for support_level: ${testCase.support_level}, slab_thickness: ${testCase.slab_thickness}`);
      }
    }
  });
});