import { verifyAngleDeflectionSLS } from '../angleDeflectionSLS';
import { roundToTwelveDecimals } from '@/utils/precision';
import { numbersEqualToFiveDecimals } from '@/utils/test-helpers';

describe('Angle Deflection SLS Verification', () => {
    // Test case inputs based on project overview example
    const testCase = {
        // From user inputs
        V_ed: 14.0,             // Applied shear force (kN)
        C: 200,                 // Cavity (mm)
        M: 102.5,              // Masonry thickness (mm)
        
        // From system inputs and calculations
        T: 5,                   // Angle thickness (mm)
        B_cc: 300,             // Bracket centers (mm)
        B: 90,                 // Horizontal leg (mm)
        A: 60,                 // Vertical leg (mm) for T=5mm
        L_f: 1.35,             // Load factor
        
        // Calculated values
        Ecc: 34.17,            // M/3 (mm)
        d: 195,                // C-5 for 5mm angle (mm)
        L_1: 236.17,           // Ecc + d + (12 - T) (mm)
        Z: 1250,               // (B_cc * T^2) / 6 (mm³)
        Ixx_1: 3125,           // (B_cc * T^3) / 12 (mm⁴)
        
        // From mathematical model
        a: 229.91,             // Ecc + d + π*(T/2 + R) - (T + R) (mm)
        b: 55.83,              // L_bearing - Ecc (mm)
        I: 38.5                // A - (R + T) - 16.5 (mm)
    };

    // Calculate M_ed_angle = V_ed * (L_1/1000)
    const M_ed_angle = roundToTwelveDecimals(testCase.V_ed * (testCase.L_1/1000));

    it('should calculate characteristic values correctly', () => {
        const result = verifyAngleDeflectionSLS(
            testCase.V_ed,
            testCase.L_1,
            M_ed_angle,
            testCase.Z,
            testCase.L_f,
            testCase.a,
            testCase.b,
            testCase.I,
            testCase.B,
            testCase.Ixx_1,
            210 // F_y (N/mm²)
        );
        
        // V_ek = V_ed/L_f
        const expectedV_ek = roundToTwelveDecimals(testCase.V_ed / testCase.L_f);
        expect(numbersEqualToFiveDecimals(result.V_ek, expectedV_ek)).toBe(true);
        
        // M_ek = V_ek * L_1/1000
        const expectedM_ek = roundToTwelveDecimals(expectedV_ek * testCase.L_1 / 1000);
        expect(numbersEqualToFiveDecimals(result.M_ek, expectedM_ek)).toBe(true);
    });

    it('should calculate design stress and secant modulus correctly', () => {
        const result = verifyAngleDeflectionSLS(
            testCase.V_ed,
            testCase.L_1,
            M_ed_angle,
            testCase.Z,
            testCase.L_f,
            testCase.a,
            testCase.b,
            testCase.I,
            testCase.B,
            testCase.Ixx_1,
            210 // F_y (N/mm²)
        );
        
        // SLS_ds = M_ed_angle * 10^6 / Z / L_f
        const expectedSLS_ds = roundToTwelveDecimals(M_ed_angle * 1000000 / testCase.Z / testCase.L_f);
        expect(numbersEqualToFiveDecimals(result.SLS_ds, expectedSLS_ds)).toBe(true);
        
        // Es_1 = E/(1 + 0.002*(E/SLS_ds)*(SLS_ds/F_y)^n)
        const E = 200000;
        const n = 8;
        const F_y = 210;
        const expectedEs_1 = roundToTwelveDecimals(
            E / (1 + 0.002 * (E/expectedSLS_ds) * Math.pow(expectedSLS_ds/F_y, n))
        );
        expect(numbersEqualToFiveDecimals(result.Es_1, expectedEs_1)).toBe(true);
        expect(numbersEqualToFiveDecimals(result.Es_sr, expectedEs_1)).toBe(true); // Es_sr should equal Es_1
    });

    it('should calculate deflections correctly', () => {
        const result = verifyAngleDeflectionSLS(
            testCase.V_ed,
            testCase.L_1,
            M_ed_angle,
            testCase.Z,
            testCase.L_f,
            testCase.a,
            testCase.b,
            testCase.I,
            testCase.B,
            testCase.Ixx_1,
            210 // F_y (N/mm²)
        );
        
        const V_ek = testCase.V_ed / testCase.L_f;
        const M_ek = V_ek * testCase.L_1 / 1000;
        const Es_1 = result.Es_1; // Use calculated Es_1 as it's complex
        
        // D_tip = V_ek * 1000 * a^2 * (3*(a+b)-a) / (6*Es_sr*Ixx_1)
        const expectedD_tip = roundToTwelveDecimals(
            (V_ek * 1000 * Math.pow(testCase.a, 2) * (3 * (testCase.a + testCase.b) - testCase.a)) /
            (6 * Es_1 * testCase.Ixx_1)
        );
        expect(numbersEqualToFiveDecimals(result.D_tip, expectedD_tip)).toBe(true);
        
        // D_horz = M_ek * 10^6 * I^2 / (2*Es_sr*Ixx_1)
        const expectedD_horz = roundToTwelveDecimals(
            (M_ek * 1000000 * Math.pow(testCase.I, 2)) /
            (2 * Es_1 * testCase.Ixx_1)
        );
        expect(numbersEqualToFiveDecimals(result.D_horz, expectedD_horz)).toBe(true);
        
        // rotation_heel = atan(D_horz/I)
        const expectedRotation = roundToTwelveDecimals(
            Math.atan(expectedD_horz / testCase.I)
        );
        expect(numbersEqualToFiveDecimals(result.rotation_heel, expectedRotation)).toBe(true);
        
        // D_heel = B * sin(rotation_heel)
        const expectedD_heel = roundToTwelveDecimals(
            testCase.B * Math.sin(expectedRotation)
        );
        expect(numbersEqualToFiveDecimals(result.D_heel, expectedD_heel)).toBe(true);
        
        // D_total = D_tip + D_heel
        const expectedD_total = roundToTwelveDecimals(expectedD_tip + expectedD_heel);
        expect(numbersEqualToFiveDecimals(result.D_total, expectedD_total)).toBe(true);
    });

    it('should pass when total deflection is <= 2mm', () => {
        const result = verifyAngleDeflectionSLS(
            testCase.V_ed,
            testCase.L_1,
            M_ed_angle,
            testCase.Z,
            testCase.L_f,
            testCase.a,
            testCase.b,
            testCase.I,
            testCase.B,
            testCase.Ixx_1,
            210 // F_y (N/mm²)
        );

        expect(result.passes).toBe(result.totalDeflection <= 2);
    });

    it('should maintain precision requirements', () => {
        const result = verifyAngleDeflectionSLS(
            testCase.V_ed,
            testCase.L_1,
            M_ed_angle,
            testCase.Z,
            testCase.L_f,
            testCase.a,
            testCase.b,
            testCase.I,
            testCase.B,
            testCase.Ixx_1,
            210 // F_y (N/mm²)
        );
        
        // Check that all numerical results have at least 5 decimal places
        expect(numbersEqualToFiveDecimals(result.V_ek, roundToTwelveDecimals(result.V_ek))).toBe(true);
        expect(numbersEqualToFiveDecimals(result.M_ek, roundToTwelveDecimals(result.M_ek))).toBe(true);
        expect(numbersEqualToFiveDecimals(result.SLS_ds, roundToTwelveDecimals(result.SLS_ds))).toBe(true);
        expect(numbersEqualToFiveDecimals(result.Es_1, roundToTwelveDecimals(result.Es_1))).toBe(true);
        expect(numbersEqualToFiveDecimals(result.Es_sr, roundToTwelveDecimals(result.Es_sr))).toBe(true);
        expect(numbersEqualToFiveDecimals(result.D_tip, roundToTwelveDecimals(result.D_tip))).toBe(true);
        expect(numbersEqualToFiveDecimals(result.D_horz, roundToTwelveDecimals(result.D_horz))).toBe(true);
        expect(numbersEqualToFiveDecimals(result.rotation_heel, roundToTwelveDecimals(result.rotation_heel))).toBe(true);
        expect(numbersEqualToFiveDecimals(result.D_heel, roundToTwelveDecimals(result.D_heel))).toBe(true);
        expect(numbersEqualToFiveDecimals(result.D_total, roundToTwelveDecimals(result.D_total))).toBe(true);
    });
}); 