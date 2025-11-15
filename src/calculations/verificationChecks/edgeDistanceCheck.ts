import { roundToTwelveDecimals } from '@/utils/precision';
import type { SteelBoltSize } from '@/types/steelFixingTypes';

/**
 * Minimum edge distance requirements for steel fixings (1.2 × hole diameter)
 */
const EDGE_DISTANCE_REQUIREMENTS = {
    'M10': 13.2,  // Ø11mm × 1.2
    'M12': 15.6,  // Ø13mm × 1.2
    'M16': 21.6   // Ø18mm × 1.2
} as const;

/**
 * Results from edge distance verification for steel fixings
 */
export interface EdgeDistanceResults {
    /** Calculated rise to bolts (edge distance from fixing to bottom of steel) in mm */
    riseToBolts: number;
    /** Required minimum edge distance for this bolt size in mm */
    requiredEdgeDistance: number;
    /** Bolt size being checked */
    boltSize: SteelBoltSize;
    /** Whether edge distance requirement is met */
    passes: boolean;
    /** Utilization ratio (riseToBolts / requiredEdgeDistance) - should be >= 1.0 */
    utilization: number;
    /** Whether this is an inverted bracket (different constraints) */
    isInverted: boolean;
}

/**
 * Verifies that rise to bolts meets minimum edge distance requirements for steel fixings.
 *
 * For steel fixings, the minimum edge distance is 1.2 × hole diameter:
 * - M10 (Ø11mm): 13.2mm minimum
 * - M12 (Ø13mm): 15.6mm minimum
 * - M16 (Ø18mm): 21.6mm minimum
 *
 * This check is CRITICAL for inverted brackets where the rise to bolts
 * represents the edge distance from the fixing to the bottom of the steel section.
 *
 * @param riseToBolts - Calculated rise to bolts in mm (worst-case, bottom of slot)
 * @param boltSize - Steel bolt size (M10, M12, or M16)
 * @param bracketType - Bracket type ('Standard' or 'Inverted')
 * @returns Edge distance verification results
 */
export function verifyEdgeDistance(
    riseToBolts: number,
    boltSize: SteelBoltSize,
    bracketType: 'Standard' | 'Inverted'
): EdgeDistanceResults {
    // Get required edge distance for this bolt size
    const requiredEdgeDistance = EDGE_DISTANCE_REQUIREMENTS[boltSize];

    // Check if rise to bolts meets minimum requirement
    const passes = riseToBolts >= requiredEdgeDistance;

    // Calculate utilization (how much of the requirement is met)
    // Utilization < 1.0 means edge distance is insufficient
    const utilization = riseToBolts / requiredEdgeDistance;

    // Log detailed results for debugging
    console.log(`\n=== Edge Distance Check (${boltSize}) ===`);
    console.log(`  Bracket Type: ${bracketType}`);
    console.log(`  Rise to Bolts: ${riseToBolts.toFixed(2)}mm`);
    console.log(`  Required Edge Distance: ${requiredEdgeDistance}mm`);
    console.log(`  Utilization: ${(utilization * 100).toFixed(1)}% (${utilization >= 1.0 ? 'PASS' : 'FAIL'})`);
    console.log(`  Status: ${passes ? '✅ PASS' : '❌ FAIL'}`);

    if (!passes) {
        const shortage = requiredEdgeDistance - riseToBolts;
        console.log(`  ⚠️  EDGE DISTANCE VIOLATION: ${shortage.toFixed(2)}mm short of minimum requirement`);
        console.log(`  Steel section is too thin or fixing position is too deep for ${boltSize} bolts`);
    }

    return {
        riseToBolts: roundToTwelveDecimals(riseToBolts),
        requiredEdgeDistance: roundToTwelveDecimals(requiredEdgeDistance),
        boltSize,
        passes,
        utilization: roundToTwelveDecimals(utilization),
        isInverted: bracketType === 'Inverted'
    };
}
