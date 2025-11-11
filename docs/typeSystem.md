# Type System Documentation

## Overview
This document outlines the type system for the Masonry Support System Optimizer. The types are organized into logical modules to maintain clean separation of concerns and improve maintainability.

## Directory Structure
```
src/types/
├── index.ts              # Central export point for all types
├── userInputs.ts         # User input and loading calculation types
├── systemInputs.ts       # System configuration and material properties
├── validationTypes.ts    # Validation types and system defaults
├── geneticAlgorithm.ts   # Genetic algorithm and calculated parameters
├── channelSpecs.ts       # Channel specifications and lookup types
└── calculationResults.ts # Calculation and verification result types
```

## Type Modules

### User Inputs (`userInputs.ts`)
Core user input parameters and loading calculations.

#### Types:
- **UserInputs**
  - `slab_thickness`: number (mm)
  - `cavity`: number (mm)
  - `support_level`: number (mm)
  - `characteristic_load?`: number (kN/m)
  - `notch_height?`: number (mm)

- **LoadingCalculationInputs**
  - `masonry_density?`: number (kg/m³)
  - `masonry_thickness?`: number (mm)
  - `masonry_height`: number (m)

#### Constants:
- **LOADING_DEFAULTS**
  - `MASONRY_DENSITY`: 2000 kg/m³
  - `MASONRY_THICKNESS`: 102.5 mm

### System Inputs (`systemInputs.ts`)
System configuration and material properties.

#### Types:
- **BracketParameters**
  - `height`: number (100-490mm)
  - `projection`: number (75-250mm)
  - `thickness`: number (3-4mm)
  - `centres`: number (200-500mm)

- **AngleParameters**
  - `verticalLeg`: number (60-200mm)
  - `horizontalLeg`: number (60-200mm)
  - `thickness`: number (3-12mm)

- **MaterialProperties**
  - `yieldStrength`: number (N/mm²)
  - `ultimateStrength`: number (N/mm²)
  - `elasticModulus`: number (N/mm²)
  - `shearModulus`: number (N/mm²)
  - `poissonRatio`: number

- **SafetyFactors**
  - `gamma_M0`: number
  - `gamma_M1`: number
  - `gamma_M2`: number

- **SystemConfiguration**
  - `bracket`: BracketParameters
  - `angle`: AngleParameters
  - `material`: MaterialProperties
  - `safetyFactors`: SafetyFactors
  - `channelType`: string

#### Constants:
- **S275_STEEL**: Default S275 steel properties
- **DEFAULT_SAFETY_FACTORS**: Eurocode 3 safety factors

### Validation Types (`validationTypes.ts`)
Type constraints and system defaults.

#### Types:
- **BracketCentres**: 200 | 250 | ... | 600
- **BracketThickness**: 3 | 4
- **AngleThickness**: 3 | 4 | 5 | 6 | 8 | 10 | 12
- **BoltDiameter**: 10 | 12
- **SlabThickness**: 200 | 225 | 250

#### Constants:
- **SYSTEM_DEFAULTS**: System-wide default values

### Genetic Algorithm (`geneticAlgorithm.ts`)
Types for genetic algorithm parameters and calculations.

#### Types:
- **GeneticParameters**
  - `bracket_centres`: BracketCentres
  - `bracket_thickness`: BracketThickness
  - `angle_thickness`: AngleThickness
  - `vertical_leg`: 60 | 75

- **CalculatedParameters**
  - `bracket_height`: number
  - `bracket_projection`: number
  - `rise_to_bolts`: number
  - `drop_below_slab`: number
  - `bracket_projection_at_fixing`: number

### Channel Specifications (`channelSpecs.ts`)
Types for channel specifications from lookup tables.

#### Types:
- **ChannelSpec**
  - `id`: string
  - `channelType`: string
  - `slabThickness`: SlabThickness
  - `bracketCentres`: BracketCentres
  - `edgeDistances`: { top: number, bottom: number }
  - `maxForces`: { tension: number, shear: number }

### Calculation Results (`calculationResults.ts`)
Types for calculation and verification results.

#### Types:
- **MathematicalModelResults**
  - Forces and moments
  - Geometric calculations
  - Weight calculations

- **VerificationCheckResults**
  - Moment resistance checks
  - Shear resistance checks
  - Deflection checks
  - Connection checks
  - Overall pass/fail status

- **OptimizationResults**
  - Best solution parameters
  - Optimization statistics
  - Verification results
  - Model results

- **CalculationResults**
  - Input parameters
  - Optimization results
  - Model results
  - Verification results
  - Timestamp

## Usage Guidelines

1. **Input Validation**
   - Use the validation types to ensure inputs are within acceptable ranges
   - Default values are provided in respective constants

2. **Type Safety**
   - All numeric values include units in their documentation
   - Use the provided interfaces for type checking
   - Avoid using raw numbers without type constraints

3. **Extensibility**
   - New types should be added to the appropriate module
   - Update this documentation when adding new types
   - Maintain the separation of concerns

4. **Best Practices**
   - Use TypeScript's strict mode
   - Leverage union types for constrained values
   - Document units and valid ranges in comments 