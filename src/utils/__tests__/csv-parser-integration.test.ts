import fs from 'fs';
import path from 'path';
import { parseCsvToChannelSpecs, type ParseResult } from '@/utils/csv-parser';

describe('CSV Parser Integration Tests', () => {
  let csvContent: string;

  beforeAll(() => {
    // Load the actual CSV file
    const csvPath = path.join(process.cwd(), 'docs', 'Copy of Masonry Support Fixing Data- RA- Rev-P01-CM Info.xlsx - Sheet1.csv');
    csvContent = fs.readFileSync(csvPath, 'utf-8');
  });

  test('should parse the complete CSV file without errors', () => {
    const result: ParseResult = parseCsvToChannelSpecs(csvContent);

    // Log results for debugging
    console.log(`Parsed ${result.specs.length} specifications`);
    console.log(`Errors: ${result.errors.length}`);
    console.log(`Warnings: ${result.warnings.length}`);

    if (result.errors.length > 0) {
      console.log('Errors:', result.errors.slice(0, 5)); // Show first 5 errors
    }
    if (result.warnings.length > 0) {
      console.log('Warnings:', result.warnings.slice(0, 5)); // Show first 5 warnings
    }

    // We expect some specs to be parsed successfully
    expect(result.specs.length).toBeGreaterThan(0);

    // We expect all 4 channel types to be present
    const channelTypes = new Set(result.specs.map(s => s.channelType));
    expect(channelTypes.has('CPRO38')).toBe(true);
    expect(channelTypes.has('CPRO50')).toBe(true);
    expect(channelTypes.has('R-HPTIII-70')).toBe(true);
    expect(channelTypes.has('R-HPTIII-90')).toBe(true);
  });

  test('should parse expected number of specs for each channel type', () => {
    const result: ParseResult = parseCsvToChannelSpecs(csvContent);

    const specsByType = result.specs.reduce((acc, spec) => {
      acc[spec.channelType] = (acc[spec.channelType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('Specs by channel type:', specsByType);

    // Each channel type should have specs for 3 slab thicknesses (200, 225, 250)
    // and 7 spacing values (200, 250, 300, 350, 400, 450, 500)
    // So we expect 21 specs per channel type = 84 total
    expect(specsByType['CPRO38']).toBe(21);
    expect(specsByType['CPRO50']).toBe(21);
    expect(specsByType['R-HPTIII-70']).toBe(21);
    expect(specsByType['R-HPTIII-90']).toBe(21);
  });

  test('should correctly parse slab thicknesses and spacing values', () => {
    const result: ParseResult = parseCsvToChannelSpecs(csvContent);

    // Check slab thicknesses
    const slabThicknesses = new Set(result.specs.map(s => s.slabThickness));
    expect(slabThicknesses.has(200)).toBe(true);
    expect(slabThicknesses.has(225)).toBe(true);
    expect(slabThicknesses.has(250)).toBe(true);

    // Check spacing values
    const spacingValues = new Set(result.specs.map(s => s.bracketCentres));
    expect(spacingValues.has(200)).toBe(true);
    expect(spacingValues.has(250)).toBe(true);
    expect(spacingValues.has(300)).toBe(true);
    expect(spacingValues.has(350)).toBe(true);
    expect(spacingValues.has(400)).toBe(true);
    expect(spacingValues.has(450)).toBe(true);
    expect(spacingValues.has(500)).toBe(true);
  });

  test('should correctly parse edge distances for different slab thicknesses', () => {
    const result: ParseResult = parseCsvToChannelSpecs(csvContent);

    // Group specs by slab thickness
    const specsBySlabThickness = result.specs.reduce((acc, spec) => {
      const key = spec.slabThickness;
      if (!acc[key]) acc[key] = [];
      acc[key].push(spec);
      return acc;
    }, {} as Record<number, typeof result.specs>);

    // Check edge distances for 200mm slab (top: 75, bottom: 125)
    const specs200 = specsBySlabThickness[200];
    expect(specs200).toBeDefined();
    expect(specs200.every(s => s.edgeDistances.top === 75)).toBe(true);
    expect(specs200.every(s => s.edgeDistances.bottom === 125)).toBe(true);

    // Check edge distances for 225mm slab (top: 75, bottom: 150)
    const specs225 = specsBySlabThickness[225];
    expect(specs225).toBeDefined();
    expect(specs225.every(s => s.edgeDistances.top === 75)).toBe(true);
    expect(specs225.every(s => s.edgeDistances.bottom === 150)).toBe(true);

    // Check edge distances for 250mm slab (top: 75, bottom: 175)
    const specs250 = specsBySlabThickness[250];
    expect(specs250).toBeDefined();
    expect(specs250.every(s => s.edgeDistances.top === 75)).toBe(true);
    expect(specs250.every(s => s.edgeDistances.bottom === 175)).toBe(true);
  });

  test('should correctly parse utilization factors for R-HPTIII products', () => {
    const result: ParseResult = parseCsvToChannelSpecs(csvContent);

    // Filter R-HPTIII specs
    const rhptSpecs = result.specs.filter(s => s.channelType.includes('R-HPTIII'));

    // All R-HPTIII specs should have utilization factors
    expect(rhptSpecs.every(s => s.utilizationFactors !== undefined)).toBe(true);

    // All R-HPTIII specs should have 200% combined utilization factor
    expect(rhptSpecs.every(s => s.utilizationFactors?.combined === 200.0)).toBe(true);

    // All should have 100% tension and shear utilization factors
    expect(rhptSpecs.every(s => s.utilizationFactors?.tension === 100.0)).toBe(true);
    expect(rhptSpecs.every(s => s.utilizationFactors?.shear === 100.0)).toBe(true);
  });

  test('should validate that force values are reasonable', () => {
    const result: ParseResult = parseCsvToChannelSpecs(csvContent);

    // All specs should have positive force values
    expect(result.specs.every(s => s.maxForces.tension > 0)).toBe(true);
    expect(result.specs.every(s => s.maxForces.shear > 0)).toBe(true);

    // Force values should be within reasonable engineering ranges (0.1 to 100 kN)
    expect(result.specs.every(s => s.maxForces.tension >= 0.1 && s.maxForces.tension <= 100)).toBe(true);
    expect(result.specs.every(s => s.maxForces.shear >= 0.1 && s.maxForces.shear <= 100)).toBe(true);
  });

  test('should generate unique IDs for all specs', () => {
    const result: ParseResult = parseCsvToChannelSpecs(csvContent);

    const ids = result.specs.map(s => s.id);
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(ids.length);
  });

  test('should match existing hardcoded CPRO38 and CPRO50 values for validation', () => {
    const result: ParseResult = parseCsvToChannelSpecs(csvContent);

    // Find specific test cases to match against hardcoded values
    const cpro50_200_300 = result.specs.find(s =>
      s.channelType === 'CPRO50' &&
      s.slabThickness === 200 &&
      s.bracketCentres === 300
    );

    expect(cpro50_200_300).toBeDefined();
    if (cpro50_200_300) {
      expect(cpro50_200_300.maxForces.tension).toBeCloseTo(13.35, 2);
      expect(cpro50_200_300.maxForces.shear).toBeCloseTo(10.35, 2);
      expect(cpro50_200_300.edgeDistances.top).toBe(75);
      expect(cpro50_200_300.edgeDistances.bottom).toBe(125);
    }
  });
});