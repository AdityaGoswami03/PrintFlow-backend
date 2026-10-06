import crypto from 'crypto';
import { User } from '../models/User.js';
import { Shop } from '../models/Shop.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Helper to generate a clean, URL-safe slug
const generateSlug = (name) => {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
  const randomSuffix = crypto.randomBytes(3).toString('hex');
  return `${base}-${randomSuffix}`;
};

export const registerShopkeeper = asyncHandler(async (req, res) => {
  const { name, email, password, shopName, contactNumber, address } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, 'A shopkeeper with this email already exists');
  }

  // Create User
  const user = new User({
    name,
    email,
    password,
    role: 'SHOPKEEPER',
  });

  // Create associated Shop
  const slug = generateSlug(shopName);
  const shop = new Shop({
    name: shopName,
    slug,
    publicIdentifier: slug,
    ownerId: user._id,
    contactNumber: contactNumber || '',
    address: address || {},
  });

  await shop.save();

  // Link shop to user
  user.shopId = shop._id;
  await user.save();

  const token = user.generateAuthToken();

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        shop: {
          id: shop._id,
          name: shop.name,
          slug: shop.slug,
          publicIdentifier: shop.publicIdentifier,
          isOpen: shop.isOpen,
          pricing: shop.pricing,
        },
        token,
      },
      'Shopkeeper and shop created successfully'
    )
  );
});

export const loginShopkeeper = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password').populate('shopId');
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const token = user.generateAuthToken();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        shop: user.shopId
          ? {
              id: user.shopId._id,
              name: user.shopId.name,
              slug: user.shopId.slug,
              publicIdentifier: user.shopId.publicIdentifier,
              isOpen: user.shopId.isOpen,
              pricing: user.shopId.pricing,
            }
          : null,
        token,
      },
      'Login successful'
    )
  );
});

export const getCurrentShopkeeper = asyncHandler(async (req, res) => {
  const user = await User.findById(req.shopkeeper.id).populate('shopId');
  if (!user) {
    throw new ApiError(404, 'Shopkeeper not found');
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        shop: user.shopId,
      },
      'Current shopkeeper profile retrieved successfully'
    )
  );
});

export const logoutShopkeeper = asyncHandler(async (req, res) => {
  // Since JWT is stateless, logout is handled by the client clearing the stored token.
  return res.status(200).json(
    new ApiResponse(200, null, 'Logged out successfully. Please discard the JWT client-side.')
  );
});
