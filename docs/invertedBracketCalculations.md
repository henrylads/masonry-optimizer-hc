# Inverted Bracket Calculations

## Overview

An inverted bracket occurs when the Brick Support Level (BSL) is at or above the Structural Slab Level (SSL). In other words, when `support_level >= 0`. This document explains how we calculate the dimensions for an inverted bracket using a geometry-first approach where **Dim D is calculated based on required fixing position**.

## Key Reference Points

- **SSL (Structural Slab Level)**: The top of the concrete slab, used as our zero reference point
- **BSL (Brick Support Level)**: The level where the angle's horizontal leg supports the masonry
- **Support Level**: The distance from SSL to BSL (positive when BSL is above SSL)
- **Dim D**: Distance from bracket bottom to fixing point (adjustable parameter, 130-450mm range)
- **Critical Edge Distances**:
  - Top Edge Distance: Distance from fixing to SSL (e.g., 75mm)
  - Bottom Edge Distance: Maximum distance from fixing down to bottom of slab (e.g., 125mm)

## Calculation Process - Corrected Approach

The corrected calculation method works as follows:
1. Calculate minimum bracket height using user's formula with rise_to_bolts = 150mm
2. Calculate Dim D by deriving from rise_to_bolts geometry (135mm + 15mm = 150mm)
3. Apply Dim D manufacturing constraints (extend bracket if needed)

### Key Insight: Derive Dim D from Rise to Bolts

The critical fix was changing from calculating Dim D based on bracket height to deriving it from rise_to_bolts:
- **Old approach**: `dim_d = bracket_height - fixing_position` (caused violations)
- **New approach**: `dim_d = rise_to_bolts + 15mm` (eliminates violations)

### 1. Calculate Minimum Bracket Height

The bracket height is calculated using the user's exact formula:

```
Bracket Height = rise_to_bolts + fixing_position + support_level + angle_geometry_offset
```

Where:
- `rise_to_bolts` = 150mm (used in formula, internally calculated as 135mm)
- `fixing_position` = 75mm (distance from top of slab to fixing point)
- `support_level` = 50mm (distance from slab level to angle support point)
- `angle_geometry_offset` = 0mm (inverted) or 54mm (standard, calculated as angle_height - angle_thickness)

Examples:
- **Inverted angle**: 150 + 75 + 50 + 0 = 275mm
- **Standard angle**: 150 + 75 + 50 + 54 = 329mm

### 2. Calculate Required Dim D

Dim D is derived from the rise_to_bolts geometry requirement:

```
Required Dim D = rise_to_bolts + 15mm (worst case adjustment)
```

