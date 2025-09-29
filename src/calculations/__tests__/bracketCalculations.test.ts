import { calculateBracketParameters, calculateInvertedBracketHeight } from '../bracketCalculations';
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

    describe('calculateInvertedBracketHeight', () => {
        it('computes inverted bracket geometry using vertical leg height', () => {
            const topCriticalEdge = 75;
            const bottomCriticalEdge = 125;
            const result = calculateInvertedBracketHeight({
                support_level: 0,
                angle_thickness: 5,
                vertical_leg: 60,
                top_critical_edge: topCriticalEdge,
                bottom_critical_edge: bottomCriticalEdge,
                slab_thickness: 200,
                fixing_position: topCriticalEdge
            });

            expect(result.height_above_ssl).toBe(55);
            expect(result.height_below_ssl).toBe(210);
            expect(result.bracket_height).toBe(265);
            expect(result.rise_to_bolts).toBe(135);
            expect(result.drop_below_slab).toBe(10);
            expect(result.extension_below_slab).toBe(10);

            // Geometry consistency checks
            expect(result.height_below_ssl).toBe(topCriticalEdge + bottomCriticalEdge + result.extension_below_slab);
            expect(result.bracket_height).toBe(result.height_above_ssl + result.height_below_ssl);
            expect(result.rise_to_bolts).toBe(result.extension_below_slab + bottomCriticalEdge);
        });
    });
});
