/**
 * Input validation utilities for English-only text inputs
 * Used in review widgets to ensure form data integrity
 */

/**
 * Regular expression for English characters only
 * Allows: a-z, A-Z, 0-9, space, and common punctuation
 */
export const ENGLISH_ONLY_REGEX = /^[a-zA-Z0-9\s.,!?@#$%^&*()_+\-=\[\]{}|;:'"`<>?/\\~]*$/;

/**
 * Regular expression for name fields (more restrictive)
 * Allows: a-z, A-Z, space, hyphen, apostrophe
 */
export const ENGLISH_NAME_REGEX = /^[a-zA-Z\s\-']*$/;

/**
 * Regular expression for email addresses (English characters only)
 */
export const ENGLISH_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Regular expression for phone numbers (numbers, spaces, hyphens, parentheses, plus)
 */
export const PHONE_REGEX = /^[0-9\s\-\(\)\+]*$/;

/**
 * Validate if text contains only English characters
 */
export function isEnglishOnly(text: string): boolean {
  if (!text) return true; // Empty string is valid
  return ENGLISH_ONLY_REGEX.test(text);
}

/**
 * Validate if name contains only English characters (more restrictive)
 */
export function isEnglishName(name: string): boolean {
  if (!name) return true; // Empty string is valid
  return ENGLISH_NAME_REGEX.test(name);
}

/**
 * Validate if email contains only English characters
 */
export function isEnglishEmail(email: string): boolean {
  if (!email) return true; // Empty string is valid
  return ENGLISH_EMAIL_REGEX.test(email);
}

/**
 * Validate if phone number contains only allowed characters
 */
export function isValidPhone(phone: string): boolean {
  if (!phone) return true; // Empty string is valid
  return PHONE_REGEX.test(phone);
}

/**
 * Get validation error message for non-English input
 */
export function getEnglishOnlyErrorMessage(fieldName?: string): string {
  return fieldName 
    ? `${fieldName} must contain only English characters`
    : 'Only English characters allowed';
}

/**
 * Get validation error message for non-English name
 */
export function getEnglishNameErrorMessage(fieldName?: string): string {
  return fieldName 
    ? `${fieldName} must contain only English letters`
    : 'Only English letters allowed';
}

/**
 * Get validation error message for invalid email
 */
export function getEnglishEmailErrorMessage(): string {
  return 'Please enter a valid email address with English characters only';
}

/**
 * Get validation error message for invalid phone
 */
export function getValidPhoneErrorMessage(): string {
  return 'Please enter a valid phone number';
}

/**
 * Filter out non-English characters from input
 * Useful for preventing non-English input in real-time
 */
export function filterEnglishOnly(text: string): string {
  return text.replace(/[^a-zA-Z0-9\s.,!?@#$%^&*()_+\-=\[\]{}|;:'"`<>?/\\~]/g, '');
}

/**
 * Filter out non-English characters from name input
 */
export function filterEnglishName(name: string): string {
  return name.replace(/[^a-zA-Z\s\-']/g, '');
}

/**
 * Filter out non-English characters from email input
 */
export function filterEnglishEmail(email: string): string {
  return email.replace(/[^a-zA-Z0-9._%+-@]/g, '');
}

/**
 * Filter out invalid characters from phone input
 */
export function filterValidPhone(phone: string): string {
  return phone.replace(/[^0-9\s\-\(\)\+]/g, '');
}

/**
 * Comprehensive input validation function
 */
export interface InputValidationResult {
  isValid: boolean;
  errorMessage?: string;
  filteredValue?: string;
}

export function validateInput(
  value: string, 
  type: 'text' | 'name' | 'email' | 'phone' = 'text',
  fieldName?: string
): InputValidationResult {
  if (!value) {
    return { isValid: true, filteredValue: value };
  }

  switch (type) {
    case 'name':
      return {
        isValid: isEnglishName(value),
        errorMessage: isEnglishName(value) ? undefined : getEnglishNameErrorMessage(fieldName),
        filteredValue: filterEnglishName(value)
      };
    
    case 'email':
      return {
        isValid: isEnglishEmail(value),
        errorMessage: isEnglishEmail(value) ? undefined : getEnglishEmailErrorMessage(),
        filteredValue: filterEnglishEmail(value)
      };
    
    case 'phone':
      return {
        isValid: isValidPhone(value),
        errorMessage: isValidPhone(value) ? undefined : getValidPhoneErrorMessage(),
        filteredValue: filterValidPhone(value)
      };
    
    case 'text':
    default:
      return {
        isValid: isEnglishOnly(value),
        errorMessage: isEnglishOnly(value) ? undefined : getEnglishOnlyErrorMessage(fieldName),
        filteredValue: filterEnglishOnly(value)
      };
  }
}

/**
 * React hook for English-only input validation
 * Usage: const { validate, filter } = useEnglishOnlyValidation('name');
 */
export function useEnglishOnlyValidation(type: 'text' | 'name' | 'email' | 'phone' = 'text') {
  const validate = (value: string, fieldName?: string) => validateInput(value, type, fieldName);
  
  const filter = (value: string) => {
    switch (type) {
      case 'name': return filterEnglishName(value);
      case 'email': return filterEnglishEmail(value);
      case 'phone': return filterValidPhone(value);
      default: return filterEnglishOnly(value);
    }
  };

  return { validate, filter };
}
