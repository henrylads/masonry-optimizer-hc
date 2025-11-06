# Project Dashboard & Design Management Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform single-page masonry designer into multi-project workspace with dashboard, project management, and simplified design form.

**Architecture:** Database-backed project/design hierarchy with Next.js App Router pages, React components for UI, and API routes for CRUD operations. Progressive disclosure in design form (5 core fields visible, advanced options collapsible).

**Tech Stack:** Next.js 15, TypeScript, Prisma ORM, PostgreSQL, React Hook Form, Tailwind CSS, Shadcn/UI

---

## Task 1: Database Schema Setup

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/lib/prisma.ts`
- Create: `.env.example`

**Step 1: Install Prisma dependencies**

Run:
```bash
cd "/Users/henrychart/Downloads/masonry-optimizer-hc-main 3/.worktrees/project-dashboard"
npm install prisma @prisma/client
npm install -D prisma
```

Expected: Packages installed successfully

**Step 2: Initialize Prisma**

Run:
```bash
npx prisma init
```

Expected: Creates `prisma/` directory with `schema.prisma`

**Step 3: Define database schema**

File: `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String    @id @default(cuid())
  email     String    @unique
  name      String?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  projects  Project[]
}

model Project {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name         String
  description  String?  @db.Text
  stage        String   @default("planning") // "planning" or "contract"
  totalValue   Decimal? @db.Decimal(12, 2)
  enrichedData Json?    // {location, architect, completionDate, buildingType}
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  designs      Design[]

  @@index([userId])
}

model Design {
  id                  String   @id @default(cuid())
  projectId           String
  project             Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  name                String
  formParameters      Json     // All form field values
  calculationResults  Json?    // Optimization results, run layout, verification
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([projectId])
}
```

**Step 4: Create Prisma client utility**

File: `src/lib/prisma.ts`

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

**Step 5: Update .env.example**

File: `.env.example`

```
DATABASE_URL="postgresql://user:password@localhost:5432/masonry_optimizer?schema=public"
```

**Step 6: Commit database setup**

```bash
git add prisma/ src/lib/prisma.ts .env.example package.json package-lock.json
git commit -m "feat: add Prisma schema for projects and designs

- Define Project model with user relation
- Define Design model with project relation
- Add enrichedData JSONB field for AI-enriched info
- Configure Prisma client singleton"
```

---

## Task 2: Project API Routes (CRUD)

**Files:**
- Create: `src/app/api/projects/route.ts`
- Create: `src/app/api/projects/[id]/route.ts`
- Create: `src/types/project-types.ts`

**Step 1: Define TypeScript types**

File: `src/types/project-types.ts`

```typescript
export type ProjectStage = 'planning' | 'contract'

export interface EnrichedData {
  location?: string
  architect?: string
  completionDate?: string
  buildingType?: string
  [key: string]: any
}

export interface Project {
  id: string
  userId: string
  name: string
  description: string | null
  stage: ProjectStage
  totalValue: number | null
  enrichedData: EnrichedData | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateProjectInput {
  name: string
  description?: string
  stage: ProjectStage
  totalValue?: number
}

export interface UpdateProjectInput {
  name?: string
  description?: string
  stage?: ProjectStage
  totalValue?: number
  enrichedData?: EnrichedData
}
```

**Step 2: Create projects list/create route**

File: `src/app/api/projects/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CreateProjectInput } from '@/types/project-types'

