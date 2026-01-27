# Reflexion Architecture Documentation

This document provides comprehensive architecture views of the Reflexion system, complementing the C4 architecture with entity-level and data model perspectives.

## Table of Contents

1. [Entity Relationship Diagram](#entity-relationship-diagram)
2. [C4 Architecture Summary](#c4-architecture-summary)
3. [Data Flow Architecture](#data-flow-architecture)
4. [Storage Architecture](#storage-architecture)

---

## Entity Relationship Diagram

The following diagram shows the key entities and their relationships across agent-chat-ui, Reflexion, and the World/Customer Model systems.

```mermaid
erDiagram
    %% ============================================
    %% AGENT-CHAT-UI ENTITIES
    %% ============================================
    
    User ||--o{ Thread : "creates"
    User ||--o{ Organization : "belongs_to"
    Organization ||--o{ Project : "owns"
    Organization ||--o{ Branding : "has"
    Organization ||--o{ User : "contains"
    
    Thread ||--o{ Message : "contains"
    Thread ||--|| Project : "associated_with"
    Thread {
        string thread_id PK
        string project_id FK
        string user_email FK
        string status
        datetime created_at
    }
    
    Message ||--o{ ContentBlock : "contains"
    Message {
        string message_id PK
        string thread_id FK
        string type "human|ai|tool|system"
        json content
        datetime timestamp
    }
    
    ContentBlock {
        string block_id PK
        string message_id FK
        string type "text|image|file"
        string content
        string mime_type
    }
    
    Project ||--o{ Artifact : "contains"
    Project {
        string project_id PK
        string organization_id FK
        string name
        string world_map_version
        datetime created_at
    }
    
    Artifact ||--o{ ArtifactVersion : "has"
    Artifact ||--o{ EnrichmentProposal : "has"
    Artifact {
        string artifact_id PK
        string project_id FK
        string filename
        string content_type "text|binary"
        string sha256
        json metadata
        datetime created_at
    }
    
    ArtifactVersion {
        string version_id PK
        string artifact_id FK
        string filename
        string sha256
        datetime timestamp
        string created_by
    }
    
    EnrichmentProposal {
        string proposal_id PK
        string artifact_id FK
        string extracted_category "method|domain|standard"
        string extracted_title
        array artifact_types "PRD|SOP|Architecture|Requirements|Design|Test Plan|User Guide"
        array key_concepts
        array relationships
        string summary
        string status "pending|approved|rejected"
    }
    
    %% ============================================
    %% REFLEXION ENTITIES
    %% ============================================
    
    ReflexionState ||--|| Thread : "tracks"
    ReflexionState ||--o| Trigger : "oriented_by"
    ReflexionState ||--o{ Node : "references"
    ReflexionState {
        string state_id PK
        string thread_id FK
        array messages
        string current_trigger_id FK
        float confidence_score
        array required_artifacts
        array governing_mechanisms
        array active_risks
        string user_project_description
        string active_agent "supervisor|hydrator"
        string workbench_view "map|workflow|artifacts|discovery|settings"
    }
    
    Trigger {
        string trigger_id PK "e.g., O1, O2"
        string name
        string type "REQ"
        json properties
    }
    
    %% ============================================
    %% WORLD/CUSTOMER MODEL ENTITIES
    %% ============================================
    
    BaseModel ||--o{ Node : "contains"
    BaseModel ||--o{ Link : "contains"
    BaseModel {
        string model_id PK "BaseModel.json"
        string version "4.0.0"
        string description
        boolean triangular_traceability
        string fml_coverage
        string artifact_coverage
    }
    
    CustomerModel ||--o{ Node : "contains"
    CustomerModel ||--o{ Link : "contains"
    CustomerModel ||--|| Project : "belongs_to"
    CustomerModel ||--|| BaseModel : "derived_from"
    CustomerModel {
        string model_id PK "WorldMap.json"
        string project_id FK
        string organization_id FK
        string version "1.0.0"
        string base_model_version
        string focus_trigger_id FK
        string customization
        datetime created_at
        string commit_sha "GitHub version"
    }
    
    Node ||--o{ Link : "source"
    Node ||--o{ Link : "target"
    Node ||--o{ EnrichmentProposal : "linked_by"
    Node {
        string node_id PK "e.g., O1, ART-1, D-OPP, M-001, FM-001"
        string name
        string type "REQ|ARTIFACT|DOMAIN|MECH|CRIT"
        json properties
        boolean is_active
        string methodology "enriched context"
    }
    
    Link {
        string link_id PK
        string source_id FK
        string target_id FK
        string relationship_type "requires|governs|mitigates|enables|etc"
        json properties
    }
    
    %% ============================================
    %% RBAC ENTITIES
    %% ============================================
    
    Organization ||--o{ UserAssignment : "has"
    UserAssignment ||--|| Role : "assigned"
    Role ||--o{ Permission : "grants"
    
    UserAssignment {
        string email PK
        string organization_id FK
        array role_keys
    }
    
    Role {
        string role_key PK "reflexion_admin|project_manager|viewer"
        string name
        array permissions
    }
    
    Permission {
        string permission_key PK "read|write|delete|approve|*"
    }
    
    %% ============================================
    %% RELATIONSHIPS
    %% ============================================
    
    Project ||--|| CustomerModel : "has"
    Trigger ||--o{ Node : "activates"
    Node ||--o{ Artifact : "represents"
    EnrichmentProposal ||--o{ Node : "links_to"
```

### Key Entity Groups

#### Agent-Chat-UI Entities
- **User**: Authenticated users linked to Organizations
- **Thread**: Conversation sessions associated with Projects
- **Message**: Individual messages with multimodal ContentBlocks
- **Project**: Work containers with associated CustomerModel
- **Artifact**: Uploaded documents with versioning and enrichment

#### Reflexion Entities
- **ReflexionState**: Workflow state tracking orientation, artifacts, mechanisms, risks
- **Trigger**: Orientation points (e.g., O1 = Market-pull innovation)

#### World/Customer Model Entities
- **BaseModel**: The "Universe" model (BaseModel.json v4.0.0)
- **CustomerModel**: Project-specific filtered views via "Universe Tagging"
- **Node**: Knowledge graph entities (REQ, ARTIFACT, DOMAIN, MECH, CRIT)
- **Link**: Relationships maintaining graph structure and traceability

#### RBAC Entities
- **Organization**: Multi-tenant isolation boundary
- **UserAssignment**: Maps users to organizations and roles
- **Role**: Permission sets (reflexion_admin, project_manager, viewer)
- **Permission**: Granular access control

---

## C4 Architecture Summary

### System Context

The Reflexion platform manages the transition from ambiguous project ideas to structured product development plans through identity-aware agents.

**External Dependencies:**
- Google OAuth (Identity)
- Anthropic API (Reasoning Engine)
- GitHub API (File Storage & Issues)
- LangSmith (Observability)
- PostgreSQL (Checkpointer/State Persistence)
- Redis (Background Tasks)

### Container & Component Diagram

```mermaid
graph TD
    subgraph "Browser (Next.js)"
        UI[Thread UI / Agent Inbox]
        TP[Thread Provider]
        Art[Artifact Viewer]
    end

    subgraph "Proxy Layer (Python/FastAPI)"
        SEC[Security Middleware: OAuth/Google]
        PE[Persistence Engine: Identity Injection]
        DOC[Document Upload: Bronze Layer]
        OTEL[OpenTelemetry: Trace Propagation]
    end
    
    subgraph "Storage Layer (GitHub API)"
        GFS[GitHub File Storage]
        BRONZE[Bronze Documents]
        PROJ[Project Models]
        BRAND[Branding Config]
    end

    subgraph "Agent Service (LangGraph)"
        subgraph "Supervisor Agent (Alignment Pattern)"
            Soft[Intent Identification]
            Sens[Sensitive Action Node]
        end
        
        subgraph "Hydrator Agent (Methodology Pattern)"
            Deep[Deep Ingestion]
            Plan[Methodology Synthesis]
            DOCLINK[Document Artifact Typing]
        end
        
        State[(ReflexionState / Checkpointer)]
    end

    %% Flow and Terminology Mapping
    User -- "OAuth Token" --> SEC
    SEC -- "Authenticated Metadata" --> PE
    PE -- "Configurable Context" --> State
    UI -- "Thread Action Approval" --> Sens
    UI -- "PDF Upload" --> DOC
    DOC -- "Bronze Storage" --> BRONZE
    BRONZE -- "Document Metadata" --> DOCLINK
    Sens -- "Authorized Handoff" --> Deep
    Sens -- "Trace Context" --> OTEL
    OTEL -- "LangSmith" --> State
    Soft -- "Generative UI (HTML)" --> Art
    Deep -- "Workflow Viz" --> Art
    PE -- "GitHub API" --> GFS
    GFS --> BRONZE
    GFS --> PROJ
    GFS --> BRAND
```

### Key Components

#### Supervisor Agent (Strategic Intent Alignment)
- **Mission**: Map project descriptions to valid methodology triggers
- **Movements**: 
  - Soft Proposal: Non-interrupting Knowledge Graph render
  - Authorized State Transition: `classify_intent` via `sensitive_tool_node` with mandatory `interrupt()`

#### Hydrator Agent (Deep Methodology Ingestion)
- **Mission**: Bridge "Orientation" to iterative "Concept → Design → Operations" loop
- **Movements**:
  - Workflow Visualization: Updates `active_node` showing progression
  - Persistence Sync: Uses `save_external_context` for customer-specific knowledge
  - Document Artifact Typing: Links uploaded documents to artifact types (PRD, SOP, Architecture, etc.)

#### Proxy (Identity Guardrail)
- **Mission**: Enforce multi-tenancy and security
- **Movements**:
  - Identity Extraction: Injects `user_id` and `customer_id` from Google OAuth
  - Path Enforcement: Ensures customer-specific directory structure
  - Document Upload: `/documents/upload` endpoint for bronze layer persistence
  - Trace Propagation: OpenTelemetry context propagation

#### GitHub File Storage (Direct API Persistence)
- **Mission**: Unified persistence via GitHub Contents API
- **Scope**: Branding configs, project models, bronze document storage
- **Bronze Layer**: Immutable raw documents at `data/organizations/{customer_id}/projects/{thread_id}/documents/bronze/{document_id}/`

---

## Data Flow Architecture

### Artifact Ingestion Flow

```mermaid
sequenceDiagram
    participant User
    participant UI as Agent Chat UI
    participant Proxy
    participant Hydrator
    participant Enrichment
    participant GitHub
    participant KG as Knowledge Graph

    User->>UI: Upload Document(s)
    UI->>Proxy: POST /documents/upload
    Proxy->>GitHub: Store Bronze Layer
    GitHub-->>Proxy: Confirmation
    Proxy->>Hydrator: Trigger Enrichment
    Hydrator->>Enrichment: Extract Metadata (LLM)
    Enrichment-->>Hydrator: Enrichment Proposal
    Hydrator->>UI: Display for Approval
    User->>UI: Approve/Reject Enrichment
    UI->>Hydrator: Approval Decision
    Hydrator->>GitHub: Store Artifact + Metadata
    Hydrator->>KG: Link to Knowledge Graph
    KG->>GitHub: Create New KG Version (Commit)
    GitHub-->>UI: Version SHA
    UI->>User: Show Updated KG
```

### Workflow Lifecycle

1. **Orientation (Supervisor)**: Analyze project scope, identify methodology triggers
2. **Approval (HITL)**: User reviews proposed model via Agent Inbox
3. **Hydration (Hydrator)**: Inject methodology, gather customer context
   - Accept document uploads (bronze layer)
   - Link documents to artifact types
4. **Concept**: Define high-level concepts and requirements
5. **Design**: Create detailed design specifications
6. **Operations**: Implement and operationalize
7. **Loop**: Return to Concept for iterative refinement

---

## Storage Architecture

### GitHub Repository Structure

```
data/
├── organizations.json                    # Global organization list
├── organizations/
│   ├── {org_id}/
│   │   ├── users.json                    # User assignments
│   │   ├── branding.json                 # Organization branding
│   │   └── projects/
│   │       ├── {project_id}/
│   │       │   ├── WorldMap.json         # Customer Model (versioned via commits)
│   │       │   └── artifacts/
│   │       │       └── {artifact_id}/
│   │       │           ├── content.{ext} # Current artifact content
│   │       │           ├── metadata.json  # Artifact metadata + versions
│   │       │           └── versions/     # Version snapshots
│   │       │               └── v{timestamp}_{hash}.{ext}
│   │       └── documents/
│   │           └── bronze/               # Immutable raw documents
│   │               └── {document_id}/
│   │                   └── {filename}
```

### Versioning Strategy

- **CustomerModel (WorldMap)**: GitHub commit SHA-based versioning
  - Each KG update creates a new commit
  - Commit messages provide meaningful version descriptions
  - Timeline view shows all versions with full metadata

- **Artifact**: Timestamp-based version IDs
  - Format: `v{YYYYMMDD}_{HHMMSS}_{hash}`
  - Versions stored in `versions/` subdirectory
  - Metadata tracks version history in `metadata.json`

- **BaseModel**: Semantic versioning (currently 4.0.0)
  - Full structural model with all nodes and links
  - Customer models derived via "Universe Tagging"

### Multi-Tenant Isolation

- **Organization-level**: All data scoped to `{org_id}`
- **Project-level**: Projects isolated within organizations
- **User-level**: RBAC controls access via roles and permissions
- **Path Enforcement**: Proxy ensures all operations respect tenant boundaries

---

## Key Relationships

1. **User → Thread → Message**: Conversation flow
2. **Organization → Project → CustomerModel**: Multi-tenant isolation
3. **BaseModel → CustomerModel**: Universe tagging creates customer-specific views
4. **Trigger → Node**: Orientation activates relevant nodes
5. **Artifact → EnrichmentProposal → Node**: Artifacts linked to KG via enrichment
6. **CustomerModel → Node → Link**: Graph structure
7. **Artifact → ArtifactVersion**: Version history tracking

---

## Observability Architecture

### OpenTelemetry Integration

- **Client-Side**: OpenTelemetry Web SDK in Next.js
  - Captures thread operations and HTTP requests
  - Includes LangSmith attributes (`langsmith.trace.name`, `langsmith.span.kind`)
  
- **Trace Propagation**: `traceparent`/`tracestate` headers
  - Propagated from frontend through proxy to LangGraph
  - Unified trace correlation across all layers

- **Backend Integration**: LangGraph metadata enriched with OTEL trace/span IDs
  - All traces unified in LangSmith
  - End-to-end distributed tracing for diagnostics

---

*This architecture documentation is maintained alongside the codebase and reflects the current system design as of the latest release.*
