# Fixing Position Optimization Implementation Tasks

## Relevant Files

### Type Definitions & Data Models
- `src/types/designInputs.ts` - Add fixing optimization parameters to DesignInputs interface
- `src/types/form-schema.ts` - Update form validation schema for new parameters
- `src/types/optimization-types.ts` - Extend OptimizationResult with fixing position data
- `src/types/bracketAngleTypes.ts` - Update calculation parameter interfaces

### Core Calculation Engine
- `src/calculations/bracketAngleSelection.ts` - Modify to support dynamic fixing positions
- `src/calculations/bracketCalculations.ts` - Update bracket height calculations
- `src/calculations/bruteForceAlgorithm/index.ts` - Main optimization algorithm updates
- `src/calculations/bruteForceAlgorithm/evaluateDesign.ts` - Design evaluation with fixing position
- `src/calculations/bruteForceAlgorithm/combinationGeneration.ts` - Add fixing position combinations

### API & Form Components
- `src/app/api/optimize/route.ts` - Handle new optimization parameters
- `src/components/masonry-designer-form.tsx` - Add UI controls for fixing optimization
- `src/components/results-display.tsx` - Display optimized fixing position
- `src/components/shapediver.tsx` - Update visualization parameters

### Test Files
- `src/calculations/bracketAngleSelection.test.ts` - Test dynamic fixing calculations
- `src/calculations/bruteForceAlgorithm/index.test.ts` - Test optimization with fixing positions
- `src/app/api/optimize/route.test.ts` - API integration tests

### Notes

- The fixing position optimization allows the system to iterate the fixing position downward from the default 75mm in 5mm increments
- This feature is particularly beneficial for thick slabs (>250mm) where it can enable smaller brackets
- All structural verification checks must pass at the optimized fixing position
- The ShapeDiver visualization must accurately reflect the optimized fixing position
- Maintain backward compatibility - the feature should be optional via a toggle

## Tasks

- [x] 1.0 Data Model & Type Foundation for Fixing Position
  - [x] 1.1 Add `enable_fixing_optimization` boolean to DesignInputs interface
  - [x] 1.2 Add `fixing_position` parameter with default value of 75mm
  - [x] 1.4 Update form schema validation for new parameters
  - [x] 1.5 Add `optimized_fixing_position` to OptimizationResult type
  - [x] 1.6 Update BracketHeightCalculationParams to accept dynamic fixing position
  - [x] 1.7 Create FixingOptimizationConfig interface for configuration
  - [x] 1.8 Type Safety Check: Run `npm run build` to verify compilation

- [x] 2.0 Core Calculation Engine Updates
  - [x] 2.1 Create `calculateOptimalFixingPosition` function in bracketAngleSelection.ts
  - [x] 2.2 Modify `calculateStandardBracketHeight` to accept variable fixing position
  - [x] 2.3 Update `calculateInvertedBracketHeight` for dynamic fixing positions
  - [x] 2.4 Adjust `calculateRiseToBolts` to use dynamic fixing position parameter
  - [x] 2.5 Update BRACKET_ANGLE_CONSTANTS to support configurable fixing positions
  - [x] 2.6 Add validation to ensure fixing position doesn't exceed slab thickness
  - [x] 2.7 Write unit tests for all modified calculation functions
  - [x] 2.8 Code Quality Check: Verify no type assertions in calculation code

- [x] 3.0 Optimization Algorithm Enhancement
  - [x] 3.1 Add fixing position to genetic parameters structure
  - [x] 3.2 Generate fixing position combinations (75mm, 80mm, 85mm... in 5mm increments)
  - [x] 3.3 Modify fitness function to consider bracket steel weight reduction
  - [x] 3.4 Update evaluateDesign to test each fixing position
  - [x] 3.5 Track best fixing position for each design iteration
  - [x] 3.6 Ensure all verification checks run for each fixing position
  - [x] 3.7 Add early termination if no valid fixing positions exist
  - [x] 3.8 Update progress reporting to include fixing position optimization
  - [x] 3.9 Write comprehensive tests for optimization with fixing positions

- [x] 4.0 API Layer & Form Integration
  - [x] 4.1 Update optimize API route to accept fixing optimization parameters
  - [x] 4.2 Add validation for fixing position constraints (95mm min rise to bolts, bottom critical edge from slab bottom)
  - [x] 4.3 Pass fixing optimization config to brute force algorithm
  - [x] 4.4 Return optimized fixing position in API response
  - [x] 4.5 Add recommendation logic for thick slabs (>250mm)
  - [x] 4.6 Update AI tools to handle fixing position parameters
  - [x] 4.7 Write API integration tests for new parameters
  - [x] 4.8 Add error handling for invalid fixing configurations

- [ ] 5.0 UI Components & User Controls
  - [ ] 5.1 Add "Optimize Fixing Position" toggle switch to form
  - [ ] 5.2 Add tooltip explaining when fixing optimization is beneficial
  - [ ] 5.3 Display recommendation for slabs thicker than 250mm
  - [ ] 5.4 Show optimized fixing position in results display
  - [ ] 5.5 Add visual indicator showing steel weight savings
  - [ ] 5.6 Update form state management for new fields
  - [ ] 5.7 Write component tests for new UI elements

