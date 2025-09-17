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
    /** Masonry thickness (mm) - for backward compatibility, use facade_thickness when available */
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
    /** Facade thickness (mm) - replaces M when provided */
    facade_thickness?: number;
    /** Load position as fraction of facade thickness (0-1 range) - defaults to 1/3 */
    load_position?: number;
}

/**
 * Creates mathematical model inputs from angle calculation inputs
 * This ensures we have all the necessary parameters calculated correctly
 */
export function createMathematicalModelInputs(
    angleInputs: AngleCalculationInputs,
    masonryThickness: number,
    totalAngleLength: number,
    facadeThickness?: number,
    loadPosition?: number
): MathematicalModelInputs {
    // First calculate all angle parameters
    const angleResults = calculateAngleParameters(angleInputs);

    // Then create mathematical model inputs using those results
    return {
        M: masonryThickness, // Keep for backward compatibility
        d: angleResults.d,
        T: angleInputs.T,
        R: angleResults.R,
        L_bearing: angleResults.b,
        A: totalAngleLength,
        facade_thickness: facadeThickness,
        load_position: loadPosition
    };
}

/**
 * Calculates the mathematical model parameters as specified in the project overview
 * Now supports dynamic load position instead of hardcoded M/3
 * @param params Input parameters for the mathematical model
 * @returns Mathematical model calculation results
 */
export function calculateMathematicalModel(params: MathematicalModelInputs): MathematicalModelResults {
    // Use facade_thickness if provided, otherwise fall back to M for backward compatibility
    const effectiveFacadeThickness = params.facade_thickness ?? params.M;

    // Use load_position if provided, otherwise default to 1/3 for backward compatibility
    const effectiveLoadPosition = params.load_position ?? (1/3);

    // Debug logging for eccentricity calculation
    console.log('\n=== MATHEMATICAL MODEL CALCULATION DEBUG ===');
    console.log('Input Parameters:');
    console.log('  facade_thickness:', params.facade_thickness);
    console.log('  M (masonry_thickness):', params.M);
    console.log('  load_position:', params.load_position);
    console.log('  d:', params.d);
    console.log('  T:', params.T);
    console.log('  R:', params.R);
    console.log('  L_bearing:', params.L_bearing);
    console.log('  A:', params.A);

    console.log('\nCalculated Values:');
    console.log('  effectiveFacadeThickness:', effectiveFacadeThickness);
    console.log('  effectiveLoadPosition:', effectiveLoadPosition);

    // Calculate Ecc = facade_thickness * load_position (replaces hardcoded M/3)
    const Ecc_raw = effectiveFacadeThickness * effectiveLoadPosition;
    const Ecc = roundToTwelveDecimals(Ecc_raw);

    console.log('\nEccentricity Calculation:');
    console.log('  Ecc = facade_thickness × load_position');
    console.log(`  Ecc = ${effectiveFacadeThickness}mm × ${effectiveLoadPosition}`);
    console.log(`  Ecc = ${Ecc_raw}mm (raw)`);
    console.log(`  Ecc = ${Ecc}mm (rounded to 12 decimal places)`);

    // Calculate a = cavity_back_angle + Ecc - (T + R) + π×(T/2 + R)
    // Note: params.d contains cavity_back_angle when called from angle calculations
    const a_raw = params.d + Ecc - (params.T + params.R) + (Math.PI * (params.T/2 + params.R));
    const a = roundToTwelveDecimals(a_raw);

    console.log('\nParameter "a" Calculation:');
    console.log('  a = cavity_back_angle + Ecc - (T + R) + π×(T/2 + R)');
    console.log(`  a = ${params.d} + ${Ecc} - (${params.T} + ${params.R}) + π×(${params.T}/2 + ${params.R})`);
    console.log(`  a = ${params.d} + ${Ecc} - ${params.T + params.R} + π×(${params.T/2} + ${params.R})`);
    console.log(`  a = ${params.d} + ${Ecc} - ${params.T + params.R} + π×${params.T/2 + params.R}`);
    console.log(`  a = ${params.d} + ${Ecc} - ${params.T + params.R} + ${Math.PI * (params.T/2 + params.R)}`);
    console.log(`  a = ${a_raw}mm (raw)`);
    console.log(`  a = ${a}mm (rounded)`);

    // Calculate b = L_bearing - Ecc
    const b_raw = params.L_bearing - Ecc;
    const b = roundToTwelveDecimals(b_raw);

    console.log('\nParameter "b" Calculation:');
    console.log('  b = L_bearing - Ecc');
    console.log(`  b = ${params.L_bearing} - ${Ecc}`);
    console.log(`  b = ${b_raw}mm (raw)`);
    console.log(`  b = ${b}mm (rounded)`);

    // Calculate I = A-(R+T)-16.5
    const I_raw = params.A - (params.R + params.T) - 16.5;
    const I = roundToTwelveDecimals(I_raw);

    console.log('\nParameter "I" Calculation:');
    console.log('  I = A - (R + T) - 16.5');
    console.log(`  I = ${params.A} - (${params.R} + ${params.T}) - 16.5`);
    console.log(`  I = ${params.A} - ${params.R + params.T} - 16.5`);
    console.log(`  I = ${I_raw}mm (raw)`);
    console.log(`  I = ${I}mm (rounded)`);

    console.log('\n=== MATHEMATICAL MODEL RESULTS ===');
    console.log(`  Ecc: ${Ecc}mm`);
    console.log(`  a: ${a}mm`);
    console.log(`  b: ${b}mm`);
    console.log(`  I: ${I}mm`);
    console.log('=== END MATHEMATICAL MODEL DEBUG ===\n');

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