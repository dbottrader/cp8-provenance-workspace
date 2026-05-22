import React, { useState, useEffect } from 'react';
import hmnApi from './api';

export default function DataDumpUploader({ navigate }) {
  const [dumps, setDumps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', content: '', type: 'text' });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadDumps();
  }, []);

  const loadDumps = () => {
    hmnApi.getDumps()
      .then(data => {
        setDumps(data.dumps || data || demoDumps());
        setLoading(false);
      })
      .catch(() => {
        setDumps(demoDumps());
        setLoading(false);
      });
  };

  const demoDumps = () => [
    { id: 'd1', name: 'compound_batch_2025_01.json', type: 'json', size: '2.4 MB', status: 'processed', timestamp: '2d ago' },
    { id: 'd2', name: 'molecular_analysis_q4.txt', type: 'text', size: '890 KB', status: 'processed', timestamp: '5d ago' },
    { id: 'd3', name: 'synthetic_corpus_v3.csv', type: 'csv', size: '12 MB', status: 'pending', timestamp: '1h ago' },
    { id: 'd4', name: 'harmonic_frequencies.zip', type: 'zip', size: '45 MB', status: 'failed', timestamp: '1d ago' },
  ];

  const handleUpload = async () => {
    if (!form.name.trim() || !form.content.trim()) return;
    setUploading(true);
    try {
      await hmnApi.uploadDump(form);
      setForm({ name: '', content: '', type: 'text' });
      loadDumps();
    } catch {
      // optimistic
      setDumps(prev => [
        { id: 'new', name: form.name, type: form.type, size: '—', status: 'pending', timestamp: 'just now' },
        ...prev,
      ]);
      setForm({ name: '', content: '', type: 'text' });
    } finally {
      setUploading(false);
    }
  };

  const processDump = async (id) => {
    try {
      await hmnApi.processDump(id);
      loadDumps();
    } catch { /* ignore */ }
  };

  return (
    <div>
      <h2 className="hmn-section-title">
        <span>📦</span>
        <span>Data Dump</span>
        <span className="hmn-protocol-badge" style={{ marginLeft: 'auto' }}>ASIN-HHC</span>
      </h2>

      <div className="hmn-card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Upload New Dump</h3>
        <input
          className="hmn-input"
          style={{ marginBottom: 8 }}
          placeholder="Dump name (e.g. compound_batch_v2.json)"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        />
        <select
          className="hmn-input hmn-select"
          style={{ maxWidth: 200, marginBottom: 8 }}
          value={form.type}
          onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
        >
          <option value="text">Text</option>
          <option value="json">JSON</option>
          <option value="csv">CSV</option>
          <option value="xml">XML</option>
        </select>
        <textarea
          className="hmn-input"
          style={{ minHeight: 100, marginBottom: 12 }}
          placeholder="Paste raw data content here..."
          value={form.content}
          onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
        />
        <button className="hmn-btn" onClick={handleUpload} disabled={uploading}>
          {uploading ? 'Uploading...' : 'Upload Dump'}
        </button>
      </div>

      <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>History</h3>
      {loading ? (
        Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="hmn-card" style={{ height: 50, marginBottom: 8 }}>
            <div className="hmn-skeleton" style={{ width: '50%', height: 14 }} />
          </div>
        ))
      ) : (
        <div className="hmn-dump-list">
          {dumps.map(d => (
            <div key={d.id} className="hmn-dump-item">
              <div>
                <div className="hmn-dump-name">{d.name}</div>
                <div className="hmn-dump-meta">{d.type} · {d.size} · {d.timestamp}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className={`hmn-dump-status ${d.status}`}>{d.status}</span>
                {d.status === 'pending' && (
                  <button className="hmn-btn" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => processDump(d.id)}>
                    Process
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
