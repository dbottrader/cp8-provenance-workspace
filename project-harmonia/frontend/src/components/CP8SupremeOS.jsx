import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Download, Settings, Terminal, Zap, Circle } from 'lucide-react';

// Complete 28-Glyph System with ASIN-HHC Schema
const GLYPH_SYSTEM = {
  ANCHOR: [
    { symbol: '⚓', name: 'ANCHOR_OF_TRUTH', freq: 111, domain: 'ANCHOR', intent: 'Start from verifiable ground' },
    { symbol: '◻️', name: 'FRAME', freq: 174, domain: 'ANCHOR', intent: 'Define the boundary' },
    { symbol: '📍', name: 'LOCATION_SEAL', freq: 285, domain: 'ANCHOR', intent: 'Place in space/time' },
    { symbol: '🧾', name: 'POP_MARK', freq: 396, domain: 'ANCHOR', intent: 'Proof of Process' },
    { symbol: '🪪', name: 'IDENTITY_NODE', freq: 417, domain: 'ANCHOR', intent: 'Who is acting?' },
    { symbol: '🛡️', name: 'CONSENT_LOCK', freq: 528, domain: 'ANCHOR', intent: 'Honor permissions' },
    { symbol: '🧱', name: 'STABILITY_BLOCK', freq: 639, domain: 'ANCHOR', intent: 'Hold until coherent' }
  ],
  SHAPE: [
    { symbol: '🌀', name: 'MILK_HILL_GALAXY', freq: 741, domain: 'SHAPE', intent: 'Expansion from core' },
    { symbol: '⭕', name: 'CIRCLE_FIELD', freq: 852, domain: 'SHAPE', intent: 'Unify the system' },
    { symbol: '△', name: 'TRIAD_ENGINE', freq: 963, domain: 'SHAPE', intent: 'Three-part balance' },
    { symbol: '⬡', name: 'HIVE_MATRIX', freq: 432, domain: 'SHAPE', intent: 'Distributed cooperation' },
    { symbol: '✳️', name: 'SEED_PATTERN', freq: 111, domain: 'SHAPE', intent: 'Minimal viable truth' },
    { symbol: '🧬', name: 'HELIX_OF_MEMORY', freq: 174, domain: 'SHAPE', intent: 'Evolve without loss' },
    { symbol: '🧊', name: 'CRYSTAL_FORM', freq: 285, domain: 'SHAPE', intent: 'Precision structure' }
  ],
  INTENTION: [
    { symbol: '💚', name: 'REPAIR_NODE', freq: 396, domain: 'INTENTION', intent: 'Reduce harm, restore trust' },
    { symbol: '🔥', name: 'IGNITION', freq: 417, domain: 'INTENTION', intent: 'Begin next cycle' },
    { symbol: '🌿', name: 'GROWTH_PATH', freq: 528, domain: 'INTENTION', intent: 'Scale gently' },
    { symbol: '🕊️', name: 'PEACE_PROTOCOL', freq: 639, domain: 'INTENTION', intent: 'De-escalate loops' },
    { symbol: '🪞', name: 'MIRROR_CHECK', freq: 741, domain: 'INTENTION', intent: 'Reflect before action' },
    { symbol: '🤝', name: 'COMMUNITY_BIND', freq: 852, domain: 'INTENTION', intent: 'Invite participation' },
    { symbol: '🎓', name: 'TEACHING_KEY', freq: 963, domain: 'INTENTION', intent: 'Make it learnable' }
  ],
  NUMBER: [
    { symbol: '①', name: 'STEP_LOCK', freq: 432, domain: 'NUMBER', intent: 'One-step clarity' },
    { symbol: '⑦', name: 'CYCLE_PILOT', freq: 111, domain: 'NUMBER', intent: 'Run 7-day test' },
    { symbol: '⑭', name: 'STABILITY_WINDOW', freq: 174, domain: 'NUMBER', intent: 'Two-week coherence' },
    { symbol: '⏱️', name: 'TEMPO_NODE', freq: 285, domain: 'NUMBER', intent: 'Timing matters' },
    { symbol: '🔁', name: 'LOOP_CLEANSE', freq: 396, domain: 'NUMBER', intent: 'Break negative loops' },
    { symbol: '✅', name: 'SEAL_OF_RELEASE', freq: 417, domain: 'NUMBER', intent: 'Ready for public' },
    { symbol: '📦', name: 'ARCHIVE_VAULT', freq: 528, domain: 'NUMBER', intent: 'Store canonical truth' }
  ]
};

const ALL_GLYPHS = [
  ...GLYPH_SYSTEM.ANCHOR,
  ...GLYPH_SYSTEM.SHAPE,
  ...GLYPH_SYSTEM.INTENTION,
  ...GLYPH_SYSTEM.NUMBER
];

