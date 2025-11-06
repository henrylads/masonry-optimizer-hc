'use client'

import { Project } from '@/types/project-types'
import { Button } from '@/components/ui/button'
import { MoreVertical } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'

interface ProjectTableProps {
  projects: (Project & { _count?: { designs: number } })[]
  onDelete: (id: string) => void
}

export function ProjectTable({ projects, onDelete }: ProjectTableProps) {
  const router = useRouter()

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Stage</TableHead>
          <TableHead>Value</TableHead>
          <TableHead>Designs</TableHead>
          <TableHead>Last Modified</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((project) => (
          <TableRow
            key={project.id}
            className="cursor-pointer"
            onClick={() => router.push(`/project/${project.id}`)}
          >
            <TableCell className="font-medium">{project.name}</TableCell>
            <TableCell>
              <Badge variant={project.stage === 'contract' ? 'default' : 'secondary'}>
                {project.stage === 'contract' ? 'Contract' : 'Planning'}
              </Badge>
            </TableCell>
            <TableCell>
              {project.totalValue ? `£${Number(project.totalValue).toLocaleString()}` : '-'}
            </TableCell>
            <TableCell>{project._count?.designs || 0}</TableCell>
            <TableCell>{new Date(project.updatedAt).toLocaleDateString()}</TableCell>
            <TableCell>
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
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
