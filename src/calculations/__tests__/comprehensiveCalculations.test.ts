import { describe, test, expect } from '@jest/globals';
import { calculateMathematicalModel, formatMathematicalModelResults } from '../verificationChecks/mathematicalModelCalculations';
import { calculateBracketParameters } from '../bracketCalculations';
import { calculateAngleParameters } from '../angleCalculations';
import { verifyAll } from '../verificationChecks';
import { calculateDesignUDL, calculateShearForce } from '../loadingCalculations';
import { calculateSystemWeight } from '../steelWeight';

interface TestInputs {
  slab_thickness: number;
  support_level: number;
  cavity: number;
  characteristic_load: number;
  masonry_thickness: number;
  bracket_centres: number;
  notch_height: number;
  bracket_height: number;
  bracket_thickness: number;
  angle_thickness: number;
  vertical_leg: number;
  drop_below_slab: number;
  bracket_width: number;  // Base plate width w (mm)
}

describe('Comprehensive Calculation Process', () => {
  // Define test inputs - using provided characteristic_load
  const testInputs: TestInputs = {
    slab_thickness: 225,
    support_level: -200,
    cavity: 200,
    characteristic_load: 14,
    masonry_thickness: 102.5,
    bracket_centres: 500,
    notch_height: 0,
    bracket_height: 175,
    bracket_thickness: 4,
    angle_thickness: 6,
    vertical_leg: 60,
    drop_below_slab: 0,
    bracket_width: 56  // Base plate width w (mm)
  };

  // Define test inputs for the optimized design from UI
  const optimizedDesignInputs: TestInputs = {
    slab_thickness: 225, // Assuming this value based on common configurations
    support_level: -200, // Assuming this value based on typical support level
    cavity: 100, // Inferred from bracket projection of 90mm
    characteristic_load: 14, // Assuming a value; replace with actual if known
    masonry_thickness: 102.5, // Standard masonry thickness
    bracket_centres: 500, // From UI
    notch_height: 0, // Assuming no notch
    bracket_height: 165, // From UI
    bracket_thickness: 3, // From UI
    angle_thickness: 3, // From UI
    vertical_leg: 60, // From UI
    drop_below_slab: 0, // Assuming no drop below slab
    bracket_width: 56 // Standard bracket width
  };

  test('Full calculation process with detailed steps', () => {
    // 1. Input Verification
    console.log('\n=== TEST INPUTS ===');
    console.log(JSON.stringify(testInputs, null, 2));

    // 2. Loading Calculations
    console.log('\n=== LOADING CALCULATIONS ===');
    const designUDL = calculateDesignUDL(testInputs.characteristic_load, true);
    const shearForce = calculateShearForce(designUDL, testInputs.bracket_centres);
    const loadingResults = {
      characteristicUDL: testInputs.characteristic_load,
      designUDL,
      shearForce
    };
    console.log('Loading Results:', JSON.stringify(loadingResults, null, 2));

    // 3. Bracket Calculations
    console.log('\n=== BRACKET CALCULATIONS ===');
    const bracketResults = calculateBracketParameters({
      cavity: testInputs.cavity
    });
    console.log('Bracket Results:', JSON.stringify(bracketResults, null, 2));

    // 4. Angle Calculations
    console.log('\n=== ANGLE CALCULATIONS ===');
    const angleResults = calculateAngleParameters({
      C: testInputs.cavity,
      D: testInputs.cavity - 10, // Bracket projection = cavity - 10mm
      S: 3, // Shim thickness
      T: testInputs.angle_thickness,
      B_cc: testInputs.bracket_centres,
      // Use dynamic horizontal leg calculation for testing
      facade_thickness: 102.5, // Brick facade
      load_position: 1/3,
      front_offset: 12,
      isolation_shim_thickness: 3,
      depth_to_toe_plate: 12 // Default value, can be adjusted in rare occasions
    });
    console.log('Angle Results:', JSON.stringify(angleResults, null, 2));

    // 5. Mathematical Model Calculations
    console.log('\n=== MATHEMATICAL MODEL CALCULATIONS ===');
    const mathModelInputs = {
      M: testInputs.masonry_thickness,
      d: angleResults.d,
      T: testInputs.angle_thickness,
      R: angleResults.R,
      L_bearing: angleResults.b,
      A: 60 // Total angle length
    };
    console.log('Mathematical Model Inputs:', JSON.stringify(mathModelInputs, null, 2));
    
    const mathModelResults = calculateMathematicalModel(mathModelInputs);
    console.log('Mathematical Model Results:');
    console.log(formatMathematicalModelResults(mathModelResults));

    // 6. Verification Checks
    console.log('\n=== VERIFICATION CHECKS ===');
    
    // Run all verification checks
    const verificationResults = verifyAll(
      shearForce, // Applied shear force (kN)
      {
        bracketHeight: testInputs.bracket_height,
        angleThickness: testInputs.angle_thickness,
        bracketProjection: 190,
        bearingLength: 72,
        riseToBolts: 120,
        boltDiameter: 10,
        packerThickness: 10, // Adding 10mm packer thickness
        slabThickness: testInputs.slab_thickness,
        supportLevel: testInputs.support_level,
        notchHeight: testInputs.notch_height,
        characteristicUDL: testInputs.characteristic_load,
        bracketCentres: testInputs.bracket_centres,
        masonry_thickness: testInputs.masonry_thickness,
        cavity: testInputs.cavity,
        drop_below_slab: testInputs.drop_below_slab,
        bracket_width: testInputs.bracket_width
      },
      angleResults,
      mathModelResults,
      bracketResults,
      testInputs.bracket_thickness
    );

    // Calculate steel weights
    console.log('\n=== STEEL WEIGHT CALCULATIONS ===');
    const steelWeightResults = calculateSystemWeight(
        testInputs.bracket_height,
        190, // bracket_projection from verification params
        testInputs.bracket_thickness,
        testInputs.bracket_centres,
        testInputs.angle_thickness,
        testInputs.vertical_leg,
        angleResults.horizontal_leg // Use calculated horizontal leg from angle results
    );
    console.log('Steel Weight Results:', steelWeightResults);

    // Log results for debugging
    console.log('\n=== VERIFICATION RESULTS ===');
    console.log(JSON.stringify(verificationResults, null, 2));

    // Verify key values
    expect(loadingResults.characteristicUDL).toBe(14);
    expect(loadingResults.designUDL).toBe(18.9); // 14 * 1.35 (dead load factor)
    expect(loadingResults.shearForce).toBe(9.45); // 18.9 * (500/1000)
    expect(bracketResults.design_cavity).toBe(220); // cavity + 20
    expect(angleResults.R).toBe(6); // Equal to angle thickness
    expect(mathModelResults.Ecc).toBe(34.166666666667); // masonry_thickness/3

    // Verify all checks pass
    expect(verificationResults.passes).toBe(true);
    
    // Verify individual checks
    expect(verificationResults.momentResults.passes).toBe(true);
    expect(verificationResults.shearResults.passes).toBe(true);
    expect(verificationResults.deflectionResults.passes).toBe(true);
    expect(verificationResults.angleToBracketResults.passes).toBe(true);
    expect(verificationResults.combinedResults.passes).toBe(true);
    expect(verificationResults.fixingResults.passes).toBe(true);
    expect(verificationResults.droppingBelowSlabResults.passes).toBe(true);
    expect(verificationResults.totalDeflectionResults.passes).toBe(true);
    expect(verificationResults.packerResults.passes).toBe(true);
    expect(verificationResults.bracketDesignResults.passes).toBe(true);

    // Check if all verifications pass
    const allChecksPassed = 
      verificationResults.momentResults.passes &&
      verificationResults.shearResults.passes &&
      verificationResults.deflectionResults.passes &&
      verificationResults.angleToBracketResults.passes &&
      verificationResults.combinedResults.passes &&
      verificationResults.fixingResults.passes &&
      verificationResults.droppingBelowSlabResults.passes &&
      verificationResults.totalDeflectionResults.passes &&
      verificationResults.packerResults.passes &&
      verificationResults.bracketDesignResults.passes;

    console.log('\n=== Design Summary ===');
    console.log('Inputs:', {
      cavity: testInputs.cavity,
      slab_thickness: testInputs.slab_thickness,
      support_level: testInputs.support_level,
      characteristic_load: testInputs.characteristic_load,
      bracket_centres: testInputs.bracket_centres,
      drop_below_slab: verificationResults.droppingBelowSlabResults.P
    });
    console.log('Bracket Results:', {
      design_cavity: bracketResults.design_cavity
    });
    console.log('Angle Results:', angleResults);
    console.log('Verification Results:', verificationResults);

    expect(allChecksPassed).toBe(true);
  });

  test('Optimized design verification from UI', () => {
    // Input Verification
    console.log('\n=== OPTIMIZED DESIGN TEST INPUTS ===');
    console.log(JSON.stringify(optimizedDesignInputs, null, 2));

    // Loading Calculations
    console.log('\n=== LOADING CALCULATIONS ===');
    const designUDL = calculateDesignUDL(optimizedDesignInputs.characteristic_load, true);
    const shearForce = calculateShearForce(designUDL, optimizedDesignInputs.bracket_centres);
    const loadingResults = {
      characteristicUDL: optimizedDesignInputs.characteristic_load,
      designUDL,
      shearForce
    };
    console.log('Loading Results:', JSON.stringify(loadingResults, null, 2));

    // Bracket Calculations
    console.log('\n=== BRACKET CALCULATIONS ===');
    const bracketResults = calculateBracketParameters({
      cavity: optimizedDesignInputs.cavity
    });
    console.log('Bracket Results:', JSON.stringify(bracketResults, null, 2));

    // Angle Calculations
    console.log('\n=== ANGLE CALCULATIONS ===');
    const angleResults = calculateAngleParameters({
      C: optimizedDesignInputs.cavity,
      D: optimizedDesignInputs.cavity - 10, // Bracket projection = cavity - 10mm
      S: 3, // Shim thickness
      T: optimizedDesignInputs.angle_thickness,
      B_cc: optimizedDesignInputs.bracket_centres,
      // Use dynamic horizontal leg calculation for testing
      facade_thickness: 102.5, // Brick facade
      load_position: 1/3,
      front_offset: 12,
      isolation_shim_thickness: 3,
      depth_to_toe_plate: 12 // Default value, can be adjusted in rare occasions
    });
    console.log('Angle Results:', JSON.stringify(angleResults, null, 2));

    // Mathematical Model Calculations
    console.log('\n=== MATHEMATICAL MODEL CALCULATIONS ===');
    const mathModelInputs = {
      M: optimizedDesignInputs.masonry_thickness,
      d: angleResults.d,
      T: optimizedDesignInputs.angle_thickness,
      R: angleResults.R,
      L_bearing: angleResults.b,
      A: optimizedDesignInputs.vertical_leg
    };
    console.log('Mathematical Model Inputs:', JSON.stringify(mathModelInputs, null, 2));
    
    const mathModelResults = calculateMathematicalModel(mathModelInputs);
    console.log('Mathematical Model Results:');
    console.log(formatMathematicalModelResults(mathModelResults));

    // Verification Checks
    console.log('\n=== VERIFICATION CHECKS ===');
    
    // Run all verification checks
    const verificationResults = verifyAll(
      shearForce, // Applied shear force (kN)
      {
        bracketHeight: optimizedDesignInputs.bracket_height,
        angleThickness: optimizedDesignInputs.angle_thickness,
        bracketProjection: optimizedDesignInputs.cavity - 10, // 90mm from UI
        bearingLength: 90, // Horizontal leg from UI
        riseToBolts: 125, // From UI
        boltDiameter: 10, // From UI
        packerThickness: 0, // No packer in optimized design
        slabThickness: optimizedDesignInputs.slab_thickness,
        supportLevel: optimizedDesignInputs.support_level,
        notchHeight: optimizedDesignInputs.notch_height,
        characteristicUDL: optimizedDesignInputs.characteristic_load,
        bracketCentres: optimizedDesignInputs.bracket_centres,
        masonry_thickness: optimizedDesignInputs.masonry_thickness,
        cavity: optimizedDesignInputs.cavity,
        drop_below_slab: optimizedDesignInputs.drop_below_slab,
        bracket_width: optimizedDesignInputs.bracket_width
      },
      angleResults,
      mathModelResults,
      bracketResults,
      optimizedDesignInputs.bracket_thickness,
      true // Enable detailed mode for comprehensive output
    );

    // Calculate steel weights
    console.log('\n=== STEEL WEIGHT CALCULATIONS ===');
    const steelWeightResults = calculateSystemWeight(
        optimizedDesignInputs.bracket_height,
        optimizedDesignInputs.cavity - 10, // bracket_projection
        optimizedDesignInputs.bracket_thickness,
        optimizedDesignInputs.bracket_centres,
        optimizedDesignInputs.angle_thickness,
        optimizedDesignInputs.vertical_leg,
        angleResults.horizontal_leg // Use calculated horizontal leg from angle results
    );
    console.log('Steel Weight Results:', steelWeightResults);

    // Log all critical values for comparison with spreadsheet
    console.log('\n=== CRITICAL VERIFICATION VALUES ===');
    console.log('M_ed (Applied Moment):', verificationResults.momentResults.M_ed_angle, 'kNm');
    console.log('M_c,Rd (Moment Resistance):', verificationResults.momentResults.Mc_rd_angle, 'kNm');
    console.log('V_ed (Applied Shear):', verificationResults.shearResults.V_ed, 'kN');
    console.log('V_c,Rd (Shear Resistance):', verificationResults.shearResults.VR_d_angle, 'kN');
    console.log('Total Deflection:', verificationResults.deflectionResults.totalDeflection, 'mm');
    console.log('System Deflection:', verificationResults.totalDeflectionResults.Total_deflection_of_system, 'mm');
    console.log('Plastic Section Modulus (Z):', angleResults.Z, 'mm³');
    console.log('Bracket Moment Resistance:', verificationResults.bracketDesignResults.M_rd_bracket, 'kNm');
    
    // Log results for debugging
    console.log('\n=== VERIFICATION RESULTS SUMMARY ===');
    console.log('All Checks Pass:', verificationResults.passes);
    console.log('Moment Resistance Check:', verificationResults.momentResults.passes);
    console.log('Shear Resistance Check:', verificationResults.shearResults.passes);
    console.log('Deflection Check:', verificationResults.deflectionResults.passes);
    console.log('Bracket Connection Check:', verificationResults.angleToBracketResults.passes);
    console.log('Combined Tension/Shear Check:', verificationResults.combinedResults.passes);
    console.log('Fixing Check:', verificationResults.fixingResults.passes);
    console.log('Dropping Below Slab Check:', verificationResults.droppingBelowSlabResults.passes);
    console.log('Total Deflection Check:', verificationResults.totalDeflectionResults.passes);
    console.log('Packer Effects Check:', verificationResults.packerResults.passes);
    console.log('Bracket Design Check:', verificationResults.bracketDesignResults.passes);

    // Final verification that all checks pass
    expect(verificationResults.passes).toBe(true);
  });
}); 