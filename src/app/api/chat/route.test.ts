/* eslint-disable @typescript-eslint/no-explicit-any */
import { POST } from './route'
import { streamText } from 'ai'
import { NextRequest } from 'next/server'

// Mock the AI SDK
jest.mock('ai', () => ({
  streamText: jest.fn()
}))

// Mock the OpenAI SDK
jest.mock('@ai-sdk/openai', () => ({
  openai: jest.fn().mockReturnValue('mocked-openai-model')
}))

const mockStreamText = streamText as any

describe('/api/chat POST handler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Successful Requests', () => {
    it('should handle valid chat messages', async () => {
      const mockToDataStreamResponse = jest.fn().mockReturnValue(
        new Response('mocked-stream-response')
      )
      
      mockStreamText.mockResolvedValue({
        toDataStreamResponse: mockToDataStreamResponse
      } as any)

      const requestBody = {
        messages: [
          { role: 'user', content: 'I need help with a masonry support design' }
        ]
      }

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)

             expect(mockStreamText).toHaveBeenCalledWith({
         model: 'mocked-openai-model',
         system: expect.stringContaining('You are an AI assistant specialized in extracting masonry support design parameters'),
         messages: requestBody.messages,
         temperature: 0.7,
         maxTokens: 1000
       })

      expect(mockToDataStreamResponse).toHaveBeenCalled()
      expect(response).toBeInstanceOf(Response)
    })

    it('should use the correct system prompt', async () => {
      const mockToDataStreamResponse = jest.fn().mockReturnValue(
        new Response('mocked-stream-response')
      )
      
      mockStreamText.mockResolvedValue({
        toDataStreamResponse: mockToDataStreamResponse
      } as any)

      const requestBody = {
        messages: [
          { role: 'user', content: 'What parameters do I need?' }
        ]
      }

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      await POST(request)

      const systemPrompt = mockStreamText.mock.calls[0][0].system

             // Verify key parts of the enhanced system prompt
       expect(systemPrompt).toContain('extracting masonry support design parameters')
       expect(systemPrompt).toContain('PARAMETER EXTRACTION RULES')
       expect(systemPrompt).toContain('REQUIRED PARAMETERS (must be collected)')
       expect(systemPrompt).toContain('slab_thickness: 150-500mm')
       expect(systemPrompt).toContain('cavity: 50-400mm')
       expect(systemPrompt).toContain('support_level: -600 to 500mm')
       expect(systemPrompt).toContain('CONDITIONAL PARAMETERS (only if mentioned)')
       expect(systemPrompt).toContain('EXTRACTED PARAMETERS')
       expect(systemPrompt).toContain('VALIDATION')
       expect(systemPrompt).toContain('MISSING INFORMATION')
    })

    it('should use correct AI model parameters', async () => {
      const mockToDataStreamResponse = jest.fn().mockReturnValue(
        new Response('mocked-stream-response')
      )
      
      mockStreamText.mockResolvedValue({
        toDataStreamResponse: mockToDataStreamResponse
      } as any)

      const requestBody = {
        messages: [
          { role: 'user', content: 'Test message' }
        ]
      }

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      await POST(request)

      expect(mockStreamText).toHaveBeenCalledWith({
        model: 'mocked-openai-model',
        system: expect.any(String),
        messages: requestBody.messages,
        temperature: 0.7,
        maxTokens: 1000
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle malformed JSON requests', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: 'invalid-json',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
      
      const responseData = await response.json()
      expect(responseData).toEqual({
        error: 'Failed to process chat request',
        details: expect.any(String)
      })
    })

    it('should handle streamText errors', async () => {
      const mockError = new Error('OpenAI API error')
      mockStreamText.mockRejectedValue(mockError)

      const requestBody = {
        messages: [
          { role: 'user', content: 'Test message' }
        ]
      }

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
      
      const responseData = await response.json()
      expect(responseData).toEqual({
        error: 'Failed to process chat request',
        details: 'OpenAI API error'
      })
    })

    it('should handle missing messages field', async () => {
      const requestBody = {
        // Missing messages field
      }

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
      
      const responseData = await response.json()
      expect(responseData.error).toBe('Failed to process chat request')
    })

    it('should handle empty request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
      
      const responseData = await response.json()
      expect(responseData.error).toBe('Failed to process chat request')
    })

    it('should return proper error response format', async () => {
      const mockError = new Error('Test error')
      mockStreamText.mockRejectedValue(mockError)

      const requestBody = {
        messages: [
          { role: 'user', content: 'Test message' }
        ]
      }

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
      expect(response.headers.get('Content-Type')).toBe('application/json')
      
      const responseData = await response.json()
      expect(responseData).toHaveProperty('error')
      expect(responseData).toHaveProperty('details')
      expect(responseData.error).toBe('Failed to process chat request')
      expect(responseData.details).toBe('Test error')
    })
  })

  describe('Request Validation', () => {
    it('should accept valid message arrays', async () => {
      const mockToDataStreamResponse = jest.fn().mockReturnValue(
        new Response('mocked-stream-response')
      )
      
      mockStreamText.mockResolvedValue({
        toDataStreamResponse: mockToDataStreamResponse
      } as any)

      const requestBody = {
        messages: [
          { role: 'user', content: 'First message' },
          { role: 'assistant', content: 'AI response' },
          { role: 'user', content: 'Follow up message' }
        ]
      }

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)

      expect(mockStreamText).toHaveBeenCalled()
      expect(response).toBeInstanceOf(Response)
    })

    it('should handle complex message content', async () => {
      const mockToDataStreamResponse = jest.fn().mockReturnValue(
        new Response('mocked-stream-response')
      )
      
      mockStreamText.mockResolvedValue({
        toDataStreamResponse: mockToDataStreamResponse
      } as any)

      const requestBody = {
        messages: [
          { 
            role: 'user', 
            content: 'I have a complex project with slab thickness 300mm, cavity 150mm, support level -100mm, and I need a notch 50mm high and 30mm deep.' 
          }
        ]
      }

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)

      expect(mockStreamText).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: requestBody.messages
        })
      )
      expect(response).toBeInstanceOf(Response)
    })
  })

  describe('Console Logging', () => {
    it('should log errors to console', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      const mockError = new Error('Test logging error')
      mockStreamText.mockRejectedValue(mockError)

      const requestBody = {
        messages: [
          { role: 'user', content: 'Test message' }
        ]
      }

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      await POST(request)

      expect(consoleSpy).toHaveBeenCalledWith('Chat API Error:', mockError)
      
      consoleSpy.mockRestore()
    })
  })
}) 