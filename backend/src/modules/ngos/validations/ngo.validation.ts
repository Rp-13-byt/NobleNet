import { z } from 'zod';

export const ngoRegistrationSchema = z.object({
  body: z.object({
    organizationName: z.string().min(2),
    registrationNumber: z.string().min(2),
    description: z.string().min(10),
    address: z.string().min(5),
    contactEmail: z.string().email(),
    contactPhone: z.string().min(7),
    website: z.string().url().optional(),
    documents: z.array(z.string().url()).min(1),
  }),
});

export const ngoVerificationSchema = z.object({
  body: z.object({
    status: z.enum(['APPROVED', 'REJECTED']),
    verificationNotes: z.string().optional(),
  }),
});
