# Widget Internationalization (i18n) Guide

This guide provides comprehensive instructions for implementing internationalization in React widget components, adding new languages, and maintaining translations.

## Overview

The i18n system uses:
- **Translation Hook**: `useTranslations` from `@/hooks/useTranslations`
- **Translation Files**: JSON files organized by language in `src/locales/`
- **Language Detection**: Automatic detection from URL pathname
- **Supported Languages**: English (en), French (fr), Hindi (hi)

## File Structure

```
src/
├── locales/
│   ├── english/
│   │   ├── searchCriteriaWidget.json
│   │   ├── flightOptionsWidget.json
│   │   └── reviewWidget.json
│   ├── french/
│   │   ├── searchCriteriaWidget.json
│   │   ├── flightOptionsWidget.json
│   │   └── reviewWidget.json
│   └── hindi/
│       ├── searchCriteriaWidget.json
│       ├── flightOptionsWidget.json
│       └── reviewWidget.json
├── hooks/
│   └── useTranslations.ts
└── utils/
    └── i18n.ts
```

## Step 1: Adding i18n to a New Widget

### 1.1 Import the Translation Hook

```typescript
import { useTranslations } from '@/hooks/useTranslations';
```

### 1.2 Initialize Translations in Component

```typescript
const YourWidget = (props) => {
  // Initialize translations with widget name
  const { t } = useTranslations('yourWidgetName');
  
  // Rest of your component logic
};
```

### 1.3 Replace Hardcoded Strings

Replace hardcoded strings with translation keys:

```typescript
// Before
<button>Search flights</button>
<p>No flights available</p>

// After
<button>{t('button.searchFlights')}</button>
<p>{t('messages.noFlightsAvailable')}</p>
```

### 1.4 Use Fallback Values

Always provide fallback values for better development experience:

```typescript
// With fallback
<button>{t('button.searchFlights', 'Search flights')}</button>

// For dynamic content
{flightData.stops === 0 
  ? t('flightInfo.nonStop', 'Non-stop') 
  : `${flightData.stops} ${flightData.stops > 1 
      ? t('flightInfo.stops', 'stops') 
      : t('flightInfo.stop', 'stop')}`
}
```

## Step 2: Creating Translation Files

### 2.1 Create Translation Structure

Create JSON files for each language following this structure:

```json
{
  "button": {
    "searchFlights": "Search flights",
    "cancel": "Cancel"
  },
  "labels": {
    "departure": "Departure",
    "arrival": "Arrival"
  },
  "messages": {
    "noFlightsAvailable": "No flights available",
    "loading": "Loading..."
  },
  "validation": {
    "required": "This field is required"
  }
}
```

### 2.2 Organize Keys Logically

Group related translations:
- `button.*` - Button text
- `labels.*` - Form labels and field names
- `messages.*` - User messages and notifications
- `validation.*` - Validation error messages
- `placeholders.*` - Input placeholders
- `title.*` - Page and section titles

### 2.3 Update Language Configuration

Add your widget to the supported widgets list in `src/utils/i18n.ts`:

```typescript
export const LANGUAGE_CONFIG = {
  SUPPORTED_WIDGETS: [
    "searchCriteriaWidget",
    "reviewWidget", 
    "flightOptionsWidget",
    "yourWidgetName" // Add your widget here
  ],
  // ... rest of config
};
```

## Step 3: Adding a New Language

### 3.1 Update Language Configuration

In `src/utils/i18n.ts`, add the new language:

```typescript
export type SupportedLanguage = "en" | "fr" | "hi" | "es"; // Add new language

export const LANGUAGE_CONFIG = {
  COMPLETE_LANGUAGES: ["en", "fr", "hi", "es"], // Add new language
  LOCALE_DIRECTORIES: {
    en: "english",
    fr: "french", 
    hi: "hindi",
    es: "spanish" // Add directory mapping
  }
};

export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: "English",
  fr: "Français",
  hi: "हिंदी",
  es: "Español" // Add language name
};
```

### 3.2 Create Translation Directory

Create a new directory under `src/locales/` (e.g., `spanish/`) and copy all widget JSON files from the English directory.

### 3.3 Translate Content

Translate all strings in the JSON files while maintaining the same key structure:

```json
// spanish/searchCriteriaWidget.json
{
  "button": {
    "searchFlights": "Buscar vuelos",
    "oneWay": "Solo ida"
  },
  "labels": {
    "departure": "Salida",
    "arrival": "Llegada"
  }
}
```

## Step 4: Best Practices

### 4.1 Key Naming Conventions

- Use camelCase for keys: `departureTime`, `maxStops`
- Use descriptive names: `fromAirportRequired` instead of `error1`
- Group related keys: `button.search`, `button.cancel`

### 4.2 Handling Dynamic Content

For pluralization and dynamic content:

```typescript
// Handle plurals
const getStopsText = (stops: number) => {
  if (stops === 0) return t('flightInfo.nonStop');
  return `${stops} ${stops === 1 ? t('flightInfo.stop') : t('flightInfo.stops')}`;
};

// Handle conditional text
const getPassengerLabel = (type: string, index: number) => {
  return `${t(`passengerType.${type}`)} ${index + 1}`;
};
```

### 4.3 Child Component Translation

For child components that need translations, pass the translation function or use the hook directly:

```typescript
// Option 1: Pass translation function
<ChildComponent t={t} />

// Option 2: Use hook in child component
const ChildComponent = () => {
  const { t } = useTranslations('parentWidgetName');
  return <div>{t('child.message')}</div>;
};
```

### 4.4 Testing Translations

1. **Development Testing**: Use the I18nTest component at `/i18n-test`
2. **Language Switching**: Test all languages using the LanguageSwitcher component
3. **Missing Keys**: Check browser console for translation warnings
4. **Fallbacks**: Ensure fallback values work when translations are missing

## Step 5: Maintenance

### 5.1 Adding New Translation Keys

1. Add the key to the English translation file first
2. Add the same key to all other language files
3. Use the key in your component with a fallback value

### 5.2 Updating Existing Translations

1. Update the translation in all language files
2. Test the changes in all supported languages
3. Verify the UI layout works with different text lengths

### 5.3 Removing Unused Keys

1. Search the codebase for usage of the key
2. Remove from all language files if unused
3. Update any related documentation

## Common Issues and Solutions

### Issue: Translation Key Not Found
**Solution**: Check the key path and ensure it exists in the translation file

### Issue: Component Not Re-rendering
**Solution**: Ensure the translation hook is called at the component level, not inside functions

### Issue: Wrong Language Loading
**Solution**: Check URL structure and language detection logic

### Issue: Layout Breaking with Long Translations
**Solution**: Use CSS text truncation and responsive design patterns

## Example Implementation

See the following files for complete examples:
- `src/components/widgets/searchCriteria.widget.tsx`
- `src/components/widgets/flight-options-v0.widget.tsx`
- `src/components/widgets/flight-card.tsx`
- `src/components/widgets/all-flights-sheet.tsx`

## Testing Your Implementation

1. Visit `/i18n-test` to test translations
2. Switch between languages using the LanguageSwitcher
3. Check browser console for any translation warnings
4. Test with different URL patterns: `/`, `/fr`, `/hi`
5. Verify all user-facing text is translated
6. Test edge cases like empty states and error messages
