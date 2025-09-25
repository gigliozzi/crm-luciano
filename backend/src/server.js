import express from 'express';
import cors from 'cors';
import { initializeDatabase } from './db/connection.js';
import routes from './routes/index.js';
import { config } from './config/env.js';
import { startBirthdayScheduler } from './services/scheduler.js';

const app = express();

// Enable JSON payloads and CORS. If ALLOWED_ORIGINS is set, restrict to that list.
const allowed = (config.cors && Array.isArray(config.cors.allowedOrigins)) ? config.cors.allowedOrigins : [];
if (allowed.length > 0) {
  console.log('[cors] Allowed origins:', allowed.join(', '));
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // allow non-browser or same-origin requests
      if (allowed.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  }));
} else {
  app.use(cors()); // open CORS (default)
}
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api', routes);

// Generic error handler to avoid leaking stack traces to the client.
app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status || 500;
  const message = err.message || 'Erro interno do servidor.';
  res.status(status).json({ message });
});

async function bootstrap() {
  try {
    await initializeDatabase();
    startBirthdayScheduler();

    app.listen(config.port, () => {
      console.log(`Servidor ouvindo em http://localhost:${config.port}`);
    });
  } catch (error) {
    console.error('Erro ao iniciar o servidor', error);
    process.exit(1);
  }
}

bootstrap();
