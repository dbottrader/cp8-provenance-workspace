import { useState } from 'react'
import ResonantState from '../lib/ResonantState'
import GlyphGrid from '../components/GlyphGrid'
import HarmonicConsole from '../components/HarmonicConsole'

export default function Resonance() {
  const [input, setInput] = useState('')
  const [state, setState] = useState<ResonantState | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleCompute() {
    if (!input.trim()) return
    setLoading(true)
    const rs = new ResonantState(state?.sealedHash ?? null)
    rs.updateSequence(input.trim())
    await rs.seal(Date.now())
    setState(rs)
    setLoading(false)
  }

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-accent">Resonance — Shape</h2>
        <p className="text-xs text-muted">
          Derive frequencies from input using just-intonation ratios anchored at 432 Hz.
          Each state seals to SHA-256 and links to the previous hash.
        </p>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted block mb-1">Input Sequence</label>
            <input
              className="w-full bg-panel border border-line rounded px-3 py-2 text-sm text-ink placeholder-muted focus:outline-none focus:border-accent font-mono"
              placeholder="e.g. ASIN, CP8, HHC..."
              value={input}
              onChange={e => setInput(e.target.value)}
            />
          </div>
          <button
            onClick={handleCompute}
            disabled={loading || !input}
            className="px-4 py-2 bg-accent/10 border border-accent text-accent text-sm rounded hover:bg-accent/20 disabled:opacity-40 transition-colors"
          >
            {loading ? 'Computing...' : '∞ Derive Frequencies'}
          </button>
        </div>

        {state && (
          <div className="bg-panel border border-line rounded p-4 space-y-3 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-muted">anchor f₀</span>
              <span className="text-good">{state.f0} Hz</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">sequence</span>
              <span className="text-ink tracking-widest">{state.inputSequence}</span>
            </div>
            <div>
              <span className="text-muted block mb-1">derived frequencies</span>
              <div className="flex flex-wrap gap-2">
                {state.derivedFrequencies.map((f, i) => (
                  <span key={i} className="px-2 py-0.5 bg-accent/10 border border-accent/30 rounded text-accent">
                    {f.toFixed(2)} Hz
                  </span>
                ))}
              </div>
            </div>
            <div>
              <span className="text-muted block">sealed hash</span>
              <span className="text-accent break-all">{state.sealedHash}</span>
            </div>
            {state.previousHash && (
              <div>
                <span className="text-muted block">previous hash</span>
                <span className="text-muted break-all">{state.previousHash}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <HarmonicConsole state={state} />
        <GlyphGrid room="resonance" />
      </div>
    </div>
  )
}
