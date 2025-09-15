import { roundToTwelveDecimals } from '@/utils/precision';

/**
 * Constants for moment resistance calculations
 */
export const MOMENT_RESISTANCE_CONSTANTS = {
    /** Yield Strength of stainless steel (N/mm²) */
    F_y: 210,
    /** Gamma safety material factor */
    gamma_sf: 1.1
} as const;

/**
 * Results from moment resistance at ULS calculations
 */
export interface MomentResistanceULSResults {
    /** Distance force is applied (mm) */
    L_1: number;
    /** Moment the angle takes (kNm) */
    M_ed_angle: number;
    /** Moment Capacity of the angle (kNm) */
    Mc_rd_angle: number;
    /** Moment utilisation (%) */
    utilization: number;
    /** Whether moment resistance check passes */
    passes: boolean;
}

/**
 * Verifies moment resistance at ULS according to project overview section 1.1
 * All intermediate calculations maintain full precision
 * Only final results are rounded to 12 decimal places
 */
export const verifyMomentResistanceULS = (
    V_ed: number,           // Applied shear force (kN)
    Ecc: number,           // Eccentricity (mm)
    d: number,             // Distance from fixing to back of angle (mm)
    T: number,             // Angle thickness (mm)
    Z: number              // Section modulus (mm³)
): MomentResistanceULSResults => {
    // Calculate L_1 = Ecc + d + T
    // Keep full precision for intermediate calculations
    const L_1_intermediate = Ecc + d + T;
    
    // Calculate M_ed = V_Ed * (L_1/1000)
    // Keep full precision for intermediate calculations
    const M_ed_intermediate = V_ed * (L_1_intermediate / 1000);
    
    // Calculate Mc_rd = Z/10^6 * (F_y/gamma_sf)
    // Keep full precision for intermediate calculations
    const Mc_rd_intermediate = (Z / 1000000) * (MOMENT_RESISTANCE_CONSTANTS.F_y / MOMENT_RESISTANCE_CONSTANTS.gamma_sf);
    
    // Calculate utilization = (M_ed/Mc_rd) * 100
    // Keep full precision for intermediate calculations
    const utilization_intermediate = (M_ed_intermediate / Mc_rd_intermediate) * 100;
    
    // Round final results to 12 decimal places
    return {
        L_1: roundToTwelveDecimals(L_1_intermediate),
        M_ed_angle: roundToTwelveDecimals(M_ed_intermediate),
        Mc_rd_angle: roundToTwelveDecimals(Mc_rd_intermediate),
        utilization: roundToTwelveDecimals(utilization_intermediate),
        passes: utilization_intermediate <= 100
    };
}; 