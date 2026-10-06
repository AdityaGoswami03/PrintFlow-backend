import { Router } from 'express';
import { ApiResponse } from '../utils/ApiResponse.js';

const router = Router();

router.get('/', (req, res) => {
  return res.status(200).json(
    new ApiResponse(200, {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      service: 'PrintFlow Backend API',
      status: 'healthy',
    }, 'PrintFlow API is running smoothly')
  );
});

export default router;
