import { FormDataType } from '@/types/form-schema';
import { OptimizationResult } from '@/types/optimization-types';
import { VerificationResults } from '@/calculations/verificationChecks';

/**
 * Utility function to safely convert values to strings with fallback
 */
const safeToString = (value: unknown, fallback: string = 'N/A'): string => {
  return (value !== undefined && value !== null && !isNaN(value as number)) ? String(value) : fallback;
};

/**
 * Utility function to safely get numeric values with fallback
 */
const safeNumber = (value: unknown, fallback: number = 0): number => {
  return (value !== undefined && value !== null && !isNaN(value as number)) ? Number(value) : fallback;
};

/**
 * Structured data for PDF generation
 */
export interface PDFReportData {
  designInputs: FormattedDesignInputs;
  finalDesign: FormattedFinalDesign;
  calculations: FormattedCalculation[];
  verificationSummary: VerificationSummaryItem[];
  metadata: ReportMetadata;
}

export interface FormattedDesignInputs {
  structuralParameters: { label: string; value: string; unit?: string }[];
  masonryParameters: { label: string; value: string; unit?: string }[];
  notchConfiguration: { label: string; value: string; unit?: string }[];
  fixingConfiguration: { label: string; value: string; unit?: string }[];
  limitationSettings: { label: string; value: string; unit?: string }[];
}

export interface FormattedFinalDesign {
  genetic: { label: string; value: string; unit?: string }[];
  calculated: { label: string; value: string; unit?: string }[];
  performance: { label: string; value: string; unit?: string }[];
}

export interface FormattedCalculation {
  name: string;
  description: string;
  inputs: { parameter: string; value: string; unit?: string }[];
  formulas: { step: string; formula: string; result: string }[];
  outputs: { parameter: string; value: string; unit?: string }[];
  utilization: number;
  passes: boolean;
}

export interface VerificationSummaryItem {
  checkName: string;
  result: 'PASS' | 'FAIL';
  utilization: number;
  criticalValue?: string;
}

export interface ReportMetadata {
  title: string;
  timestamp: string;
  softwareVersion: string;
  allChecksPass: boolean;
  overallUtilization: number;
}

/**
 * Extract and format design inputs from form data
 */
export const extractDesignInputs = (formData: FormDataType): FormattedDesignInputs => {
  return {
    structuralParameters: [
      { label: 'Slab Thickness', value: formData.slab_thickness.toString(), unit: 'mm' },
      { label: 'Cavity Width', value: formData.cavity.toString(), unit: 'mm' },
      { label: 'Support Level', value: formData.support_level.toString(), unit: 'mm' },
      { label: 'Characteristic Load', value: formData.characteristic_load || 'Auto-calculated', unit: 'kN/m' }
    ],
    masonryParameters: [
      { label: 'Masonry Density', value: formData.masonry_density.toString(), unit: 'kg/m³' },
      { label: 'Masonry Thickness', value: formData.masonry_thickness.toString(), unit: 'mm' },
      { label: 'Masonry Height', value: formData.masonry_height.toString(), unit: 'm' }
    ],
    notchConfiguration: formData.has_notch ? [
      { label: 'Notch Enabled', value: 'Yes' },
      { label: 'Notch Height', value: formData.notch_height.toString(), unit: 'mm' },
      { label: 'Notch Depth', value: formData.notch_depth.toString(), unit: 'mm' }
    ] : [
      { label: 'Notch Enabled', value: 'No' }
    ],
    fixingConfiguration: [
      { label: 'Fixing Type', value: formData.fixing_type },
      { label: 'Channel Product', value: formData.channel_product || 'all' },
      { label: 'Post-fix Product', value: formData.postfix_product || 'all' },
      {
        label: 'Fixing Position Mode',
        value: formData.use_custom_fixing_position ? 'Custom Position' : 'Find Optimal Position'
      },
      { label: 'Fixing Position', value: formData.fixing_position.toString(), unit: 'mm' }
    ],
    limitationSettings: formData.is_angle_length_limited ? [
      { label: 'Angle Length Limited', value: 'Yes' },
      { label: 'Fixed Angle Length', value: formData.fixed_angle_length?.toString() || 'N/A', unit: 'mm' }
    ] : [
      { label: 'Angle Length Limited', value: 'No' }
    ]
  };
};

