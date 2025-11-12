/**
 * Test to verify substrate type mapping and steel section dimensions in runJSON
 * Date: 2025-11-12
 * Purpose: Ensure supportType correctly maps to Concrete, I-beam, RHS, or SHS
 *          and steel section dimensions are extracted correctly
 */

import { generateRunJSON } from '../src/utils/json-generators'
import { OptimisationResult } from '../src/types/optimization-types'
import { FormDataType } from '../src/types/form-schema'

describe('Substrate Type and Steel Section Dimensions', () => {
  // Base optimization result (reused for all tests)
  const baseOptimizationResult: OptimisationResult = {
    genetic: {
      bracket_centres: 600,
      bracket_thickness: 3,
      angle_thickness: 3,
      vertical_leg: 80,
      bolt_diameter: 10,
      bracket_projection: 149
    },
    calculated: {
      bracket_height: 429,
      bracket_projection: 149,
      moment_resistance_check: true,
      shear_resistance_check: true,
      angle_deflection_check: true,
      bracket_connection_check: true,
      shear_reduction_check: true,
      bracket_design_check: true,
      fixing_check: true,
      combined_tension_shear_check: true
    }
  }

  const runLength = 5000

  describe('Concrete Support Types', () => {
    it('should set supportType to "Concrete" for concrete-cast-in', () => {
      const formInputs: FormDataType = {
        slab_thickness: 225,
        cavity: 100,
        support_level: -250,
        characteristic_load: 5,
        facade_thickness: 102.5,
        material_type: 'brick',
        fixing_type: 'cast-in-channel',
        has_notch: false,
        frame_fixing_type: 'concrete-cast-in'
      }

      const runJSON = generateRunJSON(formInputs, baseOptimizationResult, runLength)

      expect(runJSON.runDetails.substructure.supportType.value).toBe('Concrete')
      expect(runJSON.runDetails.substructure.supportDetails.supportWidth.value).toBe(225)
      expect(runJSON.runDetails.substructure.supportDetails.supportDepth.value).toBe(225)
    })

    it('should set supportType to "Concrete" for concrete-post-fix', () => {
      const formInputs: FormDataType = {
        slab_thickness: 250,
        cavity: 100,
        support_level: -250,
        characteristic_load: 5,
        facade_thickness: 102.5,
        material_type: 'brick',
        fixing_type: 'post-fix',
        has_notch: false,
        frame_fixing_type: 'concrete-post-fix'
      }

      const runJSON = generateRunJSON(formInputs, baseOptimizationResult, runLength)

      expect(runJSON.runDetails.substructure.supportType.value).toBe('Concrete')
      expect(runJSON.runDetails.substructure.supportDetails.supportWidth.value).toBe(250)
    })

    it('should set supportType to "Concrete" for concrete-all', () => {
      const formInputs: FormDataType = {
        slab_thickness: 200,
        cavity: 100,
        support_level: -250,
        characteristic_load: 5,
        facade_thickness: 102.5,
        material_type: 'brick',
        fixing_type: 'cast-in-channel',
        has_notch: false,
        frame_fixing_type: 'concrete-all'
      }

      const runJSON = generateRunJSON(formInputs, baseOptimizationResult, runLength)

      expect(runJSON.runDetails.substructure.supportType.value).toBe('Concrete')
    })
  })

  describe('Steel I-beam Support Type', () => {
    it('should set supportType to "I-beam" and extract dimensions from 203x102', () => {
      const formInputs: FormDataType = {
        slab_thickness: 225,
        cavity: 100,
        support_level: -250,
        characteristic_load: 5,
        facade_thickness: 102.5,
        material_type: 'brick',
        fixing_type: 'cast-in-channel',
        has_notch: false,
        frame_fixing_type: 'steel-i-beam',
        steel_section_type: 'I-BEAM',
        steel_section_size: '203x102',
        steel_bolt_size: 'M12'
      }

      const runJSON = generateRunJSON(formInputs, baseOptimizationResult, runLength)

      expect(runJSON.runDetails.substructure.supportType.value).toBe('I-beam')
      expect(runJSON.runDetails.substructure.supportDetails.supportDepth.value).toBe(203)
      expect(runJSON.runDetails.substructure.supportDetails.supportWidth.value).toBe(102)

      console.log('I-beam runJSON:', JSON.stringify(runJSON, null, 2))
    })

    it('should handle different I-beam sizes like 254x146', () => {
      const formInputs: FormDataType = {
        slab_thickness: 225,
        cavity: 100,
        support_level: -250,
        characteristic_load: 5,
        facade_thickness: 102.5,
        material_type: 'brick',
        fixing_type: 'cast-in-channel',
        has_notch: false,
        frame_fixing_type: 'steel-i-beam',
        steel_section_type: 'I-BEAM',
        steel_section_size: '254x146',
        steel_bolt_size: 'M12'
      }

      const runJSON = generateRunJSON(formInputs, baseOptimizationResult, runLength)

      expect(runJSON.runDetails.substructure.supportType.value).toBe('I-beam')
      expect(runJSON.runDetails.substructure.supportDetails.supportDepth.value).toBe(254)
      expect(runJSON.runDetails.substructure.supportDetails.supportWidth.value).toBe(146)
    })
  })

  describe('Steel RHS Support Type', () => {
    it('should set supportType to "RHS" and extract dimensions from 150x100', () => {
      const formInputs: FormDataType = {
        slab_thickness: 225,
        cavity: 100,
        support_level: -250,
        characteristic_load: 5,
        facade_thickness: 102.5,
        material_type: 'brick',
        fixing_type: 'cast-in-channel',
        has_notch: false,
        frame_fixing_type: 'steel-rhs',
        steel_section_type: 'RHS',
        steel_section_size: '150x100',
        steel_bolt_size: 'M12'
      }

      const runJSON = generateRunJSON(formInputs, baseOptimizationResult, runLength)

      expect(runJSON.runDetails.substructure.supportType.value).toBe('RHS')
      expect(runJSON.runDetails.substructure.supportDetails.supportDepth.value).toBe(150)
      expect(runJSON.runDetails.substructure.supportDetails.supportWidth.value).toBe(100)

      console.log('RHS runJSON:', JSON.stringify(runJSON, null, 2))
    })

    it('should handle different RHS sizes like 200x120', () => {
      const formInputs: FormDataType = {
        slab_thickness: 225,
        cavity: 100,
        support_level: -250,
        characteristic_load: 5,
        facade_thickness: 102.5,
        material_type: 'brick',
        fixing_type: 'cast-in-channel',
        has_notch: false,
        frame_fixing_type: 'steel-rhs',
        steel_section_type: 'RHS',
        steel_section_size: '200x120',
        steel_bolt_size: 'M12'
      }

      const runJSON = generateRunJSON(formInputs, baseOptimizationResult, runLength)

      expect(runJSON.runDetails.substructure.supportType.value).toBe('RHS')
      expect(runJSON.runDetails.substructure.supportDetails.supportDepth.value).toBe(200)
      expect(runJSON.runDetails.substructure.supportDetails.supportWidth.value).toBe(120)
    })
  })

  describe('Steel SHS Support Type', () => {
    it('should set supportType to "SHS" and extract dimensions from 100x100', () => {
      const formInputs: FormDataType = {
        slab_thickness: 225,
        cavity: 100,
        support_level: -250,
        characteristic_load: 5,
        facade_thickness: 102.5,
        material_type: 'brick',
        fixing_type: 'cast-in-channel',
        has_notch: false,
        frame_fixing_type: 'steel-shs',
        steel_section_type: 'SHS',
        steel_section_size: '100x100',
        steel_bolt_size: 'M12'
      }

      const runJSON = generateRunJSON(formInputs, baseOptimizationResult, runLength)

      expect(runJSON.runDetails.substructure.supportType.value).toBe('SHS')
      expect(runJSON.runDetails.substructure.supportDetails.supportDepth.value).toBe(100)
      expect(runJSON.runDetails.substructure.supportDetails.supportWidth.value).toBe(100)

      console.log('SHS runJSON:', JSON.stringify(runJSON, null, 2))
    })

    it('should handle different SHS sizes like 150x150', () => {
      const formInputs: FormDataType = {
        slab_thickness: 225,
        cavity: 100,
        support_level: -250,
        characteristic_load: 5,
        facade_thickness: 102.5,
        material_type: 'brick',
        fixing_type: 'cast-in-channel',
        has_notch: false,
        frame_fixing_type: 'steel-shs',
        steel_section_type: 'SHS',
        steel_section_size: '150x150',
        steel_bolt_size: 'M12'
      }

      const runJSON = generateRunJSON(formInputs, baseOptimizationResult, runLength)

      expect(runJSON.runDetails.substructure.supportType.value).toBe('SHS')
      expect(runJSON.runDetails.substructure.supportDetails.supportDepth.value).toBe(150)
      expect(runJSON.runDetails.substructure.supportDetails.supportWidth.value).toBe(150)
    })
  })

  describe('Custom Steel Sections', () => {
    it('should handle custom steel section with custom height', () => {
      const formInputs: FormDataType = {
        slab_thickness: 225,
        cavity: 100,
        support_level: -250,
        characteristic_load: 5,
        facade_thickness: 102.5,
        material_type: 'brick',
        fixing_type: 'cast-in-channel',
        has_notch: false,
        frame_fixing_type: 'steel-i-beam',
        steel_section_type: 'I-BEAM',
        use_custom_steel_section: true,
        custom_steel_height: 300,
        steel_bolt_size: 'M12'
      }

      const runJSON = generateRunJSON(formInputs, baseOptimizationResult, runLength)

      expect(runJSON.runDetails.substructure.supportType.value).toBe('I-beam')
      expect(runJSON.runDetails.substructure.supportDetails.supportDepth.value).toBe(300)
      expect(runJSON.runDetails.substructure.supportDetails.supportWidth.value).toBe(102) // Default width
    })
  })

  describe('All Substrate Types Summary', () => {
    it('should correctly map all 4 substrate types', () => {
      const testCases = [
        {
          frameType: 'concrete-all',
          steelType: undefined,
          expectedSupport: 'Concrete'
        },
        {
          frameType: 'steel-i-beam',
          steelType: 'I-BEAM',
          expectedSupport: 'I-beam'
        },
        {
          frameType: 'steel-rhs',
          steelType: 'RHS',
          expectedSupport: 'RHS'
        },
        {
          frameType: 'steel-shs',
          steelType: 'SHS',
          expectedSupport: 'SHS'
        }
      ]

      testCases.forEach(({ frameType, steelType, expectedSupport }) => {
        const formInputs: FormDataType = {
          slab_thickness: 225,
          cavity: 100,
          support_level: -250,
          characteristic_load: 5,
          facade_thickness: 102.5,
          material_type: 'brick',
          fixing_type: 'cast-in-channel',
          has_notch: false,
          frame_fixing_type: frameType as any,
          steel_section_type: steelType as any,
          steel_section_size: steelType ? '203x102' : undefined,
          steel_bolt_size: steelType ? 'M12' : undefined
        }

        const runJSON = generateRunJSON(formInputs, baseOptimizationResult, runLength)

        expect(runJSON.runDetails.substructure.supportType.value).toBe(expectedSupport)
      })
    })
  })
})
