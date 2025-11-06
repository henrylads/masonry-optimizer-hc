'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CreateDesignInput } from '@/types/design-types'
import { Design } from '@/types/design-types'

interface CreateDesignModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateDesignInput) => Promise<void>
  existingDesigns: Design[]
}

export function CreateDesignModal({
  open,
  onOpenChange,
  onSubmit,
  existingDesigns
}: CreateDesignModalProps) {
  const [name, setName] = useState('')
  const [mode, setMode] = useState<'scratch' | 'duplicate'>('scratch')
  const [sourceDesignId, setSourceDesignId] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await onSubmit({
        name,
        sourceDesignId: mode === 'duplicate' ? sourceDesignId : undefined,
      })

      // Reset form
      setName('')
      setMode('scratch')
      setSourceDesignId('')
      onOpenChange(false)
    } catch (error) {
      console.error('Error creating design:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Design</DialogTitle>
            <DialogDescription>
              Add a new facade design to this project.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Design Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., North Facade - Option A"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>Starting Point</Label>
              <RadioGroup value={mode} onValueChange={(v) => setMode(v as 'scratch' | 'duplicate')}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="scratch" id="scratch" />
                  <Label htmlFor="scratch" className="font-normal">Start from scratch</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="duplicate" id="duplicate" disabled={existingDesigns.length === 0} />
                  <Label htmlFor="duplicate" className="font-normal">Duplicate existing design</Label>
                </div>
              </RadioGroup>
            </div>
            {mode === 'duplicate' && existingDesigns.length > 0 && (
              <div className="grid gap-2">
                <Label htmlFor="source">Source Design</Label>
                <Select value={sourceDesignId} onValueChange={setSourceDesignId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select design to duplicate" />
                  </SelectTrigger>
                  <SelectContent>
                    {existingDesigns.map((design) => (
                      <SelectItem key={design.id} value={design.id}>
                        {design.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !name || (mode === 'duplicate' && !sourceDesignId)}
            >
              Create Design
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