/**
 * Extract and format final design parameters
 */
export const extractFinalDesign = (result: OptimizationResult): FormattedFinalDesign => {
  const genetic = result.genetic || {};
  const calculated = result.calculated || {};
  const angleExtension = calculated.angle_extension_result;

  // Determine actual angle height with priority system:
  // 1. calculated.effective_vertical_leg (if available)
  // 2. calculated.angle_extension_result.extended_angle_height (if extension applied)
  // 3. genetic.vertical_leg (fallback - original parameter)
  const actualAngleHeight = calculated.effective_vertical_leg?.toString() ||
                           (angleExtension?.extension_applied ? angleExtension.extended_angle_height?.toString() : null) ||
                           genetic.vertical_leg?.toString() ||
                           'N/A';

  // Determine final angle orientation considering auto-flipping:
  // 1. calculated.angle_extension_result.final_angle_orientation (if flipped)
  // 2. genetic.angle_orientation (fallback)
  const finalAngleOrientation = (angleExtension?.angle_orientation_flipped ? angleExtension.final_angle_orientation : null) ||
                               genetic.angle_orientation ||
                               'N/A';

  return {
    genetic: [
      { label: 'Bracket Centres', value: genetic.bracket_centres?.toString() || 'N/A', unit: 'mm' },
      { label: 'Bracket Thickness', value: genetic.bracket_thickness?.toString() || 'N/A', unit: 'mm' },
      { label: 'Angle Thickness', value: genetic.angle_thickness?.toString() || 'N/A', unit: 'mm' },
      { label: 'Vertical Leg', value: actualAngleHeight, unit: 'mm' },
      { label: 'Horizontal Leg', value: genetic.horizontal_leg?.toString() || 'N/A', unit: 'mm' },
      { label: 'Bolt Diameter', value: genetic.bolt_diameter?.toString() || 'N/A', unit: 'mm' },
      { label: 'Bracket Type', value: genetic.bracket_type || 'N/A' },
      { label: 'Angle Orientation', value: finalAngleOrientation },
      { label: 'Channel Type', value: genetic.channel_type || 'N/A' },
      { label: 'Fixing Position', value: genetic.fixing_position?.toString() || 'N/A', unit: 'mm' }
    ],
    calculated: [
      { label: 'Bracket Height', value: calculated.bracket_height?.toString() || 'N/A', unit: 'mm' },
      { label: 'Bracket Projection', value: calculated.bracket_projection?.toString() || 'N/A', unit: 'mm' },
      { label: 'Bearing Length', value: calculated.bearing_length?.toString() || 'N/A', unit: 'mm' },
      { label: 'Rise to Bolts', value: calculated.rise_to_bolts?.toString() || 'N/A', unit: 'mm' },
      { label: 'Slab Thickness', value: calculated.slab_thickness?.toString() || 'N/A', unit: 'mm' },
      { label: 'Applied Shear', value: calculated.applied_shear?.toString() || 'N/A', unit: 'kN' },
      { label: 'Optimized Fixing Position', value: calculated.optimized_fixing_position?.toString() || 'N/A', unit: 'mm' },
      // Add angle extension information when applicable
      ...(angleExtension?.extension_applied ? [
        { label: 'Angle Extension Applied', value: 'Yes' },
        { label: 'Original Angle Height', value: angleExtension.original_angle_height?.toString() || 'N/A', unit: 'mm' },
        { label: 'Extended Angle Height', value: angleExtension.extended_angle_height?.toString() || 'N/A', unit: 'mm' },
        { label: 'Angle Extension Amount', value: angleExtension.angle_extension?.toString() || 'N/A', unit: 'mm' },
        { label: 'Extension Reason', value: 'Exclusion zone constraint' },
        ...(angleExtension.angle_orientation_flipped ? [
          { label: 'Orientation Auto-Flipped', value: 'Yes' },
          { label: 'Original Orientation', value: angleExtension.original_angle_orientation || 'N/A' },
          { label: 'Final Orientation', value: angleExtension.final_angle_orientation || 'N/A' },
          { label: 'Flip Reason', value: angleExtension.flip_reason || 'Extension compatibility' }
        ] : [])
      ] : [])
    ],
    performance: [
      { label: 'Total Weight', value: result.totalWeight?.toString() || 'N/A', unit: 'kg/m' },
      { label: 'Steel Weight (Bracket)', value: calculated.weights?.bracketWeightPerMeter?.toString() || 'N/A', unit: 'kg/m' },
      { label: 'Steel Weight (Angle)', value: calculated.weights?.angleWeightPerMeter?.toString() || 'N/A', unit: 'kg/m' },
      { label: 'All Checks Pass', value: calculated.all_checks_pass ? 'Yes' : 'No' }
    ]
  };
};

