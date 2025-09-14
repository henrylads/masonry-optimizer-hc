import type { Design } from './index';
import { calculateSystemWeight } from '../steelWeight';
import { verifyAll, VerificationResults } from '../verificationChecks';
import { calculateBracketParameters } from '../bracketCalculations';
import { calculateAngleParameters } from '../angleCalculations';
import { calculateMathematicalModel } from '../verificationChecks/mathematicalModelCalculations';
import { calculateLoading } from '../loadingCalculations';
import { SYSTEM_DEFAULTS } from '@/constants';
import { roundToTwelveDecimals } from '@/utils/precision';
import { calculateBracketPositioning, AngleLayoutResult } from '../angleLayout';

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

    // 2. Bracket Calculations
    const bracketResults = calculateBracketParameters({
        cavity: design.calculated.cavity_width
    });

    // 3. Angle Calculations
    const angleResults = calculateAngleParameters({
        C: design.calculated.cavity_width,
        D: design.calculated.cavity_width - 10,
        S: 3,
        T: design.genetic.angle_thickness,
        B: 90,
        B_cc: design.genetic.bracket_centres
    });

    // 4. Mathematical Model Calculations
    const mathModelResults = calculateMathematicalModel({
        M: design.calculated.masonry_thickness ?? 102.5,
        d: angleResults.d,
        T: design.genetic.angle_thickness,
        R: angleResults.R,
        L_bearing: angleResults.b,
        A: design.genetic.vertical_leg
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
            masonry_thickness: design.calculated.masonry_thickness ?? 102.5,
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

    // --- Calculate Weight ---
    const weights = calculateSystemWeight(
        design.calculated.bracket_height,
        design.calculated.bracket_projection,
        design.genetic.bracket_thickness,
        design.genetic.bracket_centres,
        design.genetic.angle_thickness,
        design.genetic.vertical_leg
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
        console.log(`  PASSED - Weight: ${totalWeight.toFixed(2)} kg/m`);
    }

    return {
        isValid,
        totalWeight,
        design, // Return the updated design object
        verificationResults // Return verification details
    };
} 
