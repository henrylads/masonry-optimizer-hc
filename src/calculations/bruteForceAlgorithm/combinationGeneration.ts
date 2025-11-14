import type { DesignInputs } from '@/types/designInputs';
import { getValidBracketAngleCombinations } from '../bracketAngleSelection';
import { getValidBracketCentres as getValidCentres, getAvailableChannelTypes } from '@/data/channelSpecs';
import { getSteelFixingCapacity } from '@/data/steelFixingCapacities';
import type { SteelBoltSize } from '@/types/steelFixingTypes';
import type {
    BracketCentres,
    BracketThickness,
    AngleThickness,
    BoltDiameter,
    GeneticParameters
} from './index';

// Define the possible values for each genetic parameter
// These should align with the constraints and generation logic in the GA if possible
const POSSIBLE_BRACKET_CENTRES: BracketCentres[] = [200, 225, 250, 275, 300, 325, 350, 375, 400, 425, 450, 475, 500]; // Matches channel specs data - 25mm increments
const POSSIBLE_BRACKET_THICKNESS: BracketThickness[] = [3, 4]; // Example values
const POSSIBLE_ANGLE_THICKNESS: AngleThickness[] = [3, 4, 5, 6, 8]; // Example values
const POSSIBLE_BOLT_DIAMETER: BoltDiameter[] = [10, 12]; // Example values

// Steel fixing bolt sizes
const POSSIBLE_STEEL_BOLT_SIZES: SteelBoltSize[] = ['M10', 'M12', 'M16'];

// Steel fixing edge distances (1.2 × hole diameter in mm)
const STEEL_EDGE_DISTANCES = {
    'M10': 13.2,  // Ø11mm × 1.2
    'M12': 15.6,  // Ø13mm × 1.2
    'M16': 21.6   // Ø18mm × 1.2
} as const;

// Bracket thickness rule thresholds
const BRACKET_THICKNESS_RULE = {
    LOAD_THRESHOLD: 4, // kN/m
    DISTANCE_FROM_SLAB: 50 // mm - distance beyond slab edges
} as const;

/**
 * Determines if bracket thickness must be 4mm based on load and support level
 * Rule: When load > 4 kN/m AND support is more than 50mm outside the slab boundaries,
 * bracket thickness must be 4mm.
 *
 * @param characteristicLoad - Applied load in kN/m
 * @param supportLevel - Support level in mm (0 = top of slab, negative = below top)
 * @param slabThickness - Slab thickness in mm
 * @returns true if 4mm bracket thickness is required
 */
function requiresThickBracket(
    characteristicLoad: number,
    supportLevel: number,
    slabThickness: number
): boolean {
    const highLoad = characteristicLoad > BRACKET_THICKNESS_RULE.LOAD_THRESHOLD;

    // Calculate slab boundaries
    const topOfSlab = 0;
    const bottomOfSlab = -slabThickness;

    // Check if support is more than 50mm outside slab boundaries
    const aboveSlabThreshold = topOfSlab + BRACKET_THICKNESS_RULE.DISTANCE_FROM_SLAB;
    const belowSlabThreshold = bottomOfSlab - BRACKET_THICKNESS_RULE.DISTANCE_FROM_SLAB;

    const farFromSlab = supportLevel > aboveSlabThreshold || supportLevel < belowSlabThreshold;

    return highLoad && farFromSlab;
}

/**
 * Gets valid bracket thicknesses for given conditions
 *
 * @param characteristicLoad - Applied load in kN/m
 * @param supportLevel - Support level in mm
 * @param slabThickness - Slab thickness in mm
 * @returns Array of valid bracket thicknesses
 */
function getValidBracketThicknesses(
    characteristicLoad: number,
    supportLevel: number,
    slabThickness: number
): BracketThickness[] {
    if (requiresThickBracket(characteristicLoad, supportLevel, slabThickness)) {
        console.log(`⚠️  Bracket thickness rule applied: Load=${characteristicLoad}kN/m, Support=${supportLevel}mm, Slab=${slabThickness}mm → Only 4mm bracket allowed`);
        return [4]; // Only 4mm allowed
    }
    return POSSIBLE_BRACKET_THICKNESS; // Both 3mm and 4mm allowed
}

// Dim D values for inverted brackets
// Extended range to support thin steel sections (RHS/SHS) starting from 30mm
// Range: 30-450mm in 5mm increments, aligned with ShapeDiver
// Generate array from 30 to 450 in 5mm steps: [30, 35, 40, ..., 445, 450]
const POSSIBLE_DIM_D_VALUES: number[] = Array.from(
    { length: Math.floor((450 - 30) / 5) + 1 },
    (_, i) => 30 + i * 5
); // mm

