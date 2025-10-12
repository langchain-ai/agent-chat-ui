# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Agent Chat UI is a Next.js application that enables chatting with any LangGraph server through a chat interface. It's built with React 19, Next.js 15, TypeScript, and Tailwind CSS, using pnpm as the package manager.

## Commands

### Development
```bash
pnpm install          # Install dependencies
pnpm dev              # Start development server (http://localhost:3000)
pnpm build            # Build for production
pnpm start            # Start production server
```

### Code Quality
```bash
pnpm lint             # Run ESLint
pnpm lint:fix         # Fix ESLint issues
pnpm format           # Format code with Prettier
pnpm format:check     # Check code formatting
```

## Architecture

### Provider Hierarchy

The app uses a nested provider structure (see `src/app/page.tsx`):
```
ThreadProvider -> StreamProvider -> ArtifactProvider -> Thread
```

1. **ThreadProvider** (`src/providers/Thread.tsx`): Manages thread listing and fetching via LangGraph SDK client
2. **StreamProvider** (`src/providers/Stream.tsx`): Handles real-time streaming from LangGraph, manages connection state, and shows setup form if environment variables are missing
3. **ArtifactProvider** (`src/components/thread/artifact.tsx`): Manages artifact rendering in side panel

### State Management

- **URL State**: Uses `nuqs` for query parameter management (`threadId`, `apiUrl`, `assistantId`, `chatHistoryOpen`, `hideToolCalls`)
- **Stream State**: LangGraph SDK's `useStream` hook manages messages, interrupts, and real-time updates
- **Messages**: Type is `{ messages: Message[]; ui?: UIMessage[] }`
- **UI Messages**: Handled via `uiMessageReducer` from `@langchain/langgraph-sdk/react-ui`

### Message Rendering

Messages are filtered to exclude IDs starting with `DO_NOT_RENDER_ID_PREFIX` (`"do-not-render-"`) - see `src/lib/ensure-tool-responses.ts`. This allows hiding internal tool messages from the UI.

The system automatically creates hidden tool responses for AI messages with tool calls that lack responses via `ensureToolCallsHaveResponses()`.

### Agent Inbox / Interrupts

LangGraph interrupts are detected via `isAgentInboxInterruptSchema()` in `src/lib/agent-inbox-interrupt.ts`. The interrupt UI (`src/components/thread/agent-inbox/index.tsx`) provides:
- State inspection
- Action approval/editing/ignoring
- Tool call details table

### Artifacts

Artifacts are rendered in a right-side panel that slides in/out. Use `useArtifact()` hook to access:
```tsx
const [Artifact, { open, setOpen, context, setContext }] = useArtifact();
```

Context is stored in `thread.meta.artifact` and passed through message submissions.

### API Proxy (Production)

For production deployments, the app uses `langgraph-nextjs-api-passthrough` (`src/app/api/[..._path]/route.ts`) to proxy requests server-side with injected LangSmith API key. See README section "Going to Production".

## Configuration

### Environment Variables

Required for local development:
```bash
NEXT_PUBLIC_API_URL=http://localhost:2024
NEXT_PUBLIC_ASSISTANT_ID=agent
```

For production (API passthrough method):
```bash
NEXT_PUBLIC_ASSISTANT_ID=agent
LANGGRAPH_API_URL=https://my-agent.default.us.langgraph.app
NEXT_PUBLIC_API_URL=https://my-website.com/api
LANGSMITH_API_KEY=lsv2_...  # Do NOT prefix with NEXT_PUBLIC_
```

If these are not set, the app shows a setup form to collect them.

### Thread Search

Thread fetching uses UUID validation to determine metadata type:
- UUID assistant ID → `{ assistant_id: <id> }`
- Non-UUID → `{ graph_id: <id> }`

## Component Architecture

### UI Components

Uses shadcn/ui components in `src/components/ui/` with:
- Radix UI primitives
- Tailwind CSS styling
- `class-variance-authority` for variants

### Message Components

- `src/components/thread/messages/ai.tsx`: AI messages with tool calls, streaming, regenerate
- `src/components/thread/messages/human.tsx`: Human messages with multimodal support
- `src/components/thread/messages/tool-calls.tsx`: Tool call rendering
- `src/components/thread/messages/generic-interrupt.tsx`: Generic interrupt handling

### Markdown Rendering

`src/components/thread/markdown-text.tsx` uses:
- `react-markdown` with GitHub-flavored markdown (`remark-gfm`)
- Math support (`remark-math`, `rehype-katex`)
- Custom syntax highlighting via `src/components/thread/syntax-highlighter.tsx`

## Important Patterns

### Multimodal Content

File uploads are handled by `useFileUpload()` hook, supporting PDFs and images. Content blocks are stored in state and sent as part of message content array.

### Streaming State

The `firstTokenReceived` state tracks whether the first AI token has arrived to show loading states appropriately.

### Scroll Management

Uses `use-stick-to-bottom` for auto-scrolling behavior with "Scroll to bottom" button when not at bottom.

### Path Aliases

TypeScript is configured with `@/*` mapping to `./src/*` for imports.
