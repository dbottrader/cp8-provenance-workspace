import { useState } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

interface ApiResponse {
  endpoint: string
  data: unknown
  timestamp: string
}

export default function TSHQuery() {
  const [code, setCode] = useState('◇④f∴mm')
  const [loading, setLoading] = useState<string | null>(null)
  const [results, setResults] = useState<ApiResponse[]>([])
  const [error, setError] = useState<string | null>(null)

  const endpoints = [
    { key: 'parse-tsh', label: 'Parse', desc: 'Parse TSH code' },
    { key: 'generate-smiles', label: 'SMILES', desc: 'Generate SMILES' },
    { key: 'predict-affinity', label: 'Affinity', desc: 'Predict binding' },
    { key: 'codex-entry', label: 'Codex', desc: 'Lookup codex' },
  ]

  const query = async (endpoint: string) => {
    setLoading(endpoint)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tsh_code: code }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setResults(prev => [
        { endpoint, data, timestamp: new Date().toLocaleTimeString() },
        ...prev.slice(0, 4),
      ])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Query failed')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="glass-panel p-6">
      <h2 className="text-lg font-semibold text-white mb-1">TSH Molecular Query</h2>
      <p className="text-sm text-white/50 mb-6">Bio-Harmonic Symbolic Hash decoder</p>

      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="◇④f∴mm"
            className="input-field flex-1"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {endpoints.map(({ key, label, desc }) => (
            <button
              key={key}
              onClick={() => query(key)}
              disabled={loading === key || !code.trim()}
              className="btn-secondary text-xs disabled:opacity-40"
              title={desc}
            >
              {loading === key ? (
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                  {label}
                </span>
              ) : (
                label
              )}
            </button>
          ))}
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-harmonic-rose/10 border border-harmonic-rose/30 text-harmonic-rose text-sm">
            {error}
          </div>
        )}

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {results.map((r, i) => (
            <div key={`${r.endpoint}-${i}`} className="code-block">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-harmonic-cyan uppercase">{r.endpoint}</span>
                <span className="text-xs text-white/30">{r.timestamp}</span>
              </div>
              <pre className="text-xs text-white/70 overflow-x-auto">
                {JSON.stringify(r.data, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
