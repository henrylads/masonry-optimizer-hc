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
}

export interface CalculatedParameters {
  bracket_height: number;
  bracket_projection: number;
  rise_to_bolts: number;
  drop_below_slab: number;
  bracket_projection_at_fixing: number;
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
    let drop_below_slab_calc: number;
    
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
            // Add angle extension parameters
            max_allowable_bracket_extension: inputs.max_allowable_bracket_extension,
            enable_angle_extension: inputs.enable_angle_extension,
            bracket_type: genetic.bracket_type,
            angle_orientation: genetic.angle_orientation,
            current_angle_height: genetic.vertical_leg
        });
        
        bracket_height_calc = invertedResults.bracket_height;
        rise_to_bolts_calc = invertedResults.rise_to_bolts;
        drop_below_slab_calc = invertedResults.drop_below_slab;
        
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
        
        // Calculate drop below slab for standard bracket
        // Drop below slab = how far the bracket extends past the slab soffit
        drop_below_slab_calc = Math.max(
            0,
            Math.abs(inputs.support_level) - inputs.slab_thickness
        );
    }
    
    // Apply angle orientation adjustments if needed
    if (
        (genetic.bracket_type === 'Standard' && genetic.angle_orientation === 'Inverted') ||
        (genetic.bracket_type === 'Inverted' && genetic.angle_orientation === 'Standard')
    ) {
        console.log(`  Applying vertical leg adjustment: +${genetic.vertical_leg}mm`);
        bracket_height_calc += genetic.vertical_leg;
        
        // IMPORTANT: Recalculate rise to bolts based on the new bracket height
        // Do NOT just add the vertical leg to the rise to bolts!
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
        
        console.log(`  Recalculated rise to bolts after adjustment: ${rise_to_bolts_calc}mm`);
    }

    console.log(`  Final Calculated Bracket Height: ${bracket_height_calc}mm`);
    console.log(`  Final Calculated Rise to Bolts: ${rise_to_bolts_calc}mm`);
    console.log(`  Final Calculated Drop Below Slab: ${drop_below_slab_calc}mm`);
    
    const final_bracket_height = roundToTwelveDecimals(bracket_height_calc);
    let final_rise_to_bolts = roundToTwelveDecimals(rise_to_bolts_calc);
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
        console.log(`    Final Rise to Bolts after notch reduction: ${final_rise_to_bolts}`);
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
        drop_below_slab: final_drop_below_slab,
        bracket_projection_at_fixing: bracket_projection_at_fixing,
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

    // 2. Evaluate each structural combination in bound order with early pruning
    for (const { g: geneticParams, bound } of metaList) {
        // Branch-and-bound prune: if bound cannot beat current best, stop
        if (bestValidDesign && bound >= minValidWeight) {
            console.log(`Brute Force: Pruning remaining ${totalCombinations - checkedCombinations} combos (bound ${bound.toFixed(3)} ≥ best ${minValidWeight.toFixed(3)})`);
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

            const { evaluationResult } = evalAt(fixingPosition);

            if (evaluationResult.isValid) {
                // Track passing designs by angle type
                if (evaluationResult.design.genetic.angle_orientation === 'Standard') {
                    standardAnglePassCount++;
                } else {
                    invertedAnglePassCount++;
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

                // Track best design per channel type
                const ct = evaluationResult.design.genetic.channel_type || 'CPRO38';
                const existing = bestByChannel.get(ct);
                if (!existing || evaluationResult.totalWeight < existing.weight) {
                    bestByChannel.set(ct, { design: evaluationResult.design, weight: evaluationResult.totalWeight });
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
    const signature = (d: Design | { genetic: { bracket_centres: number; bracket_thickness: number; angle_thickness: number; bolt_diameter: number; bracket_type: string; angle_orientation: string; channel_type?: string } }) => [
        d.genetic.bracket_centres,
        d.genetic.bracket_thickness,
        d.genetic.angle_thickness,
        d.genetic.bolt_diameter,
        d.genetic.bracket_type,
        d.genetic.angle_orientation,
        d.genetic.channel_type || 'CPRO38'
    ].join('|');

    const selectedSig = signature(finalSelectedDesign);
    const existingSigs = new Set<string>(processedAlternatives.map(a => signature(a.design)));

    const familyAlternatives: AlternativeDesign[] = [];
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

    const allAlternatives = [...processedAlternatives, ...familyAlternatives]
        .sort((a, b) => a.totalWeight - b.totalWeight)
        .slice(0, TOP_N_ALTERNATIVES);

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

 
