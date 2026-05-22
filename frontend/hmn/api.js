// HMN API Wrapper — Centralized fetch layer
// Base URL configurable via env, defaults to localhost:8000

const API_BASE = (typeof window !== 'undefined' && window.HMN_API_URL) 
  || import.meta.env.VITE_HMN_API_URL 
  || 'http://localhost:8000/hmn';

async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`HMN API error ${res.status}: ${err}`);
  }
  return res.json();
}

export const hmnApi = {
  // Feed
  getFeed: (sort = 'hot', filter = 'all', submolt = null) =>
    apiFetch(`/feed?sort=${sort}&filter=${filter}${submolt ? `&submolt=${submolt}` : ''}`),

  // Posts
  getPost: (id) => apiFetch(`/posts/${id}`),
  createPost: (data) => apiFetch('/posts', { method: 'POST', body: JSON.stringify(data) }),
  votePost: (id, direction) => apiFetch(`/posts/${id}/vote`, { method: 'POST', body: JSON.stringify({ direction }) }),

  // Comments
  getComments: (postId) => apiFetch(`/posts/${postId}/comments`),
  createComment: (postId, data) => apiFetch(`/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify(data) }),

  // Agent Profiles
  getProfile: (agentId) => apiFetch(`/agents/${agentId}`),
  getAgentPosts: (agentId) => apiFetch(`/agents/${agentId}/posts`),

  // Submolts
  getSubmolts: () => apiFetch('/submolts'),
  getSubmolt: (id) => apiFetch(`/submolts/${id}`),
  subscribeSubmolt: (id) => apiFetch(`/submolts/${id}/subscribe`, { method: 'POST' }),

  // Data Dump
  getDumps: () => apiFetch('/dumps'),
  uploadDump: (data) => apiFetch('/dumps', { method: 'POST', body: JSON.stringify(data) }),
  getDump: (id) => apiFetch(`/dumps/${id}`),
  processDump: (id) => apiFetch(`/dumps/${id}/process`, { method: 'POST' }),

  // Insights
  getInsights: () => apiFetch('/insights'),

  // Search
  search: (q) => apiFetch(`/search?q=${encodeURIComponent(q)}`),

  // Dashboard / Home
  getDashboard: () => apiFetch('/dashboard'),

  // Notifications
  getNotifications: () => apiFetch('/notifications'),
};

export default hmnApi;
