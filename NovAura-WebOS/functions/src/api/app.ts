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
import syncRoutes from './routes/sync';
import assetsRoutes from './routes/assets';
import ordersRoutes from './routes/orders';
import royaltiesRoutes from './routes/royalties';

const app = express();

// CORS - Allow novaura.life and dev environments only
app.use(cors({
  origin: [
    'https://novaura.life',
    'https://www.novaura.life',
    'http://localhost:5173',
    'http://localhost:3000',
    /\.novaura\.life$/,
  ],
  credentials: true
}));

// ─── Stripe webhook MUST receive raw body for signature verification ──────────
// Register BEFORE express.json() so the raw buffer is preserved
app.use('/stripe/webhook', express.raw({ type: 'application/json' }));

// All other routes use JSON body parsing
app.use((req, res, next) => {
  if (req.path === '/stripe/webhook') return next();
  express.json()(req, res, next);
});

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
app.use('/sync', syncRoutes);
app.use('/assets', assetsRoutes);
app.use('/orders', ordersRoutes);
app.use('/royalties', royaltiesRoutes);

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
