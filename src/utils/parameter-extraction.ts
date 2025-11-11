import { z } from 'zod'
import type { 
  ExtractedParameter, 
  ParameterExtractionResult, 
  ValidationError, 
  FormDataType 
} from '@/types/chat-types'

// Import the form schema for validation
import { formSchema } from '@/types/form-schema'

/**
 * Enhanced validation result with more details
 */
export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: string[]
  suggestions: string[]
}

/**
 * Validate a complete set of extracted parameters against the form schema
 */
export function validateExtractedParameters(parameters: ExtractedParameter[]): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: string[] = []
  const suggestions: string[] = []

  // Skip Zod validation for now and only use custom validation
  // to avoid duplicate error reporting
  
  // Add specific validation checks
  addRangeValidations(parameters, errors, warnings, suggestions)
  addLogicalValidations(parameters, errors, warnings, suggestions)
  addPracticalValidations(parameters, warnings, suggestions)

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions
  }
}

/**
 * Add range-based validation checks
 */
function addRangeValidations(
  parameters: ExtractedParameter[], 
  errors: ValidationError[], 
  warnings: string[], 
  suggestions: string[]
): void {
  parameters.forEach(param => {
    const { field, value } = param

    switch (field) {
      case 'slab_thickness':
        if (typeof value === 'number') {
          if (value < 150) {
            errors.push({
              field,
              message: 'Slab thickness must be at least 150mm',
              currentValue: value
            })
          } else if (value > 500) {
            errors.push({
              field,
              message: 'Slab thickness must be at most 500mm',
              currentValue: value
            })
          } else if (value < 200) {
            warnings.push('Slab thickness below 200mm may require special consideration')
          } else if (value > 400) {
            warnings.push('Very thick slab - ensure this is correct')
          }
        }
        break

      case 'cavity':
        if (typeof value === 'number') {
          if (value < 50) {
            errors.push({
              field,
              message: 'Cavity width must be at least 50mm',
              currentValue: value
            })
          } else if (value > 400) {
            errors.push({
              field,
              message: 'Cavity width must be at most 400mm', 
              currentValue: value
            })
          }
          
          // Check 0.5mm increment requirement
          if ((value * 2) % 1 !== 0) {
            errors.push({
              field,
              message: 'Cavity width must be in 0.5mm increments',
              currentValue: value
            })
            suggestions.push(`Try ${Math.round(value * 2) / 2}mm for cavity width`)
          }
        }
        break

      case 'support_level':
        if (typeof value === 'number') {
          if (value < -600) {
            errors.push({
              field,
              message: 'Support level must be at least -600mm',
              currentValue: value
            })
          } else if (value > 500) {
            errors.push({
              field,
              message: 'Support level must be at most 500mm',
              currentValue: value
            })
          }
        }
        break

      case 'notch_height':
      case 'notch_depth':
        if (typeof value === 'number') {
          if (value < 10) {
            errors.push({
              field,
              message: `${field.replace('_', ' ')} must be at least 10mm`,
              currentValue: value
            })
          } else if (value > 200) {
            errors.push({
              field,
              message: `${field.replace('_', ' ')} must be at most 200mm`,
              currentValue: value
            })
          }
        }
        break

      case 'fixed_angle_length':
        if (typeof value === 'number') {
          if (value < 200) {
            errors.push({
              field,
              message: 'Fixed angle length must be at least 200mm',
              currentValue: value
            })
          } else if (value > 1490) {
            errors.push({
              field,
              message: 'Fixed angle length must be at most 1490mm',
              currentValue: value
            })
          } else if (value % 5 !== 0) {
            errors.push({
              field,
              message: 'Fixed angle length must be in 5mm increments',
              currentValue: value
            })
            suggestions.push(`Try ${Math.round(value / 5) * 5}mm for angle length`)
          }
        }
        break
    }
  })
}

/**
 * Add logical/conditional validation checks
 */
