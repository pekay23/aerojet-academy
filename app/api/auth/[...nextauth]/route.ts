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

  events: {
    // Set user to INACTIVE on first-time signup
    createUser: async ({ user }) => {
      await prisma.user.update({
        where: { id: user.id },
        data: { isActive: false }
      });
      // Also create a student profile automatically
      await prisma.student.create({
        data: { userId: user.id }
      });
    }
  },

  callbacks: {
    async signIn({ user, account, profile }) {
      // 1. Check if the user already exists in our database
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email as string },
      });

      // 2. If the user DOES NOT exist, block them from creating an account
      if (!existingUser) {
        // You can redirect them to a custom "Not Authorized" or "Pay First" page
        return '/portal/login?error=AccessDenied'; 
      }

      // 3. If they exist and are inactive, we still let them in to the "Pending" page 
      // (or you can block them here too if you prefer)
      return true;
    },
    
    // 1. JWT CALLBACK: Fetch latest data from DB
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
      }
      
      // Update role dynamically from DB on each request
      if (token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { role: true }
        });
        if (dbUser) token.role = dbUser.role;
      }

      return token;
    },

    // 2. SESSION CALLBACK: Map token data to session object
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
      }
      return session;
    },

    // 3. REDIRECT CALLBACK: Handle post-login navigation
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return `${baseUrl}/portal`
    }
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
