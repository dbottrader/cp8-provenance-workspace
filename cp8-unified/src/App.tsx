import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ROOMS, ROOM_META, type Room } from './lib/glyphs'
import Vault from './rooms/Vault'
import Resonance from './rooms/Resonance'
import Workshop from './rooms/Workshop'
import Bridge from './rooms/Bridge'
import Expansion from './rooms/Expansion'
import Archive from './rooms/Archive'

const ROOM_COMPONENTS: Record<Room, React.ComponentType> = {
  vault: Vault,
  resonance: Resonance,
  workshop: Workshop,
  bridge: Bridge,
  expansion: Expansion,
  archive: Archive,
}

export default function App() {
  const [activeRoom, setActiveRoom] = useState<Room>('vault')
  const RoomComponent = ROOM_COMPONENTS[activeRoom]

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-line px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-wide text-ink">CP8 Unified</h1>
          <p className="text-xs text-muted mt-0.5">HarmonyOS Workflow — ASIN Framework</p>
        </div>
        <div className="text-xs text-muted font-mono">
          {new Date().toISOString().split('T')[0]}
        </div>
      </header>

      {/* Room nav */}
      <nav className="flex border-b border-line overflow-x-auto">
        {ROOMS.map((room, i) => {
          const meta = ROOM_META[room]
          const isActive = room === activeRoom
          return (
            <button
              key={room}
              onClick={() => setActiveRoom(room)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-r border-line transition-colors ${
                isActive
                  ? 'bg-panel text-accent border-b-2 border-b-accent'
                  : 'text-muted hover:text-ink hover:bg-panel/50'
              }`}
            >
              <span className="text-xs text-muted/60 font-mono">{i + 1}</span>
              <span>{meta.icon}</span>
              <span>{meta.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Room description strip */}
      <div className="px-6 py-2 bg-panel/40 border-b border-line">
        <p className="text-xs text-muted">{ROOM_META[activeRoom].description}</p>
      </div>

      {/* Room content */}
      <main className="flex-1 overflow-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeRoom}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="h-full"
          >
            <RoomComponent />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
