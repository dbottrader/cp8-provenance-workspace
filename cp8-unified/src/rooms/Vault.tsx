import { useState } from 'react'
import { generateManifest, type ManifestResult } from '../lib/manifest'
import GlyphGrid from '../components/GlyphGrid'

export default function Vault() {
  const [artifactId, setArtifactId] = useState('')
  const [content, setContent] = useState('')
  const [result, setResult] = useState<ManifestResult | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSeal() {
    if (!artifactId.trim() || !content.trim()) return
    setLoading(true)
    const manifest = await generateManifest({
      artifactId: artifactId.trim(),
      room: 'vault',
      content: content.trim(),
    })
    setResult(manifest)
    setLoading(false)
  }

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-accent">Vault — Anchor</h2>
        <p className="text-xs text-muted">Seal an artifact with SHA-256 provenance. Every entry links to the previous hash.</p>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted block mb-1">Artifact ID</label>
            <input
              className="w-full bg-panel border border-line rounded px-3 py-2 text-sm text-ink placeholder-muted focus:outline-none focus:border-accent"
              placeholder="e.g. vault-001"
              value={artifactId}
              onChange={e => setArtifactId(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-muted block mb-1">Content</label>
            <textarea
              rows={6}
              className="w-full bg-panel border border-line rounded px-3 py-2 text-sm text-ink placeholder-muted focus:outline-none focus:border-accent font-mono resize-none"
              placeholder="Paste artifact content, notes, or JSON..."
              value={content}
              onChange={e => setContent(e.target.value)}
            />
          </div>
          <button
            onClick={handleSeal}
            disabled={loading || !artifactId || !content}
            className="px-4 py-2 bg-accent/10 border border-accent text-accent text-sm rounded hover:bg-accent/20 disabled:opacity-40 transition-colors"
          >
            {loading ? 'Sealing...' : '⧖ Seal to Vault'}
          </button>
        </div>

        {result && (
          <div className="bg-panel border border-line rounded p-4 space-y-2 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-muted">artifact</span>
              <span className="text-ink">{result.entry.artifactId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">timestamp</span>
              <span className="text-ink">{result.entry.timestamp}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">binary key</span>
              <span className="text-good">{result.binaryDateKey}</span>
            </div>
            <div>
              <span className="text-muted block">content hash</span>
              <span className="text-accent break-all">{result.entry.contentHash}</span>
            </div>
            <div>
              <span className="text-muted block">manifest hash</span>
              <span className="text-good break-all">{result.manifestHash}</span>
            </div>
          </div>
        )}
      </div>

      <div>
        <GlyphGrid room="vault" />
      </div>
    </div>
  )
}
