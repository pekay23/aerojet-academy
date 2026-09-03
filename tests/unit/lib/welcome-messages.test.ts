import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { getWelcomeMessages, getWelcomeMessagesGrouped, DEFAULT_ROLE_WELCOME_MESSAGES } from '@/lib/welcome-messages'

describe('lib/welcome-messages', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('DEFAULT_ROLE_WELCOME_MESSAGES', () => {
    it('has expected roles', () => {
      expect(DEFAULT_ROLE_WELCOME_MESSAGES.STUDENT).toBeDefined()
      expect(DEFAULT_ROLE_WELCOME_MESSAGES.STAFF).toBeDefined()
      expect(DEFAULT_ROLE_WELCOME_MESSAGES.INSTRUCTOR).toBeDefined()
      expect(DEFAULT_ROLE_WELCOME_MESSAGES.ADMIN).toBeDefined()
    })

    it('each role has multiple messages', () => {
      for (const [role, messages] of Object.entries(DEFAULT_ROLE_WELCOME_MESSAGES)) {
        expect(messages.length).toBeGreaterThan(0)
      }
    })

    it('each message is a non-empty string', () => {
      for (const [role, messages] of Object.entries(DEFAULT_ROLE_WELCOME_MESSAGES)) {
        for (const message of messages) {
          expect(typeof message).toBe('string')
          expect(message.length).toBeGreaterThan(0)
        }
      }
    })
  })

  describe('getWelcomeMessages', () => {
    it('returns default messages when no setting exists', async () => {
      prismaMock.systemSetting.findUnique.mockResolvedValue(null)

      const messages = await getWelcomeMessages(prismaMock, 'STUDENT')

      expect(messages).toEqual(DEFAULT_ROLE_WELCOME_MESSAGES.STUDENT)
    })

    it('returns default messages for unknown role', async () => {
      prismaMock.systemSetting.findUnique.mockResolvedValue(null)

      const messages = await getWelcomeMessages(prismaMock, 'UNKNOWN')

      expect(messages).toEqual(DEFAULT_ROLE_WELCOME_MESSAGES.STUDENT)
    })

    it('returns custom messages from setting when valid JSON array', async () => {
      const customMessages = ['Custom 1', 'Custom 2']
      prismaMock.systemSetting.findUnique.mockResolvedValue({
        key: 'welcome_messages',
        value: JSON.stringify(customMessages),
      })

      const messages = await getWelcomeMessages(prismaMock, 'STUDENT')

      expect(messages).toEqual(customMessages)
    })

    it('returns role-specific messages from setting when valid JSON object', async () => {
      const roleMessages = ['Student msg 1', 'Student msg 2']
      prismaMock.systemSetting.findUnique.mockResolvedValue({
        key: 'welcome_messages',
        value: JSON.stringify({ STUDENT: roleMessages }),
      })

      const messages = await getWelcomeMessages(prismaMock, 'STUDENT')

      expect(messages).toEqual(roleMessages)
    })

    it('falls back to defaults when setting has empty array', async () => {
      prismaMock.systemSetting.findUnique.mockResolvedValue({
        key: 'welcome_messages',
        value: JSON.stringify([]),
      })

      const messages = await getWelcomeMessages(prismaMock, 'STUDENT')

      expect(messages).toEqual(DEFAULT_ROLE_WELCOME_MESSAGES.STUDENT)
    })
  })

  describe('getWelcomeMessagesGrouped', () => {
    it('returns defaults when no setting exists', async () => {
      prismaMock.systemSetting.findUnique.mockResolvedValue(null)

      const result = await getWelcomeMessagesGrouped(prismaMock)

      expect(result).toEqual(DEFAULT_ROLE_WELCOME_MESSAGES)
    })

    it('returns parsed object when setting is valid JSON object', async () => {
      const customMessages = {
        STUDENT: ['Student msg'],
        STAFF: ['Staff msg'],
      }
      prismaMock.systemSetting.findUnique.mockResolvedValue({
        key: 'welcome_messages',
        value: JSON.stringify(customMessages),
      })

      const result = await getWelcomeMessagesGrouped(prismaMock)

      expect(result).toEqual(customMessages)
    })

    it('returns defaults for all roles when setting is array', async () => {
      const customMessages = ['Msg 1', 'Msg 2']
      prismaMock.systemSetting.findUnique.mockResolvedValue({
        key: 'welcome_messages',
        value: JSON.stringify(customMessages),
      })

      const result = await getWelcomeMessagesGrouped(prismaMock)

      expect(result.STUDENT).toEqual(customMessages)
      expect(result.STAFF).toEqual(DEFAULT_ROLE_WELCOME_MESSAGES.STAFF)
    })
  })
})
