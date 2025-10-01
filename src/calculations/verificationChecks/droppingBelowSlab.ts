import { roundToTwelveDecimals } from '@/utils/precision';

/**
 * Constants for bracket dropping below slab calculations
 */
const DROPPING_BELOW_SLAB_CONSTANTS = {
    /** Young's modulus for steel (N/mm²) */
    E: 200000,
    /** Ixx_3 lookup table for angle thickness */
    IXX_3_LOOKUP: {
        3: 139727,
        4: 180849,
        5: 218359,
        6: 255683,
        8: 617257,
        10: 741102
    } as const
} as const;

/**
 * Interface for bracket dropping below slab verification results
 */
export interface DroppingBelowSlabResults {
    /** Drop below slab (mm) */
    P: number;
    /** Height of notch (mm) */
    H_notch: number;
    /** Effective drop below slab (mm) */
    P_eff: number;
    /** Characteristic shear force (kN) */
    V_ek: number;
    /** Design cavity plus eccentricity (mm) */
    L_d: number;
    /** Moment due to drop (kNm) */
    M_ek_drop: number;
    /** Bracket projection at fixing (mm) */
    B_proj_fix: number;
    /** Second moment of area (mm⁴) */
    Ixx_2: number;
    /** Lateral deflection (mm) */
    L_deflection: number;
    /** Rotation at heel (radians) */
    rotation_heel_2: number;
    /** Angle deflection due to rotation (mm) */
    D_heel_2: number;
    /** Whether the check passes */
    passes: boolean;
}

/**
 * Verifies deflection due to bracket dropping below slab according to project overview section 1.6
 * All intermediate calculations maintain full precision
 * Only final results are rounded to 12 decimal places
 */
export const verifyDroppingBelowSlab = (
    P: number,                // Drop below slab (mm)
    H_notch: number,         // Height of notch (mm)
    V_ek: number,            // Characteristic shear force (kN)
    C_prime: number,         // Design cavity (mm)
    Ecc: number,             // Eccentricity (mm)
    B_proj_fix: number,      // Bracket projection at fixing (mm)
    t: number,               // Bracket thickness (mm)
    L_bearing: number        // Bearing length (mm)
): DroppingBelowSlabResults => {
    // If P is negative or zero, there is no drop below slab
    if (P <= 0) {
        return {
            P,
            H_notch,
            P_eff: 0,
            V_ek,
            L_d: roundToTwelveDecimals(C_prime + Ecc),
            M_ek_drop: roundToTwelveDecimals((V_ek * (C_prime + Ecc)) / 1000),
            B_proj_fix,
            Ixx_2: roundToTwelveDecimals(2 * (t * Math.pow(B_proj_fix, 3)) / 12),
            L_deflection: 0,
            rotation_heel_2: 0,
            D_heel_2: 0,
            passes: true // No drop below slab means this check automatically passes
        };
    }

    // Calculate effective drop below slab
    const P_eff_raw = H_notch > P ? H_notch : P;

    // Calculate design cavity plus eccentricity
    const L_d_raw = C_prime + Ecc;

    // Calculate moment due to drop
    const M_ek_drop_raw = V_ek * L_d_raw / 1000;

    // Calculate second moment of area
    const Ixx_2_raw = 2 * (t * Math.pow(B_proj_fix, 3)) / 12;

    // Calculate lateral deflection
    const L_deflection_raw = (M_ek_drop_raw * Math.pow(10, 6) * Math.pow(P_eff_raw, 2)) / 
        (2 * DROPPING_BELOW_SLAB_CONSTANTS.E * Ixx_2_raw);

    // Calculate rotation at heel
    const rotation_heel_2_raw = Math.atan(L_deflection_raw / P_eff_raw);

    // Calculate angle deflection due to rotation
    const D_heel_2_raw = (C_prime + L_bearing) * Math.sin(rotation_heel_2_raw);

    // Round final results to 12 decimal places
    return {
        P,
        H_notch,
        P_eff: roundToTwelveDecimals(P_eff_raw),
        V_ek: roundToTwelveDecimals(V_ek),
        L_d: roundToTwelveDecimals(L_d_raw),
        M_ek_drop: roundToTwelveDecimals(M_ek_drop_raw),
        B_proj_fix: roundToTwelveDecimals(B_proj_fix),
        Ixx_2: roundToTwelveDecimals(Ixx_2_raw),
        L_deflection: roundToTwelveDecimals(L_deflection_raw),
        rotation_heel_2: roundToTwelveDecimals(rotation_heel_2_raw),
        D_heel_2: roundToTwelveDecimals(D_heel_2_raw),
        passes: true // This check always passes as it just calculates values for total deflection
    };
}; 