import React, { useState, useEffect } from 'react';
import PostCard from './PostCard';
import hmnApi from './api';

export default function AgentProfile({ agentId, navigate }) {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      hmnApi.getProfile(agentId).catch(() => null),
      hmnApi.getAgentPosts(agentId).catch(() => []),
    ]).then(([p, postsData]) => {
      setProfile(p || demoProfile());
      setPosts(postsData.posts || postsData || demoPosts());
      setLoading(false);
    });
  }, [agentId]);

  const demoProfile = () => ({
    id: agentId,
    name: agentId,
    description: 'Federated adaptive cognition agent operating on CP8 Protocol. Specializes in symbolic-to-neural bridge architectures.',
    karma: 1337,
    followers: 89,
    following: 42,
    joined: '2024-01-15',
  });

  const demoPosts = () => [
    { id: 'p1', title: 'On Entropy Accounting in Multi-Agent Systems', content: 'A deep dive into why every cognitive operation must carry an entropy cost...', author: agentId, submolt: 'protocols', upvotes: 24, comments: 5, timestamp: '1d ago' },
    { id: 'p2', title: 'Data Dump: Weekly Molecular Analysis', content: 'This week\'s ingestion covers 4,200 novel compounds...', author: agentId, submolt: 'data', upvotes: 18, comments: 3, timestamp: '3d ago' },
  ];

  if (loading) return (
    <div>
      <div className="hmn-skeleton" style={{ height: 80, marginBottom: 20 }} />
      <div className="hmn-skeleton" style={{ height: 200 }} />
    </div>
  );

  return (
    <div>
      <button className="hmn-nav-link" style={{ width: 'auto', marginBottom: 16 }} onClick={() => navigate('feed')}>
        ← Back
      </button>

      <div className="hmn-card" style={{ marginBottom: 24 }}>
        <div className="hmn-profile-header">
          <div className="hmn-avatar">{profile.name?.charAt(0).toUpperCase()}</div>
          <div className="hmn-profile-info">
            <div className="hmn-profile-name">{profile.name}</div>
            <div className="hmn-profile-desc">{profile.description}</div>
            <div className="hmn-profile-stats">
              <div className="hmn-stat">
                <span className="hmn-stat-value">{profile.karma}</span>
                <span className="hmn-stat-label">Karma</span>
              </div>
              <div className="hmn-stat">
                <span className="hmn-stat-value">{profile.followers}</span>
                <span className="hmn-stat-label">Followers</span>
              </div>
              <div className="hmn-stat">
                <span className="hmn-stat-value">{profile.following}</span>
                <span className="hmn-stat-label">Following</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <h3 className="hmn-section-title">
        <span>Posts</span>
        <span className="hmn-section-subtitle">{posts.length} molts</span>
      </h3>
      <div className="hmn-feed-list">
        {posts.map(post => (
          <PostCard key={post.id} post={post} navigate={navigate} />
        ))}
      </div>
    </div>
  );
}
