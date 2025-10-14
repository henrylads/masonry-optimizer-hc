import type { DesignInputs } from '@/types/designInputs';
import type { OptimisationResult, GeneticAlgorithmOutput, AlternativeDesign } from '@/types/optimization-types';
import { generateAllCombinations } from './combinationGeneration';
import { evaluateBruteForceDesign } from './evaluateDesign';
import { calculateAreaLoad, calculateCharacteristicUDL, calculateLoading } from '../loadingCalculations';
import { roundToTwelveDecimals } from '@/utils/precision';
import { getChannelSpec } from '@/data/channelSpecs';
import { isRHPTIIIChannel, getProductCharacteristics } from '@/utils/channelTypeHelpers';
import type { VerificationResults } from '../verificationChecks';
import type { SteelWeightResults } from '../steelWeight';
import type { AngleLayoutResult } from '../angleLayout';
import type { BracketType, AngleOrientation, AngleExtensionResult } from '@/types/bracketAngleTypes';
import {
    calculateRiseToBolts,
    BRACKET_ANGLE_CONSTANTS
} from '../bracketAngleSelection';
import {
    calculateInvertedBracketHeight,
    calculateStandardBracketHeight
} from '../bracketCalculations';
import { calculateSystemWeight } from '../steelWeight';
import { calculateRequiredFixingPositionForExclusionZone } from '../angleExtensionCalculations';

// Local type definitions for brute force algorithm
export type BracketCentres = 200 | 250 | 300 | 350 | 400 | 450 | 500;
export type BracketThickness = 3 | 4;
export type AngleThickness = 3 | 4 | 5 | 6 | 8;
export type BoltDiameter = 10 | 12;

export interface GeneticParameters {
  bracket_centres: BracketCentres;
  bracket_thickness: BracketThickness;
  angle_thickness: AngleThickness;
  vertical_leg: number;
  bolt_diameter: BoltDiameter;
  bracket_type: BracketType;
  angle_orientation: AngleOrientation;
  horizontal_leg?: number;
  channel_type?: string;
  fixing_position?: number; // Distance from top of slab to fixing point (mm)
  dim_d?: number; // Distance from bracket bottom to fixing for inverted brackets (130-450mm)
  steel_bolt_size?: string; // Steel bolt size (M10, M12, M16) for steel fixings
  steel_fixing_method?: 'SET_SCREW' | 'BLIND_BOLT'; // Fixing method for steel sections
}

export interface CalculatedParameters {
  bracket_height: number;
  bracket_projection: number;
  rise_to_bolts: number;
  drop_below_slab: number;
  bracket_projection_at_fixing: number;
  dim_d?: number; // Distance from bracket bottom to fixing for inverted brackets (130-450mm)
  shear_load: number;
  total_deflection: number;
  characteristic_load: number;
  area_load: number;
  characteristic_udl: number;
  design_udl: number;
  E: number;
  n: number;
  slab_thickness: number;
  support_level: number;
  cavity_width: number;
  masonry_thickness?: number;
  bracket_type?: 'Standard' | 'Inverted';
  angle_orientation?: AngleOrientation;
  notch_height: number;
  notch_depth: number;
  moment_resistance_check: boolean;
  shear_resistance_check: boolean;
  angle_deflection_check: boolean;
  bracket_connection_check: boolean;
  shear_reduction_check: boolean;
  bracket_design_check: boolean;
  fixing_check: boolean;
  combined_tension_shear_check: boolean;
  all_checks_pass?: boolean;
  v_ed?: number;
  m_ed?: number;
  n_ed?: number;
  angle_utilisation?: number;
  total_system_deflection?: number;
  number_of_generations?: number;
  initial_weight?: number;
  optimal_design_weight?: number;
  weights?: SteelWeightResults;
  detailed_verification_results?: VerificationResults;
  bracketLayout?: AngleLayoutResult;
  bsl_above_slab_bottom: boolean;
  optimized_fixing_position?: number; // The fixing position used (from genetic parameters)
  facade_thickness?: number; // Facade thickness from design inputs
  load_position?: number; // Load position from design inputs
  front_offset?: number; // Front offset from design inputs
  isolation_shim_thickness?: number; // Isolation shim thickness from design inputs
  material_type?: string; // Material type from design inputs
  angle_extension_result?: AngleExtensionResult; // Angle extension calculation result (if applied)
  effective_vertical_leg?: number; // Effective vertical leg accounting for extension
  fixing_position_auto_adjusted?: boolean; // Flag indicating fixing position was auto-adjusted for exclusion zone
  original_fixing_position?: number; // Original fixing position before auto-adjustment
}

export interface Design {
  genetic: GeneticParameters;
  calculated: CalculatedParameters;
}

/**
 * Configuration for brute force algorithm
 */
export interface BruteForceConfig {
    maxGenerations: number; // Used for progress scaling only
    designInputs: DesignInputs;
    isAngleLengthLimited?: boolean;
    fixedAngleLength?: number;
    onProgress?: (generation: number, maxGenerations: number, bestFitness: number) => void;
}

/**
 * Calculates dependent parameters based on genetic parameters and inputs
 */