// Vertical leg depends on angle thickness
// Type is inferred as number
const POSSIBLE_VERTICAL_LEG = (angleThickness: AngleThickness) => {
    return angleThickness === 8 ? 75 : 60;
};

/**
 * Validates if a genetic parameter combination is geometrically feasible.
 * Filters out combinations that would violate slab geometry constraints.
 *
 * @param params - Genetic parameters to validate
 * @param inputs - Design inputs for context
 * @returns true if combination is valid, false if should be filtered out
 */
function isValidCombination(params: GeneticParameters, inputs: DesignInputs): boolean {
    // Only validate inverted brackets with fixing positions (standard brackets don't have these constraints)
    if (params.bracket_type !== 'Inverted' || !params.fixing_position) {
        return true; // Standard brackets are always valid for now
    }

    const { fixing_position, angle_thickness } = params;
    const { slab_thickness, support_level } = inputs;
    const angle_height = angle_thickness === 8 ? 75 : 60;

    // Calculate what the bracket geometry would be
    const angle_position_from_bracket_bottom = slab_thickness + support_level;
    const bracket_extension_above_slab =
        (params.angle_orientation === 'Standard') ? (angle_height - angle_thickness) : 0;
    const minimum_bracket_height = Math.max(
        angle_position_from_bracket_bottom + bracket_extension_above_slab,
        slab_thickness
    );

    // Calculate required Dim D
    const required_dim_d = minimum_bracket_height - fixing_position;

    // Check if this combination violates slab geometry constraints
    const max_dim_d_for_slab = slab_thickness - fixing_position;
    const violates_slab_geometry = required_dim_d > max_dim_d_for_slab;

    // For now, we'll allow combinations that violate slab geometry because they can be
    // resolved by extending the bracket below the slab. However, we can add a threshold
    // here if we want to filter out extremely impractical combinations.

    // Filter out combinations where the fixing position is too deep to be practical
    const min_edge_distance = 75; // Standard minimum edge distance
    const max_practical_fixing_depth = slab_thickness - min_edge_distance;

    if (fixing_position > max_practical_fixing_depth) {
        console.log(`Filtered out combination: Fixing position ${fixing_position}mm too deep for ${slab_thickness}mm slab`);
        return false;
    }

    // Filter out combinations where required Dim D would be excessively large
    const max_practical_dim_d = 450; // Manufacturing limit
    if (required_dim_d > max_practical_dim_d + 100) { // Allow some tolerance for bracket extension
        console.log(`Filtered out combination: Required Dim D ${required_dim_d}mm too large`);
        return false;
    }

    return true; // Combination is valid
}

/**
 * Filters fixing positions to exclude those that would violate minimum bracket height
 * when combined with exclusion zone constraints.
 *
 * @param positions - Array of fixing positions to filter
 * @param inputs - Design inputs containing exclusion zone and support level
 * @returns Filtered array of valid fixing positions
 */
const filterFixingPositionsForExclusionZone = (positions: number[], inputs: DesignInputs): number[] => {
    // Import validation function
    const { validateFixingPositionWithExclusionZone } = require('../angleExtensionCalculations');
    const { determineBracketType } = require('../bracketAngleSelection');

    // Determine bracket type from support level
    const bracket_type = determineBracketType(inputs.support_level);

    console.log(`\n🔍 FILTERING FIXING POSITIONS FOR EXCLUSION ZONE:`);
    console.log(`  Bracket type: ${bracket_type}`);
    console.log(`  Support level: ${inputs.support_level}mm`);
    console.log(`  Exclusion zone: ${inputs.max_allowable_bracket_extension}mm`);
    console.log(`  Checking ${positions.length} positions...`);

    const validPositions: number[] = [];
    const invalidPositions: { position: number; reason: string }[] = [];

    for (const fixing_position of positions) {
        const validation = validateFixingPositionWithExclusionZone({
            fixing_position,
            support_level: inputs.support_level,
            slab_thickness: inputs.slab_thickness,
            max_allowable_bracket_extension: inputs.max_allowable_bracket_extension,
            bracket_type,
            angle_orientation: 'Standard', // Test with default, will be tested for all orientations later
            vertical_leg: 60
        });

        if (validation.isValid) {
            validPositions.push(fixing_position);
        } else {
            invalidPositions.push({
                position: fixing_position,
                reason: validation.reason || 'Unknown reason'
            });
        }
    }

    // Log filtering results
    if (invalidPositions.length > 0) {
        console.log(`\n❌ FILTERED OUT ${invalidPositions.length} POSITIONS:`);
        invalidPositions.forEach(({ position, reason }) => {
            console.log(`  - ${position}mm: ${reason}`);
        });
    }

    if (validPositions.length > 0) {
        console.log(`\n✅ VALID POSITIONS (${validPositions.length}): [${validPositions.join(', ')}]mm`);
    } else {
        console.log(`\n⚠️  NO VALID POSITIONS FOUND!`);
    }

    return validPositions;
};

