import crypto from 'crypto'
import zlib from 'zlib'

export interface SebConfig {
  start_url: string
  config_key: string
  allow_quit: boolean
  show_taskbar: boolean
  enable_exit_sequencer: boolean
  allowed_applications: string[]
  blocked_applications: string[]
  enable_print_screen: boolean
  enable_clipboard: boolean
  enable_developer_tools: boolean
  exam_time: number
  browserExamKey?: string
  permissions?: {
    enable_fullscreen?: boolean
    enable_zoom?: boolean
    enable_spell_check?: boolean
    enable_translation?: boolean
    enable_audio?: boolean
    enable_video?: boolean
  }
  user_interface?: {
    hide_browser_menubar?: boolean
    hide_loading_screen?: boolean
    enable_dictionary?: boolean
    enable_calculator?: boolean
    enable_notes?: boolean
  }
  exam_cookies?: {
    store_session_data?: boolean
    clear_on_exit?: boolean
  }
}

export interface BekPair {
  publicKey: string
  privateKey: string
  configKey: string
  createdAt?: string
}

export interface BankSebConfig {
  lockdownLevel?: 'standard' | 'strict' | 'maximum'
  allowedApplications?: string[]
  blockedApplications?: string[]
  enablePrintScreen?: boolean
  enableClipboard?: boolean
  enableExitSequencer?: boolean
  allowQuit?: boolean
  showTaskbar?: boolean
  enableDeveloperTools?: boolean
}

const DEFAULT_BANK_CONFIG: BankSebConfig = {
  lockdownLevel: 'strict',
  allowedApplications: [],
  blockedApplications: [],
  enablePrintScreen: false,
  enableClipboard: false,
  enableExitSequencer: false,
  allowQuit: false,
  showTaskbar: false,
  enableDeveloperTools: false,
}

function mergeBankConfig(bankConfig: BankSebConfig | null | undefined): Required<BankSebConfig> {
  const source = bankConfig && typeof bankConfig === 'object' ? bankConfig : {}
  return {
    lockdownLevel: source.lockdownLevel || DEFAULT_BANK_CONFIG.lockdownLevel || 'strict',
    allowedApplications: Array.isArray(source.allowedApplications) ? source.allowedApplications : DEFAULT_BANK_CONFIG.allowedApplications || [],
    blockedApplications: Array.isArray(source.blockedApplications) ? source.blockedApplications : DEFAULT_BANK_CONFIG.blockedApplications || [],
    enablePrintScreen: source.enablePrintScreen ?? DEFAULT_BANK_CONFIG.enablePrintScreen ?? false,
    enableClipboard: source.enableClipboard ?? DEFAULT_BANK_CONFIG.enableClipboard ?? false,
    enableExitSequencer: source.enableExitSequencer ?? DEFAULT_BANK_CONFIG.enableExitSequencer ?? false,
    allowQuit: source.allowQuit ?? DEFAULT_BANK_CONFIG.allowQuit ?? false,
    showTaskbar: source.showTaskbar ?? DEFAULT_BANK_CONFIG.showTaskbar ?? false,
    enableDeveloperTools: source.enableDeveloperTools ?? DEFAULT_BANK_CONFIG.enableDeveloperTools ?? false,
  }
}

function lockdownLevelToPermissions(level: string): SebConfig['permissions'] {
  switch (level) {
    case 'maximum':
      return {
        enable_fullscreen: true,
        enable_zoom: false,
        enable_spell_check: false,
        enable_translation: false,
        enable_audio: false,
        enable_video: false,
      }
    case 'strict':
      return {
        enable_fullscreen: true,
        enable_zoom: false,
        enable_spell_check: false,
        enable_translation: false,
        enable_audio: true,
        enable_video: true,
      }
    case 'standard':
    default:
      return {
        enable_fullscreen: true,
        enable_zoom: false,
        enable_spell_check: false,
        enable_translation: false,
        enable_audio: true,
        enable_video: true,
      }
  }
}

function lockdownLevelToUserInterface(level: string): SebConfig['user_interface'] {
  switch (level) {
    case 'maximum':
      return {
        hide_browser_menubar: true,
        hide_loading_screen: false,
        enable_dictionary: false,
        enable_calculator: false,
        enable_notes: false,
      }
    case 'strict':
      return {
        hide_browser_menubar: true,
        hide_loading_screen: true,
        enable_dictionary: false,
        enable_calculator: true,
        enable_notes: false,
      }
    case 'standard':
    default:
      return {
        hide_browser_menubar: false,
        hide_loading_screen: false,
        enable_dictionary: false,
        enable_calculator: true,
        enable_notes: true,
      }
  }
}

