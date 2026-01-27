# What's New in Reflexion

Stay up to date with the latest features and improvements.

---

## v1.5.0 - Customer Onboarding Complete - Unified Artifact Ingestion

**Release Date:** January 26, 2026

### Overview

As a Customer Administrator working with a Context Enrichment Agent, I want a unified, streamlined system to ingest and enrich organizational artifacts (documents, standards, SOPs, methodologies) through a consistent workflow, so that my organization's domain knowledge and methodologies are efficiently captured, accurately categorized, and seamlessly integrated into the knowledge graph to inform the Concept → Design → Operations loop.

This release completes Issue #12 and marks the completion of the Customer Onboarding experience, ready for the Concept, Design, and Operate cycle.

### New Features

#### Folder Upload Support
Upload multiple files at once via ZIP file or multi-file selection. Supports batch processing of documents with automatic artifact creation and metadata extraction. Each file is processed individually with progress tracking.

#### Automatic Enrichment Extraction
LLM-powered metadata extraction runs automatically when files are uploaded. Extracts category, title, artifact types, key concepts, relationships, and summary. Enrichment proposals are immediately available for review without manual triggering.

#### Enrichment Approval Workflow
Dedicated workbench tab for reviewing and approving enrichment proposals. Select artifact types (PRD, SOP, Architecture, Requirements, etc.) for each uploaded document. Approve/reject/skip actions with visual status indicators. Automatically switches to enrichment view after uploads.

#### Knowledge Graph Integration
Approved enrichments are automatically linked to the Knowledge Graph, creating new artifact nodes and relationships. Each approval generates a new KG version tracked via GitHub commit history. Commit messages provide meaningful version descriptions.

#### Enhanced Workbench Layout
Collapsible project sidebar, resizable agent chat panel, and improved space utilization. Agent chat moved to bottom panel with draggable divider. More room for workbench content while keeping agent interaction accessible.

#### Improved Project Management
Meaningful project names extracted from classification reasoning or trigger descriptions. UUIDs formatted as friendly 'Project {shortId}' names. Better organization and identification of projects in the sidebar.

#### GitHub-Native Versioning
Knowledge Graph versioning now uses GitHub commit history instead of separate version files. Commit messages displayed as friendly version names. Timeline view shows all KG versions with full commit metadata including author and timestamp.

#### Bug Fixes & Stability
Fixed D3 force simulation errors for missing nodes in map view. Improved error handling and logging throughout enrichment flow. Better project_id lookup using thread_id from query parameters. Enhanced endpoint routing for enrichment operations.

### Business Value

#### Accelerated Onboarding
Reduce time-to-value by enabling bulk ingestion of organizational knowledge assets through folder uploads and batch processing.

#### Improved Accuracy
Human-in-the-loop approval ensures correct categorization and prevents knowledge graph pollution through structured artifact type selection.

#### Iterative Refinement
Support evolving understanding through multiple enrichment cycles as context deepens, allowing re-enrichment and refinement of metadata.

#### Audit Trail
Version history provides transparency and enables rollback for compliance and quality assurance. GitHub commit history tracks all KG changes with meaningful commit messages.

#### Unified Experience
Single workflow for both text-based and file-based artifacts reduces cognitive load and training time. Consistent path structure and metadata format across all ingestion methods.

---

## v1.4.0 - Unified Observability & GitHub-Native Persistence

**Release Date:** January 21, 2026

### Overview

Major observability upgrade with end-to-end distributed tracing and GitHub API-based data persistence, eliminating dependency on local file system and git operations.

### New Features

#### OpenTelemetry & LangSmith Integration
Full end-to-end distributed tracing from frontend through backend to LangGraph. Client-side OpenTelemetry Web SDK captures thread operations and HTTP requests, with automatic trace context propagation via traceparent headers. All traces unified in LangSmith for comprehensive observability.

#### GitHub-Native File Storage
Branding and project model data now persist directly via GitHub Contents API (similar to GitHub issues), eliminating reliance on local file writes and git commits. Automatic fallback to MCP git server when GitHub storage is disabled. Controlled by USE_GITHUB_STORAGE environment variable.

#### Thread-Aware Tracing
Enhanced trace correlation with thread ID extraction from URL paths, query parameters, and request bodies. Thread IDs automatically included in LangSmith metadata for unified diagnostics across frontend, proxy, and LangGraph operations.

#### AI Trace Compatibility
Client-side spans include placeholder GenAI and LLM attributes (gen_ai.*, llm.*) to mimic AI traces, ensuring proper recognition and processing by LangSmith's OpenTelemetry endpoint. All LangSmith-recognized attributes configured per official documentation.

#### Server-Side Next.js Instrumentation
Automatic server-side OpenTelemetry instrumentation for Next.js API routes, capturing HTTP method, route, target, and status code. Nested span visualization for complete request lifecycle tracking.

#### Proxy Trace Context Propagation
Proxy server extracts and propagates OpenTelemetry trace context from client requests, creating proxy.request spans as children of client spans. Explicit OTEL trace/span ID injection into LangGraph metadata for seamless correlation.

---

## v1.3.0 - Rich Versioning & Human-in-the-Loop Diff Review

**Release Date:** January 20, 2026

### Overview

Major upgrade bringing full historical visibility, semantic diffs, and enhanced model stability.

### New Features

#### Artifact & KG Versioning
Explorable history for artifacts and Knowledge Graph (KG vX badge). View past iterations directly in the sidebar with read-only previews.

#### Advanced Diff Review
Rich Human-in-the-Loop (HITL) approval flow. New nodes are highlighted in Green, modified in Amber, and removed in Red. AI-generated semantic summaries for large changes.

#### Commit History Integration
Knowledge Graph versioning now uses GitHub commit history instead of separate version files. Commit messages displayed as friendly version names with SHA as secondary text. Timeline view shows all KG versions with commit metadata.

#### Diff Visualization
Visual comparison of Knowledge Graph versions with color-coded nodes (green for added, yellow for modified, red for removed). Diff summary shows counts of changes. Full dataset loaded for accurate comparison.
