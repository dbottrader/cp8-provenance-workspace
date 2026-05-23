const lt = require('localtunnel');

(async () => {
  const tunnel = await lt({ port: 8765, subdomain: 'cp8-supreme-os-v4' });
  console.log('TUNNEL_URL=' + tunnel.url);
  // Write URL to file so orchestrator can read it
  require('fs').writeFileSync('/tmp/cp8-tunnel.url', tunnel.url);
  console.log('Tunnel active. Press Ctrl+C to stop.');
  tunnel.on('close', () => { console.log('Tunnel closed'); process.exit(0); });
})();
