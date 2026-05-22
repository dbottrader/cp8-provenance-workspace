/**
 * CP8 Provenance Manifest
 *
 * Generates SHA-256 signed release manifests for artifact provenance.
 * Replaces the btoa-based stub in the original archive.
 *
 * Usage:
 *   const manifest = await generateManifest({ artifactId: 'vault-001', content: '...' })
 *   const valid = await verifyManifest(manifest)
 */

export interface ManifestEntry {
  artifactId: string
  room: 'vault' | 'resonance' | 'workshop' | 'bridge' | 'expansion' | 'archive'
  content: string
  contentHash: string
  timestamp: string
  previousHash: string | null
  signedBy: string
}

export interface ManifestResult {
  entry: ManifestEntry
  manifestHash: string
  binaryDateKey: string
}

/** SHA-256 of arbitrary string, returns hex */
export async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/** Binary date key from ISO date string, e.g. "2025-09-22" → "11111101001.1001.10110" */
export function binaryDateKey(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  return `${year.toString(2)}.${month.toString(2)}.${day.toString(2)}`
}

/** Generate a provenance manifest entry for an artifact */
export async function generateManifest(opts: {
  artifactId: string
  room: ManifestEntry['room']
  content: string
  signedBy?: string
  previousHash?: string | null
}): Promise<ManifestResult> {
  const timestamp = new Date().toISOString()
  const contentHash = await sha256(opts.content)
  const dateKey = binaryDateKey(timestamp.split('T')[0])

  const entry: ManifestEntry = {
    artifactId: opts.artifactId,
    room: opts.room,
    content: opts.content,
    contentHash,
    timestamp,
    previousHash: opts.previousHash ?? null,
    signedBy: opts.signedBy ?? 'CP8',
  }

  // Canonical JSON — sorted keys, no whitespace variance
  const canonical = JSON.stringify(entry, Object.keys(entry).sort())
  const manifestHash = await sha256(canonical)

  return { entry, manifestHash, binaryDateKey: dateKey }
}

/** Verify a manifest entry's content hash and manifest hash */
export async function verifyManifest(result: ManifestResult): Promise<{
  contentValid: boolean
  manifestValid: boolean
}> {
  const contentHash = await sha256(result.entry.content)
  const canonical = JSON.stringify(result.entry, Object.keys(result.entry).sort())
  const manifestHash = await sha256(canonical)

  return {
    contentValid: contentHash === result.entry.contentHash,
    manifestValid: manifestHash === result.manifestHash,
  }
}

/** Bundle multiple manifest results into an archive export */
export async function sealArchive(
  entries: ManifestResult[],
  label: string
): Promise<{ label: string; count: number; rootHash: string; sealed: string }> {
  const hashes = entries.map(e => e.manifestHash).join('\n')
  const rootHash = await sha256(hashes)
  const sealed = new Date().toISOString()
  return { label, count: entries.length, rootHash, sealed }
}
