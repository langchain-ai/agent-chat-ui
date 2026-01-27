# Feature Request: Unified Approvals Inbox

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

---

## User Stories

### Epic: Unified Approvals Experience

#### Story 1: As a project manager, I want to see all pending approvals in one place
**Priority:** High  
**Acceptance Criteria:**
- [ ] All enrichment proposals appear in the Enrichment inbox
- [ ] All HITL interrupts (classify_intent, etc.) appear in the Enrichment inbox
- [ ] Approvals are clearly categorized by type
- [ ] I can see the total count of pending approvals at a glance

**Business Value:** Reduces cognitive load and ensures no approvals are missed

---

#### Story 2: As a user, I want to be notified when approvals are waiting
**Priority:** High  
**Acceptance Criteria:**
- [ ] A notification badge appears on the "Enrichment" tab showing the count of pending approvals
- [ ] The badge updates in real-time as approvals are added or resolved
- [ ] The badge is visually prominent (red/orange) when count > 0
- [ ] The count includes both enrichment proposals and HITL interrupts

**Business Value:** Proactive notification ensures timely action on approvals

---

#### Story 3: As a user, I want the system to automatically show me the approvals inbox when new approvals arrive
**Priority:** Medium  
**Acceptance Criteria:**
- [ ] When a new enrichment proposal is created, the UI automatically switches to the Enrichment view
- [ ] When a HITL interrupt occurs (e.g., classify_intent), the UI automatically switches to the Enrichment view
- [ ] Auto-switching only occurs if the user is not already on the Enrichment view
- [ ] The user can manually navigate away if desired

**Business Value:** Reduces friction by bringing approvals to the user's attention immediately

---

#### Story 4: As a user, I want to approve or reject different types of approvals using a consistent interface
**Priority:** High  
**Acceptance Criteria:**
- [ ] Enrichment approvals show artifact metadata and allow artifact type selection
- [ ] HITL approvals (classify_intent) show project classification preview and allow approve/reject/edit
- [ ] Both types use consistent UI patterns (cards, buttons, status indicators)
- [ ] I can process multiple approvals in sequence without leaving the inbox

**Business Value:** Consistent experience reduces learning curve and improves efficiency

---

#### Story 5: As a user, I want to see the status of my approval actions
**Priority:** Medium  
**Acceptance Criteria:**
- [ ] Approved items show a success indicator
- [ ] Rejected items show a rejection indicator
- [ ] Processing states show loading indicators
- [ ] Error states show clear error messages

**Business Value:** Clear feedback builds confidence in the system

---

## Technical Requirements

### Frontend Changes

1. **Extend EnrichmentView Component**
   - Add HITL interrupt handling alongside enrichment proposals
   - Create unified `ApprovalItem` type with discriminator
   - Hook into `stream.interrupt` from stream context
   - Display both types in a unified list

2. **Create Unified Approval Interface**
   - `ApprovalCard` component that handles both enrichment and HITL types
   - Reuse existing enrichment approval logic
   - Integrate HITL approval logic (simplified from ThreadActionsView)
   - Consistent styling and interaction patterns

3. **Notification Badge System**
   - `useApprovalCount()` hook to calculate pending approvals
   - Badge component for the Enrichment tab
   - Real-time updates as approvals change

4. **Auto-Routing Logic**
   - Watch for new approvals in shell.tsx
   - Auto-switch to enrichment view when detected
   - Respect user's current view (don't interrupt if already on enrichment)

### Backend Changes

1. **Update classify_intent Tool**
   - Call `set_workbench_view("enrichment")` when creating HITL interrupt
   - Ensure UI switches to enrichment view automatically

2. **Enrichment Endpoints** (no changes needed)
   - Existing endpoints continue to work
   - Enrichment proposals already flow to EnrichmentView

### Data Flow

```
Backend (classify_intent)
  ↓
Creates HITL interrupt
  ↓
Calls set_workbench_view("enrichment")
  ↓
Frontend Stream Context
  ↓
stream.interrupt populated
  ↓
EnrichmentView detects interrupt
  ↓
Displays in unified inbox
  ↓
User approves/rejects
  ↓
stream.submit() resolves interrupt
```

---

## Success Metrics

- **Time to First Approval**: Reduce average time from approval creation to user action
- **Approval Completion Rate**: Increase percentage of approvals that are completed (vs. abandoned)
- **User Satisfaction**: Measure via user feedback on approval workflow
- **Support Tickets**: Reduce tickets related to "missing approvals" or "where do I approve?"

---

## Implementation Phases

### Phase 1: Extend EnrichmentView (Week 1)
- Add HITL interrupt handling
- Create unified approval types
- Basic display of both types

### Phase 2: Unified UI (Week 1-2)
- Create ApprovalCard component
- Integrate HITL approval logic
- Consistent styling

### Phase 3: Notification Badge (Week 2)
- Create useApprovalCount hook
- Add badge to Enrichment tab
- Real-time updates

### Phase 4: Auto-Routing (Week 2)
- Implement auto-switch logic
- Update backend classify_intent
- Testing and refinement

---

## Dependencies

- Stream context must expose `stream.interrupt`
- EnrichmentView must be accessible from workbench
- Backend `set_workbench_view` tool must support "enrichment" view

---

## Risks & Mitigations

**Risk:** Breaking existing enrichment approval flow  
**Mitigation:** Maintain backward compatibility, extensive testing

**Risk:** Performance issues with real-time updates  
**Mitigation:** Optimize re-renders, use React.memo where appropriate

**Risk:** User confusion with auto-switching  
**Mitigation:** Make auto-switch subtle, allow easy navigation away

---

## Future Enhancements

- Filter by approval type
- Sort by priority/date
- Bulk approve/reject
- Approval history/audit trail
- Email notifications for pending approvals
- Approval delegation/assignment

---

## Related Issues

- Issue #12: Harmonize Artifact Ingestion (enrichment approval foundation)
- Future: Approval workflow automation
- Future: Multi-user approval workflows
