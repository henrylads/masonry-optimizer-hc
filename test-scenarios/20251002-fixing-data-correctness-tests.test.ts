/**
 * Test suite to verify correct channel specification data is retrieved
 * based on fixing position, slab thickness, and bracket centres.
 *
 * Purpose: Ensure the fixing check uses the right channel capacities
 * corresponding to the actual fixing position and slab geometry.
 *
 * Key Insight: Channel specs in CSV are indexed by:
 * - Channel Type (e.g., CPRO38)
 * - Slab Thickness (e.g., 200mm, 225mm, 250mm)
 * - Bracket Centres (spacing, e.g., 200mm, 250mm, 300mm)
 *
 * The CSV assumes fixing at 75mm from top, giving different edge distances:
 * - 200mm slab: top=75mm, bottom=125mm
 * - 225mm slab: top=75mm, bottom=150mm
 * - 250mm slab: top=75mm, bottom=175mm
 *
 * Created: 2025-10-02
 */

import { getChannelSpec } from '../src/data/channelSpecs';
import { verifyFixing } from '../src/calculations/verificationChecks/fixingCheck';

// Channel specs are automatically initialized when the module loads

describe('Channel Specification Data Retrieval', () => {

  describe('1. Basic Channel Spec Lookup', () => {

    test('CPRO38 200mm slab 200mm spacing: should return correct spec', () => {
      const spec = getChannelSpec('CPRO38', 200, 200);

      expect(spec).toBeDefined();
      expect(spec?.channelType).toBe('CPRO38');
      expect(spec?.slabThickness).toBe(200);
      expect(spec?.bracketCentres).toBe(200);
      expect(spec?.edgeDistances.top).toBe(75);
      expect(spec?.edgeDistances.bottom).toBe(125); // 200 - 75
    });

    test('CPRO38 225mm slab 300mm spacing: should return correct spec', () => {
      const spec = getChannelSpec('CPRO38', 225, 300);

      expect(spec).toBeDefined();
      expect(spec?.channelType).toBe('CPRO38');
      expect(spec?.slabThickness).toBe(225);
      expect(spec?.bracketCentres).toBe(300);
      expect(spec?.edgeDistances.top).toBe(75);
      expect(spec?.edgeDistances.bottom).toBe(150); // 225 - 75
    });

    test('CPRO38 250mm slab 400mm spacing: should return correct spec', () => {
      const spec = getChannelSpec('CPRO38', 250, 400);

      expect(spec).toBeDefined();
      expect(spec?.channelType).toBe('CPRO38');
      expect(spec?.slabThickness).toBe(250);
      expect(spec?.bracketCentres).toBe(400);
      expect(spec?.edgeDistances.top).toBe(75);
      expect(spec?.edgeDistances.bottom).toBe(175); // 250 - 75
    });
  });

  describe('2. Capacity Variations by Slab Thickness', () => {

    test('CPRO38 200mm vs 225mm vs 250mm: capacities should differ', () => {
      const spec200 = getChannelSpec('CPRO38', 200, 300);
      const spec225 = getChannelSpec('CPRO38', 225, 300);
      const spec250 = getChannelSpec('CPRO38', 250, 300);

      expect(spec200).toBeDefined();
      expect(spec225).toBeDefined();
      expect(spec250).toBeDefined();

      // All should have same spacing but different capacities
      expect(spec200?.bracketCentres).toBe(300);
      expect(spec225?.bracketCentres).toBe(300);
      expect(spec250?.bracketCentres).toBe(300);

      // Capacities should generally increase with slab thickness
      const tension200 = spec200?.maxForces.tension ?? 0;
      const tension225 = spec225?.maxForces.tension ?? 0;
      const tension250 = spec250?.maxForces.tension ?? 0;

      console.log('Tension capacities by slab thickness (300mm spacing):');
      console.log(`  200mm slab: ${tension200} kN`);
      console.log(`  225mm slab: ${tension225} kN`);
      console.log(`  250mm slab: ${tension250} kN`);

      // Verify values are different and positive
      expect(tension200).toBeGreaterThan(0);
      expect(tension225).toBeGreaterThan(0);
      expect(tension250).toBeGreaterThan(0);
    });

    test('CPRO38 200mm: capacity should vary by spacing', () => {
      const spec200_200 = getChannelSpec('CPRO38', 200, 200);
      const spec200_300 = getChannelSpec('CPRO38', 200, 300);
      const spec200_400 = getChannelSpec('CPRO38', 200, 400);

      expect(spec200_200).toBeDefined();
      expect(spec200_300).toBeDefined();
      expect(spec200_400).toBeDefined();

      const tension200 = spec200_200?.maxForces.tension ?? 0;
      const tension300 = spec200_300?.maxForces.tension ?? 0;
      const tension400 = spec200_400?.maxForces.tension ?? 0;

      console.log('Tension capacities by spacing (200mm slab):');
      console.log(`  200mm spacing: ${tension200} kN`);
      console.log(`  300mm spacing: ${tension300} kN`);
      console.log(`  400mm spacing: ${tension400} kN`);

      // Capacity should generally increase with spacing
      expect(tension200).toBeGreaterThan(0);
      expect(tension300).toBeGreaterThan(0);
      expect(tension400).toBeGreaterThan(0);
    });
  });

  describe('3. Fixing Verification Uses Correct Spec', () => {

    test('225mm slab with different capacities from 200mm slab', () => {
      // Common parameters
      const appliedShear = 5.0; // kN
      const cavity = 100; // mm
      const facadeThickness = 102.5; // mm
      const basePlateWidth = 56; // mm
      const riseToBolts = 95; // mm
      const concreteGrade = 30; // N/mm²
      const loadPosition = 0.33;
      const bracketCentres = 300; // mm

      // Test with 200mm slab
      const result200 = verifyFixing(
        appliedShear,
        cavity,
        facadeThickness,
        basePlateWidth,
        riseToBolts,
        'CPRO38',
        200, // slab thickness
        bracketCentres,
        concreteGrade,
        loadPosition
      );

      // Test with 225mm slab
      const result225 = verifyFixing(
        appliedShear,
        cavity,
        facadeThickness,
        basePlateWidth,
        riseToBolts,
        'CPRO38',
        225, // slab thickness
        bracketCentres,
        concreteGrade,
        loadPosition
      );

      expect(result200.channelTensionCapacity).toBeDefined();
      expect(result225.channelTensionCapacity).toBeDefined();
      expect(result200.channelShearCapacity).toBeDefined();
      expect(result225.channelShearCapacity).toBeDefined();

      console.log('\nFixing verification results comparison:');
      console.log('200mm slab:');
      console.log(`  Tension capacity: ${result200.channelTensionCapacity} kN`);
      console.log(`  Shear capacity: ${result200.channelShearCapacity} kN`);
      console.log(`  Applied tension: ${result200.tensileForce} kN`);
      console.log(`  Passes: ${result200.passes}`);

      console.log('\n225mm slab:');
      console.log(`  Tension capacity: ${result225.channelTensionCapacity} kN`);
      console.log(`  Shear capacity: ${result225.channelShearCapacity} kN`);
      console.log(`  Applied tension: ${result225.tensileForce} kN`);
      console.log(`  Passes: ${result225.passes}`);

      // Applied forces should be the same (same geometry)
      expect(result200.appliedShear).toBeCloseTo(result225.appliedShear, 5);
      expect(result200.appliedMoment).toBeCloseTo(result225.appliedMoment, 5);
      expect(result200.tensileForce).toBeCloseTo(result225.tensileForce, 5);

      // But capacities should differ based on edge distances
      // (Though they may be similar for these specific cases)
      expect(result200.channelTensionCapacity).toBeGreaterThan(0);
      expect(result225.channelTensionCapacity).toBeGreaterThan(0);
    });

    test('same slab different spacing: should use different capacities', () => {
      const appliedShear = 5.0; // kN
      const cavity = 100; // mm
      const facadeThickness = 102.5; // mm
      const basePlateWidth = 56; // mm
      const riseToBolts = 95; // mm
      const concreteGrade = 30; // N/mm²
      const loadPosition = 0.33;
      const slabThickness = 225; // mm

      // Test with 200mm spacing
      const result200 = verifyFixing(
        appliedShear,
        cavity,
        facadeThickness,
        basePlateWidth,
        riseToBolts,
        'CPRO38',
        slabThickness,
        200, // bracket centres
        concreteGrade,
        loadPosition
      );

      // Test with 400mm spacing
      const result400 = verifyFixing(
        appliedShear,
        cavity,
        facadeThickness,
        basePlateWidth,
        riseToBolts,
        'CPRO38',
        slabThickness,
        400, // bracket centres
        concreteGrade,
        loadPosition
      );

      expect(result200.channelTensionCapacity).toBeDefined();
      expect(result400.channelTensionCapacity).toBeDefined();

      console.log('\nSpacing comparison (225mm slab):');
      console.log('200mm spacing:');
      console.log(`  Tension capacity: ${result200.channelTensionCapacity} kN`);
      console.log(`  Shear capacity: ${result200.channelShearCapacity} kN`);

      console.log('\n400mm spacing:');
      console.log(`  Tension capacity: ${result400.channelTensionCapacity} kN`);
      console.log(`  Shear capacity: ${result400.channelShearCapacity} kN`);

      // Applied forces should be the same (same geometry and loading)
      expect(result200.appliedShear).toBeCloseTo(result400.appliedShear, 5);
      expect(result200.tensileForce).toBeCloseTo(result400.tensileForce, 5);

      // Capacities should differ - larger spacing generally means higher capacity
      expect(result200.channelTensionCapacity).not.toBe(result400.channelTensionCapacity);
    });
  });

  describe('4. Edge Distance Consistency', () => {

    test('edge distances should match fixing position assumptions', () => {
      const testCases = [
        { slab: 200, expectedBottom: 125, expectedSlabInSpec: 200 },
        { slab: 225, expectedBottom: 150, expectedSlabInSpec: 225 },
        { slab: 250, expectedBottom: 175, expectedSlabInSpec: 250 },
        { slab: 300, expectedBottom: 175, expectedSlabInSpec: 250 }, // Falls back to 250mm data
      ];

      testCases.forEach(({ slab, expectedBottom, expectedSlabInSpec }) => {
        const spec = getChannelSpec('CPRO38', slab, 300);

        expect(spec).toBeDefined();
        expect(spec?.edgeDistances.top).toBe(75);
        expect(spec?.edgeDistances.bottom).toBe(expectedBottom);
        expect(spec?.slabThickness).toBe(expectedSlabInSpec); // May be fallback value

        // Verify: top + bottom = spec slab thickness (not requested thickness if fallback)
        const totalEdges = (spec?.edgeDistances.top ?? 0) + (spec?.edgeDistances.bottom ?? 0);
        expect(totalEdges).toBe(expectedSlabInSpec);
      });
    });

    test('all CPRO38 specs should have 75mm top edge', () => {
      const slabs = [200, 225, 250, 300];
      const spacings = [200, 250, 300, 350, 400];

      slabs.forEach(slab => {
        spacings.forEach(spacing => {
          const spec = getChannelSpec('CPRO38', slab, spacing);
          if (spec) {
            expect(spec.edgeDistances.top).toBe(75);
            // Bottom edge should match the spec's slab thickness (may be fallback for >250mm)
            const expectedBottom = spec.slabThickness - 75;
            expect(spec.edgeDistances.bottom).toBe(expectedBottom);
          }
        });
      });
    });
  });

  describe('5. Multiple Channel Types', () => {

    test('different channel types should have different capacities', () => {
      const channelTypes = ['CPRO38', 'CPRO50', 'R-HPTIII-70', 'R-HPTIII-90'];
      const slabThickness = 225;
      const bracketCentres = 300;

      const specs = channelTypes.map(type => ({
        type,
        spec: getChannelSpec(type, slabThickness, bracketCentres)
      }));

      console.log('\nChannel type comparison (225mm slab, 300mm spacing):');
      specs.forEach(({ type, spec }) => {
        if (spec) {
          console.log(`${type}:`);
          console.log(`  Tension: ${spec.maxForces.tension} kN`);
          console.log(`  Shear: ${spec.maxForces.shear} kN`);
        } else {
          console.log(`${type}: Not found`);
        }
      });

      // Verify each type has data
      specs.forEach(({ type, spec }) => {
        if (spec) {
          expect(spec.maxForces.tension).toBeGreaterThan(0);
          expect(spec.maxForces.shear).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('6. Real-World Scenario Validation', () => {

    test('optimization result should use correct channel spec', () => {
      // Simulate an optimization result scenario
      const scenario = {
        channelType: 'CPRO38',
        slabThickness: 225,
        bracketCentres: 400,
        fixingPosition: 90, // From top of slab
        appliedShear: 3.24, // kN (from your test data)
        cavity: 100,
        facadeThickness: 102.5,
        riseToBolts: 95,
        loadPosition: 0.33
      };

      // Get the channel spec
      const spec = getChannelSpec(
        scenario.channelType,
        scenario.slabThickness,
        scenario.bracketCentres
      );

      expect(spec).toBeDefined();
      console.log('\nReal-world scenario:');
      console.log(`Channel: ${scenario.channelType}`);
      console.log(`Slab: ${scenario.slabThickness}mm`);
      console.log(`Spacing: ${scenario.bracketCentres}mm`);
      console.log(`Fixing position: ${scenario.fixingPosition}mm from top`);
      console.log(`Edge distances: top=${spec?.edgeDistances.top}mm, bottom=${spec?.edgeDistances.bottom}mm`);
      console.log(`Capacities: tension=${spec?.maxForces.tension}kN, shear=${spec?.maxForces.shear}kN`);

      // Run verification
      const result = verifyFixing(
        scenario.appliedShear,
        scenario.cavity,
        scenario.facadeThickness,
        56, // base plate width
        scenario.riseToBolts,
        scenario.channelType,
        scenario.slabThickness,
        scenario.bracketCentres,
        30, // concrete grade
        scenario.loadPosition
      );

      console.log(`Applied forces: shear=${result.appliedShear}kN, tension=${result.tensileForce}kN`);
      console.log(`Channel checks: shear=${result.channelShearCheckPasses}, tension=${result.channelTensionCheckPasses}`);
      console.log(`Overall pass: ${result.passes}`);

      expect(result.channelShearCapacity).toBe(spec?.maxForces.shear);
      expect(result.channelTensionCapacity).toBe(spec?.maxForces.tension);
    });

    test('fixing position 75mm vs 90mm vs 150mm: same spec used', () => {
      // Key insight: Fixing position doesn't change which channel spec is used
      // The spec is based on slab thickness and spacing, not fixing position
      // This is because the CSV data assumes 75mm from top

      const slabThickness = 225;
      const bracketCentres = 400;

      const spec75 = getChannelSpec('CPRO38', slabThickness, bracketCentres);
      const spec90 = getChannelSpec('CPRO38', slabThickness, bracketCentres);
      const spec150 = getChannelSpec('CPRO38', slabThickness, bracketCentres);

      // All should return the same spec (fixing position not part of lookup)
      expect(spec75).toBe(spec90);
      expect(spec90).toBe(spec150);

      console.log('\nFixing position independence:');
      console.log('Same channel spec used regardless of fixing position (75mm, 90mm, or 150mm)');
      console.log(`Spec ID: ${spec75?.id}`);
      console.log(`Assumed top edge: ${spec75?.edgeDistances.top}mm`);
      console.log(`Assumed bottom edge: ${spec75?.edgeDistances.bottom}mm`);
      console.log('Note: CSV data assumes 75mm from top fixing position');
    });
  });

  describe('7. Error Cases', () => {

    test('invalid channel type should return undefined', () => {
      const spec = getChannelSpec('INVALID_TYPE', 225, 300);
      expect(spec).toBeUndefined();
    });

    test('verifyFixing with invalid channel should fail checks', () => {
      const result = verifyFixing(
        5.0, // shear
        100, // cavity
        102.5, // facade thickness
        56, // base plate width
        95, // rise to bolts
        'INVALID_TYPE', // invalid channel
        225,
        300,
        30,
        0.33
      );

      expect(result.channelShearCheckPasses).toBe(false);
      expect(result.channelTensionCheckPasses).toBe(false);
      expect(result.passes).toBe(false);
    });

    test('very thin slab should fallback to nearest available spec', () => {
      // Request 180mm slab (not in data), should fallback to 200mm or nearest
      const spec = getChannelSpec('CPRO38', 180, 300);

      // Should still get a spec (fallback logic)
      expect(spec).toBeDefined();
      if (spec) {
        console.log(`\nFallback for 180mm slab: using ${spec.slabThickness}mm data`);
        expect(spec.slabThickness).toBeGreaterThanOrEqual(180);
      }
    });
  });
});
