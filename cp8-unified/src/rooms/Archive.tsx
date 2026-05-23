import { useState } from 'react'
import { generateManifest, sealArchive, type ManifestResult } from '../lib/manifest'
import GlyphGrid from '../components/GlyphGrid'

export default function Archive() {
  const [entries, setEntries] = useState<ManifestResult[]>([])
  const [label, setLabel] = useState('')
  const [content, setContent] = useState('')
  const [artifactId, setArtifactId] = useState('')
  const [archiveSeal, setArchiveSeal] = useState<Awaited<ReturnType<typeof sealArchive>> | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleAdd() {
    if (!artifactId.trim() || !content.trim()) return
    setLoading(true)
    const result = await generateManifest({
      artifactId: artifactId.trim(),
      room: 'archive',
      content: content.trim(),
      previousHash: entries[entries.length - 1]?.manifestHash ?? null,
    })
    setEntries(prev => [...prev, result])
    setArtifactId('')
    setContent('')
    setLoading(false)
  }

  async function handleSealArchive() {
    if (!entries.length || !label.trim()) return
    const seal = await sealArchive(entries, label.trim())
    setArchiveSeal(seal)
  }

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-accent">Archive — Seal</h2>
        <p className="text-xs text-muted">
          Bundle artifacts into an immutable hash-chained archive. Each entry links to the previous.
          Final seal produces a root hash over all entries.
        </p>

        <div className="bg-panel border border-line rounded p-4 space-y-3">
          <p className="text-xs font-semibold text-ink">Add Entry</p>
          <input
            className="w-full bg-bg border border-line rounded px-3 py-2 text-sm text-ink placeholder-muted focus:outline-none focus:border-accent"
            placeholder="Artifact ID"
            value={artifactId}
            onChange={e => setArtifactId(e.target.value)}
          />
          <textarea
            rows={3}
            className="w-full bg-bg border border-line rounded px-3 py-2 text-sm text-ink placeholder-muted focus:outline-none focus:border-accent font-mono resize-none"
            placeholder="Artifact content..."
            value={content}
            onChange={e => setContent(e.target.value)}
          />
          <button
            onClick={handleAdd}
            disabled={loading || !artifactId || !content}
            className="px-4 py-2 bg-accent/10 border border-accent text-accent text-sm rounded hover:bg-accent/20 disabled:opacity-40 transition-colors"
          >
            {loading ? 'Adding...' : '⟡ Add to Archive'}
          </button>
        </div>

        {/* Entry list */}
        {entries.length > 0 && (
          <div className="space-y-2">
            {entries.map((e, i) => (
              <div key={i} className="bg-panel border border-line rounded px-3 py-2 font-mono text-xs flex justify-between items-center">
                <span className="text-ink">{e.entry.artifactId}</span>
                <span className="text-muted truncate max-w-[200px]">{e.manifestHash.slice(0, 16)}…</span>
              </div>
            ))}
          </div>
        )}

        {/* Seal archive */}
        {entries.length > 0 && (
          <div className="bg-panel border border-line rounded p-4 space-y-3">
            <p className="text-xs font-semibold text-ink">Seal Archive Bundle</p>
            <input
              className="w-full bg-bg border border-line rounded px-3 py-2 text-sm text-ink placeholder-muted focus:outline-none focus:border-accent"
              placeholder="Archive label (e.g. vault-release-2025-09-22)"
              value={label}
              onChange={e => setLabel(e.target.value)}
            />
            <button
              onClick={handleSealArchive}
              disabled={!label}
              className="px-4 py-2 bg-good/10 border border-good text-good text-sm rounded hover:bg-good/20 disabled:opacity-40 transition-colors"
            >
              ◈ Seal Bundle
            </button>

            {archiveSeal && (
              <div className="font-mono text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted">label</span>
                  <span className="text-ink">{archiveSeal.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">entries</span>
                  <span className="text-ink">{archiveSeal.count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">sealed</span>
                  <span className="text-ink">{archiveSeal.sealed}</span>
                </div>
                <div>
                  <span className="text-muted block">root hash</span>
                  <span className="text-good break-all">{archiveSeal.rootHash}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <GlyphGrid room="archive" />
      </div>
    </div>
  )
}
