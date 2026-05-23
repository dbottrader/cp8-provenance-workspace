import { useState, useCallback, useMemo, useRef } from 'react';

// ── ANU-28 Glyph Codex ──
const GLYPHS = [
  // Origin
  { id: 'O1', name: 'Source',  glyph: '◉', category: 'Origin',      freq: 174, color: '#ff6b35', meaning: 'Primordial origin — the unmanifest void' },
  { id: 'O2', name: 'Spark',   glyph: '✦', category: 'Origin',      freq: 285, color: '#ff8c5a', meaning: 'Catalytic ignition — first motion' },
  { id: 'O3', name: 'Seed',    glyph: '◈', category: 'Origin',      freq: 396, color: '#ffab7a', meaning: 'Latent potential — compressed entirety' },
  { id: 'O4', name: 'Flame',   glyph: '🔥', category: 'Origin',      freq: 417, color: '#ffc49a', meaning: 'Transformative fire — sacred burning' },
  // Torus
  { id: 'T1', name: 'Coil',    glyph: '➰', category: 'Torus',       freq: 432, color: '#00f0ff', meaning: 'Spiraling ascent — recursive growth' },
  { id: 'T2', name: 'Loop',    glyph: '∞', category: 'Torus',       freq: 444, color: '#33f3ff', meaning: 'Eternal return — closed cycle' },
  { id: 'T3', name: 'Vortex',  glyph: '〰', category: 'Torus',       freq: 456, color: '#66f6ff', meaning: 'Centripetal pull — gathering force' },
  { id: 'T4', name: 'Spiral',  glyph: '꩜', category: 'Torus',       freq: 528, color: '#99f9ff', meaning: 'Golden expansion — harmonic unfoldment' },
  // Galaxy
  { id: 'G1', name: 'Cluster', glyph: '✷', category: 'Galaxy',      freq: 639, color: '#a78bfa', meaning: 'Stellar congregation — gravitational bond' },
  { id: 'G2', name: 'Nebula',  glyph: '☁', category: 'Galaxy',      freq: 741, color: '#c4b5fd', meaning: 'Cosmic womb — stellar nursery' },
  { id: 'G3', name: 'Wisp',    glyph: '༶', category: 'Galaxy',      freq: 852, color: '#ddd6fe', meaning: 'Ethereal trail — memory of light' },
  { id: 'G4', name: 'Orbit',   glyph: '◎', category: 'Galaxy',      freq: 963, color: '#ede9fe', meaning: 'Gravitational path — harmonic lock' },
  // Celestial
  { id: 'C1', name: 'Sun',     glyph: '☉', category: 'Celestial',   freq: 111, color: '#fbbf24', meaning: 'Central fire — radiant sovereignty' },
  { id: 'C2', name: 'Moon',    glyph: '☽', category: 'Celestial',   freq: 222, color: '#fcd34d', meaning: 'Reflective vessel — tidal memory' },
  { id: 'C3', name: 'Star',    glyph: '✶', category: 'Celestial',   freq: 333, color: '#fde68a', meaning: 'Distant beacon — navigational truth' },
  { id: 'C4', name: 'Comet',   glyph: '☄', category: 'Celestial',   freq: 777, color: '#fef3c7', meaning: 'Harbingers path — cyclical messenger' },
  // Witness
  { id: 'W1', name: 'Eye',     glyph: '◉', category: 'Witness',     freq: 555, color: '#34d399', meaning: 'Perception gate — active observation' },
  { id: 'W2', name: 'Ear',     glyph: '⌘', category: 'Witness',     freq: 666, color: '#6ee7b7', meaning: 'Resonant receiver — frequency tuning' },
  { id: 'W3', name: 'Heart',   glyph: '♥', category: 'Witness',     freq: 888, color: '#a7f3d0', meaning: 'Emotive compass — truth resonance' },
  // Download
  { id: 'D1', name: 'Arrow',   glyph: '↓', category: 'Download',    freq: 369, color: '#f472b6', meaning: 'Descent vector — information transfer' },
  { id: 'D2', name: 'Beam',    glyph: '|', category: 'Download',    freq: 147, color: '#f9a8d4', meaning: 'Column of light — direct transmission' },
  { id: 'D3', name: 'Key',     glyph: '⚷', category: 'Download',    freq: 258, color: '#fbcfe8', meaning: 'Access token — permission to receive' },
  // Earth
  { id: 'E1', name: 'Root',    glyph: '⚹', category: 'Earth',       freq: 194, color: '#22c55e', meaning: 'Grounding anchor — terrestrial bond' },
  { id: 'E2', name: 'Stone',   glyph: '▣', category: 'Earth',       freq: 384, color: '#4ade80', meaning: 'Compressed time — mineral memory' },
  { id: 'E3', name: 'Wave',    glyph: '∿', category: 'Earth',       freq: 486, color: '#86efac', meaning: 'Fluid transmission — elemental flow' },
  // Consciousness
  { id: 'N1', name: 'Mind',    glyph: '☸', category: 'Consciousness', freq: 594, color: '#60a5fa', meaning: 'Cognitive lattice — thought architecture' },
  { id: 'N2', name: 'Soul',    glyph: '☥', category: 'Consciousness', freq: 693, color: '#93c5fd', meaning: 'Essence signature — individuated spark' },
  { id: 'N3', name: 'Spirit',  glyph: '✧', category: 'Consciousness', freq: 792, color: '#bfdbfe', meaning: 'Transcendent breath — pneuma flow' },
];

