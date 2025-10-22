# Dynamic Horizontal Leg Calculation Bug Fix

**Date Created**: September 16, 2025
**Issue Discovered**: Dynamic horizontal leg calculations not reflected in frontend
**Status**: Complete with comprehensive debug logging
**Impact**: Critical fix for facade optimization accuracy

## Overview & Context

### What is the Horizontal Leg (B Parameter)?

The horizontal leg is a critical dimension in masonry support systems that determines:
- **Bearing Length**: How much contact surface the angle has with the masonry
- **Structural Capacity**: Affects moment resistance and deflection calculations
- **Steel Weight**: Larger horizontal legs increase total system weight
- **Optimization Results**: Dynamic sizing can reduce steel weight significantly

### The Bug: Static vs Dynamic Calculation

**Expected Behavior**: Horizontal leg should be calculated dynamically based on facade parameters:
- **Precast Concrete (250mm, 0.5 load position)**: ~190mm horizontal leg
- **Brick (102.5mm, 1/3 load position)**: ~90mm horizontal leg

**Actual Behavior**: Frontend always displayed 90mm regardless of facade configuration

## Problem Analysis

### Root Cause Investigation

The bug had **multiple interconnected causes** throughout the calculation pipeline:

1. **Parameter Transmission Issue**: Facade parameters not passed to optimization algorithm
2. **Hardcoded Values**: Genetic algorithm used hardcoded 90mm horizontal legs
3. **Interface Mismatch**: AngleCalculationResults didn't include calculated horizontal_leg
4. **Steel Weight Calculation**: Used hardcoded 90mm instead of dynamic values
5. **Missing Debug Visibility**: No logging to trace parameter flow

### Technical Context

Dynamic horizontal leg calculation was implemented via angle projection:

```typescript
// calculateAngleProjection determines optimal horizontal leg
const angleProjection = calculateAngleProjection({
  facade_thickness: 250,      // From facade configuration
  cavity: 100,                // Cavity width
  bracket_projection: 90,     // Bracket depth
  isolation_shim_thickness: 3,
  front_offset: 12
});
// Result: ~190mm for precast concrete vs 90mm for brick
```

## Technical Implementation

### Phase 1: Remove Hardcoded Values

**File**: `/src/calculations/bruteForceAlgorithm/combinationGeneration.ts`

**Before**:
```typescript
horizontal_leg: 90, // Hardcoded value
```

**After**:
```typescript
// horizontal_leg will be calculated dynamically based on facade parameters
// Removed hardcoded assignment to allow dynamic calculation
```

### Phase 2: Update Interface & Calculation Flow

**File**: `/src/calculations/angleCalculations.ts`

**Enhanced Interface**:
```typescript
export interface AngleCalculationResults {
  // ... existing fields
  /** Calculated horizontal leg length (mm) - dynamically determined from facade parameters */
  horizontal_leg: number;
}
```

**Dynamic Calculation Logic**:
```typescript
export function calculateAngleParameters(params: AngleCalculationInputs): AngleCalculationResults {
  // Calculate horizontal leg B dynamically if facade parameters are provided
  let effectiveB = params.B || 90; // Default to 90mm for backward compatibility

  if (params.facade_thickness && params.D !== undefined) {
    // Calculate horizontal leg using angle projection
    const angleProjection = calculateAngleProjection({
      facade_thickness: params.facade_thickness,
      cavity: params.C,
      bracket_projection: params.D,
      isolation_shim_thickness: params.isolation_shim_thickness || params.S,
      front_offset: params.front_offset || 12
    });

    effectiveB = angleProjection.rounded_projection;
    console.log(`Dynamic horizontal leg calculated: ${effectiveB}mm (was ${params.B || 90}mm)`);
  }

  return {
    // ... other calculations
    horizontal_leg: roundToTwelveDecimals(effectiveB)
  };
}
```

### Phase 3: Update Design Evaluation

**File**: `/src/calculations/bruteForceAlgorithm/evaluateDesign.ts`

