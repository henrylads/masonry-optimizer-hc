import { runBruteForce } from '../bruteForceAlgorithm';
import type { DesignInputs } from '@/types/designInputs';
import type { BruteForceConfig } from '../bruteForceAlgorithm';

describe('Orientation Flipping Integration Test - Optimization Flow', () => {
  test('optimization with user parameters should show flipped orientation in results', async () => {
    console.log('\\n=== OPTIMIZATION INTEGRATION TEST ===');
    console.log('Testing full optimization flow with user parameters:');
    console.log('225mm slab, 100mm cavity, 50mm support, 30mm exclusion');

    // User's exact parameters converted to DesignInputs format
    const designInputs: DesignInputs = {
      // Basic parameters
      slab_thickness: 225,
      cavity_width: 100,
      support_level: 50,           // Positive = should use inverted bracket
      characteristic_load: 10,

      // Required parameters for DesignInputs
      top_critical_edge: 75,
      bottom_critical_edge: 150,
      notch_height: 0,
      notch_depth: 0,

      // Optional parameters
      facade_thickness: 102.5,
      load_position: 1/3,
      front_offset: 12,
      isolation_shim_thickness: 3,
      masonry_thickness: 102.5,

      // Exclusion zone parameters
      enable_angle_extension: true,
      max_allowable_bracket_extension: -30,  // 30mm below slab

      // Optional fixing position
      fixing_position: 75
    };

    // Create BruteForceConfig
    const config: BruteForceConfig = {
      maxGenerations: 1000,
      designInputs,
      isAngleLengthLimited: false
    };

    console.log('\\n--- RUNNING OPTIMIZATION ---');
    console.log('Input parameters:', {
      slab_thickness: designInputs.slab_thickness,
      cavity_width: designInputs.cavity_width,
      support_level: designInputs.support_level,
      exclusion_zone: designInputs.max_allowable_bracket_extension,
      enable_angle_extension: designInputs.enable_angle_extension
    });

    // Run optimization
    const result = await runBruteForce(config);

    console.log('\\n--- OPTIMIZATION RESULTS ---');
    console.log('Optimization completed, checking result...');

    if (result.result) {
      const bestDesign = result.result;

      console.log('\\n--- BEST DESIGN ANALYSIS ---');
      console.log('Bracket type:', bestDesign.genetic.bracket_type);
      console.log('Angle orientation:', bestDesign.genetic.angle_orientation);
      console.log('Support level:', bestDesign.calculated.support_level);

      console.log('\\n--- ANGLE EXTENSION ANALYSIS ---');
      const angleExt = bestDesign.calculated.angle_extension_result;
      if (angleExt) {
        console.log('Extension applied:', angleExt.extension_applied);
        console.log('Orientation flipped:', angleExt.angle_orientation_flipped);
        console.log('Original orientation:', angleExt.original_angle_orientation);
        console.log('Final orientation:', angleExt.final_angle_orientation);
        console.log('Flip reason:', angleExt.flip_reason);
        console.log('Bracket reduction:', angleExt.bracket_reduction, 'mm');
        console.log('Angle extension:', angleExt.angle_extension, 'mm');
      } else {
        console.log('No angle extension result found');
      }

      // Key assertions
      console.log('\\n--- VERIFICATION ---');

      // Should be inverted bracket for positive support level
      expect(bestDesign.genetic.bracket_type).toBe('Inverted');
      console.log('✅ Bracket type is correctly Inverted for positive support level');

      // Should have angle extension applied due to exclusion zone
      expect(angleExt?.extension_applied).toBe(true);
      console.log('✅ Angle extension was applied due to exclusion zone');

      // Should have orientation flipped from Standard to Inverted
      expect(angleExt?.angle_orientation_flipped).toBe(true);
      expect(angleExt?.original_angle_orientation).toBe('Standard');
      expect(angleExt?.final_angle_orientation).toBe('Inverted');
      console.log('✅ Angle orientation was flipped: Standard → Inverted');

      // CRITICAL TEST: genetic.angle_orientation should now show the flipped value
      expect(bestDesign.genetic.angle_orientation).toBe('Inverted');
      console.log('✅ GENETIC ANGLE ORIENTATION shows final flipped value: Inverted');

      // Should have meaningful angle extension
      expect(angleExt?.angle_extension).toBeGreaterThan(0);
      console.log('✅ Angle extension provided:', angleExt?.angle_extension, 'mm');

      console.log('\\n🎯 TEST PASSED: Orientation flipping now works in optimization flow!');

    } else {
      console.log('❌ No optimization result found');
      throw new Error('Optimization failed: No result found');
    }

    console.log('\\n=== INTEGRATION TEST COMPLETE ===\\n');
  }, 30000); // 30 second timeout for optimization

  test('control test: loose exclusion zone should not flip orientation', async () => {
    console.log('\\n=== CONTROL TEST: Loose Exclusion Zone ===');

    const controlDesignInputs: DesignInputs = {
      // Same as above but with loose exclusion zone
      slab_thickness: 225,
      cavity_width: 100,
      support_level: 50,
      characteristic_load: 10,

      // Required parameters for DesignInputs
      top_critical_edge: 75,
      bottom_critical_edge: 150,
      notch_height: 0,
      notch_depth: 0,

      // Optional parameters
      facade_thickness: 102.5,
      load_position: 1/3,
      front_offset: 12,
      isolation_shim_thickness: 3,
      masonry_thickness: 102.5,

      // Loose exclusion zone
      enable_angle_extension: true,
      max_allowable_bracket_extension: -500,  // Very loose (500mm below slab)

      // Optional fixing position
      fixing_position: 75
    };

    const controlConfig: BruteForceConfig = {
      maxGenerations: 1000,
      designInputs: controlDesignInputs,
      isAngleLengthLimited: false
    };

    const result = await runBruteForce(controlConfig);

    console.log('Control test - loose exclusion zone results:');
    if (result.result) {
      const angleExt = result.result.calculated.angle_extension_result;

      console.log('Extension applied:', angleExt?.extension_applied || false);
      console.log('Orientation flipped:', angleExt?.angle_orientation_flipped || false);
      console.log('Final angle orientation:', result.result.genetic.angle_orientation);

      // With loose exclusion zone, no extension/flipping should occur
      expect(angleExt?.extension_applied || false).toBe(false);
      expect(angleExt?.angle_orientation_flipped || false).toBe(false);

      console.log('✅ Control test: loose exclusion zone correctly prevents flipping');
    }

    console.log('=== CONTROL TEST COMPLETE ===\\n');
  }, 30000);
});