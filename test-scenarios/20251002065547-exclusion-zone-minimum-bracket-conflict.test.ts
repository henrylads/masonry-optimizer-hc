/**
 * Test Scenario: Exclusion Zone + Minimum Bracket Height Conflict
 *
 * Date: October 2, 2025
 * Purpose: Verify that fixing positions are correctly filtered when exclusion zones
 *          would reduce bracket height below structural minimums
 *
 * User's Problem:
 * - Slab: 225mm
 * - Support level: -250mm (standard bracket)
 * - Exclusion zone: -225mm (at slab bottom, no extension below slab allowed)
 * - System incorrectly selected: Fixing 140mm, bracket 150mm (minimum)
 * - Issue: Exclusion zone reduces bracket by 25mm to 125mm (violates 150mm minimum!)
 *
 * Expected Behavior:
 * - Fixing positions that would cause this conflict should be filtered out
 * - System should select a shallower fixing position (e.g., 115mm) that allows 150mm minimum
 * - Or report "No valid design found" if all positions are invalid
 */

import { runBruteForce } from '@/calculations/bruteForceAlgorithm';
import { validateFixingPositionWithExclusionZone } from '@/calculations/angleExtensionCalculations';
import type { DesignInputs } from '@/types/designInputs';

describe('Exclusion Zone + Minimum Bracket Height Conflict', () => {
    // User's exact scenario
    const userScenarioInputs: DesignInputs = {
        slab_thickness: 225,
        cavity_width: 100,
        support_level: -250, // Standard bracket
        characteristic_load: 10,
        max_allowable_bracket_extension: -225, // At slab bottom
        enable_angle_extension: true,
        allowed_channel_types: ['CPRO38'], // Use specific channel to reduce combinations
        use_custom_fixing_position: false // Let system optimize
    };

    describe('Validation Helper Function', () => {
        test('Should identify invalid fixing position 140mm', () => {
            const validation = validateFixingPositionWithExclusionZone({
                fixing_position: 140,
                support_level: -250,
                slab_thickness: 225,
                max_allowable_bracket_extension: -225,
                bracket_type: 'Standard',
                angle_orientation: 'Standard',
                vertical_leg: 60
            });

            // Expected calculation for fixing 140mm:
            // Original bracket: |-250| - 140 + 40 = 150mm (with minimum enforcement)
            // Bracket bottom position: 140 + 150 - 40 = 250mm from slab top
            // Exclusion limit: 225mm from slab top
            // Limited bracket: 225 - 140 + 40 = 125mm
            // Violates 150mm minimum!

            expect(validation.isValid).toBe(false);
            expect(validation.limited_bracket_height).toBeLessThan(150);
            expect(validation.reason).toContain('below minimum');
        });

        test('Should identify valid fixing position 115mm', () => {
            const validation = validateFixingPositionWithExclusionZone({
                fixing_position: 115,
                support_level: -250,
                slab_thickness: 225,
                max_allowable_bracket_extension: -225,
                bracket_type: 'Standard',
                angle_orientation: 'Standard',
                vertical_leg: 60
            });

            // Expected calculation for fixing 115mm:
            // Original bracket: |-250| - 115 + 40 = 175mm
            // Bracket bottom position: 115 + 175 - 40 = 250mm from slab top
            // Exclusion limit: 225mm from slab top
            // Limited bracket: 225 - 115 + 40 = 150mm (exactly at minimum)
            // Valid!

            expect(validation.isValid).toBe(true);
            expect(validation.limited_bracket_height).toBeGreaterThanOrEqual(150);
        });

        test('Should identify valid fixing position 110mm (safer margin)', () => {
            const validation = validateFixingPositionWithExclusionZone({
                fixing_position: 110,
                support_level: -250,
                slab_thickness: 225,
                max_allowable_bracket_extension: -225,
                bracket_type: 'Standard',
                angle_orientation: 'Standard',
                vertical_leg: 60
            });

            // Expected calculation for fixing 110mm:
            // Original bracket: |-250| - 110 + 40 = 180mm
            // Bracket bottom position: 110 + 180 - 40 = 250mm from slab top
            // Exclusion limit: 225mm from slab top
            // Limited bracket: 225 - 110 + 40 = 155mm (above minimum)
            // Valid with margin!

            expect(validation.isValid).toBe(true);
            expect(validation.limited_bracket_height).toBeGreaterThan(150);
        });

        test('No exclusion zone - all positions valid', () => {
            const validation = validateFixingPositionWithExclusionZone({
                fixing_position: 140,
                support_level: -250,
                slab_thickness: 225,
                max_allowable_bracket_extension: null, // No exclusion zone
                bracket_type: 'Standard',
                angle_orientation: 'Standard',
                vertical_leg: 60
            });

            expect(validation.isValid).toBe(true);
            expect(validation.bracket_reduction).toBe(0);
        });
    });

    describe('Brute Force Integration', () => {
        test('Should filter out invalid fixing positions', async () => {
            const result = await runBruteForce(userScenarioInputs);

            // If valid design found, verify fixing position is valid
            if (result.success && result.design) {
                const selectedFixing = result.design.genetic.fixing_position || 75;

                // Validate the selected fixing position
                const validation = validateFixingPositionWithExclusionZone({
                    fixing_position: selectedFixing,
                    support_level: -250,
                    slab_thickness: 225,
                    max_allowable_bracket_extension: -225,
                    bracket_type: 'Standard',
                    angle_orientation: result.design.genetic.angle_orientation,
                    vertical_leg: result.design.genetic.vertical_leg
                });

                expect(validation.isValid).toBe(true);
                expect(result.design.calculated.bracket_height).toBeGreaterThanOrEqual(150);

                console.log('\n✅ Selected fixing position:', selectedFixing);
                console.log('   Bracket height:', result.design.calculated.bracket_height);
                console.log('   Limited bracket height:', validation.limited_bracket_height);
                console.log('   Bracket reduction:', validation.bracket_reduction);
            } else {
                // If no valid design, that's acceptable for this scenario
                console.log('\n⚠️  No valid design found (acceptable for restrictive exclusion zone)');
                expect(result.success).toBe(false);
            }
        }, 30000); // 30 second timeout for brute force

        test('Should exclude fixing positions 120mm and above', async () => {
            const result = await runBruteForce(userScenarioInputs);

            if (result.success && result.design) {
                const selectedFixing = result.design.genetic.fixing_position || 75;

                // With -225mm exclusion and -250mm support, fixing positions above 115mm
                // would violate the minimum bracket height
                expect(selectedFixing).toBeLessThanOrEqual(115);

                console.log('\n✅ Fixing position correctly limited to:', selectedFixing);
            }
        }, 30000);
    });

    describe('Edge Cases', () => {
        test('Exclusion zone at slab top (0mm) prevents brackets from extending above', () => {
            const validation = validateFixingPositionWithExclusionZone({
                fixing_position: 75,
                support_level: -250,
                slab_thickness: 225,
                max_allowable_bracket_extension: 0, // At slab top
                bracket_type: 'Standard',
                angle_orientation: 'Standard',
                vertical_leg: 60
            });

            // With 0mm exclusion, bracket cannot extend above slab top
            // For -250mm support with fixing at 75mm, bracket would be 215mm
            // This would place bracket top at 75 - 40 = 35mm, then extend up from there
            // But with 0mm exclusion, this would violate the constraint
            // So this configuration is actually invalid
            expect(validation.isValid).toBe(false);
            expect(validation.reason).toContain('below minimum');
        });

        test('Exclusion zone below support level should be valid', () => {
            const validation = validateFixingPositionWithExclusionZone({
                fixing_position: 75,
                support_level: -200,
                slab_thickness: 225,
                max_allowable_bracket_extension: -250, // Below support level
                bracket_type: 'Standard',
                angle_orientation: 'Standard',
                vertical_leg: 60
            });

            // Exclusion zone below support level shouldn't affect bracket
            expect(validation.isValid).toBe(true);
        });

        test('Inverted bracket with exclusion zone', () => {
            const validation = validateFixingPositionWithExclusionZone({
                fixing_position: 75,
                support_level: 50, // Inverted bracket
                slab_thickness: 225,
                max_allowable_bracket_extension: -200,
                bracket_type: 'Inverted',
                angle_orientation: 'Inverted',
                vertical_leg: 60
            });

            // Inverted bracket validation (simplified for now)
            // More complex due to Dim D variations
            expect(validation).toBeDefined();
        });
    });

    describe('Multiple Scenarios', () => {
        const scenarios = [
            {
                name: 'User scenario - 225mm slab, -250mm support, -225mm exclusion',
                slab: 225,
                support: -250,
                exclusion: -225,
                maxValidFixing: 115
            },
            {
                name: 'Tighter scenario - 200mm slab, -225mm support, -200mm exclusion',
                slab: 200,
                support: -225,
                exclusion: -200,
                maxValidFixing: 90
            },
            {
                name: 'Loose scenario - 300mm slab, -275mm support, -300mm exclusion',
                slab: 300,
                support: -275,
                exclusion: -300,
                maxValidFixing: 190
            }
        ];

        scenarios.forEach(scenario => {
            test(scenario.name, () => {
                const validation = validateFixingPositionWithExclusionZone({
                    fixing_position: scenario.maxValidFixing,
                    support_level: scenario.support,
                    slab_thickness: scenario.slab,
                    max_allowable_bracket_extension: scenario.exclusion,
                    bracket_type: 'Standard',
                    angle_orientation: 'Standard',
                    vertical_leg: 60
                });

                expect(validation.isValid).toBe(true);
                expect(validation.limited_bracket_height).toBeGreaterThanOrEqual(150);

                console.log(`\n${scenario.name}:`);
                console.log(`  Max valid fixing: ${scenario.maxValidFixing}mm`);
                console.log(`  Limited bracket height: ${validation.limited_bracket_height}mm`);
            });
        });
    });
});
