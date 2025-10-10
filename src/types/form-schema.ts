import { z } from 'zod'
import { MaterialType } from './userInputs'

// Define the form schema with validation
export const formSchema = z.object({
  slab_thickness: z.coerce
    .number()
    .min(150, { message: "Slab thickness must be at least 150mm" })
    .max(500, { message: "Slab thickness must be at most 500mm" }),
  cavity: z.coerce
    .number()
    .min(50, { message: "Cavity width must be at least 50mm" })
    .max(400, { message: "Cavity width must be at most 400mm" })
    .refine(val => (val * 2) % 1 === 0, {
      message: "Cavity width must be in 0.5mm increments (e.g., 50, 50.5, 51)",
    }),
  support_level: z.coerce
    .number()
    .min(-600, { message: "Support level must be at least -600mm" })
    .max(500, { message: "Support level must be at most 500mm" }),
  characteristic_load: z.coerce
    .number()
    .min(1, { message: "Characteristic load must be at least 1 kN/m" })
    .max(50, { message: "Characteristic load must be at most 50 kN/m" }),
  has_notch: z.boolean().default(false),
  notch_height: z.coerce
    .number()
    .default(0),
  notch_depth: z.coerce
    .number()
    .default(0),
  is_angle_length_limited: z.boolean().default(false),
  fixed_angle_length: z.coerce
    .number()
    .min(200, { message: "Fixed angle length must be at least 200mm" })
    .max(1490, { message: "Fixed angle length must be at most 1490mm" })
    .optional()
    .refine((val) => val === undefined || val % 5 === 0, {
      message: "Fixed angle length must be in 5mm increments",
    }),
  fixing_type: z.enum(['all', 'post-fix', 'channel-fix']).default('all'),
  channel_product: z.enum(['all', 'CPRO38', 'CPRO50', 'CPRO52']).optional().default('all'),
  postfix_product: z.enum(['all', 'R-HPTIII-70', 'R-HPTIII-90']).optional().default('all'),
  use_custom_fixing_position: z.boolean().default(false),
  fixing_position: z.coerce
    .number()
    .min(75, { message: "Fixing position must be at least 75mm from top of slab" })
    .max(400, { message: "Fixing position must be at most 400mm from top of slab" })
    .default(75)
    .refine((val) => (val - 75) % 5 === 0, {
      message: "Fixing position must be in 5mm increments from 75mm (75, 80, 85, etc.)",
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
  path: ["max_allowable_bracket_extension"], // This will show the error on the max_allowable_bracket_extension field
})

export type FormDataType = z.infer<typeof formSchema> 
