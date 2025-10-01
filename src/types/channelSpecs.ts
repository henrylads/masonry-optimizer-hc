import type { BracketCentres, SlabThickness } from './validationTypes';

// Supported channel families
export type ChannelType = 'CPRO38' | 'CPRO50' | 'R-HPTIII-70' | 'R-HPTIII-90';

/**
 * Channel specification from the shear/tension forces table
 */
export interface ChannelSpec {
  /** Unique identifier combining channel type, slab thickness, and bracket centres */
  id: string;

  /** Channel type (e.g., CPRO38) */
  channelType: ChannelType;

  /** Slab thickness in mm */
  slabThickness: SlabThickness;

  /** Distance between bracket centers in mm */
  bracketCentres: BracketCentres;

  /** Edge distances from slab */
  edgeDistances: {
    /** Distance from top of slab to center of fixing in mm */
    top: number;
    /** Distance from center of fixing to bottom of slab in mm */
    bottom: number;
  };

  /** Maximum allowable forces */
  maxForces: {
    /** Maximum tension force in kN */
    tension: number;
    /** Maximum shear force in kN */
    shear: number;
  };

  /** Utilization factors from CSV data (optional for backward compatibility) */
  utilizationFactors?: {
    /** Tension utilization factor percentage */
    tension: number;
    /** Shear utilization factor percentage */
    shear: number;
    /** Combined utilization factor percentage */
    combined: number;
  };
} 
