'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { ProjectSidebar } from '@/components/project/project-sidebar'
import { CreateDesignModal } from '@/components/project/create-design-modal'
import { useProject } from '@/hooks/use-project'
import { CreateDesignInput } from '@/types/design-types'
import { AuthHeader } from '@/components/auth-header'
import { MainNavigation } from '@/components/main-navigation'
import { Button } from '@/components/ui/button'
import MasonryDesignerForm from '@/components/masonry-designer-form'

export default function ProjectPage() {
  const params = useParams()
  const projectId = params.id as string
  const [activeDesignId, setActiveDesignId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const { project, designs, isLoading, mutate } = useProject(projectId)

  const handleCreateDesign = async (data: CreateDesignInput) => {
    const response = await fetch(`/api/projects/${projectId}/designs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (response.ok) {
      const { design } = await response.json()
      mutate()
      setActiveDesignId(design.id)
    }
  }

  const handleDeleteDesign = async (designId: string) => {
    if (!confirm('Are you sure you want to delete this design?')) return

    await fetch(`/api/designs/${designId}`, { method: 'DELETE' })
    if (activeDesignId === designId) {
      setActiveDesignId(null)
    }
    mutate()
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!project) {
    return <div className="min-h-screen flex items-center justify-center">Project not found</div>
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AuthHeader />
      <MainNavigation hideNavTabs />

      <div className="flex-1 flex">
        <ProjectSidebar
          project={project}
          designs={designs}
          activeDesignId={activeDesignId}
          onSelectDesign={setActiveDesignId}
          onNewDesign={() => setModalOpen(true)}
          onDeleteDesign={handleDeleteDesign}
        />

        <main className="flex-1 p-8 overflow-auto">
          {!activeDesignId ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <h2 className="text-2xl font-bold mb-4">No design selected</h2>
              <p className="text-muted-foreground mb-6">
                Create a new design to start optimizing masonry support systems for this project.
              </p>
              <Button onClick={() => setModalOpen(true)}>
                Create First Design
              </Button>
            </div>
          ) : (
            <MasonryDesignerForm
              designId={activeDesignId}
              projectId={projectId}
            />
          )}
        </main>
      </div>

      <CreateDesignModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={handleCreateDesign}
        existingDesigns={designs}
      />
    </div>
  )
}
