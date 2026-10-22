import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import { authMiddleware } from './middleware/authMiddleware';
import { apiRouter } from './routes/api';
import { store } from './store';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-role', 'x-user-id'],
}));

app.use(express.json());
app.use(authMiddleware);

// Mount API
app.use('/api', apiRouter);

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'CrowdGuard AI Platform Server',
    tagline: 'Detect the danger. Guide the crowd. Protect lives.',
    version: '1.0.0',
    mode: 'PROTOTYPE SIMULATION & INGESTION BACKEND',
    endpoints: {
      venues: '/api/venues',
      alerts: '/api/alerts',
      reports: '/api/reports',
      route: '/api/route',
      audit: '/api/audit-logs',
      simulation: '/api/simulation/action',
      websocket: '/ws',
    }
  });
});

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
