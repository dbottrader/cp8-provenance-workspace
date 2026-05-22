# CP8 Unified

Consolidated engineering stack for the HarmonyOS / ASIN-HHC ecosystem.

## What this is

A provenance-aware, symbolic workflow OS built from the best real code across the CP8 archive. Six rooms map the ASIN framework (Anchor, Shape, Intention, Number) to a full creative pipeline.

```
Vault → Resonance → Workshop → Bridge → Expansion → Archive
```

## Stack

| Layer       | Tech                                             |
|-------------|--------------------------------------------------|
| Frontend    | React 18, TypeScript, Vite, Tailwind, Framer Motion |
| Local AI    | Ollama (phi3:mini, OpenAI-compatible endpoint)   |
| Cloud AI    | Supabase Edge Functions → Gemini 2.5 Flash       |
| State       | ResonantState (SHA-256 hash-chained deltas)      |
| Sync        | DistributedSync (replay-verifiable state log)    |
| Provenance  | manifest.ts (real SHA-256, not btoa)             |

## Rooms

| Room      | ASIN   | What it does                                  |
|-----------|--------|-----------------------------------------------|
| Vault     | Anchor | Seal artifacts with SHA-256 provenance        |
| Resonance | Shape  | Derive frequencies from sequences (432 Hz f₀) |
| Workshop  | Intent | CP8 Neural Navigator chat (Ollama/Supabase)   |
| Bridge    | Number | Transfer & verify manifest integrity          |
| Expansion | —      | Distributed state sync with hash-linked log   |
| Archive   | —      | Bundle + seal artifact collections (root hash)|

## Getting started

```bash
npm install
npm run dev
```

For local AI (Workshop room):
```bash
# Install Ollama: https://ollama.com/download
ollama serve
ollama pull phi3:mini
```

For cloud AI fallback, set in `.env`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Deploy edge functions:
```bash
supabase functions deploy cp8-chat
supabase functions deploy cp8-code-gen
supabase secrets set ONSPACE_AI_API_KEY=... ONSPACE_AI_BASE_URL=...
```

## Source attribution

| File                        | Origin                              |
|-----------------------------|-------------------------------------|
| `src/lib/ResonantState.ts`  | Kimi_Agent_Hash_Replay_Sync.zip     |
| `src/lib/DistributedSync.ts`| Kimi_Agent_Hash_Replay_Sync.zip     |
| `src/lib/ResonantCapabilities.ts` | Kimi_Agent_Hash_Replay_Sync.zip |
| `supabase/functions/cp8-chat` | RohM5UBijNgAkhCTtojEbn.zip        |
| `supabase/functions/cp8-code-gen` | RohM5UBijNgAkhCTtojEbn.zip    |
| `src/lib/manifest.ts`       | New — replaces btoa stub            |
| `src/lib/ollama.ts`         | New — OpenAI-compatible abstraction |
| `src/lib/glyphs.ts`         | Synthesized from aiService.ts       |

## Author

Dennis Christie (CP8) — ASIN-HHC LLC
