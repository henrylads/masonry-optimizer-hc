import type { DesignInputs } from '@/types/designInputs';
import { getValidBracketAngleCombinations } from '../bracketAngleSelection';
import { getValidBracketCentres as getValidCentres, getAvailableChannelTypes } from '@/data/channelSpecs';
import type {
    BracketCentres,
    BracketThickness,
    AngleThickness,
    BoltDiameter,
    GeneticParameters
} from './index';

// Define the possible values for each genetic parameter
// These should align with the constraints and generation logic in the GA if possible
const POSSIBLE_BRACKET_CENTRES: BracketCentres[] = [200, 250, 300, 350, 400, 450, 500]; // Matches channel specs data
const POSSIBLE_BRACKET_THICKNESS: BracketThickness[] = [3, 4]; // Example values
const POSSIBLE_ANGLE_THICKNESS: AngleThickness[] = [3, 4, 5, 6, 8]; // Example values
const POSSIBLE_BOLT_DIAMETER: BoltDiameter[] = [10, 12]; // Example values

// Dim D values for inverted brackets (130-450mm range)
const POSSIBLE_DIM_D_VALUES: number[] = [130, 150, 200, 250, 300, 350, 400, 450]; // mm

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
 * Generates fixing position combinations for optimization.
 * Starts at 75mm (default) and increments by 5mm steps downward into the slab.
 * Maximum depth is limited to slab thickness - bottom critical edge to maintain minimum edge distance.
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

        console.log(`Fixing Position: Optimizing across ${positions.length} positions (${positions[0]}mm to ${positions[positions.length - 1]}mm)`);
        console.log(`Generated positions: [${positions.join(', ')}]`);
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

    // Track filtering statistics
    let totalGenerated = 0;
    let filteredOut = 0;

    // Get valid bracket/angle combinations for this support level
    const validBracketAngleCombinations = getValidBracketAngleCombinations(supportLevel);
    
    console.log(`Support Level: ${supportLevel}mm`);
    console.log(`Valid Bracket/Angle Combinations: ${validBracketAngleCombinations.length}`);
    validBracketAngleCombinations.forEach((combo, index) => {
        console.log(`  ${index + 1}: ${combo.bracket_type} bracket + ${combo.angle_orientation} angle`);
    });

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
            for (const bracket_thickness of POSSIBLE_BRACKET_THICKNESS) {
                // Example constraint: Bracket thickness might depend on load/centres
                // Add specific validation logic here if needed, similar to GA's generateBracketThickness
                // For now, we assume all listed thicknesses are potentially valid

                for (const angle_thickness of POSSIBLE_ANGLE_THICKNESS) {
                    const vertical_leg = POSSIBLE_VERTICAL_LEG(angle_thickness);
                    for (const bolt_diameter of POSSIBLE_BOLT_DIAMETER) {

                        // Generate Dim D values for inverted brackets
                        const dimDValues = bracketAngleCombo.bracket_type === 'Inverted'
                            ? POSSIBLE_DIM_D_VALUES
                            : [undefined]; // Standard brackets don't use Dim D

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
