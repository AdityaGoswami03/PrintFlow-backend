import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { Order } from '../models/Order.js';
import { Shop } from '../models/Shop.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getStorageService } from '../services/storage/storage.factory.js';
import { calculatePagesToPrint } from '../utils/pageCalculator.js';
import { calculateOrderPrice } from '../utils/pricingEngine.js';
import { validateAndExtractPdfPages } from '../utils/pdfValidator.js';
import { cleanupExpiredDocuments } from '../services/documentCleanup.service.js';
import { ALLOWED_STATUS_TRANSITIONS, ORDER_STATUS } from '../constants/orderStatus.js';
import { env } from '../config/env.js';

const generateOrderNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `PF-${dateStr}-${randomSuffix}`;
};

export const createCustomerOrder = asyncHandler(async (req, res) => {
  if (!req.file || !req.file.buffer) {
    throw new ApiError(400, 'PDF document file is required in multipart form data');
  }

  const {
    shopIdentifier,
    copies = 1,
    paperSize = 'A4',
    printType = 'BLACK_WHITE',
    printSides = 'SINGLE',
    pageSelectionType = 'ALL',
    pageSelectionCustomValue = null,
    customerPhone = '',
    customerNotes = '',
  } = req.body;

  // 1. Verify Shop exists and is open for business
  const shop = await Shop.findOne({
    $or: [{ slug: shopIdentifier.toLowerCase() }, { publicIdentifier: shopIdentifier }],
  });

  if (!shop) {
    throw new ApiError(404, 'Shop not found');
  }

  if (!shop.isOpen) {
    throw new ApiError(400, 'This shop is currently closed and not accepting new printing orders');
  }

  // 2. Deep binary validation: inspect magic bytes and parse structure with pdf-lib
  const totalDocPages = await validateAndExtractPdfPages(req.file.buffer);

  // 3. Calculate page selection and billable pages
  const { pagesToPrintCount, pageNumbers } = calculatePagesToPrint(
    pageSelectionType,
    pageSelectionCustomValue,
    totalDocPages
  );

  // 4. Server-side price calculation
  const pricingResult = calculateOrderPrice(shop.pricing, {
    paperSize,
    printType,
    printSides,
    pagesToPrintCount,
    copies,
  });

  // 5. Store file in object storage abstraction
  const storageService = getStorageService();
  const storedFile = await storageService.uploadFile(req.file, `shops/${shop._id}/orders`);

  // 6. Generate order identifiers & tokens
  const orderNumber = generateOrderNumber();
  const customerAccessToken = crypto.randomBytes(24).toString('hex');
  const retentionExpiresAt = new Date(Date.now() + env.DOC_RETENTION_HOURS * 3600 * 1000);

  // 7. Persist Order in MongoDB (No PDF binary data stored)
  const order = new Order({
    orderNumber,
    customerAccessToken,
    shopId: shop._id,
    customerPhone,
    customerNotes,
    document: {
      storageKey: storedFile.key,
      originalName: storedFile.originalName,
      mimeType: storedFile.mimeType,
      fileSizeBytes: storedFile.size,
      totalPages: totalDocPages,
      uploadedAt: new Date(),
      expiresAt: retentionExpiresAt,
      uploadStatus: 'UPLOADED',
      isDeleted: false,
    },
    printConfig: {
      copies,
      paperSize,
      printType,
      printSides,
      pageSelection: {
        type: pageSelectionType,
        customValue: pageSelectionCustomValue,
      },
      pagesToPrintCount,
      pageNumbers,
    },
    pricing: {
      unitRates: pricingResult.unitRates,
      costPerCopy: pricingResult.costPerCopy,
      totalAmount: pricingResult.totalAmount,
      currency: 'INR',
    },
    status: ORDER_STATUS.SUBMITTED,
    statusHistory: [
      {
        status: ORDER_STATUS.SUBMITTED,
        changedAt: new Date(),
        changedBy: 'CUSTOMER',
        note: 'Order submitted by customer',
      },
    ],
  });

  await order.save();

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        orderNumber: order.orderNumber,
        customerAccessToken: order.customerAccessToken,
        trackingPath: `/api/v1/orders/track/${order.orderNumber}?token=${order.customerAccessToken}`,
        status: order.status,
        document: {
          originalName: order.document.originalName,
          totalPages: order.document.totalPages,
          fileSizeBytes: order.document.fileSizeBytes,
          expiresAt: order.document.expiresAt,
        },
        printConfig: order.printConfig,
        pricing: order.pricing,
        createdAt: order.createdAt,
      },
      'Print order submitted successfully'
    )
  );
});

