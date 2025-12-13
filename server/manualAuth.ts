import type { Express, Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { storage } from "./storage";
import { 
  registerUserSchema, 
  loginUserSchema, 
  updateProfileSchema, 
  changePasswordSchema,
  type SafeUser 
} from "@shared/schema";
import { z } from "zod";

const SALT_ROUNDS = 10;
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const REFRESH_TOKEN_EXPIRY_DAYS = 30;
const REFRESH_TOKEN_COOKIE_NAME = "refresh_token";

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    lastActivity?: number;
  }
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function generateRefreshToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function excludePassword(user: any): SafeUser {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

export function sessionActivityMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    return next();
  }
  
  const lastActivity = req.session.lastActivity || Date.now();
  const now = Date.now();
  
  if (now - lastActivity > INACTIVITY_TIMEOUT) {
    req.session.destroy((err) => {
      if (err) console.error("Session destroy error:", err);
    });
    return res.status(401).json({ message: "انتهت الجلسة بسبب عدم النشاط" });
  }
  
  req.session.lastActivity = now;
  next();
}

export function isManualAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.session?.userId) {
    return next();
  }
  return res.status(401).json({ message: "غير مصرح - يرجى تسجيل الدخول" });
}

export function setupManualAuth(app: Express) {
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const data = registerUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ message: "البريد الإلكتروني مستخدم بالفعل" });
      }

      const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
      
      const user = await storage.createUser({
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName || null,
        phone: data.phone || null,
      });

      req.session.userId = user.id;
      
      res.status(201).json(excludePassword(user));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message, errors: error.errors });
      }
      console.error("Registration error:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({ 
        message: "حدث خطأ أثناء التسجيل", 
        error: process.env.NODE_ENV === 'production' ? errorMessage : undefined,
        debug: errorMessage
      });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const data = loginUserSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(data.email);
      if (!user || !user.passwordHash) {
        return res.status(401).json({ message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
      }

      const isValid = await bcrypt.compare(data.password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
      }

      // Ensure participant exists for legacy users (backfill on login)
      try {
        await storage.ensureParticipantForUser(user.id);
      } catch (backfillError) {
        console.error("Participant backfill error:", backfillError);
      }

      req.session.userId = user.id;
      req.session.lastActivity = Date.now();
      
      // Handle "Remember Me" - create refresh token
      if (data.rememberMe) {
        const rawToken = generateRefreshToken();
        const tokenHash = hashToken(rawToken);
        const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
        
        await storage.createRefreshToken({
          userId: user.id,
          tokenHash,
          deviceName: req.get("User-Agent")?.substring(0, 50) || "Unknown Device",
          userAgent: req.get("User-Agent") || null,
          ipAddress: req.ip || null,
          expiresAt,
          lastUsedAt: new Date(),
          revokedAt: null,
        });
        
        res.cookie(REFRESH_TOKEN_COOKIE_NAME, rawToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
          path: "/",
        });
      }
      
      res.json(excludePassword(user));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message, errors: error.errors });
      }
      console.error("Login error:", error);
      res.status(500).json({ message: "حدث خطأ أثناء تسجيل الدخول" });
    }
  });

  app.post("/api/auth/logout", async (req: Request, res: Response) => {
    const userId = req.session?.userId;
    
    // Revoke refresh token from cookie
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];
    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      const token = await storage.getRefreshTokenByHash(tokenHash);
      if (token) {
        await storage.revokeRefreshToken(token.id);
      }
    }
    
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "حدث خطأ أثناء تسجيل الخروج" });
      }
      res.clearCookie("connect.sid");
      res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, { path: "/" });
      res.json({ message: "تم تسجيل الخروج بنجاح" });
    });
  });

  // Refresh session using refresh token
  app.post("/api/auth/refresh", async (req: Request, res: Response) => {
    try {
      const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];
      
      if (!refreshToken) {
        return res.status(401).json({ message: "لا يوجد رمز تحديث" });
      }
      
      const tokenHash = hashToken(refreshToken);
      const storedToken = await storage.getRefreshTokenByHash(tokenHash);
      
      if (!storedToken) {
        res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, { path: "/" });
        return res.status(401).json({ message: "رمز التحديث غير صالح" });
      }
      
      // Check if token is expired or revoked
      if (storedToken.revokedAt || new Date(storedToken.expiresAt) < new Date()) {
        res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, { path: "/" });
        return res.status(401).json({ message: "رمز التحديث منتهي الصلاحية" });
      }
      
      // Get user
      const user = await storage.getUser(storedToken.userId);
      if (!user) {
        await storage.revokeRefreshToken(storedToken.id);
        res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, { path: "/" });
        return res.status(401).json({ message: "المستخدم غير موجود" });
      }
      
      // Update last used timestamp
      await storage.updateRefreshTokenLastUsed(storedToken.id);
      
      // Create new session
      req.session.userId = user.id;
      req.session.lastActivity = Date.now();
      
      res.json(excludePassword(user));
    } catch (error) {
      console.error("Refresh error:", error);
      res.status(500).json({ message: "حدث خطأ أثناء تحديث الجلسة" });
    }
  });

  app.get("/api/auth/status", async (req: Request, res: Response) => {
    const userId = req.session?.userId;
    
    if (userId) {
      try {
        const user = await storage.getUser(userId);
        if (user) {
          res.json({
            authenticated: true,
            user: excludePassword(user),
            logoutUrl: "/api/auth/logout",
          });
          return;
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    }
    
    res.json({
      authenticated: false,
      user: null,
      loginUrl: "/login",
      registerUrl: "/register",
    });
  });

  app.get("/api/auth/user", isManualAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId!;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }
      res.json(excludePassword(user));
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "حدث خطأ" });
    }
  });

  app.patch("/api/auth/profile", isManualAuthenticated, async (req: Request, res: Response) => {
    try {
      const data = updateProfileSchema.parse(req.body);
      const userId = req.session!.userId!;

      if (data.email) {
        const existingUser = await storage.getUserByEmail(data.email);
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ message: "البريد الإلكتروني مستخدم بالفعل" });
        }
      }

      const user = await storage.updateUser(userId, data);
      if (!user) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }
      
      res.json(excludePassword(user));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message, errors: error.errors });
      }
      console.error("Profile update error:", error);
      res.status(500).json({ message: "حدث خطأ أثناء تحديث البيانات" });
    }
  });

  app.patch("/api/auth/password", isManualAuthenticated, async (req: Request, res: Response) => {
    try {
      const data = changePasswordSchema.parse(req.body);
      const userId = req.session!.userId!;

      const user = await storage.getUser(userId);
      if (!user || !user.passwordHash) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }

      const isValid = await bcrypt.compare(data.currentPassword, user.passwordHash);
      if (!isValid) {
        return res.status(400).json({ message: "كلمة المرور الحالية غير صحيحة" });
      }

      const newPasswordHash = await bcrypt.hash(data.newPassword, SALT_ROUNDS);
      await storage.updateUser(userId, { passwordHash: newPasswordHash });
      
      res.json({ message: "تم تغيير كلمة المرور بنجاح" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message, errors: error.errors });
      }
      console.error("Password change error:", error);
      res.status(500).json({ message: "حدث خطأ أثناء تغيير كلمة المرور" });
    }
  });
}
