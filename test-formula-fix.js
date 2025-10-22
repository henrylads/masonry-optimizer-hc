// Quick test to verify the updated formulas work with user's example
const { calculateAngleParameters } = require('./src/calculations/angleCalculations.ts');
const { calculateMathematicalModel } = require('./src/calculations/verificationChecks/mathematicalModelCalculations.ts');

console.log('=== TESTING UPDATED FORMULAS ===');
console.log('User example: 225mm slab, 150mm cavity, -222mm support level, 10 kN/m force');

// Test the angle calculations
const testParams = {
    C: 150,              // Cavity
    D: 140,              // Bracket projection (cavity - 10)
    S: 3,                // Isolation shim
    T: 5,                // Angle thickness
    B_cc: 500,           // Bracket centres
    depth_to_toe_plate: 12 // Default value
};

console.log('\n--- ANGLE CALCULATION TEST ---');
console.log('Input parameters:', testParams);

const angleResults = calculateAngleParameters(testParams);

console.log('\n--- RESULTS ---');
console.log('d (cavity to back of bracket):', angleResults.d);
console.log('cavity_back_angle (d + depth_to_toe_plate):', angleResults.cavity_back_angle);
console.log('b (L_bearing):', angleResults.b);

// Test mathematical model with the cavity_back_angle
console.log('\n--- MATHEMATICAL MODEL TEST ---');
const mathModelParams = {
    M: 102.5,              // For backward compatibility
    d: angleResults.cavity_back_angle,  // Pass cavity_back_angle as d
    T: testParams.T,
    R: angleResults.R,
    L_bearing: angleResults.b,
    A: 60,                 // Vertical leg length
    facade_thickness: 102.5,
    load_position: 1/3
};

console.log('Mathematical model input (d = cavity_back_angle):', mathModelParams.d);

const mathResults = calculateMathematicalModel(mathModelParams);

console.log('\n--- MATHEMATICAL MODEL RESULTS ---');
console.log('Ecc (eccentricity):', mathResults.Ecc);
console.log('a (new formula):', mathResults.a);
console.log('b (L_bearing - Ecc):', mathResults.b);
console.log('I:', mathResults.I);

console.log('\n=== VERIFICATION COMPLETE ===');