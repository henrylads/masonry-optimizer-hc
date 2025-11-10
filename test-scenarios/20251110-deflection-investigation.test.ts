/**
 * Deflection Investigation Test
 *
 * Compares deflection results between branches for the same test parameters:
 * - Cavity: 100mm
 * - Slab thickness: 225mm
 * - Load: 6 kN/m
 * - Bracket drop: -200mm
 * - Fixings: All concrete options
 *
 * User reported:
 * - project-dashboard: 1.34mm
 * - main: 1.48mm
 * - Difference: 10.4%
 */

import { runBruteForce } from '../src/calculations/bruteForceAlgorithm'
import type { DesignInputs } from '../src/types/design-inputs'

describe('Deflection Investigation', () => {
  it('should log detailed deflection breakdown for test case', async () => {
    const designInputs: DesignInputs = {
      cavity_width: 100,
      slab_thickness: 225,
      characteristic_load: 6.0,
      support_level: -200, // bracket drop
      notch_height: 0,
      notch_depth: 0,
      fixing_position: 75,
      use_custom_fixing_position: false,
      dim_d: 0,
      use_custom_dim_d: false,
      facade_thickness: 102.5,
      load_position: 1/3,
      front_offset: 12,
      isolation_shim_thickness: 3,
      material_type: 'brick',
      max_allowable_bracket_extension: null,
      enable_angle_extension: false,
      frame_fixing_type: 'concrete',
      top_critical_edge: 75,
      bottom_critical_edge: 50,
      allowed_channel_types: ['CPRO38', 'CPRO50', 'CPRO52', 'R-HPTIII-70', 'R-HPTIII-90']
    }

    const result = await runBruteForce({
      maxGenerations: 1000,
      designInputs,
      onProgress: () => {}
    })

    const optimal = result.result

    console.log('\n========================================')
    console.log('OPTIMAL DESIGN GEOMETRY')
    console.log('========================================')
    console.log('Bracket Type:', optimal.genetic.bracket_type)
    console.log('Bracket Centres:', optimal.genetic.bracket_centres, 'mm')
    console.log('Bracket Thickness:', optimal.genetic.bracket_thickness, 'mm')
    console.log('Angle Thickness:', optimal.genetic.angle_thickness, 'mm')
    console.log('Vertical Leg:', optimal.genetic.vertical_leg, 'mm')
    console.log('Horizontal Leg:', optimal.genetic.horizontal_leg, 'mm')
    console.log('Channel Type:', optimal.genetic.channel_type)
    console.log('Fixing Position:', optimal.genetic.fixing_position, 'mm')
    console.log('')
    console.log('========================================')
    console.log('CALCULATED GEOMETRY')
    console.log('========================================')
    console.log('Bracket Height:', optimal.calculated.bracket_height, 'mm')
    console.log('Bracket Projection:', optimal.calculated.bracket_projection, 'mm')
    console.log('Rise to Bolts:', optimal.calculated.rise_to_bolts, 'mm')
    console.log('Drop Below Slab:', optimal.calculated.drop_below_slab, 'mm')
    console.log('Angle Length:', optimal.calculated.angle_length, 'mm')
    console.log('')
    console.log('========================================')
    console.log('DEFLECTION BREAKDOWN')
    console.log('========================================')
    console.log('Total Deflection:', optimal.calculated.total_deflection?.toFixed(5), 'mm')

    const deflectionResults = optimal.calculated.detailed_verification_results?.deflectionResults
    if (deflectionResults) {
      console.log('Bracket Deflection:', deflectionResults.bracket_deflection?.toFixed(5), 'mm')
      console.log('Angle Deflection:', deflectionResults.angle_deflection?.toFixed(5), 'mm')
      console.log('Combined Deflection:', deflectionResults.combined_deflection?.toFixed(5), 'mm')
      console.log('Deflection Limit:', deflectionResults.deflection_limit?.toFixed(5), 'mm')
      console.log('Deflection Ratio:', deflectionResults.deflection_limit_ratio?.toFixed(5))
    }
    console.log('')
    console.log('========================================')
    console.log('LOADS')
    console.log('========================================')
    console.log('Shear Load (V_ed):', optimal.calculated.shear_load?.toFixed(5), 'kN')

    const momentResults = optimal.calculated.detailed_verification_results?.momentResults
    if (momentResults) {
      console.log('Fixing Moment (M_ed):', momentResults.M_ed_angle?.toFixed(5), 'kNm')
    }

    const combinedResults = optimal.calculated.detailed_verification_results?.combinedResults
    if (combinedResults) {
      console.log('Tension (N_ed):', combinedResults.N_ed?.toFixed(5), 'kN')
    }
    console.log('')
    console.log('========================================')
    console.log('WEIGHT')
    console.log('========================================')
    console.log('Total Weight:', optimal.calculated.weights?.totalWeight?.toFixed(5), 'kg/m')
    console.log('========================================\n')

    expect(optimal.calculated.total_deflection).toBeDefined()
  }, 180000) // 3 minute timeout
})
