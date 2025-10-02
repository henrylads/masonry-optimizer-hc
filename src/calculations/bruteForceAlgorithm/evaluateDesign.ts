import type { Design } from './index';
import { calculateSystemWeight } from '../steelWeight';
import { verifyAll, VerificationResults } from '../verificationChecks';
import {
    calculateBracketParameters,
    calculateInvertedBracketHeight,
    calculateStandardBracketHeightWithExtension
} from '../bracketCalculations';
import { calculateAngleParameters, calculateEffectiveVerticalLeg } from '../angleCalculations';
import { shouldApplyAngleExtension } from '../angleExtensionCalculations';
import { calculateMathematicalModel } from '../verificationChecks/mathematicalModelCalculations';
import type { AngleExtensionResult } from '@/types/bracketAngleTypes';
import { calculateLoading } from '../loadingCalculations';
import { SYSTEM_DEFAULTS } from '@/constants';
import { roundToTwelveDecimals } from '@/utils/precision';
import { calculateBracketPositioning, AngleLayoutResult } from '../angleLayout';
import type { DesignInputs } from '@/types/designInputs';

export interface BruteForceEvaluationResult {
    isValid: boolean;
    totalWeight: number;
    design: Design; // Include the evaluated design with updated calculated values
    verificationResults: VerificationResults; // Optionally return detailed results
}

/**
 * Evaluates a single design for the brute-force algorithm.
 * Determines if the design is valid based on verification checks and calculates its weight.
 * The primary goal is to find the *lightest* valid design.
 */
