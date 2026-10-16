import { Request, Response, NextFunction } from 'express';
import { VolunteerService } from '../services/volunteer.service';

export class VolunteerController {
  static async createOpportunity(req: Request, res: Response, next: NextFunction) {
    try {
      const opp = await VolunteerService.createOpportunity(req.user!.id, req.body);
      res.status(201).json({ success: true, message: 'Opportunity created', data: opp });
    } catch (e) { next(e); }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
      const result = await VolunteerService.getOpportunities(req.query as Record<string, string>, page, limit);
      res.json({ success: true, ...result });
    } catch (e) { next(e); }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const opp = await VolunteerService.getOpportunityById(req.params.id as string);
      res.json({ success: true, data: opp });
    } catch (e) { next(e); }
  }

  static async apply(req: Request, res: Response, next: NextFunction) {
    try {
      const app = await VolunteerService.apply(req.user!.id, req.params.id as string, req.body);
      res.status(201).json({ success: true, message: 'Application submitted', data: app });
    } catch (e) { next(e); }
  }

  static async myApplications(req: Request, res: Response, next: NextFunction) {
    try {
      const apps = await VolunteerService.getUserApplications(req.user!.id);
      res.json({ success: true, data: apps });
    } catch (e) { next(e); }
  }

  static async withdraw(req: Request, res: Response, next: NextFunction) {
    try {
      const app = await VolunteerService.withdrawApplication(req.params.id as string, req.user!.id);
      res.json({ success: true, message: 'Application withdrawn', data: app });
    } catch (e) { next(e); }
  }

  static async ngoApplications(req: Request, res: Response, next: NextFunction) {
    try {
      const apps = await VolunteerService.getApplicationsForNgo(req.user!.id);
      res.json({ success: true, data: apps });
    } catch (e) { next(e); }
  }

  static async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const app = await VolunteerService.approveApplication(req.params.id as string, req.user!.id);
      res.json({ success: true, message: 'Application approved', data: app });
    } catch (e) { next(e); }
  }

  static async reject(req: Request, res: Response, next: NextFunction) {
    try {
      const app = await VolunteerService.rejectApplication(req.params.id as string, req.user!.id);
      res.json({ success: true, message: 'Application rejected', data: app });
    } catch (e) { next(e); }
  }

  static async getApplicationById(req: Request, res: Response, next: NextFunction) {
    try {
      const app = await VolunteerService.getApplicationById(
        req.params.id as string,
        req.user!.id,
        req.user!.role
      );
      res.json({ success: true, data: app });
    } catch (e) { next(e); }
  }
}
