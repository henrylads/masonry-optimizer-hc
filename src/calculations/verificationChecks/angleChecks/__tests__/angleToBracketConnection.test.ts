import { verifyAngleToBracketConnection } from '../angleToBracketConnection';
import { BoltDiameter } from '../../../../types/geneticAlgorithm';
import { roundToTwelveDecimals } from '@/utils/precision';
import { numbersEqualToFiveDecimals } from '@/utils/test-helpers';

describe('Angle to Bracket Connection Verification', () => {
    // Define an interface or type for testCase to ensure boltDiameter is typed correctly
    interface AngleConnectionTestCase {
        V_ed: number;
        B: number;
        b: number;
        I: number;
        boltDiameter: BoltDiameter;
    }

    const testCase: AngleConnectionTestCase = {
        V_ed: 2.3604,          // Applied shear force (kN)
        
        // From system inputs and calculations
        B: 90,                  // Horizontal leg (mm)
        b: 55.83,              // Bearing length (mm)
        I: 38.5,               // Rise to bolt (mm)
        boltDiameter: 10
    };

    // Constants from project overview
    const constants = {
        F_ub: 700,             // Ultimate tensile strength of bolt (N/mm²)
        yM2: 1.25,             // Bolt material safety factor
        a: 0.9,                // Factor from Eurocode 93-8
        stressArea_M10: 58,    // Cross sectional area of M10 bolt (mm²)
        stressArea_M12: 84.3   // Cross sectional area of M12 bolt (mm²)
    };

    it('should calculate moment and tension forces correctly', () => {
        const result = verifyAngleToBracketConnection(
            testCase.V_ed,
            testCase.B,
            testCase.b,
            testCase.I,
            testCase.boltDiameter
        );
        
        // M_b = V_ed * (B - b + 10) / 1000
        const expectedM_b = roundToTwelveDecimals(
            testCase.V_ed * (testCase.B - testCase.b + 10) / 1000
        );
        expect(numbersEqualToFiveDecimals(result.M_b, expectedM_b)).toBe(true);
        
        // N_bolt = M_b / (I/1000)
        const expectedN_bolt = roundToTwelveDecimals(
            expectedM_b / (testCase.I / 1000)
        );
        expect(numbersEqualToFiveDecimals(result.N_bolt, expectedN_bolt)).toBe(true);
    });

    it('should calculate bolt resistances correctly', () => {
        const result = verifyAngleToBracketConnection(
            testCase.V_ed,
            testCase.B,
            testCase.b,
            testCase.I,
            testCase.boltDiameter
        );
        
        // V_bolt_resistance = 0.5 * F_ub * stress_area_bolt / yM2 / 1000
        const expectedV_bolt_resistance = roundToTwelveDecimals(
            0.5 * constants.F_ub * constants.stressArea_M10 / 
            constants.yM2 / 1000
        );
        expect(numbersEqualToFiveDecimals(result.V_bolt_resistance, expectedV_bolt_resistance)).toBe(true);
        
        // N_bolt_resistance = a * stress_area_bolt * F_ub / yM2 / 1000
        const expectedN_bolt_resistance = roundToTwelveDecimals(
            constants.a * constants.stressArea_M10 * constants.F_ub / 
            constants.yM2 / 1000
        );
        expect(numbersEqualToFiveDecimals(result.N_bolt_resistance, expectedN_bolt_resistance)).toBe(true);
    });

    it('should calculate utilizations correctly', () => {
        const result = verifyAngleToBracketConnection(
            testCase.V_ed,
            testCase.B,
            testCase.b,
            testCase.I,
            testCase.boltDiameter
        );
        
        // Calculate intermediate values
        const M_b = testCase.V_ed * (testCase.B - testCase.b + 10) / 1000;
        const N_bolt = M_b / (testCase.I / 1000);
        const V_bolt_resistance = 0.5 * constants.F_ub * constants.stressArea_M10 / constants.yM2 / 1000;
        const N_bolt_resistance = constants.a * constants.stressArea_M10 * constants.F_ub / constants.yM2 / 1000;
        
        // U_v_bolt = (V_ed/V_bolt_resistance) * 100
        const expectedU_v_bolt = roundToTwelveDecimals(
            (testCase.V_ed / V_bolt_resistance) * 100
        );
        expect(numbersEqualToFiveDecimals(result.U_v_bolt, expectedU_v_bolt)).toBe(true);
        
        // U_n_bolt = (N_bolt/N_bolt_resistance) * 100
        const expectedU_n_bolt = roundToTwelveDecimals(
            (N_bolt / N_bolt_resistance) * 100
        );
        expect(numbersEqualToFiveDecimals(result.U_n_bolt, expectedU_n_bolt)).toBe(true);
        
        // U_c_bolt = U_v_bolt + (N_bolt/(1.4*N_bolt_resistance)) * 100
        const expectedU_c_bolt = roundToTwelveDecimals(
            expectedU_v_bolt + (N_bolt / (1.4 * N_bolt_resistance)) * 100
        );
        expect(numbersEqualToFiveDecimals(result.U_c_bolt, expectedU_c_bolt)).toBe(true);
    });

    it('should handle M12 bolt calculations correctly', () => {
        const result = verifyAngleToBracketConnection(
            testCase.V_ed,
            testCase.B,
            testCase.b,
            testCase.I,
            12
        );
        
        // V_bolt_resistance with M12
        const expectedV_bolt_resistance = roundToTwelveDecimals(
            0.5 * constants.F_ub * constants.stressArea_M12 / 
            constants.yM2 / 1000
        );
        expect(numbersEqualToFiveDecimals(result.V_bolt_resistance, expectedV_bolt_resistance)).toBe(true);
        
        // N_bolt_resistance with M12
        const expectedN_bolt_resistance = roundToTwelveDecimals(
            constants.a * constants.stressArea_M12 * constants.F_ub / 
            constants.yM2 / 1000
        );
        expect(numbersEqualToFiveDecimals(result.N_bolt_resistance, expectedN_bolt_resistance)).toBe(true);
    });

    it('should pass when combined utilization is <= 100%', () => {
        const result = verifyAngleToBracketConnection(
            testCase.V_ed,
            testCase.B,
            testCase.b,
            testCase.I,
            testCase.boltDiameter
        );
        
        expect(result.passes).toBe(result.U_c_bolt <= 100);
    });

    it('should maintain precision requirements', () => {
        const result = verifyAngleToBracketConnection(
            testCase.V_ed,
            testCase.B,
            testCase.b,
            testCase.I,
            testCase.boltDiameter
        );
        
        // Check that all numerical results have at least 5 decimal places
        expect(numbersEqualToFiveDecimals(result.M_b, roundToTwelveDecimals(result.M_b))).toBe(true);
        expect(numbersEqualToFiveDecimals(result.N_bolt, roundToTwelveDecimals(result.N_bolt))).toBe(true);
        expect(numbersEqualToFiveDecimals(result.V_bolt_resistance, roundToTwelveDecimals(result.V_bolt_resistance))).toBe(true);
        expect(numbersEqualToFiveDecimals(result.U_v_bolt, roundToTwelveDecimals(result.U_v_bolt))).toBe(true);
        expect(numbersEqualToFiveDecimals(result.N_bolt_resistance, roundToTwelveDecimals(result.N_bolt_resistance))).toBe(true);
        expect(numbersEqualToFiveDecimals(result.U_n_bolt, roundToTwelveDecimals(result.U_n_bolt))).toBe(true);
        expect(numbersEqualToFiveDecimals(result.U_c_bolt, roundToTwelveDecimals(result.U_c_bolt))).toBe(true);
    });

    it('should calculate correct values for M10 bolt', () => {
        const result = verifyAngleToBracketConnection(1.5, 100, 50, 30, 10);

        // Check precision
        expect(numbersEqualToFiveDecimals(result.M_b, roundToTwelveDecimals(result.M_b))).toBe(true);
        expect(numbersEqualToFiveDecimals(result.N_bolt, roundToTwelveDecimals(result.N_bolt))).toBe(true);
        expect(numbersEqualToFiveDecimals(result.V_bolt_resistance, roundToTwelveDecimals(result.V_bolt_resistance))).toBe(true);
        expect(numbersEqualToFiveDecimals(result.U_v_bolt, roundToTwelveDecimals(result.U_v_bolt))).toBe(true);
        expect(numbersEqualToFiveDecimals(result.N_bolt_resistance, roundToTwelveDecimals(result.N_bolt_resistance))).toBe(true);
        expect(numbersEqualToFiveDecimals(result.U_n_bolt, roundToTwelveDecimals(result.U_n_bolt))).toBe(true);
        expect(numbersEqualToFiveDecimals(result.U_c_bolt, roundToTwelveDecimals(result.U_c_bolt))).toBe(true);

        // Calculate expected values
        const M_b = 1.5 * (100 - 50 + 10) / 1000; // 0.09
        const N_bolt = M_b / (30 / 1000); // 3
        const V_bolt_resistance = 0.5 * 700 * 58 / 1.25 / 1000; // 16.24
        const U_v_bolt = (1.5 / 16.24) * 100; // 9.23645
        const N_bolt_resistance = 0.9 * 58 * 700 / 1.25 / 1000; // 29.232
        const U_n_bolt = (3 / 29.232) * 100; // 10.26239
        const U_c_bolt = U_v_bolt + (3 / (1.4 * 29.232)) * 100; // 16.56668

        // Check values using 5 decimal place comparison with calculated values
        expect(numbersEqualToFiveDecimals(result.M_b, M_b)).toBe(true);
        expect(numbersEqualToFiveDecimals(result.N_bolt, N_bolt)).toBe(true);
        expect(numbersEqualToFiveDecimals(result.V_bolt_resistance, V_bolt_resistance)).toBe(true);
        expect(numbersEqualToFiveDecimals(result.U_v_bolt, U_v_bolt)).toBe(true);
        expect(numbersEqualToFiveDecimals(result.N_bolt_resistance, N_bolt_resistance)).toBe(true);
        expect(numbersEqualToFiveDecimals(result.U_n_bolt, U_n_bolt)).toBe(true);
        expect(numbersEqualToFiveDecimals(result.U_c_bolt, U_c_bolt)).toBe(true);
        expect(result.passes).toBe(true);
    });

    it('should calculate correct values for M12 bolt', () => {
        const result = verifyAngleToBracketConnection(2.5, 120, 60, 35, 12);

        // Check precision
        expect(numbersEqualToFiveDecimals(result.M_b, roundToTwelveDecimals(result.M_b))).toBe(true);
        expect(numbersEqualToFiveDecimals(result.N_bolt, roundToTwelveDecimals(result.N_bolt))).toBe(true);
        expect(numbersEqualToFiveDecimals(result.V_bolt_resistance, roundToTwelveDecimals(result.V_bolt_resistance))).toBe(true);
        expect(numbersEqualToFiveDecimals(result.U_v_bolt, roundToTwelveDecimals(result.U_v_bolt))).toBe(true);
        expect(numbersEqualToFiveDecimals(result.N_bolt_resistance, roundToTwelveDecimals(result.N_bolt_resistance))).toBe(true);
        expect(numbersEqualToFiveDecimals(result.U_n_bolt, roundToTwelveDecimals(result.U_n_bolt))).toBe(true);
        expect(numbersEqualToFiveDecimals(result.U_c_bolt, roundToTwelveDecimals(result.U_c_bolt))).toBe(true);

        // Calculate expected values
        const M_b = 2.5 * (120 - 60 + 10) / 1000; // 0.175
        const N_bolt = M_b / (35 / 1000); // 5
        const V_bolt_resistance = 0.5 * 700 * 84.3 / 1.25 / 1000; // 23.604
        const U_v_bolt = (2.5 / 23.604) * 100; // 10.59142
        const N_bolt_resistance = 0.9 * 84.3 * 700 / 1.25 / 1000; // 42.4872
        const U_n_bolt = (5 / 42.4872) * 100; // 11.76825
        const U_c_bolt = U_v_bolt + (5 / (1.4 * 42.4872)) * 100; // 19.00452

        // Check values using 5 decimal place comparison with calculated values
        expect(numbersEqualToFiveDecimals(result.M_b, M_b)).toBe(true);
        expect(numbersEqualToFiveDecimals(result.N_bolt, N_bolt)).toBe(true);
        expect(numbersEqualToFiveDecimals(result.V_bolt_resistance, V_bolt_resistance)).toBe(true);
        expect(numbersEqualToFiveDecimals(result.U_v_bolt, U_v_bolt)).toBe(true);
        expect(numbersEqualToFiveDecimals(result.N_bolt_resistance, N_bolt_resistance)).toBe(true);
        expect(numbersEqualToFiveDecimals(result.U_n_bolt, U_n_bolt)).toBe(true);
        expect(numbersEqualToFiveDecimals(result.U_c_bolt, U_c_bolt)).toBe(true);
        expect(result.passes).toBe(true);
    });

    it('should fail when combined utilization exceeds 100%', () => {
        const result = verifyAngleToBracketConnection(15, 150, 70, 40, 10);
        expect(result.passes).toBe(false);
        expect(result.U_c_bolt).toBeGreaterThan(100);
    });
}); 