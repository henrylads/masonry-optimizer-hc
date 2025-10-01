import { roundToTwelveDecimals } from '@/utils/precision';

/**
 * Constants for angle to bracket connection calculations
 */
export const CONNECTION_CONSTANTS = {
    /** Ultimate tensile strength of bolt (N/mm²) */
    F_ub: 700,
    /** Bolt material safety factor */
    yM2: 1.25,
    /** Factor used from Eurocode 93-8 */
    a: 0.9,
    /** Cross sectional area of M10 bolt (mm²) */
    STRESS_AREA_M10: 58,
    /** Cross sectional area of M12 bolt (mm²) */
    STRESS_AREA_M12: 84.3
} as const;

/**
 * Results from angle to bracket connection calculations
 */
export interface AngleToBracketConnectionResults {
    /** Moment force on the bolt (kNm) */
    M_b: number;
    /** Tension force in the bolt (kN) */
    N_bolt: number;
    /** Total shear resistance of the bolt (kN) */
    V_bolt_resistance: number;
    /** Utilization of the bolt in shear (%) */
    U_v_bolt: number;
    /** Total tension resistance of the bolt (kN) */
    N_bolt_resistance: number;
    /** Utilization of the bolt in tension (%) */
    U_n_bolt: number;
    /** Combined utilization check (%) */
    U_c_bolt: number;
    /** Whether connection check passes */
    passes: boolean;
}

/**
 * Verifies angle to bracket connection
 * All intermediate calculations maintain full precision
 * Only final results are rounded to 12 decimal places
 */
export const verifyAngleToBracketConnection = (
    V_ed: number,           // Applied shear force (kN)
    B: number,             // Horizontal leg (mm)
    b: number,             // Bearing length (mm)
    I: number,             // Rise to bolt (mm)
    boltDiameter: 10 | 12  // Bolt diameter (mm)
): AngleToBracketConnectionResults => {
    // Get bolt stress area
    const stressArea = boltDiameter === 10 ? 
        CONNECTION_CONSTANTS.STRESS_AREA_M10 : 
        CONNECTION_CONSTANTS.STRESS_AREA_M12;
    
    // Calculate moment force on bolt without rounding
    const M_b_raw = V_ed * (B - b + 10) / 1000;
    
    // Calculate tension force in bolt without rounding
    const N_bolt_raw = M_b_raw / (I / 1000);
    
    // Calculate bolt shear resistance without rounding
    const V_bolt_resistance_raw = 0.5 * CONNECTION_CONSTANTS.F_ub * stressArea / 
                                 CONNECTION_CONSTANTS.yM2 / 1000;
    
    // Calculate shear utilization without rounding
    const U_v_bolt_raw = (V_ed / V_bolt_resistance_raw) * 100;
    
    // Calculate bolt tension resistance without rounding
    const N_bolt_resistance_raw = CONNECTION_CONSTANTS.a * stressArea * CONNECTION_CONSTANTS.F_ub / 
                                 CONNECTION_CONSTANTS.yM2 / 1000;
    
    // Calculate tension utilization without rounding
    const U_n_bolt_raw = (N_bolt_raw / N_bolt_resistance_raw) * 100;
    
    // Calculate combined utilization without rounding
    const U_c_bolt_raw = U_v_bolt_raw + (N_bolt_raw / (1.4 * N_bolt_resistance_raw)) * 100;
    
    // Round only the final results
    return {
        M_b: roundToTwelveDecimals(M_b_raw),
        N_bolt: roundToTwelveDecimals(N_bolt_raw),
        V_bolt_resistance: roundToTwelveDecimals(V_bolt_resistance_raw),
        U_v_bolt: roundToTwelveDecimals(U_v_bolt_raw),
        N_bolt_resistance: roundToTwelveDecimals(N_bolt_resistance_raw),
        U_n_bolt: roundToTwelveDecimals(U_n_bolt_raw),
        U_c_bolt: roundToTwelveDecimals(U_c_bolt_raw),
        passes: U_c_bolt_raw <= 100
    };
}; 