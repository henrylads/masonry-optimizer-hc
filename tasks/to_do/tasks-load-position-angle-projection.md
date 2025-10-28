## Relevant Files

- `/src/types/userInputs.ts` - Add facade_thickness, load_position, and front_offset parameters
- `/src/types/userInputs.test.ts` - Unit tests for user input types validation
- `/src/types/calculationResults.ts` - Update calculation result types for new parameters
- `/src/calculations/mathematicalModelCalculations.ts` - Update eccentricity calculation to use dynamic load position
- `/src/calculations/mathematicalModelCalculations.test.ts` - Unit tests for mathematical model calculations
- `/src/calculations/angleProjectionCalculations.ts` - New file for angle projection calculations
- `/src/calculations/angleProjectionCalculations.test.ts` - Unit tests for angle projection calculations
- `/src/calculations/bruteForceAlgorithm/index.ts` - Integrate new calculations into optimization
- `/src/calculations/bruteForceAlgorithm/index.test.ts` - Update brute force algorithm tests
- `/src/calculations/angleCalculations.ts` - Update to use dynamic angle projection
- `/src/calculations/angleCalculations.test.ts` - Update angle calculation tests
- `/src/components/masonry-designer-form.tsx` - Add new input fields to form
- `/src/app/api/optimize/route.ts` - Update API to handle new parameters

### Notes

- Unit tests should typically be placed alongside the code files they are testing
- Use `npm run test` to run all tests or `npm run test:watch` for development
- Follow the CLAUDE.md guidelines for precision (12+ decimal places for calculations)
- Maintain backward compatibility with existing calculations
- Default load_position to 1/3 for brick, 1/2 for precast/stone

## Tasks

- [ ] 1.0 Update Type Definitions and Data Models
  - [ ] 1.1 Add `facade_thickness` parameter to UserInputs interface with default 102.5mm for brick
  - [ ] 1.2 Add `load_position` parameter (0-1 range) with validation constraints
  - [ ] 1.3 Add `front_offset` parameter with default 12mm
  - [ ] 1.4 Add `isolation_shim_thickness` parameter with default 3mm
  - [ ] 1.5 Update DesignInputs type to include new parameters
  - [ ] 1.6 Create enum or constants for material types (brick, precast, stone)
  - [ ] 1.7 Write unit tests for new type validations
  - [ ] 1.8 Type Safety Check: Run `npm run build` to verify compilation

- [ ] 2.0 Implement Load Position Calculation Logic
  - [ ] 2.1 Update `calculateMathematicalModel` to accept load_position parameter
  - [ ] 2.2 Replace hardcoded `M/3` with `facade_thickness * load_position`
  - [ ] 2.3 Add material-based default logic (1/3 for brick, 1/2 for precast/stone)
  - [ ] 2.4 Update `createMathematicalModelInputs` to pass facade_thickness
  - [ ] 2.5 Add validation for load_position range (0-1)
  - [ ] 2.6 Write unit tests for different load positions
  - [ ] 2.7 Write unit tests for material-based defaults
  - [ ] 2.8 Verify calculations maintain 12+ decimal precision

- [ ] 3.0 Implement Angle Projection Calculation
  - [ ] 3.1 Create `angleProjectionCalculations.ts` with main calculation function
  - [ ] 3.2 Implement formula: `⅔ * facade_thickness + cavity - (bracket_projection + isolation_shim_thickness) + front_offset`
  - [ ] 3.3 Add rounding up to nearest 5mm increment function
  - [ ] 3.4 Create interface for angle projection inputs
  - [ ] 3.5 Create interface for angle projection results
  - [ ] 3.6 Add validation for minimum/maximum projection limits
  - [ ] 3.7 Write unit tests for standard brick scenario (102.5mm)
  - [ ] 3.8 Write unit tests for precast scenario (250mm)
  - [ ] 3.9 Write unit tests for rounding logic
  - [ ] 3.10 Verify precision requirements are met

- [ ] 4.0 Integrate Calculations into Optimization Algorithm
  - [ ] 4.1 Update `calculateDependentParameters` to use facade_thickness
  - [ ] 4.2 Pass load_position to mathematical model calculations
  - [ ] 4.3 Calculate angle projection dynamically instead of using fixed horizontal leg
  - [ ] 4.4 Update angle calculations to use calculated projection
  - [ ] 4.5 Ensure bracket projection calculation considers new parameters
  - [ ] 4.6 Update fitness evaluation to consider angle projection
  - [ ] 4.7 Write integration tests for optimization with new parameters
  - [ ] 4.8 Test edge cases (very thick facades, minimal cavities)
  - [ ] 4.9 Code Quality Check: Verify no type assertions in calculation code

- [ ] 5.0 Update User Interface and API
  - [ ] 5.1 Add facade_thickness input field to form with validation
  - [ ] 5.2 Add load_position slider/input (0-1 range) with material presets
  - [ ] 5.3 Add toggle for automatic vs manual load position
  - [ ] 5.4 Display calculated angle projection in results
  - [ ] 5.5 Update API route to accept new parameters
  - [ ] 5.6 Add API validation for new parameters
  - [ ] 5.7 Update form validation schema with Zod
  - [ ] 5.8 Add tooltips explaining load position concept
  - [ ] 5.9 Write component tests for new UI elements
  - [ ] 5.10 Write API integration tests with new parameters

- [ ] 6.0 Testing and Verification
  - [ ] 6.1 Run full test suite: `npm run test`
  - [ ] 6.2 Verify all calculations match documentation examples
  - [ ] 6.3 Test backward compatibility with existing calculations
  - [ ] 6.4 Performance testing with various parameter combinations
  - [ ] 6.5 Final Type Safety Check: `npm run build` must pass
  - [ ] 6.6 Lint Check: `npm run lint` must pass
  - [ ] 6.7 Type Assertion Review: Search for `as ` and remove from business logic
  - [ ] 6.8 Document new parameters in code comments
  - [ ] 6.9 Update API documentation if applicable
  - [ ] 6.10 Create example calculations for documentation