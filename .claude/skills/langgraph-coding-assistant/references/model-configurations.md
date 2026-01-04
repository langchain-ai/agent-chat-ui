# Model Configuration Guide

Comprehensive guide for selecting and configuring models in LangGraph applications.

## Table of Contents

1. [Model Comparison](#model-comparison)
2. [Anthropic Configuration](#anthropic-configuration)
3. [OpenAI Configuration](#openai-configuration)
4. [Tool Binding](#tool-binding)
5. [Streaming Configuration](#streaming-configuration)
6. [Best Practices](#best-practices)

---

## Model Comparison

### Anthropic Models

| Model | Use Case | Strengths |
|-------|----------|-----------|
| `claude-sonnet-4-5` | General purpose (recommended) | Best balance of speed, cost, and capability |
| `claude-opus-4-5` | High performance tasks | Complex reasoning, long context, nuanced outputs |
| `claude-haiku-4-5` | Lightweight / fast response | Speed-critical applications, simple tasks |

### OpenAI Models

| Model | Use Case | Strengths |
|-------|----------|-----------|
| `gpt-5.2` | High performance | Advanced reasoning, complex tasks |
| `gpt-5-mini` | General purpose | Good balance for most applications |
| `gpt-5-nano` | Lightweight | Fast responses, cost-effective |

### Selection Criteria

| Criterion | Recommended Model |
|-----------|-------------------|
| Complex reasoning | claude-opus-4-5, gpt-5.2 |
| General chat/agents | claude-sonnet-4-5, gpt-5-mini |
| Real-time responses | claude-haiku-4-5, gpt-5-nano |
| Cost optimization | claude-haiku-4-5, gpt-5-nano |
| Tool-heavy workflows | claude-sonnet-4-5, gpt-5-mini |
| Code generation | claude-sonnet-4-5, gpt-5.2 |

---

## Anthropic Configuration

### Basic Setup

```python
from langchain_anthropic import ChatAnthropic

# General purpose (recommended)
model = ChatAnthropic(model="claude-sonnet-4-5")

# High performance
model = ChatAnthropic(model="claude-opus-4-5")

# Fast/lightweight
model = ChatAnthropic(model="claude-haiku-4-5")
```

### With Parameters

```python
from langchain_anthropic import ChatAnthropic

model = ChatAnthropic(
    model="claude-sonnet-4-5",
    temperature=0.7,        # Creativity (0-1)
    max_tokens=4096,        # Maximum response length
    timeout=60,             # Request timeout in seconds
    max_retries=3,          # Retry on failure
)
```

### Environment Variables

```bash
# Required
export ANTHROPIC_API_KEY="your-api-key"
```

---

## OpenAI Configuration

### Basic Setup

```python
from langchain_openai import ChatOpenAI

# High performance
model = ChatOpenAI(model="gpt-5.2")

# General purpose
model = ChatOpenAI(model="gpt-5-mini")

# Lightweight
model = ChatOpenAI(model="gpt-5-nano")
```

### With Parameters

```python
from langchain_openai import ChatOpenAI

model = ChatOpenAI(
    model="gpt-5-mini",
    temperature=0.7,        # Creativity (0-2)
    max_tokens=4096,        # Maximum response length
    timeout=60,             # Request timeout in seconds
    max_retries=3,          # Retry on failure
)
```

### Environment Variables

```bash
# Required
export OPENAI_API_KEY="your-api-key"
```

---

## Tool Binding

### Binding Tools to Anthropic

```python
from langchain_anthropic import ChatAnthropic
from langchain_core.tools import tool

@tool
def search(query: str) -> str:
    """Search the web for information."""
    return f"Results for: {query}"

@tool
def calculator(expression: str) -> str:
    """Calculate a mathematical expression."""
    return str(eval(expression))

# Bind tools to model
llm = ChatAnthropic(model="claude-sonnet-4-5")
llm_with_tools = llm.bind_tools([search, calculator])
```

### Binding Tools to OpenAI

```python
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool

@tool
def search(query: str) -> str:
    """Search the web for information."""
    return f"Results for: {query}"

# Bind tools to model
llm = ChatOpenAI(model="gpt-5-mini")
llm_with_tools = llm.bind_tools([search])
```

### Tool Choice Options

```python
# Let model decide whether to use tools
llm_with_tools = llm.bind_tools(tools)

# Force model to use a specific tool
llm_with_tools = llm.bind_tools(
    tools,
    tool_choice={"type": "function", "function": {"name": "search"}}
)

# Force model to use any tool
llm_with_tools = llm.bind_tools(tools, tool_choice="required")

# Prevent tool usage
llm_with_tools = llm.bind_tools(tools, tool_choice="none")
```

---

## Streaming Configuration

### Basic Streaming

```python
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage

llm = ChatAnthropic(model="claude-sonnet-4-5")

# Stream tokens
for chunk in llm.stream([HumanMessage(content="Tell me a story")]):
    print(chunk.content, end="", flush=True)
```

### Streaming in LangGraph

```python
from langgraph.graph import StateGraph, START, END

# Build graph
graph = graph_builder.compile()

# Stream events
for event in graph.stream({"messages": [HumanMessage(content="Hello")]}):
    for node_name, output in event.items():
        print(f"Node: {node_name}")
        print(f"Output: {output}")
```

### Stream Modes

```python
# Stream all events
for event in graph.stream(inputs, stream_mode="values"):
    print(event)

# Stream updates only
for event in graph.stream(inputs, stream_mode="updates"):
    print(event)

# Stream with debug info
for event in graph.stream(inputs, stream_mode="debug"):
    print(event)
```

---

## Best Practices

### Model Selection

1. **Start with Sonnet/Mini**: Use claude-sonnet-4-5 or gpt-5-mini for most applications
2. **Upgrade for complexity**: Move to opus/gpt-5.2 for complex reasoning
3. **Downgrade for speed**: Use haiku/nano for latency-sensitive operations

### Temperature Settings

| Use Case | Temperature |
|----------|-------------|
| Factual Q&A | 0.0 - 0.3 |
| General chat | 0.5 - 0.7 |
| Creative writing | 0.8 - 1.0 |
| Code generation | 0.0 - 0.3 |

### Error Handling

```python
from langchain_anthropic import ChatAnthropic
import time

def create_robust_model():
    """Create model with retry logic."""
    return ChatAnthropic(
        model="claude-sonnet-4-5",
        max_retries=3,
        timeout=60,
    )

def invoke_with_fallback(primary_model, fallback_model, messages):
    """Invoke with fallback to secondary model."""
    try:
        return primary_model.invoke(messages)
    except Exception as e:
        print(f"Primary model failed: {e}")
        return fallback_model.invoke(messages)
```

### Cost Optimization

```python
# Use appropriate model for task complexity
def select_model(task_complexity: str):
    """Select model based on task complexity."""
    if task_complexity == "simple":
        return ChatAnthropic(model="claude-haiku-4-5")
    elif task_complexity == "complex":
        return ChatAnthropic(model="claude-opus-4-5")
    else:
        return ChatAnthropic(model="claude-sonnet-4-5")
```

### Caching

```python
from langchain.cache import InMemoryCache
from langchain.globals import set_llm_cache

# Enable caching for repeated queries
set_llm_cache(InMemoryCache())

# Now repeated identical queries will use cache
llm = ChatAnthropic(model="claude-sonnet-4-5")
```

---

## Complete Example

```python
from langchain_anthropic import ChatAnthropic
from langchain_core.tools import tool
from langchain_core.messages import SystemMessage, HumanMessage

# Define tools
@tool
def search(query: str) -> str:
    """Search for information."""
    return f"Results for: {query}"

# Create model with configuration
llm = ChatAnthropic(
    model="claude-sonnet-4-5",
    temperature=0.5,
    max_tokens=2048,
    max_retries=3,
)

# Bind tools
llm_with_tools = llm.bind_tools([search])

# Create messages
messages = [
    SystemMessage(content="You are a helpful assistant."),
    HumanMessage(content="Search for LangGraph documentation")
]

# Invoke
response = llm_with_tools.invoke(messages)
print(response)
```
