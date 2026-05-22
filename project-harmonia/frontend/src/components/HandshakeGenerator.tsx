import { useState } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

interface HandshakeResponse {
  token: string
  anu28_state: string
  expires_at: string
}

export default function HandshakeGenerator() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<HandshakeResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const generate = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/sessions/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setResult(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate handshake')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    if (!result) return
    const markdown = `
\`\`\`bash
# ASIN-HHC CP8 Handshake Token
TOKEN="${result.token}"
ANU28="${result.anu28_state}"
EXPIRES="${result.expires_at}"

# Exchange for session
curl -X POST ${API_BASE}/api/sessions/exchange \\
  -H "Content-Type: application/json" \\
  -d '{"token": "'"$TOKEN"'", "anu28_state": "'"$ANU28"'"}'
\`\`\`
    `.trim()
    await navigator.clipboard.writeText(markdown)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="glass-panel p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">ASH-0.2 Handshake Generator</h2>
        <button
          onClick={generate}
          disabled={loading}
          className="btn-primary disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Generate Handshake'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-harmonic-rose/10 border border-harmonic-rose/30 text-harmonic-rose text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/60">Generated at {new Date().toLocaleTimeString()}</span>
            <button
              onClick={copyToClipboard}
              className="text-xs text-harmonic-cyan hover:text-harmonic-cyan/80 transition-colors"
            >
              {copied ? 'Copied!' : 'Copy markdown'}
            </button>
          </div>

          <div className="code-block space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-harmonic-cyan font-mono text-xs w-20 shrink-0">TOKEN</span>
              <span className="text-white/80 break-all">{result.token}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-harmonic-magenta font-mono text-xs w-20 shrink-0">ANU-28</span>
              <span className="text-white/80 break-all">{result.anu28_state}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-harmonic-gold font-mono text-xs w-20 shrink-0">EXPIRES</span>
              <span className="text-white/80">{result.expires_at}</span>
            </div>
          </div>

          <div className="code-block">
            <p className="text-white/40 text-xs mb-2"># Exchange for session</p>
            <p className="text-harmonic-cyan/80">
              curl -X POST {API_BASE}/api/sessions/exchange \
            </p>
            <p className="text-white/60 pl-4">
              -H "Content-Type: application/json" \
            </p>
            <p className="text-white/60 pl-4">
              -d {`{"token": "${result.token.slice(0, 8)}...", "anu28_state": "${result.anu28_state.slice(0, 8)}..."}`}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
