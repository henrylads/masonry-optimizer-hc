import { ChannelSpec } from '../types/channelSpecs';
import { parseCsvToChannelSpecs } from '../utils/csv-parser';
import { CSV_CHANNEL_DATA } from './csvData';

/**
 * In-memory store for channel specifications
 */
export const CHANNEL_SPECS = new Map<string, ChannelSpec>();

/**
 * Add a channel specification to the store
 */
export function addChannelSpec(spec: ChannelSpec): void {
  CHANNEL_SPECS.set(spec.id, spec);
}

/**
 * Get a channel specification by its components
 */
export function getChannelSpec(
  channelType: string,
  slabThickness: number,
  bracketCentres: number
): ChannelSpec | undefined {
  // Try exact match first
  const exactId = `${channelType}_${slabThickness}_${bracketCentres}`;
  const exact = CHANNEL_SPECS.get(exactId);
  if (exact) return exact;

  // Fallback: nearest-lower-thickness for same channelType + bracketCentres
  const candidates = Array.from(CHANNEL_SPECS.values())
    .filter(spec => spec.channelType === channelType && spec.bracketCentres === bracketCentres)
    .sort((a, b) => a.slabThickness - b.slabThickness);

  if (candidates.length === 0) return undefined;

  // Find the spec with slabThickness <= requested; if none, use the smallest available
  let selected: ChannelSpec | undefined = undefined;
  for (let i = candidates.length - 1; i >= 0; i--) {
    if (candidates[i].slabThickness <= slabThickness) {
      selected = candidates[i];
      break;
    }
  }
  if (!selected) {
    selected = candidates[0];
  }

  return selected;
}

/**
 * Get all valid bracket centres for a given channel type and slab thickness
 */
export function getValidBracketCentres(
  channelType: string,
  slabThickness: number
): number[] {
  // Try exact thickness first
  let specs = Array.from(CHANNEL_SPECS.values())
    .filter(spec => spec.channelType === channelType && spec.slabThickness === slabThickness);

  if (specs.length === 0) {
    // Fallback to nearest-lower-thickness
    const allForType = Array.from(CHANNEL_SPECS.values())
      .filter(spec => spec.channelType === channelType)
      .sort((a, b) => a.slabThickness - b.slabThickness);

    if (allForType.length > 0) {
      // Choose the highest slabThickness <= requested; if none, use the smallest available
      let chosenThickness = allForType[0].slabThickness;
      for (const s of allForType) {
        if (s.slabThickness <= slabThickness) {
          chosenThickness = s.slabThickness;
        } else {
          break;
        }
      }
      specs = allForType.filter(s => s.slabThickness === chosenThickness);
      console.warn(`Channel specs missing for ${channelType} at ${slabThickness}mm. Using ${chosenThickness}mm data.`);
    }
  }

  return specs
    .map(spec => spec.bracketCentres)
    .sort((a, b) => a - b);
}

/**
 * Get list of available channel types present in the store
 */
export function getAvailableChannelTypes(): string[] {
  const types = new Set<string>();
  for (const spec of CHANNEL_SPECS.values()) {
    types.add(spec.channelType);
  }
  return Array.from(types).sort();
}

/**
 * Get available channel types for a given slab thickness
 */
export function getAvailableChannelTypesForSlab(slabThickness: number): string[] {
  const types = new Set<string>();
  for (const spec of CHANNEL_SPECS.values()) {
    if (spec.slabThickness === slabThickness) {
      types.add(spec.channelType);
    }
  }
  return Array.from(types).sort();
}

/**
 * Initialize the specifications store with data from the project overview
 */
