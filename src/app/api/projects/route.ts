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
