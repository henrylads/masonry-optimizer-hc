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
  bracketFixingLevel: ShapeDiverParameter<number>
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
 * Maps frame fixing type and steel section type to support type label
 * Returns: 'Concrete', 'I-beam', 'RHS', or 'SHS'
 */
function mapFrameFixingToSupportType(frameFixing: string, steelSectionType?: string): string {
  if (frameFixing.startsWith('concrete')) {
    return 'Concrete'
  } else if (frameFixing.startsWith('steel')) {
    // Map steel section type to specific support type
    switch (steelSectionType) {
      case 'I-BEAM':
        return 'I-beam'
      case 'RHS':
        return 'RHS'
      case 'SHS':
        return 'SHS'
      default:
        return 'I-beam' // default to I-beam if not specified
    }
  }
  return 'Concrete' // default
}

/**
 * Extracts steel section dimensions from the steel_section_size string
 * Format examples: "203x102" for I-beam, "150x100" for RHS, "100x100" for SHS
 * Returns { width, depth } where:
 * - For I-beam "203x102": depth=203, width=102
 * - For RHS "150x100": depth=150, width=100
 * - For SHS "100x100": depth=100, width=100
 */
function extractSteelSectionDimensions(steelSectionSize?: string): { width: number; depth: number } {
  if (!steelSectionSize) {
    return { width: 102, depth: 203 } // default I-beam dimensions
  }

  const parts = steelSectionSize.split('x')
  if (parts.length === 2) {
    const depth = parseInt(parts[0]) || 203
    const width = parseInt(parts[1]) || 102
    return { width, depth }
  }

  return { width: 102, depth: 203 } // default
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
  let bracketHeight = calculated.bracket_height ?? genetic.bracket_height ?? 0
  const boltDiameter = genetic.bolt_diameter

  // Extract bracket type and angle orientation
  const bracketType = genetic.bracket_type ?? calculated.bracket_type ?? 'Standard'
  const angleOrientation = genetic.angle_orientation ?? calculated.angle_orientation ?? 'Standard'
  const angleThickness = genetic.angle_thickness

  // CRITICAL FIX for ShapeDiver visualization:
  // Our backend calculations now subtract angle thickness for Standard bracket + Standard angle,
  // but ShapeDiver's 3D model expects bracket height BEFORE angle thickness subtraction
  // because it renders the bracket and angle separately.
  // So we need to ADD the angle thickness back for ShapeDiver.
  if (bracketType === 'Standard' && angleOrientation === 'Standard') {
    bracketHeight = bracketHeight + angleThickness
    console.log(`📐 ShapeDiver bracket height adjustment: Adding ${angleThickness}mm angle thickness back to bracket height for 3D rendering`)
    console.log(`   Backend calculation: ${bracketHeight - angleThickness}mm (structural)`)
    console.log(`   ShapeDiver rendering: ${bracketHeight}mm (includes space for angle)`)
  }

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

  // Calculate fixing level (fixing position from top of slab/steel section)
  // Use optimized_fixing_position from calculated, or fixing_position from genetic
  // The fixing position is stored as a positive value (distance from top), but ShapeDiver expects negative
  const fixingPosition = calculated.optimized_fixing_position ?? genetic.fixing_position ?? 0
  const bracketFixingLevel = -Math.round(fixingPosition) // Negative because it's below the top

  // Determine toe plate type based on angle orientation
  // When angle is inverted, the toe plate must also be inverted to match the angle geometry
  const toePlateType = angleOrientation === 'Inverted' ? 'Inverted' : 'Standard'

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
    bracketToePlateType: createParameter('Type of toe plate configuration', toePlateType, ''),
    bracketBackNotchOption: createParameter('Whether back notch is present', hasNotch, ''),
    bracketBackNotchLength: createParameter('Length of back notch', Math.round(notchDepth), 'mm'),
    bracketBackNotchHeight: createParameter('Height of back notch', Math.round(notchHeight), 'mm'),
    bracketToeNotchLength: createParameter('Length of toe notch', 22, 'mm'),
    bracketToeNotchHeight: createParameter('Height of toe notch', 60, 'mm'),
    bracketCutNotchAboveHeight: createParameter('Height of cut notch above', 12, 'mm'),
    bracketFixingLevel: createParameter('Fixing level below top of slab/steel', bracketFixingLevel, 'mm'),
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
  // Determine if this is a steel fixing type
  const isSteelFixing = formInputs.frame_fixing_type?.startsWith('steel') ?? false

  // Map frame fixing type to support type (now includes I-beam, RHS, SHS)
  const supportType = mapFrameFixingToSupportType(
    formInputs.frame_fixing_type ?? 'concrete-all',
    formInputs.steel_section_type
  )

  // Extract support dimensions based on fixing type
  let supportWidth: number
  let supportDepth: number

  if (isSteelFixing) {
    // For steel fixings, extract dimensions from steel section configuration
    if (formInputs.use_custom_steel_section && formInputs.custom_steel_height) {
      // Custom steel section - use custom height as depth, default width
      supportDepth = formInputs.custom_steel_height
      supportWidth = 102 // Default width for custom sections
    } else if (formInputs.steel_section_size) {
      // Standard steel section - parse the size string (e.g., "203x102")
      const dimensions = extractSteelSectionDimensions(formInputs.steel_section_size)
      supportWidth = dimensions.width
      supportDepth = dimensions.depth
    } else {
      // Fallback to default steel section dimensions
      supportWidth = 102
      supportDepth = 203
    }
  } else {
    // For concrete fixings, use slab thickness
    supportWidth = formInputs.slab_thickness ?? 225
    supportDepth = 225 // Default depth for concrete
  }

  const supportLevel = formInputs.support_level // Support level from bracket_drop (preserves sign)

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
          supportWidth: createParameter('Width of support', Math.round(supportWidth), 'mm'),
          supportDepth: createParameter('Depth of support', Math.round(supportDepth), 'mm'),
          supportLevel: createParameter('Level of support', Math.round(supportLevel), 'mm')
        }
      },
      projection: createParameter('Projection distance', Math.round(bracketProjection), 'mm')
    }
  }
}
