import { 
  type Teacher, type InsertTeacher, 
  type Student, type InsertStudent, 
  type Institution, type InsertInstitution,
  type Module, type InsertModule,
  type Achievement, type InsertAchievement,
  MODULE_COLORS
} from "@shared/schema";
import { db } from "./firebase";
import { ABA_MODULES } from "@shared/abaData";
import { v4 as uuidv4 } from "uuid";

export interface IStorage {
  getInstitution(id: string): Promise<Institution | undefined>;
  getInstitutionByName(name: string): Promise<Institution | undefined>;
  createInstitution(institution: InsertInstitution): Promise<Institution>;
  
  getAllInstitutions(): Promise<Institution[]>;
  setInstitutionFreezeStatus(id: string, frozen: boolean): Promise<Institution | undefined>;
  
  getTeacher(id: string): Promise<Teacher | undefined>;
  getTeacherByNameAndInstitution(name: string, institutionId: string): Promise<Teacher | undefined>;
  getRegisteredTeachersByInstitution(institutionId: string): Promise<{ id: string; name: string }[]>;
  createTeacher(teacher: InsertTeacher): Promise<Teacher>;
  updateTeacherPassword(id: string, password: string): Promise<Teacher>;
  deleteTeacher(id: string, institutionId: string): Promise<boolean>;
  
  getStudent(id: string, institutionId: string): Promise<Student | undefined>;
  getStudentsByInstitution(institutionId: string): Promise<Student[]>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: string, institutionId: string, updates: Partial<Student>): Promise<Student | undefined>;
  deleteStudent(id: string, institutionId: string): Promise<boolean>;
  addTeacherToStudent(studentId: string, teacherId: string, institutionId: string): Promise<Student | undefined>;

  getModulesByInstitution(institutionId: string): Promise<Module[]>;
  createModule(module: InsertModule): Promise<Module>;
  updateModule(id: string, institutionId: string, updates: Partial<Module>): Promise<Module | undefined>;
  deleteModule(id: string, institutionId: string): Promise<boolean>;

  getAchievementsByModule(moduleId: string): Promise<Achievement[]>;
  getAchievementsByInstitution(institutionId: string): Promise<Achievement[]>;
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  updateAchievement(id: string, updates: Partial<Achievement>): Promise<Achievement | undefined>;
  deleteAchievement(id: string): Promise<boolean>;

  deleteAllModulesAndAchievements(institutionId: string): Promise<void>;
  importABAData(institutionId: string): Promise<{ modulesCreated: number; achievementsCreated: number }>;
}

function docToInstitution(doc: FirebaseFirestore.DocumentSnapshot): Institution | undefined {
  if (!doc.exists) return undefined;
  const data = doc.data()!;
  return {
    id: doc.id,
    name: data.name,
    password: data.password,
    isLoginFrozen: data.isLoginFrozen ?? false,
    createdAt: data.createdAt?.toDate() ?? null
  };
}

function docToTeacher(doc: FirebaseFirestore.DocumentSnapshot): Teacher | undefined {
  if (!doc.exists) return undefined;
  const data = doc.data()!;
  return {
    id: doc.id,
    institutionId: data.institutionId,
    name: data.name,
    password: data.password ?? null,
    isPasswordSet: data.isPasswordSet ?? false,
    createdAt: data.createdAt?.toDate() ?? null
  };
}

function docToStudent(doc: FirebaseFirestore.DocumentSnapshot): Student | undefined {
  if (!doc.exists) return undefined;
  const data = doc.data()!;
  return {
    id: doc.id,
    institutionId: data.institutionId,
    name: data.name,
    completedAchievementIds: data.completedAchievementIds ?? [],
    monthlyProgress: data.monthlyProgress ?? {},
    lastUpdatedBy: data.lastUpdatedBy ?? null,
    lastUpdatedAt: data.lastUpdatedAt?.toDate() ?? null,
    createdBy: data.createdBy ?? null,
    associatedTeacherIds: data.associatedTeacherIds ?? [],
    createdAt: data.createdAt?.toDate() ?? null
  };
}

function docToModule(doc: FirebaseFirestore.DocumentSnapshot): Module | undefined {
  if (!doc.exists) return undefined;
  const data = doc.data()!;
  return {
    id: doc.id,
    institutionId: data.institutionId,
    name: data.name,
    color: data.color ?? '#22c55e',
    orderIndex: data.orderIndex ?? 0,
    createdAt: data.createdAt?.toDate() ?? null
  };
}

