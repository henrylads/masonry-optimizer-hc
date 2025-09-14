import { z } from 'zod'

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
  characteristic_load: z.coerce.string().optional(),
  masonry_density: z.coerce
    .number()
    .min(1500, { message: "Masonry density must be at least 1500 kg/m³" })
    .max(2500, { message: "Masonry density must be at most 2500 kg/m³" })
    .default(2000),
  masonry_thickness: z.coerce
    .number()
    .min(50, { message: "Masonry thickness must be at least 50mm" })
    .max(250, { message: "Masonry thickness must be at most 250mm" })
    .default(102.5),
  masonry_height: z.coerce
    .number()
    .min(1, { message: "Masonry height must be at least 1m" })
    .max(10, { message: "Masonry height must be at most 10m" })
    .default(6),
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
  channel_family: z.enum(['all', 'CPRO38', 'CPRO50', 'R-HPTIII-70', 'R-HPTIII-90']).default('all'),
  enable_fixing_optimization: z.boolean().default(false),
  fixing_position: z.coerce
    .number()
    .min(75, { message: "Fixing position must be at least 75mm from top of slab" })
    .max(400, { message: "Fixing position must be at most 400mm from top of slab" })
    .default(75)
    .refine((val) => (val - 75) % 5 === 0, {
      message: "Fixing position must be in 5mm increments from 75mm (75, 80, 85, etc.)",
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
  // Validation for fixing position constraint: cannot go below 75mm from bottom of slab
  if (data.enable_fixing_optimization && data.fixing_position) {
    const bottomClearance = data.slab_thickness - data.fixing_position;
    return bottomClearance >= 75;
  }
  return true;
}, {
  message: "Fixing position must maintain at least 75mm clearance from bottom of slab",
  path: ["fixing_position"],
})

export type FormDataType = z.infer<typeof formSchema> 
