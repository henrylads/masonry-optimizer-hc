import { roundToTwelveDecimals } from '@/utils/precision';

/**
 * Constants for bracket design calculations
 */
export const BRACKET_DESIGN_CONSTANTS = {
    /** Number of plates per channel */
    n_p: 2,
    /** Epsilon value */
    epsilon: 1.058,
    /** Yield strength (N/mm²) */
    F_y: 210,
    /** Material safety factor */
    gamma_M0: 1.1
} as const;

/**
 * Results from bracket design calculations
 */
export interface BracketDesignResults {
    /** Bracket thickness (mm) */
    t: number;
    /** Number of plates per channel */
    n_p: number;
    /** Height of bracket notch (mm) */
    H_notch: number;
    /** Depth of channel (mm) */
    d_c: number;
    /** Depth to thickness ratio */
    d_ct: number;
    /** Epsilon value */
    epsilon: number;
    /** 56 times epsilon */
    epsilon_56: number;
    /** Whether section is Class 1 */
    is_class_1: boolean;
    /** Moment taken by bracket (kNm) */
    M_ed_bracket: number;
    /** Semi-plastic modulus of section (mm³) */
    W_pl_c: number;
    /** Moment capacity of channel (kNm) */
    M_rd_bracket: number;
    /** Whether the check passes */
    passes: boolean;
}

/**
 * Verifies bracket design according to project overview section 1.5
 * All intermediate calculations maintain full precision
 * Only final results are rounded to 12 decimal places
 */
export const verifyBracketDesign = (
    V_ed: number,           // Applied shear force (kN)
    C: number,             // Cavity width (mm)
    Ecc: number,           // Eccentricity (mm)
    L: number,             // Bracket height (mm)
    H_notch: number,       // Height of notch (mm)
    t: number              // Bracket thickness (mm)
): BracketDesignResults => {
    // Calculate depth of channel
    const d_c_raw = L - H_notch;
    
    // Calculate depth to thickness ratio
    const d_ct_raw = d_c_raw / t;
    
    // Calculate 56 times epsilon
    const epsilon_56_raw = 56 * BRACKET_DESIGN_CONSTANTS.epsilon;
    
    // Check if section is Class 1
    const is_class_1_raw = epsilon_56_raw > d_ct_raw;
    
    // Calculate moment taken by bracket
    const M_ed_bracket_raw = V_ed * (C + Ecc) / 1000;
    
    // Calculate semi-plastic modulus of section
    const W_pl_c_raw = 1.2 * t * Math.pow(d_c_raw, 2) / 6 * BRACKET_DESIGN_CONSTANTS.n_p;
    
    // Calculate moment capacity of channel
    const M_rd_bracket_raw = (BRACKET_DESIGN_CONSTANTS.F_y * W_pl_c_raw) / 
                            (BRACKET_DESIGN_CONSTANTS.gamma_M0 * 1000000);
    
    // Round final results to 12 decimal places
    return {
        t,
        n_p: BRACKET_DESIGN_CONSTANTS.n_p,
        H_notch,
        d_c: roundToTwelveDecimals(d_c_raw),
        d_ct: roundToTwelveDecimals(d_ct_raw),
        epsilon: BRACKET_DESIGN_CONSTANTS.epsilon,
        epsilon_56: roundToTwelveDecimals(epsilon_56_raw),
        is_class_1: is_class_1_raw,
        M_ed_bracket: roundToTwelveDecimals(M_ed_bracket_raw),
        W_pl_c: roundToTwelveDecimals(W_pl_c_raw),
        M_rd_bracket: roundToTwelveDecimals(M_rd_bracket_raw),
        passes: M_rd_bracket_raw >= M_ed_bracket_raw
    };
}; 