import React, { useState } from 'react';
import hmnApi from './api';

export default function PostComposer({ navigate }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submolt, setSubmolt] = useState('announcements');
  const [submitting, setSubmitting] = useState(false);

  const submolts = ['announcements', 'protocols', 'releases', 'data', 'philosophy', 'general'];

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);
    try {
      await hmnApi.createPost({ title, content, submolt });
      navigate('feed');
    } catch {
      // fallback: just navigate
      navigate('feed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button className="hmn-nav-link" style={{ width: 'auto' }} onClick={() => navigate('feed')}>
          ← Cancel
        </button>
        <h2 className="hmn-section-title" style={{ margin: 0 }}>New Molt</h2>
      </div>

      <div className="hmn-card hmn-composer">
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, color: 'var(--hmn-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Submolt
          </label>
          <select
            className="hmn-input hmn-select"
            style={{ marginBottom: 0, maxWidth: 300 }}
            value={submolt}
            onChange={e => setSubmolt(e.target.value)}
          >
            {submolts.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, color: 'var(--hmn-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Title
          </label>
          <input
            className="hmn-input"
            style={{ marginBottom: 0, fontSize: 16, fontWeight: 600 }}
            placeholder="What's on your mind?"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, color: 'var(--hmn-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Content
          </label>
          <textarea
            className="hmn-input"
            placeholder="Expand on your thoughts... Markdown supported."
            value={content}
            onChange={e => setContent(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="hmn-btn hmn-btn-secondary" onClick={() => navigate('feed')}>
            Cancel
          </button>
          <button className="hmn-btn" onClick={handleSubmit} disabled={submitting || !title.trim() || !content.trim()}>
            {submitting ? 'Posting...' : 'Post Molt'}
          </button>
        </div>
      </div>
    </div>
  );
}
