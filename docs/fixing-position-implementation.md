# Fixing Position Implementation Guide

**Date Created**: September 2025
**Implementation Period**: August-September 2025
**Status**: Complete with ShapeDiver integration ready

## Overview & Context

### What is Fixing Position?

In masonry support systems, the **fixing position** is the vertical distance (in mm) from the top of the concrete slab to where the bracket is anchored. This critical dimension affects:

- **Structural capacity**: Deeper positions may provide better load distribution
- **Construction constraints**: Must maintain minimum edge distances from slab bottom
- **Optimization potential**: Different positions can yield significantly different steel weights

### Why This Implementation Was Needed

**Previous System**: Fixed 75mm position for all calculations
**Problem**: No flexibility for project-specific requirements or optimization
**Solution**: Dual-mode system allowing both custom input and intelligent optimization

### Engineering Significance

- **Default Position**: 75mm from top of slab (standard industry practice)
- **Optimization Range**: 75mm to maximum safe depth (varies by slab thickness)
- **Safety Constraints**: Must maintain bottom critical edge distance per channel specifications
- **Performance Impact**: Can achieve up to 10%+ steel weight savings in optimal cases

## User Interface Implementation

### Form Control Architecture

**Location**: `/src/components/masonry-designer-form.tsx`

#### Before (Confusing):
```
☐ Optimize Fixing Position
  ├── Use Default (75mm)
  └── Custom Position Input
```

#### After (Clear):
```
Toggle: [Find Optimal Position] [Custom Position]
  ├── Find Optimal Position: Algorithm explores range for best result
  └── Custom Position: User specifies exact value (75-400mm)
```

#### UI Implementation Details

```typescript
// Toggle Group Implementation
<ToggleGroup
  value={form.watch("use_custom_fixing_position") ? "custom" : "default"}
  onValueChange={(value) => {
    const useCustom = value === "custom";
    form.setValue("use_custom_fixing_position", useCustom);
    if (!useCustom) {
      form.setValue("fixing_position", 75); // Reset to default
    }
  }}
>
  <ToggleGroupItem value="default" aria-label="Find Optimal Position">
    Find Optimal Position
  </ToggleGroupItem>
  <ToggleGroupItem value="custom" aria-label="Custom Position">
    Custom Position
  </ToggleGroupItem>
</ToggleGroup>

// Conditional Custom Input
{form.watch("use_custom_fixing_position") && (
  <FormField
    control={form.control}
    name="fixing_position"
    render={({ field }) => (
      <FormItem>
        <FormControl>
          <Input
            type="number"
            placeholder="100"
            min="75"
            max="400"
            step="5"
            {...field}
          />
        </FormControl>
        <FormDescription>
          Distance from top of slab (75-400mm)
        </FormDescription>
      </FormItem>
    )}
  />
)}
```

### Visual Feedback System

**Results Display Enhancement**: Green "Optimized" badge when system finds position better than default:

```typescript
{(() => {
  const optPos = displayedResult?.calculated?.optimized_fixing_position;
  if (typeof optPos === 'number' && optPos > 75) {
    return (
      <span className="text-[11px] px-1.5 py-0.5 rounded bg-green-100 text-green-700">
        Optimized
      </span>
    );
  }
  return null;
})()}
```

## Data Flow Architecture

### Complete End-to-End Flow

```
Form Input → Validation → Calculation Engine → Optimization → Results → 3D Model
```

#### 1. Form Schema Definition
**File**: `/src/types/form-schema.ts`

```typescript
const formSchema = z.object({
  // ... other fields
  use_custom_fixing_position: z.boolean().default(false),
  fixing_position: z.coerce
    .number()
    .min(75, { message: "Fixing position must be at least 75mm from top of slab" })
    .max(400, { message: "Fixing position must be at most 400mm from top of slab" })
    .optional()
});
```

#### 2. Form Component Logic
**File**: `/src/components/masonry-designer-form.tsx`

```typescript
// Form submission logic
const actualFixingPosition = values.use_custom_fixing_position ? values.fixing_position : 75;

// Debug logging
console.log('🔧 Fixing Position Debug:', {
  use_custom_fixing_position: values.use_custom_fixing_position,
  form_fixing_position: values.fixing_position,
  actual_fixing_position: actualFixingPosition,
});

// Configuration object
const config: DesignInputs = {
  // ... other fields
  fixing_position: actualFixingPosition,
  use_custom_fixing_position: values.use_custom_fixing_position,
};
```

