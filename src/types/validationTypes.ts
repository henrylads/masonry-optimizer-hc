/**
 * Valid bracket centre distances in mm
 * Must be in 50mm increments between 200mm and 600mm
 */
export type BracketCentres = 200 | 250 | 300 | 350 | 400 | 450 | 500 | 550 | 600;

/**
 * Valid bracket thicknesses in mm
 */
export type BracketThickness = 3 | 4;

/**
 * Valid angle thicknesses in mm
 */
export type AngleThickness = 3 | 4 | 5 | 6 | 8;

/**
 * Valid bolt diameters in mm
 */
export type BoltDiameter = 10 | 12;

/**
 * Valid slab thicknesses in mm from the shear/tension forces table
 */
export type SlabThickness = 200 | 225 | 250;

/**
 * System defaults that rarely change
 */
export const SYSTEM_DEFAULTS = {
  /** Isolation shims thickness (mm) */
  SHIM_THICKNESS: 3,
  /** Distance from top of bracket to fixing (mm) */
  BRACKET_TOP_TO_FIXING: 40,
  /** Default horizontal leg length (mm) */
  DEFAULT_HORIZONTAL_LEG: 90,
  /** Number of plates per channel */
  PLATES_PER_CHANNEL: 2,
  /** Load Factor */
  LOAD_FACTOR: 1.35,
  /** Default packing shimming thickness (mm) */
  PACKING_SHIM_THICKNESS: 10,
  /** Default bolt diameter (mm) */
  DEFAULT_BOLT_DIAMETER: 10,
  /** Default concrete grade (N/mm2) */
  DEFAULT_CONCRETE_GRADE: 30,
  /** Gravity (m/s2) */
  GRAVITY: 9.81,
  /** Should additional deflection due to span be included? */
  INCLUDE_DEFLECTION: true
} as const; 