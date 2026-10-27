import os

BASE_DIR = r"d:\NobleNet-Backend\src\modules"

files = {
    r"volunteering\models\Opportunity.ts": """import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IOpportunity extends Document {
  title: string;
  description: string;
  ngoId: Types.ObjectId;
  requiredSkills: string[];
  location: string;
  date: Date;
  maxVolunteers: number;
  status: 'OPEN' | 'CLOSED' | 'CANCELLED';
  createdAt: Date;
  updatedAt: Date;
}

const opportunitySchema = new Schema<IOpportunity>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    ngoId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    requiredSkills: { type: [String], default: [] },
    location: { type: String, required: true },
    date: { type: Date, required: true },
    maxVolunteers: { type: Number, required: true },
    status: {
      type: String,
      enum: ['OPEN', 'CLOSED', 'CANCELLED'],
      default: 'OPEN',
    },
  },
  { timestamps: true }
);

export const Opportunity = mongoose.model<IOpportunity>('Opportunity', opportunitySchema);
""",
    r"volunteering\models\VolunteerApplication.ts": """import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IVolunteerApplication extends Document {
  userId: Types.ObjectId;
  opportunityId: Types.ObjectId;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
  appliedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const volunteerApplicationSchema = new Schema<IVolunteerApplication>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    opportunityId: { type: Schema.Types.ObjectId, ref: 'Opportunity', required: true },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'],
      default: 'PENDING',
    },
    appliedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

volunteerApplicationSchema.index({ userId: 1, opportunityId: 1 }, { unique: true });

export const VolunteerApplication = mongoose.model<IVolunteerApplication>('VolunteerApplication', volunteerApplicationSchema);
""",
    r"volunteering\validations\opportunity.validation.ts": """import { z } from 'zod';

export const createOpportunitySchema = z.object({
  body: z.object({
    title: z.string().min(3).max(100),
    description: z.string().min(10).max(1000),
    requiredSkills: z.array(z.string()).optional(),
    location: z.string().min(3).max(200),
    date: z.string().datetime(),
    maxVolunteers: z.number().int().positive(),
  }),
});

export const updateOpportunitySchema = z.object({
  body: z.object({
    title: z.string().min(3).max(100).optional(),
    description: z.string().min(10).max(1000).optional(),
    requiredSkills: z.array(z.string()).optional(),
    location: z.string().min(3).max(200).optional(),
    date: z.string().datetime().optional(),
    maxVolunteers: z.number().int().positive().optional(),
    status: z.enum(['OPEN', 'CLOSED', 'CANCELLED']).optional(),
  }),
});
""",
    r"volunteering\validations\application.validation.ts": """import { z } from 'zod';

export const updateApplicationStatusSchema = z.object({
  body: z.object({
    status: z.enum(['ACCEPTED', 'REJECTED']),
  }),
});
""",
    r"volunteering\services\OpportunityService.ts": """import { Opportunity, IOpportunity } from '../models/Opportunity';
import { AppError } from '../../../core/errors/AppError';

export class OpportunityService {
  static async createOpportunity(data: Partial<IOpportunity>): Promise<IOpportunity> {
    const opportunity = new Opportunity(data);
    await opportunity.save();
    return opportunity;
  }

  static async getOpportunities(filters: any): Promise<IOpportunity[]> {
    return Opportunity.find(filters).populate('ngoId', 'name email');
  }

  static async getOpportunityById(id: string): Promise<IOpportunity> {
    const opportunity = await Opportunity.findById(id).populate('ngoId', 'name email');
    if (!opportunity) {
      throw new AppError('Opportunity not found', 404, 'NOT_FOUND');
    }
    return opportunity;
  }

  static async updateOpportunity(id: string, ngoId: string, data: Partial<IOpportunity>): Promise<IOpportunity> {
    const opportunity = await Opportunity.findOne({ _id: id, ngoId });
    if (!opportunity) {
      throw new AppError('Opportunity not found or unauthorized', 404, 'NOT_FOUND');
    }
    Object.assign(opportunity, data);
    await opportunity.save();
    return opportunity;
  }
}
""",
    r"volunteering\services\ApplicationService.ts": """import { VolunteerApplication, IVolunteerApplication } from '../models/VolunteerApplication';
import { Opportunity } from '../models/Opportunity';
import { AppError } from '../../../core/errors/AppError';

export class ApplicationService {
  static async applyForOpportunity(userId: string, opportunityId: string): Promise<IVolunteerApplication> {
    const opportunity = await Opportunity.findById(opportunityId);
    if (!opportunity) {
      throw new AppError('Opportunity not found', 404, 'NOT_FOUND');
    }
    if (opportunity.status !== 'OPEN') {
      throw new AppError('Opportunity is not open for applications', 400, 'BAD_REQUEST');
    }

    const existingApplication = await VolunteerApplication.findOne({ userId, opportunityId });
    if (existingApplication) {
      throw new AppError('You have already applied for this opportunity', 400, 'BAD_REQUEST');
    }

    const count = await VolunteerApplication.countDocuments({ opportunityId, status: 'ACCEPTED' });
    if (count >= opportunity.maxVolunteers) {
      throw new AppError('Opportunity has reached maximum volunteers', 400, 'BAD_REQUEST');
    }

    const application = new VolunteerApplication({ userId, opportunityId });
    await application.save();
    return application;
  }

  static async getApplicationsForOpportunity(opportunityId: string, ngoId: string): Promise<IVolunteerApplication[]> {
    const opportunity = await Opportunity.findOne({ _id: opportunityId, ngoId });
    if (!opportunity) {
      throw new AppError('Opportunity not found or unauthorized', 404, 'NOT_FOUND');
    }
    return VolunteerApplication.find({ opportunityId }).populate('userId', 'name email');
  }

  static async updateApplicationStatus(applicationId: string, ngoId: string, status: string): Promise<IVolunteerApplication> {
    const application = await VolunteerApplication.findById(applicationId).populate('opportunityId');
    if (!application) {
      throw new AppError('Application not found', 404, 'NOT_FOUND');
    }
    
    const opportunity: any = application.opportunityId;
    if (opportunity.ngoId.toString() !== ngoId.toString()) {
      throw new AppError('Unauthorized', 403, 'FORBIDDEN');
    }

    application.status = status as any;
    await application.save();
    return application;
  }
}
""",
    r"volunteering\controllers\OpportunityController.ts": """import { Request, Response, NextFunction } from 'express';
import { OpportunityService } from '../services/OpportunityService';

export class OpportunityController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const opportunity = await OpportunityService.createOpportunity({
        ...req.body,
        ngoId: (req as any).user.id,
      });
      res.status(201).json({ success: true, data: opportunity });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const opportunities = await OpportunityService.getOpportunities(req.query);
      res.status(200).json({ success: true, data: opportunities });
    } catch (error) {
      next(error);
    }
  }

  static async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const opportunity = await OpportunityService.getOpportunityById(req.params.id);
      res.status(200).json({ success: true, data: opportunity });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const opportunity = await OpportunityService.updateOpportunity(
        req.params.id,
        (req as any).user.id,
        req.body
      );
      res.status(200).json({ success: true, data: opportunity });
    } catch (error) {
      next(error);
    }
  }
}
""",
    r"volunteering\controllers\ApplicationController.ts": """import { Request, Response, NextFunction } from 'express';
import { ApplicationService } from '../services/ApplicationService';

export class ApplicationController {
  static async apply(req: Request, res: Response, next: NextFunction) {
    try {
      const application = await ApplicationService.applyForOpportunity(
        (req as any).user.id,
        req.params.opportunityId
      );
      res.status(201).json({ success: true, data: application });
    } catch (error) {
      next(error);
    }
  }

  static async getForOpportunity(req: Request, res: Response, next: NextFunction) {
    try {
      const applications = await ApplicationService.getApplicationsForOpportunity(
        req.params.opportunityId,
        (req as any).user.id
      );
      res.status(200).json({ success: true, data: applications });
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const application = await ApplicationService.updateApplicationStatus(
        req.params.id,
        (req as any).user.id,
        req.body.status
      );
      res.status(200).json({ success: true, data: application });
    } catch (error) {
      next(error);
    }
  }
}
""",
    r"volunteering\routes\opportunity.routes.ts": """import { Router } from 'express';
import { OpportunityController } from '../controllers/OpportunityController';
import { authenticate, authorize } from '../../../core/middleware/authenticate';
import { validate } from '../../../core/middleware/validate';
import { createOpportunitySchema, updateOpportunitySchema } from '../validations/opportunity.validation';
import { UserRole } from '../../users/models/User';

const router = Router();

router.post('/', authenticate, authorize(UserRole.NGO), validate(createOpportunitySchema), OpportunityController.create);
router.get('/', OpportunityController.getAll);
router.get('/:id', OpportunityController.getOne);
router.patch('/:id', authenticate, authorize(UserRole.NGO), validate(updateOpportunitySchema), OpportunityController.update);

export default router;
""",
    r"volunteering\routes\application.routes.ts": """import { Router } from 'express';
import { ApplicationController } from '../controllers/ApplicationController';
import { authenticate, authorize } from '../../../core/middleware/authenticate';
import { validate } from '../../../core/middleware/validate';
import { updateApplicationStatusSchema } from '../validations/application.validation';
import { UserRole } from '../../users/models/User';

const router = Router();

router.post('/opportunities/:opportunityId/apply', authenticate, authorize(UserRole.INDIVIDUAL), ApplicationController.apply);
router.get('/opportunities/:opportunityId/applications', authenticate, authorize(UserRole.NGO), ApplicationController.getForOpportunity);
router.patch('/:id/status', authenticate, authorize(UserRole.NGO), validate(updateApplicationStatusSchema), ApplicationController.updateStatus);

export default router;
""",

    r"impact\models\ImpactReport.ts": """import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IImpactReport extends Document {
  ngoId: Types.ObjectId;
  title: string;
  description: string;
  metrics: Map<string, string | number>;
  relatedCampaignId?: Types.ObjectId;
  relatedOpportunityId?: Types.ObjectId;
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const impactReportSchema = new Schema<IImpactReport>(
  {
    ngoId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    metrics: { type: Map, of: Schema.Types.Mixed, default: {} },
    relatedCampaignId: { type: Schema.Types.ObjectId, ref: 'Campaign' },
    relatedOpportunityId: { type: Schema.Types.ObjectId, ref: 'Opportunity' },
    publishedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const ImpactReport = mongoose.model<IImpactReport>('ImpactReport', impactReportSchema);
""",
    r"impact\validations\impact.validation.ts": """import { z } from 'zod';

export const createImpactReportSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(200),
    description: z.string().min(10).max(5000),
    metrics: z.record(z.union([z.string(), z.number()])).optional(),
    relatedCampaignId: z.string().optional(),
    relatedOpportunityId: z.string().optional(),
  }),
});
""",
    r"impact\services\ImpactService.ts": """import { ImpactReport, IImpactReport } from '../models/ImpactReport';
import { AppError } from '../../../core/errors/AppError';

export class ImpactService {
  static async createReport(data: Partial<IImpactReport>): Promise<IImpactReport> {
    const report = new ImpactReport(data);
    await report.save();
    return report;
  }

  static async getReports(filters: any): Promise<IImpactReport[]> {
    return ImpactReport.find(filters).populate('ngoId', 'name email');
  }

  static async getReportById(id: string): Promise<IImpactReport> {
    const report = await ImpactReport.findById(id).populate('ngoId', 'name email');
    if (!report) {
      throw new AppError('Impact report not found', 404, 'NOT_FOUND');
    }
    return report;
  }
}
""",
    r"impact\controllers\ImpactController.ts": """import { Request, Response, NextFunction } from 'express';
import { ImpactService } from '../services/ImpactService';

export class ImpactController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await ImpactService.createReport({
        ...req.body,
        ngoId: (req as any).user.id,
      });
      res.status(201).json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const reports = await ImpactService.getReports(req.query);
      res.status(200).json({ success: true, data: reports });
    } catch (error) {
      next(error);
    }
  }

  static async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await ImpactService.getReportById(req.params.id);
      res.status(200).json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  }
}
""",
    r"impact\routes\impact.routes.ts": """import { Router } from 'express';
import { ImpactController } from '../controllers/ImpactController';
import { authenticate, authorize } from '../../../core/middleware/authenticate';
import { validate } from '../../../core/middleware/validate';
import { createImpactReportSchema } from '../validations/impact.validation';
import { UserRole } from '../../users/models/User';

const router = Router();

router.post('/', authenticate, authorize(UserRole.NGO), validate(createImpactReportSchema), ImpactController.create);
router.get('/', ImpactController.getAll);
router.get('/:id', ImpactController.getOne);

export default router;
""",

    r"reviews\models\Review.ts": """import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IReview extends Document {
  reviewerId: Types.ObjectId;
  targetId: Types.ObjectId;
  targetType: 'User' | 'NGO';
  rating: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    reviewerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetId: { type: Schema.Types.ObjectId, required: true },
    targetType: { type: String, enum: ['User', 'NGO'], required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
  },
  { timestamps: true }
);

export const Review = mongoose.model<IReview>('Review', reviewSchema);
""",
    r"reviews\validations\review.validation.ts": """import { z } from 'zod';

export const createReviewSchema = z.object({
  body: z.object({
    targetId: z.string(),
    targetType: z.enum(['User', 'NGO']),
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(1000).optional(),
  }),
});
""",
    r"reviews\services\ReviewService.ts": """import { Review, IReview } from '../models/Review';
import { AppError } from '../../../core/errors/AppError';

export class ReviewService {
  static async createReview(data: Partial<IReview>): Promise<IReview> {
    const existing = await Review.findOne({ reviewerId: data.reviewerId, targetId: data.targetId });
    if (existing) {
      throw new AppError('You have already reviewed this target', 400, 'BAD_REQUEST');
    }
    const review = new Review(data);
    await review.save();
    return review;
  }

  static async getReviewsForTarget(targetId: string, targetType: string): Promise<IReview[]> {
    return Review.find({ targetId, targetType }).populate('reviewerId', 'name');
  }
}
""",
    r"reviews\controllers\ReviewController.ts": """import { Request, Response, NextFunction } from 'express';
import { ReviewService } from '../services/ReviewService';

export class ReviewController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const review = await ReviewService.createReview({
        ...req.body,
        reviewerId: (req as any).user.id,
      });
      res.status(201).json({ success: true, data: review });
    } catch (error) {
      next(error);
    }
  }

  static async getTargetReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const reviews = await ReviewService.getReviewsForTarget(req.params.targetId, req.query.targetType as string);
      res.status(200).json({ success: true, data: reviews });
    } catch (error) {
      next(error);
    }
  }
}
""",
    r"reviews\routes\review.routes.ts": """import { Router } from 'express';
import { ReviewController } from '../controllers/ReviewController';
import { authenticate } from '../../../core/middleware/authenticate';
import { validate } from '../../../core/middleware/validate';
import { createReviewSchema } from '../validations/review.validation';

const router = Router();

router.post('/', authenticate, validate(createReviewSchema), ReviewController.create);
router.get('/:targetId', ReviewController.getTargetReviews);

export default router;
"""
}

for rel_path, content in files.items():
    full_path = os.path.join(BASE_DIR, rel_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Files created successfully!")
