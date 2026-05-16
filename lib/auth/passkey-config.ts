/**
 * WebAuthn Relying Party (RP) configuration for passkey authentication.
 *
 * IMPORTANT: rpID is permanently bound to stored credentials.
 * Changing the domain after passkeys are registered will invalidate them all.
 */

const isDev = process.env.NODE_ENV === 'development'

// In dev, rpID must match the hostname in the browser URL bar.
// If accessing from LAN (e.g. Mac on same network), use a shared hostname
// by adding it to /etc/hosts on both machines, or use NEXT_PUBLIC_DOMAIN.
const devRpID = process.env.NEXT_PUBLIC_DOMAIN || 'localhost'

export const rpConfig = {
  rpName: 'Aerojet Academy',
  rpID: isDev ? devRpID : (process.env.NEXT_PUBLIC_DOMAIN || 'aerojet-academy.com'),
  origin: isDev
    ? [
        `http://${devRpID}:3000`,
        'http://localhost:3000',
        'http://192.168.100.218:3000',
      ]
    : [`https://${process.env.NEXT_PUBLIC_DOMAIN || 'aerojet-academy.com'}`],
} as const
