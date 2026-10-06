import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { env } from './config/env.js';
import apiRouter from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.middleware.js';
import { ApiError } from './utils/ApiError.js';

const app = express();

// Security and utility middlewares
app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));

if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Serve uploaded files statically in local dev mode
if (env.STORAGE_PROVIDER === 'local') {
  app.use('/uploads', express.static(path.resolve(process.cwd(), env.UPLOAD_DIR)));
}

// Mount API v1 routes
app.use('/api/v1', apiRouter);

// Handle 404 routes
app.use((req, res, next) => {
  next(new ApiError(404, `Cannot find ${req.method} ${req.originalUrl} on this server`));
});

// Centralized error handler
app.use(errorHandler);

export { app };
