export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  idToken: string;
}

export interface LoginResponse {
  jwtToken: string;
  userType: string;
  first_name: string;
  last_name: string;
  isNewUser?: boolean;
}

// Unified user profile persisted in localStorage
export interface UserProfile {
  firstName?: string;
  lastName?: string;
  mobileNumber?: string; // callingCode (no '+') + subscriber number
  countryIso?: string; // e.g., 'IN'
  callingCode?: string; // e.g., '+91'
}

const USER_PROFILE_KEY = "flyo:user:profile";

function getUserProfile(): UserProfile | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(USER_PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

function setUserProfile(profile: UserProfile): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
}

function upsertUserProfile(patch: Partial<UserProfile>): void {
  const current = getUserProfile() || {};
  setUserProfile({ ...current, ...patch });
}

// UI flags persisted in localStorage
const UI_HIDE_OWNER_ACTIONS_KEY = "flyo:ui:hide_owner_actions";

export const setHideOwnerActions = (hide: boolean): void => {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      UI_HIDE_OWNER_ACTIONS_KEY,
      hide ? "true" : "false",
    );
  } catch (error) {
    console.error("Error setting hide owner actions flag:", error);
  }
};

export const getHideOwnerActions = (): boolean => {
  try {
    if (typeof window === "undefined") return false;
    const value = window.localStorage.getItem(UI_HIDE_OWNER_ACTIONS_KEY);
    return value === "true" || value === "1";
  } catch {
    return false;
  }
};

/**
 * Login with Google OAuth tokens
 */
