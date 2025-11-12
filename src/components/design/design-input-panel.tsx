'use client'

import { useState } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { MessageSquare, Wrench, Send, Settings } from 'lucide-react'
import { CoreFields } from '@/components/design/core-fields'
import { AdvancedOptions } from '@/components/design/advanced-options'
import { InlineDensityCalculator } from '@/components/design/inline-density-calculator'
import type { formSchema } from '@/types/form-schema'
import type { z } from 'zod'
import { cn } from '@/lib/utils'

interface DesignInputPanelProps {
  form: UseFormReturn<z.infer<typeof formSchema>>
  onOptimize: () => void
  isOptimizing: boolean
}

type Section = 'core' | 'advanced' | 'chat'

export function DesignInputPanel({
  form,
  onOptimize,
  isOptimizing
}: DesignInputPanelProps) {
  const [activeSection, setActiveSection] = useState<Section>('core')
  const [showDensityCalculator, setShowDensityCalculator] = useState(false)

  // Check if form has validation errors
  const hasErrors = Object.keys(form.formState.errors).length > 0

  // Handler for density calculator value selection
  const handleDensityCalculatorValue = (load: number) => {
    form.setValue('characteristic_load', load)
    setShowDensityCalculator(false)
  }

  const sections = [
    {
      id: 'core' as Section,
      icon: Wrench,
      label: 'Design Parameters',
      content: (
        <div className="space-y-4">
          <CoreFields
            form={form}
            onOpenDensityCalculator={() => setShowDensityCalculator(!showDensityCalculator)}
          />

          {/* Density Calculator - conditionally rendered */}
          {showDensityCalculator && (
            <InlineDensityCalculator
              onValueSelect={handleDensityCalculatorValue}
            />
          )}
        </div>
      )
    },
    {
      id: 'advanced' as Section,
      icon: Settings,
      label: 'Advanced Options',
      content: (
        <AdvancedOptions form={form} frameFixingType={form.watch('frame_fixing_type')} />
      )
    },
    {
      id: 'chat' as Section,
      icon: MessageSquare,
      label: 'AI Chat',
      content: (
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Chat with AI to help configure your masonry support system
          </div>
          <div className="border rounded-lg p-4 bg-muted/30 min-h-[300px] flex flex-col">
            <div className="flex-1 space-y-3 mb-4">
              <div className="bg-background p-3 rounded-lg text-sm">
                <p className="font-medium mb-1">AI Assistant</p>
                <p className="text-muted-foreground">
                  Hello! I can help you configure your masonry support system. What would you like to know?
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 border rounded-lg text-sm"
                disabled
              />
              <Button size="sm" disabled>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )
    }
  ]

  // Find the active section content
  const activeContent = sections.find(s => s.id === activeSection)

  return (
    <div className="absolute inset-0 flex overflow-hidden">
      {/* Icon Navigation Bar */}
      <div className="w-14 bg-muted/30 border-r flex flex-col items-center py-4 gap-2 flex-shrink-0">
        {sections.map((section) => {
          const Icon = section.icon
          const isActive = activeSection === section.id

          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
                "hover:bg-muted",
                isActive && "bg-background shadow-sm border-l-2 border-primary"
              )}
              title={section.label}
            >
              <Icon className={cn(
                "h-5 w-5",
                isActive ? "text-foreground" : "text-muted-foreground"
              )} />
            </button>
          )
        })}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-8">
            {/* Active Section Content */}
            {activeContent?.content}

            {/* Bottom Run Optimization Button - only show on Design Parameters tab */}
            {activeSection === 'core' && (
              <Button
                onClick={onOptimize}
                disabled={isOptimizing || hasErrors}
                className="w-full bg-black hover:bg-black/90 text-white mt-2"
              >
                {isOptimizing ? 'Optimizing...' : 'Run Optimization'}
              </Button>
            )}
        </div>
      </div>
    </div>
  )
}
