'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search } from 'lucide-react'
import { ProjectCard } from '@/components/dashboard/project-card'
import { CreateProjectModal } from '@/components/dashboard/create-project-modal'
import { useProjects } from '@/hooks/use-projects'
import { CreateProjectInput } from '@/types/project-types'
import { useRouter } from 'next/navigation'
import { AuthHeader } from '@/components/auth-header'
import { MainNavigation } from '@/components/main-navigation'
import { AppSidebar } from '@/components/app-sidebar'

export default function DashboardPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { projects, isLoading, createProject, deleteProject } = useProjects()
  const router = useRouter()

  const handleCreateProject = async (data: CreateProjectInput) => {
    const result = createProject({
      name: data.name,
      description: data.description,
      stage: data.stage,
      totalValue: data.totalValue?.toString(),
    })

    if (result.success && result.project) {
      router.push(`/project/${result.project.id}`)
    }
  }

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return
    deleteProject(id)
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  const hasProjects = projects.length > 0

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen flex flex-col">
      <AuthHeader />
      <MainNavigation hideNavTabs />

      <div className="flex-1 flex">
        <AppSidebar />

        <div className="flex-1 overflow-auto">
          <div className="py-8 px-8">
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
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">Projects</h1>
                    <p className="text-muted-foreground">Manage your construction drawing projects and documents</p>
                  </div>
                  <Button onClick={() => setModalOpen(true)} className="bg-black hover:bg-black/90 text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    New Project
                  </Button>
                </div>

                <div className="relative mb-6 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onDelete={handleDeleteProject}
                    />
                  ))}
                </div>

                {filteredProjects.length === 0 && searchQuery && (
                  <div className="text-center py-12 text-muted-foreground">
                    No projects found matching "{searchQuery}"
                  </div>
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
      </div>
    </div>
  )
}
