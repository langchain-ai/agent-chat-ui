# Agent Chat UI - Codebase Overview

## Project Overview

**Agent Chat UI** is a Next.js-based web application that provides a modern chat interface for interacting with LangGraph servers. It enables users to chat with AI agents through a clean, responsive UI that supports real-time streaming, file uploads, artifacts rendering, and comprehensive message handling.

### Main Purpose
- Provide a universal chat interface for any LangGraph server with a `messages` key
- Support both local development and production deployments
- Enable real-time streaming conversations with AI agents
- Handle multimodal inputs (text, images, PDFs)
- Render artifacts and custom UI components

### Target Users
- Developers building LangGraph applications
- Teams deploying AI agents in production
- Users wanting to interact with LangGraph servers through a web interface

## Architecture

The application follows a modern React architecture with Next.js App Router, utilizing a provider pattern for state management and context sharing.

### High-Level System Design
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js App   │────│  API Passthrough │────│ LangGraph Server│
│   (Frontend)    │    │   (Middleware)   │    │   (Backend)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Main Components
1. **Stream Provider**: Manages real-time communication with LangGraph servers
2. **Thread Provider**: Handles thread/conversation management
3. **Thread Component**: Main chat interface with message rendering
4. **Artifact System**: Renders custom UI components and artifacts
5. **API Passthrough**: Proxy layer for production deployments

## Technology Stack

### Core Technologies
- **Next.js 15.2.3**: React framework with App Router
- **React 19**: UI library with latest features
- **TypeScript**: Type-safe development
- **Tailwind CSS 4.0**: Utility-first styling

### Key Libraries
- **@langchain/langgraph-sdk**: LangGraph integration and streaming
- **@radix-ui**: Accessible UI components
- **framer-motion**: Animations and transitions
- **react-markdown**: Markdown rendering with syntax highlighting
- **nuqs**: URL state management
- **sonner**: Toast notifications
- **uuid**: Unique identifier generation
- **zod**: Schema validation

### Development Tools
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **pnpm**: Package management
- **TypeScript**: Static type checking

## Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (passthrough)
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page component
├── components/            # React components
│   ├── thread/           # Chat interface components
│   │   ├── messages/     # Message type components
│   │   ├── agent-inbox/  # Agent inbox functionality
│   │   └── artifact.tsx  # Artifact rendering
│   ├── ui/               # Reusable UI components
│   └── icons/            # SVG icon components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions
├── providers/            # React context providers
└── globals.css           # Global styles
```

## Key Components

### Stream Provider (`src/providers/Stream.tsx`)
- **Purpose**: Manages WebSocket connections to LangGraph servers
- **Responsibilities**: 
  - Handle authentication and configuration
  - Manage real-time message streaming
  - Provide setup form for server connection
  - Error handling and connection status

### Thread Provider (`src/providers/Thread.tsx`)
- **Purpose**: Manages conversation threads
- **Responsibilities**:
  - Fetch and manage thread lists
  - Handle thread creation and switching
  - Provide thread metadata and search

### Thread Component (`src/components/thread/index.tsx`)
- **Purpose**: Main chat interface
- **Responsibilities**:
  - Render message history
  - Handle user input and file uploads
  - Manage UI state (sidebar, settings)
  - Coordinate message rendering

### Message Components (`src/components/thread/messages/`)
- **AI Messages**: Render assistant responses with tool calls
- **Human Messages**: Display user inputs with multimodal content
- **Tool Calls**: Handle function calls and responses
- **Interrupts**: Manage agent interruptions and user interactions

### Artifact System (`src/components/thread/artifact.tsx`)
- **Purpose**: Render custom UI components and artifacts
- **Features**: Side panel rendering, context management, dynamic loading

## Data Flow

### Message Flow
1. **User Input** → Thread Component → Stream Provider → LangGraph Server
2. **Server Response** → Stream Provider → Message Components → UI Rendering
3. **Real-time Updates** → WebSocket → Stream Context → Component Re-renders

### Authentication Flow
1. **Setup Form** → User credentials → Local storage/URL params
2. **API Requests** → Headers with API key → LangGraph server
3. **Production** → API Passthrough → Server-side authentication

### File Upload Flow
1. **File Selection** → useFileUpload hook → Base64 conversion
2. **Content Blocks** → Message payload → LangGraph processing
3. **Multimodal Response** → Rendered in message components

## Configuration

### Environment Variables
```bash
# Development (local LangGraph server)
NEXT_PUBLIC_API_URL=http://localhost:2024
NEXT_PUBLIC_ASSISTANT_ID=agent

# Production (API Passthrough)
LANGGRAPH_API_URL=https://your-deployment.langgraph.app
NEXT_PUBLIC_API_URL=https://your-site.com/api
LANGSMITH_API_KEY=lsv2_...
```

### Setup Requirements
1. **Node.js**: Version 18+ required
2. **Package Manager**: pnpm recommended
3. **LangGraph Server**: Running server with `messages` key support
4. **API Key**: LangSmith API key for production deployments

## Entry Points

### Application Startup
1. **Root Layout** (`app/layout.tsx`): Sets up HTML structure and fonts
2. **Main Page** (`app/page.tsx`): Initializes providers and main component
3. **Provider Chain**: ThreadProvider → StreamProvider → ArtifactProvider → Thread

### Initialization Process
1. **Environment Check**: Validate configuration variables
2. **Setup Form**: Display if configuration missing
3. **Connection**: Establish WebSocket to LangGraph server
4. **Thread Loading**: Fetch existing conversations
5. **UI Ready**: Enable user interaction

## Dependencies

### Core Dependencies
- **@langchain/langgraph-sdk**: LangGraph integration and streaming capabilities
- **langgraph-nextjs-api-passthrough**: Production API proxy functionality
- **next-themes**: Dark/light mode support
- **use-stick-to-bottom**: Auto-scroll chat behavior

### UI Dependencies
- **@radix-ui/***: Accessible component primitives
- **lucide-react**: Icon library
- **react-syntax-highlighter**: Code highlighting
- **katex**: Mathematical notation rendering

### Utility Dependencies
- **lodash**: Utility functions
- **date-fns**: Date manipulation
- **clsx + tailwind-merge**: Conditional styling

## Build/Deployment

### Development
```bash
pnpm install          # Install dependencies
pnpm dev              # Start development server
```

### Production Build
```bash
pnpm build            # Build for production
pnpm start            # Start production server
```

### Deployment Options
1. **Vercel**: Recommended platform (zero-config)
2. **Docker**: Containerized deployment
3. **Static Export**: For CDN deployment
4. **Self-hosted**: Node.js server deployment

### Environment Setup
1. Copy `.env.example` to `.env`
2. Configure LangGraph server URL and credentials
3. Set up API passthrough for production
4. Deploy with proper environment variables

### Testing
- **Linting**: `pnpm lint` - ESLint code quality checks
- **Formatting**: `pnpm format` - Prettier code formatting
- **Type Checking**: Built into Next.js build process

## Key Features

### Real-time Streaming
- WebSocket-based communication with LangGraph servers
- Live message updates and typing indicators
- Automatic reconnection and error handling

### Multimodal Support
- Image uploads (JPEG, PNG, GIF, WebP)
- PDF document processing
- Drag-and-drop file handling
- Content block preview system

### Artifact Rendering
- Custom UI component rendering in side panel
- Dynamic component loading from server responses
- Context-aware artifact management

### Thread Management
- Multiple conversation support
- Thread history and switching
- Persistent conversation state

### Production Ready
- API passthrough for secure deployments
- Custom authentication support
- Environment-based configuration
- Error handling and monitoring
