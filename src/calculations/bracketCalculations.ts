import { roundToTwelveDecimals } from '../utils/precision';
import {
    calculateAngleExtension,
    shouldApplyAngleExtension,
    type AngleExtensionInputs
} from './angleExtensionCalculations';
import {
    BRACKET_ANGLE_CONSTANTS,
    calculateBracketHeight,
    type BracketHeightCalculationParams
} from './bracketAngleSelection';
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
    dim_d?: number;                  // Distance from bracket bottom to fixing point (130-450mm, default 130mm)

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
    dim_d: number;                  // Distance from bracket bottom to fixing point (130-450mm)
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
 * Calculates inverted bracket dimensions using a simplified geometry-first approach.
 *
 * This method follows the engineer's guidance from invertedBracketCalculations.md:
 * 1. Calculate Height Above SSL = Support Level + Angle Adjustment
 * 2. Calculate Height Below SSL = Top Edge + Bottom Edge + Extension Below Slab
 * 3. Total Bracket Height = Height Above SSL + Height Below SSL
 * 4. Calculate Dim D from geometry = Bottom Edge + Extension Below Slab
 * 5. Apply Dim D manufacturing constraints (130-450mm), extending bracket if needed
 * 6. Calculate Rise to Bolts = Dim D - 15mm (worst-case slot position)
 *
 * Per the Bracket and Angle Selection Table (projectOverview.md), inverted brackets are used
 * when support level > -75mm (above the fixing point), including negative values like -25mm, -50mm.
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
        fixing_position,
        slab_thickness,
        current_angle_height = 60 // Default angle height is 60mm
    } = inputs;

    // Use dynamic fixing position if provided, otherwise fall back to top_critical_edge
    const effectiveFixingPosition = fixing_position || top_critical_edge;

    // Get angle height (60mm for most thicknesses, 75mm for 8mm)
    const angle_height = angle_thickness === 8 ? 75 : current_angle_height;

    // Calculate angle adjustment for Standard angle orientation
    const angle_adjustment = (inputs.angle_orientation === 'Standard')
        ? (angle_height - angle_thickness)
        : 0;

    // Calculate height above SSL and bracket top position
    let height_above_ssl_raw: number;
    let bracket_top_position_from_ssl: number; // Where the bracket TOP sits relative to SSL

    if (support_level >= 0) {
        // Angle is above SSL (or at SSL for support_level = 0)
        // For Standard angle: bracket extends up by (angle_height - angle_thickness)
        // For Inverted angle: bracket top is at support_level (horizontal leg position)
        height_above_ssl_raw = support_level + angle_adjustment;
        bracket_top_position_from_ssl = support_level + angle_adjustment;
    } else {
        // Angle is below SSL (inside slab) - bracket doesn't extend above SSL
        height_above_ssl_raw = 0;
        bracket_top_position_from_ssl = support_level; // negative value (e.g., -25mm)
    }

    // STEP 2: Calculate Dim D constraints
    const SLOT_TOLERANCE = 15; // mm - slot tolerance for worst-case positioning
    const min_dim_d = BRACKET_ANGLE_CONSTANTS.INVERTED_BRACKET_MIN_DIM_D; // 130mm
    const max_dim_d_manufacturing = BRACKET_ANGLE_CONSTANTS.INVERTED_BRACKET_MAX_DIM_D; // 450mm

    // Slab geometry constraint: Dim D cannot exceed available space below fixing
    // If fixing is 75mm from top of 225mm slab, max Dim D = 225 - 75 = 150mm
    const max_dim_d_slab = slab_thickness - effectiveFixingPosition;

    // Actual maximum is the lesser of manufacturing limit and slab constraint
    const max_dim_d = Math.min(max_dim_d_manufacturing, max_dim_d_slab);

    // Use provided Dim D if available, otherwise use minimum
    const target_dim_d = inputs.dim_d || min_dim_d;

    // Apply Dim D constraints (130mm minimum, limited by slab geometry and manufacturing)
    const final_dim_d = Math.max(min_dim_d, Math.min(target_dim_d, max_dim_d));

    // STEP 3: Calculate bracket height based on where bracket top and bottom are
    // Bracket bottom is at: SSL - fixing_position - dim_d (e.g., 0 - 75 - 135 = -210mm from SSL)
    // Bracket top is at: bracket_top_position_from_ssl (includes angle adjustment for Standard angle)
    // Bracket height = distance from bracket top to bracket bottom

    const bracket_bottom_from_ssl = -(effectiveFixingPosition + final_dim_d); // negative value
    let final_bracket_height = Math.abs(bracket_top_position_from_ssl - bracket_bottom_from_ssl);

    // Enforce minimum clearance above fixing (40mm) and minimum bracket height (175mm)
    // For inverted brackets, we need adequate space between angle horizontal leg and fixing
    // Note: For Standard angle, the horizontal leg is at support_level, not at bracket_top
    const angle_horizontal_leg_position = support_level; // Where the horizontal leg actually is
    const fixing_from_ssl = -effectiveFixingPosition;
    const clearance_above_fixing = Math.abs(angle_horizontal_leg_position - fixing_from_ssl);
    const min_clearance = BRACKET_ANGLE_CONSTANTS.INVERTED_BRACKET_MIN_CLEARANCE_ABOVE_FIXING; // 40mm

    // Calculate minimum bracket height requirement
    const min_bracket_height_from_clearance = final_dim_d + min_clearance;
    const min_bracket_height_absolute = BRACKET_ANGLE_CONSTANTS.INVERTED_BRACKET_MIN_HEIGHT; // 170mm
    const required_min_height = Math.max(min_bracket_height_from_clearance, min_bracket_height_absolute);

    // If current bracket height is less than minimum, extend it
    if (final_bracket_height < required_min_height) {
        const extension_needed = required_min_height - final_bracket_height;
        final_bracket_height = required_min_height;
        console.log(`⚠️  Inverted bracket extended from ${final_bracket_height - extension_needed}mm to ${final_bracket_height}mm to meet minimum requirements`);
    }

    // Recalculate height below SSL based on actual bracket geometry
    const height_below_ssl_raw = Math.abs(bracket_bottom_from_ssl);

    // STEP 5: Calculate Final Dimensions
    const extension_below_slab = Math.max(0, final_bracket_height - slab_thickness);

    // Rise to bolts = Dim D - worst case adjustment (bottom-of-slot position)
    const rise_to_bolts_raw = final_dim_d - SLOT_TOLERANCE;

    // Display value (middle-of-slot position for user display)
    const rise_to_bolts_display_raw = rise_to_bolts_raw + SLOT_TOLERANCE;

    // Handle angle extension if enabled (existing logic)
    let angle_extension_result: AngleExtensionResult | undefined;
    let adjusted_bracket_height = final_bracket_height;
    let adjusted_extension_below_slab = extension_below_slab;

    if (shouldApplyAngleExtension(inputs.enable_angle_extension, inputs.max_allowable_bracket_extension)) {
        try {
            const extension_inputs: AngleExtensionInputs = {
                original_bracket_height: final_bracket_height,
                max_allowable_bracket_extension: inputs.max_allowable_bracket_extension!,
                current_angle_height: angle_height,
                required_support_level: support_level,
                slab_thickness: slab_thickness,
                bracket_type: 'Inverted',
                angle_orientation: inputs.angle_orientation || 'Standard',
                fixing_position: effectiveFixingPosition,
                height_above_ssl: height_above_ssl_raw
            };

            angle_extension_result = calculateAngleExtension(extension_inputs);

            if (angle_extension_result.extension_applied) {
                adjusted_bracket_height = angle_extension_result.limited_bracket_height;
                adjusted_extension_below_slab = Math.max(0, adjusted_bracket_height - slab_thickness);
            }
        } catch (error) {
            console.warn('Angle extension calculation failed:', error);
        }
    }

    // Round all final results to 12 decimal places
    return {
        bracket_height: roundToTwelveDecimals(adjusted_bracket_height),
        rise_to_bolts: roundToTwelveDecimals(rise_to_bolts_raw),
        rise_to_bolts_display: roundToTwelveDecimals(rise_to_bolts_display_raw),
        drop_below_slab: roundToTwelveDecimals(adjusted_extension_below_slab),
        height_above_ssl: roundToTwelveDecimals(height_above_ssl_raw),
        height_below_ssl: roundToTwelveDecimals(height_below_ssl_raw),
        extension_below_slab: roundToTwelveDecimals(adjusted_extension_below_slab),
        dim_d: roundToTwelveDecimals(final_dim_d),
        angle_extension: angle_extension_result
    };
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

    // Enforce 150mm minimum height for standard brackets (structural minimum)
    const min_standard_height = BRACKET_ANGLE_CONSTANTS.STANDARD_BRACKET_MIN_HEIGHT;
    if (final_bracket_height < min_standard_height) {
        final_bracket_height = min_standard_height;
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

    // Enforce 150mm minimum height for standard brackets (structural minimum)
    const min_standard_height = BRACKET_ANGLE_CONSTANTS.STANDARD_BRACKET_MIN_HEIGHT;
    const final_bracket_height = Math.max(bracket_height_raw, min_standard_height);

    return roundToTwelveDecimals(final_bracket_height);
} 