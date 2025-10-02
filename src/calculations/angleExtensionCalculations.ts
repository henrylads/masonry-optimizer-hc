import { roundToTwelveDecimals } from '../utils/precision';
import type { AngleExtensionResult, BracketType, AngleOrientation } from '../types/bracketAngleTypes';
import { calculateOptimalAngleOrientation } from './angleOrientationOptimization';

/**
 * Input parameters for angle extension calculations
 */
export interface AngleExtensionInputs {
  /** Original bracket height before any extension limits (mm) */
  original_bracket_height: number;

  /** Maximum allowable bracket position relative to top of slab (mm) - negative = below slab, positive = above slab, null = no limit */
  max_allowable_bracket_extension: number | null;

  /** Current angle vertical leg height (mm) */
  current_angle_height: number;

  /** Support level distance that must be achieved (mm) */
  required_support_level: number;

  /** Slab thickness (mm) */
  slab_thickness: number;

  /** Bracket type (Standard or Inverted) */
  bracket_type: BracketType;

  /** Angle orientation (Standard or Inverted) */
  angle_orientation: AngleOrientation;

  /** Fixing position from top of slab (mm) */
  fixing_position: number;

  /** Height above SSL component of bracket (mm) - for inverted brackets only */
  height_above_ssl?: number;
}

/**
 * Calculates bracket extension limits using top of slab as reference point
 * Converts position limits to rise-to-bolts limits based on fixing position
 * Rise-to-bolts is the distance from bracket bottom to fixing point
 *
 * @param inputs Extension calculation inputs
 * @returns Maximum rise-to-bolts and any bracket reduction needed
 */
