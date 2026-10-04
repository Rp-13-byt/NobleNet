import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ZodError, z } from "zod";
import { env } from "./config.js";

export type Role = "USER" | "NGO" | "SUPER_ADMIN";
export class AppError extends Error { constructor(public status: number, public code: string, message: string) { super(message); } }
export const asyncRoute = (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) => (req: Request,res: Response,next: NextFunction) => Promise.resolve(fn(req,res,next)).catch(next);
export const respond = <T>(res: Response, status: number, data: T, message?: string) => res.status(status).json({ success: true, ...(message ? { message } : {}), data });
export const validate = (schema: z.ZodType) => (req: Request, _res: Response, next: NextFunction) => { try { req.body = schema.parse(req.body); next(); } catch (e) { next(e); } };
declare global { namespace Express { interface Request { auth?: { userId: string; role: Role }; } } }
export const authenticate = (req: Request, _res: Response, next: NextFunction) => { try { const token = req.header("authorization")?.replace(/^Bearer\s+/i, ""); if (!token) throw new Error(); const p = jwt.verify(token, env.JWT_ACCESS_SECRET) as { sub: string; role: Role }; req.auth = { userId: p.sub, role: p.role }; next(); } catch { next(new AppError(401, "UNAUTHENTICATED", "Authentication is required")); } };
export const authorize = (...roles: Role[]) => (req: Request, _res: Response, next: NextFunction) => !req.auth || !roles.includes(req.auth.role) ? next(new AppError(403,"FORBIDDEN","You are not allowed to perform this action")) : next();
export const errorHandler = (error: unknown, _req: Request, res: Response, _next: NextFunction) => { if (error instanceof ZodError) return res.status(400).json({ success:false, message:"Invalid request", error:{ code:"VALIDATION_ERROR", details:error.flatten() } }); const e = error instanceof AppError ? error : new AppError(500,"INTERNAL_ERROR","An unexpected error occurred"); return res.status(e.status).json({ success:false, message:e.message, error:{code:e.code, details:null} }); };
