import { z } from 'zod'
import type { DesignInputs } from '@/types/designInputs'
import type { BruteForceConfig } from '@/calculations/bruteForceAlgorithm'
import type { RunOptimizationParams, ProgressUpdate } from '@/types/ai-tools'
import { getChannelSpec } from '@/data/channelSpecs'
import { calculateCharacteristicLoadFromMasonry } from '@/utils/parameter-extraction'

/**
 * Corrected DesignInputs schema that aligns with actual form validation ranges
 * This addresses the discrepancy where DesignInputsSchema didn't allow negative support levels
 */
const CorrectedDesignInputsSchema = z.object({
  support_level: z.number()
    .min(-600, "Support level must be at least -600mm")
    .max(500, "Support level must be at most 500mm"),
  
  cavity_width: z.number()
    .min(50, "Cavity width must be at least 50mm")
    .max(400, "Cavity width must be at most 400mm"),
  
  slab_thickness: z.number()
    .min(150, "Slab thickness must be at least 150mm")  // Form uses 150, not 100
    .max(500, "Slab thickness must be at most 500mm"),
  
  characteristic_load: z.number()
    .min(0, "Characteristic load must be positive")
    .max(20, "Characteristic load must be less than 20 kN/m"),
  
  top_critical_edge: z.number()
    .min(0, "Top critical edge must be positive")
    .max(1000, "Top critical edge must be less than 1000mm"),
  
  bottom_critical_edge: z.number()
    .min(0, "Bottom critical edge must be positive")
    .max(1000, "Bottom critical edge must be less than 1000mm"),
  
  notch_height: z.number()
    .min(0, "Notch height must be positive")
    .max(200, "Notch height must be less than 200mm"),
  
  notch_depth: z.number()
    .min(0, "Notch depth must be positive")
    .max(200, "Notch depth must be less than 200mm"),
    
  // Optional fields for masonry properties
  masonry_density: z.number()
    .min(1500, "Masonry density must be at least 1500 kg/m³")
    .max(2500, "Masonry density must be at most 2500 kg/m³")
    .optional(),
    
  masonry_thickness: z.number()
    .min(50, "Masonry thickness must be at least 50mm")
    .max(250, "Masonry thickness must be at most 250mm")
    .optional(),
    
  masonry_height: z.number()
    .min(1, "Masonry height must be at least 1m")
    .max(10, "Masonry height must be at most 10m")
    .optional(),
    
  // Fixing position optimization
  enable_fixing_optimization: z.boolean().optional(),
  
  fixing_position: z.number()
    .min(75, "Fixing position must be at least 75mm from top of slab")
    .max(400, "Fixing position must be at most 400mm from top of slab")
    .optional()
})

/**
 * Validate DesignInputs against the corrected schema that matches form validation
 */
function validateDesignInputsWithCorrectRanges(designInputs: DesignInputs): void {
  try {
    CorrectedDesignInputsSchema.parse(designInputs)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join('; ')
      throw new Error(`DesignInputs validation failed: ${errorMessages}`)
    }
    throw error
  }
}

/**
 * Convert chat-extracted parameters to DesignInputs format
 */
export function convertChatParamsToDesignInputs(params: RunOptimizationParams): DesignInputs {
  // Determine characteristic load
  let characteristicLoad: number
  
  if (params.characteristic_load && params.characteristic_load.trim() !== '') {
    characteristicLoad = parseFloat(params.characteristic_load)
    if (isNaN(characteristicLoad)) {
      throw new Error(`Invalid characteristic load value: ${params.characteristic_load}`)
    }
  } else if (params.masonry_density && params.masonry_thickness && params.masonry_height) {
    // Calculate from masonry properties
    characteristicLoad = calculateCharacteristicLoadFromMasonry(
      params.masonry_density,
      params.masonry_thickness,
      params.masonry_height
    )
  } else {
    throw new Error('Either characteristic_load or complete masonry properties must be provided')
  }
  
  // Get channel specifications for critical edge distances
  const channelType = "CPRO38" // Default channel type
  const bracketCentres = 500 // Default bracket centres for channel spec lookup
  const channelSpec = getChannelSpec(channelType, params.slab_thickness, bracketCentres)
  
  const topCriticalEdge = channelSpec ? channelSpec.edgeDistances.top : 75
  const bottomCriticalEdge = channelSpec ? channelSpec.edgeDistances.bottom : 150
  
  // Construct DesignInputs object
  const designInputs: DesignInputs = {
    support_level: params.support_level,
    cavity_width: params.cavity,
    slab_thickness: params.slab_thickness,
    characteristic_load: characteristicLoad,
    top_critical_edge: topCriticalEdge,
    bottom_critical_edge: bottomCriticalEdge,
    notch_height: params.notch_height || 0,
    notch_depth: params.notch_depth || 0,
    
    // Include masonry properties if provided (optional for DesignInputs)
    masonry_density: params.masonry_density,
    masonry_thickness: params.masonry_thickness,
    masonry_height: params.masonry_height,
    
    // Include fixing position optimization parameters
    enable_fixing_optimization: params.enable_fixing_optimization,
    fixing_position: params.fixing_position
  }
  
  // Validate the converted DesignInputs against the schema with corrected ranges
  validateDesignInputsWithCorrectRanges(designInputs)
  
  return designInputs
}

