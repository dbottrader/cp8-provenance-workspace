import { motion } from 'framer-motion'

interface Props {
  role: 'user' | 'assistant' | 'system'
  content: string
  loading?: boolean
}

export default function ChatBubble({ role, content, loading }: Props) {
  const isUser = role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[85%] rounded px-3 py-2 text-sm leading-relaxed ${
          isUser
            ? 'bg-accent/10 border border-accent/30 text-ink'
            : 'bg-panel border border-line text-ink'
        }`}
      >
        {!isUser && (
          <span className="text-accent text-xs font-semibold mr-1">CP8</span>
        )}
        {loading ? (
          <span className="text-muted animate-pulse">…</span>
        ) : (
          <span className="whitespace-pre-wrap">{content}</span>
        )}
      </div>
    </motion.div>
  )
}
