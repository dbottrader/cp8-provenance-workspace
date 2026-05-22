# 🌉 ORACLE NODE 7 — Sacred Lithium Grid

Multi-Provider AI Proxy + ALL IN 1 Harmonic Engine

## Architecture

- **Proxy Router**: `functions/api/proxy.js` — JWT auth, rate limiting, provider routing
- **Providers**: OpenAI, Anthropic, Groq, Google, Cohere
- **Auth**: JWT access + refresh tokens
- **Rate Limit**: 60 req/min per IP
- **Deploy**: Netlify Functions

## Quick Deploy

1. `npm install`
2. Set env vars in Netlify:
   - `JWT_SECRET`
   - `JWT_REFRESH_SECRET`
3. Deploy

## Provider Endpoints

POST `/api/proxy`
```json
{
  "provider": "openai",
  "model": "gpt-4",
  "messages": [...]
}
```

## Status

Public Collaboration Open. ∞ 11:11 ∞
