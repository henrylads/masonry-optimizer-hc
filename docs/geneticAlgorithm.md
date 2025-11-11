# Genetic Algorithm Documentation

## Overview

The masonry optimizer uses a sophisticated genetic algorithm to find the most efficient support system design given user requirements. The algorithm iteratively evolves a population of possible designs, mimicking natural selection to optimize for minimal steel weight while ensuring all structural engineering constraints are satisfied.

## How It Works

### 1. User Input Processing

The genetic algorithm begins with user-provided inputs:

```
{
    support_level: number;          // Level of support (mm)
    cavity_width: number;           // Cavity width (mm)
    slab_thickness: number;         // Thickness of slab (mm)
    characteristic_load: number;    // Load characteristic (kN/m²)
    top_critical_edge: number;      // Top critical edge distance (mm)
    bottom_critical_edge: number;   // Bottom critical edge distance (mm)
}
```

These parameters define the physical constraints of the masonry system. The algorithm must find a design that satisfies these constraints while optimizing for weight and structural integrity.

### 2. Initial Population Generation

The algorithm creates 50 initial design candidates, each consisting of:

**Genetic Parameters (genes):**
- `bracket_centres`: Distance between brackets (200-600mm in 50mm steps)
- `bracket_thickness`: Thickness of the bracket (3mm or 4mm)
- `angle_thickness`: Thickness of the angle section (3, 4, 5, 6, or 8mm)
- `vertical_leg`: Length of vertical leg (60mm for angles 3-6mm, 75mm for 8mm angle)
- `bolt_diameter`: Diameter of fixing bolts (10mm or 12mm)
- `horizontal_leg`: Length of horizontal leg (90mm default)

These parameters are randomly generated with intelligent constraints:
- `bracket_centres` is restricted to 500mm for loads greater than 5kN/m²
- `bracket_thickness` has 80% probability of 4mm for loads greater than 7.5kN/m²
- `bolt_diameter` defaults to 10mm with only a 5% chance of 12mm

**Calculated Parameters:**
For each set of genetic parameters, dependent parameters are calculated:
- `bracket_height`: Determined from support level and top critical edge
- `bracket_projection`: Calculated as cavity width minus 10mm
- `rise_to_bolts`: Distance from base of angle to center of bolt group
- `drop_below_slab`: Amount bracket extends below slab (if any)
- `shear_load`: Calculated from characteristic load and bracket centers

### 3. Fitness Scoring

Each design is evaluated with a comprehensive fitness function that considers:

**Base Score Calculation:**
- Starting score = 1000 / total_weight
- The lighter the design, the higher its base score

**Engineering Calculations:**
1. **Loading calculations** determine shear forces on the system
2. **Bracket parameters** are calculated based on cavity width
3. **Angle parameters** calculate bearing length, material distribution
4. **Mathematical model** verifies stress distribution across components

**Verification Checks:**
Ten critical engineering checks are performed, including:
- Moment resistance check
- Shear resistance check
- Angle deflection check
- Bracket connection check
- Fixing check
- Combined tension/shear check
- Total system deflection check

**Penalty Application:**
- **Weight penalties**: 10% score reduction per unit of relative weight increase compared to the lightest design in the population.
- **Engineering penalties**: 10% score reduction for each engineering rule violation:
  - Total **angle** deflection exceeding 1.5mm
  - Bracket centers exceeding 500mm for loads > 5kN/m²
  *(Note: Bracket load limits are checked by verification, not penalized here)*

**Bonus Application:**
- **Standard Bonus**: 5% score increase for using M10 bolts (preferred over M12)
- **Utilization Bonus**: Up to 20% score increase based on how close the **total system deflection** utilization is to 95%. The bonus decreases linearly as the utilization deviates from 95% (no bonus if utilization < 50%). This encourages designs that efficiently use material without being significantly over-specced.

**Final Score Calculation:**
```
finalScore = baseScore * (1 - weightPenalty - engineeringPenalties) * (1 + standardBonuses) * (1 + utilizationBonus)
```

**Validation Gate:**
- If ANY verification check fails, the design receives a score of -1000
- This ensures only structurally sound designs are considered for breeding

### 4. Evolution Process

For each generation (until convergence):

**1. Elite Selection:**
- Top designs (typically 5-10%) from the current generation are preserved unchanged
- This "elitism" ensures the best solutions aren't lost

**2. Parent Selection:**
- Tournament selection is used to choose parent designs
- For each parent needed:
  - 5 random designs are selected from the population
  - The design with highest fitness among these 5 is chosen as parent
  - This approach balances exploration with exploitation

**3. Crossover (Breeding):**
- Each new offspring inherits genes from two parents
- For each parameter (gene), there's a 50% chance it comes from either parent:
  ```typescript
  childGenetic.bracket_centres = Math.random() < 0.5 ? 
      parent1.genetic.bracket_centres : parent2.genetic.bracket_centres;
  ```
- This creates genetic diversity while preserving beneficial traits

**4. Mutation:**
- Each parameter has a chance to mutate based on the mutation rate
- Mutations follow specific rules for each parameter:
  - `bracket_centres`: Moves up/down by 50mm steps
  - `angle_thickness`: Changes to adjacent thickness in the sequence
  - `bracket_thickness`: Toggles between 3mm and 4mm
  - `bolt_diameter`: Switches between 10mm and 12mm with bias toward 10mm
  - `vertical_leg`: Automatically updates when angle thickness changes

**5. Parameter Validation:**
- After mutation, all parameters are validated to ensure they meet engineering constraints
- If validation fails after 20 attempts, the original design is retained
- Dependent parameters are recalculated for the new genetic configuration

**6. Fitness Recalculation:**
- Fitness scores are calculated for the new population
- Designs with verification failures receive very low scores

### 5. Convergence and Stopping

The algorithm tracks:
- Current generation number
- Best fitness score found so far
- Generations without improvement

Convergence occurs when:
- Maximum generations (default 100) is reached, OR
- No improvement for 20 consecutive generations

Upon convergence, the algorithm returns:
- The best design found across all generations
- Comprehensive verification results
- Generation-by-generation performance history

## Implementation Structure

```
src/calculations/geneticAlgorithm/
├── index.ts                    # Main orchestrator
├── fitnessScoring.ts          # Fitness calculation logic
├── convergence.ts             # Convergence tracking
├── populationGeneration.ts    # Initial population creation
└── selectionAndBreeding/      # Evolution logic
    ├── selection.ts           # Tournament selection
    ├── crossover.ts          # Parameter inheritance
    ├── mutation.ts           # Parameter mutation
    └── parameterUpdates.ts   # Parameter validation
```

## Main Algorithm Loop

```
1. Generate initial population of 50 designs
2. Calculate initial fitness scores
3. While not converged:
   a. Preserve elite designs (top performers)
   b. Select parents using tournament selection
   c. Create offspring through crossover
   d. Apply mutations with probability check
   e. Validate all parameters and recalculate dependencies
   f. Calculate fitness of new population
   g. Sort by fitness
   h. Check convergence criteria
4. Return the optimal design found
```

## Precision Control

All calculations maintain 12 decimal places of precision to ensure:
- Accurate comparisons between similar designs
- Prevention of floating-point errors
- Reliable convergence detection
- Mathematically sound engineering calculations

## Output

The algorithm returns the optimal design with:
- All genetic parameters (dimensions and specifications)
- All calculated parameters (derived measurements)
- Complete verification results with pass/fail status
- Weight and cost metrics for the final design
- Generation-by-generation performance history 