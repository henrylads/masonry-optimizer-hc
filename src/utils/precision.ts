/**
 * Utility functions for handling precision and unit conversions in calculations
 */

/**
 * Rounds a number to 12 decimal places
 * This is used to maintain high precision in engineering calculations
 * while avoiding floating point errors
 */
export function roundToTwelveDecimals(num: number | undefined): number {
    if (num === undefined) return 0;
    return Number(num.toFixed(12));
}

/**
 * Unit conversion constants
 */
export const UNIT_CONVERSIONS = {
    /** Millimeters to meters */
    MM_TO_M: 0.001,
    /** Meters to millimeters */
    M_TO_MM: 1000,
    /** Newtons to kiloNewtons */
    N_TO_KN: 0.001,
    /** KiloNewtons to Newtons */
    KN_TO_N: 1000,
    /** Converts kg/m³ to N/mm³ including gravity */
    KG_M3_TO_N_MM3: 9.81e-12
} as const;

/**
 * Converts millimeters to meters
 */
export const mmToM = (mm: number): number => {
    return roundToTwelveDecimals(mm * UNIT_CONVERSIONS.MM_TO_M);
};

/**
 * Converts meters to millimeters
 */
export const mToMm = (m: number): number => {
    return roundToTwelveDecimals(m * UNIT_CONVERSIONS.M_TO_MM);
};

/**
 * Converts Newtons to kiloNewtons
 */
export const nToKn = (n: number): number => {
    return roundToTwelveDecimals(n * UNIT_CONVERSIONS.N_TO_KN);
};

/**
 * Converts kiloNewtons to Newtons
 */
export const knToN = (kn: number): number => {
    return roundToTwelveDecimals(kn * UNIT_CONVERSIONS.KN_TO_N);
};

/**
 * Converts density from kg/m³ to N/mm³
 * This includes the gravity constant for force conversion
 */
export const kgM3ToNMm3 = (density: number): number => {
    return roundToTwelveDecimals(density * UNIT_CONVERSIONS.KG_M3_TO_N_MM3);
};

/**
 * Compares two numbers for equality up to 5 decimal places
 */
export function numbersEqualToFiveDecimals(a: number, b: number): boolean {
    return Math.abs(a - b) < 0.00001;
} 