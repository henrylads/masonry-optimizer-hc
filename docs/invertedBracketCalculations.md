# Inverted Bracket Calculations

## Overview

An inverted bracket occurs when the Brick Support Level (BSL) is at or above the Structural Slab Level (SSL). In other words, when `support_level >= 0`. This document explains how we calculate the dimensions for an inverted bracket based on the engineer's guidance.

## Key Reference Points

- **SSL (Structural Slab Level)**: The top of the concrete slab, used as our zero reference point
- **BSL (Brick Support Level)**: The level where the angle's horizontal leg supports the masonry
- **Support Level**: The distance from SSL to BSL (positive when BSL is above SSL)
- **Critical Edge Distances**: 
  - Top Edge Distance: Distance from fixing to SSL (e.g., 75mm)
  - Bottom Edge Distance: Maximum distance from fixing down to bottom of slab (e.g., 125mm)

## Calculation Process

We split the bracket height calculation into two main components:
1. Height Above SSL
2. Height Below SSL

### 1. Height Above SSL

This is the portion of the bracket that extends upward from the SSL to support the masonry. It consists of:

- **Support Level**: The distance from SSL up to BSL (e.g., 180mm)
- **Angle Height Adjustment**: An offset based on angle thickness:
  - For 3, 4, 5, 6mm angles: The angle thickness itself is added (e.g., +5mm for 5mm angle)
  - For 8mm angle: A -7mm adjustment (8mm - 15mm) due to its different vertical leg height

Example:
```
Height Above SSL = Support Level + Angle Height Adjustment
Height Above SSL = 180mm + 5mm = 185mm (for 5mm angle)
```

### 2. Height Below SSL

This is the portion of the bracket that extends downward from the SSL to provide fixing and bearing. It consists of:

- **Distance to Fixing**: The top critical edge distance (e.g., 75mm)
- **Distance Below Fixing**: Calculated to ensure minimum bearing requirements:
  - Minimum bearing required: 120mm
  - Slot tolerance: 15mm
  - Total required below fixing: 135mm (120mm + 15mm)
  - Available in concrete: Bottom critical edge (e.g., 125mm)
  - Extension needed below slab: max(0, 135mm - 125mm) = 10mm

Example:
```
Height Below SSL = Top Edge Distance + (Bottom Edge Distance + Extension Below Slab)
Height Below SSL = 75mm + (125mm + 10mm) = 210mm
```

### Final Calculations

1. **Total Bracket Height**:
```
Total Height = Height Above SSL + Height Below SSL
Total Height = 185mm + 210mm = 395mm
```

2. **Rise to Bolts**:
The distance from the bottom of the bracket to the fixing point:
```
Rise to Bolts = Bottom Edge Distance + Extension Below Slab
Rise to Bolts = 125mm + 10mm = 135mm
```

3. **Drop Below Slab**:
How much the bracket extends past the concrete soffit:
```
Drop Below Slab = Extension Below Slab
Drop Below Slab = 10mm
```

## Example Breakdown

For a system with:
- Support Level: 180mm above SSL
- Slab Thickness: 200mm
- Top Critical Edge: 75mm
- Bottom Critical Edge: 125mm
- Angle Thickness: 5mm

The calculation would be:
```
1. Height Above SSL:
   180mm (support) + 5mm (angle) = 185mm

2. Height Below SSL:
   75mm (top edge) + 125mm (bottom edge) + 10mm (extension) = 210mm

3. Total Height:
   185mm + 210mm = 395mm
```

This matches the engineer's example calculation of:
125mm (edge distance) + 10mm (extension) + 75mm (top edge) + 180mm (SSL to BSA) + 5mm (angle thickness) = 395mm

## Important Notes

1. The minimum bearing requirement (120mm) plus slot tolerance (15mm) ensures adequate support even when the fixing is at its lowest position in the slot.

2. For 8mm angles, the vertical leg is 75mm (instead of 60mm for other thicknesses), resulting in a -7mm height adjustment relative to BSA.

3. The bracket may extend below the slab soffit if the required bearing distance exceeds the bottom critical edge distance available in the concrete. 