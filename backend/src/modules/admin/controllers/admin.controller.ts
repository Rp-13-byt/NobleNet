import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../services/admin.service';
import { AuditService } from '../../audit/services/audit.service';

export class AdminController {
  static async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await AdminService.getDashboardStats();
      res.json({ success: true, data: stats });
    } catch (e) {
      next(e);
    }
  }

  static async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
      const { role, status } = req.query as { role?: string; status?: string };
      const result = await AdminService.getUsers(page, limit, role, status);
      res.json({ success: true, ...result });
    } catch (e) {
      next(e);
    }
  }

  static async updateUserStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { status } = req.body;
      const user = await AdminService.updateUserStatus(req.params.id as string, status, req.user!.id);
      res.json({ success: true, message: 'User status updated', data: user });
    } catch (e) {
      next(e);
    }
  }

  static async getPendingNgos(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
      const result = await AdminService.getPendingNgos(page, limit);
      res.json({ success: true, ...result });
    } catch (e) {
      next(e);
    }
  }

  static async reviewNgo(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, verificationNotes } = req.body;
      const ngo = await AdminService.reviewNgo(req.params.id as string, status, verificationNotes, req.user!.id);
      res.json({ success: true, message: `NGO status updated to ${status}`, data: ngo });
    } catch (e) {
      next(e);
    }
  }

  static async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const { action, resource } = req.query as { action?: string; resource?: string };
      const result = await AuditService.getLogs(page, limit, { action, resource });
      res.json({ success: true, ...result });
    } catch (e) {
      next(e);
    }
  }

  static async getDonations(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
      const status = req.query.status as string;
      const result = await AdminService.getAllDonations(page, limit, status);
      res.json({ success: true, ...result });
    } catch (e) {
      next(e);
    }
  }

  static async getCampaigns(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
      const status = req.query.status as string;
      const search = req.query.search as string;
      const result = await AdminService.getAllCampaigns(page, limit, status, search);
      res.json({ success: true, ...result });
    } catch (e) {
      next(e);
    }
  }

  static async moderateCampaign(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, reason } = req.body;
      const campaign = await AdminService.moderateCampaign(req.params.id as string, status, reason, req.user!.id);
      res.json({ success: true, message: `Campaign status updated to ${status}`, data: campaign });
    } catch (e) {
      next(e);
    }
  }

  static async getNgos(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
      const status = req.query.status as string;
      const search = req.query.search as string;
      const result = await AdminService.getAllNgos(page, limit, status, search);
      res.json({ success: true, ...result });
    } catch (e) {
      next(e);
    }
  }
}
