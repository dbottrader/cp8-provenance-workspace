import React, { useState, useEffect } from 'react';
import hmnApi from './api';

export default function DataExplorer({ navigate }) {
  const [dumps, setDumps] = useState([]);
  const [selected, setSelected] = useState(null);
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hmnApi.getDumps()
      .then(data => {
        setDumps(data.dumps || data || demoDumps());
        setLoading(false);
      })
      .catch(() => {
        setDumps(demoDumps());
        setLoading(false);
      });
  }, []);

  const demoDumps = () => [
    { id: 'd1', name: 'compound_batch_2025_01.json', type: 'json', size: '2.4 MB', status: 'processed', timestamp: '2d ago' },
    { id: 'd2', name: 'molecular_analysis_q4.txt', type: 'text', size: '890 KB', status: 'processed', timestamp: '5d ago' },
    { id: 'd3', name: 'synthetic_corpus_v3.csv', type: 'csv', size: '12 MB', status: 'pending', timestamp: '1h ago' },
  ];

  const loadDump = async (id) => {
    setSelected(id);
    setContent(null);
    try {
      const data = await hmnApi.getDump(id);
      setContent(data.content || JSON.stringify(data, null, 2));
    } catch {
      setContent('{\n  \"status\": \"demo\",\n  \"dump_id\": \"' + id + '\",\n  \"records\": 1024,\n  \"fields\": [\"smiles\", \"frequency\", \"confidence\"]\n}');
    }
  };

  const processDump = async (id) => {
    try {
      await hmnApi.processDump(id);
      alert('Processing triggered for ' + id);
    } catch {
      alert('Processing triggered (demo mode)');
    }
  };

  return (
    <div>
      <h2 className="hmn-section-title">
        <span>🔍</span>
        <span>Data Explorer</span>
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 20 }}>
        {/* List */}
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Available Dumps</h3>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="hmn-card" style={{ height: 50, marginBottom: 8 }}>
                <div className="hmn-skeleton" style={{ width: '60%', height: 14 }} />
              </div>
            ))
          ) : (
            <div className="hmn-dump-list">
              {dumps.map(d => (
                <div
                  key={d.id}
                  className="hmn-dump-item"
                  style={{
                    cursor: 'pointer',
                    borderColor: selected === d.id ? 'var(--hmn-accent)' : undefined,
                  }}
                  onClick={() => loadDump(d.id)}
                >
                  <div>
                    <div className="hmn-dump-name">{d.name}</div>
                    <div className="hmn-dump-meta">{d.type} · {d.size}</div>
                  </div>
                  <span className={`hmn-dump-status ${d.status}`}>{d.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Preview */}
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Preview</h3>
          {selected ? (
            <div>
              {content === null ? (
                <div className="hmn-card" style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--hmn-text-muted)' }}>
                  Loading...
                </div>
              ) : (
                <>
                  <div className="hmn-data-preview">{content}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button className="hmn-btn hmn-btn-secondary" onClick={() => setContent(null)}>
                      Clear
                    </button>
                    <button className="hmn-btn" onClick={() => processDump(selected)}>
                      Re-Process
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="hmn-empty">
              <div className="hmn-empty-icon">📂</div>
              <div className="hmn-empty-title">Select a dump</div>
              <div className="hmn-empty-desc">Click a dump from the list to preview its contents.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
