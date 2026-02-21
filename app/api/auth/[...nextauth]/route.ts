import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/app/lib/prisma";
import { compare } from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        if (!credentials?.email) return null;

        if (!credentials.password) return null;
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });

        if (!user || !user.password) return null;
        if (!user.isActive) throw new Error("Account is inactive or pending verification.");

        const isValid = await compare(credentials.password, user.password);
        if (!isValid) return null;

        return user;
      }
    })
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  events: {
    createUser: async ({ user }) => {
      const existingStudent = await prisma.student.findFirst({ where: { userId: user.id } });
      if (!existingStudent) {
        await prisma.student.create({
          data: { userId: user.id! }
        });
      }
    }
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== 'credentials') {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });

        if (!existingUser) return '/portal/login?error=AccessDenied';
        if (!existingUser.isActive) return true;
      }
      return true;
    },

    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.sub = user.id;
        token.role = (user as { role: string }).role;
        const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
        token.lastPasswordChange = dbUser?.lastPasswordChange?.getTime() || null;
      }

      if (trigger === "update" && session) {
        if (session.name) token.name = session.name;
        if (session.image) token.picture = session.image;
      }

      // Session Validation — throttled to every 5 minutes
      const REVALIDATE_MS = 5 * 60 * 1000;
      if (token.sub) {
        const lastChecked = (token.lastCheckedAt as number) || 0;
        if (Date.now() - lastChecked > REVALIDATE_MS) {
          const dbUser = await prisma.user.findUnique({ where: { id: token.sub } });
          if (!dbUser || !dbUser.isActive || dbUser.isDeleted) {
            return {}; // Return empty object to invalidate session
          }
          if (dbUser.lastPasswordChange && token.lastPasswordChange !== dbUser.lastPasswordChange.getTime()) {
            return {}; // Password changed, invalidate session
          }
          token.lastCheckedAt = Date.now();
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      // Default redirect — role-based routing is handled by middleware
      return baseUrl;
    }
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
