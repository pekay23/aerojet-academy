/**
 * Default welcome messages seeded if none exist in the database.
 * Stored in SystemSetting under key `welcome_messages` as a JSON array.
 */
export const DEFAULT_WELCOME_MESSAGES = [
  'Welcome back! Ready to reach new heights today?',
  "The sky is not the limit — it's just the beginning. Let's go!",
  'Every great aviator started exactly where you are now.',
  'Today is a great day to learn something that changes your trajectory.',
  'Excellence in aviation starts with discipline in the classroom.',
  "Your dedication today is the altitude you'll fly at tomorrow.",
  "Clear skies ahead. Let's make the most of your session.",
  'Precision, focus, and passion — the traits of every great pilot.',
  'Another day, another chance to sharpen your skills. Welcome!',
  'The ground is where dreams start. The sky is where they soar.',
  'Welcome aboard! Your next great achievement starts right here.',
  "Knowledge is your co-pilot. Let's fly together.",
  "Stay curious, stay committed — you're building a career that matters.",
  'Every lesson learned brings you one step closer to the flight deck.',
  'Dream it. Study it. Fly it. Welcome back to Aerojet Academy.',
]

/**
 * Fetches the active welcome messages from the DB (or returns defaults).
 * Call this server-side in dashboard pages.
 */
export async function getWelcomeMessages(prismaClient: {
  systemSetting: {
    findUnique: (args: any) => Promise<{ value: string } | null>
  }
}): Promise<string[]> {
  const setting = await prismaClient.systemSetting.findUnique({
    where: { key: 'welcome_messages' },
  })

  if (!setting) return DEFAULT_WELCOME_MESSAGES

  try {
    const parsed = JSON.parse(setting.value)
    if (Array.isArray(parsed) && parsed.length > 0) return parsed
  } catch {}

  return DEFAULT_WELCOME_MESSAGES
}
