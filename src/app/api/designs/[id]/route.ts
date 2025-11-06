import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateDesignSchema } from '@/types/design-types'
import { ZodError } from 'zod'

// GET /api/designs/[id] - Get single design
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // TODO: Get userId from auth session
    const userId = 'test-user-id'
    const { id } = await params

    const design = await prisma.design.findFirst({
      where: {
        id: id,
        project: {
          userId: userId
        }
      },
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
    console.error('Error fetching design:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { error: 'Failed to fetch design' },
      { status: 500 }
    )
  }
}

// PATCH /api/designs/[id] - Update design
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()

    // Validate input with Zod schema
    const validatedData = updateDesignSchema.parse(body)

    // TODO: Get userId from auth session
    const userId = 'test-user-id'
    const { id } = await params

    // First verify the design belongs to a project owned by the user
    const existingDesign = await prisma.design.findUnique({
      where: { id: id },
      include: {
        project: {
          select: { userId: true }
        }
      }
    })

    if (!existingDesign) {
      return NextResponse.json(
        { error: 'Design not found' },
        { status: 404 }
      )
    }

    if (existingDesign.project.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const design = await prisma.design.update({
      where: { id: id },
      data: {
        ...validatedData,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ design })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating design:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { error: 'Failed to update design' },
      { status: 500 }
    )
  }
}

// DELETE /api/designs/[id] - Delete design
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // TODO: Get userId from auth session
    const userId = 'test-user-id'
    const { id } = await params

    // First verify the design belongs to a project owned by the user
    const existingDesign = await prisma.design.findUnique({
      where: { id: id },
      include: {
        project: {
          select: { userId: true }
        }
      }
    })

    if (!existingDesign) {
      return NextResponse.json(
        { error: 'Design not found' },
        { status: 404 }
      )
    }

    if (existingDesign.project.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    await prisma.design.delete({
      where: { id: id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting design:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { error: 'Failed to delete design' },
      { status: 500 }
    )
  }
}
