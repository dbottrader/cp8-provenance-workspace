import { useRef, useState, useCallback, useEffect } from 'react';
import './SigilBuilder.css';
import { useSigilBuilder } from '../hooks/useSigilBuilder';

/* ─── SVG Shape Primitives ─── */
function ShapeSVG({ shape, width, height }) {
  const cx = width / 2;
  const cy = height / 2;
  const r = Math.min(width, height) * 0.38;
  const stroke = 'rgba(255,107,53,0.15)';
  const fill = 'rgba(255,107,53,0.03)';

  switch (shape) {
    case 'circle':
      return (
        <g>
          <circle cx={cx} cy={cy} r={r} stroke={stroke} strokeWidth="1" fill={fill} />
          <circle cx={cx} cy={cy} r={r * 0.6} stroke={stroke} strokeWidth="0.5" fill="none" strokeDasharray="4 4" />
        </g>
      );
    case 'crescent': {
      const d = `M ${cx - r * 0.3} ${cy - r}
                 A ${r} ${r} 0 1 1 ${cx - r * 0.3} ${cy + r}
                 A ${r * 0.7} ${r * 0.7} 0 1 0 ${cx - r * 0.3} ${cy - r}`;
      return <path d={d} stroke={stroke} strokeWidth="1" fill={fill} />;
    }
    case 'triangle': {
      const h = r * Math.sqrt(3);
      const d = `M ${cx} ${cy - h * 0.6} L ${cx - r} ${cy + h * 0.4} L ${cx + r} ${cy + h * 0.4} Z`;
      return <path d={d} stroke={stroke} strokeWidth="1" fill={fill} />;
    }
    case 'diamond': {
      const d = `M ${cx} ${cy - r} L ${cx + r * 0.7} ${cy} L ${cx} ${cy + r} L ${cx - r * 0.7} ${cy} Z`;
      return <path d={d} stroke={stroke} strokeWidth="1" fill={fill} />;
    }
    case 'spiral': {
      let d = `M ${cx} ${cy}`;
      for (let i = 0; i < 200; i++) {
        const angle = i * 0.15;
        const radius = (i / 200) * r;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;
        d += ` L ${x} ${y}`;
      }
      return <path d={d} stroke={stroke} strokeWidth="1" fill="none" />;
    }
    default:
      return null;
  }
}

/* ─── Torus Field Background ─── */
function TorusBackground({ width, height }) {
  const cx = width / 2;
  const cy = height / 2;
  const rings = [0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85];
  return (
    <g>
      {rings.map((scale, i) => (
        <ellipse
          key={i}
          cx={cx}
          cy={cy}
          rx={width * scale * 0.45}
          ry={height * scale * 0.45}
          className="sb-torus-ring"
          style={{ opacity: 0.06 + (1 - scale) * 0.08 }}
        />
      ))}
      <ellipse
        cx={cx}
        cy={cy}
        rx={width * 0.35}
        ry={height * 0.12}
        className="sb-torus-ring-2"
      />
    </g>
  );
}