/**
 * Extract and format detailed calculations from verification results
 */
export const extractCalculations = (verificationResults: VerificationResults): FormattedCalculation[] => {
  const calculations: FormattedCalculation[] = [];

  // 1. Moment Resistance ULS
  const momentResults = verificationResults.momentResults;
  if (momentResults) {
    calculations.push({
      name: 'Moment Resistance ULS',
      description: 'Ultimate limit state moment resistance check for the angle section',
      inputs: [
        { parameter: 'Applied Shear (V_ed)', value: 'From load calculation', unit: 'kN' },
        { parameter: 'Eccentricity (Ecc)', value: 'From mathematical model', unit: 'mm' },
        { parameter: 'Distance to back of angle (d)', value: 'From angle geometry', unit: 'mm' },
        { parameter: 'Angle Thickness (T)', value: 'From optimization', unit: 'mm' },
        { parameter: 'Section Modulus (Z)', value: 'From angle calculations', unit: 'mm³' }
      ],
      formulas: [
        { step: '1. Calculate lever arm', formula: 'L₁ = Ecc + d + (12 - T)', result: `${safeToString(momentResults.L_1)} mm` },
        { step: '2. Calculate applied moment', formula: 'M_ed = V_ed × (L₁/1000)', result: `${safeToString(momentResults.M_ed_angle)} kNm` },
        { step: '3. Calculate moment capacity', formula: 'Mc_rd = Z/10⁶ × (F_y/γ_sf)', result: `${safeToString(momentResults.Mc_rd_angle)} kNm` },
        { step: '4. Calculate utilization', formula: 'Utilization = (M_ed/Mc_rd) × 100', result: `${safeToString(momentResults.utilization)}%` }
      ],
      outputs: [
        { parameter: 'Lever Arm (L₁)', value: safeToString(momentResults.L_1), unit: 'mm' },
        { parameter: 'Applied Moment (M_ed)', value: safeToString(momentResults.M_ed_angle), unit: 'kNm' },
        { parameter: 'Moment Capacity (Mc_rd)', value: safeToString(momentResults.Mc_rd_angle), unit: 'kNm' },
        { parameter: 'Utilization', value: safeToString(momentResults.utilization), unit: '%' }
      ],
      utilization: safeNumber(momentResults.utilization),
      passes: momentResults.passes ?? false
    });
  }

  // 2. Shear Resistance ULS
  const shearResults = verificationResults.shearResults;
  if (shearResults) {
    calculations.push({
      name: 'Shear Resistance ULS',
      description: 'Ultimate limit state shear resistance check for the angle section',
      inputs: [
        { parameter: 'Applied Shear (V_ed)', value: safeToString(shearResults.V_ed), unit: 'kN' },
        { parameter: 'Shear Area (Av)', value: 'From angle geometry', unit: 'mm²' }
      ],
      formulas: [
        { step: '1. Calculate shear resistance', formula: 'VR_d = Av × (f_y/(√3 × γ_M0))', result: `${safeToString(shearResults.VR_d_angle)} kN` },
        { step: '2. Calculate utilization', formula: 'Utilization = (V_ed/VR_d) × 100', result: `${safeToString(shearResults.utilization)}%` }
      ],
      outputs: [
        { parameter: 'Applied Shear (V_ed)', value: safeToString(shearResults.V_ed), unit: 'kN' },
        { parameter: 'Shear Resistance (VR_d)', value: safeToString(shearResults.VR_d_angle), unit: 'kN' },
        { parameter: 'Utilization', value: safeToString(shearResults.utilization), unit: '%' }
      ],
      utilization: safeNumber(shearResults.utilization),
      passes: shearResults.passes ?? false
    });
  }

  // 3. Angle Deflection SLS
  const deflectionResults = verificationResults.deflectionResults;
  if (deflectionResults) {
    calculations.push({
      name: 'Angle Deflection SLS',
      description: 'Serviceability limit state deflection check for the angle',
      inputs: [
        { parameter: 'Applied Shear', value: 'From load calculation', unit: 'kN' },
        { parameter: 'Lever Arm (L₁)', value: safeToString(deflectionResults.L_1), unit: 'mm' },
        { parameter: 'Applied Moment', value: 'From moment calculation', unit: 'kNm' }
      ],
      formulas: [
        { step: '1. Calculate deflection', formula: 'δ = Complex deflection formula', result: `${safeToString(deflectionResults.totalDeflection)} mm` },
        { step: '2. Check limit', formula: 'δ ≤ L/300', result: deflectionResults.passes ? 'PASS' : 'FAIL' }
      ],
      outputs: [
        { parameter: 'Total Deflection', value: safeToString(deflectionResults.totalDeflection), unit: 'mm' },
        { parameter: 'Deflection Limit', value: 'L/300', unit: 'mm' }
      ],
      utilization: (safeNumber(deflectionResults.totalDeflection) / Math.max(safeNumber(deflectionResults.L_1), 1) * 300) * 100,
      passes: deflectionResults.passes ?? false
    });
  }

  // 4. Angle-to-Bracket Connection
  const angleToBracketResults = verificationResults.angleToBracketResults;
  if (angleToBracketResults) {
    calculations.push({
      name: 'Angle-to-Bracket Connection',
      description: 'Bolt connection check between angle and bracket',
      inputs: [
        { parameter: 'Applied Shear', value: 'From load calculation', unit: 'kN' },
        { parameter: 'Bolt Diameter', value: 'From optimization', unit: 'mm' },
        { parameter: 'Bearing Length', value: 'From geometry', unit: 'mm' }
      ],
      formulas: [
        { step: '1. Calculate bolt tension', formula: 'N_bolt = M_b / (rise to bolt)', result: `${safeToString(angleToBracketResults.N_bolt)} kN` },
        { step: '2. Check combined utilization', formula: 'U_c = √((V/V_rd)² + (N/N_rd)²)', result: `${safeToString(angleToBracketResults.U_c_bolt)}%` }
      ],
      outputs: [
        { parameter: 'Bolt Tension (N_bolt)', value: safeToString(angleToBracketResults.N_bolt), unit: 'kN' },
        { parameter: 'Bolt Shear Resistance', value: safeToString(angleToBracketResults.V_bolt_resistance), unit: 'kN' },
        { parameter: 'Combined Utilization', value: safeToString(angleToBracketResults.U_c_bolt), unit: '%' }
      ],
      utilization: safeNumber(angleToBracketResults.U_c_bolt),
      passes: angleToBracketResults.passes ?? false
    });
  }

  // 5. Combined Tension-Shear (Channel)
  const combinedResults = verificationResults.combinedResults;
  if (combinedResults) {
    calculations.push({
      name: 'Combined Tension-Shear Check',
      description: 'Combined tension and shear check for channel fixing',
      inputs: [
        { parameter: 'Tensile Force (N_ed)', value: safeToString(combinedResults.N_ed), unit: 'kN' },
        { parameter: 'Shear Force (V_ed)', value: safeToString(combinedResults.V_ed), unit: 'kN' },
        { parameter: 'Tension Resistance (N_rd)', value: safeToString(combinedResults.N_rd), unit: 'kN' },
        { parameter: 'Shear Resistance (V_rd)', value: safeToString(combinedResults.V_rd), unit: 'kN' }
      ],
      formulas: [
        { step: '1. Check Formula 1', formula: '(N_ed/N_rd) + (V_ed/V_rd) ≤ 1.0', result: safeToString(combinedResults.U_combined_1) },
        { step: '2. Check Formula 2', formula: '(N_ed/N_rd)² + (V_ed/V_rd)² ≤ 1.2', result: safeToString(combinedResults.U_combined_2) }
      ],
      outputs: [
        { parameter: 'Tension Ratio', value: safeToString(combinedResults.N_ratio) },
        { parameter: 'Shear Ratio', value: safeToString(combinedResults.V_ratio) },
        { parameter: 'Combined Check 1', value: safeToString(combinedResults.U_combined_1) },
        { parameter: 'Combined Check 2', value: safeToString(combinedResults.U_combined_2) }
      ],
      utilization: Math.max(safeNumber(combinedResults.U_combined_1), safeNumber(combinedResults.U_combined_2)) * 100,
      passes: combinedResults.passes ?? false
    });
  }

  // 6-10. Add remaining verification checks with similar structure...
  // (Fixing Check, Dropping Below Slab, Total Deflection, Packer Effects, Bracket Design)

  return calculations;
};

