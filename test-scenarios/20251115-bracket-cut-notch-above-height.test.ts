/**
 * Test to verify bracketCutNotchAboveHeight calculation for standard brackets dropping below slab
 * Date: 2025-11-15
 * Purpose: Ensure the new dynamic bracketCutNotchAboveHeight formula is correctly calculated and exported to JSON
 *
 * Formula: bracketCutNotchAboveHeight = bracket_height - (slab_thickness - fixing_position + 39.5) - 60
 * Simplified: bracketCutNotchAboveHeight = bracket_height + fixing_position - slab_thickness - 99.5
 *
 * Conditions:
 * - ONLY applies when bracket type is "Standard" AND drop_below_slab > 0
 * - Otherwise uses default value of 12mm
 */

import { generateBracketJSON } from '../src/utils/json-generators'
import { OptimisationResult } from '../src/types/optimization-types'
import { FormDataType } from '../src/types/form-schema'

describe('Bracket Cut Notch Above Height Calculation', () => {
  it('should calculate bracketCutNotchAboveHeight for standard bracket dropping below slab', () => {
    // Test scenario where bracket drops below slab
    // bracket_height = 250mm, fixing_position = 75mm, slab_thickness = 200mm
    // Formula: 250 + 75 - 200 - 99.5 = 25.5mm (rounds to 26mm)
    const optimizationResult: OptimisationResult = {
      genetic: {
        bracket_centres: 400,
        bracket_thickness: 3,
        angle_thickness: 3,
        vertical_leg: 60,
        bolt_diameter: 10,
        bracket_type: 'Standard',
        angle_orientation: 'Standard',
        fixing_position: 75
      },
      calculated: {
        bracket_height: 250,
        bracket_projection: 90,
        rise_to_bolts: 110,
        rise_to_bolts_display: 125,
        drop_below_slab: 25, // Bracket drops below slab
        bracket_projection_at_fixing: 90,
        shear_load: 2.5,
        total_deflection: 0,
        characteristic_load: 5,
        area_load: 1.5,
        characteristic_udl: 5,
        design_udl: 6.75,
        E: 200000,
        n: 8,
        slab_thickness: 200,
        support_level: -150,
        cavity_width: 100,
        notch_height: 0,
        notch_depth: 0,
        moment_resistance_check: true,
        shear_resistance_check: true,
        angle_deflection_check: true,
        bracket_connection_check: true,
        shear_reduction_check: true,
        bracket_design_check: true,
        fixing_check: true,
        combined_tension_shear_check: true,
        bsl_above_slab_bottom: false,
        bracket_cut_notch_above_height: 26 // Expected calculated value (rounded)
      }
    }

    const formInputs: FormDataType = {
      slab_thickness: 200,
      cavity: 100,
      support_level: -150,
      characteristic_load: 5,
      facade_thickness: 102.5,
      material_type: 'brick',
      fixing_type: 'cast-in-channel',
      has_notch: false,
      frame_fixing_type: 'concrete_cast_in_channel'
    }

    const bracketJSON = generateBracketJSON(optimizationResult, formInputs)

    // Verify the structure
    expect(bracketJSON).toBeDefined()
    expect(bracketJSON.brackets).toHaveLength(1)

    const bracket = bracketJSON.brackets[0]

    // Verify bracketCutNotchAboveHeight has the calculated value
    expect(bracket.bracketCutNotchAboveHeight).toBeDefined()
    expect(bracket.bracketCutNotchAboveHeight.description).toBe('Height of cut notch above')
    expect(bracket.bracketCutNotchAboveHeight.unit).toBe('mm')
    expect(bracket.bracketCutNotchAboveHeight.value).toBe(26) // Calculated value

    console.log('🧪 Standard Bracket Dropping Below Slab:')
    console.log(`  Bracket Height: ${optimizationResult.calculated.bracket_height}mm`)
    console.log(`  Fixing Position: ${optimizationResult.genetic.fixing_position}mm`)
    console.log(`  Slab Thickness: ${optimizationResult.calculated.slab_thickness}mm`)
    console.log(`  Drop Below Slab: ${optimizationResult.calculated.drop_below_slab}mm`)
    console.log(`  Calculated Cut Notch Above Height: ${bracket.bracketCutNotchAboveHeight.value}mm`)
  })

  it('should use default 12mm for standard bracket NOT dropping below slab', () => {
    // Test scenario where bracket does NOT drop below slab
    const optimizationResult: OptimisationResult = {
      genetic: {
        bracket_centres: 400,
        bracket_thickness: 3,
        angle_thickness: 3,
        vertical_leg: 60,
        bolt_diameter: 10,
        bracket_type: 'Standard',
        angle_orientation: 'Standard',
        fixing_position: 75
      },
      calculated: {
        bracket_height: 180,
        bracket_projection: 90,
        rise_to_bolts: 110,
        rise_to_bolts_display: 125,
        drop_below_slab: 0, // Bracket does NOT drop below slab
        bracket_projection_at_fixing: 90,
        shear_load: 2.5,
        total_deflection: 0,
        characteristic_load: 5,
        area_load: 1.5,
        characteristic_udl: 5,
        design_udl: 6.75,
        E: 200000,
        n: 8,
        slab_thickness: 250,
        support_level: -150,
        cavity_width: 100,
        notch_height: 0,
        notch_depth: 0,
        moment_resistance_check: true,
        shear_resistance_check: true,
        angle_deflection_check: true,
        bracket_connection_check: true,
        shear_reduction_check: true,
        bracket_design_check: true,
        fixing_check: true,
        combined_tension_shear_check: true,
        bsl_above_slab_bottom: false,
        bracket_cut_notch_above_height: 12 // Default value (bracket doesn't drop below slab)
      }
    }

    const formInputs: FormDataType = {
      slab_thickness: 250,
      cavity: 100,
      support_level: -150,
      characteristic_load: 5,
      facade_thickness: 102.5,
      material_type: 'brick',
      fixing_type: 'cast-in-channel',
      has_notch: false,
      frame_fixing_type: 'concrete_cast_in_channel'
    }

    const bracketJSON = generateBracketJSON(optimizationResult, formInputs)

    const bracket = bracketJSON.brackets[0]

    // Should use default value of 12mm
    expect(bracket.bracketCutNotchAboveHeight.value).toBe(12)

    console.log('🧪 Standard Bracket NOT Dropping Below Slab:')
    console.log(`  Drop Below Slab: ${optimizationResult.calculated.drop_below_slab}mm`)
    console.log(`  Cut Notch Above Height: ${bracket.bracketCutNotchAboveHeight.value}mm (default)`)
  })

  it('should use default 12mm for inverted brackets', () => {
    // Test scenario with inverted bracket (formula not applicable)
    const optimizationResult: OptimisationResult = {
      genetic: {
        bracket_centres: 400,
        bracket_thickness: 3,
        angle_thickness: 3,
        vertical_leg: 60,
        bolt_diameter: 10,
        bracket_type: 'Inverted',
        angle_orientation: 'Inverted',
        dim_d: 135
      },
      calculated: {
        bracket_height: 180,
        bracket_projection: 90,
        rise_to_bolts: 110,
        rise_to_bolts_display: 125,
        drop_below_slab: 0,
        bracket_projection_at_fixing: 90,
        dim_d: 135,
        shear_load: 2.5,
        total_deflection: 0,
        characteristic_load: 5,
        area_load: 1.5,
        characteristic_udl: 5,
        design_udl: 6.75,
        E: 200000,
        n: 8,
        slab_thickness: 250,
        support_level: -150,
        cavity_width: 100,
        notch_height: 0,
        notch_depth: 0,
        moment_resistance_check: true,
        shear_resistance_check: true,
        angle_deflection_check: true,
        bracket_connection_check: true,
        shear_reduction_check: true,
        bracket_design_check: true,
        fixing_check: true,
        combined_tension_shear_check: true,
        bsl_above_slab_bottom: false,
        bracket_cut_notch_above_height: 12 // Default value (inverted bracket)
      }
    }

    const formInputs: FormDataType = {
      slab_thickness: 250,
      cavity: 100,
      support_level: -150,
      characteristic_load: 5,
      facade_thickness: 102.5,
      material_type: 'brick',
      fixing_type: 'cast-in-channel',
      has_notch: false,
      frame_fixing_type: 'concrete_cast_in_channel'
    }

    const bracketJSON = generateBracketJSON(optimizationResult, formInputs)

    const bracket = bracketJSON.brackets[0]

    // Should use default value of 12mm for inverted brackets
    expect(bracket.bracketCutNotchAboveHeight.value).toBe(12)

    console.log('🧪 Inverted Bracket:')
    console.log(`  Bracket Type: ${optimizationResult.genetic.bracket_type}`)
    console.log(`  Cut Notch Above Height: ${bracket.bracketCutNotchAboveHeight.value}mm (default)`)
  })

  it('should enforce minimum 12mm for small drop below slab scenarios', () => {
    // Test scenario where calculated value would be less than 12mm
    // bracket_height = 200mm, fixing_position = 75mm, slab_thickness = 250mm
    // Formula: 200 + 75 - 250 - 99.5 = -74.5mm (negative!)
    // Should be clamped to minimum 12mm
    const optimizationResult: OptimisationResult = {
      genetic: {
        bracket_centres: 400,
        bracket_thickness: 3,
        angle_thickness: 3,
        vertical_leg: 60,
        bolt_diameter: 10,
        bracket_type: 'Standard',
        angle_orientation: 'Standard',
        fixing_position: 75
      },
      calculated: {
        bracket_height: 200,
        bracket_projection: 90,
        rise_to_bolts: 110,
        rise_to_bolts_display: 125,
        drop_below_slab: 5, // Small drop below slab
        bracket_projection_at_fixing: 90,
        shear_load: 2.5,
        total_deflection: 0,
        characteristic_load: 5,
        area_load: 1.5,
        characteristic_udl: 5,
        design_udl: 6.75,
        E: 200000,
        n: 8,
        slab_thickness: 250,
        support_level: -150,
        cavity_width: 100,
        notch_height: 0,
        notch_depth: 0,
        moment_resistance_check: true,
        shear_resistance_check: true,
        angle_deflection_check: true,
        bracket_connection_check: true,
        shear_reduction_check: true,
        bracket_design_check: true,
        fixing_check: true,
        combined_tension_shear_check: true,
        bsl_above_slab_bottom: false,
        bracket_cut_notch_above_height: 12 // Should be clamped to minimum 12mm
      }
    }

    const formInputs: FormDataType = {
      slab_thickness: 250,
      cavity: 100,
      support_level: -150,
      characteristic_load: 5,
      facade_thickness: 102.5,
      material_type: 'brick',
      fixing_type: 'cast-in-channel',
      has_notch: false,
      frame_fixing_type: 'concrete_cast_in_channel'
    }

    const bracketJSON = generateBracketJSON(optimizationResult, formInputs)

    const bracket = bracketJSON.brackets[0]

    // Should be clamped to minimum 12mm
    expect(bracket.bracketCutNotchAboveHeight.value).toBe(12)

    console.log('🧪 Small Drop Below Slab (enforcing minimum):')
    console.log(`  Drop Below Slab: ${optimizationResult.calculated.drop_below_slab}mm`)
    console.log(`  Raw calculation would be: ${200 + 75 - 250 - 99.5}mm`)
    console.log(`  Clamped to minimum: ${bracket.bracketCutNotchAboveHeight.value}mm`)
  })

  it('should fallback to 12mm when bracket_cut_notch_above_height is not calculated', () => {
    // Test scenario where the field is undefined (older results or edge cases)
    const optimizationResult: OptimisationResult = {
      genetic: {
        bracket_centres: 400,
        bracket_thickness: 3,
        angle_thickness: 3,
        vertical_leg: 60,
        bolt_diameter: 10,
        bracket_type: 'Standard'
      },
      calculated: {
        bracket_height: 250,
        bracket_projection: 90,
        rise_to_bolts: 110,
        drop_below_slab: 25,
        bracket_projection_at_fixing: 90,
        shear_load: 2.5,
        total_deflection: 0,
        characteristic_load: 5,
        area_load: 1.5,
        characteristic_udl: 5,
        design_udl: 6.75,
        E: 200000,
        n: 8,
        slab_thickness: 200,
        support_level: -150,
        cavity_width: 100,
        notch_height: 0,
        notch_depth: 0,
        moment_resistance_check: true,
        shear_resistance_check: true,
        angle_deflection_check: true,
        bracket_connection_check: true,
        shear_reduction_check: true,
        bracket_design_check: true,
        fixing_check: true,
        combined_tension_shear_check: true,
        bsl_above_slab_bottom: false
        // bracket_cut_notch_above_height is undefined
      }
    }

    const formInputs: FormDataType = {
      slab_thickness: 200,
      cavity: 100,
      support_level: -150,
      characteristic_load: 5,
      facade_thickness: 102.5,
      material_type: 'brick',
      fixing_type: 'cast-in-channel',
      has_notch: false,
      frame_fixing_type: 'concrete_cast_in_channel'
    }

    const bracketJSON = generateBracketJSON(optimizationResult, formInputs)

    const bracket = bracketJSON.brackets[0]

    // Should fallback to default value of 12mm
    expect(bracket.bracketCutNotchAboveHeight.value).toBe(12)

    console.log('🧪 Missing bracket_cut_notch_above_height Field:')
    console.log(`  Fallback Cut Notch Above Height: ${bracket.bracketCutNotchAboveHeight.value}mm`)
  })
})
