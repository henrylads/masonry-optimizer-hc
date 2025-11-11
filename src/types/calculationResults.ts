import type { UserInputs } from './userInputs';
import type { SystemConfiguration, BracketParameters, AngleParameters } from './systemInputs';

/**
 * Types for calculation results in the masonry support system optimizer
 */

/**
 * Results from the mathematical model calculations
 */
export interface MathematicalModelResults {
  // Forces and moments
  designLoad: number;           // kN/m
  shearForce: number;          // kN
  bendingMoment: number;       // kNm
  
  // Geometric calculations
  eccentricity: number;        // mm
  effectiveDepth: number;      // mm
  secondMomentOfArea: number;  // mm⁴
  
  // Weight calculations
  bracketWeight: number;       // kg
  angleWeight: number;         // kg
  totalWeight: number;         // kg
}

/**
 * Results from individual verification checks
 */
export interface VerificationCheckResults {
  // Moment resistance checks
  momentResistance: {
    capacity: number;          // kNm
    utilization: number;       // 0-1
    passes: boolean;
  };
  
  // Shear resistance checks
  shearResistance: {
    capacity: number;          // kN
    utilization: number;       // 0-1
    passes: boolean;
  };
  
  // Deflection checks
  deflection: {
    angleDeflection: number;   // mm
    bracketDeflection: number; // mm
    totalDeflection: number;   // mm
    allowable: number;         // mm
    utilization: number;       // 0-1
    passes: boolean;
  };
  
  // Connection checks
  connectionChecks: {
    tensionCapacity: number;   // kN
    shearCapacity: number;     // kN
    combinedUtilization: number; // 0-1
    passes: boolean;
  };
  
  // Overall result
  allChecksPassed: boolean;
}

/**
 * Results from the genetic algorithm optimization
 */
export interface OptimizationResults {
  // Best solution found
  bestSolution: {
    bracket: BracketParameters;
    angle: AngleParameters;
    fitness: number;
    weight: number;
  };
  
  // Optimization statistics
  statistics: {
    generations: number;
    populationSize: number;
    convergenceGen: number;
    executionTime: number;     // ms
  };
  
  // Verification results for best solution
  verificationResults: VerificationCheckResults;
  modelResults: MathematicalModelResults;
}

/**
 * Combined results from all calculations
 */
export interface CalculationResults {
  inputs: {
    user: UserInputs;
    system: SystemConfiguration;
  };
  optimization: OptimizationResults;
  model: MathematicalModelResults;
  verification: VerificationCheckResults;
  timestamp: string;
} 