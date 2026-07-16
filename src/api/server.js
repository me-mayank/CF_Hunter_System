import express from 'express';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import healthRoutes from './routes/health.routes.js';
import hunterRoutes from './routes/hunter.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read swagger.json. We do this synchronously on startup.
const swaggerDocument = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../docs/swagger.json'), 'utf8')
);

export function createServer() {
  const app = express();
  
  // Rate limiter: 100 requests per 15 minutes
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests, please try again later.' } }
  });

  app.use(limiter);
  app.use(express.json());

  // CORS Middleware for the extension
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  
  // Swagger UI
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  // Routes
  app.use(healthRoutes);
  app.use(hunterRoutes);

  // Global Error Handler
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error('API Error:', err);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: err.message || 'Internal server error'
      }
    });
  });

  return app;
}
