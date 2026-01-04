---
name: langgraph-coding-assistant
description: Coding assistant for writing LangGraph v1.xx Python applications with real-time documentation search. Use this skill when (1) writing LangGraph code or building agents, (2) implementing stateful workflows with StateGraph or Functional API, (3) searching LangChain official documentation for latest APIs, (4) needing system prompt templates in English, or (5) configuring Anthropic/OpenAI models for LangGraph. Supports MCP integration at https://docs.langchain.com/mcp for live documentation search.
---

# LangGraph Coding Assistant

Write production-ready LangGraph v1.xx applications with real-time documentation access.

## Quick Reference

| Item | Value |
|------|-------|
| Target | Python LangGraph v1.xx applications |
| Language | English (system prompts, code comments) |
| MCP Endpoint | https://docs.langchain.com/mcp |
| API Patterns | [references/api-patterns.md](references/api-patterns.md) |
| System Prompts | [references/system-prompts.md](references/system-prompts.md) |
| Model Config | [references/model-configurations.md](references/model-configurations.md) |
| Doc URLs | [references/llms.txt](references/llms.txt) |

---

## MCP Documentation Search

Use MCP at `https://docs.langchain.com/mcp` for real-time documentation search.

### When to Use MCP

1. **Verify latest APIs**: Check current signatures before writing code
2. **Advanced features**: Interrupts, persistence, subgraphs, streaming
3. **Breaking changes**: Verify deprecations in v1
4. **Uncommon patterns**: Features not in cached knowledge

### How to Search

Query the MCP server with specific topics:
- Query by topic: "StateGraph API", "Functional API"
- Query by feature: "human-in-the-loop patterns", "interrupt_before"
- Query by concept: "add_messages reducer", "checkpointer"

### Priority Documentation URLs

| Topic | URL |
|-------|-----|
| Graph API | https://docs.langchain.com/oss/python/langgraph/graph-api.md |
| Functional API | https://docs.langchain.com/oss/python/langgraph/functional-api.md |
| Interrupts | https://docs.langchain.com/oss/python/langgraph/interrupts.md |
| Persistence | https://docs.langchain.com/oss/python/langgraph/persistence.md |
| Streaming | https://docs.langchain.com/oss/python/langgraph/streaming.md |
| v1 Migration | https://docs.langchain.com/oss/python/migrate/langgraph-v1.md |
| MCP | https://docs.langchain.com/oss/python/langchain/mcp.md |

Use `web_fetch` to retrieve documentation when needed:

```python
# Fetch latest LangGraph Graph API documentation
web_fetch("https://docs.langchain.com/oss/python/langgraph/graph-api.md")
```

---

## Model Configuration

### Anthropic (Primary)

```python
from langchain_anthropic import ChatAnthropic

# General purpose (recommended)
model = ChatAnthropic(model="claude-sonnet-4-5")

# High performance tasks
model = ChatAnthropic(model="claude-opus-4-5")

# Lightweight / fast response
model = ChatAnthropic(model="claude-haiku-4-5")
```

### OpenAI (Alternative)

```python
from langchain_openai import ChatOpenAI

# High performance
model = ChatOpenAI(model="gpt-5.2")

# General purpose
model = ChatOpenAI(model="gpt-5-mini")

# Lightweight
model = ChatOpenAI(model="gpt-5-nano")
```

See [references/model-configurations.md](references/model-configurations.md) for detailed selection guide.

---

## System Prompt Guidelines

All system prompts MUST be in English. See [references/system-prompts.md](references/system-prompts.md) for complete templates.

### Example System Prompt

```python
system_prompt = """You are a helpful AI assistant with access to the following tools:
{tools}

When responding:
1. Analyze the user's request carefully
2. Choose appropriate tools when needed
3. Provide clear explanations of your actions
4. Handle errors gracefully
"""
```

---

## Core LangGraph Patterns

### State Definition

```python
from typing import Annotated
from typing_extensions import TypedDict
from langgraph.graph.message import add_messages

class State(TypedDict):
    messages: Annotated[list, add_messages]
```

### Graph Construction

```python
from langgraph.graph import StateGraph, START, END

graph_builder = StateGraph(State)
graph_builder.add_node("agent", agent_node)
graph_builder.add_edge(START, "agent")
graph_builder.add_edge("agent", END)
graph = graph_builder.compile()
```

### Execution with Config

```python
from langchain_core.runnables import RunnableConfig
from langchain_core.messages import HumanMessage

config = RunnableConfig(
    recursion_limit=25,
    configurable={"thread_id": "thread-1"}
)

result = graph.invoke(
    {"messages": [HumanMessage(content="Hello")]},
    config=config
)
```

See [references/api-patterns.md](references/api-patterns.md) for complete patterns.

---

## Reference Navigation

| Need | Read |
|------|------|
| API usage questions | [references/api-patterns.md](references/api-patterns.md) |
| System prompt templates | [references/system-prompts.md](references/system-prompts.md) |
| Model selection | [references/model-configurations.md](references/model-configurations.md) |
| Documentation URLs | [references/llms.txt](references/llms.txt) |
| Latest docs | Use MCP at https://docs.langchain.com/mcp |
