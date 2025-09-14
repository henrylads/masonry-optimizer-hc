import { roundToTwelveDecimals } from '@/utils/precision';
import type {
  BracketType,
  AngleOrientation,
  BracketAngleCombination,
  BracketHeightCalculationParams,
  RiseToBoltsCalculationParams,
  FixingOptimizationConfig
} from '@/types/bracketAngleTypes';

/**
 * Constants for bracket and angle calculations
 */
export const BRACKET_ANGLE_CONSTANTS = {
  /** Baseline fixing point distance from SSL for bracket type determination */
  BASELINE_FIXING_POINT_FROM_SSL: -75, // mm
  /** Default fixing position from top of slab */
  DEFAULT_FIXING_POSITION: 75, // mm (equivalent to -75mm from SSL)
  /** Distance from bracket top to fixing center */
  DISTANCE_FROM_TOP_TO_FIXING: 40, // mm
  /** Worst case adjustment for rise to bolts */
  WORST_CASE_ADJUSTMENT: 15, // mm
  
  // Backward compatibility
  /** @deprecated Use BASELINE_FIXING_POINT_FROM_SSL instead */
  FIXING_POINT_FROM_SSL: -75, // mm
} as const;

/**
 * Converts fixing position from top of slab to SSL-relative coordinates
 * @param fixingPositionFromTop Fixing position measured from top of slab (positive value)
 * @returns Fixing position in SSL coordinates (negative value)
 */
export function fixingPositionToSSL(fixingPositionFromTop: number): number {
  return -fixingPositionFromTop;
}

/**
 * Converts SSL-relative fixing position to top-of-slab coordinates
 * @param fixingPositionFromSSL Fixing position in SSL coordinates (negative value)
 * @returns Fixing position measured from top of slab (positive value)
 */
export function fixingPositionFromSSL(fixingPositionFromSSL: number): number {
  return -fixingPositionFromSSL;
}

/**
 * Gets the fixing position to use for bracket type determination
 * Always uses the baseline fixing position for consistent type selection
 * @returns Baseline fixing position in SSL coordinates
 */
export function getFixingPositionForTypeSelection(): number {
  // Always use baseline for bracket type determination to maintain consistency
  return BRACKET_ANGLE_CONSTANTS.BASELINE_FIXING_POINT_FROM_SSL;
}

/**
 * Gets the fixing position to use for calculations
 * @param dynamicFixingPosition Optional dynamic fixing position from top of slab
 * @returns Fixing position in SSL coordinates
 */
export function getFixingPositionForCalculations(dynamicFixingPosition?: number): number {
  const fixingFromTop = dynamicFixingPosition ?? BRACKET_ANGLE_CONSTANTS.DEFAULT_FIXING_POSITION;
  return fixingPositionToSSL(fixingFromTop);
}

/**
 * Validates that a fixing position is within acceptable limits for a given slab thickness
 * @param fixingPosition Fixing position from top of slab (mm)
 * @param slabThickness Slab thickness (mm)
 * @param bottomCriticalEdgeDistance Actual bottom critical edge distance from channel specs (mm)
 * @returns Validation result with success flag and error message if applicable
 */
export function validateFixingPosition(
  fixingPosition: number,
  slabThickness: number,
  bottomCriticalEdgeDistance: number
): { isValid: boolean; error?: string } {
  // Check if fixing position is positive
  if (fixingPosition <= 0) {
    return {
      isValid: false,
      error: `Fixing position must be positive, got ${fixingPosition}mm`
    };
  }

  // Check if fixing position exceeds slab thickness
  if (fixingPosition >= slabThickness) {
    return {
      isValid: false,
      error: `Fixing position (${fixingPosition}mm) cannot exceed slab thickness (${slabThickness}mm)`
    };
  }

  // Check bottom critical edge distance constraint (from channel specs)
  const bottomClearance = slabThickness - fixingPosition;
  if (bottomClearance < bottomCriticalEdgeDistance) {
    return {
      isValid: false,
      error: `Insufficient bottom clearance: ${bottomClearance}mm < ${bottomCriticalEdgeDistance}mm required (from channel specs)`
    };
  }

  return { isValid: true };
}

/**
 * Calculates the maximum allowable fixing position for a given slab thickness
 * @param slabThickness Slab thickness (mm)
 * @param bottomCriticalEdgeDistance Bottom critical edge distance from channel specs (mm)
 * @param performanceLimit Optional performance limit to reduce computation (default: 100mm from bottom)
 * @returns Maximum fixing position from top of slab (mm)
 */