export function calculateBracketExtensionLimit(inputs: AngleExtensionInputs): {
  max_rise_to_bolts: number;
  bracket_reduction: number;
  limited_bracket_height?: number; // Keep for backward compatibility
} {
  const {
    original_bracket_height,
    max_allowable_bracket_extension,
    slab_thickness,
    fixing_position,
    bracket_type,
    required_support_level
  } = inputs;

  // If no extension limit is set, return no limits
  if (max_allowable_bracket_extension === null) {
    return {
      max_rise_to_bolts: Infinity,
      bracket_reduction: 0,
      limited_bracket_height: original_bracket_height // For backward compatibility
    };
  }

  // Convert position limit to maximum rise-to-bolts
  // Position is relative to top of slab (0 = top of slab, negative = below slab, positive = above slab)
  // Rise-to-bolts is the distance from bracket bottom to fixing point

  let max_rise_to_bolts_raw: number;

  if (max_allowable_bracket_extension >= 0) {
    // Exclusion zone at or above slab top - bracket bottom cannot go above this level
    // This is a direct bracket height restriction, not a rise-to-bolts calculation
    // The bracket bottom position relative to top of slab cannot exceed max_allowable_bracket_extension

    // For inverted brackets: bracket bottom = slab_top - (fixing_position - rise_to_bolts)
    // So: rise_to_bolts = fixing_position + max_allowable_bracket_extension
    max_rise_to_bolts_raw = fixing_position + max_allowable_bracket_extension;

    console.log(`🔧 BRACKET LIMIT - Slab Top Restriction Mode:`, {
      max_allowable_bracket_extension: `${max_allowable_bracket_extension}mm (at/above slab top)`,
      fixing_position: `${fixing_position}mm from slab top`,
      max_rise_to_bolts_calculated: `${max_rise_to_bolts_raw}mm`,
      explanation: `Bracket bottom must not exceed ${max_allowable_bracket_extension}mm from slab top`
    });
  } else {
    // Exclusion zone below slab top (negative values) - use original rise-to-bolts approach
    const fixing_position_from_top_of_slab = -fixing_position; // Convert fixing position to same coordinate system
    max_rise_to_bolts_raw = Math.abs(max_allowable_bracket_extension - fixing_position_from_top_of_slab);

    console.log(`🔧 BRACKET LIMIT - Below Slab Mode:`, {
      max_allowable_bracket_extension: `${max_allowable_bracket_extension}mm below slab`,
      fixing_position_from_top_of_slab: `${fixing_position_from_top_of_slab}mm`,
      max_rise_to_bolts_calculated: `${max_rise_to_bolts_raw}mm`
    });
  }

  console.log(`🔧 BRACKET LIMIT - Final Summary:`, {
    max_allowable_bracket_extension,
    fixing_position,
    max_rise_to_bolts_raw,
    original_bracket_height,
    bracket_type,
    required_support_level
  });

  // Calculate bracket reduction based on bracket type
  let bracket_reduction = 0;
  let limited_bracket_height = original_bracket_height;

  if (bracket_type === 'Standard') {
    // For standard brackets, check if the bracket bottom would exceed the position limit
    // Standard bracket calculation: |support_level| - fixing_position + 40 (Y constant)
    // The bracket bottom is at: fixing_position + bracket_height - 40 (from top of slab)
    const Y_CONSTANT = 40; // Distance from bracket top to fixing center
    const bracket_bottom_position = fixing_position + original_bracket_height - Y_CONSTANT;

    console.log(`🔧 STANDARD BRACKET POSITION CHECK:`, {
      Y_CONSTANT,
      fixing_position,
      original_bracket_height,
      bracket_bottom_position,
      max_allowable_bracket_extension,
      position_limit_exceeded: bracket_bottom_position > Math.abs(max_allowable_bracket_extension)
    });

    // Check if bracket bottom exceeds the position limit
    if (bracket_bottom_position > Math.abs(max_allowable_bracket_extension)) {
      // Reduce bracket height to stay within position limit
      const max_allowed_bracket_bottom = Math.abs(max_allowable_bracket_extension);
      const limited_bracket_height_raw = max_allowed_bracket_bottom - fixing_position + Y_CONSTANT;

      limited_bracket_height = Math.max(0, limited_bracket_height_raw);
      bracket_reduction = original_bracket_height - limited_bracket_height;

      console.log(`🔧 STANDARD BRACKET REDUCTION APPLIED:`, {
        max_allowed_bracket_bottom,
        limited_bracket_height,
        bracket_reduction
      });
    }
  } else if (bracket_type === 'Inverted') {
    // For inverted brackets, handle exclusion zones based on bracket geometry components
    if (max_allowable_bracket_extension >= 0) {
      // Exclusion zone at or above slab top - constrain height_above_ssl component
      // For inverted brackets: bracket_top_position = -height_above_ssl (relative to slab top)
      // Constraint: bracket_top_position >= -max_allowable_bracket_extension
      // Therefore: -height_above_ssl >= -max_allowable_bracket_extension
      // Which means: height_above_ssl <= max_allowable_bracket_extension

      const max_allowed_height_above_ssl = max_allowable_bracket_extension;
      const current_height_above_ssl = inputs.height_above_ssl || 0;

      console.log(`🔧 INVERTED BRACKET - SLAB TOP RESTRICTION (HEIGHT_ABOVE_SSL):`, {
        max_allowable_bracket_extension,
        max_allowed_height_above_ssl,
        current_height_above_ssl,
        constraint_violated: current_height_above_ssl > max_allowed_height_above_ssl
      });

      if (current_height_above_ssl > max_allowed_height_above_ssl) {
        // Calculate the reduction needed in height_above_ssl component
        const height_above_ssl_reduction = current_height_above_ssl - max_allowed_height_above_ssl;

        // This translates to bracket reduction since height_above_ssl is part of total bracket height
        bracket_reduction = height_above_ssl_reduction;
        limited_bracket_height = original_bracket_height - bracket_reduction;

        console.log(`🔧 INVERTED BRACKET - HEIGHT_ABOVE_SSL REDUCTION:`, {
          height_above_ssl_reduction,
          bracket_reduction,
          original_bracket_height,
          limited_bracket_height,
          explanation: `Height above SSL reduced from ${current_height_above_ssl}mm to ${max_allowed_height_above_ssl}mm`
        });
      }
    } else {
      // Exclusion zone below slab top (negative values) - use original rise-to-bolts approach
      const bottom_critical_edge = 150; // Standard bottom critical edge for inverted brackets

      // For inverted brackets, if bracket height exceeds what can fit in the slab,
      // the excess becomes extension below slab
      const height_within_slab = fixing_position + bottom_critical_edge; // Total height that fits in slab
      const extension_below_slab = Math.max(0, original_bracket_height - height_within_slab);
      const required_rise_to_bolts = bottom_critical_edge + extension_below_slab;

      console.log(`🔧 INVERTED BRACKET POSITION CHECK:`, {
        bottom_critical_edge,
        height_within_slab,
        extension_below_slab,
        required_rise_to_bolts,
        max_rise_to_bolts_raw,
        position_limit_exceeded: required_rise_to_bolts > max_rise_to_bolts_raw
      });

      // Check if required rise-to-bolts exceeds the position limit
      if (required_rise_to_bolts > max_rise_to_bolts_raw) {
        // Limit the rise-to-bolts and calculate reduced extension
        const limited_extension_below_slab = Math.max(0, max_rise_to_bolts_raw - bottom_critical_edge);
        const limited_bracket_height_raw = height_within_slab + limited_extension_below_slab;

        limited_bracket_height = limited_bracket_height_raw;
        bracket_reduction = original_bracket_height - limited_bracket_height;

        console.log(`🔧 INVERTED BRACKET REDUCTION APPLIED:`, {
          limited_extension_below_slab,
          limited_bracket_height,
          bracket_reduction
        });
      }
    }
  }

  console.log(`✅ Maximum rise-to-bolts calculated: ${max_rise_to_bolts_raw}mm`);
  console.log(`📝 Bracket reduction for ${bracket_type} bracket: ${bracket_reduction}mm`);

  return {
    max_rise_to_bolts: roundToTwelveDecimals(max_rise_to_bolts_raw),
    bracket_reduction: roundToTwelveDecimals(bracket_reduction),
    limited_bracket_height: roundToTwelveDecimals(limited_bracket_height)
  };
}

