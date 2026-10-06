import { Router } from 'express';
import {
  createCustomerOrder,
  getCustomerOrderTracking,
  getCustomerOrderDocumentUrl,
  getShopOrders,
  getShopOrderById,
  getShopOrderDocumentUrl,
  updateOrderStatus,
  calculatePricePreview,
  streamLocalDocument,
  triggerDocumentRetentionCleanup,
} from '../controllers/order.controller.js';
import { uploadPdf } from '../middlewares/upload.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authenticateShopkeeper } from '../middlewares/auth.middleware.js';
import {
  createOrderSchema,
  updateOrderStatusSchema,
  calculatePricePreviewSchema,
} from '../validations/order.validation.js';

const router = Router();

// ==========================================
// Public Customer Endpoints (No Auth Needed)
// ==========================================

// Submit a new print order with PDF file
router.post(
  '/',
  uploadPdf,
  validate(createOrderSchema),
  createCustomerOrder
);

// Preview order price estimation before submitting
router.post(
  '/calculate-price',
  validate(calculatePricePreviewSchema),
  calculatePricePreview
);

// Stream document for local development storage with short-lived token
router.get(
  '/stream-document',
  streamLocalDocument
);

// Track order status using orderNumber and customerAccessToken
router.get(
  '/track/:orderNumber',
  getCustomerOrderTracking
);

// Get temporary signed download URL for customer's own document
router.get(
  '/track/:orderNumber/document',
  getCustomerOrderDocumentUrl
);

// ==========================================
// Protected Shopkeeper Endpoints
// ==========================================

// View incoming orders queue with filters & pagination
router.get(
  '/',
  authenticateShopkeeper,
  getShopOrders
);

// Manual or scheduled trigger for document retention cleanup
router.post(
  '/cleanup-documents',
  authenticateShopkeeper,
  triggerDocumentRetentionCleanup
);

// View specific order details
router.get(
  '/:id',
  authenticateShopkeeper,
  getShopOrderById
);

// Get temporary signed download URL for shopkeeper to print/view PDF
router.get(
  '/:id/document',
  authenticateShopkeeper,
  getShopOrderDocumentUrl
);

// Transition order status (SUBMITTED -> ACCEPTED -> PRINTING -> COMPLETED / REJECTED / CANCELLED)
router.patch(
  '/:id/status',
  authenticateShopkeeper,
  validate(updateOrderStatusSchema),
  updateOrderStatus
);

export default router;
