import mongoose from 'mongoose';
import { DEFAULT_PRICING_CONFIG } from '../constants/printOptions.js';

const rateSchema = new mongoose.Schema(
  {
    single: { type: Number, required: true, min: 0 },
    double: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const sizePricingSchema = new mongoose.Schema(
  {
    BLACK_WHITE: { type: rateSchema, required: true },
    COLOR: { type: rateSchema, required: true },
  },
  { _id: false }
);

const shopSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Shop name is required'],
      trim: true,
      maxlength: [100, 'Shop name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Shop slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    publicIdentifier: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    contactNumber: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      street: { type: String, trim: true, default: '' },
      city: { type: String, trim: true, default: '' },
      landmark: { type: String, trim: true, default: '' },
    },
    isOpen: {
      type: Boolean,
      default: true,
    },
    pricing: {
      A4: {
        type: sizePricingSchema,
        default: () => DEFAULT_PRICING_CONFIG.A4,
      },
      A3: {
        type: sizePricingSchema,
        default: () => DEFAULT_PRICING_CONFIG.A3,
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Shop = mongoose.model('Shop', shopSchema);