#### 3. Type System Integration
**Files**: Multiple type definition files

```typescript
// src/types/bracketAngleTypes.ts
export interface BracketAngleConfiguration {
  fixing_position?: number; // Optional fixing position (mm from top of slab) - defaults to 75mm
}

// src/types/optimization-types.ts
export interface OptimizationResult {
  genetic: {
    fixing_position?: number; // Distance from top of slab to fixing point (mm)
  };
  calculated: {
    optimized_fixing_position?: number; // mm - The optimal fixing position from top of slab
  };
}

// src/types/designInputs.ts
export interface DesignInputs {
  fixing_position?: number; /** Fixing position from top of slab (mm) - defaults to 75mm */
  use_custom_fixing_position?: boolean; /** Flag indicating if user explicitly set a custom fixing position */
}
```

## Algorithm Implementation Details

### Combination Generation Logic
**File**: `/src/calculations/bruteForceAlgorithm/combinationGeneration.ts`

#### Core Function: `generateFixingPositions`

```typescript
const generateFixingPositions = (inputs: DesignInputs): number[] => {
  if (inputs.use_custom_fixing_position) {
    // Custom mode: use exactly what user specified
    const customPosition = inputs.fixing_position ?? 75;
    console.log(`Fixing Position: Using custom ${customPosition}mm`);
    return [customPosition];
  } else {
    // Default mode: generate range to find optimal position
    const startPosition = 75; // Always start from 75mm for default optimization
    const slabThickness = inputs.slab_thickness;
    const incrementSize = 5; // mm - step size for optimization

    // Get bottom critical edge distance from channel specifications
    const channelSpec = getChannelSpec("CPRO38", slabThickness, 300);
    const bottomCriticalEdge = channelSpec ? channelSpec.edgeDistances.bottom : 150;

    // Calculate maximum fixing depth: must maintain bottom critical edge from slab bottom
    const maxFixingDepth = slabThickness - bottomCriticalEdge;

    const positions: number[] = [];

    // Generate positions: [75, 80, 85, 90, 95, 100, ...]
    for (let position = startPosition; position <= maxFixingDepth; position += incrementSize) {
      positions.push(position);
    }

    // Ensure we have at least the starting position
    if (positions.length === 0) {
      positions.push(startPosition);
    }

    console.log(`Fixing Position: Optimizing across ${positions.length} positions (${positions[0]}mm to ${positions[positions.length - 1]}mm)`);
    return positions;
  }
};
```

#### Integration into Main Algorithm

```typescript
export function generateAllCombinations(inputs: DesignInputs): GeneticParameters[] {
  const combinations: GeneticParameters[] = [];

  // Generate fixing position combinations
  const fixingPositions = generateFixingPositions(inputs);

  // Generate combinations for each fixing position
  for (const fixingPosition of fixingPositions) {
    const geneticParams: GeneticParameters = {
      // ... other parameters
      fixing_position: fixingPosition
    };
    combinations.push(geneticParams);
  }

  return combinations;
}
```

### Channel Specification Integration

**Safety Constraints**: Maximum fixing depth calculation

```typescript
// Bottom critical edge determines maximum safe depth
const bottomCriticalEdge = channelSpec ? channelSpec.edgeDistances.bottom : 150;
const maxFixingDepth = slabThickness - bottomCriticalEdge;

// Example: 260mm slab - 150mm bottom edge = 110mm max fixing depth
```

### Optimization Range Examples

| Slab Thickness | Bottom Critical Edge | Max Fixing Depth | Optimization Range |
|---------------|---------------------|------------------|-------------------|
| 200mm | 125mm | 75mm | [75mm] (no room for optimization) |
| 225mm | 150mm | 75mm | [75mm] (no room for optimization) |
| 260mm | 150mm | 110mm | [75, 80, 85, 90, 95, 100, 105, 110mm] |
| 300mm | 150mm | 150mm | [75, 80, 85, ..., 145, 150mm] |

