# Analytics Events Troubleshooting Guide

This guide helps identify and fix common issues with the onboarding analytics events implementation.

## Quick Verification Steps

### 1. Check Analytics Setup
```javascript
// In browser console
window.analyticsDebugger.checkSetup()
```

### 2. Enable Event Debugging
```javascript
// In browser console
window.analyticsDebugger.enable()
```

### 3. View Captured Events
```javascript
// In browser console
window.analyticsDebugger.getEvents()
```

### 4. Test All Events
Visit: `http://localhost:3000/test-analytics` (development only)

## Common Issues and Solutions

### Issue 1: Events Not Firing
**Symptoms**: No console logs, no events in GA Real-time

**Possible Causes**:
- Google Analytics script not loaded
- gtag function not available
- Network connectivity issues
- Ad blockers blocking GA

**Solutions**:
1. Check if GA script is loaded:
   ```javascript
   document.querySelector('script[src*="googletagmanager.com"]')
   ```

2. Check if gtag is available:
   ```javascript
   typeof window.gtag === 'function'
   ```

3. Check dataLayer:
   ```javascript
   Array.isArray(window.dataLayer)
   ```

4. Disable ad blockers temporarily
5. Check browser network tab for blocked requests

### Issue 2: Events Firing But Not Appearing in GA
**Symptoms**: Console logs show events, but GA Real-time shows nothing

**Possible Causes**:
- Wrong GA Measurement ID
- Events filtered out by GA
- Real-time reporting delay
- Debug mode enabled

**Solutions**:
1. Verify GA Measurement ID in `src/app/layout.tsx`
2. Check GA Real-time reports (can take 1-2 minutes)
3. Verify events in GA DebugView (if debug mode enabled)
4. Check GA property settings for filters

### Issue 3: Some Events Missing
**Symptoms**: Some events work, others don't

**Possible Causes**:
- Component lifecycle issues
- Conditional rendering
- Navigation interrupting events
- Error in event parameters

**Solutions**:
1. Check browser console for JavaScript errors
2. Verify component mounting with React DevTools
3. Add delays before navigation:
   ```javascript
   trackEvent();
   setTimeout(() => navigate(), 100);
   ```

### Issue 4: User Properties Not Set
**Symptoms**: Events fire but user properties missing

**Possible Causes**:
- User not authenticated
- JWT token expired
- Auth service errors

**Solutions**:
1. Check authentication status:
   ```javascript
   import { isAuthenticated } from '@/services/authService';
   console.log('Authenticated:', isAuthenticated());
   ```

2. Check user data:
   ```javascript
   import { getUserAnalyticsData } from '@/services/analyticsService';
   console.log('User data:', getUserAnalyticsData());
   ```

### Issue 5: Events Firing Multiple Times
**Symptoms**: Duplicate events in GA

**Possible Causes**:
- Component re-mounting
- Multiple event listeners
- React Strict Mode (development)

**Solutions**:
1. Use useEffect with empty dependency array
2. Add cleanup functions
3. Check for duplicate imports
4. Disable React Strict Mode temporarily

## Development vs Production

### Development Mode
- Analytics debugger available
- Test page accessible at `/test-analytics`
- Detailed console logging
- Event retry mechanism active

### Production Mode
- Debugger disabled
- Test page returns 404
- Minimal console logging
- Standard event tracking

## Event Verification Checklist

### Login Events ✓
- [ ] `login_page_viewed` - Page load
- [ ] `google_login_clicked` - Button click
- [ ] `login_success` - OAuth success
- [ ] `login_error` - OAuth failure

### Profile Confirmation Events ✓
- [ ] `profile_confirmation_viewed` - Page load
- [ ] `profile_form_filled` - Field changes
- [ ] `profile_confirmation_success` - Form submit success
- [ ] `profile_confirmation_error` - Form submit error

### Personalize Travel Events ✓
- [ ] `personalize_page_viewed` - Page load
- [ ] `import_option_selected` - Option selection
- [ ] `manual_option_selected` - Option selection
- [ ] `skip_personalization_clicked` - Skip button
- [ ] `personalize_continue_clicked` - Continue button

### Quiz Events ✓
- [ ] `quiz_started` - Page load
- [ ] `quiz_step_viewed` - Step navigation
- [ ] `quiz_field_changed` - Field changes
- [ ] `quiz_step_completed` - Next button
- [ ] `quiz_back_clicked` - Back button
- [ ] `quiz_completed` - Final submission

### Completion Events ✓
- [ ] `onboarding_completed` - Flow completion
- [ ] `chat_screen_reached` - Final destination

## Google Analytics Configuration

### Required Setup
1. GA4 Property created
2. Measurement ID: `G-SLRTVD2EYS`
3. Enhanced measurement disabled for forms
4. Real-time reporting enabled

### Event Parameters
All events include:
- `event_category`: 'onboarding'
- `event_label`: Descriptive label
- `step`: Onboarding step number
- `step_name`: Step identifier

### User Properties
When authenticated:
- `user_id`: User's unique ID
- `user_email`: User's email
- `user_name`: User's full name

## Testing Commands

### Browser Console Commands
```javascript
// Check setup
window.analyticsDebugger.checkSetup()

// Enable debugging
window.analyticsDebugger.enable()

// View events
window.analyticsDebugger.getEvents()

// Clear events
window.analyticsDebugger.clearEvents()

// Disable debugging
window.analyticsDebugger.disable()
```

### Manual Event Testing
```javascript
// Test individual events
import { trackLoginPageViewed } from '@/services/analyticsService';
trackLoginPageViewed();
```

## Support

If issues persist:
1. Check browser console for errors
2. Verify network requests in DevTools
3. Test with different browsers
4. Check GA property configuration
5. Review implementation in affected components

## Files to Check
- `src/services/analyticsService.ts` - Event functions
- `src/app/layout.tsx` - GA setup
- `src/utils/analyticsDebugger.ts` - Debug utilities
- Component files for event calls
