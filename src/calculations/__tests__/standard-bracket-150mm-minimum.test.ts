/**
 * Test: Standard Bracket 150mm Minimum Height Enforcement
 *
 * Date: 2025-01-01
 *
 * Purpose: Validates that standard brackets enforce a 150mm minimum height
 *
 * Issue: Support level -75mm was producing "No valid design found" because:
 * 1. Standard bracket calculation: |−75| - 75 + 40 = 40mm
 * 2. 40mm is structurally insufficient (fails moment, shear, deflection checks)
 * 3. Brute force bound assumed 150mm minimum but actual calculation didn't enforce it
 *
 * Fix: Added STANDARD_BRACKET_MIN_HEIGHT: 150 constant and enforcement logic
 *
 * Expected Results:
 * - Support level -75mm should use Standard bracket type
 * - Bracket height should be at least 150mm (not 40mm)
 * - System should find valid designs that pass all verification checks
 */

import {
    calculateStandardBracketHeightWithExtension,
    calculateStandardBracketHeight
} from '../bracketCalculations';
import {
    determineBracketType,
    getValidAngleOrientations,
    BRACKET_ANGLE_CONSTANTS
} from '../bracketAngleSelection';

describe('Standard Bracket 150mm Minimum Height', () => {
    const SUPPORT_LEVEL = -75; // mm (exactly at boundary)
    const TOP_CRITICAL_EDGE = 75; // mm
    const DISTANCE_FROM_TOP_TO_FIXING = 40; // mm (Y constant)

    test('Support level -75mm should use Standard bracket type', () => {
        const bracketType = determineBracketType(SUPPORT_LEVEL);
        expect(bracketType).toBe('Standard');
    });

    test('Support level -75mm should use Inverted angle orientation', () => {
        const validOrientations = getValidAngleOrientations(SUPPORT_LEVEL);
        expect(validOrientations).toEqual(['Inverted']);
    });

    test('STANDARD_BRACKET_MIN_HEIGHT constant should be 150mm', () => {
        expect(BRACKET_ANGLE_CONSTANTS.STANDARD_BRACKET_MIN_HEIGHT).toBe(150);
    });

    test('Raw calculation would produce 40mm (too small)', () => {
        // This is what the calculation would produce WITHOUT the minimum enforcement
        const rawHeight = Math.abs(SUPPORT_LEVEL) - TOP_CRITICAL_EDGE + DISTANCE_FROM_TOP_TO_FIXING;
        expect(rawHeight).toBe(40);
    });

    test('calculateStandardBracketHeight should enforce 150mm minimum', () => {
        const height = calculateStandardBracketHeight(
            SUPPORT_LEVEL,
            TOP_CRITICAL_EDGE,
            DISTANCE_FROM_TOP_TO_FIXING
        );

        // Should be 150mm (enforced minimum), not 40mm (raw calculation)
        expect(height).toBeGreaterThanOrEqual(150);
        expect(height).toBe(150); // Exactly 150mm for this case
    });

    test('calculateStandardBracketHeightWithExtension should enforce 150mm minimum', () => {
        const result = calculateStandardBracketHeightWithExtension({
            support_level: SUPPORT_LEVEL,
            top_critical_edge: TOP_CRITICAL_EDGE,
            distance_from_top_to_fixing: DISTANCE_FROM_TOP_TO_FIXING,
            slab_thickness: 250,
            fixing_position: TOP_CRITICAL_EDGE,
            enable_angle_extension: false
        });

        // Should be 150mm (enforced minimum), not 40mm (raw calculation)
        expect(result.bracket_height).toBeGreaterThanOrEqual(150);
        expect(result.bracket_height).toBe(150); // Exactly 150mm for this case
    });

    test('Standard bracket minimum (150mm) should be less than inverted bracket minimum (170mm)', () => {
        // Standard brackets have a lower minimum than inverted brackets
        expect(BRACKET_ANGLE_CONSTANTS.STANDARD_BRACKET_MIN_HEIGHT).toBe(150);
        expect(BRACKET_ANGLE_CONSTANTS.INVERTED_BRACKET_MIN_HEIGHT).toBe(170);
        expect(BRACKET_ANGLE_CONSTANTS.STANDARD_BRACKET_MIN_HEIGHT).toBeLessThan(
            BRACKET_ANGLE_CONSTANTS.INVERTED_BRACKET_MIN_HEIGHT
        );
    });

    test('Support levels near -75mm should also enforce 150mm minimum', () => {
        const testCases = [
            { level: -75, expectedMin: 150, description: 'Exactly at boundary' },
            { level: -80, expectedMin: 150, description: 'Just below boundary' },
            { level: -100, expectedMin: 150, description: 'Further below boundary' },
        ];

        testCases.forEach(({ level, expectedMin, description }) => {
            const height = calculateStandardBracketHeight(
                level,
                TOP_CRITICAL_EDGE,
                DISTANCE_FROM_TOP_TO_FIXING
            );

            expect(height).toBeGreaterThanOrEqual(expectedMin);
            console.log(`${description} (${level}mm): ${height}mm`);
        });
    });

    test('Standard bracket calculations should match brute force bound assumptions', () => {
        // The brute force bound calculation uses: Math.max(150, |support_level| - fixingPosition + Y)
        // This test ensures our actual calculation matches that assumption

        const fixingPosition = 75;
        const Y = 40;

        // Brute force bound for -75mm
        const bruteForceAssumption = Math.max(150, Math.abs(SUPPORT_LEVEL) - fixingPosition + Y);
        expect(bruteForceAssumption).toBe(150);

        // Actual calculation should match
        const actualHeight = calculateStandardBracketHeight(
            SUPPORT_LEVEL,
            TOP_CRITICAL_EDGE,
            DISTANCE_FROM_TOP_TO_FIXING,
            fixingPosition
        );

        expect(actualHeight).toBe(bruteForceAssumption);
    });
});

console.log('✅ Standard Bracket 150mm Minimum Height Tests Complete');
