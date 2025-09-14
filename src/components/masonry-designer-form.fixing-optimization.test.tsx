import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MasonryDesignerForm from './masonry-designer-form'

// Mock AI tools hook to avoid side effects
jest.mock('@/hooks/use-ai-tools', () => ({
  useAITools: () => ({
    isOptimizing: false,
    optimizationResult: null,
    optimizationError: null,
    optimizationProgress: null,
    clearOptimizationResult: jest.fn(),
    setSessionId: jest.fn(),
    sessionId: 'test-session',
  })
}))

// Mock utils
jest.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined | null | boolean)[]) => classes.filter(Boolean).join(' ')
}))

describe('MasonryDesignerForm - Fixing Position Optimization', () => {
  it('renders the Optimize Fixing Position toggle', () => {
    render(<MasonryDesignerForm />)

    expect(screen.getByText(/Optimize Fixing Position/i)).toBeInTheDocument()
  })

  it('toggles the switch on click', async () => {
    const user = userEvent.setup()
    render(<MasonryDesignerForm />)

    const toggle = screen.getByRole('switch', { name: /optimize fixing position/i })
    expect(toggle).toHaveAttribute('aria-checked', 'false')

    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-checked', 'true')
  })
})