export const loginWithGoogle = async (
  tokens: AuthTokens,
): Promise<LoginResponse> => {
  try {
    console.log("Login request tokens:", tokens);
    console.log(
      "Login request URL:",
      `https://prod-api.flyo.ai/core/v2/websiteLogin`,
    );

    const response = await fetch(
      `https://prod-api.flyo.ai/core/v2/websiteLogin`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          idToken: tokens.idToken,
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Login failed: ${errorData.message || response.statusText}`,
      );
    }

    const loginResponse: LoginResponse = await response.json();
    return loginResponse;
  } catch (error) {
    console.error("Error in loginWithGoogle:", error);
    throw error;
  }
};

/**
 * Check if user is authenticated by checking JWT token in localStorage
 */
export const isAuthenticated = (): boolean => {
  try {
    if (typeof window === "undefined") return false;
    const token = window.localStorage.getItem("flyo:jwt:token");
    return !!token;
  } catch {
    return false;
  }
};

/**
 * Store JWT token in localStorage with validation
 */
export const storeJwtTokenWithValidation = (
  jwtToken: string,
  userType: string,
  firstName?: string,
  lastName?: string,
): void => {
  try {
    if (!jwtToken) {
      throw new Error("JWT token is required");
    }

    // Store the JWT token
    window.localStorage.setItem("flyo:jwt:token", jwtToken);
    window.localStorage.setItem("flyo:user:type", userType);

    // Upsert user profile names (single JSON object)
    if (firstName || lastName) {
      upsertUserProfile({ firstName, lastName });
    }

    console.log("JWT token stored successfully");
  } catch (error) {
    console.error("Error storing JWT token:", error);
    throw error;
  }
};

/**
 * Get stored JWT token
 */
export const getJwtToken = (): string | null => {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem("flyo:jwt:token");
  } catch {
    return null;
  }
};

/**
 * Get stored user first name
 */
export const getUserFirstName = (): string | null => {
  try {
    const p = getUserProfile();
    if (p?.firstName) return p.firstName;
    // Legacy fallback
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem("flyo:user:first_name");
  } catch {
    return null;
  }
};

/**
 * Get stored user last name
 */
export const getUserLastName = (): string | null => {
  try {
    const p = getUserProfile();
    if (p?.lastName) return p.lastName;
    // Legacy fallback
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem("flyo:user:last_name");
  } catch {
    return null;
  }
};

/**
 * Get user's full name
 */
export const getUserFullName = (): string => {
  const firstName = getUserFirstName();
  const lastName = getUserLastName();

  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  } else if (firstName) {
    return firstName;
  } else if (lastName) {
    return lastName;
  }

  // Fallback to JWT token data if name not stored
  const token = getJwtToken();
  if (token) {
    const userData = decodeJwtPayload(token);
    return userData?.name || userData?.email?.split("@")[0] || "User";
  }

  return "User";
};

/**
 * Clear authentication data
 */
export const clearAuthData = (): void => {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem("flyo:jwt:token");
    window.localStorage.removeItem("flyo:user:type");
    // Remove unified profile + legacy keys for safety
    window.localStorage.removeItem("flyo:user:profile");
    window.localStorage.removeItem("flyo:user:first_name");
    window.localStorage.removeItem("flyo:user:last_name");
    window.localStorage.removeItem("flyo:user:mobile_number");
    window.localStorage.removeItem("flyo:user:mobile_iso");
    window.localStorage.removeItem("flyo:user:calling_code");
  } catch (error) {
    console.error("Error clearing auth data:", error);
  }
};

/**
 * Logout user and redirect to login page
 */
export const logout = (): void => {
  clearAuthData();
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
};

export const decodeJwtPayload = (token: string): any => {
  try {
    // Split the token into parts
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid JWT token format");
    }

    // Decode the payload (second part)
    const payload = parts[1];

    // Add padding if needed for base64 decoding
    const paddedPayload = payload + "=".repeat((4 - (payload.length % 4)) % 4);

    // Decode base64url to string
    const decodedPayload = atob(
      paddedPayload.replace(/-/g, "+").replace(/_/g, "/"),
    );

    // Parse JSON
    return JSON.parse(decodedPayload);
  } catch (err) {
    console.error("Error decoding JWT payload:", err);
    return null;
  }
};

export const GetUserId = (jwtToken: string): string | number => {
  try {
    const decoded = decodeJwtPayload(jwtToken);
    if (decoded && decoded.userId) {
      return decoded.userId;
    }
    return "";
  } catch (err) {
    console.error("Error getting user ID from JWT:", err);
    return "";
  }
};

/**
 * Get user email from JWT token
 */
export const getUserEmail = (): string | null => {
  try {
    const token = getJwtToken();
    if (!token) return null;

    const decoded = decodeJwtPayload(token);
    return decoded?.email || null;
  } catch (err) {
    console.error("Error getting user email from JWT:", err);
    return null;
  }
};

export interface UpdateUserNameRequest {
  firstName: string;
  lastName: string;
  mobileNumber: string;
  // Optional metadata for local caching/use in UI
  countryIso?: string; // e.g., "IN"
  callingCode?: string; // e.g., "+91"
}

/**
 * Update user name and mobile number
 */
export const updateUserName = async (
  data: UpdateUserNameRequest,
): Promise<void> => {
  try {
    const token = getJwtToken();
    if (!token) {
      throw new Error("Authentication token not found. Please login again.");
    }

    console.log("Update user name request:", data);
    console.log(
      "Update user name URL:",
      "https://prod-api.flyo.ai/core/v1/user/updateUserName",
    );

    const response = await fetch(
      "https://prod-api.flyo.ai/core/v1/user/updateUserName",
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to update profile: ${errorData.message || response.statusText}`,
      );
    }

    console.log("Profile updated successfully");

    // Persist unified profile so UI can immediately reflect changes
    upsertUserProfile({
      firstName: data.firstName,
      lastName: data.lastName,
      mobileNumber: data.mobileNumber,
      countryIso: data.countryIso,
      callingCode: data.callingCode,
    });
  } catch (error) {
    console.error("Error in updateUserName:", error);
    throw error;
  }
};

// Convenience getters for updated phone metadata
export const getUserMobileNumber = (): string | null => {
  try {
    const p = getUserProfile();
    return p?.mobileNumber || null;
  } catch {
    return null;
  }
};

export const getUserMobileIso = (): string | null => {
  try {
    const p = getUserProfile();
    return p?.countryIso || null;
  } catch {
    return null;
  }
};

export const getUserCallingCode = (): string | null => {
  try {
    const p = getUserProfile();
    return p?.callingCode || null;
  } catch {
    return null;
  }
};