// GET /api/projects - List all projects for user
export async function GET(request: NextRequest) {
  try {
    // TODO: Get userId from auth session
    // For now, hardcode a test user ID
    const userId = 'test-user-id'

    const projects = await prisma.project.findMany({
      where: { userId },
      include: {
        _count: {
          select: { designs: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json({ projects })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

// POST /api/projects - Create new project
export async function POST(request: NextRequest) {
  try {
    const body: CreateProjectInput = await request.json()

    // TODO: Get userId from auth session
    const userId = 'test-user-id'

    const project = await prisma.project.create({
      data: {
        userId,
        name: body.name,
        description: body.description || null,
        stage: body.stage,
        totalValue: body.totalValue || null,
      }
    })

    return NextResponse.json({ project }, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}
```

**Step 3: Create project detail route (get/update/delete)**

File: `src/app/api/projects/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UpdateProjectInput } from '@/types/project-types'

// GET /api/projects/[id] - Get single project
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        designs: {
          orderBy: { updatedAt: 'desc' }
        }
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ project })
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    )
  }
}

// PATCH /api/projects/[id] - Update project
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body: UpdateProjectInput = await request.json()

    const project = await prisma.project.update({
      where: { id: params.id },
      data: {
        ...body,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ project })
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[id] - Delete project
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.project.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    )
  }
}
```

**Step 4: Commit project API routes**

```bash
git add src/app/api/projects/ src/types/project-types.ts
git commit -m "feat: add project CRUD API routes

- GET /api/projects - list projects
- POST /api/projects - create project
- GET /api/projects/[id] - get project with designs
- PATCH /api/projects/[id] - update project
- DELETE /api/projects/[id] - delete project
- Add TypeScript types for projects"
```

---

## Task 3: Design API Routes (CRUD)

**Files:**
- Create: `src/app/api/projects/[projectId]/designs/route.ts`
- Create: `src/app/api/designs/[id]/route.ts`
- Create: `src/types/design-types.ts`

**Step 1: Define design TypeScript types**

File: `src/types/design-types.ts`

```typescript
export interface Design {
  id: string
  projectId: string
  name: string
  formParameters: Record<string, any>
  calculationResults: Record<string, any> | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateDesignInput {
  name: string
  formParameters?: Record<string, any>
  sourceDesignId?: string // For duplication
}

export interface UpdateDesignInput {
  name?: string
  formParameters?: Record<string, any>
  calculationResults?: Record<string, any>
}
```

**Step 2: Create designs list/create route**

File: `src/app/api/projects/[projectId]/designs/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CreateDesignInput } from '@/types/design-types'

// GET /api/projects/[projectId]/designs - List designs in project
export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const designs = await prisma.design.findMany({
      where: { projectId: params.projectId },
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json({ designs })
  } catch (error) {
    console.error('Error fetching designs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch designs' },
      { status: 500 }
    )
  }
}

// POST /api/projects/[projectId]/designs - Create new design
export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const body: CreateDesignInput = await request.json()

    let formParameters = body.formParameters || {}

    // If duplicating, fetch source design
    if (body.sourceDesignId) {
      const sourceDesign = await prisma.design.findUnique({
        where: { id: body.sourceDesignId }
      })

      if (sourceDesign) {
        formParameters = sourceDesign.formParameters as Record<string, any>
      }
    }

    const design = await prisma.design.create({
      data: {
        projectId: params.projectId,
        name: body.name,
        formParameters,
      }
    })

    return NextResponse.json({ design }, { status: 201 })
  } catch (error) {
    console.error('Error creating design:', error)
    return NextResponse.json(
      { error: 'Failed to create design' },
      { status: 500 }
    )
  }
}
```

**Step 3: Create design detail route (get/update/delete)**

File: `src/app/api/designs/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UpdateDesignInput } from '@/types/design-types'

// GET /api/designs/[id] - Get single design
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const design = await prisma.design.findUnique({
      where: { id: params.id },
      include: {
        project: true
      }
    })

    if (!design) {
      return NextResponse.json(
        { error: 'Design not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ design })
  } catch (error) {
    console.error('Error fetching design:', error)
    return NextResponse.json(
      { error: 'Failed to fetch design' },
      { status: 500 }
    )
  }
}

// PATCH /api/designs/[id] - Update design
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body: UpdateDesignInput = await request.json()

    const design = await prisma.design.update({
      where: { id: params.id },
      data: {
        ...body,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ design })
  } catch (error) {
    console.error('Error updating design:', error)
    return NextResponse.json(
      { error: 'Failed to update design' },
      { status: 500 }
    )
  }
}

