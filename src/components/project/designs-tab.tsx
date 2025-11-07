'use client'

import { Design } from '@/types/design-types'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { DesignCard } from './design-card'

interface DesignsTabProps {
  designs: Design[]
  onNewDesign: () => void
  onDeleteDesign: (designId: string) => void
  projectId: string
}

export function DesignsTab({
  designs,
  onNewDesign,
  onDeleteDesign,
  projectId
}: DesignsTabProps) {
  if (designs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <h2 className="text-2xl font-bold mb-4">No designs yet</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Create your first design to start optimizing masonry support systems for this project.
        </p>
        <Button
          size="lg"
          onClick={onNewDesign}
          className="bg-accent hover:bg-accent/90"
        >
          <Plus className="mr-2 h-5 w-5" />
          Create First Design
        </Button>
      </div>
    )
  }

  return (
    <div>
      {/* Header with design count and new button */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">
          Designs ({designs.length})
        </h2>
        <Button
          onClick={onNewDesign}
          className="bg-black hover:bg-black/90 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Design
        </Button>
      </div>

      {/* Design cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {designs.map((design) => (
          <DesignCard
            key={design.id}
            design={design}
            projectId={projectId}
            onDelete={onDeleteDesign}
          />
        ))}
      </div>
    </div>
  )
}
