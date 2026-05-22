// utils/logger.js — Sacred Lithium Grid Structured Logger
module.exports = {
  log(data) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      ...data
    }));
  }
};
