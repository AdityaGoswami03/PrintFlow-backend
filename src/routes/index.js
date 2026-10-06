import { Router } from 'express';
import healthRouter from './health.routes.js';

const apiRouter = Router();

// Base health route
apiRouter.use('/health', healthRouter);

// Future modular route mounts for V1:
// apiRouter.use('/auth', authRouter);
// apiRouter.use('/shops', shopRouter);
// apiRouter.use('/orders', orderRouter);

export default apiRouter;
