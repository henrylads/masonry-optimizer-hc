import { verifyShearReductionDueToPackers } from '../verificationChecks/angleChecks/shearReductionDueToPackers';

describe('verifyShearReductionDueToPackers', () => {
    it('should calculate shear reduction correctly with packers', () => {
        // Test case with typical values
        const result = verifyShearReductionDueToPackers(
            9.45,   // V_ed (kN)
            18.65,  // N_bolt (kN)
            40,     // V_bolt_resistance (kN)
            50,     // N_bolt_resistance (kN)
            3,      // t_p (mm)
            12      // d_p (mm)
        );

        // Calculate expected beta_p: (9*12)/(8*12 + 3*3) = 108/105 but capped at 1
        const expected_beta_p = Math.min((9 * 12) / (8 * 12 + 3 * 3), 1);
        
        // Expected V_rd = beta_p * V_bolt_resistance
        const expected_V_rd = expected_beta_p * 40;
        
        // Expected combined utilization = V_ed/V_rd + N_bolt/(1.4*N_bolt_resistance)
        const expected_combined = (9.45 / expected_V_rd) * 100 + (18.65 / (1.4 * 50)) * 100;

        expect(result.t_p).toBe(3);
        expect(result.d_p).toBe(12);
        expect(result.beta_p).toBeCloseTo(expected_beta_p, 12);
        expect(result.V_rd).toBeCloseTo(expected_V_rd, 12);
        expect(result.T_rd).toBe(50);
        expect(result.combined_utilization).toBeCloseTo(expected_combined, 12);
        expect(result.passes).toBe(expected_combined <= 100);
    });

    it('should handle case with no packer reduction (beta_p = 1)', () => {
        // Test case with very thin packer that results in beta_p = 1
        const result = verifyShearReductionDueToPackers(
            9.45,   // V_ed (kN)
            18.65,  // N_bolt (kN)
            40,     // V_bolt_resistance (kN)
            50,     // N_bolt_resistance (kN)
            0.1,    // t_p (mm) - very thin packer
            12      // d_p (mm)
        );

        expect(result.beta_p).toBeCloseTo(1, 12);
        expect(result.V_rd).toBeCloseTo(40, 12); // No reduction in shear resistance
    });

    it('should handle maximum packer reduction case', () => {
        // Test case with thick packer that results in significant reduction
        const result = verifyShearReductionDueToPackers(
            9.45,   // V_ed (kN)
            18.65,  // N_bolt (kN)
            40,     // V_bolt_resistance (kN)
            50,     // N_bolt_resistance (kN)
            10,     // t_p (mm) - thick packer
            12      // d_p (mm)
        );

        // Calculate expected beta_p: (9*12)/(8*12 + 3*10)
        const expected_beta_p = (9 * 12) / (8 * 12 + 3 * 10);
        
        expect(result.beta_p).toBeCloseTo(expected_beta_p, 12);
        expect(result.V_rd).toBeLessThan(40); // Should show reduction in shear resistance
    });
}); 