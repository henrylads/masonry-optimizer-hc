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
  projectInfo?: {
    project_name?: string;
    section_name?: string;
    client_name?: string;
    project_location?: string;
    project_reference?: string;
    designer_name?: string;
  };
}

/**
 * Extract and format design inputs from form data
 */
export const extractDesignInputs = (formData: FormDataType, result?: OptimizationResult): FormattedDesignInputs => {
  const isSteelFixing = formData.frame_fixing_type?.startsWith('steel') ?? false;
  const isConcreteFixing = formData.frame_fixing_type?.startsWith('concrete') ?? false;

  // For steel fixings, get the actual steel section height from the result or calculate from form
  let effectiveThickness = formData.slab_thickness;
  if (isSteelFixing) {
    if (result?.calculated?.slab_thickness) {
      // Use the calculated value from the result (this is the steel section height for steel fixings)
      effectiveThickness = result.calculated.slab_thickness;
    } else if (formData.use_custom_steel_section && formData.custom_steel_height) {
      effectiveThickness = formData.custom_steel_height;
    } else if (formData.steel_section_size) {
      effectiveThickness = parseInt(formData.steel_section_size.split('x')[0]) || 127;
    }
  }

  return {
    structuralParameters: [
      {
        label: isSteelFixing ? 'Steel Section Height' : 'Slab Thickness',
        value: effectiveThickness.toString(),
        unit: 'mm'
      },
      { label: 'Cavity Width', value: formData.cavity.toString(), unit: 'mm' },
      { label: 'Bracket Drop', value: formData.support_level.toString(), unit: 'mm' },
      { label: 'Characteristic Load', value: formData.characteristic_load.toString(), unit: 'kN/m' },
      { label: 'Facade Thickness', value: formData.facade_thickness.toString(), unit: 'mm' },
      { label: 'Material Type', value: formData.material_type },
      { label: 'Load Position', value: formData.load_position?.toFixed(2) || '0.33' },
      ...(isSteelFixing ? [
        { label: 'Steel Section Type', value: formData.steel_section_type || 'N/A' },
        {
          label: 'Steel Section Size',
          value: formData.steel_section_size || formData.custom_steel_height?.toString() || 'N/A',
          unit: formData.use_custom_steel_section ? 'mm' : undefined
        },
        { label: 'Steel Bolt Size', value: formData.steel_bolt_size || 'N/A' }
      ] : [])
    ],
    notchConfiguration: formData.has_notch ? [
      { label: 'Notch Enabled', value: 'Yes' },
      { label: 'Notch Height', value: formData.notch_height.toString(), unit: 'mm' },
      { label: 'Notch Depth', value: formData.notch_depth.toString(), unit: 'mm' }
    ] : [
      { label: 'Notch Enabled', value: 'No' }
    ],
    fixingConfiguration: [
      ...(isSteelFixing ? [
        { label: 'Frame Fixing Type', value: 'Steel' },
        { label: 'Steel Bolt Size', value: formData.steel_bolt_size || 'all' },
        {
          label: 'Fixing Position Mode',
          value: formData.use_custom_fixing_position ? 'Custom Position' : 'Find Optimal Position'
        },
        {
          label: 'Fixing Position',
          value: (result?.calculated?.optimized_fixing_position || result?.genetic?.fixing_position || formData.fixing_position).toString(),
          unit: 'mm from top of steel section'
        }
      ] : [
        { label: 'Frame Fixing Type', value: 'Concrete' },
        { label: 'Fixing Type', value: formData.fixing_type },
        { label: 'Channel Product', value: formData.channel_product || 'all' },
        { label: 'Post-fix Product', value: formData.postfix_product || 'all' },
        {
          label: 'Fixing Position Mode',
          value: formData.use_custom_fixing_position ? 'Custom Position' : 'Find Optimal Position'
        },
        {
          label: 'Fixing Position',
          value: (result?.calculated?.optimized_fixing_position || result?.genetic?.fixing_position || formData.fixing_position).toString(),
          unit: 'mm from top of slab'
        }
      ])
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
      ...(genetic.channel_type && genetic.channel_type !== 'NONE' ? [
        { label: 'Channel Type', value: genetic.channel_type }
      ] : []),
      ...(genetic.steel_bolt_size ? [
        { label: 'Steel Bolt Size', value: genetic.steel_bolt_size }
      ] : []),
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
        { parameter: 'Deflection Limit', value: 'L/300', unit: 'mm' },
        { parameter: 'Utilization', value: safeToString(deflectionResults.utilization), unit: '%' }
      ],
      utilization: safeNumber(deflectionResults.utilization),
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
      description: 'Combined tension and shear check for channel fixing with interaction formulas',
      inputs: [
        { parameter: 'Tensile Force (N_ed)', value: safeToString(combinedResults.N_ed), unit: 'kN' },
        { parameter: 'Shear Force (V_ed)', value: safeToString(combinedResults.V_ed), unit: 'kN' },
        { parameter: 'Tension Resistance (N_rd)', value: safeToString(combinedResults.N_rd), unit: 'kN' },
        { parameter: 'Shear Resistance (V_rd)', value: safeToString(combinedResults.V_rd), unit: 'kN' }
      ],
      formulas: [
        { step: '1. Calculate tension ratio', formula: 'Tension Ratio = N_ed / N_rd', result: safeToString(combinedResults.N_ratio) },
        { step: '2. Calculate shear ratio', formula: 'Shear Ratio = V_ed / V_rd', result: safeToString(combinedResults.V_ratio) },
        { step: '3. Formula 1', formula: '(N_ed/N_rd)^1.5 + (V_ed/V_rd)^1.5 ≤ 1.0', result: safeToString(combinedResults.U_combined_1) },
        { step: '4. Formula 2', formula: '(N_ed/N_rd + V_ed/V_rd) / 1.2 ≤ 1.0', result: safeToString(combinedResults.U_combined_2) },
        { step: '5. Combined check', formula: 'min(Formula1, Formula2) ≤ 1.0', result: combinedResults.passes ? 'PASS' : 'FAIL' }
      ],
      outputs: [
        { parameter: 'Tension Ratio', value: safeToString(combinedResults.N_ratio) },
        { parameter: 'Shear Ratio', value: safeToString(combinedResults.V_ratio) },
        { parameter: 'Combined Check 1', value: safeToString(combinedResults.U_combined_1) },
        { parameter: 'Combined Check 2', value: safeToString(combinedResults.U_combined_2) },
        { parameter: 'Result', value: combinedResults.passes ? 'PASS' : 'FAIL', unit: '' }
      ],
      utilization: Math.min(safeNumber(combinedResults.U_combined_1), safeNumber(combinedResults.U_combined_2)) * 100,
      passes: combinedResults.passes ?? false
    });
  }

  // 6. Fixing Check
  const fixingResults = verificationResults.fixingResults;
  if (fixingResults) {
    // Check if this is steel fixing or channel fixing
    const isSteelFixing = fixingResults.steelFixingResults !== undefined;

    if (isSteelFixing) {
      const steelResults = fixingResults.steelFixingResults!;
      calculations.push({
        name: 'Steel Bolt Check',
        description: 'Combined shear and tension check for steel fixing bolts',
        inputs: [
          { parameter: 'Applied Shear (Fv,Ed)', value: safeToString(steelResults.appliedShear), unit: 'kN' },
          { parameter: 'Applied Tension (Ft,Ed)', value: safeToString(steelResults.appliedTension), unit: 'kN' },
          { parameter: 'Shear Capacity (Fv,Rd)', value: safeToString(steelResults.shearCapacity), unit: 'kN' },
          { parameter: 'Tension Capacity (Ft,Rd)', value: safeToString(steelResults.tensionCapacity), unit: 'kN' }
        ],
        formulas: [
          { step: '1. Calculate shear utilization', formula: 'Shear Ratio = Fv,Ed / Fv,Rd', result: safeToString(steelResults.shearUtilization) },
          { step: '2. Calculate adjusted tension utilization', formula: 'Adj. Tension Ratio = Ft,Ed / (1.4 × Ft,Rd)', result: safeToString(steelResults.adjustedTensionUtilization) },
          { step: '3. Combined check', formula: '(Fv,Ed / Fv,Rd) + (Ft,Ed / (1.4 × Ft,Rd)) ≤ 1.0', result: safeToString(steelResults.combinedUtilization) }
        ],
        outputs: [
          { parameter: 'Shear Utilization', value: safeToString(steelResults.shearUtilization) },
          { parameter: 'Tension Utilization', value: safeToString(steelResults.tensionUtilization) },
          { parameter: 'Adjusted Tension Utilization', value: safeToString(steelResults.adjustedTensionUtilization) },
          { parameter: 'Combined Utilization', value: safeToString(steelResults.combinedUtilization) },
          { parameter: 'Result', value: steelResults.passes ? 'PASS' : 'FAIL' }
        ],
        utilization: safeNumber(steelResults.combinedUtilization) * 100,
        passes: steelResults.passes
      });
    } else {
      // Keep existing channel fixing calculation
      calculations.push({
        name: 'Channel Fixing Check',
        description: 'Channel fixing capacity check with combined interaction formulas',
        inputs: [
          { parameter: 'Applied Shear (V_ed)', value: safeToString(fixingResults.appliedShear), unit: 'kN' },
          { parameter: 'Applied Moment (M_ed)', value: safeToString(fixingResults.appliedMoment), unit: 'kNm' },
          { parameter: 'Tensile Force (N_ed)', value: safeToString(fixingResults.tensileForce), unit: 'kN' },
          { parameter: 'Shear Capacity (V_Rd)', value: safeToString(fixingResults.channelShearCapacity), unit: 'kN' },
          { parameter: 'Tension Capacity (N_Rd)', value: safeToString(fixingResults.channelTensionCapacity), unit: 'kN' }
        ],
        formulas: [
          { step: '1. Check individual shear', formula: 'V_ed ≤ V_Rd', result: fixingResults.channelShearCheckPasses ? 'PASS' : 'FAIL' },
          { step: '2. Check individual tension', formula: 'N_ed ≤ N_Rd', result: fixingResults.channelTensionCheckPasses ? 'PASS' : 'FAIL' },
          { step: '3. Formula 1', formula: '(N_ed/N_Rd)^1.5 + (V_ed/V_Rd)^1.5 ≤ 1.0', result: fixingResults.channelCombinedUtilization ? safeToString(fixingResults.channelCombinedUtilization) : 'N/A' },
          { step: '4. Formula 2', formula: '(N_ed/N_Rd + V_ed/V_Rd) / 1.2 ≤ 1.0', result: fixingResults.channelCombinedUtilization ? safeToString(fixingResults.channelCombinedUtilization) : 'N/A' },
          { step: '5. Combined check', formula: 'min(Formula1, Formula2) ≤ 1.0', result: fixingResults.channelCombinedCheckPasses ? 'PASS' : 'FAIL' }
        ],
        outputs: [
          { parameter: 'Shear Check', value: fixingResults.channelShearCheckPasses ? 'PASS' : 'FAIL', unit: '' },
          { parameter: 'Tension Check', value: fixingResults.channelTensionCheckPasses ? 'PASS' : 'FAIL', unit: '' },
          { parameter: 'Combined Utilization', value: fixingResults.channelCombinedUtilization ? safeToString(fixingResults.channelCombinedUtilization) : 'N/A', unit: '' },
          { parameter: 'Combined Check', value: fixingResults.channelCombinedCheckPasses ? 'PASS' : 'FAIL', unit: '' }
        ],
        utilization: fixingResults.channelCombinedUtilization ? safeNumber(fixingResults.channelCombinedUtilization) * 100 : 0,
        passes: fixingResults.passes ?? false
      });
    }
  }

  // 7-10. Add remaining verification checks with similar structure...
  // (Dropping Below Slab, Total Deflection, Packer Effects, Bracket Design)

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
      utilization: safeNumber(verificationResults.deflectionResults.utilization),
      criticalValue: `${safeNumber(verificationResults.deflectionResults.utilization).toFixed(1)}%`
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
    const fixingRes = verificationResults.fixingResults;
    const isSteelFixing = fixingRes.steelFixingResults !== undefined;

    const checkName = isSteelFixing ? 'Steel Bolt Check' : 'Channel Fixing Check';
    const combinedUtil = isSteelFixing
      ? (fixingRes.steelFixingResults?.combinedUtilization || 0) * 100
      : (fixingRes.channelCombinedUtilization || 0) * 100;

    summaryItems.push({
      checkName,
      result: fixingRes.passes ? 'PASS' : 'FAIL',
      utilization: combinedUtil,
      criticalValue: `${combinedUtil.toFixed(1)}%`
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
    // Calculate utilization as (total_deflection / 1.5) * 100
    const totalDeflection = safeNumber(verificationResults.totalDeflectionResults.Total_deflection_of_system);
    const systemUtilization = (totalDeflection / 1.5) * 100;
    summaryItems.push({
      checkName: 'Total System Deflection',
      result: verificationResults.totalDeflectionResults.passes ? 'PASS' : 'FAIL',
      utilization: systemUtilization,
      criticalValue: `${systemUtilization.toFixed(1)}%`
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
export const createReportMetadata = (result: OptimizationResult, formData?: FormDataType): ReportMetadata => {
  const verificationResults = result.calculated?.detailed_verification_results;
  const allChecksPass = verificationResults?.passes ?? result.calculated?.all_checks_pass ?? false;

  // Calculate overall utilization (highest utilization across all checks)
  let overallUtilization = 0;
  if (verificationResults) {
    // Calculate total system deflection utilization
    const totalDeflection = safeNumber(verificationResults.totalDeflectionResults?.Total_deflection_of_system);
    const systemUtilization = (totalDeflection / 1.5) * 100;

    const utilizations = [
      safeNumber(verificationResults.momentResults?.utilization),
      safeNumber(verificationResults.shearResults?.utilization),
      safeNumber(verificationResults.deflectionResults?.utilization),
      safeNumber(verificationResults.angleToBracketResults?.U_c_bolt),
      safeNumber(verificationResults.packerResults?.combined_utilization),
      systemUtilization
    ];
    const validUtilizations = utilizations.filter(u => !isNaN(u) && u > 0);
    overallUtilization = validUtilizations.length > 0 ? Math.max(...validUtilizations) : 0;
  }

  // Extract project information if available
  const projectInfo = formData ? {
    project_name: formData.project_name,
    section_name: formData.section_name,
    client_name: formData.client_name,
    project_location: formData.project_location,
    project_reference: formData.project_reference,
    designer_name: formData.designer_name
  } : undefined;

  return {
    title: 'Masonry Support System Calculation Report',
    timestamp: new Date().toLocaleString(),
    softwareVersion: '1.0.0',
    allChecksPass,
    overallUtilization,
    projectInfo
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
    designInputs: extractDesignInputs(formData, result),
    finalDesign: extractFinalDesign(result),
    calculations: extractCalculations(verificationResults),
    verificationSummary: extractVerificationSummary(verificationResults),
    metadata: createReportMetadata(result, formData)
  };
};