function addLogicalValidations(
  parameters: ExtractedParameter[],
  errors: ValidationError[],
  warnings: string[],
  suggestions: string[]
): void {
  const paramMap = new Map(parameters.map(p => [p.field, p.value]))

  // Validate notch-related parameters
  const hasNotch = paramMap.get('has_notch')
  if (hasNotch === true) {
    const notchHeight = paramMap.get('notch_height')
    const notchDepth = paramMap.get('notch_depth')

    if (notchHeight === undefined) {
      warnings.push('Notch is required but height is not specified')
      suggestions.push('Please specify the notch height (10-200mm)')
    }

    if (notchDepth === undefined) {
      warnings.push('Notch is required but depth is not specified')
      suggestions.push('Please specify the notch depth (10-200mm)')
    }

    // Cross-validate notch dimensions
    if (typeof notchHeight === 'number' && typeof notchDepth === 'number') {
      if (notchHeight > 150 && notchDepth > 150) {
        warnings.push('Large notch dimensions may significantly affect bracket strength')
      }
    }
  } else if (hasNotch === false) {
    // Warn if notch dimensions are specified but notch is disabled
    if (paramMap.has('notch_height') || paramMap.has('notch_depth')) {
      warnings.push('Notch dimensions specified but notch is disabled')
    }
  }

  // Validate angle length limitation
  const isAngleLengthLimited = paramMap.get('is_angle_length_limited')
  if (isAngleLengthLimited === true) {
    const fixedAngleLength = paramMap.get('fixed_angle_length')
    if (fixedAngleLength === undefined) {
      warnings.push('Angle length is limited but constraint value is not specified')
      suggestions.push('Please specify the maximum angle length (200-1490mm)')
    }
  } else if (isAngleLengthLimited === false) {
    if (paramMap.has('fixed_angle_length')) {
      warnings.push('Fixed angle length specified but limitation is disabled')
    }
  }

  // Validate characteristic load vs masonry properties
  const hasCharacteristicLoad = paramMap.has('characteristic_load')
  const hasMasonryDensity = paramMap.has('masonry_density')
  const hasMasonryThickness = paramMap.has('masonry_thickness')
  const hasMasonryHeight = paramMap.has('masonry_height')

  if (hasCharacteristicLoad && (hasMasonryDensity || hasMasonryThickness || hasMasonryHeight)) {
    warnings.push('Both characteristic load and masonry properties provided - using characteristic load')
  }

  if (!hasCharacteristicLoad && !(hasMasonryDensity && hasMasonryThickness && hasMasonryHeight)) {
    warnings.push('Need either characteristic load or complete masonry properties')
    suggestions.push('Provide either: 1) Characteristic load in kN/m, or 2) Masonry density, thickness, and height')
  }
}

/**
 * Add practical engineering validation checks
 */
function addPracticalValidations(
  parameters: ExtractedParameter[],
  warnings: string[],
  suggestions: string[]
): void {
  const paramMap = new Map(parameters.map(p => [p.field, p.value]))

  const slabThickness = paramMap.get('slab_thickness') as number | undefined
  const cavity = paramMap.get('cavity') as number | undefined
  const supportLevel = paramMap.get('support_level') as number | undefined

  // Check slab thickness vs cavity relationship
  if (slabThickness && cavity) {
    if (cavity > slabThickness) {
      warnings.push('Cavity width is larger than slab thickness - verify this is correct')
    }
    
    if (cavity < slabThickness * 0.2) {
      suggestions.push('Small cavity relative to slab thickness - consider thermal bridging')
    }
  }

  // Check support level practicality
  if (supportLevel !== undefined) {
    if (supportLevel < -300) {
      warnings.push('Deep support level below SSL - ensure adequate structural support')
    }
    
    if (supportLevel > 200) {
      warnings.push('High support level above SSL - verify construction sequence')
    }
  }

  // Check masonry properties consistency
  const masonryDensity = paramMap.get('masonry_density') as number | undefined
  const masonryThickness = paramMap.get('masonry_thickness') as number | undefined

  if (masonryDensity && masonryThickness) {
    if (masonryDensity > 2200 && masonryThickness < 100) {
      warnings.push('High density masonry with thin thickness - verify load calculations')
    }
    
    if (masonryDensity < 1700 && masonryThickness > 200) {
      suggestions.push('Low density masonry - consider lightweight design optimizations')
    }
  }
}

/**
 * Check if parameters meet minimum requirements for optimization
 */
