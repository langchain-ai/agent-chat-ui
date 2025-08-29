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
}

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

    // Store user name information if provided
    if (firstName) {
      window.localStorage.setItem("flyo:user:first_name", firstName);
    }
    if (lastName) {
      window.localStorage.setItem("flyo:user:last_name", lastName);
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
    window.localStorage.removeItem("flyo:user:first_name");
    window.localStorage.removeItem("flyo:user:last_name");
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
