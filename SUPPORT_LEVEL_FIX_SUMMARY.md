# Support Level Fix Summary (0 to -75mm Range)

## Date: September 30, 2025

## Problem Identified

When support level was between **0 and -75mm** (angle above fixing point but below SSL):
- Bracket type was determined as **"Inverted"** ❌
- But inverted calculation logic was **incorrect** for negative support levels
- Result: Wrong bracket height (extending above SSL when angle should be below SSL)

### Example Problem
For `support_level = -50mm`:
- **Bracket Type**: Inverted (because -50 > -75)
- **Calculation**: Treated as 0mm + 55mm angle adjustment = **55mm above SSL** ❌
- **Expected**: Angle should be **50mm below SSL** (inside slab), using standard bracket

## Root Cause

**Conceptual Misunderstanding:**
- **"Inverted bracket"** should mean: angle mounted **above SSL** (requires bracket extending upward)
- **"Standard bracket"** should mean: angle mounted **at or below SSL** (standard mounting)

**Previous Logic** (bracketAngleSelection.ts:209):
```typescript
return supportLevel <= -75 ? 'Standard' : 'Inverted';
```
- Used **-75mm** (fixing point) as cutoff
- Classified -50mm as "Inverted" because it's above fixing point

**Problem**: This ignored SSL (0mm) as the logical boundary for bracket type

## Solution Implemented

### 1. Updated Bracket Type Determination (bracketAngleSelection.ts:205-213)

**New Logic:**
```typescript
return supportLevel >= 0 ? 'Inverted' : 'Standard';
```

**New Classification:**
- **Inverted bracket**: `support_level ≥ 0mm` (angle at or above SSL)
- **Standard bracket**: `support_level < 0mm` (angle below SSL)

**Rationale**: SSL (0mm) is the logical boundary, not the fixing point (-75mm)

### 2. Added Validation Guard (bracketCalculations.ts:98-103)

```typescript
if (support_level < 0) {
    throw new Error(
        `Inverted bracket calculation requires support level ≥ 0mm (angle at or above SSL). ` +
        `Got ${support_level}mm. For negative support levels (angle below SSL), use standard bracket calculation.`
    );
}
```

**Purpose**: Prevent misuse of inverted calculation for negative support levels

## Test Results

### Bracket Type Determination
```
✅ Support  100mm: Inverted (angle far above SSL)
✅ Support   50mm: Inverted (angle above SSL)
✅ Support    0mm: Inverted (angle at SSL - boundary case)
✅ Support  -25mm: Standard (angle below SSL, above fixing)
✅ Support  -50mm: Standard (angle below SSL, above fixing)  ← Fixed!
✅ Support  -75mm: Standard (angle at fixing point)
✅ Support -100mm: Standard (angle below fixing)
✅ Support -150mm: Standard (angle far below fixing)
```

### Validation Guard
```
✅ Positive support (50mm): Calculation succeeds
✅ Negative support (-50mm): Correctly rejected with error message
```

## Impact

### Before Fix
- Support level **-50mm** → Inverted bracket → Wrong calculation (55mm above SSL)
- Bracket extended above SSL when angle should be inside slab
- Incorrect geometry for angles positioned between fixing point and SSL

### After Fix
- Support level **-50mm** → Standard bracket → Correct calculation
- Angle correctly positioned below SSL (inside slab zone)
- Standard bracket calculation handles all negative support levels

## Changes Made

1. **File**: `src/calculations/bracketAngleSelection.ts`
   - Line 205-213: Updated `determineBracketType()` to use SSL (0mm) as cutoff

2. **File**: `src/calculations/bracketCalculations.ts`
   - Lines 79-80: Added documentation about valid range
   - Lines 98-103: Added validation guard for negative support levels

3. **Test File**: `test-support-level-fix.ts` (for validation)

## Verification

Run the test:
```bash
npx tsx test-support-level-fix.ts
```

Result: **✅ ALL TESTS PASSED**

## Server Status

Development server running at: **http://localhost:3002**

The fix is now live and ready for testing with support levels in the -75 to 0mm range.
