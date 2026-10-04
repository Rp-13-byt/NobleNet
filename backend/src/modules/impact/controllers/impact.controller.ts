import { Request, Response, NextFunction } from 'express';
import { ImpactService } from '../services/impact.service';

export class ImpactController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await ImpactService.create(req.user!.id, req.body);
      res.status(201).json({ success: true, message: 'Impact report created', data: report });
    } catch (e) { next(e); }
  }

  static async getByNgo(req: Request, res: Response, next: NextFunction) {
    try {
      const reports = await ImpactService.getByNgo(req.params.ngoId as string);
      res.json({ success: true, data: reports });
    } catch (e) { next(e); }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await ImpactService.update(req.params.id as string, req.user!.id, req.body);
      res.json({ success: true, data: report });
    } catch (e) { next(e); }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await ImpactService.delete(req.params.id as string, req.user!.id);
      res.json({ success: true, message: 'Report deleted' });
    } catch (e) { next(e); }
  }
}
