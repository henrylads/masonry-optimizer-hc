import type { ChannelType } from '@/types/channelSpecs';

/**
 * Utility functions for working with different channel types
 */

/**
 * Checks if a channel type is an R-HPTIII variant
 * @param channelType - The channel type to check
 * @returns True if the channel type is R-HPTIII-70 or R-HPTIII-90
 */
export function isRHPTIIIChannel(channelType: string): boolean {
  return channelType === 'R-HPTIII-70' || channelType === 'R-HPTIII-90';
}

/**
 * Checks if a channel type is a CPRO variant
 * @param channelType - The channel type to check
 * @returns True if the channel type is CPRO38 or CPRO50
 */
export function isCPROChannel(channelType: string): boolean {
  return channelType === 'CPRO38' || channelType === 'CPRO50';
}

/**
 * Gets the embedment depth for R-HPTIII channels
 * @param channelType - The R-HPTIII channel type
 * @returns Embedment depth in mm, or null if not an R-HPTIII channel
 */
export function getRHPTIIIEmbedmentDepth(channelType: string): number | null {
  switch (channelType) {
    case 'R-HPTIII-70':
      return 70;
    case 'R-HPTIII-90':
      return 90;
    default:
      return null;
  }
}

/**
 * Gets the product family name for display purposes
 * @param channelType - The channel type
 * @returns Human-readable product family name
 */
export function getProductFamilyName(channelType: string): string {
  if (isRHPTIIIChannel(channelType)) {
    const embedment = getRHPTIIIEmbedmentDepth(channelType);
    return `R-HPTIII A4 M12 (${embedment}mm embedment)`;
  }
  if (isCPROChannel(channelType)) {
    return `${channelType} - MOSOCON`;
  }
  return channelType;
}

/**
 * Product characteristics for different channel types
 */
export interface ProductCharacteristics {
  hasHighUtilization: boolean;
  utilizationWarning: string | null;
  designStandard: string;
  specialNotes: string[];
}

/**
 * Gets product characteristics for a given channel type
 * @param channelType - The channel type to analyze
 * @returns Product characteristics including warnings and notes
 */
export function getProductCharacteristics(channelType: string): ProductCharacteristics {
  if (isRHPTIIIChannel(channelType)) {
    return {
      hasHighUtilization: true,
      utilizationWarning: 'R-HPTIII products show 200% combined utilization factors. Please verify design requirements with structural engineer.',
      designStandard: 'R-HPTIII A4 M12 Standard',
      specialNotes: [
        '200% combined utilization factor may indicate special design methodology',
        'Embedment depth affects capacity characteristics',
        'Requires C32 concrete grade or higher',
        'Special consideration required for seismic design'
      ]
    };
  }

  if (isCPROChannel(channelType)) {
    return {
      hasHighUtilization: false,
      utilizationWarning: null,
      designStandard: 'CPRO - MOSOCON Standard',
      specialNotes: [
        'Standard masonry support channel',
        'Well-established design methodology',
        'Variable utilization factors based on load conditions'
      ]
    };
  }

  // Unknown channel type
  return {
    hasHighUtilization: false,
    utilizationWarning: 'Unknown channel type - please verify specifications',
    designStandard: 'Unknown',
    specialNotes: ['Channel type not recognized in current system']
  };
}

/**
 * Determines if additional engineering review is recommended
 * @param channelType - The channel type
 * @returns True if engineering review is recommended
 */
export function requiresEngineeringReview(channelType: string): boolean {
  return isRHPTIIIChannel(channelType);
}

/**
 * Gets capacity comparison information between channel types
 * @param channelType - The channel type to compare
 * @returns Comparison notes
 */
export function getCapacityComparison(channelType: string): string[] {
  const notes: string[] = [];

  if (channelType === 'R-HPTIII-90') {
    notes.push('Higher tension capacity compared to R-HPTIII-70 due to increased embedment depth');
    notes.push('Generally higher capacity than CPRO products in tension applications');
  } else if (channelType === 'R-HPTIII-70') {
    notes.push('Lower embedment depth than R-HPTIII-90 but still high capacity');
    notes.push('Generally higher capacity than CPRO products in tension applications');
  } else if (channelType === 'CPRO50') {
    notes.push('Higher capacity than CPRO38 in most applications');
    notes.push('Lower capacity than R-HPTIII products in high-load scenarios');
  } else if (channelType === 'CPRO38') {
    notes.push('Most economical option for standard applications');
    notes.push('Lower capacity than other channel types but suitable for most standard loads');
  }

  return notes;
}