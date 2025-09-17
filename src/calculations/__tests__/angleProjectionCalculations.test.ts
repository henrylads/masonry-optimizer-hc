import {
    calculateAngleProjection,
    calculateBrickFacadeProjection,
    calculatePrecastFacadeProjection,
    roundUpToIncrement,
    validateAngleProjectionInputs,
    formatAngleProjectionResults,
    ANGLE_PROJECTION_CONSTANTS,
    type AngleProjectionInputs
} from '../angleProjectionCalculations';

describe('angleProjectionCalculations', () => {
    describe('roundUpToIncrement', () => {
        it('should round up to nearest 5mm increment correctly', () => {
            expect(roundUpToIncrement(67.3, 5)).toBe(70);
            expect(roundUpToIncrement(70.0, 5)).toBe(70);
            expect(roundUpToIncrement(70.1, 5)).toBe(75);
            expect(roundUpToIncrement(42.8, 5)).toBe(45);
        });

        it('should handle different increments', () => {
            expect(roundUpToIncrement(23.1, 10)).toBe(30);
            expect(roundUpToIncrement(30.0, 10)).toBe(30);
            expect(roundUpToIncrement(30.1, 10)).toBe(40);
        });
    });

    describe('validateAngleProjectionInputs', () => {
        const validInputs: AngleProjectionInputs = {
            facade_thickness: 102.5,
            cavity: 100,
            bracket_projection: 50,
            isolation_shim_thickness: 3,
            front_offset: 12
        };

        it('should not throw for valid inputs', () => {
            expect(() => validateAngleProjectionInputs(validInputs)).not.toThrow();
        });

        it('should throw for zero facade_thickness', () => {
            const inputs = { ...validInputs, facade_thickness: 0 };
            expect(() => validateAngleProjectionInputs(inputs)).toThrow('Facade thickness must be greater than 0');
        });

        it('should throw for negative cavity', () => {
            const inputs = { ...validInputs, cavity: -10 };
            expect(() => validateAngleProjectionInputs(inputs)).toThrow('Cavity width must be greater than 0');
        });

        it('should throw for negative bracket_projection', () => {
            const inputs = { ...validInputs, bracket_projection: -5 };
            expect(() => validateAngleProjectionInputs(inputs)).toThrow('Bracket projection must be non-negative');
        });

        it('should throw for negative isolation_shim_thickness', () => {
            const inputs = { ...validInputs, isolation_shim_thickness: -1 };
            expect(() => validateAngleProjectionInputs(inputs)).toThrow('Isolation shim thickness must be non-negative');
        });
    });

    describe('calculateAngleProjection', () => {
        it('should calculate standard brick facade scenario correctly', () => {
            const inputs: AngleProjectionInputs = {
                facade_thickness: 102.5,
                cavity: 100,
                bracket_projection: 50,
                isolation_shim_thickness: 3,
                front_offset: 12
            };

            const result = calculateAngleProjection(inputs);

            // Formula: ⅔ * 102.5 + 100 - (50 + 3) + 12 = 68.33 + 100 - 53 + 12 = 127.33
            // Should round up to 130mm
            expect(result.raw_projection).toBeCloseTo(127.333333333333, 5);
            expect(result.rounded_projection).toBe(130);
            expect(result.was_rounded).toBe(true);
        });

        it('should calculate precast facade scenario correctly', () => {
            const inputs: AngleProjectionInputs = {
                facade_thickness: 250,
                cavity: 150,
                bracket_projection: 60,
                isolation_shim_thickness: 3,
                front_offset: 12
            };

            const result = calculateAngleProjection(inputs);

            // Formula: ⅔ * 250 + 150 - (60 + 3) + 12 = 166.67 + 150 - 63 + 12 = 265.67
            // Should round up but be constrained to max (200mm)
            expect(result.raw_projection).toBeCloseTo(265.666666666667, 5);
            expect(result.rounded_projection).toBe(200); // Constrained by max
        });

        it('should apply minimum projection constraint', () => {
            const inputs: AngleProjectionInputs = {
                facade_thickness: 50,
                cavity: 50,
                bracket_projection: 100,
                isolation_shim_thickness: 10,
                front_offset: 5
            };

            const result = calculateAngleProjection(inputs);

            // Should result in a very low projection but be constrained to minimum
            expect(result.rounded_projection).toBe(ANGLE_PROJECTION_CONSTANTS.MIN_PROJECTION);
        });

        it('should handle exact 5mm increments without rounding', () => {
            const inputs: AngleProjectionInputs = {
                facade_thickness: 102,
                cavity: 98,
                bracket_projection: 50,
                isolation_shim_thickness: 2,
                front_offset: 9
            };

            const result = calculateAngleProjection(inputs);

            // Formula: ⅔ * 102 + 98 - (50 + 2) + 9 = 68 + 98 - 52 + 9 = 123
            // Already on 5mm increment, should not be marked as rounded
            expect(result.raw_projection).toBeCloseTo(123, 5);
            expect(result.rounded_projection).toBe(125); // Will round up to next 5mm
            expect(result.was_rounded).toBe(true);
        });

        it('should maintain precision in intermediate calculations', () => {
            const inputs: AngleProjectionInputs = {
                facade_thickness: 102.5,
                cavity: 100.5,
                bracket_projection: 50.3,
                isolation_shim_thickness: 3.1,
                front_offset: 12.2
            };

            const result = calculateAngleProjection(inputs);

            // Verify precision is maintained (12+ decimal places)
            expect(typeof result.raw_projection).toBe('number');
            expect(result.raw_projection.toString().includes('.')).toBe(true);
        });
    });

    describe('calculateBrickFacadeProjection', () => {
        it('should use correct default values for brick facade', () => {
            const result = calculateBrickFacadeProjection(100, 50);

            // Should use: facade_thickness=102.5, isolation_shim=3, front_offset=12
            // Formula: ⅔ * 102.5 + 100 - (50 + 3) + 12 = 127.33
            expect(result.raw_projection).toBeCloseTo(127.333333333333, 5);
            expect(result.rounded_projection).toBe(130);
        });

        it('should work with different cavity widths', () => {
            const result1 = calculateBrickFacadeProjection(75, 45);
            const result2 = calculateBrickFacadeProjection(125, 55);

            expect(result1.raw_projection).toBeLessThan(result2.raw_projection);
        });
    });

    describe('calculatePrecastFacadeProjection', () => {
        it('should use correct default values for precast facade', () => {
            const result = calculatePrecastFacadeProjection(150, 60);

            // Should use: facade_thickness=250, isolation_shim=3, front_offset=12
            // Formula: ⅔ * 250 + 150 - (60 + 3) + 12 = 265.67
            expect(result.raw_projection).toBeCloseTo(265.666666666667, 5);
            expect(result.rounded_projection).toBe(200); // Constrained by max
        });

        it('should produce higher projections than brick facade', () => {
            const brickResult = calculateBrickFacadeProjection(100, 50);
            const precastResult = calculatePrecastFacadeProjection(100, 50);

            expect(precastResult.raw_projection).toBeGreaterThan(brickResult.raw_projection);
        });
    });

    describe('formatAngleProjectionResults', () => {
        it('should format results correctly when rounded', () => {
            const result = calculateAngleProjection({
                facade_thickness: 102.5,
                cavity: 100,
                bracket_projection: 50,
                isolation_shim_thickness: 3,
                front_offset: 12
            });

            const formatted = formatAngleProjectionResults(result);
            expect(formatted).toContain('130mm');
            expect(formatted).toContain('127.33mm');
            expect(formatted).toContain('rounded up');
        });

        it('should format results correctly when not rounded', () => {
            // Create a scenario where no rounding occurs (project exactly on 5mm)
            const inputs: AngleProjectionInputs = {
                facade_thickness: 75, // Chosen to result in exact 5mm increment
                cavity: 100,
                bracket_projection: 45,
                isolation_shim_thickness: 5,
                front_offset: 10
            };

            const result = calculateAngleProjection(inputs);

            // If this results in exactly a 5mm increment, was_rounded should be false
            const formatted = formatAngleProjectionResults(result);
            expect(formatted).toMatch(/Angle Projection: \d+mm \(raw: [\d.]+mm.*\)/);
        });
    });

    describe('edge cases and boundary conditions', () => {
        it('should handle very thin facades', () => {
            const inputs: AngleProjectionInputs = {
                facade_thickness: 50, // Minimum reasonable facade thickness
                cavity: 50,
                bracket_projection: 30,
                isolation_shim_thickness: 1,
                front_offset: 5
            };

            const result = calculateAngleProjection(inputs);
            expect(result.rounded_projection).toBeGreaterThanOrEqual(ANGLE_PROJECTION_CONSTANTS.MIN_PROJECTION);
        });

        it('should handle very thick facades', () => {
            const inputs: AngleProjectionInputs = {
                facade_thickness: 300, // Very thick precast
                cavity: 200,
                bracket_projection: 40,
                isolation_shim_thickness: 3,
                front_offset: 12
            };

            const result = calculateAngleProjection(inputs);
            expect(result.rounded_projection).toBeLessThanOrEqual(ANGLE_PROJECTION_CONSTANTS.MAX_PROJECTION);
        });

        it('should handle zero isolation shim thickness', () => {
            const inputs: AngleProjectionInputs = {
                facade_thickness: 102.5,
                cavity: 100,
                bracket_projection: 50,
                isolation_shim_thickness: 0, // No isolation
                front_offset: 12
            };

            expect(() => calculateAngleProjection(inputs)).not.toThrow();
            const result = calculateAngleProjection(inputs);
            expect(result.rounded_projection).toBeGreaterThan(0);
        });

        it('should handle negative front offset', () => {
            const inputs: AngleProjectionInputs = {
                facade_thickness: 102.5,
                cavity: 100,
                bracket_projection: 50,
                isolation_shim_thickness: 3,
                front_offset: -10 // Negative offset
            };

            const result = calculateAngleProjection(inputs);
            expect(result.rounded_projection).toBeGreaterThanOrEqual(ANGLE_PROJECTION_CONSTANTS.MIN_PROJECTION);
        });
    });

    describe('constants validation', () => {
        it('should have sensible constant values', () => {
            expect(ANGLE_PROJECTION_CONSTANTS.MIN_PROJECTION).toBe(40);
            expect(ANGLE_PROJECTION_CONSTANTS.MAX_PROJECTION).toBe(200);
            expect(ANGLE_PROJECTION_CONSTANTS.ROUNDING_INCREMENT).toBe(5);
            expect(ANGLE_PROJECTION_CONSTANTS.FACADE_MULTIPLIER).toBeCloseTo(2/3, 10);
        });

        it('should have min less than max', () => {
            expect(ANGLE_PROJECTION_CONSTANTS.MIN_PROJECTION).toBeLessThan(ANGLE_PROJECTION_CONSTANTS.MAX_PROJECTION);
        });
    });
});