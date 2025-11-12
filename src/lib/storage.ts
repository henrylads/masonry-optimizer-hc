/**
 * Browser Storage Service
 *
 * Provides a simple API for storing Projects and Designs in browser localStorage.
 * This replaces the Prisma/PostgreSQL database with client-side storage.
 *
 * Storage Structure:
 * - localStorage['projects']: Array of Project objects
 * - localStorage['designs']: Array of Design objects
 */

export interface StoredProject {
  id: string
  userId: string
  name: string
  description: string | null
  stage: string
  totalValue: string | null  // Stored as string to preserve decimal precision
  enrichedData: unknown | null
  createdAt: string  // ISO date string
  updatedAt: string  // ISO date string
}

export interface StoredDesign {
  id: string
  projectId: string
  name: string
  formParameters: unknown  // JSON object with all form field values
  calculationResults: unknown | null  // Optimization results, run layout, verification
  createdAt: string  // ISO date string
  updatedAt: string  // ISO date string
}

// Storage keys
const PROJECTS_KEY = 'masonry-optimizer-projects'
const DESIGNS_KEY = 'masonry-optimizer-designs'

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generates a unique ID (simple implementation)
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Gets current ISO timestamp
 */
function now(): string {
  return new Date().toISOString()
}

/**
 * Safely gets data from localStorage with error handling
 */
function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') {
    return defaultValue
  }

  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error(`Error reading from localStorage key "${key}":`, error)
    return defaultValue
  }
}

/**
 * Safely sets data to localStorage with error handling
 */
function setToStorage<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (error) {
    console.error(`Error writing to localStorage key "${key}":`, error)
    return false
  }
}

// ============================================================================
// Project Operations
// ============================================================================

export const projectStorage = {
  /**
   * Get all projects for a user
   */
  findMany(userId: string): StoredProject[] {
    const allProjects = getFromStorage<StoredProject[]>(PROJECTS_KEY, [])
    return allProjects.filter(p => p.userId === userId)
  },

  /**
   * Get a single project by ID
   */
  findById(projectId: string): StoredProject | null {
    const allProjects = getFromStorage<StoredProject[]>(PROJECTS_KEY, [])
    return allProjects.find(p => p.id === projectId) || null
  },

  /**
   * Create a new project
   */
  create(data: Omit<StoredProject, 'id' | 'createdAt' | 'updatedAt'>): StoredProject {
    const allProjects = getFromStorage<StoredProject[]>(PROJECTS_KEY, [])

    const newProject: StoredProject = {
      ...data,
      id: generateId(),
      createdAt: now(),
      updatedAt: now(),
    }

    allProjects.push(newProject)
    setToStorage(PROJECTS_KEY, allProjects)

    return newProject
  },

  /**
   * Update an existing project
   */
  update(projectId: string, data: Partial<Omit<StoredProject, 'id' | 'userId' | 'createdAt'>>): StoredProject | null {
    const allProjects = getFromStorage<StoredProject[]>(PROJECTS_KEY, [])
    const index = allProjects.findIndex(p => p.id === projectId)

    if (index === -1) {
      return null
    }

    allProjects[index] = {
      ...allProjects[index],
      ...data,
      updatedAt: now(),
    }

    setToStorage(PROJECTS_KEY, allProjects)
    return allProjects[index]
  },

  /**
   * Delete a project and all its designs
   */
  delete(projectId: string): boolean {
    const allProjects = getFromStorage<StoredProject[]>(PROJECTS_KEY, [])
    const filtered = allProjects.filter(p => p.id !== projectId)

    if (filtered.length === allProjects.length) {
      return false  // Project not found
    }

    setToStorage(PROJECTS_KEY, filtered)

    // Also delete all designs for this project
    const allDesigns = getFromStorage<StoredDesign[]>(DESIGNS_KEY, [])
    const filteredDesigns = allDesigns.filter(d => d.projectId !== projectId)
    setToStorage(DESIGNS_KEY, filteredDesigns)

    return true
  },
}

// ============================================================================
// Design Operations
// ============================================================================

export const designStorage = {
  /**
   * Get all designs for a project
   */
  findMany(projectId: string): StoredDesign[] {
    const allDesigns = getFromStorage<StoredDesign[]>(DESIGNS_KEY, [])
    return allDesigns.filter(d => d.projectId === projectId)
  },

  /**
   * Get a single design by ID
   */
  findById(designId: string): StoredDesign | null {
    const allDesigns = getFromStorage<StoredDesign[]>(DESIGNS_KEY, [])
    return allDesigns.find(d => d.id === designId) || null
  },

  /**
   * Create a new design
   */
  create(data: Omit<StoredDesign, 'id' | 'createdAt' | 'updatedAt'>): StoredDesign {
    const allDesigns = getFromStorage<StoredDesign[]>(DESIGNS_KEY, [])

    const newDesign: StoredDesign = {
      ...data,
      id: generateId(),
      createdAt: now(),
      updatedAt: now(),
    }

    allDesigns.push(newDesign)
    setToStorage(DESIGNS_KEY, allDesigns)

    return newDesign
  },

  /**
   * Update an existing design
   */
  update(designId: string, data: Partial<Omit<StoredDesign, 'id' | 'projectId' | 'createdAt'>>): StoredDesign | null {
    const allDesigns = getFromStorage<StoredDesign[]>(DESIGNS_KEY, [])
    const index = allDesigns.findIndex(d => d.id === designId)

    if (index === -1) {
      return null
    }

    allDesigns[index] = {
      ...allDesigns[index],
      ...data,
      updatedAt: now(),
    }

    setToStorage(DESIGNS_KEY, allDesigns)
    return allDesigns[index]
  },

  /**
   * Delete a design
   */
  delete(designId: string): boolean {
    const allDesigns = getFromStorage<StoredDesign[]>(DESIGNS_KEY, [])
    const filtered = allDesigns.filter(d => d.id !== designId)

    if (filtered.length === allDesigns.length) {
      return false  // Design not found
    }

    setToStorage(DESIGNS_KEY, filtered)
    return true
  },
}

// ============================================================================
// Utility Operations
// ============================================================================

/**
 * Export all data as JSON for backup
 */
export function exportData(): { projects: StoredProject[], designs: StoredDesign[] } {
  return {
    projects: getFromStorage<StoredProject[]>(PROJECTS_KEY, []),
    designs: getFromStorage<StoredDesign[]>(DESIGNS_KEY, []),
  }
}

/**
 * Import data from JSON backup
 */
export function importData(data: { projects: StoredProject[], designs: StoredDesign[] }): boolean {
  try {
    setToStorage(PROJECTS_KEY, data.projects)
    setToStorage(DESIGNS_KEY, data.designs)
    return true
  } catch (error) {
    console.error('Error importing data:', error)
    return false
  }
}

/**
 * Clear all data (use with caution!)
 */
export function clearAllData(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(PROJECTS_KEY)
    localStorage.removeItem(DESIGNS_KEY)
  }
}
