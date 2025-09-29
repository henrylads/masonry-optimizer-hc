"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover'
import { 
  HelpCircle, 
  Zap, 
  MessageSquare, 
  HandIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { WorkflowMode, WorkflowToggleProps } from '@/types/chat-types'
import { WORKFLOW_DESCRIPTIONS } from '@/types/chat-types'

const WORKFLOW_ICONS: Record<WorkflowMode, React.ElementType> = {
  'manual': HandIcon,
  'ai-assisted': MessageSquare,
  'fully-automated': Zap
}

export function WorkflowToggle({ 
  currentMode, 
  onModeChange, 
  disabled = false, 
  className 
}: WorkflowToggleProps) {
  const [showInfo, setShowInfo] = useState(false)
  
  const CurrentIcon = WORKFLOW_ICONS[currentMode]
  const currentDescription = WORKFLOW_DESCRIPTIONS[currentMode]

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Workflow Mode Selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Workflow:</span>
        <Select 
          value={currentMode} 
          onValueChange={(value: WorkflowMode) => onModeChange(value)}
          disabled={disabled}
        >
          <SelectTrigger className="w-[180px]">
            <div className="flex items-center gap-2">
              <CurrentIcon className="h-4 w-4" />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(WORKFLOW_DESCRIPTIONS) as WorkflowMode[]).map((mode) => {
              const Icon = WORKFLOW_ICONS[mode]
              const description = WORKFLOW_DESCRIPTIONS[mode]
              return (
                <SelectItem key={mode} value={mode}>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span>{description.title}</span>
                  </div>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Info Popover */}
      <Popover open={showInfo} onOpenChange={setShowInfo}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            disabled={disabled}
          >
            <HelpCircle className="h-4 w-4" />
            <span className="sr-only">Workflow information</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <CurrentIcon className="h-4 w-4" />
                {currentDescription.title}
              </CardTitle>
              <CardDescription>
                {currentDescription.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="text-sm font-medium mb-2">Benefits:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {currentDescription.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-[#c2f20e] mt-1">•</span>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Best for:</h4>
                <p className="text-sm text-muted-foreground">
                  {currentDescription.bestFor}
                </p>
              </div>
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default WorkflowToggle 