'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Grid, List } from 'lucide-react'
import { ProjectCard } from '@/components/dashboard/project-card'
import { ProjectTable } from '@/components/dashboard/project-table'
import { CreateProjectModal } from '@/components/dashboard/create-project-modal'
import { useProjects } from '@/hooks/use-projects'
import { CreateProjectInput } from '@/types/project-types'
import { useRouter } from 'next/navigation'
import { AuthHeader } from '@/components/auth-header'
import { MainNavigation } from '@/components/main-navigation'

export default function DashboardPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [modalOpen, setModalOpen] = useState(false)
  const { projects, isLoading, mutate } = useProjects()
  const router = useRouter()

  const handleCreateProject = async (data: CreateProjectInput) => {
    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (response.ok) {
      const { project } = await response.json()
      mutate()
      router.push(`/project/${project.id}`)
    }
  }

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return

    await fetch(`/api/projects/${id}`, { method: 'DELETE' })
    mutate()
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  const hasProjects = projects.length > 0

  return (
    <div className="min-h-screen">
      <AuthHeader />
      <MainNavigation />

      <div className="container mx-auto py-8 px-4">
        {!hasProjects ? (
          // Empty state
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <h1 className="text-4xl font-bold mb-4">Welcome to Masonry Designer</h1>
            <p className="text-muted-foreground mb-8 max-w-md">
              Create your first project to start designing and optimizing masonry support systems.
            </p>
            <Button size="lg" onClick={() => setModalOpen(true)}>
              <Plus className="mr-2 h-5 w-5" />
              Create Your First Project
            </Button>
          </div>
        ) : (
          // Projects view
          <>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">Projects</h1>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button onClick={() => setModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Project
                </Button>
              </div>
            </div>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onDelete={handleDeleteProject}
                  />
                ))}
              </div>
            ) : (
              <ProjectTable projects={projects} onDelete={handleDeleteProject} />
            )}
          </>
        )}

        <CreateProjectModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          onSubmit={handleCreateProject}
        />
      </div>
    </div>
  )
}
