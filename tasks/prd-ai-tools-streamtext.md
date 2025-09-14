# Product Requirements Document: AI Tools Integration with AI SDK streamtext

## Introduction/Overview

This feature will integrate AI Tools functionality using the AI SDK streamtext to provide automated masonry support design optimization. The goal is to enable users to have designs calculated automatically through conversational AI without manual form submission, while maintaining the existing manual workflow as an option.

Currently, users interact with the masonry optimizer through two workflows:
1. **Manual Form Input**: Users fill out `masonry-designer-form.tsx` and click submit to run calculations
2. **AI-Assisted Form Population**: Users chat with AI to extract parameters that populate the form fields, then manually submit

This feature adds a third workflow:
3. **Fully Automated AI Design**: AI directly executes calculations and provides analysis without manual intervention

## Goals

1. **Automate Design Execution**: Enable AI to directly run brute force algorithm when all required parameters are captured, bypassing manual form submission
2. **Provide Design Analysis**: Allow users to ask questions about optimization results and receive expert-level explanations and improvement suggestions  
3. **Maintain Workflow Choice**: Preserve existing manual and AI-assisted workflows while adding the new automated option
4. **Enhance User Experience**: Reduce friction for structural engineers who prefer conversational interfaces over form-based interactions

## User Stories

### Primary User Stories

**As a structural engineer, I want to describe my project requirements to the AI and have it automatically run calculations, so that I can get design results without manual form submission.**

**As a structural engineer with existing results, I want to ask the AI "What if I reduce bracket spacing?" and receive detailed analysis of the impact, so that I can understand optimization opportunities.**

**As a busy engineer, I want to switch between manual form input and AI automation based on my current workflow needs, so that I have flexibility in how I interact with the system.**

### Secondary User Stories

**As a structural engineer, I want the AI to explain why my design failed verification checks, so that I can understand what needs to be modified.**

**As a project engineer, I want to ask about cost implications of design changes, so that I can make informed decisions about material selection.**

**As a design engineer, I want to understand the sensitivity of my design to parameter changes, so that I can identify critical design factors.**

## Functional Requirements

### Tool 1: Direct Algorithm Execution (`runOptimization`)

1. **The system must trigger Tool 1 when all required design parameters have been extracted and validated through parameter extraction**
2. **The system must convert extracted parameters from the chat interface directly to the `BruteForceConfig` format**
3. **The system must call the `runBruteForce` function with the converted parameters without requiring form submission**
4. **The system must handle characteristic load calculation automatically when masonry properties are provided instead of direct load values**
5. **The system must validate all extracted parameters against the `DesignInputsSchema` before algorithm execution**
6. **The system must provide real-time progress updates to the user during algorithm execution**
7. **The system must return the complete `OptimisationResult` object to the chat interface for display**
8. **The system must handle algorithm execution errors gracefully and provide meaningful error messages to users**
9. **The system must support both limited and unlimited angle length scenarios based on extracted parameters**

### Tool 2: Result Analysis (`analyzeDesign`)

1. **The system must accept questions about existing optimization results and provide detailed analysis**
2. **The system must have access to the complete `OptimisationResult` object including all verification steps and detailed calculations**
3. **The system must be able to explain verification failures and suggest specific improvements**
4. **The system must provide quantitative analysis of parameter changes (e.g., "Reducing bracket spacing from 400mm to 300mm would increase weight by ~15%")**
5. **The system must reference the project documentation (`projectOverview.md`) to provide accurate engineering explanations**
6. **The system must suggest alternative design approaches when current designs fail verification**
7. **The system must explain the impact of changes on structural performance, weight, and cost**
8. **The system must identify optimization opportunities based on current utilization ratios**

### Integration Requirements

9. **The system must maintain the existing manual form workflow unchanged**
10. **The system must allow users to switch between manual, AI-assisted, and fully automated workflows seamlessly**
11. **The system must preserve the current results display functionality in `results-display.tsx`**
12. **The system must integrate with the existing parameter extraction system in `parameter-extraction.ts`**
13. **The system must maintain compatibility with the existing `ChatInterface` component**

