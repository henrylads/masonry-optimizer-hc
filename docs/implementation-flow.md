# Masonry Optimizer Implementation Flow

This document explains the current implementation of the masonry support system optimizer, detailing how data flows through the system from user input to final optimized design.

## 1. User Input Collection (`src/app/page.tsx` and `MasonryDesignerForm`)

The process begins with collecting user inputs through a form interface:

### Required Inputs:
- Slab thickness (mm): 150-500mm
- Cavity width (mm): 50-400mm
- Support level (mm): -500 to +500mm
- Notch height (mm): 0-200mm

### Optional Inputs (one set required):
1. Characteristic load (kN/m), OR
2. Masonry properties:
   - Density (kg/m³): 1500-2500
   - Thickness (mm): 50-250mm
   - Height (m): 1-10m

## 2. API Route Processing (`src/app/api/optimize/route.ts`)

The form data is sent to the API route which:

1. Validates inputs
2. Calculates characteristic load if not provided
3. Determines critical edge distances based on slab thickness
4. Prepares genetic algorithm configuration

### Configuration Parameters:
```typescript
{
  populationSize: 50,
  maxGenerations: 100,
  mutationRate: 0.05,
  elitismCount: 2,
  designInputs: {
    support_level: number,
    cavity_width: number,
    slab_thickness: number,
    characteristic_load: number,
    top_critical_edge: number,
    bottom_critical_edge: number
  }
}
```

## 3. Genetic Algorithm Process (`src/calculations/geneticAlgorithm/`)

### 3.1 Initial Population Generation
- Creates 50 initial designs
- Each design includes:
  ```typescript
  {
    genetic: {
      bracket_centres: number,
      bracket_thickness: number,
      angle_thickness: number,
      vertical_leg: number,
      bolt_diameter: number
    },
    calculated: {
      // Dependent parameters calculated based on genetic parameters
    }
  }
  ```

### 3.2 Fitness Scoring
For each design:
1. Calculates system weight
2. Performs verification checks
3. Applies penalties for:
   - Excess weight
   - Failed engineering checks
   - Failed verification checks
4. Applies bonuses for preferred configurations (e.g., M10 bolts)

### 3.3 Selection and Breeding
1. Uses tournament selection to choose parents
2. Performs crossover to create new designs
3. Applies mutations with 5% probability
4. Validates new designs against constraints

### 3.4 Convergence Checking
- Tracks best fitness score
- Stops if:
  - No improvement for 20 generations
  - Reaches 100 generations
  - Reaches fitness threshold (if specified)

## 4. Verification Checks (`src/calculations/verificationChecks/`)

Each design undergoes multiple verification checks:

### 4.1 Angle Checks
1. Moment Resistance at ULS
2. Shear Resistance at ULS
3. Angle Deflection at SLS
4. Angle to Bracket Connection
5. Angle to Masonry Connection
6. Combined Tension-Shear Check

### 4.2 Bracket Design Checks
1. Bracket Class Check
2. Moment Capacity Check
3. Deflection Due to Drop Below Slab (if applicable)

### 4.3 Fixing Checks
1. Tensile Load in Stud Group
2. Combined Tension and Shear

## 5. Result Processing

The final optimized design includes:
- All design parameters
- Verification results
- Weight calculations
- Performance metrics

## Gaps and Inconsistencies

1. **Mathematical Model Implementation**
   - The mathematical model calculations from the project overview are partially implemented
   - Some intermediate calculations need more detailed validation

2. **Verification Checks**
   - Some verification checks are marked as placeholders in the code
   - The angle to masonry connection and fixing checks need full implementation

3. **Weight Optimization**
   - The weight calculation considers basic components
   - Could be enhanced with more detailed material optimization

4. **Testing Coverage**
   - Unit tests exist for individual components
   - Need more integration tests for the complete optimization flow

## Project Overview Alignment

Comparing with `projectOverview.md`, the implementation covers:

✅ Basic genetic algorithm structure  
✅ Initial population generation  
✅ Fitness scoring  
✅ Selection and breeding  
✅ Core verification checks  

Missing or Incomplete:
- Detailed mathematical model integration
- Complete fixing check implementation
- Some advanced verification scenarios
- Comprehensive error handling for edge cases

## Next Steps

1. Complete the mathematical model integration
2. Implement missing verification checks
3. Enhance weight optimization
4. Add more comprehensive testing
5. Improve error handling and edge case coverage 