export function canProceedWithOptimization(parameters: ExtractedParameter[]): {
  canProceed: boolean
  missingCritical: string[]
  recommendations: string[]
} {
  const paramMap = new Map(parameters.map(p => [p.field, p.value]))
  const missingCritical: string[] = []
  const recommendations: string[] = []

  // Check required parameters
  const requiredFields = ['slab_thickness', 'cavity', 'support_level']
  
  requiredFields.forEach(field => {
    if (!paramMap.has(field as keyof FormDataType)) {
      missingCritical.push(field.replace('_', ' '))
    }
  })

  // Check load information
  const hasCharacteristicLoad = paramMap.has('characteristic_load')
  const canCalculateLoad = canCalculateCharacteristicLoad(parameters)
  
  if (!hasCharacteristicLoad && !canCalculateLoad) {
    missingCritical.push('characteristic load or masonry properties')
  }

  // Check conditional requirements
  const hasNotch = paramMap.get('has_notch')
  if (hasNotch === true) {
    if (!paramMap.has('notch_height')) missingCritical.push('notch height')
    if (!paramMap.has('notch_depth')) missingCritical.push('notch depth')
  }

  const isAngleLimited = paramMap.get('is_angle_length_limited')
  if (isAngleLimited === true && !paramMap.has('fixed_angle_length')) {
    missingCritical.push('fixed angle length')
  }

  // Add recommendations
  if (missingCritical.length === 0) {
    recommendations.push('All required parameters collected - ready for optimization')
    
    // Add optimization tips
    if (hasCharacteristicLoad) {
      recommendations.push('Using provided characteristic load for calculations')
    } else if (canCalculateLoad) {
      recommendations.push('Will calculate characteristic load from masonry properties')
    }
  }

  return {
    canProceed: missingCritical.length === 0,
    missingCritical,
    recommendations
  }
}

/**
 * Extract numerical values with units from text
 */
function extractNumbersWithUnits(text: string): Array<{ value: number; unit: string; context: string }> {
  const results: Array<{ value: number; unit: string; context: string }> = []
  
  // More specific patterns for better context matching
  const specificPatterns = [
    // Slab thickness patterns
    /(?:slab\s+thickness|thickness\s+of\s+slab|slab.*thick)\s+(?:of\s+)?(-?\d+(?:\.\d+)?)\s*(mm|m)?/gi,
    // Cavity patterns  
    /(?:cavity\s+width|cavity|width\s+of\s+cavity)\s+(?:of\s+)?(-?\d+(?:\.\d+)?)\s*(mm|m)?/gi,
    // Support level patterns
    /(?:support\s+level|level)\s+(?:of\s+)?(-?\d+(?:\.\d+)?)\s*(mm|m)?/gi,
    // Characteristic load patterns
    /(?:characteristic\s+load|load)\s+(?:of\s+)?(-?\d+(?:\.\d+)?)\s*(kN\/m|kn\/m)?/gi,
    // Masonry density patterns
    /(?:masonry\s+density|density)\s+(?:is\s+)?(-?\d+(?:\.\d+)?)\s*(kg\/m³|kg\/m3)?/gi,
    // Masonry thickness patterns
    /(?:masonry\s+thickness|thickness)\s+(?:is\s+)?(-?\d+(?:\.\d+)?)\s*(mm|m)?/gi,
    // Masonry height patterns
    /(?:masonry\s+height|height)\s+(?:is\s+)?(-?\d+(?:\.\d+)?)\s*(m|mm)?/gi,
    // General number with unit patterns (fallback)
    /(-?\d+(?:\.\d+)?)\s*(mm|m|kN\/m|kg\/m³|kg\/m3)/gi
  ]
  
  specificPatterns.forEach(pattern => {
    let match
    while ((match = pattern.exec(text)) !== null) {
      const value = parseFloat(match[1])
      const unit = match[2] || 'unknown'
      const start = Math.max(0, match.index - 20)
      const end = Math.min(text.length, match.index + match[0].length + 20)
      const context = text.substring(start, end).trim()
      
      results.push({ value, unit, context })
    }
  })
  
  return results
}

/**
 * Map extracted values to form parameters based on context
 */
