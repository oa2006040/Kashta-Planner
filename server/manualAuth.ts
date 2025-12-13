import type { Express, Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
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

declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }
}

function excludePassword(user: any): SafeUser {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
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
      res.status(500).json({ message: "حدث خطأ أثناء التسجيل" });
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
      
      res.json(excludePassword(user));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message, errors: error.errors });
      }
      console.error("Login error:", error);
      res.status(500).json({ message: "حدث خطأ أثناء تسجيل الدخول" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "حدث خطأ أثناء تسجيل الخروج" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "تم تسجيل الخروج بنجاح" });
    });
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