export const getCustomerOrderTracking = asyncHandler(async (req, res) => {
  const { orderNumber } = req.params;
  const token = req.query.token || req.headers['x-order-token'];

  if (!token) {
    throw new ApiError(401, 'Order access token is required to track this order');
  }

  const order = await Order.findOne({
    orderNumber,
    customerAccessToken: token,
  });

  if (!order) {
    throw new ApiError(404, 'Order not found or invalid access token');
  }

  return res.status(200).json(
    new ApiResponse(200, order.toCustomerView(), 'Order tracking details retrieved successfully')
  );
});

export const getShopOrders = asyncHandler(async (req, res) => {
  const { status, search, page = 1, limit = 20 } = req.query;

  const filter = {
    shopId: req.shopkeeper.shopId,
  };

  if (status && Object.values(ORDER_STATUS).includes(status)) {
    filter.status = status;
  }

  if (search) {
    filter.$or = [
      { orderNumber: { $regex: search, $options: 'i' } },
      { customerPhone: { $regex: search, $options: 'i' } },
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .select('-customerAccessToken'),
    Order.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        orders,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
      'Shop orders retrieved successfully'
    )
  );
});

export const getShopOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await Order.findOne({
    _id: id,
    shopId: req.shopkeeper.shopId,
  }).select('-customerAccessToken');

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  return res.status(200).json(
    new ApiResponse(200, order, 'Order details retrieved successfully')
  );
});

/**
 * Generates a temporary signed document download URL for the shopkeeper
 */
export const getShopOrderDocumentUrl = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await Order.findOne({
    _id: id,
    shopId: req.shopkeeper.shopId,
  });

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  if (order.document.isDeleted || order.document.uploadStatus === 'DELETED') {
    throw new ApiError(410, 'This document has expired and was deleted according to the retention policy');
  }

  const storageService = getStorageService();
  const signedUrl = await storageService.getSignedDownloadUrl(
    order.document.storageKey,
    env.SIGNED_URL_EXPIRES_SECONDS
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        downloadUrl: signedUrl,
        expiresInSeconds: env.SIGNED_URL_EXPIRES_SECONDS,
        originalName: order.document.originalName,
        fileSizeBytes: order.document.fileSizeBytes,
      },
      'Temporary signed document access URL generated successfully'
    )
  );
});

/**
 * Generates a temporary signed document download URL for the customer
 */
