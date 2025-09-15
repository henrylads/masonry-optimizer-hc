import { calculateBracketParameters } from '../bracketCalculations';
import { roundToTwelveDecimals } from '../../utils/precision';
import { numbersEqualToFiveDecimals } from '../../utils/test-helpers';

describe('Bracket Calculations', () => {
    describe('calculateBracketParameters', () => {
        it('calculates design cavity correctly', () => {
            const inputs = {
                cavity: 200 // Example from project overview
            };

            const result = calculateBracketParameters(inputs);
            const expected_design_cavity = roundToTwelveDecimals(220); // 200 + 20

            expect(numbersEqualToFiveDecimals(result.design_cavity, expected_design_cavity)).toBe(true);
        });

        it('maintains precision requirements', () => {
            const inputs = {
                cavity: 187.654321 // Test with many decimal places
            };

            const result = calculateBracketParameters(inputs);
            const raw_result = 187.654321 + 20;
            const expected = roundToTwelveDecimals(raw_result);

            expect(numbersEqualToFiveDecimals(result.design_cavity, expected)).toBe(true);
        });

        it('handles zero cavity', () => {
            const inputs = {
                cavity: 0
            };

            const result = calculateBracketParameters(inputs);
            expect(result.design_cavity).toBe(20);
        });

        it('handles negative cavity (edge case)', () => {
            const inputs = {
                cavity: -10
            };

            const result = calculateBracketParameters(inputs);
            expect(result.design_cavity).toBe(10); // -10 + 20
        });
    });
}); 