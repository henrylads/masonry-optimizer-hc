'use client'

import { useState } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { FormDataType } from '@/types/form-schema'

interface AdvancedOptionsProps {
  form: UseFormReturn<FormDataType>
  frameFixingType: string
}

export function AdvancedOptions({ form, frameFixingType }: AdvancedOptionsProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="w-full space-y-4"
    >
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="flex w-full justify-between items-center p-4 hover:bg-muted"
        >
          <div className="flex items-center gap-2">
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                isOpen ? 'transform rotate-180' : ''
              }`}
            />
            <span className="font-medium">Advanced Options</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {isOpen ? 'Hide' : 'Show'} additional parameters
          </span>
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="space-y-6 pt-4">
        {/* Field groups will go here in next steps */}
        <div className="text-sm text-muted-foreground px-4">
          Advanced options will be organized here by category
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
