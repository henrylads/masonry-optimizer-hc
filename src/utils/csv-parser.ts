import { z } from 'zod';
import type { ChannelSpec, ChannelType } from '@/types/channelSpecs';
import type { SlabThickness, BracketCentres } from '@/types/validationTypes';

/**
 * Zod schema for validating ChannelType values
 */
const ChannelTypeSchema = z.enum(['CPRO38', 'CPRO50', 'CPRO52', 'R-HPTIII-70', 'R-HPTIII-90']);

/**
 * Zod schema for validating parsed ChannelSpec objects
 */
export const ChannelSpecSchema = z.object({
  id: z.string().min(1, 'Channel spec ID is required'),
  channelType: ChannelTypeSchema,
  slabThickness: z.number().positive('Slab thickness must be positive'),
  bracketCentres: z.number().positive('Bracket centres must be positive'),
  edgeDistances: z.object({
    top: z.number().positive('Top edge distance must be positive'),
    bottom: z.number().positive('Bottom edge distance must be positive')
  }),
  maxForces: z.object({
    tension: z.number().positive('Tension force must be positive'),
    shear: z.number().positive('Shear force must be positive')
  }),
  utilizationFactors: z.object({
    tension: z.number().min(0).max(1000), // Allow up to 1000% for high utilization cases
    shear: z.number().min(0).max(1000),
    combined: z.number().min(0).max(1000)
  }).optional()
});

/**
 * Zod schema for validating raw CSV row data
 */
const CsvRowSchema = z.object({
  channelDescription: z.string(),
  slabThickness: z.string(),
  topEdgeDistance: z.string(),
  bottomEdgeDistance: z.string(),
  spacing: z.string(),
  tensionForce: z.string(),
  tensionUF: z.string(),
  shearForce: z.string(),
  shearUF: z.string(),
  combinedUF: z.string()
});

/**
 * Represents a raw CSV row as parsed from the CSV file
 */
type CsvRow = z.infer<typeof CsvRowSchema>;

/**
 * Represents the parsing state for handling empty cells that inherit from previous rows
 */
interface ParseState {
  currentChannelType: ChannelType | null;
  currentSlabThickness: number | null;
  currentTopEdgeDistance: number | null;
  currentBottomEdgeDistance: number | null;
}

/**
 * Maps CSV channel descriptions to standardized ChannelType values
 */
function extractChannelType(description: string): ChannelType | null {
  if (description.includes('CPRO38')) return 'CPRO38';
  if (description.includes('CPRO50')) return 'CPRO50';
  if (description.includes('CPRO52')) return 'CPRO52';
  if (description.includes('HPTIII-70mm') || (description.includes('R-HPTIII') && description.includes('70mm'))) return 'R-HPTIII-70';
  if (description.includes('HPTIII-90mm') || (description.includes('R-HPTIII') && description.includes('90mm'))) return 'R-HPTIII-90';
  return null;
}

/**
 * Safely parses a numeric value from a CSV cell, handling empty strings
 */
function parseNumericValue(value: string): number | null {
  if (!value || value.trim() === '') return null;
  const parsed = parseFloat(value.replace('%', ''));
  return isNaN(parsed) ? null : parsed;
}

/**
 * Result type for CSV parsing operations
 */
export interface ParseResult {
  specs: ChannelSpec[];
  errors: string[];
  warnings: string[];
}

/**
 * Parses a CSV string and converts it to ChannelSpec objects
 * @param csvContent The raw CSV content as a string
 * @returns ParseResult containing specs, errors, and warnings
 */
