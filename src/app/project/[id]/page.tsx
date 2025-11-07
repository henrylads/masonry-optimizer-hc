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
import { useRouter } from 'next/navigation'

export default function ProjectPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const [activeTab, setActiveTab] = useState<'designs' | 'intelligence'>('designs')
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
        <AppSidebar />

        <div className="flex-1 overflow-auto">
          <div className="py-8 px-8">
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
              <DesignsTab
                designs={designs}
                projectId={projectId}
                onNewDesign={() => setModalOpen(true)}
                onDeleteDesign={handleDeleteDesign}
              />
            </TabsContent>

            {/* Intelligence Tab Content */}
            <TabsContent value="intelligence">
              <IntelligenceTab />
            </TabsContent>
          </Tabs>
          </div>
        </div>
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