export function evaluateBruteForceDesign(
    design: Design,
    designInputs: DesignInputs,
    isLengthLimited = false,
    fixedLength?: number
): BruteForceEvaluationResult {
    // --- Perform necessary calculations (similar to fitnessScoring) ---
    
    // Log evaluation for standard angle designs
    const isStandardAngle = design.genetic.angle_orientation === 'Standard';
    if (isStandardAngle) {
        console.log(`\n--- Evaluating Standard Angle Design ---`);
        console.log(`  Bracket: ${design.genetic.bracket_type}, Centers: ${design.genetic.bracket_centres}mm`);
        console.log(`  Thicknesses: Bracket=${design.genetic.bracket_thickness}mm, Angle=${design.genetic.angle_thickness}mm`);
    }

    // 1. Loading Calculations
    const loadingResults = calculateLoading({
        characteristic_load: design.calculated.characteristic_load,
        masonry_density: 2000,
        masonry_thickness: design.calculated.masonry_thickness ?? 102.5,
        masonry_height: 3,
        bracket_centres: design.genetic.bracket_centres
    });
    design.calculated.shear_load = loadingResults.shearForce ?? 0;
    design.calculated.area_load = loadingResults.areaLoad ?? 0;
    design.calculated.characteristic_udl = loadingResults.characteristicUDL;
    design.calculated.design_udl = loadingResults.designUDL;

    // 2. Enhanced Bracket Calculations with Angle Extension Support
    // Check if angle extension is enabled and should be applied
    const shouldUseAngleExtension = shouldApplyAngleExtension(
        designInputs.enable_angle_extension,
        designInputs.max_allowable_bracket_extension
    );

    let bracketHeightWithExtension: number;
    let angleExtensionResult: AngleExtensionResult | undefined;

    if (design.genetic.bracket_type === 'Inverted') {
        // Use enhanced inverted bracket calculation
        const invertedResults = calculateInvertedBracketHeight({
            support_level: design.calculated.support_level,
            angle_thickness: design.genetic.angle_thickness,
            top_critical_edge: 75, // Default, will be replaced with channel-specific values if available
            bottom_critical_edge: 150, // Default, will be replaced with channel-specific values if available
            slab_thickness: design.calculated.slab_thickness,
            fixing_position: design.genetic.fixing_position,
            dim_d: design.genetic.dim_d,
            // Angle extension parameters
            max_allowable_bracket_extension: designInputs.max_allowable_bracket_extension,
            enable_angle_extension: designInputs.enable_angle_extension,
            bracket_type: design.genetic.bracket_type,
            angle_orientation: design.genetic.angle_orientation,
            current_angle_height: design.genetic.vertical_leg
        });

        bracketHeightWithExtension = invertedResults.bracket_height;
        angleExtensionResult = invertedResults.angle_extension;

        // Update design with inverted bracket specific calculations
        design.calculated.rise_to_bolts = invertedResults.rise_to_bolts;
        design.calculated.drop_below_slab = invertedResults.drop_below_slab;

    } else {
        // Use enhanced standard bracket calculation with extension support
        if (shouldUseAngleExtension) {
            const standardResults = calculateStandardBracketHeightWithExtension({
                support_level: design.calculated.support_level,
                top_critical_edge: 75, // Default, will be replaced with channel-specific values if available
                distance_from_top_to_fixing: 40, // Y constant from bracket angle selection
                slab_thickness: design.calculated.slab_thickness,
                fixing_position: design.genetic.fixing_position,
                // Angle extension parameters
                max_allowable_bracket_extension: designInputs.max_allowable_bracket_extension,
                enable_angle_extension: designInputs.enable_angle_extension,
                bracket_type: design.genetic.bracket_type,
                angle_orientation: design.genetic.angle_orientation,
                current_angle_height: design.genetic.vertical_leg
            });

            bracketHeightWithExtension = standardResults.bracket_height;
            angleExtensionResult = standardResults.angle_extension;
        } else {
            // Use standard calculation without extension
            bracketHeightWithExtension = design.calculated.bracket_height;
        }
    }

    // Store angle extension results in design
    design.calculated.angle_extension_result = angleExtensionResult;

    // Update genetic parameters if orientation was flipped
    if (angleExtensionResult?.angle_orientation_flipped) {
        console.log(`🔄 GENETIC ANGLE ORIENTATION UPDATE:`, {
            original: design.genetic.angle_orientation,
            flipped_to: angleExtensionResult.final_angle_orientation,
            reason: angleExtensionResult.flip_reason
        });

        // Update the genetic parameters with the final orientation
        design.genetic.angle_orientation = angleExtensionResult.final_angle_orientation;
    }

    // Calculate effective vertical leg (original or extended)
    const effectiveVerticalLeg = calculateEffectiveVerticalLeg(
        design.genetic.vertical_leg,
        angleExtensionResult
    );
    design.calculated.effective_vertical_leg = effectiveVerticalLeg;

    // Update bracket height with extension-aware value
    design.calculated.bracket_height = bracketHeightWithExtension;

    // 3. Bracket Parameters
    const bracketResults = calculateBracketParameters({
        cavity: design.calculated.cavity_width
    });

    // 4. Angle Calculations (using effective vertical leg)
    if (isStandardAngle && angleExtensionResult?.extension_applied) {
        console.log(`🔧 ANGLE EXTENSION APPLIED:`);
        console.log(`  Original angle height: ${design.genetic.vertical_leg}mm`);
        console.log(`  Extended angle height: ${effectiveVerticalLeg}mm`);
        console.log(`  Bracket reduction: ${angleExtensionResult.bracket_reduction}mm`);
        console.log(`  Extension limit: ${angleExtensionResult.max_extension_limit}mm`);
    }

    console.log(`🔍 EVALUATE DEBUG: Calculated parameters:`, {
        facade_thickness: design.calculated.facade_thickness,
        load_position: design.calculated.load_position,
        front_offset: design.calculated.front_offset,
        isolation_shim_thickness: design.calculated.isolation_shim_thickness,
        cavity_width: design.calculated.cavity_width,
        effective_vertical_leg: effectiveVerticalLeg,
        original_vertical_leg: design.genetic.vertical_leg
    });

    const angleResults = calculateAngleParameters({
        C: design.calculated.cavity_width,
        D: design.calculated.cavity_width - 10,
        S: 3,
        T: design.genetic.angle_thickness,
        B_cc: design.genetic.bracket_centres,
        // Pass facade parameters for dynamic horizontal leg calculation
        facade_thickness: design.calculated.facade_thickness,
        load_position: design.calculated.load_position,
        front_offset: design.calculated.front_offset,
        isolation_shim_thickness: design.calculated.isolation_shim_thickness,
        depth_to_toe_plate: 12 // Default value, can be adjusted in rare occasions
    });

    // Update genetic parameters with calculated horizontal leg
    design.genetic.horizontal_leg = angleResults.horizontal_leg;

    // 5. Mathematical Model Calculations (using effective vertical leg)
    const mathModelResults = calculateMathematicalModel({
        M: design.calculated.masonry_thickness ?? 102.5, // Keep for backward compatibility
        d: angleResults.cavity_back_angle, // Use cavity_back_angle instead of d
        T: design.genetic.angle_thickness,
        R: angleResults.R,
        L_bearing: angleResults.b,
        A: effectiveVerticalLeg, // Use effective vertical leg instead of original
        facade_thickness: design.calculated.facade_thickness,
        load_position: design.calculated.load_position
    });

    // --- Verification Checks ---
    const verificationResults = verifyAll(
        design.calculated.shear_load,
        {
            bracketHeight: design.calculated.bracket_height,
            angleThickness: design.genetic.angle_thickness,
            bracketProjection: design.calculated.bracket_projection,
            bearingLength: angleResults.b,
            riseToBolts: design.calculated.rise_to_bolts,
            boltDiameter: design.genetic.bolt_diameter,
            packerThickness: SYSTEM_DEFAULTS.PACKING_THICKNESS,
            slabThickness: design.calculated.slab_thickness,
            supportLevel: design.calculated.support_level,
            notchHeight: design.calculated.notch_height ?? 0,
            masonry_thickness: design.calculated.facade_thickness ?? 102.5, // Use facade_thickness for fixing check moment arm calculation
            cavity: design.calculated.cavity_width,
            drop_below_slab: design.calculated.drop_below_slab,
            bracketCentres: design.genetic.bracket_centres,
            characteristicUDL: design.calculated.characteristic_udl,
            base_plate_width: SYSTEM_DEFAULTS.BASE_PLATE_WIDTH,
            channelType: design.genetic.channel_type || "CPRO38",
            concreteGrade: SYSTEM_DEFAULTS.CONCRETE_GRADE
        },
        angleResults,
        mathModelResults,
        bracketResults,
        design.genetic.bracket_thickness
    );

    // Update design with calculated verification details
    design.calculated.detailed_verification_results = verificationResults;
    design.calculated.moment_resistance_check = verificationResults.momentResults.passes;
    design.calculated.shear_resistance_check = verificationResults.shearResults.passes;
    design.calculated.angle_deflection_check = verificationResults.deflectionResults.passes;
    design.calculated.bracket_connection_check = verificationResults.angleToBracketResults.passes;
    design.calculated.fixing_check = verificationResults.fixingResults.passes;
    design.calculated.combined_tension_shear_check = verificationResults.combinedResults.passes;
    design.calculated.total_deflection = roundToTwelveDecimals(verificationResults.deflectionResults.totalDeflection);
    design.calculated.shear_reduction_check = verificationResults.packerResults.passes;
    design.calculated.bracket_design_check = verificationResults.bracketDesignResults.passes;
    design.calculated.v_ed = verificationResults.shearResults.V_ed;
    design.calculated.m_ed = verificationResults.momentResults.M_ed_angle;
    design.calculated.n_ed = verificationResults.fixingResults.tensileForce;
    design.calculated.angle_utilisation = verificationResults.deflectionResults.utilization;
    design.calculated.total_system_deflection = verificationResults.totalDeflectionResults.Total_deflection_of_system;
    design.calculated.all_checks_pass = verificationResults.passes;

    // 5. Calculate Bracket Positioning
    let bracketPositioning: AngleLayoutResult | undefined;
    try {
        bracketPositioning = calculateBracketPositioning({
            isLengthLimited,
            fixedLength,
            centerToCenter: design.genetic.bracket_centres
        });
        
        // Add bracket positioning to the design 
        design.calculated.bracketLayout = bracketPositioning;
    } catch (error) {
        console.warn("Unable to calculate bracket positioning:", error);
        // Don't fail the overall design if just the bracket layout fails
    }

    // --- Calculate Weight (using effective vertical leg) ---
    const weights = calculateSystemWeight(
        design.calculated.bracket_height,
        design.calculated.bracket_projection,
        design.genetic.bracket_thickness,
        design.genetic.bracket_centres,
        design.genetic.angle_thickness,
        effectiveVerticalLeg, // Use effective vertical leg instead of original
        design.genetic.horizontal_leg // Pass the calculated horizontal leg
    );
    design.calculated.weights = weights;

    // --- Determine Result ---
    const isValid = verificationResults.passes;
    const totalWeight = isValid ? weights.totalWeight : Infinity; // Assign Infinity if invalid
    
    // Log failures for standard angle designs
    if (isStandardAngle && !isValid) {
        console.log(`  FAILED verification checks:`);
        if (!verificationResults.momentResults.passes) {
            console.log(`    - Moment: ${verificationResults.momentResults.utilization?.toFixed(2)}% utilization`);
        }
        if (!verificationResults.shearResults.passes) {
            console.log(`    - Shear: ${verificationResults.shearResults.utilization?.toFixed(2)}% utilization`);
        }
        if (!verificationResults.deflectionResults.passes) {
            console.log(`    - Deflection: ${verificationResults.deflectionResults.utilization?.toFixed(2)}% utilization`);
        }
        if (!verificationResults.fixingResults.passes) {
            console.log(`    - Fixing: Failed`);
        }
        if (!verificationResults.angleToBracketResults.passes) {
            console.log(`    - Angle to Bracket: Failed`);
        }
        if (!verificationResults.bracketDesignResults.passes) {
            console.log(`    - Bracket Design: Failed`);
        }
    } else if (isStandardAngle && isValid) {
        const verticalLegInfo = angleExtensionResult?.extension_applied
            ? `${effectiveVerticalLeg}mm (extended from ${design.genetic.vertical_leg}mm)`
            : `${design.genetic.vertical_leg}mm`;
        console.log(`  PASSED - Weight: ${totalWeight.toFixed(2)} kg/m, Vertical Leg: ${verticalLegInfo}`);
    }

    return {
        isValid,
        totalWeight,
        design, // Return the updated design object
        verificationResults // Return verification details
    };
} 
