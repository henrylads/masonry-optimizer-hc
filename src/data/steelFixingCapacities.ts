/**
 * Steel fixing capacity data
 * Includes capacities for blind bolts (RHS/SHS) and set screws (I-Beam)
 */

import type { SteelFixingCapacity, SteelBoltSize, SteelSectionType } from '@/types/steelFixingTypes';

// Edge distance calculation: 1.2 × hole diameter
const EDGE_DISTANCE_FACTOR = 1.2;

// Hole diameters in mm
const HOLE_DIAMETERS: Record<SteelBoltSize, number> = {
  'M10': 11,
  'M12': 13,
  'M16': 18
};

/**
 * Steel fixing capacities from specification
 * Key format: "{FIXING_METHOD}_{BOLT_SIZE}"
 */
export const STEEL_FIXING_CAPACITIES: Record<string, SteelFixingCapacity> = {
  // Blind Bolt capacities (for RHS/SHS)
  'BLIND_BOLT_M10': {
    fixingMethod: 'BLIND_BOLT',
    boltSize: 'M10',
    tensileCapacity: 12.7, // kN
    shearCapacity: 19.5,   // kN
    holeDiameter: HOLE_DIAMETERS.M10,
    minEdgeDistance: HOLE_DIAMETERS.M10 * EDGE_DISTANCE_FACTOR // 13.2mm
  },
  'BLIND_BOLT_M12': {
    fixingMethod: 'BLIND_BOLT',
    boltSize: 'M12',
    tensileCapacity: 22.0, // kN
    shearCapacity: 28.3,   // kN
    holeDiameter: HOLE_DIAMETERS.M12,
    minEdgeDistance: HOLE_DIAMETERS.M12 * EDGE_DISTANCE_FACTOR // 15.6mm
  },
  'BLIND_BOLT_M16': {
    fixingMethod: 'BLIND_BOLT',
    boltSize: 'M16',
    tensileCapacity: 42.9, // kN
    shearCapacity: 52.8,   // kN
    holeDiameter: HOLE_DIAMETERS.M16,
    minEdgeDistance: HOLE_DIAMETERS.M16 * EDGE_DISTANCE_FACTOR // 21.6mm
  },

  // Set Screw capacities (for I-Beam)
  'SET_SCREW_M10': {
    fixingMethod: 'SET_SCREW',
    boltSize: 'M10',
    tensileCapacity: 20.9, // kN
    shearCapacity: 18.0,   // kN
    holeDiameter: HOLE_DIAMETERS.M10,
    minEdgeDistance: HOLE_DIAMETERS.M10 * EDGE_DISTANCE_FACTOR // 13.2mm
  },
  'SET_SCREW_M12': {
    fixingMethod: 'SET_SCREW',
    boltSize: 'M12',
    tensileCapacity: 30.3, // kN
    shearCapacity: 26.2,   // kN
    holeDiameter: HOLE_DIAMETERS.M12,
    minEdgeDistance: HOLE_DIAMETERS.M12 * EDGE_DISTANCE_FACTOR // 15.6mm
  },
  'SET_SCREW_M16': {
    fixingMethod: 'SET_SCREW',
    boltSize: 'M16',
    tensileCapacity: 56.5, // kN
    shearCapacity: 48.7,   // kN
    holeDiameter: HOLE_DIAMETERS.M16,
    minEdgeDistance: HOLE_DIAMETERS.M16 * EDGE_DISTANCE_FACTOR // 21.6mm
  }
};

/**
 * Get steel fixing capacity based on section type and bolt size
 *
 * Rules:
 * - RHS/SHS: MUST use blind bolts (cannot access inside to tighten)
 * - I-Beam: CAN use set screws OR blind bolts (both allowed, optimization chooses best)
 *
 * @param sectionType - Type of steel section
 * @param boltSize - Bolt size (M10, M12, M16)
 * @param preferredMethod - Optional: force specific fixing method (for I-Beam testing both options)
 * @returns Steel fixing capacity specification
 */
export function getSteelFixingCapacity(
  sectionType: SteelSectionType,
  boltSize: SteelBoltSize,
  preferredMethod?: 'SET_SCREW' | 'BLIND_BOLT'
): SteelFixingCapacity {
  // RHS/SHS MUST use blind bolts (cannot access inside)
  // I-Beam CAN use set screws OR blind bolts
  let fixingMethod: 'SET_SCREW' | 'BLIND_BOLT';

  if (sectionType === 'RHS' || sectionType === 'SHS') {
    // RHS/SHS MUST use blind bolts
    fixingMethod = 'BLIND_BOLT';
  } else if (sectionType === 'I-BEAM') {
    // I-Beam can use either - use preferred if specified, default to set screw
    fixingMethod = preferredMethod || 'SET_SCREW';
  } else {
    // Default to blind bolt for unknown section types
    fixingMethod = 'BLIND_BOLT';
  }

  const key = `${fixingMethod}_${boltSize}`;

  const capacity = STEEL_FIXING_CAPACITIES[key];
  if (!capacity) {
    throw new Error(`No capacity data found for ${fixingMethod} ${boltSize}`);
  }

  return capacity;
}

/**
 * Get all available bolt sizes for a given section type
 *
 * @param sectionType - Type of steel section
 * @returns Array of available bolt sizes
 */
export function getAvailableBoltSizes(sectionType: SteelSectionType): SteelBoltSize[] {
  return ['M10', 'M12', 'M16'];
}
