# 170mm Minimum Height Fix for Inverted Brackets

## Date: October 1, 2025

## Problem Reported

For support level **-25mm** with **Inverted bracket + Inverted angle**:
- **Calculated**: Bracket Height = 140mm ❌
- **Expected**: Bracket Height = 170mm minimum ✓

## Root Cause

The constant `INVERTED_BRACKET_MIN_HEIGHT: 170` was defined in `bracketAngleSelection.ts` but **not enforced** in the `calculateInvertedBracketHeight()` function.

### Why 170mm Minimum?

Per engineering requirements:
- **Minimum Dim D**: 130mm (distance from bracket bottom to fixing point)
- **Minimum clearance above fixing**: 40mm (fixing to bracket top)
- **Total minimum**: 130mm + 40mm = **170mm**

This ensures:
1. Adequate structural integrity
2. Sufficient space for fixing hardware
3. Proper load distribution

## Solution Implemented

### Code Changes (bracketCalculations.ts: lines 167-177)

**Added minimum height enforcement** after all other calculations:

```typescript
let final_bracket_height = minimum_bracket_height + bracket_extension;

// STEP 4.5: Enforce minimum bracket height for inverted brackets (170mm)
// This ensures structural integrity: 130mm Dim D + 40mm clearance above fixing
const min_inverted_height = BRACKET_ANGLE_CONSTANTS.INVERTED_BRACKET_MIN_HEIGHT; // 170mm

if (final_bracket_height < min_inverted_height) {
    const additional_extension = min_inverted_height - final_bracket_height;
    bracket_extension += additional_extension;
    final_bracket_height = min_inverted_height;
}
```

### Logic Flow

1. Calculate bracket height from geometry
2. Apply Dim D constraint extensions (130-450mm range)
3. **NEW**: Apply 170mm minimum height constraint
4. Finalize bracket height and other dimensions

## Test Results

All test cases now enforce the 170mm minimum:

### Test 1: Support -25mm
- **Before**: 140mm ❌
- **After**: 170mm ✅ (30mm extension applied)

### Test 2: Support -50mm
- **Before**: 225mm ✓ (already above minimum)
- **After**: 225mm ✓ (no change needed)

### Test 3: Support 0mm
- **Before**: 115mm ❌
- **After**: 170mm ✅ (55mm extension applied)

### Test 4: Support +50mm
- **Before**: 165mm ❌
- **After**: 170mm ✅ (5mm extension applied)

## Impact

### Before Fix
- Inverted brackets could be as short as 115-140mm
- Potentially insufficient structural integrity
- May not meet engineering requirements

### After Fix
- All inverted brackets guaranteed ≥ 170mm
- Meets structural requirements (130mm Dim D + 40mm clearance)
- Consistent with design constants

## Verification

Run the test:
```bash
npx tsx test-170mm-minimum.ts
```

Result: **✅ ALL TESTS PASSED**

## Server Status

Development server running at: **http://localhost:3002**

The fix is now live. When you run optimization with **-25mm support level**, you'll see:
- Bracket Height: **170mm** ✅ (was 140mm)
- Inverted bracket type ✓
- Inverted angle orientation ✓
- All structural requirements met ✓

## Files Modified

1. **src/calculations/bracketCalculations.ts** (lines 167-177):
   - Changed `const` to `let` for `final_bracket_height`
   - Added minimum height enforcement logic
   - Updates `bracket_extension` when minimum is applied

2. **Test file**: `test-170mm-minimum.ts` (for validation)

## Related Fixes (This Session)

1. ✅ Simplified inverted bracket calculation (removed hardcoded values)
2. ✅ Fixed Dim D to only apply to inverted brackets (not standard)
3. ✅ Fixed negative support level handling (-75mm to 0mm range)
4. ✅ Fixed angle orientation for -25mm/-50mm (now Inverted, not Standard)
5. ✅ **Enforced 170mm minimum height for inverted brackets**

All fixes are working together correctly!