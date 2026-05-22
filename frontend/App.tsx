import SigilBuilder from './components/SigilBuilder'
import HandshakeGenerator from './components/HandshakeGenerator'
import ANU28Display from './components/ANU28Display'
import TSHQuery from './components/TSHQuery'
import MolecularViewer from './components/MolecularViewer'

function App() {
  return (
    <div className="min-h-screen bg-obsidian relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 bg-holographic pointer-events-none" />
      <div className="fixed inset-0 bg-neon-glow pointer-events-none" />

      {/* Grid pattern */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 240, 255, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 240, 255, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-white/5 backdrop-blur-xl bg-obsidian/50 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-harmonic-cyan/30 to-harmonic-magenta/30 border border-white/10 flex items-center justify-center">
                  <span className="text-sm">◈</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white tracking-tight">
                    Project <span className="neon-text">Harmonia</span>
                  </h1>
                  <p className="text-xs text-white/40 font-mono">ASIN-HHC CP8 Lattice Interface</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-harmonic-emerald animate-pulse" />
                <span className="text-xs text-white/50 font-mono">LIVE</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left column */}
            <div className="space-y-6">
              <HandshakeGenerator />
              <TSHQuery />
            </div>

            {/* Right column */}
            <div className="space-y-6">
              <ANU28Display />
              <MolecularViewer />
            </div>
          </div>

          {/* Sigil Builder — full width */}
          <div className="mt-6">
            <SigilBuilder />
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-white/5 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between text-xs text-white/30">
              <span className="font-mono">ASIN-HHC v0.2 // CP8 LATTICE</span>
              <span>Federated Adaptive Cognition Stack</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default App
