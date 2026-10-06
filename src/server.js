import mongoose from 'mongoose';
import { app } from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';

let server;

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('💥 [Server] UNCAUGHT EXCEPTION! Shutting down...', err);
  process.exit(1);
});

const startServer = async () => {
  try {
    // 1. Connect to MongoDB Atlas / local DB
    await connectDB();

    // 2. Start HTTP server (Render provides dynamic PORT)
    const PORT = process.env.PORT || env.PORT || 5000;
    server = app.listen(PORT, () => {
      console.log(`🚀 [Server] PrintFlow backend running in ${env.NODE_ENV} mode on port ${PORT}`);
      console.log(`📦 [Storage] Provider active: ${env.STORAGE_PROVIDER.toUpperCase()}`);
    });

    // 3. Graceful shutdown handler
    const gracefulShutdown = async (signal) => {
      console.log(`🛑 [Server] ${signal} signal received. Starting graceful shutdown...`);

      if (server) {
        server.close(async () => {
          console.log('🔒 [Server] Closed remaining HTTP connections.');
          try {
            await mongoose.connection.close(false);
            console.log('📦 [Database] MongoDB connection closed.');
            process.exit(0);
          } catch (dbErr) {
            console.error('[Database] Error closing MongoDB connection:', dbErr);
            process.exit(1);
          }
        });
      } else {
        process.exit(0);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    console.error(`💥 [Server] Failed to initialize server: ${error.message}`);
    process.exit(1);
  }
};

// Handle unhandled Promise rejections
process.on('unhandledRejection', (err) => {
  console.error('💥 [Server] UNHANDLED REJECTION! Shutting down...', err);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

startServer();
