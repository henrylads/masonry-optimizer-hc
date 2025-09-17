import { roundToTwelveDecimals } from '@/utils/precision';
import { calculateAngleProjection } from './angleProjectionCalculations';
import type { AngleExtensionResult } from '@/types/bracketAngleTypes';

/**
 * Interface for angle calculation inputs
 */
export interface AngleCalculationInputs {
    /** Cavity width (mm) */
    C: number;
    /** Bracket projection (mm) */
    D: number;
    /** Isolation shim thickness (mm) */
    S: number;
    /** Angle thickness (mm) */
    T: number;
    /** Horizontal leg length (mm) - optional, will be calculated from facade parameters if not provided */
    B?: number;
    /** Bracket centres (mm) */
    B_cc: number;
    /** Facade thickness (mm) - for dynamic horizontal leg calculation */
    facade_thickness?: number;
    /** Load position as fraction of facade thickness (0-1 range) */
    load_position?: number;
    /** Front offset distance (mm) */
    front_offset?: number;
    /** Isolation shim thickness for angle projection (mm) - may differ from S */
    isolation_shim_thickness?: number;
}

/**
 * Interface for angle calculation results
 */
export interface AngleCalculationResults {
    /** Distance from cavity to back of angle (mm) */
    d: number;
    /** Length of bearing (mm) */
    b: number;
    /** Internal radius (mm) */
    R: number;
    /** Section modulus (mm³) */
    Z: number;
    /** Shear area (mm²) */
    Av: number;
    /** Second moment of area (mm⁴) */
    Ixx_1: number;
    /** Calculated horizontal leg length (mm) - dynamically determined from facade parameters */
    horizontal_leg: number;
}

/**
 * Calculates all angle-related parameters according to project overview
 * All intermediate calculations maintain full precision
 * Only final results are rounded to 12 decimal places
 *
 * @param params Input parameters for angle calculations
 * @returns Results of angle calculations
 */
export function calculateAngleParameters(params: AngleCalculationInputs): AngleCalculationResults {
    console.log(`🔍 ANGLE CALC DEBUG: Received parameters:`, {
        facade_thickness: params.facade_thickness,
        D: params.D,
        load_position: params.load_position,
        front_offset: params.front_offset,
        isolation_shim_thickness: params.isolation_shim_thickness,
        B: params.B
    });

    // Calculate horizontal leg B dynamically if facade parameters are provided
    let effectiveB = params.B || 90; // Default to 90mm for backward compatibility

    if (params.facade_thickness && params.D !== undefined) {
        try {
            // Calculate horizontal leg using angle projection
            const angleProjection = calculateAngleProjection({
                facade_thickness: params.facade_thickness,
                cavity: params.C,
                bracket_projection: params.D,
                isolation_shim_thickness: params.isolation_shim_thickness || params.S,
                front_offset: params.front_offset || 12
            });

            effectiveB = angleProjection.rounded_projection;
            console.log(`✅ Dynamic horizontal leg calculated: ${effectiveB}mm (was ${params.B || 90}mm)`);
        } catch (error) {
            console.error('❌ Error calculating dynamic horizontal leg:', error);
            console.warn('⚠️  Falling back to default horizontal leg: 90mm');
            effectiveB = 90;
        }
    } else {
        // Log what facade parameters are missing
        if (!params.facade_thickness) {
            console.warn('⚠️  facade_thickness not provided, using default horizontal leg: 90mm');
        }
        if (params.D === undefined) {
            console.warn('⚠️  bracket projection (D) not provided, using default horizontal leg: 90mm');
        }
    }

    // Calculate d = (C-D-S)+IF(T=5 THEN, 6, ELSE 5)
    // Distance from cavity to back of angle
    const d_raw = (params.C - params.D - params.S) + (params.T === 5 ? 6 : 5);

    // Calculate b = B-T-d
    // Length of bearing which is horizontal leg minus the angle thickness minus the cavity to the back of the angle
    const b_raw = effectiveB - params.T - d_raw;
    
    // Calculate R = T
    // Internal radius R = the same as the angle thickness
    const R_raw = params.T;
    
    // Calculate Z = (B_cc*T^2)/6
    // Section of modulus used for the angle is the bracket centres multiplied by the angle thickness to power of 2 divided by 6
    const Z_raw = (params.B_cc * Math.pow(params.T, 2)) / 6;
    
    // Calculate Av = B_cc*T
    // Shear area measured in mm2
    const Av_raw = params.B_cc * params.T;
    
    // Calculate Ixx_1 = (B_cc*T^3)/12
    // Second moment of area of the angle in mm4
    const Ixx_1_raw = (params.B_cc * Math.pow(params.T, 3)) / 12;
    
    // Round all results to 12 decimal places
    return {
        d: roundToTwelveDecimals(d_raw),
        b: roundToTwelveDecimals(b_raw),
        R: roundToTwelveDecimals(R_raw),
        Z: roundToTwelveDecimals(Z_raw),
        Av: roundToTwelveDecimals(Av_raw),
        Ixx_1: roundToTwelveDecimals(Ixx_1_raw),
        horizontal_leg: roundToTwelveDecimals(effectiveB)
    };
}

