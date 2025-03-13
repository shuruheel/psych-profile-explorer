# Psychological Profiles Codebase Guide

## Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript checks

## Code Style
- TypeScript for all new code with explicit type annotations
- React functional components with hooks
- Import order: React/hooks → UI components → utilities/types
- Naming: PascalCase for components, camelCase for functions/variables
- Error handling: try/catch with fallback UI states for async operations
- CSS: TailwindCSS with Shadcn/UI component library

## Project Structure
- `app/`: Next.js App Router pages and API routes
- `components/`: Reusable React components
- `lib/`: Utilities and custom hooks
- `types/`: TypeScript interfaces and types

## Key Features
- Psychological profiles via `/api/profiles`
- Voice integration with ElevenLabs via `/api/text-to-speech` and `/api/voice-design`
- Conversation API for AI interactions via `/api/conversation`