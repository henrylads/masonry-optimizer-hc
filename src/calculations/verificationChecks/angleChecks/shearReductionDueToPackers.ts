import { roundToTwelveDecimals } from '@/utils/precision';

/**
 * Results from shear reduction due to packers calculations
 */
export interface ShearReductionDueToPackersResults {
    /** Packing shim thickness (mm) */
    t_p: number;
    /** Packing shim diameter (mm) */
    d_p: number;
    /** Packer reduction factor */
    beta_p: number;
    /** Reduced shear resistance (kN) */
    V_rd: number;
    /** Tension resistance (kN) - unchanged by packer reduction */
    T_rd: number;
    /** Combined utilization with packer effect (%) */
    combined_utilization: number;
    /** Whether the check passes */
    passes: boolean;
}

/**
 * Verifies shear reduction due to packers according to project overview section 1.4.1
 * All intermediate calculations maintain full precision
 * Only final results are rounded to 12 decimal places
 */
export const verifyShearReductionDueToPackers = (
    V_ed: number,                // Applied shear force (kN)
    N_bolt: number,             // Tension force in bolt (kN)
    V_bolt_resistance: number,  // Original shear resistance without packers (kN)
    N_bolt_resistance: number,  // Original tension resistance (kN)
    t_p: number,               // Packing shim thickness (mm)
    d_p: 10 | 12              // Bolt diameter (mm)
): ShearReductionDueToPackersResults => {
    // Calculate beta_p according to formula: (9*d_p)/(8*d_p + 3*t_p)
    const beta_p_raw = Math.min((9 * d_p) / (8 * d_p + 3 * t_p), 1);
    
    // Calculate reduced shear resistance
    const V_rd_raw = beta_p_raw * V_bolt_resistance;
    
    // Calculate combined utilization with packer effect
    const combined_utilization_raw = (V_ed / V_rd_raw) * 100 + 
        (N_bolt / (1.4 * N_bolt_resistance)) * 100;
    
    // Round final results to 12 decimal places
    return {
        t_p,
        d_p,
        beta_p: roundToTwelveDecimals(beta_p_raw),
        V_rd: roundToTwelveDecimals(V_rd_raw),
        T_rd: roundToTwelveDecimals(N_bolt_resistance), // Unchanged by packer reduction
        combined_utilization: roundToTwelveDecimals(combined_utilization_raw),
        passes: combined_utilization_raw <= 100
    };
}; 