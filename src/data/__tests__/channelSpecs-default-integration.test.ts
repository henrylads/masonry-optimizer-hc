import { getChannelSpec, getAvailableChannelTypes, getValidBracketCentres } from '@/data/channelSpecs';

describe('Channel Specs - Default CSV Integration Test', () => {
  test('should have all 4 channel types available by default', () => {
    const availableTypes = getAvailableChannelTypes();

    expect(availableTypes).toContain('CPRO38');
    expect(availableTypes).toContain('CPRO50');
    expect(availableTypes).toContain('R-HPTIII-70');
    expect(availableTypes).toContain('R-HPTIII-90');
    expect(availableTypes).toHaveLength(4);
  });

  test('should provide R-HPTIII specs out of the box', () => {
    // These specs should be available immediately without any setup
    const r70Spec = getChannelSpec('R-HPTIII-70', 200, 300);
    const r90Spec = getChannelSpec('R-HPTIII-90', 200, 300);

    expect(r70Spec).toBeDefined();
    expect(r90Spec).toBeDefined();

    expect(r70Spec?.channelType).toBe('R-HPTIII-70');
    expect(r90Spec?.channelType).toBe('R-HPTIII-90');

    // Should have utilization factors
    expect(r70Spec?.utilizationFactors?.combined).toBe(200.0);
    expect(r90Spec?.utilizationFactors?.combined).toBe(200.0);
  });

  test('should maintain backward compatibility with existing CPRO specs', () => {
    // These should still work exactly as before, but now with utilization factors
    const cpro38 = getChannelSpec('CPRO38', 200, 300);
    const cpro50 = getChannelSpec('CPRO50', 200, 300);

    expect(cpro38).toBeDefined();
    expect(cpro50).toBeDefined();

    expect(cpro38?.maxForces.tension).toBeCloseTo(10.75, 2);
    expect(cpro50?.maxForces.tension).toBeCloseTo(13.35, 2);

    // Now should also have utilization factors
    expect(cpro38?.utilizationFactors).toBeDefined();
    expect(cpro50?.utilizationFactors).toBeDefined();
  });

  test('should provide consistent bracket centres across all channel types', () => {
    const expectedCentres = [200, 250, 300, 350, 400, 450, 500];

    expect(getValidBracketCentres('CPRO38', 200)).toEqual(expectedCentres);
    expect(getValidBracketCentres('CPRO50', 200)).toEqual(expectedCentres);
    expect(getValidBracketCentres('R-HPTIII-70', 200)).toEqual(expectedCentres);
    expect(getValidBracketCentres('R-HPTIII-90', 200)).toEqual(expectedCentres);
  });

  test('should have higher capacity R-HPTIII-90 compared to R-HPTIII-70', () => {
    const r70 = getChannelSpec('R-HPTIII-70', 200, 300);
    const r90 = getChannelSpec('R-HPTIII-90', 200, 300);

    expect(r70).toBeDefined();
    expect(r90).toBeDefined();

    // R-HPTIII-90 should have higher tension capacity
    expect(r90!.maxForces.tension).toBeGreaterThan(r70!.maxForces.tension);
  });
});