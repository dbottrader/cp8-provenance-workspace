import { useState } from 'react'

const API_BASE = '/api'

interface CodexEntry {
  tsh_code: string
  iupac_name: string
  common_name: string
  smiles: string
  molecular_weight: number | null
  substitutions: { position: string; group: string }[]
  n_chain: string | null
  alpha_methyl: boolean
  affinity_prediction: {
    tsh_code: string
    predicted_ki_nM: number
    confidence: number
    affinity_class: string
  }
  '3d_coordinates': {
    atoms: { element: string; x: number; y: number; z: number }[]
    bonds: { atom1: number; atom2: number; order: number; distance: number }[]
    center_of_mass: { x: number; y: number; z: number }
  }
  temporal_stability: {
    stability_score: number
    temporal_resilience: string
    drift_factor: number
    chronal_anchor: number
  }
  chronal_anchor_freq: number
}

const PRESET_CODES = [
  '◇④f∴mm',
  '◇④h∴mm',
  '◇⑤m∴mm',
  '◇∴mm',
  '◇④c∴mm',
  '◇⑤h∴mm',
  '◇④m⑤h∴mm',
]

export default function MolecularArchivist() {
  const [code, setCode] = useState('◇④f∴mm')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CodexEntry | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'smiles' | '3d' | 'affinity'>('overview')

  const analyze = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch(`${API_BASE}/codex-entry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tsh_code: code }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || `HTTP ${res.status}`)
      }
      const data = await res.json()
      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Input Panel */}
      <div className="panel space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-cp8-text">TSH Scaffold Analysis</h2>
          <span className="text-xs text-cp8-muted font-mono">CP8 Protocol</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && analyze()}
            className="input-cp8 flex-1 font-mono"
            placeholder="Enter TSH code (e.g. ◇④f∴mm)"
          />
          <button
            onClick={analyze}
            disabled={loading || !code.trim()}
            className="btn-cp8 whitespace-nowrap"
          >
            {loading ? 'Analyzing…' : 'Analyze'}
          </button>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-cp8-muted py-1">Presets:</span>
          {PRESET_CODES.map((c) => (
            <button
              key={c}
              onClick={() => { setCode(c); }}
              className={`text-xs px-2 py-1 rounded border transition-all ${
                c === code
                  ? 'border-cp8-accent bg-cp8-accent/10 text-cp8-accent'
                  : 'border-white/10 text-cp8-muted hover:border-white/30'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="panel border-cp8-accent/30 bg-cp8-accent/5">
          <p className="text-sm text-cp8-accent">{error}</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Header */}
          <div className="panel">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{result.tsh_code}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-cp8-accent/10 text-cp8-accent font-mono">
                {result.common_name}
              </span>
            </div>
            <p className="text-xs text-cp8-muted font-mono">{result.iupac_name}</p>
            <div className="flex gap-4 mt-3 text-xs font-mono">
              <span className="text-cp8-muted">MW: <span className="text-cp8-text">{result.molecular_weight ?? 'N/A'} g/mol</span></span>
              <span className="text-cp8-muted">α-Me: <span className="text-cp8-text">{result.alpha_methyl ? 'Yes' : 'No'}</span></span>
              <span className="text-cp8-muted">N-Chain: <span className="text-cp8-text">{result.n_chain ?? 'N/A'}</span></span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-white/10">
            {(['overview', 'smiles', '3d', 'affinity'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-2 text-xs font-medium transition-all ${
                  activeTab === tab
                    ? 'text-cp8-accent border-b-2 border-cp8-accent'
                    : 'text-cp8-muted hover:text-cp8-text'
                }`}
              >
                {tab === 'overview' && 'Overview'}
                {tab === 'smiles' && 'SMILES'}
                {tab === '3d' && '3D Coordinates'}
                {tab === 'affinity' && '5-HT₂A Affinity'}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="panel space-y-4">
              <h3 className="text-xs font-semibold text-cp8-muted uppercase tracking-wider">Substitutions</h3>
              {result.substitutions.length === 0 ? (
                <p className="text-sm text-cp8-muted">No ring substitutions.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {result.substitutions.map((s, i) => (
                    <div key={i} className="bg-cp8-dark border border-white/10 rounded px-3 py-2">
                      <p className="text-xs text-cp8-muted">{s.position}</p>
                      <p className="text-sm font-medium">{s.group}</p>
                    </div>
                  ))}
                </div>
              )}

              <h3 className="text-xs font-semibold text-cp8-muted uppercase tracking-wider">Temporal Stability</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-cp8-dark border border-white/10 rounded px-3 py-2">
                  <p className="text-xs text-cp8-muted">Stability</p>
                  <p className="text-sm font-mono">{result.temporal_stability.stability_score}%</p>
                </div>
                <div className="bg-cp8-dark border border-white/10 rounded px-3 py-2">
                  <p className="text-xs text-cp8-muted">Resilience</p>
                  <p className="text-sm font-mono">{result.temporal_stability.temporal_resilience}</p>
                </div>
                <div className="bg-cp8-dark border border-white/10 rounded px-3 py-2">
                  <p className="text-xs text-cp8-muted">Drift</p>
                  <p className="text-sm font-mono">{result.temporal_stability.drift_factor}%</p>
                </div>
                <div className="bg-cp8-dark border border-white/10 rounded px-3 py-2">
                  <p className="text-xs text-cp8-muted">Anchor</p>
                  <p className="text-sm font-mono">{result.temporal_stability.chronal_anchor} Hz</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'smiles' && (
            <div className="panel space-y-3">
              <h3 className="text-xs font-semibold text-cp8-muted uppercase tracking-wider">SMILES String</h3>
              <div className="code-block">{result.smiles}</div>
              <p className="text-xs text-cp8-muted">
                Simplified Molecular Input Line Entry System representation of the compound structure.
              </p>
            </div>
          )}

          {activeTab === '3d' && (
            <div className="panel space-y-3">
              <h3 className="text-xs font-semibold text-cp8-muted uppercase tracking-wider">
                3D Coordinates ({result['3d_coordinates'].atoms.length} atoms)
              </h3>
              <div className="code-block max-h-64">
                {JSON.stringify(result['3d_coordinates'], null, 2)}
              </div>
              <p className="text-xs text-cp8-muted">
                Center of mass: ({result['3d_coordinates'].center_of_mass.x.toFixed(3)},{' '}
                {result['3d_coordinates'].center_of_mass.y.toFixed(3)},{' '}
                {result['3d_coordinates'].center_of_mass.z.toFixed(3)})
              </p>
            </div>
          )}

          {activeTab === 'affinity' && (
            <div className="panel space-y-3">
              <h3 className="text-xs font-semibold text-cp8-muted uppercase tracking-wider">5-HT₂A Receptor Affinity Prediction</h3>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-cp8-dark border border-white/10 rounded px-3 py-2">
                  <p className="text-xs text-cp8-muted">Predicted Kᵢ</p>
                  <p className="text-lg font-mono">{result.affinity_prediction.predicted_ki_nM} <span className="text-xs">nM</span></p>
                </div>
                <div className="bg-cp8-dark border border-white/10 rounded px-3 py-2">
                  <p className="text-xs text-cp8-muted">Confidence</p>
                  <p className="text-lg font-mono">{(result.affinity_prediction.confidence * 100).toFixed(0)}%</p>
                </div>
                <div className="bg-cp8-dark border border-white/10 rounded px-3 py-2">
                  <p className="text-xs text-cp8-muted">Class</p>
                  <p className={`text-lg font-mono ${
                    result.affinity_prediction.affinity_class === 'VERY HIGH' || result.affinity_prediction.affinity_class === 'HIGH'
                      ? 'text-cp8-accent'
                      : 'text-cp8-text'
                  }`}>
                    {result.affinity_prediction.affinity_class}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
