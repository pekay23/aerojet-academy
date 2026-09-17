/**
 * Default welcome messages categorized by role.
 * Stored in SystemSetting under key `welcome_messages` as a JSON object.
 */
import { cache } from 'react'
import { unstable_cache } from 'next/cache'

export const DEFAULT_ROLE_WELCOME_MESSAGES: Record<string, string[]> = {
  STUDENT: [
    'Welcome back! Ready to reach new heights today?',
    "The sky is not the limit - it's just the beginning. Let's go!",
    'Every great aviator started exactly where you are now.',
    'Today is a great day to learn something that changes your trajectory.',
    'Excellence in aviation starts with discipline in the classroom.',
    "Your dedication today is the altitude you'll fly at tomorrow.",
    "Clear skies ahead. Let's make the most of your session.",
    'Precision, focus, and passion - the traits of every great pilot.',
    'Another day, another chance to sharpen your skills. Welcome!',
    'The ground is where dreams start. The sky is where they soar.',
  ],
  STAFF: [
    "System operational. Ready for today's administrative challenges?",
    'Efficiency is the engine of Aerojet Academy. Welcome back.',
    'Thank you for keeping the gears turning behind the scenes.',
    "Great to see you! Let's make today productive and orderly.",
    'Success starts with strong support. You make it happen.',
    'Another day of excellence in operations. Glad to have you.',
    'The foundation of every flight starts right here in the office.',
    'Welcome back! Your hard work is the wind beneath our wings.',
    'Ensuring a smooth journey for every student, one task at a time.',
    "Aerojet Academy runs on your dedication. Let's soar today.",
  ],
  INSTRUCTOR: [
    'Welcome back, Captain. Ready to shape the next generation?',
    'Teaching is the highest form of aviation expertise.',
    'Your mentorship is the compass for our future pilots.',
    'Clear skies for your classes today. Lead the way!',
    'Knowledge is the fuel for every successful flight.',
    "Great to see you! Let's inspire some excellence today.",
    'Precision and passion - thank you for passing it on.',
    'The future of aviation is in your hands today. Good luck!',
    'Another day to mentor, guide, and excel. Welcome back.',
    "Your expertise is our greatest asset. Let's fly high.",
  ],
  ADMIN: [
    'Welcome, Administrator. The system is at your command.',
    "Strategic oversight is key to our mission. Glad you're here.",
    'Ensuring the academy reaches new heights, one decision at a time.',
    'Great to see you! Ready to oversee our operations today?',
    'Leadership is the rudder of our institution. Welcome back.',
    "The academy's success starts with your vision. Let's excel.",
    'Full system access granted. Ready for excellence?',
    "Thank you for guiding Aerojet Academy's trajectory.",
    'Your leadership ensures we always fly in the right direction.',
    'System integrity: 100%. Ready for your administrative oversight.',
  ],
}

export type WelcomeMessagesPrismaClient = {
  systemSetting: {
    findUnique: (args: unknown) => Promise<{ value: string } | null>
  }
}

/**
 * Fetches the active welcome messages from the DB (or returns defaults).
 * Call this server-side in dashboard pages.
 */
export const getWelcomeMessages = cache(
  async (
    prismaClient: WelcomeMessagesPrismaClient,
    role: string = 'STUDENT'
  ): Promise<string[]> => {
    // We use unstable_cache for cross-request caching (5 mins) to avoid
    // hitting the DB on every single layout load.
    const getCachedMessages = unstable_cache(
      async () => {
        const setting = await prismaClient.systemSetting.findUnique({
          where: { key: 'welcome_messages' },
        })

        const defaults =
          DEFAULT_ROLE_WELCOME_MESSAGES[role] || DEFAULT_ROLE_WELCOME_MESSAGES.STUDENT

        if (!setting) return defaults

        try {
          const parsed = JSON.parse(setting.value)
          if (Array.isArray(parsed)) {
            return parsed.length > 0 ? parsed : defaults
          }

          if (typeof parsed === 'object' && parsed !== null) {
            const roleMessages = parsed[role]
            if (Array.isArray(roleMessages) && roleMessages.length > 0) return roleMessages
            return defaults
          }
        } catch {}

        return defaults
      },
      [`welcome_messages_${role}`],
      { revalidate: 300 } // 5 minutes
    )

    return getCachedMessages()
  }
)

/**
 * Fetches all welcome messages grouped by role.
 * Primarily for admin settings page.
 */
export async function getWelcomeMessagesGrouped(prismaClient: WelcomeMessagesPrismaClient): Promise<Record<string, string[]>> {
  const setting = await prismaClient.systemSetting.findUnique({
    where: { key: 'welcome_messages' },
  })

  if (!setting) return DEFAULT_ROLE_WELCOME_MESSAGES

  try {
    const parsed = JSON.parse(setting.value)
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return parsed
    }

    if (Array.isArray(parsed)) {
      return {
        STUDENT: parsed,
        STAFF: DEFAULT_ROLE_WELCOME_MESSAGES.STAFF,
        INSTRUCTOR: DEFAULT_ROLE_WELCOME_MESSAGES.INSTRUCTOR,
        ADMIN: DEFAULT_ROLE_WELCOME_MESSAGES.ADMIN,
      }
    }
  } catch {}

  return DEFAULT_ROLE_WELCOME_MESSAGES
}
