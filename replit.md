# Overview

SwissGain is a comprehensive e-commerce platform for premium Swiss jewelry featuring multiple product categories including necklaces, earrings, rings, bracelets, jewelry sets, and chains. The application provides a modern, luxury shopping experience with an advanced product catalog, affiliate program, and referral system. Built with React and TypeScript, it uses localStorage for data persistence and includes sophisticated UI components inspired by professional jewelry e-commerce websites.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **Routing**: Wouter for client-side routing with pages for Home, Product, Affiliate, Refer & Earn, Cart, and Dashboard
- **UI Components**: Radix UI primitives with shadcn/ui component system for consistent design
- **Styling**: Tailwind CSS with custom CSS variables for theming and responsive design
- **State Management**: TanStack Query for server state management and custom hooks for local storage state
- **Data Persistence**: Browser localStorage for cart, earnings, and membership data

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Development**: TypeScript with hot reload using tsx
- **Build System**: esbuild for production bundling
- **Storage**: In-memory storage with interface for future database integration
- **API Design**: RESTful endpoints with /api prefix (currently stubbed for expansion)

## Data Storage Solutions
- **Database ORM**: Drizzle ORM configured for PostgreSQL with Neon Database integration
- **Schema**: User table with username/password fields using UUID primary keys
- **Migrations**: Drizzle Kit for database schema management
- **Local Storage**: Client-side persistence for cart items, earnings tracking, and membership status

## Authentication and Authorization
- **Session Management**: Express sessions with PostgreSQL session store (connect-pg-simple)
- **User Schema**: Zod validation for type-safe user input validation
- **Security**: Prepared for credential-based authentication with password hashing

## Frontend Design System
- **Component Library**: Comprehensive UI component set including forms, modals, navigation, and data display
- **Theming**: CSS custom properties with light/dark mode support
- **Typography**: Inter font family with multiple weight variants
- **Icons**: Lucide React icon library for consistent iconography
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints

## Application Features
- **E-commerce**: Product browsing, cart management, and checkout simulation
- **Affiliate Program**: Membership system with commission tracking (₹100 per sale, ₹299.9 per referral)
- **Referral System**: Link generation and sharing functionality
- **Dashboard**: Earnings tracking, ROI calculation, and performance metrics
- **Notifications**: Toast system for user feedback and action confirmations

## Development Workflow
- **Hot Reload**: Vite development server with Express middleware integration
- **Type Safety**: Full TypeScript coverage across frontend, backend, and shared schemas
- **Code Organization**: Modular component structure with shared utilities and hooks
- **Error Handling**: Centralized error boundaries and API error management

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL database hosting
- **Connection**: @neondatabase/serverless for database connectivity

## UI and Styling
- **Radix UI**: Headless UI component primitives for accessibility and behavior
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Lucide React**: SVG icon library for UI elements
- **Embla Carousel**: Carousel/slider functionality for product displays

## Development Tools
- **Vite**: Frontend build tool and development server
- **TypeScript**: Type safety across the entire application
- **Drizzle ORM**: Type-safe database ORM with PostgreSQL support
- **React Hook Form**: Form state management with validation
- **TanStack Query**: Server state management and caching

## Runtime Libraries
- **React**: Frontend framework with hooks and context
- **Express**: Backend web application framework
- **Wouter**: Lightweight client-side routing
- **Zod**: Runtime type validation and schema parsing
- **Date-fns**: Date manipulation and formatting utilities