/**
 * Calculates required angle extension to compensate for limited bracket height
 *
 * @param inputs Extension calculation inputs
 * @param bracket_reduction Amount bracket was shortened (mm)
 * @returns Required angle extension amount
 */
export function calculateRequiredAngleExtension(
  inputs: AngleExtensionInputs,
  bracket_reduction: number
): number {
  const { bracket_type, angle_orientation } = inputs;

  // If no bracket reduction, no angle extension needed
  if (bracket_reduction <= 0) {
    return 0;
  }

  // For both standard and inverted brackets, the angle extension
  // directly compensates for the bracket reduction on a 1:1 basis
  // The angle extends in the same direction the bracket was shortened

  return roundToTwelveDecimals(bracket_reduction);
}

/**
 * Validates that the extended angle height is within manufacturing limits
 *
 * @param original_angle_height Original angle vertical leg height (mm)
 * @param angle_extension Amount of extension (mm)
 * @returns True if within limits, false otherwise
 */
export function validateAngleExtensionLimits(
  original_angle_height: number,
  angle_extension: number
): { valid: boolean; max_angle_height: number; resulting_height: number } {
  const MAX_ANGLE_HEIGHT = 400; // mm - manufacturing limit
  const resulting_height = original_angle_height + angle_extension;

  return {
    valid: resulting_height <= MAX_ANGLE_HEIGHT,
    max_angle_height: MAX_ANGLE_HEIGHT,
    resulting_height: roundToTwelveDecimals(resulting_height)
  };
}

/**
 * Validates if a fixing position is compatible with exclusion zone and minimum bracket height requirements
 *
 * This function checks if applying an exclusion zone constraint would reduce the bracket below
 * its structural minimum height, which would make the design invalid.
 *
 * @param params Validation parameters
 * @returns Validation result with details
 */
