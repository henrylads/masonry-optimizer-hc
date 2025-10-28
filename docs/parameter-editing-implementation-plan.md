# Parameter Editing Implementation Plan

## Overview

This document outlines the implementation plan for adding user parameter editing functionality to the masonry optimizer. This feature will allow engineers to modify specific parameters from an optimized design, validate the changes through structural verification, and see real-time updates in the 3D ShapeDiver model.

## Feature Requirements

### Core Functionality
- **Editable Parameters**: Allow users to modify key genetic algorithm parameters (bracket_centres, bracket_thickness, angle_thickness, etc.)
- **Real-time Validation**: Run modified designs through `verifyAll` to ensure structural soundness
- **3D Model Updates**: Automatically update ShapeDiver visualization with new parameters
- **Output Recalculation**: Get updated weight, carbon, and other metrics from ShapeDiver
- **Visual Feedback**: Clear indication of modified vs. original values and validation status

### User Experience Goals
- **Intuitive Interface**: Click-to-edit functionality with clear visual cues
- **Immediate Feedback**: Real-time validation status and error messaging
- **Reversible Changes**: Easy way to revert to original optimized values
- **Engineering Confidence**: Full transparency of verification results

## Implementation Phases

### Phase 1: Core Infrastructure
**Estimated Time**: 2-3 days

#### Backend Functions
- [ ] **Create verification wrapper function**
  - [ ] `src/calculations/parameterModification/verifyModifiedDesign.ts`
  - [ ] Function signature: `verifyModifiedDesign(modifiedGenetic, originalInputs): Promise<VerificationResults>`
  - [ ] Handle all intermediate calculations (bracket, angle, math model)
  - [ ] Return detailed verification results and validation status

- [ ] **Create parameter validation functions**
  - [ ] `src/calculations/parameterModification/validateParameters.ts`
  - [ ] Validate ranges for each editable parameter
  - [ ] Check interdependencies (e.g., bracket_centres vs characteristic_load limits)
  - [ ] Return validation errors with user-friendly messages

- [ ] **Create parameter recalculation utilities**
  - [ ] `src/calculations/parameterModification/recalculateDesign.ts`
  - [ ] Function to recalculate all dependent parameters when genetic params change
  - [ ] Ensure proper precision handling and rounding
  - [ ] Maintain consistency with existing calculation pipeline

#### Type Definitions
- [ ] **Extended types for parameter editing**
  - [ ] `src/types/parameter-editing.ts`
  - [ ] `ModifiedDesignState` interface
  - [ ] `ParameterValidationResult` interface
  - [ ] `EditableParameter` enum or union type
  - [ ] `ParameterEditMode` interface

### Phase 2: UI Components
**Estimated Time**: 3-4 days

#### Core Edit Components
- [ ] **Create editable parameter component**
  - [ ] `src/components/ui/editable-parameter.tsx`
  - [ ] Props: value, onEdit, isEditing, validationStatus, etc.
  - [ ] Handle different input types (number, select, etc.)
  - [ ] Built-in validation feedback
  - [ ] Loading states during verification

- [ ] **Create parameter group component**
  - [ ] `src/components/ui/parameter-group.tsx`
  - [ ] Group related parameters (bracket config, angle config, etc.)
  - [ ] Handle group-level validation
  - [ ] Show modified indicators at group level

- [ ] **Create verification status component**
  - [ ] `src/components/ui/verification-status.tsx`
  - [ ] Show overall validation status
  - [ ] Display specific check failures
  - [ ] Progress indicator during verification

#### Integration with Results Display
- [ ] **Modify results-display.tsx**
  - [ ] Add state management for editing mode
  - [ ] Replace static parameter displays with editable components
  - [ ] Add "Edit Parameters" toggle button
  - [ ] Implement parameter modification handlers

- [ ] **Add comparison view**
  - [ ] Show original vs. modified values
  - [ ] Highlight changes with visual indicators
  - [ ] Add "Reset to Original" functionality

### Phase 3: ShapeDiver Integration
**Estimated Time**: 2 days

#### Parameter Synchronization
- [ ] **Enhance ShapeDiver parameter mapping**
  - [ ] Ensure `paramIdMapping` handles all editable parameters
  - [ ] Add proper validation for ShapeDiver parameter ranges
  - [ ] Handle parameter transformation edge cases

- [ ] **Real-time model updates**
  - [ ] Trigger ShapeDiver recalculation when parameters change
  - [ ] Handle loading states during model regeneration
  - [ ] Error handling for invalid ShapeDiver parameters

- [ ] **Output synchronization**
  - [ ] Update calculation results when ShapeDiver outputs change
  - [ ] Maintain consistency between verification results and model outputs
  - [ ] Handle cases where ShapeDiver and verification disagree

### Phase 4: User Experience Enhancements
**Estimated Time**: 2-3 days

#### Advanced UI Features
- [ ] **Bulk parameter editing**
  - [ ] Allow editing multiple parameters simultaneously
  - [ ] Batch validation to avoid multiple verification runs
  - [ ] Confirm/cancel workflow for bulk changes

- [ ] **Parameter constraints and suggestions**
  - [ ] Show valid ranges for each parameter
  - [ ] Suggest alternative values if validation fails
  - [ ] Progressive disclosure of advanced parameters

- [ ] **Change history**
  - [ ] Track parameter modification history
  - [ ] Allow stepping back through changes
  - [ ] Export modified design configurations

