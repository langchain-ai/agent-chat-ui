declare module "next-auth" {
  interface Session {
    user: {
      id: string; // Cognito sub attribute (UUID)
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    accessToken?: string;
  }

  interface User {
    id: string; // Cognito sub attribute (UUID)
    name?: string | null;
    email?: string | null;
    image?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    accessToken?: string;
  }
}
