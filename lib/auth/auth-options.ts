import { getServerSession } from 'next-auth'
import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prismaBase as prisma } from '@/lib/prisma/db-base'
import { verifyPassword } from '@/lib/auth/helpers'
import { createAuditLog } from '@/lib/audit/logger'
import { UserStatus } from '@prisma/client'
import { verifyTOTP } from '@/lib/auth/totp'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        token: { label: 'Token', type: 'text' }, // Added for auto-login
        totpCode: { label: '2FA Code', type: 'text' },
      },
      async authorize(credentials) {

        try {
        // Handling Auto-Login via Verification Token
        if (credentials?.token) {
          const user = await prisma.user.findUnique({
            where: { verifyToken: credentials.token },
            include: { profile: { select: { firstName: true, lastName: true } } },
          })

          if (!user) {
            throw new Error('Invalid verification token')
          }

          if (user.verifyTokenExpires && user.verifyTokenExpires < new Date()) {
            throw new Error('Verification link has expired')
          }

          // If user has 2FA enabled, require TOTP even for token-based login
          // (Unless the token is a passkey token 'pk_', which already proved possession and biometric)
          if (user.twoFactorEnabled && user.twoFactorSecret && !credentials.token.startsWith('pk_')) {
            const totpCode = credentials.totpCode
            if (!totpCode || totpCode === 'undefined' || totpCode === '') {
              throw new Error('2FA_REQUIRED')
            }
            if (!verifyTOTP(totpCode, user.twoFactorSecret)) {
              throw new Error('Invalid 2FA code')
            }
          }

          // Mark as verified and clear token
          await prisma.user.update({
            where: { id: user.id },
            data: {
              emailVerified: new Date(),
              verifyToken: null,
            },
          })

          const name = user.profile
            ? `${user.profile.firstName} ${user.profile.lastName}`
            : user.email

          return {
            id: user.id,
            email: user.academyEmail || user.email,
            name,
            role: user.role,
            status: user.status,
            mustChangePassword: user.mustChangePassword && !user.passwordChanged,
          }
        }

        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: { equals: credentials.email, mode: 'insensitive' } },
              { academyEmail: { equals: credentials.email, mode: 'insensitive' } },
              { personalEmail: { equals: credentials.email, mode: 'insensitive' } },
            ],
          },
          include: {
            profile: { select: { firstName: true, lastName: true } },
          },
        })

        if (!user || !user.password) {
          throw new Error('Invalid email or password')
        }

        // Check if account is locked
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          throw new Error('Account is temporarily locked. Please try again later.')
        }

        // Check account status
        if (user.status === UserStatus.SUSPENDED) {
          throw new Error('Account has been suspended. Contact administration.')
        }
        if (user.status === UserStatus.ARCHIVED || user.status === UserStatus.DELETED) {
          throw new Error('Account is no longer active. Contact administration.')
        }

        // Check email verification — skip for ADMIN and STAFF roles
        if (!user.emailVerified && !['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(user.role)) {
          throw new Error('Please verify your email before logging in.')
        }

        // Verify password

        const isValid = await verifyPassword(credentials.password, user.password)


        if (!isValid) {
          const attempts = user.loginAttempts + 1
          const updateData: Record<string, unknown> = { loginAttempts: attempts }

          if (attempts >= 5) {
            updateData.lockedUntil = new Date(Date.now() + 30 * 60 * 1000)
          }

          await prisma.user.update({
            where: { id: user.id },
            data: updateData,
          })

          throw new Error('Invalid email or password')
        }

        // 2FA Check
        if (user.twoFactorEnabled && user.twoFactorSecret) {
          const totpCode = credentials.totpCode
          if (!totpCode || totpCode === 'undefined' || totpCode === '') {
            throw new Error('2FA_REQUIRED')
          }
          if (!verifyTOTP(totpCode, user.twoFactorSecret)) {
            throw new Error('Invalid 2FA code')
          }
        }

        // Reset login attempts on successful login
        await prisma.user.update({
          where: { id: user.id },
          data: {
            loginAttempts: 0,
            lockedUntil: null,
            lastLoginAt: new Date(),
          },
        })

        // Audit log
        await createAuditLog({
          action: 'LOGIN',
          entity: 'users',
          entityId: user.id,
          userId: user.id,
          description: `User logged in: ${user.email}`,
        })


        const name = user.profile
          ? `${user.profile.firstName} ${user.profile.lastName}`
          : user.email

        return {
          id: user.id,
          email: user.academyEmail || user.email,
          name,
          role: user.role,
          status: user.status,
          mustChangePassword: user.mustChangePassword && !user.passwordChanged,
        }
      } catch (error: any) {
        throw error
      }
    },
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60,
  },

  jwt: {
    maxAge: 8 * 60 * 60,
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.status = user.status
        token.mustChangePassword = user.mustChangePassword
        token.issuedAt = Date.now()
      }

      // Periodic session validation (every 5 minutes) — checks if password was changed after token issued
      const REVALIDATION_INTERVAL = 5 * 60 * 1000
      const lastChecked = (token.lastChecked as number) || 0
      const shouldRevalidate = trigger === 'update' || Date.now() - lastChecked > REVALIDATION_INTERVAL

      if (shouldRevalidate && token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, status: true, mustChangePassword: true, passwordChanged: true, passwordChangedAt: true },
        })
        if (dbUser) {
          // Invalidate session if password was changed after this token was issued
          if (dbUser.passwordChangedAt && token.issuedAt && dbUser.passwordChangedAt.getTime() > (token.issuedAt as number)) {
            // Invalidate by clearing identity — middleware/auth checks will reject
            token.id = ''
            token.role = ''
            token.status = ''
            return token
          }
          token.role = dbUser.role
          token.status = dbUser.status
          token.mustChangePassword = dbUser.mustChangePassword && !dbUser.passwordChanged
        }
        token.lastChecked = Date.now()
      }

      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.status = token.status as string
        session.user.mustChangePassword = token.mustChangePassword as boolean
      }
      return session
    },
  },

  events: {
    async signOut({ token }) {
      if (token?.id) {
        await createAuditLog({
          action: 'LOGOUT',
          entity: 'users',
          entityId: token.id as string,
          userId: token.id as string,
          description: `User logged out`,
        })
      }
    },
  },
}

export const getAuthSession = () => getServerSession(authOptions)
