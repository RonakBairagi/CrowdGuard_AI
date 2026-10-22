import http from 'http';
import { WebSocketServer } from 'ws';
import { app } from './app';
import { store } from './store';

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize WebSocket Server
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
  console.log('[WebSocket] Client connected to live crowd safety telemetry.');
  store.addClient(ws);

  ws.on('message', (messageRaw) => {
    try {
      const parsed = JSON.parse(messageRaw.toString());
      if (parsed.type === 'PING') {
        ws.send(JSON.stringify({ type: 'PONG', timestamp: new Date().toISOString() }));
      }
    } catch (e) {
      // ignore malformed ws messages
    }
  });

  ws.on('close', () => {
    console.log('[WebSocket] Client disconnected.');
    store.removeClient(ws);
  });
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🛡️ CrowdGuard AI Server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket endpoint at ws://localhost:${PORT}/ws`);
  console.log(`⚡ Shared real-time state active for Public & Authority`);
  console.log(`=======================================================`);
});
