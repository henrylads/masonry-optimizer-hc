# ShapeDiver Integration with Bracket Positioning

This example demonstrates how to use the results from `calculateBracketPositioning` to populate the ShapeDiver model.

## Basic Usage

```tsx
import { ShapeDiverCard } from "@/components/shapediver";
import { calculateBracketPositioning, AngleLayoutRequest } from "@/calculations/angleLayout";

export default function ResultsPage() {
  // Example parameters based on optimization results
  const layoutRequest: AngleLayoutRequest = {
    isLengthLimited: false,
    centerToCenter: 300, // From optimization, in mm
    maxAngleLength: 1490 // Optional override
  };

  // Calculate bracket positioning
  const layoutResult = calculateBracketPositioning(layoutRequest);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Optimization Results</h1>
      
      {/* Other result components */}
      
      {/* ShapeDiver 3D Model */}
      <ShapeDiverCard 
        title="Masonry Support System"
        initialParameters={{
          // Bracket parameters
          bracket_thickness: 3, // 3mm
          bracket_length: 125, // 125mm
          bracket_height: 191, // 191mm
          material_grade: "304", // 304 stainless steel
          fixing_diameter: "M12", // M12 bolt
          toe_plate_type: "Standard",
          back_notch_option: true,
          back_notch_length: 25, // 25mm
          back_notch_height: 89, // 89mm
          support_type: "Standard",
          
          // Bracket positioning parameters from angleLayout.ts
          angle_length: layoutResult.angleLength,
          bracket_count: layoutResult.bracketCount,
          bracket_spacing: layoutResult.spacing,
          start_offset: layoutResult.startOffset,
          spacing_gap: 10 // Default gap from angleLayout.ts
        }}
      />
    </div>
  );
}
```

## Fixed-Length Example

If you need to use a fixed length instead:

```tsx
const layoutRequest: AngleLayoutRequest = {
  isLengthLimited: true,
  fixedLength: 1000, // Fixed length of 1000mm
  centerToCenter: 300 // Maximum allowed center-to-center spacing
};

const layoutResult = calculateBracketPositioning(layoutRequest);
```

## Available Parameters

The ShapeDiver model accepts the following parameters:

### Bracket Configuration
- `bracket_thickness` - Thickness of the bracket (3 or 4 mm)
- `bracket_length` - Length of the bracket (mm)
- `bracket_height` - Height of the bracket (mm)
- `material_grade` - Material grade ("304" or "316")
- `fixing_diameter` - Fixing bolt diameter ("M8", "M10", "M12", "M16")
- `toe_plate_type` - Type of toe plate ("Standard" or "Inverted")
- `back_notch_option` - Whether to include a back notch (true/false)
- `back_notch_length` - Length of the back notch (mm)
- `back_notch_height` - Height of the back notch (mm)
- `support_type` - Type of support ("Standard" or "Inverted")

### Bracket Positioning (from angleLayout.ts)
- `angle_length` - Total length of the angle (mm)
- `bracket_count` - Number of brackets
- `bracket_spacing` - Center-to-center spacing between brackets (mm)
- `start_offset` - Distance from left end to first bracket (mm)
- `spacing_gap` - Gap between angles (mm, typically 10mm)

## Implementation Note

The ShapeDiver integration now uses parameter IDs instead of parameter names to avoid conflicts with duplicate parameter names in the model. This is handled internally by the `ShapeDiverCard` component, which maps the friendly parameter names above to the appropriate parameter IDs for the ShapeDiver model.

For reference, here's how the `ShapeDiverCard` component processes a parameter:

1. It takes the parameter name (e.g., `material_grade`) from your code
2. Looks up the corresponding parameter ID in an internal mapping
3. Formats the value appropriately for the ShapeDiver model
4. Sends the parameter ID and formatted value to the ShapeDiver API

This approach ensures reliable parameter updates even when the ShapeDiver model contains multiple parameters with the same name. 