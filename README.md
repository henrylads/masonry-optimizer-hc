# Masonry Support System Optimizer

A Next.js application that uses genetic algorithms to optimize masonry support systems for high-rise buildings.

## Overview

This application helps structural engineers determine optimal dimensions for masonry support systems by:
- Using genetic algorithms to find the most efficient design
- Performing comprehensive structural verification checks
- Minimizing steel weight while maintaining safety requirements
- Providing detailed calculations and results

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Shadcn/UI
- **Backend**: Next.js API Routes
- **Optimization**: Custom genetic algorithm implementation
- **Testing**: (TBD)

## Project Structure

```
masonry-optimizer/
├── app/                    # Next.js App Router components
├── src/
│   ├── types.ts           # TypeScript definitions
│   ├── geneticAlgorithm.ts # Optimization logic
│   ├── calculations.ts    # Engineering calculations
│   └── verificationChecks.ts # Structural verifications
├── docs/                  # Documentation
└── public/               # Static assets
```

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/itscharliecowan/masonry-optimizer.git
   ```

2. Install dependencies:
   ```bash
   cd masonry-optimizer
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Development Plan

See [Implementation Plan](docs/implementationPlan.md) for detailed development phases and timeline.

## Features

- Input form for system parameters
- Genetic algorithm optimization
- Comprehensive verification checks
- Detailed results display
- Export functionality

## License

TBD

## Contributing

This project is currently in development. Contribution guidelines will be added soon.
