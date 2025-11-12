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
  const { project, designs, isLoading, createDesign, deleteDesign: deleteDesignFn, deleteProject: deleteProjectFn } = useProject(projectId)

  const handleCreateDesign = async (data: CreateDesignInput) => {
    const result = createDesign({
      name: data.name,
      formParameters: data.formParameters || {},
      calculationResults: data.calculationResults,
    })

    if (!result.success) {
      alert(`Failed to create design: ${result.error}`)
    }
  }

  const handleDeleteDesign = async (designId: string) => {
    if (!confirm('Are you sure you want to delete this design?')) return
    deleteDesignFn(designId)
  }

  const handleDeleteProject = async () => {
    if (!confirm('Are you sure you want to delete this project? This cannot be undone.')) return
    deleteProjectFn()
    router.push('/dashboard')
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
