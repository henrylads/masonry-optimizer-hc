'use client'

import { useState } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { ChevronRight } from 'lucide-react'
import { CoreFields } from '@/components/design/core-fields'
import { AdvancedOptions } from '@/components/design/advanced-options'
import type { formSchema } from '@/types/form-schema'
import type { z } from 'zod'

interface DesignInputPanelProps {
  form: UseFormReturn<z.infer<typeof formSchema>>
  onOptimize: () => void
  isOptimizing: boolean
}

export function DesignInputPanel({
  form,
  onOptimize,
  isOptimizing
}: DesignInputPanelProps) {
  const [advancedExpanded, setAdvancedExpanded] = useState(false)

  // Check if form has validation errors
  const hasErrors = Object.keys(form.formState.errors).length > 0

  return (
    <div className="w-80 h-full border-r bg-white overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Top Run Optimization Button */}
        <Button
          onClick={onOptimize}
          disabled={isOptimizing || hasErrors}
          className="w-full bg-black hover:bg-black/90 text-white"
        >
          {isOptimizing ? 'Optimizing...' : 'Run Optimization'}
        </Button>

        {/* Core Fields */}
        <CoreFields form={form} />

        {/* Advanced Options */}
        <div className="border-t pt-4">
          <button
            onClick={() => setAdvancedExpanded(!advancedExpanded)}
            className="flex items-center gap-2 text-sm font-medium w-full hover:text-foreground transition-colors"
          >
            <ChevronRight
              className={`h-4 w-4 transition-transform ${advancedExpanded ? 'rotate-90' : ''}`}
            />
            Advanced Options
          </button>

          {advancedExpanded && (
            <div className="mt-4">
              <AdvancedOptions
                form={form}
                frameFixingType={form.watch('frame_fixing_type')}
              />
            </div>
          )}
        </div>

        {/* Bottom Run Optimization Button */}
        <Button
          onClick={onOptimize}
          disabled={isOptimizing || hasErrors}
          className="w-full bg-black hover:bg-black/90 text-white"
        >
          {isOptimizing ? 'Optimizing...' : 'Run Optimization'}
        </Button>
      </div>
    </div>
  )
}
