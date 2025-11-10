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
import { getSectionSizes } from '@/data/steelSections'

interface AdvancedOptionsProps {
  form: UseFormReturn<FormDataType>
  frameFixingType: string
}

export function AdvancedOptions({ form, frameFixingType }: AdvancedOptionsProps) {
  const [geometryExpanded, setGeometryExpanded] = useState(false)
  const [fixingExpanded, setFixingExpanded] = useState(false)
  const [notchExpanded, setNotchExpanded] = useState(false)
  const [angleExpanded, setAngleExpanded] = useState(false)
  const [steelExpanded, setSteelExpanded] = useState(false)

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
                name="fixing_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fixing Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select fixing type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">All Fixing Types</SelectItem>
                        <SelectItem value="post-fix">Post-Fix Only</SelectItem>
                        <SelectItem value="channel-fix">Channel-Fix Only</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Algorithm will test selected fixing types
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Show channel product for cast-in and all concrete options */}
              {(frameFixingType === 'concrete-cast-in' || frameFixingType === 'concrete-all') && (
                <FormField
                  control={form.control}
                  name="channel_product"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Channel Fix Type</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select channel type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Channels</SelectItem>
                            <SelectItem value="CPRO38">CPRO38</SelectItem>
                            <SelectItem value="CPRO50">CPRO50</SelectItem>
                            <SelectItem value="CPRO52">CPRO52</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription>
                        Select specific channel product or test all
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Show postfix product for post-fix and all concrete options */}
              {(frameFixingType === 'concrete-post-fix' || frameFixingType === 'concrete-all') && (
                <FormField
                  control={form.control}
                  name="postfix_product"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Post Fix Type</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select post type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Post-Fix</SelectItem>
                            <SelectItem value="R-HPTIII-70">R-HPTIII-70</SelectItem>
                            <SelectItem value="R-HPTIII-90">R-HPTIII-90</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription>
                        Select specific post-fix product or test all
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

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

      {/* Group 3: Notch Configuration */}
      <div className="border rounded-lg overflow-hidden">
        <button
          onClick={() => setNotchExpanded(!notchExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <span className="font-semibold">Notch Configuration</span>
          <ChevronRight className={`h-4 w-4 transition-transform ${notchExpanded ? 'rotate-90' : ''}`} />
        </button>
        {notchExpanded && (
          <div className="p-4 space-y-4">
              <div>
                <Label className="text-base font-medium mb-4 block">Do you require a notch?</Label>
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
              </div>

              {form.watch('has_notch') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="notch_height"
                    render={({ field }) => (
                      <FormItem>
                        <div className="rounded-lg border p-4 h-full flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <FormLabel>Notch Height (mm)</FormLabel>
                              <span className="text-sm tabular-nums">
                                {field.value} mm
                              </span>
                            </div>
                            <FormDescription className="mb-3">
                              How high does the notch extend from the bottom of the bracket?
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Slider
                              min={10}
                              max={200}
                              step={5}
                              value={[field.value]}
                              onValueChange={(values) => field.onChange(values[0])}
                            />
                          </FormControl>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notch_depth"
                    render={({ field }) => (
                      <FormItem>
                        <div className="rounded-lg border p-4 h-full flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <FormLabel>Notch Depth (mm)</FormLabel>
                              <span className="text-sm tabular-nums">
                                {field.value} mm
                              </span>
                            </div>
                            <FormDescription className="mb-3">
                              How deep does the notch cut into the bracket?
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Slider
                              min={10}
                              max={200}
                              step={5}
                              value={[field.value]}
                              onValueChange={(values) => field.onChange(values[0])}
                            />
                          </FormControl>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              )}
          </div>
        )}
      </div>

      {/* Group 4: Angle Configuration */}
      <div className="border rounded-lg overflow-hidden">
        <button
          onClick={() => setAngleExpanded(!angleExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <span className="font-semibold">Angle Configuration</span>
          <ChevronRight className={`h-4 w-4 transition-transform ${angleExpanded ? 'rotate-90' : ''}`} />
        </button>
        {angleExpanded && (
          <div className="p-4 space-y-4">
              <div>
                <Label className="text-base font-medium mb-4 block">Is there a limit to the angle length?</Label>
                <ToggleGroup
                  type="single"
                  value={form.watch("is_angle_length_limited") ? "yes" : "no"}
                  onValueChange={(value) => {
                    if (value) {
                      form.setValue("is_angle_length_limited", value === "yes")
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
                      form.watch("is_angle_length_limited") && "bg-[rgb(194,242,14)] text-black hover:brightness-95"
                    )}
                  >
                    Yes
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="no"
                    aria-label="No"
                    className={cn(
                      "min-w-[80px]",
                      !form.watch("is_angle_length_limited") && "bg-[rgb(194,242,14)] text-black hover:brightness-95"
                    )}
                  >
                    No
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              {form.watch("is_angle_length_limited") && (
                <FormField
                  control={form.control}
                  name="fixed_angle_length"
                  render={({ field }) => (
                    <FormItem>
                      <div className="rounded-lg border p-4 h-full flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <FormLabel>Fixed Angle Length (mm)</FormLabel>
                            <span className="text-sm tabular-nums">
                              {field.value ?? 750} mm
                            </span>
                          </div>
                          <FormDescription className="mb-3">
                            Maximum angle length in 5mm increments (200-1490mm)
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Slider
                            min={200}
                            max={1490}
                            step={5}
                            value={[field.value ?? 750]}
                            onValueChange={(values) => field.onChange(values[0])}
                          />
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              )}

              <div className="mt-6">
                <Label className="text-base font-medium mb-4 block">Angle Extension for Exclusion Zones</Label>
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
              </div>

              {form.watch("enable_angle_extension") && (
                <FormField
                  control={form.control}
                  name="max_allowable_bracket_extension"
                  render={({ field }) => (
                    <FormItem>
                      <div className="rounded-lg border p-4 h-full flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <FormLabel>Max Bracket Position (mm)</FormLabel>
                            <span className="text-sm tabular-nums">
                              {field.value ?? -200} mm
                            </span>
                          </div>
                          <FormDescription className="mb-3">
                            Maximum allowable bracket position in 5mm increments.
                            0 is at top of slab (often negative). When exceeded, the angle will be extended to compensate.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Slider
                            min={-1000}
                            max={500}
                            step={5}
                            value={[field.value ?? -200]}
                            onValueChange={(values) => field.onChange(values[0])}
                          />
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              )}
          </div>
        )}
      </div>

      {/* Group 5: Steel Section Configuration (conditional on steel types) */}
      {isSteelType && (
        <div className="border rounded-lg overflow-hidden">
          <button
            onClick={() => setSteelExpanded(!steelExpanded)}
            className="w-full px-4 py-3 flex items-center justify-between bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <span className="font-semibold">Steel Section Configuration</span>
            <ChevronRight className={`h-4 w-4 transition-transform ${steelExpanded ? 'rotate-90' : ''}`} />
          </button>
          {steelExpanded && (
            <div className="p-4 space-y-4">
                <FormField
                  control={form.control}
                  name="use_custom_steel_section"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Custom Steel Section</FormLabel>
                        <FormDescription className="text-xs">
                          Use custom height instead of standard sections
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

                {!form.watch('use_custom_steel_section') ? (
                  <FormField
                    control={form.control}
                    name="steel_section_size"
                    render={({ field }) => {
                      const frameType = form.watch('frame_fixing_type')
                      let availableSizes: string[] = []
                      let sectionLabel = 'Standard Size'

                      if (frameType === 'steel-ibeam') {
                        availableSizes = getSectionSizes('I-BEAM')
                        sectionLabel = 'I-Beam Size'
                      } else if (frameType === 'steel-rhs') {
                        availableSizes = getSectionSizes('RHS')
                        sectionLabel = 'RHS Size'
                      } else if (frameType === 'steel-shs') {
                        availableSizes = getSectionSizes('SHS')
                        sectionLabel = 'SHS Size'
                      }

                      return (
                        <FormItem>
                          <FormLabel>{sectionLabel}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={`Select ${sectionLabel.toLowerCase()}`} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {availableSizes.map((size) => (
                                <SelectItem key={size} value={size}>
                                  {size}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription className="text-xs">
                            Select from standard section sizes
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )
                    }}
                  />
                ) : (
                  <FormField
                    control={form.control}
                    name="custom_steel_height"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custom Height (mm)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="1"
                            placeholder="e.g. 150"
                            value={field.value}
                            onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="steel_bolt_size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bolt Size Options</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select bolt sizes" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="all">All Bolt Sizes (M10/M12/M16)</SelectItem>
                          <SelectItem value="M10">M10 Only</SelectItem>
                          <SelectItem value="M12">M12 Only</SelectItem>
                          <SelectItem value="M16">M16 Only</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-xs">
                        Algorithm will test selected bolt sizes
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {frameFixingType === 'steel-ibeam' && (
                  <FormField
                    control={form.control}
                    name="steel_fixing_method"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fixing Method (I-Beam)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select fixing method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="SET_SCREW">Set Screws Only</SelectItem>
                            <SelectItem value="BLIND_BOLT">Blind Bolts Only</SelectItem>
                            <SelectItem value="both">Test Both (Optimize)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-xs">
                          I-Beam can use set screws or blind bolts. RHS/SHS must use blind bolts.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
