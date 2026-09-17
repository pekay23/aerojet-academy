import React from 'react'
import type { GeneralScrapeConfig } from '../types'

interface GeneralModeProps {
  config: GeneralScrapeConfig
  setConfig: React.Dispatch<React.SetStateAction<GeneralScrapeConfig>>
  onPickOutput: () => void
  disabled: boolean
}

export default function GeneralMode({
  config,
  setConfig,
  onPickOutput,
  disabled,
}: GeneralModeProps) {
  const update = (patch: Partial<GeneralScrapeConfig>) =>
    setConfig((prev) => ({ ...prev, ...patch }))

  return (
    <div className="mode-section">
      <h2>General Mode</h2>
      <p className="hint">Configure selectors and navigation for any flipbook website.</p>

      <div className="form-group">
        <label htmlFor="gen-url">Flipbook URL</label>
        <input
          id="gen-url"
          type="url"
          placeholder="https://example.com/flipbook"
          value={config.url}
          onChange={(e) => update({ url: e.target.value })}
          disabled={disabled}
        />
      </div>

      <details className="details-block">
        <summary>Login (optional)</summary>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="gen-login-url">Login URL</label>
            <input
              id="gen-login-url"
              type="url"
              placeholder="https://example.com/login"
              value={config.loginUrl}
              onChange={(e) => update({ loginUrl: e.target.value })}
              disabled={disabled}
            />
          </div>
          <div className="form-group">
            <label htmlFor="gen-user">Username</label>
            <input
              id="gen-user"
              type="text"
              value={config.username}
              onChange={(e) => update({ username: e.target.value })}
              disabled={disabled}
            />
          </div>
          <div className="form-group">
            <label htmlFor="gen-pass">Password</label>
            <input
              id="gen-pass"
              type="password"
              value={config.password}
              onChange={(e) => update({ password: e.target.value })}
              disabled={disabled}
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="gen-user-sel">Username Field Selector</label>
            <input
              id="gen-user-sel"
              type="text"
              value={config.usernameField}
              onChange={(e) => update({ usernameField: e.target.value })}
              disabled={disabled}
            />
          </div>
          <div className="form-group">
            <label htmlFor="gen-pass-sel">Password Field Selector</label>
            <input
              id="gen-pass-sel"
              type="text"
              value={config.passwordField}
              onChange={(e) => update({ passwordField: e.target.value })}
              disabled={disabled}
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Submit Method</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="submit-method"
                  value="enter"
                  checked={config.submitMethod === 'enter'}
                  onChange={() => update({ submitMethod: 'enter' })}
                  disabled={disabled}
                />
                Press Enter
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="submit-method"
                  value="click"
                  checked={config.submitMethod === 'click'}
                  onChange={() => update({ submitMethod: 'click' })}
                  disabled={disabled}
                />
                Click Button
              </label>
            </div>
          </div>
          {config.submitMethod === 'click' && (
            <div className="form-group">
              <label htmlFor="gen-submit-sel">Submit Button Selector</label>
              <input
                id="gen-submit-sel"
                type="text"
                value={config.submitSelector}
                onChange={(e) => update({ submitSelector: e.target.value })}
                disabled={disabled}
              />
            </div>
          )}
        </div>
      </details>

      <details className="details-block" open>
        <summary>Navigation</summary>
        <div className="form-group">
          <label>Navigation Method</label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="nav-method"
                value="arrow"
                checked={config.navigationMethod === 'arrow'}
                onChange={() => update({ navigationMethod: 'arrow' })}
                disabled={disabled}
              />
              Arrow Keys
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="nav-method"
                value="click"
                checked={config.navigationMethod === 'click'}
                onChange={() => update({ navigationMethod: 'click' })}
                disabled={disabled}
              />
              Button Clicks
            </label>
          </div>
        </div>
        {config.navigationMethod === 'click' && (
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="gen-next-sel">Next Button Selector</label>
              <input
                id="gen-next-sel"
                type="text"
                value={config.nextSelector}
                onChange={(e) => update({ nextSelector: e.target.value })}
                disabled={disabled}
              />
            </div>
            <div className="form-group">
              <label htmlFor="gen-prev-sel">Previous Button Selector</label>
              <input
                id="gen-prev-sel"
                type="text"
                value={config.prevSelector}
                onChange={(e) => update({ prevSelector: e.target.value })}
                disabled={disabled}
              />
            </div>
          </div>
        )}
      </details>

      <details className="details-block" open>
        <summary>Capture Settings</summary>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="gen-img-sel">Image CSS Selector</label>
            <input
              id="gen-img-sel"
              type="text"
              value={config.imageSelector}
              onChange={(e) => update({ imageSelector: e.target.value })}
              disabled={disabled}
            />
          </div>
          <div className="form-group">
            <label>Capture Method</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="gen-capture-method"
                  value="interception"
                  checked={config.captureMethod === 'interception'}
                  onChange={() => update({ captureMethod: 'interception' })}
                  disabled={disabled}
                />
                Interception
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="gen-capture-method"
                  value="screenshot"
                  checked={config.captureMethod === 'screenshot'}
                  onChange={() => update({ captureMethod: 'screenshot' })}
                  disabled={disabled}
                />
                Screenshot
              </label>
            </div>
          </div>
        </div>
      </details>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="gen-pages">Page Count (0 = auto-detect)</label>
          <input
            id="gen-pages"
            type="number"
            min="0"
            value={config.pages}
            onChange={(e) => update({ pages: parseInt(e.target.value || '0', 10) })}
            disabled={disabled}
          />
        </div>
        <div className="form-group">
          <label htmlFor="gen-name">Document Name</label>
          <input
            id="gen-name"
            type="text"
            placeholder="document-name"
            value={config.documentName}
            onChange={(e) => update({ documentName: e.target.value })}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="gen-output">Output Directory</label>
        <div className="input-with-button">
          <input
            id="gen-output"
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
