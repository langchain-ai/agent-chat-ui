# LangGraph v1 API Patterns

Common API patterns for LangGraph v1.xx applications.

## Table of Contents

1. [Core Imports](#core-imports)
2. [State Definition](#state-definition)
3. [Graph Construction](#graph-construction)
4. [Compilation](#compilation)
5. [Execution](#execution)
6. [Tool Integration](#tool-integration)
7. [Human-in-the-Loop](#human-in-the-loop)
8. [Subgraphs](#subgraphs)
9. [Error Handling](#error-handling)

---

## Core Imports

```python
# Graph building
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages

# Checkpointing
from langgraph.checkpoint.memory import MemorySaver

# Prebuilt components
from langgraph.prebuilt import ToolNode, tools_condition

# Messages
from langchain_core.messages import (
    HumanMessage,
    AIMessage,
    SystemMessage,
    ToolMessage
)

# Runtime config
from langchain_core.runnables import RunnableConfig

# Tools
from langchain_core.tools import tool
```

---

## State Definition

### Basic State with Messages

```python
from typing import Annotated
from typing_extensions import TypedDict
from langgraph.graph.message import add_messages

class State(TypedDict):
    messages: Annotated[list, add_messages]
```

### Custom State with Additional Fields

```python
class State(TypedDict):
    messages: Annotated[list, add_messages]
    user_info: str
    context: list[str]
    iteration_count: int
```

### Reducer Functions

```python
from operator import add

class State(TypedDict):
    # add_messages: Appends new messages, handles deduplication by ID
    messages: Annotated[list, add_messages]

    # add (operator): Extends list with new items
    items: Annotated[list, add]

    # No reducer: Overwrites on each update
    count: int
```

---

## Graph Construction

### Create StateGraph

```python
from langgraph.graph import StateGraph

graph_builder = StateGraph(State)
```

### Add Nodes

```python
# Function node
def agent_node(state: State) -> dict:
    """Process state and return updates."""
    response = llm.invoke(state["messages"])
    return {"messages": [response]}

graph_builder.add_node("agent", agent_node)

# Prebuilt ToolNode
from langgraph.prebuilt import ToolNode

tool_node = ToolNode(tools=[search_tool, calculator_tool])
graph_builder.add_node("tools", tool_node)
```

### Add Edges

```python
from langgraph.graph import START, END

# Basic edges
graph_builder.add_edge(START, "agent")
graph_builder.add_edge("agent", END)

# Sequential edges
graph_builder.add_edge("node_a", "node_b")
graph_builder.add_edge("node_b", "node_c")
```

### Conditional Edges

```python
# Custom routing function
def route_by_type(state: State) -> str:
    """Route based on last message type."""
    last_message = state["messages"][-1]
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "tools"
    return END

graph_builder.add_conditional_edges(
    "agent",
    route_by_type,
    {"tools": "tools", END: END}
)

# Using prebuilt tools_condition
from langgraph.prebuilt import tools_condition

graph_builder.add_conditional_edges("agent", tools_condition)
```

---

## Compilation

### Basic Compilation

```python
graph = graph_builder.compile()
```

### With Checkpointer

```python
from langgraph.checkpoint.memory import MemorySaver

memory = MemorySaver()
graph = graph_builder.compile(checkpointer=memory)
```

### With Interrupts

```python
graph = graph_builder.compile(
    checkpointer=memory,
    interrupt_before=["human_review"],  # Pause before node
    interrupt_after=["tool_execution"]   # Pause after node
)
```

---

## Execution

### invoke()

```python
from langchain_core.messages import HumanMessage

result = graph.invoke({
    "messages": [HumanMessage(content="Hello")]
})
```

### stream()

```python
for event in graph.stream({"messages": [HumanMessage(content="Hello")]}):
    print(event)
```

### With Config

```python
from langchain_core.runnables import RunnableConfig

config = RunnableConfig(
    recursion_limit=25,
    configurable={"thread_id": "thread-1"}
)

result = graph.invoke(inputs, config=config)
```

### State Management

```python
# Get current state
state = graph.get_state(config)
print(state.values)

# Get state history
for state in graph.get_state_history(config):
    print(state.config["configurable"]["checkpoint_id"])

# Update state manually
graph.update_state(
    config,
    {"messages": [AIMessage(content="Updated response")]},
    as_node="agent"
)
```

---

## Tool Integration

### Define Tools

```python
from langchain_core.tools import tool

@tool
def search(query: str) -> str:
    """Search the web for information."""
    return f"Results for: {query}"

@tool
def calculator(expression: str) -> str:
    """Calculate a mathematical expression."""
    return str(eval(expression))
```

### Bind Tools to Model

```python
from langchain_anthropic import ChatAnthropic

llm = ChatAnthropic(model="claude-sonnet-4-5")
llm_with_tools = llm.bind_tools(tools=[search, calculator])
```

### Use ToolNode

```python
from langgraph.prebuilt import ToolNode, tools_condition

# Create tool node
tool_node = ToolNode(tools=[search, calculator])

# Add to graph
graph_builder.add_node("tools", tool_node)

# Route to tools when needed
graph_builder.add_conditional_edges("agent", tools_condition)

# Return to agent after tools
graph_builder.add_edge("tools", "agent")
```

---

## Human-in-the-Loop

### Configure Interrupts

```python
graph = graph_builder.compile(
    checkpointer=memory,
    interrupt_before=["human_approval"]
)
```

### Resume Execution

```python
# Execute until interrupt
result = graph.invoke(inputs, config=config)

# Check state at interrupt
state = graph.get_state(config)
print(state.next)  # Shows interrupted node

# Resume with None (continue from checkpoint)
result = graph.invoke(None, config=config)
```

### Modify State Before Resume

```python
# Update state at interrupt point
graph.update_state(
    config,
    {"messages": [HumanMessage(content="User approved")]},
    as_node="human_approval"
)

# Resume
result = graph.invoke(None, config=config)
```

### Replay from Checkpoint

```python
# Get specific checkpoint ID
for state in graph.get_state_history(config):
    checkpoint_id = state.config["configurable"]["checkpoint_id"]
    break

# Replay from that checkpoint
replay_config = {
    "configurable": {
        "thread_id": "thread-1",
        "checkpoint_id": checkpoint_id
    }
}
result = graph.invoke(None, config=replay_config)
```

---

## Subgraphs

### Define Subgraph

```python
# Subgraph state
class SubState(TypedDict):
    messages: Annotated[list, add_messages]

# Build subgraph
sub_builder = StateGraph(SubState)
sub_builder.add_node("sub_node", sub_function)
sub_builder.add_edge(START, "sub_node")
sub_builder.add_edge("sub_node", END)
subgraph = sub_builder.compile()
```

### Add Subgraph to Main Graph

```python
# Add compiled subgraph as a node
main_builder.add_node("subgraph", subgraph)

# Connect in main graph
main_builder.add_edge("pre_process", "subgraph")
main_builder.add_edge("subgraph", "post_process")
```

---

## Error Handling

### Safe Node Pattern

```python
def safe_node(state: State) -> dict:
    """Node with error handling."""
    try:
        result = risky_operation(state)
        return {"messages": [AIMessage(content=result)]}
    except Exception as e:
        error_msg = f"Error occurred: {str(e)}"
        return {"messages": [AIMessage(content=error_msg)]}
```

### Retry Pattern

```python
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10)
)
def call_llm(messages):
    return llm.invoke(messages)

def robust_node(state: State) -> dict:
    """Node with retry logic."""
    response = call_llm(state["messages"])
    return {"messages": [response]}
```

### Fallback Pattern

```python
def node_with_fallback(state: State) -> dict:
    """Node with fallback behavior."""
    try:
        # Primary operation
        response = primary_llm.invoke(state["messages"])
    except Exception:
        # Fallback to alternative
        response = fallback_llm.invoke(state["messages"])

    return {"messages": [response]}
```

---

## Complete Example

```python
from typing import Annotated
from typing_extensions import TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.checkpoint.memory import MemorySaver
from langgraph.prebuilt import ToolNode, tools_condition
from langchain_anthropic import ChatAnthropic
from langchain_core.tools import tool
from langchain_core.messages import HumanMessage
from langchain_core.runnables import RunnableConfig

# State definition
class State(TypedDict):
    messages: Annotated[list, add_messages]

# Tool definition
@tool
def search(query: str) -> str:
    """Search the web for information."""
    return f"Results for: {query}"

# Model setup
llm = ChatAnthropic(model="claude-sonnet-4-5")
llm_with_tools = llm.bind_tools([search])

# Node function
def agent(state: State) -> dict:
    """Agent node that processes messages."""
    response = llm_with_tools.invoke(state["messages"])
    return {"messages": [response]}

# Build graph
graph_builder = StateGraph(State)
graph_builder.add_node("agent", agent)
graph_builder.add_node("tools", ToolNode([search]))

graph_builder.add_edge(START, "agent")
graph_builder.add_conditional_edges("agent", tools_condition)
graph_builder.add_edge("tools", "agent")

# Compile with checkpointer
memory = MemorySaver()
graph = graph_builder.compile(checkpointer=memory)

# Execute
config = RunnableConfig(configurable={"thread_id": "example-1"})
result = graph.invoke(
    {"messages": [HumanMessage(content="Search for LangGraph documentation")]},
    config=config
)
print(result["messages"][-1].content)
```
