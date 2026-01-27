# Unified Approvals Inbox - Implementation Plan

## Overview
Transform the Enrichment view into a unified approvals inbox that handles:
1. **Enrichment Proposals** (existing) - Artifact metadata extraction approvals
2. **HITL Interrupts** (new) - classify_intent and other tool approvals

## Architecture

### Current State
- **EnrichmentView**: Handles enrichment proposals via `pendingArtifactIds` URL param
- **ThreadActionsView**: Handles HITL interrupts in the chat thread
- **Stream Context**: Exposes `stream.interrupt` for pending interrupts

### Target State
- **EnrichmentView**: Unified inbox showing both enrichment proposals AND HITL interrupts
- **Notification Badge**: Count badge on "Enrichment" tab showing total pending approvals
- **Auto-Routing**: Automatically switch to enrichment view when new approvals detected

## Implementation Steps

### Phase 1: Extend EnrichmentView to Handle HITL Interrupts

1. **Update EnrichmentView Types**
   - Add `HITLInterrupt` type alongside `EnrichmentProposal`
   - Create unified `ApprovalItem` type that can be either type
   - Add discriminator field (`type: "enrichment" | "hitl"`)

2. **Hook into Stream Context**
   - Access `stream.interrupt` from `useStreamContext()`
   - Parse interrupt data to extract action requests
   - Filter for `classify_intent` and other relevant tools

3. **Unified Approval List**
   - Display both enrichment proposals and HITL interrupts in same list
   - Group by type with visual distinction
   - Show count of each type

### Phase 2: Create Unified Approval Component

1. **ApprovalCard Component**
   - Generic card that can render either enrichment or HITL approval
   - Props: `item: ApprovalItem`
   - Conditional rendering based on `item.type`

2. **Enrichment Approval Section** (existing, refactor)
   - Artifact type selection
   - Metadata display
   - Approve/Reject/Skip actions

3. **HITL Approval Section** (new)
   - Reuse `ThreadActionsView` logic or create simplified version
   - Display action name, description, args
   - Approve/Reject/Edit actions
   - Handle `stream.submit()` for interrupt resolution

### Phase 3: Notification Badge System

1. **Count Calculation Hook**
   - `useApprovalCount()` hook
   - Counts: `pendingArtifactIds.length + (stream.interrupt ? 1 : 0)`
   - Returns total count

2. **Badge Component**
   - Small badge with count
   - Red/orange when count > 0
   - Positioned on Enrichment tab button

3. **Update Shell.tsx**
   - Import `useApprovalCount` hook
   - Add badge to Enrichment tab button
   - Show count when > 0

### Phase 4: Auto-Routing

1. **Auto-Switch Logic**
   - `useEffect` in `shell.tsx` or `enrichment-view.tsx`
   - Watch for: `pendingArtifactIds.length > 0` OR `stream.interrupt`
   - Auto-switch to enrichment view when detected
   - Only if not already on enrichment view

2. **Backend Integration**
   - Update `classify_intent` tool to call `set_workbench_view("enrichment")`
   - This ensures UI switches to enrichment view when interrupt occurs

### Phase 5: UI/UX Enhancements

1. **Visual Grouping**
   - Section headers: "Enrichment Proposals" and "Pending Approvals"
   - Different card styles for each type
   - Clear visual hierarchy

2. **Empty States**
   - Show appropriate empty state when no approvals
   - Different messages for each type

3. **Status Indicators**
   - Show processing/loading states
   - Success/error feedback

## File Changes

### New Files
- `src/components/workbench/approval-item.tsx` - Unified approval card component
- `src/hooks/use-approval-count.ts` - Hook to calculate pending approval count

### Modified Files
- `src/components/workbench/enrichment-view.tsx` - Extend to handle HITL interrupts
- `src/components/workbench/shell.tsx` - Add notification badge, auto-routing
- `src/components/workbench/enrichment-view.tsx` - Unified approval interface

### Backend Changes (Reflexion repo)
- `reflexion_graph/tools_supervisor.py` - Update `classify_intent` to call `set_workbench_view("enrichment")`

## Data Flow

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

## Testing Checklist

- [ ] Enrichment proposals still work
- [ ] HITL interrupts appear in enrichment view
- [ ] Notification badge shows correct count
- [ ] Auto-switch to enrichment view works
- [ ] Approve/reject actions work for both types
- [ ] Multiple approvals can be handled
- [ ] Empty states display correctly
- [ ] Backend routing works (classify_intent → enrichment view)

## Future Enhancements

- Filter by approval type
- Sort by priority/date
- Bulk approve/reject
- Approval history
- Email notifications for pending approvals