/**
 * Generate a Browser Exam Key (BEK) pair for SEB.
 * In production, these keys should be generated once per exam session
 * and stored securely. The private key is used to sign/verify request hashes.
 */
export function generateBekPair(): BekPair {
  const publicKey = crypto.randomBytes(32).toString('hex')
  const privateKey = crypto.randomBytes(64).toString('hex')
  const configKey = crypto.randomBytes(16).toString('hex')
  const createdAt = new Date().toISOString()

  return { publicKey, privateKey, configKey, createdAt }
}

/**
 * Verify a SEB request hash against the expected value.
 * SEB computes: SHA-256(configKey + startUrl + examTime)
 */
export function verifySebRequestHash(
  requestHash: string,
  bekPair: BekPair,
  startUrl: string,
  examTime: number
): boolean {
  const expected = crypto
    .createHash('sha256')
    .update(bekPair.configKey + startUrl + examTime.toString())
    .digest('hex')

  return requestHash === expected
}

/**
 * Generate a SEB configuration file as a ZIP buffer.
 * SEB configs are ZIP archives containing a config.json file.
 */
export function generateSebConfig(config: SebConfig): Uint8Array {
  const encoder = new TextEncoder()
  const contentBytes = encoder.encode(JSON.stringify(config, null, 2))
  const fileNameBytes = encoder.encode('config.json')
  const deflated = zlib.deflateSync(contentBytes)

  const crc = crc32(contentBytes)

  const localHeaderSize = 30 + fileNameBytes.length
  const centralHeaderSize = 46 + fileNameBytes.length
  const totalSize = localHeaderSize + deflated.length + centralHeaderSize + 22

  const buffer = new Uint8Array(totalSize)
  let offset = 0

  function writeBytes(data: Uint8Array) {
    buffer.set(data, offset)
    offset += data.length
  }

  function writeUint16(value: number) {
    buffer[offset++] = value & 0xff
    buffer[offset++] = (value >> 8) & 0xff
  }

  function writeUint32(value: number) {
    buffer[offset++] = value & 0xff
    buffer[offset++] = (value >> 8) & 0xff
    buffer[offset++] = (value >> 16) & 0xff
    buffer[offset++] = (value >> 24) & 0xff
  }

  function writeString(value: string) {
    const bytes = encoder.encode(value)
    writeBytes(bytes)
  }

  writeString('PK')
  writeUint16(0x0201)
  writeUint16(0x0000)
  writeUint16(0x0008)
  writeUint16(0)
  writeUint16(0)
  writeUint32(crc)
  writeUint32(deflated.length)
  writeUint32(contentBytes.length)
  writeUint16(fileNameBytes.length)
  writeUint16(0)
  writeBytes(fileNameBytes)

  writeBytes(deflated)

  writeString('PK')
  writeUint16(0x0201)
  writeUint16(0x0201)
  writeUint16(0x0000)
  writeUint16(0x0008)
  writeUint16(0)
  writeUint16(0)
  writeUint32(crc)
  writeUint32(deflated.length)
  writeUint32(contentBytes.length)
  writeUint16(fileNameBytes.length)
  writeUint16(0)
  writeUint16(0)
  writeUint16(0)
  writeUint16(0)
  writeUint32(0)
  writeUint32(0)
  writeBytes(fileNameBytes)

  writeString('PK')
  writeUint16(0x0605)
  writeUint16(0x0000)
  writeUint16(0x0000)
  writeUint16(0x0000)
  writeUint16(0x0000)
  writeUint32(localHeaderSize + deflated.length)
  writeUint32(centralHeaderSize)

  return buffer
}

/**
 * Build a complete SEB config with bank-level settings merged in.
 */
export function buildSebConfig(options: {
  bekPair: BekPair
  startUrl: string
  examDurationSecs: number
  bankConfig: BankSebConfig | null | undefined
}): SebConfig {
  const merged = mergeBankConfig(options.bankConfig)
  const permissions = lockdownLevelToPermissions(merged.lockdownLevel)
  const userInterface = lockdownLevelToUserInterface(merged.lockdownLevel)

  return {
    start_url: options.startUrl,
    config_key: options.bekPair.configKey,
    browserExamKey: options.bekPair.publicKey,
    allow_quit: merged.allowQuit,
    show_taskbar: merged.showTaskbar,
    enable_exit_sequencer: merged.enableExitSequencer,
    allowed_applications: merged.allowedApplications,
    blocked_applications: merged.blockedApplications,
    enable_print_screen: merged.enablePrintScreen,
    enable_clipboard: merged.enableClipboard,
    enable_developer_tools: merged.enableDeveloperTools,
    exam_time: options.examDurationSecs,
    permissions,
    user_interface: userInterface,
    exam_cookies: {
      store_session_data: true,
      clear_on_exit: true,
    },
  }
}

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i]
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}
