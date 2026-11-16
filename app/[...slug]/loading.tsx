export default function Loading() {
  return (
    <main className="route-loading" role="status" aria-live="polite">
      <span className="sr-only">Loading tool…</span>
      <div className="loading-card">
        <span className="loading-kicker">DIGITALIVEZ TOOLS</span>
        <span className="loading-line loading-line-title" />
        <span className="loading-line" />
        <span className="loading-line loading-line-short" />
        <span className="loading-panel" />
      </div>
    </main>
  )
}