// DELETE /api/designs/[id] - Delete design
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.design.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting design:', error)
    return NextResponse.json(
      { error: 'Failed to delete design' },
      { status: 500 }
    )
  }
}
```

**Step 4: Commit design API routes**

```bash
git add src/app/api/projects/[projectId]/designs/ src/app/api/designs/ src/types/design-types.ts
git commit -m "feat: add design CRUD API routes

- GET /api/projects/[projectId]/designs - list designs
- POST /api/projects/[projectId]/designs - create design
- Support duplication via sourceDesignId
- GET /api/designs/[id] - get design
- PATCH /api/designs/[id] - update design
- DELETE /api/designs/[id] - delete design"
```

---

## Task 4: Dashboard Page Components

**Files:**
- Create: `src/app/dashboard/page.tsx`
- Create: `src/components/dashboard/project-card.tsx`
- Create: `src/components/dashboard/project-table.tsx`
- Create: `src/components/dashboard/create-project-modal.tsx`
- Create: `src/hooks/use-projects.ts`

**Step 1: Create SWR hook for projects**

File: `src/hooks/use-projects.ts`

```typescript
import useSWR from 'swr'
import { Project } from '@/types/project-types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useProjects() {
  const { data, error, mutate } = useSWR<{ projects: Project[] }>(
    '/api/projects',
    fetcher
  )

  return {
    projects: data?.projects || [],
    isLoading: !error && !data,
    isError: error,
    mutate
  }
}
```

**Step 2: Create project card component**

File: `src/components/dashboard/project-card.tsx`

```typescript
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
```

**Step 3: Create project table component**

File: `src/components/dashboard/project-table.tsx`

```typescript
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
```

**Step 4: Create project modal**

File: `src/components/dashboard/create-project-modal.tsx`

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CreateProjectInput, ProjectStage } from '@/types/project-types'

interface CreateProjectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateProjectInput) => Promise<void>
}

export function CreateProjectModal({ open, onOpenChange, onSubmit }: CreateProjectModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [stage, setStage] = useState<ProjectStage>('planning')
  const [totalValue, setTotalValue] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await onSubmit({
        name,
        description: description || undefined,
        stage,
        totalValue: totalValue ? Number(totalValue) : undefined,
      })

      // Reset form
      setName('')
      setDescription('')
      setStage('planning')
      setTotalValue('')
      onOpenChange(false)
    } catch (error) {
      console.error('Error creating project:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Add a new building/site project to organize your designs.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Downtown Office Complex"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional project description"
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="stage">Stage *</Label>
              <Select value={stage} onValueChange={(v) => setStage(v as ProjectStage)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="value">Total Project Value (£)</Label>
              <Input
                id="value"
                type="number"
                value={totalValue}
                onChange={(e) => setTotalValue(e.target.value)}
                placeholder="e.g., 5000000"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name}>
              Create Project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

**Step 5: Create dashboard page**

File: `src/app/dashboard/page.tsx`

```typescript
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
```

**Step 6: Install SWR dependency**

Run:
```bash
npm install swr
```

**Step 7: Commit dashboard components**

```bash
git add src/app/dashboard/ src/components/dashboard/ src/hooks/use-projects.ts package.json package-lock.json
git commit -m "feat: add dashboard page with project management

