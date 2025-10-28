/**
 * Parameter Verification Module
 * 
 * This module provides wrapper functions around the existing verification system
 * to work with modified parameters from the parameter editing UI.
 */

import { verifyAll, VerificationResults } from './verificationChecks';
import { calculateBracketParameters } from './bracketCalculations';
import { calculateAngleParameters } from './angleCalculations';
import { calculateMathematicalModel } from './verificationChecks/mathematicalModelCalculations';
import { calculateLoading } from './loadingCalculations';
import { calculateSystemWeight, SteelWeightResults } from './steelWeight';
import { calculateBracketPositioning, AngleLayoutResult } from './angleLayout';
import { SYSTEM_DEFAULTS } from '@/constants';
import type { OptimisationResult } from '@/types/optimization-types';

/**
 * Interface for modified parameters from the UI
 */
export interface ModifiedParameters {
  bracket_centres: number;
  bracket_thickness: number;
  angle_thickness: number;
  bolt_diameter: number;
}

/**
 * Interface for complete verification results with weights and layout
 */
export interface ParameterVerificationResult {
  /** Whether all verification checks pass */
  isValid: boolean;
  /** Steel weight calculations */
  weights: SteelWeightResults;
  /** Detailed verification results */
  verificationResults: VerificationResults;
  /** Updated calculation values */
  calculatedValues: {
    v_ed: number;
    m_ed: number;
    n_ed: number;
    total_deflection: number;
    total_system_deflection: number;
  };
  /** Bracket layout information */
  bracketLayout?: AngleLayoutResult;
  /** Any errors that occurred during calculation */
  errors?: string[];
}

/**
 * Verifies a design with modified parameters
 * 
 * This function takes an original optimization result and modified parameters,
 * then runs the complete verification process with the new values.
 * 
 * @param originalResult The original optimization result
 * @param modifiedParams The modified parameters from the UI
 * @param isLengthLimited Whether the angle length is limited
 * @param fixedLength Fixed length if length limited
 * @returns Complete verification results
 */
