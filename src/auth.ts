import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const credentialsSchema = z.object({
  username: z.string().trim().min(3),
  password: z.string().trim().min(8),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        username: {},
        password: {},
      },
      authorize: async (rawCredentials) => {
        const normalized = {
          username: String(rawCredentials?.username ?? "")
            .trim()
            .toLowerCase(),
          password: String(rawCredentials?.password ?? "").trim(),
        };
        const parsed = credentialsSchema.safeParse(normalized);

        if (!parsed.success) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { username: parsed.data.username },
        });

        if (!user) {
          return null;
        }

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);

        if (!valid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.username,
          role: user.role,
          mustChangePassword: user.defaultPassword,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.mustChangePassword = Boolean(
          (user as { mustChangePassword?: boolean }).mustChangePassword,
        );
      }
      const id = token.id as string | undefined;
      if (id) {
        const row = await prisma.user.findUnique({
          where: { id },
          select: { defaultPassword: true },
        });
        token.mustChangePassword = row?.defaultPassword ?? false;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "ADMIN" | "MANAGER" | "SALES";
        session.user.mustChangePassword = Boolean(token.mustChangePassword);
      }

      return session;
    },
    redirect({ url }) {
      if (url.startsWith("/")) {
        return url;
      }

      try {
        const parsed = new URL(url);
        return `${parsed.pathname}${parsed.search}${parsed.hash}`;
      } catch {
        return "/dashboard";
      }
    },
  },
});
