import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role: "MANAGER" | "SALES";
    mustChangePassword?: boolean;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role: "MANAGER" | "SALES";
      mustChangePassword?: boolean;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role?: "MANAGER" | "SALES";
    mustChangePassword?: boolean;
  }
}
