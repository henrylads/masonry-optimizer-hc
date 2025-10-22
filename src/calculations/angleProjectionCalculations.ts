import { roundToTwelveDecimals } from '@/utils/precision';

/**
 * Interface for angle projection calculation inputs
 */
export interface AngleProjectionInputs {
    /** Facade thickness (mm) */
    facade_thickness: number;
    /** Cavity width (mm) */
    cavity: number;
    /** Bracket projection (mm) */
    bracket_projection: number;
    /** Isolation shim thickness (mm) - defaults to 3mm */
    isolation_shim_thickness: number;
    /** Front offset distance (mm) - defaults to 12mm */
    front_offset: number;
}

/**
 * Interface for angle projection calculation results
 */
export interface AngleProjectionResults {
    /** Raw calculated projection (mm) */
    raw_projection: number;
    /** Rounded projection to nearest 5mm increment (mm) */
    rounded_projection: number;
    /** Whether projection was rounded up */
    was_rounded: boolean;
    /** Minimum allowable projection (mm) */
    min_projection: number;
    /** Maximum allowable projection (mm) */
    max_projection: number;
}

/**
 * Constants for angle projection calculations
 */
export const ANGLE_PROJECTION_CONSTANTS = {
    /** Minimum allowable projection (mm) */
    MIN_PROJECTION: 40,
    /** Maximum allowable projection (mm) */
    MAX_PROJECTION: 200,
    /** Rounding increment (mm) */
    ROUNDING_INCREMENT: 5,
    /** Facade thickness multiplier for load position calculation */
    FACADE_MULTIPLIER: 2/3
} as const;

/**
 * Rounds a value up to the nearest specified increment
 * @param value The value to round
 * @param increment The increment to round to
 * @returns The rounded value
 */
export function roundUpToIncrement(value: number, increment: number): number {
    return Math.ceil(value / increment) * increment;
}

/**
 * Validates angle projection inputs
 * @param inputs The angle projection inputs to validate
 * @throws Error if inputs are invalid
 */
export function validateAngleProjectionInputs(inputs: AngleProjectionInputs): void {
    if (!inputs.facade_thickness || inputs.facade_thickness <= 0) {
        throw new Error(`Facade thickness must be greater than 0 (received: ${inputs.facade_thickness})`);
    }
    if (!inputs.cavity || inputs.cavity <= 0) {
        throw new Error(`Cavity width must be greater than 0 (received: ${inputs.cavity})`);
    }
    if (inputs.bracket_projection < 0) {
        throw new Error(`Bracket projection must be non-negative (received: ${inputs.bracket_projection})`);
    }
    if (inputs.isolation_shim_thickness < 0) {
        throw new Error(`Isolation shim thickness must be non-negative (received: ${inputs.isolation_shim_thickness})`);
    }
}

/**
 * Calculates the angle projection based on facade configuration
 * Formula: ⅔ * facade_thickness + cavity - (bracket_projection + isolation_shim_thickness) + front_offset
 * Result is rounded up to the nearest 5mm increment
 *
 * @param inputs Input parameters for angle projection calculation
 * @returns Angle projection calculation results
 */