/**
 * Generates fixing positions for STEEL fixings based on bolt hole edge distance rules.
 * For steel fixings: edge distance = 1.2 × hole diameter
 *
 * The total edge distance is SPLIT between top and bottom edges:
 * - Top edge distance = (1.2 × hole diameter) / 2
 * - Bottom edge distance = (1.2 × hole diameter) / 2
 *
 * Uses the largest edge distance (M16 = 21.6mm total, 10.8mm each edge) to ensure all positions work for all bolt sizes.
 * Range: (edge_distance/2) to (steel_height - edge_distance/2) in 5mm increments
 *
 * @param steelHeight - Height of steel section in mm
 * @returns Array of valid fixing positions for steel in mm from top
 */
const generateSteelFixingPositions = (steelHeight: number): number[] => {
    // Use M16 edge distance (largest) to ensure all positions work for all bolt sizes
    const totalEdgeDistance = STEEL_EDGE_DISTANCES['M16']; // 21.6mm total
    const edgeDistancePerSide = totalEdgeDistance / 2; // 10.8mm per side

    const minPosition = Math.ceil(edgeDistancePerSide / 5) * 5; // Round up to nearest 5mm
    const maxPosition = steelHeight - edgeDistancePerSide;

    const positions: number[] = [];
    for (let pos = minPosition; pos <= maxPosition; pos += 5) {
        positions.push(pos);
    }

    // Ensure at least one position
    if (positions.length === 0) {
        positions.push(minPosition);
    }

    console.log(`🔩 Steel fixing positions: ${positions.length} positions from ${positions[0]}mm to ${positions[positions.length - 1]}mm (edge distance per side: ${edgeDistancePerSide}mm, total: ${totalEdgeDistance}mm, steel height: ${steelHeight}mm)`);

    return positions;
};

/**
 * Generates fixing position combinations for optimization (CONCRETE fixings).
 * Starts at 75mm (default) and increments by 5mm steps downward into the slab.
 * Maximum depth is limited to slab thickness - bottom critical edge to maintain minimum edge distance.
 *
 * Also filters out fixing positions that would violate minimum bracket height when combined with
 * exclusion zone constraints.
 *
 * @param inputs - Design inputs containing slab thickness and optimization settings
 * @returns Array of fixing positions in mm from top of slab
 */
const generateFixingPositions = (inputs: DesignInputs): number[] => {
    if (inputs.use_custom_fixing_position) {
        // Custom mode: use exactly what user specified
        const customPosition = inputs.fixing_position ?? 75;
        console.log(`Fixing Position: Using custom ${customPosition}mm`);
        return [customPosition];
    } else {
        // Default mode: generate range to find optimal position
        const startPosition = 75; // Always start from 75mm for default optimization
        const slabThickness = inputs.slab_thickness;
        const incrementSize = 5; // mm - step size for optimization

        // Calculate maximum fixing depth: must maintain 75mm minimum from bottom edge
        // This ensures fixing is always 75mm from either top or bottom critical edge
        const maxFixingDepth = slabThickness - 75;
        console.log(`Max fixing depth: ${slabThickness} - 75 = ${maxFixingDepth}mm`);

        const positions: number[] = [];

        // Generate positions starting from 75mm and moving deeper into slab
        for (let position = startPosition; position <= maxFixingDepth; position += incrementSize) {
            positions.push(position);
        }

        // Ensure we have at least the starting position
        if (positions.length === 0) {
            positions.push(startPosition);
        }

        console.log(`Fixing Position: Generated ${positions.length} positions (${positions[0]}mm to ${positions[positions.length - 1]}mm)`);
        console.log(`Initial positions: [${positions.join(', ')}]`);

        // Filter positions based on exclusion zone + minimum bracket height compatibility
        if (inputs.enable_angle_extension && inputs.max_allowable_bracket_extension !== null) {
            const filteredPositions = filterFixingPositionsForExclusionZone(positions, inputs);

            if (filteredPositions.length === 0) {
                console.warn(`⚠️  All fixing positions filtered out due to exclusion zone conflicts!`);
                console.warn(`   Exclusion zone: ${inputs.max_allowable_bracket_extension}mm`);
                console.warn(`   Support level: ${inputs.support_level}mm`);
                console.warn(`   Returning unfiltered positions - design may fail verification.`);
                return positions; // Return unfiltered to allow error messaging in evaluation
            }

            console.log(`✅ Filtered to ${filteredPositions.length} valid positions after exclusion zone check`);
            return filteredPositions;
        }

        return positions;
    }
};

