// Export all verification checks from angleChecks
export * from './angleChecks/momentResistanceULS';
export * from './angleChecks/shearResistanceULS';
export * from './angleChecks/angleDeflectionSLS';
export * from './angleChecks/angleToBracketConnection';
export * from './angleChecks/combinedTensionShear';
export * from './fixingCheck';
export * from './droppingBelowSlab';
export * from './totalDeflection';
export * from './angleChecks/shearReductionDueToPackers';
export * from './angleChecks/bracketDesign';

import { verifyMomentResistanceULS, type MomentResistanceULSResults } from './angleChecks/momentResistanceULS';
import { verifyShearResistanceULS, type ShearResistanceULSResults } from './angleChecks/shearResistanceULS';
import { verifyAngleDeflectionSLS, type AngleDeflectionSLSResults } from './angleChecks/angleDeflectionSLS';
import { verifyAngleToBracketConnection, type AngleToBracketConnectionResults } from './angleChecks/angleToBracketConnection';
import { verifyCombinedTensionShear, type CombinedTensionShearResults } from './angleChecks/combinedTensionShear';
import { verifyFixing, type FixingResults } from './fixingCheck';
import { verifyDroppingBelowSlab, type DroppingBelowSlabResults } from './droppingBelowSlab';
import { verifyTotalDeflection, type TotalDeflectionResults } from './totalDeflection';
import { verifyShearReductionDueToPackers, type ShearReductionDueToPackersResults } from './angleChecks/shearReductionDueToPackers';
import { verifyBracketDesign, type BracketDesignResults } from './angleChecks/bracketDesign';

import { AngleCalculationResults } from '../angleCalculations';
import { MathematicalModelResults } from './mathematicalModelCalculations';
import type { AngleExtensionResult } from '../../types/bracketAngleTypes';

interface VerificationParams {
    bracketHeight: number;
    angleThickness: number;
    bracketProjection: number;
    bearingLength: number;
    riseToBolts: number;
    boltDiameter: 10 | 12;
    packerThickness?: number;
    slabThickness: number;
    supportLevel: number;
    notchHeight: number;
    masonry_thickness: number;
    cavity: number;
    drop_below_slab?: number;  // Make optional since it's calculated internally
    bracketCentres: number;
    characteristicUDL: number;
    base_plate_width: number;
    channelType: string;
    concreteGrade: number;
    load_position?: number;  // Load position as fraction of facade thickness (0-1 range)

    // Angle extension parameters for verification with modified geometry
    angle_extension_result?: AngleExtensionResult;  // Angle extension result (if applied)
    effective_vertical_leg?: number;              // Effective vertical leg height (accounting for extension)
}

/**
 * Combined results from all verification checks
 */
export interface VerificationResults {
    /** Results from moment resistance check */
    momentResults: MomentResistanceULSResults;
    /** Results from shear resistance checks */
    shearResults: ShearResistanceULSResults & {
        /** Applied shear in kN (alias for V_ed for UI consistency) */
        appliedShear: number;
        /** Shear resistance in kN (alias for VR_d_angle for UI consistency) */
        shearResistance: number;
    };
    /** Results from angle deflection checks */
    deflectionResults: AngleDeflectionSLSResults;
    /** Results from angle to bracket connection checks */
    angleToBracketResults: AngleToBracketConnectionResults;
    /** Results from combined tension-shear checks */
    combinedResults: CombinedTensionShearResults;
    /** Results from fixing checks */
    fixingResults: FixingResults;
    /** Results from dropping below slab checks */
    droppingBelowSlabResults: DroppingBelowSlabResults;
    /** Results from total deflection checks */
    totalDeflectionResults: TotalDeflectionResults;
    /** Results from packer checks */
    packerResults: ShearReductionDueToPackersResults;
    /** Results from bracket design checks */
    bracketDesignResults: BracketDesignResults;
    /** Whether all checks pass */
    passes: boolean;

    // Angle extension information for verification tracking
    /** Angle extension result (if extension was applied) */
    angle_extension_result?: AngleExtensionResult;
    /** Whether verification used modified geometry due to angle extension */
    uses_extended_geometry?: boolean;
}

/**
 * Performs all verification checks and returns combined results
 * @param appliedShearKN Applied shear force in kN
 * @param params Verification parameters
 * @param angleParams Angle calculation results
 * @param mathModel Mathematical model results
 * @param bracketResults Bracket calculation results
 * @param t Bracket thickness in mm
 * @param detailedMode If true, logs detailed intermediate calculations
 * @returns Combined verification results
 */
