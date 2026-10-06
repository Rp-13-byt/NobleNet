import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),
  MONGO_URI: z.string(),
  JWT_ACCESS_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  STORAGE_PROVIDER: z.enum(['local', 'cloudinary']).default('local'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  PAYMENT_PROVIDER: z.enum(['mock', 'razorpay']).default('mock'),
  RAZORPAY_KEY_ID: z.string().optional().default('rzp_test_mock_key'),
  RAZORPAY_KEY_SECRET: z.string().optional().default('rzp_test_mock_secret'),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional().default('rzp_webhook_mock_secret'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  process.exit(1);
}

export const env = _env.data;
