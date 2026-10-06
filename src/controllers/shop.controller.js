import { Shop } from '../models/Shop.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getPublicShop = asyncHandler(async (req, res) => {
  const { identifier } = req.params;

  const shop = await Shop.findOne({
    $or: [{ slug: identifier.toLowerCase() }, { publicIdentifier: identifier }],
  }).select('name slug publicIdentifier contactNumber address isOpen pricing');

  if (!shop) {
    throw new ApiError(404, 'Shop not found');
  }

  return res.status(200).json(
    new ApiResponse(200, shop, 'Shop details retrieved successfully')
  );
});

export const getMyShop = asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({
    _id: req.shopkeeper.shopId,
    ownerId: req.shopkeeper.id,
  });

  if (!shop) {
    throw new ApiError(404, 'Shop profile not found');
  }

  return res.status(200).json(
    new ApiResponse(200, shop, 'Shop profile retrieved successfully')
  );
});

export const updateMyShop = asyncHandler(async (req, res) => {
  const { name, contactNumber, address } = req.body;

  const shop = await Shop.findOne({
    _id: req.shopkeeper.shopId,
    ownerId: req.shopkeeper.id,
  });

  if (!shop) {
    throw new ApiError(404, 'Shop profile not found');
  }

  if (name !== undefined) shop.name = name;
  if (contactNumber !== undefined) shop.contactNumber = contactNumber;
  if (address) {
    if (address.street !== undefined) shop.address.street = address.street;
    if (address.city !== undefined) shop.address.city = address.city;
    if (address.landmark !== undefined) shop.address.landmark = address.landmark;
  }

  await shop.save();

  return res.status(200).json(
    new ApiResponse(200, shop, 'Shop profile updated successfully')
  );
});

export const updateShopPricing = asyncHandler(async (req, res) => {
  const { A4, A3 } = req.body;

  const shop = await Shop.findOne({
    _id: req.shopkeeper.shopId,
    ownerId: req.shopkeeper.id,
  });

  if (!shop) {
    throw new ApiError(404, 'Shop profile not found');
  }

  if (A4) {
    if (A4.BLACK_WHITE) {
      if (typeof A4.BLACK_WHITE.single === 'number') shop.pricing.A4.BLACK_WHITE.single = A4.BLACK_WHITE.single;
      if (typeof A4.BLACK_WHITE.double === 'number') shop.pricing.A4.BLACK_WHITE.double = A4.BLACK_WHITE.double;
    }
    if (A4.COLOR) {
      if (typeof A4.COLOR.single === 'number') shop.pricing.A4.COLOR.single = A4.COLOR.single;
      if (typeof A4.COLOR.double === 'number') shop.pricing.A4.COLOR.double = A4.COLOR.double;
    }
  }

  if (A3) {
    if (A3.BLACK_WHITE) {
      if (typeof A3.BLACK_WHITE.single === 'number') shop.pricing.A3.BLACK_WHITE.single = A3.BLACK_WHITE.single;
      if (typeof A3.BLACK_WHITE.double === 'number') shop.pricing.A3.BLACK_WHITE.double = A3.BLACK_WHITE.double;
    }
    if (A3.COLOR) {
      if (typeof A3.COLOR.single === 'number') shop.pricing.A3.COLOR.single = A3.COLOR.single;
      if (typeof A3.COLOR.double === 'number') shop.pricing.A3.COLOR.double = A3.COLOR.double;
    }
  }

  shop.markModified('pricing');
  await shop.save();

  return res.status(200).json(
    new ApiResponse(200, shop.pricing, 'Shop pricing configuration updated successfully')
  );
});

export const toggleShopStatus = asyncHandler(async (req, res) => {
  const { isOpen } = req.body;

  const shop = await Shop.findOne({
    _id: req.shopkeeper.shopId,
    ownerId: req.shopkeeper.id,
  });

  if (!shop) {
    throw new ApiError(404, 'Shop profile not found');
  }

  shop.isOpen = isOpen;
  await shop.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      { isOpen: shop.isOpen },
      `Shop is now ${shop.isOpen ? 'OPEN for accepting orders' : 'CLOSED and not accepting orders'}`
    )
  );
});
