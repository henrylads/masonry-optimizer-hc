# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Next.js 15** application that optimizes masonry support systems for high-rise buildings. The system uses a brute-force algorithm (originally designed for genetic algorithms) to determine optimal dimensions for steel support systems that attach masonry facades to building structures, minimizing steel weight while maintaining safety requirements.

## Key Technologies

- **Frontend**: Next.js 15.2.4 (App Router), TypeScript 5, React 18
- **Styling**: Tailwind CSS, Shadcn/UI components
- **AI Integration**: Vercel AI SDK with OpenAI for parameter extraction and optimization
- **3D Visualization**: ShapeDiver viewer for real-time 3D model updates
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for data visualization

## Development Commands

```bash
# Install dependencies
npm install

# Development server (http://localhost:3000)
npm run dev

# Production build
npm run build

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint

# Start production server
npm start
```

## Project Architecture

### Core Calculation Engine (`/src/calculations/`)
The heart of the application - implements structural engineering calculations:
- **bruteForceAlgorithm/**: Main optimization algorithm that iterates through possible configurations
- **verificationChecks/**: Safety validations including shear, tension, moment, and deflection checks
- **Loading calculations**: Dead load, live load, wind load calculations
- **Geometry calculations**: Bracket and angle geometry validations

### API Architecture (`/src/app/api/`)
- **`/api/optimize`**: Runs the brute-force optimization algorithm
  - Accepts form parameters
  - Returns optimized results with all verification checks
  - Includes progress tracking
- **`/api/chat`**: AI chat interface for parameter extraction
  - Uses custom tools for extracting parameters from natural language
  - Integrates with OpenAI via Vercel AI SDK

### Component Structure (`/src/components/`)
- **`masonry-designer-form.tsx`**: Main form component with manual/AI workflow modes
- **`chat-interface.tsx`**: AI chat component for parameter gathering
- **`shapediver.tsx`**: 3D visualization component with dynamic parameter updates
- **`results-display.tsx`**: Comprehensive results presentation with charts
- **`design-comparison.tsx`**: Side-by-side comparison of optimization results

### Type System (`/src/types/`)
Strong TypeScript typing throughout:
- `MasonrySupportSystem`: Core system parameters
- `VerificationResults`: All safety check results
- `OptimizationResult`: Combined optimization output
- Domain-specific types for loads, materials, and geometry

## Critical Development Rules

### 1. Precision Requirements (from .cursor/rules/calculation-rules.mdc)
- **No rounding in intermediate calculations** - maintain full decimal precision
- Critical variables (like quadratic equation constants) need 12+ decimal places
- Display results to at least 5 decimal places for engineering values
- Log all intermediate calculations for verification

### 2. Project Structure (from .cursor/rules/project-structure-rules.mdc)
- **All source code MUST be in `/src/`** - no exceptions
- Types go in `/src/types/` with domain-specific files
- Calculations organized by function in `/src/calculations/`
- No nested `src` directories

### 3. Testing Requirements (from .cursor/rules/testing-rules.mdc)
- Tests use 5 decimal place precision (even if calculations use more)
- **Never modify source code to make tests pass** - tests serve the code
- Test files follow pattern: `*.test.ts(x)` or `*.spec.ts(x)`
- Use Jest with @testing-library for React components

## AI Integration Features

### Chat Tools (`/src/utils/ai-tools/`)
1. **`extract_parameters`**: Extracts engineering parameters from natural language
2. **`run_optimization`**: Triggers the optimization algorithm
3. **`analyze_results`**: Provides insights on optimization results
4. **`compare_designs`**: Compares multiple optimization results

### Workflow Modes
- **Manual Mode**: Traditional form input with validation
- **AI Mode**: Conversational parameter gathering with automatic extraction

## ShapeDiver Integration

The 3D visualization uses ShapeDiver's parametric modeling:
- Model ID and parameters configured in component
- Real-time updates as form values change
- Synchronized with optimization results
- Handles both manual and AI-driven parameter updates

## Engineering Domain Context

This application deals with masonry support systems consisting of:
1. **Cast-in channels**: Embedded in concrete slabs
2. **Brackets**: Attach to channels, support angles
3. **Angles**: Support the masonry facade

Key engineering considerations:
- Dead loads, live loads, and wind loads
- Shear and tension forces
- Moment capacity and deflection limits
- Safety factors per Eurocode standards

## Common Development Tasks

### Adding New Verification Checks
1. Add calculation module in `/src/calculations/verificationChecks/`
2. Update `VerificationResults` type in `/src/types/`
3. Integrate into main verification flow
4. Add corresponding tests

### Modifying the Optimization Algorithm
1. Core logic in `/src/calculations/bruteForceAlgorithm/`
2. Maintain separation between iteration logic and fitness scoring
3. Ensure all verification checks are called
4. Update progress tracking if needed

### Working with AI Features
1. Tools defined in `/src/utils/ai-tools/`
2. Chat interface in `/src/app/api/chat/route.ts`
3. Parameter extraction uses Zod schemas for validation
4. Results analysis provides engineering insights

## Performance Considerations

- Optimization can process thousands of configurations
- Use web workers for heavy calculations if needed
- ShapeDiver updates should be debounced
- Chart rendering optimized with Recharts

## Error Handling

- Form validation with descriptive error messages
- API routes return structured error responses
- Verification failures clearly indicate which checks failed
- AI tools handle extraction failures gracefully

## Test Organization Guidelines

- If running tests for engineering scenarios store them in the `/test-scenarios` directory with a unique name starting with the date time ie 20250704103426-name-of-test.ts so that it is easy to see the most recent ones




## Shapdiver Viwer API info:

https://github.com/shapediver/ViewerExamples/tree/development/examples