/**
 * Extract verification summary for overview table
 */
export const extractVerificationSummary = (verificationResults: VerificationResults): VerificationSummaryItem[] => {
  const summaryItems: VerificationSummaryItem[] = [];

  // Only add summary items for verification checks that exist
  if (verificationResults.momentResults) {
    summaryItems.push({
      checkName: 'Moment Resistance ULS',
      result: verificationResults.momentResults.passes ? 'PASS' : 'FAIL',
      utilization: safeNumber(verificationResults.momentResults.utilization),
      criticalValue: `${safeNumber(verificationResults.momentResults.utilization).toFixed(1)}%`
    });
  }

  if (verificationResults.shearResults) {
    summaryItems.push({
      checkName: 'Shear Resistance ULS',
      result: verificationResults.shearResults.passes ? 'PASS' : 'FAIL',
      utilization: safeNumber(verificationResults.shearResults.utilization),
      criticalValue: `${safeNumber(verificationResults.shearResults.utilization).toFixed(1)}%`
    });
  }

  if (verificationResults.deflectionResults) {
    summaryItems.push({
      checkName: 'Angle Deflection SLS',
      result: verificationResults.deflectionResults.passes ? 'PASS' : 'FAIL',
      utilization: 0, // Calculate appropriate utilization
      criticalValue: `${safeNumber(verificationResults.deflectionResults.totalDeflection).toFixed(2)} mm`
    });
  }

  if (verificationResults.angleToBracketResults) {
    summaryItems.push({
      checkName: 'Angle-to-Bracket Connection',
      result: verificationResults.angleToBracketResults.passes ? 'PASS' : 'FAIL',
      utilization: safeNumber(verificationResults.angleToBracketResults.U_c_bolt),
      criticalValue: `${safeNumber(verificationResults.angleToBracketResults.U_c_bolt).toFixed(1)}%`
    });
  }

  if (verificationResults.combinedResults) {
    const combinedUtil = Math.max(
      safeNumber(verificationResults.combinedResults.U_combined_1),
      safeNumber(verificationResults.combinedResults.U_combined_2)
    ) * 100;
    summaryItems.push({
      checkName: 'Combined Tension-Shear',
      result: verificationResults.combinedResults.passes ? 'PASS' : 'FAIL',
      utilization: combinedUtil,
      criticalValue: `${(combinedUtil / 100).toFixed(3)}`
    });
  }

  if (verificationResults.fixingResults) {
    summaryItems.push({
      checkName: 'Fixing Check',
      result: verificationResults.fixingResults.passes ? 'PASS' : 'FAIL',
      utilization: 0, // Would need to calculate from fixing results
      criticalValue: 'Check details'
    });
  }

  if (verificationResults.droppingBelowSlabResults) {
    summaryItems.push({
      checkName: 'Dropping Below Slab',
      result: verificationResults.droppingBelowSlabResults.passes ? 'PASS' : 'FAIL',
      utilization: 0, // Would need to calculate
      criticalValue: 'Check details'
    });
  }

  if (verificationResults.totalDeflectionResults) {
    summaryItems.push({
      checkName: 'Total Deflection',
      result: verificationResults.totalDeflectionResults.passes ? 'PASS' : 'FAIL',
      utilization: 0, // Would need to calculate
      criticalValue: `${safeNumber(verificationResults.totalDeflectionResults.Total_deflection_of_system).toFixed(2)} mm`
    });
  }

  if (verificationResults.packerResults) {
    summaryItems.push({
      checkName: 'Packer Effects',
      result: verificationResults.packerResults.passes ? 'PASS' : 'FAIL',
      utilization: safeNumber(verificationResults.packerResults.combined_utilization),
      criticalValue: `${safeNumber(verificationResults.packerResults.combined_utilization).toFixed(1)}%`
    });
  }

  if (verificationResults.bracketDesignResults) {
    summaryItems.push({
      checkName: 'Bracket Design',
      result: verificationResults.bracketDesignResults.passes ? 'PASS' : 'FAIL',
      utilization: 0, // Would need to calculate from bracket design results
      criticalValue: 'Check details'
    });
  }

  return summaryItems;
};

