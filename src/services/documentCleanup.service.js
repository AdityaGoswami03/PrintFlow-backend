import { Order } from '../models/Order.js';
import { getStorageService } from './storage/storage.factory.js';
import { ORDER_STATUS } from '../constants/orderStatus.js';

/**
 * Service function to delete expired documents from object storage
 * and update order metadata.
 *
 * @returns {Promise<{ cleanedCount: number, errors: Array<{ orderId: string, error: string }> }>}
 */
export const cleanupExpiredDocuments = async () => {
  const now = new Date();
  const storageService = getStorageService();

  // Find all terminal state orders where document retention has expired and file is not yet marked deleted
  const expiredOrders = await Order.find({
    status: {
      $in: [ORDER_STATUS.COMPLETED, ORDER_STATUS.REJECTED, ORDER_STATUS.CANCELLED],
    },
    'document.isDeleted': false,
    'document.expiresAt': { $ne: null, $lte: now },
  });

  let cleanedCount = 0;
  const errors = [];

  for (const order of expiredOrders) {
    try {
      if (order.document?.storageKey) {
        await storageService.deleteFile(order.document.storageKey);
      }

      order.document.isDeleted = true;
      order.document.uploadStatus = 'DELETED';
      order.statusHistory.push({
        status: order.status,
        changedAt: new Date(),
        changedBy: 'SYSTEM',
        note: 'Document permanently deleted from object storage according to retention policy',
      });

      await order.save();
      cleanedCount++;
    } catch (err) {
      console.error(`[CleanupService] Error deleting document for order ${order._id}:`, err.message);
      errors.push({ orderId: order._id.toString(), error: err.message });
    }
  }

  console.log(`[CleanupService] Completed document cleanup: ${cleanedCount} documents deleted, ${errors.length} errors.`);

  return {
    cleanedCount,
    errors,
  };
};
