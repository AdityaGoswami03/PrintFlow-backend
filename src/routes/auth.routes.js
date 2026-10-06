import { Router } from 'express';
import {
  registerShopkeeper,
  loginShopkeeper,
  getCurrentShopkeeper,
  logoutShopkeeper,
} from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authenticateShopkeeper } from '../middlewares/auth.middleware.js';
import {
  registerShopkeeperSchema,
  loginShopkeeperSchema,
} from '../validations/auth.validation.js';

const router = Router();

// Public auth endpoints
router.post('/register', validate(registerShopkeeperSchema), registerShopkeeper);
router.post('/login', validate(loginShopkeeperSchema), loginShopkeeper);

// Protected shopkeeper auth endpoints
router.get('/me', authenticateShopkeeper, getCurrentShopkeeper);
router.post('/logout', authenticateShopkeeper, logoutShopkeeper);

export default router;