- Dashboard page with empty state and project list
- Grid and table view toggle
- Project card component with actions
- Project table component
- Create project modal
- SWR hook for project data fetching"
```

---

## Task 5: Project Workspace Page

**Files:**
- Create: `src/app/project/[id]/page.tsx`
- Create: `src/components/project/project-sidebar.tsx`
- Create: `src/components/project/create-design-modal.tsx`
- Create: `src/hooks/use-project.ts`

**Step 1: Create project hook**

File: `src/hooks/use-project.ts`

```typescript
import useSWR from 'swr'
import { Project } from '@/types/project-types'
import { Design } from '@/types/design-types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useProject(projectId: string) {
  const { data, error, mutate } = useSWR<{
    project: Project & { designs: Design[] }
  }>(
    projectId ? `/api/projects/${projectId}` : null,
    fetcher
  )

  return {
    project: data?.project || null,
    designs: data?.project?.designs || [],
    isLoading: !error && !data,
    isError: error,
    mutate
  }
}
```

**Step 2: Create design modal**

File: `src/components/project/create-design-modal.tsx`

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CreateDesignInput } from '@/types/design-types'
import { Design } from '@/types/design-types'

interface CreateDesignModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateDesignInput) => Promise<void>
  existingDesigns: Design[]
}

export function CreateDesignModal({
  open,
  onOpenChange,
  onSubmit,
  existingDesigns
}: CreateDesignModalProps) {
  const [name, setName] = useState('')
  const [mode, setMode] = useState<'scratch' | 'duplicate'>('scratch')
  const [sourceDesignId, setSourceDesignId] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await onSubmit({
        name,
        sourceDesignId: mode === 'duplicate' ? sourceDesignId : undefined,
      })

      // Reset form
      setName('')
      setMode('scratch')
      setSourceDesignId('')
      onOpenChange(false)
    } catch (error) {
      console.error('Error creating design:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Design</DialogTitle>
            <DialogDescription>
              Add a new facade design to this project.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Design Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., North Facade - Option A"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>Starting Point</Label>
              <RadioGroup value={mode} onValueChange={(v) => setMode(v as 'scratch' | 'duplicate')}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="scratch" id="scratch" />
                  <Label htmlFor="scratch" className="font-normal">Start from scratch</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="duplicate" id="duplicate" disabled={existingDesigns.length === 0} />
                  <Label htmlFor="duplicate" className="font-normal">Duplicate existing design</Label>
                </div>
              </RadioGroup>
            </div>
            {mode === 'duplicate' && existingDesigns.length > 0 && (
              <div className="grid gap-2">
                <Label htmlFor="source">Source Design</Label>
                <Select value={sourceDesignId} onValueChange={setSourceDesignId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select design to duplicate" />
                  </SelectTrigger>
                  <SelectContent>
                    {existingDesigns.map((design) => (
                      <SelectItem key={design.id} value={design.id}>
                        {design.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !name || (mode === 'duplicate' && !sourceDesignId)}
            >
              Create Design
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

**Step 3: Create project sidebar**

File: `src/components/project/project-sidebar.tsx`

```typescript
'use client'

import { Project } from '@/types/project-types'
import { Design } from '@/types/design-types'
import { Button } from '@/components/ui/button'
import { Plus, MoreVertical } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface ProjectSidebarProps {
  project: Project
  designs: Design[]
  activeDesignId: string | null
  onSelectDesign: (designId: string) => void
  onNewDesign: () => void
  onDeleteDesign: (designId: string) => void
}

