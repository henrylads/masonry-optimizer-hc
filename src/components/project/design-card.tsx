'use client'

import { Design } from '@/types/design-types'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MoreVertical, Weight, DollarSign } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface DesignCardProps {
  design: Design
  onOpen: (designId: string) => void
  onDelete: (designId: string) => void
}

// Define explicit status type for type safety
type DesignStatus = 'New' | 'Draft' | 'Optimized' | 'In Review'

export function DesignCard({ design, onOpen, onDelete }: DesignCardProps) {
  // Derive status from design data (basic logic - can be enhanced)
  const getStatus = (): DesignStatus => {
    if (design.calculationResults) return 'Optimized'
    if (design.formParameters && Object.keys(design.formParameters).length > 0) return 'Draft'
    return 'New'
  }

  const status = getStatus()

  // Status badge colors with complete class strings including hover states
  // NOTE: Tailwind requires complete class strings for proper detection
  const statusColors: Record<DesignStatus, string> = {
    'New': 'bg-gray-100 text-gray-800 hover:bg-gray-100',
    'Draft': 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
    'Optimized': 'bg-green-100 text-green-800 hover:bg-green-100',
    'In Review': 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  }

  const handleOpenClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onOpen(design.id)
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-1">{design.name}</h3>
          <p className="text-sm text-muted-foreground">Masonry Support Design</p>
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
              onDelete(design.id)
            }}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Badge
            variant="secondary"
            className={statusColors[status]}
          >
            {status}
          </Badge>
        </div>

        {/* Placeholder for future metrics */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center">
            <Weight className="h-4 w-4 mr-1" />
            <span>TBD</span>
          </div>
          <div className="flex items-center">
            <DollarSign className="h-4 w-4 mr-1" />
            <span>TBD</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Updated {new Date(design.updatedAt).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })}
        </p>

        <Button
          className="w-full bg-black hover:bg-black/90 text-white"
          onClick={handleOpenClick}
        >
          Open Design
        </Button>
      </CardContent>
    </Card>
  )
}
