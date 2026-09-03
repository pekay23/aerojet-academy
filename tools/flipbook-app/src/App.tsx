import { useState, useEffect } from 'react'
import { listen } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api/core'
import SuntechMode from './components/SuntechMode'
import GeneralMode from './components/GeneralMode'
import ProgressPanel from './components/ProgressPanel'
import type { ScrapeConfig, GeneralScrapeConfig } from './types'

type Mode = 'suntech' | 'general'

interface ProgressState {
  status: string
  currentPage: number
  totalPages: number | null
  message: string
}

export default function App() {
  const [mode, setMode] = useState<Mode>('suntech')
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState<ProgressState | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  const [suntechConfig, setSuntechConfig] = useState<ScrapeConfig>({
    url: '',
    username: '',
    password: '',
    pages: 0,
    outputDir: '',
    documentName: 'flipbook',
    captureMethod: 'interception',
    headless: true,
    imagesOnly: false,
  })

  const [generalConfig, setGeneralConfig] = useState<GeneralScrapeConfig>({
    url: '',
    username: '',
    password: '',
    pages: 0,
    outputDir: '',
    documentName: 'flipbook',
    captureMethod: 'interception',
    headless: true,
    imagesOnly: false,
    loginUrl: '',
    usernameField: "input[name='username'], input[type='email'], #username, #email",
    passwordField: "input[name='password'], input[type='password'], #password",
    submitMethod: 'enter',
    submitSelector: "button[type='submit'], input[type='submit'], .login-btn",
    navigationMethod: 'arrow',
    nextSelector: '',
    prevSelector: '',
    imageSelector: 'img.page-image, .flipbook img, .page img, canvas.page',
  })

  useEffect(() => {
    const unlisten = listen<string>('scrape-progress', (event) => {
      const line = event.payload
      setLogs((prev) => [...prev.slice(-200), line])

      const statusMatch = line.match(/\[(\w+)\]/)
      const pageMatch = line.match(/\((\d+)\/(\d+)\)/)
      if (statusMatch) {
        setProgress({
          status: statusMatch[1].toLowerCase(),
          currentPage: pageMatch ? parseInt(pageMatch[1]) : 0,
          totalPages: pageMatch ? parseInt(pageMatch[2]) : null,
          message: line.replace(/\[\w+\](?:\s*\(\d+\/\d+\))?\s*/, ''),
        })
      }
    })

    const unlistenComplete = listen('scrape-complete', () => {
      setRunning(false)
      setProgress((prev) => (prev ? { ...prev, status: 'done', message: 'Scrape complete' } : null))
    })

    return () => {
      unlisten.then((f) => f())
      unlistenComplete.then((f) => f())
    }
  }, [])

  const handleStart = async () => {
    const config = mode === 'suntech' ? suntechConfig : generalConfig
    if (!config.url) return

    setLogs([])
    setProgress({
      status: 'starting',
      currentPage: 0,
      totalPages: null,
      message: 'Starting scraper...',
    })
    setRunning(true)

    try {
      await invoke('start_scrape', {
        url: config.url,
        username: config.username,
        password: config.password,
        pages: config.pages || null,
        outputDir: config.outputDir,
        documentName: config.documentName || 'flipbook',
        mode,
        imagesOnly: config.imagesOnly,
        headless: config.headless,
        captureMethod: config.captureMethod,
      })
    } catch (e) {
      setRunning(false)
      setProgress({
        status: 'error',
        currentPage: 0,
        totalPages: null,
        message: String(e),
      })
    }
  }

  const handleStop = async () => {
    try {
      await invoke('stop_scrape')
      setRunning(false)
      setProgress((prev) =>
        prev
          ? { ...prev, status: 'stopped', message: 'Stopped by user' }
          : { status: 'stopped', currentPage: 0, totalPages: null, message: 'Stopped by user' }
      )
    } catch (e) {
      console.error('Failed to stop:', e)
    }
  }

  const handleOutputDir = async () => {
    const selected = window.prompt('Enter output directory path:')
    if (selected) {
      if (mode === 'suntech') {
        setSuntechConfig((prev) => ({ ...prev, outputDir: selected }))
      } else {
        setGeneralConfig((prev) => ({ ...prev, outputDir: selected }))
      }
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Flipbook Scraper</h1>
        <div className="mode-toggle">
          <button className={mode === 'suntech' ? 'active' : ''} onClick={() => setMode('suntech')}>
            Suntech Preset
          </button>
          <button className={mode === 'general' ? 'active' : ''} onClick={() => setMode('general')}>
            General Mode
          </button>
        </div>
      </header>

      <main className="main">
        <div className="config-panel">
          {mode === 'suntech' ? (
            <SuntechMode
              config={suntechConfig}
              setConfig={setSuntechConfig}
              onPickOutput={handleOutputDir}
              disabled={running}
            />
          ) : (
            <GeneralMode
              config={generalConfig}
              setConfig={setGeneralConfig}
              onPickOutput={handleOutputDir}
              disabled={running}
            />
          )}
        </div>

        <div className="progress-panel">
          <ProgressPanel
            progress={progress}
            logs={logs}
            running={running}
            onStart={handleStart}
            onStop={handleStop}
          />
        </div>
      </main>
    </div>
  )
}
