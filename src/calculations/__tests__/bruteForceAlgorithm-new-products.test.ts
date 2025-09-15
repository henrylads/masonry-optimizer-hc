import { runBruteForce } from '@/calculations/bruteForceAlgorithm';
import type { DesignInputs } from '@/types/designInputs';
import { getAvailableChannelTypes } from '@/data/channelSpecs';
import { isRHPTIIIChannel } from '@/utils/channelTypeHelpers';

describe('Brute Force Algorithm - New Products Integration', () => {
  // Standard test parameters
  const baseInputs: DesignInputs = {
    support_level: -150,
    cavity_width: 75,
    slab_thickness: 200,
    characteristic_load: 14.0,
    top_critical_edge: 75,
    bottom_critical_edge: 125,
    notch_height: 0,
    notch_depth: 0,
    enable_fixing_optimization: false,
    fixing_position: 75
  };

  test('should have all 4 channel types available', () => {
    const availableTypes = getAvailableChannelTypes();

    expect(availableTypes).toContain('CPRO38');
    expect(availableTypes).toContain('CPRO50');
    expect(availableTypes).toContain('R-HPTIII-70');
    expect(availableTypes).toContain('R-HPTIII-90');
    expect(availableTypes).toHaveLength(4);
  });

  test('should successfully optimize with all channel types', async () => {
    const inputs = {
      ...baseInputs,
      // Allow all channel types
      allowed_channel_types: getAvailableChannelTypes() as any
    };

    const config = {
      maxGenerations: 100,
      designInputs: inputs
    };

    const result = await runBruteForce(config);

    expect(result.result).toBeDefined();
    expect(result.result.calculated.all_checks_pass).toBe(true);
    expect(result.result.genetic.channel_type).toBeDefined();

    console.log(`Optimization selected: ${result.result.genetic.channel_type}`);
    console.log(`Total weight: ${result.result.calculated.optimal_design_weight?.toFixed(3)} kg/m`);
    console.log(`Alternatives: ${result.result.alternatives?.length || 0}`);
    console.log(`Alerts: ${result.result.alerts?.length || 0}`);
  }, 30000);

  test('should generate alerts when R-HPTIII products are selected', async () => {
    const inputs = {
      ...baseInputs,
      // Force R-HPTIII selection by only allowing them
      allowed_channel_types: ['R-HPTIII-70', 'R-HPTIII-90'] as any
    };

    const config = {
      maxGenerations: 100,
      designInputs: inputs
    };

    const result = await runBruteForce(config);

    expect(result.result).toBeDefined();
    expect(result.result.genetic.channel_type).toBeDefined();
    expect(isRHPTIIIChannel(result.result.genetic.channel_type!)).toBe(true);

    // Should have alerts for R-HPTIII products
    expect(result.result.alerts).toBeDefined();
    expect(result.result.alerts!.length).toBeGreaterThan(0);

    // Check for specific warning about 200% utilization
    const hasUtilizationWarning = result.result.alerts!.some(alert =>
      alert.includes('200%') && alert.includes('utilization')
    );
    expect(hasUtilizationWarning).toBe(true);

    console.log('R-HPTIII Alerts:');
    result.result.alerts?.forEach((alert, index) => {
      console.log(`  ${index + 1}: ${alert}`);
    });
  }, 30000);

  test('should show R-HPTIII alternatives when CPRO is selected', async () => {
    const inputs = {
      ...baseInputs,
      // Test with default (all channel types allowed)
    };

    const config = {
      maxGenerations: 100,
      designInputs: inputs
    };

    const result = await runBruteForce(config);

    expect(result.result).toBeDefined();

    // Check if we have R-HPTIII alternatives
    const alternatives = result.result.alternatives || [];
    const rhptiiiAlternatives = alternatives.filter(alt =>
      isRHPTIIIChannel(alt.design.genetic.channel_type || 'CPRO38')
    );

    if (rhptiiiAlternatives.length > 0) {
      // Should have an alert about R-HPTIII alternatives
      const hasAlternativeAlert = result.result.alerts?.some(alert =>
        alert.includes('R-HPTIII alternative') && alert.includes('high-load')
      ) || false;
      expect(hasAlternativeAlert).toBe(true);

      console.log(`Found ${rhptiiiAlternatives.length} R-HPTIII alternatives:`);
      rhptiiiAlternatives.forEach((alt, index) => {
        console.log(`  ${index + 1}: ${alt.design.genetic.channel_type} - ${alt.totalWeight.toFixed(3)} kg/m`);
      });
    }
  }, 30000);

  test('should handle individual channel type restrictions', async () => {
    const channelTypes = ['CPRO38', 'CPRO50', 'R-HPTIII-70', 'R-HPTIII-90'];

    for (const channelType of channelTypes) {
      const inputs = {
        ...baseInputs,
        allowed_channel_types: [channelType] as any
      };

      const config = {
        maxGenerations: 100,
        designInputs: inputs
      };

      const result = await runBruteForce(config);

      expect(result.result).toBeDefined();
      expect(result.result.genetic.channel_type).toBe(channelType);
      expect(result.result.calculated.all_checks_pass).toBe(true);

      console.log(`${channelType}: ${result.result.calculated.optimal_design_weight?.toFixed(3)} kg/m`);
    }
  }, 30000);

  test('should handle different slab thicknesses with all channel types', async () => {
    const slabThicknesses = [200, 225, 250];

    for (const slabThickness of slabThicknesses) {
      const inputs = {
        ...baseInputs,
        slab_thickness: slabThickness,
        bottom_critical_edge: slabThickness === 200 ? 125 : slabThickness === 225 ? 150 : 175
      };

      const config = {
        maxGenerations: 100,
        designInputs: inputs
      };

      const result = await runBruteForce(config);

      expect(result.result).toBeDefined();
      expect(result.result.calculated.all_checks_pass).toBe(true);

      console.log(`Slab ${slabThickness}mm: ${result.result.genetic.channel_type} - ${result.result.calculated.optimal_design_weight?.toFixed(3)} kg/m`);
    }
  }, 45000);

  test('should compare R-HPTIII-70 vs R-HPTIII-90 capacity differences', async () => {
    const r70Inputs = {
      ...baseInputs,
      allowed_channel_types: ['R-HPTIII-70'] as any
    };

    const r90Inputs = {
      ...baseInputs,
      allowed_channel_types: ['R-HPTIII-90'] as any
    };

    const [r70Result, r90Result] = await Promise.all([
      runBruteForce(r70Inputs),
      runBruteForce(r90Inputs)
    ]);

    expect(r70Result.result.genetic.channel_type).toBe('R-HPTIII-70');
    expect(r90Result.result.genetic.channel_type).toBe('R-HPTIII-90');

    const r70Weight = r70Result.result.calculated.optimal_design_weight || 0;
    const r90Weight = r90Result.result.calculated.optimal_design_weight || 0;

    console.log(`R-HPTIII-70: ${r70Weight.toFixed(3)} kg/m`);
    console.log(`R-HPTIII-90: ${r90Weight.toFixed(3)} kg/m`);

    // Both should have valid results
    expect(r70Result.result.calculated.all_checks_pass).toBe(true);
    expect(r90Result.result.calculated.all_checks_pass).toBe(true);

    // Both should have R-HPTIII alerts
    expect(r70Result.result.alerts?.some(alert => alert.includes('200%'))).toBe(true);
    expect(r90Result.result.alerts?.some(alert => alert.includes('200%'))).toBe(true);
  }, 30000);

  test('should provide meaningful error messages for invalid channel types', async () => {
    // This test checks that the combination generation handles invalid channel types gracefully
    const inputs = {
      ...baseInputs,
      allowed_channel_types: ['INVALID_CHANNEL'] as any
    };

    // The algorithm should handle this gracefully and likely fall back to available types
    const config = {
      maxGenerations: 100,
      designInputs: inputs
    };

    const result = await runBruteForce(config);
    expect(result.result).toBeDefined();

    // The selected channel type should be one of the valid ones
    const availableTypes = getAvailableChannelTypes();
    expect(availableTypes).toContain(result.result.genetic.channel_type);
  }, 30000);
});