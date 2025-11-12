/**
 * Test to verify bracketFixingLevel is included in generated JSON
 * Date: 2025-11-12
 * Purpose: Ensure the new bracketFixingLevel parameter is properly added to bracket JSON output
 */

import { generateBracketJSON } from '../src/utils/json-generators'
import { OptimisationResult } from '../src/types/optimization-types'
import { FormDataType } from '../src/types/form-schema'

describe('Bracket Fixing Level JSON Generation', () => {
  it('should include bracketFixingLevel in generated bracket JSON', () => {
    // Create a minimal optimization result with fixing position
    const optimizationResult: OptimisationResult = {
      genetic: {
        bracket_centres: 600,
        bracket_thickness: 3,
        angle_thickness: 3,
        vertical_leg: 80,
        bolt_diameter: 10,
        bracket_type: 'Standard',
        fixing_position: -108 // This is the fixing level
      },
      calculated: {
        bracket_height: 429,
        bracket_projection: 149,
        optimized_fixing_position: -108, // Optimized fixing position
        moment_resistance_check: true,
        shear_resistance_check: true,
        angle_deflection_check: true,
        bracket_connection_check: true,
        shear_reduction_check: true,
        bracket_design_check: true,
        fixing_check: true,
        combined_tension_shear_check: true,
        all_checks_pass: true
      }
    }

    // Create minimal form inputs
    const formInputs: FormDataType = {
      slab_thickness: 225,
      cavity: 100,
      support_level: -250,
      characteristic_load: 5,
      facade_thickness: 102.5,
      material_type: 'brick',
      fixing_type: 'cast-in-channel',
      has_notch: true,
      notch_height: 141,
      notch_depth: 55,
      frame_fixing_type: 'concrete_cast_in_channel'
    }

    // Generate the bracket JSON
    const bracketJSON = generateBracketJSON(optimizationResult, formInputs)

    // Verify the structure
    expect(bracketJSON).toBeDefined()
    expect(bracketJSON.brackets).toHaveLength(1)

    const bracket = bracketJSON.brackets[0]

    // Verify bracketFixingLevel exists and has correct structure
    expect(bracket.bracketFixingLevel).toBeDefined()
    expect(bracket.bracketFixingLevel.description).toBe('Fixing level of the bracket')
    expect(bracket.bracketFixingLevel.unit).toBe('mm')
    expect(bracket.bracketFixingLevel.value).toBe(-108)

    // Verify all other expected properties still exist
    expect(bracket.bracketIndex).toBeDefined()
    expect(bracket.bracketSKU).toBeDefined()
    expect(bracket.bracketType).toBeDefined()
    expect(bracket.bracketMaterial).toBeDefined()
    expect(bracket.bracketThickness).toBeDefined()
    expect(bracket.bracketLength).toBeDefined()
    expect(bracket.bracketHeight).toBeDefined()
    expect(bracket.bracketFixingDiameter).toBeDefined()
    expect(bracket.bracketToePlateType).toBeDefined()
    expect(bracket.bracketBackNotchOption).toBeDefined()
    expect(bracket.bracketBackNotchLength).toBeDefined()
    expect(bracket.bracketBackNotchHeight).toBeDefined()
    expect(bracket.bracketToeNotchLength).toBeDefined()
    expect(bracket.bracketToeNotchHeight).toBeDefined()
    expect(bracket.bracketCutNotchAboveHeight).toBeDefined()

    // Log the full JSON for visual verification
    console.log('Generated Bracket JSON:')
    console.log(JSON.stringify(bracketJSON, null, 2))
  })

  it('should use optimized_fixing_position when available', () => {
    const optimizationResult: OptimisationResult = {
      genetic: {
        bracket_centres: 600,
        bracket_thickness: 3,
        angle_thickness: 3,
        vertical_leg: 80,
        bolt_diameter: 10,
        fixing_position: -100 // Original position
      },
      calculated: {
        bracket_height: 429,
        bracket_projection: 149,
        optimized_fixing_position: -120, // Optimized position (should take precedence)
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

    const formInputs: FormDataType = {
      slab_thickness: 225,
      cavity: 100,
      support_level: -250,
      characteristic_load: 5,
      facade_thickness: 102.5,
      material_type: 'brick',
      fixing_type: 'cast-in-channel',
      has_notch: false,
      frame_fixing_type: 'concrete_cast_in_channel'
    }

    const bracketJSON = generateBracketJSON(optimizationResult, formInputs)

    // Should use optimized_fixing_position (-120) instead of fixing_position (-100)
    expect(bracketJSON.brackets[0].bracketFixingLevel.value).toBe(-120)
  })

  it('should default to 0 when no fixing position is available', () => {
    const optimizationResult: OptimisationResult = {
      genetic: {
        bracket_centres: 600,
        bracket_thickness: 3,
        angle_thickness: 3,
        vertical_leg: 80,
        bolt_diameter: 10
        // No fixing_position
      },
      calculated: {
        bracket_height: 429,
        bracket_projection: 149,
        // No optimized_fixing_position
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

    const formInputs: FormDataType = {
      slab_thickness: 225,
      cavity: 100,
      support_level: -250,
      characteristic_load: 5,
      facade_thickness: 102.5,
      material_type: 'brick',
      fixing_type: 'cast-in-channel',
      has_notch: false,
      frame_fixing_type: 'concrete_cast_in_channel'
    }

    const bracketJSON = generateBracketJSON(optimizationResult, formInputs)

    // Should default to 0
    expect(bracketJSON.brackets[0].bracketFixingLevel.value).toBe(0)
  })
})
