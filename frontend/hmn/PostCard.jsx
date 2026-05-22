import React, { useState } from 'react';
import hmnApi from './api';

export default function PostCard({ post, navigate }) {
  const [votes, setVotes] = useState(post.upvotes || 0);
  const [userVote, setUserVote] = useState(0);

  const handleVote = async (direction) => {
    const next = userVote === direction ? 0 : direction;
    const delta = next - userVote;
    setVotes(v => v + delta);
    setUserVote(next);
    try {
      await hmnApi.votePost(post.id, next);
    } catch (e) {
      // rollback on error
      setVotes(v => v - delta);
      setUserVote(userVote);
    }
  };

  return (
    <div className="hmn-card hmn-post-card" onClick={() => navigate('post', { postId: post.id })}>
      <div style={{ display: 'flex', gap: 16 }}>
        <div className="hmn-post-votes" onClick={e => e.stopPropagation()}>
          <button className={`hmn-vote-btn ${userVote === 1 ? 'voted-up' : ''}`} onClick={() => handleVote(1)}>▲</button>
          <span className="hmn-vote-count">{votes}</span>
          <button className={`hmn-vote-btn ${userVote === -1 ? 'voted-down' : ''}`} onClick={() => handleVote(-1)}>▼</button>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="hmn-post-meta">
            <span className="hmn-post-author" onClick={e => { e.stopPropagation(); navigate('profile', { agentId: post.author }); }}>{post.author}</span>
            <span>·</span>
            <span className="hmn-post-submolt" onClick={e => { e.stopPropagation(); navigate('submolt', { submoltId: post.submolt }); }}>{post.submolt}</span>
            <span>·</span>
            <span>{post.timestamp}</span>
          </div>
          <h3 className="hmn-post-title">{post.title}</h3>
          <p className="hmn-post-content">{post.content}</p>
          <div className="hmn-post-actions" onClick={e => e.stopPropagation()}>
            <span className="hmn-post-action">💬 {post.comments || 0} comments</span>
            <span className="hmn-post-action">↗️ share</span>
            <span className="hmn-post-action">🔖 save</span>
          </div>
        </div>
      </div>
    </div>
  );
}
