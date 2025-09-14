# ShapeDiver Outputs Integration

This document explains how to access and display outputs from ShapeDiver models in the masonry optimizer application.

## Overview

We have integrated ShapeDiver's output functionality to retrieve calculated values from the 3D model and display them in the results interface. The three main outputs we capture are:

1. **totalSystemWeight** - Total weight of the masonry support system
2. **totalSystemEmbodiedCarbon** - Total embodied carbon of the system  
3. **totalSystemPerimeterLength** - Total perimeter length of the system

## Implementation

### 1. ShapeDiver Component Updates (`src/components/shapediver.tsx`)

**Added output interface:**
```typescript
export interface ShapeDiverOutputs {
  totalSystemWeight?: number;
  totalSystemEmbodiedCarbon?: number;
  totalSystemPerimeterLength?: number;
}
```

**Added callback prop:**
```typescript
interface ShapeDiverCardProps {
  // ... existing props
  onOutputsChange?: (outputs: ShapeDiverOutputs) => void;
}
```

**Added output extraction function:**
```typescript
const extractOutputs = async (session: ISessionApi) => {
  // Uses session.getOutputByName() to find outputs
  // Accesses output.content[0] to get actual values
  // Calls onOutputsChange callback with extracted values
}
```

### 2. Results Display Updates (`src/components/results-display.tsx`)

**Added state management:**
```typescript
const [shapeDiverOutputs, setShapeDiverOutputs] = useState<ShapeDiverOutputs>({});

const handleShapeDiverOutputs = (outputs: ShapeDiverOutputs) => {
  setShapeDiverOutputs(outputs);
};
```

**Updated ShapeDiverCard usage:**
```typescript
<ShapeDiverCard 
  initialParameters={shapeDiverParams} 
  onOutputsChange={handleShapeDiverOutputs}
/>
```

**Added outputs display card:**
```typescript
<Card>
  <CardHeader>
    <CardTitle>ShapeDiver Model Outputs</CardTitle>
    <CardDescription>Calculated values from the 3D model</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Display totalSystemWeight, totalSystemEmbodiedCarbon, totalSystemPerimeterLength */}
  </CardContent>
</Card>
```

## Usage Flow

1. **Model Loads**: ShapeDiver session is created with input parameters
2. **Outputs Calculated**: After a 1-second delay (to ensure model computation), `extractOutputs()` is called
3. **Values Retrieved**: The function uses `session.getOutputByName()` to find each output by name
4. **Content Accessed**: For each output, we access `output.content[0]` to get the actual value
5. **Callback Triggered**: `onOutputsChange()` is called with the extracted values
6. **State Updated**: Results display component updates its state and shows the values
7. **UI Updated**: A new card appears showing the three calculated values

## API Reference

### ShapeDiver Session API

Based on the [ShapeDiver ISessionApi documentation](https://viewer.shapediver.com/v3/latest/api/interfaces/ISessionApi.html#getOutputByName):

```typescript
// Get outputs by name (returns array since multiple outputs can have same name)
const outputs = session.getOutputByName('outputName');

// Access the actual value from the first output's content
if (outputs && outputs.length > 0 && outputs[0].content && outputs[0].content.length > 0) {
  const value = outputs[0].content[0].value || outputs[0].content[0].data;
}
```

### Output Data Types

The outputs from ShapeDiver are expected to be numeric values that get parsed as:
- **Weight**: Displayed as kg with 2 decimal places
- **Carbon**: Displayed as kg CO₂e with 2 decimal places  
- **Length**: Displayed as mm with 0 decimal places

## Error Handling

The implementation includes comprehensive error handling:

- Try-catch blocks around each output retrieval
- Fallback values and "Calculating..." states
- Console logging for debugging
- Graceful handling of missing or invalid outputs

## Debugging

To debug output access issues:

1. Check browser console for output extraction logs
2. Verify output names match exactly in ShapeDiver model
3. Confirm outputs are marked as "direct outputs" in ShapeDiver
4. Test with different parameter combinations

## Future Enhancements

Potential improvements:
- Real-time output updates when parameters change
- Additional output types (materials, costs, etc.)
- Output validation and error states
- Custom formatting options for different units 