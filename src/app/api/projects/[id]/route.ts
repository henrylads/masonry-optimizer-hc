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