export function parseCsvToChannelSpecs(csvContent: string): ParseResult {
  const lines = csvContent.split('\n');
  const specs: ChannelSpec[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];
  const state: ParseState = {
    currentChannelType: null,
    currentSlabThickness: null,
    currentTopEdgeDistance: null,
    currentBottomEdgeDistance: null
  };

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex].trim();
    if (!line) continue; // Skip empty lines

    try {
      // Parse CSV line (simple comma splitting - assumes no commas in quoted strings)
      const cells = line.split(',').map(cell => cell.trim().replace(/^"/, '').replace(/"$/, ''));

      if (cells.length < 10) {
        warnings.push(`Line ${lineIndex + 1}: Insufficient columns (${cells.length}/10), skipping`);
        continue;
      }

      const csvRow: CsvRow = {
        channelDescription: cells[0] || '',
        slabThickness: cells[1] || '',
        topEdgeDistance: cells[2] || '',
        bottomEdgeDistance: cells[3] || '',
        spacing: cells[4] || '',
        tensionForce: cells[5] || '',
        tensionUF: cells[6] || '',
        shearForce: cells[7] || '',
        shearUF: cells[8] || '',
        combinedUF: cells[9] || ''
      };

      // Validate CSV row structure
      const csvRowValidation = CsvRowSchema.safeParse(csvRow);
      if (!csvRowValidation.success) {
        errors.push(`Line ${lineIndex + 1}: Invalid CSV row structure - ${csvRowValidation.error.message}`);
        continue;
      }

      // Check if this is a header row (contains channel description)
      if (csvRow.channelDescription && csvRow.channelDescription !== '') {
        const channelType = extractChannelType(csvRow.channelDescription);
        if (channelType) {
          state.currentChannelType = channelType;
          // Reset other state values when we encounter a new channel type
          state.currentSlabThickness = null;
          state.currentTopEdgeDistance = null;
          state.currentBottomEdgeDistance = null;
          continue; // Header rows don't contain data, skip to next line
        }
      }

      // Skip if we haven't found a valid channel type yet
      if (!state.currentChannelType) {
        warnings.push(`Line ${lineIndex + 1}: No valid channel type found, skipping data row`);
        continue;
      }

      // Parse or inherit slab thickness
      if (csvRow.slabThickness !== '') {
        state.currentSlabThickness = parseNumericValue(csvRow.slabThickness);
      }
      if (!state.currentSlabThickness) {
        warnings.push(`Line ${lineIndex + 1}: No valid slab thickness found, skipping`);
        continue;
      }

      // Parse or inherit edge distances
      if (csvRow.topEdgeDistance !== '') {
        state.currentTopEdgeDistance = parseNumericValue(csvRow.topEdgeDistance);
      }
      if (csvRow.bottomEdgeDistance !== '') {
        state.currentBottomEdgeDistance = parseNumericValue(csvRow.bottomEdgeDistance);
      }
      if (!state.currentTopEdgeDistance || !state.currentBottomEdgeDistance) {
        warnings.push(`Line ${lineIndex + 1}: Missing edge distances, skipping`);
        continue;
      }

      // Parse spacing - this should always be present in data rows
      const spacing = parseNumericValue(csvRow.spacing);
      if (!spacing) {
        warnings.push(`Line ${lineIndex + 1}: Invalid spacing value '${csvRow.spacing}', skipping`);
        continue;
      }

      // Parse forces
      const tensionForce = parseNumericValue(csvRow.tensionForce);
      const shearForce = parseNumericValue(csvRow.shearForce);
      if (!tensionForce || !shearForce) {
        warnings.push(`Line ${lineIndex + 1}: Invalid force values (tension: '${csvRow.tensionForce}', shear: '${csvRow.shearForce}'), skipping`);
        continue;
      }

      // Parse utilization factors (optional)
      const tensionUF = parseNumericValue(csvRow.tensionUF);
      const shearUF = parseNumericValue(csvRow.shearUF);
      const combinedUF = parseNumericValue(csvRow.combinedUF);

      // Create the ChannelSpec object
      const spec: ChannelSpec = {
        id: `${state.currentChannelType}_${state.currentSlabThickness}_${spacing}`,
        channelType: state.currentChannelType,
        slabThickness: state.currentSlabThickness as SlabThickness,
        bracketCentres: spacing as BracketCentres,
        edgeDistances: {
          top: state.currentTopEdgeDistance,
          bottom: state.currentBottomEdgeDistance
        },
        maxForces: {
          tension: tensionForce,
          shear: shearForce
        }
      };

      // Add utilization factors if all three are present
      if (tensionUF !== null && shearUF !== null && combinedUF !== null) {
        spec.utilizationFactors = {
          tension: tensionUF,
          shear: shearUF,
          combined: combinedUF
        };
      }

      // Validate the spec using Zod
      const specValidation = ChannelSpecSchema.safeParse(spec);
      if (!specValidation.success) {
        errors.push(`Line ${lineIndex + 1}: Generated spec validation failed - ${specValidation.error.message}`);
        continue;
      }

      specs.push(spec);
    } catch (error) {
      errors.push(`Line ${lineIndex + 1}: Parsing error - ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return {
    specs,
    errors,
    warnings
  };
}

/**
 * Loads and parses channel specifications from a CSV file
 * @param _csvFilePath Path to the CSV file to load (unused in browser environment)
 * @returns Promise resolving to array of ChannelSpec objects
 */
export async function loadChannelSpecsFromCsv(_csvFilePath: string): Promise<ChannelSpec[]> {
  try {
    // In a browser environment, we'd need to use fetch or FileReader
    // For now, this is a placeholder for the async interface
    throw new Error('File system access not implemented in browser environment');
  } catch (error) {
    throw new Error(`Failed to load CSV file: ${error}`);
  }
}

/**
 * Validates that required fields are present in a ChannelSpec using Zod schema
 * @param spec The ChannelSpec to validate
 * @returns Array of validation error messages, empty if valid
 */
export function validateChannelSpec(spec: ChannelSpec): string[] {
  const validation = ChannelSpecSchema.safeParse(spec);

  if (validation.success) {
    return [];
  }

  return validation.error.errors.map(err =>
    `${err.path.join('.')}: ${err.message}`
  );
}