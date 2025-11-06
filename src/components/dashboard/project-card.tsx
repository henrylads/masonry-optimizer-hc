'use client'

import { Project } from '@/types/project-types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MoreVertical } from 'lucide-react'
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

  const handleClick = () => {
    router.push(`/project/${project.id}`)
  }

  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={handleClick}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="flex-1">
          <CardTitle className="text-lg">{project.name}</CardTitle>
          <Badge variant={project.stage === 'contract' ? 'default' : 'secondary'} className="mt-2">
            {project.stage === 'contract' ? 'Contract' : 'Planning'}
          </Badge>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm">
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
      <CardContent>
        <div className="space-y-2 text-sm text-muted-foreground">
          {project.totalValue && (
            <p>Value: £{Number(project.totalValue).toLocaleString()}</p>
          )}
          <p>{project._count?.designs || 0} designs</p>
          <p className="text-xs">Updated {new Date(project.updatedAt).toLocaleDateString()}</p>
        </div>
      </CardContent>
    </Card>
  )
}
