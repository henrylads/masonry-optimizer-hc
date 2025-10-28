import {
    calculateMathematicalModel,
    createMathematicalModelInputs,
    type MathematicalModelInputs
} from '../mathematicalModelCalculations';
import { MaterialType, LOAD_POSITION_DEFAULTS } from '@/types/userInputs';

describe('Mathematical Model Calculations with Load Position', () => {
    describe('calculateMathematicalModel with dynamic load position', () => {
        const baseParams: MathematicalModelInputs = {
            M: 102.5, // For backward compatibility
            d: 50,
            T: 5,
            R: 5,
            L_bearing: 100,
            A: 200
        };

        it('should use M/3 for backward compatibility when no facade_thickness or load_position provided', () => {
            const result = calculateMathematicalModel(baseParams);

            // Should use M/3 = 102.5/3 = 34.1666667
            expect(result.Ecc).toBeCloseTo(34.1666666667, 10);
        });

        it('should use facade_thickness * load_position when both provided', () => {
            const params: MathematicalModelInputs = {
                ...baseParams,
                facade_thickness: 150,
                load_position: 0.5
            };

            const result = calculateMathematicalModel(params);

            // Should use 150 * 0.5 = 75
            expect(result.Ecc).toBeCloseTo(75, 10);
        });

        it('should use facade_thickness with default load_position when only facade_thickness provided', () => {
            const params: MathematicalModelInputs = {
                ...baseParams,
                facade_thickness: 150
                // load_position not provided, should default to 1/3
            };

            const result = calculateMathematicalModel(params);

            // Should use 150 * (1/3) = 50
            expect(result.Ecc).toBeCloseTo(50, 10);
        });

        it('should use M * load_position when only load_position provided', () => {
            const params: MathematicalModelInputs = {
                ...baseParams,
                load_position: 0.4
                // facade_thickness not provided, should use M
            };

            const result = calculateMathematicalModel(params);

            // Should use 102.5 * 0.4 = 41
            expect(result.Ecc).toBeCloseTo(41, 10);
        });

        it('should prioritize facade_thickness over M when both provided', () => {
            const params: MathematicalModelInputs = {
                ...baseParams,
                M: 100,
                facade_thickness: 200,
                load_position: 0.5
            };

            const result = calculateMathematicalModel(params);

            // Should use facade_thickness: 200 * 0.5 = 100 (not M * load_position = 100 * 0.5 = 50)
            expect(result.Ecc).toBeCloseTo(100, 10);
        });

        describe('material-based load positions', () => {
            it('should calculate correctly for brick material (1/3 load position)', () => {
                const params: MathematicalModelInputs = {
                    ...baseParams,
                    facade_thickness: 102.5,
                    load_position: LOAD_POSITION_DEFAULTS[MaterialType.BRICK]
                };

                const result = calculateMathematicalModel(params);

                // Should use 102.5 * (1/3) = 34.1666667
                expect(result.Ecc).toBeCloseTo(34.1666666667, 10);
            });

            it('should calculate correctly for precast material (1/2 load position)', () => {
                const params: MathematicalModelInputs = {
                    ...baseParams,
                    facade_thickness: 250,
                    load_position: LOAD_POSITION_DEFAULTS[MaterialType.PRECAST]
                };

                const result = calculateMathematicalModel(params);

                // Should use 250 * (1/2) = 125
                expect(result.Ecc).toBeCloseTo(125, 10);
            });

            it('should calculate correctly for stone material (1/2 load position)', () => {
                const params: MathematicalModelInputs = {
                    ...baseParams,
                    facade_thickness: 200,
                    load_position: LOAD_POSITION_DEFAULTS[MaterialType.STONE]
                };

                const result = calculateMathematicalModel(params);

                // Should use 200 * (1/2) = 100
                expect(result.Ecc).toBeCloseTo(100, 10);
            });
        });

        it('should maintain precision in eccentricity calculation', () => {
            const params: MathematicalModelInputs = {
                ...baseParams,
                facade_thickness: 102.5,
                load_position: 1/3 // Exact fraction
            };

            const result = calculateMathematicalModel(params);

            // Should maintain 12+ decimal precision
            expect(result.Ecc.toString().split('.')[1]?.length || 0).toBeGreaterThanOrEqual(10);
        });

        it('should propagate new eccentricity through all calculations', () => {
            const params1: MathematicalModelInputs = {
                ...baseParams,
                facade_thickness: 100,
                load_position: 0.2 // Eccentricity = 20
            };

            const params2: MathematicalModelInputs = {
                ...baseParams,
                facade_thickness: 100,
                load_position: 0.8 // Eccentricity = 80
            };

            const result1 = calculateMathematicalModel(params1);
            const result2 = calculateMathematicalModel(params2);

            // Different eccentricities should produce different 'a' and 'b' values
            expect(result1.Ecc).toBeCloseTo(20, 10);
            expect(result2.Ecc).toBeCloseTo(80, 10);
            expect(result1.a).not.toBeCloseTo(result2.a, 5);
            expect(result1.b).not.toBeCloseTo(result2.b, 5);
        });
    });

    describe('createMathematicalModelInputs with new parameters', () => {
        const mockAngleInputs = {
            C: 100,
            D: 50,
            S: 3,
            T: 5,
            B: 80,
            B_cc: 300
        };

        it('should include facade_thickness and load_position when provided', () => {
            const result = createMathematicalModelInputs(
                mockAngleInputs,
                102.5,
                200,
                150, // facade_thickness
                0.4  // load_position
            );

            expect(result.facade_thickness).toBe(150);
            expect(result.load_position).toBe(0.4);
            expect(result.M).toBe(102.5); // Backward compatibility
        });

        it('should work without facade_thickness and load_position for backward compatibility', () => {
            const result = createMathematicalModelInputs(
                mockAngleInputs,
                102.5,
                200
            );

            expect(result.facade_thickness).toBeUndefined();
            expect(result.load_position).toBeUndefined();
            expect(result.M).toBe(102.5);
        });

        it('should include only facade_thickness when load_position not provided', () => {
            const result = createMathematicalModelInputs(
                mockAngleInputs,
                102.5,
                200,
                175 // facade_thickness only
            );

            expect(result.facade_thickness).toBe(175);
            expect(result.load_position).toBeUndefined();
        });
    });

    describe('edge cases and boundary conditions', () => {
        const baseParams: MathematicalModelInputs = {
            M: 102.5,
            d: 50,
            T: 5,
            R: 5,
            L_bearing: 100,
            A: 200
        };

        it('should handle minimum load position (0.1)', () => {
            const params: MathematicalModelInputs = {
                ...baseParams,
                facade_thickness: 100,
                load_position: 0.1
            };

            const result = calculateMathematicalModel(params);
            expect(result.Ecc).toBeCloseTo(10, 10);
        });

        it('should handle maximum load position (0.9)', () => {
            const params: MathematicalModelInputs = {
                ...baseParams,
                facade_thickness: 100,
                load_position: 0.9
            };

            const result = calculateMathematicalModel(params);
            expect(result.Ecc).toBeCloseTo(90, 10);
        });

        it('should handle very thin facades', () => {
            const params: MathematicalModelInputs = {
                ...baseParams,
                facade_thickness: 50,
                load_position: 0.5
            };

            const result = calculateMathematicalModel(params);
            expect(result.Ecc).toBeCloseTo(25, 10);
        });

        it('should handle very thick facades', () => {
            const params: MathematicalModelInputs = {
                ...baseParams,
                facade_thickness: 300,
                load_position: 0.5
            };

            const result = calculateMathematicalModel(params);
            expect(result.Ecc).toBeCloseTo(150, 10);
        });

        it('should handle zero facade thickness gracefully (edge case)', () => {
            const params: MathematicalModelInputs = {
                ...baseParams,
                facade_thickness: 0,
                load_position: 0.5
            };

            const result = calculateMathematicalModel(params);
            expect(result.Ecc).toBeCloseTo(0, 10);
        });
    });

    describe('comparison with original M/3 approach', () => {
        const baseParams: MathematicalModelInputs = {
            M: 102.5,
            d: 50,
            T: 5,
            R: 5,
            L_bearing: 100,
            A: 200
        };

        it('should produce identical results when using M with 1/3 load position vs original M/3', () => {
            const originalResult = calculateMathematicalModel(baseParams);

            const newResult = calculateMathematicalModel({
                ...baseParams,
                facade_thickness: 102.5,
                load_position: 1/3
            });

            expect(originalResult.Ecc).toBeCloseTo(newResult.Ecc, 10);
            expect(originalResult.a).toBeCloseTo(newResult.a, 10);
            expect(originalResult.b).toBeCloseTo(newResult.b, 10);
            expect(originalResult.I).toBeCloseTo(newResult.I, 10);
        });

        it('should show difference when using different materials', () => {
            const brickResult = calculateMathematicalModel({
                ...baseParams,
                facade_thickness: 102.5,
                load_position: LOAD_POSITION_DEFAULTS[MaterialType.BRICK]
            });

            const precastResult = calculateMathematicalModel({
                ...baseParams,
                facade_thickness: 250,
                load_position: LOAD_POSITION_DEFAULTS[MaterialType.PRECAST]
            });

            // Different materials should produce different eccentricities
            expect(brickResult.Ecc).not.toBeCloseTo(precastResult.Ecc, 5);
        });
    });
});