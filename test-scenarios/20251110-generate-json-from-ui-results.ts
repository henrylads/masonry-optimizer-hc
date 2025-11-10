/**
 * Generate JSON from UI Results
 *
 * This script generates ShapeDiver JSON files using EXACT values from the UI
 * optimization results, rather than running the optimization again.
 *
 * Use this when you want the JSON to match exactly what the UI shows.
 */

import { writeFileSync } from 'fs'
import { join } from 'path'
import { optimizeRunLayout } from '../src/calculations/runLayoutOptimizer'
import {
  generateBracketJSON,
  generateAngleJSON,
  generateRunJSON
} from '../src/utils/json-generators'
import type { FormDataType } from '../src/types/form-schema'
import type { OptimisationResult } from '../src/types/optimization-types'

// ============================================================================
// Manual Input: Copy these values EXACTLY from your UI optimization results
// ============================================================================

const UI_RESULTS = {
  // Genetic parameters (from UI)
  bracket_centres: 500,
  bracket_thickness: 3,  // ⬅️ SET THIS FROM UI
  angle_thickness: 5,
  vertical_leg: 60,
  horizontal_leg: 90,
  bolt_diameter: 10,
  bracket_type: 'Standard' as const,  // ⬅️ SET THIS FROM UI
  angle_orientation: 'Standard' as const,  // ⬅️ SET THIS FROM UI

  // Calculated parameters (from UI)
  bracket_height: 215,  // ⬅️ SET THIS FROM UI
  bracket_projection: 90,  // ⬅️ SET THIS FROM UI
}

const FORM_INPUTS: FormDataType = {
  frame_fixing_type: 'concrete-cast-in',
  slab_thickness: 225,
  cavity: 100,
  support_level: -250,  // bracket_drop
  characteristic_load: 7.5,
  has_notch: false,
  notch_height: 0,
  notch_depth: 0,
  is_angle_length_limited: false,
  fixing_type: 'all',
  channel_product: 'all',
  postfix_product: 'all',
  use_custom_fixing_position: false,
  fixing_position: 75,
  use_custom_dim_d: false,
  dim_d: 130,
  facade_thickness: 102.5,
  load_position: 1/3,
  front_offset: 12,
  isolation_shim_thickness: 3,
  bracket_type: 'standard',
  angle_orientation: 'standard',
  enable_fixing_optimization: false,
  material_type: 'S304'
}

const RUN_CONFIG = {
  totalRunLength: 5072.5,
  bracketCentres: 300,
  maxAngleLength: 1490,
  gapBetweenPieces: 10,
  minEdgeDistance: 35,
  maxEdgeDistance: 150
}

// ============================================================================
// Main Generator Function
// ============================================================================