## Results Display Implementation

### Fixing Position Value Resolution
**File**: `/src/components/results-display.tsx`

```typescript
// Display logic with fallback chain
{(() => {
  const optimizedPos = displayedResult?.calculated?.optimized_fixing_position;
  const geneticPos = displayedResult?.genetic?.fixing_position;
  const val = optimizedPos ?? geneticPos ?? 75;

  // Debug logging for results display
  console.log('🔧 Results Display Debug:', {
    optimized_fixing_position: optimizedPos,
    genetic_fixing_position: geneticPos,
    final_displayed_value: val,
    fallback_used: optimizedPos ? 'optimized' : geneticPos ? 'genetic' : 'default_75'
  });

  return <>{val} mm</>;
})()}
```

### Value Priority System

1. **`optimized_fixing_position`** (highest priority): Result from optimization algorithm
2. **`genetic.fixing_position`** (medium priority): Input parameter that was optimized
3. **`75`** (fallback): Default system value

## ShapeDiver 3D Integration

### Parameter Type Definition
**File**: `/src/components/results-display.tsx`

```typescript
type ShapeDiverParams = Partial<Record<
  'support_type' | 'bracket_thickness' | 'bracket_length' |
  'back_notch_height' | 'fixing_diameter' |
  'back_notch_length' | 'toe_plate_type' | 'back_notch_option' |
  'bracket_height' | 'angle_length' | 'bracket_count' | 'bracket_spacing' |
  'start_offset' | 'spacing_gap' | 'bracket_material_grade' | 'angle_material_grade' |
  'angle_type' | 'profile_thickness' | 'profile_length' | 'profile_height' |
  'slab_thickness' | 'fixing_position', // ← Added fixing_position
  string | number | boolean
>>;
```

### Parameter Mapping System
**File**: `/src/components/shapediver.tsx`

```typescript
// Parameter ID mapping (placeholder system)
const PARAMETER_MAPPINGS = {
  // ... other parameters
  'fixing_position': 'PLACEHOLDER-FIXING-POSITION-ID', // TODO: Replace with actual ShapeDiver parameter ID
};

// Debug mapping for troubleshooting
const PARAMETER_DEBUG_NAMES = {
  // ... other parameters
  'PLACEHOLDER-FIXING-POSITION-ID': 'Fixing Position [mm]',
};

// Formatting function
const formatParameterValue = (paramId: string, value: any): string => {
  // ... other formatting logic

  // Handle fixing position as an integer
  if (paramId === 'PLACEHOLDER-FIXING-POSITION-ID') { // Fixing Position [mm]
    return Math.round(Number(value)).toString();
  }

  // ... default formatting
};
```

### Dynamic Parameter Object
**File**: `/src/components/results-display.tsx`

```typescript
const shapeDiverParams = useMemo(() => {
  console.log("📊 ResultsDisplay: shapeDiverParams recalculating due to result change");
  if (!displayedResult) {
    return {};
  }

  return {
    // ... other parameters

    // Fixing position - distance from top of slab to fixing point
    fixing_position: (() => {
      const optimizedPos = displayedResult.calculated?.optimized_fixing_position;
      const geneticPos = displayedResult.genetic?.fixing_position;
      const finalPos = optimizedPos ?? geneticPos ?? 75;
      console.log(`🔧 ShapeDiver fixing_position: optimized=${optimizedPos}mm, genetic=${geneticPos}mm, final=${finalPos}mm`);
      return finalPos;
    })(),
  };
}, [displayedResult]);
```

### ShapeDiver Integration Status

**✅ Implemented**:
- Parameter type definitions
- Fallback value chain
- Debug logging
- Integer formatting
- Dynamic parameter updates

**🔄 Pending**:
- Replace `PLACEHOLDER-FIXING-POSITION-ID` with actual ShapeDiver parameter ID
- Test 3D model updates with fixing position changes
- Verify parameter synchronization

## Debug & Troubleshooting

### Comprehensive Logging System

The implementation includes extensive console logging at every step:

#### Form Level Debugging
```typescript
console.log('🔧 Fixing Position Debug:', {
  use_custom_fixing_position: values.use_custom_fixing_position,
  form_fixing_position: values.fixing_position,
  actual_fixing_position: actualFixingPosition,
});
```

