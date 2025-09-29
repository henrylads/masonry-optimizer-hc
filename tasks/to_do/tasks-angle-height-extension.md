## Angle Height Extension with Exclusion Zones - Implementation Tasks

### Current Situation Analysis

The masonry optimizer currently calculates bracket heights and angles for supporting masonry facades. The new requirement introduces a scenario where brackets cannot extend fully due to exclusion zones (e.g., SFS clashes). To compensate, the system needs to extend the angle's vertical leg instead of the bracket.

**Key Findings from Analysis:**
- The system uses "vertical_leg" (60-200mm) as the angle's height parameter
- Bracket height calculations exist in `bracketCalculations.ts` with complex logic for standard/inverted brackets
- Notch functionality is partially implemented with height/depth parameters
- ShapeDiver 3D visualization has comprehensive parameter mapping
- No current mechanism to limit bracket extension and compensate with angle height

**Core Requirement:**
When a bracket cannot extend to the required support level due to physical constraints, the system should:
1. Limit the bracket to a maximum allowable extension
2. Calculate the shortfall in support coverage
3. Extend the angle's vertical leg to compensate for the shortfall
4. Maintain all structural integrity checks with the modified geometry

## Relevant Files

### Core Calculation Files
- `src/calculations/bracketCalculations.ts` - Contains bracket height calculation logic that needs modification
- `src/calculations/angleCalculations.ts` - Angle-related calculations, needs extension logic
- `src/calculations/geometricCalculations.ts` - Geometric calculations that may need updates
- `src/calculations/bracketAngleSelection.ts` - Bracket/angle selection logic
- `src/calculations/verificationChecks/index.ts` - Verification checks that need updating for extended angles

### Type Definitions
- `src/types/systemInputs.ts` - Add new input parameters for max extension and angle extension toggle
- `src/types/bracketAngleTypes.ts` - Update bracket/angle types with extension properties
- `src/types/index.ts` - Export new types

### UI Components
- `src/components/masonry-designer-form.tsx` - Add form fields for new parameters
- `src/components/shapediver.tsx` - Update 3D parameter mapping for extended angles
- `src/components/results-display.tsx` - Display angle extension in results

### Optimization
- `src/calculations/bruteForceAlgorithm/index.ts` - Include angle extension in optimization
- `src/calculations/bruteForceAlgorithm/scoreResult.ts` - Update scoring for extended angles

### Tests
- `src/calculations/__tests__/bracketCalculations.test.ts` - Test bracket limitation logic
- `src/calculations/__tests__/angleExtension.test.ts` - New test file for angle extension logic
- `test-scenarios/` - Add integration test scenarios for extension feature

### Notes

- The vertical_leg parameter represents the angle height in the current system
- Extension logic must work for both standard (downward) and inverted (upward) brackets
- The notch feature must integrate seamlessly with the extension feature
- All structural verification checks must account for modified geometry
- Maintain backward compatibility - existing designs without extension limits should work unchanged

## Tasks

- [ ] 1.0 High-Level Architecture & Planning
  - [ ] 1.1 Define extension logic flow for standard brackets (extending downward)
  - [ ] 1.2 Define extension logic flow for inverted brackets (extending upward)
  - [ ] 1.3 Map interaction between notch feature and extension limits
  - [ ] 1.4 Document calculation precedence (bracket limit → angle extension → verification)
  - [ ] 1.5 Create decision matrix for when extension should be applied

- [ ] 2.0 Type System & Input Parameters
  - [ ] 2.1 Add `max_allowable_bracket_extension` parameter to systemInputs.ts (number | null)
  - [ ] 2.2 Add `enable_angle_extension` toggle parameter to systemInputs.ts (boolean)
  - [ ] 2.3 Create `AngleExtensionResult` type for calculation outputs
  - [ ] 2.4 Update `BracketCalculationResult` to include extension limitation data
  - [ ] 2.5 Add validation schemas for new input parameters
  - [ ] 2.6 Update form validation to ensure max extension is within reasonable bounds
  - [ ] 2.7 Type Safety Check: Run build to verify type compilation

