import { Request, Response, NextFunction } from 'express';
import { CampaignService } from '../services/campaign.service';

export class CampaignController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const campaign = await CampaignService.createCampaign((req as any).user.id, req.body);
      res.status(201).json({ success: true, data: campaign });
    } catch (error) {
      next(error);
    }
  }

  static async get(req: Request, res: Response, next: NextFunction) {
    try {
      const campaign = await CampaignService.getCampaign(req.params.id as string);
      res.status(200).json({ success: true, data: campaign });
    } catch (error) {
      next(error);
    }
  }

  static async listActive(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        category: req.query.category,
        search: req.query.search
      };
      const campaigns = await CampaignService.listActiveCampaigns(filters);
      res.status(200).json({ success: true, data: campaigns });
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const campaign = await CampaignService.updateStatus(
        req.params.id as string,
        (req as any).user.id,
        req.body.status,
        (req as any).user.role
      );
      res.status(200).json({ success: true, data: campaign });
    } catch (error) {
      next(error);
    }
  }

  static async getSupporters(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
      const supporters = await CampaignService.getCampaignSupporters(req.params.id as string, limit);
      res.status(200).json({ success: true, data: supporters });
    } catch (error) {
      next(error);
    }
  }

  static async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await CampaignService.getPublicStats();
      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }
}