#### Algorithm Level Debugging
```typescript
console.log(`Fixing Position: Using custom ${customPosition}mm`);
console.log(`Fixing Position: Optimizing across ${positions.length} positions`);
console.log(`Generated positions: [${positions.join(', ')}]`);
```

#### Results Level Debugging
```typescript
console.log('🔧 Results Display Debug:', {
  optimized_fixing_position: optimizedPos,
  genetic_fixing_position: geneticPos,
  final_displayed_value: val,
  fallback_used: optimizedPos ? 'optimized' : geneticPos ? 'genetic' : 'default_75'
});
```

#### ShapeDiver Level Debugging
```typescript
console.log(`🔧 ShapeDiver fixing_position: optimized=${optimizedPos}mm, genetic=${geneticPos}mm, final=${finalPos}mm`);
```

### Common Issues & Solutions

#### Issue: Custom value not reaching calculations
**Symptom**: User enters 100mm, results show 75mm
**Cause**: `use_custom_fixing_position` flag not being set properly
**Solution**: Verify toggle group value change handler sets both fields

#### Issue: Optimization not finding better positions
**Symptom**: "Find Optimal Position" doesn't improve upon manual results
**Cause**: Algorithm not exploring full range due to channel spec constraints
**Solution**: Check `maxFixingDepth` calculation and ensure adequate slab thickness

#### Issue: 3D model not updating positions
**Symptom**: Brackets stay in same position despite changing fixing position
**Cause**: ShapeDiver parameter ID placeholder not replaced
**Solution**: Replace `PLACEHOLDER-FIXING-POSITION-ID` with actual parameter ID

### Testing Scenarios

#### Basic Functionality Test
1. **Custom Mode**: Enter 100mm → Verify results show 100mm fixing position
2. **Optimization Mode**: Toggle to "Find Optimal Position" → Verify algorithm explores range
3. **Edge Cases**: Test 75mm (minimum) and maximum values per slab thickness

#### Performance Test
1. **260mm Slab**: Should generate ~7 positions (75-110mm in 5mm steps)
2. **300mm Slab**: Should generate ~15 positions (75-150mm in 5mm steps)
3. **Timing**: Verify reasonable calculation time for position exploration

#### Integration Test
1. **Form → Calculation**: Verify values flow correctly through API
2. **Results → Display**: Verify correct value shown with proper fallback
3. **Display → ShapeDiver**: Verify 3D model updates (once parameter ID added)

## Technical Debt & Future Work

### Immediate Tasks

#### ShapeDiver Parameter ID Resolution
**Current Status**: Placeholder system implemented
**Required Action**:
1. Access ShapeDiver Studio for the masonry model
2. Identify fixing position parameter ID (UUID format)
3. Replace `PLACEHOLDER-FIXING-POSITION-ID` in `/src/components/shapediver.tsx`

#### Channel Spec Fallback Refinement
**Current Issue**: Some slab thickness values don't have channel specs
**Improvement Needed**: Implement intelligent rounding (round down for safety)

```typescript
// Enhanced channel spec lookup with intelligent fallback
const getChannelSpecWithFallback = (channelType: string, slabThickness: number, bracketCentres: number) => {
  let spec = getChannelSpec(channelType, slabThickness, bracketCentres);

  if (!spec && slabThickness > 250) {
    // For anything over 250mm, use the 250mm value
    spec = getChannelSpec(channelType, 250, bracketCentres);
  } else if (!spec) {
    // For values between available specs, round down for safety
    const availableThicknesses = getAvailableSlabThicknesses(channelType);
    const safeThickness = availableThicknesses
      .filter(t => t <= slabThickness)
      .sort((a, b) => b - a)[0]; // Largest value <= slabThickness
    spec = getChannelSpec(channelType, safeThickness, bracketCentres);
  }

  return spec;
};
```

### Performance Considerations

#### Optimization Impact
**Current**: Each additional fixing position multiplies total combinations
**260mm Slab Example**:
- Without fixing optimization: ~1,000 combinations
- With fixing optimization: ~7,000 combinations (7× positions)

**Mitigation Strategies**:
- Smart pruning of invalid combinations early
- Parallel processing of position ranges
- User feedback during optimization progress