export function calculateDependentParameters(
    genetic: GeneticParameters,
    inputs: DesignInputs
): CalculatedParameters {
    console.log(`--- Calculating Dependent Params ---`);
    console.log(`🔧 Genetic Fixing Position: ${genetic.fixing_position}mm (from genetic params)`);
    console.log(`🔧 Input Fixing Position: ${inputs.fixing_position}mm (from form/inputs)`);
    console.log(`🔍 DEPENDENT PARAMS DEBUG: Input facade parameters:`, {
        facade_thickness: inputs.facade_thickness,
        load_position: inputs.load_position,
        front_offset: inputs.front_offset,
        isolation_shim_thickness: inputs.isolation_shim_thickness,
        material_type: inputs.material_type
    });
    console.log(`  Genetic: ${JSON.stringify(genetic)}`);
    console.log(`  Inputs: slab=${inputs.slab_thickness}, support=${inputs.support_level}, cavity=${inputs.cavity_width}`);
    
    // Dynamically determine critical edge distances
    const channelType = genetic.channel_type || "CPRO38";
    const channelSpec = getChannelSpec(channelType, inputs.slab_thickness, genetic.bracket_centres);
    console.log(`  Channel Spec Found: ${channelSpec ? JSON.stringify(channelSpec.edgeDistances) : 'Not Found'}`);
    
    const top_critical_edge = channelSpec ? channelSpec.edgeDistances.top : 75;
    const bottom_critical_edge = channelSpec ? channelSpec.edgeDistances.bottom : 150; 
    console.log(`  Using Edge Distances: top=${top_critical_edge}, bottom=${bottom_critical_edge}`);
    
    // Use constant distance from bracket top to fixing (not the fixing position from slab top)
    const Y = BRACKET_ANGLE_CONSTANTS.DISTANCE_FROM_TOP_TO_FIXING;
    console.log(`  Using Y (Bracket Top to Fixing) = ${Y}mm`);

    // Calculate characteristic load if not provided
    let characteristicUDL = inputs.characteristic_load ?? 0;
    const masonry_thickness = inputs.masonry_thickness ?? 102.5;
    
    if (!characteristicUDL) {
        const masonry_density = inputs.masonry_density ?? 2000;
        const masonry_height = inputs.masonry_height ?? 3;
        
        const areaLoad = calculateAreaLoad(masonry_density, masonry_height);
        characteristicUDL = calculateCharacteristicUDL(areaLoad, masonry_thickness);
    }

    // Calculate loading parameters
    const loadingResults = calculateLoading({
        characteristic_load: characteristicUDL,
        masonry_density: inputs.masonry_density ?? 2000,
        masonry_thickness: masonry_thickness,
        masonry_height: inputs.masonry_height ?? 3,
        bracket_centres: genetic.bracket_centres
    });

    // Use proper bracket height calculation based on bracket type
    console.log(`  Using Proper Bracket Height Calculation`);
    console.log(`  Bracket Type: ${genetic.bracket_type}, Angle Orientation: ${genetic.angle_orientation}`);
    
    let bracket_height_calc: number;
    let rise_to_bolts_calc: number;
    let rise_to_bolts_display_calc: number;
    let drop_below_slab_calc: number;
    let dim_d_calc: number | undefined;
    
    if (genetic.bracket_type === 'Inverted') {
        // Use the proper inverted bracket calculation from documentation
        console.log(`  Using Inverted Bracket Calculation Method`);
        const invertedResults = calculateInvertedBracketHeight({
            support_level: inputs.support_level,
            angle_thickness: genetic.angle_thickness,
            top_critical_edge: top_critical_edge,
            bottom_critical_edge: bottom_critical_edge,
            slab_thickness: inputs.slab_thickness,
            fixing_position: genetic.fixing_position,
            dim_d: genetic.dim_d,
            // Add angle extension parameters
            max_allowable_bracket_extension: inputs.max_allowable_bracket_extension,
            enable_angle_extension: inputs.enable_angle_extension,
            bracket_type: genetic.bracket_type,
            angle_orientation: genetic.angle_orientation,
            current_angle_height: genetic.vertical_leg
        });
        
        bracket_height_calc = invertedResults.bracket_height;
        rise_to_bolts_calc = invertedResults.rise_to_bolts;
        rise_to_bolts_display_calc = invertedResults.rise_to_bolts_display;
        drop_below_slab_calc = invertedResults.drop_below_slab;
        dim_d_calc = invertedResults.dim_d;
        
        console.log(`  Inverted Bracket Results:`);
        console.log(`    Height Above SSL: ${invertedResults.height_above_ssl}mm`);
        console.log(`    Height Below SSL: ${invertedResults.height_below_ssl}mm`);
        console.log(`    Extension Below Slab: ${invertedResults.extension_below_slab}mm`);
        
    } else {
        // Use standard bracket calculation
        console.log(`  Using Standard Bracket Calculation Method`);
        bracket_height_calc = calculateStandardBracketHeight(
            inputs.support_level,
            top_critical_edge,
            Y,
            genetic.fixing_position
        );
        
        // Calculate rise to bolts for standard bracket
        rise_to_bolts_calc = calculateRiseToBolts({
            bracket_height: bracket_height_calc,
            distance_from_top_to_fixing: Y,
            worst_case_adjustment: BRACKET_ANGLE_CONSTANTS.WORST_CASE_ADJUSTMENT,
            bottom_critical_edge_distance: bottom_critical_edge,
            support_level: inputs.support_level,
            slab_thickness: inputs.slab_thickness,
            top_critical_edge_distance: top_critical_edge,
            fixing_position: genetic.fixing_position
        });

        // Calculate display value for standard brackets (middle-of-slot position)
        rise_to_bolts_display_calc = rise_to_bolts_calc + 15;

        // Calculate drop below slab for standard bracket based on actual bracket geometry
        const availableSpaceInSlab = inputs.slab_thickness - (genetic.fixing_position || 75);
        const bracketSpaceNeededBelowFixing = bracket_height_calc - Y; // Y = distance from bracket top to fixing
        const extensionBelowSlab = Math.max(0, bracketSpaceNeededBelowFixing - availableSpaceInSlab);

        drop_below_slab_calc = extensionBelowSlab;

        console.log(`  Standard Bracket Drop Below Slab Calculation:`);
        console.log(`    Available space in slab from fixing: ${availableSpaceInSlab}mm`);
        console.log(`    Bracket space needed below fixing: ${bracketSpaceNeededBelowFixing}mm`);
        console.log(`    Extension below slab: ${extensionBelowSlab}mm`);
    }
    
    // Apply angle orientation adjustments if needed
    if (
        (genetic.bracket_type === 'Standard' && genetic.angle_orientation === 'Inverted') ||
        (genetic.bracket_type === 'Inverted' && genetic.angle_orientation === 'Standard')
    ) {
        console.log(`  Applying vertical leg adjustment for mismatched orientation`);
        console.log(`  Bracket Type: ${genetic.bracket_type}, Angle Orientation: ${genetic.angle_orientation}`);
        console.log(`  Vertical Leg: ${genetic.vertical_leg}mm`);

        if (genetic.bracket_type === 'Standard' && genetic.angle_orientation === 'Inverted') {
            // Standard bracket with Inverted angle:
            // - Bracket top is at: fixing_point + Y (e.g., -75 + 40 = -35mm)
            // - Angle horizontal leg is at: support_level (e.g., -130mm)
            // - Angle vertical leg extends DOWN from horizontal leg by vertical_leg amount
            // - Angle bottom is at: support_level - vertical_leg (e.g., -130 - 60 = -190mm)
            // - Bracket must extend from bracket_top to angle_bottom

            const fixing_point = -(genetic.fixing_position || top_critical_edge); // e.g., -75mm
            const bracket_top = fixing_point + Y; // e.g., -75 + 40 = -35mm
            const angle_bottom = inputs.support_level - genetic.vertical_leg; // e.g., -130 - 60 = -190mm

            bracket_height_calc = Math.abs(bracket_top - angle_bottom); // e.g., |-35 - (-190)| = 155mm

            // Enforce 150mm minimum for standard brackets
            const min_standard_height = BRACKET_ANGLE_CONSTANTS.STANDARD_BRACKET_MIN_HEIGHT;
            if (bracket_height_calc < min_standard_height) {
                console.log(`  Bracket height ${bracket_height_calc}mm < minimum ${min_standard_height}mm, using minimum`);
                bracket_height_calc = min_standard_height;
            }

            console.log(`  Standard + Inverted Angle Geometry:`);
            console.log(`    Fixing point: ${fixing_point}mm`);
            console.log(`    Bracket top: ${bracket_top}mm`);
            console.log(`    Angle bottom: ${angle_bottom}mm`);
            console.log(`    Bracket height: ${bracket_height_calc}mm`);

        } else {
            // Inverted bracket with Standard angle:
            // The inverted bracket calculation already handles this in calculateInvertedBracketHeight
            // No additional adjustment needed here
            console.log(`  Inverted bracket with Standard angle already handled in calculateInvertedBracketHeight`);
        }

        // Recalculate rise to bolts based on the new bracket height
        rise_to_bolts_calc = calculateRiseToBolts({
            bracket_height: bracket_height_calc,
            distance_from_top_to_fixing: Y,
            worst_case_adjustment: BRACKET_ANGLE_CONSTANTS.WORST_CASE_ADJUSTMENT,
            bottom_critical_edge_distance: bottom_critical_edge,
            support_level: inputs.support_level,
            slab_thickness: inputs.slab_thickness,
            top_critical_edge_distance: top_critical_edge,
            fixing_position: genetic.fixing_position
        });

        // Recalculate display value for standard brackets after vertical leg adjustment
        if (genetic.bracket_type !== 'Inverted') {
            rise_to_bolts_display_calc = rise_to_bolts_calc + 15;
        }

        console.log(`  Recalculated rise to bolts: ${rise_to_bolts_calc}mm (display: ${rise_to_bolts_display_calc}mm)`);
    }

    console.log(`  Final Calculated Bracket Height: ${bracket_height_calc}mm`);
    console.log(`  Final Calculated Rise to Bolts: ${rise_to_bolts_calc}mm`);
    console.log(`  Final Calculated Drop Below Slab: ${drop_below_slab_calc}mm`);
    
    const final_bracket_height = roundToTwelveDecimals(bracket_height_calc);
    let final_rise_to_bolts = roundToTwelveDecimals(rise_to_bolts_calc);
    let final_rise_to_bolts_display = roundToTwelveDecimals(rise_to_bolts_display_calc);
    const final_drop_below_slab = roundToTwelveDecimals(drop_below_slab_calc);
    
    // Apply notch height reduction to rise to bolts if notch is present
    if (inputs.notch_height > 0) {
        // Calculate how much the bracket projects below the slab
        const projectionBelowSlab = Math.max(0, Math.abs(inputs.support_level) - inputs.slab_thickness);
        
        // Calculate effective notch height (only the portion above slab bottom)
        // If bracket projects 40mm below slab and notch is 55mm, only 15mm is above slab
        const effectiveNotchHeight = Math.max(0, inputs.notch_height - projectionBelowSlab);
        
        console.log(`  Notch calculation:`);
        console.log(`    Bracket projection below slab: ${projectionBelowSlab}mm`);
        console.log(`    Total notch height: ${inputs.notch_height}mm`);
        console.log(`    Effective notch height (above slab): ${effectiveNotchHeight}mm`);
        console.log(`    Reducing Rise to Bolts: ${final_rise_to_bolts} - ${effectiveNotchHeight}`);
        
        final_rise_to_bolts = roundToTwelveDecimals(final_rise_to_bolts - effectiveNotchHeight);
        final_rise_to_bolts_display = roundToTwelveDecimals(final_rise_to_bolts_display - effectiveNotchHeight);
        console.log(`    Final Rise to Bolts after notch reduction: ${final_rise_to_bolts}`);
        console.log(`    Final Rise to Bolts Display after notch reduction: ${final_rise_to_bolts_display}`);
    }
    
    console.log(`    Final Bracket Height = ${final_bracket_height}`);
    console.log(`    Final Rise to Bolts = ${final_rise_to_bolts}`);
    console.log(`    Final Drop Below Slab = ${final_drop_below_slab}`);

    // Calculate bracket projection: cavity width minus 10mm, rounded down to nearest 5mm
    const bracket_projection = Math.floor((inputs.cavity_width - 10) / 5) * 5;

    // Calculate bracket projection at fixing
    const bracket_projection_at_fixing = bracket_projection;

    // Calculate design UDL with safety factor
    const designUDL = loadingResults.designUDL ?? characteristicUDL * 1.35;
    
    // Calculate if BSL is above slab bottom
    // BSL is above slab bottom when absolute value of support level is less than slab thickness
    const bsl_above_slab_bottom = Math.abs(inputs.support_level) < inputs.slab_thickness;
    console.log(`  BSL Above Slab Bottom: ${bsl_above_slab_bottom} (|${inputs.support_level}| < ${inputs.slab_thickness})`);

    return {
        bracket_height: final_bracket_height,
        bracket_projection: bracket_projection,
        rise_to_bolts: final_rise_to_bolts,
        rise_to_bolts_display: final_rise_to_bolts_display,
        drop_below_slab: final_drop_below_slab,
        bracket_projection_at_fixing: bracket_projection_at_fixing,
        dim_d: dim_d_calc,
        bracket_type: genetic.bracket_type,
        angle_orientation: genetic.angle_orientation,
        shear_load: roundToTwelveDecimals(loadingResults.shearForce ?? 0),
        total_deflection: 0,
        characteristic_load: characteristicUDL,
        area_load: loadingResults.areaLoad ?? 0,
        characteristic_udl: characteristicUDL,
        design_udl: designUDL,
        slab_thickness: inputs.slab_thickness,
        support_level: inputs.support_level,
        cavity_width: inputs.cavity_width,
        masonry_thickness: masonry_thickness,
        notch_height: inputs.notch_height,
        notch_depth: inputs.notch_depth,
        E: 200000,
        n: 8,
        moment_resistance_check: false,
        shear_resistance_check: false,
        angle_deflection_check: false,
        bracket_connection_check: false,
        shear_reduction_check: false,
        bracket_design_check: false,
        fixing_check: false,
        combined_tension_shear_check: false,
        bsl_above_slab_bottom: bsl_above_slab_bottom,
        optimized_fixing_position: genetic.fixing_position,
        facade_thickness: inputs.facade_thickness,
        load_position: inputs.load_position,
        front_offset: inputs.front_offset,
        isolation_shim_thickness: inputs.isolation_shim_thickness,
        material_type: inputs.material_type
    };
}


