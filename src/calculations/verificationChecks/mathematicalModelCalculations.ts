import { roundToTwelveDecimals } from "@/utils/precision";
import { AngleCalculationInputs, calculateAngleParameters } from "../angleCalculations";

export interface MathematicalModelResults {
    /** Eccentricity (mm) - Masonry thickness / 3 */
    Ecc: number;
    /** Distance calculation (mm) - Ecc+d+PI()*(T/2+R)-(T+R) */
    a: number;
    /** Length bearing minus eccentricity (mm) - L_bearing - Ecc */
    b: number;
    /** Distance calculation (mm) - A-(R+T)-16.5 */
    I: number;
}

export interface MathematicalModelInputs {
    /** Masonry thickness (mm) */
    M: number;
    /** Distance from fixing to back of angle (mm) */
    d: number;
    /** Angle thickness (mm) */
    T: number;
    /** Radius of bend (mm) */
    R: number;
    /** Length of bearing (mm) */
    L_bearing: number;
    /** Total angle length (mm) */
    A: number;
}

/**
 * Creates mathematical model inputs from angle calculation inputs
 * This ensures we have all the necessary parameters calculated correctly
 */
export function createMathematicalModelInputs(
    angleInputs: AngleCalculationInputs,
    masonryThickness: number,
    totalAngleLength: number
): MathematicalModelInputs {
    // First calculate all angle parameters
    const angleResults = calculateAngleParameters(angleInputs);

    // Then create mathematical model inputs using those results
    return {
        M: masonryThickness,
        d: angleResults.d,
        T: angleInputs.T,
        R: angleResults.R,
        L_bearing: angleResults.b,
        A: totalAngleLength
    };
}

/**
 * Calculates the mathematical model parameters as specified in the project overview
 * @param params Input parameters for the mathematical model
 * @returns Mathematical model calculation results
 */
export function calculateMathematicalModel(params: MathematicalModelInputs): MathematicalModelResults {
    // Calculate Ecc = M/3
    const Ecc = roundToTwelveDecimals(params.M / 3);

    // Calculate a = Ecc+d+PI()*(T/2+R)-(T+R)
    const a = roundToTwelveDecimals(
        Ecc + 
        params.d + 
        (Math.PI * (params.T/2 + params.R)) - 
        (params.T + params.R)
    );

    // Calculate b = L_bearing - Ecc
    const b = roundToTwelveDecimals(params.L_bearing - Ecc);

    // Calculate I = A-(R+T)-16.5
    const I = roundToTwelveDecimals(params.A - (params.R + params.T) - 16.5);

    return {
        Ecc,
        a,
        b,
        I
    };
}

/**
 * Formats the mathematical model results into a table format as specified in the project overview
 * @param results Mathematical model calculation results
 * @returns Formatted string containing the results table
 */
export function formatMathematicalModelResults(results: MathematicalModelResults): string {
    return `
| Parameter | Value |
|-----------|--------|
| Eccentricity | ${results.Ecc}mm |
| a | ${results.a}mm |
| b | ${results.b}mm |
| I | ${results.I}mm |
`;
} 