/**
 * Convert DesignInputs to BruteForceConfig format
 */
export function convertDesignInputsToBruteForceConfig(
  designInputs: DesignInputs,
  options: {
    isAngleLengthLimited?: boolean
    fixedAngleLength?: number
    maxGenerations?: number
    onProgress?: (generation: number, maxGenerations: number, bestFitness: number) => void
  } = {}
): BruteForceConfig {
  return {
    maxGenerations: options.maxGenerations || 100,
    designInputs,
    isAngleLengthLimited: options.isAngleLengthLimited || false,
    fixedAngleLength: options.fixedAngleLength,
    onProgress: options.onProgress
  }
}

/**
 * Direct conversion from chat parameters to BruteForceConfig
 */
export function convertChatParamsToBruteForceConfig(
  params: RunOptimizationParams,
  onProgress?: (update: ProgressUpdate) => void
): BruteForceConfig {
  // Convert to DesignInputs first
  const designInputs = convertChatParamsToDesignInputs(params)
  
  // Create progress callback that converts brute force progress to our format
  const bruteForceProgressCallback = onProgress ? (
    generation: number, 
    maxGenerations: number, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _bestFitness: number
  ) => {
    // Convert brute force progress to our progress format (30-90% range)
    const progressPercent = Math.round((generation / maxGenerations) * 60) + 30
    onProgress({
      stage: 'execution',
      progress: progressPercent,
      message: `Processing combination ${generation} of ${maxGenerations}`,
      currentStep: generation,
      totalSteps: maxGenerations
    })
  } : undefined
  
  // Convert to BruteForceConfig
  return convertDesignInputsToBruteForceConfig(designInputs, {
    isAngleLengthLimited: params.is_angle_length_limited || false,
    fixedAngleLength: params.fixed_angle_length,
    maxGenerations: 100,
    onProgress: bruteForceProgressCallback
  })
}

/**
 * Validate and normalize characteristic load value
 */
export function validateAndNormalizeCharacteristicLoad(
  characteristicLoad: string | number
): number {
  let normalizedLoad: number
  
  if (typeof characteristicLoad === 'string') {
    normalizedLoad = parseFloat(characteristicLoad.trim())
  } else {
    normalizedLoad = characteristicLoad
  }
  
  if (isNaN(normalizedLoad)) {
    throw new Error(`Invalid characteristic load value: ${characteristicLoad}`)
  }
  
  if (normalizedLoad <= 0) {
    throw new Error('Characteristic load must be greater than 0')
  }
  
  if (normalizedLoad > 20) {
    throw new Error('Characteristic load must be less than 20 kN/m')
  }
  
  return normalizedLoad
}

/**
 * Calculate critical edge distances based on slab thickness and bracket centres
 */
export function calculateCriticalEdgeDistances(
  slabThickness: number,
  bracketCentres: number = 500,
  channelType: string = "CPRO38"
): { top: number; bottom: number } {
  const channelSpec = getChannelSpec(channelType, slabThickness, bracketCentres)
  
  return {
    top: channelSpec ? channelSpec.edgeDistances.top : 75,
    bottom: channelSpec ? channelSpec.edgeDistances.bottom : 150
  }
}

/**
 * Validate that all required parameters are present for conversion
 */
