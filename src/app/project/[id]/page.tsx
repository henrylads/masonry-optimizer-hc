'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { AppSidebar } from '@/components/app-sidebar'
import { ProjectHeader } from '@/components/project/project-header'
import { DesignsTab } from '@/components/project/designs-tab'
import { IntelligenceTab } from '@/components/project/intelligence-tab'
import { CreateDesignModal } from '@/components/project/create-design-modal'
import { useProject } from '@/hooks/use-project'
import { CreateDesignInput } from '@/types/design-types'
import { AuthHeader } from '@/components/auth-header'
import { MainNavigation } from '@/components/main-navigation'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChevronLeft } from 'lucide-react'
import MasonryDesignerForm from '@/components/masonry-designer-form'
import { useRouter } from 'next/navigation'

export default function ProjectPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const [activeTab, setActiveTab] = useState<'designs' | 'intelligence'>('designs')
  const [activeDesignId, setActiveDesignId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const { project, designs, isLoading, mutate } = useProject(projectId)

  const handleCreateDesign = async (data: CreateDesignInput) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/designs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        alert(`Failed to create design: ${error.message || 'Unknown error'}`)
        return
      }

      const { design } = await response.json()
      mutate()
      setActiveDesignId(design.id)
    } catch (error) {
      console.error('Error creating design:', error)
      alert('An error occurred while creating the design. Please try again.')
    }
  }

  const handleDeleteDesign = async (designId: string) => {
    if (!confirm('Are you sure you want to delete this design?')) return

    try {
      const response = await fetch(`/api/designs/${designId}`, { method: 'DELETE' })

      if (!response.ok) {
        const error = await response.json()
        alert(`Failed to delete design: ${error.message || 'Unknown error'}`)
        return
      }

      if (activeDesignId === designId) {
        setActiveDesignId(null)
      }
      mutate()
    } catch (error) {
      console.error('Error deleting design:', error)
      alert('An error occurred while deleting the design. Please try again.')
    }
  }

  const handleDeleteProject = async () => {
    if (!confirm('Are you sure you want to delete this project? This cannot be undone.')) return

    try {
      const response = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' })

      if (!response.ok) {
        const error = await response.json()
        alert(`Failed to delete project: ${error.message || 'Unknown error'}`)
        return
      }

      router.push('/dashboard')
    } catch (error) {
      console.error('Error deleting project:', error)
      alert('An error occurred while deleting the project. Please try again.')
    }
  }

  const handleBackToDesigns = () => {
    setActiveDesignId(null)
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!project) {
    return <div className="min-h-screen flex items-center justify-center">Project not found</div>
  }

  const showDesignForm = activeDesignId !== null && activeTab === 'designs'

  return (
    <div className="min-h-screen flex flex-col">
      <AuthHeader />
      <MainNavigation hideNavTabs />

      <div className="flex-1 flex">
        <AppSidebar />

        <main className="flex-1 p-8 overflow-auto">
          {/* Project Header */}
          <ProjectHeader
            project={project}
            onDelete={handleDeleteProject}
          />

          {/* Tabs Navigation */}
          <Tabs value={activeTab} onValueChange={(v) => {
            if (v === 'designs' || v === 'intelligence') {
              setActiveTab(v)
            }
          }}>
            <TabsList className="mb-6">
              <TabsTrigger value="designs">Designs</TabsTrigger>
              <TabsTrigger value="intelligence">Intelligence</TabsTrigger>
            </TabsList>

            {/* Designs Tab Content */}
            <TabsContent value="designs">
              {showDesignForm ? (
                <div>
                  {/* Back button */}
                  <Button
                    variant="ghost"
                    onClick={handleBackToDesigns}
                    className="mb-4"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back to Designs
                  </Button>

                  {/* Design Form */}
                  <MasonryDesignerForm
                    designId={activeDesignId}
                    projectId={projectId}
                  />
                </div>
              ) : (
                <DesignsTab
                  designs={designs}
                  onOpenDesign={setActiveDesignId}
                  onNewDesign={() => setModalOpen(true)}
                  onDeleteDesign={handleDeleteDesign}
                />
              )}
            </TabsContent>

            {/* Intelligence Tab Content */}
            <TabsContent value="intelligence">
              <IntelligenceTab />
            </TabsContent>
          </Tabs>
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
