import { type LoadingCalculationInputs } from '@/types/userInputs';
import { validateLoadingInputs } from './validation';
import { roundToTwelveDecimals, kgM3ToNMm3, mToMm } from '@/utils/precision';

/**
 * Safety factors for design calculations
 */
export const SAFETY_FACTORS = {
    DEAD_LOAD: 1.35, // Safety factor for dead loads (self-weight)
    LIVE_LOAD: 1.5,  // Safety factor for live loads
} as const;

/**
 * Calculates the area load (N/mm²) based on masonry properties
 * Area load = density * gravity * height
 */
export const calculateAreaLoad = (
    density: number,  // kg/m³
    height: number,   // m
): number => {
    // Convert density from kg/m³ to N/mm³ (includes gravity)
    const densityNMm3 = kgM3ToNMm3(density);
    
    // Convert height to mm for consistent units
    const heightMm = mToMm(height);
    
    // Calculate area load in N/mm²
    const areaLoad = densityNMm3 * heightMm;
    
    return roundToTwelveDecimals(areaLoad);
};

/**
 * Calculates the characteristic UDL (Uniformly Distributed Load) in kN/m
 * UDL = area load * thickness
 */
export const calculateCharacteristicUDL = (
    areaLoad: number,     // N/mm²
    thickness: number,    // mm
): number => {
    // Calculate UDL in N/mm
    const udlNMm = areaLoad * thickness;
    
    // Convert to kN/m (1 N/mm = 1 kN/m)
    return roundToTwelveDecimals(udlNMm);
};

/**
 * Calculates the design UDL by applying appropriate safety factors
 */
export const calculateDesignUDL = (
    characteristicUDL: number,    // kN/m
    isDeadLoad: boolean = true,   // Whether to use dead load safety factor
): number => {
    const safetyFactor = isDeadLoad ? SAFETY_FACTORS.DEAD_LOAD : SAFETY_FACTORS.LIVE_LOAD;
    return roundToTwelveDecimals(characteristicUDL * safetyFactor);
};

/**
 * Calculates the shear force based on UDL and bracket centers
 * V_ed = D_udl * B_cc/1000
 */
export const calculateShearForce = (
    designUDL: number,        // kN/m
    bracketCentres: number,   // mm
): number => {
    // Calculate shear force: V_ed = D_udl * B_cc/1000
    const shearForce = designUDL * (bracketCentres / 1000);
    
    return roundToTwelveDecimals(shearForce);
};

/**
 * Results from loading calculations
 */
export interface LoadingResults {
    /** Area load in N/mm² (only if calculated from masonry properties) */
    areaLoad?: number;
    /** Characteristic UDL in kN/m */
    characteristicUDL: number;
    /** Design UDL in kN/m */
    designUDL: number;
    /** Shear force in kN (only if bracket centers provided) */
    shearForce: number | null;
}

/**
 * Performs all loading calculations given the input parameters
 * Returns the results of each calculation step
 */
export const calculateLoading = (inputs: LoadingCalculationInputs): LoadingResults => {
    // Validate inputs
    validateLoadingInputs(inputs);
    
    let characteristicUDL: number;
    let areaLoad: number | undefined;
    
    // If characteristic_load is provided, use it directly
    if (inputs.characteristic_load !== undefined) {
        characteristicUDL = inputs.characteristic_load;
        areaLoad = undefined; // We don't calculate area load in this case
    } else {
        // Calculate from masonry properties
        areaLoad = calculateAreaLoad(
            inputs.masonry_density,
            inputs.masonry_height
        );
        
        characteristicUDL = calculateCharacteristicUDL(
            areaLoad,
            inputs.masonry_thickness
        );
    }
    
    // Calculate design UDL
    const designUDL = calculateDesignUDL(characteristicUDL);
    
    // Calculate shear force if bracket centers are provided
    const shearForce = inputs.bracket_centres 
        ? calculateShearForce(designUDL, inputs.bracket_centres)
        : null;
    
    return {
        areaLoad,            // N/mm² (optional)
        characteristicUDL,   // kN/m
        designUDL,          // kN/m
        shearForce,         // kN
    };
}; 