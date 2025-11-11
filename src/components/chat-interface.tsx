"use client"

import { useState, useRef, useEffect } from 'react'
import { useChat } from 'ai/react'
import { Send, Loader2, Bot, User, CheckCircle, AlertCircle, Settings } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { ChatInterfaceProps } from '@/types/chat-types'

export function ChatInterface({
  onParametersExtracted,
  onError,
  disabled = false,
  className,
  workflowMode = 'manual',
  sessionId
}: ChatInterfaceProps & { workflowMode?: 'manual' | 'ai-assisted' | 'fully-automated', sessionId?: string }) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [showConfirmButton, setShowConfirmButton] = useState(false)
  const [lastAIMessage, setLastAIMessage] = useState('')
  const [toolExecutionStatus, setToolExecutionStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle')

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: '/api/chat',
    headers: sessionId ? { 'x-session-id': sessionId } : undefined,
    onResponse: async (response) => {
      if (!response.ok) {
        const errorData = await response.json()
        onError?.(errorData.error || 'Failed to get response from AI')
      }
    },
    onError: (error) => {
      console.error('Chat error:', error)
      onError?.(error.message || 'An error occurred while chatting')
    },
    onFinish: (message) => {
      // Don't auto-extract parameters - wait for user confirmation
      console.log('AI message received:', message.content)
      setLastAIMessage(message.content)
      
      // Detect tool execution results for status indicators
      const lowerContent = message.content.toLowerCase()
      if (lowerContent.includes('optimization completed successfully') || 
          lowerContent.includes('analysis completed') ||
          lowerContent.includes('design found')) {
        setToolExecutionStatus('success')
        setTimeout(() => setToolExecutionStatus('idle'), 3000) // Reset after 3 seconds
      } else if (lowerContent.includes('optimization failed') || 
                 lowerContent.includes('no valid design') ||
                 lowerContent.includes('error')) {
        setToolExecutionStatus('error')
        setTimeout(() => setToolExecutionStatus('idle'), 3000)
      }
      
      // For fully automated mode, auto-extract parameters without showing confirm button
      if (workflowMode === 'fully-automated') {
        // Check if message looks like a summary with values
        const hasValuesPattern = /\d+\s*mm/g.test(message.content)
        const hasMultipleParameters = (
          lowerContent.includes('concrete slab thickness') &&
          lowerContent.includes('cavity width') &&
          lowerContent.includes('bracket drop')
        )
        
        if ((lowerContent.includes('here\'s what i have') && hasValuesPattern) ||
            (lowerContent.includes('summary') && hasValuesPattern) ||
            (hasMultipleParameters && hasValuesPattern && !lowerContent.includes('provide'))) {
          // Auto-extract parameters for fully automated mode
          handleConfirmParameters()
          return
        }
      }
      
      // Show confirm button only for ai-assisted mode
      if (workflowMode === 'ai-assisted') {
        const hasValuesPattern = /\d+\s*mm/g.test(message.content) // Check for "250 mm" type patterns
        const hasMultipleParameters = (
          lowerContent.includes('concrete slab thickness') &&
          lowerContent.includes('cavity width') &&
          lowerContent.includes('bracket drop')
        )
        
        if (
          (lowerContent.includes('here\'s what i have') && hasValuesPattern) ||
          (lowerContent.includes('summary') && hasValuesPattern) ||
          (hasMultipleParameters && hasValuesPattern && !lowerContent.includes('provide'))
        ) {
          setShowConfirmButton(true)
        }
      }
    }
  })

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages])

  // Handle form submission with custom input management
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isLoading && !disabled) {
      handleSubmit(e)
      setShowConfirmButton(false) // Hide confirm button when user sends new message
    }
  }

  const handleConfirmParameters = () => {
    try {
      import('@/utils/parameter-extraction').then(({ extractParametersFromText }) => {
        const extractionResult = extractParametersFromText(lastAIMessage)
        if (extractionResult.parameters.length > 0) {
          onParametersExtracted?.(extractionResult.parameters)
          setShowConfirmButton(false)
        } else {
          onError?.('No parameters could be extracted from the summary')
        }
      })
    } catch (error) {
      console.error('Parameter extraction error:', error)
      onError?.('Error extracting parameters')
    }
  }

  const formatTimestamp = (timestamp?: Date) => {
    if (!timestamp) return ''
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(timestamp)
  }

  return (
    <Card className={cn("h-full flex flex-col", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bot className="h-5 w-5 text-[#c2f20e]" />
          AI Design Assistant
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-4 space-y-4 min-h-0">
        {/* Messages Area */}
        <ScrollArea ref={scrollAreaRef} className="flex-1 min-h-0 pr-4">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Bot className="h-12 w-12 mx-auto mb-4 text-[#c2f20e]/50" />
                <p className="text-lg font-medium mb-2">Ready to help!</p>
                <p className="text-sm">
                  Tell me about your masonry support project. You can share all your details at once, 
                  or I&apos;ll guide you through each parameter step by step.
                </p>
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-gray-100">
                      <Bot className="h-4 w-4 text-gray-600" />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div
                  className={cn(
                    "max-w-[85%] rounded-lg px-4 py-2 text-sm",
                    message.role === 'user'
                      ? 'bg-[#c2f20e] text-black ml-auto'
                      : 'bg-gray-50 border border-gray-200'
                  )}
                >
                  <div className="break-words">
                    {message.role === 'assistant' ? (
                      <div className="prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-em:text-foreground prose-code:text-foreground prose-pre:bg-muted-foreground/10 prose-pre:text-foreground prose-blockquote:text-foreground prose-li:text-foreground">
                        <ReactMarkdown
                          components={{
                            // Customize components for better styling in chat
                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                            ul: ({ children }) => <ul className="mb-2 last:mb-0 pl-4">{children}</ul>,
                            ol: ({ children }) => <ol className="mb-2 last:mb-0 pl-4">{children}</ol>,
                            li: ({ children }) => <li className="mb-1">{children}</li>,
                            code: ({ children }) => <code className="bg-muted-foreground/20 px-1 py-0.5 rounded text-xs">{children}</code>,
                            pre: ({ children }) => <pre className="bg-muted-foreground/10 p-2 rounded text-xs overflow-x-auto">{children}</pre>,
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap">
                        {message.content}
                      </div>
                    )}
                  </div>
                  {message.createdAt && (
                    <div className={cn(
                      "text-xs mt-1 opacity-70",
                      message.role === 'user' ? 'text-right' : 'text-left'
                    )}>
                      {formatTimestamp(message.createdAt)}
                    </div>
                  )}
                </div>
                
                {message.role === 'user' && (
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            
            {/* Enhanced loading indicator */}
            {isLoading && (
              <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-gray-100">
                    <Bot className="h-4 w-4 text-gray-600" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span className="text-muted-foreground">
                      {input.toLowerCase().includes('optim') || input.toLowerCase().includes('run') ? 
                        'Running optimization...' : 
                        input.toLowerCase().includes('analy') || input.toLowerCase().includes('good') ? 
                        'Analyzing design...' : 
                        'AI is thinking...'}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Tool execution status indicator */}
            {toolExecutionStatus !== 'idle' && !isLoading && (
              <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-gray-100">
                    <Settings className="h-4 w-4 text-gray-600" />
                  </AvatarFallback>
                </Avatar>
                <div className={cn(
                  "rounded-lg px-4 py-2 text-sm border",
                  toolExecutionStatus === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                )}>
                  <div className="flex items-center gap-2">
                    {toolExecutionStatus === 'success' ? (
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    ) : (
                      <AlertCircle className="h-3 w-3 text-red-600" />
                    )}
                    <span className={toolExecutionStatus === 'success' ? 'text-green-700' : 'text-red-700'}>
                      {toolExecutionStatus === 'success' ? 'Tool executed successfully!' : 'Tool execution failed'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Bottom section with error, input, and help - fixed at bottom */}
        <div className="space-y-2 flex-shrink-0">
          {/* Confirm Parameters Button - only show in ai-assisted mode */}
          {showConfirmButton && workflowMode === 'ai-assisted' && (
            <div className="bg-[#c2f20e]/10 border border-[#c2f20e] rounded-md p-3">
              <p className="text-sm text-foreground mb-2">
                ✅ Ready to populate the form with these parameters?
              </p>
              <Button 
                onClick={handleConfirmParameters}
                className="w-full bg-[#c2f20e] text-black hover:bg-[#c2f20e]/90"
                size="sm"
              >
                Confirm & Fill Form
              </Button>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-destructive/10 border border-destructive text-destructive px-3 py-2 rounded-md text-sm">
              {error.message || 'An error occurred'}
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleFormSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder={
                disabled 
                  ? "Chat is disabled" 
                  : "Describe your masonry support project..."
              }
              disabled={disabled || isLoading}
              className="flex-1"
              autoComplete="off"
            />
            <Button
              type="submit"
              disabled={disabled || isLoading || !input.trim()}
              size="icon"
              className="shrink-0"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  )
} 