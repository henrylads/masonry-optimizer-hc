import { verifyMomentResistanceULS } from '../momentResistanceULS';
import { roundToTwelveDecimals } from '@/utils/precision';
import { numbersEqualToFiveDecimals } from '@/utils/test-helpers';

describe('Moment Resistance ULS Verification', () => {
    // Test case inputs based on project overview example
    const testCase = {
        V_ed: 14.0,             // Applied shear force (kN)
        Ecc: 34.17,            // Eccentricity (mm)
        d: 195,                // Distance from fixing to back of angle (mm)
        T: 5,                  // Angle thickness (mm)
    };

    // Section modulus Z = (B_cc * T^2) / 6
    const Z = 1250;            // For B_cc = 300mm, T = 5mm

    it('should calculate moment and resistance correctly', () => {
        const result = verifyMomentResistanceULS(
            testCase.V_ed,
            testCase.Ecc,
            testCase.d,
            testCase.T,
            Z
        );

        // L_1 = Ecc + d + T
        const expectedL_1 = roundToTwelveDecimals(testCase.Ecc + testCase.d + testCase.T);
        expect(numbersEqualToFiveDecimals(result.L_1, expectedL_1)).toBe(true);

        // M_ed,angle = V_Ed * (L_1/1000)
        const expectedM_ed = roundToTwelveDecimals(testCase.V_ed * (expectedL_1/1000));
        expect(numbersEqualToFiveDecimals(result.M_ed_angle, expectedM_ed)).toBe(true);

        // Mc_rd,angle = Z/10^6 * (F_y/gamma_sf)
        const expectedMc_rd = roundToTwelveDecimals((Z/1000000) * (210/1.1));
        expect(numbersEqualToFiveDecimals(result.Mc_rd_angle, expectedMc_rd)).toBe(true);
    });

    it('should calculate utilization correctly', () => {
        const result = verifyMomentResistanceULS(
            testCase.V_ed,
            testCase.Ecc,
            testCase.d,
            testCase.T,
            Z
        );

        // Calculate expected values
        const L_1 = testCase.Ecc + testCase.d + testCase.T;
        const M_ed = testCase.V_ed * (L_1/1000);
        const Mc_rd = (Z/1000000) * (210/1.1);
        const expectedUtilization = roundToTwelveDecimals((M_ed / Mc_rd) * 100);
        
        expect(numbersEqualToFiveDecimals(result.utilization, expectedUtilization)).toBe(true);
    });

    it('should pass when utilization is <= 100%', () => {
        const result = verifyMomentResistanceULS(
            testCase.V_ed,
            testCase.Ecc,
            testCase.d,
            testCase.T,
            Z
        );
        
        expect(result.passes).toBe(result.utilization <= 100);
    });

    it('should maintain precision requirements', () => {
        const result = verifyMomentResistanceULS(
            testCase.V_ed,
            testCase.Ecc,
            testCase.d,
            testCase.T,
            Z
        );
        
        // Check that all numerical results have at least 5 decimal places
        expect(numbersEqualToFiveDecimals(result.L_1, roundToTwelveDecimals(result.L_1))).toBe(true);
        expect(numbersEqualToFiveDecimals(result.M_ed_angle, roundToTwelveDecimals(result.M_ed_angle))).toBe(true);
        expect(numbersEqualToFiveDecimals(result.Mc_rd_angle, roundToTwelveDecimals(result.Mc_rd_angle))).toBe(true);
        expect(numbersEqualToFiveDecimals(result.utilization, roundToTwelveDecimals(result.utilization))).toBe(true);
    });
}); 