/**
 * Generates all valid combinations of genetic parameters including bracket type and angle orientation.
 * 
 * Now incorporates the BSL range-based selection table:
 * - ≥ 0mm: Inverted bracket + Both angle orientations
 * - -25mm to -50mm: Inverted bracket + Standard angle only
 * - -75mm to -135mm: Standard bracket + Inverted angle only
 * - -150mm to -175mm: Standard bracket + Both angle orientations
 * - < -175mm: Standard bracket + Both angle orientations
 *
 * Also generates fixing position combinations when fixing optimization is enabled.
 *
 * @param inputs - Design inputs which determine the valid bracket/angle combinations based on support_level.
 * @returns An array of all possible GeneticParameters combinations.
 */
export function generateAllCombinations(inputs: DesignInputs): GeneticParameters[] {
    const combinations: GeneticParameters[] = [];
    const characteristicLoad = inputs.characteristic_load;
    const supportLevel = inputs.support_level;
    const slabThickness = inputs.slab_thickness;

    // Check if using steel fixings
    const isSteelFrame = inputs.frame_fixing_type?.startsWith('steel');

    // Track filtering statistics
    let totalGenerated = 0;
    let filteredOut = 0;

    // Get valid bracket/angle combinations for this support level
    const validBracketAngleCombinations = getValidBracketAngleCombinations(supportLevel);

    console.log(`Support Level: ${supportLevel}mm`);
    console.log(`Frame Fixing Type: ${inputs.frame_fixing_type || 'concrete (default)'}`);
    console.log(`Valid Bracket/Angle Combinations: ${validBracketAngleCombinations.length}`);
    validBracketAngleCombinations.forEach((combo, index) => {
        console.log(`  ${index + 1}: ${combo.bracket_type} bracket + ${combo.angle_orientation} angle`);
    });

    // STEEL FIXING PATH
    if (isSteelFrame && inputs.steel_section) {
        console.log(`🔩 STEEL FIXING MODE: Section ${inputs.steel_section.sectionType}, Height: ${inputs.steel_section.effectiveHeight}mm`);

        // Determine which bolt sizes to test
        let boltSizesToTest: SteelBoltSize[] = POSSIBLE_STEEL_BOLT_SIZES;
        if (inputs.steel_bolt_size && inputs.steel_bolt_size !== 'all') {
            boltSizesToTest = [inputs.steel_bolt_size as SteelBoltSize];
            console.log(`  Testing specific bolt size: ${inputs.steel_bolt_size}`);
        } else {
            console.log(`  Testing all bolt sizes: ${boltSizesToTest.join(', ')}`);
        }

        // Determine which fixing methods to test
        let fixingMethodsToTest: Array<'SET_SCREW' | 'BLIND_BOLT'> = [];
        const sectionType = inputs.steel_section.sectionType;
        const userSelectedMethod = inputs.steel_fixing_method;

        if (sectionType === 'RHS' || sectionType === 'SHS') {
            // RHS/SHS MUST use blind bolts only
            fixingMethodsToTest = ['BLIND_BOLT'];
            console.log(`  ${sectionType} section - MUST use blind bolts`);
        } else if (sectionType === 'I-BEAM') {
            // I-Beam can use either method
            if (userSelectedMethod === 'both') {
                fixingMethodsToTest = ['SET_SCREW', 'BLIND_BOLT'];
                console.log(`  I-BEAM section - Testing BOTH set screws and blind bolts`);
            } else if (userSelectedMethod === 'BLIND_BOLT') {
                fixingMethodsToTest = ['BLIND_BOLT'];
                console.log(`  I-BEAM section - Testing blind bolts only`);
            } else {
                // Default to set screws for I-Beam (most economical)
                fixingMethodsToTest = ['SET_SCREW'];
                console.log(`  I-BEAM section - Testing set screws only (default)`);
            }
        } else {
            // Unknown section type - default to blind bolts for safety
            fixingMethodsToTest = ['BLIND_BOLT'];
            console.log(`  Unknown section type - defaulting to blind bolts`);
        }

        // Generate fixing positions for STEEL (using steel-specific edge distances)
        const fixingPositions = generateSteelFixingPositions(inputs.steel_section.effectiveHeight);

        // Track combinations per bolt size and fixing method for diagnostics
        const combinationsPerBoltSize = new Map<string, number>();
        boltSizesToTest.forEach(size => {
            fixingMethodsToTest.forEach(method => {
                combinationsPerBoltSize.set(`${size}-${method}`, 0);
            });
        });

        // Generate combinations for steel fixings (no channel iteration needed)
        for (const bracketAngleCombo of validBracketAngleCombinations) {
            for (const steelBoltSize of boltSizesToTest) {
                for (const fixingMethod of fixingMethodsToTest) {
                    for (const fixingPosition of fixingPositions) {
                        // Load constraint for bracket centres
                        const centresForSteel = POSSIBLE_BRACKET_CENTRES.filter(bc => {
                            const max = characteristicLoad > 5 ? 500 : 600;
                            return bc <= max;
                        });

                        for (const bracket_centres of centresForSteel) {
                            // Get valid bracket thicknesses
                            const validBracketThicknesses = getValidBracketThicknesses(characteristicLoad, supportLevel, slabThickness);

                            for (const bracket_thickness of validBracketThicknesses) {
                                for (const angle_thickness of POSSIBLE_ANGLE_THICKNESS) {
                                    const vertical_leg = POSSIBLE_VERTICAL_LEG(angle_thickness);

                                    // Convert steel bolt size to bolt diameter for GeneticParameters
                                    const bolt_diameter = parseInt(steelBoltSize.substring(1)) as BoltDiameter;
                                    // Generate Dim D values for inverted brackets
                                    const max_dim_d_for_slab = slabThickness - fixingPosition;
                                    const dimDValues = bracketAngleCombo.bracket_type === 'Inverted'
                                        ? POSSIBLE_DIM_D_VALUES.filter(d => d <= max_dim_d_for_slab)
                                        : [undefined];

                                    for (const dim_d of dimDValues) {
                                        const geneticParams: GeneticParameters = {
                                            bracket_centres,
                                            bracket_thickness,
                                            angle_thickness,
                                            vertical_leg,
                                            bolt_diameter,
                                            bracket_type: bracketAngleCombo.bracket_type,
                                            angle_orientation: bracketAngleCombo.angle_orientation,
                                            channel_type: 'NONE' as any, // Not used for steel
                                            fixing_position: fixingPosition,
                                            dim_d: dim_d,
                                            steel_bolt_size: steelBoltSize, // Add steel bolt size to params
                                            steel_fixing_method: fixingMethod // Add fixing method to params
                                        };

                                        totalGenerated++;
                                        combinations.push(geneticParams);

                                        // Track count for this bolt size + fixing method combination
                                        const key = `${steelBoltSize}-${fixingMethod}`;
                                        combinationsPerBoltSize.set(key, (combinationsPerBoltSize.get(key) || 0) + 1);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        console.log(`🔩 Steel fixing combinations generated: ${combinations.length}`);
        console.log(`🔩 Breakdown by bolt size:`);
        combinationsPerBoltSize.forEach((count, size) => {
            console.log(`   ${size}: ${count} combinations`);
        });
        return combinations;
    }

    // CONCRETE FIXING PATH (original logic)
    // Determine allowed channel types (default to all available channel types from CSV data)
    const usingChannelSpecs = Array.isArray(inputs.allowed_channel_types) && inputs.allowed_channel_types.length > 0;
    const allowedChannelTypes = usingChannelSpecs
        ? inputs.allowed_channel_types!
        : getAvailableChannelTypes(); // Now includes all 4 channel types from CSV data

    console.log(`Brute Force: Using channel types: ${allowedChannelTypes.join(', ')} (${allowedChannelTypes.length} types)`);

    // Validate that all requested channel types are available
    if (usingChannelSpecs) {
        const availableTypes = getAvailableChannelTypes();
        const invalidTypes = inputs.allowed_channel_types!.filter(type => !availableTypes.includes(type));
        if (invalidTypes.length > 0) {
            console.warn(`Brute Force: Invalid channel types requested: ${invalidTypes.join(', ')}`);
        }
    }

    // Generate fixing position combinations
    const fixingPositions = generateFixingPositions(inputs);

    // Generate combinations for each valid bracket/angle combination, channel type, and fixing position
    for (const bracketAngleCombo of validBracketAngleCombinations) {
        for (const channelType of allowedChannelTypes) {
            for (const fixingPosition of fixingPositions) {
            // Determine bracket centres: use spec-driven when explicitly using channel specs; otherwise default list
            let baseCentres = usingChannelSpecs
              ? getValidCentres(channelType, slabThickness).filter((bc): bc is BracketCentres => {
                  // Type-safe check if bc is a valid BracketCentres value
                  return POSSIBLE_BRACKET_CENTRES.some(validCentre => validCentre === bc);
                })
              : POSSIBLE_BRACKET_CENTRES;

            // Fallback: if no channel specs exist for this slab thickness, use default centres
            if (usingChannelSpecs && baseCentres.length === 0) {
              console.warn(`Channel specs missing for ${channelType} at ${slabThickness}mm slab. Falling back to default centres.`);
              baseCentres = POSSIBLE_BRACKET_CENTRES;
            }
            // Apply load constraint
            const centresForChannel = baseCentres.filter(bc => {
              const max = characteristicLoad > 5 ? 500 : 600;
              return bc <= max;
            });

            for (const bracket_centres of centresForChannel) {
            // Get valid bracket thicknesses based on load and support position
            const validBracketThicknesses = getValidBracketThicknesses(characteristicLoad, supportLevel, slabThickness);

            for (const bracket_thickness of validBracketThicknesses) {
                for (const angle_thickness of POSSIBLE_ANGLE_THICKNESS) {
                    const vertical_leg = POSSIBLE_VERTICAL_LEG(angle_thickness);
                    for (const bolt_diameter of POSSIBLE_BOLT_DIAMETER) {

                        // Generate Dim D values for inverted brackets
                        // Filter by slab geometry constraint: Dim D cannot exceed (slab_thickness - fixing_position)
                        const max_dim_d_for_slab = slabThickness - fixingPosition;
                        const dimDValues = bracketAngleCombo.bracket_type === 'Inverted'
                            ? POSSIBLE_DIM_D_VALUES.filter(d => d <= max_dim_d_for_slab)
                            : [undefined]; // Standard brackets don't use Dim D

                        // Log Dim D filtering for inverted brackets (only once per channel/fixing combo)
                        if (bracketAngleCombo.bracket_type === 'Inverted' && bracket_centres === centresForChannel[0] &&
                            bracket_thickness === POSSIBLE_BRACKET_THICKNESS[0] && angle_thickness === POSSIBLE_ANGLE_THICKNESS[0] &&
                            bolt_diameter === POSSIBLE_BOLT_DIAMETER[0]) {
                            console.log(`  Inverted Bracket - Channel: ${channelType}, Fixing: ${fixingPosition}mm, Slab: ${slabThickness}mm`);
                            console.log(`    Max Dim D for slab: ${max_dim_d_for_slab}mm`);
                            console.log(`    Testing ${dimDValues.length} Dim D values: ${dimDValues[0]}mm to ${dimDValues[dimDValues.length - 1]}mm in 5mm increments`);
                        }

                        for (const dim_d of dimDValues) {
                            const geneticParams: GeneticParameters = {
                                bracket_centres,
                                bracket_thickness,
                                angle_thickness,
                                vertical_leg,
                                bolt_diameter,
                                bracket_type: bracketAngleCombo.bracket_type,
                                angle_orientation: bracketAngleCombo.angle_orientation,
                                // horizontal_leg will be calculated dynamically based on facade parameters
                                channel_type: channelType,
                                fixing_position: fixingPosition,
                                dim_d: dim_d
                            };

                            totalGenerated++;
                            // Validate combination before adding - filter out impossible geometries
                            if (isValidCombination(geneticParams, inputs)) {
                                combinations.push(geneticParams);
                            } else {
                                filteredOut++;
                            }
                        }
                    }
                }
            }
            }
            }
        }
    }

    console.log(`Generated ${totalGenerated} total combinations, filtered out ${filteredOut} invalid ones.`);
    console.log(`Final count: ${combinations.length} valid combinations for brute force.`);
    console.log(`Filtering efficiency: ${filteredOut > 0 ? ((filteredOut / totalGenerated) * 100).toFixed(1) : 0}% filtered out`);
    console.log(`Combinations per bracket/angle combo: ${combinations.length / validBracketAngleCombinations.length}`);

    return combinations;
} 
