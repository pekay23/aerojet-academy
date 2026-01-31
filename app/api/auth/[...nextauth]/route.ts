import NextAuth, { type NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"
import { compare } from 'bcryptjs';

const prisma = new PrismaClient()

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
        if (!credentials?.email || !credentials.password) return null;
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user || !user.password) return null;
        const isValid = await compare(credentials.password, user.password);
        return isValid ? user : null;
      }
    })
  ],
  pages: {
    signIn: '/portal/login',
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    // 1. Add role to the JWT token
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role; // Persist role to token
      }
      return token;
    },
    // 2. Add role to the Session object
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as string; // Persist role to session
      }
      return session;
    },
    // ADD THIS REDIRECT CALLBACK
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      // Default to the Traffic Cop page
      return `${baseUrl}/portal`
    }
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
