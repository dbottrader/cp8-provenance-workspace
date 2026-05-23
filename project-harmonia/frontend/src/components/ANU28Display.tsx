import { useState, useEffect } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

interface GlyphData {
  ring: string
  glyph: string
  color: string
  frequency: number
  meaning: string
}

const RING_COLORS: Record<string, string> = {
  Charge: 'harmonic-cyan',
  Form: 'harmonic-magenta',
  Blend: 'harmonic-gold',
  Guardian: 'harmonic-emerald',
  Shadow: 'harmonic-rose',
  Transcendent: 'harmonic-violet',
}

const RING_GRADIENTS: Record<string, string> = {
  Charge: 'from-cyan-500/20 to-cyan-400/5',
  Form: 'from-fuchsia-500/20 to-fuchsia-400/5',
  Blend: 'from-yellow-500/20 to-yellow-400/5',
  Guardian: 'from-emerald-500/20 to-emerald-400/5',
  Shadow: 'from-rose-500/20 to-rose-400/5',
  Transcendent: 'from-violet-500/20 to-violet-400/5',
}

export default function ANU28Display() {
  const [glyphs, setGlyphs] = useState<GlyphData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API_BASE}/api/glyphs`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(data => {
        setGlyphs(data.glyphs || [])
        setLoading(false)
      })
      .catch(e => {
        setError(e.message)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="glass-panel p-6">
        <h2 className="text-lg font-semibold text-white mb-4">ANU-28 Glyph Rings</h2>
        <div className="animate-pulse space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 bg-white/5 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="glass-panel p-6">
        <h2 className="text-lg font-semibold text-white mb-4">ANU-28 Glyph Rings</h2>
        <div className="text-harmonic-rose text-sm">{error}</div>
      </div>
    )
  }

  return (
    <div className="glass-panel p-6">
      <h2 className="text-lg font-semibold text-white mb-1">ANU-28 Glyph Rings</h2>
      <p className="text-sm text-white/50 mb-6">Six resonant bands of the Harmonic Cognition Lattice</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {glyphs.map((g) => {
          const colorKey = RING_COLORS[g.ring] || 'harmonic-cyan'
          const grad = RING_GRADIENTS[g.ring] || 'from-gray-500/20 to-gray-400/5'
          return (
            <div
              key={g.ring}
              className={`relative group p-4 rounded-xl bg-gradient-to-br ${grad} border border-white/5 hover:border-white/20 transition-all duration-300`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl font-mono" style={{ color: g.color }}>
                  {g.glyph}
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-white">{g.ring}</h3>
                  <span className="text-xs text-white/40">{g.frequency} Hz</span>
                </div>
              </div>
              <p className="text-xs text-white/60 leading-relaxed">{g.meaning}</p>

              {/* Glow effect on hover */}
              <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-${colorKey}/5 blur-xl -z-10`} />
            </div>
          )
        })}
      </div>

      {/* Fallback demo data if API returns empty */}
      {glyphs.length === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { ring: 'Charge', glyph: '⚡', color: '#00f0ff', freq: 528, meaning: 'Catalytic initiation — the spark of transformation' },
            { ring: 'Form', glyph: '◈', color: '#ff00a0', freq: 432, meaning: 'Structural coherence — pattern crystallization' },
            { ring: 'Blend', glyph: '◇', color: '#ffd700', freq: 396, meaning: 'Resonant fusion — harmonic integration' },
            { ring: 'Guardian', glyph: '◉', color: '#10b981', freq: 639, meaning: 'Protective encoding — boundary integrity' },
            { ring: 'Shadow', glyph: '◐', color: '#f43f5e', freq: 741, meaning: 'Cathartic release — transformative dissolution' },
            { ring: 'Transcendent', glyph: '◯', color: '#8b5cf6', freq: 852, meaning: 'Unified field — non-dual awareness' },
          ].map((g) => (
            <div
              key={g.ring}
              className={`relative group p-4 rounded-xl bg-gradient-to-br ${RING_GRADIENTS[g.ring]} border border-white/5 hover:border-white/20 transition-all duration-300`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl font-mono" style={{ color: g.color }}>{g.glyph}</span>
                <div>
                  <h3 className="text-sm font-semibold text-white">{g.ring}</h3>
                  <span className="text-xs text-white/40">{g.freq} Hz</span>
                </div>
              </div>
              <p className="text-xs text-white/60 leading-relaxed">{g.meaning}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
