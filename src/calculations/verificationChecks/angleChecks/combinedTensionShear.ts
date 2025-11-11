import { roundToTwelveDecimals } from '@/utils/precision';

/**
 * Constants for combined tension-shear calculations
 */
export const COMBINED_CHECK_CONSTANTS = {
    /** Material safety factor */
    yM0: 1.1
} as const;

/**
 * Interface for combined tension-shear verification results
 */
export interface CombinedTensionShearResults {
    /** Applied tensile force (kN) */
    N_ed: number;
    /** Applied shear force (kN) */
    V_ed: number;
    /** Tension resistance (kN) */
    N_rd: number;
    /** Shear resistance (kN) */
    V_rd: number;
    /** Ratio of applied to resistance tension */
    N_ratio: number;
    /** Ratio of applied to resistance shear */
    V_ratio: number;
    /** Combined utilization using formula 1 (%) */
    U_combined_1: number;
    /** Combined utilization using formula 2 (%) */
    U_combined_2: number;
    /** Whether either formula passes */
    passes: boolean;
}

/**
 * Verifies combined tension-shear according to project overview
 * Uses two alternative formulas (must satisfy ONE of them):
 * 1. (N_Ed/N_Rd,i)^1.5 + (V_Ed/V_Rd,i)^1.5 <= 1.0
 * 2. (N_Ed/N_Rd,i + V_Ed/V_Rd,i) / 1.2 <= 1.0
 *
 * All intermediate calculations maintain full precision
 * Only final results are rounded to 12 decimal places
 *
 * @param N_ed Design tensile force (kN)
 * @param V_ed Design shear force (kN)
 * @param N_rd Design tension resistance (kN)
 * @param V_rd Design shear resistance (kN)
 * @returns Results of combined tension-shear verification
 */
export function verifyCombinedTensionShear(
    N_ed: number,
    V_ed: number,
    N_rd: number,
    V_rd: number
): CombinedTensionShearResults {
    // Calculate ratios
    const N_ratio_raw = N_ed / N_rd;
    const V_ratio_raw = V_ed / V_rd;

    // Calculate combined utilization using formula 1
    // (N_Ed/N_Rd,i)^1.5 + (V_Ed/V_Rd,i)^1.5 <= 1.0
    const U_combined_1_raw = Math.pow(N_ratio_raw, 1.5) + Math.pow(V_ratio_raw, 1.5);

    // Calculate combined utilization using formula 2
    // (N_Ed/N_Rd,i + V_Ed/V_Rd,i) / 1.2 <= 1.0
    const U_combined_2_raw = (N_ratio_raw + V_ratio_raw) / 1.2;

    // Round final results to 12 decimal places
    const N_ratio = roundToTwelveDecimals(N_ratio_raw);
    const V_ratio = roundToTwelveDecimals(V_ratio_raw);
    const U_combined_1 = roundToTwelveDecimals(U_combined_1_raw);
    const U_combined_2 = roundToTwelveDecimals(U_combined_2_raw);

    // Check passes if BOTH formulas are satisfied (must pass both)
    const passes = U_combined_1 <= 1.0 && U_combined_2 <= 1.0;

    return {
        N_ed: roundToTwelveDecimals(N_ed),
        V_ed: roundToTwelveDecimals(V_ed),
        N_rd: roundToTwelveDecimals(N_rd),
        V_rd: roundToTwelveDecimals(V_rd),
        N_ratio,
        V_ratio,
        U_combined_1,
        U_combined_2,
        passes
    };
} 