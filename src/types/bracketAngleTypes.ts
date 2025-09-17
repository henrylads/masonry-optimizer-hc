/**
 * Types for bracket and angle orientation selection
 * Based on the project overview selection table
 */

export type BracketType = 'Standard' | 'Inverted';
export type AngleOrientation = 'Standard' | 'Inverted';

/**
 * Valid combination of bracket type and angle orientation
 */
export interface BracketAngleCombination {
  bracket_type: BracketType;
  angle_orientation: AngleOrientation;
}

/**
 * Parameters for bracket height calculation
 */
export interface BracketHeightCalculationParams {
  support_level: number;
  top_critical_edge_distance: number;
  distance_from_top_to_fixing: number;
  vertical_leg: number;
  bracket_type: BracketType;
  angle_orientation: AngleOrientation;
  fixing_position?: number; // Optional fixing position (mm from top of slab) - defaults to 75mm
}

/**
 * Parameters for rise to bolts calculation
 */
export interface RiseToBoltsCalculationParams {
  bracket_height: number;
  distance_from_top_to_fixing: number;
  worst_case_adjustment: number;
  bottom_critical_edge_distance: number;
  support_level: number;
  slab_thickness: number;
  top_critical_edge_distance: number;
  fixing_position?: number; // Optional fixing position (mm from top of slab) - defaults to 75mm
}

/**
 * Configuration for fixing position optimization
 */
export interface FixingOptimizationConfig {
  /** Enable fixing position optimization */
  enabled: boolean;

  /** Starting fixing position (mm from top of slab) - default 75mm */
  start_position: number;

  /** Increment size for fixing position iterations (mm) - default 5mm */
  increment_size: number;

  /** Minimum bracket height to fixing point (rise to bolts) - default 95mm */
  min_bracket_height: number;

  /** Minimum clearance from bottom of slab (mm) - default 75mm */
  min_bottom_clearance: number;

  /** Maximum fixing depth from top of slab (mm) - calculated from slab thickness */
  max_fixing_position?: number;
}

/**
 * Result of angle extension calculation when bracket extension is limited
 */
export interface AngleExtensionResult {
  /** Whether angle extension was applied */
  extension_applied: boolean;

  /** Original bracket height before extension limit (mm) */
  original_bracket_height: number;

  /** Limited bracket height after applying max extension (mm) */
  limited_bracket_height: number;

  /** Amount bracket was shortened due to extension limit (mm) */
  bracket_reduction: number;

  /** Original angle vertical leg height (mm) */
  original_angle_height: number;

  /** Extended angle vertical leg height to compensate (mm) */
  extended_angle_height: number;

  /** Amount angle was extended to compensate for bracket reduction (mm) */
  angle_extension: number;

  /** Maximum allowable bracket extension that was applied (mm) */
  max_extension_limit: number;
}