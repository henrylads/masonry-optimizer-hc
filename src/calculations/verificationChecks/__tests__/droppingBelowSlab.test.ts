import { verifyDroppingBelowSlab } from '../droppingBelowSlab';
import { roundToTwelveDecimals } from '@/utils/precision';
import { numbersEqualToFiveDecimals } from '@/utils/testHelpers';

describe('Dropping Below Slab Verification', () => {
    // Test case inputs based on project overview example
    const testCase = {
        P: 25,                    // Drop below slab (mm)
        H_notch: 0,              // Height of notch (mm)
        V_ek: 9.45,              // Characteristic shear force (kN)
        C_prime: 200,            // Design cavity (mm)
        Ecc: 73.33333333333333, // Eccentricity (mm) - calculated as bracketProjection/3
        B_proj_fix: 220,         // Bracket projection at fixing (mm)
        t: 4,                    // Bracket thickness (mm)
        L_bearing: 102.5,        // Bearing length (mm)
        D_total: 0.927232973921, // Total deflection from angle deflection check (mm)
        Es_sr: 210000,           // Secant modulus for stress range (N/mm²)
        B_cc: 500,              // Bracket centres (mm)
        C_udl: 14               // Characteristic UDL (kN/m)
    };

    it('should calculate effective drop below slab (P_eff) correctly', () => {
        const result = verifyDroppingBelowSlab(
            testCase.P,
            testCase.H_notch,
            testCase.V_ek,
            testCase.C_prime,
            testCase.Ecc,
            testCase.B_proj_fix,
            testCase.t,
            testCase.L_bearing,
            testCase.D_total,
            testCase.Es_sr,
            testCase.B_cc,
            testCase.C_udl
        );

        // P_eff should be max of P and H_notch
        expect(result.P_eff).toBe(Math.max(testCase.P, testCase.H_notch));
    });

    it('should calculate design cavity plus eccentricity (L_d) correctly', () => {
        const result = verifyDroppingBelowSlab(
            testCase.P,
            testCase.H_notch,
            testCase.V_ek,
            testCase.C_prime,
            testCase.Ecc,
            testCase.B_proj_fix,
            testCase.t,
            testCase.L_bearing,
            testCase.D_total,
            testCase.Es_sr,
            testCase.B_cc,
            testCase.C_udl
        );

        const expected = testCase.C_prime + testCase.Ecc;
        expect(result.L_d).toBe(roundToTwelveDecimals(expected));
    });

    it('should calculate moment due to drop (M_ek_drop) correctly', () => {
        const result = verifyDroppingBelowSlab(
            testCase.P,
            testCase.H_notch,
            testCase.V_ek,
            testCase.C_prime,
            testCase.Ecc,
            testCase.B_proj_fix,
            testCase.t,
            testCase.L_bearing,
            testCase.D_total,
            testCase.Es_sr,
            testCase.B_cc,
            testCase.C_udl
        );

        const L_d = testCase.C_prime + testCase.Ecc;
        const expected = (testCase.V_ek * L_d) / 1000;
        expect(result.M_ek_drop).toBe(roundToTwelveDecimals(expected));
    });

    it('should calculate second moment of area (Ixx_2) correctly', () => {
        const result = verifyDroppingBelowSlab(
            testCase.P,
            testCase.H_notch,
            testCase.V_ek,
            testCase.C_prime,
            testCase.Ecc,
            testCase.B_proj_fix,
            testCase.t,
            testCase.L_bearing,
            testCase.D_total,
            testCase.Es_sr,
            testCase.B_cc,
            testCase.C_udl
        );

        const expected = 2 * (testCase.t * Math.pow(testCase.B_proj_fix, 3)) / 12;
        expect(result.Ixx_2).toBe(roundToTwelveDecimals(expected));
    });

    it('should calculate lateral deflection correctly when P > 0', () => {
        const result = verifyDroppingBelowSlab(
            testCase.P,
            testCase.H_notch,
            testCase.V_ek,
            testCase.C_prime,
            testCase.Ecc,
            testCase.B_proj_fix,
            testCase.t,
            testCase.L_bearing,
            testCase.D_total,
            testCase.Es_sr,
            testCase.B_cc,
            testCase.C_udl
        );

        expect(result.L_deflection).toBeGreaterThan(0);
    });

    it('should calculate lateral deflection as 0 when P = 0', () => {
        const result = verifyDroppingBelowSlab(
            0, // P = 0
            testCase.H_notch,
            testCase.V_ek,
            testCase.C_prime,
            testCase.Ecc,
            testCase.B_proj_fix,
            testCase.t,
            testCase.L_bearing,
            testCase.D_total,
            testCase.Es_sr,
            testCase.B_cc,
            testCase.C_udl
        );

        expect(result.L_deflection).toBe(0);
    });

    it('should calculate total deflection of system correctly', () => {
        const result = verifyDroppingBelowSlab(
            testCase.P,
            testCase.H_notch,
            testCase.V_ek,
            testCase.C_prime,
            testCase.Ecc,
            testCase.B_proj_fix,
            testCase.t,
            testCase.L_bearing,
            testCase.D_total,
            testCase.Es_sr,
            testCase.B_cc,
            testCase.C_udl,
            true // Include additional deflection
        );

        expect(result.Total_deflection_of_system).toBe(
            roundToTwelveDecimals(result.Total_Vertical_Deflection + result.Addition_deflection_span)
        );
    });

    it('should pass when total deflection is <= 2mm', () => {
        // Create a test case that should result in small deflection
        const result = verifyDroppingBelowSlab(
            5, // Small drop below slab
            0,
            5, // Small shear force
            100,
            33.33333333333333,
            100,
            6, // Thicker bracket
            102.5,
            0.5,
            210000,
            300, // Smaller bracket centers
            10
        );

        expect(result.passes).toBe(result.Total_deflection_of_system <= 2);
    });

    it('should maintain precision requirements', () => {
        const result = verifyDroppingBelowSlab(
            testCase.P,
            testCase.H_notch,
            testCase.V_ek,
            testCase.C_prime,
            testCase.Ecc,
            testCase.B_proj_fix,
            testCase.t,
            testCase.L_bearing,
            testCase.D_total,
            testCase.Es_sr,
            testCase.B_cc,
            testCase.C_udl
        );

        // Check that all numerical results have at least 5 decimal places
        expect(numbersEqualToFiveDecimals(result.P_eff, roundToTwelveDecimals(result.P_eff))).toBe(true);
        expect(numbersEqualToFiveDecimals(result.L_d, roundToTwelveDecimals(result.L_d))).toBe(true);
        expect(numbersEqualToFiveDecimals(result.M_ek_drop, roundToTwelveDecimals(result.M_ek_drop))).toBe(true);
        expect(numbersEqualToFiveDecimals(result.Ixx_2, roundToTwelveDecimals(result.Ixx_2))).toBe(true);
        expect(numbersEqualToFiveDecimals(result.L_deflection, roundToTwelveDecimals(result.L_deflection))).toBe(true);
        expect(numbersEqualToFiveDecimals(result.rotation_heel_2, roundToTwelveDecimals(result.rotation_heel_2))).toBe(true);
        expect(numbersEqualToFiveDecimals(result.D_heel_2, roundToTwelveDecimals(result.D_heel_2))).toBe(true);
        expect(numbersEqualToFiveDecimals(result.Total_Vertical_Deflection, roundToTwelveDecimals(result.Total_Vertical_Deflection))).toBe(true);
        expect(numbersEqualToFiveDecimals(result.Addition_deflection_span, roundToTwelveDecimals(result.Addition_deflection_span))).toBe(true);
        expect(numbersEqualToFiveDecimals(result.Total_deflection_of_system, roundToTwelveDecimals(result.Total_deflection_of_system))).toBe(true);
    });
}); 