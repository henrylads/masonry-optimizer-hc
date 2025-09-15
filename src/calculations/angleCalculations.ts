import { roundToTwelveDecimals } from '@/utils/precision';

/**
 * Interface for angle calculation inputs
 */
export interface AngleCalculationInputs {
    /** Cavity width (mm) */
    C: number;
    /** Bracket projection (mm) */
    D: number;
    /** Isolation shim thickness (mm) */
    S: number;
    /** Angle thickness (mm) */
    T: number;
    /** Horizontal leg length (mm) */
    B: number;
    /** Bracket centres (mm) */
    B_cc: number;
}

/**
 * Interface for angle calculation results
 */
export interface AngleCalculationResults {
    /** Distance from cavity to back of angle (mm) */
    d: number;
    /** Length of bearing (mm) */
    b: number;
    /** Internal radius (mm) */
    R: number;
    /** Section modulus (mm³) */
    Z: number;
    /** Shear area (mm²) */
    Av: number;
    /** Second moment of area (mm⁴) */
    Ixx_1: number;
}

/**
 * Calculates all angle-related parameters according to project overview
 * All intermediate calculations maintain full precision
 * Only final results are rounded to 12 decimal places
 * 
 * @param params Input parameters for angle calculations
 * @returns Results of angle calculations
 */
export function calculateAngleParameters(params: AngleCalculationInputs): AngleCalculationResults {
    // Calculate d = (C-D-S)+IF(T=5 THEN, 6, ELSE 5)
    // Distance from cavity to back of angle
    const d_raw = (params.C - params.D - params.S) + (params.T === 5 ? 6 : 5);
    
    // Calculate b = B-T-d
    // Length of bearing which is horizontal leg minus the angle thickness minus the cavity to the back of the angle
    const b_raw = params.B - params.T - d_raw;
    
    // Calculate R = T
    // Internal radius R = the same as the angle thickness
    const R_raw = params.T;
    
    // Calculate Z = (B_cc*T^2)/6
    // Section of modulus used for the angle is the bracket centres multiplied by the angle thickness to power of 2 divided by 6
    const Z_raw = (params.B_cc * Math.pow(params.T, 2)) / 6;
    
    // Calculate Av = B_cc*T
    // Shear area measured in mm2
    const Av_raw = params.B_cc * params.T;
    
    // Calculate Ixx_1 = (B_cc*T^3)/12
    // Second moment of area of the angle in mm4
    const Ixx_1_raw = (params.B_cc * Math.pow(params.T, 3)) / 12;
    
    // Round all results to 12 decimal places
    return {
        d: roundToTwelveDecimals(d_raw),
        b: roundToTwelveDecimals(b_raw),
        R: roundToTwelveDecimals(R_raw),
        Z: roundToTwelveDecimals(Z_raw),
        Av: roundToTwelveDecimals(Av_raw),
        Ixx_1: roundToTwelveDecimals(Ixx_1_raw)
    };
}

/**
 * Formats the angle calculation results into a table format
 * @param results Angle calculation results
 * @returns Formatted string containing the results table
 */
export function formatAngleCalculationResults(results: AngleCalculationResults): string {
    return `
| Parameter | Value | Unit | Description |
|-----------|--------|------|-------------|
| d | ${results.d} | mm | Distance from cavity to back of angle |
| b | ${results.b} | mm | Length of bearing |
| R | ${results.R} | mm | Internal radius |
| Z | ${results.Z} | mm³ | Section modulus |
| Av | ${results.Av} | mm² | Shear area |
| Ixx_1 | ${results.Ixx_1} | mm⁴ | Second moment of area |
`;
} 