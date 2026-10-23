import { Request, Response, NextFunction } from 'express';
import { NGODashboardService } from '../services/ngo-dashboard.service';
import { AdminDashboardService } from '../services/admin-dashboard.service';
import { UserDashboardService } from '../services/user-dashboard.service';

export class DashboardController {
  static async getNgoDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await NGODashboardService.getDashboard((req as any).user.id);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getAdminDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await AdminDashboardService.getDashboard();
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getUserDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await UserDashboardService.getDashboard((req as any).user.id);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}
