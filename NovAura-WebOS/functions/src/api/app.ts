/**
 * Express API App
 * Unified backend for NovAura Platform
 */

import express from 'express';
import cors from 'cors';

// Routes
import authRoutes from './routes/auth';
import aiRoutes from './routes/ai';
import domainsRoutes from './routes/domains';
import generationRoutes from './routes/generation';
import vertexRoutes from './routes/vertex';
import driveRoutes from './routes/drive';
import musicRoutes from './routes/music';
import searchRoutes from './routes/search';
import stripeRoutes from './routes/stripe';

const app = express();

// CORS
app.use(cors({
  origin: [
    'https://ecosystem.novaura.life',
    'https://novaura-systems.web.app',
    'https://novaura-systems.firebaseapp.com',
    'https://novaura-o-s-63232239-3ee79.web.app',
    'https://novaura-o-s-63232239-3ee79.firebaseapp.com',
    'https://novaura.life',
    'http://localhost:5173', // Vite dev server
  ],
  credentials: true
}));

// Body parsing
app.use(express.json());

// Logging
app.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/ai', aiRoutes);
app.use('/domains', domainsRoutes);
app.use('/generation', generationRoutes);
app.use('/vertex', vertexRoutes);
app.use('/drive', driveRoutes);
app.use('/music', musicRoutes);
app.use('/search', searchRoutes);
app.use('/stripe', stripeRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'novaura-api',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[API Error]', err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
