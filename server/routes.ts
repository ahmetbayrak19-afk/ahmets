import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTeacherSchema, insertStudentSchema, insertModuleSchema, insertAchievementSchema, MODULE_COLORS } from "@shared/schema";
import { z } from "zod";

declare module 'express-session' {
  interface SessionData {
    institutionId?: string;
    institutionName?: string;
    teacherId?: string;
    teacherName?: string;
    superAdminId?: string;
    superAdminName?: string;
  }
}

const SUPER_ADMIN_NAME = "Ahmet Bayrak";
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD;

if (!SUPER_ADMIN_PASSWORD) {
  console.warn('WARNING: SUPER_ADMIN_PASSWORD not set. Super admin login is disabled.');
}

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session?.institutionId || !req.session?.teacherId) {
    return res.status(401).json({ error: "Oturum açmanız gerekiyor" });
  }
  next();
};

const requireInstitutionAuth = (req: Request, res: Response, next: NextFunction) => {console.log('requireAuth kontrolü - Session ID:', req.session?.institutionId); 
  if (!req.session?.institutionId) {
    return res.status(401).json({ error: "Kurum girişi yapmanız gerekiyor" });
  }
  next();
};

const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session?.institutionId || !req.session?.teacherId) {
    return res.status(401).json({ error: "Oturum açmanız gerekiyor" });
  }
  // Check if teacher name is "Admin" (case insensitive)
  if (req.session.teacherName?.toLowerCase() !== 'admin') {
    return res.status(403).json({ error: "Bu işlem için admin yetkisi gerekiyor" });
  }
  next();
};

const requireSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session?.superAdminId) {
    return res.status(401).json({ error: "Süper admin girişi gerekiyor" });
  }
  next();
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.post("/api/auth/institution-login", async (req, res) => {
    try {
      const { name, password } = req.body;
      
      if (!name || !password) {
        return res.status(400).json({ error: "Kurum adı ve şifre gerekli" });
      }

      const institution = await storage.getInstitutionByName(name);
      
      if (!institution) {
        return res.status(401).json({ error: "Kurum bulunamadı" });
      }

      if (institution.password !== password) {
        return res.status(401).json({ error: "Hatalı şifre" });
      }

      if (institution.isLoginFrozen) {
        return res.status(423).json({ error: "Bu kurumun girişi yönetici tarafından dondurulmuştur" });
      }

      req.session.institutionId = institution.id;
      req.session.institutionName = institution.name;
      console.log('Kurum Girişi Başarılı. Sessiona Yazılan ID:', req.session.institutionId); 
await new Promise<void>((resolve, reject) => {
    req.session.save((err) => {
        if (err) return reject(err);
        resolve();
    });
});
      res.json({ 
        id: institution.id, 
        name: institution.name 
      });
    } catch (error) {
      console.error('Institution login error:', error);
      res.status(500).json({ error: "Kurum girişi başarısız" });
    }
  });

  app.post("/api/auth/institution-register", async (req, res) => {
    try {
     console.log('Kurum Kayıt İsteği Geldi. Gelen Veri:', req.body); 
      const { name, password } = req.body;
      
      if (!name || !password) {
        return res.status(400).json({ error: "Kurum adı ve şifre gerekli" });
      }

      if (password.length < 3) {
        return res.status(400).json({ error: "Şifre en az 3 karakter olmalıdır" });
      }

      const existingInstitution = await storage.getInstitutionByName(name);
      
      if (existingInstitution) {
        return res.status(400).json({ error: "Bu isimde bir kurum zaten mevcut" });
      }

      const institution = await storage.createInstitution({ name: name.trim(), password });

      req.session.institutionId = institution.id;
      req.session.institutionName = institution.name;

      res.json({ 
        id: institution.id, 
        name: institution.name 
      });
    } catch (error) {
      console.error('Institution register error:', error);
      res.status(500).json({ error: "Kurum kaydı başarısız" });
    }
  });

  app.post("/api/auth/teacher-login", requireInstitutionAuth, async (req, res) => {
    try {
      console.log('Öğretmen Kayıt İsteği Geldi. Gelen Veri:', req.body);
      const { name, password } = req.body;
      const institutionId = req.session.institutionId!;
      
      if (!name) {
        return res.status(400).json({ error: "İsim gerekli" });
      }

      let teacher = await storage.getTeacherByNameAndInstitution(name, institutionId);
      
      if (!teacher) {
        teacher = await storage.createTeacher({ 
          name, 
          institutionId,
          password: null,
          isPasswordSet: false 
        });
      }

      if (teacher.isPasswordSet && teacher.password !== password) {
        return res.status(401).json({ error: "Hatalı şifre" });
      }

      req.session.teacherId = teacher.id;
      req.session.teacherName = teacher.name;

      res.json(teacher);
    } catch (error) {
      console.error('Teacher login error:', error);
      res.status(500).json({ error: "Öğretmen girişi başarısız" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Çıkış başarısız" });
      }
      res.json({ success: true });
    });
  });

  app.post("/api/auth/teacher-logout", (req, res) => {
    if (req.session) {
      delete req.session.teacherId;
      delete req.session.teacherName;
    }
    res.json({ success: true });
  });

  app.get("/api/auth/me", (req, res) => {
    res.json({ 
      institutionId: req.session?.institutionId || null,
      institutionName: req.session?.institutionName || null,
      teacherId: req.session?.teacherId || null, 
      teacherName: req.session?.teacherName || null
    });
  });

  app.post("/api/auth/set-password", requireAuth, async (req, res) => {
    try {
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({ error: "Şifre gerekli" });
      }

      const teacherId = req.session.teacherId!;
      const teacher = await storage.updateTeacherPassword(teacherId, password);
      res.json(teacher);
    } catch (error) {
      console.error('Password update error:', error);
      res.status(500).json({ error: "Şifre güncellenemedi" });
    }
  });

  app.get("/api/auth/registered-teachers", requireInstitutionAuth, async (req, res) => {
    try {
      const institutionId = req.session.institutionId!;
      const teachers = await storage.getRegisteredTeachersByInstitution(institutionId);
      res.json(teachers);
    } catch (error) {
      console.error('Get registered teachers error:', error);
      res.status(500).json({ error: "Öğretmenler yüklenemedi" });
    }
  });

  app.delete("/api/teachers/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const institutionId = req.session.institutionId!;
      const currentTeacherId = req.session.teacherId!;
      
      if (id === currentTeacherId) {
        return res.status(400).json({ error: "Kendinizi silemezsiniz" });
      }
      
      const deleted = await storage.deleteTeacher(id, institutionId);
      
      if (!deleted) {
        return res.status(404).json({ error: "Öğretmen bulunamadı" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Delete teacher error:', error);
      res.status(500).json({ error: "Öğretmen silinemedi" });
    }
  });

  app.get("/api/students", requireAuth, async (req, res) => {
    try {
      const institutionId = req.session.institutionId!;
      const students = await storage.getStudentsByInstitution(institutionId);
      res.json(students);
    } catch (error) {
      console.error('Get students error:', error);
      res.status(500).json({ error: "Öğrenciler yüklenemedi" });
    }
  });

  app.get("/api/students/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const institutionId = req.session.institutionId!;
      const student = await storage.getStudent(id, institutionId);

      if (!student) {
        return res.status(404).json({ error: "Öğrenci bulunamadı" });
      }

      res.json(student);
    } catch (error) {
      console.error('Get student error:', error);
      res.status(500).json({ error: "Öğrenci yüklenemedi" });
    }
  });

  app.post("/api/students", requireAuth, async (req, res) => {
    try {
      const institutionId = req.session.institutionId!;
      const teacherId = req.session.teacherId!;
      
      const studentData = {
        ...req.body,
        institutionId,
        createdBy: teacherId,
        lastUpdatedBy: teacherId,
        associatedTeacherIds: [teacherId]
      };
      
      const validatedData = insertStudentSchema.parse(studentData);
      const student = await storage.createStudent(validatedData);
      res.json(student);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Create student error:', error);
      res.status(500).json({ error: "Öğrenci eklenemedi" });
    }
  });

  app.patch("/api/students/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const institutionId = req.session.institutionId!;
      const teacherId = req.session.teacherId!;

      // First get the current student to check if they have no teachers
      const existingStudent = await storage.getStudent(id, institutionId);
      if (!existingStudent) {
        return res.status(404).json({ error: "Öğrenci bulunamadı veya erişim yetkiniz yok" });
      }

      const updates: Record<string, unknown> = {
        ...req.body,
        lastUpdatedBy: teacherId
      };

      // If student has no associated teachers, auto-assign the current teacher
      if (!existingStudent.associatedTeacherIds || existingStudent.associatedTeacherIds.length === 0) {
        updates.associatedTeacherIds = [teacherId];
      }

      const student = await storage.updateStudent(id, institutionId, updates);
      
      if (!student) {
        return res.status(404).json({ error: "Öğrenci bulunamadı veya erişim yetkiniz yok" });
      }
      
      res.json(student);
    } catch (error) {
      console.error('Update student error:', error);
      res.status(500).json({ error: "Öğrenci güncellenemedi" });
    }
  });

  app.delete("/api/students/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const institutionId = req.session.institutionId!;
      
      const deleted = await storage.deleteStudent(id, institutionId);
      
      if (!deleted) {
        return res.status(404).json({ error: "Öğrenci bulunamadı veya erişim yetkiniz yok" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Delete student error:', error);
      res.status(500).json({ error: "Öğrenci silinemedi" });
    }
  });

  app.post("/api/students/:id/associate-teacher", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const teacherId = req.session.teacherId!;
      const institutionId = req.session.institutionId!;

      const student = await storage.addTeacherToStudent(id, teacherId, institutionId);
      
      if (!student) {
        return res.status(404).json({ error: "Öğrenci bulunamadı veya erişim yetkiniz yok" });
      }
      
      res.json(student);
    } catch (error) {
      console.error('Associate teacher error:', error);
      res.status(500).json({ error: "Öğretmen ilişkilendirilemedi" });
    }
  });

  // Module routes
  app.get("/api/modules", requireAuth, async (req, res) => {
    try {
      const institutionId = req.session.institutionId!;
      const moduleList = await storage.getModulesByInstitution(institutionId);
      res.json(moduleList);
    } catch (error) {
      console.error('Get modules error:', error);
      res.status(500).json({ error: "Modüller yüklenemedi" });
    }
  });

  app.get("/api/modules-with-achievements", requireAuth, async (req, res) => {
    try {
      const institutionId = req.session.institutionId!;
      const moduleList = await storage.getModulesByInstitution(institutionId);
      const achievementsList = await storage.getAchievementsByInstitution(institutionId);
      
      const modulesWithAchievements = moduleList.map(mod => ({
        ...mod,
        achievements: achievementsList.filter(a => a.moduleId === mod.id)
      }));
      
      res.json(modulesWithAchievements);
    } catch (error) {
      console.error('Get modules with achievements error:', error);
      res.status(500).json({ error: "Modüller yüklenemedi" });
    }
  });

  app.post("/api/modules", requireAdmin, async (req, res) => {
    try {
      const institutionId = req.session.institutionId!;
      
      // Get existing modules to determine next order index
      const existingModules = await storage.getModulesByInstitution(institutionId);
      const nextOrderIndex = existingModules.length;
      const nextColor = MODULE_COLORS[nextOrderIndex % MODULE_COLORS.length];
      
      const moduleData = {
        ...req.body,
        institutionId,
        orderIndex: nextOrderIndex,
        color: req.body.color || nextColor
      };
      
      const validatedData = insertModuleSchema.parse(moduleData);
      const module = await storage.createModule(validatedData);
      res.json(module);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Create module error:', error);
      res.status(500).json({ error: "Modül eklenemedi" });
    }
  });

  app.patch("/api/modules/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const institutionId = req.session.institutionId!;
      
      const module = await storage.updateModule(id, institutionId, req.body);
      
      if (!module) {
        return res.status(404).json({ error: "Modül bulunamadı" });
      }
      
      res.json(module);
    } catch (error) {
      console.error('Update module error:', error);
      res.status(500).json({ error: "Modül güncellenemedi" });
    }
  });

  app.delete("/api/modules/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const institutionId = req.session.institutionId!;
      
      const deleted = await storage.deleteModule(id, institutionId);
      
      if (!deleted) {
        return res.status(404).json({ error: "Modül bulunamadı" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Delete module error:', error);
      res.status(500).json({ error: "Modül silinemedi" });
    }
  });

  // Achievement routes
  app.get("/api/achievements", requireAuth, async (req, res) => {
    try {
      const institutionId = req.session.institutionId!;
      const achievementsList = await storage.getAchievementsByInstitution(institutionId);
      res.json(achievementsList);
    } catch (error) {
      console.error('Get achievements error:', error);
      res.status(500).json({ error: "Kazanımlar yüklenemedi" });
    }
  });

  app.post("/api/achievements", requireAdmin, async (req, res) => {
    try {
      const institutionId = req.session.institutionId!;
      const { moduleId } = req.body;
      
      // Get existing achievements in this module to determine next order index
      const existingAchievements = await storage.getAchievementsByModule(moduleId);
      const nextOrderIndex = existingAchievements.length;
      
      const achievementData = {
        ...req.body,
        institutionId,
        orderIndex: nextOrderIndex
      };
      
      const validatedData = insertAchievementSchema.parse(achievementData);
      const achievement = await storage.createAchievement(validatedData);
      res.json(achievement);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Create achievement error:', error);
      res.status(500).json({ error: "Kazanım eklenemedi" });
    }
  });

  app.patch("/api/achievements/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      const achievement = await storage.updateAchievement(id, req.body);
      
      if (!achievement) {
        return res.status(404).json({ error: "Kazanım bulunamadı" });
      }
      
      res.json(achievement);
    } catch (error) {
      console.error('Update achievement error:', error);
      res.status(500).json({ error: "Kazanım güncellenemedi" });
    }
  });

  app.delete("/api/achievements/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      const deleted = await storage.deleteAchievement(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Kazanım bulunamadı" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Delete achievement error:', error);
      res.status(500).json({ error: "Kazanım silinemedi" });
    }
  });

  // ABA Import route
  app.post("/api/import-aba", requireAdmin, async (req, res) => {
    try {
      const institutionId = req.session.institutionId!;
      
      // First delete all existing modules and achievements
      await storage.deleteAllModulesAndAchievements(institutionId);
      
      // Then import ABA data
      const result = await storage.importABAData(institutionId);
      
      res.json({ 
        success: true, 
        message: `${result.modulesCreated} modül ve ${result.achievementsCreated} kazanım başarıyla eklendi.`,
        ...result 
      });
    } catch (error) {
      console.error('Import ABA error:', error);
      res.status(500).json({ error: "ABA verileri eklenemedi" });
    }
  });

  // Super Admin Routes
  app.post("/api/super-admin/login", async (req, res) => {
    try {
      const { name, password } = req.body;
      
      if (!name || !password) {
        return res.status(400).json({ error: "İsim ve şifre gerekli" });
      }

      if (!SUPER_ADMIN_PASSWORD) {
        return res.status(503).json({ error: "Süper admin girişi devre dışı" });
      }

      if (name !== SUPER_ADMIN_NAME || password !== SUPER_ADMIN_PASSWORD) {
        return res.status(401).json({ error: "Geçersiz süper admin bilgileri" });
      }

      req.session.superAdminId = "super-admin";
      req.session.superAdminName = SUPER_ADMIN_NAME;
      
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) return reject(err);
          resolve();
        });
      });

      res.json({ 
        id: "super-admin",
        name: SUPER_ADMIN_NAME 
      });
    } catch (error) {
      console.error('Super admin login error:', error);
      res.status(500).json({ error: "Süper admin girişi başarısız" });
    }
  });

  app.post("/api/super-admin/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Çıkış başarısız" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/super-admin/me", (req, res) => {
    res.json({ 
      superAdminId: req.session?.superAdminId || null,
      superAdminName: req.session?.superAdminName || null
    });
  });

  app.get("/api/super-admin/institutions", requireSuperAdmin, async (req, res) => {
    try {
      const allInstitutions = await storage.getAllInstitutions();
      // Don't send passwords to frontend
      const safeInstitutions = allInstitutions.map(inst => ({
        id: inst.id,
        name: inst.name,
        isLoginFrozen: inst.isLoginFrozen,
        createdAt: inst.createdAt
      }));
      res.json(safeInstitutions);
    } catch (error) {
      console.error('Get all institutions error:', error);
      res.status(500).json({ error: "Kurumlar yüklenemedi" });
    }
  });

  app.post("/api/super-admin/institutions/:id/freeze", requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { frozen } = req.body;
      
      if (typeof frozen !== 'boolean') {
        return res.status(400).json({ error: "frozen değeri boolean olmalı" });
      }

      const institution = await storage.setInstitutionFreezeStatus(id, frozen);
      
      if (!institution) {
        return res.status(404).json({ error: "Kurum bulunamadı" });
      }

      res.json({ 
        id: institution.id,
        name: institution.name,
        isLoginFrozen: institution.isLoginFrozen
      });
    } catch (error) {
      console.error('Freeze institution error:', error);
      res.status(500).json({ error: "Kurum durumu güncellenemedi" });
    }
  });

  return httpServer;
}
