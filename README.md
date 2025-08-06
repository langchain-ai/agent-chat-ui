# Agent Chat UI

Agent Chat UI is a Next.js application which enables chatting with any LangGraph server with a `messages` key through a chat interface.

## Key Features

- **🔄 Real-time Streaming**: Live streaming of AI responses with typing indicators
- **📁 Multimodal Support**: Upload and process images, PDFs, and other files
- **🎛️ Interactive Widgets**: Custom UI components triggered by agent interrupts
- **📋 Agent Inbox**: Human-in-the-loop workflows with review and approval capabilities
- **🎨 Rich Markdown**: Enhanced markdown rendering with syntax highlighting and math support
- **📱 Responsive Design**: Optimized for both desktop and mobile experiences
- **🔧 Customizable**: Easy to extend with custom widgets and styling
- **🚀 Production Ready**: Built-in authentication and deployment support

> [!NOTE]
> 🎥 Watch the video setup guide [here](https://youtu.be/lInrwVnZ83o).

## Table of Contents

- [Setup](#setup)
- [Usage](#usage)
- [Environment Variables](#environment-variables)
- [Hiding Messages in the Chat](#hiding-messages-in-the-chat)
- [Enhanced Markdown and Code Rendering](#enhanced-markdown-and-code-rendering)
- [Multimodal Support](#multimodal-support)
- [Interactive Widgets and Interrupts](#interactive-widgets-and-interrupts)
- [Agent Inbox](#agent-inbox)
- [Rendering Artifacts](#rendering-artifacts)
- [Development and Customization](#development-and-customization)
- [Going to Production](#going-to-production)

## Setup

> [!TIP]
> Don't want to run the app locally? Use the deployed site here: [agentchat.vercel.app](https://agentchat.vercel.app)!

First, clone the repository, or run the [`npx` command](https://www.npmjs.com/package/create-agent-chat-app):

```bash
npx create-agent-chat-app
```

or

```bash
git clone https://github.com/langchain-ai/agent-chat-ui.git

cd agent-chat-ui
```

Install dependencies:

```bash
pnpm install
```

Run the app:

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`.

## Usage

Once the app is running (or if using the deployed site), you'll be prompted to enter:

- **Deployment URL**: The URL of the LangGraph server you want to chat with. This can be a production or development URL.
- **Assistant/Graph ID**: The name of the graph, or ID of the assistant to use when fetching, and submitting runs via the chat interface.
- **LangSmith API Key**: (only required for connecting to deployed LangGraph servers) Your LangSmith API key to use when authenticating requests sent to LangGraph servers.

After entering these values, click `Continue`. You'll then be redirected to a chat interface where you can start chatting with your LangGraph server.

## Environment Variables

You can bypass the initial setup form by setting the following environment variables:

```bash
NEXT_PUBLIC_API_URL=http://localhost:2024
NEXT_PUBLIC_ASSISTANT_ID=agent
```

> [!TIP]
> If you want to connect to a production LangGraph server, read the [Going to Production](#going-to-production) section.

To use these variables:

1. Copy the `.env.example` file to a new file named `.env`
2. Fill in the values in the `.env` file
3. Restart the application

When these environment variables are set, the application will use them instead of showing the setup form.

## Hiding Messages in the Chat

You can control the visibility of messages within the Agent Chat UI in two main ways:

**1. Prevent Live Streaming:**

To stop messages from being displayed _as they stream_ from an LLM call, add the `langsmith:nostream` tag to the chat model's configuration. The UI normally uses `on_chat_model_stream` events to render streaming messages; this tag prevents those events from being emitted for the tagged model.

_Python Example:_

```python
from langchain_anthropic import ChatAnthropic

# Add tags via the .with_config method
model = ChatAnthropic().with_config(
    config={"tags": ["langsmith:nostream"]}
)
```

_TypeScript Example:_

```typescript
import { ChatAnthropic } from "@langchain/anthropic";

const model = new ChatAnthropic()
  // Add tags via the .withConfig method
  .withConfig({ tags: ["langsmith:nostream"] });
```

**Note:** Even if streaming is hidden this way, the message will still appear after the LLM call completes if it's saved to the graph's state without further modification.

**2. Hide Messages Permanently:**

To ensure a message is _never_ displayed in the chat UI (neither during streaming nor after being saved to state), prefix its `id` field with `do-not-render-` _before_ adding it to the graph's state, along with adding the `langsmith:do-not-render` tag to the chat model's configuration. The UI explicitly filters out any message whose `id` starts with this prefix.

_Python Example:_

```python
result = model.invoke([messages])
# Prefix the ID before saving to state
result.id = f"do-not-render-{result.id}"
return {"messages": [result]}
```

_TypeScript Example:_

```typescript
const result = await model.invoke([messages]);
// Prefix the ID before saving to state
result.id = `do-not-render-${result.id}`;
return { messages: [result] };
```

This approach guarantees the message remains completely hidden from the user interface.

## Enhanced Markdown and Code Rendering

The Agent Chat UI provides rich markdown rendering with advanced features:

### Markdown Features

- **GitHub Flavored Markdown (GFM)**: Full support for tables, strikethrough, task lists, and more
- **Math Rendering**: LaTeX math expressions using KaTeX
- **Syntax Highlighting**: Code blocks with syntax highlighting for multiple languages
- **Copy Code**: One-click copying of code blocks with a copy button
- **Responsive Tables**: Tables that adapt to different screen sizes

### Supported Languages

The syntax highlighter supports popular programming languages including:

- TypeScript/JavaScript (tsx, ts, js, jsx)
- Python
- Java
- C/C++
- Go
- Rust
- And many more

### Code Block Features

- **Language Detection**: Automatic language detection for syntax highlighting
- **Dark Theme**: Professional dark theme for code blocks
- **Line Numbers**: Optional line numbering for better readability
- **Copy Functionality**: Easy copying of code snippets

## Multimodal Support

The Agent Chat UI supports multimodal conversations with file uploads and rich media handling:

### Supported File Types

- **Images**: JPEG, PNG, GIF, WebP
- **Documents**: PDF files
- **Future Support**: Video files (infrastructure ready)

### Upload Methods

1. **File Upload Button**: Click the "Upload PDF, Image, or Video" button to select files
2. **Drag and Drop**: Drag files directly into the chat interface
3. **Paste**: Paste images or files directly from your clipboard (Ctrl+V/Cmd+V)

### Features

- **Preview**: Visual previews of uploaded images and file icons for PDFs
- **Duplicate Detection**: Prevents uploading the same file multiple times
- **Error Handling**: Clear error messages for unsupported file types
- **Removal**: Easy removal of uploaded files before sending
- **Base64 Encoding**: Automatic conversion to base64 for LangGraph compatibility

### Usage in Messages

Uploaded files are automatically included in your messages to the LangGraph server as `Base64ContentBlock` objects, making them available for processing by your AI agents. Images can be analyzed, PDFs can be read and processed, enabling rich multimodal AI interactions.

## Interactive Widgets and Interrupts

The Agent Chat UI supports interactive widgets that can be triggered by your LangGraph server using interrupts. This allows your agent to pause execution and display custom UI components for user interaction.

### Widget System

The application includes several built-in widgets for common use cases:

- **SearchCriteriaWidget**: For collecting search parameters and filters
- **FlightOptionsWidget**: For displaying flight search results with booking options
- **FlightStatusWidget**: For showing flight status information
- **LoungeWidget**: For displaying airport lounge information
- **WeatherWidget**: For showing weather information
- **TravelerDetailsWidget**: For collecting traveler information and booking details
- **NonAgentFlowWidget**: For handling payment flow with prePayment API, Razorpay integration, and transaction verification

### Using Interrupts

To trigger a widget from your LangGraph server, use the `interrupt()` function:

```typescript
// Server-side interrupt
const result = interrupt({
  value: {
    interrupt_id: "unique-id-here",
    type: "SearchCriteriaWidget",
    searchCriteria: searchCriteria,
    selectedTravellers: selectedTravellers,
  },
});

// NonAgentFlowWidget example
const result = interrupt({
  value: {
    interrupt_id: "payment-flow-id",
    type: "NonAgentFlowWidget",
    args: {
      tripId: "Tswodli37",
      flightItinerary: {
        userContext: {
          userDetails: primaryTraveller,
          userId: userId,
        },
        selectionContext: {
          selectedFlightOffers: selectedOffers,
        },
      },
      itinId: "itin123",
    },
  },
});
```

The client will automatically render the appropriate widget based on the `type` field and display it as a bottom sheet overlay with a close button.

### Widget Features

- **Bottom Sheet Display**: Widgets automatically render as overlay bottom sheets
- **Responsive Design**: Two-column layout on desktop, single column on mobile
- **Data Pre-filling**: Widgets can pre-fill forms with data from the interrupt
- **Streaming Support**: Widgets can handle streamed API response data
- **Interactive Forms**: Full form validation and submission capabilities

For detailed documentation on handling interrupts, see the [interrupt documentation](documentation/interrupt.md).

## Agent Inbox

The Agent Chat UI includes an Agent Inbox feature for managing human-in-the-loop workflows. This allows agents to pause execution and wait for human review, approval, or input before continuing.

### Features

- **Thread Management**: View and manage multiple conversation threads
- **Human Review**: Review agent responses before they are sent
- **State Inspection**: View the current state of the agent's workflow
- **Interrupt Handling**: Respond to agent interrupts with custom actions
- **Status Tracking**: Monitor thread status (in-queue, processing, human-in-the-loop, done)

### Usage

The Agent Inbox automatically appears when your LangGraph server sends interrupts that require human intervention. Users can:

1. **Review**: Examine the agent's proposed actions or responses
2. **Edit**: Modify the agent's output before approval
3. **Accept**: Approve the agent's actions to continue execution
4. **Respond**: Provide additional input or instructions to the agent

## Development and Customization

### Custom Widgets

You can create custom widgets for your specific use cases by:

1. **Creating Widget Components**: Add new widget components in `src/components/widgets/`
2. **Registering Widgets**: Update the `componentMap` in `src/components/widgets/index.ts`
3. **Server Integration**: Use the interrupt system to trigger your custom widgets

### Styling and Theming

The application uses:

- **Tailwind CSS**: For utility-first styling
- **Shadcn/ui**: For consistent UI components
- **Custom CSS**: For specialized styling needs
- **Responsive Design**: Mobile-first approach with desktop enhancements

### API Integration

- **LangGraph SDK**: Built-in integration with LangGraph servers
- **Streaming Support**: Real-time message streaming
- **Error Handling**: Comprehensive error handling and user feedback
- **Authentication**: Support for both development and production authentication methods

## Rendering Artifacts

The Agent Chat UI supports rendering artifacts in the chat. Artifacts are rendered in a side panel to the right of the chat. To render an artifact, you can obtain the artifact context from the `thread.meta.artifact` field. Here's a sample utility hook for obtaining the artifact context:

```tsx
export function useArtifact<TContext = Record<string, unknown>>() {
  type Component = (props: {
    children: React.ReactNode;
    title?: React.ReactNode;
  }) => React.ReactNode;

  type Context = TContext | undefined;

  type Bag = {
    open: boolean;
    setOpen: (value: boolean | ((prev: boolean) => boolean)) => void;

    context: Context;
    setContext: (value: Context | ((prev: Context) => Context)) => void;
  };

  const thread = useStreamContext<
    { messages: Message[]; ui: UIMessage[] },
    { MetaType: { artifact: [Component, Bag] } }
  >();

  return thread.meta?.artifact;
}
```

After which you can render additional content using the `Artifact` component from the `useArtifact` hook:

```tsx
import { useArtifact } from "../utils/use-artifact";
import { LoaderIcon } from "lucide-react";

export function Writer(props: {
  title?: string;
  content?: string;
  description?: string;
}) {
  const [Artifact, { open, setOpen }] = useArtifact();

  return (
    <>
      <div
        onClick={() => setOpen(!open)}
        className="cursor-pointer rounded-lg border p-4"
      >
        <p className="font-medium">{props.title}</p>
        <p className="text-sm text-gray-500">{props.description}</p>
      </div>

      <Artifact title={props.title}>
        <p className="whitespace-pre-wrap p-4">{props.content}</p>
      </Artifact>
    </>
  );
}
```

## Going to Production

Once you're ready to go to production, you'll need to update how you connect, and authenticate requests to your deployment. By default, the Agent Chat UI is setup for local development, and connects to your LangGraph server directly from the client. This is not possible if you want to go to production, because it requires every user to have their own LangSmith API key, and set the LangGraph configuration themselves.

### Production Setup

To productionize the Agent Chat UI, you'll need to pick one of two ways to authenticate requests to your LangGraph server. Below, I'll outline the two options:

### Quickstart - API Passthrough

The quickest way to productionize the Agent Chat UI is to use the [API Passthrough](https://github.com/langchain-ai/langgraph-nextjs-api-passthrough) package. This package provides a simple way to proxy requests to your LangGraph server, and handle authentication for you.

This repository already contains all of the code you need to start using this method. The only configuration you need to do is set the proper environment variables.

```bash
NEXT_PUBLIC_ASSISTANT_ID="agent"
# This should be the deployment URL of your LangGraph server
LANGGRAPH_API_URL="https://my-agent.default.us.langgraph.app"
# This should be the URL of your website + "/api". This is how you connect to the API proxy
NEXT_PUBLIC_API_URL="https://my-website.com/api"
# Your LangSmith API key which is injected into requests inside the API proxy
LANGSMITH_API_KEY="lsv2_..."
```

Let's cover what each of these environment variables does:

- `NEXT_PUBLIC_ASSISTANT_ID`: The ID of the assistant you want to use when fetching, and submitting runs via the chat interface. This still needs the `NEXT_PUBLIC_` prefix, since it's not a secret, and we use it on the client when submitting requests.
- `LANGGRAPH_API_URL`: The URL of your LangGraph server. This should be the production deployment URL.
- `NEXT_PUBLIC_API_URL`: The URL of your website + `/api`. This is how you connect to the API proxy. For the [Agent Chat demo](https://agentchat.vercel.app), this would be set as `https://agentchat.vercel.app/api`. You should set this to whatever your production URL is.
- `LANGSMITH_API_KEY`: Your LangSmith API key to use when authenticating requests sent to LangGraph servers. Once again, do _not_ prefix this with `NEXT_PUBLIC_` since it's a secret, and is only used on the server when the API proxy injects it into the request to your deployed LangGraph server.

For in depth documentation, consult the [LangGraph Next.js API Passthrough](https://www.npmjs.com/package/langgraph-nextjs-api-passthrough) docs.

### Advanced Setup - Custom Authentication

Custom authentication in your LangGraph deployment is an advanced, and more robust way of authenticating requests to your LangGraph server. Using custom authentication, you can allow requests to be made from the client, without the need for a LangSmith API key. Additionally, you can specify custom access controls on requests.

To set this up in your LangGraph deployment, please read the LangGraph custom authentication docs for [Python](https://langchain-ai.github.io/langgraph/tutorials/auth/getting_started/), and [TypeScript here](https://langchain-ai.github.io/langgraphjs/how-tos/auth/custom_auth/).

Once you've set it up on your deployment, you should make the following changes to the Agent Chat UI:

1. Configure any additional API requests to fetch the authentication token from your LangGraph deployment which will be used to authenticate requests from the client.
2. Set the `NEXT_PUBLIC_API_URL` environment variable to your production LangGraph deployment URL.
3. Set the `NEXT_PUBLIC_ASSISTANT_ID` environment variable to the ID of the assistant you want to use when fetching, and submitting runs via the chat interface.
4. Modify the [`useTypedStream`](src/providers/Stream.tsx) (extension of `useStream`) hook to pass your authentication token through headers to the LangGraph server:

```tsx
const streamValue = useTypedStream({
  apiUrl: process.env.NEXT_PUBLIC_API_URL,
  assistantId: process.env.NEXT_PUBLIC_ASSISTANT_ID,
  // ... other fields
  defaultHeaders: {
    Authentication: `Bearer ${addYourTokenHere}`, // this is where you would pass your authentication token
  },
});
```
