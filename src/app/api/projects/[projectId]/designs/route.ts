import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createDesignSchema } from '@/types/design-types'
import { ZodError } from 'zod'

// GET /api/projects/[projectId]/designs - List designs in project
export async function GET(
  _request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    // TODO: Get userId from auth session
    const userId = 'test-user-id'

    // First verify the project belongs to the user
    const project = await prisma.project.findUnique({
      where: {
        id: params.projectId,
        userId: userId // Verify ownership
      },
      select: { id: true }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    const designs = await prisma.design.findMany({
      where: { projectId: params.projectId },
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json({ designs })
  } catch (error) {
    console.error('Error fetching designs:', error instanceof Error ? error.message : 'Unknown error')
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
    const body = await request.json()

    // Validate input with Zod schema
    const validatedData = createDesignSchema.parse(body)

    // TODO: Get userId from auth session
    const userId = 'test-user-id'

    // First verify the project belongs to the user
    const project = await prisma.project.findUnique({
      where: {
        id: params.projectId,
        userId: userId // Verify ownership
      },
      select: { id: true }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    let formParameters = validatedData.formParameters || {}

    // If duplicating, fetch source design
    if (validatedData.sourceDesignId) {
      const sourceDesign = await prisma.design.findUnique({
        where: { id: validatedData.sourceDesignId },
        include: {
          project: {
            select: { userId: true }
          }
        }
      })

      if (!sourceDesign) {
        return NextResponse.json(
          { error: 'Source design not found' },
          { status: 404 }
        )
      }

      // Verify user owns the source design's project
      if (sourceDesign.project.userId !== userId) {
        return NextResponse.json(
          { error: 'Unauthorized to access source design' },
          { status: 403 }
        )
      }

      formParameters = sourceDesign.formParameters as Record<string, unknown>
    }

    const design = await prisma.design.create({
      data: {
        projectId: params.projectId,
        name: validatedData.name,
        formParameters,
      }
    })

    return NextResponse.json({ design }, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating design:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { error: 'Failed to create design' },
      { status: 500 }
    )
  }
}