function mapValueToParameter(
  value: number, 
  unit: string, 
  context: string
): { field: keyof FormDataType; confidence: 'high' | 'medium' | 'low' } | null {
  const contextLower = context.toLowerCase()
  
  // Use context-based mapping since regex patterns are now more specific
  
  // Slab thickness mapping
  if (contextLower.includes('slab') && contextLower.includes('thick')) {
    return { field: 'slab_thickness', confidence: 'high' }
  }
  
  // Cavity width mapping
  if (contextLower.includes('cavity')) {
    return { field: 'cavity', confidence: 'high' }
  }
  
  // Support level mapping
  if (contextLower.includes('support') && contextLower.includes('level')) {
    return { field: 'support_level', confidence: 'high' }
  }
  
  // Characteristic load mapping
  if (contextLower.includes('characteristic') && contextLower.includes('load')) {
    return { field: 'characteristic_load', confidence: 'high' }
  }
  
  // Masonry density mapping
  if (contextLower.includes('masonry') && contextLower.includes('density')) {
    return { field: 'masonry_density', confidence: 'high' }
  }
  
  // Masonry thickness mapping
  if (contextLower.includes('masonry') && contextLower.includes('thick')) {
    return { field: 'masonry_thickness', confidence: 'high' }
  }
  
  // Masonry height mapping
  if (contextLower.includes('masonry') && contextLower.includes('height')) {
    return { field: 'masonry_height', confidence: 'high' }
  }
  
  // Fallback to unit-based mapping for general patterns
  if (unit === 'kg/m³' || unit === 'kg/m3') {
    return { field: 'masonry_density', confidence: 'high' }
  }
  
  if (unit === 'kN/m' || unit === 'kn/m') {
    return { field: 'characteristic_load', confidence: 'high' }
  }
  
  // Notch height mapping
  if (contextLower.includes('notch') && contextLower.includes('height')) {
    return { field: 'notch_height', confidence: 'high' }
  }
  
  // Notch depth mapping
  if (contextLower.includes('notch') && contextLower.includes('depth')) {
    return { field: 'notch_depth', confidence: 'high' }
  }
  
  // Fixed angle length mapping
  if (contextLower.includes('angle') && contextLower.includes('length')) {
    return { field: 'fixed_angle_length', confidence: 'high' }
  }
  
  return null
}

/**
 * Extract boolean parameters from text
 */
function extractBooleanParameters(text: string): ExtractedParameter[] {
  const extracted: ExtractedParameter[] = []
  const textLower = text.toLowerCase()
  
  console.log('🔍 Boolean extraction - Input text:', text)
  console.log('🔍 Boolean extraction - Text lower:', textLower)
  
  // Check for notch requirement in summary format
  if (
    /\*\*notch required:\*\*\s*no/i.test(text) ||
    /notch required:\s*no/i.test(text) ||
    /- notch required:\s*no/i.test(text) ||
    textLower.includes('no notch')
  ) {
    extracted.push({
      field: 'has_notch',
      value: false,
      confidence: 'high',
      source: 'summary: no notch'
    })
    console.log('✅ Extracted has_notch = false')
  } else if (
    /\*\*notch required:\*\*\s*yes/i.test(text) ||
    /notch required:\s*yes/i.test(text) ||
    /- notch required:\s*yes/i.test(text)
  ) {
    extracted.push({
      field: 'has_notch',
      value: true,
      confidence: 'high',
      source: 'summary: notch required'
    })
    console.log('✅ Extracted has_notch = true')
  }
  
  // Check for angle length limitation - Check "no" patterns first
  if (
    textLower.includes('no limitation') ||
    /limit.*on.*angle.*length.*no/i.test(text) ||
    /angle.*length.*limit.*no/i.test(text) ||
    /angle length limit:\s*no/i.test(text) ||
    /\*\*limit on angle length:\*\*\s*no/i.test(text)
  ) {
    extracted.push({
      field: 'is_angle_length_limited',
      value: false,
      confidence: 'high',
      source: 'explicitly no angle limitation'
    })
    console.log('✅ Extracted is_angle_length_limited = false')
  } else if (
    /limit.*on.*angle.*length.*yes/i.test(text) ||
    /angle.*length.*limit.*yes/i.test(text) ||
    /\*\*limit on angle length:\*\*\s*yes/i.test(text) ||
    (textLower.includes('limited') && textLower.includes('angle') && !textLower.includes('question') && !textLower.includes('no')) ||
    (textLower.includes('constraint') && textLower.includes('length') && !textLower.includes('question') && !textLower.includes('no')) ||
    (textLower.includes('fixed') && textLower.includes('angle') && !textLower.includes('question') && !textLower.includes('no'))
  ) {
    extracted.push({
      field: 'is_angle_length_limited',
      value: true,
      confidence: 'high',
      source: 'mentioned angle length limitation'
    })
    console.log('✅ Extracted is_angle_length_limited = true')
  }
  
  console.log('🔍 Boolean extraction result:', extracted)
  return extracted
}

