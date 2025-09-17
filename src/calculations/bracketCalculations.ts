import { roundToTwelveDecimals } from '../utils/precision';
import {
    calculateAngleExtension,
    shouldApplyAngleExtension,
    type AngleExtensionInputs
} from './angleExtensionCalculations';
import type { BracketType, AngleOrientation, AngleExtensionResult } from '../types/bracketAngleTypes';

export interface BracketCalculationInputs {
    cavity: number;  // Cavity width in mm
}

export interface BracketCalculationResults {
    design_cavity: number;  // Design cavity (C') in mm
}

export interface InvertedBracketInputs {
    support_level: number;           // Distance from SSL to BSL (positive for inverted)
    angle_thickness: number;         // Angle thickness in mm
    top_critical_edge: number;       // Top critical edge distance (e.g., 75mm)
    bottom_critical_edge: number;    // Bottom critical edge distance (e.g., 125mm)
    slab_thickness: number;          // Slab thickness in mm
    fixing_position?: number;        // Optional fixing position from top of slab (defaults to top_critical_edge)

    // Angle extension parameters
    max_allowable_bracket_extension?: number | null;  // Maximum bracket position relative to top of slab (mm)
    enable_angle_extension?: boolean;                 // Enable angle extension feature
    bracket_type?: BracketType;                      // Bracket type for extension calculations
    angle_orientation?: AngleOrientation;            // Angle orientation for extension calculations
    current_angle_height?: number;                   // Current angle vertical leg height (mm)
}

export interface InvertedBracketResults {
    bracket_height: number;          // Total bracket height in mm
    rise_to_bolts: number;          // Rise to bolts in mm
    drop_below_slab: number;        // Extension below slab soffit in mm
    height_above_ssl: number;       // Height above SSL in mm
    height_below_ssl: number;       // Height below SSL in mm
    extension_below_slab: number;   // Extension needed below slab in mm
    angle_extension?: AngleExtensionResult;  // Angle extension calculation result (if applied)
}

/**
 * Calculates bracket-related parameters according to project overview
 * All intermediate calculations maintain full precision
 * Only final results are rounded to 12 decimal places
 * 
 * @param inputs Bracket calculation inputs
 * @returns Bracket calculation results
 */
export function calculateBracketParameters(inputs: BracketCalculationInputs): BracketCalculationResults {
    // Calculate design cavity (C') = C + 20
    // Keep full precision for intermediate calculations
    const design_cavity_raw = inputs.cavity + 20;

    // Round final results to 12 decimal places
    return {
        design_cavity: roundToTwelveDecimals(design_cavity_raw)
    };
}

/**
 * Calculates inverted bracket dimensions using the proper two-component method
 * from the invertedBracketCalculations.md documentation with support for dynamic fixing positions
 * 
 * @param inputs Inverted bracket calculation inputs
 * @returns Inverted bracket calculation results
 */