export const verifyAll = (
    appliedShearKN: number,
    params: VerificationParams,
    angleParams: AngleCalculationResults,
    mathModel: MathematicalModelResults,
    bracketResults: { design_cavity: number },
    t: number,              // Bracket thickness (mm)
    detailedMode: boolean = false
): VerificationResults => {
    // Run all verifications using pre-calculated values
    const shearResultsCalculation = verifyShearResistanceULS(appliedShearKN, angleParams.Av);
    const shearResults = {
        ...shearResultsCalculation,
        appliedShear: shearResultsCalculation.V_ed,
        shearResistance: shearResultsCalculation.VR_d_angle
    };

    // Only log details if in detailed mode
    if (detailedMode) {
        console.log('\n=== MOMENT RESISTANCE INPUTS ===');
        console.log('V_ed:', appliedShearKN);
        console.log('Ecc:', mathModel.Ecc);
        console.log('d:', angleParams.d);
        console.log('T:', params.angleThickness);
        console.log('Z:', angleParams.Z);
    }

    const momentResults = verifyMomentResistanceULS(
        appliedShearKN,
        mathModel.Ecc,
        angleParams.d,
        params.angleThickness,
        angleParams.Z
    );

    // Use dynamic horizontal leg with fallback to 90mm for safety
    const horizontalLeg = angleParams.horizontal_leg ?? 90;

    if (!angleParams.horizontal_leg) {
        console.warn('⚠️  WARNING: angleParams.horizontal_leg is undefined, falling back to 90mm');
        console.warn('   This indicates facade parameters may not be available for dynamic calculation');
    } else if (angleParams.horizontal_leg !== 90) {
        console.log('✅ Using dynamic horizontal leg:', horizontalLeg, 'mm (calculated from facade parameters)');
    } else {
        console.log('ℹ️  Using default horizontal leg:', horizontalLeg, 'mm');
    }

    const deflectionResults = verifyAngleDeflectionSLS(
        appliedShearKN,
        momentResults.L_1,
        momentResults.M_ed_angle,
        angleParams.Z,
        1.35, // Load factor from DEFLECTION_CONSTANTS
        mathModel.a,
        mathModel.b,
        mathModel.I,
        horizontalLeg,  // Use safe horizontal leg value with fallback
        angleParams.Ixx_1,
        210  // F_y from MOMENT_RESISTANCE_CONSTANTS
    );

    if (detailedMode) {
        console.log('\n=== ANGLE DEFLECTION INPUTS ===');
        console.log('V_ed:', appliedShearKN);
        console.log('L_1:', momentResults.L_1);
        console.log('M_ed_angle:', momentResults.M_ed_angle);
        console.log('Z:', angleParams.Z);
        console.log('L_f:', 1.35);
        console.log('a:', mathModel.a);
        console.log('b:', mathModel.b);
        console.log('I:', mathModel.I);
        console.log('B (horizontal_leg):', horizontalLeg, 'mm', angleParams.horizontal_leg ? '(dynamic)' : '(fallback)');
        console.log('Ixx_1:', angleParams.Ixx_1);
        console.log('F_y:', 210);

        console.log('\n=== ANGLE DEFLECTION RESULTS ===');
        console.log(JSON.stringify(deflectionResults, null, 2));
    }

    const angleToBracketResults = verifyAngleToBracketConnection(
        appliedShearKN,
        horizontalLeg,  // Use dynamic horizontal leg (same as deflection calculation)
        mathModel.b,  // Bearing length from mathematical model
        mathModel.I,  // Rise to bolt from mathematical model
        params.boltDiameter
    );
    
    if (detailedMode) {
        console.log('\n=== ANGLE TO BRACKET CONNECTION RESULTS ===');
        console.log('Applied Shear:', appliedShearKN, 'kN');
        console.log('Horizontal Leg (B):', horizontalLeg, 'mm', angleParams.horizontal_leg ? '(dynamic)' : '(fallback)');
        console.log('Bearing Length (b):', mathModel.b, 'mm');
        console.log('Rise to Bolt (I):', mathModel.I, 'mm');
        console.log('Bolt Diameter:', params.boltDiameter, 'mm');
        console.log('M_b (Moment):', angleToBracketResults.M_b, 'kNm');
        console.log('N_bolt (Tension Force):', angleToBracketResults.N_bolt, 'kN');
        console.log('Bolt Shear Resistance:', angleToBracketResults.V_bolt_resistance, 'kN');
        console.log('Bolt Tension Resistance:', angleToBracketResults.N_bolt_resistance, 'kN');
        console.log('Shear Utilization:', angleToBracketResults.U_v_bolt, '%');
        console.log('Tension Utilization:', angleToBracketResults.U_n_bolt, '%');
        console.log('Combined Utilization:', angleToBracketResults.U_c_bolt, '%');
        console.log('Check Passed:', angleToBracketResults.passes ? 'YES' : 'NO');
    }

    const fixingResults = verifyFixing(
        appliedShearKN,
        bracketResults.design_cavity,
        params.masonry_thickness,
        params.base_plate_width,
        params.riseToBolts,
        params.channelType,
        params.slabThickness,
        params.bracketCentres,
        params.concreteGrade,
        params.load_position  // Pass load_position from params
    );
    
    if (detailedMode) {
        console.log('\n=== FIXING CHECK RESULTS ===');
        console.log('Applied Shear:', fixingResults.appliedShear, 'kN');
        console.log('Applied Moment:', fixingResults.appliedMoment, 'kNm');
        console.log('Tensile Force:', fixingResults.tensileForce, 'kN');
        console.log('Tensile Load Results:', JSON.stringify(fixingResults.tensileLoadResults, null, 2));
        console.log('Check Passed:', fixingResults.passes ? 'YES' : 'NO');
    }

    // Combined Tension-Shear check for the CHANNEL
    // Ensure channelTensionCapacity and channelShearCapacity are valid numbers.
    const N_rd_channel = fixingResults.channelTensionCapacity ?? 0;
    const V_rd_channel = fixingResults.channelShearCapacity ?? 0;

    const combinedResults = verifyCombinedTensionShear(
        fixingResults.tensileForce,    // N_ed: Tensile force on the channel fixing
        fixingResults.appliedShear,    // V_ed: Shear force on the channel fixing
        N_rd_channel,                  // N_rd: Tension resistance of the channel
        V_rd_channel                   // V_rd: Shear resistance of the channel
    );
    
    if (detailedMode) {
        console.log('\n=== COMBINED TENSION-SHEAR CHECK (CHANNEL) ===');
        console.log('N_ed (Channel Tension Force):', fixingResults.tensileForce);
        console.log('V_ed (Channel Shear Force):', fixingResults.appliedShear);
        console.log('N_rd (Channel Tension Capacity):', N_rd_channel);
        console.log('V_rd (Channel Shear Capacity):', V_rd_channel);
        console.log('N_ratio (Tension Ratio):', combinedResults.N_ratio);
        console.log('V_ratio (Shear Ratio):', combinedResults.V_ratio);
        console.log('Formula 1 Check (≤ 1.0):', combinedResults.U_combined_1);
        console.log('Formula 2 Check (≤ 1.2):', combinedResults.U_combined_2);
        console.log('Check Passed:', combinedResults.passes ? 'YES' : 'NO');
    }

    const droppingBelowSlabResults = verifyDroppingBelowSlab(
        params.drop_below_slab ?? 0, // Provide 0 if undefined
        params.notchHeight,
        appliedShearKN / 1.35, // Convert to characteristic
        bracketResults.design_cavity,  // Use C' from bracket calculations here too
        mathModel.Ecc,
        params.bracketProjection,
        t,
        params.bearingLength
    );
    
    if (detailedMode) {
        console.log('\n=== DROPPING BELOW SLAB RESULTS ===');
        console.log('Drop Below Slab:', params.drop_below_slab, 'mm');
        console.log('Notch Height:', params.notchHeight, 'mm');
        console.log('Characteristic Shear:', appliedShearKN / 1.35, 'kN');
        console.log('Results:', JSON.stringify(droppingBelowSlabResults, null, 2));
        console.log('Check Passed:', droppingBelowSlabResults.passes ? 'YES' : 'NO');
    }

    const totalDeflectionResults = verifyTotalDeflection(
        deflectionResults.totalDeflection,
        droppingBelowSlabResults.D_heel_2,
        deflectionResults.Es_sr,
        params.bracketCentres,
        params.characteristicUDL,
        params.angleThickness
    );
    
    if (detailedMode) {
        console.log('\n=== TOTAL DEFLECTION RESULTS ===');
        console.log('Total Vertical Deflection:', totalDeflectionResults.Total_Vertical_Deflection, 'mm');
        console.log('Addition Deflection Span:', totalDeflectionResults.Addition_deflection_span, 'mm');
        console.log('Total System Deflection:', totalDeflectionResults.Total_deflection_of_system, 'mm');
        console.log('Check Passed:', totalDeflectionResults.passes ? 'YES' : 'NO');
    }

    // Calculate packer effects if packers are present
    const packerResults = params.packerThickness ? verifyShearReductionDueToPackers(
        appliedShearKN,
        angleToBracketResults.N_bolt,
        angleToBracketResults.V_bolt_resistance,
        angleToBracketResults.N_bolt_resistance,
        params.packerThickness,
        params.boltDiameter
    ) : {
        t_p: 0,
        d_p: params.boltDiameter,
        beta_p: 1,
        V_rd: angleToBracketResults.V_bolt_resistance,
        T_rd: angleToBracketResults.N_bolt_resistance,
        combined_utilization: angleToBracketResults.U_c_bolt,
        passes: angleToBracketResults.passes
    };
    
    if (detailedMode) {
        console.log('\n=== PACKER EFFECTS RESULTS ===');
        console.log('Packer Thickness:', params.packerThickness || 0, 'mm');
        console.log('Bolt Diameter:', params.boltDiameter, 'mm');
        console.log('Reduction Factor (β):', packerResults.beta_p);
        console.log('Reduced Shear Resistance:', packerResults.V_rd, 'kN');
        console.log('Reduced Tension Resistance:', packerResults.T_rd, 'kN');
        console.log('Combined Utilization:', packerResults.combined_utilization, '%');
        console.log('Check Passed:', packerResults.passes ? 'YES' : 'NO');
    }

    // Verify bracket design
    const bracketDesignResults = verifyBracketDesign(
        appliedShearKN,
        params.cavity,
        mathModel.Ecc,
        params.bracketHeight,
        params.notchHeight,
        t
    );
    
    if (detailedMode) {
        console.log('\n=== BRACKET DESIGN RESULTS ===');
        console.log('Bracket Thickness:', t, 'mm');
        console.log('Bracket Height:', params.bracketHeight, 'mm');
        console.log('Class 1 Section:', bracketDesignResults.is_class_1 ? 'YES' : 'NO');
        console.log('Applied Moment:', bracketDesignResults.M_ed_bracket, 'kNm');
        console.log('Plastic Section Modulus:', bracketDesignResults.W_pl_c, 'mm³');
        console.log('Moment Resistance:', bracketDesignResults.M_rd_bracket, 'kNm');
        console.log('Check Passed:', bracketDesignResults.passes ? 'YES' : 'NO');
    }

    // Check if all verifications pass
    const passes = 
        momentResults.passes &&
        shearResults.passes &&
        deflectionResults.passes &&
        angleToBracketResults.passes &&
        combinedResults.passes &&
        fixingResults.passes &&
        droppingBelowSlabResults.passes &&
        totalDeflectionResults.passes &&
        packerResults.passes &&
        bracketDesignResults.passes;
    
    if (detailedMode) {
        console.log('\n=== OVERALL VERIFICATION RESULTS ===');
        console.log('Moment Resistance Check:', momentResults.passes ? 'PASS' : 'FAIL');
        console.log('Shear Resistance Check:', shearResults.passes ? 'PASS' : 'FAIL');
        console.log('Angle Deflection Check:', deflectionResults.passes ? 'PASS' : 'FAIL');
        console.log('Bracket Connection Check:', angleToBracketResults.passes ? 'PASS' : 'FAIL');
        console.log('Combined Tension/Shear Check:', combinedResults.passes ? 'PASS' : 'FAIL');
        console.log('Fixing Check:', fixingResults.passes ? 'PASS' : 'FAIL');
        console.log('Dropping Below Slab Check:', droppingBelowSlabResults.passes ? 'PASS' : 'FAIL');
        console.log('Total Deflection Check:', totalDeflectionResults.passes ? 'PASS' : 'FAIL');
        console.log('Packer Check:', packerResults.passes ? 'PASS' : 'FAIL');
        console.log('Bracket Design Check:', bracketDesignResults.passes ? 'PASS' : 'FAIL');
        console.log('OVERALL RESULT:', passes ? 'PASS' : 'FAIL');
    }

    return {
        momentResults,
        shearResults,
        deflectionResults,
        angleToBracketResults,
        combinedResults,
        fixingResults,
        droppingBelowSlabResults,
        totalDeflectionResults,
        packerResults,
        bracketDesignResults,
        passes,

        // Include angle extension information for tracking
        angle_extension_result: params.angle_extension_result,
        uses_extended_geometry: Boolean(params.angle_extension_result?.extension_applied)
    };
}; 