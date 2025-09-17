/**
 * Types related to masonry support optimization results and UI
 */

import { VerificationResults } from "../calculations/verificationChecks"
import { SteelWeightResults } from "../calculations/steelWeight"
import { AngleLayoutResult } from "../calculations/angleLayout"
import { AngleExtensionResult } from "./bracketAngleTypes"

// Define AlternativeDesign interface locally
export interface AlternativeDesign {
  design: {
    genetic: {
      bracket_centres: number;
      bracket_thickness: number;
      angle_thickness: number;
      vertical_leg: number;
      bolt_diameter: number;
      bracket_type: 'Standard' | 'Inverted';
      angle_orientation: 'Standard' | 'Inverted';
      horizontal_leg?: number;
      channel_type?: string;
      fixing_position?: number; // Distance from top of slab to fixing point (mm)
    };
    calculated: {
      bracket_height: number;
      bracket_projection: number;
      rise_to_bolts: number;
      drop_below_slab: number;
      bracket_projection_at_fixing: number;
      shear_load: number;
      total_deflection: number;
      characteristic_load: number;
      area_load: number;
      characteristic_udl: number;
      design_udl: number;
      E: number;
      n: number;
      slab_thickness: number;
      support_level: number;
      cavity_width: number;
      masonry_thickness?: number;
      bracket_type?: 'Standard' | 'Inverted';
      angle_orientation?: 'Standard' | 'Inverted';
      notch_height: number;
      notch_depth: number;
      moment_resistance_check: boolean;
      shear_resistance_check: boolean;
      angle_deflection_check: boolean;
      bracket_connection_check: boolean;
      shear_reduction_check: boolean;
      bracket_design_check: boolean;
      fixing_check: boolean;
      combined_tension_shear_check: boolean;
      all_checks_pass?: boolean;
      v_ed?: number;
      m_ed?: number;
      n_ed?: number;
      angle_utilisation?: number;
      total_system_deflection?: number;
      number_of_generations?: number;
      initial_weight?: number;
      optimal_design_weight?: number;
      weights?: SteelWeightResults;
      detailed_verification_results?: VerificationResults;
      bracketLayout?: AngleLayoutResult;
      bsl_above_slab_bottom?: boolean;
      optimized_fixing_position?: number; // mm - The optimal fixing position from top of slab
      angle_extension_result?: AngleExtensionResult; // Angle extension calculation result (if applied)
      effective_vertical_leg?: number; // Effective vertical leg accounting for extension
    };
  };
  totalWeight: number;
  weightDifferencePercent: number;
  keyDifferences: string[];
  verificationMargins?: {
    momentMargin: number;
    shearMargin: number;
    deflectionMargin: number;
    fixingMargin: number;
  };
}

export type OptimisationResult = {
  genetic: {
    bracket_centres: number // mm
    bracket_thickness: number // mm
    angle_thickness: number // mm
    vertical_leg: number // mm
    bolt_diameter: number // mm
    bracket_height?: number // mm
    rise_to_bolts?: number // mm
    bracket_projection?: number // mm
    horizontal_leg?: number // mm
    channel_type?: string
    bracket_type?: 'Standard' | 'Inverted' // Add bracket type to genetic
    angle_orientation?: 'Standard' | 'Inverted' // Add angle orientation to genetic
    fixing_position?: number // Distance from top of slab to fixing point (mm)
  }
  calculated: {
    bracket_height?: number // mm
    rise_to_bolts?: number // mm
    bracket_projection?: number // mm
    shear_load?: number // kN
    total_deflection?: number // mm
    characteristic_load?: number // kN/m
    slab_thickness?: number // mm
    v_ed?: number
    m_ed?: number
    n_ed?: number
    angle_utilisation?: number
    number_of_generations?: number
    initial_weight?: number
    optimal_design_weight?: number
    moment_resistance_check: boolean
    shear_resistance_check: boolean
    angle_deflection_check: boolean
    bracket_connection_check: boolean
    shear_reduction_check: boolean
    bracket_design_check: boolean
    fixing_check: boolean
    combined_tension_shear_check: boolean
    all_checks_pass?: boolean // Overall verification result
    detailed_verification_results?: VerificationResults // Use specific type
    weights?: SteelWeightResults // Use specific type
    bracket_type?: 'Standard' | 'Inverted' // Add bracket type
    bracketLayout?: AngleLayoutResult // Add bracket positioning information
    optimized_fixing_position?: number // mm - The optimal fixing position from top of slab
    angle_extension_result?: AngleExtensionResult // Angle extension calculation result (if applied)
    effective_vertical_leg?: number // Effective vertical leg accounting for extension
  }
  verificationSteps?: VerificationStep[];
  alternatives?: AlternativeDesign[]; // Alternative valid designs
  alerts?: string[]; // User alerts for important notifications
}

// Add type for generation summary
export interface GenerationSummary {
  generation: number;
  bestFitness: number;
  averageFitness: number; // Add average fitness for more insight
  bestWeight: number; // Add weight of the best design in this generation
  bracketCentres: number;
  bracketHeight: number;
  bracketThickness: number;
  angleThickness: number;
  populationDiversity?: number; // Optional: Add diversity metric if available
}

export interface VerificationStep {
  // TODO: Define the actual structure for a verification step
  stepName: string; 
  details: string; 
  passed?: boolean;
}

// Add type for the combined output of the genetic algorithm
export interface GeneticAlgorithmOutput {
  result: OptimisationResult;
  history: GenerationSummary[];
} 