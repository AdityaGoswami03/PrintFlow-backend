import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const authenticateShopkeeper = asyncHandler(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    throw new ApiError(401, 'Authentication token required');
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.shopkeeper = decoded; // Contains { id, shopId, role }
    next();
  } catch (error) {
    throw new ApiError(401, 'Invalid or expired authentication token');
  }
});
