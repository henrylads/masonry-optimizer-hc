/**
 * JSON Generators for ShapeDiver Integration
 *
 * Converts optimization results and form inputs into the JSON structure
 * required by ShapeDiver parametric model scripts.
 *
 * There are three main JSON outputs:
 * 1. bracketJSON - Bracket specifications from calculation outputs
 * 2. angleJSON - Angle assembly specifications from run layout optimizer
 * 3. runJSON - Run context from form inputs
 */

import { OptimisationResult } from '@/types/optimization-types'
import { FormDataType } from '@/types/form-schema'

// ============================================================================
// Type Definitions for ShapeDiver JSON Structure
// ============================================================================

/**
 * Base unit for all ShapeDiver parameters
 * Follows the pattern: { description, value, unit }
 */
interface ShapeDiverParameter<T> {
  description: string
  value: T
  unit: string
}

// --- Bracket JSON Types ---

interface BracketSpec {
  bracketIndex: ShapeDiverParameter<number>
  bracketSKU: ShapeDiverParameter<string>
  bracketType: ShapeDiverParameter<string>
  bracketMaterial: ShapeDiverParameter<string>
  bracketThickness: ShapeDiverParameter<number>
  bracketLength: ShapeDiverParameter<number>
  bracketHeight: ShapeDiverParameter<number>
  bracketFixingDiameter: ShapeDiverParameter<number>
  bracketToePlateType: ShapeDiverParameter<string>
  bracketBackNotchOption: ShapeDiverParameter<boolean>
  bracketBackNotchLength: ShapeDiverParameter<number>
  bracketBackNotchHeight: ShapeDiverParameter<number>
  bracketToeNotchLength: ShapeDiverParameter<number>
  bracketToeNotchHeight: ShapeDiverParameter<number>
  bracketCutNotchAboveHeight: ShapeDiverParameter<number>
}

export interface BracketJSON {
  bracketCount: ShapeDiverParameter<number>
  brackets: BracketSpec[]
}

// --- Angle JSON Types ---

interface AngleProperties {
  angleType: ShapeDiverParameter<string>
  angleMaterial: ShapeDiverParameter<string>
  angleProfileThickness: ShapeDiverParameter<number>
  angleProfileLength: ShapeDiverParameter<number>  // horizontal leg
  angleProfileHeight: ShapeDiverParameter<number>  // vertical leg
  angleLength: ShapeDiverParameter<number>         // total piece length
}

interface AngleType {
  angleIndex: ShapeDiverParameter<number>
  angleName: ShapeDiverParameter<string>
  anglePositions: ShapeDiverParameter<number[]>      // absolute X from run start
  angleBracketLocations: ShapeDiverParameter<number[]> // relative X from piece start
  angleSKU: ShapeDiverParameter<string>
  angleProperties: AngleProperties
}

export interface AngleJSON {
  anglesCount: ShapeDiverParameter<number>
  angleInstancesCount: ShapeDiverParameter<number>
  angles: AngleType[]
}

// --- Run JSON Types ---

interface SupportDetails {
  supportLength: ShapeDiverParameter<number>
  supportWidth: ShapeDiverParameter<number>
  supportDepth: ShapeDiverParameter<number>
  supportLevel: ShapeDiverParameter<number>
}

interface Substructure {
  supportType: ShapeDiverParameter<string>
  supportDetails: SupportDetails
}

interface RunDetails {
  substructure: Substructure
  projection: ShapeDiverParameter<number>
}

