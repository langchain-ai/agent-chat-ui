# Onboarding Flow Analytics Events

This document outlines all the analytics events implemented for the complete onboarding flow from login to chat screen.

## Event Overview

Total Events Implemented: **21 events** across **5 onboarding steps**

## 1. Login Page Events (4 events)

### `login_page_viewed`
- **Trigger**: When user lands on `/login` page
- **Category**: `onboarding`
- **Parameters**:
  - `page_path`: '/login'
  - `step`: 1
  - `step_name`: 'login'

### `google_login_clicked`
- **Trigger**: When user clicks "Continue with Google" button
- **Category**: `onboarding`
- **Parameters**:
  - `login_method`: 'google_oauth'
  - `step`: 1
  - `step_name`: 'login'

### `login_success`
- **Trigger**: After successful Google OAuth authentication
- **Category**: `onboarding`
- **Parameters**:
  - `login_method`: 'google_oauth'
  - `is_new_user`: boolean
  - `step`: 1
  - `step_name`: 'login'
  - `next_step`: 'profile_confirmation' | 'chat_screen'
  - User properties: `userId`, `email`, `fullName`

### `login_error`
- **Trigger**: When login fails
- **Category**: `onboarding`
- **Parameters**:
  - `login_method`: 'google_oauth'
  - `error_message`: string
  - `step`: 1
  - `step_name`: 'login'

## 2. Profile Confirmation Events (4 events)

### `profile_confirmation_viewed`
- **Trigger**: When new user lands on `/profile-confirmation` page
- **Category**: `onboarding`
- **Parameters**:
  - `page_path`: '/profile-confirmation'
  - `step`: 2
  - `step_name`: 'profile_confirmation'
  - User properties: `userId`, `email`, `fullName`

### `profile_form_filled`
- **Trigger**: When user fills any form field (firstName, lastName, mobileNumber)
- **Category**: `onboarding`
- **Parameters**:
  - `field_name`: string
  - `has_value`: boolean
  - `step`: 2
  - `step_name`: 'profile_confirmation'
  - User properties: `userId`, `email`, `fullName`

### `profile_confirmation_success`
- **Trigger**: When profile update is successful
- **Category**: `onboarding`
- **Parameters**:
  - `has_first_name`: boolean
  - `has_last_name`: boolean
  - `has_mobile_number`: boolean
  - `country_code`: string
  - `step`: 2
  - `step_name`: 'profile_confirmation'
  - `next_step`: 'personalize_travel'
  - User properties: `userId`, `email`, `fullName`

### `profile_confirmation_error`
- **Trigger**: When profile update fails
- **Category**: `onboarding`
- **Parameters**:
  - `error_message`: string
  - `step`: 2
  - `step_name`: 'profile_confirmation'
  - User properties: `userId`, `email`, `fullName`

## 3. Personalize Travel Assistant Events (5 events)

### `personalize_page_viewed`
- **Trigger**: When user lands on `/personalize-travel` page
- **Category**: `onboarding`
- **Parameters**:
  - `page_path`: '/personalize-travel'
  - `step`: 3
  - `step_name`: 'personalize_travel'
  - User properties: `userId`, `email`, `fullName`

### `import_option_selected`
- **Trigger**: When user selects "Import trips & loyalty programs" option
- **Category**: `onboarding`
- **Parameters**:
  - `personalization_method`: 'import'
  - `step`: 3
  - `step_name`: 'personalize_travel'
  - User properties: `userId`, `email`, `fullName`

### `manual_option_selected`
- **Trigger**: When user selects "Set up manually" option
- **Category**: `onboarding`
- **Parameters**:
  - `personalization_method`: 'manual'
  - `step`: 3
  - `step_name`: 'personalize_travel'
  - User properties: `userId`, `email`, `fullName`

### `skip_personalization_clicked`
- **Trigger**: When user clicks "Skip" button
- **Category**: `onboarding`
- **Parameters**:
  - `personalization_method`: 'skipped'
  - `step`: 3
  - `step_name`: 'personalize_travel'
  - `next_step`: 'chat_screen'
  - User properties: `userId`, `email`, `fullName`

### `personalize_continue_clicked`
- **Trigger**: When user clicks "Continue" button
- **Category**: `onboarding`
- **Parameters**:
  - `selected_option`: string
  - `personalization_method`: string
  - `step`: 3
  - `step_name`: 'personalize_travel'
  - `next_step`: 'onboarding_quiz' | 'gmail_integration'
  - User properties: `userId`, `email`, `fullName`

