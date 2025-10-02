import { roundToTwelveDecimals } from '@/utils/precision';
import { getChannelSpec } from '@/data/channelSpecs';
import { SYSTEM_DEFAULTS } from '@/constants';

/**
 * Constants for fixing calculations
 */
const FIXING_CONSTANTS = {
    /** Default load factor if not provided */
    DEFAULT_LOAD_FACTOR: 1.35,
    /** Default concrete grade if not provided (N/mm²) */
    DEFAULT_CONCRETE_GRADE: 30,
    /** Concrete stress block factor */
    ALPHA_CC: 0.85,
    /** Material safety factor for concrete */
    GAMMA_C: 1.5
} as const;

/**
 * Results from tensile load calculations
 */
export interface TensileLoadResults {
    /** Tensile load in stud group (kN) */
    tensileLoad: number;
    /** Length of compression zone (mm) */
    compressionZoneLength: number;
    /** Whether moment equilibrium is satisfied */
    momentEquilibriumPasses: boolean;
    /** Whether shear equilibrium is satisfied */
    shearEquilibriumPasses: boolean;
    /** Whether depth check passes */
    depthCheckPasses: boolean;
}

/**
 * Interface for fixing verification results
 */
export interface FixingResults {
    /** Design shear force (kN) */
    appliedShear: number;
    /** Design moment (kNm) */
    appliedMoment: number;
    /** Design tensile force (kN) */
    tensileForce: number;
    /** Results from tensile load calculation */
    tensileLoadResults: TensileLoadResults;
    /** Channel shear capacity (kN) */
    channelShearCapacity?: number;
    /** Channel tension capacity (kN) */
    channelTensionCapacity?: number;
    /** Whether channel shear check passes */
    channelShearCheckPasses?: boolean;
    /** Whether channel tension check passes */
    channelTensionCheckPasses?: boolean;
    /** Whether all checks pass */
    passes: boolean;
}

/**
 * Calculates tensile load in stud group according to project overview
 * All intermediate calculations maintain full precision
 * Only final results are rounded to 12 decimal places
 * 
 * @param M_ed Design moment (kNm)
 * @param w Base plate width (mm)
 * @param x Rise to bolts (mm)
 * @param f_cd Design compressive strength of concrete (N/mm²)
 * @returns Results of tensile load calculation
 */
export function calculateTensileLoad(
    M_ed: number,
    w: number,
    x: number,
    f_cd: number
): TensileLoadResults {
    // Convert units as per project overview
    const momentToBeResisted = M_ed * 1000; // Convert kNm to Nm
    const basePlateWidthM = w / 1000; // Convert mm to m
    const riseToBoltsM = x / 1000; // Convert mm to m
    const gradeOfConcreteNM2 = f_cd * 1000000; // Convert N/mm² to N/m²

    // Calculate quadratic equation coefficients
    // Keep full precision for intermediate calculations
    const a = (2/3) * (1 / (gradeOfConcreteNM2 * basePlateWidthM)); // Using ⅔ as per project overview
    const b = -riseToBoltsM;
    const c = momentToBeResisted;

    // Calculate discriminant
    const discriminant = b * b - 4 * a * c;

    // Handle negative discriminant case
    if (discriminant < 0) {
        return {
            tensileLoad: 0,
            compressionZoneLength: 0,
            momentEquilibriumPasses: false,
            shearEquilibriumPasses: false,
            depthCheckPasses: false
        };
    }

    // Calculate tensile load using quadratic formula
    // Keep full precision for intermediate calculations
    const tensileLoadN = (-b - Math.sqrt(discriminant)) / (2 * a);
    const tensileLoadKN = tensileLoadN / 1000;

    // Calculate compression zone length
    // Keep full precision for intermediate calculations
    const compressionZoneLengthM = 2 * tensileLoadN / (gradeOfConcreteNM2 * basePlateWidthM);
    const compressionZoneLengthMM = compressionZoneLengthM * 1000;

    // Check moment equilibrium
    // Keep full precision for intermediate calculations
    const momentEquilibrium = tensileLoadN * (riseToBoltsM - compressionZoneLengthM) +
        gradeOfConcreteNM2 * basePlateWidthM * (1/3) * compressionZoneLengthM * compressionZoneLengthM - 
        momentToBeResisted;

    // Check shear equilibrium
    // Keep full precision for intermediate calculations
    const shearEquilibrium = tensileLoadN - 
        compressionZoneLengthM * gradeOfConcreteNM2 * basePlateWidthM * 0.5;

    // Check depth
    const depthCheckPasses = compressionZoneLengthM <= riseToBoltsM;

    return {
        tensileLoad: roundToTwelveDecimals(tensileLoadKN),
        compressionZoneLength: roundToTwelveDecimals(compressionZoneLengthMM),
        momentEquilibriumPasses: Math.abs(momentEquilibrium) < 0.00001,
        shearEquilibriumPasses: Math.abs(shearEquilibrium) < 0.00001,
        depthCheckPasses
    };
}

