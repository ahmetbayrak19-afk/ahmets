import { 
  collection, getDocs, addDoc, updateDoc, deleteDoc, 
  doc, query, where, getDoc 
} from "firebase/firestore";
import { db, auth } from "../firebase";

// YARDIMCI: Kurum ID'sini güvenli şekilde al
const getInstitutionId = () => {
  // Önce Auth'a bak, yoksa LocalStorage'a bak (Senin login yapına uyumlu)
  return auth.currentUser?.uid || localStorage.getItem("kazanim-takip-institution-id");
};

// --- KURUM & OTURUM ---
export async function loginInstitution(name: string, password: string) {
  const user = auth.currentUser;
  if (!user) throw new Error("Giriş başarısız");
  return { id: user.uid, name };
}

export async function registerInstitution(name: string, password: string) {
  const user = auth.currentUser;
  if (!user) throw new Error("Kayıt başarısız");
  return { id: user.uid, name };
}

export async function getCurrentSession() {
  const user = auth.currentUser;
  return {
    institutionId: user?.uid || localStorage.getItem("kazanim-takip-institution-id"),
    institutionName: user?.displayName || null,
    teacherId: localStorage.getItem('kazanim-takip-current-teacher-id'),
    teacherName: localStorage.getItem('kazanim-takip-last-teacher-name') || localStorage.getItem('kazanim-takip-teacher-name')
  };
}

// --- ÖĞRETMEN İŞLEMLERİ ---
export async function fetchRegisteredTeachers() {
  const instId = getInstitutionId();
  if (!instId) return [];

  // DÜZELTİLDİ: Artık kurumun altındaki teachers klasörüne bakıyor
  const teachersRef = collection(db, "institutions", instId, "teachers");
  const snap = await getDocs(teachersRef);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function deleteTeacher(id: string): Promise<void> {
  const instId = getInstitutionId();
  if (!instId) return;

  // DÜZELTİLDİ: Kurumun altından siliyor
  await deleteDoc(doc(db, "institutions", instId, "teachers", id));
}

export async function loginTeacher(name: string) {
  const instId = getInstitutionId();
  if (!instId) throw new Error("Önce kurum girişi yapmalısınız");
  
  // DÜZELTİLDİ: Kurumun altındaki öğretmeni arıyor
  const teacherRef = doc(db, "institutions", instId, "teachers", name.trim());
  const docSnap = await getDoc(teacherRef);
  
  // Eğer öğretmen yoksa otomatik oluştur (Senin TeacherLogin mantığına uygun)
  if (!docSnap.exists()) {
    const newT = { 
      name: name.trim(), 
      createdAt: new Date().toISOString() 
    };
    await addDoc(collection(db, "institutions", instId, "teachers"), newT);
    return { id: name.trim(), ...newT }; // ID olarak ismini kullandığın için
  }
  
  return { id: docSnap.id, ...docSnap.data() };
}

// --- ÖĞRENCİ İŞLEMLERİ ---
export async function fetchStudents() {
  const instId = getInstitutionId();
  if (!instId) return [];

  // DÜZELTİLDİ: Kurumun altındaki students klasörüne bakıyor
  const studentsRef = collection(db, "institutions", instId, "students");
  const snap = await getDocs(studentsRef);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function createStudent(student: { name: string }) {
  const instId = getInstitutionId();
  if (!instId) throw new Error("Oturum bulunamadı");
  
  // DÜZELTİLDİ: Kurumun altına ekliyor
  const d = await addDoc(collection(db, "institutions", instId, "students"), { 
    ...student, 
    createdBy: localStorage.getItem('kazanim-takip-teacher-name'), // Hangi hoca ekledi
    institutionId: instId, 
    monthlyProgress: {},
    createdAt: new Date().toISOString()
  });
  return { id: d.id, ...student };
}

export async function updateStudent(id: string, updates: any) {
  const instId = getInstitutionId();
  if (!instId) return;

  // DÜZELTİLDİ: Kurumun altındaki öğrenciyi güncelliyor
  await updateDoc(doc(db, "institutions", instId, "students", id), updates);
  return { id, ...updates };
}

export async function deleteStudent(id: string): Promise<void> {
  const instId = getInstitutionId();
  if (!instId) return;

  // DÜZELTİLDİ: Kurumun altından siliyor
  await deleteDoc(doc(db, "institutions", instId, "students", id));
}

// --- DİĞER FONKSİYONLAR ---
export async function logoutTeacher() { 
  localStorage.removeItem("kazanim-takip-teacher-name");
  // Auth'dan çıkış yapmıyoruz çünkü kurum oturumu açık kalmalı (Kiosk mantığı)
}

export async function logoutInstitution() {
  await auth.signOut(); 
  localStorage.clear(); 
    }