const CATEGORIES = [
  'Origin', 'Torus', 'Galaxy', 'Celestial',
  'Witness', 'Download', 'Earth', 'Consciousness'
];

const SHAPES = ['circle', 'crescent', 'triangle', 'diamond', 'spiral'];
const FREQ_GATES = ['428', '528', 'dual'];

const PRESETS = [
  {
    name: 'Lunar Scribe',
    anchor: 'C2',
    shape: 'crescent',
    intention: 'Record dreams in tidal memory',
    freqGate: '528',
    glyphs: [
      { id: 'p1', glyphId: 'C2', x: 150, y: 150, scale: 1.4, rotation: 0 },
      { id: 'p2', glyphId: 'W1', x: 220, y: 100, scale: 1.0, rotation: 15 },
      { id: 'p3', glyphId: 'T2', x: 80,  y: 200, scale: 0.9, rotation: -20 },
      { id: 'p4', glyphId: 'O3', x: 180, y: 220, scale: 0.8, rotation: 45 },
    ],
  },
  {
    name: 'Milk Hill Galaxy Master',
    anchor: 'G1',
    shape: 'spiral',
    intention: 'Harmonic convergence of stellar fields',
    freqGate: 'dual',
    glyphs: [
      { id: 'p1', glyphId: 'G1', x: 150, y: 150, scale: 1.5, rotation: 0 },
      { id: 'p2', glyphId: 'T1', x: 250, y: 120, scale: 1.0, rotation: 30 },
      { id: 'p3', glyphId: 'G2', x: 80,  y: 180, scale: 1.1, rotation: -15 },
      { id: 'p4', glyphId: 'C3', x: 200, y: 240, scale: 0.9, rotation: 60 },
      { id: 'p5', glyphId: 'T4', x: 120, y: 90,  scale: 0.8, rotation: -45 },
    ],
  },
  {
    name: 'CP8 Diamond Body',
    anchor: 'O1',
    shape: 'diamond',
    intention: 'Crystal lattice embodiment — CP8 protocol activation',
    freqGate: '428',
    glyphs: [
      { id: 'p1', glyphId: 'O1', x: 150, y: 150, scale: 1.6, rotation: 45 },
      { id: 'p2', glyphId: 'N1', x: 230, y: 80,  scale: 1.0, rotation: 0 },
      { id: 'p3', glyphId: 'N2', x: 70,  y: 230, scale: 1.0, rotation: 90 },
      { id: 'p4', glyphId: 'E2', x: 230, y: 230, scale: 0.9, rotation: -30 },
      { id: 'p5', glyphId: 'W3', x: 70,  y: 80,  scale: 0.9, rotation: 30 },
    ],
  },
];

function getGlyphById(id) {
  return GLYPHS.find(g => g.id === id) || null;
}

function generateId() {
  return 'g_' + Math.random().toString(36).slice(2, 9);
}

