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
  const isConcreteType = frameFixingType?.startsWith('concrete')

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
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
                Distance between frame and masonry (50-400mm)
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
                Type of structural frame connection
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Field 3: Slab Thickness (conditional on concrete types) */}
        {isConcreteType && (
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
                  Concrete slab depth (150-500mm)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
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
                Vertical offset from slab (-600 to 500mm)
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
                Characteristic load per meter (1-50 kN/m)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}
