import { calculateMathematicalModel, MathematicalModelInputs } from "../mathematicalModelCalculations";
import { roundToTwelveDecimals } from "@/utils/precision";

describe("Mathematical Model Calculations", () => {
    const testCase: MathematicalModelInputs = {
        M: 102.5,           // Masonry thickness (mm)
        d: 200,             // Distance from fixing to back of angle (mm)
        T: 8,               // Angle thickness (mm)
        R: 12,              // Radius of bend (mm)
        L_bearing: 90,      // Length of bearing (mm)
        A: 250,             // Total angle length (mm)
    };

    it("calculates Ecc correctly", () => {
        const result = calculateMathematicalModel(testCase);
        const expectedEcc = roundToTwelveDecimals(testCase.M / 3);
        expect(result.Ecc).toBe(expectedEcc);
    });

    it("calculates 'a' correctly", () => {
        const result = calculateMathematicalModel(testCase);
        const expectedA = roundToTwelveDecimals(
            result.Ecc + 
            testCase.d + 
            (Math.PI * (testCase.T/2 + testCase.R)) - 
            (testCase.T + testCase.R)
        );
        expect(result.a).toBe(expectedA);
    });

    it("calculates 'b' correctly", () => {
        const result = calculateMathematicalModel(testCase);
        const expectedB = roundToTwelveDecimals(testCase.L_bearing - result.Ecc);
        expect(result.b).toBe(expectedB);
    });

    it("calculates 'I' correctly", () => {
        const result = calculateMathematicalModel(testCase);
        const expectedI = roundToTwelveDecimals(testCase.A - (testCase.R + testCase.T) - 16.5);
        expect(result.I).toBe(expectedI);
    });

    it("returns all values rounded to 12 decimal places", () => {
        const result = calculateMathematicalModel(testCase);
        
        // Check each value has at most 12 decimal places
        const checkDecimals = (num: number) => {
            const decimals = num.toString().split('.')[1] || '';
            expect(decimals.length).toBeLessThanOrEqual(12);
        };

        checkDecimals(result.Ecc);
        checkDecimals(result.a);
        checkDecimals(result.b);
        checkDecimals(result.I);
    });
}); 