/**
 * Validate extracted parameter value against form schema
 */
function validateParameter(field: keyof FormDataType, value: string | number | boolean): ValidationError | null {
  try {
    // Create a test object with the field to validate against the full schema
    const testData: Record<string, string | number | boolean> = {
      slab_thickness: 225,
      cavity: 100,
      support_level: -200,
      characteristic_load: "14",
      masonry_density: 2000,
      masonry_thickness: 102.5,
      masonry_height: 6,
      has_notch: false,
      notch_height: 0,
      notch_depth: 0,
      is_angle_length_limited: false,
      fixed_angle_length: 750,
      [field]: value // Override with the value we want to test
    }
    
    // Parse the full object, which will validate the specific field
    formSchema.parse(testData)
    
    return null
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Find the error for our specific field
      const fieldError = error.errors.find(err => 
        err.path.length > 0 && err.path[0] === field
      )
      
      if (fieldError) {
        return {
          field,
          message: fieldError.message,
          currentValue: value
        }
      }
    }
    return null // No error for this specific field
  }
}

/**
 * Main function to extract parameters from AI response text
 */
export function extractParametersFromText(text: string): ParameterExtractionResult {
  const extracted: ExtractedParameter[] = []
  const validationErrors: ValidationError[] = []
  
  // Extract numerical parameters
  const numbersWithUnits = extractNumbersWithUnits(text)
  const usedValues = new Set<string>() // Track which value+context combinations we've used
  
  for (const { value, unit, context } of numbersWithUnits) {
    const key = `${value}-${unit}-${context}`
    if (usedValues.has(key)) continue // Skip duplicates
    usedValues.add(key)
    
    const mapping = mapValueToParameter(value, unit, context)
    
    if (mapping) {
      // Check if we already have this field
      const existingParam = extracted.find(p => p.field === mapping.field)
      if (existingParam) continue // Skip if already extracted
      
      // Convert characteristic_load to string if it's that field
      const finalValue = mapping.field === 'characteristic_load' ? value.toString() : value
      
      extracted.push({
        field: mapping.field,
        value: finalValue,
        confidence: mapping.confidence,
        source: context
      })
      
      // Validate the extracted value
      const validationError = validateParameter(mapping.field, finalValue)
      if (validationError) {
        validationErrors.push(validationError)
      }
    }
  }
  
  // Extract boolean parameters
  const booleanParams = extractBooleanParameters(text)
  for (const param of booleanParams) {
    // Check if we already have this field
    const existingParam = extracted.find(p => p.field === param.field)
    if (!existingParam) {
      extracted.push(param)
    }
  }

  // Infer boolean values from extracted numerical parameters
  // If we have a fixed_angle_length value, it means angle length is limited
  const hasFixedAngleLength = extracted.some(p => p.field === 'fixed_angle_length')
  const hasAngleLimitationBoolean = extracted.some(p => p.field === 'is_angle_length_limited')
  
  if (hasFixedAngleLength && !hasAngleLimitationBoolean) {
    extracted.push({
      field: 'is_angle_length_limited',
      value: true,
      confidence: 'high',
      source: 'inferred from fixed angle length value'
    })
    console.log('✅ Inferred is_angle_length_limited = true from angle length value')
  }

  // If we have notch dimensions, it means notch is required
  const hasNotchHeight = extracted.some(p => p.field === 'notch_height')
  const hasNotchDepth = extracted.some(p => p.field === 'notch_depth')
  const hasNotchBoolean = extracted.some(p => p.field === 'has_notch')
  
  if ((hasNotchHeight || hasNotchDepth) && !hasNotchBoolean) {
    extracted.push({
      field: 'has_notch',
      value: true,
      confidence: 'high',
      source: 'inferred from notch dimensions'
    })
    console.log('✅ Inferred has_notch = true from notch dimensions')
  }
  
  // Determine missing required parameters
  const requiredFields: (keyof FormDataType)[] = [
    'slab_thickness', 
    'cavity', 
    'support_level'
  ]
  
  // Need either characteristic_load OR masonry properties
  const hasCharacteristicLoad = extracted.some(p => p.field === 'characteristic_load')
  const hasMasonryProperties = canCalculateCharacteristicLoad(extracted)
  
  if (!hasCharacteristicLoad && !hasMasonryProperties) {
    requiredFields.push('characteristic_load') // or masonry properties
  }
  
  const extractedFields = new Set(extracted.map(p => p.field))
  const missingRequired = requiredFields.filter(field => !extractedFields.has(field))
  
  // Determine missing conditional parameters
  const missingConditional: (keyof FormDataType)[] = []
  const hasNotch = extracted.find(p => p.field === 'has_notch')?.value
  const hasAngleLimitation = extracted.find(p => p.field === 'is_angle_length_limited')?.value
  
  if (hasNotch && !extractedFields.has('notch_height')) {
    missingConditional.push('notch_height')
  }
  if (hasNotch && !extractedFields.has('notch_depth')) {
    missingConditional.push('notch_depth')
  }
  if (hasAngleLimitation && !extractedFields.has('fixed_angle_length')) {
    missingConditional.push('fixed_angle_length')
  }
  
  // Generate next questions
  const nextQuestions: string[] = []
  if (missingRequired.length > 0) {
    missingRequired.forEach(field => {
      switch (field) {
        case 'slab_thickness':
          nextQuestions.push('What is the thickness of your concrete slab? (150-500mm)')
          break
        case 'cavity':
          nextQuestions.push('What is the cavity width between the slab and masonry? (50-400mm)')
          break
        case 'support_level':
          nextQuestions.push('What is the support level relative to the SSL? (-600 to 500mm)')
          break
        case 'characteristic_load':
          nextQuestions.push('Do you know your characteristic load in kN/m, or should I help calculate it from masonry properties?')
          break
      }
    })
  }
  
  if (missingConditional.length > 0) {
    missingConditional.forEach(field => {
      switch (field) {
        case 'notch_height':
          nextQuestions.push('What is the height of the notch? (10-200mm)')
          break
        case 'notch_depth':
          nextQuestions.push('What is the depth of the notch? (10-200mm)')
          break
        case 'fixed_angle_length':
          nextQuestions.push('What is the maximum angle length constraint? (200-1490mm in 5mm increments)')
          break
      }
    })
  }
  
  const isComplete = missingRequired.length === 0 && missingConditional.length === 0
  
  return {
    parameters: extracted,
    missingRequired,
    missingConditional,
    validationErrors,
    nextQuestions,
    isComplete
  }
}

/**
 * Convert extracted parameters to form data format
 */
export function convertExtractedToFormData(parameters: ExtractedParameter[]): Partial<FormDataType> {
  const formData: Partial<FormDataType> = {}
  
  parameters.forEach(param => {
    // Type assertion is safe here because we control the extraction process
    // and ensure values match the expected types for each field
    (formData as Record<string, string | number | boolean>)[param.field] = param.value
  })
  
  return formData
}

/**
 * Calculate characteristic load from masonry properties
 */
export function calculateCharacteristicLoadFromMasonry(
  density: number,
  thickness: number,
  height: number
): number {
  // Formula: (density * thickness_in_m * height * gravity) / 1000
  // Use more precise gravity constant
  const thicknessInMeters = thickness / 1000
  const gravity = 9.81
  return (density * thicknessInMeters * height * gravity) / 1000
}

/**
 * Check if we have enough information to calculate characteristic load
 */
export function canCalculateCharacteristicLoad(parameters: ExtractedParameter[]): boolean {
  const fields = new Set(parameters.map(p => p.field))
  return fields.has('masonry_density') && 
         fields.has('masonry_thickness') && 
         fields.has('masonry_height')
} 