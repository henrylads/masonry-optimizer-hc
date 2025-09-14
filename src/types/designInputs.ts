import { z } from 'zod';
import type { ChannelType } from './channelSpecs';

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

    /** Enable fixing position optimization */
    enable_fixing_optimization?: boolean;

    /** Fixing position from top of slab (mm) - defaults to 75mm */
    fixing_position?: number;
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

    enable_fixing_optimization: z.boolean().optional(),

    fixing_position: z.number()
        .min(75, "Fixing position must be at least 75mm from top of slab")
        .max(400, "Fixing position must be less than 400mm from top of slab")
        .optional()
        .default(75)
}); 
