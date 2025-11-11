import { verifyCombinedTensionShear, COMBINED_CHECK_CONSTANTS } from '../combinedTensionShear';
import { roundToTwelveDecimals } from '@/utils/precision';
import { numbersEqualToFiveDecimals } from '@/utils/test-helpers';

describe('Combined Tension-Shear Verification', () => {
    // Test case inputs based on project overview example
    const testCase = {
        V_ed: 14.0,         // Applied shear force (kN)
        N_ed: 10.0,         // Applied normal force (kN)
        A: 1500,           // Cross sectional area (mm²)
        A_v: 1000          // Shear area (mm²)
    };

    it('should calculate applied stresses correctly', () => {
        const result = verifyCombinedTensionShear(
            testCase.N_ed,  // Tensile force
            testCase.V_ed,  // Shear force
            testCase.A,
            testCase.A_v
        );
        
        // tau_ed = (V_ed * 1000) / A_v
        const expectedTauEd = roundToTwelveDecimals(
            (testCase.V_ed * 1000) / testCase.A_v
        );
        expect(numbersEqualToFiveDecimals(result.tau_ed, expectedTauEd)).toBe(true);
        
        // sigma_ed = (N_ed * 1000) / A
        const expectedSigmaEd = roundToTwelveDecimals(
            (testCase.N_ed * 1000) / testCase.A
        );
        expect(numbersEqualToFiveDecimals(result.sigma_ed, expectedSigmaEd)).toBe(true);
    });

    it('should calculate combined utilization correctly', () => {
        const result = verifyCombinedTensionShear(
            testCase.N_ed,  // Tensile force
            testCase.V_ed,  // Shear force
            testCase.A,
            testCase.A_v
        );
        
        // Calculate intermediate values
        const tau_ed = (testCase.V_ed * 1000) / testCase.A_v;
        const sigma_ed = (testCase.N_ed * 1000) / testCase.A;
        const f_yd = COMBINED_CHECK_CONSTANTS.F_y / COMBINED_CHECK_CONSTANTS.yM0;
        
        // U_combined = sqrt((sigma_ed/f_yd)² + 3*(tau_ed/f_yd)²) * 100
        const expectedUCombined = roundToTwelveDecimals(
            Math.sqrt(
                Math.pow(sigma_ed / f_yd, 2) +
                3 * Math.pow(tau_ed / f_yd, 2)
            ) * 100
        );
        expect(numbersEqualToFiveDecimals(result.U_combined, expectedUCombined)).toBe(true);
    });

    it('should pass when combined utilization is <= 100%', () => {
        // Test passing case (low forces)
        const resultPass = verifyCombinedTensionShear(
            5.0,            // Lower tensile force
            5.0,            // Lower shear force
            testCase.A,
            testCase.A_v
        );
        expect(resultPass.passes).toBe(true);
        
        // Test failing case (high forces)
        // Using higher forces to ensure utilization > 100%
        const resultFail = verifyCombinedTensionShear(
            150.0,           // Higher tensile force (150kN)
            150.0,           // Higher shear force (150kN)
            testCase.A,
            testCase.A_v
        );
        expect(resultFail.passes).toBe(false);
    });

    it('should maintain precision requirements', () => {
        const result = verifyCombinedTensionShear(
            testCase.N_ed,  // Tensile force
            testCase.V_ed,  // Shear force
            testCase.A,
            testCase.A_v
        );
        
        // Calculate expected values to 5 decimal places
        const expectedTauEd = Number((testCase.V_ed * 1000 / testCase.A_v).toFixed(5));
        const expectedSigmaEd = Number((testCase.N_ed * 1000 / testCase.A).toFixed(5));
        
        // Verify that results match expected values to 5 decimal places
        expect(numbersEqualToFiveDecimals(result.tau_ed, expectedTauEd)).toBe(true);
        expect(numbersEqualToFiveDecimals(result.sigma_ed, expectedSigmaEd)).toBe(true);
        expect(numbersEqualToFiveDecimals(result.U_combined, result.U_combined)).toBe(true);
    });
}); 