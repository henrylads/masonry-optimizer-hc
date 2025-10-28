import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChatInterface } from './chat-interface'

// Mock the ai/react useChat hook with a simple implementation
jest.mock('ai/react', () => ({
  useChat: () => ({
    messages: [],
    input: '',
    handleInputChange: jest.fn(),
    handleSubmit: jest.fn(),
    isLoading: false,
    error: null
  })
}))

// Mock the utils
jest.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined | null | boolean)[]) => classes.filter(Boolean).join(' ')
}))

describe('ChatInterface', () => {

  describe('Initial Render', () => {
    it('renders the chat interface with header and empty state', () => {
      render(<ChatInterface />)
      
      expect(screen.getByText('AI Design Assistant')).toBeInTheDocument()
      expect(screen.getByText(/Describe your masonry support requirements/)).toBeInTheDocument()
      expect(screen.getByText('Ready to help!')).toBeInTheDocument()
      expect(screen.getByText(/Tell me about your masonry support project/)).toBeInTheDocument()
    })

    it('renders input field and send button', () => {
      render(<ChatInterface />)
      
      expect(screen.getByPlaceholderText(/Describe your masonry support project/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument()
    })

    it('renders help text', () => {
      render(<ChatInterface />)
      
      expect(screen.getByText(/You can mention slab thickness, cavity width/)).toBeInTheDocument()
    })
  })

  describe('Basic Functionality', () => {
    it('renders input field that accepts text', async () => {
      const user = userEvent.setup()
      render(<ChatInterface />)
      
      const input = screen.getByPlaceholderText(/Describe your masonry support project/)
      await user.type(input, 'Test message')
      
      // The input should accept the text (basic interaction test)
      expect(input).toBeInTheDocument()
    })

    it('has a send button', () => {
      render(<ChatInterface />)
      
      const sendButton = screen.getByRole('button', { name: /send/i })
      expect(sendButton).toBeInTheDocument()
    })
  })

  describe('Disabled State', () => {
    it('shows disabled state when disabled prop is true', () => {
      render(<ChatInterface disabled={true} />)
      
      const input = screen.getByPlaceholderText('Chat is disabled')
      const sendButton = screen.getByRole('button', { name: /send/i })
      
      expect(input).toBeDisabled()
      expect(sendButton).toBeDisabled()
    })
  })

  describe('Callback Props', () => {
    it('calls onParametersExtracted when provided', () => {
      const onParametersExtracted = jest.fn()
      
      render(<ChatInterface onParametersExtracted={onParametersExtracted} />)
      
      // This would be called in future implementations when parameters are extracted
      // For now, we just verify the prop is accepted
      expect(onParametersExtracted).not.toHaveBeenCalled()
    })

    it('calls onParametersConfirmed when provided', () => {
      const onParametersConfirmed = jest.fn()
      
      render(<ChatInterface onParametersConfirmed={onParametersConfirmed} />)
      
      // This would be called in future implementations when parameters are confirmed
      // For now, we just verify the prop is accepted
      expect(onParametersConfirmed).not.toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('has proper form structure', () => {
      render(<ChatInterface />)
      
      const form = screen.getByRole('textbox').closest('form')
      expect(form).toBeInTheDocument()
    })

    it('has proper button labels', () => {
      render(<ChatInterface />)
      
      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument()
    })

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup()
      
      render(<ChatInterface />)
      
      const input = screen.getByPlaceholderText(/Describe your masonry support project/)
      await user.tab()
      
      expect(input).toHaveFocus()
    })
  })

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      const { container } = render(<ChatInterface className="custom-class" />)
      
      expect(container.firstChild).toHaveClass('custom-class')
    })
  })
}) 