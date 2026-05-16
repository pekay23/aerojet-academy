/**
 * WebAuthn Relying Party (RP) configuration for passkey authentication.
 *
 * IMPORTANT: rpID is permanently bound to stored credentials.
 * Changing the domain after passkeys are registered will invalidate them all.
 */

const isDev = process.env.NODE_ENV === 'development'

export const rpConfig = {
  rpName: 'Aerojet Academy',
  rpID: isDev ? 'localhost' : (process.env.NEXT_PUBLIC_DOMAIN || 'aerojet-academy.com'),
  origin: isDev
    ? ['http://localhost:3000', 'http://192.168.100.218:3000']
    : [`https://${process.env.NEXT_PUBLIC_DOMAIN || 'aerojet-academy.com'}`],
} as const
