import { openai } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { 
  resultContextManager, 
  extractSessionId,
  runOptimization,
  analyzeDesign 
} from '@/utils/ai-tools';
import type { 
  RunOptimizationParams, 
  AnalyzeDesignParams 
} from '@/types/ai-tools';

// Enhanced system prompt for structured parameter extraction
const SYSTEM_PROMPT = `You are an expert AI assistant for structural engineers using the Masonry Support System Optimizer. Your goal is to help users design and analyze masonry support systems efficiently and accurately. You have two primary roles: Parameter Gathering and Result Analysis.

**Knowledge Base:**
You have access to a comprehensive "Project Overview" document. You MUST use the information from this document to answer questions about terminology, calculations, and design principles. Key concepts include: cast-in channels, brackets (standard and inverted), angles (standard and inverted), notches, bracket drop (SSL/BSL), and load calculations.

---

### Role 1: Parameter Gathering & Optimization (Tool 1: runOptimization)

**Objective:** Guide the user to provide all necessary parameters to run an optimization.

**Workflow:**
1.  **Greet the user** and ask about their project requirements.
2.  **Extract parameters** from the user's input. The required parameters are:
    *   \`slab_thickness\` (mm)
    *   \`cavity\` (mm)
    *   \`bracket_drop\` (mm) - also called support_level in the API
    *   Load information: either \`characteristic_load\` (kN/m) OR \`masonry_density\` (kg/m³), \`masonry_thickness\` (mm), and \`masonry_height\` (m).
    *   Optional: \`has_notch\`, \`notch_height\`, \`notch_depth\`, \`is_angle_length_limited\`, \`fixed_angle_length\`.
3.  **Be conversational.** If parameters are missing, ask for them clearly. Do not ask for optional parameters unless the user mentions them (e.g., if they mention a "notch" or "fixed length").
4.  **Confirm and Execute:** Once all required parameters are gathered, provide a summary to the user. After they confirm, call the \`runOptimization\` tool to execute the optimization.

---

### Role 2: Knowledge-Based Analysis & Support (Tool 2: analyzeDesign)

**Objective:** Help users by searching the knowledge base for relevant information about masonry design principles, optimization strategies, and troubleshooting.

**Workflow:**
1.  **Listen for Questions:** When users ask questions about design principles, optimization strategies, failure modes, parameter effects, or want to understand masonry engineering concepts, use the knowledge base search.
2.  **Use the \`analyzeDesign\` Tool:** Call this tool whenever you need additional context or specific information to answer the user's question. This includes:
    - General design questions ("What affects bracket capacity?", "How does cavity width impact design?")
    - Optimization strategies ("How can I reduce weight?", "What parameters should I try?")
    - Understanding failures ("Why might a design fail?", "What causes connection failures?")  
    - Parameter guidance ("What's a typical bracket drop?", "How do I choose slab thickness?")
    - Engineering principles ("How are loads calculated?", "What's the difference between standard and inverted brackets?")
3.  **Synthesize Information:** When you get results from the knowledge base:
    *   **Extract key information** from the sources provided
    *   **Present it clearly** in context of the user's question
    *   **Combine with optimization results** if available to give specific advice
    *   **Maintain the conversation.** Ask if the user wants to explore a suggestion, try new parameters, or ask another question.

**Tool Usage:**
You have access to two tools:
- \`runOptimization\`: Execute the optimization algorithm with extracted parameters
- \`analyzeDesign\`: Analyze optimization results and provide suggestions
`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    
    // Extract or generate session ID for context management
    const sessionId = extractSessionId(req.headers);
    console.log(`📝 Processing chat request for session: ${sessionId}`);
    
    // Add debugging for stored results
    const hasStoredResult = await resultContextManager.hasValidResult(sessionId);
    console.log(`🔍 Session ${sessionId} has stored result: ${hasStoredResult}`);
    
    // Log storage stats for debugging
    const stats = resultContextManager.getStorageStats();
    console.log(`📊 Context storage stats:`, stats);

    const result = await streamText({
      model: openai('gpt-4.1'),
      system: SYSTEM_PROMPT,
      messages,
      temperature: 0.7,
      maxTokens: 1000,
      maxSteps: 3,
      tools: {
        runOptimization: tool({
          description: 'Execute the masonry support optimization algorithm with the provided parameters',
          parameters: z.object({
            slab_thickness: z.number().describe('Slab thickness in mm (150-500)'),
            cavity: z.number().describe('Cavity width in mm (50-400, in 0.5mm increments)'),
            support_level: z.number().describe('Bracket drop in mm (-600 to 500) - vertical distance from top of slab'),
            characteristic_load: z.string().optional().describe('Characteristic load in kN/m (optional if masonry properties provided)'),
            masonry_density: z.number().optional().describe('Masonry density in kg/m³ (1500-2500, for calculation)'),
            masonry_thickness: z.number().optional().describe('Masonry thickness in mm (50-250, for calculation)'),
            masonry_height: z.number().optional().describe('Masonry height in m (1-10, for calculation)'),
            has_notch: z.boolean().optional().describe('Whether the bracket requires a notch'),
            notch_height: z.number().optional().describe('Notch height in mm (10-200, required if has_notch=true)'),
            notch_depth: z.number().optional().describe('Notch depth in mm (10-200, required if has_notch=true)'),
            is_angle_length_limited: z.boolean().optional().describe('Whether angle length is constrained'),
            fixed_angle_length: z.number().optional().describe('Fixed angle length in mm (200-1490 in 5mm increments, required if is_angle_length_limited=true)')
          }),
          execute: async (params) => {
            try {
              console.log(`🔧 Running optimization with params:`, params);
              
              // Execute the optimization
              const optimizationResult = await runOptimization(
                params as RunOptimizationParams,
                (update) => {
                  // Progress updates could be sent via server-sent events in the future
                  console.log(`📊 Progress: ${update.stage} - ${update.progress}% - ${update.message}`);
                }
              );
              
              if (optimizationResult.success && optimizationResult.result) {
                // Store the result in context for future analysis
                await resultContextManager.storeResult(
                  sessionId,
                  optimizationResult.result,
                  params as RunOptimizationParams,
                  optimizationResult.executionTimeMs || 0
                );
                
                console.log(`✅ Optimization completed and stored for session ${sessionId}`);
                
                return {
                  success: true,
                  message: `Optimization completed successfully in ${optimizationResult.executionTimeMs}ms`,
                  result: optimizationResult.result,
                  weight: optimizationResult.result.calculated.optimal_design_weight,
                  isValid: optimizationResult.result.calculated.all_checks_pass
                };
              } else {
                return {
                  success: false,
                  error: optimizationResult.error || 'Optimization failed',
                  message: 'The optimization could not find a valid design with the given parameters.'
                };
              }
            } catch (error) {
              console.error('Tool execution error:', error);
              return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error during optimization'
              };
            }
          }
        }),
        analyzeDesign: tool({
          description: 'Search the knowledge base for information to help with design analysis and optimization questions',
          parameters: z.object({
            question: z.string().describe('The user\'s question - this will be used as the search query for the knowledge base')
          }),
          execute: async (params) => {
            try {
              console.log(`🔍 Searching knowledge base with question: ${params.question}`);
              
              // Execute the vector store search
              const searchResult = await analyzeDesign(params as AnalyzeDesignParams, sessionId);
              
              if (searchResult.success) {
                console.log(`✅ Knowledge base search completed`);
                
                return {
                  success: true,
                  sources: searchResult.analysis, // This contains the formatted XML with sources
                  message: 'Found relevant information from the knowledge base'
                };
              } else {
                return {
                  success: false,
                  error: searchResult.error || 'Knowledge base search failed',
                  message: searchResult.error || 'Could not search the knowledge base'
                };
              }
            } catch (error) {
              console.error('Knowledge base search error:', error);
              return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error during knowledge base search'
              };
            }
          }
        })
      }
    });

    return result.toDataStreamResponse({
      headers: {
        'x-session-id': sessionId
      }
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process chat request',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 