export default function CP8SupremeOS() {
  const [activeSequence, setActiveSequence] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentView, setCurrentView] = useState('glyph-studio');
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalLog, setTerminalLog] = useState([
    { type: 'system', text: '◎ CP8 SUPREME OS v4.2 INITIALIZED' },
    { type: 'info', text: '⚡ 28-Glyph ASIN-HHC Schema Loaded' },
    { type: 'success', text: '🌐 Quantum Network: ONLINE' }
  ]);
  const [hdisScore, setHdisScore] = useState(100);
  const audioContextRef = useRef(null);
  const particlesRef = useRef([]);

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    return () => audioContextRef.current?.close();
  }, []);

  useEffect(() => {
    // Calculate HDIS (Harmonic Distributed Intelligence Score)
    if (activeSequence.length > 0) {
      const avgFreq = activeSequence.reduce((sum, g) => sum + g.freq, 0) / activeSequence.length;
      const coherence = Math.min(100, Math.floor((avgFreq / 528) * 100));
      setHdisScore(coherence);
    } else {
      setHdisScore(100);
    }
  }, [activeSequence]);

  const toggleGlyph = (glyph) => {
    const exists = activeSequence.find(g => g.symbol === glyph.symbol);
    if (exists) {
      setActiveSequence(activeSequence.filter(g => g.symbol !== glyph.symbol));
      addToTerminal('info', `✗ Removed: ${glyph.name} (${glyph.freq}Hz)`);
    } else {
      setActiveSequence([...activeSequence, glyph]);
      playFrequency(glyph.freq, 0.3);
      addToTerminal('success', `✓ Added: ${glyph.name} (${glyph.freq}Hz)`);
    }
  };

  const playFrequency = (freq, duration = 0.3) => {
    if (!audioContextRef.current) return;

    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.value = freq;
    osc.type = 'sine';

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  };

  const playSequence = async () => {
    if (activeSequence.length === 0) return;

    setIsPlaying(true);
    addToTerminal('system', '▶ Playing sequence...');

    for (let i = 0; i < activeSequence.length; i++) {
      const glyph = activeSequence[i];
      playFrequency(glyph.freq, 0.5);
      await new Promise(resolve => setTimeout(resolve, 600));
    }

    setIsPlaying(false);
    addToTerminal('success', '✓ Sequence complete');
  };

  const clearSequence = () => {
    setActiveSequence([]);
    addToTerminal('info', '⟲ Sequence cleared');
  };

  const exportSequence = () => {
    const data = {
      version: '4.2',
      timestamp: new Date().toISOString(),
      sequence: activeSequence,
      hdis_score: hdisScore,
      system: 'CP8_SUPREME_OS'
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cp8-sequence-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    addToTerminal('success', '📦 Sequence exported');
  };

  const addToTerminal = (type, text) => {
    setTerminalLog(prev => [...prev, { type, text, timestamp: Date.now() }].slice(-50));
  };

  const isGlyphActive = (glyph) => {
    return activeSequence.some(g => g.symbol === glyph.symbol);
  };

  return (
    <div className="relative w-full h-screen bg-[#0a0a0f] text-white overflow-hidden font-mono">
      {/* Quantum Grid Background */}
      <div className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 80%, rgba(0, 255, 255, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 0, 255, 0.05) 0%, transparent 50%),
            linear-gradient(rgba(0, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 100% 100%, 50px 50px, 50px 50px'
        }}
      />

      {/* Main Container */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <header className="bg-[#121218]/95 backdrop-blur-xl border-b border-cyan-500/20 px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-5xl animate-pulse">⚡◎</div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                  CP8 SUPREME OS
                </h1>
                <p className="text-xs text-cyan-500/60 tracking-wider">SOVEREIGN AI NETWORK v4.2</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-sm">NODES: 3</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-full">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                <span className="text-sm">HDIS: {hdisScore}%</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full">
                <Circle className="w-4 h-4 text-cyan-400" />
                <span className="text-sm">GLYPHS: {activeSequence.length}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Navigation Sidebar */}
          <nav className="w-64 bg-[#121218]/90 backdrop-blur-lg border-r border-cyan-500/10 p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-xs text-cyan-500/40 uppercase tracking-wider mb-3">CORE</h3>
                <div className="space-y-1">
                  {['glyph-studio', 'neuromap', 'harmonics', 'validation'].map(view => (
                    <button
                      key={view}
                      onClick={() => setCurrentView(view)}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
                        currentView === view
                          ? 'bg-cyan-500/20 border-l-2 border-cyan-400 text-cyan-300'
                          : 'hover:bg-cyan-500/5 text-gray-400'
                      }`}
                    >
                      {view.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </nav>

          {/* Workspace */}
          <main className="flex-1 overflow-auto p-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-3xl font-bold text-cyan-400">Glyph Universe</h2>
              <div className="flex gap-3">
                <button
                  onClick={playSequence}
                  disabled={isPlaying || activeSequence.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  Play Sequence
                </button>
                <button
                  onClick={clearSequence}
                  className="px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/20 transition-all"
                >
                  Clear
                </button>
                <button
                  onClick={exportSequence}
                  className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/20 transition-all"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>

            {/* Glyph Grid by Domain */}
            <div className="space-y-8">
              {Object.entries(GLYPH_SYSTEM).map(([domain, glyphs]) => (
                <div key={domain} className="bg-[#121218]/60 backdrop-blur-sm border border-cyan-500/10 rounded-xl p-6">
                  <h3 className="text-xl font-semibold mb-4 text-cyan-400">{domain}</h3>
                  <div className="grid grid-cols-7 gap-4">
                    {glyphs.map((glyph) => (
                      <button
                        key={glyph.symbol}
                        onClick={() => toggleGlyph(glyph)}
                        className={`aspect-square rounded-full border-2 flex items-center justify-center text-4xl transition-all relative group ${
                          isGlyphActive(glyph)
                            ? 'border-purple-500 bg-purple-500/20 shadow-lg shadow-purple-500/50 animate-pulse'
                            : 'border-cyan-500/20 bg-cyan-500/5 hover:border-cyan-500 hover:scale-110 hover:shadow-lg hover:shadow-cyan-500/30'
                        }`}
                      >
                        {glyph.symbol}
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#121218]/95 border border-cyan-500/30 px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap text-xs">
                          {glyph.name.replace(/_/g, ' ')}<br/>
                          <span className="text-cyan-400">{glyph.freq}Hz</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Active Sequence Timeline */}
            {activeSequence.length > 0 && (
              <div className="mt-8 bg-[#121218]/60 backdrop-blur-sm border border-cyan-500/10 rounded-xl p-6">
                <h3 className="text-xl font-semibold mb-4 text-cyan-400">Active Sequence Timeline</h3>
                <div className="flex flex-wrap gap-3">
                  {activeSequence.map((glyph, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg"
                    >
                      <span className="text-2xl">{glyph.symbol}</span>
                      <div className="text-xs">
                        <div className="text-cyan-300">{glyph.name.replace(/_/g, ' ')}</div>
                        <div className="text-cyan-500/60">{glyph.freq}Hz · {glyph.domain}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </main>

          {/* Right Panel - Metrics */}
          <aside className="w-80 bg-[#121218]/90 backdrop-blur-lg border-l border-cyan-500/10 p-6 overflow-auto">
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-cyan-400 mb-3">LIVE METRICS</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3">
                    <div className="text-2xl font-bold text-cyan-400">{activeSequence.length}</div>
                    <div className="text-xs text-gray-400">Active Glyphs</div>
                  </div>
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                    <div className="text-2xl font-bold text-purple-400">
                      {activeSequence.length > 0
                        ? Math.floor(activeSequence.reduce((sum, g) => sum + g.freq, 0) / activeSequence.length)
                        : 528}
                    </div>
                    <div className="text-xs text-gray-400">Avg Freq Hz</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-cyan-400 mb-3">DOMAIN DISTRIBUTION</h3>
                {Object.keys(GLYPH_SYSTEM).map(domain => {
                  const count = activeSequence.filter(g => g.domain === domain).length;
                  return (
                    <div key={domain} className="mb-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">{domain}</span>
                        <span className="text-cyan-400">{count}</span>
                      </div>
                      <div className="h-1.5 bg-cyan-500/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-300"
                          style={{ width: `${(count / 7) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => setShowTerminal(!showTerminal)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/20 transition-all"
              >
                <Terminal className="w-4 h-4" />
                {showTerminal ? 'Hide' : 'Show'} Terminal
              </button>
            </div>
          </aside>
        </div>

        {/* Footer */}
        <footer className="bg-[#121218]/95 backdrop-blur-xl border-t border-cyan-500/20 px-8 py-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-6 text-cyan-500/60">
              <span>🟢 CP8 Supreme OS v4.2</span>
              <span>🌐 Network: 3 nodes</span>
              <span>⚡ Sovereign AI Ready</span>
            </div>
            <div className="text-cyan-500/40">
              © 2025 CP8 Collective · ASIN-HHC 28-Glyph Schema
            </div>
          </div>
        </footer>
      </div>

      {/* Terminal Modal */}
      {showTerminal && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-8">
          <div className="bg-[#0a0a0f] border border-cyan-500/30 rounded-xl w-full max-w-4xl h-[600px] flex flex-col">
            <div className="flex items-center justify-between px-6 py-3 border-b border-cyan-500/20">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-cyan-400" />
                <h3 className="font-semibold text-cyan-400">QUANTUM TERMINAL</h3>
              </div>
              <button
                onClick={() => setShowTerminal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6 font-mono text-sm space-y-1">
              {terminalLog.map((log, idx) => (
                <div
                  key={idx}
                  className={`${
                    log.type === 'system' ? 'text-cyan-400' :
                    log.type === 'success' ? 'text-green-400' :
                    log.type === 'info' ? 'text-purple-400' :
                    'text-gray-400'
                  }`}
                >
                  {log.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