/**
 * Calculates the effective vertical leg length when angle extension is applied
 *
 * @param original_vertical_leg Original vertical leg height (mm)
 * @param angle_extension_result Angle extension calculation result (optional)
 * @returns Effective vertical leg height accounting for extension
 */
export function calculateEffectiveVerticalLeg(
    original_vertical_leg: number,
    angle_extension_result?: AngleExtensionResult
): number {
    // If no angle extension was applied, return original value
    if (!angle_extension_result || !angle_extension_result.extension_applied) {
        return roundToTwelveDecimals(original_vertical_leg);
    }

    // If angle extension was applied, return the extended angle height
    return roundToTwelveDecimals(angle_extension_result.extended_angle_height);
}

/**
 * Enhanced angle calculation inputs that include angle extension results
 */
export interface AngleCalculationInputsWithExtension extends AngleCalculationInputs {
    /** Angle extension result (if extension was applied) */
    angle_extension_result?: AngleExtensionResult;

    /** Original vertical leg height before extension (mm) */
    original_vertical_leg?: number;
}

/**
 * Enhanced angle calculation results that include effective vertical leg
 */
export interface AngleCalculationResultsWithExtension extends AngleCalculationResults {
    /** Effective vertical leg height accounting for extension (mm) */
    effective_vertical_leg: number;

    /** Angle extension result (if applied) */
    angle_extension_result?: AngleExtensionResult;
}

/**
 * Enhanced angle calculations that account for angle extension
 *
 * @param params Input parameters including extension information
 * @returns Angle calculation results with effective vertical leg
 */
export function calculateAngleParametersWithExtension(
    params: AngleCalculationInputsWithExtension
): AngleCalculationResultsWithExtension {
    // Calculate standard angle parameters
    const baseResults = calculateAngleParameters(params);

    // Calculate effective vertical leg
    const original_vertical_leg = params.original_vertical_leg || 60; // Default to 60mm
    const effective_vertical_leg = calculateEffectiveVerticalLeg(
        original_vertical_leg,
        params.angle_extension_result
    );

    return {
        ...baseResults,
        effective_vertical_leg,
        angle_extension_result: params.angle_extension_result
    };
}

/**
 * Formats the angle calculation results into a table format
 * @param results Angle calculation results
 * @returns Formatted string containing the results table
 */
export function formatAngleCalculationResults(results: AngleCalculationResults): string {
    return `
| Parameter | Value | Unit | Description |
|-----------|--------|------|-------------|
| d | ${results.d} | mm | Distance from cavity to back of angle |
| b | ${results.b} | mm | Length of bearing |
| R | ${results.R} | mm | Internal radius |
| Z | ${results.Z} | mm³ | Section modulus |
| Av | ${results.Av} | mm² | Shear area |
| Ixx_1 | ${results.Ixx_1} | mm⁴ | Second moment of area |
`;
} 