export const getCustomerOrderDocumentUrl = asyncHandler(async (req, res) => {
  const { orderNumber } = req.params;
  const token = req.query.token || req.headers['x-order-token'];

  if (!token) {
    throw new ApiError(401, 'Order access token is required');
  }

  const order = await Order.findOne({
    orderNumber,
    customerAccessToken: token,
  });

  if (!order) {
    throw new ApiError(404, 'Order not found or invalid access token');
  }

  if (order.document.isDeleted || order.document.uploadStatus === 'DELETED') {
    throw new ApiError(410, 'This document has expired and was deleted according to the retention policy');
  }

  const storageService = getStorageService();
  const signedUrl = await storageService.getSignedDownloadUrl(
    order.document.storageKey,
    env.SIGNED_URL_EXPIRES_SECONDS
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        downloadUrl: signedUrl,
        expiresInSeconds: env.SIGNED_URL_EXPIRES_SECONDS,
        originalName: order.document.originalName,
      },
      'Temporary signed document access URL generated successfully'
    )
  );
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status: newStatus, note = '' } = req.body;

  const order = await Order.findOne({
    _id: id,
    shopId: req.shopkeeper.shopId,
  });

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  const allowedTransitions = ALLOWED_STATUS_TRANSITIONS[order.status] || [];
  if (!allowedTransitions.includes(newStatus)) {
    throw new ApiError(
      400,
      `Invalid order state transition: Cannot change status from '${order.status}' to '${newStatus}'. Allowed transitions: [${allowedTransitions.join(', ')}]`
    );
  }

  order.status = newStatus;

  // If reaching a terminal status, refresh expiration timer from completion time
  if (
    [ORDER_STATUS.COMPLETED, ORDER_STATUS.REJECTED, ORDER_STATUS.CANCELLED].includes(newStatus) &&
    !order.document.isDeleted
  ) {
    order.document.expiresAt = new Date(Date.now() + env.DOC_RETENTION_HOURS * 3600 * 1000);
  }

  order.statusHistory.push({
    status: newStatus,
    changedAt: new Date(),
    changedBy: 'SHOPKEEPER',
    note: note || `Status updated to ${newStatus} by shopkeeper`,
  });

  await order.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        statusHistory: order.statusHistory,
        updatedAt: order.updatedAt,
      },
      `Order status successfully transitioned to ${newStatus}`
    )
  );
});

export const calculatePricePreview = asyncHandler(async (req, res) => {
  const {
    shopIdentifier,
    totalDocPages,
    copies = 1,
    paperSize = 'A4',
    printType = 'BLACK_WHITE',
    printSides = 'SINGLE',
    pageSelectionType = 'ALL',
    pageSelectionCustomValue = null,
  } = req.body;

  const shop = await Shop.findOne({
    $or: [{ slug: shopIdentifier.toLowerCase() }, { publicIdentifier: shopIdentifier }],
  });

  if (!shop) {
    throw new ApiError(404, 'Shop not found');
  }

  const { pagesToPrintCount, pageNumbers } = calculatePagesToPrint(
    pageSelectionType,
    pageSelectionCustomValue,
    totalDocPages
  );

  const pricing = calculateOrderPrice(shop.pricing, {
    paperSize,
    printType,
    printSides,
    pagesToPrintCount,
    copies,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        pagesToPrintCount,
        pageNumbers,
        copies,
        pricing,
      },
      'Price calculated successfully'
    )
  );
});

/**
 * Stream local storage file using temporary signed token (Dev mode only)
 */
export const streamLocalDocument = asyncHandler(async (req, res) => {
  const { token } = req.query;

  if (!token) {
    throw new ApiError(401, 'Access token is required');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, env.JWT_SECRET);
  } catch (err) {
    throw new ApiError(401, 'Invalid or expired document access token');
  }

  if (decoded.purpose !== 'DOCUMENT_STREAM' || !decoded.key) {
    throw new ApiError(403, 'Invalid token purpose');
  }

  const baseDir = path.resolve(process.cwd(), env.UPLOAD_DIR);
  const fullPath = path.join(baseDir, decoded.key);

  // Prevent path traversal
  if (!fullPath.startsWith(baseDir)) {
    throw new ApiError(403, 'Access denied');
  }

  if (!fs.existsSync(fullPath)) {
    throw new ApiError(404, 'Document file not found on server');
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline');
  const stream = fs.createReadStream(fullPath);
  stream.pipe(res);
});

/**
 * Trigger manual or cron-based document retention cleanup
 */
export const triggerDocumentRetentionCleanup = asyncHandler(async (req, res) => {
  const result = await cleanupExpiredDocuments();
  return res.status(200).json(
    new ApiResponse(200, result, 'Document retention cleanup executed successfully')
  );
});
