import { app } from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    const server = app.listen(env.PORT, () => {
      console.log(`🚀 [Server] PrintFlow backend running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    });

    // Graceful shutdown
    const shutdown = () => {
      console.log('🛑 [Server] Gracefully shutting down...');
      server.close(() => {
        console.log('🔒 [Server] Closed remaining connections.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error(`💥 [Server] Failed to initialize server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
