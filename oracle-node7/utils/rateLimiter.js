// utils/rateLimiter.js — Sacred Lithium Grid Rate Limiter
const requests = new Map();

module.exports = {
  allow(ip) {
    const now = Date.now();
    if (!requests.has(ip)) requests.set(ip, []);
    
    const userRequests = requests.get(ip).filter(ts => now - ts < 60000);
    if (userRequests.length >= 60) return false;
    
    userRequests.push(now);
    requests.set(ip, userRequests);
    return true;
  }
};
