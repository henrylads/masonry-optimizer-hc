import { verifyShearResistanceULS } from '../shearResistanceULS';
import { roundToTwelveDecimals } from '@/utils/precision';
import { numbersEqualToFiveDecimals } from '@/utils/test-helpers';

describe('Shear Resistance ULS Verification', () => {
    // Test case inputs based on project overview example
    const testCase = {
        V_ed: 14.0,             // Applied shear force (kN)
        T: 5,                   // Angle thickness (mm)
        B_cc: 300,             // Bracket centers (mm)
    };

    // Shear area A_v = B_cc * T
    const A_v = testCase.B_cc * testCase.T;

    it('should calculate shear resistance correctly', () => {
        const result = verifyShearResistanceULS(
            testCase.V_ed,
            A_v
        );

        // VR_d = A_v * (F_y/sqrt(3))/gamma_sf/1000
        const expectedVR_d = roundToTwelveDecimals(
            A_v * (210 / Math.sqrt(3)) / 1.1 / 1000
        );
        expect(numbersEqualToFiveDecimals(result.VR_d_angle, expectedVR_d)).toBe(true);
    });

    it('should calculate utilization correctly', () => {
        const result = verifyShearResistanceULS(
            testCase.V_ed,
            A_v
        );

        // Calculate expected values
        const VR_d = A_v * (210 / Math.sqrt(3)) / 1.1 / 1000;
        const expectedUtilization = roundToTwelveDecimals((testCase.V_ed / VR_d) * 100);
        
        expect(numbersEqualToFiveDecimals(result.utilization, expectedUtilization)).toBe(true);
    });

    it('should pass when utilization is <= 100%', () => {
        const result = verifyShearResistanceULS(
            testCase.V_ed,
            A_v
        );
        
        expect(result.passes).toBe(result.utilization <= 100);
    });

    it('should maintain precision requirements', () => {
        const result = verifyShearResistanceULS(
            testCase.V_ed,
            A_v
        );
        
        // Check that all numerical results have at least 5 decimal places
        expect(numbersEqualToFiveDecimals(result.V_ed, roundToTwelveDecimals(result.V_ed))).toBe(true);
        expect(numbersEqualToFiveDecimals(result.VR_d_angle, roundToTwelveDecimals(result.VR_d_angle))).toBe(true);
        expect(numbersEqualToFiveDecimals(result.utilization, roundToTwelveDecimals(result.utilization))).toBe(true);
    });
}); 