/**
 * Runs the brute force algorithm to find the lightest valid masonry support design.
 *
 * @param config - Configuration object containing design inputs and algorithm parameters.
 * @returns An object containing the optimized masonry design and an empty history array.
 */
export async function runBruteForce(
    config: BruteForceConfig
): Promise<GeneticAlgorithmOutput> {
    console.log('!!! runBruteForce CALLED !!!');
    console.log('Brute Force: Starting with config:', JSON.stringify(config.designInputs, null, 2));

    // Debug facade parameter availability
    console.log('🔍 BRUTE FORCE DEBUG: Facade parameters in design inputs:');
    console.log('  facade_thickness:', config.designInputs.facade_thickness);
    console.log('  load_position:', config.designInputs.load_position);
    console.log('  front_offset:', config.designInputs.front_offset);
    console.log('  isolation_shim_thickness:', config.designInputs.isolation_shim_thickness);
    console.log('  material_type:', config.designInputs.material_type);

    const designInputs = config.designInputs;
    const isAngleLengthLimited = config.isAngleLengthLimited || false;
    const fixedAngleLength = config.fixedAngleLength;

    // 1. Generate all possible genetic parameter combinations (may include many fixing positions)
    const allCombinations = generateAllCombinations(designInputs);
    console.log(`Brute Force: Generated ${allCombinations.length} raw combinations (including fixing positions)`);

    // Stage 1: Deduplicate combinations based on whether we're doing fixing optimization
    let uniqueCombinations: GeneticParameters[];

    if (designInputs.use_custom_fixing_position) {
        // Custom mode: collapse by structural combo (single fixing position)
        const structuralKey = (g: GeneticParameters) => [
            g.bracket_centres,
            g.bracket_thickness,
            g.angle_thickness,
            g.bolt_diameter,
            g.bracket_type,
            g.angle_orientation,
            g.channel_type || 'CPRO38'
        ].join('|');

        const uniqueMap = new Map<string, GeneticParameters>();
        for (const g of allCombinations) {
            const key = structuralKey(g);
            if (!uniqueMap.has(key)) uniqueMap.set(key, g);
        }
        uniqueCombinations = Array.from(uniqueMap.values());
        console.log(`Brute Force: Custom mode - collapsed to ${uniqueCombinations.length} structural combinations`);
    } else {
        // Default optimization mode: preserve fixing positions for evaluation
        const fullKey = (g: GeneticParameters) => [
            g.bracket_centres,
            g.bracket_thickness,
            g.angle_thickness,
            g.bolt_diameter,
            g.bracket_type,
            g.angle_orientation,
            g.channel_type || 'CPRO38',
            g.fixing_position || 75
        ].join('|');

        const uniqueFullMap = new Map<string, GeneticParameters>();
        for (const g of allCombinations) {
            const key = fullKey(g);
            if (!uniqueFullMap.has(key)) uniqueFullMap.set(key, g);
        }
        uniqueCombinations = Array.from(uniqueFullMap.values());
        console.log(`Brute Force: Optimization mode - preserved ${uniqueCombinations.length} combinations with fixing positions`);
    }

    // Helper: nearest-lower channel edges
    const getEdges = (channelType: string, slabThickness: number, centres: number) => {
        const spec = getChannelSpec(channelType, slabThickness, centres);
        return {
            top: spec ? spec.edgeDistances.top : 75,
            bottom: spec ? spec.edgeDistances.bottom : 150
        };
    };


    // Helper: optimistic lower-bound weight for sorting
    const computeBound = (g: GeneticParameters, inputs: DesignInputs): number => {
        const channelType = g.channel_type || 'CPRO38';
        const { bottom } = getEdges(channelType, inputs.slab_thickness, g.bracket_centres);
        const fixingPosition = g.fixing_position ?? 75;
        const Y = BRACKET_ANGLE_CONSTANTS.DISTANCE_FROM_TOP_TO_FIXING;
        let Hmin: number;
        if (g.bracket_type === 'Inverted') {
            const inv = calculateInvertedBracketHeight({
                support_level: inputs.support_level > 0 ? inputs.support_level : Math.abs(inputs.support_level),
                angle_thickness: g.angle_thickness,
                top_critical_edge: 75,
                bottom_critical_edge: bottom,
                slab_thickness: inputs.slab_thickness,
                fixing_position: fixingPosition,
                dim_d: g.dim_d,
                // Add angle extension parameters
                max_allowable_bracket_extension: inputs.max_allowable_bracket_extension,
                enable_angle_extension: inputs.enable_angle_extension,
                bracket_type: g.bracket_type,
                angle_orientation: g.angle_orientation,
                current_angle_height: g.vertical_leg
            });
            Hmin = inv.bracket_height;
        } else {
            Hmin = Math.max(150, Math.abs(inputs.support_level) - fixingPosition + Y);
        }
        const proj = Math.floor((inputs.cavity_width - 10) / 5) * 5;
        const weight = calculateSystemWeight(Hmin, proj, g.bracket_thickness, g.bracket_centres, g.angle_thickness, g.vertical_leg, g.horizontal_leg);
        return weight.totalWeight;
    };

    // Build meta list and sort by bound
    const metaList = uniqueCombinations.map(g => ({ g, bound: computeBound(g, designInputs) }));
    metaList.sort((a, b) => a.bound - b.bound);
    console.log(`Brute Force: Sorted structural combos by optimistic weight bound`);

    // DEBUG: Log bounds for our specific combinations
    const m10_375_4_90 = metaList.find(m =>
        m.g.steel_bolt_size === 'M10' && m.g.bracket_centres === 375 && m.g.angle_thickness === 4 && m.g.fixing_position === 90
    );
    const m12_375_4_90 = metaList.find(m =>
        m.g.steel_bolt_size === 'M12' && m.g.bracket_centres === 375 && m.g.angle_thickness === 4 && m.g.fixing_position === 90
    );
    if (m10_375_4_90) console.log(`🎯 M10 375mm/4mm/90mm bound: ${m10_375_4_90.bound.toFixed(5)} kg/m, position: ${metaList.indexOf(m10_375_4_90) + 1}/${metaList.length}`);
    if (m12_375_4_90) console.log(`🎯 M12 375mm/4mm/90mm bound: ${m12_375_4_90.bound.toFixed(5)} kg/m, position: ${metaList.indexOf(m12_375_4_90) + 1}/${metaList.length}`);

    console.log('🎯🎯🎯 STRATIFIED SAMPLING CODE EXECUTING NOW 🎯🎯🎯');

    // Stratified sampling: ensure at least one combo from each fixing option is tested early
    // Group by fixing option and move the best from each group to the front
    const fixingOptionGroups = new Map<string, typeof metaList>();
    metaList.forEach((item) => {
        const fixingOpt = item.g.steel_bolt_size || item.g.channel_type || 'unknown';
        if (!fixingOptionGroups.has(fixingOpt)) {
            fixingOptionGroups.set(fixingOpt, []);
        }
        fixingOptionGroups.get(fixingOpt)!.push(item);
    });

    console.log(`Brute Force: Found ${fixingOptionGroups.size} fixing options: ${Array.from(fixingOptionGroups.keys()).join(', ')}`);

    // Take the first 500 (best bounds) from each fixing option and move them to front
    // This ensures that if the first combination from a fixing option fails validation,
    // we still evaluate many more combinations from that option before pruning
    const COMBINATIONS_PER_FIXING_OPTION = 500;
    const priorityItems: typeof metaList = [];

    for (const [fixingOpt, items] of fixingOptionGroups) {
        // Take up to 100 best combinations for this fixing option
        const numToTake = Math.min(COMBINATIONS_PER_FIXING_OPTION, items.length);
        priorityItems.push(...items.slice(0, numToTake));
    }

    // Remove priority items from main list and prepend them
    const prioritySignatures = new Set(priorityItems.map(item =>
        `${item.g.bracket_centres}-${item.g.bracket_thickness}-${item.g.angle_thickness}-${item.g.steel_bolt_size || item.g.channel_type}-${item.g.fixing_position}`
    ));

    const remainingItems = metaList.filter(item => {
        const sig = `${item.g.bracket_centres}-${item.g.bracket_thickness}-${item.g.angle_thickness}-${item.g.steel_bolt_size || item.g.channel_type}-${item.g.fixing_position}`;
        return !prioritySignatures.has(sig);
    });

    const reorderedMetaList = [...priorityItems, ...remainingItems];
    console.log(`Brute Force: Prioritized ${priorityItems.length} combinations (${COMBINATIONS_PER_FIXING_OPTION} per fixing option) to test first`);

    let bestValidDesign: Design | null = null;
    let minValidWeight = Infinity;
    
    // Track top N alternatives
    const TOP_N_ALTERNATIVES = 10;
    const topDesigns: AlternativeDesign[] = [];
    
    // Track standard angle designs separately for preference logic
    let bestStandardAngleDesign: Design | null = null;
    let minStandardAngleWeight = Infinity;
    
    // Tracking counters for debugging
    let standardAngleCount = 0;
    let invertedAngleCount = 0;
    let standardAnglePassCount = 0;
    let invertedAnglePassCount = 0;

    // Track progress
    const totalCombinations = metaList.length;
    let checkedCombinations = 0;
    const reportInterval = Math.max(1, Math.floor(totalCombinations / 100));

    // Track best design per channel family
    const bestByChannel = new Map<string, { design: Design; weight: number }>();

    // Track best design per steel bolt size (for steel frame fixings)
    const bestBySteelBolt = new Map<string, { design: Design; weight: number }>();

    // Track which fixing options have produced at least one VALID design (to prevent premature pruning)
    const validChannelTypes = new Set<string>();
    const validSteelBolts = new Set<string>();

    // Track which fixing options exist in the input (to know when we've covered all options)
    const allSteelBolts = new Set<string>();
    const allChannelTypes = new Set<string>();
    for (const { g } of reorderedMetaList) {
        if (g.steel_bolt_size) allSteelBolts.add(g.steel_bolt_size);
        if (g.channel_type) allChannelTypes.add(g.channel_type);
    }
    console.log(`Brute Force: Found ${allSteelBolts.size} steel bolt sizes: ${Array.from(allSteelBolts).join(', ')}`);
    console.log(`Brute Force: Found ${allChannelTypes.size} channel types: ${Array.from(allChannelTypes).join(', ')}`);

    // 2. Evaluate each structural combination in bound order with early pruning
    for (const { g: geneticParams, bound } of reorderedMetaList) {
        // Identify fixing option for this combination
        const fixingOption = geneticParams.steel_bolt_size || geneticParams.channel_type || 'unknown';

        // Check if ALL fixing options have at least one valid design
        const allSteelBoltsValid = Array.from(allSteelBolts).every(bolt => validSteelBolts.has(bolt));
        const allChannelTypesValid = allChannelTypes.size === 0 || Array.from(allChannelTypes).every(ch => validChannelTypes.has(ch));
        const allFixingOptionsValid = allSteelBoltsValid && allChannelTypesValid;

        // Branch-and-bound prune: if bound cannot beat current best, stop
        // BUT: keep evaluating until ALL fixing options have produced at least one valid design
        if (bestValidDesign && bound >= minValidWeight && allFixingOptionsValid) {
            console.log(`Brute Force: Pruning remaining ${totalCombinations - checkedCombinations} combos (bound ${bound.toFixed(3)} ≥ best ${minValidWeight.toFixed(3)})`);
            console.log(`  Current fixing option: ${fixingOption}`);
            console.log(`  Valid steel bolts so far: ${Array.from(validSteelBolts).join(', ') || 'none'}`);
            console.log(`  Valid channel types so far: ${Array.from(validChannelTypes).join(', ') || 'none'}`);
            break;
        }

        // Track angle orientation types
        if (geneticParams.angle_orientation === 'Standard') {
            standardAngleCount++;
        } else {
            invertedAngleCount++;
        }
        
        // Evaluation: handle combinations with or without fixing positions
        try {
            // Helper to eval one fixing position
            const evalAt = (fixPos: number) => {
                console.log(`🔧 Algorithm Loop: Creating genetic params with fixing_position=${fixPos}mm`);
                const currentDesign: Design = {
                    genetic: { ...geneticParams, fixing_position: fixPos },
                    calculated: {} as CalculatedParameters
                };
                console.log(`🔧 Algorithm Loop: Final genetic.fixing_position=${currentDesign.genetic.fixing_position}mm`);
                currentDesign.calculated = calculateDependentParameters(currentDesign.genetic, designInputs);
                const evaluationResult = evaluateBruteForceDesign(
                    currentDesign,
                    designInputs,
                    isAngleLengthLimited,
                    fixedAngleLength
                );
                return { evaluationResult, design: currentDesign };
            };

            // Use the fixing position from the combination
            const fixingPosition = geneticParams.fixing_position ?? 75;
            console.log(`🔧 Using fixing_position=${fixingPosition}mm from combination`);

            let { evaluationResult } = evalAt(fixingPosition);

            // Auto-adjust fixing position if exclusion zone conflicts with minimum bracket height
            if (!evaluationResult.isValid &&
                designInputs.enable_angle_extension &&
                designInputs.max_allowable_bracket_extension !== null &&
                geneticParams.bracket_type === 'Standard') {

                console.log(`⚠️  Design failed with fixing@${fixingPosition}mm. Checking if exclusion zone adjustment needed...`);

                // Determine fixing position constraints based on frame type
                const isSteelFrame = designInputs.frame_fixing_type?.startsWith('steel');
                let min_fixing_position = 75; // Default for concrete
                let max_fixing_position = designInputs.slab_thickness - 50; // Default for concrete

                if (isSteelFrame && designInputs.steel_section) {
                    // For steel, use M16 edge distance constraints
                    const M16_EDGE_DISTANCE_PER_SIDE = 21.6 / 2; // 10.8mm
                    const steelHeight = designInputs.steel_section.effectiveHeight;
                    min_fixing_position = Math.ceil(M16_EDGE_DISTANCE_PER_SIDE / 5) * 5; // 15mm
                    max_fixing_position = Math.floor((steelHeight - M16_EDGE_DISTANCE_PER_SIDE) / 5) * 5;
                }

                // Calculate required fixing position for exclusion zone
                const adjustmentResult = calculateRequiredFixingPositionForExclusionZone({
                    support_level: designInputs.support_level,
                    slab_or_steel_thickness: isSteelFrame ?
                        (designInputs.steel_section?.effectiveHeight ?? designInputs.slab_thickness) :
                        designInputs.slab_thickness,
                    max_allowable_bracket_extension: designInputs.max_allowable_bracket_extension,
                    bracket_type: geneticParams.bracket_type,
                    min_fixing_position,
                    max_fixing_position
                });

                if (adjustmentResult.achievable && adjustmentResult.required_fixing_position !== null) {
                    const adjustedFixing = adjustmentResult.required_fixing_position;
                    console.log(`🔧 EXCLUSION ZONE AUTO-ADJUSTMENT: Moving fixing from ${fixingPosition}mm to ${adjustedFixing}mm to achieve 150mm minimum bracket height`);

                    // Try with adjusted fixing position
                    const { evaluationResult: adjustedResult } = evalAt(adjustedFixing);

                    if (adjustedResult.isValid) {
                        console.log(`✅ ADJUSTED DESIGN VALID with fixing@${adjustedFixing}mm`);
                        // Use the adjusted result instead
                        evaluationResult = adjustedResult;

                        // Flag that this design used auto-adjusted fixing
                        if (evaluationResult.design.calculated) {
                            evaluationResult.design.calculated.fixing_position_auto_adjusted = true;
                            evaluationResult.design.calculated.original_fixing_position = fixingPosition;
                        }
                    } else {
                        console.log(`❌ Adjusted design still failed with fixing@${adjustedFixing}mm`);
                    }
                } else {
                    console.log(`❌ Cannot adjust fixing position: ${adjustmentResult.reason}`);
                }
            }

            if (evaluationResult.isValid) {
                // Track passing designs by angle type
                if (evaluationResult.design.genetic.angle_orientation === 'Standard') {
                    standardAnglePassCount++;
                } else {
                    invertedAnglePassCount++;
                }

                // Log successful steel bolt evaluation
                if (geneticParams.steel_bolt_size) {
                    console.log(`✅ STEEL BOLT ${geneticParams.steel_bolt_size} PASSED: Weight ${evaluationResult.totalWeight.toFixed(5)} kg/m`);
                    // Mark this steel bolt size as having a valid design (allows pruning for this bolt size)
                    validSteelBolts.add(geneticParams.steel_bolt_size);
                }
                if (geneticParams.channel_type) {
                    // Mark this channel type as having a valid design (allows pruning for this channel)
                    validChannelTypes.add(geneticParams.channel_type);
                }

                // Track if this is a standard angle design (both bracket and angle are standard)
                const isStandardAngleDesign =
                    evaluationResult.design.genetic.bracket_type === 'Standard' &&
                    evaluationResult.design.genetic.angle_orientation === 'Standard';

                // Update best design if current is lighter than the current best
                if (evaluationResult.totalWeight < minValidWeight) {
                    minValidWeight = evaluationResult.totalWeight;
                    bestValidDesign = evaluationResult.design;
                    const fixingPos = evaluationResult.design.calculated.optimized_fixing_position;
                    const fixingInfo = fixingPos ? ` (fixing @ ${fixingPos}mm)` : '';
                    console.log(`🏆 NEW BEST: ${minValidWeight.toFixed(5)} kg/m${fixingInfo} - ${geneticParams.bracket_type} bracket, ${geneticParams.angle_orientation} angle, ${geneticParams.bracket_centres}mm centres`);
                } else {
                    // Log when we find a valid solution that's not the best
                    const fixingPos = evaluationResult.design.calculated.optimized_fixing_position;
                    const fixingInfo = fixingPos ? ` (fixing @ ${fixingPos}mm)` : '';
                    console.log(`✓ Valid: ${evaluationResult.totalWeight.toFixed(5)} kg/m${fixingInfo} - not better than current best ${minValidWeight.toFixed(5)} kg/m`);
                }

                // Track best standard angle design separately
                if (isStandardAngleDesign && evaluationResult.totalWeight < minStandardAngleWeight) {
                    minStandardAngleWeight = evaluationResult.totalWeight;
                    bestStandardAngleDesign = evaluationResult.design;
                    const fixingPos = evaluationResult.design.calculated.optimized_fixing_position;
                    const fixingInfo = fixingPos ? ` (fixing @ ${fixingPos}mm)` : '';
                    console.log(`Brute Force: New best standard angle weight found: ${minStandardAngleWeight.toFixed(5)} kg/m${fixingInfo}`);
                }

                // Track best design per fixing option
                // For concrete: track by channel type (includes CPRO and R-HPTIII products)
                if (evaluationResult.design.genetic.channel_type) {
                    const ct = evaluationResult.design.genetic.channel_type;
                    const existing = bestByChannel.get(ct);
                    if (!existing || evaluationResult.totalWeight < existing.weight) {
                        bestByChannel.set(ct, { design: evaluationResult.design, weight: evaluationResult.totalWeight });
                    }
                }

                // For steel: track by bolt size
                if (evaluationResult.design.genetic.steel_bolt_size) {
                    const boltSize = evaluationResult.design.genetic.steel_bolt_size;
                    const existing = bestBySteelBolt.get(boltSize);
                    if (!existing || evaluationResult.totalWeight < existing.weight) {
                        bestBySteelBolt.set(boltSize, { design: evaluationResult.design, weight: evaluationResult.totalWeight });
                    }
                }
                
                // Track this design in top N alternatives
                const alternative: AlternativeDesign = {
                    design: evaluationResult.design,
                    totalWeight: evaluationResult.totalWeight,
                    weightDifferencePercent: 0, // Will be calculated later
                    keyDifferences: [], // Will be populated later
                    verificationMargins: {
                        momentMargin: evaluationResult.verificationResults.momentResults.passes ? 
                            (evaluationResult.verificationResults.momentResults.utilization ?? 0) : 0,
                        shearMargin: evaluationResult.verificationResults.shearResults.passes ?
                            (evaluationResult.verificationResults.shearResults.utilization ?? 0) : 0,
                        deflectionMargin: evaluationResult.verificationResults.deflectionResults.passes ?
                            (evaluationResult.verificationResults.deflectionResults.utilization ?? 0) : 0,
                        fixingMargin: 0 // FixingResults doesn't have utilization property
                    }
                };
                
                // Insert into sorted position in topDesigns
                topDesigns.push(alternative);
                topDesigns.sort((a, b) => a.totalWeight - b.totalWeight);
                
                // Keep only top N
                if (topDesigns.length > TOP_N_ALTERNATIVES) {
                    topDesigns.pop();
                }
            } else {
                // Log when steel bolt combinations fail
                if (geneticParams.steel_bolt_size) {
                    console.log(`❌ STEEL BOLT ${geneticParams.steel_bolt_size} FAILED validation at centres=${geneticParams.bracket_centres}mm, thickness=${geneticParams.bracket_thickness}mm`);
                }
            }
        } catch (error) {
            // Handle errors during calculation/evaluation for a specific combination
            console.error('❌ BRUTE FORCE ERROR: Failed to process combination');
            console.error('  Genetic parameters:', geneticParams);
            console.error('  Error details:', error);
            console.error('  Stack trace:', error instanceof Error ? error.stack : 'No stack trace');

            // Log facade parameters for debugging
            console.error('  Available facade parameters in designInputs:');
            console.error('    facade_thickness:', designInputs.facade_thickness);
            console.error('    load_position:', designInputs.load_position);
            console.error('    front_offset:', designInputs.front_offset);
            console.error('    isolation_shim_thickness:', designInputs.isolation_shim_thickness);
        }

        checkedCombinations++;

        // Note: We now only mark fixing options as validated when they produce a VALID design
        // (see lines 728-733). This prevents premature pruning when a fixing option's first
        // combinations fail but later ones might succeed.

        // Report progress periodically
        if (config.onProgress && (checkedCombinations % reportInterval === 0 || checkedCombinations === totalCombinations)) {
            const progressPercent = (checkedCombinations / totalCombinations);
            const scaledProgress = Math.floor(progressPercent * config.maxGenerations);
            config.onProgress(scaledProgress, config.maxGenerations, bestValidDesign ? -minValidWeight : -Infinity);
        }

        // Yield to browser occasionally to prevent blocking
        if (checkedCombinations % 500 === 0) {
            await new Promise(resolve => setTimeout(resolve, 0));
        }
    }

    if (!bestValidDesign) {
        if (config.onProgress) {
            config.onProgress(config.maxGenerations, config.maxGenerations, -Infinity);
        }
        throw new Error('Brute Force: No valid design found after checking all combinations.');
    }
    
    // Implement two-tier selection logic based on BSL position
    let finalSelectedDesign = bestValidDesign;
    let selectedWeight = minValidWeight;
    const alerts: string[] = [];

    // Add alerts for R-HPTIII channel types
    const selectedChannelType = finalSelectedDesign.genetic.channel_type || 'CPRO38';
    if (isRHPTIIIChannel(selectedChannelType)) {
        const characteristics = getProductCharacteristics(selectedChannelType);
        if (characteristics.utilizationWarning) {
            alerts.push(`⚠️ ${characteristics.utilizationWarning}`);
        }
        characteristics.specialNotes.forEach(note => {
            alerts.push(`ℹ️ ${note}`);
        });
        alerts.push(`🔍 Selected channel: ${selectedChannelType} requires engineering review`);
    }
    
    // Check if we need to prefer standard angle designs
    if (bestValidDesign.calculated.bsl_above_slab_bottom && bestStandardAngleDesign) {
        console.log(`Brute Force: BSL is above slab bottom, checking for standard angle preference...`);
        console.log(`  Best overall weight: ${minValidWeight.toFixed(5)} kg/m`);
        console.log(`  Best standard angle weight: ${minStandardAngleWeight.toFixed(5)} kg/m`);
        
        // Prefer standard angle design even if it's heavier
        finalSelectedDesign = bestStandardAngleDesign;
        selectedWeight = minStandardAngleWeight;
        console.log(`Brute Force: Selected standard angle design due to BSL position preference`);
    }
    
    // Check if the selected design requires an alert for inverted angle with bracket projection
    const requiresInvertedAngle = 
        finalSelectedDesign.genetic.bracket_type === 'Inverted' || 
        finalSelectedDesign.genetic.angle_orientation === 'Inverted';
    
    if (requiresInvertedAngle && finalSelectedDesign.calculated.drop_below_slab > 0) {
        alerts.push("A notch may be required if the full bearing of the slab (max rise to bolt) is utilised.");
        console.log(`Brute Force: Added notch alert for inverted angle solution`);
    }

    console.log(`Brute Force: Finished. Selected Weight: ${selectedWeight.toFixed(5)} kg/m`);
    console.log('Brute Force: Selected Design:', JSON.stringify(finalSelectedDesign, null, 2));
    console.log(`Brute Force: Found ${topDesigns.length} valid alternative designs`);
    console.log(`Brute Force: Tracked ${bestByChannel.size} channel type variants`);
    console.log(`Brute Force: Tracked ${bestBySteelBolt.size} steel bolt size variants`);
    if (alerts.length > 0) {
        console.log(`Brute Force: Generated ${alerts.length} alert(s)`);
    }
    
    // Log summary + angle type statistics
    console.log('\n=== EVALUATION SUMMARY ===');
    console.log(`Raw combinations generated: ${allCombinations.length}`);
    console.log(`Structural combos considered: ${metaList.length}`);
    console.log(`Structural combos evaluated: ${checkedCombinations}`);
    console.log(`Pruned by bound: ${metaList.length - checkedCombinations}`);
    console.log('\n=== ANGLE TYPE STATISTICS ===');
    console.log(`Evaluated standard angle combos: ${standardAngleCount}`);
    console.log(`Evaluated inverted angle combos: ${invertedAngleCount}`);
    console.log(`Standard angle designs that passed: ${standardAnglePassCount}`);
    console.log(`Inverted angle designs that passed: ${invertedAnglePassCount}`);
    console.log(`Best standard angle design found: ${bestStandardAngleDesign ? 'Yes' : 'No'}`);
    if (bestStandardAngleDesign) {
        console.log(`  Weight: ${minStandardAngleWeight.toFixed(5)} kg/m`);
    }
    console.log('===========================\n');

    // Post-process alternatives to calculate differences and identify key variations
    // Filter out the actual selected design to avoid duplicates
    const processedAlternatives = topDesigns
        .filter(alt => alt.design !== finalSelectedDesign)
        .map((alt) => {
        // Calculate weight difference percentage (use selected weight, not minimum weight)
        alt.weightDifferencePercent = ((alt.totalWeight - selectedWeight) / selectedWeight) * 100;
        
        // Identify key differences from optimal design
        const keyDiffs: string[] = [];
        
        // Compare bracket type
        if (alt.design.genetic.bracket_type !== finalSelectedDesign.genetic.bracket_type) {
            keyDiffs.push(`${alt.design.genetic.bracket_type} bracket (vs ${finalSelectedDesign.genetic.bracket_type})`);
        }
        
        // Compare angle orientation
        if (alt.design.genetic.angle_orientation !== finalSelectedDesign.genetic.angle_orientation) {
            keyDiffs.push(`${alt.design.genetic.angle_orientation} angle (vs ${finalSelectedDesign.genetic.angle_orientation})`);
        }
        
        // Compare bracket centres
        if (alt.design.genetic.bracket_centres !== finalSelectedDesign.genetic.bracket_centres) {
            keyDiffs.push(`${alt.design.genetic.bracket_centres}mm centers (vs ${finalSelectedDesign.genetic.bracket_centres}mm)`);
        }
        
        // Compare thicknesses
        if (alt.design.genetic.bracket_thickness !== finalSelectedDesign.genetic.bracket_thickness) {
            keyDiffs.push(`${alt.design.genetic.bracket_thickness}mm bracket (vs ${finalSelectedDesign.genetic.bracket_thickness}mm)`);
        }
        
        if (alt.design.genetic.angle_thickness !== finalSelectedDesign.genetic.angle_thickness) {
            keyDiffs.push(`${alt.design.genetic.angle_thickness}mm angle (vs ${finalSelectedDesign.genetic.angle_thickness}mm)`);
        }
        
        // Compare vertical leg
        if (alt.design.genetic.vertical_leg !== finalSelectedDesign.genetic.vertical_leg) {
            keyDiffs.push(`${alt.design.genetic.vertical_leg}mm vertical leg (vs ${finalSelectedDesign.genetic.vertical_leg}mm)`);
        }
        
        // Compare bolt diameter
        if (alt.design.genetic.bolt_diameter !== finalSelectedDesign.genetic.bolt_diameter) {
            keyDiffs.push(`M${alt.design.genetic.bolt_diameter} bolts (vs M${finalSelectedDesign.genetic.bolt_diameter})`);
        }
        // Compare channel type
        const altChannel = alt.design.genetic.channel_type || 'CPRO38';
        const selChannel = finalSelectedDesign.genetic.channel_type || 'CPRO38';
        if (altChannel !== selChannel) {
            keyDiffs.push(`${altChannel} channel (vs ${selChannel})`);
        }
        
        alt.keyDifferences = keyDiffs;
        return alt;
    });

    // Ensure best-per-channel-family alternatives are included
    const signature = (d: Design | { genetic: { bracket_centres: number; bracket_thickness: number; angle_thickness: number; bolt_diameter: number; bracket_type: string; angle_orientation: string; channel_type?: string; steel_bolt_size?: string } }) => [
        d.genetic.bracket_centres,
        d.genetic.bracket_thickness,
        d.genetic.angle_thickness,
        d.genetic.bolt_diameter,
        d.genetic.bracket_type,
        d.genetic.angle_orientation,
        d.genetic.channel_type || 'CPRO38',
        d.genetic.steel_bolt_size || 'N/A'
    ].join('|');

    const selectedSig = signature(finalSelectedDesign);
    const existingSigs = new Set<string>(processedAlternatives.map(a => signature(a.design)));

    const familyAlternatives: AlternativeDesign[] = [];

    // Add best-per-channel alternatives
    for (const entry of bestByChannel.values()) {
        const sig = signature(entry.design);
        if (sig === selectedSig || existingSigs.has(sig)) continue;
        const alt: AlternativeDesign = {
            design: entry.design,
            totalWeight: entry.weight,
            weightDifferencePercent: ((entry.weight - selectedWeight) / selectedWeight) * 100,
            keyDifferences: (() => {
                const diffs: string[] = [];
                if (entry.design.genetic.bracket_type !== finalSelectedDesign.genetic.bracket_type) {
                    diffs.push(`${entry.design.genetic.bracket_type} bracket (vs ${finalSelectedDesign.genetic.bracket_type})`);
                }
                if (entry.design.genetic.angle_orientation !== finalSelectedDesign.genetic.angle_orientation) {
                    diffs.push(`${entry.design.genetic.angle_orientation} angle (vs ${finalSelectedDesign.genetic.angle_orientation})`);
                }
                if (entry.design.genetic.bracket_centres !== finalSelectedDesign.genetic.bracket_centres) {
                    diffs.push(`${entry.design.genetic.bracket_centres}mm centers (vs ${finalSelectedDesign.genetic.bracket_centres}mm)`);
                }
                if (entry.design.genetic.bracket_thickness !== finalSelectedDesign.genetic.bracket_thickness) {
                    diffs.push(`${entry.design.genetic.bracket_thickness}mm bracket (vs ${finalSelectedDesign.genetic.bracket_thickness}mm)`);
                }
                if (entry.design.genetic.angle_thickness !== finalSelectedDesign.genetic.angle_thickness) {
                    diffs.push(`${entry.design.genetic.angle_thickness}mm angle (vs ${finalSelectedDesign.genetic.angle_thickness}mm)`);
                }
                if (entry.design.genetic.vertical_leg !== finalSelectedDesign.genetic.vertical_leg) {
                    diffs.push(`${entry.design.genetic.vertical_leg}mm vertical leg (vs ${finalSelectedDesign.genetic.vertical_leg}mm)`);
                }
                const entryCT = entry.design.genetic.channel_type || 'CPRO38';
                const selCT = finalSelectedDesign.genetic.channel_type || 'CPRO38';
                if (entryCT !== selCT) {
                    diffs.push(`${entryCT} channel (vs ${selCT})`);
                }
                return diffs;
            })(),
            verificationMargins: undefined
        };
        familyAlternatives.push(alt);
    }

    // Add best-per-steel-bolt alternatives
    for (const entry of bestBySteelBolt.values()) {
        const sig = signature(entry.design);
        if (sig === selectedSig || existingSigs.has(sig)) continue;
        const alt: AlternativeDesign = {
            design: entry.design,
            totalWeight: entry.weight,
            weightDifferencePercent: ((entry.weight - selectedWeight) / selectedWeight) * 100,
            keyDifferences: (() => {
                const diffs: string[] = [];
                if (entry.design.genetic.steel_bolt_size !== finalSelectedDesign.genetic.steel_bolt_size) {
                    diffs.push(`${entry.design.genetic.steel_bolt_size} bolts (vs ${finalSelectedDesign.genetic.steel_bolt_size || 'N/A'})`);
                }
                if (entry.design.genetic.bracket_type !== finalSelectedDesign.genetic.bracket_type) {
                    diffs.push(`${entry.design.genetic.bracket_type} bracket (vs ${finalSelectedDesign.genetic.bracket_type})`);
                }
                if (entry.design.genetic.angle_orientation !== finalSelectedDesign.genetic.angle_orientation) {
                    diffs.push(`${entry.design.genetic.angle_orientation} angle (vs ${finalSelectedDesign.genetic.angle_orientation})`);
                }
                return diffs;
            })(),
            verificationMargins: {
                momentMargin: 0,
                shearMargin: 0,
                deflectionMargin: 0,
                fixingMargin: 0
            }
        };
        familyAlternatives.push(alt);
    }

    // Combine alternatives, ensuring all fixing options (familyAlternatives) are included
    // even if they exceed TOP_N_ALTERNATIVES limit
    const combinedAlternatives = [...processedAlternatives, ...familyAlternatives];

    // Sort by weight
    const sortedAlternatives = combinedAlternatives.sort((a, b) => a.totalWeight - b.totalWeight);

    // Always include all familyAlternatives (different fixing options),
    // then fill remaining slots with processedAlternatives up to TOP_N limit
    const allAlternatives = [];
    const familySignatures = new Set(familyAlternatives.map(a => signature(a.design)));

    // First, add all family alternatives (different fixing options - must show all)
    allAlternatives.push(...familyAlternatives);

    // Then add other alternatives up to the limit
    for (const alt of sortedAlternatives) {
        const sig = signature(alt.design);
        if (!familySignatures.has(sig) && allAlternatives.length < TOP_N_ALTERNATIVES) {
            allAlternatives.push(alt);
        }
    }

    // Sort final list by weight
    allAlternatives.sort((a, b) => a.totalWeight - b.totalWeight);

    // Check if any alternatives use R-HPTIII products and add a general alert
    const rhptiiiAlternatives = allAlternatives.filter(alt =>
        isRHPTIIIChannel(alt.design.genetic.channel_type || 'CPRO38')
    );
    if (rhptiiiAlternatives.length > 0 && !isRHPTIIIChannel(selectedChannelType)) {
        alerts.push(`📋 ${rhptiiiAlternatives.length} R-HPTIII alternative(s) available - consider for high-load applications`);
    }

    // Format the output to match GeneticAlgorithmOutput
    const finalResult: OptimisationResult = {
        ...finalSelectedDesign,
        alternatives: allAlternatives,
        alerts: alerts.length > 0 ? alerts : undefined
    };

    return {
        result: finalResult,
        history: []
    };
}

 
