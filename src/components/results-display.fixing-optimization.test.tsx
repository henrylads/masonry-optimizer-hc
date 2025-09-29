import { render, screen } from '@testing-library/react'
import { ResultsDisplay } from './results-display'
import type { OptimisationResult } from '@/types/optimization-types'

describe('ResultsDisplay - Fixing Position and Savings', () => {
  const baseResult: OptimisationResult = {
    genetic: {
      bracket_centres: 300,
      bracket_thickness: 3,
      angle_thickness: 4,
      vertical_leg: 60,
      bolt_diameter: 10,
      bracket_type: 'Standard',
      angle_orientation: 'Standard',
      fixing_position: 75,
    },
    calculated: {
      bracket_height: 150,
      rise_to_bolts: 100,
      bracket_projection: 90,
      shear_load: 3.5,
      total_deflection: 0,
      characteristic_load: 10,
      slab_thickness: 225,
      moment_resistance_check: true,
      shear_resistance_check: true,
      angle_deflection_check: true,
      bracket_connection_check: true,
      shear_reduction_check: true,
      bracket_design_check: true,
      fixing_check: true,
      combined_tension_shear_check: true,
    },
  }

  it('shows optimized fixing position with badge when > 75mm', () => {
    const result: OptimisationResult = {
      ...baseResult,
      calculated: {
        ...baseResult.calculated,
        optimized_fixing_position: 95,
      }
    }

    render(<ResultsDisplay result={result} history={[]} />)

    expect(screen.getByText('Fixing Position')).toBeInTheDocument()
    expect(screen.getByText(/95 mm/)).toBeInTheDocument()
    expect(screen.getByText('Optimized')).toBeInTheDocument()
  })

  it('does not show Optimized badge when position is 75 or missing', () => {
    render(<ResultsDisplay result={baseResult} history={[]} />)

    expect(screen.getByText('Fixing Position')).toBeInTheDocument()
    expect(screen.getByText(/75 mm/)).toBeInTheDocument()
    expect(screen.queryByText('Optimized')).not.toBeInTheDocument()
  })

  it('shows weight savings badge when initial and optimal weights exist', () => {
    const result: OptimisationResult = {
      ...baseResult,
      calculated: {
        ...baseResult.calculated,
        initial_weight: 10,
        optimal_design_weight: 8,
      }
    }

    render(<ResultsDisplay result={result} history={[]} />)

    expect(screen.getByText(/-20% weight/)).toBeInTheDocument()
  })
})