export interface RunJSON {
  runDetails: RunDetails
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Creates a ShapeDiver parameter object
 */
function createParameter<T>(description: string, value: T, unit: string = ''): ShapeDiverParameter<T> {
  return { description, value, unit }
}

/**
 * Generates a bracket SKU code
 * Format: AMS-S-{thickness}-{length}-{height}
 */
function generateBracketSKU(thickness: number, length: number, height: number): string {
  return `AMS-S-${thickness}-${length}-${height}`
}

/**
 * Generates an angle SKU code
 * Format: AMS-{horizontal}/{vertical}-{thickness}-{length}-{material}
 */
function generateAngleSKU(
  horizontalLeg: number,
  verticalLeg: number,
  thickness: number,
  length: number,
  material: string = 'A4'
): string {
  return `AMS-${horizontalLeg}/${verticalLeg}-${thickness}-${length}-${material}`
}

/**
 * Maps frame fixing type to support type label
 */
function mapFrameFixingToSupportType(frameFixing: string): string {
  if (frameFixing.startsWith('concrete')) {
    return 'Concrete'
  } else if (frameFixing.startsWith('steel')) {
    return 'Steel'
  }
  return 'Concrete' // default
}

// ============================================================================
// Generator Functions
// ============================================================================

/**
 * Generates bracketJSON from optimization result
 *
 * Extracts bracket geometry and specifications from the genetic and calculated
 * outputs of the optimization algorithm.
 *
 * @param optimizationResult - The optimization result containing bracket parameters
 * @param formInputs - Form inputs containing notch parameters
 * @returns BracketJSON object ready for ShapeDiver
 */
export function generateBracketJSON(
  optimizationResult: OptimisationResult,
  formInputs: FormDataType
): BracketJSON {
  const { genetic, calculated } = optimizationResult

  // Extract bracket dimensions (use calculated values where available, fallback to genetic)
  const bracketThickness = genetic.bracket_thickness
  const bracketLength = calculated.bracket_projection ?? genetic.bracket_projection ?? 0
  const bracketHeight = calculated.bracket_height ?? genetic.bracket_height ?? 0
  const boltDiameter = genetic.bolt_diameter

  // Extract bracket type
  const bracketType = genetic.bracket_type ?? calculated.bracket_type ?? 'Standard'

  // Extract notch parameters from form inputs
  const hasNotch = formInputs.has_notch ?? false
  const notchHeight = hasNotch ? (formInputs.notch_height ?? 0) : 0
  const notchDepth = hasNotch ? (formInputs.notch_depth ?? 0) : 0

  // Generate SKU
  const bracketSKU = generateBracketSKU(
    Math.round(bracketThickness),
    Math.round(bracketLength),
    Math.round(bracketHeight)
  )

  // Create bracket specification
  const bracketSpec: BracketSpec = {
    bracketIndex: createParameter('Index number of the bracket object', 0, ''),
    bracketSKU: createParameter('Stock Keeping Unit identifier', bracketSKU, ''),
    bracketType: createParameter('Type of bracket configuration', bracketType, ''),
    bracketMaterial: createParameter('Stainless steel grade', '304', ''),
    bracketThickness: createParameter('Thickness of the bracket', bracketThickness, 'mm'),
    bracketLength: createParameter('Length of the bracket', Math.round(bracketLength), 'mm'),
    bracketHeight: createParameter('Height of the bracket', Math.round(bracketHeight), 'mm'),
    bracketFixingDiameter: createParameter('Diameter of fixing holes', boltDiameter, 'mm'),
    bracketToePlateType: createParameter('Type of toe plate configuration', 'Standard', ''),
    bracketBackNotchOption: createParameter('Whether back notch is present', false, ''),
    bracketBackNotchLength: createParameter('Length of back notch', 0, 'mm'),
    bracketBackNotchHeight: createParameter('Height of back notch', 0, 'mm'),
    bracketToeNotchLength: createParameter('Length of toe notch', Math.round(notchDepth), 'mm'),
    bracketToeNotchHeight: createParameter('Height of toe notch', Math.round(notchHeight), 'mm'),
    bracketCutNotchAboveHeight: createParameter('Height of cut notch above', 12, 'mm'),
  }

  return {
    bracketCount: createParameter('Total number of bracket objects', 1, ''),
    brackets: [bracketSpec]
  }
}

/**
 * Generates angleJSON from optimization result and run layout
 *
 * Creates angle assembly specification including:
 * - Grouping of identical angle pieces into "types"
 * - Absolute positions of each angle instance from run start
 * - Relative bracket positions within each angle piece
 *
 * @param optimizationResult - The optimization result containing angle parameters
 * @param runLayoutResult - The run layout result containing piece distribution
 * @returns AngleJSON object ready for ShapeDiver
 */
export function generateAngleJSON(
  optimizationResult: OptimisationResult,
  runLayoutResult: { optimal: { pieces: Array<{ length: number; bracketCount: number; positions: number[]; startOffset: number }> } }
): AngleJSON {
  const { genetic, calculated } = optimizationResult

  // Extract angle dimensions
  const angleThickness = genetic.angle_thickness
  const horizontalLeg = genetic.horizontal_leg ?? 80
  const verticalLeg = calculated.effective_vertical_leg ?? genetic.vertical_leg ?? 80
  const angleOrientation = genetic.angle_orientation ?? calculated.angle_orientation ?? 'Standard'

  // Group pieces by type (same length, bracket count, and spacing)
  interface PieceType {
    length: number
    bracketCount: number
    positions: number[]
    instances: number[] // absolute X positions of this type in the run
  }

  const pieceTypes: PieceType[] = []
  let currentXPosition = 0

  runLayoutResult.optimal.pieces.forEach((piece) => {
    // Check if this piece type already exists
    const existingType = pieceTypes.find(
      (type) =>
        type.length === piece.length &&
        type.bracketCount === piece.bracketCount &&
        JSON.stringify(type.positions) === JSON.stringify(piece.positions)
    )

    if (existingType) {
      // Add this instance to existing type
      existingType.instances.push(currentXPosition)
    } else {
      // Create new type
      pieceTypes.push({
        length: piece.length,
        bracketCount: piece.bracketCount,
        positions: piece.positions,
        instances: [currentXPosition]
      })
    }

    // Update position for next piece (add piece length + gap)
    currentXPosition += piece.length + 10 // 10mm gap between pieces
  })

  // Convert piece types to angle types
  const angles: AngleType[] = pieceTypes.map((type, index) => {
    const angleSKU = generateAngleSKU(
      Math.round(horizontalLeg),
      Math.round(verticalLeg),
      Math.round(angleThickness),
      Math.round(type.length),
      '316' // Angle material grade
    )

    const angleName = `Level-1-ANG-Type-${String(index).padStart(2, '0')}`

    return {
      angleIndex: createParameter('Index of angle type', index, ''),
      angleName: createParameter('Name identifier for the angle type', angleName, ''),
      anglePositions: createParameter(
        'X-coordinates of angle instances from start of run',
        type.instances,
        'mm'
      ),
      angleBracketLocations: createParameter(
        'X-coordinates of bracket locations from start of angle',
        type.positions.map(p => Math.round(p)),
        'mm'
      ),
      angleSKU: createParameter('Stock keeping unit identifier', angleSKU, ''),
      angleProperties: {
        angleType: createParameter('Type of angle profile', angleOrientation, ''),
        angleMaterial: createParameter('Material grade of stainless steel', '316', ''),
        angleProfileThickness: createParameter('Thickness of the angle profile', angleThickness, 'mm'),
        angleProfileLength: createParameter('Length of the angle profile', Math.round(horizontalLeg), 'mm'),
        angleProfileHeight: createParameter('Height of the angle profile', Math.round(verticalLeg), 'mm'),
        angleLength: createParameter('Total length of the angle', Math.round(type.length), 'mm')
      }
    }
  })

  // Calculate total instances
  const totalInstances = pieceTypes.reduce((sum, type) => sum + type.instances.length, 0)

  return {
    anglesCount: createParameter('Number of angle types', angles.length, ''),
    angleInstancesCount: createParameter('Total number of angle instances', totalInstances, ''),
    angles
  }
}

/**
 * Generates runJSON from form inputs and optimization result
 *
 * Creates run context specification including:
 * - Support type (Concrete/Steel)
 * - Slab dimensions (length, width, depth, level)
 * - Bracket projection distance
 *
 * @param formInputs - Form inputs containing run parameters
 * @param optimizationResult - The optimization result
 * @param runLength - Total length of the run in mm
 * @returns RunJSON object ready for ShapeDiver
 */
export function generateRunJSON(
  formInputs: FormDataType,
  optimizationResult: OptimisationResult,
  runLength: number
): RunJSON {
  // Map frame fixing type to support type
  const supportType = mapFrameFixingToSupportType(formInputs.frame_fixing_type)

  // Extract slab dimensions
  const slabWidth = formInputs.slab_thickness ?? 225 // Width = slab thickness
  const slabDepth = 225 // Default depth (not currently in form)
  const supportLevel = Math.abs(formInputs.support_level) // Support level from bracket_drop (make positive)

  // Extract bracket projection
  const bracketProjection = optimizationResult.calculated.bracket_projection ??
                           optimizationResult.genetic.bracket_projection ??
                           0

  return {
    runDetails: {
      substructure: {
        supportType: createParameter('Type of support', supportType, ''),
        supportDetails: {
          supportLength: createParameter('Length of support', Math.round(runLength), 'mm'),
          supportWidth: createParameter('Width of support', Math.round(slabWidth), 'mm'),
          supportDepth: createParameter('Depth of support', Math.round(slabDepth), 'mm'),
          supportLevel: createParameter('Level of support', Math.round(supportLevel), 'mm')
        }
      },
      projection: createParameter('Projection distance', Math.round(bracketProjection), 'mm')
    }
  }
}
