'use client'

import { Project } from '@/types/project-types'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MoreVertical, FileText } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ProjectCardProps {
  project: Project & { _count?: { designs: number } }
  onDelete: (id: string) => void
}

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const router = useRouter()

  const handleOpenProject = (e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/project/${project.id}`)
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-1">{project.name}</h3>
          <p className="text-sm text-muted-foreground">Construction Drawing Intelligence</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation()
              onDelete(project.id)
            }}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
            Active
          </Badge>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            {project.stage === 'contract' ? 'Construction' : 'Planning'}
          </Badge>
        </div>

        <div className="flex items-center text-sm text-muted-foreground">
          <FileText className="h-4 w-4 mr-1" />
          <span>{project._count?.designs || 0} docs</span>
        </div>

        <p className="text-xs text-muted-foreground">
          Updated {new Date(project.updatedAt).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })}
        </p>

        <Button
          className="w-full bg-black hover:bg-black/90 text-white"
          onClick={handleOpenProject}
        >
          Open Project
        </Button>
      </CardContent>
    </Card>
  )
}