/**
 * Create report metadata
 */
export const createReportMetadata = (result: OptimizationResult): ReportMetadata => {
  const verificationResults = result.calculated?.detailed_verification_results;
  const allChecksPass = verificationResults?.passes ?? result.calculated?.all_checks_pass ?? false;

  // Calculate overall utilization (highest utilization across all checks)
  let overallUtilization = 0;
  if (verificationResults) {
    const utilizations = [
      safeNumber(verificationResults.momentResults?.utilization),
      safeNumber(verificationResults.shearResults?.utilization),
      safeNumber(verificationResults.angleToBracketResults?.U_c_bolt),
      safeNumber(verificationResults.packerResults?.combined_utilization)
    ];
    const validUtilizations = utilizations.filter(u => !isNaN(u) && u > 0);
    overallUtilization = validUtilizations.length > 0 ? Math.max(...validUtilizations) : 0;
  }

  return {
    title: 'Masonry Support System Calculation Report',
    timestamp: new Date().toLocaleString(),
    softwareVersion: '1.0.0',
    allChecksPass,
    overallUtilization
  };
};

/**
 * Main function to extract all data needed for PDF generation
 */
export const extractPDFReportData = (
  result: OptimizationResult,
  formData: FormDataType
): PDFReportData => {
  const verificationResults = result.calculated?.detailed_verification_results;

  if (!verificationResults) {
    throw new Error('No verification results available for PDF generation');
  }

  return {
    designInputs: extractDesignInputs(formData),
    finalDesign: extractFinalDesign(result),
    calculations: extractCalculations(verificationResults),
    verificationSummary: extractVerificationSummary(verificationResults),
    metadata: createReportMetadata(result)
  };
};