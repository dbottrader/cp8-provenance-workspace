import { useState } from 'react'
import { DistributedSyncManager } from '../lib/DistributedSync'
import ResonantState from '../lib/ResonantState'
import GlyphGrid from '../components/GlyphGrid'

export default function Expansion() {
  const [nodeId, setNodeId] = useState('node-' + Math.random().toString(36).slice(2, 7))
  const [manager, setManager] = useState<DistributedSyncManager | null>(null)
  const [stats, setStats] = useState<ReturnType<DistributedSyncManager['getStats']> | null>(null)
  const [sequence, setSequence] = useState('')
  const [log, setLog] = useState<string[]>([])

  function addLog(msg: string) {
    setLog(prev => [`[${new Date().toISOString().split('T')[1].slice(0, 8)}] ${msg}`, ...prev.slice(0, 19)])
  }

  function handleInit() {
    const initial = new ResonantState()
    const mgr = new DistributedSyncManager(nodeId, initial)
    setManager(mgr)
    addLog(`Node "${nodeId}" initialized`)
    setStats(mgr.getStats())
  }

  async function handleBroadcast() {
    if (!manager || !sequence.trim()) return
    try {
      await manager.updateState(sequence.trim())
      const s = manager.getStats()
      setStats(s)
      addLog(`Delta broadcast: "${sequence.trim()}" — verified ${s.verifiedDeltas}/${s.totalDeltas}`)
      setSequence('')
    } catch (e) {
      addLog(`Error: ${e}`)
    }
  }

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-accent">Expansion — Transmit</h2>
        <p className="text-xs text-muted">
          Distributed sync layer. Hash-linked state deltas with SHA-256 replay verification.
          Each node maintains an auditable log of every state change.
        </p>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted block mb-1">Node ID</label>
            <input
              className="w-full bg-panel border border-line rounded px-3 py-2 text-sm text-ink font-mono focus:outline-none focus:border-accent"
              value={nodeId}
              onChange={e => setNodeId(e.target.value)}
              disabled={!!manager}
            />
          </div>
          <button
            onClick={handleInit}
            disabled={!!manager}
            className="px-4 py-2 bg-accent/10 border border-accent text-accent text-sm rounded hover:bg-accent/20 disabled:opacity-40 transition-colors"
          >
            {manager ? '✓ Node Active' : '✺ Initialize Node'}
          </button>
        </div>

        {manager && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                className="flex-1 bg-panel border border-line rounded px-3 py-2 text-sm text-ink font-mono placeholder-muted focus:outline-none focus:border-accent"
                placeholder="State sequence to broadcast..."
                value={sequence}
                onChange={e => setSequence(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleBroadcast()}
              />
              <button
                onClick={handleBroadcast}
                disabled={!sequence}
                className="px-4 py-2 bg-good/10 border border-good text-good text-sm rounded hover:bg-good/20 disabled:opacity-40 transition-colors"
              >
                Broadcast
              </button>
            </div>

            {stats && (
              <div className="bg-panel border border-line rounded p-3 font-mono text-xs grid grid-cols-2 gap-2">
                <div><span className="text-muted">total deltas</span><br /><span className="text-ink">{stats.totalDeltas}</span></div>
                <div><span className="text-muted">verified</span><br /><span className="text-good">{stats.verifiedDeltas}</span></div>
                <div><span className="text-muted">failed</span><br /><span className="text-bad">{stats.failedVerifications}</span></div>
                <div><span className="text-muted">avg latency</span><br /><span className="text-ink">{stats.averageLatency.toFixed(0)}ms</span></div>
              </div>
            )}
          </div>
        )}

        {/* Activity log */}
        {log.length > 0 && (
          <div className="bg-panel border border-line rounded p-3 font-mono text-xs space-y-1 max-h-40 overflow-y-auto">
            {log.map((entry, i) => (
              <div key={i} className="text-muted">{entry}</div>
            ))}
          </div>
        )}
      </div>

      <div>
        <GlyphGrid room="expansion" />
      </div>
    </div>
  )
}