export function validateFixingPositionWithExclusionZone(params: {
  fixing_position: number;
  support_level: number;
  slab_thickness: number;
  max_allowable_bracket_extension: number | null;
  bracket_type: BracketType;
  angle_orientation?: AngleOrientation;
  vertical_leg?: number;
}): {
  isValid: boolean;
  original_bracket_height: number;
  limited_bracket_height: number;
  minimum_required_height: number;
  bracket_reduction: number;
  reason?: string;
} {
  const {
    fixing_position,
    support_level,
    slab_thickness,
    max_allowable_bracket_extension,
    bracket_type,
    angle_orientation = 'Standard',
    vertical_leg = 60
  } = params;

  // Import minimum height constants
  const BRACKET_ANGLE_CONSTANTS_LOCAL = {
    STANDARD_BRACKET_MIN_HEIGHT: 150,
    INVERTED_BRACKET_MIN_HEIGHT: 175
  };

  const minimum_required_height = bracket_type === 'Standard'
    ? BRACKET_ANGLE_CONSTANTS_LOCAL.STANDARD_BRACKET_MIN_HEIGHT
    : BRACKET_ANGLE_CONSTANTS_LOCAL.INVERTED_BRACKET_MIN_HEIGHT;

  // Calculate original bracket height based on bracket type
  let original_bracket_height: number;

  if (bracket_type === 'Standard') {
    // Standard bracket calculation: |support_level| - fixing_position + 40mm (Y constant)
    const Y_CONSTANT = 40;

    // Check if using inverted angle (affects geometry)
    if (angle_orientation === 'Inverted') {
      // Standard bracket with inverted angle geometry
      const fixing_point = -fixing_position;
      const bracket_top = fixing_point + Y_CONSTANT;
      const angle_bottom = support_level - vertical_leg;
      original_bracket_height = Math.abs(bracket_top - angle_bottom);
    } else {
      // Standard bracket with standard angle
      original_bracket_height = Math.abs(support_level) - fixing_position + Y_CONSTANT;
    }

    // Apply minimum
    original_bracket_height = Math.max(original_bracket_height, minimum_required_height);

  } else {
    // Inverted bracket - simplified calculation for validation
    // Actual height depends on Dim D, but for validation we use a representative value
    const min_dim_d = 135;
    const bracket_top_from_ssl = support_level >= 0 ? support_level : support_level;
    const bracket_bottom_from_ssl = -(fixing_position + min_dim_d);
    original_bracket_height = Math.abs(bracket_top_from_ssl - bracket_bottom_from_ssl);

    // Apply minimum
    original_bracket_height = Math.max(original_bracket_height, minimum_required_height);
  }

  // If no exclusion zone, always valid
  if (max_allowable_bracket_extension === null || max_allowable_bracket_extension === undefined) {
    return {
      isValid: true,
      original_bracket_height,
      limited_bracket_height: original_bracket_height,
      minimum_required_height,
      bracket_reduction: 0
    };
  }

  // Calculate how exclusion zone would limit the bracket
  let bracket_reduction = 0;
  let limited_bracket_height = original_bracket_height;

  if (bracket_type === 'Standard') {
    // For standard brackets, check if bracket bottom would exceed exclusion zone
    const Y_CONSTANT = 40;
    const bracket_bottom_position = fixing_position + original_bracket_height - Y_CONSTANT;

    if (bracket_bottom_position > Math.abs(max_allowable_bracket_extension)) {
      const max_allowed_bracket_bottom = Math.abs(max_allowable_bracket_extension);
      const limited_height_raw = max_allowed_bracket_bottom - fixing_position + Y_CONSTANT;
      limited_bracket_height = Math.max(0, limited_height_raw);
      bracket_reduction = original_bracket_height - limited_bracket_height;
    }
  }
  // Note: Inverted bracket validation is more complex due to Dim D variations,
  // so we primarily focus on standard brackets for fixing position filtering

  // Check if limited height violates minimum
  const violates_minimum = limited_bracket_height < minimum_required_height;

  console.log(`🔍 VALIDATION: Fixing ${fixing_position}mm, ${bracket_type} bracket:`, {
    original_bracket_height,
    limited_bracket_height,
    minimum_required_height,
    bracket_reduction,
    exclusion_zone: max_allowable_bracket_extension,
    violates_minimum
  });

  if (violates_minimum) {
    return {
      isValid: false,
      original_bracket_height,
      limited_bracket_height,
      minimum_required_height,
      bracket_reduction,
      reason: `Exclusion zone would reduce bracket to ${limited_bracket_height}mm, below minimum ${minimum_required_height}mm`
    };
  }

  return {
    isValid: true,
    original_bracket_height,
    limited_bracket_height,
    minimum_required_height,
    bracket_reduction
  };
}