function initializeSpecs(): void {
  // CPRO38 - 200mm slab thickness
  addChannelSpec({
    id: 'CPRO38_200_200',
    channelType: 'CPRO38',
    slabThickness: 200,
    bracketCentres: 200,
    edgeDistances: { top: 75, bottom: 125 },
    maxForces: { tension: 7.75, shear: 7.45 }
  });

  addChannelSpec({
    id: 'CPRO38_200_250',
    channelType: 'CPRO38',
    slabThickness: 200,
    bracketCentres: 250,
    edgeDistances: { top: 75, bottom: 125 },
    maxForces: { tension: 9.45, shear: 8.55 }
  });

  addChannelSpec({
    id: 'CPRO38_200_300',
    channelType: 'CPRO38',
    slabThickness: 200,
    bracketCentres: 300,
    edgeDistances: { top: 75, bottom: 125 },
    maxForces: { tension: 10.75, shear: 10.35 }
  });

  addChannelSpec({
    id: 'CPRO38_200_350',
    channelType: 'CPRO38',
    slabThickness: 200,
    bracketCentres: 350,
    edgeDistances: { top: 75, bottom: 125 },
    maxForces: { tension: 13.00, shear: 11.90 }
  });

  addChannelSpec({
    id: 'CPRO38_200_400',
    channelType: 'CPRO38',
    slabThickness: 200,
    bracketCentres: 400,
    edgeDistances: { top: 75, bottom: 125 },
    maxForces: { tension: 13.50, shear: 13.50 }
  });

  addChannelSpec({
    id: 'CPRO38_200_450',
    channelType: 'CPRO38',
    slabThickness: 200,
    bracketCentres: 450,
    edgeDistances: { top: 75, bottom: 125 },
    maxForces: { tension: 13.90, shear: 15.00 }
  });

  addChannelSpec({
    id: 'CPRO38_200_500',
    channelType: 'CPRO38',
    slabThickness: 200,
    bracketCentres: 500,
    edgeDistances: { top: 75, bottom: 125 },
    maxForces: { tension: 14.25, shear: 16.50 }
  });

  // CPRO38 - 225mm slab thickness
  addChannelSpec({
    id: 'CPRO38_225_200',
    channelType: 'CPRO38',
    slabThickness: 225,
    bracketCentres: 200,
    edgeDistances: { top: 75, bottom: 150 },
    maxForces: { tension: 7.75, shear: 8.60 }
  });

  addChannelSpec({
    id: 'CPRO38_225_250',
    channelType: 'CPRO38',
    slabThickness: 225,
    bracketCentres: 250,
    edgeDistances: { top: 75, bottom: 150 },
    maxForces: { tension: 9.45, shear: 9.70 }
  });

  addChannelSpec({
    id: 'CPRO38_225_300',
    channelType: 'CPRO38',
    slabThickness: 225,
    bracketCentres: 300,
    edgeDistances: { top: 75, bottom: 150 },
    maxForces: { tension: 10.75, shear: 11.55 }
  });

  addChannelSpec({
    id: 'CPRO38_225_350',
    channelType: 'CPRO38',
    slabThickness: 225,
    bracketCentres: 350,
    edgeDistances: { top: 75, bottom: 150 },
    maxForces: { tension: 13.00, shear: 13.20 }
  });

  addChannelSpec({
    id: 'CPRO38_225_400',
    channelType: 'CPRO38',
    slabThickness: 225,
    bracketCentres: 400,
    edgeDistances: { top: 75, bottom: 150 },
    maxForces: { tension: 13.50, shear: 15.00 }
  });

  addChannelSpec({
    id: 'CPRO38_225_450',
    channelType: 'CPRO38',
    slabThickness: 225,
    bracketCentres: 450,
    edgeDistances: { top: 75, bottom: 150 },
    maxForces: { tension: 13.90, shear: 16.60 }
  });

  addChannelSpec({
    id: 'CPRO38_225_500',
    channelType: 'CPRO38',
    slabThickness: 225,
    bracketCentres: 500,
    edgeDistances: { top: 75, bottom: 150 },
    maxForces: { tension: 14.25, shear: 16.60 }
  });

  // CPRO38 - 250mm slab thickness
  addChannelSpec({
    id: 'CPRO38_250_200',
    channelType: 'CPRO38',
    slabThickness: 250,
    bracketCentres: 200,
    edgeDistances: { top: 75, bottom: 175 },
    maxForces: { tension: 7.75, shear: 9.90 }
  });

  addChannelSpec({
    id: 'CPRO38_250_250',
    channelType: 'CPRO38',
    slabThickness: 250,
    bracketCentres: 250,
    edgeDistances: { top: 75, bottom: 175 },
    maxForces: { tension: 9.45, shear: 10.90 }
  });

  addChannelSpec({
    id: 'CPRO38_250_300',
    channelType: 'CPRO38',
    slabThickness: 250,
    bracketCentres: 300,
    edgeDistances: { top: 75, bottom: 175 },
    maxForces: { tension: 10.75, shear: 12.60 }
  });

  addChannelSpec({
    id: 'CPRO38_250_350',
    channelType: 'CPRO38',
    slabThickness: 250,
    bracketCentres: 350,
    edgeDistances: { top: 75, bottom: 175 },
    maxForces: { tension: 13.00, shear: 14.60 }
  });

  addChannelSpec({
    id: 'CPRO38_250_400',
    channelType: 'CPRO38',
    slabThickness: 250,
    bracketCentres: 400,
    edgeDistances: { top: 75, bottom: 175 },
    maxForces: { tension: 13.50, shear: 16.40 }
  });

  addChannelSpec({
    id: 'CPRO38_250_450',
    channelType: 'CPRO38',
    slabThickness: 250,
    bracketCentres: 450,
    edgeDistances: { top: 75, bottom: 175 },
    maxForces: { tension: 13.90, shear: 16.60 }
  });

  addChannelSpec({
    id: 'CPRO38_250_500',
    channelType: 'CPRO38',
    slabThickness: 250,
    bracketCentres: 500,
    edgeDistances: { top: 75, bottom: 175 },
    maxForces: { tension: 14.25, shear: 16.60 }
  });

  // =============================
  // CPRO50 - 200mm slab thickness
  addChannelSpec({
    id: 'CPRO50_200_200',
    channelType: 'CPRO50',
    slabThickness: 200,
    bracketCentres: 200,
    edgeDistances: { top: 75, bottom: 125 },
    maxForces: { tension: 9.60, shear: 7.45 }
  });

  addChannelSpec({
    id: 'CPRO50_200_250',
    channelType: 'CPRO50',
    slabThickness: 200,
    bracketCentres: 250,
    edgeDistances: { top: 75, bottom: 125 },
    maxForces: { tension: 11.55, shear: 8.55 }
  });

  addChannelSpec({
    id: 'CPRO50_200_300',
    channelType: 'CPRO50',
    slabThickness: 200,
    bracketCentres: 300,
    edgeDistances: { top: 75, bottom: 125 },
    maxForces: { tension: 13.35, shear: 10.35 }
  });

  addChannelSpec({
    id: 'CPRO50_200_350',
    channelType: 'CPRO50',
    slabThickness: 200,
    bracketCentres: 350,
    edgeDistances: { top: 75, bottom: 125 },
    maxForces: { tension: 14.75, shear: 11.90 }
  });

  addChannelSpec({
    id: 'CPRO50_200_400',
    channelType: 'CPRO50',
    slabThickness: 200,
    bracketCentres: 400,
    edgeDistances: { top: 75, bottom: 125 },
    maxForces: { tension: 14.75, shear: 13.50 }
  });

  addChannelSpec({
    id: 'CPRO50_200_450',
    channelType: 'CPRO50',
    slabThickness: 200,
    bracketCentres: 450,
    edgeDistances: { top: 75, bottom: 125 },
    maxForces: { tension: 14.75, shear: 15.00 }
  });

  addChannelSpec({
    id: 'CPRO50_200_500',
    channelType: 'CPRO50',
    slabThickness: 200,
    bracketCentres: 500,
    edgeDistances: { top: 75, bottom: 125 },
    maxForces: { tension: 14.75, shear: 16.50 }
  });

  // CPRO50 - 225mm slab thickness
  addChannelSpec({
    id: 'CPRO50_225_200',
    channelType: 'CPRO50',
    slabThickness: 225,
    bracketCentres: 200,
    edgeDistances: { top: 75, bottom: 150 },
    maxForces: { tension: 9.60, shear: 8.60 }
  });

  addChannelSpec({
    id: 'CPRO50_225_250',
    channelType: 'CPRO50',
    slabThickness: 225,
    bracketCentres: 250,
    edgeDistances: { top: 75, bottom: 150 },
    maxForces: { tension: 11.55, shear: 9.70 }
  });

  addChannelSpec({
    id: 'CPRO50_225_300',
    channelType: 'CPRO50',
    slabThickness: 225,
    bracketCentres: 300,
    edgeDistances: { top: 75, bottom: 150 },
    maxForces: { tension: 13.35, shear: 11.55 }
  });

  addChannelSpec({
    id: 'CPRO50_225_350',
    channelType: 'CPRO50',
    slabThickness: 225,
    bracketCentres: 350,
    edgeDistances: { top: 75, bottom: 150 },
    maxForces: { tension: 14.75, shear: 13.20 }
  });

  addChannelSpec({
    id: 'CPRO50_225_400',
    channelType: 'CPRO50',
    slabThickness: 225,
    bracketCentres: 400,
    edgeDistances: { top: 75, bottom: 150 },
    maxForces: { tension: 14.75, shear: 15.00 }
  });

  addChannelSpec({
    id: 'CPRO50_225_450',
    channelType: 'CPRO50',
    slabThickness: 225,
    bracketCentres: 450,
    edgeDistances: { top: 75, bottom: 150 },
    maxForces: { tension: 14.75, shear: 16.60 }
  });

  addChannelSpec({
    id: 'CPRO50_225_500',
    channelType: 'CPRO50',
    slabThickness: 225,
    bracketCentres: 500,
    edgeDistances: { top: 75, bottom: 150 },
    maxForces: { tension: 14.75, shear: 16.60 }
  });

  // CPRO50 - 250mm slab thickness
  addChannelSpec({
    id: 'CPRO50_250_200',
    channelType: 'CPRO50',
    slabThickness: 250,
    bracketCentres: 200,
    edgeDistances: { top: 75, bottom: 175 },
    maxForces: { tension: 9.60, shear: 9.90 }
  });

  addChannelSpec({
    id: 'CPRO50_250_250',
    channelType: 'CPRO50',
    slabThickness: 250,
    bracketCentres: 250,
    edgeDistances: { top: 75, bottom: 175 },
    maxForces: { tension: 11.55, shear: 10.90 }
  });

  addChannelSpec({
    id: 'CPRO50_250_300',
    channelType: 'CPRO50',
    slabThickness: 250,
    bracketCentres: 300,
    edgeDistances: { top: 75, bottom: 175 },
    maxForces: { tension: 13.35, shear: 12.60 }
  });

  addChannelSpec({
    id: 'CPRO50_250_350',
    channelType: 'CPRO50',
    slabThickness: 250,
    bracketCentres: 350,
    edgeDistances: { top: 75, bottom: 175 },
    maxForces: { tension: 14.75, shear: 14.60 }
  });

  addChannelSpec({
    id: 'CPRO50_250_400',
    channelType: 'CPRO50',
    slabThickness: 250,
    bracketCentres: 400,
    edgeDistances: { top: 75, bottom: 175 },
    maxForces: { tension: 14.75, shear: 16.40 }
  });

  addChannelSpec({
    id: 'CPRO50_250_450',
    channelType: 'CPRO50',
    slabThickness: 250,
    bracketCentres: 450,
    edgeDistances: { top: 75, bottom: 175 },
    maxForces: { tension: 14.75, shear: 16.60 }
  });

  addChannelSpec({
    id: 'CPRO50_250_500',
    channelType: 'CPRO50',
    slabThickness: 250,
    bracketCentres: 500,
    edgeDistances: { top: 75, bottom: 175 },
    maxForces: { tension: 14.75, shear: 16.60 }
  });
}

