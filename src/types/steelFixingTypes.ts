/**
 * Types for steel fixing system integration
 * Supports I-Beams with set screws and RHS/SHS with blind bolts
 */

// Frame fixing type selector - top level choice
export type FrameFixingType =
  | 'concrete-cast-in'
  | 'concrete-post-fix'
  | 'concrete-all'
  | 'steel-ibeam'
  | 'steel-rhs'
  | 'steel-shs';

// Steel section types
export type SteelSectionType = 'I-BEAM' | 'RHS' | 'SHS';

// Steel fixing types (automatically determined by section type)
export type SteelFixingMethod = 'SET_SCREW' | 'BLIND_BOLT';

// Bolt sizes for steel fixings
export type SteelBoltSize = 'M10' | 'M12' | 'M16';

// Standard RHS sizes (Rectangular Hollow Section)
export type RhsSize =
  | '50x25' | '50x30' | '60x40' | '80x40' | '80x60' | '90x50'
  | '100x40' | '100x50' | '100x60' | '100x80'
  | '120x40' | '120x60' | '120x80'
  | '150x100' | '160x80' | '200x100' | '250x150' | '300x200'
  | '400x200' | '450x250';

// Standard SHS sizes (Square Hollow Section)
export type ShsSize =
  | '20x20' | '25x25' | '30x30' | '40x40' | '50x50' | '60x60'
  | '70x70' | '80x80' | '90x90' | '100x100' | '120x120'
  | '150x150' | '180x180' | '200x200' | '250x250' | '300x300';

// Standard I-Beam sizes
export type IBeamSize =
  | '127x76' | '152x89' | '178x102' | '203x102' | '203x133'
  | '254x102' | '254x146' | '305x102' | '305x127' | '305x165'
  | '356x127' | '356x171' | '406x140' | '406x178' | '457x152'
  | '457x191' | '533x210' | '610x229' | '610x305' | '686x254'
  | '762x267' | '838x292' | '914x305' | '914x419';

/**
 * Steel section specification
 */
export interface SteelSection {
  /** Type of steel section */
  sectionType: SteelSectionType;

  /** Standard section size (null if using custom) */
  size: RhsSize | ShsSize | IBeamSize | null;

  /** Custom section height in mm (only if size is null) */
  customHeight?: number;

  /** Effective height in mm - used as equivalent to slab thickness for geometry calculations */
  effectiveHeight: number;
}

/**
 * Steel fixing capacity specification
 */
export interface SteelFixingCapacity {
  /** Fixing method (set screw or blind bolt) */
  fixingMethod: SteelFixingMethod;

  /** Bolt size */
  boltSize: SteelBoltSize;

  /** Tensile capacity in kN (Ft,Rd) */
  tensileCapacity: number;

  /** Shear capacity in kN (Fv,Rd) */
  shearCapacity: number;

  /** Minimum edge distance in mm (1.2 × hole diameter) */
  minEdgeDistance: number;

  /** Hole diameter in mm */
  holeDiameter: number;
}
