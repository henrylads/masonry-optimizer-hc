# Tasks: AI Tools Integration with AI SDK streamtext

## Relevant Files

- `src/app/api/chat/route.ts` - API route handler for AI chat with tool calling functionality using AI SDK streamtext.
- `src/app/api/chat/route.test.ts` - Unit tests for chat API route and tool calling.
- `src/types/ai-tools.ts` - TypeScript type definitions for AI tools parameters and responses.
- `src/types/ai-tools.test.ts` - Unit tests for AI tools type validation.
- `src/utils/ai-tools/runOptimization.ts` - Tool 1 implementation for direct algorithm execution with enhanced progress tracking and streaming support.
- `src/utils/ai-tools/runOptimization.test.ts` - Comprehensive unit tests for runOptimization tool including progress tracking, timeout handling, error scenarios, angle length limitations, and all parameter validation cases.
- `src/utils/ai-tools/analyzeDesign.ts` - Tool 2 implementation for result analysis.
- `src/utils/ai-tools/analyzeDesign.test.ts` - Unit tests for analyzeDesign tool.
- `src/utils/ai-tools/index.ts` - Barrel export for AI tools utilities.
- `src/utils/parameter-conversion.ts` - Utility functions to convert extracted parameters to BruteForceConfig format.
- `src/utils/parameter-conversion.test.ts` - Unit tests for parameter conversion utilities.
- `src/components/chat-interface.tsx` - Enhanced chat interface to handle tool responses and display results (existing file to modify).
- `src/components/chat-interface.test.tsx` - Unit tests for enhanced chat interface functionality.
- `src/components/masonry-designer-form.tsx` - Updated to integrate with AI tool results (existing file to modify).
- `src/hooks/use-ai-tools.ts` - Custom React hook for managing AI tools state and execution.
- `src/hooks/use-ai-tools.test.ts` - Unit tests for AI tools hook.

### Notes

- Unit tests should typically be placed alongside the code files they are testing.
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.
- AI SDK streamtext documentation should be referenced for proper tool implementation patterns.
- The existing parameter extraction system in `src/utils/parameter-extraction.ts` will be extended but not replaced.

## Tasks

- [x] 1.0 Implement Tool 1: Direct Algorithm Execution (`runOptimization`)
  - [x] 1.1 Create AI tools type definitions in `src/types/ai-tools.ts` with proper parameter schemas for Tool 1
  - [x] 1.2 Implement `runOptimization` tool function in `src/utils/ai-tools/runOptimization.ts` that accepts extracted parameters
  - [x] 1.3 Create parameter conversion utility in `src/utils/parameter-conversion.ts` to transform chat parameters to `BruteForceConfig`
  - [x] 1.4 Add characteristic load calculation logic when masonry properties are provided instead of direct load
  - [x] 1.5 Implement parameter validation against `DesignInputsSchema` before algorithm execution
  - [x] 1.6 Add progress tracking and streaming support for long-running brute force algorithm execution
  - [x] 1.7 Implement error handling with user-friendly error messages for algorithm failures
  - [x] 1.8 Add support for both limited and unlimited angle length scenarios based on extracted parameters
  - [x] 1.9 Write comprehensive unit tests for Tool 1 implementation

- [x] 2.0 Implement Tool 2: Result Analysis (`analyzeDesign`)
  - [x] 2.1 Design context-based approach for passing `OptimisationResult` data through chat messages
  - [x] 2.2 Implement `analyzeDesign` tool function in `src/utils/ai-tools/analyzeDesign.ts` for result analysis
  - [x] 2.3 Create system prompt and knowledge base integration referencing `docs/projectOverview.md`
  - [x] 2.4 Implement verification failure analysis with specific improvement suggestions
  - [x] 2.5 Add quantitative analysis capabilities for parameter change impact assessment
  - [x] 2.6 Implement alternative design approach suggestions for failed designs
  - [x] 2.7 Add optimization opportunity identification based on utilization ratios
  - [x] 2.8 Create context management system for maintaining result data across chat sessions
  - [x] 2.9 Write comprehensive unit tests for Tool 2 implementation

- [x] 3.0 Integrate AI Tools with ChatInterface and Parameter Extraction ✅ COMPLETE
  - [x] 3.1 Update `src/app/api/chat/route.ts` to implement AI SDK streamtext with tool calling functionality
  - [x] 3.2 Integrate Tool 1 trigger logic with existing parameter extraction completion detection
  - [x] 3.3 Enhance `src/components/chat-interface.tsx` to handle tool execution responses and display results
  - [x] 3.4 Create custom React hook `src/hooks/use-ai-tools.ts` for managing AI tools state and execution
  - [x] 3.5 Implement tool response parsing and result object handling in chat interface
  - [x] 3.6 Add result persistence and context management for Tool 2 analysis sessions
  - [x] 3.7 Ensure compatibility with existing `src/utils/parameter-extraction.ts` system
  - [x] 3.8 Update `src/components/masonry-designer-form.tsx` to integrate with AI tool results display
  - [x] 3.9 Implement seamless switching between manual, AI-assisted, and fully automated workflows

- [ ] 4.0 Enhance User Experience and Visual Feedback
  - [ ] 4.1 Add loading states and progress indicators during Tool 1 algorithm execution
  - [ ] 4.2 Implement visual distinction between regular chat responses and tool execution results
  - [ ] 4.3 Create error state displays with actionable next steps for tool failures
  - [ ] 4.4 Add success animations and confirmation feedback for completed optimizations
  - [ ] 4.5 Implement tool execution status indicators (e.g., "Running optimization...", "Analyzing results...")
  - [ ] 4.6 Ensure results from AI tools display properly in existing `src/components/results-display.tsx`
  - [ ] 4.7 Add user guidance for when to use each workflow mode (manual vs AI-assisted vs automated)
  - [ ] 4.8 Implement graceful degradation for tool failures with fallback to manual workflows

- [ ] 5.0 Testing and Validation
  - [ ] 5.1 Write integration tests for complete AI tool workflows from parameter extraction to result display
  - [ ] 5.2 Create end-to-end tests for Tool 1 automation workflow using realistic engineering scenarios
  - [ ] 5.3 Develop test cases for Tool 2 analysis with various result scenarios (passing/failing designs)
  - [ ] 5.4 Test error handling and recovery scenarios for both tools
  - [ ] 5.5 Validate performance requirements for algorithm execution and progress reporting
  - [ ] 5.6 Test workflow switching between manual, AI-assisted, and automated modes
  - [ ] 5.7 Verify compatibility with existing form functionality and results display
  - [ ] 5.8 Conduct user acceptance testing with structural engineers for workflow validation
  - [ ] 5.9 Performance testing for concurrent tool executions and chat sessions 