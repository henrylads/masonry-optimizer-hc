/**
 * Validation utility functions and constants for the masonry support system
 */

/**
 * Valid ranges for various parameters
 */
export const VALID_RANGES = {
    SLAB: {
        MIN_THICKNESS: 150,    // mm
        MAX_THICKNESS: 300,    // mm
    },
    CAVITY: {
        MIN_WIDTH: 50,        // mm
        MAX_WIDTH: 200,       // mm
    },
    SUPPORT_LEVEL: {
        MIN_HEIGHT: -500,     // mm (below slab)
        MAX_HEIGHT: 500,      // mm (above slab)
    },
    MASONRY: {
        MIN_DENSITY: 1000,    // kg/m³
        MAX_DENSITY: 3000,    // kg/m³
        MIN_THICKNESS: 50,    // mm
        MAX_THICKNESS: 500,   // mm
        MIN_HEIGHT: 1000,     // mm (1m)
        MAX_HEIGHT: 10000,    // mm (10m)
    },
    BRACKET: {
        MIN_HEIGHT: 100,      // mm
        MAX_HEIGHT: 490,      // mm
        MIN_PROJECTION: 65,   // mm
        MAX_PROJECTION: 250,  // mm
        VALID_THICKNESSES: [3, 4] as const,  // mm
    },
    ANGLE: {
        MIN_LEG: 50,         // mm
        MAX_LEG: 200,        // mm
        VALID_THICKNESSES: [3, 4, 5, 6, 8, 10, 12] as const,  // mm
    },
    BOLT: {
        VALID_DIAMETERS: [10, 12] as const,  // mm
    }
} as const;

/**
 * Error messages for validation failures
 */
export const VALIDATION_ERRORS = {
    RANGE: (param: string, min: number, max: number, unit: string = 'mm') => 
        `${param} must be between ${min} and ${max}${unit}`,
    VALID_VALUES: (param: string, values: readonly number[]) =>
        `${param} must be one of: ${values.join(', ')}`,
    REQUIRED: (param: string) =>
        `${param} is required`,
    POSITIVE: (param: string) =>
        `${param} must be positive`,
} as const;

/**
 * Validates that a value is within a specified range
 * @throws Error if validation fails
 */
export const validateRange = (
    value: number,
    min: number,
    max: number,
    paramName: string,
    unit: string = 'mm'
): void => {
    if (value < min || value > max) {
        throw new Error(VALIDATION_ERRORS.RANGE(paramName, min, max, unit));
    }
};

/**
 * Validates that a value is one of a set of valid values
 * @throws Error if validation fails
 */
export const validateEnum = <T extends readonly number[]>(
    value: number,
    validValues: T,
    paramName: string
): void => {
    if (!validValues.includes(value)) {
        throw new Error(VALIDATION_ERRORS.VALID_VALUES(paramName, validValues));
    }
};

/**
 * Validates slab parameters
 * @throws Error if validation fails
 */
export const validateSlab = (thickness: number): void => {
    validateRange(
        thickness,
        VALID_RANGES.SLAB.MIN_THICKNESS,
        VALID_RANGES.SLAB.MAX_THICKNESS,
        'Slab thickness'
    );
};

/**
 * Validates cavity parameters
 * @throws Error if validation fails
 */
export const validateCavity = (width: number): void => {
    validateRange(
        width,
        VALID_RANGES.CAVITY.MIN_WIDTH,
        VALID_RANGES.CAVITY.MAX_WIDTH,
        'Cavity width'
    );
};

/**
 * Validates support level parameters
 * @throws Error if validation fails
 */
export const validateSupportLevel = (height: number): void => {
    validateRange(
        height,
        VALID_RANGES.SUPPORT_LEVEL.MIN_HEIGHT,
        VALID_RANGES.SUPPORT_LEVEL.MAX_HEIGHT,
        'Support level'
    );
};

/**
 * Validates masonry parameters
 * @throws Error if validation fails
 */
export const validateMasonry = (
    density?: number,
    thickness?: number,
    height?: number
): void => {
    if (density !== undefined) {
        validateRange(
            density,
            VALID_RANGES.MASONRY.MIN_DENSITY,
            VALID_RANGES.MASONRY.MAX_DENSITY,
            'Masonry density',
            'kg/m³'
        );
    }
    
    if (thickness !== undefined) {
        validateRange(
            thickness,
            VALID_RANGES.MASONRY.MIN_THICKNESS,
            VALID_RANGES.MASONRY.MAX_THICKNESS,
            'Masonry thickness'
        );
    }
    
    if (height !== undefined) {
        validateRange(
            height,
            VALID_RANGES.MASONRY.MIN_HEIGHT,
            VALID_RANGES.MASONRY.MAX_HEIGHT,
            'Masonry height'
        );
    }
};

/**
 * Validates bracket parameters
 * @throws Error if validation fails
 */
export const validateBracket = (
    height?: number,
    projection?: number,
    thickness?: number
): void => {
    if (height !== undefined) {
        validateRange(
            height,
            VALID_RANGES.BRACKET.MIN_HEIGHT,
            VALID_RANGES.BRACKET.MAX_HEIGHT,
            'Bracket height'
        );
    }
    
    if (projection !== undefined) {
        validateRange(
            projection,
            VALID_RANGES.BRACKET.MIN_PROJECTION,
            VALID_RANGES.BRACKET.MAX_PROJECTION,
            'Bracket projection'
        );
    }
    
    if (thickness !== undefined) {
        validateEnum(
            thickness,
            VALID_RANGES.BRACKET.VALID_THICKNESSES,
            'Bracket thickness'
        );
    }
};

/**
 * Validates angle parameters
 * @throws Error if validation fails
 */
export const validateAngle = (
    verticalLeg?: number,
    horizontalLeg?: number,
    thickness?: number
): void => {
    if (verticalLeg !== undefined) {
        validateRange(
            verticalLeg,
            VALID_RANGES.ANGLE.MIN_LEG,
            VALID_RANGES.ANGLE.MAX_LEG,
            'Angle vertical leg'
        );
    }
    
    if (horizontalLeg !== undefined) {
        validateRange(
            horizontalLeg,
            VALID_RANGES.ANGLE.MIN_LEG,
            VALID_RANGES.ANGLE.MAX_LEG,
            'Angle horizontal leg'
        );
    }
    
    if (thickness !== undefined) {
        validateEnum(
            thickness,
            VALID_RANGES.ANGLE.VALID_THICKNESSES,
            'Angle thickness'
        );
    }
}; 