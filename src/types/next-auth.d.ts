import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role: "MANAGER" | "SALES";
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role: "MANAGER" | "SALES";
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role?: "MANAGER" | "SALES";
  }
}
