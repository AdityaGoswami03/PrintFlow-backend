import { Router } from 'express';
import healthRouter from './health.routes.js';
import authRouter from './auth.routes.js';
import shopRouter from './shop.routes.js';
import orderRouter from './order.routes.js';

const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/shops', shopRouter);
apiRouter.use('/orders', orderRouter);

export default apiRouter;
