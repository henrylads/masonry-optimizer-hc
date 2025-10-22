import { roundToTwelveDecimals } from '@/utils/precision';
import { MOMENT_RESISTANCE_CONSTANTS } from './momentResistanceULS';

/**
 * Results from shear resistance at ULS calculations
 */
export interface ShearResistanceULSResults {
    /** Applied shear force (kN) */
    V_ed: number;
    /** Shear capacity of the angle (kN) */
    VR_d_angle: number;
    /** Shear utilisation (%) */
    utilization: number;
    /** Whether shear resistance check passes */
    passes: boolean;
}

/**
 * Verifies shear resistance at ULS according to project overview section 1.2
 * All intermediate calculations maintain full precision
 * Only final results are rounded to 12 decimal places
 */
export const verifyShearResistanceULS = (
    V_ed: number,           // Applied shear force (kN)
    A_v: number            // Shear area (mm²)
): ShearResistanceULSResults => {
    // Calculate VR_d = A_v * (F_y/sqrt(3))/gamma_sf/1000
    // Keep full precision for intermediate calculations
    const VR_d_intermediate = A_v * 
        (MOMENT_RESISTANCE_CONSTANTS.F_y / Math.sqrt(3)) / 
        MOMENT_RESISTANCE_CONSTANTS.gamma_sf / 
        1000;
    
    // Calculate utilization = (V_ed/VR_d) * 100
    // Keep full precision for intermediate calculations
    const utilization_intermediate = (V_ed / VR_d_intermediate) * 100;
    
    // Round final results to 12 decimal places
    return {
        V_ed: roundToTwelveDecimals(V_ed),
        VR_d_angle: roundToTwelveDecimals(VR_d_intermediate),
        utilization: roundToTwelveDecimals(utilization_intermediate),
        passes: utilization_intermediate <= 100
    };
}; 