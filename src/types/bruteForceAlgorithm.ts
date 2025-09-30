/**
 * Types for the brute force algorithm
 */

import type { SteelWeightResults } from '../calculations/steelWeight';
import type { VerificationResults } from '../calculations/verificationChecks';
import type { AngleLayoutResult } from '../calculations/angleLayout';

export type BracketCentres = 200 | 250 | 300 | 350 | 400 | 450 | 500 | 550 | 600;
export type BracketThickness = 3 | 4;
export type AngleThickness = 3 | 4 | 5 | 6 | 8;
export type BoltDiameter = 10 | 12;
export type BracketType = 'Standard' | 'Inverted';
export type AngleOrientation = 'Standard' | 'Inverted';

export interface GeneticParameters {
  bracket_centres: BracketCentres;
  bracket_thickness: BracketThickness;
  angle_thickness: AngleThickness;
  vertical_leg: number;
  bolt_diameter: BoltDiameter;
  bracket_type: BracketType;
  angle_orientation: AngleOrientation;
  horizontal_leg?: number;
  channel_type?: string;
  dim_d?: number; // Distance from bracket bottom to fixing for inverted brackets (130-450mm)
}

export interface CalculatedParameters {
  bracket_height: number;
  bracket_projection: number;
  rise_to_bolts: number; // Worst-case position (bottom-of-slot) for structural calculations
  rise_to_bolts_display?: number; // Display value showing middle-of-slot position (15mm above calculation value)
  drop_below_slab: number;
  bracket_projection_at_fixing: number;
  dim_d?: number; // Distance from bracket bottom to fixing for inverted brackets (130-450mm)
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
  angle_orientation?: AngleOrientation;
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
} 