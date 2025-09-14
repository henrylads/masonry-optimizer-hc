import {
  parseCsvToChannelSpecs,
  validateChannelSpec,
  ChannelSpecSchema,
  type ParseResult
} from '@/utils/csv-parser';
import type { ChannelSpec } from '@/types/channelSpecs';

describe('CSV Parser', () => {
  describe('parseCsvToChannelSpecs', () => {
    test('should parse simple CPRO38 CSV data correctly', () => {
      const csvData = `"CPRO38- MOSOCON- MBA-CE 38/17, 3025mm, M12",Slab Thickness mm ,Top Edge Distance mm,Bottom Edge Distance mm,Spacing mm,Nd kN,Nd uf %,Vd kN,Vd uf %,Comb uf %,,,,,,
,200,75,125,200,7.75,99.70,7.45,99.70,165.1,,,,,,
,,,,250,9.45,100.00,8.55,100.00,166.7,,,,,,
,,,,300,10.75,99.60,10.35,99.80,166.2,,,,,,`;

      const result: ParseResult = parseCsvToChannelSpecs(csvData);

      expect(result.errors).toHaveLength(0);
      expect(result.specs).toHaveLength(3);

      // Check first spec
      const firstSpec = result.specs[0];
      expect(firstSpec.id).toBe('CPRO38_200_200');
      expect(firstSpec.channelType).toBe('CPRO38');
      expect(firstSpec.slabThickness).toBe(200);
      expect(firstSpec.bracketCentres).toBe(200);
      expect(firstSpec.edgeDistances.top).toBe(75);
      expect(firstSpec.edgeDistances.bottom).toBe(125);
      expect(firstSpec.maxForces.tension).toBeCloseTo(7.75, 2);
      expect(firstSpec.maxForces.shear).toBeCloseTo(7.45, 2);
      expect(firstSpec.utilizationFactors?.tension).toBeCloseTo(99.70, 2);
      expect(firstSpec.utilizationFactors?.shear).toBeCloseTo(99.70, 2);
      expect(firstSpec.utilizationFactors?.combined).toBeCloseTo(165.1, 1);

      // Check second spec (inherits slab thickness and edge distances)
      const secondSpec = result.specs[1];
      expect(secondSpec.id).toBe('CPRO38_200_250');
      expect(secondSpec.slabThickness).toBe(200); // Inherited
      expect(secondSpec.bracketCentres).toBe(250);
      expect(secondSpec.edgeDistances.top).toBe(75); // Inherited
      expect(secondSpec.edgeDistances.bottom).toBe(125); // Inherited
      expect(secondSpec.maxForces.tension).toBeCloseTo(9.45, 2);
    });

    test('should parse R-HPTIII-70 CSV data with 200% utilization factors', () => {
      const csvData = `R-HPTIII A4 M12 (70mm  M12 embedment),Slab Thickness mm ,Top Edge Distance mm,Bottom Edge Distance mm,Spacing mm,Nd kN,Nd uf %,Vd kN,Vd uf %,Comb %,,C32 concrete has been used,,,,
,200,75,125,200,12.76,100.00,6.46,100.00,200.00%,,,,,,
,,,,250,13.33,100.00,8.45,100.00,200.00%,,,,,Axial,Shear`;

      const result: ParseResult = parseCsvToChannelSpecs(csvData);

      expect(result.errors).toHaveLength(0);
      expect(result.specs).toHaveLength(2);

      const firstSpec = result.specs[0];
      expect(firstSpec.id).toBe('R-HPTIII-70_200_200');
      expect(firstSpec.channelType).toBe('R-HPTIII-70');
      expect(firstSpec.utilizationFactors?.combined).toBeCloseTo(200.00, 2);
    });

    test('should parse R-HPTIII-90 CSV data correctly', () => {
      const csvData = `R-HPTIII A4 M12 (90mm  M12 embedment),Slab Thickness mm ,Top Edge Distance mm,Bottom Edge Distance mm,Spacing mm,Nd kN,Nd uf %,Vd kN,Vd uf %,Comb %,,,,,,
,200,75,125,300,15.92,100.00,9.99,100.00,200.00%,,,,,,`;

      const result: ParseResult = parseCsvToChannelSpecs(csvData);

      expect(result.errors).toHaveLength(0);
      expect(result.specs).toHaveLength(1);

      const spec = result.specs[0];
      expect(spec.channelType).toBe('R-HPTIII-90');
      expect(spec.id).toBe('R-HPTIII-90_200_300');
    });

    test('should handle multiple slab thicknesses correctly', () => {
      const csvData = `"CPRO50- MOSOCON-MBA-CE 50/31, 3025mm, M12",Slab Thickness mm ,Top Edge Distance mm,Bottom Edge Distance mm,Spacing mm,Nd kN,Nd uf %,Vd kN,Vd uf %,Comb %,,,,,,
,200,75,125,200,9.60,99.80,7.45,100.00,166.5,,,,,,
,225,75,150,200,9.6,99.80,8.60,99.70,166.2,,,,,,
,250,75,175,200,9.6,99.80,9.90,9.60,166.1,,,,,,`;

      const result: ParseResult = parseCsvToChannelSpecs(csvData);

      expect(result.errors).toHaveLength(0);
      expect(result.specs).toHaveLength(3);

      // Check slab thickness progression
      expect(result.specs[0].slabThickness).toBe(200);
      expect(result.specs[1].slabThickness).toBe(225);
      expect(result.specs[2].slabThickness).toBe(250);

      // Check edge distance progression
      expect(result.specs[0].edgeDistances.bottom).toBe(125);
      expect(result.specs[1].edgeDistances.bottom).toBe(150);
      expect(result.specs[2].edgeDistances.bottom).toBe(175);
    });

    test('should handle empty lines and malformed data gracefully', () => {
      const csvData = `"CPRO38- MOSOCON- MBA-CE 38/17, 3025mm, M12",Slab Thickness mm ,Top Edge Distance mm,Bottom Edge Distance mm,Spacing mm,Nd kN,Nd uf %,Vd kN,Vd uf %,Comb uf %,,,,,,

,200,75,125,200,7.75,99.70,7.45,99.70,165.1,,,,,,
invalid,line,with,not,enough,columns
,,,,250,9.45,100.00,8.55,100.00,166.7,,,,,,`;

      const result: ParseResult = parseCsvToChannelSpecs(csvData);

      expect(result.specs).toHaveLength(2);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('Insufficient columns'))).toBe(true);
    });

    test('should warn about missing channel types', () => {
      const csvData = `,200,75,125,200,7.75,99.70,7.45,99.70,165.1,,,,,,
,,,,250,9.45,100.00,8.55,100.00,166.7,,,,,,`;

      const result: ParseResult = parseCsvToChannelSpecs(csvData);

      expect(result.specs).toHaveLength(0);
      expect(result.warnings.some(w => w.includes('No valid channel type found'))).toBe(true);
    });

    test('should handle missing force values', () => {
      const csvData = `"CPRO38- MOSOCON- MBA-CE 38/17, 3025mm, M12",Slab Thickness mm ,Top Edge Distance mm,Bottom Edge Distance mm,Spacing mm,Nd kN,Nd uf %,Vd kN,Vd uf %,Comb uf %,,,,,,
,200,75,125,200,,99.70,7.45,99.70,165.1,,,,,,
,,,,250,9.45,100.00,,100.00,166.7,,,,,,`;

      const result: ParseResult = parseCsvToChannelSpecs(csvData);

      expect(result.specs).toHaveLength(0);
      expect(result.warnings.some(w => w.includes('Invalid force values'))).toBe(true);
    });

    test('should validate generated specs with Zod schema', () => {
      const csvData = `"CPRO38- MOSOCON- MBA-CE 38/17, 3025mm, M12",Slab Thickness mm ,Top Edge Distance mm,Bottom Edge Distance mm,Spacing mm,Nd kN,Nd uf %,Vd kN,Vd uf %,Comb uf %,,,,,,
,200,75,125,200,7.75,99.70,7.45,99.70,165.1,,,,,,`;

      const result: ParseResult = parseCsvToChannelSpecs(csvData);

      expect(result.errors).toHaveLength(0);
      expect(result.specs).toHaveLength(1);

      // Validate that the generated spec passes Zod validation
      const validation = ChannelSpecSchema.safeParse(result.specs[0]);
      expect(validation.success).toBe(true);
    });
  });

  describe('validateChannelSpec', () => {
    test('should return no errors for valid spec', () => {
      const validSpec: ChannelSpec = {
        id: 'CPRO38_200_300',
        channelType: 'CPRO38',
        slabThickness: 200,
        bracketCentres: 300,
        edgeDistances: { top: 75, bottom: 125 },
        maxForces: { tension: 10.75, shear: 10.35 },
        utilizationFactors: { tension: 99.6, shear: 99.8, combined: 166.2 }
      };

      const errors = validateChannelSpec(validSpec);
      expect(errors).toHaveLength(0);
    });

    test('should return errors for invalid spec', () => {
      const invalidSpec: any = {
        id: '',
        channelType: 'CPRO38',
        slabThickness: -1,
        bracketCentres: 0,
        edgeDistances: { top: 0, bottom: -5 },
        maxForces: { tension: -1, shear: 0 }
      };

      const errors = validateChannelSpec(invalidSpec);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.includes('Channel spec ID is required'))).toBe(true);
      expect(errors.some(e => e.includes('Slab thickness must be positive'))).toBe(true);
      expect(errors.some(e => e.includes('Bracket centres must be positive'))).toBe(true);
    });

    test('should validate R-HPTIII channel types', () => {
      const r70Spec: ChannelSpec = {
        id: 'R-HPTIII-70_200_300',
        channelType: 'R-HPTIII-70',
        slabThickness: 200,
        bracketCentres: 300,
        edgeDistances: { top: 75, bottom: 125 },
        maxForces: { tension: 13.33, shear: 9.62 }
      };

      const r90Spec: ChannelSpec = {
        id: 'R-HPTIII-90_200_300',
        channelType: 'R-HPTIII-90',
        slabThickness: 200,
        bracketCentres: 300,
        edgeDistances: { top: 75, bottom: 125 },
        maxForces: { tension: 15.92, shear: 9.99 }
      };

      expect(validateChannelSpec(r70Spec)).toHaveLength(0);
      expect(validateChannelSpec(r90Spec)).toHaveLength(0);
    });

    test('should handle specs with and without utilization factors', () => {
      const specWithoutUF: ChannelSpec = {
        id: 'test_without_uf',
        channelType: 'CPRO38',
        slabThickness: 200,
        bracketCentres: 300,
        edgeDistances: { top: 75, bottom: 125 },
        maxForces: { tension: 10.75, shear: 10.35 }
      };

      const specWithUF: ChannelSpec = {
        id: 'test_with_uf',
        channelType: 'CPRO38',
        slabThickness: 200,
        bracketCentres: 300,
        edgeDistances: { top: 75, bottom: 125 },
        maxForces: { tension: 10.75, shear: 10.35 },
        utilizationFactors: { tension: 99.6, shear: 99.8, combined: 166.2 }
      };

      expect(validateChannelSpec(specWithoutUF)).toHaveLength(0);
      expect(validateChannelSpec(specWithUF)).toHaveLength(0);
    });

    test('should validate high utilization factors for R-HPTIII products', () => {
      const highUFSpec: ChannelSpec = {
        id: 'R-HPTIII-70_200_300',
        channelType: 'R-HPTIII-70',
        slabThickness: 200,
        bracketCentres: 300,
        edgeDistances: { top: 75, bottom: 125 },
        maxForces: { tension: 13.33, shear: 9.62 },
        utilizationFactors: { tension: 100.0, shear: 100.0, combined: 200.0 }
      };

      const errors = validateChannelSpec(highUFSpec);
      expect(errors).toHaveLength(0);
    });

    test('should reject utilization factors above 1000%', () => {
      const extremeUFSpec: ChannelSpec = {
        id: 'extreme_uf_test',
        channelType: 'R-HPTIII-70',
        slabThickness: 200,
        bracketCentres: 300,
        edgeDistances: { top: 75, bottom: 125 },
        maxForces: { tension: 13.33, shear: 9.62 },
        utilizationFactors: { tension: 1001.0, shear: 100.0, combined: 200.0 }
      };

      const errors = validateChannelSpec(extremeUFSpec);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.includes('Number must be less than or equal to 1000'))).toBe(true);
    });
  });

  describe('Edge cases and error handling', () => {
    test('should handle CSV with only headers', () => {
      const csvData = `"CPRO38- MOSOCON- MBA-CE 38/17, 3025mm, M12",Slab Thickness mm ,Top Edge Distance mm,Bottom Edge Distance mm,Spacing mm,Nd kN,Nd uf %,Vd kN,Vd uf %,Comb uf %,,,,,,`;

      const result: ParseResult = parseCsvToChannelSpecs(csvData);

      expect(result.specs).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    test('should handle empty CSV content', () => {
      const result: ParseResult = parseCsvToChannelSpecs('');

      expect(result.specs).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    test('should handle CSV with unknown channel type', () => {
      const csvData = `"UNKNOWN_CHANNEL_TYPE",Slab Thickness mm ,Top Edge Distance mm,Bottom Edge Distance mm,Spacing mm,Nd kN,Nd uf %,Vd kN,Vd uf %,Comb uf %,,,,,,
,200,75,125,200,7.75,99.70,7.45,99.70,165.1,,,,,,`;

      const result: ParseResult = parseCsvToChannelSpecs(csvData);

      expect(result.specs).toHaveLength(0);
      expect(result.warnings.some(w => w.includes('No valid channel type found'))).toBe(true);
    });

    test('should handle incomplete numeric values gracefully', () => {
      const csvData = `"CPRO38- MOSOCON- MBA-CE 38/17, 3025mm, M12",Slab Thickness mm ,Top Edge Distance mm,Bottom Edge Distance mm,Spacing mm,Nd kN,Nd uf %,Vd kN,Vd uf %,Comb uf %,,,,,,
,abc,xyz,125,200,7.75,99.70,7.45,99.70,165.1,,,,,,`;

      const result: ParseResult = parseCsvToChannelSpecs(csvData);

      expect(result.specs).toHaveLength(0);
      expect(result.warnings.some(w => w.includes('No valid slab thickness found'))).toBe(true);
    });
  });
});