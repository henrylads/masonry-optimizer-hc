# Parameter Comparison: Main Branch vs Feature Branch

## Summary
The main branch (working) has additional parameter calculations and logic that are missing in the feature branch design page.

## Main Branch Parameters (working)
Location: `/src/components/masonry-designer-form.tsx` lines 496-556

### Basic Parameters
| Parameter | Source | Notes |
|-----------|--------|-------|
| `support_level` | `values.support_level` | ✅ Present in feature |
| `cavity_width` | `values.cavity` | ✅ Present in feature |
| `slab_thickness` | `effectiveSlabThickness` | ✅ Present in feature (calculated) |
| `characteristic_load` | `values.characteristic_load` | ✅ Present in feature |
| `notch_height` | `values.has_notch ? values.notch_height : 0` | ❌ Feature uses direct value |
| `notch_depth` | `values.has_notch ? values.notch_depth : 0` | ❌ Feature uses direct value |

### Edge Distances
| Parameter | Main Branch | Feature Branch |
|-----------|-------------|----------------|
| `top_critical_edge` | `criticalEdges.top` (from getChannelSpec) | `75` (hardcoded) |
| `bottom_critical_edge` | `criticalEdges.bottom` (from getChannelSpec) | `50` (hardcoded) |

**Issue**: Feature branch uses hardcoded values instead of calculating from channel specs.

### Fixing Position & Dim D
| Parameter | Main Branch | Feature Branch |
|-----------|-------------|----------------|
| `fixing_position` | `actualFixingPosition` (uses default 75 if not custom) | `values.fixing_position` (direct) |
| `dim_d` | `actualDimD` (uses default 130 if not custom) | `values.dim_d` (direct) |

**Main Branch Logic**:
```typescript
const actualFixingPosition = values.use_custom_fixing_position ? values.fixing_position : 75;
const actualDimD = values.use_custom_dim_d ? values.dim_d : 130;
```

### Facade Parameters
| Parameter | Status |
|-----------|--------|
| `facade_thickness` | ✅ Present |
| `load_position` | ✅ Present |
| `front_offset` | ✅ Present |
| `isolation_shim_thickness` | ✅ Present |
| `material_type` | ✅ Present |

### Angle Extension Parameters
| Parameter | Main Branch | Feature Branch |
|-----------|-------------|----------------|
| `enable_angle_extension` | `values.enable_angle_extension` | ✅ Present |
| `max_allowable_bracket_extension` | `values.enable_angle_extension ? values.max_allowable_bracket_extension : null` | `values.max_allowable_bracket_extension` (no null check) |

### Steel Fixing Parameters
| Parameter | Status |
|-----------|--------|
| `frame_fixing_type` | ✅ Present |
| `steel_section` | ✅ Present (now added) |
| `steel_bolt_size` | ✅ Present |
| `steel_fixing_method` | ✅ Present |

### Channel Type Selection
| Parameter | Main Branch | Feature Branch |
|-----------|-------------|----------------|
| `allowed_channel_types` | Complex logic based on `fixing_type`, `channel_product`, `postfix_product` | ❌ **MISSING** |

**Main Branch Logic**: (lines 524-555)
- If `fixing_type === 'all'`: includes both channel and postfix products
- If `fixing_type === 'post-fix'`: only postfix products (R-HPTIII-70, R-HPTIII-90)
- If `fixing_type === 'channel-fix'`: only channel products (CPRO38, CPRO50, CPRO52)
- Defaults to all types if none specified

### Additional Parameters
| Parameter | Main Branch | Feature Branch |
|-----------|-------------|----------------|
| `showDetailedVerifications` | `true` | ❌ **MISSING** |

### Algorithm Config Parameters (outside designInputs)
| Parameter | Main Branch | Feature Branch |
|-----------|-------------|----------------|
| `isAngleLengthLimited` | `values.is_angle_length_limited` | ❌ **MISSING** |
| `fixedAngleLength` | `values.is_angle_length_limited ? values.fixed_angle_length : undefined` | ❌ **MISSING** |

## Critical Missing Items in Feature Branch

1. **Critical Edge Calculation**: Uses hardcoded values instead of `getChannelSpec()`
2. **Default Value Logic**: Missing for `fixing_position` and `dim_d`
3. **Notch Conditional Logic**: Should use 0 when `has_notch` is false
4. **Channel Type Selection**: `allowed_channel_types` logic completely missing
5. **Angle Extension Null Check**: Should set to null when disabled
6. **showDetailedVerifications**: Flag not passed
7. **Angle Length Limiting**: `isAngleLengthLimited` and `fixedAngleLength` not passed

## Form Fields in Feature Branch

The feature branch form schema has these fields:
- `fixing_type` (all, post-fix, channel-fix)
- `channel_product` (all, CPRO38, CPRO50, CPRO52)
- `postfix_product` (all, R-HPTIII-70, R-HPTIII-90)
- `is_angle_length_limited`
- `fixed_angle_length`
- `has_notch`

These need to be used to construct the proper `designInputs` object.

## Recommended Fix

Create a systematic mapping that mirrors the main branch logic:

1. Calculate `criticalEdges` using `getChannelSpec()`
2. Apply default value logic for `fixing_position` and `dim_d`
3. Add conditional logic for notch parameters
4. Implement `allowed_channel_types` selection logic
5. Add null check for `max_allowable_bracket_extension`
6. Pass `isAngleLengthLimited` and `fixedAngleLength` to algorithm config
7. Set `showDetailedVerifications: true`