export function calculateInvertedBracketHeight(inputs: InvertedBracketInputs): InvertedBracketResults {
    const {
        support_level,
        angle_thickness,
        top_critical_edge,
        bottom_critical_edge,
        fixing_position
        // slab_thickness - not currently used in calculation but kept for future use
    } = inputs;

    // Use dynamic fixing position if provided, otherwise fall back to top_critical_edge
    const effectiveTopCriticalEdge = fixing_position || top_critical_edge;

    console.log(`🔧 INVERTED BRACKET DEBUG - Initial Parameters:`, {
        support_level,
        angle_thickness,
        top_critical_edge,
        bottom_critical_edge,
        slab_thickness: inputs.slab_thickness,
        fixing_position,
        effectiveTopCriticalEdge,
        max_allowable_bracket_extension: inputs.max_allowable_bracket_extension,
        enable_angle_extension: inputs.enable_angle_extension
    });

    // 1. Calculate Height Above SSL
    // Support level + angle height adjustment
    let angle_height_adjustment: number;
    if (angle_thickness === 8) {
        // For 8mm angle: -7mm adjustment (8mm - 15mm due to different vertical leg)
        angle_height_adjustment = -7;
    } else {
        // For 3,4,5,6mm angles: add the angle thickness itself
        angle_height_adjustment = angle_thickness;
    }

    const height_above_ssl_raw = support_level + angle_height_adjustment;

    console.log(`🔧 INVERTED BRACKET DEBUG - Height Above SSL Calculation:`, {
        support_level,
        angle_height_adjustment,
        height_above_ssl_raw
    });

    // 2. Calculate Height Below SSL
    // This ensures minimum bearing requirements AND support level requirements
    const minimum_bearing_required = 120; // mm
    const slot_tolerance = 15; // mm
    const total_required_below_fixing = minimum_bearing_required + slot_tolerance; // 135mm

    // Calculate extension needed below slab for minimum bearing
    let extension_below_slab_raw = Math.max(0, total_required_below_fixing - bottom_critical_edge);

    // Also consider support level requirement - if support level is very negative,
    // we might need more extension than just the minimum bearing
    // Calculate how far the support level extends beyond what the bracket can reach within the slab
    // Support level is measured from top of slab, so we need to check if it extends beyond
    // the maximum bracket reach (fixing position + critical edges)
    const support_level_extension_required = Math.max(0, Math.abs(support_level) - effectiveTopCriticalEdge - bottom_critical_edge);

    // Use the larger of the two extension requirements
    extension_below_slab_raw = Math.max(extension_below_slab_raw, support_level_extension_required);

    console.log(`🔧 EXTENSION CALCULATION DEBUG:`, {
        minimum_bearing_extension: Math.max(0, total_required_below_fixing - bottom_critical_edge),
        support_level_extension_required,
        height_above_ssl_raw,
        effectiveTopCriticalEdge,
        bottom_critical_edge,
        final_extension_below_slab_raw: extension_below_slab_raw
    });

    // Apply position limits to extension below slab if angle extension is enabled
    let limited_extension_below_slab = extension_below_slab_raw;
    let angle_extension_amount = 0;

    if (shouldApplyAngleExtension(inputs.enable_angle_extension, inputs.max_allowable_bracket_extension)) {
        // Calculate maximum rise-to-bolts from position limit
        // Rise-to-bolts is the distance from fixing point to the maximum allowable bracket position
        // Both positions are measured from top of slab:
        // - Fixing point: effectiveTopCriticalEdge mm from top (e.g., 75mm)
        // - Max bracket position: max_allowable_bracket_extension from top (e.g., -225mm = 225mm below top)
        // - Max rise-to-bolts = distance between these points = |max_position| - fixing_distance
        const max_rise_to_bolts = Math.abs(inputs.max_allowable_bracket_extension!) - effectiveTopCriticalEdge;

        console.log(`🔧 COORDINATE SYSTEM DEBUG (FIXED):`, {
            effectiveTopCriticalEdge,
            max_allowable_bracket_extension: inputs.max_allowable_bracket_extension,
            max_rise_to_bolts,
            calculation: `|${inputs.max_allowable_bracket_extension}| - ${effectiveTopCriticalEdge} = ${max_rise_to_bolts}mm`,
            explanation: 'Distance from fixing point to maximum bracket position'
        });

        console.log(`🔧 INVERTED BRACKET DEBUG - Position Limit Check:`, {
            max_allowable_bracket_extension: inputs.max_allowable_bracket_extension,
            effectiveTopCriticalEdge,
            max_rise_to_bolts,
            calculated_rise_to_bolts: bottom_critical_edge + extension_below_slab_raw
        });

        // Rise-to-bolts = bottom_critical_edge + extension_below_slab
        const required_rise_to_bolts = bottom_critical_edge + extension_below_slab_raw;

        if (required_rise_to_bolts > max_rise_to_bolts) {
            // Limit the extension below slab to stay within position limit
            const max_extension_below_slab = Math.max(0, max_rise_to_bolts - bottom_critical_edge);
            limited_extension_below_slab = max_extension_below_slab;

            // Calculate how much angle extension is needed to compensate
            angle_extension_amount = required_rise_to_bolts - max_rise_to_bolts;

            console.log(`⚠️ Rise-to-bolts limited by position constraint:`, {
                required_rise_to_bolts,
                max_rise_to_bolts,
                limited_extension_below_slab,
                angle_extension_amount
            });
        }
    }

    const height_below_ssl_raw = effectiveTopCriticalEdge + bottom_critical_edge + limited_extension_below_slab;

    console.log(`🔧 INVERTED BRACKET DEBUG - Height Below SSL Calculation:`, {
        minimum_bearing_required,
        slot_tolerance,
        total_required_below_fixing,
        bottom_critical_edge,
        extension_below_slab_raw,
        limited_extension_below_slab,
        angle_extension_amount,
        effectiveTopCriticalEdge,
        height_below_ssl_raw
    });

    // 3. Calculate Total Bracket Height
    const total_bracket_height_raw = height_above_ssl_raw + height_below_ssl_raw;

    console.log(`🔧 INVERTED BRACKET DEBUG - Total Bracket Height:`, {
        height_above_ssl_raw,
        height_below_ssl_raw,
        total_bracket_height_raw
    });

    // 4. Calculate Rise to Bolts
    // Distance from bottom of bracket to fixing point (using limited extension)
    const rise_to_bolts_raw = bottom_critical_edge + limited_extension_below_slab;

    // 5. Calculate Drop Below Slab
    // How much the bracket extends past the concrete soffit (using limited extension)
    const drop_below_slab_raw = limited_extension_below_slab;

    // Create angle extension result if angle extension was applied
    let angle_extension_result: AngleExtensionResult | undefined;
    let final_bracket_height = total_bracket_height_raw;

    if (angle_extension_amount > 0) {
        // Angle extension was applied - create the result object
        const original_angle_height = inputs.current_angle_height || 60;
        const extended_angle_height = original_angle_height + angle_extension_amount;

        // Validate the extended angle height doesn't exceed manufacturing limits
        const MAX_ANGLE_HEIGHT = 400; // mm
        if (extended_angle_height > MAX_ANGLE_HEIGHT) {
            console.error(`❌ Angle extension would exceed manufacturing limits: ${extended_angle_height}mm > ${MAX_ANGLE_HEIGHT}mm`);
            // For now, we'll throw an error, but could implement fallback logic
            throw new Error(`Angle extension would exceed manufacturing limits. Required: ${extended_angle_height}mm, Maximum: ${MAX_ANGLE_HEIGHT}mm`);
        }

        angle_extension_result = {
            extension_applied: true,
            original_bracket_height: total_bracket_height_raw,
            limited_bracket_height: total_bracket_height_raw, // Bracket height isn't reduced in this approach
            bracket_reduction: 0, // No bracket reduction, just limited rise-to-bolts
            original_angle_height: original_angle_height,
            extended_angle_height: extended_angle_height,
            angle_extension: angle_extension_amount,
            max_extension_limit: inputs.max_allowable_bracket_extension || 0
        };

        console.log(`🔧 INVERTED BRACKET DEBUG - Angle Extension Applied:`, {
            angle_extension_amount,
            original_angle_height,
            extended_angle_height,
            rise_to_bolts_limited_to: rise_to_bolts_raw
        });
    }

    // Round all final results to 12 decimal places
    const final_results = {
        bracket_height: roundToTwelveDecimals(final_bracket_height),
        rise_to_bolts: roundToTwelveDecimals(rise_to_bolts_raw),
        drop_below_slab: roundToTwelveDecimals(drop_below_slab_raw),
        height_above_ssl: roundToTwelveDecimals(height_above_ssl_raw),
        height_below_ssl: roundToTwelveDecimals(height_below_ssl_raw),
        extension_below_slab: roundToTwelveDecimals(limited_extension_below_slab),
        angle_extension: angle_extension_result
    };

    console.log(`🔧 INVERTED BRACKET DEBUG - Final Results:`, final_results);

    return final_results;
}

