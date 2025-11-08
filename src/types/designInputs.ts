import { z } from 'zod';
import type { ChannelType } from './channelSpecs';
import type { FrameFixingType, SteelSection, SteelBoltSize } from './steelFixingTypes';
import { MaterialType } from './userInputs';

/**
 * Input parameters required for generating designs
 */
export interface DesignInputs {
    /** Distance from SSL to BSL (mm) */
    support_level: number;
    
    /** Cavity width (mm) */
    cavity_width: number;
    
    /** Slab thickness (mm) */
    slab_thickness: number;
    
    /** Characteristic UDL (kN/m) */
    characteristic_load: number;
    
    /** Top critical edge distance (mm) */
    top_critical_edge: number;
    
    /** Bottom critical edge distance (mm) */
    bottom_critical_edge: number;
    
    /** Notch height (mm) */
    notch_height: number;
    
    /** Notch depth (mm) */
    notch_depth: number;
    
    /** Masonry density (kg/m³) - optional */
    masonry_density?: number;
    
    /** Masonry thickness (mm) - optional */
    masonry_thickness?: number;
    
    /** Masonry height (m) - optional */
    masonry_height?: number;

    /** Optional: Restrict optimization to specific channel families */
    allowed_channel_types?: ChannelType[];


    /** Fixing position from top of slab (mm) - defaults to 75mm */
    fixing_position?: number;

    /** Flag indicating if user explicitly set a custom fixing position */
    use_custom_fixing_position?: boolean;

    /** Dim D - Distance from bracket bottom to fixing for inverted brackets (130-450mm) */
    dim_d?: number;

    /** Flag indicating if user explicitly set a custom dim_d value */
    use_custom_dim_d?: boolean;

    /** Facade thickness (mm) - thickness of the masonry facade system - defaults to 102.5mm for brick */
    facade_thickness?: number;

    /** Load position as fraction of facade thickness (0-1 range) - defaults based on material type */
    load_position?: number;

    /** Front offset distance (mm) - additional projection adjustment - defaults to 12mm */
    front_offset?: number;

    /** Isolation shim thickness (mm) - thickness of isolation material - defaults to 3mm */
    isolation_shim_thickness?: number;

    /** Material type for automatic load position defaults */
    material_type?: MaterialType;

    /** Maximum allowable bracket position relative to top of slab (mm) - negative = below slab, positive = above slab. When exceeded, uses angle extension to compensate */
    max_allowable_bracket_extension?: number | null;

    /** Enable angle extension feature for handling exclusion zones */
    enable_angle_extension?: boolean;

    /** Frame fixing type - determines concrete vs steel workflow */
    frame_fixing_type?: FrameFixingType;

    /** Steel section specification (only for steel fixing types) */
    steel_section?: SteelSection;

    /** Steel bolt size (only for steel fixing types) - can be specific size or 'all' to test all sizes */
    steel_bolt_size?: SteelBoltSize | 'all';

    /** Steel fixing method (only for steel fixing types) - 'both' tests both methods for I-Beam */
    steel_fixing_method?: 'SET_SCREW' | 'BLIND_BOLT' | 'both';
}

export const DesignInputsSchema = z.object({
    support_level: z.number()
        .min(0, "Support level must be positive")
        .max(5000, "Support level must be less than 5000mm"),
    
    cavity_width: z.number()
        .min(50, "Cavity width must be at least 50mm")
        .max(300, "Cavity width must be less than 300mm"),
    
    slab_thickness: z.number()
        .min(100, "Slab thickness must be at least 100mm")
        .max(500, "Slab thickness must be less than 500mm"),
    
    characteristic_load: z.number()
        .min(0, "Characteristic load must be positive")
        .max(20, "Characteristic load must be less than 20 kN/m"),
    
    top_critical_edge: z.number()
        .min(0, "Top critical edge must be positive")
        .max(1000, "Top critical edge must be less than 1000mm"),
    
    bottom_critical_edge: z.number()
        .min(0, "Bottom critical edge must be positive")
        .max(1000, "Bottom critical edge must be less than 1000mm"),
    
    notch_height: z.number()
        .min(0, "Notch height must be positive")
        .max(200, "Notch height must be less than 200mm"),
    
    notch_depth: z.number()
        .min(0, "Notch depth must be positive")
        .max(200, "Notch depth must be less than 200mm"),


    fixing_position: z.number()
        .min(75, "Fixing position must be at least 75mm from top of slab")
        .max(400, "Fixing position must be less than 400mm from top of slab")
        .optional()
        .default(75),

    use_custom_fixing_position: z.boolean()
        .optional()
        .default(false),

    dim_d: z.number()
        .min(130, "Dim D must be at least 130mm")
        .max(450, "Dim D must be at most 450mm")
        .optional(),

    use_custom_dim_d: z.boolean()
        .optional()
        .default(false),

    facade_thickness: z.number()
        .min(50, "Facade thickness must be at least 50mm")
        .max(300, "Facade thickness must be less than 300mm")
        .optional()
        .default(102.5),

    load_position: z.number()
        .min(0.1, "Load position must be at least 0.1")
        .max(0.9, "Load position must be at most 0.9")
        .optional()
        .default(1/3),

    front_offset: z.number()
        .min(-50, "Front offset must be at least -50mm")
        .max(100, "Front offset must be at most 100mm")
        .optional()
        .default(12),

    isolation_shim_thickness: z.number()
        .min(0, "Isolation shim thickness must be at least 0mm")
        .max(20, "Isolation shim thickness must be at most 20mm")
        .optional()
        .default(3),

    material_type: z.nativeEnum(MaterialType)
        .optional()
        .default(MaterialType.BRICK),

    max_allowable_bracket_extension: z.number()
        .min(-1000, "Maximum bracket position must be at least -1000mm (below slab)")
        .max(500, "Maximum bracket position must be less than 500mm (above slab)")
        .nullable()
        .optional(),

    enable_angle_extension: z.boolean()
        .optional()
        .default(false)
});
