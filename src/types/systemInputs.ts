/**
 * System input types for the masonry support system optimizer
 */

/**
 * Bracket parameters determined by the genetic algorithm
 */
export interface BracketParameters {
  // Dimensions in mm
  height: number;          // Range: 100-490mm in 5mm increments
  projection: number;      // Range: 75-250mm in 5mm increments
  thickness: number;       // 3mm or 4mm
  centres: number;         // Range: 200-500mm in 50mm increments
}

/**
 * Angle parameters determined by the genetic algorithm
 */
export interface AngleParameters {
  // Dimensions in mm
  verticalLeg: number;    // Range: 60-200mm in 5mm increments
  horizontalLeg: number;  // Range: 60-200mm in 5mm increments
  thickness: number;      // Range: 3-12mm (3,4,5,6,8,10,12)
}

/**
 * Material properties for steel components
 */
export interface MaterialProperties {
  // All values in N/mm²
  yieldStrength: number;         // fy
  ultimateStrength: number;      // fu
  elasticModulus: number;        // E
  shearModulus: number;          // G
  poissonRatio: number;          // ν
}

/**
 * Default material properties for S275 steel
 */
export const S275_STEEL: MaterialProperties = {
  yieldStrength: 275,
  ultimateStrength: 430,
  elasticModulus: 210000,
  shearModulus: 81000,
  poissonRatio: 0.3
};

/**
 * Safety factors for design calculations
 */
export interface SafetyFactors {
  gamma_M0: number;  // Resistance of cross-sections
  gamma_M1: number;  // Resistance of members to instability
  gamma_M2: number;  // Resistance of cross-sections in tension to fracture
}

/**
 * Default safety factors according to Eurocode 3
 */
export const DEFAULT_SAFETY_FACTORS: SafetyFactors = {
  gamma_M0: 1.0,
  gamma_M1: 1.0,
  gamma_M2: 1.25
};

/**
 * Complete system configuration combining all parameters
 */
export interface SystemConfiguration {
  bracket: BracketParameters;
  angle: AngleParameters;
  material: MaterialProperties;
  safetyFactors: SafetyFactors;
  channelType: string;
} 