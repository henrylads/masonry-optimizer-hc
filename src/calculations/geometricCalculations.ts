import { roundToTwelveDecimals } from '@/utils/precision';
import { type UserInputs } from '@/types/userInputs';

/**
 * System constants that rarely change
 */
export const SYSTEM_CONSTANTS = {
    /** Thickness of shim between bracket and angle (mm) */
    SHIM_THICKNESS: 3,
    /** Distance from bracket top to fixing center (mm) */
    BRACKET_TOP_TO_FIXING: 40,
    /** Minimum bracket projection (mm) */
    MIN_BRACKET_PROJECTION: 65,
    /** Maximum bracket projection (mm) */
    MAX_BRACKET_PROJECTION: 250,
} as const;

/**
 * Calculates the required bracket projection based on cavity width and masonry thickness
 * Projection = cavity + masonry_thickness/2 + safety margin
 */
export const calculateBracketProjection = (
    cavity: number,           // mm
    masonryThickness: number, // mm
    safetyMargin: number = 10 // mm
): number => {
    const projection = cavity + (masonryThickness / 2) + safetyMargin;
    
    // Ensure projection is within allowable range
    if (projection < SYSTEM_CONSTANTS.MIN_BRACKET_PROJECTION) {
        return SYSTEM_CONSTANTS.MIN_BRACKET_PROJECTION;
    }
    if (projection > SYSTEM_CONSTANTS.MAX_BRACKET_PROJECTION) {
        throw new Error(`Required bracket projection (${projection}mm) exceeds maximum allowed (${SYSTEM_CONSTANTS.MAX_BRACKET_PROJECTION}mm)`);
    }
    
    return roundToTwelveDecimals(projection);
};

/**
 * Calculates the vertical eccentricity from the fixing to the load
 * This is the distance from the fixing center to the center of the masonry load
 */
export const calculateVerticalEccentricity = (
    supportLevel: number,     // mm (can be negative)
    slabThickness: number,   // mm
    notchHeight: number = 0  // mm
): number => {
    // Calculate distance from top of slab to fixing
    const topToFixing = SYSTEM_CONSTANTS.BRACKET_TOP_TO_FIXING + notchHeight;
    
    // Calculate total vertical eccentricity
    // If support_level is negative (below SSL), it reduces the eccentricity
    const eccentricity = slabThickness - topToFixing + supportLevel;
    
    return roundToTwelveDecimals(eccentricity);
};

/**
 * Calculates the horizontal eccentricity from the fixing to the load
 * This is the distance from the fixing to the centerline of the masonry
 */
export const calculateHorizontalEccentricity = (
    bracketProjection: number,    // mm
    masonryThickness: number      // mm
): number => {
    // Horizontal eccentricity is the bracket projection minus half the masonry thickness
    const eccentricity = bracketProjection - (masonryThickness / 2);
    return roundToTwelveDecimals(eccentricity);
};

/**
 * Results from geometric calculations
 */
export interface GeometricResults {
    /** Bracket projection in mm */
    bracketProjection: number;
    /** Vertical eccentricity in mm */
    verticalEccentricity: number;
    /** Horizontal eccentricity in mm */
    horizontalEccentricity: number;
    /** Total eccentricity (vector sum) in mm */
    totalEccentricity: number;
}

/**
 * Calculates all geometric parameters for the system
 */
export const calculateGeometry = (
    inputs: UserInputs & { masonry_thickness: number }
): GeometricResults => {
    // Calculate bracket projection
    const bracketProjection = calculateBracketProjection(
        inputs.cavity,
        inputs.masonry_thickness
    );
    
    // Calculate vertical eccentricity
    // Only apply notch height if has_notch is true
    const effectiveNotchHeight = inputs.has_notch ? (inputs.notch_height ?? 0) : 0;
    const verticalEccentricity = calculateVerticalEccentricity(
        inputs.support_level,
        inputs.slab_thickness,
        effectiveNotchHeight
    );
    
    // Calculate horizontal eccentricity
    const horizontalEccentricity = calculateHorizontalEccentricity(
        bracketProjection,
        inputs.masonry_thickness
    );
    
    // Calculate total eccentricity using Pythagorean theorem
    const totalEccentricity = roundToTwelveDecimals(
        Math.sqrt(
            Math.pow(verticalEccentricity, 2) + 
            Math.pow(horizontalEccentricity, 2)
        )
    );
    
    return {
        bracketProjection,
        verticalEccentricity,
        horizontalEccentricity,
        totalEccentricity
    };
}; 