/**
 * Enhanced standard bracket calculation inputs with angle extension support
 */
export interface StandardBracketInputs {
    support_level: number;           // Distance from SSL to BSL (negative for standard)
    top_critical_edge: number;       // Top critical edge distance (e.g., 75mm)
    distance_from_top_to_fixing: number; // Distance from bracket top to fixing (Y)
    slab_thickness: number;          // Slab thickness in mm
    fixing_position?: number;        // Optional fixing position from top of slab

    // Angle extension parameters
    max_allowable_bracket_extension?: number | null;  // Maximum bracket position relative to top of slab (mm)
    enable_angle_extension?: boolean;                 // Enable angle extension feature
    bracket_type?: BracketType;                      // Bracket type for extension calculations
    angle_orientation?: AngleOrientation;            // Angle orientation for extension calculations
    current_angle_height?: number;                   // Current angle vertical leg height (mm)
}

/**
 * Enhanced standard bracket calculation results with angle extension
 */
export interface StandardBracketResults {
    bracket_height: number;                      // Total bracket height in mm
    angle_extension?: AngleExtensionResult;      // Angle extension calculation result (if applied)
}

/**
 * Enhanced standard bracket height calculation with angle extension support
 *
 * @param inputs Standard bracket calculation inputs with extension parameters
 * @returns Standard bracket calculation results
 */
