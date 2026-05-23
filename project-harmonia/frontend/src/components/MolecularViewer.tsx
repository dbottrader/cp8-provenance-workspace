import { useState } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

interface Molecule3DResponse {
  smiles?: string
  coordinates?: number[][]
  atoms?: string[]
  bonds?: [number, number][]
  [key: string]: unknown
}

export default function MolecularViewer() {
  const [smiles, setSmiles] = useState('C1=CC=CC=C1')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Molecule3DResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const generate3D = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/generate-3d`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ smiles }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setResult(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate 3D structure')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-panel p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Molecular Viewer</h2>
          <p className="text-sm text-white/50">3D structure preview (placeholder)</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/30 px-2 py-1 rounded bg-white/5 border border-white/10">
            Three.js coming soon
          </span>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={smiles}
          onChange={e => setSmiles(e.target.value)}
          placeholder="Enter SMILES string..."
          className="input-field flex-1"
        />
        <button
          onClick={generate3D}
          disabled={loading || !smiles.trim()}
          className="btn-primary disabled:opacity-50 whitespace-nowrap"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Generating...
            </span>
          ) : (
            'Generate 3D'
          )}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-harmonic-rose/10 border border-harmonic-rose/30 text-harmonic-rose text-sm">
          {error}
        </div>
      )}

      {/* Placeholder for Three.js canvas */}
      <div className="relative aspect-video bg-black/40 rounded-xl border border-white/10 overflow-hidden mb-4">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4 opacity-20">🧬</div>
            <p className="text-white/30 text-sm font-mono">Three.js molecular viewer</p>
            <p className="text-white/20 text-xs mt-1">WebGL renderer initialization pending</p>
          </div>
        </div>

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 240, 255, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 240, 255, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-harmonic-cyan/30 rounded-tl-lg" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-harmonic-cyan/30 rounded-tr-lg" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-harmonic-cyan/30 rounded-bl-lg" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-harmonic-cyan/30 rounded-br-lg" />
      </div>

      {result && (
        <div className="code-block">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-harmonic-cyan">3D COORDINATES</span>
            <span className="text-xs text-white/30">{Object.keys(result).length} fields</span>
          </div>
          <pre className="text-xs text-white/70 overflow-x-auto max-h-48">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