/**
 * Initialize specifications from CSV data
 * @param csvContent CSV content to parse and load
 * @returns Object containing loaded specs count and any errors/warnings
 */
export function initializeSpecsFromCsv(csvContent: string): {
  specsLoaded: number;
  errors: string[];
  warnings: string[];
} {
  // Clear existing specs
  CHANNEL_SPECS.clear();

  // Parse CSV data
  const parseResult = parseCsvToChannelSpecs(csvContent);

  // Add all successfully parsed specs
  parseResult.specs.forEach(spec => {
    CHANNEL_SPECS.set(spec.id, spec);
  });

  return {
    specsLoaded: parseResult.specs.length,
    errors: parseResult.errors,
    warnings: parseResult.warnings
  };
}

/**
 * Configuration flag to determine initialization method
 * Set to true to use CSV data, false for hardcoded legacy data
 */
const USE_CSV_DATA = true;

/**
 * Initialize all channel specifications
 */
function initializeAllSpecs(): void {
  if (USE_CSV_DATA) {
    // Initialize from CSV data (includes all 4 channel types with utilization factors)
    const result = initializeSpecsFromCsv(CSV_CHANNEL_DATA);
    console.log(`Channel specs initialized from CSV: ${result.specsLoaded} specifications loaded`);
    if (result.errors.length > 0) {
      console.error('CSV parsing errors:', result.errors);
    }
    if (result.warnings.length > 0) {
      console.warn('CSV parsing warnings:', result.warnings);
    }
  } else {
    // Initialize from hardcoded data (legacy - CPRO38 and CPRO50 only)
    initializeSpecs();
    console.log('Channel specs initialized from hardcoded data (legacy mode)');
  }
}

// Initialize the specifications when this module is imported
initializeAllSpecs(); 