export function calculateStandardBracketHeightWithExtension(inputs: StandardBracketInputs): StandardBracketResults {
    const {
        support_level,
        top_critical_edge,
        distance_from_top_to_fixing,
        fixing_position,
        slab_thickness
    } = inputs;

    // Use dynamic fixing position if provided, otherwise fall back to top_critical_edge
    const effectiveTopCriticalEdge = fixing_position || top_critical_edge;

    // Standard calculation: |support_level| - effective_top_critical_edge + Y
    const original_bracket_height_raw = Math.abs(support_level) - effectiveTopCriticalEdge + distance_from_top_to_fixing;

    // Calculate angle extension if enabled
    let angle_extension_result: AngleExtensionResult | undefined;
    let final_bracket_height = original_bracket_height_raw;

    if (shouldApplyAngleExtension(inputs.enable_angle_extension, inputs.max_allowable_bracket_extension)) {
        try {
            const extension_inputs: AngleExtensionInputs = {
                original_bracket_height: original_bracket_height_raw,
                max_allowable_bracket_extension: inputs.max_allowable_bracket_extension!,
                current_angle_height: inputs.current_angle_height || 60, // Default angle height
                required_support_level: support_level,
                slab_thickness: slab_thickness,
                bracket_type: inputs.bracket_type || 'Standard',
                angle_orientation: inputs.angle_orientation || 'Standard',
                fixing_position: effectiveTopCriticalEdge
            };

            angle_extension_result = calculateAngleExtension(extension_inputs);

            // Use the limited bracket height if extension was applied
            if (angle_extension_result.extension_applied) {
                final_bracket_height = angle_extension_result.limited_bracket_height;
            }
        } catch (error) {
            // If angle extension fails (e.g., exceeds manufacturing limits),
            // log the error but continue with original calculation
            console.warn('Angle extension calculation failed:', error);
        }
    }

    return {
        bracket_height: roundToTwelveDecimals(final_bracket_height),
        angle_extension: angle_extension_result
    };
}

/**
 * Calculates standard bracket height using the traditional method with dynamic fixing position
 * 
 * @param support_level Support level (should be negative for standard brackets)
 * @param top_critical_edge Top critical edge distance (if using fixed approach)
 * @param distance_from_top_to_fixing Distance from bracket top to fixing (Y)
 * @param fixing_position Optional fixing position from top of slab (defaults to 75mm via top_critical_edge)
 * @returns Standard bracket height
 */
export function calculateStandardBracketHeight(
    support_level: number,
    top_critical_edge: number,
    distance_from_top_to_fixing: number,
    fixing_position?: number
): number {
    // Use dynamic fixing position if provided, otherwise fall back to top_critical_edge
    const effectiveTopCriticalEdge = fixing_position || top_critical_edge;
    
    // Standard calculation: |support_level| - effective_top_critical_edge + Y
    const bracket_height_raw = Math.abs(support_level) - effectiveTopCriticalEdge + distance_from_top_to_fixing;
    return roundToTwelveDecimals(bracket_height_raw);
} 