/**
 * Main angle extension calculation function that combines all logic
 * Now includes automatic angle orientation flipping for inverted brackets
 *
 * @param inputs Extension calculation inputs
 * @returns Complete angle extension result
 */
export function calculateAngleExtension(inputs: AngleExtensionInputs): AngleExtensionResult {
  const {
    original_bracket_height,
    current_angle_height,
    max_allowable_bracket_extension,
    bracket_type,
    angle_orientation
  } = inputs;

  // Step 1: Calculate bracket extension limit
  const { limited_bracket_height, bracket_reduction } = calculateBracketExtensionLimit(inputs);

  // Step 2: Calculate required angle extension (before orientation optimization)
  const initial_angle_extension = calculateRequiredAngleExtension(inputs, bracket_reduction);

  // Step 3: Determine optimal angle orientation (may flip if needed)
  const orientationResult = calculateOptimalAngleOrientation(
    bracket_type,
    angle_orientation,
    initial_angle_extension
  );

  // Step 4: Recalculate extension with final orientation
  // Note: If orientation was flipped, the angle extension requirement may change
  // For inverted brackets flipped to inverted angles, extension is still needed
  let final_angle_extension = initial_angle_extension;

  // If we flipped the orientation, the extension calculation remains the same
  // The geometric requirement doesn't change, just the direction of extension
  if (orientationResult.orientation_flipped) {
    console.log(`🔄 RECALCULATING EXTENSION AFTER FLIP:`, {
      original_orientation: angle_orientation,
      final_orientation: orientationResult.final_orientation,
      extension_remains: final_angle_extension
    });
  }

  // Step 5: Calculate extended angle height
  const extended_angle_height = roundToTwelveDecimals(current_angle_height + final_angle_extension);

  // Step 6: Validate extension limits
  const validation = validateAngleExtensionLimits(current_angle_height, final_angle_extension);

  if (!validation.valid) {
    throw new Error(
      `Angle extension would exceed manufacturing limits. ` +
      `Resulting height: ${validation.resulting_height}mm, ` +
      `Maximum allowed: ${validation.max_angle_height}mm`
    );
  }

  return {
    extension_applied: bracket_reduction > 0,
    original_bracket_height: roundToTwelveDecimals(original_bracket_height),
    limited_bracket_height: roundToTwelveDecimals(limited_bracket_height),
    bracket_reduction: roundToTwelveDecimals(bracket_reduction),
    original_angle_height: roundToTwelveDecimals(current_angle_height),
    extended_angle_height: roundToTwelveDecimals(extended_angle_height),
    angle_extension: roundToTwelveDecimals(final_angle_extension),
    max_extension_limit: max_allowable_bracket_extension || 0,
    // New orientation flipping fields
    angle_orientation_flipped: orientationResult.orientation_flipped,
    original_angle_orientation: angle_orientation,
    final_angle_orientation: orientationResult.final_orientation,
    flip_reason: orientationResult.flip_reason
  };
}

/**
 * Helper function to determine if angle extension should be applied
 * based on user settings and design requirements
 *
 * @param enable_angle_extension User toggle for angle extension feature
 * @param max_allowable_bracket_extension User-defined extension limit
 * @returns True if angle extension logic should be applied
 */
export function shouldApplyAngleExtension(
  enable_angle_extension: boolean | undefined,
  max_allowable_bracket_extension: number | null | undefined
): boolean {
  console.log(`🔧 SHOULD APPLY ANGLE EXTENSION CHECK:`, {
    enable_angle_extension,
    max_allowable_bracket_extension,
    result: enable_angle_extension === true &&
            max_allowable_bracket_extension !== null &&
            max_allowable_bracket_extension !== undefined
  });

  return (
    enable_angle_extension === true &&
    max_allowable_bracket_extension !== null &&
    max_allowable_bracket_extension !== undefined
  );
}