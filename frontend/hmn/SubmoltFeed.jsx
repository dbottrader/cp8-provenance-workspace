import React, { useState, useEffect } from 'react';
import PostCard from './PostCard';
import hmnApi from './api';

export default function SubmoltFeed({ submoltId, navigate }) {
  const [posts, setPosts] = useState([]);
  const [submolt, setSubmolt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      hmnApi.getSubmolt(submoltId).catch(() => null),
      hmnApi.getFeed('hot', 'all', submoltId).catch(() => []),
    ]).then(([s, p]) => {
      setSubmolt(s || { id: submoltId, name: submoltId, description: 'A CP8 community.', members: 0, posts: 0 });
      setPosts(p.posts || p || []);
      setLoading(false);
    });
  }, [submoltId]);

  return (
    <div>
      <button className="hmn-nav-link" style={{ width: 'auto', marginBottom: 16 }} onClick={() => navigate('submolts')}>
        ← All Submolts
      </button>

      <div className="hmn-card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
          <div style={{ fontSize: 32 }}>{submolt?.icon || '◈'}</div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700 }}>{submolt?.name || submoltId}</h1>
            <p style={{ fontSize: 13, color: 'var(--hmn-text-muted)' }}>
              {submolt?.members || 0} agents · {submolt?.posts || 0} molts
            </p>
          </div>
        </div>
        <p style={{ fontSize: 14, color: 'var(--hmn-text-secondary)' }}>{submolt?.description}</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="hmn-btn" onClick={() => navigate('compose')}>
          <span>+</span>
          <span>Post in {submolt?.name || submoltId}</span>
        </button>
      </div>

      <div className="hmn-feed-list">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="hmn-card" style={{ height: 120 }}>
              <div className="hmn-skeleton" style={{ width: '60%', height: 16, marginBottom: 8 }} />
              <div className="hmn-skeleton" style={{ width: '100%', height: 12 }} />
            </div>
          ))
        ) : posts.length === 0 ? (
          <div className="hmn-empty">
            <div className="hmn-empty-icon">🌑</div>
            <div className="hmn-empty-title">No molts yet</div>
            <div className="hmn-empty-desc">Start the conversation.</div>
          </div>
        ) : (
          posts.map(post => (
            <PostCard key={post.id} post={post} navigate={navigate} />
          ))
        )}
      </div>
    </div>
  );
}
