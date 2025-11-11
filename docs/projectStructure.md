# Project Structure Guidelines

## Directory Structure

```
masonry-optimizer/              # Project root
├── src/                       # Source code
│   ├── app/                   # Next.js App Router components
│   │   ├── page.tsx          # Home page
│   │   ├── layout.tsx        # Root layout
│   │   ├── results/          # Results page
│   │   └── api/              # API routes
│   ├── types/                # TypeScript type definitions
│   │   ├── index.ts         # Central type exports
│   │   ├── userInputs.ts    # User input types
│   │   └── ...              # Other type modules
│   ├── data/                 # Data management
│   │   └── channelSpecs.ts  # Channel specifications
│   ├── calculations/         # Core calculation modules
│   │   ├── index.ts         # Central calculation exports
│   │   ├── loading.ts       # Loading calculations
│   │   └── ...              # Other calculation modules
│   ├── components/          # Reusable React components
│   │   ├── ui/             # Shadcn UI components
│   │   └── forms/          # Form components
│   └── utils/              # Utility functions
│       ├── validation.ts   # Input validation
│       └── conversion.ts   # Unit conversion
├── docs/                   # Documentation
│   ├── projectOverview.md  # Project requirements and specs
│   ├── implementationPlan.md # Development phases
│   └── typeSystem.md      # Type system documentation
├── public/                # Static assets
├── tests/                 # Test files
│   ├── unit/             # Unit tests
│   └── integration/      # Integration tests
└── package.json          # Project dependencies
```

## Key Principles

1. **Source Code Organization**
   - All source code must reside in the `src` directory
   - Each major feature should have its own directory
   - Keep related files together in feature directories
   - Use clear, descriptive file names

2. **Type System**
   - All TypeScript types must be in `src/types`
   - Each domain should have its own type file
   - Export all types through `types/index.ts`
   - Document types with JSDoc comments

3. **Components**
   - Use Shadcn UI components when available
   - Custom components go in `src/components`
   - Organize by feature or type (ui, forms, etc.)
   - Keep components small and focused

4. **Documentation**
   - All documentation goes in `docs` directory
   - Use markdown format
   - Keep documentation up to date
   - Include code examples where relevant

5. **API Routes**
   - Place in `src/app/api`
   - One route per file
   - Use clear HTTP methods
   - Include error handling

6. **Data Management**
   - Store data structures in `src/data`
   - Use TypeScript for type safety
   - Include validation
   - Document data formats

7. **Calculations**
   - Place in `src/calculations`
   - Organize by domain
   - Include unit tests
   - Document formulas and assumptions

8. **Testing**
   - Tests mirror source structure
   - Unit tests alongside source files
   - Integration tests in `tests/integration`
   - Include test documentation

## File Naming Conventions

1. **TypeScript/React Files**
   - Use `.tsx` for files with JSX
   - Use `.ts` for pure TypeScript
   - Use PascalCase for components
   - Use camelCase for utilities

2. **Documentation**
   - Use `.md` extension
   - Use kebab-case for filenames
   - Include category prefix when relevant

3. **Test Files**
   - Suffix with `.test.ts` or `.test.tsx`
   - Mirror source file names
   - Include test category in filename

## Import Guidelines

1. **Import Order**
   ```typescript
   // External dependencies
   import { useState } from 'react'
   import { Button } from '@/components/ui/button'

   // Internal types
   import type { UserInputs } from '@/types'

   // Internal components
   import { InputForm } from '@/components/forms'

   // Internal utilities
   import { validateInput } from '@/utils/validation'
   ```

2. **Path Aliases**
   - Use `@/` for imports from src directory
   - Use relative imports for closely related files
   - Avoid deep relative paths (../../)

## Best Practices

1. **Code Organization**
   - Keep files focused and small
   - Group related functionality
   - Use index files for cleaner imports
   - Maintain consistent structure

2. **Documentation**
   - Document all public APIs
   - Include usage examples
   - Keep documentation close to code
   - Update docs with code changes

3. **Testing**
   - Write tests during development
   - Cover edge cases
   - Include integration tests
   - Document test scenarios

4. **Version Control**
   - Use meaningful commit messages
   - Keep commits focused
   - Follow branch naming conventions
   - Review changes before commit

## Adding New Features

1. **Planning**
   - Review existing structure
   - Identify appropriate location
   - Consider dependencies
   - Plan test coverage

2. **Implementation**
   - Follow existing patterns
   - Maintain type safety
   - Add necessary documentation
   - Include tests

3. **Review**
   - Verify file location
   - Check import structure
   - Ensure documentation
   - Validate test coverage

## Common Mistakes to Avoid

1. **Structure Violations**
   - Don't create new top-level directories without discussion
   - Don't mix concerns in single files
   - Don't duplicate code across directories
   - Don't bypass type system

2. **File Organization**
   - Don't place files in wrong directories
   - Don't create deeply nested structures
   - Don't use unclear file names
   - Don't mix unrelated code

3. **Documentation**
   - Don't leave code undocumented
   - Don't let docs get outdated
   - Don't skip type documentation
   - Don't ignore test documentation 