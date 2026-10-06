import { Router } from 'express';
import {
  getPublicShop,
  getMyShop,
  updateMyShop,
  updateShopPricing,
  toggleShopStatus,
} from '../controllers/shop.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authenticateShopkeeper } from '../middlewares/auth.middleware.js';
import {
  updateShopProfileSchema,
  updateShopPricingSchema,
  toggleShopStatusSchema,
} from '../validations/shop.validation.js';

const router = Router();

// Public endpoint for customers scanning shop QR code
router.get('/public/:identifier', getPublicShop);

// Protected shopkeeper endpoints
router.get('/my-shop', authenticateShopkeeper, getMyShop);
router.put('/my-shop', authenticateShopkeeper, validate(updateShopProfileSchema), updateMyShop);
router.put('/my-shop/pricing', authenticateShopkeeper, validate(updateShopPricingSchema), updateShopPricing);
router.patch('/my-shop/status', authenticateShopkeeper, validate(toggleShopStatusSchema), toggleShopStatus);

export default router;