export function ProjectSidebar({
  project,
  designs,
  activeDesignId,
  onSelectDesign,
  onNewDesign,
  onDeleteDesign,
}: ProjectSidebarProps) {
  return (
    <div className="w-64 border-r bg-muted/10 flex flex-col">
      {/* Project header */}
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg mb-2">{project.name}</h2>
        <Badge variant={project.stage === 'contract' ? 'default' : 'secondary'}>
          {project.stage === 'contract' ? 'Contract' : 'Planning'}
        </Badge>
      </div>

      {/* Designs list */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-muted-foreground">Designs</h3>
          <Button size="sm" variant="ghost" onClick={onNewDesign}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-1">
          {designs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No designs yet
            </p>
          ) : (
            designs.map((design) => (
              <div
                key={design.id}
                className={cn(
                  "flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-accent",
                  activeDesignId === design.id && "bg-accent"
                )}
                onClick={() => onSelectDesign(design.id)}
              >
                <span className="text-sm truncate flex-1">{design.name}</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteDesign(design.id)
                      }}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
```

**Step 4: Create project workspace page**

File: `src/app/project/[id]/page.tsx`

```typescript
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
      <MainNavigation />

      <div className="flex-1 flex">
        <ProjectSidebar
          project={project}
          designs={designs}
          activeDesignId={activeDesignId}
          onSelectDesign={setActiveDesignId}
          onNewDesign={() => setModalOpen(true)}
          onDeleteDesign={handleDeleteDesign}
        />

        <main className="flex-1 p-8">
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
            <div>
              <p className="text-muted-foreground">
                Design form will go here (Task 6)
              </p>
            </div>
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
```

**Step 5: Commit project workspace**

```bash
git add src/app/project/ src/components/project/ src/hooks/use-project.ts
git commit -m "feat: add project workspace with sidebar

- Project page with sidebar layout
- Sidebar shows project info and design list
- Create design modal with scratch/duplicate options
- Design selection and deletion
- Empty states for no designs"
```

---

## Task 6: Update Homepage to Dashboard

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Redirect homepage to dashboard**

File: `src/app/page.tsx`

Replace entire contents with:

```typescript
import { redirect } from 'next/navigation'

export default function Home() {
  redirect('/dashboard')
}
```

**Step 2: Commit homepage redirect**

```bash
git add src/app/page.tsx
git commit -m "feat: redirect homepage to dashboard

- Homepage now redirects to /dashboard
- Dashboard becomes the main entry point"
```

---

## Task 7: Setup Database and Run Migrations

**Files:**
- None (database operations)

**Step 1: Ensure PostgreSQL is running**

Verify PostgreSQL is installed and running locally or have a cloud database URL ready.

**Step 2: Create .env file**

Create `.env` in worktree root (not committed):

```
DATABASE_URL="postgresql://user:password@localhost:5432/masonry_optimizer?schema=public"
```

**Step 3: Generate Prisma client**

Run:
```bash
npx prisma generate
```

Expected: Prisma client generated

**Step 4: Create and run migration**

Run:
```bash
npx prisma migrate dev --name init
```

Expected: Database tables created

**Step 5: Open Prisma Studio to verify**

Run:
```bash
npx prisma studio
```

Expected: Opens browser showing database tables (User, Project, Design)

---

## Task 8: Test Dashboard Flow

**Files:**
- None (manual testing)

**Step 1: Start development server**

Run:
```bash
npm run dev
```

Expected: Server starts on http://localhost:3000

**Step 2: Test dashboard empty state**

1. Open http://localhost:3000
2. Should redirect to /dashboard
3. Should show "Create your first project" empty state

**Step 3: Test project creation**

1. Click "Create Your First Project"
2. Fill in form (name: "Test Building", stage: Planning)
3. Click "Create Project"
4. Should navigate to project page

**Step 4: Test design creation**

1. On project page, click "Create First Design"
2. Fill in form (name: "North Facade", mode: from scratch)
3. Click "Create Design"
4. Should show design selected in sidebar

**Step 5: Test navigation**

1. Click back to dashboard (via navigation)
2. Should see project card
3. Toggle grid/table view
4. Click project card - should return to project page

---

## Summary

This plan sets up the complete project dashboard infrastructure:
- Database schema with Prisma
- API routes for projects and designs
- Dashboard with project management
- Project workspace with sidebar
- Homepage redirect

**Next phases** (not in this plan):
- Simplify design form (5 core fields + advanced)
- Integrate existing masonry designer form
- Add Perplexity AI enrichment
- Add auto-save functionality
- Add design comparison feature

All components follow DRY, YAGNI, and use existing UI components from shadcn/ui.
