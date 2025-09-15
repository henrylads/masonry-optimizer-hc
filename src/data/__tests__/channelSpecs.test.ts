import { getChannelSpec, getValidBracketCentres, addChannelSpec, initializeSpecsFromCsv } from '@/data/channelSpecs';
import type { ChannelSpec, ChannelType } from '@/types/channelSpecs';

describe('Channel Specs - CPRO50', () => {
  test('should return correct spec for CPRO50 200mm slab at 300mm centres', () => {
    const spec = getChannelSpec('CPRO50', 200, 300);
    expect(spec).toBeDefined();
    expect(spec?.edgeDistances.top).toBe(75);
    expect(spec?.edgeDistances.bottom).toBe(125);
    expect(spec?.maxForces.tension).toBeCloseTo(13.35, 2);
    expect(spec?.maxForces.shear).toBeCloseTo(10.35, 2);
  });

  test('should list valid bracket centres for CPRO50 at 200mm slab', () => {
    const centres = getValidBracketCentres('CPRO50', 200);
    expect(centres).toEqual([200, 250, 300, 350, 400, 450, 500]);
  });
});

describe('Channel Specs - Type System Extensions', () => {
  test('should accept R-HPTIII-70 as valid ChannelType', () => {
    const mockSpec: ChannelSpec = {
      id: 'R-HPTIII-70_200_300',
      channelType: 'R-HPTIII-70' as ChannelType,
      slabThickness: 200,
      bracketCentres: 300,
      edgeDistances: { top: 75, bottom: 125 },
      maxForces: { tension: 13.33, shear: 9.62 },
      utilizationFactors: { tension: 100.00, shear: 100.00, combined: 200.00 }
    };

    expect(() => addChannelSpec(mockSpec)).not.toThrow();
  });

  test('should accept R-HPTIII-90 as valid ChannelType', () => {
    const mockSpec: ChannelSpec = {
      id: 'R-HPTIII-90_200_300',
      channelType: 'R-HPTIII-90' as ChannelType,
      slabThickness: 200,
      bracketCentres: 300,
      edgeDistances: { top: 75, bottom: 125 },
      maxForces: { tension: 15.92, shear: 9.99 },
      utilizationFactors: { tension: 100.00, shear: 100.00, combined: 200.00 }
    };

    expect(() => addChannelSpec(mockSpec)).not.toThrow();
  });

  test('should handle ChannelSpec with optional utilizationFactors', () => {
    const specWithoutUF: ChannelSpec = {
      id: 'test_spec_no_uf',
      channelType: 'CPRO38',
      slabThickness: 200,
      bracketCentres: 300,
      edgeDistances: { top: 75, bottom: 125 },
      maxForces: { tension: 10.75, shear: 10.35 }
    };

    const specWithUF: ChannelSpec = {
      id: 'test_spec_with_uf',
      channelType: 'CPRO38',
      slabThickness: 200,
      bracketCentres: 350,
      edgeDistances: { top: 75, bottom: 125 },
      maxForces: { tension: 13.00, shear: 11.90 },
      utilizationFactors: { tension: 99.80, shear: 99.70, combined: 164.4 }
    };

    expect(() => addChannelSpec(specWithoutUF)).not.toThrow();
    expect(() => addChannelSpec(specWithUF)).not.toThrow();
  });

  test('should validate all supported ChannelType values', () => {
    const supportedTypes: ChannelType[] = ['CPRO38', 'CPRO50', 'R-HPTIII-70', 'R-HPTIII-90'];

    supportedTypes.forEach((channelType) => {
      const spec: ChannelSpec = {
        id: `${channelType}_test_spec`,
        channelType,
        slabThickness: 200,
        bracketCentres: 300,
        edgeDistances: { top: 75, bottom: 125 },
        maxForces: { tension: 10.0, shear: 10.0 }
      };

      expect(() => addChannelSpec(spec)).not.toThrow();
    });
  });
});

describe('Channel Specs - CSV Integration', () => {
  test('should initialize specs from CSV data correctly', () => {
    const csvData = `"CPRO38- MOSOCON- MBA-CE 38/17, 3025mm, M12",Slab Thickness mm ,Top Edge Distance mm,Bottom Edge Distance mm,Spacing mm,Nd kN,Nd uf %,Vd kN,Vd uf %,Comb uf %,,,,,,
,200,75,125,200,7.75,99.70,7.45,99.70,165.1,,,,,,
,,,,250,9.45,100.00,8.55,100.00,166.7,,,,,,
"CPRO50- MOSOCON-MBA-CE 50/31, 3025mm, M12",Slab Thickness mm ,Top Edge Distance mm,Bottom Edge Distance mm,Spacing mm,Nd kN,Nd uf %,Vd kN,Vd uf %,Comb %,,,,,,
,200,75,125,300,13.35,99.70,10.35,99.80,166.2,,,,,,`;

    const result = initializeSpecsFromCsv(csvData);

    expect(result.specsLoaded).toBe(3);
    expect(result.errors).toHaveLength(0);

    // Test that specs are accessible via existing API
    const cpro38Spec = getChannelSpec('CPRO38', 200, 250);
    expect(cpro38Spec).toBeDefined();
    expect(cpro38Spec?.maxForces.tension).toBeCloseTo(9.45, 2);
    expect(cpro38Spec?.utilizationFactors?.tension).toBeCloseTo(100.00, 2);

    const cpro50Spec = getChannelSpec('CPRO50', 200, 300);
    expect(cpro50Spec).toBeDefined();
    expect(cpro50Spec?.maxForces.tension).toBeCloseTo(13.35, 2);
  });

  test('should handle R-HPTIII specs from CSV data', () => {
    const csvData = `R-HPTIII A4 M12 (70mm  M12 embedment),Slab Thickness mm ,Top Edge Distance mm,Bottom Edge Distance mm,Spacing mm,Nd kN,Nd uf %,Vd kN,Vd uf %,Comb %,,C32 concrete has been used,,,,
,200,75,125,300,13.33,100.00,9.62,100.00,200.00%,,,,,,
R-HPTIII A4 M12 (90mm  M12 embedment),Slab Thickness mm ,Top Edge Distance mm,Bottom Edge Distance mm,Spacing mm,Nd kN,Nd uf %,Vd kN,Vd uf %,Comb %,,,,,,
,200,75,125,300,15.92,100.00,9.99,100.00,200.00%,,,,,,`;

    const result = initializeSpecsFromCsv(csvData);

    expect(result.specsLoaded).toBe(2);
    expect(result.errors).toHaveLength(0);

    // Test R-HPTIII-70 spec
    const r70Spec = getChannelSpec('R-HPTIII-70', 200, 300);
    expect(r70Spec).toBeDefined();
    expect(r70Spec?.maxForces.tension).toBeCloseTo(13.33, 2);
    expect(r70Spec?.utilizationFactors?.combined).toBe(200.0);

    // Test R-HPTIII-90 spec
    const r90Spec = getChannelSpec('R-HPTIII-90', 200, 300);
    expect(r90Spec).toBeDefined();
    expect(r90Spec?.maxForces.tension).toBeCloseTo(15.92, 2);
    expect(r90Spec?.utilizationFactors?.combined).toBe(200.0);
  });
});

