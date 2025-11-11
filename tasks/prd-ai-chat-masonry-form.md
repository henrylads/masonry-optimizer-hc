# Product Requirements Document: AI Chat Integration for Masonry Designer Form

## Introduction/Overview

This feature introduces an AI-powered chat interface as an alternative input method for the existing Masonry Support Designer form. The chat interface will provide a more intuitive and guided way for users to enter design parameters, particularly benefiting junior or less technical structural engineers who may need additional guidance understanding form parameters.

The feature will use Vercel's AI SDK integrated with OpenAI's API to create a conversational experience that can extract all required parameters and populate the existing form in real-time.

## Goals

1. **Improve User Experience**: Provide an intuitive alternative to traditional form filling that reduces cognitive load
2. **Support Junior Engineers**: Offer guidance and coaching for less experienced users who may not understand all technical parameters
3. **Maintain Efficiency**: Enable experienced users to input all information quickly in one go while supporting step-by-step guidance when needed
4. **Seamless Integration**: Work with existing form validation, submission logic, and optimization algorithms without disruption

## User Stories

### Primary User Stories
- **As a junior structural engineer**, I want to describe my project in natural language so that I can get help understanding what parameters I need without studying technical documentation
- **As an experienced engineer**, I want to quickly input all my project details in one message so that I can get results faster than filling out a traditional form
- **As any user**, I want to see my inputs being captured in real-time so that I can verify the AI understood my requirements correctly
- **As a user**, I want to switch between chat and manual form modes so that I can use whichever method feels more comfortable for different parameters

### Secondary User Stories
- **As a user with incomplete information**, I want the AI to guide me step-by-step through missing parameters so that I can complete the form even when I don't have all details upfront
- **As a user**, I want to review and confirm all captured parameters before optimization so that I can catch any misunderstandings

## Functional Requirements

### Core Chat Functionality
1. **Chat Interface Component**: The system must provide a dedicated chat component using Vercel's AI SDK and useChat hook
2. **Natural Language Processing**: The system must extract all required form parameters from conversational input
3. **Real-time Form Population**: The system must populate form fields in real-time as parameters are identified from the conversation
4. **Session Context**: The system must maintain conversation context throughout the user session

### Parameter Extraction
5. **Required Parameters**: The system must capture all required parameters:
   - Slab thickness (150-500mm)
   - Cavity width (50-400mm in 0.5mm increments)
   - Support level (-600 to 500mm)
   - Characteristic load OR masonry properties (density, thickness, height)

6. **Conditional Parameters**: The system must handle conditional requirements:
   - Notch parameters (height and depth) only when notch is required
   - Fixed angle length only when length limitation is enabled
   - Masonry properties only when characteristic load is unknown

7. **Parameter Validation**: The system must validate extracted parameters against the same constraints as the manual form

### User Interface Integration
8. **Mode Toggle**: The system must provide a toggle between chat mode and manual form mode
9. **Side-by-Side Layout**: The system must display chat interface alongside form fields so users can see real-time updates
10. **Summary Confirmation**: The system must present a summary of all captured parameters for user confirmation before submission
11. **Form Synchronization**: The system must keep chat-extracted values synchronized with form state

### Conversation Flow Management
12. **Bulk Input Handling**: The system must attempt to extract all available parameters when users provide comprehensive input
13. **Step-by-Step Guidance**: The system must fall back to guided questioning when users don't provide complete information
14. **Contextual Help**: The system must provide explanations and coaching for technical parameters when requested
15. **Error Recovery**: The system must handle and recover from misunderstood or invalid inputs gracefully

### Integration with Existing System
16. **Form Validation**: The system must work with existing Zod schema validation
17. **Optimization Integration**: The system must pass validated parameters to the existing brute force optimization algorithm
18. **State Management**: The system must integrate with existing form state management and React Hook Form

## Non-Goals (Out of Scope)

- Speech-to-text functionality (future enhancement)
- Complete replacement of the manual form interface
- Multi-language support beyond English
- Integration with external CAD or design software
- Historical conversation storage beyond the current session
- Custom AI model training or fine-tuning

## Design Considerations

### Layout
- **Side-by-side layout**: Chat interface on the left (or right), form fields on the right (or left)
- **Responsive design**: Stack vertically on mobile devices
- **Toggle prominently displayed**: Clear switching mechanism between modes
- **Visual feedback**: Highlight form fields as they're populated by chat

### Chat Interface
- **Clean, modern chat UI**: Following existing design system and Clariti brand guidelines
- **Message bubbles**: Clear distinction between user and AI messages
- **Typing indicators**: Show when AI is processing
- **Scrollable history**: Maintain conversation context visually

### Form Integration
- **Real-time updates**: Smooth animations when fields are populated
- **Validation feedback**: Show validation errors in both chat and form
- **Summary modal/panel**: Clear presentation of all captured parameters before submission

## Technical Considerations

### Architecture
- **Separate Chat Component**: Isolated component using Vercel AI SDK's useChat hook
- **State Synchronization**: Mechanism to sync chat-extracted data with existing form state
- **Parameter Mapping**: Logic to map natural language inputs to structured form data
- **Validation Integration**: Reuse existing Zod schema for parameter validation

### Dependencies
- **Vercel AI SDK**: For chat functionality and OpenAI integration
- **OpenAI API**: For natural language processing and parameter extraction
- **Existing form infrastructure**: React Hook Form, Zod validation, Tailwind CSS, Shadcn components

### Performance
- **Response Time**: Target sub-2 second response times for parameter extraction
- **Fallback Handling**: Graceful degradation when AI service is unavailable
- **Error Boundaries**: Prevent chat issues from breaking the main application

### Data Handling
- **Parameter Extraction Accuracy**: Implement validation to ensure extracted parameters match expected formats
- **Ambiguity Resolution**: Handle cases where user input is unclear or ambiguous
- **Context Persistence**: Maintain conversation context only for the current session

## Success Metrics

### Usage Metrics
1. **Chat Adoption Rate**: Percentage of users who use chat mode vs. manual form mode
2. **Completion Rate**: Percentage of chat sessions that result in successful optimization runs
3. **Mode Switching**: Frequency of users switching between chat and manual modes

### User Experience Metrics
4. **User Satisfaction**: Post-interaction surveys measuring ease of use and preference
5. **Parameter Accuracy**: Percentage of chat-extracted parameters that require user correction
6. **Time to Completion**: Average time from start to optimization submission (chat vs. manual)

### Technical Metrics
7. **Response Time**: Average AI response time for parameter extraction
8. **Error Rate**: Percentage of chat sessions that encounter technical errors
9. **Validation Errors**: Frequency of validation errors in chat-extracted parameters

## Open Questions

1. **System Prompt Optimization**: What specific prompts and examples should be included to maximize parameter extraction accuracy?
2. **Error Handling UX**: How should the interface handle cases where the AI service is temporarily unavailable?
3. **Parameter Ambiguity**: What's the best UX for resolving ambiguous inputs (e.g., "thick slab" - how thick exactly)?
4. **Mobile Experience**: Should the chat interface be the primary mode on mobile devices due to easier text input?
5. **Conversation Limits**: Should there be limits on conversation length to prevent overly long interactions?
6. **Integration Testing**: What's the testing strategy for ensuring chat-extracted parameters work correctly with the optimization algorithm? 