import { analyzeDesign } from './analyzeDesign'
import { resultContextManager } from './result-context-manager'
import type { AnalyzeDesignParams, AnalysisContext } from '@/types/ai-tools'

// Mock the result context manager
jest.mock('./result-context-manager', () => ({
  resultContextManager: {
    getAnalysisContext: jest.fn(),
    updateConversationHistory: jest.fn()
  }
}))

const mockResultContextManager = resultContextManager as jest.Mocked<typeof resultContextManager>

describe('analyzeDesign', () => {
  // Valid design analysis context
  const validDesignContext: AnalysisContext = {
    hasResult: true,
    resultSummary: '✅ Valid design found: 12.50 kg/m total weight with 300mm bracket centres, 4mm angle thickness, and 3mm bracket thickness.',
    designStatus: 'valid',
    key_metrics: {
      totalWeight: 12.5,
      bracketCentres: 300,
      angleThickness: 4,
      bracketThickness: 3,
      utilisation: 0.65 // 65% utilization - over-engineered
    },
    verification_status: {
      all_checks_pass: true,
      failed_checks: undefined,
      critical_failures: undefined
    },
    design_parameters: {
      slab_thickness: 200,
      cavity: 100,
      support_level: 50,
      characteristic_load: '5.0',
      has_notch: false,
      bracket_type: 'Standard'
    },
    generatedAt: new Date('2024-01-15T10:30:00Z'),
    executionTimeMs: 2500
  }

  // Failed design analysis context
  const failedDesignContext: AnalysisContext = {
    hasResult: true,
    resultSummary: '❌ No valid design found. All parameter combinations failed verification checks.',
    designStatus: 'invalid',
    key_metrics: {
      totalWeight: undefined,
      bracketCentres: 250,
      angleThickness: 3,
      bracketThickness: 3,
      utilisation: undefined
    },
    verification_status: {
      all_checks_pass: false,
      failed_checks: ['Moment Resistance', 'Bracket Connection'],
      critical_failures: ['Moment Resistance', 'Bracket Connection']
    },
    design_parameters: {
      slab_thickness: 150,
      cavity: 200,
      support_level: -100,
      characteristic_load: '8.0',
      has_notch: false,
      bracket_type: 'Standard'
    },
    generatedAt: new Date('2024-01-15T10:25:00Z'),
    executionTimeMs: 3200
  }

  // High utilization valid design context
  const highUtilizationContext: AnalysisContext = {
    hasResult: true,
    resultSummary: '✅ Valid design found: 15.80 kg/m total weight with 400mm bracket centres, 6mm angle thickness, and 4mm bracket thickness.',
    designStatus: 'valid',
    key_metrics: {
      totalWeight: 15.8,
      bracketCentres: 400,
      angleThickness: 6,
      bracketThickness: 4,
      utilisation: 0.96 // 96% utilization - highly optimized
    },
    verification_status: {
      all_checks_pass: true,
      failed_checks: undefined,
      critical_failures: undefined
    },
    design_parameters: {
      slab_thickness: 200,
      cavity: 150,
      support_level: 0,
      characteristic_load: '7.5',
      has_notch: false,
      bracket_type: 'Standard'
    },
    generatedAt: new Date('2024-01-15T10:35:00Z'),
    executionTimeMs: 4100
  }

  // No context available
  const noResultContext: AnalysisContext = {
    hasResult: false,
    designStatus: 'unknown'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('successful analysis scenarios', () => {
    it('should analyze a valid over-engineered design and suggest optimizations', async () => {
      mockResultContextManager.getAnalysisContext.mockResolvedValue(validDesignContext)

      const params: AnalyzeDesignParams = {
        question: 'Is this design optimized? Can I reduce the weight?',
        analysisType: 'optimization'
      }

      const result = await analyzeDesign(params, 'test-session-123')

      expect(result.success).toBe(true)
      expect(result.analysis).toContain('65.0%')
      expect(result.analysis).toContain('over-engineered')
      expect(result.analysis).toContain('12.50 kg/m')
      
      expect(result.suggestions).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/Decrease.*angle thickness.*from 4mm to 3mm/),
          expect.stringMatching(/Increase.*bracket centres.*from 300mm/)
        ])
      )

      expect(result.quantitativeImpact).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            parameter: 'angle_thickness',
            currentValue: '4mm',
            suggestedValue: '3mm',
            estimatedChange: expect.stringContaining('weight')
          })
        ])
      )

      // Note: Current implementation doesn't update conversation history
      expect(mockResultContextManager.getAnalysisContext).toHaveBeenCalledWith('test-session-123')
    })

    it('should analyze a failed design and provide specific improvement suggestions', async () => {
      mockResultContextManager.getAnalysisContext.mockResolvedValue(failedDesignContext)

      const params: AnalyzeDesignParams = {
        question: 'Why did the optimization fail? What can I change?',
        analysisType: 'explanation'
      }

      const result = await analyzeDesign(params, 'test-session-456')

      expect(result.success).toBe(true)
      expect(result.analysis).toContain('failed verification')
      expect(result.analysis).toContain('Moment Resistance')
      expect(result.analysis).toContain('Bracket Connection')
      
      // Should suggest improvements
      expect(result.suggestions).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/Decrease.*bracket centres.*from 250mm to 200mm/),
          expect.stringMatching(/Increase.*angle thickness.*from 3mm/),
          expect.stringMatching(/Decrease.*cavity.*from 200mm/),
          expect.stringMatching(/Increase.*slab thickness.*from 150mm/)
        ])
      )

      expect(result.quantitativeImpact).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            parameter: 'cavity',
            currentValue: '200mm',
            estimatedChange: expect.stringContaining('reduction in moment force')
          }),
          expect.objectContaining({
            parameter: 'slab_thickness',
            currentValue: '150mm',
            estimatedChange: expect.stringContaining('No support weight change')
          })
        ])
      )
    })

    it('should analyze a highly optimized design and warn about capacity limits', async () => {
      mockResultContextManager.getAnalysisContext.mockResolvedValue(highUtilizationContext)

      const params: AnalyzeDesignParams = {
        question: 'How efficient is this design?'
      }

      const result = await analyzeDesign(params, 'test-session-789')

      expect(result.success).toBe(true)
      expect(result.analysis).toContain('96.0%')
      expect(result.analysis).toContain('highly efficient')
      expect(result.analysis).toContain('close to its capacity')
      expect(result.analysis).toContain('well-optimized')
      
      // Should not suggest major changes for highly optimized design
      expect(result.suggestions?.length || 0).toBeLessThanOrEqual(2)
      
      expect(result.quantitativeImpact?.length || 0).toBeLessThanOrEqual(2)
    })

    it('should handle bracket type alternative suggestions for failed connection designs', async () => {
      const failedConnectionContext: AnalysisContext = {
        ...failedDesignContext,
        design_parameters: {
          ...failedDesignContext.design_parameters!,
          support_level: -100, // Should recommend Standard bracket
          bracket_type: 'Inverted' // But using Inverted bracket
        },
        verification_status: {
          all_checks_pass: false,
          failed_checks: ['Bracket Connection', 'Fixing'],
          critical_failures: ['Bracket Connection']
        }
      }

      mockResultContextManager.getAnalysisContext.mockResolvedValue(failedConnectionContext)

      const params: AnalyzeDesignParams = {
        question: 'The bracket connection keeps failing. What should I do?'
      }

      const result = await analyzeDesign(params, 'test-session-alt')

      expect(result.success).toBe(true)
      expect(result.analysis).toContain('Alternative Approach')
      expect(result.analysis).toContain('Standard Bracket')
      expect(result.suggestions).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/Try re-running.*Standard/)
        ])
      )
      
      expect(result.quantitativeImpact).toContainEqual(
        expect.objectContaining({
          parameter: 'bracket_type',
          currentValue: 'Inverted',
          suggestedValue: 'Standard'
        })
      )
    })
  })

  describe('edge cases and error handling', () => {
    it('should handle missing context gracefully', async () => {
      mockResultContextManager.getAnalysisContext.mockResolvedValue(noResultContext)

      const params: AnalyzeDesignParams = {
        question: 'How is my design performing?'
      }

      const result = await analyzeDesign(params, 'test-session-missing')

      expect(result.success).toBe(false)
      expect(result.error).toContain('No optimization result found')
      expect(result.analysis).toBeUndefined()
      expect(result.suggestions).toBeUndefined()
      expect(result.quantitativeImpact).toBeUndefined()
    })

    it('should handle context manager errors', async () => {
      mockResultContextManager.getAnalysisContext.mockRejectedValue(
        new Error('Context retrieval failed')
      )

      const params: AnalyzeDesignParams = {
        question: 'What went wrong?'
      }

      const result = await analyzeDesign(params, 'test-session-error')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Context retrieval failed')
    })

    it('should handle empty session ID by passing to context manager', async () => {
      mockResultContextManager.getAnalysisContext.mockRejectedValue(
        new Error('Invalid session ID')
      )

      const params: AnalyzeDesignParams = {
        question: 'How is the design?'
      }

      const result = await analyzeDesign(params, '') // Empty session ID

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid session ID')
    })

    it('should handle context with partial data gracefully', async () => {
      const partialContext: AnalysisContext = {
        hasResult: true,
        designStatus: 'valid',
        resultSummary: '✅ Valid design found with minimal data.',
        // Missing most optional fields
        verification_status: {
          all_checks_pass: true
        }
      }

      mockResultContextManager.getAnalysisContext.mockResolvedValue(partialContext)

      const params: AnalyzeDesignParams = {
        question: 'Tell me about this design'
      }

      const result = await analyzeDesign(params, 'test-session-partial')

      expect(result.success).toBe(true)
      expect(result.analysis).toBeDefined()
      expect(result.suggestions).toBeDefined()
      expect(result.quantitativeImpact).toBeDefined()
    })
  })

  describe('quantitative impact calculations', () => {
    it('should calculate correct weight increase estimates for bracket centres changes', async () => {
      const contextWithBracketCentres: AnalysisContext = {
        ...failedDesignContext,
        key_metrics: {
          ...failedDesignContext.key_metrics!,
          bracketCentres: 400
        }
      }

      mockResultContextManager.getAnalysisContext.mockResolvedValue(contextWithBracketCentres)

      const params: AnalyzeDesignParams = {
        question: 'How can I fix the moment resistance?'
      }

      const result = await analyzeDesign(params, 'test-session-calc')

      expect(result.success).toBe(true)
      
      const bracketCentresImpact = result.quantitativeImpact!.find(
        impact => impact.parameter === 'bracket_centres'
      )
      
      expect(bracketCentresImpact).toBeDefined()
      expect(bracketCentresImpact!.currentValue).toBe('400mm')
      expect(bracketCentresImpact!.suggestedValue).toBe('350mm')
      expect(bracketCentresImpact!.estimatedChange).toMatch(/~14% weight increase/)
    })

    it('should provide percentage reduction estimates for cavity changes', async () => {
      const contextWithLargeCavity: AnalysisContext = {
        ...failedDesignContext,
        design_parameters: {
          ...failedDesignContext.design_parameters!,
          cavity: 300
        }
      }

      mockResultContextManager.getAnalysisContext.mockResolvedValue(contextWithLargeCavity)

      const params: AnalyzeDesignParams = {
        question: 'The bracket connection is failing'
      }

      const result = await analyzeDesign(params, 'test-session-cavity')

      expect(result.success).toBe(true)
      
      const cavityImpact = result.quantitativeImpact!.find(
        impact => impact.parameter === 'cavity'
      )
      
      expect(cavityImpact).toBeDefined()
      expect(cavityImpact!.currentValue).toBe('300mm')
      expect(cavityImpact!.suggestedValue).toBe('290mm')
      expect(cavityImpact!.estimatedChange).toMatch(/~3% reduction in moment force/)
    })
  })

  describe('context manager integration', () => {
    it('should retrieve analysis context from context manager', async () => {
      mockResultContextManager.getAnalysisContext.mockResolvedValue(validDesignContext)

      const params: AnalyzeDesignParams = {
        question: 'What do you think of this design?'
      }

      const result = await analyzeDesign(params, 'test-session-history')

      expect(result.success).toBe(true)
      expect(mockResultContextManager.getAnalysisContext).toHaveBeenCalledWith('test-session-history')
    })

    it('should handle missing context appropriately', async () => {
      mockResultContextManager.getAnalysisContext.mockResolvedValue(noResultContext)

      const params: AnalyzeDesignParams = {
        question: 'How is my design?'
      }

      const result = await analyzeDesign(params, 'test-session-no-context')

      expect(result.success).toBe(false)
      expect(result.error).toContain('No optimization result found')
    })
  })

  describe('analysis type hint handling', () => {
    it('should handle different analysis types appropriately', async () => {
      mockResultContextManager.getAnalysisContext.mockResolvedValue(validDesignContext)

      const analysisTypes: Array<AnalyzeDesignParams['analysisType']> = [
        'improvement',
        'explanation', 
        'comparison',
        'optimization'
      ]

      for (const analysisType of analysisTypes) {
        const params: AnalyzeDesignParams = {
          question: `Give me an ${analysisType} analysis`,
          analysisType
        }

        const result = await analyzeDesign(params, `test-session-${analysisType}`)

        expect(result.success).toBe(true)
        expect(result.analysis).toBeDefined()
        expect(result.suggestions).toBeDefined()
        expect(result.quantitativeImpact).toBeDefined()
      }
    })
  })

  describe('integration with context manager', () => {
    it('should call getAnalysisContext with correct session ID', async () => {
      mockResultContextManager.getAnalysisContext.mockResolvedValue(validDesignContext)

      const params: AnalyzeDesignParams = {
        question: 'Test question'
      }

      await analyzeDesign(params, 'specific-session-id')

      expect(mockResultContextManager.getAnalysisContext).toHaveBeenCalledWith('specific-session-id')
    })

    it('should handle context manager errors gracefully in additional scenarios', async () => {
      mockResultContextManager.getAnalysisContext.mockResolvedValue(validDesignContext)

      const params: AnalyzeDesignParams = {
        question: 'Test question for additional validation'
      }

      const result = await analyzeDesign(params, 'test-session-additional')

      expect(result.success).toBe(true)
      expect(result.analysis).toBeDefined()
      expect(mockResultContextManager.getAnalysisContext).toHaveBeenCalledWith('test-session-additional')
    })
  })
}) 