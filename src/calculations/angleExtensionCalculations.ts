import { roundToTwelveDecimals } from '../utils/precision';
import type { AngleExtensionResult, BracketType, AngleOrientation } from '../types/bracketAngleTypes';

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
  //
  // For negative positions (below slab): max rise-to-bolts = |position - fixing_position|
  // For positive positions (above slab): bracket bottom would be above fixing point (unusual case)

  // Calculate the maximum rise-to-bolts from fixing position to position limit
  const fixing_position_from_top_of_slab = -fixing_position; // Convert fixing position to same coordinate system
  const max_rise_to_bolts_raw = Math.abs(max_allowable_bracket_extension - fixing_position_from_top_of_slab);

  console.log(`🔧 BRACKET LIMIT DEBUG - Rise-to-Bolts Approach:`, {
    max_allowable_bracket_extension,
    fixing_position,
    fixing_position_from_top_of_slab,
    max_rise_to_bolts_raw,
    original_bracket_height,
    bracket_type,
    required_support_level
  });

  // For standard brackets, calculate if the bracket needs to be reduced
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
  }

  console.log(`✅ Maximum rise-to-bolts calculated: ${max_rise_to_bolts_raw}mm`);
  console.log(`📝 Bracket reduction for standard bracket: ${bracket_reduction}mm`);

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
 * Main angle extension calculation function that combines all logic
 *
 * @param inputs Extension calculation inputs
 * @returns Complete angle extension result
 */
export function calculateAngleExtension(inputs: AngleExtensionInputs): AngleExtensionResult {
  const {
    original_bracket_height,
    current_angle_height,
    max_allowable_bracket_extension
  } = inputs;

  // Step 1: Calculate bracket extension limit
  const { limited_bracket_height, bracket_reduction } = calculateBracketExtensionLimit(inputs);

  // Step 2: Calculate required angle extension
  const angle_extension = calculateRequiredAngleExtension(inputs, bracket_reduction);

  // Step 3: Calculate extended angle height
  const extended_angle_height = roundToTwelveDecimals(current_angle_height + angle_extension);

  // Step 4: Validate extension limits
  const validation = validateAngleExtensionLimits(current_angle_height, angle_extension);

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
    angle_extension: roundToTwelveDecimals(angle_extension),
    max_extension_limit: max_allowable_bracket_extension || 0
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