import { motion } from 'framer-motion'
import type ResonantState from '../lib/ResonantState'

interface Props {
  state: ResonantState | null
}

const HARMONIC_CONSTANTS = [
  { label: 'f₀ Anchor',  value: 432,  color: 'text-accent' },
  { label: 'HHC Base',   value: 428,  color: 'text-good'   },
  { label: 'Love Freq',  value: 528,  color: 'text-warn'   },
  { label: 'Crown',      value: 963,  color: 'text-bad'    },
]

export default function HarmonicConsole({ state }: Props) {
  const status = state?.sealedHash
    ? 'SEALED'
    : state
    ? 'ACTIVE'
    : 'STANDBY'

  const statusColor = {
    SEALED: 'text-good border-good',
    ACTIVE: 'text-warn border-warn',
    STANDBY: 'text-muted border-line',
  }[status]

  return (
    <div className="bg-panel border border-line rounded p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">Harmonic Console</p>
        <span className={`text-xs font-mono px-2 py-0.5 rounded border ${statusColor}`}>
          {status}
        </span>
      </div>

      {/* Constants */}
      <div className="grid grid-cols-2 gap-2">
        {HARMONIC_CONSTANTS.map(c => (
          <div key={c.label} className="bg-bg border border-line rounded px-3 py-2">
            <div className="text-xs text-muted">{c.label}</div>
            <div className={`text-sm font-mono font-bold ${c.color}`}>{c.value} Hz</div>
          </div>
        ))}
      </div>

      {/* Live derived freqs */}
      {state && state.derivedFrequencies.length > 0 && (
        <div>
          <p className="text-xs text-muted mb-2">Derived from "{state.inputSequence}"</p>
          <div className="flex flex-wrap gap-1">
            {state.derivedFrequencies.map((f, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                className="text-xs font-mono px-2 py-0.5 bg-accent/10 border border-accent/30 rounded text-accent"
              >
                {f.toFixed(1)}
              </motion.span>
            ))}
          </div>
        </div>
      )}

      {/* Hash chain indicator */}
      {state?.sealedHash && (
        <div className="font-mono text-xs space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-good inline-block" />
            <span className="text-muted">chain intact</span>
          </div>
          <div className="text-muted truncate">{state.sealedHash.slice(0, 32)}…</div>
        </div>
      )}
    </div>
  )
}
