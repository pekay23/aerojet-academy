import type { ProgressState } from '../types'

interface ProgressPanelProps {
  progress: ProgressState | null
  logs: string[]
  running: boolean
  onStart: () => void
  onStop: () => void
}

const statusLabels: Record<string, string> = {
  starting: 'Starting',
  'logging-in': 'Logging in',
  navigating: 'Navigating',
  'detecting-pages': 'Detecting pages',
  capturing: 'Capturing',
  'saving-pdf': 'Saving PDF',
  done: 'Done',
  error: 'Error',
  stopped: 'Stopped',
}

export default function ProgressPanel({
  progress,
  logs,
  running,
  onStart,
  onStop,
}: ProgressPanelProps) {
  const percent =
    progress && progress.totalPages && progress.totalPages > 0
      ? Math.round((progress.currentPage / progress.totalPages) * 100)
      : 0

  const statusClass = progress?.status.replace(/-/g, '') || 'idle'

  return (
    <div className="progress-section">
      <h3>Progress</h3>

      <div className="progress-card">
        <div className="progress-header">
          <span className={`status-badge ${statusClass}`}>
            {statusLabels[progress?.status || 'idle'] || progress?.status || 'Idle'}
          </span>
          {progress && progress.totalPages && (
            <span className="page-count">
              Page {progress.currentPage} / {progress.totalPages}
            </span>
          )}
        </div>

        {progress && progress.totalPages && progress.totalPages > 0 && (
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${percent}%` }} />
          </div>
        )}

        {progress && <p className="progress-message">{progress.message}</p>}
      </div>

      <div className="actions">
        <button onClick={onStart} disabled={running} className="primary">
          {running ? 'Running...' : 'Start'}
        </button>
        <button onClick={onStop} disabled={!running} className="danger">
          Stop
        </button>
      </div>

      <div className="logs">
        <h4>Logs</h4>
        <div className="log-container">
          {logs.length === 0 ? (
            <p className="log-empty">No logs yet.</p>
          ) : (
            logs.map((line, i) => (
              <div key={i} className="log-line">
                {line}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
