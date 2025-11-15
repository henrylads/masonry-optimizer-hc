'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronLeft, Pencil, Loader2 } from 'lucide-react'

interface DesignBreadcrumbProps {
  projectId: string
  projectName: string
  designId: string
  designName: string
  saveStatus: 'saved' | 'saving' | 'error'
  onUpdateDesignName: (name: string) => Promise<void>
}

export function DesignBreadcrumb({
  projectId,
  projectName,
  designId,
  designName,
  saveStatus,
  onUpdateDesignName
}: DesignBreadcrumbProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState(designName)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleSave = async () => {
    if (editedName.trim() === '' || editedName === designName) {
      setIsEditing(false)
      setEditedName(designName)
      return
    }

    setIsUpdating(true)
    try {
      await onUpdateDesignName(editedName.trim())
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update design name:', error)
      setEditedName(designName)
      setIsEditing(false)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      setEditedName(designName)
      setIsEditing(false)
    }
  }

  return (
    <div className="h-12 border-b bg-white px-4 flex items-center justify-center sticky top-0 z-10 relative">
      {/* Centered breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <button
          onClick={() => router.push('/dashboard')}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          Projects
        </button>
        <span className="text-muted-foreground">/</span>
        <button
          onClick={() => router.push(`/project/${projectId}`)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          {projectName}
        </button>
        <span className="text-muted-foreground">/</span>

        {isEditing ? (
          <Input
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            disabled={isUpdating}
            className="h-7 w-48"
            autoFocus
          />
        ) : (
          <div className="flex items-center gap-1">
            <span className="font-semibold">{designName}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="h-6 w-6 p-0"
            >
              <Pencil className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Absolute positioned save status on the right */}
      <div className="absolute right-4 flex items-center gap-2 text-sm">
        {saveStatus === 'saved' && (
          <>
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-muted-foreground">Saved</span>
          </>
        )}
        {saveStatus === 'saving' && (
          <>
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            <span className="text-muted-foreground">Saving...</span>
          </>
        )}
        {saveStatus === 'error' && (
          <>
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <span className="text-red-500">Save failed</span>
          </>
        )}
      </div>
    </div>
  )
}
