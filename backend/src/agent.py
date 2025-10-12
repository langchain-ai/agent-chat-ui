"""Research Assistant Agent with human-in-the-loop workflow."""

import os
import pathlib
from typing import Callable, Literal, TypedDict
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_core.tools import BaseTool, tool as create_tool
from langchain_core.runnables import RunnableConfig
from langgraph.types import interrupt
from langgraph.prebuilt.interrupt import HumanInterruptConfig, HumanInterrupt
from langgraph.prebuilt import create_react_agent
from tavily import TavilyClient

# Load environment variables - specify .env file path
env_path = pathlib.Path(__file__).parent.parent / ".env"
load_dotenv(env_path)

# Initialize Tavily client
tavily_client = TavilyClient(api_key=os.environ.get("TAVILY_API_KEY"))

# Choose LLM provider based on environment variable
def create_llm_model():
    """Create appropriate LLM model based on environment variables"""
    llm_provider = os.getenv("LLM_PROVIDER", "openai").lower()
    
    print(f"LLM Provider: {llm_provider}")
    
    if llm_provider == "anthropic":
        # Configure Anthropic Claude
        api_key = os.getenv("ANTHROPIC_API_KEY")
        base_url = os.getenv("ANTHROPIC_BASE_URL")
        model_name = os.getenv("ANTHROPIC_MODEL", "claude-3-5-haiku-20241022")
        
        print(f"Anthropic API Key loaded: {'✓' if api_key else '✗'}")
        print(f"Anthropic Base URL: {base_url}")
        print(f"Anthropic Model: {model_name}")
        
        model_kwargs = {
            "model": model_name,
            "anthropic_api_key": api_key,
        }
        
        # Only add base_url if it exists
        if base_url:
            model_kwargs["base_url"] = base_url
            
        return ChatAnthropic(**model_kwargs)
        
    else:
        # Default to OpenAI
        api_key = os.getenv("OPENAI_API_KEY")
        base_url = os.getenv("OPENAI_BASE_URL")
        model_name = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        
        print(f"OpenAI API Key loaded: {'✓' if api_key else '✗'}")
        print(f"OpenAI Base URL: {base_url}")
        print(f"OpenAI Model: {model_name}")
        
        model_kwargs = {
            "model": model_name,
            "openai_api_key": api_key,
        }
        
        # Only add base_url if it exists
        if base_url:
            model_kwargs["base_url"] = base_url
            
        return ChatOpenAI(**model_kwargs)

# Create LLM model instance
model = create_llm_model()


class TodoItem(TypedDict):
    """Todo list item structure."""
    step: str
    status: str  # pending, in_progress, completed


def add_human_in_the_loop(
    tool: Callable | BaseTool,
    *,
    interrupt_config: HumanInterruptConfig = None,
) -> BaseTool:
    """Wrap a tool to support human-in-the-loop review."""
    if not isinstance(tool, BaseTool):
        tool = create_tool(tool)

    if interrupt_config is None:
        interrupt_config = {
            "allow_accept": True,
            "allow_edit": True,
            "allow_respond": True,
            "allow_ignore": True,
        }

    @create_tool(
        tool.name,
        description=tool.description,
        args_schema=tool.args_schema
    )
    def call_tool_with_interrupt(config: RunnableConfig, **tool_input):
        request: HumanInterrupt = {
            "action_request": {
                "action": tool.name,
                "args": tool_input
            },
            "config": interrupt_config,
            "description": "Please review the tool call"
        }
        response = interrupt([request])[0]
        # approve the tool call
        if response["type"] == "accept":
            tool_response = tool.invoke(tool_input, config)
        # update tool call args
        elif response["type"] == "edit":
            tool_input = response["args"]["args"]
            tool_response = tool.invoke(tool_input, config)
        # respond to the LLM with user feedback
        elif response["type"] == "response":
            user_feedback = response["args"]
            tool_response = user_feedback
        # ignore the tool call
        elif response["type"] == "ignore":
            tool_response = "Tool call ignored by user."
        else:
            raise ValueError(
                f"Unsupported interrupt response type: {response['type']}"
            )

        return tool_response

    return call_tool_with_interrupt


@create_tool
def create_todo_plan(
    email: str,
    research_topic: str,
    steps: list[str]
) -> str:
    """Create a TODO planning list for the research task.

    Args:
        email: User's email address
        research_topic: The topic to research
        steps: List of steps to complete the research

    Returns:
        Confirmation message with the plan
    """
    plan = f"Research Plan for: {research_topic}\n"
    plan += f"Report will be sent to: {email}\n\n"
    plan += "Steps:\n"
    for i, step in enumerate(steps, 1):
        plan += f"{i}. {step} [PENDING]\n"

    return f"TODO plan created successfully:\n{plan}"


@create_tool
def update_todo_status(
    step_number: int,
    status: Literal["pending", "in_progress", "completed"]
) -> str:
    """Update the status of a TODO item.

    Args:
        step_number: The step number to update
        status: New status (pending, in_progress, completed)

    Returns:
        Confirmation message
    """
    return f"Step {step_number} status updated to: {status.upper()}"


@create_tool
def internet_search(
    query: str,
    max_results: int = 5,
    topic: Literal["general", "news", "finance"] = "general",
    include_raw_content: bool = False,
) -> str:
    """Run a web search using Tavily.

    Args:
        query: Search query
        max_results: Maximum number of results to return
        topic: Search topic category
        include_raw_content: Whether to include raw content

    Returns:
        Search results as formatted string
    """
    results = tavily_client.search(
        query,
        max_results=max_results,
        include_raw_content=include_raw_content,
        topic=topic,
    )

    # Format results
    formatted_results = f"Search results for: {query}\n\n"
    for i, result in enumerate(results.get("results", []), 1):
        formatted_results += f"{i}. {result.get('title', 'No title')}\n"
        formatted_results += f"   URL: {result.get('url', 'No URL')}\n"
        formatted_results += f"   {result.get('content', 'No content')}\n\n"

    return formatted_results


@create_tool
def send_research_email(to: str, subject: str, body: str) -> str:
    """Send research report via email.

    Args:
        to: Recipient email address
        subject: Email subject
        body: Email body with research report

    Returns:
        Confirmation message
    """
    # Email sending logic would go here
    # In production, implement actual email sending (SMTP, SendGrid, etc.)
    email_preview = f"""
Email Preview:
To: {to}
Subject: {subject}
Body Length: {len(body)} characters

{body[:200]}...
"""
    return f"Research report email sent successfully to {to}\n{email_preview}"


# System prompt for the research agent
RESEARCH_AGENT_PROMPT = """You are a research assistant that helps users investigate topics.

Your workflow:
1. When user provides email and research topic, create a TODO plan using create_todo_plan
2. IMPORTANT: After EVERY step completion, update the TODO status using update_todo_status
3. Use internet_search to gather information (you can search multiple times)
4. Compile findings into a comprehensive report
5. Send the report via send_research_email

Remember:
- ALWAYS update TODO status before moving to next step
- Be thorough in your research
- Organize the report clearly with sections
- The TODO plan and email sending require human approval

Current TODO tracking:
- Mark steps as "in_progress" when starting
- Mark steps as "completed" when finished
- This helps track progress throughout the research process
"""

# Create the research agent
agent = create_react_agent(
    model=model,
    tools=[
        add_human_in_the_loop(create_todo_plan),
        update_todo_status,
        internet_search,
        add_human_in_the_loop(send_research_email),
    ],
    prompt=RESEARCH_AGENT_PROMPT,
)
