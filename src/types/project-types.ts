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
