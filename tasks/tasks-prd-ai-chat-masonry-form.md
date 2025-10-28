## Relevant Files

- `src/components/chat-interface.tsx` - Main chat component using Vercel AI SDK with useChat hook
- `src/components/chat-interface.test.tsx` - Unit tests for chat interface component
- `src/components/masonry-designer-form.tsx` - Existing form component that needs modification for chat integration
- `src/components/parameter-summary.tsx` - New component for displaying extracted parameters summary
- `src/components/parameter-summary.test.tsx` - Unit tests for parameter summary component
- `src/hooks/use-chat-form-sync.ts` - Custom hook for synchronizing chat data with form state
- `src/hooks/use-chat-form-sync.test.ts` - Unit tests for chat form synchronization hook
- `src/utils/parameter-extraction.ts` - Utility functions for extracting and validating parameters from chat
- `src/utils/parameter-extraction.test.ts` - Unit tests for parameter extraction utilities
- `src/app/api/chat/route.ts` - API route handler for chat interactions with OpenAI
- `src/app/api/chat/route.test.ts` - Unit tests for chat API route
- `src/types/chat-types.ts` - TypeScript types for chat functionality
- `package.json` - Updated with Vercel AI SDK dependency

### Notes

- Unit tests should typically be placed alongside the code files they are testing
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration
- The chat integration will modify the existing `masonry-designer-form.tsx` component to add toggle functionality and side-by-side layout

## Tasks

- [x] 1.0 Set up AI SDK Infrastructure and Core Chat Component
  - [x] 1.1 Install Vercel AI SDK dependency (`npm install ai @ai-sdk/openai`)
  - [x] 1.2 Create OpenAI API route handler at `src/app/api/chat/route.ts`
  - [x] 1.3 Set up environment variables for OpenAI API key
  - [x] 1.4 Define chat-related TypeScript types in `src/types/chat-types.ts`
  - [x] 1.5 Create basic chat interface component using useChat hook
  - [x] 1.6 Implement message rendering with user/AI message bubbles
  - [x] 1.7 Add typing indicator and loading states
  - [x] 1.8 Write unit tests for chat interface component
  - [x] 1.9 Write unit tests for API route handler

- [ ] 2.0 Implement Parameter Extraction and Validation Logic
  - [x] 2.1 Create system prompt for parameter extraction in API route
  - [x] 2.2 Implement parameter extraction utility functions
  - [ ] 2.3 Add validation logic using existing Zod schema
  - [ ] 2.4 Handle conditional parameter extraction (notch, angle length, masonry properties)
  - [ ] 2.5 Implement bulk input processing for comprehensive user messages
  - [ ] 2.6 Add step-by-step guidance flow for incomplete information
  - [ ] 2.7 Create error recovery mechanisms for invalid/ambiguous inputs
  - [ ] 2.8 Add contextual help and coaching responses
  - [ ] 2.9 Write unit tests for parameter extraction utilities
  - [ ] 2.10 Write unit tests for validation logic

- [ ] 3.0 Create UI Integration and Layout Components
  - [ ] 3.1 Modify `masonry-designer-form.tsx` to support side-by-side layout
  - [ ] 3.2 Add chat/manual mode toggle switch with clear visual distinction
  - [ ] 3.3 Implement responsive design (side-by-side on desktop, stacked on mobile)
  - [ ] 3.4 Add visual feedback for form fields being populated from chat
  - [ ] 3.5 Style chat interface following Clariti brand guidelines
  - [ ] 3.6 Add smooth animations for form field updates
  - [ ] 3.7 Implement error display for both chat and form validation
  - [ ] 3.8 Add loading states and progress indicators
  - [ ] 3.9 Write unit tests for UI integration components

- [ ] 4.0 Implement Form Synchronization and State Management
  - [ ] 4.1 Create custom hook `use-chat-form-sync.ts` for state synchronization
  - [ ] 4.2 Integrate chat data extraction with React Hook Form state
  - [ ] 4.3 Implement real-time form field population from chat messages
  - [ ] 4.4 Add bidirectional sync (manual form changes should not conflict with chat)
  - [ ] 4.5 Handle form validation errors in chat context
  - [ ] 4.6 Implement session context persistence for conversation history
  - [ ] 4.7 Add state cleanup when switching between modes
  - [ ] 4.8 Write unit tests for synchronization hook
  - [ ] 4.9 Write integration tests for form-chat state management

- [ ] 5.0 Add Confirmation Flow and User Experience Enhancements
  - [ ] 5.1 Create parameter summary component for extracted values
  - [ ] 5.2 Implement confirmation modal/panel before optimization submission
  - [ ] 5.3 Add ability to edit/correct extracted parameters in summary
  - [ ] 5.4 Implement fallback UI when AI service is unavailable
  - [ ] 5.5 Add conversation reset/clear functionality
  - [ ] 5.6 Implement proper error boundaries for chat components
  - [ ] 5.7 Add accessibility features (keyboard navigation, screen reader support)
  - [ ] 5.8 Optimize performance for chat message rendering
  - [ ] 5.9 Write unit tests for confirmation flow components
  - [ ] 5.10 Write end-to-end tests for complete chat-to-optimization flow 