'use client'

import { useState } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { ChevronRight } from 'lucide-react'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import { FormDataType } from '@/types/form-schema'

interface AdvancedOptionsProps {
  form: UseFormReturn<FormDataType>
  frameFixingType: string
}

export function AdvancedOptions({ form, frameFixingType }: AdvancedOptionsProps) {
  const [geometryExpanded, setGeometryExpanded] = useState(false)
  const [fixingExpanded, setFixingExpanded] = useState(false)
  const [bracketExpanded, setBracketExpanded] = useState(false)

  const isConcreteType = frameFixingType?.startsWith('concrete')
  const isSteelType = frameFixingType?.startsWith('steel')

  // Calculate fixing position constraints for concrete types
  const fixingPositionConstraints = (() => {
    if (isConcreteType) {
      const slabThickness = form.watch('slab_thickness') || 225
      const TOP_CRITICAL_EDGE = 75
      const BOTTOM_BUFFER = 50
      const min = TOP_CRITICAL_EDGE
      const max = Math.max(slabThickness - BOTTOM_BUFFER, min + 5)
      return { min, max }
    }
    // Steel fixing constraints (M16 bolt edge distance)
    if (isSteelType) {
      const M16_EDGE_DISTANCE_PER_SIDE = 21.6 / 2 // 10.8mm per side
      const useCustomSteel = form.watch('use_custom_steel_section')
      const customSteelHeight = form.watch('custom_steel_height')
      const steelSectionSize = form.watch('steel_section_size')

      let steelHeight = 127 // default
      if (useCustomSteel && customSteelHeight) {
        steelHeight = customSteelHeight
      } else if (steelSectionSize) {
        steelHeight = parseInt(steelSectionSize.split('x')[0]) || 127
      }

      const min = Math.ceil(M16_EDGE_DISTANCE_PER_SIDE / 5) * 5 // 15mm
      const max = Math.floor((steelHeight - M16_EDGE_DISTANCE_PER_SIDE) / 5) * 5
      return { min, max }
    }
    return { min: 15, max: 400 }
  })()

  return (
    <div className="space-y-4">
      {/* Group 1: Geometry & Dimensions */}
      <div className="border rounded-lg overflow-hidden">
        <button
          onClick={() => setGeometryExpanded(!geometryExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <span className="font-semibold">Geometry & Dimensions</span>
          <ChevronRight className={`h-4 w-4 transition-transform ${geometryExpanded ? 'rotate-90' : ''}`} />
        </button>
        {geometryExpanded && (
          <div className="p-4 space-y-4">
              <FormField
                control={form.control}
                name="material_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Material Type</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value)
                        // Auto-update load position based on material type
                        if (!form.watch('use_custom_load_position')) {
                          const loadPositions = {
                            'brick': 1/3,
                            'precast': 1/2,
                            'stone': 1/2
                          }
                          form.setValue('load_position', loadPositions[value as keyof typeof loadPositions] || 1/3)
                        }
                        // Auto-update facade thickness based on material type
                        // Only auto-update if not using custom facade offsets
                        if (!form.getValues('use_custom_facade_offsets')) {
                          const facadeThicknesses = {
                            'brick': 102.5,
                            'precast': 250,
                            'stone': 150
                          }
                          form.setValue('facade_thickness', facadeThicknesses[value as keyof typeof facadeThicknesses] || 102.5)
                        }
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select material type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="brick">Brick (1/3 load position, 102.5mm)</SelectItem>
                        <SelectItem value="precast">Precast Concrete (1/2 load position, 250mm)</SelectItem>
                        <SelectItem value="stone">Stone (1/2 load position, 150mm)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Material type affects default facade thickness and load position
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="facade_thickness"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Facade Thickness (mm)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g. 102.5"
                        value={field.value}
                        onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                        min="50"
                        max="300"
                        step="0.5"
                      />
                    </FormControl>
                    <FormDescription>
                      Total thickness of the masonry facade (50-300mm)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="use_custom_load_position"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked)
                          if (!checked) {
                            // Reset to material-based default
                            const materialType = form.watch('material_type')
                            const loadPositions = {
                              'brick': 1/3,
                              'precast': 1/2,
                              'stone': 1/2
                            }
                            form.setValue('load_position', loadPositions[materialType as keyof typeof loadPositions] || 1/3)
                          }
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Custom Load Position</FormLabel>
                      <FormDescription>
                        Override material-based default load position
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {form.watch('use_custom_load_position') && (
                <FormField
                  control={form.control}
                  name="load_position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Load Position (fraction of facade thickness)</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <Slider
                            min={0.1}
                            max={0.9}
                            step={0.05}
                            value={[field.value || 1/3]}
                            onValueChange={(value) => field.onChange(value[0])}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Front (0.1)</span>
                            <span className="font-medium text-foreground">
                              {((field.value || 1/3) * 100).toFixed(0)}%
                            </span>
                            <span>Back (0.9)</span>
                          </div>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Position where the load is applied through the facade thickness
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="use_custom_facade_offsets"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Custom Facade Offsets</FormLabel>
                      <FormDescription>
                        Adjust front offset and isolation shim thickness
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {form.watch('use_custom_facade_offsets') && (
                <>
                  <FormField
                    control={form.control}
                    name="front_offset"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Front Offset (mm)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="12"
                            value={field.value ?? 12}
                            onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                            min="-50"
                            max="100"
                            step="1"
                          />
                        </FormControl>
                        <FormDescription>
                          Distance from facade front face to angle face (-50 to 100mm)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isolation_shim_thickness"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Isolation Shim Thickness (mm)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="3"
                            value={field.value ?? 3}
                            onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                            min="0"
                            max="20"
                            step="0.5"
                          />
                        </FormControl>
                        <FormDescription>
                          Thickness of thermal isolation material (0-20mm)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
          </div>
        )}
      </div>

      {/* Group 2: Fixing Configuration */}
      <div className="border rounded-lg overflow-hidden">
        <button
          onClick={() => setFixingExpanded(!fixingExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <span className="font-semibold">Fixing Configuration</span>
          <ChevronRight className={`h-4 w-4 transition-transform ${fixingExpanded ? 'rotate-90' : ''}`} />
        </button>
        {fixingExpanded && (
          <div className="p-4 space-y-4">
              <FormField
                control={form.control}
                name="use_custom_fixing_position"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Custom Fixing Position</FormLabel>
                      <FormDescription className="text-xs">
                        Override automatic fixing position calculation
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch('use_custom_fixing_position') && (
                <FormField
                  control={form.control}
                  name="fixing_position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Custom Fixing Position (mm)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="5"
                          min={fixingPositionConstraints.min}
                          max={fixingPositionConstraints.max}
                          placeholder="e.g. 100"
                          value={field.value ?? 75}
                          onChange={(e) => {
                            const inputValue = e.target.value
                            if (inputValue === '') {
                              field.onChange(fixingPositionConstraints.min)
                            } else {
                              field.onChange(Number(inputValue))
                            }
                          }}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Valid range: {fixingPositionConstraints.min}mm to {fixingPositionConstraints.max}mm (5mm increments)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="use_custom_dim_d"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked)
                          if (!checked) {
                            form.setValue("dim_d", 130)
                          } else {
                            const currentDimD = form.getValues("dim_d")
                            if (currentDimD === 130) {
                              form.setValue("dim_d", 200)
                            }
                          }
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Custom Dim D (Bracket Width)</FormLabel>
                      <FormDescription>
                        Override default bracket width of 130mm
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {form.watch('use_custom_dim_d') && (
                <FormField
                  control={form.control}
                  name="dim_d"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Custom Dim D (mm)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="130"
                          max="450"
                          step="5"
                          placeholder="130"
                          value={field.value || ''}
                          onChange={(e) => {
                            const inputValue = e.target.value
                            if (inputValue === '') {
                              field.onChange(130)
                            } else {
                              field.onChange(Number(inputValue))
                            }
                          }}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Bracket width in 5mm increments (130-450mm)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
          </div>
        )}
      </div>

      {/* Group 3: Bracket Configuration */}
      <div className="border rounded-lg overflow-hidden">
        <button
          onClick={() => setBracketExpanded(!bracketExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <span className="font-semibold">Bracket Configuration</span>
          <ChevronRight className={`h-4 w-4 transition-transform ${bracketExpanded ? 'rotate-90' : ''}`} />
        </button>
        {bracketExpanded && (
          <div className="p-4 space-y-6">
              {/* Notch Configuration Section */}
              <div className="space-y-4">
                <Label className="text-base font-medium mb-4 block">Bracket Notch</Label>
                <ToggleGroup
                  type="single"
                  value={form.watch("has_notch") ? "yes" : "no"}
                  onValueChange={(value) => {
                    if (value) {
                      form.setValue("has_notch", value === "yes")
                    }
                  }}
                  className="justify-start gap-2 mb-4"
                  variant="outline"
                  size="default"
                >
                  <ToggleGroupItem
                    value="yes"
                    aria-label="Yes"
                    className={cn(
                      "min-w-[80px]",
                      form.watch("has_notch") && "bg-[rgb(194,242,14)] text-black hover:brightness-95"
                    )}
                  >
                    Yes
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="no"
                    aria-label="No"
                    className={cn(
                      "min-w-[80px]",
                      !form.watch("has_notch") && "bg-[rgb(194,242,14)] text-black hover:brightness-95"
                    )}
                  >
                    No
                  </ToggleGroupItem>
                </ToggleGroup>

                {form.watch('has_notch') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="notch_height"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notch Height (mm)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="e.g., 50"
                              value={field.value ?? ''}
                              onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notch_depth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notch Depth (mm)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="e.g., 50"
                              value={field.value ?? ''}
                              onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>

              {/* Bracket Extension Section */}
              <div className="space-y-4 pt-4 border-t">
                <Label className="text-base font-medium mb-4 block">Bracket Extension for Exclusion Zones</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Enable this feature when brackets cannot extend fully due to SFS or other building elements.
                  The system will limit bracket extension and compensate by extending the angle height instead.
                </p>

                <ToggleGroup
                  type="single"
                  value={form.watch("enable_angle_extension") ? "yes" : "no"}
                  onValueChange={(value) => {
                    if (value) {
                      const enableExtension = value === "yes"
                      form.setValue("enable_angle_extension", enableExtension)

                      // Set default value for max_allowable_bracket_extension when enabling
                      if (enableExtension && form.getValues("max_allowable_bracket_extension") == null) {
                        form.setValue("max_allowable_bracket_extension", -200)
                      }
                    }
                  }}
                  className="justify-start gap-2 mb-4"
                  variant="outline"
                  size="default"
                >
                  <ToggleGroupItem
                    value="yes"
                    aria-label="Enable Angle Extension"
                    className={cn(
                      "min-w-[80px]",
                      form.watch("enable_angle_extension") && "bg-[rgb(194,242,14)] text-black hover:brightness-95"
                    )}
                  >
                    Enable
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="no"
                    aria-label="Disable Angle Extension"
                    className={cn(
                      "min-w-[80px]",
                      !form.watch("enable_angle_extension") && "bg-[rgb(194,242,14)] text-black hover:brightness-95"
                    )}
                  >
                    Disable
                  </ToggleGroupItem>
                </ToggleGroup>

                {form.watch("enable_angle_extension") && (
                  <FormField
                    control={form.control}
                    name="max_allowable_bracket_extension"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Bracket Position (mm)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g., -200"
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
          </div>
        )}
      </div>

    </div>
  )
}