export async function verifyWithModifiedParameters(
  originalResult: OptimisationResult,
  modifiedParams: ModifiedParameters,
  isLengthLimited = false,
  fixedLength?: number
): Promise<ParameterVerificationResult> {
  const errors: string[] = [];

  try {
    // Extract original values - use fallbacks since OptimisationResult may not have all fields
    const originalCalc = originalResult.calculated;
    const originalGenetic = originalResult.genetic;

    // Use default values based on SYSTEM_DEFAULTS and typical values
    const cavity = 200; // Standard cavity width
    const masonry_thickness = 102.5; // Standard masonry thickness
    const slab_thickness = originalCalc.slab_thickness || 225; // Standard slab thickness
    const support_level = 0; // Standard support level
    const characteristic_load = originalCalc.characteristic_load || 14; // Standard load

    // 1. Recalculate loading (depends on bracket centres)
    const loadingResults = calculateLoading({
      characteristic_load: characteristic_load,
      masonry_density: 2000,
      masonry_thickness: masonry_thickness,
      masonry_height: 3,
      bracket_centres: modifiedParams.bracket_centres
    });

    // 2. Recalculate bracket parameters (depends on cavity)
    const bracketResults = calculateBracketParameters({
      cavity: cavity,
    });

    // 3. Recalculate angle parameters (depends on angle thickness and bracket centres)
    const angleResults = calculateAngleParameters({
      C: cavity,
      D: cavity - 10,
      S: 3,
      T: modifiedParams.angle_thickness,
      B_cc: modifiedParams.bracket_centres,
      // Pass facade parameters for dynamic horizontal leg calculation
      facade_thickness: originalCalc.facade_thickness,
      load_position: originalCalc.load_position,
      front_offset: originalCalc.front_offset,
      isolation_shim_thickness: originalCalc.isolation_shim_thickness,
      depth_to_toe_plate: 12 // Default value, can be adjusted in rare occasions
    });

    // 4. Recalculate mathematical model (uses angle parameters)
    const mathModelResults = calculateMathematicalModel({
      M: masonry_thickness,
      d: angleResults.cavity_back_angle, // Use cavity_back_angle instead of d
      T: modifiedParams.angle_thickness,
      R: angleResults.R,
      L_bearing: angleResults.b,
      A: originalGenetic.vertical_leg || 60
    });

    // Validate bolt diameter
    if (modifiedParams.bolt_diameter !== 10 && modifiedParams.bolt_diameter !== 12) {
      throw new Error(`Invalid bolt diameter: ${modifiedParams.bolt_diameter}. Must be 10 or 12.`);
    }

    // 5. Run verification with modified parameters
    const verificationResults = verifyAll(
      loadingResults.shearForce || 0,
      {
        bracketHeight: originalCalc.bracket_height || 150,
        angleThickness: modifiedParams.angle_thickness,
        bracketProjection: originalCalc.bracket_projection || 150,
        bearingLength: angleResults.b,
        riseToBolts: originalCalc.rise_to_bolts || 120,
        boltDiameter: modifiedParams.bolt_diameter,
        packerThickness: SYSTEM_DEFAULTS.PACKING_THICKNESS,
        slabThickness: slab_thickness,
        supportLevel: support_level,
        notchHeight: originalCalc.detailed_verification_results?.droppingBelowSlabResults?.H_notch || 0,
        masonry_thickness: masonry_thickness,
        cavity: cavity,
        drop_below_slab: 0,
        bracketCentres: modifiedParams.bracket_centres,
        characteristicUDL: characteristic_load,
        base_plate_width: SYSTEM_DEFAULTS.BASE_PLATE_WIDTH,
        channelType: originalGenetic.channel_type || "CPRO38",
        concreteGrade: SYSTEM_DEFAULTS.CONCRETE_GRADE
      },
      angleResults,
      mathModelResults,
      bracketResults,
      modifiedParams.bracket_thickness
    );

    // 6. Calculate new steel weights
    const weights = calculateSystemWeight(
      originalCalc.bracket_height || 150,
      originalCalc.bracket_projection || 150,
      modifiedParams.bracket_thickness,
      modifiedParams.bracket_centres,
      modifiedParams.angle_thickness,
      originalGenetic.vertical_leg || 60,
      angleResults.horizontal_leg // Use the dynamically calculated horizontal leg
    );

    // 7. Calculate bracket positioning if needed
    let bracketLayout: AngleLayoutResult | undefined;
    try {
      bracketLayout = calculateBracketPositioning({
        isLengthLimited,
        fixedLength,
        centerToCenter: modifiedParams.bracket_centres
      });
    } catch (error) {
      errors.push(`Bracket positioning calculation failed: ${error}`);
      // Don't fail the overall verification if just the bracket layout fails
    }

    // 8. Extract key calculated values
    const calculatedValues = {
      v_ed: verificationResults.shearResults.V_ed,
      m_ed: verificationResults.momentResults.M_ed_angle,
      n_ed: verificationResults.fixingResults.tensileForce,
      total_deflection: verificationResults.deflectionResults.totalDeflection,
      total_system_deflection: verificationResults.totalDeflectionResults.Total_deflection_of_system
    };

    return {
      isValid: verificationResults.passes,
      weights,
      verificationResults,
      calculatedValues,
      bracketLayout,
      errors: errors.length > 0 ? errors : undefined
    };

  } catch (error) {
    errors.push(`Verification failed: ${error}`);
    
    // Return a failed result with error information
    return {
      isValid: false,
      weights: {
        angleWeight: 0,
        bracketWeight: 0,
        bracketWeightPerMeter: 0,
        totalWeight: Infinity,
        volumes: {
          bracketVolume: 0,
          angleVolume: 0,
          totalVolume: 0
        }
      },
      verificationResults: {
        momentResults: { L_1: 0, M_ed_angle: 0, Mc_rd_angle: 0, utilization: 0, passes: false },
        shearResults: { V_ed: 0, VR_d_angle: 0, utilization: 0, passes: false, appliedShear: 0, shearResistance: 0 },
        deflectionResults: { V_ek: 0, M_ek: 0, SLS_ds: 0, Es_1: 0, Es_sr: 0, D_tip: 0, D_horz: 0, rotation_heel: 0, D_heel: 0, totalDeflection: 0, utilization: 0, passes: false },
        angleToBracketResults: { M_b: 0, N_bolt: 0, V_bolt_resistance: 0, U_v_bolt: 0, N_bolt_resistance: 0, U_n_bolt: 0, U_c_bolt: 0, passes: false },
        combinedResults: { N_ratio: 0, V_ratio: 0, U_combined_1: 0, U_combined_2: 0, passes: false },
        fixingResults: { appliedShear: 0, appliedMoment: 0, tensileForce: 0, tensileLoadResults: { tensileLoad: 0, compressionZoneLength: 0, momentEquilibriumPasses: false, shearEquilibriumPasses: false, depthCheckPasses: false }, passes: false },
        droppingBelowSlabResults: { P: 0, H_notch: 0, P_eff: 0, V_ek: 0, L_d: 0, M_ek_drop: 0, B_proj_fix: 0, Ixx_2: 0, L_deflection: 0, rotation_heel_2: 0, D_heel_2: 0, passes: false },
        totalDeflectionResults: { Total_Vertical_Deflection: 0, Addition_deflection_span: 0, Total_deflection_of_system: 0, passes: false },
        packerResults: { t_p: 0, d_p: 10, beta_p: 1, V_rd: 0, T_rd: 0, combined_utilization: 0, passes: false },
        bracketDesignResults: { t: 0, n_p: 0, H_notch: 0, d_c: 0, d_ct: 0, epsilon: 0, epsilon_56: 0, is_class_1: false, M_ed_bracket: 0, W_pl_c: 0, M_rd_bracket: 0, passes: false },
        passes: false
      },
      calculatedValues: { v_ed: 0, m_ed: 0, n_ed: 0, total_deflection: 0, total_system_deflection: 0 },
      errors
    };
  }
}

/**
 * Validates modified parameters before verification
 * 
 * This function checks if the modified parameters are within acceptable ranges
 * and engineering constraints before running the full verification.
 * 
 * @param modifiedParams The modified parameters to validate
 * @returns Validation result with any errors
 */
export function validateModifiedParameters(modifiedParams: ModifiedParameters): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate bracket centres
  const validBracketCentres = [200, 250, 300, 350, 400, 450, 500, 550, 600];
  if (!validBracketCentres.includes(modifiedParams.bracket_centres)) {
    errors.push(`Bracket centres must be one of: ${validBracketCentres.join(', ')}mm`);
  }

  // Validate bracket thickness
  const validBracketThickness = [3, 4];
  if (!validBracketThickness.includes(modifiedParams.bracket_thickness)) {
    errors.push(`Bracket thickness must be one of: ${validBracketThickness.join(', ')}mm`);
  }

  // Validate angle thickness
  const validAngleThickness = [3, 4, 5, 6, 8, 10, 12];
  if (!validAngleThickness.includes(modifiedParams.angle_thickness)) {
    errors.push(`Angle thickness must be one of: ${validAngleThickness.join(', ')}mm`);
  }

  // Validate bolt diameter
  const validBoltDiameters = [10, 12];
  if (!validBoltDiameters.includes(modifiedParams.bolt_diameter)) {
    errors.push(`Bolt diameter must be one of: ${validBoltDiameters.join(', ')}mm`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
} 