- [ ] 6.0 ShapeDiver Visualization Updates
  - [ ] 6.1 Add fixing_position parameter to ShapeDiver configuration
  - [ ] 6.2 Update parameter mapping to pass actual fixing position
  - [ ] 6.3 Ensure bracket placement reflects optimized position
  - [ ] 6.4 Test visualization with various fixing positions
  - [ ] 6.5 Add visual highlighting for optimized vs default position

- [ ] 7.0 Integration Testing & Validation
  - [ ] 7.1 Test end-to-end flow with fixing optimization enabled
  - [ ] 7.2 Verify backward compatibility with optimization disabled
  - [ ] 7.3 Test with various slab thicknesses (150mm to 500mm)
  - [ ] 7.4 Validate steel weight reduction for thick slabs
  - [ ] 7.5 Ensure all structural checks pass at optimized positions
  - [ ] 7.6 Performance testing with additional iterations
  - [ ] 7.7 Final Type Safety Check: Run full build
  - [ ] 7.8 Test Verification: Run all tests (`npm test`)
  - [ ] 7.9 Type Assertion Review: Remove any type assertions
  - [ ] 7.10 Update documentation with fixing optimization feature

## Implementation Notes

### Key Considerations:
1. The fixing position should only move downward (deeper into slab) from the default 75mm
2. Each 5mm increment should be tested for structural validity
3. The optimization should select the position that minimizes total bracket steel usage
4. The feature should be recommended but not mandatory for thick slabs

### Fixing Position Constraints:
1. **Minimum bracket height**: 95mm to the fixing point (rise to bolts)
2. **Maximum fixing depth**: Fixing cannot go below 75mm from the bottom of the slab
3. **Increment size**: Start at 75mm, drop down in 5mm increments
4. **Critical edge distance**: Must maintain minimum 75mm to bottom of slab

### Performance Impact:
- Additional iterations will increase computation time
- Consider limiting maximum fixing depth to (slab_thickness - 100mm)
- May need to implement caching for repeated calculations

### Testing Strategy:
1. Unit tests for each modified calculation function
2. Integration tests for the full optimization flow
3. Visual regression tests for ShapeDiver output
4. Performance benchmarks comparing with/without optimization

## Permutation Analysis & Performance Optimization

### Current Permutation Count (~200 options)
The current algorithm generates combinations from:
- **Bracket centres**: 9 options (200, 250, 300, 350, 400, 450, 500, 550, 600mm)
- **Bracket thickness**: 2 options (3, 4mm)
- **Angle thickness**: 5 options (3, 4, 5, 6, 8mm)
- **Bolt diameter**: 2 options (10, 12mm)
- **Bracket/Angle combinations**: Typically 1-2 valid combinations based on BSL
- **Channel types**: Usually 1 valid type per configuration

**Current calculation**: 9 × 2 × 5 × 2 × 1-2 × 1 = **180-360 combinations** (depending on BSL)

### Impact of Adding Fixing Position Optimization
Adding fixing position iterations would multiply the combinations:

#### Full Implementation (Not Recommended)
- **Fixing positions**: Start at 75mm, increment by 5mm
- For a 200mm slab: ~3-4 positions (75, 80, 85, 90mm)
- For a 300mm slab: ~6-8 positions (75, 80, 85, 90, 95, 100, 105, 110mm)  
- For a 400mm slab: ~10-12 positions

**Potential calculation**: 200 base combinations × 3-12 fixing positions = **600-2,400 combinations**

### Recommended Optimization Strategies

#### Strategy 1: Smart Pruning (Recommended)
- Only test fixing positions for promising designs (top 20% by initial evaluation)
- Test 3-5 fixing positions maximum for these candidates
- **Result**: ~200 initial + (20 × 5) = **~300 total evaluations** (50% increase)

#### Strategy 2: Adaptive Stepping
- Use 10mm increments for initial exploration
- Refine to 5mm increments only for the best candidates
- Reduces iterations by ~50% while maintaining accuracy

#### Strategy 3: Early Termination
- Stop testing deeper positions if bracket height reduction plateaus
- Skip fixing optimization if initial design already uses minimum bracket size
- Can reduce unnecessary iterations by 30-40%

#### Strategy 4: Conditional Activation
- Only enable for slabs >250mm where benefits are significant
- Skip optimization for configurations where fixing position has minimal impact
- Reduces overall computation by limiting scope

### Implementation Phases

**Phase 1 - Conservative Approach**:
- Test fixing positions only for the best 10-20 designs from initial optimization
- Maximum 3-5 fixing positions per candidate
- Expected permutations: ~300 total (50% increase over current)

**Phase 2 - Performance Monitoring**:
- Track actual computation times in production
- Adjust thresholds based on real-world performance
- Consider implementing web workers if needed

**Phase 3 - Advanced Optimization** (Future):
- Machine learning to predict optimal fixing positions
- Caching results for common configurations
- Parallel processing for independent evaluations