import { useState } from 'react'
import { chat, type ChatMessage } from '../lib/ollama'
import ChatBubble from '../components/ChatBubble'
import GlyphGrid from '../components/GlyphGrid'

export default function Workshop() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [provider, setProvider] = useState<string>('')

  async function handleSend() {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: ChatMessage = { role: 'user', content: text }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setInput('')
    setLoading(true)

    const res = await chat(updated, {
      ollamaUrl: 'http://localhost:11434',
      ollamaModel: 'phi3:mini',
    })

    setProvider(res.provider)
    setMessages(prev => [
      ...prev,
      { role: 'assistant', content: res.message },
    ])
    setLoading(false)
  }

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      <div className="flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-accent">Workshop — Intention</h2>
          {provider && (
            <span className="text-xs text-muted font-mono">via {provider}</span>
          )}
        </div>
        <p className="text-xs text-muted">
          CP8 Neural Navigator. Runs on Ollama locally (phi3:mini). Falls back to Supabase cloud.
        </p>

        {/* Chat history */}
        <div className="flex-1 bg-panel border border-line rounded p-3 overflow-y-auto space-y-2 min-h-[300px] max-h-[400px]">
          {messages.length === 0 && (
            <p className="text-xs text-muted italic">Ask about ASIN, glyphs, pipeline routing, or code...</p>
          )}
          {messages.map((msg, i) => (
            <ChatBubble key={i} role={msg.role} content={msg.content} />
          ))}
          {loading && (
            <ChatBubble role="assistant" content="..." loading />
          )}
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <input
            className="flex-1 bg-panel border border-line rounded px-3 py-2 text-sm text-ink placeholder-muted focus:outline-none focus:border-accent"
            placeholder="Message CP8 Navigator..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input}
            className="px-4 py-2 bg-accent/10 border border-accent text-accent text-sm rounded hover:bg-accent/20 disabled:opacity-40 transition-colors"
          >
            Send
          </button>
        </div>

        <p className="text-xs text-muted">
          Requires Ollama running: <code className="text-accent">ollama serve</code> then <code className="text-accent">ollama pull phi3:mini</code>
        </p>
      </div>

      <div>
        <GlyphGrid room="workshop" />
      </div>
    </div>
  )
}
