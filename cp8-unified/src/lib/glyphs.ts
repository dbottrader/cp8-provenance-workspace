/**
 * The 17 CP8 sacred glyphs — from aiService.ts system prompt.
 * Each maps to a category, frequency, and meaning.
 */

export interface Glyph {
  symbol: string
  name: string
  category: 'foundation' | 'harmony' | 'expansion' | 'wisdom'
  frequency: number
  meaning: string
  room: 'vault' | 'resonance' | 'workshop' | 'bridge' | 'expansion' | 'archive'
}

export const GLYPHS: Glyph[] = [
  { symbol: '⧖', name: 'Temporal Gate',   category: 'foundation', frequency: 111,  meaning: 'Anchor point in time',         room: 'vault'     },
  { symbol: '∞',  name: 'Infinite Loop',   category: 'harmony',    frequency: 432,  meaning: 'Continuous resonance',         room: 'resonance' },
  { symbol: '⧈', name: 'Grid Node',       category: 'foundation', frequency: 428,  meaning: 'Structural intersection',      room: 'vault'     },
  { symbol: '✺', name: 'Radiant Star',    category: 'expansion',  frequency: 528,  meaning: 'Creative emanation',           room: 'expansion' },
  { symbol: '⧉', name: 'Nested Frame',    category: 'wisdom',     frequency: 741,  meaning: 'Contained knowledge',          room: 'workshop'  },
  { symbol: '♓', name: 'Flow Sign',       category: 'harmony',    frequency: 528,  meaning: 'Fluid state transition',       room: 'resonance' },
  { symbol: '⟡', name: 'Diamond Gate',    category: 'wisdom',     frequency: 963,  meaning: 'Higher order pattern',         room: 'archive'   },
  { symbol: '⧗', name: 'Hourglass',       category: 'foundation', frequency: 111,  meaning: 'Time-bounded process',         room: 'vault'     },
  { symbol: '⟢', name: 'Spiral Node',     category: 'expansion',  frequency: 528,  meaning: 'Growth from center',           room: 'expansion' },
  { symbol: '✶', name: 'Six-Point Star',  category: 'harmony',    frequency: 432,  meaning: 'Balanced radiance',            room: 'bridge'    },
  { symbol: '◎', name: 'Centered Ring',   category: 'foundation', frequency: 428,  meaning: 'Focal coherence',              room: 'vault'     },
  { symbol: '◈', name: 'Diamond Ring',    category: 'wisdom',     frequency: 741,  meaning: 'Sealed insight',               room: 'archive'   },
  { symbol: 'ꗃ', name: 'Vai Sign',        category: 'harmony',    frequency: 432,  meaning: 'Cultural resonance marker',    room: 'resonance' },
  { symbol: '✦', name: 'Four Star',       category: 'expansion',  frequency: 963,  meaning: 'Directional transmission',     room: 'bridge'    },
  { symbol: 'ᚾ', name: 'Rune Need',       category: 'wisdom',     frequency: 741,  meaning: 'Necessity / constraint',       room: 'workshop'  },
  { symbol: 'Ϟ', name: 'Koppa',           category: 'foundation', frequency: 111,  meaning: 'Ancient structural marker',    room: 'vault'     },
  { symbol: '⚯', name: 'Linked Circles',  category: 'harmony',    frequency: 528,  meaning: 'Joined systems / bridge',      room: 'bridge'    },
]

export const ROOMS = ['vault', 'resonance', 'workshop', 'bridge', 'expansion', 'archive'] as const
export type Room = typeof ROOMS[number]

export const ROOM_META: Record<Room, { label: string; icon: string; description: string; color: string }> = {
  vault:     { label: 'Vault',     icon: '🔒', description: 'Anchor — context, timestamp, source',    color: '#7fe6c9' },
  resonance: { label: 'Resonance', icon: '〰️', description: 'Shape — geometry, structure',            color: '#9ec7d6' },
  workshop:  { label: 'Workshop',  icon: '🔧', description: 'Intention — meaning under test',          color: '#ffd66b' },
  bridge:    { label: 'Bridge',    icon: '⛓️', description: 'Number — values, stamps, frequency',      color: '#7fffb0' },
  expansion: { label: 'Expansion', icon: '✦',  description: 'Transmit — pilots, showroom, metrics',   color: '#ff8a8a' },
  archive:   { label: 'Archive',   icon: '📦', description: 'Seal — bundle, checksum, immutable snap', color: '#dff5ff' },
}

export function glyphsForRoom(room: Room): Glyph[] {
  return GLYPHS.filter(g => g.room === room)
}
