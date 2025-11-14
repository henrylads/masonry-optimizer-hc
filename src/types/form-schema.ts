import { z } from 'zod'
import { MaterialType } from './userInputs'

// Define the form schema with validation
export const formSchema = z.object({
  // Project information fields
  project_name: z.string().max(200, { message: "Project name must be at most 200 characters" }).optional(),
  section_name: z.string().max(200, { message: "Section name must be at most 200 characters" }).optional(),
  client_name: z.string().max(200, { message: "Client name must be at most 200 characters" }).optional(),
  project_location: z.string().max(200, { message: "Project location must be at most 200 characters" }).optional(),
  project_reference: z.string().max(100, { message: "Project reference must be at most 100 characters" }).optional(),
  designer_name: z.string().max(200, { message: "Designer name must be at most 200 characters" }).optional(),

  // Frame fixing type selector
  frame_fixing_type: z.enum([
    'concrete-cast-in',
    'concrete-post-fix',
    'concrete-all',
    'steel-ibeam',
    'steel-rhs',
    'steel-shs'
  ]).default('concrete-all'),

  // Slab thickness - optional (required only for concrete types)
  slab_thickness: z.coerce
    .number()
    .min(150, { message: "Slab thickness must be at least 150mm" })
    .max(500, { message: "Slab thickness must be at most 500mm" })
    .optional(),
  cavity: z.coerce
    .number()
    .min(50, { message: "Cavity width must be at least 50mm" })
    .max(400, { message: "Cavity width must be at most 400mm" })
    .refine(val => (val * 2) % 1 === 0, {
      message: "Cavity width must be in 0.5mm increments (e.g., 50, 50.5, 51)",
    }),
  support_level: z.coerce
    .number()
    .min(-600, { message: "Bracket drop must be at least -600mm" })
    .max(500, { message: "Bracket drop must be at most 500mm" }),
  characteristic_load: z.coerce
    .number()
    .min(1, { message: "Characteristic load must be at least 1 kN/m" })
    .max(50, { message: "Characteristic load must be at most 50 kN/m" }),
  run_length: z.coerce
    .number()
    .min(100, { message: "Run length must be at least 100mm" })
    .max(250000, { message: "Run length must be at most 250000mm (250m)" })
    .default(1000),
  has_notch: z.boolean().default(false),
  notch_height: z.coerce
    .number()
    .default(0),
  notch_depth: z.coerce
    .number()
    .default(0),
  channel_product: z.enum(['all', 'CPRO38', 'CPRO50', 'CPRO52']).optional().default('all'),
  postfix_product: z.enum(['all', 'R-HPTIII-70', 'R-HPTIII-90']).optional().default('all'),
  use_custom_fixing_position: z.boolean().default(false),
  fixing_position: z.coerce
    .number()
    .min(15, { message: "Fixing position must be at least 15mm" })
    .max(400, { message: "Fixing position must be at most 400mm" })
    .default(75)
    .refine((val) => val % 5 === 0, {
      message: "Fixing position must be in 5mm increments (e.g., 15, 20, 25, etc.)",
    }),
  use_custom_dim_d: z.boolean().default(false),
  dim_d: z.coerce
    .number()
    .min(130, { message: "Dim D must be at least 130mm" })
    .max(450, { message: "Dim D must be at most 450mm" })
    .default(130)
    .refine((val) => (val - 130) % 5 === 0, {
      message: "Dim D must be in 5mm increments from 130mm (130, 135, 140, etc.)",
    }),
  facade_thickness: z.coerce
    .number()
    .min(50, { message: "Facade thickness must be at least 50mm" })
    .max(300, { message: "Facade thickness must be at most 300mm" })
    .default(102.5),
  load_position: z.coerce
    .number()
    .min(0.1, { message: "Load position must be at least 0.1" })
    .max(0.9, { message: "Load position must be at most 0.9" })
    .default(1/3)
    .optional(),
  front_offset: z.coerce
    .number()
    .min(-50, { message: "Front offset must be at least -50mm" })
    .max(100, { message: "Front offset must be at most 100mm" })
    .default(12),
  isolation_shim_thickness: z.coerce
    .number()
    .min(0, { message: "Isolation shim thickness must be at least 0mm" })
    .max(20, { message: "Isolation shim thickness must be at most 20mm" })
    .default(3),
  material_type: z.nativeEnum(MaterialType).default(MaterialType.BRICK),
  use_custom_load_position: z.boolean().default(false),
  use_custom_facade_offsets: z.boolean().default(false),

  // Angle extension fields for exclusion zones
  enable_angle_extension: z.boolean().default(false),
  max_allowable_bracket_extension: z.coerce
    .number()
    .min(-1000, { message: "Max bracket position must be at least -1000mm (below slab)" })
    .max(500, { message: "Max bracket position must be at most 500mm (above slab)" })
    .optional()
    .refine((val) => val === undefined || val % 5 === 0, {
      message: "Max bracket position must be in 5mm increments",
    }),

  // Steel fixing fields
  steel_section_type: z.enum(['I-BEAM', 'RHS', 'SHS']).optional(),
  use_custom_steel_section: z.boolean().default(false),
  steel_section_size: z.string().optional(),
  custom_steel_height: z.coerce
    .number()
    .min(20, { message: "Custom steel height must be at least 20mm" })
    .max(1000, { message: "Custom steel height must be at most 1000mm" })
    .optional(),
  steel_bolt_size: z.enum(['all', 'M10', 'M12', 'M16']).optional(),
  // Fixing method for steel sections (only applicable to I-Beam, RHS/SHS must use blind bolts)
  steel_fixing_method: z.enum(['SET_SCREW', 'BLIND_BOLT', 'both']).default('SET_SCREW').optional(),
}).refine((data) => {
  // Conditional validation for notch fields
  if (data.has_notch) {
    return data.notch_height >= 10 && data.notch_height <= 200 &&
           data.notch_depth >= 10 && data.notch_depth <= 200;
  }
  return true;
}, {
  message: "When notch is enabled, height and depth must be between 10-200mm",
  path: ["notch_height"], // This will show the error on the notch_height field
}).refine((data) => {
  // Conditional validation for angle extension fields
  if (data.enable_angle_extension) {
    return data.max_allowable_bracket_extension !== undefined &&
           data.max_allowable_bracket_extension >= -1000 &&
           data.max_allowable_bracket_extension <= 500;
  }
  return true;
}, {
  message: "When angle extension is enabled, max bracket position must be specified (-1000 to 500mm)",
  path: ["max_allowable_bracket_extension"],
}).refine((data) => {
  // Validate slab_thickness required for concrete types
  if (data.frame_fixing_type?.startsWith('concrete')) {
    return data.slab_thickness !== undefined && data.slab_thickness >= 150;
  }
  return true;
}, {
  message: "Slab thickness is required for concrete fixing types",
  path: ["slab_thickness"]
}).refine((data) => {
  // Validate steel section required for steel types
  if (data.frame_fixing_type?.startsWith('steel')) {
    if (data.use_custom_steel_section) {
      return data.custom_steel_height !== undefined && data.custom_steel_height >= 20;
    } else {
      return data.steel_section_size !== undefined && data.steel_section_size.length > 0;
    }
  }
  return true;
}, {
  message: "Steel section specification is required for steel fixing types",
  path: ["steel_section_size"]
}).refine((data) => {
  // Validate steel bolt size required for steel types
  if (data.frame_fixing_type?.startsWith('steel')) {
    return data.steel_bolt_size !== undefined;
  }
  return true;
}, {
  message: "Bolt size is required for steel fixing types",
  path: ["steel_bolt_size"]
}).refine((data) => {
  // Dynamic fixing position validation based on frame type
  if (data.use_custom_fixing_position) {
    const frameType = data.frame_fixing_type;

    // Steel fixing constraints (M16 bolt edge distance)
    if (frameType?.startsWith('steel')) {
      const M16_EDGE_DISTANCE_PER_SIDE = 21.6 / 2; // 10.8mm per side

      // Get effective steel section height
      let steelHeight = 127; // default
      if (data.use_custom_steel_section && data.custom_steel_height) {
        steelHeight = data.custom_steel_height;
      } else if (data.steel_section_size) {
        steelHeight = parseInt(data.steel_section_size.split('x')[0]) || 127;
      }

      const min = Math.ceil(M16_EDGE_DISTANCE_PER_SIDE / 5) * 5; // 15mm
      const max = Math.floor((steelHeight - M16_EDGE_DISTANCE_PER_SIDE) / 5) * 5;

      return data.fixing_position >= min && data.fixing_position <= max;
    }

    // Concrete fixing constraints
    if (frameType?.startsWith('concrete')) {
      const slabThickness = data.slab_thickness || 225;
      const TOP_CRITICAL_EDGE = 75;
      const BOTTOM_BUFFER = 50;

      const min = TOP_CRITICAL_EDGE;
      const max = Math.max(slabThickness - BOTTOM_BUFFER, min + 5);

      return data.fixing_position >= min && data.fixing_position <= max;
    }
  }
  return true;
}, {
  message: "Fixing position is outside valid range for selected frame type and dimensions",
  path: ["fixing_position"]
})

export type FormDataType = z.infer<typeof formSchema> 