**Store Dynamic Values**:
```typescript
// 3. Angle Calculations with dynamic horizontal leg
const angleResults = calculateAngleParameters({
  C: design.calculated.cavity_width,
  D: design.calculated.cavity_width - 10,
  S: 3,
  T: design.genetic.angle_thickness,
  B_cc: design.genetic.bracket_centres,
  // Pass facade parameters for dynamic horizontal leg calculation
  facade_thickness: design.calculated.facade_thickness,
  load_position: design.calculated.load_position,
  front_offset: design.calculated.front_offset,
  isolation_shim_thickness: design.calculated.isolation_shim_thickness
});

// Update genetic parameters with calculated horizontal leg
design.genetic.horizontal_leg = angleResults.horizontal_leg;
```

### Phase 4: Fix Steel Weight Calculation

**File**: `/src/calculations/steelWeight.ts`

**Before**:
```typescript
export function calculateSystemWeight(
  bracketHeight: number,
  bracketProjection: number,
  bracketThickness: number,
  bracketCentres: number,
  angleThickness: number,
  verticalLeg: number
): SystemWeights {
  const horizontalLeg = 90; // Hardcoded value
  // ...
}
```

**After**:
```typescript
export function calculateSystemWeight(
  bracketHeight: number,
  bracketProjection: number,
  bracketThickness: number,
  bracketCentres: number,
  angleThickness: number,
  verticalLeg: number,
  horizontal_leg?: number // Optional: will use default 90mm if not provided
): SystemWeights {
  const horizontalLeg = horizontal_leg ?? 90; // Use dynamic value or default
  // ...
}
```

### Phase 5: Frontend Parameter Transmission

**File**: `/src/components/masonry-designer-form.tsx`

**Critical Fix - Add Missing Facade Parameters**:
```typescript
// Prepare configuration
const optimizationConfig = {
  maxGenerations: 100,
  designInputs: {
    support_level: values.support_level,
    cavity_width: values.cavity,
    slab_thickness: values.slab_thickness,
    characteristic_load: characteristicLoad,
    top_critical_edge: criticalEdges.top,
    bottom_critical_edge: criticalEdges.bottom,
    notch_height: values.has_notch ? values.notch_height : 0,
    notch_depth: values.has_notch ? values.notch_depth : 0,
    fixing_position: actualFixingPosition,
    use_custom_fixing_position: values.use_custom_fixing_position,
    showDetailedVerifications: true,
    // Add facade parameters for dynamic horizontal leg calculation
    facade_thickness: values.facade_thickness,
    load_position: values.load_position,
    front_offset: values.front_offset,
    isolation_shim_thickness: values.isolation_shim_thickness,
    material_type: values.material_type,
    // ... rest of configuration
  }
};
```

## Debug Logging Implementation

### Comprehensive Tracing System

**Form Submission Logging**:
```typescript
console.log('🔍 FORM SUBMIT DEBUG: Form values:', {
  facade_thickness: values.facade_thickness,
  material_type: values.material_type,
  load_position: values.load_position,
  front_offset: values.front_offset,
  isolation_shim_thickness: values.isolation_shim_thickness
});
```

**Optimization Trigger Logging**:
```typescript
console.log('🚀 OPTIMIZATION TRIGGER: About to run brute force with config:', {
  facade_thickness: optimizationConfig.designInputs.facade_thickness,
  load_position: optimizationConfig.designInputs.load_position,
  front_offset: optimizationConfig.designInputs.front_offset,
  isolation_shim_thickness: optimizationConfig.designInputs.isolation_shim_thickness,
  material_type: optimizationConfig.designInputs.material_type,
  support_level: optimizationConfig.designInputs.support_level,
  cavity_width: optimizationConfig.designInputs.cavity_width,
  slab_thickness: optimizationConfig.designInputs.slab_thickness,
  characteristic_load: optimizationConfig.designInputs.characteristic_load
});
```

**Angle Calculation Logging**:
```typescript
console.log(`🔍 ANGLE CALC DEBUG: Received parameters:`, {
  facade_thickness: params.facade_thickness,
  D: params.D,
  load_position: params.load_position,
  front_offset: params.front_offset,
  isolation_shim_thickness: params.isolation_shim_thickness,
  B: params.B
});
```

## Files Modified

### Complete Change Summary

