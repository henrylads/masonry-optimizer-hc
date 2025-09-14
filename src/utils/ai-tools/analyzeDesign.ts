import type { 
  AnalyzeDesignParams, 
  AnalyzeDesignResult
} from '@/types/ai-tools'
import { AnalyzeDesignParamsSchema } from '@/types/ai-tools'

/**
 * Tool 2: Design Analysis via Vector Store Search
 * Searches the OpenAI vector store for relevant information to help analyze designs.
 *
 * @param params - The user's question which will be used as the search query.
 * @param sessionId - The active chat session ID (kept for compatibility).
 * @returns Search results from the vector store.
 */
export async function analyzeDesign(
  params: AnalyzeDesignParams,
  sessionId: string
): Promise<AnalyzeDesignResult> {
  try {
    // 1. Validate incoming parameters
    const validatedParams = AnalyzeDesignParamsSchema.parse(params)
    const { question } = validatedParams

    console.log(`🔍 analyzeDesign called with sessionId: ${sessionId}`)
    console.log(`🔍 Searching vector store for: "${question}"`)

    // 2. Search the vector store
    const searchResults = await searchVectorStore(question)

    if (searchResults.startsWith('Error') || searchResults === 'No files found') {
      return {
        success: false,
        error: searchResults,
      }
    }

    return {
      success: true,
      analysis: searchResults,
      suggestions: [],
      quantitativeImpact: []
    }

  } catch (error) {
    console.error('Error in analyzeDesign:', error)
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred during analysis.'
    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Searches the OpenAI vector store for relevant information.
 */
async function searchVectorStore(query: string): Promise<string> {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY
    const vectorStoreId = process.env.OPENAI_VECTOR_STORE_ID

    if (!openaiApiKey) {
      return 'Error: OPENAI_API_KEY environment variable not set'
    }

    if (!vectorStoreId) {
      return 'Error: OPENAI_VECTOR_STORE_ID environment variable not set'
    }

    console.log(`🔍 Searching vector store ${vectorStoreId} with query: "${query}"`)

    const response = await fetch(`https://api.openai.com/v1/vector_stores/${vectorStoreId}/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`OpenAI API error: ${response.status} - ${errorText}`)
      return `Error ${response.status}: Vector file store seems offline. Please try again in a minute.`
    }

    const results = await response.json()

    if (!results?.data?.length) {
      return 'No files found'
    }

    // Define types for OpenAI vector store response
    interface VectorStoreContent {
      text: string;
    }
    
    interface VectorStoreResult {
      file_id: string;
      file_name: string;
      content: VectorStoreContent[];
    }

    // Format results with sources
    const formattedResults = [
      '<sources>',
      ...results.data.flatMap((res: VectorStoreResult) => [
        `<result file_id='${res.file_id}' file_name='${res.file_name}'>`,
        ...res.content.map((part: VectorStoreContent) => `<content>${part.text}</content>`),
        '</result>'
      ]),
      '</sources>'
    ].join('\n')

    console.log(`✅ Found ${results.data.length} relevant documents`)
    return formattedResults

  } catch (error) {
    console.error('Vector store search error:', error)
    return `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`
  }
} 