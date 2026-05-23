import { motion } from 'framer-motion'
import { glyphsForRoom, ROOM_META, type Room } from '../lib/glyphs'

interface Props {
  room: Room
}

export default function GlyphGrid({ room }: Props) {
  const glyphs = glyphsForRoom(room)
  const meta = ROOM_META[room]

  return (
    <div className="bg-panel border border-line rounded p-4 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted">
        {meta.icon} {meta.label} Glyphs
      </p>
      <div className="grid grid-cols-3 gap-2">
        {glyphs.map((glyph, i) => (
          <motion.div
            key={glyph.symbol}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.06 }}
            className="bg-bg border border-line rounded p-3 text-center space-y-1 hover:border-accent/50 transition-colors cursor-default"
            title={`${glyph.name} — ${glyph.meaning} (${glyph.frequency} Hz)`}
          >
            <div className="text-2xl">{glyph.symbol}</div>
            <div className="text-xs text-muted truncate">{glyph.name}</div>
            <div className="text-xs text-accent/70 font-mono">{glyph.frequency} Hz</div>
          </motion.div>
        ))}
      </div>
      {glyphs.length === 0 && (
        <p className="text-xs text-muted italic">No glyphs assigned to this room.</p>
      )}
    </div>
  )
}