#### Error Handling and Recovery
- [ ] **Comprehensive error handling**
  - [ ] Network errors during verification
  - [ ] ShapeDiver connection issues
  - [ ] Calculation failures
  - [ ] User-friendly error messages

- [ ] **Graceful degradation**
  - [ ] Fallback behavior when ShapeDiver unavailable
  - [ ] Partial functionality if some verifications fail
  - [ ] Clear communication of system limitations

### Phase 5: Testing and Validation
**Estimated Time**: 2-3 days

#### Unit Tests
- [ ] **Test verification wrapper functions**
  - [ ] `src/calculations/parameterModification/__tests__/verifyModifiedDesign.test.ts`
  - [ ] Test with valid and invalid parameter combinations
  - [ ] Verify calculation precision and rounding
  - [ ] Test error handling and edge cases

- [ ] **Test parameter validation**
  - [ ] `src/calculations/parameterModification/__tests__/validateParameters.test.ts`
  - [ ] Test range validation for all parameters
  - [ ] Test interdependency validation
  - [ ] Test validation error messages

#### Integration Tests
- [ ] **Test UI components**
  - [ ] `src/components/ui/__tests__/editable-parameter.test.tsx`
  - [ ] Test editing workflow
  - [ ] Test validation feedback
  - [ ] Test loading states

- [ ] **Test ShapeDiver integration**
  - [ ] Test parameter updates trigger model refresh
  - [ ] Test output synchronization
  - [ ] Test error handling

#### End-to-End Tests
- [ ] **Complete user workflows**
  - [ ] Edit parameter → verify → update model → review results
  - [ ] Multiple parameter modifications
  - [ ] Error recovery scenarios
  - [ ] Performance with complex designs

## Technical Implementation Details

### State Management Architecture

```typescript
// In results-display.tsx
interface ParameterEditingState {
  editMode: string | null;
  modifiedParams: Partial<OptimisationResult['genetic']>;
  originalParams: OptimisationResult['genetic'];
  isVerifying: boolean;
  verificationStatus: 'valid' | 'invalid' | 'checking' | null;
  validationErrors: Record<string, string>;
  changeHistory: ParameterChange[];
}
```

### Key Functions to Implement

1. **`verifyModifiedDesign(modifiedGenetic, originalInputs)`**
   - Calculate dependent parameters
   - Run full verification pipeline
   - Return structured results

2. **`validateParameterChange(paramKey, newValue, currentParams)`**
   - Range validation
   - Interdependency checks
   - Return validation result

3. **`createModifiedShapeDiverParams(modifiedResult)`**
   - Transform modified parameters to ShapeDiver format
   - Handle parameter mapping and validation

4. **`handleParameterUpdate(paramKey, newValue)`**
   - Main orchestration function
   - Coordinate validation, verification, and UI updates

### Error Handling Strategy

1. **Validation Errors**: Show inline with parameter
2. **Verification Errors**: Show in verification status component
3. **ShapeDiver Errors**: Show in model viewer area
4. **Network Errors**: Show global notification with retry option

### Performance Considerations

1. **Debounced Validation**: Avoid excessive verification calls
2. **Selective Updates**: Only recalculate what's necessary
3. **Progressive Enhancement**: Core functionality works without ShapeDiver
4. **Loading States**: Clear feedback during calculations

## Risk Mitigation

### Technical Risks
- [ ] **Calculation consistency**: Ensure modified designs use same calculation pipeline as optimization
- [ ] **Parameter interdependencies**: Handle complex relationships between parameters
- [ ] **ShapeDiver limitations**: Account for parameter range restrictions

### User Experience Risks
- [ ] **Overwhelming complexity**: Progressive disclosure of advanced features
- [ ] **Unclear validation**: Clear, actionable error messages
- [ ] **Data loss**: Auto-save and change tracking

### Performance Risks
- [ ] **Slow verification**: Optimization and caching strategies
- [ ] **Heavy 3D model updates**: Efficient parameter batching
- [ ] **Memory usage**: Proper cleanup of calculation results

## Success Criteria

### Functional Requirements
- [ ] Users can edit key genetic parameters
- [ ] Modified designs are validated in real-time
- [ ] 3D model updates automatically with parameter changes
- [ ] ShapeDiver outputs (weight, carbon) recalculate correctly
- [ ] Users can revert to original optimized values

### Performance Requirements
- [ ] Parameter validation completes within 100ms
- [ ] Verification completes within 2 seconds
- [ ] ShapeDiver model updates within 5 seconds
- [ ] UI remains responsive during calculations

### Quality Requirements
- [ ] Zero calculation errors compared to optimization pipeline
- [ ] Comprehensive error handling with user-friendly messages
- [ ] Consistent visual design with existing UI
- [ ] Full test coverage of core functionality

## Future Enhancements

### Phase 6: Advanced Features (Future)
- [ ] **What-if scenarios**: Compare multiple parameter variations
- [ ] **Optimization constraints**: Re-run optimization with user constraints
- [ ] **Export modified designs**: Save and share parameter modifications
- [ ] **Parameter recommendations**: AI-powered suggestions for improvements
- [ ] **Collaboration features**: Share and comment on parameter modifications

## Conclusion

This implementation plan provides a structured approach to adding parameter editing functionality while maintaining the engineering rigor and validation that makes the masonry optimizer trustworthy. The phased approach allows for iterative development and testing, ensuring each component works correctly before moving to the next phase.

The feature will significantly enhance the user experience by allowing engineers to apply their domain knowledge while maintaining full structural verification and real-time 3D visualization. 