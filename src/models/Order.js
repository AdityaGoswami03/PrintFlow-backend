import mongoose from 'mongoose';
import { ORDER_STATUS } from '../constants/orderStatus.js';
import { PAPER_SIZES, PRINT_TYPES, PRINT_SIDES, PAGE_SELECTION_TYPES } from '../constants/printOptions.js';

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      required: true,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
    changedBy: {
      type: String,
      enum: ['CUSTOMER', 'SHOPKEEPER', 'SYSTEM'],
      default: 'CUSTOMER',
    },
    note: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const documentMetadataSchema = new mongoose.Schema(
  {
    storageKey: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, default: 'application/pdf' },
    fileSizeBytes: { type: Number, required: true },
    totalPages: { type: Number, required: true, min: 1 },
    uploadedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: null },
    uploadStatus: {
      type: String,
      enum: ['PENDING', 'UPLOADED', 'DELETED'],
      default: 'UPLOADED',
    },
    isDeleted: { type: Boolean, default: false },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    customerAccessToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
      index: true,
    },
    customerPhone: {
      type: String,
      trim: true,
      default: '',
    },
    customerNotes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    document: {
      type: documentMetadataSchema,
      required: true,
    },
    printConfig: {
      copies: { type: Number, required: true, min: 1, default: 1 },
      paperSize: {
        type: String,
        enum: Object.values(PAPER_SIZES),
        default: PAPER_SIZES.A4,
      },
      printType: {
        type: String,
        enum: Object.values(PRINT_TYPES),
        default: PRINT_TYPES.BLACK_WHITE,
      },
      printSides: {
        type: String,
        enum: Object.values(PRINT_SIDES),
        default: PRINT_SIDES.SINGLE,
      },
      pageSelection: {
        type: {
          type: String,
          enum: Object.values(PAGE_SELECTION_TYPES),
          default: PAGE_SELECTION_TYPES.ALL,
        },
        customValue: { type: String, default: null },
      },
      pagesToPrintCount: { type: Number, required: true, min: 1 },
      pageNumbers: [{ type: Number }],
    },
    pricing: {
      unitRates: {
        single: { type: Number, required: true },
        double: { type: Number, required: true },
      },
      costPerCopy: { type: Number, required: true },
      totalAmount: { type: Number, required: true },
      currency: { type: String, default: 'INR' },
    },
    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.SUBMITTED,
      index: true,
    },
    statusHistory: [statusHistorySchema],
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.customerAccessToken;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Method to format public customer view (filters out private internal metadata and storage keys)
orderSchema.methods.toCustomerView = function () {
  return {
    orderNumber: this.orderNumber,
    status: this.status,
    createdAt: this.createdAt,
    document: {
      originalName: this.document.originalName,
      fileSizeBytes: this.document.fileSizeBytes,
      totalPages: this.document.totalPages,
      uploadStatus: this.document.uploadStatus,
      isDeleted: this.document.isDeleted,
      expiresAt: this.document.expiresAt,
    },
    printConfig: this.printConfig,
    pricing: {
      costPerCopy: this.pricing.costPerCopy,
      totalAmount: this.pricing.totalAmount,
      currency: this.pricing.currency,
    },
    statusHistory: this.statusHistory.map((h) => ({
      status: h.status,
      changedAt: h.changedAt,
      note: h.note,
    })),
  };
};

export const Order = mongoose.model('Order', orderSchema);
