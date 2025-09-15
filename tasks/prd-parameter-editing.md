# Product Requirements Document: Parameter Editing Feature

## Introduction/Overview

This feature allows structural engineers to manually adjust key design parameters from an optimized masonry support design and immediately see the impact on structural verification and weight performance. Unlike the full brute force optimization which tests all permutations, this feature performs targeted verification on user-specified parameter changes, enabling engineers to apply their expertise to refine designs while maintaining structural integrity.

**Problem Statement**: Engineers sometimes need to adjust optimized designs based on site-specific constraints, material availability, or professional judgment that the optimization algorithm cannot account for. Currently, they must accept the optimized design or start a new optimization run.

**Goal**: Provide engineers with an intuitive interface to modify specific design parameters and instantly validate the structural performance and weight impact of their changes.

## Goals

1. **Enable Parameter Customization**: Allow engineers to edit bracket spacing, bracket thickness, angle thickness, and bolt diameter from optimized designs
2. **Instant Verification**: Provide immediate structural verification results without running full optimization
3. **Clear Impact Visualization**: Show weight and performance differences compared to the original optimized design
4. **Guided Problem Resolution**: When edits result in structural failures, provide clear explanations and actionable suggestions
5. **Design Flexibility**: Allow multiple iterations and easy reversion to original optimized design

## User Stories

1. **As a structural engineer**, I want to increase the bracket thickness from the optimized design because I have thicker material available on site, so that I can use existing inventory without compromising structural integrity.

2. **As a project manager**, I want to see how changing the bolt diameter affects both structural performance and material weight, so that I can make informed cost-benefit decisions.

3. **As a senior engineer**, I want to adjust multiple parameters based on my experience and immediately see if the design still passes all verification checks, so that I can apply professional judgment to the optimization results.

4. **As a design engineer**, I want clear feedback when my parameter changes cause structural failures, so that I can understand what went wrong and how to fix it.

5. **As a user**, I want to easily revert to the original optimized design if my changes don't work out, so that I don't lose the known-good solution.

## Functional Requirements

### Core Editing Functionality
1. **Parameter Identification**: System must display pencil/edit icons next to the four editable parameters (bracket spacing, bracket thickness, angle thickness, bolt diameter) in the results display
2. **Inline Editing**: System must provide inline edit controls that allow direct modification of parameter values
3. **Real-time Validation**: System must run verification checks immediately when parameters are changed
4. **Instant Results**: System must display updated structural verification and weight calculations within 2 seconds of parameter change

### Comparison and Visualization
5. **Side-by-side Comparison**: System must display a comparison table showing:
   - Original optimized design values
   - New edited design values
   - Weight difference (kg/m and percentage)
   - Key utilization percentages
   - Pass/fail status for each verification check

6. **Change Highlighting**: System must clearly indicate which parameters have been modified from the original design

### Error Handling and Guidance
7. **Failure Indication**: When edited design fails verification checks, system must:
   - Clearly show which specific checks failed
   - Highlight the failure reasons in plain language
   - Identify which parameter changes contributed to the failure

8. **Improvement Suggestions**: System must provide actionable suggestions for fixing failed designs when possible, such as:
   - "Increase bracket thickness to at least X mm to pass moment resistance check"
   - "Reduce bracket spacing to improve shear capacity"

### User Experience
9. **Design Reversion**: System must provide a clear "Revert to Original" button that restores all parameters to the optimized values
10. **Multiple Iterations**: System must allow users to make sequential parameter changes and see cumulative effects
11. **Change Tracking**: System must maintain a record of what has been changed from the original working design

### Integration Requirements
12. **Workflow Availability**: Feature must be available in all workflow modes (manual, AI-assisted, fully-automated)
13. **Activation Condition**: Feature must only be available after a successful optimization has completed
14. **Results Integration**: Edited design results must integrate seamlessly with existing results display components

## Non-Goals (Out of Scope)

- **Full Re-optimization**: This feature will not re-run the complete brute force algorithm
- **Additional Parameter Types**: Only the four specified parameters will be editable (bracket spacing, bracket thickness, angle thickness, bolt diameter)
- **Design Comparison History**: Will not maintain a history of multiple design variations beyond original vs. current
- **Advanced Parameter Constraints**: Will not include complex parameter interdependency validation beyond basic structural checks
- **Cost Analysis**: Will not include detailed cost impact analysis beyond weight differences
- **Export Functionality**: Will not include separate export options for edited designs

## Design Considerations

### User Interface
- **Visual Hierarchy**: Edit icons should be subtle but discoverable, using standard pencil/edit iconography
- **Inline Controls**: Parameter editing should feel natural and not disrupt the flow of reviewing results
- **Responsive Design**: Comparison table must work effectively on both desktop and tablet devices

### Technical Architecture
- **Performance**: Verification calculations must complete quickly (< 2 seconds) to maintain real-time feel
- **State Management**: Must properly handle parameter state, comparison state, and reversion functionality
- **Error Boundaries**: Must gracefully handle calculation errors without breaking the entire results display

## Technical Considerations

### Calculation Engine
- **Verification Integration**: Must use the existing `verifyAll` function from the verification checks module
- **Weight Calculation**: Must integrate with steel weight analysis functions
- **Parameter Validation**: Must validate parameter inputs against engineering constraints

### Data Flow
- **Input Validation**: Parameter changes must be validated before running verification
- **Result Caching**: Original optimized results should be cached for comparison and reversion
- **State Synchronization**: UI state must remain consistent across parameter changes

### Dependencies
- **Existing Verification System**: Builds on current `verificationChecks` module
- **Results Display**: Integrates with existing `ResultsDisplay` component
- **Form Validation**: May reuse validation logic from existing form components

## Success Metrics

### User Engagement
- **Feature Adoption**: 60% of users who view optimization results attempt parameter editing within first month
- **Successful Edits**: 80% of parameter edits result in structurally valid designs
- **Reversion Rate**: Less than 30% of edits are reverted, indicating users find value in their changes

### Performance Metrics
- **Response Time**: 95% of verification calculations complete within 2 seconds
- **Calculation Accuracy**: 100% consistency between parameter editing verification and full optimization verification for equivalent parameters

### User Satisfaction
- **Error Resolution**: 70% of failed designs can be fixed using provided suggestions
- **Workflow Integration**: Feature usage occurs in all three workflow modes without user confusion

## Open Questions

1. **Parameter Ranges**: Should there be hard limits on parameter values, or should the system allow any value and let verification checks determine validity?

2. **Bulk Editing**: Should users be able to edit multiple parameters simultaneously, or should changes be applied one at a time?

3. **Undo Functionality**: Beyond reverting to original, should there be step-by-step undo capability for multiple sequential edits?

4. **Mobile Experience**: How should the comparison table and inline editing work on mobile devices?

5. **Integration with AI Tools**: Should parameter editing be integrated with the AI tools functionality for guided suggestions?

---

**Document Version**: 1.0  
**Last Updated**: [Current Date]  
**Target Release**: Next Sprint  
**Priority**: High 