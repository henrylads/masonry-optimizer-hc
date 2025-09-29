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
    rise_to_bolts: number;          // Rise to bolts in mm - Worst-case position (bottom-of-slot)
    rise_to_bolts_display: number;  // Display value showing middle-of-slot position (15mm above calculation value)
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

    // Apply position limits and calculate angle extension using centralized logic
    let limited_extension_below_slab = extension_below_slab_raw;
    let angle_extension_result: AngleExtensionResult | undefined;

    if (shouldApplyAngleExtension(inputs.enable_angle_extension, inputs.max_allowable_bracket_extension)) {
        // Use centralized angle extension calculation
        try {
            // Calculate the original bracket height that would be needed
            const original_bracket_height_for_extension = height_above_ssl_raw + effectiveTopCriticalEdge + bottom_critical_edge + extension_below_slab_raw;

            const extension_inputs: AngleExtensionInputs = {
                original_bracket_height: original_bracket_height_for_extension,
                max_allowable_bracket_extension: inputs.max_allowable_bracket_extension!,
                current_angle_height: inputs.current_angle_height || 60,
                required_support_level: support_level,
                slab_thickness: inputs.slab_thickness,
                bracket_type: 'Inverted',
                angle_orientation: inputs.angle_orientation || 'Standard',
                fixing_position: effectiveTopCriticalEdge,
                height_above_ssl: height_above_ssl_raw
            };

            angle_extension_result = calculateAngleExtension(extension_inputs);

            // If extension was applied, adjust the extension below slab
            if (angle_extension_result.extension_applied) {
                // The bracket reduction translates to reduced extension below slab for inverted brackets
                const reduction_in_extension = angle_extension_result.bracket_reduction;
                limited_extension_below_slab = Math.max(0, extension_below_slab_raw - reduction_in_extension);

                console.log(`🔧 INVERTED BRACKET - Using Centralized Extension:`, {
                    original_extension_below_slab: extension_below_slab_raw,
                    bracket_reduction: angle_extension_result.bracket_reduction,
                    limited_extension_below_slab,
                    angle_extension: angle_extension_result.angle_extension,
                    angle_orientation_flipped: angle_extension_result.angle_orientation_flipped,
                    original_angle_orientation: angle_extension_result.original_angle_orientation,
                    final_angle_orientation: angle_extension_result.final_angle_orientation,
                    flip_reason: angle_extension_result.flip_reason
                });
            }

        } catch (error) {
            console.warn('Centralized angle extension failed for inverted bracket:', error);
            // Fallback to no extension limit
            limited_extension_below_slab = extension_below_slab_raw;
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
        angle_extension_applied: angle_extension_result?.extension_applied || false,
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

    // Use the angle extension result from centralized calculation
    let final_bracket_height = total_bracket_height_raw;

    // If angle extension was applied with bracket reduction, use the limited bracket height
    if (angle_extension_result?.extension_applied && angle_extension_result.bracket_reduction > 0) {
        final_bracket_height = angle_extension_result.limited_bracket_height;
        console.log(`🔧 USING LIMITED BRACKET HEIGHT:`, {
            original_bracket_height: total_bracket_height_raw,
            limited_bracket_height: final_bracket_height,
            bracket_reduction: angle_extension_result.bracket_reduction
        });
    }

    // Calculate display value (middle-of-slot position = worst-case + 15mm)
    const rise_to_bolts_display_raw = rise_to_bolts_raw + 15;

    // Round all final results to 12 decimal places
    const final_results = {
        bracket_height: roundToTwelveDecimals(final_bracket_height),
        rise_to_bolts: roundToTwelveDecimals(rise_to_bolts_raw),
        rise_to_bolts_display: roundToTwelveDecimals(rise_to_bolts_display_raw),
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
                // height_above_ssl not applicable for standard brackets
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