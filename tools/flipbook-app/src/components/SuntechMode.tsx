import React from 'react'
import type { ScrapeConfig } from '../types'

interface SuntechModeProps {
  config: ScrapeConfig
  setConfig: React.Dispatch<React.SetStateAction<ScrapeConfig>>
  onPickOutput: () => void
  disabled: boolean
}

export default function SuntechMode({
  config,
  setConfig,
  onPickOutput,
  disabled,
}: SuntechModeProps) {
  const update = (patch: Partial<ScrapeConfig>) => setConfig((prev) => ({ ...prev, ...patch }))

  return (
    <div className="mode-section">
      <h2>Suntech Preset</h2>
      <p className="hint">
        Pre-configured for courses.suntech-bc.com WordPress login and flipbook selectors.
      </p>

      <div className="form-group">
        <label htmlFor="st-url">Module URL</label>
        <input
          id="st-url"
          type="url"
          placeholder="https://courses.suntech-bc.com/module/8"
          value={config.url}
          onChange={(e) => update({ url: e.target.value })}
          disabled={disabled}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="st-user">Username</label>
          <input
            id="st-user"
            type="text"
            placeholder="Username or email"
            value={config.username}
            onChange={(e) => update({ username: e.target.value })}
            disabled={disabled}
          />
        </div>
        <div className="form-group">
          <label htmlFor="st-pass">Password</label>
          <input
            id="st-pass"
            type="password"
            placeholder="Password"
            value={config.password}
            onChange={(e) => update({ password: e.target.value })}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="st-pages">Page Count (0 = auto-detect)</label>
          <input
            id="st-pages"
            type="number"
            min="0"
            value={config.pages}
            onChange={(e) => update({ pages: parseInt(e.target.value || '0', 10) })}
            disabled={disabled}
          />
        </div>
        <div className="form-group">
          <label htmlFor="st-name">Document Name</label>
          <input
            id="st-name"
            type="text"
            placeholder="EASA-Module-8"
            value={config.documentName}
            onChange={(e) => update({ documentName: e.target.value })}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="form-group">
        <label>Capture Method</label>
        <div className="radio-group">
          <label className="radio-label">
            <input
              type="radio"
              name="capture-method"
              value="interception"
              checked={config.captureMethod === 'interception'}
              onChange={() => update({ captureMethod: 'interception' })}
              disabled={disabled}
            />
            Image Interception (preferred)
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="capture-method"
              value="screenshot"
              checked={config.captureMethod === 'screenshot'}
              onChange={() => update({ captureMethod: 'screenshot' })}
              disabled={disabled}
            />
            Screenshot
          </label>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="st-output">Output Directory</label>
        <div className="input-with-button">
          <input
            id="st-output"
            type="text"
            value={config.outputDir}
            onChange={(e) => update({ outputDir: e.target.value })}
            disabled={disabled}
          />
          <button type="button" onClick={onPickOutput} disabled={disabled} className="secondary">
            Browse
          </button>
        </div>
      </div>

      <div className="form-group checkbox-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={config.imagesOnly}
            onChange={(e) => update({ imagesOnly: e.target.checked })}
            disabled={disabled}
          />
          Images only (skip PDF conversion)
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={config.headless}
            onChange={(e) => update({ headless: e.target.checked })}
            disabled={disabled}
          />
          Run headless
        </label>
      </div>
    </div>
  )
}
