import { z } from 'zod'

export type ProjectStage = 'planning' | 'contract'

export interface EnrichedData {
  location?: string
  architect?: string
  completionDate?: string
  buildingType?: string
  [key: string]: string | number | boolean | null | undefined
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

// Zod schemas for validation
export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(255, 'Project name is too long'),
  description: z.string().max(1000, 'Description is too long').optional(),
  stage: z.enum(['planning', 'contract'], {
    errorMap: () => ({ message: 'Stage must be either planning or contract' })
  }),
  totalValue: z.number().nonnegative('Total value must be non-negative').optional()
})

export const updateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(255, 'Project name is too long').optional(),
  description: z.string().max(1000, 'Description is too long').optional(),
  stage: z.enum(['planning', 'contract'], {
    errorMap: () => ({ message: 'Stage must be either planning or contract' })
  }).optional(),
  totalValue: z.number().nonnegative('Total value must be non-negative').optional(),
  enrichedData: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional()
})