async function generateFromUIResults() {
  console.log('\n🔄 Generating JSON from UI results...\n')
  console.log('Configuration:')
  console.log(`  - Bracket drop: ${FORM_INPUTS.support_level}mm`)
  console.log(`  - Notch: ${FORM_INPUTS.has_notch ? 'YES' : 'NO'}`)
  console.log(`  - Run length: ${RUN_CONFIG.totalRunLength}mm @ ${RUN_CONFIG.bracketCentres}mm centres\n`)

  try {
    // Step 1: Run layout optimizer (this part is deterministic)
    console.log('1️⃣  Running run layout optimizer...')
    const runLayoutResult = optimizeRunLayout(RUN_CONFIG)

    console.log(`   ✅ Layout calculated:`)
    console.log(`      - Total pieces: ${runLayoutResult.optimal.pieceCount}`)
    console.log(`      - Total brackets: ${runLayoutResult.optimal.totalBrackets}`)
    console.log(`      - Average spacing: ${runLayoutResult.optimal.averageSpacing.toFixed(2)}mm\n`)

    // Step 2: Create optimization result object from UI values
    console.log('2️⃣  Using UI optimization results:')
    console.log(`      - Bracket thickness: ${UI_RESULTS.bracket_thickness}mm`)
    console.log(`      - Bracket height: ${UI_RESULTS.bracket_height}mm`)
    console.log(`      - Bracket projection: ${UI_RESULTS.bracket_projection}mm`)
    console.log(`      - Bracket type: ${UI_RESULTS.bracket_type}`)
    console.log(`      - Angle thickness: ${UI_RESULTS.angle_thickness}mm`)
    console.log(`      - Angle orientation: ${UI_RESULTS.angle_orientation}`)
    console.log(`      - Horizontal leg: ${UI_RESULTS.horizontal_leg}mm`)
    console.log(`      - Vertical leg: ${UI_RESULTS.vertical_leg}mm`)
    console.log(`      - Bolt diameter: ${UI_RESULTS.bolt_diameter}mm`)
    console.log(`      - Bracket centres: ${UI_RESULTS.bracket_centres}mm\n`)

    const optimizationResult: OptimisationResult = {
      genetic: {
        bracket_centres: UI_RESULTS.bracket_centres as any,
        bracket_thickness: UI_RESULTS.bracket_thickness as any,
        angle_thickness: UI_RESULTS.angle_thickness as any,
        vertical_leg: UI_RESULTS.vertical_leg,
        horizontal_leg: UI_RESULTS.horizontal_leg,
        bolt_diameter: UI_RESULTS.bolt_diameter as any,
        bracket_type: UI_RESULTS.bracket_type,
        angle_orientation: UI_RESULTS.angle_orientation,
        bracket_height: UI_RESULTS.bracket_height,
        bracket_projection: UI_RESULTS.bracket_projection,
      },
      calculated: {
        bracket_height: UI_RESULTS.bracket_height,
        bracket_projection: UI_RESULTS.bracket_projection,
        bracket_type: UI_RESULTS.bracket_type,
        angle_orientation: UI_RESULTS.angle_orientation,
        moment_resistance_check: true,
        shear_resistance_check: true,
        angle_deflection_check: true,
        bracket_connection_check: true,
        shear_reduction_check: true,
        bracket_design_check: true,
        fixing_check: true,
        combined_tension_shear_check: true,
        all_checks_pass: true,
      }
    }

    // Step 3: Generate bracketJSON
    console.log('3️⃣  Generating bracketJSON...')
    const bracketJSON = generateBracketJSON(optimizationResult, FORM_INPUTS)
    const bracketPath = join(process.cwd(), 'docs/json_tests/bracket_ui_results_250drop_nonotch.json')
    writeFileSync(bracketPath, JSON.stringify(bracketJSON, null, 2))
    console.log(`   ✅ Saved to: ${bracketPath}`)
    console.log(`      SKU: ${bracketJSON.brackets[0].bracketSKU.value}\n`)

    // Step 4: Generate angleJSON
    console.log('4️⃣  Generating angleJSON...')
    const angleJSON = generateAngleJSON(optimizationResult, runLayoutResult)
    const anglePath = join(process.cwd(), 'docs/json_tests/angle_ui_results_250drop_nonotch.json')
    writeFileSync(anglePath, JSON.stringify(angleJSON, null, 2))
    console.log(`   ✅ Saved to: ${anglePath}`)
    console.log(`      - Angle types: ${angleJSON.anglesCount.value}`)
    console.log(`      - Total instances: ${angleJSON.angleInstancesCount.value}\n`)

    // Step 5: Generate runJSON
    console.log('5️⃣  Generating runJSON...')
    const runJSON = generateRunJSON(FORM_INPUTS, optimizationResult, RUN_CONFIG.totalRunLength)
    const runPath = join(process.cwd(), 'docs/json_tests/run_ui_results_250drop_nonotch.json')
    writeFileSync(runPath, JSON.stringify(runJSON, null, 2))
    console.log(`   ✅ Saved to: ${runPath}\n`)

    // Summary
    console.log('✨ JSON generation complete!\n')
    console.log('Generated files based on UI results:')
    console.log(`   📄 ${bracketPath}`)
    console.log(`   📄 ${anglePath}`)
    console.log(`   📄 ${runPath}\n`)

    console.log('📋 To generate with different UI results:')
    console.log('   1. Run optimization in UI')
    console.log('   2. Copy the values from Results panel')
    console.log('   3. Update UI_RESULTS object at top of this script')
    console.log('   4. Run: npx tsx test-scenarios/20251110-generate-json-from-ui-results.ts\n')

  } catch (error) {
    console.error('\n❌ Error generating JSON:', error)
    if (error instanceof Error) {
      console.error('   Message:', error.message)
      console.error('   Stack:', error.stack)
    }
    process.exit(1)
  }
}

// Run the generator
generateFromUIResults()