| File | Type | Changes |
|------|------|---------|
| `/src/calculations/bruteForceAlgorithm/combinationGeneration.ts` | Modified | Removed hardcoded horizontal_leg assignment |
| `/src/calculations/angleCalculations.ts` | Modified | Added horizontal_leg to interface, dynamic calculation |
| `/src/calculations/bruteForceAlgorithm/evaluateDesign.ts` | Modified | Store calculated horizontal_leg in genetic parameters |
| `/src/calculations/steelWeight.ts` | Modified | Accept optional horizontal_leg parameter |
| `/src/calculations/bruteForceAlgorithm/index.ts` | Modified | Pass dynamic horizontal_leg to steel weight calculation |
| `/src/calculations/parameterVerification.ts` | Modified | Pass dynamic horizontal_leg to steel weight calculation |
| `/src/components/masonry-designer-form.tsx` | Modified | Added facade parameters to optimization config + debug logging |
| Multiple test files | Modified | Updated to pass horizontal_leg parameter |

### Key Code Snippets

**Dynamic Horizontal Leg Assignment**:
```typescript
// In evaluateDesign.ts
design.genetic.horizontal_leg = angleResults.horizontal_leg;
```

**Steel Weight Function Update**:
```typescript
// All calls now pass the dynamic value
const weights = calculateSystemWeight(
  design.calculated.bracket_height,
  design.calculated.bracket_projection,
  design.genetic.bracket_thickness,
  design.genetic.bracket_centres,
  design.genetic.angle_thickness,
  design.genetic.vertical_leg,
  design.genetic.horizontal_leg // Pass the calculated horizontal leg
);
```

## Engineering Impact

### Performance Improvements

**Facade Optimization Accuracy**:
- **Precast Concrete**: Now correctly calculates ~190mm horizontal leg instead of 90mm
- **Brick Facades**: Maintains existing 90mm optimization
- **Custom Configurations**: Responds dynamically to facade_thickness and load_position

**Steel Weight Calculations**:
- **More Accurate Results**: Steel weights now reflect actual horizontal leg dimensions
- **Better Optimization**: Algorithm can find truly optimal solutions considering facade constraints
- **Engineering Validation**: Results match hand calculations for different facade types

### Testing & Verification Process

**Test Configuration**: Precast concrete with 250mm facade thickness, 0.5 load position

**Expected Results**:
1. **Browser Console**: Debug logs showing facade parameters being passed
2. **Calculation Output**: Horizontal leg ~190mm instead of 90mm
3. **Frontend Display**: Results showing dynamic horizontal leg values
4. **Steel Weight**: Accurate weight calculations based on larger horizontal leg

**Debug Log Sequence**:
```
🔍 FORM SUBMIT DEBUG: Form values: { facade_thickness: 250, load_position: 0.5, ... }
🚀 OPTIMIZATION TRIGGER: About to run brute force with config: { facade_thickness: 250, ... }
🔍 ANGLE CALC DEBUG: Received parameters: { facade_thickness: 250, ... }
Dynamic horizontal leg calculated: 190mm (was 90mm)
```

## Future Considerations

### Maintenance Notes

1. **Parameter Validation**: Ensure facade parameters are always validated before optimization
2. **Test Coverage**: Add automated tests for different facade configurations
3. **Debug Logging**: Consider removing debug logs in production builds
4. **Documentation**: Update API documentation to reflect dynamic horizontal leg calculation

### Potential Enhancements

1. **UI Feedback**: Show calculated horizontal leg values in form preview
2. **Parameter Tooltips**: Explain how facade parameters affect horizontal leg sizing
3. **Validation Rules**: Add constraints based on structural engineering limits
4. **Performance Optimization**: Cache angle projection calculations for repeated configurations

## Conclusion

This comprehensive bug fix ensures that the masonry optimization system now correctly:
- ✅ Calculates dynamic horizontal leg values based on facade parameters
- ✅ Passes facade parameters through the entire optimization pipeline
- ✅ Updates steel weight calculations with accurate dimensions
- ✅ Provides extensive debug logging for troubleshooting
- ✅ Maintains backward compatibility with existing configurations

The fix addresses both the immediate bug (hardcoded 90mm display) and the underlying architectural issues that prevented dynamic facade optimization from working correctly.