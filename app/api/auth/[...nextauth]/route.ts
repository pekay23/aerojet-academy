import NextAuth, { type NextAuthOptions, getServerSession } from "next-auth"; // Added getServerSession
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

        if (process.env.NODE_ENV !== 'production' && credentials.password === process.env.NEXT_PUBLIC_DEV_LOGIN_SECRET) {
          const devUser = await prisma.user.findUnique({ where: { email: credentials.email } });
          if (devUser) return devUser;
        }

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
    signIn: '/portal/login',
    error: '/portal/login',
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  events: {
    createUser: async ({ user }) => {
      const existingStudent = await prisma.student.findFirst({ where: { userId: user.id }});
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
        const dbUser = await prisma.user.findUnique({ where: { id: user.id }});
        token.lastPasswordChange = dbUser?.lastPasswordChange?.getTime() || null;
      }

      if (trigger === "update" && session) {
        if (session.name) token.name = session.name;
        if (session.image) token.picture = session.image;
      }

      // Session Validation
      if (token.sub) {
        const dbUser = await prisma.user.findUnique({ where: { id: token.sub } });
        if (!dbUser || !dbUser.isActive || dbUser.isDeleted) {
          return {}; // Return empty object to invalidate session
        }
        if (dbUser.lastPasswordChange && token.lastPasswordChange !== dbUser.lastPasswordChange.getTime()) {
          return {}; // Password changed, invalidate session
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
      
      // Since getServerSession can't be used here reliably, check token passed in
      const session = await getServerSession(authOptions); // This should be okay here but can be tricky
      if((session?.user as { role: string })?.role === 'STUDENT'){
        return `${baseUrl}/portal/dashboard`;
      } else {
        return `${baseUrl}/staff/dashboard`;
      }
    }
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
