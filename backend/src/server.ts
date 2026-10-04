import http from 'http';
import app from './app';
import { env } from './config/env';
import { connectDB, disconnectDB } from './database/mongo';
import { logger } from './core/utils/logger';
import { migrateLegacyDonationStatuses } from './modules/donations/models/Donation';
import { SocketService } from './core/socket/socket.service';

const startServer = async () => {
  await connectDB();
  await migrateLegacyDonationStatuses();

  const httpServer = http.createServer(app);
  SocketService.init(httpServer);

  const server = httpServer.listen(env.PORT, () => {
    logger.info(`🚀 Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
  });

  const gracefulShutdown = async () => {
    logger.info('🛑 Shutting down gracefully...');
    server.close(async () => {
      logger.info('HTTP server closed.');
      await disconnectDB();
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
};

startServer();