## 4. Onboarding Quiz Events (6 events)

### `quiz_started`
- **Trigger**: When user lands on `/onboarding-quiz` page
- **Category**: `onboarding`
- **Parameters**:
  - `page_path`: '/onboarding-quiz'
  - `step`: 4
  - `step_name`: 'onboarding_quiz'
  - `quiz_step`: 1
  - `quiz_step_name`: 'personal_details'
  - User properties: `userId`, `email`, `fullName`

### `quiz_step_viewed`
- **Trigger**: When user navigates to a new quiz step
- **Category**: `onboarding`
- **Parameters**:
  - `step`: 4
  - `step_name`: 'onboarding_quiz'
  - `quiz_step`: number (1-3)
  - `quiz_step_name`: 'personal_details' | 'travel_style' | 'preferences_loyalty'
  - User properties: `userId`, `email`, `fullName`

### `quiz_field_changed`
- **Trigger**: When user fills any quiz field
- **Category**: `onboarding`
- **Parameters**:
  - `field_name`: string
  - `field_value`: string
  - `has_value`: boolean
  - `step`: 4
  - `step_name`: 'onboarding_quiz'
  - `quiz_step`: number
  - User properties: `userId`, `email`, `fullName`

### `quiz_step_completed`
- **Trigger**: When user clicks "Next" button
- **Category**: `onboarding`
- **Parameters**:
  - `step`: 4
  - `step_name`: 'onboarding_quiz'
  - `quiz_step`: number
  - `quiz_step_name`: string
  - `step_data`: JSON string of step data
  - `next_quiz_step`: number
  - User properties: `userId`, `email`, `fullName`

### `quiz_back_clicked`
- **Trigger**: When user clicks "Back" button
- **Category**: `onboarding`
- **Parameters**:
  - `step`: 4
  - `step_name`: 'onboarding_quiz'
  - `quiz_step`: number
  - `quiz_step_name`: string
  - `previous_quiz_step`: number
  - User properties: `userId`, `email`, `fullName`

### `quiz_completed`
- **Trigger**: When user completes all quiz steps
- **Category**: `onboarding`
- **Parameters**:
  - `step`: 4
  - `step_name`: 'onboarding_quiz'
  - `gender`: string
  - `has_date_of_birth`: boolean
  - `has_passport`: string
  - `travel_frequency`: string
  - `travel_purposes`: string (comma-separated)
  - `travel_companions`: string (comma-separated)
  - `travel_purposes_count`: number
  - `travel_companions_count`: number
  - `loyalty_programs`: string (comma-separated)
  - `loyalty_programs_count`: number
  - `currency`: string
  - `language`: string
  - `next_step`: 'chat_screen'
  - User properties: `userId`, `email`, `fullName`

## 5. Onboarding Completion Events (2 events)

### `onboarding_completed`
- **Trigger**: When entire onboarding flow is completed
- **Category**: `onboarding`
- **Parameters**:
  - `total_steps`: number
  - `completed_steps`: string (comma-separated)
  - `skipped_steps`: string (comma-separated)
  - `completion_rate`: number (percentage)
  - `time_spent`: number (seconds, optional)
  - `final_step`: 'chat_screen'
  - User properties: `userId`, `email`, `fullName`

### `chat_screen_reached`
- **Trigger**: When user reaches the main chat interface
- **Category**: `onboarding`
- **Parameters**:
  - `source`: 'onboarding_complete' | 'existing_user' | 'skip_personalization'
  - `page_path`: '/'
  - `final_destination`: true
  - User properties: `userId`, `email`, `fullName`

## Implementation Details

### User Properties
All events automatically include user properties when available:
- `userId`: User's unique identifier
- `email`: User's email address
- `fullName`: User's full name

### Event Categories
All onboarding events use the category `onboarding` for easy filtering in Google Analytics.

### Error Handling
All analytics functions include proper error handling and will not break the user experience if Google Analytics is unavailable.

### Testing
Events can be tested by:
1. Opening browser developer console
2. Navigating through the onboarding flow
3. Checking console logs for "✅ [Event] tracked" messages
4. Verifying events in Google Analytics Real-time reports

## Files Modified
- `src/services/analyticsService.ts` - Added all analytics functions
- `src/components/auth/Login.tsx` - Added login events
- `src/components/auth/ProfileConfirmation.tsx` - Added profile events
- `src/components/auth/PersonalizeTravelAssistant.tsx` - Added personalization events
- `src/components/auth/OnboardingQuiz.tsx` - Added quiz events
