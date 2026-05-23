/**
 * CP8 AI Client — OpenAI-compatible abstraction layer
 *
 * Primary: Ollama (local, localhost:11434)
 * Cloud fallback: Supabase Edge Function (cp8-chat)
 *
 * Uses the OpenAI chat completions interface so swapping
 * providers requires no changes to callers.
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  stream?: boolean
}

export interface ChatResponse {
  message: string
  model: string
  provider: 'ollama' | 'supabase' | 'error'
  tokens?: number
}

const DEFAULT_OLLAMA_URL = 'http://localhost:11434'
const DEFAULT_MODEL = 'phi3:mini'

/** System prompt for CP8 Neural Navigator */
export const CP8_SYSTEM_PROMPT = `You are the CP8 Neural Navigator — a guide through the HarmonyOS workflow system.

Framework: ASIN (Anchor, Shape, Intention, Number)
Pipeline: Vault → Resonance → Workshop → Bridge → Expansion → Archive

Your role:
- Help users move artifacts through the six-room pipeline
- Reference the 17 glyphs when relevant: ⧖ ∞ ⧈ ✺ ⧉ ♓ ⟡ ⧗ ⟢ ✶ ◎ ◈ ꗃ ✦ ᚾ Ϟ ⚯
- Keep responses concise and grounded — no unverifiable claims
- When asked about code: be precise and practical
- When asked about process: reference the ASIN framework

Begin responses with a relevant glyph when appropriate.`

/** Check if Ollama is reachable */
export async function isOllamaAvailable(baseUrl = DEFAULT_OLLAMA_URL): Promise<boolean> {
  try {
    const res = await fetch(`${baseUrl}/api/tags`, { signal: AbortSignal.timeout(2000) })
    return res.ok
  } catch {
    return false
  }
}

/** List available Ollama models */
export async function listOllamaModels(baseUrl = DEFAULT_OLLAMA_URL): Promise<string[]> {
  try {
    const res = await fetch(`${baseUrl}/api/tags`)
    if (!res.ok) return []
    const data = await res.json() as { models?: Array<{ name: string }> }
    return (data.models ?? []).map(m => m.name)
  } catch {
    return []
  }
}

/** Send a chat to Ollama using its OpenAI-compatible endpoint */
async function chatOllama(
  messages: ChatMessage[],
  opts: ChatOptions = {},
  baseUrl = DEFAULT_OLLAMA_URL
): Promise<ChatResponse> {
  const model = opts.model ?? DEFAULT_MODEL
  const res = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 500,
      stream: false,
    }),
  })

  if (!res.ok) {
    throw new Error(`Ollama error: ${res.status} ${await res.text()}`)
  }

  const data = await res.json() as {
    choices: Array<{ message: { content: string } }>
    model: string
    usage?: { completion_tokens: number }
  }

  return {
    message: data.choices[0]?.message?.content ?? '',
    model: data.model,
    provider: 'ollama',
    tokens: data.usage?.completion_tokens,
  }
}

/** Send a chat to the Supabase cp8-chat edge function (cloud fallback) */
async function chatSupabase(
  messages: ChatMessage[],
  supabaseUrl: string,
  supabaseAnonKey: string
): Promise<ChatResponse> {
  const res = await fetch(`${supabaseUrl}/functions/v1/cp8-chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'apikey': supabaseAnonKey,
    },
    body: JSON.stringify({ messages }),
  })

  if (!res.ok) {
    throw new Error(`Supabase edge function error: ${res.status}`)
  }

  const data = await res.json() as { message?: string; error?: string }
  if (data.error) throw new Error(data.error)

  return {
    message: data.message ?? '',
    model: 'gemini-2.5-flash',
    provider: 'supabase',
  }
}

export interface AIClientConfig {
  ollamaUrl?: string
  ollamaModel?: string
  supabaseUrl?: string
  supabaseAnonKey?: string
}

/**
 * Unified AI client — tries Ollama first, falls back to Supabase.
 * Automatically prepends the CP8 system prompt.
 */
export async function chat(
  userMessages: ChatMessage[],
  config: AIClientConfig = {},
  opts: ChatOptions = {}
): Promise<ChatResponse> {
  const withSystem: ChatMessage[] = [
    { role: 'system', content: CP8_SYSTEM_PROMPT },
    ...userMessages,
  ]

  const ollamaUrl = config.ollamaUrl ?? DEFAULT_OLLAMA_URL
  const available = await isOllamaAvailable(ollamaUrl)

  if (available) {
    try {
      return await chatOllama(withSystem, { ...opts, model: config.ollamaModel }, ollamaUrl)
    } catch (err) {
      console.warn('[cp8-ai] Ollama failed, trying Supabase fallback:', err)
    }
  }

  if (config.supabaseUrl && config.supabaseAnonKey) {
    try {
      return await chatSupabase(withSystem, config.supabaseUrl, config.supabaseAnonKey)
    } catch (err) {
      console.error('[cp8-ai] Supabase fallback also failed:', err)
    }
  }

  return {
    message: 'No AI backend available. Start Ollama locally (`ollama serve`) or configure Supabase.',
    model: 'none',
    provider: 'error',
  }
}
