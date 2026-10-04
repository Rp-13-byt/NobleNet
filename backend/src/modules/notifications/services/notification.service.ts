import { Notification, NotificationType } from '../models/Notification';
import { AppError } from '../../../core/errors/AppError';

export class NotificationService {
  static async create(data: { userId: string; type: NotificationType; title: string; message: string; data?: any }) {
    return Notification.create(data);
  }

  static async getUserNotifications(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    
    const [notifications, total] = await Promise.all([
      Notification.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments({ userId })
    ]);

    return {
      data: notifications,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async getNotificationById(notificationId: string, userId: string) {
    const notification = await Notification.findOne({ _id: notificationId, userId });
    if (!notification) throw new AppError('Notification not found', 404, 'NOT_FOUND');
    return notification;
  }

  static async markAsRead(notificationId: string, userId: string) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { read: true },
      { new: true }
    );
    if (!notification) throw new AppError('Notification not found', 404, 'NOT_FOUND');
    return notification;
  }

  static async markAllAsRead(userId: string) {
    await Notification.updateMany({ userId, read: false }, { read: true });
    return { success: true };
  }

  static async deleteNotification(notificationId: string, userId: string) {
    const result = await Notification.findOneAndDelete({ _id: notificationId, userId });
    if (!result) throw new AppError('Notification not found', 404, 'NOT_FOUND');
    return { success: true };
  }
}