export function useSigilBuilder() {
  const canvasRef = useRef(null);

  // ── Core State ──
  const [canvasGlyphs, setCanvasGlyphs] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [anchorGlyph, setAnchorGlyph] = useState('');
  const [shape, setShape] = useState('circle');
  const [intention, setIntention] = useState('');
  const [freqGate, setFreqGate] = useState('528');
  const [savedSigils, setSavedSigils] = useState(() => {
    try {
      const raw = localStorage.getItem('hmn_saved_sigils');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });

  // ── Computed Decode ──
  const decode = useMemo(() => {
    const placed = canvasGlyphs.map(cg => ({
      ...cg,
      meta: getGlyphById(cg.glyphId),
    })).filter(cg => cg.meta);

    if (placed.length === 0) {
      return {
        asin: { A: '—', S: shape, I: intention || '—', N: '0', HHC: freqGate },
        coherence: 0,
        freqAnalysis: [],
        text: 'Add glyphs to begin decoding.',
      };
    }

    // A: Anchor
    const anchorMeta = anchorGlyph ? getGlyphById(anchorGlyph) : null;
    const A = anchorMeta ? `${anchorMeta.name} (${anchorMeta.freq} Hz)` : (placed[0]?.meta?.name || '—');

    // S: Shape
    const S = shape;

    // I: Intention
    const I = intention || '—';

    // N: Number — derived from glyph count, total frequency sum, and prime resonance
    const count = placed.length;
    const totalFreq = placed.reduce((s, g) => s + (g.meta.freq || 0), 0);
    const avgFreq = Math.round(totalFreq / count);
    // Prime-ish signature: sum of digits of avgFreq
    const digitSum = String(avgFreq).split('').reduce((s, d) => s + Number(d), 0);
    const N = `${count}.${avgFreq}.${digitSum}`;

    // HHC: Frequency Gate
    const HHC = freqGate === 'dual' ? '428+528' : `${freqGate} Hz`;

    // Coherence: 0–1 based on diversity, frequency harmony, and anchor match
    const uniqueCats = new Set(placed.map(g => g.meta.category)).size;
    const catScore = Math.min(uniqueCats / 4, 1.0); // up to 4 categories = full
    const freqRange = Math.max(...placed.map(g => g.meta.freq)) - Math.min(...placed.map(g => g.meta.freq));
    const freqScore = freqRange < 300 ? 1.0 : freqRange < 600 ? 0.7 : 0.4;
    const anchorScore = anchorMeta && placed.some(g => g.glyphId === anchorGlyph) ? 1.0 : 0.5;
    const coherence = Math.round(((catScore * 0.35 + freqScore * 0.35 + anchorScore * 0.30)) * 100) / 100;

    // Frequency Analysis
    const freqMap = {};
    placed.forEach(g => {
      const k = g.meta.freq;
      freqMap[k] = (freqMap[k] || 0) + 1;
    });
    const freqAnalysis = Object.entries(freqMap)
      .map(([freq, count]) => ({ freq: Number(freq), count, pct: Math.round((count / placed.length) * 100) }))
      .sort((a, b) => b.count - a.count);

    // Text decode
    const glyphNames = placed.map(g => g.meta.name).join(' → ');
    const catNames = [...new Set(placed.map(g => g.meta.category))].join(', ');
    const text = `ASIN-HHC Sigil Decode\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `A (Anchor): ${A}\n` +
      `S (Shape):  ${S}\n` +
      `I (Intent): ${I}\n` +
      `N (Number): ${N}\n` +
      `HHC (Gate): ${HHC}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `Glyphs: ${glyphNames}\n` +
      `Categories: ${catNames}\n` +
      `Coherence: ${(coherence * 100).toFixed(0)}%\n` +
      `Frequency Spectrum: ${freqAnalysis.map(f => `${f.freq}Hz×${f.count}`).join(', ')}`;

    return { asin: { A, S, I, N, HHC }, coherence, freqAnalysis, text };
  }, [canvasGlyphs, anchorGlyph, shape, intention, freqGate]);

  // ── Actions ──
  const addGlyph = useCallback((glyphId) => {
    const meta = getGlyphById(glyphId);
    if (!meta) return;
    const canvas = canvasRef.current;
    const rect = canvas ? canvas.getBoundingClientRect() : { width: 300, height: 300 };
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 60 + 40;
    const newGlyph = {
      id: generateId(),
      glyphId,
      x: cx + Math.cos(angle) * radius - 16,
      y: cy + Math.sin(angle) * radius - 16,
      scale: 1.0,
      rotation: Math.round((Math.random() * 60 - 30)),
    };
    setCanvasGlyphs(prev => [...prev, newGlyph]);
    setSelectedId(newGlyph.id);
  }, []);

  const moveGlyph = useCallback((id, x, y) => {
    setCanvasGlyphs(prev => prev.map(g => g.id === id ? { ...g, x, y } : g));
  }, []);

  const removeGlyph = useCallback((id) => {
    setCanvasGlyphs(prev => prev.filter(g => g.id !== id));
    setSelectedId(prev => (prev === id ? null : prev));
  }, []);

  const updateGlyph = useCallback((id, updates) => {
    setCanvasGlyphs(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
  }, []);

  const clearCanvas = useCallback(() => {
    setCanvasGlyphs([]);
    setSelectedId(null);
  }, []);

  const saveSigil = useCallback(() => {
    if (canvasGlyphs.length === 0) return;
    const sigil = {
      name: `Sigil ${savedSigils.length + 1}`,
      anchor: anchorGlyph,
      shape,
      intention,
      freqGate,
      glyphs: canvasGlyphs,
      timestamp: Date.now(),
    };
    const next = [...savedSigils, sigil];
    setSavedSigils(next);
    try { localStorage.setItem('hmn_saved_sigils', JSON.stringify(next)); } catch {}
  }, [canvasGlyphs, anchorGlyph, shape, intention, freqGate, savedSigils]);

  const loadSigil = useCallback((sigil) => {
    setCanvasGlyphs(sigil.glyphs.map(g => ({ ...g, id: g.id || generateId() })));
    setAnchorGlyph(sigil.anchor || '');
    setShape(sigil.shape || 'circle');
    setIntention(sigil.intention || '');
    setFreqGate(sigil.freqGate || '528');
    setSelectedId(null);
  }, []);

  const deleteSavedSigil = useCallback((idx) => {
    const next = savedSigils.filter((_, i) => i !== idx);
    setSavedSigils(next);
    try { localStorage.setItem('hmn_saved_sigils', JSON.stringify(next)); } catch {}
  }, [savedSigils]);

  const exportPNG = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const svgEl = canvas.querySelector('svg');
    if (!svgEl) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgEl);
    const img = new Image();
    const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = 600;
      exportCanvas.height = 600;
      const ctx = exportCanvas.getContext('2d');
      ctx.fillStyle = '#0a0a0b';
      ctx.fillRect(0, 0, 600, 600);
      ctx.drawImage(img, 0, 0, 600, 600);
      URL.revokeObjectURL(url);
      const link = document.createElement('a');
      link.download = `sigil-${Date.now()}.png`;
      link.href = exportCanvas.toDataURL('image/png');
      link.click();
    };
    img.src = url;
  }, []);

  const exportSVG = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const svgEl = canvas.querySelector('svg');
    if (!svgEl) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgEl);
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `sigil-${Date.now()}.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  const copyDecode = useCallback(() => {
    navigator.clipboard.writeText(decode.text).catch(() => {});
  }, [decode.text]);

  return {
    // Refs
    canvasRef,
    // Data
    glyphs: GLYPHS,
    categories: CATEGORIES,
    shapes: SHAPES,
    freqGates: FREQ_GATES,
    presets: PRESETS,
    // State
    canvasGlyphs,
    selectedId,
    anchorGlyph,
    shape,
    intention,
    freqGate,
    savedSigils,
    decode,
    // Actions
    addGlyph,
    moveGlyph,
    removeGlyph,
    updateGlyph,
    clearCanvas,
    setSelectedId,
    setAnchorGlyph,
    setShape,
    setIntention,
    setFreqGate,
    saveSigil,
    loadSigil,
    deleteSavedSigil,
    exportPNG,
    exportSVG,
    copyDecode,
  };
}
