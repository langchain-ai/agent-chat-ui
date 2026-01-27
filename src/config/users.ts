
export type UserRole = "admin" | "user" | "guest" | "reflexion_admin" | "customer_admin" | "ReflexionAdministrator" | "CustomerAdministrator";

export interface UserConfig {
    customerId: string;
    projectId: string;
    role: UserRole;
}

// Simple in-memory user registry for the MVP
// In a real app, this would be a database lookup
export const USER_REGISTRY: Record<string, UserConfig> = {
    // Admin User
    // Admin Users
    "ben.adrian.coleman@gmail.com": {
        customerId: "reflexion-org",
        projectId: "demo-project",
        role: "reflexion_admin"
    },
    "khurana.h@gmail.com": {
        customerId: "reflexion-org",
        projectId: "demo-project",
        role: "reflexion_admin"
    },
    "soumitri.kolavennu@gmail.com": {
        customerId: "reflexion-org",
        projectId: "demo-project",
        role: "reflexion_admin"
    },
    "ben@example.com": {
        customerId: "daikin",
        projectId: "demo-identity-proj-001",
        role: "admin"
    },

    // You can add more users here
};

export const DEFAULT_GUEST_CONFIG: UserConfig = {
    customerId: "guest",
    projectId: "guest-demo",
    role: "guest"
};

export function getUserConfig(email: string | null | undefined): UserConfig {
    if (!email) return DEFAULT_GUEST_CONFIG;
    return USER_REGISTRY[email] || DEFAULT_GUEST_CONFIG;
}
