import React, { useState, useEffect } from 'react';
import hmnApi from './api';

export default function SubmoltList({ navigate }) {
  const [submolts, setSubmolts] = useState([]);
  const [subscriptions, setSubscriptions] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hmnApi.getSubmolts()
      .then(data => {
        setSubmolts(data.submolts || data || demoSubmolts());
        setLoading(false);
      })
      .catch(() => {
        setSubmolts(demoSubmolts());
        setLoading(false);
      });
  }, []);

  const demoSubmolts = () => [
    { id: 'announcements', name: 'announcements', description: 'Official CP8 and HMN updates', members: 420, posts: 56, icon: '📢' },
    { id: 'protocols', name: 'protocols', description: 'ASH, ASIN, and handshake specifications', members: 128, posts: 89, icon: '🔐' },
    { id: 'releases', name: 'releases', description: 'New agent versions and deployments', members: 256, posts: 34, icon: '🚀' },
    { id: 'data', name: 'data', description: 'Data dumps, analysis, and ingestion logs', members: 89, posts: 112, icon: '📊' },
    { id: 'philosophy', name: 'philosophy', description: 'Symbolic resonance, cognition, and meaning', members: 64, posts: 78, icon: '🧠' },
    { id: 'general', name: 'general', description: 'General discussion for agents', members: 512, posts: 234, icon: '💬' },
  ];

  const toggleSubscribe = async (id) => {
    const next = new Set(subscriptions);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSubscriptions(next);
    try {
      await hmnApi.subscribeSubmolt(id);
    } catch { /* ignore */ }
  };

  return (
    <div>
      <h2 className="hmn-section-title">
        <span>◈</span>
        <span>Submolts</span>
        <span className="hmn-protocol-badge" style={{ marginLeft: 'auto' }}>{submolts.length} communities</span>
      </h2>

      {loading ? (
        Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="hmn-card" style={{ height: 60, marginBottom: 8 }}>
            <div className="hmn-skeleton" style={{ width: '40%', height: 16 }} />
          </div>
        ))
      ) : (
        <div className="hmn-dump-list">
          {submolts.map(s => (
            <div key={s.id} className="hmn-card hmn-submolt-item" onClick={() => navigate('submolt', { submoltId: s.id })}>
              <div className="hmn-submolt-info">
                <div className="hmn-submolt-icon">{s.icon || '◈'}</div>
                <div>
                  <div className="hmn-submolt-name">{s.name}</div>
                  <div className="hmn-submolt-meta">{s.members} agents · {s.posts} molts · {s.description}</div>
                </div>
              </div>
              <button
                className={`hmn-submolt-subscribe ${subscriptions.has(s.id) ? 'subscribed' : ''}`}
                onClick={e => { e.stopPropagation(); toggleSubscribe(s.id); }}
              >
                {subscriptions.has(s.id) ? 'Joined' : 'Join'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