export function getMaximumFixingPosition(
  slabThickness: number,
  bottomCriticalEdgeDistance: number,
  performanceLimit: number = 100
): number {
  // Calculate maximum based on bottom critical edge distance requirement
  const maxFromBottomCriticalEdge = slabThickness - bottomCriticalEdgeDistance;
  
  // Apply performance limit to reduce computation time
  const maxFromPerformanceLimit = slabThickness - performanceLimit;
  
  // Use the more restrictive of the two limits
  const restrictiveMax = Math.min(maxFromBottomCriticalEdge, maxFromPerformanceLimit);

  // Cannot be less than the default fixing position
  const absoluteMax = Math.max(restrictiveMax, BRACKET_ANGLE_CONSTANTS.DEFAULT_FIXING_POSITION);
  
  return absoluteMax;
}

/**
 * Comprehensive validation of a fixing position configuration
 * @param fixingPosition Fixing position from top of slab (mm)
 * @param slabThickness Slab thickness (mm)
 * @param bracketHeight Bracket height (mm)
 * @param bottomCriticalEdgeDistance Bottom critical edge distance from channel specs (mm)
 * @param minRiseToBolts Minimum required rise to bolts (mm) - default 95mm
 * @returns Complete validation result
 */
export function validateFixingConfiguration(
  fixingPosition: number,
  slabThickness: number,
  bracketHeight: number,
  bottomCriticalEdgeDistance: number,
  minRiseToBolts: number = 95
): {
  isValid: boolean;
  errors: string[];
  riseToBolts?: number;
  bottomClearance?: number;
} {
  const errors: string[] = [];
  let riseToBolts: number | undefined;
  let bottomClearance: number | undefined;

  // Validate basic fixing position constraints using actual channel specs
  const basicValidation = validateFixingPosition(fixingPosition, slabThickness, bottomCriticalEdgeDistance);
  if (!basicValidation.isValid && basicValidation.error) {
    errors.push(basicValidation.error);
  } else {
    bottomClearance = slabThickness - fixingPosition;
  }

  // Validate rise to bolts if basic validation passed
  if (basicValidation.isValid) {
    const distanceFromTopToFixing = BRACKET_ANGLE_CONSTANTS.DISTANCE_FROM_TOP_TO_FIXING;
    const worstCaseAdjustment = BRACKET_ANGLE_CONSTANTS.WORST_CASE_ADJUSTMENT;
    
    riseToBolts = bracketHeight - (distanceFromTopToFixing + worstCaseAdjustment);
    
    if (riseToBolts < minRiseToBolts) {
      errors.push(`Insufficient rise to bolts: ${riseToBolts.toFixed(2)}mm < ${minRiseToBolts}mm required`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    riseToBolts,
    bottomClearance
  };
}

/**
 * Determines bracket type based on BSL (Brick Support Level) relative to fixing point
 * 
 * @param supportLevel BSL measured as distance from SSL (can be positive or negative)
 * @returns BracketType - Standard when BSL ≤ -75mm, Inverted when BSL > -75mm
 */
export function determineBracketType(supportLevel: number): BracketType {
  // Standard Bracket: Used when BSL ≤ -75mm (BSL is at or below the fixing point)
  // Inverted Bracket: Used when BSL > -75mm (BSL is above the fixing point)
  // Always use baseline fixing position for consistent bracket type determination
  return supportLevel <= BRACKET_ANGLE_CONSTANTS.BASELINE_FIXING_POINT_FROM_SSL ? 'Standard' : 'Inverted';
}

/**
 * Returns valid angle orientations for a given BSL value
 * Based on the selection table from project overview
 * 
 * @param supportLevel BSL measured as distance from SSL
 * @returns Array of valid AngleOrientation options
 */
export function getValidAngleOrientations(supportLevel: number): AngleOrientation[] {
  // Selection table logic:
  // ≥ 0mm: Both (Standard, Inverted)
  // -25mm to -50mm: Standard only
  // -75mm to -135mm: Inverted only
  // -150mm to -175mm: Both (Standard, Inverted)
  // < -175mm: Both (Standard, Inverted)
  
  if (supportLevel >= 0) {
    return ['Standard', 'Inverted']; // Try both
  } else if (supportLevel >= -50 && supportLevel <= -25) {
    return ['Standard']; // Standard only
  } else if (supportLevel >= -135 && supportLevel <= -75) {
    return ['Inverted']; // Inverted only
  } else if (supportLevel >= -175 && supportLevel <= -150) {
    return ['Standard', 'Inverted']; // Try both
  } else { // < -175mm
    return ['Standard', 'Inverted']; // Try both
  }
}

/**
 * Returns all valid bracket type and angle orientation combinations for a BSL
 * 
 * @param supportLevel BSL measured as distance from SSL
 * @returns Array of valid BracketAngleCombination options
 */
export function getValidBracketAngleCombinations(supportLevel: number): BracketAngleCombination[] {
  const bracketType = determineBracketType(supportLevel);
  const validAngleOrientations = getValidAngleOrientations(supportLevel);
  
  return validAngleOrientations.map(angleOrientation => ({
    bracket_type: bracketType,
    angle_orientation: angleOrientation
  }));
}

/**
 * Calculates bracket height considering bracket type, angle orientation, and vertical leg size
 * 
 * Base calculation: Math.abs(support_level) - top_critical_edge_distance + distance_from_top_to_fixing
 * 
 * Adjustments:
 * - Standard bracket + Inverted angle: Add vertical leg height to bracket height
 * - Inverted bracket + Standard angle: Add vertical leg height to bracket height
 * - Standard bracket + Standard angle: No adjustment
 * - Inverted bracket + Inverted angle: No adjustment
 * 
 * @param params Bracket height calculation parameters
 * @returns Calculated bracket height in mm (rounded to 12 decimal places)
 */
export function calculateBracketHeight(params: BracketHeightCalculationParams): number {
  const {
    support_level,
    top_critical_edge_distance,
    distance_from_top_to_fixing,
    vertical_leg,
    bracket_type,
    angle_orientation
  } = params;
  
  // For inverted brackets with support levels that would result in insufficient bracket height
  if (bracket_type === 'Inverted' && support_level > BRACKET_ANGLE_CONSTANTS.BASELINE_FIXING_POINT_FROM_SSL) {
    // Calculate what the standard calculation would give us
    const standardHeight = Math.abs(support_level) - top_critical_edge_distance + distance_from_top_to_fixing;
    
    // Check if this would result in negative or very small rise to bolts
    const worstCaseAdjustment = 15; // mm
    const potentialRiseToBolts = standardHeight - (distance_from_top_to_fixing + worstCaseAdjustment);
    
    // If rise to bolts would be negative or too small, use adjusted calculation
    if (potentialRiseToBolts < 10) { // Minimum 10mm rise to bolts
      // For inverted brackets close to SSL or with positive support levels, ensure minimum viable bracket height
      // Base height should ensure adequate rise to bolts
      const minRequiredHeight = distance_from_top_to_fixing + worstCaseAdjustment + 10; // 10mm minimum rise
      const heightFromSupportToFixing = Math.abs(support_level) + top_critical_edge_distance;
      const baseHeight = Math.max(minRequiredHeight, heightFromSupportToFixing + distance_from_top_to_fixing);
      
      // Apply adjustments based on angle orientation
      let adjustment = 0;
      if (angle_orientation === 'Standard') {
        adjustment = vertical_leg;
      }
      
      const finalHeight = baseHeight + adjustment;
      console.log(`  Inverted bracket special case: support=${support_level}, standard=${standardHeight}, potential_rise=${potentialRiseToBolts}, base=${baseHeight}, adj=${adjustment}, final=${finalHeight}`);
      return roundToTwelveDecimals(finalHeight);
    }
  }
  
  // Standard calculation for all other cases
  const baseHeight = Math.abs(support_level) - top_critical_edge_distance + distance_from_top_to_fixing;
  
  // Apply adjustments based on bracket type and angle orientation combination
  let adjustment = 0;
  
  if (
    (bracket_type === 'Standard' && angle_orientation === 'Inverted') ||
    (bracket_type === 'Inverted' && angle_orientation === 'Standard')
  ) {
    adjustment = vertical_leg;
  }
  // No adjustment needed for:
  // - Standard bracket + Standard angle
  // - Inverted bracket + Inverted angle
  
  const finalHeight = baseHeight + adjustment;
  
  return roundToTwelveDecimals(finalHeight);
}

/**
 * Calculates rise to bolts with proper limiting logic
 * 
 * Rise to bolts = bracket_height - (distance_from_top_to_fixing + worst_case_adjustment)
 * 
 * If the bracket projects below the slab, the rise to bolts is limited to the bottom critical edge distance.
 * When fixing_position is provided, it's used instead of the default -75mm for calculations.
 * 
 * @param params Rise to bolts calculation parameters
 * @returns Calculated rise to bolts in mm (rounded to 12 decimal places)
 */
export function calculateRiseToBolts(params: RiseToBoltsCalculationParams): number {
  const {
    bracket_height,
    distance_from_top_to_fixing,
    worst_case_adjustment,
    bottom_critical_edge_distance,
    support_level,
    slab_thickness,
    fixing_position = BRACKET_ANGLE_CONSTANTS.DEFAULT_FIXING_POSITION // Default fixing position from top of slab
  } = params;
  
  // Base calculation
  const baseRiseToBolts = bracket_height - (distance_from_top_to_fixing + worst_case_adjustment);
  
  // Check if bracket projects below the slab using dynamic fixing position
  // fixing_position is measured from top of slab, so convert to SSL-relative measurement
  const fixingPositionFromSSL = -fixing_position; // Convert to SSL coordinates (negative for below SSL)
  const projectionBelowSlab = Math.abs(support_level) > (slab_thickness + fixingPositionFromSSL);
  
  if (projectionBelowSlab) {
    // Limit to bottom critical edge distance minus worst case adjustment
    // This accounts for the bracket potentially being fixed at the bottom of the 30mm slot
    return roundToTwelveDecimals(Math.min(baseRiseToBolts, bottom_critical_edge_distance - worst_case_adjustment));
  }
  
  return roundToTwelveDecimals(baseRiseToBolts);
}

/**
 * Validates that a bracket/angle combination is valid for the given support level
 * 
 * @param supportLevel BSL measured as distance from SSL
 * @param bracketType The bracket type to validate
 * @param angleOrientation The angle orientation to validate
 * @returns true if the combination is valid, false otherwise
 */
export function isValidBracketAngleCombination(
  supportLevel: number,
  bracketType: BracketType,
  angleOrientation: AngleOrientation
): boolean {
  const validCombinations = getValidBracketAngleCombinations(supportLevel);
  
  return validCombinations.some(
    combo => combo.bracket_type === bracketType && combo.angle_orientation === angleOrientation
  );
}

/**
 * Calculate optimal fixing position for minimizing bracket steel usage
 * 
 * Iterates through fixing positions in 5mm increments from 75mm baseline,
 * testing each position against structural constraints:
 * - Minimum rise to bolts: 95mm (from bottom of bracket to fixing point)
 * - Minimum clearance from slab bottom: 75mm
 * 
 * @param config Fixing optimization configuration
 * @param params Bracket calculation parameters (without fixing_position set)
 * @param slabThickness Slab thickness in mm for bottom clearance validation
 * @returns Optimal fixing position in mm, or baseline position if no improvement found
 */
export function calculateOptimalFixingPosition(
  config: FixingOptimizationConfig,
  params: Omit<BracketHeightCalculationParams, 'fixing_position'>,
  slabThickness: number
): number {
  if (!config.enabled) {
    return config.start_position;
  }

  const {
    start_position,
    increment_size,
    min_bracket_height: minRiseToBolts,
    min_bottom_clearance,
    max_fixing_position
  } = config;

  let bestFixingPosition = start_position;
  let bestBracketHeight = Infinity;

  // Calculate maximum allowable fixing position
  const maxPosition = Math.min(
    max_fixing_position || slabThickness - min_bottom_clearance,
    slabThickness - min_bottom_clearance
  );

  // Iterate through fixing positions in increments
  for (let fixingPosition = start_position; fixingPosition <= maxPosition; fixingPosition += increment_size) {
    
    // Create parameters with current fixing position
    const testParams: BracketHeightCalculationParams = {
      ...params,
      fixing_position: fixingPosition
    };

    // Calculate bracket height for this fixing position
    const bracketHeight = calculateBracketHeight(testParams);

    // Calculate rise to bolts to validate constraint
    const riseToBoltsParams: RiseToBoltsCalculationParams = {
      bracket_height: bracketHeight,
      distance_from_top_to_fixing: params.distance_from_top_to_fixing,
      worst_case_adjustment: BRACKET_ANGLE_CONSTANTS.WORST_CASE_ADJUSTMENT,
      bottom_critical_edge_distance: min_bottom_clearance, // Use config value
      support_level: params.support_level,
      slab_thickness: slabThickness,
      top_critical_edge_distance: params.top_critical_edge_distance,
      fixing_position: fixingPosition
    };

    const riseToBolts = calculateRiseToBolts(riseToBoltsParams);

    // Check if this fixing position meets constraints
    const meetsRiseToBoltsConstraint = riseToBolts >= minRiseToBolts;
    const meetsBottomClearanceConstraint = (slabThickness - fixingPosition) >= min_bottom_clearance;

    if (meetsRiseToBoltsConstraint && meetsBottomClearanceConstraint) {
      // If this position results in smaller bracket height (less steel), use it
      if (bracketHeight < bestBracketHeight) {
        bestBracketHeight = bracketHeight;
        bestFixingPosition = fixingPosition;
      }
    }

    // Log for debugging
    console.log(`  Testing fixing position ${fixingPosition}mm: bracket_height=${bracketHeight.toFixed(2)}, rise_to_bolts=${riseToBolts.toFixed(2)}, valid=${meetsRiseToBoltsConstraint && meetsBottomClearanceConstraint}`);
  }

  console.log(`  Optimal fixing position: ${bestFixingPosition}mm (bracket height: ${bestBracketHeight.toFixed(2)}mm)`);
  return bestFixingPosition;
} 