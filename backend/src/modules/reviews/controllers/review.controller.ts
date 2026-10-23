import { Request, Response, NextFunction } from 'express';
import { ReviewService } from '../services/review.service';

export class ReviewController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const review = await ReviewService.createReview(req.user!.id, req.params.ngoId as string, req.body);
      res.status(201).json({ success: true, message: 'Review submitted', data: review });
    } catch (e) { next(e); }
  }

  static async getByNgo(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
      const result = await ReviewService.getReviewsByNgo(req.params.ngoId as string, page, limit);
      res.json({ success: true, ...result });
    } catch (e) { next(e); }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const review = await ReviewService.updateReview(req.params.id as string, req.user!.id, req.body);
      res.json({ success: true, data: review });
    } catch (e) { next(e); }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await ReviewService.deleteReview(req.params.id as string, req.user!.id);
      res.json({ success: true, message: 'Review deleted' });
    } catch (e) { next(e); }
  }
}
