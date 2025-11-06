import { z } from 'zod'

export interface Design {
  id: string
  projectId: string
  name: string
  formParameters: Record<string, unknown>
  calculationResults: Record<string, unknown> | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateDesignInput {
  name: string
  formParameters?: Record<string, unknown>
  sourceDesignId?: string // For duplication
}

export interface UpdateDesignInput {
  name?: string
  formParameters?: Record<string, unknown>
  calculationResults?: Record<string, unknown>
}

// Zod schemas for validation
export const createDesignSchema = z.object({
  name: z.string().min(1, 'Design name is required').max(255, 'Design name is too long'),
  formParameters: z.record(z.unknown()).optional(),
  sourceDesignId: z.string().cuid('Invalid source design ID').optional()
})

export const updateDesignSchema = z.object({
  name: z.string().min(1, 'Design name is required').max(255, 'Design name is too long').optional(),
  formParameters: z.record(z.unknown()).optional(),
  calculationResults: z.record(z.unknown()).optional()
})