/**
 * Verifies fixing according to project overview, including channel capacity checks.
 * All intermediate calculations maintain full precision.
 * Only final results are rounded to 12 decimal places.
 *
 * @param appliedShear Applied shear force (kN) - Note: This is the external shear on the bracket, not necessarily the final shear on the fixing bolts after moment consideration.
 * @param design_cavity Design cavity C' (mm)
 * @param masonry_thickness Masonry thickness M (mm)
 * @param basePlateWidth Base plate width (mm) (default: 56mm from SYSTEM_DEFAULTS)
 * @param riseToBolts Rise to bolts (mm)
 * @param channelType The type identifier for the channel (e.g., 'CPRO38')
 * @param slabThickness The thickness of the concrete slab (mm)
 * @param bracketCentres The spacing between brackets (mm) - Used for channel lookup
 * @param concreteGrade Concrete grade in N/mm² (default 30)
 * @param load_position Load position as fraction of facade thickness (0-1 range, default 1/3)
 * @returns Results of fixing verification
 */
export function verifyFixing(
    appliedShear: number, // Renamed from V_ed_external or similar for clarity
    design_cavity: number,
    masonry_thickness: number,
    basePlateWidth: number = SYSTEM_DEFAULTS.BASE_PLATE_WIDTH,
    riseToBolts: number,
    channelType: string,          // Added parameter
    slabThickness: number,       // Added parameter
    bracketCentres: number,      // Added parameter
    concreteGrade: number = FIXING_CONSTANTS.DEFAULT_CONCRETE_GRADE,
    load_position: number = 1/3  // Default to 1/3 for backward compatibility
): FixingResults {
    // Calculate L = C' + (facade_thickness × load_position)
    // Per reference document: L = cavity + facade_thickness × load_position
    // Note: masonry_thickness parameter is actually facade_thickness from frontend
    const L = design_cavity + (masonry_thickness * load_position);

    // Calculate design forces on the fixing interface
    const V_ed_fixing = appliedShear;  // Shear force directly applied to fixing
    const M_ed = (V_ed_fixing * L) / 1000; // Convert to kNm

    // Calculate tensile load results using plain concrete grade
    const tensileLoadResults = calculateTensileLoad(
        M_ed,
        basePlateWidth,
        riseToBolts,
        concreteGrade
    );

    const N_ed_fixing = tensileLoadResults.tensileLoad; // Tensile force on fixing

    // --- Channel Capacity Check ---
    const channelSpec = getChannelSpec(channelType, slabThickness, bracketCentres);
    
    let channelShearCapacity: number | undefined = undefined;
    let channelTensionCapacity: number | undefined = undefined;
    let channelShearCheckPasses: boolean | undefined = undefined;
    let channelTensionCheckPasses: boolean | undefined = undefined;

    if (channelSpec) {
        channelShearCapacity = channelSpec.maxForces.shear;
        channelTensionCapacity = channelSpec.maxForces.tension;
        
        // Check calculated forces against channel capacities
        // Note: V_ed_fixing is used for shear check as it's the shear at the fixing plane
        channelShearCheckPasses = V_ed_fixing <= channelShearCapacity;
        channelTensionCheckPasses = N_ed_fixing <= channelTensionCapacity;
    } else {
        // Handle case where channel spec is not found - fail checks
        channelShearCheckPasses = false;
        channelTensionCheckPasses = false;
        console.warn(`Channel spec not found for: ${channelType}, ${slabThickness}, ${bracketCentres}`);
    }
    // --- End Channel Capacity Check ---

    // Check if all concrete and channel verifications pass
    const concreteChecksPass = tensileLoadResults.momentEquilibriumPasses &&
        tensileLoadResults.shearEquilibriumPasses &&
        tensileLoadResults.depthCheckPasses;
        
    const allChecksPass = concreteChecksPass && 
                          (channelShearCheckPasses === true) && 
                          (channelTensionCheckPasses === true);

    return {
        appliedShear: roundToTwelveDecimals(V_ed_fixing),
        appliedMoment: roundToTwelveDecimals(M_ed),
        tensileForce: roundToTwelveDecimals(N_ed_fixing),
        tensileLoadResults,
        channelShearCapacity: channelShearCapacity ? roundToTwelveDecimals(channelShearCapacity) : undefined,
        channelTensionCapacity: channelTensionCapacity ? roundToTwelveDecimals(channelTensionCapacity) : undefined,
        channelShearCheckPasses,
        channelTensionCheckPasses,
        passes: allChecksPass
    };
} 