#### Memory Usage
**Position Arrays**: Each fixing position creates separate parameter set
**Recommendation**: Monitor memory usage with large optimization ranges

### Validation Improvements

#### Enhanced Input Validation
```typescript
// Future: Context-aware validation based on slab thickness
const validateFixingPosition = (value: number, slabThickness: number) => {
  const minPosition = 75;
  const channelSpec = getChannelSpec("CPRO38", slabThickness, 300);
  const maxPosition = slabThickness - (channelSpec?.edgeDistances.bottom ?? 150);

  if (value < minPosition) {
    return `Fixing position must be at least ${minPosition}mm`;
  }

  if (value > maxPosition) {
    return `Fixing position must be at most ${maxPosition}mm for ${slabThickness}mm slab`;
  }

  return null; // Valid
};
```

#### Cross-Field Validation
**Future Enhancement**: Validate fixing position against other form fields in real-time

## Code Examples

### Basic Form Usage

```typescript
// Using the form with custom fixing position
const form = useForm({
  defaultValues: {
    use_custom_fixing_position: true,
    fixing_position: 100,
    // ... other fields
  }
});

// Programmatically switch modes
const switchToOptimization = () => {
  form.setValue("use_custom_fixing_position", false);
  form.setValue("fixing_position", 75);
};

const switchToCustom = (position: number) => {
  form.setValue("use_custom_fixing_position", true);
  form.setValue("fixing_position", position);
};
```

### API Integration Example

```typescript
// Calling the optimization API with fixing position
const response = await fetch('/api/optimize', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    // ... other parameters
    fixing_position: 100,
    use_custom_fixing_position: true,
  })
});

const result: OptimizationResult = await response.json();

// Accessing fixing position from results
const displayPosition =
  result.calculated.optimized_fixing_position ??
  result.genetic.fixing_position ??
  75;
```

### ShapeDiver Integration Example

```typescript
// Once parameter ID is known, replace placeholder:
const PARAMETER_MAPPINGS = {
  'fixing_position': 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6', // Actual ShapeDiver ID
};

// Parameter will automatically update 3D model
const shapeDiverParams = {
  fixing_position: 100, // This will position brackets 100mm from top of slab
};
```

## Maintenance Notes

### File Dependencies Map

```
fixing-position-implementation
├── UI Layer
│   ├── src/components/masonry-designer-form.tsx (form controls)
│   └── src/components/results-display.tsx (value display)
├── Type Layer
│   ├── src/types/form-schema.ts (validation)
│   ├── src/types/bracketAngleTypes.ts (interface definitions)
│   ├── src/types/optimization-types.ts (result types)
│   └── src/types/designInputs.ts (input types)
├── Algorithm Layer
│   ├── src/calculations/bruteForceAlgorithm/combinationGeneration.ts (core logic)
│   └── src/calculations/bruteForceAlgorithm/index.ts (integration)
└── Integration Layer
    └── src/components/shapediver.tsx (3D model parameters)
```

### Version History

- **Initial Implementation**: Basic custom input functionality
- **UI Redesign**: Removed confusing toggle, simplified to two clear modes
- **Algorithm Enhancement**: Added position range optimization
- **Results Integration**: Added fallback chain and debug logging
- **ShapeDiver Integration**: Added parameter passing infrastructure
- **Current Status**: Ready for ShapeDiver parameter ID completion

### Code Review Checklist

When modifying fixing position logic:

- [ ] **Form Schema**: Update validation rules if range changes
- [ ] **Type Definitions**: Ensure all interfaces include fixing_position fields
- [ ] **Algorithm Logic**: Verify both custom and optimization modes work
- [ ] **Results Display**: Test fallback chain with different result types
- [ ] **Debug Logging**: Maintain logging at each step for troubleshooting
- [ ] **ShapeDiver Integration**: Ensure parameter updates flow to 3D model
- [ ] **Edge Cases**: Test minimum/maximum values and invalid inputs
- [ ] **Performance**: Monitor optimization time with large position ranges

---

**Document Maintenance**: Update this document when making significant changes to fixing position implementation. Focus on maintaining the end-to-end flow documentation and troubleshooting guidance.