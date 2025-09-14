import { 
  extractParametersFromText, 
  convertExtractedToFormData,
  calculateCharacteristicLoadFromMasonry,
  canCalculateCharacteristicLoad,
  validateExtractedParameters,
  canProceedWithOptimization
} from '../parameter-extraction'
import type { ExtractedParameter } from '@/types/chat-types'

describe('Parameter Extraction', () => {
  describe('extractParametersFromText', () => {
    it('should extract basic parameters with confidence levels', () => {
      const text = "I need a bracket for a slab thickness of 300mm, cavity width of 75mm and support level of -150mm"
      const result = extractParametersFromText(text)
      
      expect(result.parameters).toContainEqual(
        expect.objectContaining({
          field: 'slab_thickness',
          value: 300,
          confidence: 'high'
        })
      )
      
      expect(result.parameters).toContainEqual(
        expect.objectContaining({
          field: 'cavity',
          value: 75,
          confidence: 'high'
        })
      )
      
      expect(result.parameters).toContainEqual(
        expect.objectContaining({
          field: 'support_level',
          value: -150,
          confidence: 'high'
        })
      )
    })

    it('should extract characteristic load in correct format', () => {
      const text = "The characteristic load is 12.5 kN/m"
      const result = extractParametersFromText(text)
      
      expect(result.parameters).toContainEqual(
        expect.objectContaining({
          field: 'characteristic_load',
          value: "12.5", // Should be string for this field
          confidence: 'high'
        })
      )
    })

    it('should extract masonry properties', () => {
      const text = "Masonry density is 2100 kg/m³, masonry thickness is 102.5mm, masonry height is 3.5m"
      const result = extractParametersFromText(text)
      
      expect(result.parameters).toContainEqual(
        expect.objectContaining({
          field: 'masonry_density',
          value: 2100,
          confidence: 'high'
        })
      )
      
      expect(result.parameters).toContainEqual(
        expect.objectContaining({
          field: 'masonry_thickness',
          value: 102.5,
          confidence: 'high'
        })
      )
      
      expect(result.parameters).toContainEqual(
        expect.objectContaining({
          field: 'masonry_height',
          value: 3.5,
          confidence: 'high'
        })
      )
    })

    it('should extract boolean parameters', () => {
      const text = "I need a notch in the bracket"
      const result = extractParametersFromText(text)
      
      expect(result.parameters).toContainEqual(
        expect.objectContaining({
          field: 'has_notch',
          value: true,
          confidence: 'high'
        })
      )
    })

    it('should identify missing required parameters', () => {
      const text = "I have a 300mm slab"
      const result = extractParametersFromText(text)
      
      expect(result.missingRequired).toContain('cavity')
      expect(result.missingRequired).toContain('support_level')
      expect(result.missingRequired).toContain('characteristic_load')
    })

    it('should identify missing conditional parameters', () => {
      const text = "I need a notch in the bracket with 300mm slab, 75mm cavity, -150mm support level"
      const result = extractParametersFromText(text)
      
      expect(result.missingConditional).toContain('notch_height')
      expect(result.missingConditional).toContain('notch_depth')
    })

    it('should mark as complete when all parameters provided', () => {
      const text = "slab thickness 300mm, cavity width 75mm, support level -150mm, characteristic load 14 kN/m"
      const result = extractParametersFromText(text)
      
      expect(result.isComplete).toBe(true)
      expect(result.missingRequired).toHaveLength(0)
      expect(result.missingConditional).toHaveLength(0)
    })
  })

  describe('validateExtractedParameters', () => {
    it('should validate parameters within acceptable ranges', () => {
      const parameters: ExtractedParameter[] = [
        { field: 'slab_thickness', value: 250, confidence: 'high', source: 'user input' },
        { field: 'cavity', value: 100, confidence: 'high', source: 'user input' },
        { field: 'support_level', value: -200, confidence: 'high', source: 'user input' }
      ]
      
      const result = validateExtractedParameters(parameters)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect out-of-range values', () => {
      const parameters: ExtractedParameter[] = [
        { field: 'slab_thickness', value: 100, confidence: 'high', source: 'user input' }, // Too small
        { field: 'cavity', value: 450, confidence: 'high', source: 'user input' }, // Too large
        { field: 'support_level', value: 600, confidence: 'high', source: 'user input' } // Too high
      ]
      
      const result = validateExtractedParameters(parameters)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(3)
      expect(result.errors[0].message).toContain('at least 150mm')
      expect(result.errors[1].message).toContain('at most 400mm')
      expect(result.errors[2].message).toContain('at most 500mm')
    })

    it('should detect cavity increment violations', () => {
      const parameters: ExtractedParameter[] = [
        { field: 'cavity', value: 75.3, confidence: 'high', source: 'user input' } // Not 0.5mm increment
      ]
      
      const result = validateExtractedParameters(parameters)
      
      expect(result.isValid).toBe(false)
      expect(result.errors[0].message).toContain('0.5mm increments')
      expect(result.suggestions[0]).toContain('75.5mm')
    })

    it('should detect angle length increment violations', () => {
      const parameters: ExtractedParameter[] = [
        { field: 'fixed_angle_length', value: 753, confidence: 'high', source: 'user input' } // Not 5mm increment
      ]
      
      const result = validateExtractedParameters(parameters)
      
      expect(result.isValid).toBe(false)
      expect(result.errors[0].message).toContain('5mm increments')
      expect(result.suggestions[0]).toContain('755mm')
    })

    it('should provide warnings for edge values', () => {
      const parameters: ExtractedParameter[] = [
        { field: 'slab_thickness', value: 175, confidence: 'high', source: 'user input' }, // Low but valid
        { field: 'support_level', value: -450, confidence: 'high', source: 'user input' } // Deep but valid
      ]
      
      const result = validateExtractedParameters(parameters)
      
      expect(result.isValid).toBe(true)
      expect(result.warnings).toContain('Slab thickness below 200mm may require special consideration')
      expect(result.warnings).toContain('Deep support level below SSL - ensure adequate structural support')
    })

    it('should validate notch conditional logic', () => {
      const parameters: ExtractedParameter[] = [
        { field: 'has_notch', value: true, confidence: 'high', source: 'user input' },
        // Missing notch dimensions
      ]
      
      const result = validateExtractedParameters(parameters)
      
      expect(result.warnings).toContain('Notch is required but height is not specified')
      expect(result.warnings).toContain('Notch is required but depth is not specified')
      expect(result.suggestions).toContain('Please specify the notch height (10-200mm)')
      expect(result.suggestions).toContain('Please specify the notch depth (10-200mm)')
    })

    it('should validate angle length conditional logic', () => {
      const parameters: ExtractedParameter[] = [
        { field: 'is_angle_length_limited', value: true, confidence: 'high', source: 'user input' },
        // Missing fixed angle length
      ]
      
      const result = validateExtractedParameters(parameters)
      
      expect(result.warnings).toContain('Angle length is limited but constraint value is not specified')
      expect(result.suggestions).toContain('Please specify the maximum angle length (200-1490mm)')
    })

    it('should warn about conflicting load specifications', () => {
      const parameters: ExtractedParameter[] = [
        { field: 'characteristic_load', value: "14", confidence: 'high', source: 'user input' },
        { field: 'masonry_density', value: 2000, confidence: 'high', source: 'user input' },
        { field: 'masonry_thickness', value: 102.5, confidence: 'high', source: 'user input' },
        { field: 'masonry_height', value: 6, confidence: 'high', source: 'user input' }
      ]
      
      const result = validateExtractedParameters(parameters)
      
      expect(result.warnings).toContain('Both characteristic load and masonry properties provided - using characteristic load')
    })

    it('should provide practical engineering warnings', () => {
      const parameters: ExtractedParameter[] = [
        { field: 'slab_thickness', value: 200, confidence: 'high', source: 'user input' },
        { field: 'cavity', value: 250, confidence: 'high', source: 'user input' } // Cavity larger than slab
      ]
      
      const result = validateExtractedParameters(parameters)
      
      expect(result.warnings).toContain('Cavity width is larger than slab thickness - verify this is correct')
    })
  })

  describe('canProceedWithOptimization', () => {
    it('should allow optimization with minimum required parameters', () => {
      const parameters: ExtractedParameter[] = [
        { field: 'slab_thickness', value: 250, confidence: 'high', source: 'user input' },
        { field: 'cavity', value: 100, confidence: 'high', source: 'user input' },
        { field: 'support_level', value: -200, confidence: 'high', source: 'user input' },
        { field: 'characteristic_load', value: "14", confidence: 'high', source: 'user input' }
      ]
      
      const result = canProceedWithOptimization(parameters)
      
      expect(result.canProceed).toBe(true)
      expect(result.missingCritical).toHaveLength(0)
      expect(result.recommendations).toContain('All required parameters collected - ready for optimization')
      expect(result.recommendations).toContain('Using provided characteristic load for calculations')
    })

    it('should allow optimization with calculated load from masonry properties', () => {
      const parameters: ExtractedParameter[] = [
        { field: 'slab_thickness', value: 250, confidence: 'high', source: 'user input' },
        { field: 'cavity', value: 100, confidence: 'high', source: 'user input' },
        { field: 'support_level', value: -200, confidence: 'high', source: 'user input' },
        { field: 'masonry_density', value: 2000, confidence: 'high', source: 'user input' },
        { field: 'masonry_thickness', value: 102.5, confidence: 'high', source: 'user input' },
        { field: 'masonry_height', value: 6, confidence: 'high', source: 'user input' }
      ]
      
      const result = canProceedWithOptimization(parameters)
      
      expect(result.canProceed).toBe(true)
      expect(result.missingCritical).toHaveLength(0)
      expect(result.recommendations).toContain('Will calculate characteristic load from masonry properties')
    })

    it('should prevent optimization with missing critical parameters', () => {
      const parameters: ExtractedParameter[] = [
        { field: 'slab_thickness', value: 250, confidence: 'high', source: 'user input' },
        // Missing cavity, support_level, and load information
      ]
      
      const result = canProceedWithOptimization(parameters)
      
      expect(result.canProceed).toBe(false)
      expect(result.missingCritical).toContain('cavity')
      expect(result.missingCritical).toContain('support level')
      expect(result.missingCritical).toContain('characteristic load or masonry properties')
    })

    it('should require notch dimensions when notch is enabled', () => {
      const parameters: ExtractedParameter[] = [
        { field: 'slab_thickness', value: 250, confidence: 'high', source: 'user input' },
        { field: 'cavity', value: 100, confidence: 'high', source: 'user input' },
        { field: 'support_level', value: -200, confidence: 'high', source: 'user input' },
        { field: 'characteristic_load', value: "14", confidence: 'high', source: 'user input' },
        { field: 'has_notch', value: true, confidence: 'high', source: 'user input' }
        // Missing notch_height and notch_depth
      ]
      
      const result = canProceedWithOptimization(parameters)
      
      expect(result.canProceed).toBe(false)
      expect(result.missingCritical).toContain('notch height')
      expect(result.missingCritical).toContain('notch depth')
    })

    it('should require fixed angle length when limitation is enabled', () => {
      const parameters: ExtractedParameter[] = [
        { field: 'slab_thickness', value: 250, confidence: 'high', source: 'user input' },
        { field: 'cavity', value: 100, confidence: 'high', source: 'user input' },
        { field: 'support_level', value: -200, confidence: 'high', source: 'user input' },
        { field: 'characteristic_load', value: "14", confidence: 'high', source: 'user input' },
        { field: 'is_angle_length_limited', value: true, confidence: 'high', source: 'user input' }
        // Missing fixed_angle_length
      ]
      
      const result = canProceedWithOptimization(parameters)
      
      expect(result.canProceed).toBe(false)
      expect(result.missingCritical).toContain('fixed angle length')
    })
  })

  describe('convertExtractedToFormData', () => {
    it('should convert extracted parameters to form data format', () => {
      const parameters: ExtractedParameter[] = [
        { field: 'slab_thickness', value: 250, confidence: 'high', source: 'user input' },
        { field: 'cavity', value: 100, confidence: 'high', source: 'user input' },
        { field: 'characteristic_load', value: "14", confidence: 'high', source: 'user input' },
        { field: 'has_notch', value: true, confidence: 'high', source: 'user input' }
      ]
      
      const formData = convertExtractedToFormData(parameters)
      
      expect(formData).toEqual({
        slab_thickness: 250,
        cavity: 100,
        characteristic_load: "14",
        has_notch: true
      })
    })
  })

  describe('calculateCharacteristicLoadFromMasonry', () => {
    it('should calculate characteristic load correctly', () => {
      const density = 2000 // kg/m³
      const thickness = 102.5 // mm
      const height = 6 // m
      
      const result = calculateCharacteristicLoadFromMasonry(density, thickness, height)
      
      // Expected: (2000 * 0.1025 * 6 * 9.81) / 1000 ≈ 12.0663
      expect(result).toBeCloseTo(12.0663, 3)
    })

    it('should handle different masonry configurations', () => {
      // Heavy masonry
      expect(calculateCharacteristicLoadFromMasonry(2400, 215, 4))
        .toBeCloseTo(20.248, 3)
      
      // Light masonry
      expect(calculateCharacteristicLoadFromMasonry(1600, 100, 3))
        .toBeCloseTo(4.709, 3)
    })
  })

  describe('canCalculateCharacteristicLoad', () => {
    it('should return true when all masonry properties are present', () => {
      const parameters: ExtractedParameter[] = [
        { field: 'masonry_density', value: 2000, confidence: 'high', source: 'user input' },
        { field: 'masonry_thickness', value: 102.5, confidence: 'high', source: 'user input' },
        { field: 'masonry_height', value: 6, confidence: 'high', source: 'user input' }
      ]
      
      expect(canCalculateCharacteristicLoad(parameters)).toBe(true)
    })

    it('should return false when masonry properties are missing', () => {
      const parameters: ExtractedParameter[] = [
        { field: 'masonry_density', value: 2000, confidence: 'high', source: 'user input' },
        { field: 'masonry_thickness', value: 102.5, confidence: 'high', source: 'user input' }
        // Missing masonry_height
      ]
      
      expect(canCalculateCharacteristicLoad(parameters)).toBe(false)
    })

    it('should return false when no masonry properties are present', () => {
      const parameters: ExtractedParameter[] = [
        { field: 'slab_thickness', value: 250, confidence: 'high', source: 'user input' },
        { field: 'cavity', value: 100, confidence: 'high', source: 'user input' }
      ]
      
      expect(canCalculateCharacteristicLoad(parameters)).toBe(false)
    })
  })
}) 