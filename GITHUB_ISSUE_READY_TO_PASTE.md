# Unified Approvals Inbox

## Feature Request
**Category:** ui
**Priority:** high

### Description

## Business Value

**Problem Statement:**
Currently, users must navigate between different parts of the application to handle various types of approvals:
- **Enrichment approvals** are shown in the Enrichment workbench view
- **HITL interrupts** (like project classification) are shown in the agent chat thread
- **No centralized visibility** into all pending approvals across the system
- **No notification system** to alert users when approvals are waiting

This fragmentation creates friction in the approval workflow, leading to:
- Delayed project starts (users miss classification approvals)
- Incomplete artifact enrichment (users miss enrichment approvals)
- Reduced productivity (users must check multiple locations)
- Poor visibility into pending work

**Business Impact:**
- **Faster project onboarding**: Centralized approvals reduce time-to-first-action
- **Improved completion rates**: Better visibility leads to fewer missed approvals
- **Enhanced user experience**: Single location for all approval tasks
- **Reduced support burden**: Clearer workflow reduces user confusion

## User Stories

### Story 1: Centralized Approval Visibility
**As a project manager, I want to see all pending approvals in one place**

**Priority:** High  
**Acceptance Criteria:**
- All enrichment proposals appear in the Enrichment inbox
- All HITL interrupts (classify_intent, etc.) appear in the Enrichment inbox
- Approvals are clearly categorized by type
- I can see the total count of pending approvals at a glance

**Business Value:** Reduces cognitive load and ensures no approvals are missed

### Story 2: Approval Notifications
**As a user, I want to be notified when approvals are waiting**

**Priority:** High  
**Acceptance Criteria:**
- A notification badge appears on the "Enrichment" tab showing the count of pending approvals
- The badge updates in real-time as approvals are added or resolved
- The badge is visually prominent (red/orange) when count > 0
- The count includes both enrichment proposals and HITL interrupts

**Business Value:** Proactive notification ensures timely action on approvals

### Story 3: Auto-Routing to Approvals
**As a user, I want the system to automatically show me the approvals inbox when new approvals arrive**

**Priority:** Medium  
**Acceptance Criteria:**
- When a new enrichment proposal is created, the UI automatically switches to the Enrichment view
- When a HITL interrupt occurs (e.g., classify_intent), the UI automatically switches to the Enrichment view
- Auto-switching only occurs if the user is not already on the Enrichment view
- The user can manually navigate away if desired

**Business Value:** Reduces friction by bringing approvals to the user's attention immediately

### Story 4: Consistent Approval Interface
**As a user, I want to approve or reject different types of approvals using a consistent interface**

**Priority:** High  
**Acceptance Criteria:**
- Enrichment approvals show artifact metadata and allow artifact type selection
- HITL approvals (classify_intent) show project classification preview and allow approve/reject/edit
- Both types use consistent UI patterns (cards, buttons, status indicators)
- I can process multiple approvals in sequence without leaving the inbox

**Business Value:** Consistent experience reduces learning curve and improves efficiency

### Story 5: Approval Status Feedback
**As a user, I want to see the status of my approval actions**

**Priority:** Medium  
**Acceptance Criteria:**
- Approved items show a success indicator
- Rejected items show a rejection indicator
- Processing states show loading indicators
- Error states show clear error messages

**Business Value:** Clear feedback builds confidence in the system

## Technical Requirements

### Frontend Changes
1. **Extend EnrichmentView Component** - Add HITL interrupt handling alongside enrichment proposals
2. **Create Unified Approval Interface** - ApprovalCard component for both types
3. **Notification Badge System** - useApprovalCount hook and badge component
4. **Auto-Routing Logic** - Watch for new approvals and auto-switch to enrichment view

### Backend Changes
1. **Update classify_intent Tool** - Call set_workbench_view("enrichment") when creating HITL interrupt

## Implementation Phases
- Phase 1: Extend EnrichmentView (Week 1)
- Phase 2: Unified UI (Week 1-2)
- Phase 3: Notification Badge (Week 2)
- Phase 4: Auto-Routing (Week 2)

## Success Metrics
- **Time to First Approval**: Reduce average time from approval creation to user action
- **Approval Completion Rate**: Increase percentage of approvals that are completed (vs. abandoned)
- **User Satisfaction**: Measure via user feedback on approval workflow
- **Support Tickets**: Reduce tickets related to "missing approvals" or "where do I approve?"

## Dependencies
- Stream context must expose `stream.interrupt`
- EnrichmentView must be accessible from workbench
- Backend `set_workbench_view` tool must support "enrichment" view

## Risks & Mitigations
**Risk:** Breaking existing enrichment approval flow  
**Mitigation:** Maintain backward compatibility, extensive testing

**Risk:** Performance issues with real-time updates  
**Mitigation:** Optimize re-renders, use React.memo where appropriate

**Risk:** User confusion with auto-switching  
**Mitigation:** Make auto-switch subtle, allow easy navigation away

## Related Issues
- Issue #12: Harmonize Artifact Ingestion (enrichment approval foundation)

---
*Created via Reflexion Agent*
