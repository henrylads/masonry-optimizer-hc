/**
 * Standard steel section size libraries
 * Includes RHS, SHS, and I-Beam standard sizes
 */

import type { RhsSize, ShsSize, IBeamSize, SteelSectionType } from '@/types/steelFixingTypes';

/**
 * Standard Rectangular Hollow Section sizes
 */
export const RHS_SIZES: RhsSize[] = [
  '50x25', '50x30', '60x40', '80x40', '80x60', '90x50',
  '100x40', '100x50', '100x60', '100x80',
  '120x40', '120x60', '120x80',
  '150x100', '160x80', '200x100', '250x150', '300x200',
  '400x200', '450x250'
];

/**
 * Standard Square Hollow Section sizes
 */
export const SHS_SIZES: ShsSize[] = [
  '20x20', '25x25', '30x30', '40x40', '50x50', '60x60',
  '70x70', '80x80', '90x90', '100x100', '120x120',
  '150x150', '180x180', '200x200', '250x250', '300x300'
];

/**
 * Standard I-Beam sizes
 */
export const I_BEAM_SIZES: IBeamSize[] = [
  '127x76', '152x89', '178x102', '203x102', '203x133',
  '254x102', '254x146', '305x102', '305x127', '305x165',
  '356x127', '356x171', '406x140', '406x178', '457x152',
  '457x191', '533x210', '610x229', '610x305', '686x254',
  '762x267', '838x292', '914x305', '914x419'
];

/**
 * Extract fixing height from steel section size
 * Uses first dimension as the height for all section types
 *
 * - RHS: first dimension (e.g., 50x25 → 50mm)
 * - SHS: single dimension (e.g., 50x50 → 50mm)
 * - I-Beam: first dimension/depth (e.g., 127x76 → 127mm)
 *
 * @param sectionType - Type of steel section
 * @param size - Section size string (e.g., "127x76")
 * @returns Height in mm
 */
export function getSectionHeight(
  sectionType: SteelSectionType,
  size: string
): number {
  const dimensions = size.split('x').map(d => parseInt(d, 10));

  if (dimensions.length === 0 || isNaN(dimensions[0])) {
    throw new Error(`Invalid section size format: ${size}`);
  }

  // First dimension is always the height (depth for I-Beam, height for RHS/SHS)
  return dimensions[0];
}

/**
 * Get list of standard section sizes for a given section type
 *
 * @param sectionType - Type of steel section
 * @returns Array of standard section size strings
 */
export function getSectionSizes(sectionType: SteelSectionType): string[] {
  switch (sectionType) {
    case 'RHS':
      return RHS_SIZES;
    case 'SHS':
      return SHS_SIZES;
    case 'I-BEAM':
      return I_BEAM_SIZES;
    default:
      throw new Error(`Unknown section type: ${sectionType}`);
  }
}

/**
 * Validate that a size string is a valid standard size for the section type
 *
 * @param sectionType - Type of steel section
 * @param size - Section size to validate
 * @returns true if valid standard size
 */
export function isValidStandardSize(
  sectionType: SteelSectionType,
  size: string
): boolean {
  const validSizes = getSectionSizes(sectionType);
  return validSizes.includes(size as any);
}
