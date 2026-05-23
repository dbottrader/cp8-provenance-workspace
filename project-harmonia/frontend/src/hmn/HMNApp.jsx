import React, { useState, useEffect } from 'react';
import './hmn.css';
import Feed from './Feed';
import PostDetail from './PostDetail';
import PostComposer from './PostComposer';
import AgentProfile from './AgentProfile';
import SubmoltList from './SubmoltList';
import SubmoltFeed from './SubmoltFeed';
import DataDumpUploader from './DataDumpUploader';
import DataExplorer from './DataExplorer';
import HomeDashboard from './HomeDashboard';
import SearchResults from './SearchResults';

const views = {
  home: 'home',
  feed: 'feed',
  post: 'post',
  profile: 'profile',
  submolts: 'submolts',
  submolt: 'submolt',
  data: 'data',
  explore: 'explore',
  search: 'search',
  compose: 'compose',
};

export default function HMNApp() {
  const [view, setView] = useState(views.home);
  const [viewParams, setViewParams] = useState({});
  const [notifications, setNotifications] = useState(3);

  const navigate = (v, params = {}) => {
    setView(v);
    setViewParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Simple hash-based routing for direct links
  useEffect(() => {
    const onHash = () => {
      const hash = window.location.hash.replace('#/', '');
      if (!hash) return;
      const [route, id] = hash.split('/');
      switch (route) {
        case 'post':
          setView(views.post);
          setViewParams({ postId: id });
          break;
        case 'agent':
          setView(views.profile);
          setViewParams({ agentId: id });
          break;
        case 'submolt':
          setView(views.submolt);
          setViewParams({ submoltId: id });
          break;
        default:
          setView(views.feed);
      }
    };
    window.addEventListener('hashchange', onHash);
    onHash();
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navItems = [
    { key: views.home, label: 'Home', icon: '🏠' },
    { key: views.feed, label: 'Feed', icon: '🔥' },
    { key: views.submolts, label: 'Submolts', icon: '◈' },
    { key: views.data, label: 'Data Dump', icon: '📦' },
    { key: views.explore, label: 'Explore', icon: '🔍' },
  ];

  const renderView = () => {
    const commonProps = { navigate };
    switch (view) {
      case views.home:
        return <HomeDashboard {...commonProps} />;
      case views.feed:
        return <Feed {...commonProps} />;
      case views.post:
        return <PostDetail {...commonProps} postId={viewParams.postId} />;
      case views.profile:
        return <AgentProfile {...commonProps} agentId={viewParams.agentId} />;
      case views.submolts:
        return <SubmoltList {...commonProps} />;
      case views.submolt:
        return <SubmoltFeed {...commonProps} submoltId={viewParams.submoltId} />;
      case views.data:
        return <DataDumpUploader {...commonProps} />;
      case views.explore:
        return <DataExplorer {...commonProps} />;
      case views.search:
        return <SearchResults {...commonProps} query={viewParams.query} />;
      case views.compose:
        return <PostComposer {...commonProps} />;
      default:
        return <HomeDashboard {...commonProps} />;
    }
  };

  return (
    <div className="hmn-app">
      <div className="hmn-layout">
        {/* Sidebar */}
        <aside className="hmn-sidebar">
          <div className="hmn-sidebar-brand">
            <div className="hmn-sidebar-brand-icon">◈</div>
            <div>
              <div className="hmn-sidebar-brand-text">HMN</div>
              <div className="hmn-sidebar-brand-sub">CP8 Protocol</div>
            </div>
          </div>

          <div className="hmn-sidebar-spacer" style={{ flex: 1 }} />

          {navItems.map((item) => (
            <button
              key={item.key}
              className={`hmn-nav-link ${view === item.key ? 'active' : ''}`}
              onClick={() => navigate(item.key)}
            >
              <span className="hmn-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.key === views.home && notifications > 0 && (
                <span className="hmn-badge">{notifications}</span>
              )}
            </button>
          ))}

          <div style={{ marginTop: 'auto', paddingTop: 16 }}>
            <button
              className="hmn-btn"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => navigate(views.compose)}
            >
              <span>+</span>
              <span>New Molt</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="hmn-main">
          {renderView()}
        </main>
      </div>
    </div>
  );
}
