import type { DesignInputs } from '@/types/designInputs';
import { SYSTEM_DEFAULTS } from '@/constants';
import { getValidBracketAngleCombinations } from '../bracketAngleSelection';
import { getValidBracketCentres as getValidCentres, getChannelSpec, getAvailableChannelTypes } from '@/data/channelSpecs';
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

// Vertical leg depends on angle thickness
// Type is inferred as number
const POSSIBLE_VERTICAL_LEG = (angleThickness: AngleThickness) => {
    return angleThickness === 8 ? 75 : 60;
};

/**
 * Generates fixing position combinations for optimization.
 * Starts at 75mm (default) and increments by 5mm steps downward into the slab.
 * Maximum depth is limited to slab thickness - bottom critical edge to maintain minimum edge distance.
 * 
 * @param inputs - Design inputs containing slab thickness and optimization settings
 * @returns Array of fixing positions in mm from top of slab
 */
const generateFixingPositions = (inputs: DesignInputs): number[] => {
    const DEFAULT_FIXING_POSITION_FROM_SLAB_TOP = 75; // mm - default distance from top of slab to fixing
    
    // If fixing optimization is disabled, return only the default position
    if (!inputs.enable_fixing_optimization) {
        return [inputs.fixing_position ?? DEFAULT_FIXING_POSITION_FROM_SLAB_TOP];
    }
    
    const startPosition = inputs.fixing_position ?? DEFAULT_FIXING_POSITION_FROM_SLAB_TOP;
    const slabThickness = inputs.slab_thickness;
    const incrementSize = 5; // mm - step size for fixing position optimization
    
    // Get bottom critical edge distance from channel specifications
    // Use a default channel type to get the edge distance (CPRO38 is most common)
    const channelSpec = getChannelSpec("CPRO38", slabThickness, 300); // Use 300mm bracket centres as default
    const bottomCriticalEdge = channelSpec ? channelSpec.edgeDistances.bottom : 75; // fallback to 75mm
    
    // Calculate maximum fixing depth: must maintain bottom critical edge from slab bottom
    const maxFixingDepth = slabThickness - bottomCriticalEdge;
    
    // Early validation: Check if slab is too thin for fixing optimization
    if (startPosition > maxFixingDepth) {
        console.warn(`Fixing Position Optimization: Slab too thin (${slabThickness}mm) for optimization with ${bottomCriticalEdge}mm bottom edge. Using default position only.`);
        return [startPosition];
    }
    
    const positions: number[] = [];
    
    // Generate positions starting from default and moving deeper into slab
    for (let position = startPosition; position <= maxFixingDepth; position += incrementSize) {
        positions.push(position);
    }
    
    // Ensure we have at least the default position
    if (positions.length === 0) {
        console.warn(`Fixing Position Optimization: No valid positions generated. Using default position.`);
        positions.push(startPosition);
    }
    
    console.log(`Fixing Position Optimization: Generated ${positions.length} positions (${positions[0]}mm to ${positions[positions.length - 1]}mm)`);
    
    // Log a warning if optimization won't provide benefits
    if (positions.length === 1) {
        console.log(`  Note: Only one position available - fixing optimization will not provide additional benefits`);
    }
    
    return positions;
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

                        const geneticParams: GeneticParameters = {
                            bracket_centres,
                            bracket_thickness,
                            angle_thickness,
                            vertical_leg,
                            bolt_diameter,
                            bracket_type: bracketAngleCombo.bracket_type,
                            angle_orientation: bracketAngleCombo.angle_orientation,
                            horizontal_leg: SYSTEM_DEFAULTS.HORIZONTAL_LEG, // Assuming fixed horizontal leg
                            channel_type: channelType,
                            fixing_position: fixingPosition
                            // Note: Channel type might need calculation based on other params
                        };

                        // TODO: Add validation here? Or rely on fitness function penalties?
                        // It might be more efficient to prune invalid combinations early.
                        // Example: validateGeneticParameters(geneticParams, characteristicLoad)

                        combinations.push(geneticParams);
                    }
                }
            }
            }
            }
        }
    }

    console.log(`Generated ${combinations.length} raw combinations for brute force.`);
    console.log(`Combinations per bracket/angle combo: ${combinations.length / validBracketAngleCombinations.length}`);
    
    // TODO: Implement filtering/validation of combinations if necessary
    return combinations;
} 