Example (User's Case):
```
rise_to_bolts = 135mm (geometry requirement)
Required Dim D = 135mm + 15mm = 150mm
```

This approach eliminates slab geometry violations because Dim D is no longer dependent on bracket height calculations.

### 3. Apply Dim D Manufacturing Constraints

Dim D must be within manufacturing limits (130-450mm):

```
If Required Dim D < 130mm:
    Final Dim D = 130mm
    Bracket Height Extension = 130mm - Required Dim D
    Final Bracket Height = Minimum Height + Extension

If Required Dim D > 450mm:
    Final Dim D = 450mm
    Bracket Height Extension = Required Dim D - 450mm
    Final Bracket Height = Minimum Height + Extension

Otherwise:
    Final Dim D = Required Dim D
    Final Bracket Height = Minimum Height
```

### 4. Calculate Final Dimensions

```
Rise to Bolts = Final Dim D - 15mm (worst case adjustment)
Rise to Bolts Display = Rise to Bolts + 15mm (middle-of-slot position)
Extension Below Slab = max(0, Final Bracket Height - Slab Thickness)
```

## Complete User Example

For the user's corrected example:
- Support Level: 50mm (angle above slab level)
- Slab Thickness: 225mm
- Fixing Position: 75mm from top of slab
- Angle: 6mm thickness, 60mm height

**Calculation Steps (Corrected Approach):**
```
1. User's Formula Calculation:
   - rise_to_bolts (for formula) = 150mm
   - fixing_position = 75mm
   - support_level = 50mm
   - angle_geometry_offset = 0mm (inverted angle)
   - Bracket Height = 150 + 75 + 50 + 0 = 275mm

2. Dim D Derivation from Rise to Bolts:
   - rise_to_bolts (geometry) = 135mm
   - Required Dim D = 135mm + 15mm = 150mm

3. Slab Constraint Check:
   - max_dim_d_for_slab = 225mm - 75mm = 150mm
   - 150mm ≤ 150mm ✅ (no violation)

4. Final Results:
   - Final Bracket Height = 275mm
   - Final Dim D = 150mm
   - Rise to Bolts = 135mm
   - Extension Below Slab = 275mm - 225mm = 50mm
```

**Results:** ✅ Dim D = 150mm, Bracket Height = 275mm, No slab violations

## Constraint Validation and Problem Resolution

### Slab Geometry Constraints

The corrected approach includes comprehensive validation to prevent impossible geometries:

**Slab Geometry Check:**
```
Max Dim D for Slab = Slab Thickness - Fixing Position
```

**Constraint Resolution Strategies:**

1. **Slab Geometry Violation**: When required Dim D > max allowable within slab
   - Clamp Dim D to maximum possible within slab
   - Extend bracket below slab to maintain angle positioning
   - Example: Required 200mm Dim D in 225mm slab with 75mm fixing → Clamp to 150mm, extend bracket by 50mm

2. **Manufacturing Constraints**: Applied after slab geometry constraints
   - Minimum Dim D: 130mm
   - Maximum Dim D: 450mm
   - Additional bracket extension if needed

3. **Angle Positioning Accuracy**: Corrected logic ensures proper angle placement
   - For support_level = 50mm: angle positioned 50mm above slab, not at slab level
   - Bracket height calculated to achieve correct angle position

### Example: Constraint Violation Resolution

**Problem Case:** 50mm support level, 225mm slab, 75mm fixing
```
1. Required angle position = 225mm + 50mm = 275mm from bracket bottom
2. Minimum bracket height = 275mm
3. Required Dim D = 275mm - 75mm = 200mm
4. Slab constraint: max_dim_d_for_slab = 225mm - 75mm = 150mm
5. Violation detected: 200mm > 150mm ❌

Resolution:
6. Clamp Dim D to 150mm (maximum within slab)
7. Extend bracket by 50mm (200mm - 150mm) below slab
8. Final bracket height = 275mm + 50mm = 325mm
9. Final Dim D = 150mm ✅
10. Extension below slab = 100mm (325mm - 225mm)
```

**Results:** Angle correctly positioned 50mm above slab, all constraints satisfied

## Important Notes

1. **Dim D as Adjustable Parameter**: Unlike the previous approach, Dim D is now calculated based on geometry requirements rather than being a fixed input constraint.

2. **Algorithm Integration**: This calculation method integrates with the brute force optimization algorithm, which determines optimal fixing positions and bracket heights.

3. **Manufacturing Constraints**: Dim D is constrained to 130-450mm range. When outside this range, the bracket height is extended to maintain proper fixing geometry.

4. **Rise to Bolts**: Always calculated as Dim D - 15mm (worst case adjustment) to ensure adequate support even when the fixing is at its lowest position in the slot.

5. **Angle Positioning**: For standard angles with inverted brackets, the bracket extension above the slab should be (angle_height - angle_thickness) to position the angle correctly at the support level.

6. **Two Strategies Available**:
   - **Strategy 1**: Adjust Dim D to move fixing point up/down in bracket
   - **Strategy 2**: If Dim D adjustment isn't sufficient, extend bracket height

7. **Brute Force Algorithm Integration**: The optimization algorithm now includes pre-filtering to remove impossible combinations:
   - Validates fixing positions against slab geometry constraints
   - Filters out combinations where required Dim D would be excessively large
   - Maintains minimum edge distance requirements
   - Improves optimization efficiency by eliminating invalid solutions early

This corrected approach ensures that inverted brackets are properly sized to achieve the required support level while maintaining manufacturability constraints and geometric feasibility. 