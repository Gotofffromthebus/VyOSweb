# VyOS Intent-Based Network Controller

## Overview

An AI-powered intent-based network controller for VyOS router configuration. The application allows network engineers to describe network configurations in natural language and automatically generates valid VyOS commands. Features include visual network topology mapping, configuration templates, real-time validation, and configuration history tracking.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework Stack:**
- React 18+ with TypeScript
- Vite for build tooling and development server
- Wouter for client-side routing
- TanStack Query (React Query) for server state management

**UI Component System:**
- Radix UI primitives for accessible component foundation
- shadcn/ui components built on Radix (New York style variant)
- Tailwind CSS for styling with custom design tokens
- Carbon Design System aesthetic with Material Design interactive elements
- Dark mode primary with light mode support via theme provider

**Design Philosophy:**
- Enterprise technical interface optimized for data-heavy network operations displays
- Professional reliability through consistent patterns
- Dark mode optimized for extended use sessions
- Efficient information density without visual clutter

**Key UI Components:**
- AI Copilot panel for natural language intent input (GPT-5 powered)
- Interactive topology canvas for visual network mapping
- Configuration editor with syntax highlighting and validation
- Template library for pre-built network scenarios
- Command autocomplete with intelligent suggestions
- Intent history viewer for configuration replay

### Backend Architecture

**Runtime & Server:**
- Node.js with Express.js REST API
- TypeScript for type safety across frontend and backend
- Development: tsx for hot reloading
- Production: esbuild for optimized bundling

**API Design Pattern:**
- RESTful endpoints organized by feature domain
- Centralized route registration in `server/routes.ts`
- JSON request/response format
- Structured error handling middleware

**Key API Endpoints:**
- `/api/ai/generate` - AI configuration generation from natural language
- `/api/validate` - VyOS configuration validation
- `/api/commands/suggest` - Command autocomplete suggestions
- `/api/templates` - Configuration template CRUD
- `/api/topology/nodes` - Network topology node management
- `/api/topology/connections` - Network topology connection management
- `/api/history` - Intent history tracking

**Storage Layer:**
- In-memory storage implementation (`MemStorage` class)
- Abstracted storage interface (`IStorage`) for future database migration
- Type-safe data models using Drizzle ORM schemas
- Schema validation with Zod

**Data Models:**
- Configurations: VyOS command sets with metadata
- Templates: Pre-built configuration patterns by category
- Topology Nodes: Visual network device representations
- Topology Connections: Network links between devices
- Intent History: AI generation audit trail

### AI Integration

**OpenAI Integration:**
- GPT-5 model for configuration generation (current production model)
- System prompt engineering for VyOS 1.4+ syntax compliance
- Structured JSON responses for configuration and explanations
- Validation and suggestion capabilities

**AI Features:**
- Intent-to-configuration translation
- Syntax validation and error detection
- Command autocomplete suggestions
- Production-ready configuration generation following VyOS best practices

### External Dependencies

**AI Services:**
- OpenAI API (GPT-5) - Natural language to VyOS configuration translation

**Database Infrastructure:**
- Drizzle ORM configured for PostgreSQL (via @neondatabase/serverless)
- Schema definition in `shared/schema.ts`
- Migration support via drizzle-kit
- Currently using in-memory storage with database-ready schemas

**UI Component Libraries:**
- @radix-ui/* - Accessible component primitives (20+ components)
- cmdk - Command palette component
- embla-carousel-react - Carousel functionality
- react-day-picker - Date selection
- vaul - Drawer component
- recharts - Data visualization

**Development Tools:**
- Replit-specific: vite plugins for runtime error handling, dev banner, and cartographer
- TypeScript strict mode for type safety
- Path aliases configured for clean imports (@/, @shared/, @assets/)

**State Management & Data Fetching:**
- TanStack Query for server state, caching, and optimistic updates
- React Hook Form with Zod resolvers for form validation
- Custom query client with error handling and credential management

**Utilities:**
- date-fns - Date formatting and manipulation
- clsx & tailwind-merge - Conditional className utilities
- nanoid - Unique ID generation
- class-variance-authority - Component variant styling

**Session Management:**
- express-session configured
- connect-pg-simple for PostgreSQL session store (when database is connected)