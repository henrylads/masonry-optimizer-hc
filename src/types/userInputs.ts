/**
 * Core user input parameters as defined in the project overview
 */
export interface UserInputs {
  /** Height of the concrete slab the system is attaching to (in mm) */
  slab_thickness: number;

  /** Distance between the edge of the concrete slab and the masonry (in mm) */
  cavity: number;

  /** 
   * Distance from the top of the slab (SSL) to the Brick Support Level (BSL).
   * Can be negative if support is below SSL, positive if BSL is above SSL (in mm)
   */
  support_level: number;

  /** Characteristic Uniformly Distributed Load (UDL) at the Serviceability Limit State (in kN/m) */
  characteristic_load?: number;

  /** 
   * Height of notch required if bracket extends beyond bottom of slab.
   * This allows space for the bracket to avoid items in the cavity (in mm).
   * @default 0
   */
  notch_height?: number;
}

/**
 * Default values for loading calculations
 */
export const LOADING_DEFAULTS = {
  /** Default masonry density in kg/m3 */
  MASONRY_DENSITY: 2000,
  /** Default masonry thickness in mm */
  MASONRY_THICKNESS: 102.5
} as const;

/**
 * Additional inputs required if characteristic_load is not provided.
 * These are only needed when calculating the characteristic load.
 */
export interface LoadingCalculationInputs {
  /** Known characteristic UDL in kN/m (if provided, other properties are optional) */
  characteristic_load?: number;

  /** Masonry density in kg/m3 (required if characteristic_load not provided) */
  masonry_density: number;

  /** Masonry thickness in mm (required if characteristic_load not provided) */
  masonry_thickness: number;

  /** Masonry height in meters (required if characteristic_load not provided) */
  masonry_height: number;

  /** Distance between bracket centers in mm (range: 200-600mm) */
  bracket_centres?: number;
} 