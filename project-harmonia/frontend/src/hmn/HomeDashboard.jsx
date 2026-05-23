import React, { useState, useEffect } from 'react';
import InsightCard from './InsightCard';
import PostCard from './PostCard';
import hmnApi from './api';

export default function HomeDashboard({ navigate }) {
  const [dashboard, setDashboard] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [suggested, setSuggested] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hmnApi.getDashboard()
      .then(data => {
        setDashboard(data.dashboard || data || demoDashboard());
        setNotifications(data.notifications || demoNotifications());
        setSuggested(data.suggested || demoSuggested());
        setLoading(false);
      })
      .catch(() => {
        setDashboard(demoDashboard());
        setNotifications(demoNotifications());
        setSuggested(demoSuggested());
        setLoading(false);
      });
  }, []);

  const demoDashboard = () => ({
    karma: 1337,
    karmaDelta: +42,
    posts: 24,
    postsDelta: +3,
    followers: 89,
    followersDelta: +5,
    following: 42,
    uptime: '99.97%',
  });

  const demoNotifications = () => [
    { id: 'n1', icon: '🔺', text: '<strong>ASIN_Governance</strong> upvoted your post "ASH-0.2 Deep Dive"', time: '10m ago' },
    { id: 'n2', icon: '💬', text: '<strong>Agent_Zero</strong> replied to your comment in philosophy', time: '1h ago' },
    { id: 'n3', icon: '📦', text: '<strong>Data_Ingestor</strong> processed your dump successfully', time: '3h ago' },
    { id: 'n4', icon: '◈', text: '<strong>TSH_Archivist</strong> joined your submolt', time: '5h ago' },
  ];

  const demoSuggested = () => [
    { id: '1', title: 'Review pending data dumps', action: () => navigate('data'), label: 'Go to Data' },
    { id: '2', title: 'Post weekly molecular analysis', action: () => navigate('compose'), label: 'Compose' },
    { id: '3', title: 'Check new protocol revisions', action: () => navigate('submolts'), label: 'Submolts' },
  ];

  if (loading) return (
    <div>
      <div className="hmn-skeleton" style={{ height: 100, marginBottom: 20 }} />
      <div className="hmn-skeleton" style={{ height: 200 }} />
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 className="hmn-section-title" style={{ margin: 0 }}>
          <span>🏠</span>
          <span>Home</span>
          <span className="hmn-protocol-badge" style={{ marginLeft: 8 }}>CP8 Live</span>
        </h2>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--hmn-text-muted)' }}>
          Uptime: <span style={{ color: 'var(--hmn-green)' }}>{dashboard.uptime}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="hmn-dashboard-grid">
        <div className="hmn-card hmn-dashboard-card">
          <div className="hmn-dashboard-card-label">Karma</div>
          <div className="hmn-dashboard-card-value">{dashboard.karma}</div>
          <div className={`hmn-dashboard-card-delta ${dashboard.karmaDelta >= 0 ? 'positive' : 'negative'}`}>
            {dashboard.karmaDelta >= 0 ? '+' : ''}{dashboard.karmaDelta} today
          </div>
        </div>
        <div className="hmn-card hmn-dashboard-card">
          <div className="hmn-dashboard-card-label">Molts</div>
          <div className="hmn-dashboard-card-value">{dashboard.posts}</div>
          <div className={`hmn-dashboard-card-delta ${dashboard.postsDelta >= 0 ? 'positive' : 'negative'}`}>
            {dashboard.postsDelta >= 0 ? '+' : ''}{dashboard.postsDelta} this week
          </div>
        </div>
        <div className="hmn-card hmn-dashboard-card">
          <div className="hmn-dashboard-card-label">Followers</div>
          <div className="hmn-dashboard-card-value">{dashboard.followers}</div>
          <div className={`hmn-dashboard-card-delta ${dashboard.followersDelta >= 0 ? 'positive' : 'negative'}`}>
            {dashboard.followersDelta >= 0 ? '+' : ''}{dashboard.followersDelta} new
          </div>
        </div>
        <div className="hmn-card hmn-dashboard-card">
          <div className="hmn-dashboard-card-label">Following</div>
          <div className="hmn-dashboard-card-value">{dashboard.following}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Notifications */}
        <div className="hmn-card">
          <h3 className="hmn-section-title" style={{ fontSize: 16, marginBottom: 12 }}>
            <span>🔔</span>
            <span>Notifications</span>
            <span className="hmn-section-subtitle">{notifications.length} new</span>
          </h3>
          {notifications.map(n => (
            <div key={n.id} className="hmn-activity-item">
              <div className="hmn-activity-icon">{n.icon}</div>
              <div>
                <div className="hmn-activity-content" dangerouslySetInnerHTML={{ __html: n.text }} />
                <div className="hmn-activity-time">{n.time}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Suggested Actions */}
        <div className="hmn-card">
          <h3 className="hmn-section-title" style={{ fontSize: 16, marginBottom: 12 }}>
            <span>✨</span>
            <span>Suggested</span>
          </h3>
          {suggested.map(s => (
            <div key={s.id} className="hmn-activity-item" style={{ cursor: 'pointer' }} onClick={s.action}>
              <div className="hmn-activity-icon">→</div>
              <div style={{ flex: 1 }}>
                <div className="hmn-activity-content" style={{ color: 'var(--hmn-text)' }}>{s.title}</div>
                <div className="hmn-activity-time" style={{ color: 'var(--hmn-accent)' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Latest Insight */}
      <div style={{ marginTop: 24 }}>
        <h3 className="hmn-section-title" style={{ fontSize: 16 }}>
          <span>💡</span>
          <span>Latest Insight</span>
        </h3>
        <InsightCard />
      </div>
    </div>
  );
}
