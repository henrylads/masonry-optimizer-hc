import type { BracketType, AngleOrientation } from '../types/bracketAngleTypes';

/**
 * Determines if angle orientation should be flipped from Standard to Inverted
 * for inverted brackets when angle extension is required.
 *
 * Rule: Inverted brackets with standard angles cannot extend the angle beyond
 * the default 60mm height because the fixing point won't align with the bracket.
 * In this case, we need to flip to an inverted angle orientation.
 *
 * @param bracket_type - The bracket type (Standard or Inverted)
 * @param angle_orientation - Current angle orientation
 * @param required_angle_extension - Amount of angle extension needed (mm)
 * @returns True if orientation should be flipped
 */
export function shouldFlipAngleOrientation(
  bracket_type: BracketType,
  angle_orientation: AngleOrientation,
  required_angle_extension: number
): boolean {
  // Only flip for inverted brackets with standard angles when extension is needed
  const needsFlip = bracket_type === 'Inverted' &&
                   angle_orientation === 'Standard' &&
                   required_angle_extension > 0;

  console.log(`🔄 ANGLE ORIENTATION FLIP CHECK:`, {
    bracket_type,
    angle_orientation,
    required_angle_extension,
    needsFlip,
    reason: needsFlip ? 'Inverted bracket + Standard angle + Extension > 0' : 'No flip needed'
  });

  return needsFlip;
}

/**
 * Calculates the optimal angle orientation for a given bracket configuration.
 * This function handles the automatic flipping logic for inverted brackets.
 *
 * @param bracket_type - The bracket type
 * @param initial_angle_orientation - Initially requested angle orientation
 * @param required_angle_extension - Amount of angle extension required
 * @returns Object with final orientation and flip information
 */
export function calculateOptimalAngleOrientation(
  bracket_type: BracketType,
  initial_angle_orientation: AngleOrientation,
  required_angle_extension: number
): {
  final_orientation: AngleOrientation;
  orientation_flipped: boolean;
  flip_reason?: string;
} {
  const shouldFlip = shouldFlipAngleOrientation(
    bracket_type,
    initial_angle_orientation,
    required_angle_extension
  );

  if (shouldFlip) {
    const flip_reason = `Inverted bracket with standard angle requires ${required_angle_extension}mm extension. ` +
                       `Standard angles cannot extend beyond 60mm due to fixing point misalignment. ` +
                       `Automatically flipped to inverted angle orientation for upward extension.`;

    console.log(`🔄 ANGLE ORIENTATION FLIPPED:`, {
      from: initial_angle_orientation,
      to: 'Inverted',
      reason: flip_reason
    });

    return {
      final_orientation: 'Inverted',
      orientation_flipped: true,
      flip_reason
    };
  }

  return {
    final_orientation: initial_angle_orientation,
    orientation_flipped: false
  };
}

/**
 * Validates that the angle orientation combination is geometrically valid
 *
 * @param bracket_type - The bracket type
 * @param angle_orientation - The angle orientation
 * @param angle_extension - Amount of extension (if any)
 * @returns Validation result with details
 */
export function validateAngleOrientationCombination(
  bracket_type: BracketType,
  angle_orientation: AngleOrientation,
  angle_extension: number
): {
  valid: boolean;
  warnings: string[];
  recommendations: string[];
} {
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Check for problematic combination: Inverted bracket + Standard angle + Extension
  if (bracket_type === 'Inverted' &&
      angle_orientation === 'Standard' &&
      angle_extension > 0) {
    warnings.push(
      `Inverted bracket with standard angle requires ${angle_extension}mm extension. ` +
      `This may cause fixing point misalignment.`
    );
    recommendations.push(
      `Consider using inverted angle orientation for upward extension capability.`
    );
  }

  // Check for valid combinations
  const validCombinations = [
    { bracket: 'Standard', angle: 'Standard' },
    { bracket: 'Standard', angle: 'Inverted' },
    { bracket: 'Inverted', angle: 'Standard' }, // Valid only without extension
    { bracket: 'Inverted', angle: 'Inverted' }
  ];

  const isKnownCombination = validCombinations.some(combo =>
    combo.bracket === bracket_type && combo.angle === angle_orientation
  );

  if (!isKnownCombination) {
    warnings.push(`Unknown bracket-angle combination: ${bracket_type} bracket with ${angle_orientation} angle`);
  }

  return {
    valid: warnings.length === 0,
    warnings,
    recommendations
  };
}