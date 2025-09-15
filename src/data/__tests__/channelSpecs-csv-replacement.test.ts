import fs from 'fs';
import path from 'path';
import { initializeSpecsFromCsv, getChannelSpec, getValidBracketCentres, getAvailableChannelTypes } from '@/data/channelSpecs';

describe('Channel Specs - CSV Data Replacement Integration', () => {
  let csvContent: string;

  beforeAll(() => {
    // Load the actual CSV file
    const csvPath = path.join(process.cwd(), 'docs', 'Copy of Masonry Support Fixing Data- RA- Rev-P01-CM Info.xlsx - Sheet1.csv');
    csvContent = fs.readFileSync(csvPath, 'utf-8');
  });

  describe('Full CSV Integration', () => {
    test('should successfully replace hardcoded specs with CSV data', () => {
      // Initialize from CSV data
      const result = initializeSpecsFromCsv(csvContent);

      console.log(`CSV Integration Results:
        - Specs loaded: ${result.specsLoaded}
        - Errors: ${result.errors.length}
        - Warnings: ${result.warnings.length}`);

      // Should load all 84 specifications (21 per channel type × 4 types)
      expect(result.specsLoaded).toBe(84);
      expect(result.errors).toHaveLength(0);

      // All 4 channel types should be available
      const availableTypes = getAvailableChannelTypes();
      expect(availableTypes).toContain('CPRO38');
      expect(availableTypes).toContain('CPRO50');
      expect(availableTypes).toContain('R-HPTIII-70');
      expect(availableTypes).toContain('R-HPTIII-90');
      expect(availableTypes).toHaveLength(4);
    });

    test('should maintain API compatibility with existing CPRO38 specs', () => {
      initializeSpecsFromCsv(csvContent);

      // Test existing hardcoded values are now coming from CSV
      const cpro38_200_300 = getChannelSpec('CPRO38', 200, 300);
      expect(cpro38_200_300).toBeDefined();
      expect(cpro38_200_300?.id).toBe('CPRO38_200_300');
      expect(cpro38_200_300?.channelType).toBe('CPRO38');
      expect(cpro38_200_300?.slabThickness).toBe(200);
      expect(cpro38_200_300?.bracketCentres).toBe(300);
      expect(cpro38_200_300?.edgeDistances.top).toBe(75);
      expect(cpro38_200_300?.edgeDistances.bottom).toBe(125);
      expect(cpro38_200_300?.maxForces.tension).toBeCloseTo(10.75, 2);
      expect(cpro38_200_300?.maxForces.shear).toBeCloseTo(10.35, 2);

      // Now should also have utilization factors from CSV
      expect(cpro38_200_300?.utilizationFactors).toBeDefined();
      expect(cpro38_200_300?.utilizationFactors?.tension).toBeCloseTo(99.60, 2);
      expect(cpro38_200_300?.utilizationFactors?.shear).toBeCloseTo(99.80, 2);
    });

    test('should maintain API compatibility with existing CPRO50 specs', () => {
      initializeSpecsFromCsv(csvContent);

      const cpro50_200_300 = getChannelSpec('CPRO50', 200, 300);
      expect(cpro50_200_300).toBeDefined();
      expect(cpro50_200_300?.maxForces.tension).toBeCloseTo(13.35, 2);
      expect(cpro50_200_300?.maxForces.shear).toBeCloseTo(10.35, 2);
      expect(cpro50_200_300?.utilizationFactors?.tension).toBeCloseTo(99.70, 2);
      expect(cpro50_200_300?.utilizationFactors?.shear).toBeCloseTo(99.80, 2);
    });

    test('should provide new R-HPTIII-70 specs', () => {
      initializeSpecsFromCsv(csvContent);

      // Test various R-HPTIII-70 configurations
      const r70_200_300 = getChannelSpec('R-HPTIII-70', 200, 300);
      expect(r70_200_300).toBeDefined();
      expect(r70_200_300?.channelType).toBe('R-HPTIII-70');
      expect(r70_200_300?.maxForces.tension).toBeCloseTo(13.33, 2);
      expect(r70_200_300?.maxForces.shear).toBeCloseTo(9.62, 2);
      expect(r70_200_300?.utilizationFactors?.combined).toBe(200.0);

      // Test different slab thickness
      const r70_225_400 = getChannelSpec('R-HPTIII-70', 225, 400);
      expect(r70_225_400).toBeDefined();
      expect(r70_225_400?.edgeDistances.bottom).toBe(150); // 225mm slab
      expect(r70_225_400?.maxForces.tension).toBeCloseTo(13.33, 2);
      expect(r70_225_400?.maxForces.shear).toBeCloseTo(11.66, 2);
    });

    test('should provide new R-HPTIII-90 specs', () => {
      initializeSpecsFromCsv(csvContent);

      const r90_200_300 = getChannelSpec('R-HPTIII-90', 200, 300);
      expect(r90_200_300).toBeDefined();
      expect(r90_200_300?.channelType).toBe('R-HPTIII-90');
      expect(r90_200_300?.maxForces.tension).toBeCloseTo(15.92, 2);
      expect(r90_200_300?.maxForces.shear).toBeCloseTo(9.99, 2);
      expect(r90_200_300?.utilizationFactors?.combined).toBe(200.0);

      // Test different configuration
      const r90_250_500 = getChannelSpec('R-HPTIII-90', 250, 500);
      expect(r90_250_500).toBeDefined();
      expect(r90_250_500?.edgeDistances.bottom).toBe(175); // 250mm slab
      expect(r90_250_500?.maxForces.tension).toBeCloseTo(16.71, 2);
      expect(r90_250_500?.maxForces.shear).toBeCloseTo(14.28, 2);
    });

    test('should provide correct bracket centres for all channel types', () => {
      initializeSpecsFromCsv(csvContent);

      const expectedCentres = [200, 250, 300, 350, 400, 450, 500];

      // All channel types should have the same bracket centre options
      expect(getValidBracketCentres('CPRO38', 200)).toEqual(expectedCentres);
      expect(getValidBracketCentres('CPRO50', 200)).toEqual(expectedCentres);
      expect(getValidBracketCentres('R-HPTIII-70', 200)).toEqual(expectedCentres);
      expect(getValidBracketCentres('R-HPTIII-90', 200)).toEqual(expectedCentres);
    });

    test('should handle edge distance variations correctly', () => {
      initializeSpecsFromCsv(csvContent);

      // Test all slab thicknesses have correct edge distances
      const testConfigurations = [
        { slab: 200, expectedBottom: 125 },
        { slab: 225, expectedBottom: 150 },
        { slab: 250, expectedBottom: 175 }
      ];

      testConfigurations.forEach(({ slab, expectedBottom }) => {
        const cpro38Spec = getChannelSpec('CPRO38', slab, 300);
        const cpro50Spec = getChannelSpec('CPRO50', slab, 300);
        const r70Spec = getChannelSpec('R-HPTIII-70', slab, 300);
        const r90Spec = getChannelSpec('R-HPTIII-90', slab, 300);

        [cpro38Spec, cpro50Spec, r70Spec, r90Spec].forEach(spec => {
          expect(spec).toBeDefined();
          expect(spec?.edgeDistances.top).toBe(75);
          expect(spec?.edgeDistances.bottom).toBe(expectedBottom);
        });
      });
    });

    test('should maintain fallback behavior for missing specs', () => {
      initializeSpecsFromCsv(csvContent);

      // Test that non-existent specs return undefined
      const nonExistent = getChannelSpec('CPRO38', 300, 600); // Invalid slab thickness
      expect(nonExistent).toBeUndefined();
    });
  });

  describe('Data Quality Validation', () => {
    test('should have consistent force progression with spacing', () => {
      initializeSpecsFromCsv(csvContent);

      // For each channel type and slab thickness, forces should generally increase with spacing
      const channelTypes = ['CPRO38', 'CPRO50'] as const;
      const spacings = [200, 250, 300, 350, 400, 450, 500];

      channelTypes.forEach(channelType => {
        const specs = spacings.map(spacing => getChannelSpec(channelType, 200, spacing));
        specs.forEach((spec, index) => {
          expect(spec).toBeDefined();
          if (index > 0 && specs[index - 1]) {
            // Generally, shear forces should increase with spacing
            expect(spec!.maxForces.shear).toBeGreaterThanOrEqual(specs[index - 1]!.maxForces.shear - 0.01);
          }
        });
      });
    });

    test('should have R-HPTIII products with 200% combined utilization factors', () => {
      initializeSpecsFromCsv(csvContent);

      const rChannelTypes = ['R-HPTIII-70', 'R-HPTIII-90'] as const;
      const spacings = [200, 250, 300, 350, 400, 450, 500];

      rChannelTypes.forEach(channelType => {
        spacings.forEach(spacing => {
          const spec = getChannelSpec(channelType, 200, spacing);
          expect(spec).toBeDefined();
          expect(spec?.utilizationFactors?.combined).toBe(200.0);
          expect(spec?.utilizationFactors?.tension).toBe(100.0);
          expect(spec?.utilizationFactors?.shear).toBe(100.0);
        });
      });
    });

    test('should have higher capacity for R-HPTIII-90 vs R-HPTIII-70', () => {
      initializeSpecsFromCsv(csvContent);

      // R-HPTIII-90 should generally have higher tension capacity than R-HPTIII-70
      const spacing = 300;
      const slabThickness = 200;

      const r70 = getChannelSpec('R-HPTIII-70', slabThickness, spacing);
      const r90 = getChannelSpec('R-HPTIII-90', slabThickness, spacing);

      expect(r70).toBeDefined();
      expect(r90).toBeDefined();
      expect(r90!.maxForces.tension).toBeGreaterThan(r70!.maxForces.tension);
    });
  });
});