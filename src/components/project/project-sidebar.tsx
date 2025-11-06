'use client'

import { Project } from '@/types/project-types'
import { Design } from '@/types/design-types'
import { Button } from '@/components/ui/button'
import { Plus, MoreVertical } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface ProjectSidebarProps {
  project: Project
  designs: Design[]
  activeDesignId: string | null
  onSelectDesign: (designId: string) => void
  onNewDesign: () => void
  onDeleteDesign: (designId: string) => void
}

export function ProjectSidebar({
  project,
  designs,
  activeDesignId,
  onSelectDesign,
  onNewDesign,
  onDeleteDesign,
}: ProjectSidebarProps) {
  return (
    <div className="w-64 border-r bg-muted/10 flex flex-col">
      {/* Project header */}
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg mb-2">{project.name}</h2>
        <Badge variant={project.stage === 'contract' ? 'default' : 'secondary'}>
          {project.stage === 'contract' ? 'Contract' : 'Planning'}
        </Badge>
      </div>

      {/* Designs list */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-muted-foreground">Designs</h3>
          <Button size="sm" variant="ghost" onClick={onNewDesign}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-1">
          {designs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No designs yet
            </p>
          ) : (
            designs.map((design) => (
              <div
                key={design.id}
                className={cn(
                  "flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-accent",
                  activeDesignId === design.id && "bg-accent"
                )}
                onClick={() => onSelectDesign(design.id)}
              >
                <span className="text-sm truncate flex-1">{design.name}</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteDesign(design.id)
                      }}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
