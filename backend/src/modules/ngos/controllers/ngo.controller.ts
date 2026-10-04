import { Request, Response, NextFunction } from 'express';
import { NgoService } from '../services/ngo.service';

export class NgoController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const ngo = await NgoService.register((req as any).user.id, req.body);
      res.status(201).json({ success: true, data: ngo });
    } catch (error) {
      next(error);
    }
  }

  static async verify(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, verificationNotes } = req.body;
      const ngo = await NgoService.verifyNgo(req.params.id as string, status, verificationNotes);
      res.status(200).json({ success: true, data: ngo });
    } catch (error) {
      next(error);
    }
  }

  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const ngo = await NgoService.getNgoByUserId((req as any).user.id);
      res.status(200).json({ success: true, data: ngo });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const ngo = await NgoService.getNgoById(req.params.id as string);
      res.status(200).json({ success: true, data: ngo });
    } catch (error) {
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
      const search = req.query.search as string;
      const result = await NgoService.listVerifiedNgos(page, limit, search);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async listPending(req: Request, res: Response, next: NextFunction) {
    try {
      const ngos = await NgoService.listPendingNgos();
      res.status(200).json({ success: true, data: ngos });
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const ngo = await NgoService.updateProfile((req as any).user.id, req.body);
      res.status(200).json({ success: true, message: 'Profile updated successfully', data: ngo });
    } catch (error) {
      next(error);
    }
  }

  static async getDonations(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
      const result = await NgoService.getNgoDonations((req as any).user.id, page, limit);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
}
