import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateProjectSchema } from '@/types/project-types'
import { ZodError } from 'zod'

// GET /api/projects/[id] - Get single project
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: Get userId from auth session
    const userId = 'test-user-id'

    const project = await prisma.project.findUnique({
      where: {
        id: params.id,
        userId: userId // Verify ownership
      },
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
    console.error('Error fetching project:', error instanceof Error ? error.message : 'Unknown error')
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
    const body = await request.json()

    // Validate input with Zod schema
    const validatedData = updateProjectSchema.parse(body)

    // TODO: Get userId from auth session
    const userId = 'test-user-id'

    // First verify the project belongs to the user
    const existingProject = await prisma.project.findUnique({
      where: { id: params.id },
      select: { userId: true }
    })

    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    if (existingProject.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const project = await prisma.project.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ project })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating project:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[id] - Delete project
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: Get userId from auth session
    const userId = 'test-user-id'

    // First verify the project belongs to the user
    const existingProject = await prisma.project.findUnique({
      where: { id: params.id },
      select: { userId: true }
    })

    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    if (existingProject.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    await prisma.project.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting project:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    )
  }
}
