import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import apiRouter from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.middleware.js';
import { ApiError } from './utils/ApiError.js';

const app = express();

// Security Headers
app.use(helmet());

// Dynamic CORS configuration
const allowedOrigins = env.CLIENT_URL


app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      // In development, automatically allow all localhost & 127.0.0.1 ports
      if (env.NODE_ENV === 'development') {
        if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
          return callback(null, true);
        }
      }

      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-order-token', 'Accept', 'Origin', 'X-Requested-With'],
  })
);

// Body Parsers (with safe limits)
app.use(express.json({ limit: '64kb' }));
app.use(express.urlencoded({ extended: true, limit: '64kb' }));

// Request Logging
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Global Rate Limiting (Prevent abuse on public endpoints)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 300 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
});
app.use('/api', generalLimiter);

// Stricter limiter for Auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // 30 login/register attempts per 15 min
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many authentication attempts, please try again later',
  },
});
app.use('/api/v1/auth', authLimiter);

// Mount API v1 routes
app.use('/api/v1', apiRouter);

// Handle 404 routes
app.use((req, res, next) => {
  next(new ApiError(404, `Cannot find ${req.method} ${req.originalUrl} on this server`));
});

// Centralized error handler
app.use(errorHandler);

export { app };
