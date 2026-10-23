import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service';

export class NotificationController {
  static async getMyNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
      const result = await NotificationService.getUserNotifications(req.user!.id, page, limit);
      res.json({ success: true, ...result });
    } catch (e) {
      next(e);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const notification = await NotificationService.getNotificationById(req.params.id as string, req.user!.id);
      res.json({ success: true, data: notification });
    } catch (e) {
      next(e);
    }
  }

  static async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const notification = await NotificationService.markAsRead(req.params.id as string, req.user!.id);
      res.json({ success: true, data: notification });
    } catch (e) {
      next(e);
    }
  }

  static async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await NotificationService.markAllAsRead(req.user!.id);
      res.json(result);
    } catch (e) {
      next(e);
    }
  }

  static async deleteNotification(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await NotificationService.deleteNotification(req.params.id as string, req.user!.id);
      res.json(result);
    } catch (e) {
      next(e);
    }
  }
}
