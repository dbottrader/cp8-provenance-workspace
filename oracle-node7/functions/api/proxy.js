// functions/api/proxy.js — Sacred Lithium Grid Main Router
const { authenticateAccessToken } = require('../../utils/auth');
const logger = require('../../utils/logger');
const rateLimiter = require('../../utils/rateLimiter');

const providers = {
  openai: require('./providers/openai'),
  anthropic: require('./providers/anthropic'),
  groq: require('./providers/groq'),
  google: require('./providers/google'),
  cohere: require('./providers/cohere')
};

exports.handler = async (event) => {
  const startTime = Date.now();
  const ip = event.headers['client-ip'] || 'unknown';

  try {
    // Rate limit
    if (!rateLimiter.allow(ip)) {
      return { statusCode: 429, body: JSON.stringify({ error: "Rate limit exceeded" }) };
    }

    // Auth
    authenticateAccessToken(event);

    const { provider, ...body } = JSON.parse(event.body || '{}');
    if (!provider || !providers[provider]) {
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid provider" }) };
    }

    const result = await providers[provider].handle(body);

    const duration = Date.now() - startTime;
    logger.log({
      ip,
      provider,
      status: 200,
      duration,
      success: true
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result)
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.log({
      ip,
      status: error.message.includes('token') ? 401 : 500,
      duration,
      success: false,
      error: error.message
    });

    return {
      statusCode: error.message.includes('token') ? 401 : 500,
      body: JSON.stringify({ error: "Request failed. Please try again." })
    };
  }
};