export function validateParametersForConversion(params: Partial<RunOptimizationParams>): {
  isValid: boolean
  missingParams: string[]
  validationErrors: string[]
} {
  const missingParams: string[] = []
  const validationErrors: string[] = []
  
  // Check required structural parameters
  if (params.slab_thickness === undefined) {
    missingParams.push('slab_thickness')
  } else if (params.slab_thickness < 150 || params.slab_thickness > 500) {
    validationErrors.push('Slab thickness must be between 150-500mm')
  }
  
  if (params.cavity === undefined) {
    missingParams.push('cavity')
  } else {
    if (params.cavity < 50 || params.cavity > 400) {
      validationErrors.push('Cavity width must be between 50-400mm')
    }
    if ((params.cavity * 2) % 1 !== 0) {
      validationErrors.push('Cavity width must be in 0.5mm increments')
    }
  }
  
  if (params.support_level === undefined) {
    missingParams.push('support_level')
  } else if (params.support_level < -600 || params.support_level > 500) {
    validationErrors.push('Support level must be between -600 to 500mm')
  }
  
  // Check load calculation requirements
  const hasCharacteristicLoad = params.characteristic_load && params.characteristic_load.trim() !== ''
  const hasMasonryProperties = params.masonry_density !== undefined && 
                               params.masonry_thickness !== undefined && 
                               params.masonry_height !== undefined
  
  if (!hasCharacteristicLoad && !hasMasonryProperties) {
    missingParams.push('characteristic_load or complete masonry properties')
  }
  
  // Validate characteristic load if provided
  if (hasCharacteristicLoad) {
    try {
      validateAndNormalizeCharacteristicLoad(params.characteristic_load!)
    } catch (error) {
      validationErrors.push(error instanceof Error ? error.message : 'Invalid characteristic load')
    }
  }
  
  // Validate masonry properties if provided
  if (params.masonry_density !== undefined) {
    if (params.masonry_density < 1500 || params.masonry_density > 2500) {
      validationErrors.push('Masonry density must be between 1500-2500 kg/m³')
    }
  }
  
  if (params.masonry_thickness !== undefined) {
    if (params.masonry_thickness < 50 || params.masonry_thickness > 250) {
      validationErrors.push('Masonry thickness must be between 50-250mm')
    }
  }
  
  if (params.masonry_height !== undefined) {
    if (params.masonry_height < 1 || params.masonry_height > 10) {
      validationErrors.push('Masonry height must be between 1-10m')
    }
  }
  
  // Check conditional requirements
  if (params.has_notch === true) {
    if (params.notch_height === undefined) {
      missingParams.push('notch_height')
    } else if (params.notch_height < 10 || params.notch_height > 200) {
      validationErrors.push('Notch height must be between 10-200mm')
    }
    
    if (params.notch_depth === undefined) {
      missingParams.push('notch_depth')
    } else if (params.notch_depth < 10 || params.notch_depth > 200) {
      validationErrors.push('Notch depth must be between 10-200mm')
    }
  }
  
  if (params.is_angle_length_limited === true) {
    if (params.fixed_angle_length === undefined) {
      missingParams.push('fixed_angle_length')
    } else {
      if (params.fixed_angle_length < 200 || params.fixed_angle_length > 1490) {
        validationErrors.push('Fixed angle length must be between 200-1490mm')
      }
      if (params.fixed_angle_length % 5 !== 0) {
        validationErrors.push('Fixed angle length must be in 5mm increments')
      }
    }
  }
  
  // Validate fixing position if provided
  if (params.fixing_position !== undefined) {
    if (params.fixing_position < 75 || params.fixing_position > 400) {
      validationErrors.push('Fixing position must be between 75-400mm from top of slab')
    }
    
    // Additional validation: ensure fixing position doesn't violate slab constraints
    if (params.slab_thickness !== undefined) {
      // Check that fixing position doesn't go too deep (maintain bottom critical edge)
      const maxDepth = params.slab_thickness - 75 // Conservative check using 75mm bottom edge
      if (params.fixing_position > maxDepth) {
        validationErrors.push(`Fixing position too deep for ${params.slab_thickness}mm slab (max: ${maxDepth}mm)`)
      }
    }
  }
  
  return {
    isValid: missingParams.length === 0 && validationErrors.length === 0,
    missingParams,
    validationErrors
  }
}

/**
 * Create a summary of the parameters that will be used for optimization
 */
export function createParameterSummary(params: RunOptimizationParams): {
  structural: Record<string, string>
  loading: Record<string, string>
  optional: Record<string, string>
} {
  const structural: Record<string, string> = {
    'Slab Thickness': `${params.slab_thickness}mm`,
    'Cavity Width': `${params.cavity}mm`,
    'Support Level': `${params.support_level}mm`
  }
  
  const loading: Record<string, string> = {}
  
  if (params.characteristic_load) {
    loading['Characteristic Load'] = `${params.characteristic_load} kN/m`
  } else if (params.masonry_density && params.masonry_thickness && params.masonry_height) {
    loading['Masonry Density'] = `${params.masonry_density} kg/m³`
    loading['Masonry Thickness'] = `${params.masonry_thickness}mm`
    loading['Masonry Height'] = `${params.masonry_height}m`
    
    // Calculate and show the derived characteristic load
    const calculatedLoad = calculateCharacteristicLoadFromMasonry(
      params.masonry_density,
      params.masonry_thickness,
      params.masonry_height
    )
    loading['Calculated Characteristic Load'] = `${calculatedLoad.toFixed(3)} kN/m`
  }
  
  const optional: Record<string, string> = {}
  
  if (params.has_notch) {
    optional['Notch Required'] = 'Yes'
    optional['Notch Height'] = `${params.notch_height || 0}mm`
    optional['Notch Depth'] = `${params.notch_depth || 0}mm`
  } else {
    optional['Notch Required'] = 'No'
  }
  
  if (params.is_angle_length_limited) {
    optional['Angle Length Limited'] = 'Yes'
    optional['Fixed Angle Length'] = `${params.fixed_angle_length || 0}mm`
  } else {
    optional['Angle Length Limited'] = 'No'
  }
  
  if (params.enable_fixing_optimization) {
    optional['Fixing Optimization'] = 'Enabled'
    optional['Initial Fixing Position'] = `${params.fixing_position || 75}mm from top`
  } else {
    optional['Fixing Optimization'] = 'Disabled'
    if (params.fixing_position && params.fixing_position !== 75) {
      optional['Fixed Fixing Position'] = `${params.fixing_position}mm from top`
    }
  }
  
  return { structural, loading, optional }
} 