import { type LoadingCalculationInputs } from '@/types/userInputs';

/**
 * Error messages for validation failures
 */
export const VALIDATION_ERRORS = {
    DENSITY_RANGE: 'Masonry density must be between 1000 and 3000 kg/m³',
    THICKNESS_RANGE: 'Masonry thickness must be between 50 and 500 mm',
    HEIGHT_RANGE: 'Masonry height must be between 1 and 10 m',
    NEGATIVE_VALUE: 'Values cannot be negative',
    REQUIRED_FIELD: 'Required field is missing',
} as const;

/**
 * Validates masonry density is within acceptable range
 * @throws Error if density is invalid
 */
export const validateDensity = (density: number): void => {
    if (density < 1000 || density > 3000) {
        throw new Error(VALIDATION_ERRORS.DENSITY_RANGE);
    }
};

/**
 * Validates masonry thickness is within acceptable range
 * @throws Error if thickness is invalid
 */
export const validateThickness = (thickness: number): void => {
    if (thickness < 50 || thickness > 500) {
        throw new Error(VALIDATION_ERRORS.THICKNESS_RANGE);
    }
};

/**
 * Validates masonry height is within acceptable range
 * @throws Error if height is invalid
 */
export const validateHeight = (height: number): void => {
    if (height < 1 || height > 10) {
        throw new Error(VALIDATION_ERRORS.HEIGHT_RANGE);
    }
};

/**
 * Validates that a value is not negative
 * @throws Error if value is negative
 */
export const validateNonNegative = (value: number, fieldName: string): void => {
    if (value < 0) {
        throw new Error(`${fieldName}: ${VALIDATION_ERRORS.NEGATIVE_VALUE}`);
    }
};

/**
 * Validates loading calculation inputs
 * @throws Error if any inputs are invalid
 */
export const validateLoadingInputs = (inputs: LoadingCalculationInputs): void => {
    // If characteristic_load is provided, validate only that and bracket_centres if present
    if (inputs.characteristic_load !== undefined) {
        if (inputs.characteristic_load <= 0) {
            throw new Error('Characteristic load must be greater than 0');
        }
        
        if (inputs.bracket_centres !== undefined) {
            validateBracketCentres(inputs.bracket_centres);
        }
        return;
    }

    // Otherwise validate masonry properties
    if (inputs.masonry_density <= 0) {
        throw new Error('Masonry density must be greater than 0');
    }

    if (inputs.masonry_thickness <= 0) {
        throw new Error('Masonry thickness must be greater than 0');
    }

    if (inputs.masonry_height <= 0 || inputs.masonry_height > 10) {
        throw new Error('Masonry height must be between 0 and 10 meters');
    }

    if (inputs.bracket_centres !== undefined) {
        validateBracketCentres(inputs.bracket_centres);
    }
};

/**
 * Validates bracket centres are within acceptable range
 */
const validateBracketCentres = (centres: number): void => {
    if (centres < 200 || centres > 600) {
        throw new Error('Bracket centres must be between 200mm and 600mm');
    }
}; 