## Non-Goals (Out of Scope)

- Integration with genetic algorithm (system has moved to brute force only)
- Modification of existing manual form functionality
- Creation of new UI components beyond chat interface enhancements
- Real-time collaboration features
- Integration with external CAD systems
- Cost estimation beyond general guidance
- Regulatory compliance checking
- Multi-project management

## Technical Considerations

### Tool Implementation Approach

**Tool 1 Parameter Passing**: Extract parameters should be passed as individual tool parameters since they are discrete, validated values that fit well within tool parameter limits.

**Tool 2 Data Handling**: Result analysis should receive result data through chat context/messages rather than tool parameters because:
- The `OptimisationResult` object is large and complex with nested structures
- Detailed verification results contain extensive calculation data
- Tool parameter limits could be exceeded with complete result objects  
- Context-based approach allows for more flexible querying

### Dependencies

- AI SDK streamtext for tool calling functionality
- Existing brute force algorithm in `src/calculations/bruteForceAlgorithm/`
- Parameter extraction system in `src/utils/parameter-extraction.ts`
- Project documentation in `docs/projectOverview.md` for vector store reference

### Performance Considerations

- Brute force algorithm execution time varies with parameter complexity (typically 10-60 seconds)
- Tool 1 must handle long-running operations with proper progress reporting
- Tool 2 analysis should be near-instantaneous as it doesn't involve heavy calculations

### Error Handling

- Parameter validation errors must be user-friendly and actionable
- Algorithm execution failures must preserve user context and allow retry
- Network/timeout errors must be handled gracefully

## Design Considerations

### User Experience Flow

1. **Initial State**: User starts in selected input mode (manual/AI chat)
2. **Parameter Collection**: AI extracts parameters through conversation 
3. **Validation Gate**: System validates completeness and correctness
4. **Execution Decision**: AI determines when to trigger Tool 1 vs. continue questioning
5. **Results Presentation**: Results displayed in existing `results-display.tsx` format
6. **Analysis Phase**: User can ask questions triggering Tool 2 for additional insights

### Mode Switching

- Users can switch between manual and AI modes using existing toggle
- Mode switching preserves any extracted parameters
- Results are compatible across all modes

### Visual Feedback

- Loading states during algorithm execution with progress bar
- Clear indication when AI tools are being called vs. regular chat
- Error states with actionable next steps

## Success Metrics

### Primary Metrics

1. **Automation Completion Rate**: Percentage of AI conversations that successfully complete optimization without manual intervention (Target: >80%)
2. **User Workflow Preference**: Adoption rate of fully automated workflow vs. manual/assisted workflows
3. **Time to Result**: Average time from conversation start to design results (Target: <3 minutes including algorithm execution)

### Secondary Metrics

4. **Question Resolution**: Percentage of analysis questions (Tool 2) that provide satisfactory answers without escalation
5. **Error Recovery**: Percentage of failed optimizations that successfully complete after error resolution
6. **Feature Utilization**: Usage distribution across manual, AI-assisted, and fully automated workflows

## Open Questions

### Implementation Approach

1. **Tool Parameter Limits**: What are the specific parameter size limits for AI SDK streamtext tools, and how do they impact our Tool 2 design?

2. **Vector Store Integration**: Should we implement OpenAI vector store for `projectOverview.md` immediately, or start with context injection and upgrade later?

3. **Progress Streaming**: How should we handle real-time progress updates during brute force execution - through tool streaming or separate progress events?

### User Experience

4. **Error Recovery Workflow**: When Tool 1 fails due to invalid parameters, should the AI automatically restart parameter collection or require user confirmation?

5. **Result Persistence**: Should results from AI-generated optimizations be saved/cached differently than manual form submissions?

6. **Context Management**: How long should the AI maintain context of previous results for Tool 2 analysis within a session?

### Future Considerations

7. **Multi-design Comparison**: Should Tool 2 be designed to handle comparison questions between multiple optimization results?

8. **Export Integration**: How should AI-generated results integrate with future export/reporting features? 