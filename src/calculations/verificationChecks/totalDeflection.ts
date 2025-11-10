import { roundToTwelveDecimals } from '@/utils/precision';

/**
 * Constants for total deflection calculations
 */
const TOTAL_DEFLECTION_CONSTANTS = {
    /** Young's modulus for steel (N/mm²) */
    E: 200000,
    /** Maximum allowable total deflection (mm) */
    MAX_DEFLECTION: 2,
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
 * Interface for total deflection verification results
 */
export interface TotalDeflectionResults {
    /** Total vertical deflection of angle (mm) */
    Total_Vertical_Deflection: number;
    /** Additional deflection due to span (mm) */
    Addition_deflection_span: number;
    /** Total deflection of system (mm) */
    Total_deflection_of_system: number;
    /** Whether the check passes */
    passes: boolean;
}

/**
 * Verifies total deflection according to project overview
 * All intermediate calculations maintain full precision
 * Only final results are rounded to 12 decimal places
 */
export const verifyTotalDeflection = (
    D_total: number,         // Total deflection from angle deflection check (mm)
    D_heel_2: number,        // Angle deflection due to rotation from dropping below slab check (mm)
    Es_sr: number,           // Secant modulus for stress range (N/mm²)
    B_cc: number,            // Bracket centres (mm)
    C_udl: number,          // Characteristic UDL (kN/m)
    T: number,              // Angle thickness (mm)
    Def_included: boolean = true // Whether to include additional deflection
): TotalDeflectionResults => {
    // Calculate total vertical deflection
    const Total_Vertical_Deflection_raw = D_total + D_heel_2;

    // Get Ixx_3 from lookup table
    const Ixx_3 = TOTAL_DEFLECTION_CONSTANTS.IXX_3_LOOKUP[T as keyof typeof TOTAL_DEFLECTION_CONSTANTS.IXX_3_LOOKUP] ?? 0;

    // Calculate additional deflection due to span
    const Addition_deflection_span_raw = (5 * C_udl * 1000 * Math.pow(B_cc, 3)) / 
        (384 * Es_sr * Ixx_3);

    // Calculate total deflection of system
    const Total_deflection_of_system_raw = Def_included ?
        Total_Vertical_Deflection_raw + Addition_deflection_span_raw :
        Total_Vertical_Deflection_raw;

    // Check against limit
    const passes = Total_deflection_of_system_raw <= TOTAL_DEFLECTION_CONSTANTS.MAX_DEFLECTION;

    // Debug logging for deflection check
    if (!passes) {
        console.log(`❌ DEFLECTION FAILURE: ${Total_deflection_of_system_raw.toFixed(9)}mm > ${TOTAL_DEFLECTION_CONSTANTS.MAX_DEFLECTION}mm limit`);
    }

    // Round final results to 12 decimal places
    return {
        Total_Vertical_Deflection: roundToTwelveDecimals(Total_Vertical_Deflection_raw),
        Addition_deflection_span: roundToTwelveDecimals(Addition_deflection_span_raw),
        Total_deflection_of_system: roundToTwelveDecimals(Total_deflection_of_system_raw),
        passes
    };
}; 