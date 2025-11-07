'use client'

import { Project } from '@/types/project-types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pencil } from 'lucide-react'

interface ProjectHeaderProps {
  project: Project
  onDelete: () => void
  onClearData?: () => void
  onChangeProject?: () => void
}

export function ProjectHeader({
  project,
  onDelete,
  onClearData,
  onChangeProject
}: ProjectHeaderProps) {
  return (
    <div className="border-b pb-6 mb-6">
      <div className="flex items-start justify-between">
        {/* Left: Project title and metadata */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-muted-foreground mb-3">Construction Drawing Intelligence</p>
          <div className="flex gap-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
              Active
            </Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
              {project.stage === 'contract' ? 'Construction' : 'Planning'}
            </Badge>
          </div>
        </div>

        {/* Right: Action buttons */}
        <div className="flex gap-2">
          <Button
            variant="destructive"
            onClick={onDelete}
          >
            Delete Project
          </Button>
          {onClearData && (
            <Button
              variant="outline"
              onClick={onClearData}
            >
              Clear Data
            </Button>
          )}
          {onChangeProject && (
            <Button
              variant="outline"
              onClick={onChangeProject}
            >
              Change Project
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
