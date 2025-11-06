import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createProjectSchema } from '@/types/project-types'
import { ZodError } from 'zod'

// GET /api/projects - List all projects for user
export async function GET() {
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
    console.error('Error fetching projects:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

// POST /api/projects - Create new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input with Zod schema
    const validatedData = createProjectSchema.parse(body)

    // TODO: Get userId from auth session
    const userId = 'test-user-id'

    const project = await prisma.project.create({
      data: {
        userId,
        name: validatedData.name,
        description: validatedData.description || null,
        stage: validatedData.stage,
        totalValue: validatedData.totalValue || null,
      }
    })

    return NextResponse.json({ project }, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating project:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}
