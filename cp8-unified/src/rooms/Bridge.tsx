import { useState } from 'react'
import { generateManifest, verifyManifest, type ManifestResult } from '../lib/manifest'
import GlyphGrid from '../components/GlyphGrid'

export default function Bridge() {
  const [manifestJson, setManifestJson] = useState('')
  const [verifyResult, setVerifyResult] = useState<{ contentValid: boolean; manifestValid: boolean } | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [_sealed, setSealed] = useState<ManifestResult | null>(null)
  const [sealInput, setSealInput] = useState('')
  const [sealId, setSealId] = useState('')
  const [sealing, setSealing] = useState(false)

  async function handleSeal() {
    if (!sealId.trim() || !sealInput.trim()) return
    setSealing(true)
    const result = await generateManifest({
      artifactId: sealId.trim(),
      room: 'bridge',
      content: sealInput.trim(),
    })
    setSealed(result)
    setManifestJson(JSON.stringify(result, null, 2))
    setSealing(false)
  }

  async function handleVerify() {
    try {
      const parsed = JSON.parse(manifestJson) as ManifestResult
      setVerifying(true)
      const result = await verifyManifest(parsed)
      setVerifyResult(result)
    } catch {
      setVerifyResult(null)
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-accent">Bridge — Number</h2>
        <p className="text-xs text-muted">
          Transfer and verify artifacts between nodes. Paste a manifest JSON to verify integrity,
          or seal a new bridge entry.
        </p>

        {/* Seal */}
        <div className="bg-panel border border-line rounded p-4 space-y-3">
          <p className="text-xs font-semibold text-ink">Seal New Entry</p>
          <input
            className="w-full bg-bg border border-line rounded px-3 py-2 text-sm text-ink placeholder-muted focus:outline-none focus:border-accent"
            placeholder="Artifact ID"
            value={sealId}
            onChange={e => setSealId(e.target.value)}
          />
          <textarea
            rows={3}
            className="w-full bg-bg border border-line rounded px-3 py-2 text-sm text-ink placeholder-muted focus:outline-none focus:border-accent font-mono resize-none"
            placeholder="Content to seal..."
            value={sealInput}
            onChange={e => setSealInput(e.target.value)}
          />
          <button
            onClick={handleSeal}
            disabled={sealing || !sealId || !sealInput}
            className="px-4 py-2 bg-good/10 border border-good text-good text-sm rounded hover:bg-good/20 disabled:opacity-40 transition-colors"
          >
            {sealing ? 'Sealing...' : '✶ Seal Bridge Entry'}
          </button>
        </div>

        {/* Verify */}
        <div className="bg-panel border border-line rounded p-4 space-y-3">
          <p className="text-xs font-semibold text-ink">Verify Manifest JSON</p>
          <textarea
            rows={8}
            className="w-full bg-bg border border-line rounded px-3 py-2 text-xs text-ink placeholder-muted focus:outline-none focus:border-accent font-mono resize-none"
            placeholder="Paste ManifestResult JSON here..."
            value={manifestJson}
            onChange={e => setManifestJson(e.target.value)}
          />
          <button
            onClick={handleVerify}
            disabled={verifying || !manifestJson}
            className="px-4 py-2 bg-accent/10 border border-accent text-accent text-sm rounded hover:bg-accent/20 disabled:opacity-40 transition-colors"
          >
            {verifying ? 'Verifying...' : '⚯ Verify Integrity'}
          </button>

          {verifyResult && (
            <div className="space-y-1 font-mono text-xs">
              <div className="flex items-center gap-2">
                <span className={verifyResult.contentValid ? 'text-good' : 'text-bad'}>
                  {verifyResult.contentValid ? '✓' : '✗'}
                </span>
                <span className="text-muted">content hash</span>
                <span className={verifyResult.contentValid ? 'text-good' : 'text-bad'}>
                  {verifyResult.contentValid ? 'valid' : 'INVALID'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={verifyResult.manifestValid ? 'text-good' : 'text-bad'}>
                  {verifyResult.manifestValid ? '✓' : '✗'}
                </span>
                <span className="text-muted">manifest hash</span>
                <span className={verifyResult.manifestValid ? 'text-good' : 'text-bad'}>
                  {verifyResult.manifestValid ? 'valid' : 'INVALID'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        <GlyphGrid room="bridge" />
      </div>
    </div>
  )
}
