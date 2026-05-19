# Claims Management UI

A modern, enterprise-grade web application for healthcare claims processing and management.

## Technology Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript 5+
- **Styling**: Tailwind CSS 3+ with custom theme configuration
- **UI Components**: shadcn/ui (built on Radix UI)
- **State Management**: Zustand 4+
- **Server State**: TanStack Query (React Query) 5+
- **Validation**: Zod 3+
- **File Processing**: SheetJS (xlsx) 0.20+
- **Date Utilities**: date-fns 3+
- **Icons**: Lucide React
- **Code Quality**: ESLint, Prettier

## Project Structure

```
├── app/                    # Next.js App Router pages and layouts
├── components/             # React components
│   └── ui/                # shadcn/ui components
├── hooks/                  # Custom React hooks
├── lib/                    # Utility functions and configurations
├── stores/                 # Zustand state stores
├── types/                  # TypeScript type definitions
├── utils/                  # Helper utilities
└── public/                 # Static assets
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Format code
npm run format
```

### Development

The development server runs on [http://localhost:3000](http://localhost:3000).

## Features

- **Dashboard**: Summary metrics and key performance indicators
- **Data Source Management**: Configure multiple data source connections
- **File Intake**: Upload and parse XLS files with claims data
- **Pend Processing**: Filter and process claims by platform and classification
- **Theme Support**: Light and dark theme with user preference persistence
- **Type Safety**: Full TypeScript coverage for compile-time error detection
- **Performance**: Optimized for handling 1000+ claims with virtual scrolling

## Path Aliases

The project uses `@/` as an alias for the root directory:

```typescript
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Claim } from '@/types'
```

## Code Quality

- **ESLint**: Configured with Next.js and TypeScript rules
- **Prettier**: Automatic code formatting with Tailwind CSS plugin
- **TypeScript**: Strict mode enabled for maximum type safety

## License

Private - All rights reserved