export function calculateAngleProjection(inputs: AngleProjectionInputs): AngleProjectionResults {
    // Validate inputs
    validateAngleProjectionInputs(inputs);

    console.log('\n=== ANGLE PROJECTION CALCULATION DEBUG ===');
    console.log('Input Parameters:');
    console.log('  facade_thickness:', inputs.facade_thickness, 'mm');
    console.log('  cavity:', inputs.cavity, 'mm');
    console.log('  bracket_projection:', inputs.bracket_projection, 'mm');
    console.log('  isolation_shim_thickness:', inputs.isolation_shim_thickness, 'mm');
    console.log('  front_offset:', inputs.front_offset, 'mm');

    // Calculate components
    const two_thirds_facade = ANGLE_PROJECTION_CONSTANTS.FACADE_MULTIPLIER * inputs.facade_thickness;
    const bracket_plus_shim = inputs.bracket_projection + inputs.isolation_shim_thickness;

    console.log('\nFormula Components:');
    console.log('  ⅔ × facade_thickness =', `⅔ × ${inputs.facade_thickness} =`, two_thirds_facade, 'mm');
    console.log('  cavity =', inputs.cavity, 'mm');
    console.log('  (bracket_projection + isolation_shim_thickness) =', `(${inputs.bracket_projection} + ${inputs.isolation_shim_thickness}) =`, bracket_plus_shim, 'mm');
    console.log('  front_offset =', inputs.front_offset, 'mm');

    // Calculate raw projection using the formula
    // ⅔ * facade_thickness + cavity - (bracket_projection + isolation_shim_thickness) + front_offset
    const raw_projection = roundToTwelveDecimals(
        two_thirds_facade +
        inputs.cavity -
        bracket_plus_shim +
        inputs.front_offset
    );

    console.log('\nFormula Calculation:');
    console.log('  Horizontal Leg = ⅔×facade_thickness + cavity - (bracket_projection + isolation_shim_thickness) + front_offset');
    console.log('  Horizontal Leg =', two_thirds_facade, '+', inputs.cavity, '-', bracket_plus_shim, '+', inputs.front_offset);
    console.log('  Horizontal Leg =', `${two_thirds_facade} + ${inputs.cavity} - ${bracket_plus_shim} + ${inputs.front_offset}`);
    console.log('  Horizontal Leg =', raw_projection, 'mm (raw)');

    // Round up to nearest 5mm increment
    const rounded_projection = roundUpToIncrement(raw_projection, ANGLE_PROJECTION_CONSTANTS.ROUNDING_INCREMENT);

    console.log('\nRounding to 5mm Increment:');
    console.log('  Math.ceil(' + raw_projection + ' / 5) × 5 =', 'Math.ceil(' + (raw_projection / 5) + ') × 5 =', Math.ceil(raw_projection / 5) + ' × 5 =', rounded_projection, 'mm');

    // Determine if rounding occurred
    const was_rounded = Math.abs(rounded_projection - raw_projection) > 0.001;

    console.log('  Was rounded up:', was_rounded);

    // Apply min/max constraints
    const constrained_projection = Math.max(
        ANGLE_PROJECTION_CONSTANTS.MIN_PROJECTION,
        Math.min(rounded_projection, ANGLE_PROJECTION_CONSTANTS.MAX_PROJECTION)
    );

    if (constrained_projection !== rounded_projection) {
        console.log('  Applied constraints: clamped to', constrained_projection, 'mm (min:', ANGLE_PROJECTION_CONSTANTS.MIN_PROJECTION, ', max:', ANGLE_PROJECTION_CONSTANTS.MAX_PROJECTION, ')');
    }

    console.log('\n=== ANGLE PROJECTION RESULTS ===');
    console.log('  Raw Horizontal Leg:', raw_projection, 'mm');
    console.log('  Rounded Horizontal Leg:', constrained_projection, 'mm');
    console.log('=== END ANGLE PROJECTION DEBUG ===\n');

    return {
        raw_projection,
        rounded_projection: constrained_projection,
        was_rounded,
        min_projection: ANGLE_PROJECTION_CONSTANTS.MIN_PROJECTION,
        max_projection: ANGLE_PROJECTION_CONSTANTS.MAX_PROJECTION
    };
}

/**
 * Calculates angle projection for a standard brick facade scenario
 * Uses typical values: facade_thickness=102.5mm, isolation_shim=3mm, front_offset=12mm
 *
 * @param cavity_width Cavity width in mm
 * @param bracket_projection Bracket projection in mm
 * @returns Angle projection calculation results
 */
export function calculateBrickFacadeProjection(
    cavity_width: number,
    bracket_projection: number
): AngleProjectionResults {
    return calculateAngleProjection({
        facade_thickness: 102.5,
        cavity: cavity_width,
        bracket_projection,
        isolation_shim_thickness: 3,
        front_offset: 12
    });
}

/**
 * Calculates angle projection for a precast facade scenario
 * Uses typical values: facade_thickness=250mm, isolation_shim=3mm, front_offset=12mm
 *
 * @param cavity_width Cavity width in mm
 * @param bracket_projection Bracket projection in mm
 * @returns Angle projection calculation results
 */
export function calculatePrecastFacadeProjection(
    cavity_width: number,
    bracket_projection: number
): AngleProjectionResults {
    return calculateAngleProjection({
        facade_thickness: 250,
        cavity: cavity_width,
        bracket_projection,
        isolation_shim_thickness: 3,
        front_offset: 12
    });
}

/**
 * Formats angle projection results for display or logging
 * @param results The angle projection results to format
 * @returns Formatted string representation
 */
export function formatAngleProjectionResults(results: AngleProjectionResults): string {
    return `Angle Projection: ${results.rounded_projection}mm (raw: ${results.raw_projection.toFixed(2)}mm${results.was_rounded ? ', rounded up' : ''})`;
}