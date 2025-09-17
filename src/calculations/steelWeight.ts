import { roundToTwelveDecimals } from '@/utils/precision';

/**
 * Material properties for steel components
 */
export const STEEL_PROPERTIES = {
    /** Density of steel in kg/m³ */
    DENSITY: 7850,
    /** Weight of steel per mm³ in kg */
    WEIGHT_PER_MM3: 7850e-9,
} as const;

/**
 * Standard dimensions for system components
 */
export const COMPONENT_DIMENSIONS = {
    BRACKET_SPINE_WIDTH: {
        '3': 43.17, // 3mm bracket spine width
        '4': 40.55  // 4mm bracket spine width
    },
    HORIZONTAL_LEG: 90,    // Standard horizontal leg length
    VERTICAL_LEG: {
        STANDARD: 60,      // Standard vertical leg length
        HEAVY: 75         // Heavy duty (8mm) vertical leg length
    }
} as const;

/**
 * Results from steel weight calculations including detailed breakdowns
 */
export interface SteelWeightResults {
    /** Weight of a single bracket in kg */
    bracketWeight: number;
    /** Weight of angle per meter in kg */
    angleWeight: number;
    /** Weight of all brackets per meter in kg */
    bracketWeightPerMeter: number;
    /** Total system weight per meter in kg */
    totalWeight: number;
    /** Detailed volume calculations */
    volumes: {
        /** Volume of a single bracket in mm³ */
        bracketVolume: number;
        /** Volume of angle per meter in mm³ */
        angleVolume: number;
        /** Total volume per meter in mm³ */
        totalVolume: number;
    };
}

/**
 * Calculates complete system weight including brackets and angle
 * All dimensions should be in mm except bracket_centres which is in mm/m
 */
export function calculateSystemWeight(
    bracket_height: number,
    bracket_projection: number,
    bracket_thickness: number,
    bracket_centres: number,
    angle_thickness: number,
    vertical_leg?: number, // Optional: will use standard based on angle thickness if not provided
    horizontal_leg?: number // Optional: will use default 90mm if not provided
): SteelWeightResults {
    // Validate bracket thickness
    if (bracket_thickness !== 3 && bracket_thickness !== 4) {
        throw new Error(`Invalid bracket thickness: ${bracket_thickness}. Must be 3 or 4.`);
    }
    
    // Calculate bracket volume
    const bracketSpineWidth = COMPONENT_DIMENSIONS.BRACKET_SPINE_WIDTH[bracket_thickness];
    const bracketVolume = roundToTwelveDecimals(
        (bracket_projection * 2 + bracketSpineWidth) * bracket_height * bracket_thickness
    );
    
    // Calculate brackets per meter and total bracket weight per meter
    const bracketsPerMeter = roundToTwelveDecimals(1000 / bracket_centres);
    const bracketWeight = roundToTwelveDecimals(bracketVolume * STEEL_PROPERTIES.WEIGHT_PER_MM3);
    const bracketWeightPerMeter = roundToTwelveDecimals(bracketWeight * bracketsPerMeter);

    // Determine vertical leg length based on angle thickness
    const actualVerticalLeg = vertical_leg ??
        (angle_thickness === 8 ?
            COMPONENT_DIMENSIONS.VERTICAL_LEG.HEAVY :
            COMPONENT_DIMENSIONS.VERTICAL_LEG.STANDARD
        );

    // Determine horizontal leg length (use provided value or default)
    const actualHorizontalLeg = horizontal_leg ?? COMPONENT_DIMENSIONS.HORIZONTAL_LEG;

    // Calculate angle volume per meter
    const angleVolume = roundToTwelveDecimals(
        (actualVerticalLeg + actualHorizontalLeg - angle_thickness) *
        1000 * // length in mm (1 meter)
        angle_thickness
    );
    
    // Calculate angle weight per meter
    const angleWeight = roundToTwelveDecimals(angleVolume * STEEL_PROPERTIES.WEIGHT_PER_MM3);

    // Calculate total volume and weight
    const totalVolume = roundToTwelveDecimals(angleVolume + bracketVolume * bracketsPerMeter);
    const totalWeight = roundToTwelveDecimals(angleWeight + bracketWeightPerMeter);

    return {
        bracketWeight,
        angleWeight,
        bracketWeightPerMeter,
        totalWeight,
        volumes: {
            bracketVolume,
            angleVolume,
            totalVolume
        }
    };
}

// Keep existing utility functions but mark them as internal
/** @internal */
export const calculateBracketWeight = (
    height: number,      // mm
    projection: number,  // mm
    thickness: number,   // mm
    webReduction = 0.4  // Percentage of material removed from web (0-1)
): number => {
    // Calculate volume of solid bracket
    const solidVolume = height * projection * thickness;
    
    // Reduce volume by web reduction factor
    const actualVolume = solidVolume * (1 - webReduction);
    
    // Calculate weight
    const weight = actualVolume * STEEL_PROPERTIES.WEIGHT_PER_MM3;
    
    return roundToTwelveDecimals(weight);
};

/** @internal */
export const calculateAngleWeight = (
    verticalLeg: number,    // mm
    horizontalLeg: number,  // mm
    thickness: number,      // mm
    length: number         // mm
): number => {
    // Calculate cross-sectional area
    const area = (verticalLeg + horizontalLeg - thickness) * thickness;
    
    // Calculate volume
    const volume = area * length;
    
    // Calculate weight
    const weight = volume * STEEL_PROPERTIES.WEIGHT_PER_MM3;
    
    return roundToTwelveDecimals(weight);
}; 