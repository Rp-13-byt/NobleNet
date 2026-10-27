import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"), PORT: z.coerce.number().default(5000),
  MONGODB_URI: z.string().default("mongodb://127.0.0.1:27017/noblenet"),
  JWT_ACCESS_SECRET: z.string().min(24).default("development-access-secret-must-be-replaced"),
  JWT_REFRESH_SECRET: z.string().min(24).default("development-refresh-secret-must-be-replaced"),
  PAYMENT_PROVIDER: z.enum(["mock", "razorpay"]).default("mock"), RAZORPAY_KEY_ID: z.string().optional(), RAZORPAY_KEY_SECRET: z.string().optional(), RAZORPAY_WEBHOOK_SECRET: z.string().optional(), CLIENT_ORIGIN: z.string().default("http://localhost:5173")
});
export const env = schema.parse(process.env);