function docToAchievement(doc: FirebaseFirestore.DocumentSnapshot): Achievement | undefined {
  if (!doc.exists) return undefined;
  const data = doc.data()!;
  return {
    id: doc.id,
    moduleId: data.moduleId,
    institutionId: data.institutionId,
    name: data.name,
    orderIndex: data.orderIndex ?? 0,
    createdAt: data.createdAt?.toDate() ?? null
  };
}

export class FirebaseStorage implements IStorage {
  private institutions = db.collection('institutions');
  private teachers = db.collection('teachers');
  private students = db.collection('students');
  private modules = db.collection('modules');
  private achievements = db.collection('achievements');

  async getInstitution(id: string): Promise<Institution | undefined> {
    const doc = await this.institutions.doc(id).get();
    return docToInstitution(doc);
  }

  async getInstitutionByName(name: string): Promise<Institution | undefined> {
    const snapshot = await this.institutions
      .where('nameLower', '==', name.toLowerCase())
      .limit(1)
      .get();
    if (snapshot.empty) return undefined;
    return docToInstitution(snapshot.docs[0]);
  }

  async createInstitution(insertInstitution: InsertInstitution): Promise<Institution> {
    const id = uuidv4();
    const data = {
      ...insertInstitution,
      nameLower: insertInstitution.name.toLowerCase(),
      isLoginFrozen: insertInstitution.isLoginFrozen ?? false,
      createdAt: new Date()
    };
    await this.institutions.doc(id).set(data);
    return {
      id,
      name: data.name,
      password: data.password,
      isLoginFrozen: data.isLoginFrozen,
      createdAt: data.createdAt
    };
  }

  async getAllInstitutions(): Promise<Institution[]> {
    const snapshot = await this.institutions.orderBy('name').get();
    return snapshot.docs.map(doc => docToInstitution(doc)!);
  }

  async setInstitutionFreezeStatus(id: string, frozen: boolean): Promise<Institution | undefined> {
    const docRef = this.institutions.doc(id);
    await docRef.update({ isLoginFrozen: frozen });
    const doc = await docRef.get();
    return docToInstitution(doc);
  }

  async getTeacher(id: string): Promise<Teacher | undefined> {
    const doc = await this.teachers.doc(id).get();
    return docToTeacher(doc);
  }

  async getTeacherByNameAndInstitution(name: string, institutionId: string): Promise<Teacher | undefined> {
    const snapshot = await this.teachers
      .where('nameLower', '==', name.toLowerCase())
      .where('institutionId', '==', institutionId)
      .limit(1)
      .get();
    if (snapshot.empty) return undefined;
    return docToTeacher(snapshot.docs[0]);
  }

