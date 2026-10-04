import { z } from 'zod';

export const createCampaignSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Campaign title must be at least 3 characters'),
    description: z.string().min(10, 'Campaign story must be at least 10 characters'),
    goalAmount: z.number().positive().optional(),
    targetAmount: z.number().positive().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    deadline: z.string().optional(),
    images: z.array(z.string()).optional(),
    imageUrl: z.string().optional(),
    category: z.string().min(2),
    location: z.string().optional(),
  }),
});

export const updateCampaignStatusSchema = z.object({
  body: z.object({
    status: z.enum(['ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED']),
  }),
});
