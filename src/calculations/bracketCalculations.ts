import { roundToTwelveDecimals } from '../utils/precision';

export interface BracketCalculationInputs {
    cavity: number;  // Cavity width in mm
}

export interface BracketCalculationResults {
    design_cavity: number;  // Design cavity (C') in mm
}

export interface InvertedBracketInputs {
    support_level: number;           // Distance from SSL to BSL (positive for inverted)
    angle_thickness: number;         // Angle thickness in mm
    vertical_leg: number;            // Vertical leg (angle height) in mm
    top_critical_edge: number;       // Top critical edge distance (e.g., 75mm)
    bottom_critical_edge: number;    // Bottom critical edge distance (e.g., 125mm)
    slab_thickness: number;          // Slab thickness in mm
    fixing_position?: number;        // Optional fixing position from top of slab (defaults to top_critical_edge)
}

export interface InvertedBracketResults {
    bracket_height: number;          // Total bracket height in mm
    rise_to_bolts: number;          // Rise to bolts in mm
    drop_below_slab: number;        // Extension below slab soffit in mm
    height_above_ssl: number;       // Height above SSL in mm
    height_below_ssl: number;       // Height below SSL in mm
    extension_below_slab: number;   // Extension needed below slab in mm
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
        vertical_leg,
        top_critical_edge,
        bottom_critical_edge,
        fixing_position
        // slab_thickness - not currently used in calculation but kept for future use
    } = inputs;

    // Use dynamic fixing position if provided, otherwise fall back to top_critical_edge
    const effectiveTopCriticalEdge = fixing_position || top_critical_edge;

    // 1. Calculate Height Above SSL
    // Support level + vertical leg projection above SSL (vertical leg - angle thickness)
    const vertical_leg_projection = Math.max(0, vertical_leg - angle_thickness);
    const height_above_ssl_raw = support_level + vertical_leg_projection;

    // 2. Calculate Height Below SSL
    // This ensures minimum bearing requirements
    const minimum_bearing_required = 120; // mm
    const slot_tolerance = 15; // mm
    const total_required_below_fixing = minimum_bearing_required + slot_tolerance; // 135mm
    
    // Calculate extension needed below slab
    const extension_below_slab_raw = Math.max(0, total_required_below_fixing - bottom_critical_edge);
    
    const height_below_ssl_raw = effectiveTopCriticalEdge + bottom_critical_edge + extension_below_slab_raw;

    // 3. Calculate Total Bracket Height
    const total_bracket_height_raw = height_above_ssl_raw + height_below_ssl_raw;

    // 4. Calculate Rise to Bolts
    // Distance from bottom of bracket to fixing point
    const rise_to_bolts_raw = bottom_critical_edge + extension_below_slab_raw;

    // 5. Calculate Drop Below Slab
    // How much the bracket extends past the concrete soffit
    const drop_below_slab_raw = extension_below_slab_raw;

    // Round all final results to 12 decimal places
    return {
        bracket_height: roundToTwelveDecimals(total_bracket_height_raw),
        rise_to_bolts: roundToTwelveDecimals(rise_to_bolts_raw),
        drop_below_slab: roundToTwelveDecimals(drop_below_slab_raw),
        height_above_ssl: roundToTwelveDecimals(height_above_ssl_raw),
        height_below_ssl: roundToTwelveDecimals(height_below_ssl_raw),
        extension_below_slab: roundToTwelveDecimals(extension_below_slab_raw)
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