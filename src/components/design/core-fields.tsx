'use client'

import { UseFormReturn } from 'react-hook-form'
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
import { Button } from '@/components/ui/button'
import { Calculator } from 'lucide-react'
import { FormDataType } from '@/types/form-schema'

interface CoreFieldsProps {
  form: UseFormReturn<FormDataType>
  onOpenDensityCalculator?: () => void
}

export function CoreFields({ form, onOpenDensityCalculator }: CoreFieldsProps) {
  const frameFixingType = form.watch('frame_fixing_type')
  const steelSectionType = form.watch('steel_section_type')
  const isConcreteType = frameFixingType?.startsWith('concrete')
  const isSteelType = frameFixingType?.startsWith('steel')

  // Import steel section sizes dynamically based on type
  const getSectionSizesForType = (type: string | undefined): string[] => {
    if (!type) return []
    switch (type) {
      case 'I-BEAM':
        return [
          '127x76', '152x89', '178x102', '203x102', '203x133',
          '254x102', '254x146', '305x102', '305x127', '305x165',
          '356x127', '356x171', '406x140', '406x178', '457x152',
          '457x191', '533x210', '610x229', '610x305', '686x254',
          '762x267', '838x292', '914x305', '914x419'
        ]
      case 'RHS':
        return [
          '50x25', '50x30', '60x40', '80x40', '80x60', '90x50',
          '100x40', '100x50', '100x60', '100x80',
          '120x40', '120x60', '120x80',
          '150x100', '160x80', '200x100', '250x150', '300x200',
          '400x200', '450x250'
        ]
      case 'SHS':
        return [
          '20x20', '25x25', '30x30', '40x40', '50x50', '60x60',
          '70x70', '80x80', '90x90', '100x100', '120x120',
          '150x150', '180x180', '200x200', '250x250', '300x300'
        ]
      default:
        return []
    }
  }

  const sectionSizes = getSectionSizesForType(steelSectionType)

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-1">
        {/* Field 1: Cavity Width */}
        <FormField
          control={form.control}
          name="cavity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cavity Width (mm) *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.5"
                  placeholder="e.g., 100"
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                />
              </FormControl>
              <FormDescription>
                50-400mm
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Field 2: Frame Fixing Type */}
        <FormField
          control={form.control}
          name="frame_fixing_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Frame Fixing Type *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select fixing type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="concrete-cast-in">Cast-in Channel</SelectItem>
                  <SelectItem value="concrete-post-fix">Post-fix Anchor</SelectItem>
                  <SelectItem value="concrete-all">All Concrete Options</SelectItem>
                  <SelectItem value="steel-ibeam">Steel I-Beam</SelectItem>
                  <SelectItem value="steel-rhs">Steel RHS</SelectItem>
                  <SelectItem value="steel-shs">Steel SHS</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Structural frame type
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Field 3: Slab Thickness (conditional on concrete types) */}
        {isConcreteType && (
          <>
            <FormField
              control={form.control}
              name="slab_thickness"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slab Thickness (mm) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 225"
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    150-500mm
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Channel Product (for cast-in and all concrete options) */}
            {(frameFixingType === 'concrete-cast-in' || frameFixingType === 'concrete-all') && (
              <FormField
                control={form.control}
                name="channel_product"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Channel Fix Type *</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select channel type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">All Channels</SelectItem>
                        <SelectItem value="CPRO38">CPRO38</SelectItem>
                        <SelectItem value="CPRO50">CPRO50</SelectItem>
                        <SelectItem value="CPRO52">CPRO52</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select specific channel product or test all
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Postfix Product (for post-fix and all concrete options) */}
            {(frameFixingType === 'concrete-post-fix' || frameFixingType === 'concrete-all') && (
              <FormField
                control={form.control}
                name="postfix_product"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Post Fix Type *</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select post type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">All Post-Fix</SelectItem>
                        <SelectItem value="R-HPTIII-70">R-HPTIII-70</SelectItem>
                        <SelectItem value="R-HPTIII-90">R-HPTIII-90</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select specific post-fix product or test all
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </>
        )}

        {/* Steel Configuration Fields (conditional on steel types) */}
        {isSteelType && (
          <>
            {/* Steel Section Type */}
            <FormField
              control={form.control}
              name="steel_section_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Steel Section Type *</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value)
                      // Reset section size when type changes
                      form.setValue('steel_section_size', undefined)
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select section type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="I-BEAM">I-Beam</SelectItem>
                      <SelectItem value="RHS">RHS (Rectangular Hollow Section)</SelectItem>
                      <SelectItem value="SHS">SHS (Square Hollow Section)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Type of steel section
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Steel Section Size */}
            {steelSectionType && (
              <FormField
                control={form.control}
                name="steel_section_size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Steel Section Size *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select section size" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sectionSizes.map((size) => (
                          <SelectItem key={size} value={size}>
                            {size}mm
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {steelSectionType === 'I-BEAM' && 'Format: depth x flange width'}
                      {steelSectionType === 'RHS' && 'Format: height x width'}
                      {steelSectionType === 'SHS' && 'Format: side x side'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Steel Bolt Size */}
            <FormField
              control={form.control}
              name="steel_bolt_size"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Steel Bolt Size *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select bolt size" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="all">All Sizes (optimizer will choose)</SelectItem>
                      <SelectItem value="M10">M10</SelectItem>
                      <SelectItem value="M12">M12</SelectItem>
                      <SelectItem value="M16">M16</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Bolt diameter for steel fixings
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {/* Field 4: Bracket Drop */}
        <FormField
          control={form.control}
          name="support_level"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bracket Drop (mm) *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="e.g., 0"
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                />
              </FormControl>
              <FormDescription>
                -600 to 500mm
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Field 5: Characteristic Load */}
        <FormField
          control={form.control}
          name="characteristic_load"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Load (kN/m) *</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="e.g., 5.5"
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                  />
                </FormControl>
                {onOpenDensityCalculator && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={onOpenDensityCalculator}
                    title="Calculate from masonry density"
                  >
                    <Calculator className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <FormDescription>
                1-50 kN/m
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Field 6: Run Length */}
        <FormField
          control={form.control}
          name="run_length"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Run Length (mm) *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="e.g., 5000"
                  value={field.value ?? 1000}
                  onChange={(e) => field.onChange(Number(e.target.value) || 1000)}
                />
              </FormControl>
              <FormDescription>
                100-250000mm (for 3D visualization)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}
