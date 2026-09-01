import NextAuth, { getServerSession, type SessionStrategy } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const authOptions = {
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        if (!process.env.DATABASE_URL) {
          throw new Error("DATABASE_URL is not configured");
        }

        try {
          const user = await db.users.findFirst({
            where: { email: credentials.email as string },
          });

          if (!user || user.deletedAt) {
            return null;
          }

          const passwordMatch = await bcrypt.compare(
            credentials.password as string,
            user.passwordHash
          );

          if (!passwordMatch) {
            return null;
          }

          return {
            id: String(user.id),
            name: user.name,
            email: user.email,
            role: user.role,
          };
        } catch (error) {
          console.error("[Auth] authorize error:", error);
          throw new Error("Authentication service unavailable");
        }
      },
    }),
  ],
  session: {
    strategy: "jwt" as SessionStrategy,
    maxAge: 7 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = (user as unknown as { id: string }).id;
        token.role = (user as unknown as { role: string }).role;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "user" | "admin";
      }
      return session;
    },
  },
};

export const auth = () => getServerSession(authOptions);

export const signIn = async (provider: string, options?: any) => {
  const { signIn: nextSignIn } = await import("next-auth/react");
  return nextSignIn(provider, options);
};

export const signOut = async (options?: any) => {
  const { signOut: nextSignOut } = await import("next-auth/react");
  return nextSignOut(options);
};
