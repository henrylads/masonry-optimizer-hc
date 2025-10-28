import {
  isRHPTIIIChannel,
  isCPROChannel,
  getRHPTIIIEmbedmentDepth,
  getProductFamilyName,
  getProductCharacteristics,
  requiresEngineeringReview,
  getCapacityComparison
} from '@/utils/channelTypeHelpers';

describe('Channel Type Helpers', () => {
  describe('isRHPTIIIChannel', () => {
    test('should identify R-HPTIII-70 as R-HPTIII channel', () => {
      expect(isRHPTIIIChannel('R-HPTIII-70')).toBe(true);
    });

    test('should identify R-HPTIII-90 as R-HPTIII channel', () => {
      expect(isRHPTIIIChannel('R-HPTIII-90')).toBe(true);
    });

    test('should not identify CPRO products as R-HPTIII', () => {
      expect(isRHPTIIIChannel('CPRO38')).toBe(false);
      expect(isRHPTIIIChannel('CPRO50')).toBe(false);
    });

    test('should not identify unknown channels as R-HPTIII', () => {
      expect(isRHPTIIIChannel('UNKNOWN')).toBe(false);
    });
  });

  describe('isCPROChannel', () => {
    test('should identify CPRO38 as CPRO channel', () => {
      expect(isCPROChannel('CPRO38')).toBe(true);
    });

    test('should identify CPRO50 as CPRO channel', () => {
      expect(isCPROChannel('CPRO50')).toBe(true);
    });

    test('should not identify R-HPTIII products as CPRO', () => {
      expect(isCPROChannel('R-HPTIII-70')).toBe(false);
      expect(isCPROChannel('R-HPTIII-90')).toBe(false);
    });
  });

  describe('getRHPTIIIEmbedmentDepth', () => {
    test('should return 70 for R-HPTIII-70', () => {
      expect(getRHPTIIIEmbedmentDepth('R-HPTIII-70')).toBe(70);
    });

    test('should return 90 for R-HPTIII-90', () => {
      expect(getRHPTIIIEmbedmentDepth('R-HPTIII-90')).toBe(90);
    });

    test('should return null for non-R-HPTIII channels', () => {
      expect(getRHPTIIIEmbedmentDepth('CPRO38')).toBe(null);
      expect(getRHPTIIIEmbedmentDepth('CPRO50')).toBe(null);
      expect(getRHPTIIIEmbedmentDepth('UNKNOWN')).toBe(null);
    });
  });

  describe('getProductFamilyName', () => {
    test('should return formatted names for R-HPTIII products', () => {
      expect(getProductFamilyName('R-HPTIII-70')).toBe('R-HPTIII A4 M12 (70mm embedment)');
      expect(getProductFamilyName('R-HPTIII-90')).toBe('R-HPTIII A4 M12 (90mm embedment)');
    });

    test('should return formatted names for CPRO products', () => {
      expect(getProductFamilyName('CPRO38')).toBe('CPRO38 - MOSOCON');
      expect(getProductFamilyName('CPRO50')).toBe('CPRO50 - MOSOCON');
    });

    test('should return original name for unknown products', () => {
      expect(getProductFamilyName('UNKNOWN')).toBe('UNKNOWN');
    });
  });

  describe('getProductCharacteristics', () => {
    test('should return high utilization characteristics for R-HPTIII products', () => {
      const r70Characteristics = getProductCharacteristics('R-HPTIII-70');

      expect(r70Characteristics.hasHighUtilization).toBe(true);
      expect(r70Characteristics.utilizationWarning).toContain('200%');
      expect(r70Characteristics.designStandard).toBe('R-HPTIII A4 M12 Standard');
      expect(r70Characteristics.specialNotes).toContain('200% combined utilization factor may indicate special design methodology');
    });

    test('should return standard characteristics for CPRO products', () => {
      const cpro38Characteristics = getProductCharacteristics('CPRO38');

      expect(cpro38Characteristics.hasHighUtilization).toBe(false);
      expect(cpro38Characteristics.utilizationWarning).toBe(null);
      expect(cpro38Characteristics.designStandard).toBe('CPRO - MOSOCON Standard');
      expect(cpro38Characteristics.specialNotes).toContain('Standard masonry support channel');
    });

    test('should handle unknown channel types', () => {
      const unknownCharacteristics = getProductCharacteristics('UNKNOWN');

      expect(unknownCharacteristics.hasHighUtilization).toBe(false);
      expect(unknownCharacteristics.utilizationWarning).toContain('Unknown channel type');
      expect(unknownCharacteristics.designStandard).toBe('Unknown');
    });
  });

  describe('requiresEngineeringReview', () => {
    test('should require review for R-HPTIII products', () => {
      expect(requiresEngineeringReview('R-HPTIII-70')).toBe(true);
      expect(requiresEngineeringReview('R-HPTIII-90')).toBe(true);
    });

    test('should not require review for CPRO products', () => {
      expect(requiresEngineeringReview('CPRO38')).toBe(false);
      expect(requiresEngineeringReview('CPRO50')).toBe(false);
    });

    test('should not require review for unknown products', () => {
      expect(requiresEngineeringReview('UNKNOWN')).toBe(false);
    });
  });

  describe('getCapacityComparison', () => {
    test('should provide capacity comparison for R-HPTIII-90', () => {
      const comparison = getCapacityComparison('R-HPTIII-90');

      expect(comparison).toContain('Higher tension capacity compared to R-HPTIII-70 due to increased embedment depth');
      expect(comparison).toContain('Generally higher capacity than CPRO products in tension applications');
    });

    test('should provide capacity comparison for R-HPTIII-70', () => {
      const comparison = getCapacityComparison('R-HPTIII-70');

      expect(comparison).toContain('Lower embedment depth than R-HPTIII-90 but still high capacity');
      expect(comparison).toContain('Generally higher capacity than CPRO products in tension applications');
    });

    test('should provide capacity comparison for CPRO50', () => {
      const comparison = getCapacityComparison('CPRO50');

      expect(comparison).toContain('Higher capacity than CPRO38 in most applications');
      expect(comparison).toContain('Lower capacity than R-HPTIII products in high-load scenarios');
    });

    test('should provide capacity comparison for CPRO38', () => {
      const comparison = getCapacityComparison('CPRO38');

      expect(comparison).toContain('Most economical option for standard applications');
      expect(comparison).toContain('Lower capacity than other channel types but suitable for most standard loads');
    });

    test('should return empty array for unknown channel types', () => {
      const comparison = getCapacityComparison('UNKNOWN');
      expect(comparison).toEqual([]);
    });
  });
});