- [ ] 3.0 Core Calculation Logic Implementation
  - [ ] 3.1 Create `angleExtensionCalculations.ts` module
  - [ ] 3.2 Implement `calculateBracketExtensionLimit()` function for standard brackets
  - [ ] 3.3 Implement `calculateBracketExtensionLimit()` function for inverted brackets
  - [ ] 3.4 Create `calculateRequiredAngleExtension()` function
  - [ ] 3.5 Update `bracketCalculations.ts` to apply extension limits
  - [ ] 3.6 Modify `calculateEffectiveVerticalLeg()` in angleCalculations.ts
  - [ ] 3.7 Handle edge case: extension + notch interaction
  - [ ] 3.8 Add manufacturing limits check for extended angles (max ~400mm vertical leg)
  - [ ] 3.9 Write unit tests for all new calculation functions
  - [ ] 3.10 Code Quality Check: Verify no type assertions in calculation code

- [ ] 4.0 Verification & Safety Checks Updates
  - [ ] 4.1 Update moment calculations to account for extended angle geometry
  - [ ] 4.2 Modify deflection checks for extended angles
  - [ ] 4.3 Update connection strength verification between bracket and extended angle
  - [ ] 4.4 Recalculate moment arms with modified geometry
  - [ ] 4.5 Ensure all Eurocode compliance checks work with extended angles
  - [ ] 4.6 Add specific verification for angle extension limits
  - [ ] 4.7 Write integration tests for verification checks with extensions
  - [ ] 4.8 Test Verification: Run verification check tests

- [ ] 5.0 UI Integration & User Experience
  - [ ] 5.1 Add "Max Bracket Extension" input field to masonry-designer-form.tsx
  - [ ] 5.2 Add "Enable Angle Extension" toggle to form
  - [ ] 5.3 Implement conditional field visibility (extension inputs only when enabled)
  - [ ] 5.4 Add tooltips explaining extension feature and use cases
  - [ ] 5.5 Create form validation for extension parameters
  - [ ] 5.6 Add visual indicator when extension is applied in results
  - [ ] 5.7 Show extension amounts in results display (bracket limited, angle extended)
  - [ ] 5.8 Update results comparison to show extension trade-offs
  - [ ] 5.9 Write component tests for new form fields

- [ ] 6.0 3D Visualization Updates
  - [ ] 6.1 Identify ShapeDiver parameter for angle extension visualization
  - [ ] 6.2 Update parameter mapping in shapediver.tsx for extended vertical leg
  - [ ] 6.3 Add `max_bracket_extension_visual` parameter if needed for 3D model
  - [ ] 6.4 Ensure 3D model shows correct geometry with limited bracket + extended angle
  - [ ] 6.5 Test 3D visualization with various extension scenarios
  - [ ] 6.6 Add visual indication of exclusion zones if possible in 3D model
  - [ ] 6.7 Verify notch + extension visualization works correctly

- [ ] 7.0 Optimization Algorithm Integration
  - [ ] 7.1 Update bruteForceAlgorithm to consider angle extension as optimization variable
  - [ ] 7.2 Modify fitness scoring in scoreResult.ts to account for:
    - [ ] 7.2.1 Steel savings from shorter brackets
    - [ ] 7.2.2 Steel increase from longer angles
    - [ ] 7.2.3 Manufacturing cost implications
  - [ ] 7.3 Add extension logic to optimization iteration loops
  - [ ] 7.4 Ensure optimization finds optimal balance between bracket/angle steel usage
  - [ ] 7.5 Handle cases where extension makes design infeasible
  - [ ] 7.6 Write optimization tests with extension constraints
  - [ ] 7.7 Verify optimization performance with additional variables

- [ ] 8.0 Testing & Validation
  - [ ] 8.1 Create test scenarios for standard bracket with extension limit
  - [ ] 8.2 Create test scenarios for inverted bracket with extension limit
  - [ ] 8.3 Test combination of notch + extension limit scenarios
  - [ ] 8.4 Create edge case tests:
    - [ ] 8.4.1 Extension limit makes design impossible
    - [ ] 8.4.2 Very small extension limits
    - [ ] 8.4.3 Extension limits larger than support requirements
  - [ ] 8.5 Integration test: Full workflow with extension feature
  - [ ] 8.6 Performance test: Optimization with extension constraints
  - [ ] 8.7 Create regression tests to ensure existing functionality unchanged
  - [ ] 8.8 Manual testing of UI workflows and 3D visualization
  - [ ] 8.9 Final Type Safety Check: Run full build
  - [ ] 8.10 Test Verification: Run all tests and ensure they pass