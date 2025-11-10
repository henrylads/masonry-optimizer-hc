/**
 * Sample JSON Generator Script
 *
 * Generates example JSON files for ShapeDiver integration using the
 * 5072mm @ 300mm centres test case.
 *
 * This script demonstrates how optimization results are transformed into
 * the JSON structure required by ShapeDiver parametric model scripts.
 */

import { writeFileSync } from 'fs'
import { join } from 'path'
import { optimizeRunLayout } from '../src/calculations/runLayoutOptimizer'
import { runBruteForce } from '../src/calculations/bruteForceAlgorithm'
import {
  generateBracketJSON,
  generateAngleJSON,
  generateRunJSON
} from '../src/utils/json-generators'
import type { FormDataType } from '../src/types/form-schema'
import type { DesignInputs } from '../src/types/designInputs'

// ============================================================================
// Test Case Configuration (5072mm @ 300mm centres)
// ============================================================================

/**
 * Form inputs for the test case
 */
const formInputs: FormDataType = {
  frame_fixing_type: 'concrete-cast-in',
  slab_thickness: 225,
  cavity: 100,
  support_level: -50, // bracket_drop
  characteristic_load: 7.5,
  has_notch: true,
  notch_height: 60,
  notch_depth: 22,
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

/**
 * Design inputs for optimization (compatible with DesignInputs type)
 */
const designInputs: DesignInputs = {
  support_level: 50, // positive value
  cavity_width: 100,
  slab_thickness: 225,
  characteristic_load: 7.5,
  top_critical_edge: 75,
  bottom_critical_edge: 150,
  notch_height: 60,
  notch_depth: 22,
  facade_thickness: 102.5,
  load_position: 1/3,
  front_offset: 12,
  isolation_shim_thickness: 3,
  material_type: 'S304',
  use_custom_fixing_position: false,
  fixing_position: 75,
  use_custom_dim_d: false,
  dim_d: 130
}

/**
 * Run layout configuration
 */
const runLayoutConfig = {
  totalRunLength: 5072.5, // 5.0725 meters in mm
  bracketCentres: 300,
  maxAngleLength: 1490,
  gapBetweenPieces: 10,
  minEdgeDistance: 35,
  maxEdgeDistance: 150 // 0.5 × 300
}

// ============================================================================
// Main Generator Function
// ============================================================================

async function generateSampleJSON() {
  console.log('\n🔄 Starting sample JSON generation...\n')
  console.log('Test case: 5072.5mm run @ 300mm bracket centres\n')

  try {
    // Step 1: Run the layout optimizer
    console.log('1️⃣  Running run layout optimizer...')
    const runLayoutResult = optimizeRunLayout(runLayoutConfig)

    console.log(`   ✅ Optimal layout found:`)
    console.log(`      - Total pieces: ${runLayoutResult.optimal.pieceCount}`)
    console.log(`      - Total brackets: ${runLayoutResult.optimal.totalBrackets}`)
    console.log(`      - Average spacing: ${runLayoutResult.optimal.averageSpacing.toFixed(2)}mm`)
    console.log(`      - Score: ${runLayoutResult.optimal.score}\n`)

    // Step 2: Run the brute force optimization
    console.log('2️⃣  Running brute force optimization...')
    const result = await runBruteForce({
      maxGenerations: 50,
      designInputs: designInputs
    })
    const optimizationResult = result.result

    if (!optimizationResult || !optimizationResult.genetic) {
      throw new Error('Optimization failed to produce valid results')
    }

    console.log(`   ✅ Optimization complete:`)
    console.log(`      - Bracket thickness: ${optimizationResult.genetic.bracket_thickness}mm`)
    console.log(`      - Angle thickness: ${optimizationResult.genetic.angle_thickness}mm`)
    console.log(`      - Vertical leg: ${optimizationResult.genetic.vertical_leg}mm`)
    console.log(`      - Horizontal leg: ${optimizationResult.genetic.horizontal_leg}mm`)
    console.log(`      - Bolt diameter: ${optimizationResult.genetic.bolt_diameter}mm`)
    console.log(`      - Bracket height: ${optimizationResult.calculated.bracket_height}mm`)
    console.log(`      - Bracket projection: ${optimizationResult.calculated.bracket_projection}mm\n`)

    // Step 3: Generate bracketJSON
    console.log('3️⃣  Generating bracketJSON...')
    const bracketJSON = generateBracketJSON(optimizationResult, formInputs)
    const bracketPath = join(process.cwd(), 'docs/json_tests/bracket_example_5072mm_300c.json')
    writeFileSync(bracketPath, JSON.stringify(bracketJSON, null, 2))
    console.log(`   ✅ Saved to: ${bracketPath}\n`)

    // Step 4: Generate angleJSON
    console.log('4️⃣  Generating angleJSON...')
    const angleJSON = generateAngleJSON(optimizationResult, runLayoutResult)
    const anglePath = join(process.cwd(), 'docs/json_tests/angle_example_5072mm_300c.json')
    writeFileSync(anglePath, JSON.stringify(angleJSON, null, 2))
    console.log(`   ✅ Saved to: ${anglePath}`)
    console.log(`      - Angle types: ${angleJSON.anglesCount.value}`)
    console.log(`      - Total instances: ${angleJSON.angleInstancesCount.value}\n`)

    // Step 5: Generate runJSON
    console.log('5️⃣  Generating runJSON...')
    const runJSON = generateRunJSON(formInputs, optimizationResult, runLayoutConfig.totalRunLength)
    const runPath = join(process.cwd(), 'docs/json_tests/run_example_5072mm_300c.json')
    writeFileSync(runPath, JSON.stringify(runJSON, null, 2))
    console.log(`   ✅ Saved to: ${runPath}\n`)

    // Summary
    console.log('✨ Sample JSON generation complete!\n')
    console.log('Generated files:')
    console.log(`   📄 ${bracketPath}`)
    console.log(`   📄 ${anglePath}`)
    console.log(`   📄 ${runPath}\n`)

    console.log('These files demonstrate the JSON structure for:')
    console.log('   • Bracket specifications (from calculation outputs)')
    console.log('   • Angle assembly layout (from run optimizer)')
    console.log('   • Run context (from form inputs)\n')

  } catch (error) {
    console.error('\n❌ Error generating sample JSON:', error)
    if (error instanceof Error) {
      console.error('   Message:', error.message)
      console.error('   Stack:', error.stack)
    }
    process.exit(1)
  }
}

// Run the generator
generateSampleJSON()