/* ─── Main Component ─── */
export default function SigilBuilder() {
  const {
    canvasRef,
    glyphs,
    categories,
    shapes,
    freqGates,
    presets,
    canvasGlyphs,
    selectedId,
    anchorGlyph,
    shape,
    intention,
    freqGate,
    savedSigils,
    decode,
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
  } = useSigilBuilder();

  const svgRef = useRef(null);
  const [svgSize, setSvgSize] = useState({ width: 600, height: 600 });
  const dragState = useRef(null);
  const clickState = useRef({ id: null, time: 0 });

  // Measure SVG size
  useEffect(() => {
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setSvgSize({ width, height });
      }
    });
    if (canvasRef.current) ro.observe(canvasRef.current);
    return () => ro.disconnect();
  }, [canvasRef]);

  // Drag handlers
  const handleMouseDown = useCallback((e, id) => {
    e.stopPropagation();
    const svg = svgRef.current;
    if (!svg) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const loc = pt.matrixTransform(svg.getScreenCTM().inverse());
    const g = canvasGlyphs.find(cg => cg.id === id);
    if (!g) return;

    const now = Date.now();
    if (clickState.current.id === id && now - clickState.current.time < 300) {
      // Double click → remove
      removeGlyph(id);
      clickState.current = { id: null, time: 0 };
      return;
    }
    clickState.current = { id, time: now };

    dragState.current = {
      id,
      offsetX: loc.x - g.x,
      offsetY: loc.y - g.y,
    };
    setSelectedId(id);

    const handleMove = (ev) => {
      if (!dragState.current) return;
      const p = svg.createSVGPoint();
      p.x = ev.clientX;
      p.y = ev.clientY;
      const l = p.matrixTransform(svg.getScreenCTM().inverse());
      const nx = l.x - dragState.current.offsetX;
      const ny = l.y - dragState.current.offsetY;
      moveGlyph(dragState.current.id, nx, ny);
    };

    const handleUp = () => {
      dragState.current = null;
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  }, [canvasGlyphs, moveGlyph, removeGlyph, setSelectedId]);

  const handleCanvasClick = useCallback((e) => {
    if (e.target === svgRef.current || e.target.tagName === 'ellipse' || e.target.tagName === 'path') {
      setSelectedId(null);
    }
  }, [setSelectedId]);

  const getGlyphMeta = (glyphId) => glyphs.find(g => g.id === glyphId);

  return (
    <div className="sigil-builder">
      <div className="sb-panel" style={{ marginBottom: 12 }}>
        <div className="sb-panel-title">◈ Sigil Builder</div>
        <div style={{ fontSize: 12, color: 'var(--sb-text-muted)', lineHeight: 1.5 }}>
          Compose ASIN-HHC sigils by placing glyphs on the canvas. Drag to move, double-click to remove.
        </div>
      </div>

      <div className="sb-layout">
        {/* ── Glyph Palette ── */}
        <div className="sb-palette">
          <div className="sb-panel">
            <div className="sb-panel-title">🔣 Glyphs</div>
            {categories.map(cat => {
              const catGlyphs = glyphs.filter(g => g.category === cat);
              return (
                <div key={cat} className="sb-category">
                  <div className="sb-category-label">{cat}</div>
                  <div className="sb-glyph-grid">
                    {catGlyphs.map(g => (
                      <button
                        key={g.id}
                        className="sb-glyph-btn"
                        onClick={() => addGlyph(g.id)}
                        title={`${g.name} — ${g.freq} Hz`}
                      >
                        <span style={{ color: g.color }}>{g.glyph}</span>
                        <span className="sb-glyph-tooltip">
                          <span className="sb-tooltip-name">{g.name}</span>
                          <span className="sb-tooltip-freq">{g.freq} Hz</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Canvas + Decode ── */}
        <div className="sb-canvas-area">
          <div
            ref={canvasRef}
            className="sb-canvas-wrap"
            onClick={handleCanvasClick}
          >
            <svg
              ref={svgRef}
              className="sb-canvas-svg"
              viewBox={`0 0 ${svgSize.width} ${svgSize.height}`}
              preserveAspectRatio="xMidYMid slice"
            >
              <defs>
                <radialGradient id="sb-canvas-grad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(255,107,53,0.04)" />
                  <stop offset="100%" stopColor="transparent" />
                </radialGradient>
              </defs>
              <rect width="100%" height="100%" fill="url(#sb-canvas-grad)" />
              <TorusBackground width={svgSize.width} height={svgSize.height} />
              <ShapeSVG shape={shape} width={svgSize.width} height={svgSize.height} />

              {canvasGlyphs.map(cg => {
                const meta = getGlyphMeta(cg.glyphId);
                if (!meta) return null;
                const isSelected = selectedId === cg.id;
                return (
                  <text
                    key={cg.id}
                    x={cg.x}
                    y={cg.y}
                    fontSize={32 * (cg.scale || 1)}
                    fill={meta.color}
                    opacity={0.95}
                    style={{
                      cursor: 'grab',
                      filter: isSelected
                        ? 'drop-shadow(0 0 6px rgba(255,107,53,0.5))'
                        : 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))',
                      userSelect: 'none',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                    textAnchor="middle"
                    dominantBaseline="central"
                    transform={`rotate(${cg.rotation || 0}, ${cg.x}, ${cg.y})`}
                    onMouseDown={(e) => handleMouseDown(e, cg.id)}
                  >
                    {meta.glyph}
                  </text>
                );
              })}
            </svg>

            {canvasGlyphs.length === 0 && (
              <div className="sb-canvas-empty">
                <div className="sb-canvas-empty-icon">◈</div>
                <div className="sb-canvas-empty-text">Canvas is empty</div>
                <div className="sb-canvas-empty-sub">Click glyphs from the palette to begin</div>
              </div>
            )}
          </div>

          {/* ── Live Decode ── */}
          <div className="sb-panel">
            <div className="sb-panel-title">📡 Live Decode</div>
            <div className="sb-decode">
              <div><span className="sb-decode-key">A</span> <span className="sb-decode-value">{decode.asin.A}</span></div>
              <div><span className="sb-decode-key">S</span> <span className="sb-decode-value">{decode.asin.S}</span></div>
              <div><span className="sb-decode-key">I</span> <span className="sb-decode-value">{decode.asin.I}</span></div>
              <div><span className="sb-decode-key">N</span> <span className="sb-decode-value">{decode.asin.N}</span></div>
              <div><span className="sb-decode-key">HHC</span> <span className="sb-decode-value">{decode.asin.HHC}</span></div>
            </div>
            <div style={{ marginTop: 10 }}>
              <div className="sb-coherence-label">
                <span>Coherence</span>
                <span>{(decode.coherence * 100).toFixed(0)}%</span>
              </div>
              <div className="sb-coherence-bar">
                <div
                  className="sb-coherence-fill"
                  style={{ width: `${decode.coherence * 100}%` }}
                />
              </div>
            </div>
            {decode.freqAnalysis.length > 0 && (
              <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap' }}>
                {decode.freqAnalysis.map((f, i) => (
                  <span key={i} className="sb-freq-tag">
                    <span
                      className="sb-freq-tag-bar"
                      style={{ opacity: Math.max(0.2, f.pct / 100) }}
                    />
                    {f.freq}Hz ×{f.count}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Sidebar: Builder + Export + Presets ── */}
        <div className="sb-sidebar">
          {/* ASIN-HHC Builder */}
          <div className="sb-panel">
            <div className="sb-panel-title">⚒ Builder</div>

            <div className="sb-field">
              <label className="sb-field-label">A — Anchor Glyph</label>
              <select
                className="sb-select"
                value={anchorGlyph}
                onChange={e => setAnchorGlyph(e.target.value)}
              >
                <option value="">— Select Anchor —</option>
                {glyphs.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.glyph} {g.name} ({g.freq} Hz)
                  </option>
                ))}
              </select>
            </div>

            <div className="sb-field">
              <label className="sb-field-label">S — Shape</label>
              <div className="sb-shape-grid">
                {shapes.map(s => (
                  <button
                    key={s}
                    className={`sb-shape-btn ${shape === s ? 'active' : ''}`}
                    onClick={() => setShape(s)}
                    title={s}
                  >
                    {s === 'circle' && '○'}
                    {s === 'crescent' && '☽'}
                    {s === 'triangle' && '△'}
                    {s === 'diamond' && '◆'}
                    {s === 'spiral' && '꩜'}
                  </button>
                ))}
              </div>
            </div>

            <div className="sb-field">
              <label className="sb-field-label">I — Intention</label>
              <input
                className="sb-input"
                type="text"
                value={intention}
                onChange={e => setIntention(e.target.value)}
                placeholder="Enter intention statement..."
              />
            </div>

            <div className="sb-field">
              <label className="sb-field-label">N — Number (auto)</label>
              <div
                className="sb-input"
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--sb-text-secondary)',
                  background: 'rgba(255,255,255,0.02)',
                }}
              >
                {decode.asin.N}
              </div>
            </div>

            <div className="sb-field">
              <label className="sb-field-label">HHC — Frequency Gate</label>
              <div className="sb-freq-grid">
                {freqGates.map(g => (
                  <button
                    key={g}
                    className={`sb-freq-btn ${freqGate === g ? 'active' : ''}`}
                    onClick={() => setFreqGate(g)}
                  >
                    {g === 'dual' ? '428+528' : `${g} Hz`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Export */}
          <div className="sb-panel">
            <div className="sb-panel-title">⬇ Export</div>
            <div className="sb-export-grid">
              <button className="sb-btn sb-btn-primary" onClick={exportPNG}>
                📷 PNG
              </button>
              <button className="sb-btn sb-btn-primary" onClick={exportSVG}>
                📐 SVG
              </button>
              <button className="sb-btn sb-btn-secondary" onClick={copyDecode}>
                📋 Copy Decode
              </button>
              <button className="sb-btn sb-btn-secondary" onClick={saveSigil}>
                💾 Save
              </button>
              <button className="sb-btn sb-btn-secondary sb-btn-full" onClick={clearCanvas}>
                🗑 Clear Canvas
              </button>
            </div>
          </div>

          {/* Presets */}
          <div className="sb-panel">
            <div className="sb-panel-title">📂 Presets</div>
            <div className="sb-preset-list">
              {presets.map((p, i) => (
                <div
                  key={`pre-${i}`}
                  className="sb-preset-item"
                  onClick={() => loadSigil(p)}
                >
                  <div>
                    <div className="sb-preset-name">{p.name}</div>
                    <div className="sb-preset-meta">{p.glyphs.length} glyphs • {p.freqGate}</div>
                  </div>
                </div>
              ))}
              {savedSigils.length === 0 && presets.length > 0 && (
                <div style={{ fontSize: 12, color: 'var(--sb-text-muted)', padding: '8px 0' }}>
                  No saved sigils yet.
                </div>
              )}
              {savedSigils.map((s, i) => (
                <div key={`saved-${i}`} className="sb-preset-item" style={{ alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }} onClick={() => loadSigil(s)}>
                    <div className="sb-preset-name">{s.name}</div>
                    <div className="sb-preset-meta">{s.glyphs.length} glyphs • {s.freqGate}</div>
                  </div>
                  <button
                    className="sb-preset-delete"
                    onClick={(e) => { e.stopPropagation(); deleteSavedSigil(i); }}
                    title="Delete"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
