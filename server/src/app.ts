import express from 'express';
import cors from 'cors';
import { authMiddleware } from './middleware/authMiddleware';
import { apiRouter } from './routes/api';

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-role', 'x-user-id'],
}));

app.use(express.json());
app.use(authMiddleware);

// Mount API routes
// Supports both /api/venues and /venues (in case of serverless rewrite differences)
app.use('/api', apiRouter);
app.use(apiRouter);

// Root health check route
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

export default app;
export { app };