  async getRegisteredTeachersByInstitution(institutionId: string): Promise<{ id: string; name: string }[]> {
    const snapshot = await this.teachers
      .where('institutionId', '==', institutionId)
      .where('isPasswordSet', '==', true)
      .get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name
    }));
  }

  async createTeacher(insertTeacher: InsertTeacher): Promise<Teacher> {
    const id = uuidv4();
    const data = {
      ...insertTeacher,
      nameLower: insertTeacher.name.toLowerCase(),
      isPasswordSet: insertTeacher.isPasswordSet ?? false,
      createdAt: new Date()
    };
    await this.teachers.doc(id).set(data);
    return {
      id,
      institutionId: data.institutionId,
      name: data.name,
      password: data.password ?? null,
      isPasswordSet: data.isPasswordSet,
      createdAt: data.createdAt
    };
  }

  async updateTeacherPassword(id: string, password: string): Promise<Teacher> {
    const docRef = this.teachers.doc(id);
    await docRef.update({ password, isPasswordSet: true });
    const doc = await docRef.get();
    return docToTeacher(doc)!;
  }

  async deleteTeacher(id: string, institutionId: string): Promise<boolean> {
    const studentsSnapshot = await this.students
      .where('institutionId', '==', institutionId)
      .get();
    
    const batch = db.batch();
    
    for (const studentDoc of studentsSnapshot.docs) {
      const student = docToStudent(studentDoc)!;
      if (!student.associatedTeacherIds.includes(id)) continue;
      
      const updatedAssociatedTeacherIds = student.associatedTeacherIds.filter(tid => tid !== id);
      const updatedCreatedBy = student.createdBy === id ? null : student.createdBy;
      const updatedLastUpdatedBy = student.lastUpdatedBy === id ? null : student.lastUpdatedBy;
      
      batch.update(studentDoc.ref, {
        associatedTeacherIds: updatedAssociatedTeacherIds,
        createdBy: updatedCreatedBy,
        lastUpdatedBy: updatedLastUpdatedBy,
        lastUpdatedAt: new Date()
      });
    }
    
    const teacherDoc = await this.teachers.doc(id).get();
    if (!teacherDoc.exists || teacherDoc.data()?.institutionId !== institutionId) {
      return false;
    }
    
    batch.delete(this.teachers.doc(id));
    await batch.commit();
    return true;
  }

  async getStudent(id: string, institutionId: string): Promise<Student | undefined> {
    const doc = await this.students.doc(id).get();
    const student = docToStudent(doc);
    if (student && student.institutionId !== institutionId) return undefined;
    return student;
  }

  async getStudentsByInstitution(institutionId: string): Promise<Student[]> {
    const snapshot = await this.students
      .where('institutionId', '==', institutionId)
      .get();
    return snapshot.docs.map(doc => docToStudent(doc)!);
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const id = uuidv4();
    const data = {
      ...insertStudent,
      completedAchievementIds: insertStudent.completedAchievementIds ?? [],
      monthlyProgress: insertStudent.monthlyProgress ?? {},
      associatedTeacherIds: insertStudent.associatedTeacherIds ?? [],
      lastUpdatedAt: new Date(),
      createdAt: new Date()
    };
    await this.students.doc(id).set(data);
    return {
      id,
      institutionId: data.institutionId,
      name: data.name,
      completedAchievementIds: data.completedAchievementIds,
      monthlyProgress: data.monthlyProgress,
      lastUpdatedBy: data.lastUpdatedBy ?? null,
      lastUpdatedAt: data.lastUpdatedAt,
      createdBy: data.createdBy ?? null,
      associatedTeacherIds: data.associatedTeacherIds,
      createdAt: data.createdAt
    };
  }

  async updateStudent(id: string, institutionId: string, updates: Partial<Student>): Promise<Student | undefined> {
    const docRef = this.students.doc(id);
    const doc = await docRef.get();
    const student = docToStudent(doc);
    if (!student || student.institutionId !== institutionId) return undefined;
    
    await docRef.update({ ...updates, lastUpdatedAt: new Date() });
    const updatedDoc = await docRef.get();
    return docToStudent(updatedDoc);
  }

  async deleteStudent(id: string, institutionId: string): Promise<boolean> {
    const doc = await this.students.doc(id).get();
    const student = docToStudent(doc);
    if (!student || student.institutionId !== institutionId) return false;
    
    await this.students.doc(id).delete();
    return true;
  }

  async addTeacherToStudent(studentId: string, teacherId: string, institutionId: string): Promise<Student | undefined> {
    const student = await this.getStudent(studentId, institutionId);
    if (!student) return undefined;
    
    if (!student.associatedTeacherIds.includes(teacherId)) {
      const updatedTeacherIds = [...student.associatedTeacherIds, teacherId];
      return await this.updateStudent(studentId, institutionId, { 
        associatedTeacherIds: updatedTeacherIds,
        lastUpdatedBy: teacherId 
      });
    }
    
    return student;
  }

  async getModulesByInstitution(institutionId: string): Promise<Module[]> {
    const snapshot = await this.modules
      .where('institutionId', '==', institutionId)
      .get();
    const modules = snapshot.docs.map(doc => docToModule(doc)!);
    return modules.sort((a, b) => a.orderIndex - b.orderIndex);
  }

  async createModule(insertModule: InsertModule): Promise<Module> {
    const id = uuidv4();
    const data = {
      ...insertModule,
      color: insertModule.color ?? '#22c55e',
      orderIndex: insertModule.orderIndex ?? 0,
      createdAt: new Date()
    };
    await this.modules.doc(id).set(data);
    return {
      id,
      institutionId: data.institutionId,
      name: data.name,
      color: data.color,
      orderIndex: data.orderIndex,
      createdAt: data.createdAt
    };
  }

  async updateModule(id: string, institutionId: string, updates: Partial<Module>): Promise<Module | undefined> {
    const docRef = this.modules.doc(id);
    const doc = await docRef.get();
    const module = docToModule(doc);
    if (!module || module.institutionId !== institutionId) return undefined;
    
    await docRef.update(updates);
    const updatedDoc = await docRef.get();
    return docToModule(updatedDoc);
  }

  async deleteModule(id: string, institutionId: string): Promise<boolean> {
    const doc = await this.modules.doc(id).get();
    const module = docToModule(doc);
    if (!module || module.institutionId !== institutionId) return false;
    
    const achievementsSnapshot = await this.achievements
      .where('moduleId', '==', id)
      .get();
    
    const batch = db.batch();
    achievementsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
    batch.delete(this.modules.doc(id));
    await batch.commit();
    
    return true;
  }

  async getAchievementsByModule(moduleId: string): Promise<Achievement[]> {
    const snapshot = await this.achievements
      .where('moduleId', '==', moduleId)
      .get();
    const achievements = snapshot.docs.map(doc => docToAchievement(doc)!);
    return achievements.sort((a, b) => a.orderIndex - b.orderIndex);
  }

  async getAchievementsByInstitution(institutionId: string): Promise<Achievement[]> {
    const snapshot = await this.achievements
      .where('institutionId', '==', institutionId)
      .get();
    const achievements = snapshot.docs.map(doc => docToAchievement(doc)!);
    return achievements.sort((a, b) => a.orderIndex - b.orderIndex);
  }

  async createAchievement(insertAchievement: InsertAchievement): Promise<Achievement> {
    const id = uuidv4();
    const data = {
      ...insertAchievement,
      orderIndex: insertAchievement.orderIndex ?? 0,
      createdAt: new Date()
    };
    await this.achievements.doc(id).set(data);
    return {
      id,
      moduleId: data.moduleId,
      institutionId: data.institutionId,
      name: data.name,
      orderIndex: data.orderIndex,
      createdAt: data.createdAt
    };
  }

  async updateAchievement(id: string, updates: Partial<Achievement>): Promise<Achievement | undefined> {
    const docRef = this.achievements.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return undefined;
    
    await docRef.update(updates);
    const updatedDoc = await docRef.get();
    return docToAchievement(updatedDoc);
  }

  async deleteAchievement(id: string): Promise<boolean> {
    const doc = await this.achievements.doc(id).get();
    if (!doc.exists) return false;
    
    await this.achievements.doc(id).delete();
    return true;
  }

  async deleteAllModulesAndAchievements(institutionId: string): Promise<void> {
    const achievementsSnapshot = await this.achievements
      .where('institutionId', '==', institutionId)
      .get();
    
    const modulesSnapshot = await this.modules
      .where('institutionId', '==', institutionId)
      .get();
    
    const studentsSnapshot = await this.students
      .where('institutionId', '==', institutionId)
      .get();
    
    const batch = db.batch();
    
    achievementsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
    modulesSnapshot.docs.forEach(doc => batch.delete(doc.ref));
    
    studentsSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        completedAchievementIds: [],
        monthlyProgress: {}
      });
    });
    
    await batch.commit();
  }

  async importABAData(institutionId: string): Promise<{ modulesCreated: number; achievementsCreated: number }> {
    let modulesCreated = 0;
    let achievementsCreated = 0;

    for (let i = 0; i < ABA_MODULES.length; i++) {
      const abaModule = ABA_MODULES[i];
      const color = MODULE_COLORS[i % MODULE_COLORS.length];

      const moduleId = uuidv4();
      await this.modules.doc(moduleId).set({
        institutionId,
        name: abaModule.name,
        color,
        orderIndex: i,
        createdAt: new Date()
      });
      
      modulesCreated++;

      for (let j = 0; j < abaModule.achievements.length; j++) {
        const achievementId = uuidv4();
        await this.achievements.doc(achievementId).set({
          institutionId,
          moduleId,
          name: abaModule.achievements[j],
          orderIndex: j,
          createdAt: new Date()
        });
        achievementsCreated++;
      }
    }

    return { modulesCreated, achievementsCreated };
  }
}

export const storage = new FirebaseStorage();
