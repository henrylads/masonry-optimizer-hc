/**
 * @jest-environment node
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

// Mock fetch for Next.js API routes
import { TextEncoder, TextDecoder } from 'util'
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder as any

import { POST } from './route'
import { NextRequest } from 'next/server'
import { runBruteForce } from '@/calculations/bruteForceAlgorithm'
import type { GeneticAlgorithmOutput } from '@/types/optimization-types'

// Mock the brute force algorithm
jest.mock('@/calculations/bruteForceAlgorithm', () => ({
  runBruteForce: jest.fn()
}))

// Mock the loading calculations
jest.mock('@/calculations/loadingCalculations', () => ({
  calculateAreaLoad: jest.fn().mockReturnValue(5.0),
  calculateCharacteristicUDL: jest.fn().mockReturnValue(2.5)
}))

const mockRunBruteForce = runBruteForce as jest.MockedFunction<typeof runBruteForce>

describe('/api/optimize POST handler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default mock response
    mockRunBruteForce.mockResolvedValue({
      result: {
        genetic: {
          bracket_centres: 300,
          bracket_thickness: 3,
          angle_thickness: 4,
          vertical_leg: 60,
          bolt_diameter: 10,
          bracket_type: 'Standard',
          angle_orientation: 'Standard',
          fixing_position: 75
        },
        calculated: {
          bracket_height: 150,
          bracket_projection: 100,
          rise_to_bolts: 125,
          drop_below_slab: 25,
          bracket_projection_at_fixing: 80,
          shear_load: 1.5,
          total_deflection: 2.0,
          characteristic_load: 2.5,
          area_load: 5.0,
          characteristic_udl: 2.5,
          design_udl: 3.75,
          E: 200000,
          n: 8,
          slab_thickness: 200,
          support_level: 50,
          cavity_width: 100,
          notch_height: 0,
          notch_depth: 0,
          moment_resistance_check: true,
          shear_resistance_check: true,
          angle_deflection_check: true,
          bracket_connection_check: true,
          shear_reduction_check: true,
          bracket_design_check: true,
          fixing_check: true,
          combined_tension_shear_check: true,
          bsl_above_slab_bottom: true,
          optimized_fixing_position: 75
        },
        alternatives: []
      },
      history: []
    } as GeneticAlgorithmOutput)
  })

  describe('Basic Functionality', () => {
    it('should handle valid optimization request without fixing optimization', async () => {
      const requestBody = {
        slab_thickness: 200,
        cavity: 100,
        support_level: 50,
        characteristic_load: 2.5,
        notch_height: 0,
        notch_depth: 0
      }

      const request = new NextRequest('http://localhost:3000/api/optimize', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mockRunBruteForce).toHaveBeenCalledWith({
        maxGenerations: 100,
        designInputs: expect.objectContaining({
          slab_thickness: 200,
          cavity_width: 100,
          support_level: 50,
          characteristic_load: 2.5,
          enable_fixing_optimization: false,
          fixing_position: 75
        })
      })
      expect(data.result.calculated.optimized_fixing_position).toBe(75)
    })

    it('should handle optimization request with fixing optimization enabled', async () => {
      const requestBody = {
        slab_thickness: 300,
        cavity: 150,
        support_level: 75,
        characteristic_load: 3.0,
        notch_height: 0,
        notch_depth: 0,
        enable_fixing_optimization: true,
        fixing_position: 80
      }

      const request = new NextRequest('http://localhost:3000/api/optimize', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockRunBruteForce).toHaveBeenCalledWith({
        maxGenerations: 100,
        designInputs: expect.objectContaining({
          enable_fixing_optimization: true,
          fixing_position: 80
        })
      })
    })
  })

  describe('Fixing Position Validation', () => {
    it('should reject fixing position below minimum (75mm)', async () => {
      const requestBody = {
        slab_thickness: 200,
        cavity: 100,
        support_level: 50,
        characteristic_load: 2.5,
        notch_height: 0,
        notch_depth: 0,
        enable_fixing_optimization: true,
        fixing_position: 70 // Below minimum
      }

      const request = new NextRequest('http://localhost:3000/api/optimize', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Fixing position must be at least 75mm from top of slab')
      expect(mockRunBruteForce).not.toHaveBeenCalled()
    })

    it('should reject fixing position too deep for slab thickness', async () => {
      const requestBody = {
        slab_thickness: 200,
        cavity: 100,
        support_level: 50,
        characteristic_load: 2.5,
        notch_height: 0,
        notch_depth: 0,
        enable_fixing_optimization: true,
        fixing_position: 150 // Too deep for 200mm slab (200-125=75 max for CPRO38)
      }

      const request = new NextRequest('http://localhost:3000/api/optimize', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('cannot exceed')
      expect(data.error).toContain('slab configuration')
      expect(mockRunBruteForce).not.toHaveBeenCalled()
    })

    it('should reject insufficient rise to bolts (< 95mm)', async () => {
      const requestBody = {
        slab_thickness: 300,
        cavity: 100,
        support_level: 10, // support_level + fixing_position = 10 + 80 = 90 < 95
        characteristic_load: 2.5,
        notch_height: 0,
        notch_depth: 0,
        enable_fixing_optimization: true,
        fixing_position: 80 // Valid depth for 300mm slab (max = 300-175 = 125)
      }

      const request = new NextRequest('http://localhost:3000/api/optimize', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Rise to bolts must be at least 95mm for structural safety')
      expect(data.suggestion).toContain('Increase the support level')
      expect(mockRunBruteForce).not.toHaveBeenCalled()
    })

    it('should reject insufficient rise to bolts with minimum fixing position', async () => {
      const requestBody = {
        slab_thickness: 300,
        cavity: 100,
        support_level: 15, // support_level + fixing_position = 15 + 75 = 90 < 95
        characteristic_load: 2.5,
        notch_height: 0,
        notch_depth: 0,
        enable_fixing_optimization: true,
        fixing_position: 75 // Minimum fixing position
      }

      const request = new NextRequest('http://localhost:3000/api/optimize', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Rise to bolts must be at least 95mm for structural safety')
      expect(data.suggestion).toContain('Increase the support level')
      expect(mockRunBruteForce).not.toHaveBeenCalled()
    })

    it('should accept valid fixing position within constraints', async () => {
      const requestBody = {
        slab_thickness: 300,
        cavity: 100,
        support_level: 50,
        characteristic_load: 2.5,
        notch_height: 0,
        notch_depth: 0,
        enable_fixing_optimization: true,
        fixing_position: 80 // Valid: 75mm min, max = 300-175=125 for 300mm slab, rise_to_bolts = 50+80=130 > 95
      }

      const request = new NextRequest('http://localhost:3000/api/optimize', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockRunBruteForce).toHaveBeenCalledWith({
        maxGenerations: 100,
        designInputs: expect.objectContaining({
          enable_fixing_optimization: true,
          fixing_position: 80
        })
      })
    })
  })

  describe('Thick Slab Recommendations', () => {
    it('should add recommendation for thick slab (>250mm) without fixing optimization', async () => {
      const requestBody = {
        slab_thickness: 300,
        cavity: 100,
        support_level: 50,
        characteristic_load: 2.5,
        notch_height: 0,
        notch_depth: 0,
        enable_fixing_optimization: false
      }

      const request = new NextRequest('http://localhost:3000/api/optimize', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.result.alerts).toEqual(
        expect.arrayContaining([
          expect.stringContaining('💡 Recommendation: Consider enabling fixing position optimization for this 300mm thick slab')
        ])
      )
    })

    it('should not add recommendation for thick slab with fixing optimization enabled', async () => {
      const requestBody = {
        slab_thickness: 300,
        cavity: 100,
        support_level: 50,
        characteristic_load: 2.5,
        notch_height: 0,
        notch_depth: 0,
        enable_fixing_optimization: true
      }

      const request = new NextRequest('http://localhost:3000/api/optimize', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.result.alerts || []).not.toContain(
        expect.stringContaining('Consider enabling fixing position optimization')
      )
    })

    it('should not add recommendation for thin slab (≤250mm)', async () => {
      const requestBody = {
        slab_thickness: 200,
        cavity: 100,
        support_level: 50,
        characteristic_load: 2.5,
        notch_height: 0,
        notch_depth: 0,
        enable_fixing_optimization: false
      }

      const request = new NextRequest('http://localhost:3000/api/optimize', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.result.alerts || []).not.toContain(
        expect.stringContaining('Consider enabling fixing position optimization')
      )
    })
  })

  describe('Calculated Load Integration', () => {
    it('should handle masonry properties and preserve fixing optimization', async () => {
      const requestBody = {
        slab_thickness: 300,
        cavity: 100,
        support_level: 50,
        masonry_density: 2000,
        masonry_thickness: 100,
        masonry_height: 3,
        notch_height: 0,
        notch_depth: 0,
        enable_fixing_optimization: true,
        fixing_position: 85
      }

      const request = new NextRequest('http://localhost:3000/api/optimize', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockRunBruteForce).toHaveBeenCalledWith({
        maxGenerations: 100,
        designInputs: expect.objectContaining({
          characteristic_load: 2.5, // Mocked calculated value
          enable_fixing_optimization: true,
          fixing_position: 85
        })
      })
    })
  })

  describe('Enhanced Error Handling', () => {
    it('should auto-enable fixing optimization when fixing position is provided', async () => {
      const requestBody = {
        slab_thickness: 300,
        cavity: 100,
        support_level: 50,
        characteristic_load: 2.5,
        notch_height: 0,
        notch_depth: 0,
        enable_fixing_optimization: false, // Disabled
        fixing_position: 80 // But position provided
      }

      const request = new NextRequest('http://localhost:3000/api/optimize', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockRunBruteForce).toHaveBeenCalledWith({
        maxGenerations: 100,
        designInputs: expect.objectContaining({
          enable_fixing_optimization: true, // Should be auto-enabled
          fixing_position: 80
        })
      })
    })

    it('should reject non-5mm increment fixing positions', async () => {
      const requestBody = {
        slab_thickness: 300,
        cavity: 100,
        support_level: 50,
        characteristic_load: 2.5,
        notch_height: 0,
        notch_depth: 0,
        enable_fixing_optimization: true,
        fixing_position: 83 // Not a 5mm increment
      }

      const request = new NextRequest('http://localhost:3000/api/optimize', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('5mm increments')
      expect(data.suggestion).toContain('80mm or 85mm')
    })

    it('should reject slabs too thin for fixing optimization', async () => {
      const requestBody = {
        slab_thickness: 150, // Very thin slab
        cavity: 100,
        support_level: 50,
        characteristic_load: 2.5,
        notch_height: 0,
        notch_depth: 0,
        enable_fixing_optimization: true,
        fixing_position: 75
      }

      const request = new NextRequest('http://localhost:3000/api/optimize', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('too thin for fixing position optimization')
      expect(data.suggestion).toContain('disable fixing optimization')
    })

    it('should handle fixing-related algorithm errors', async () => {
      mockRunBruteForce.mockRejectedValue(new Error('fixing position validation failed'))

      const requestBody = {
        slab_thickness: 300,
        cavity: 100,
        support_level: 50,
        characteristic_load: 2.5,
        notch_height: 0,
        notch_depth: 0,
        enable_fixing_optimization: true
      }

      const request = new NextRequest('http://localhost:3000/api/optimize', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Fixing position optimization failed')
      expect(data.suggestion).toContain('disabling fixing optimization')
    })

    it('should handle validation errors specifically', async () => {
      mockRunBruteForce.mockRejectedValue(new Error('invalid parameter validation'))

      const requestBody = {
        slab_thickness: 200,
        cavity: 100,
        support_level: 50,
        characteristic_load: 2.5,
        notch_height: 0,
        notch_depth: 0
      }

      const request = new NextRequest('http://localhost:3000/api/optimize', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid configuration parameters')
      expect(data.suggestion).toContain('check all input parameters')
    })

    it('should handle generic brute force algorithm errors', async () => {
      mockRunBruteForce.mockRejectedValue(new Error('Calculation failed'))

      const requestBody = {
        slab_thickness: 200,
        cavity: 100,
        support_level: 50,
        characteristic_load: 2.5,
        notch_height: 0,
        notch_depth: 0
      }

      const request = new NextRequest('http://localhost:3000/api/optimize', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to optimize design')
      expect(data.suggestion).toContain('verify your input parameters')
    })

    it('should handle invalid JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/optimize', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to optimize design')
      expect(data.suggestion).toContain('verify your input parameters')
    })
  })
})