/**
 * Utility functions for working with steel section types derived from frame_fixing_type
 */

export type SteelSectionType = 'I-BEAM' | 'RHS' | 'SHS'

/**
 * Derives the steel section type from the frame_fixing_type value
 * @param frameFixingType - The frame fixing type ('steel-ibeam', 'steel-rhs', 'steel-shs', etc.)
 * @returns The corresponding steel section type ('I-BEAM', 'RHS', 'SHS') or undefined
 */
export function getSteelSectionTypeFromFrameType(frameFixingType: string | undefined): SteelSectionType | undefined {
  if (!frameFixingType) return undefined

  if (frameFixingType === 'steel-ibeam') return 'I-BEAM'
  if (frameFixingType === 'steel-rhs') return 'RHS'
  if (frameFixingType === 'steel-shs') return 'SHS'

  return undefined
}

/**
 * Maps a steel section type back to its frame_fixing_type value
 * @param sectionType - The steel section type ('I-BEAM', 'RHS', 'SHS')
 * @returns The corresponding frame fixing type or undefined
 */
export function getFrameTypeFromSteelSection(sectionType: SteelSectionType | undefined): string | undefined {
  if (!sectionType) return undefined

  if (sectionType === 'I-BEAM') return 'steel-ibeam'
  if (sectionType === 'RHS') return 'steel-rhs'
  if (sectionType === 'SHS') return 'steel-shs'

  return undefined
}
