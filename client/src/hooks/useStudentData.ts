import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, onSnapshot, doc, addDoc, deleteDoc, query, orderBy, getDoc, updateDoc } from 'firebase/firestore';

export function useStudentData() {
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [currentTeacher, setCurrentTeacher] = useState<any>(null);
  const [currentInstitution, setCurrentInstitution] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const instId = localStorage.getItem("kazanim-takip-institution-id");
      const teacherName = localStorage.getItem("kazanim-takip-teacher-name"); 

      if (!instId || !teacherName) {
        setIsLoading(false);
        return;
      }

      try {
        const teacherRef = doc(db, "institutions", instId, "teachers", teacherName);
        const docSnap = await getDoc(teacherRef);
        
        if (docSnap.exists()) {
          setCurrentTeacher({ id: docSnap.id, ...docSnap.data() });
          setCurrentInstitution({ id: instId });
          
          const studentsRef = collection(db, "institutions", instId, "students");
          const qStudents = query(studentsRef, orderBy("createdAt", "desc"));
          const unsubStudents = onSnapshot(qStudents, (snapshot) => {
            setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          });

          const teachersRef = collection(db, "institutions", instId, "teachers");
          const unsubTeachers = onSnapshot(teachersRef, (snapshot) => {
            setTeachers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          });

          setIsLoading(false);
          return () => { unsubStudents(); unsubTeachers(); };
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error(error);
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const addStudent = async (name: string, age: string, diagnosis: string) => {
    const instId = localStorage.getItem("kazanim-takip-institution-id");
    const tName = localStorage.getItem("kazanim-takip-teacher-name");
    if (!instId || !name.trim()) return { success: false, message: "Hata" };
    
    try {
      await addDoc(collection(db, "institutions", instId, "students"), {
        name: name.trim(),
        age: age.trim(),
        diagnosis: diagnosis.trim(),
        createdBy: tName,
        associatedTeacherIds: [tName],
        createdAt: new Date().toISOString()
      });
      return { success: true, message: "Öğrenci eklendi" };
    } catch (e) { return { success: false, message: "Başarısız" }; }
  };

  const deleteStudent = async (id: string) => {
    const instId = localStorage.getItem("kazanim-takip-institution-id");
    if (instId) await deleteDoc(doc(db, "institutions", instId, "students", id));
  };

  const deleteTeacher = async (teacherId: string) => {
    const instId = localStorage.getItem("kazanim-takip-institution-id");
    if (instId) await deleteDoc(doc(db, "institutions", instId, "teachers", teacherId));
  };

  // 🔥 YENİ EKLENDİ: Öğretmen Onaylama/Reddetme Fonksiyonu
  const toggleTeacherApproval = async (teacherId: string, isApproved: boolean) => {
    const instId = localStorage.getItem("kazanim-takip-institution-id");
    if (instId) {
        await updateDoc(doc(db, "institutions", instId, "teachers", teacherId), {
            isApproved: isApproved
        });
    }
  }

  const logoutTeacher = async () => {
    localStorage.removeItem("kazanim-takip-teacher-name"); 
    await auth.signOut();
  };

  return { 
    students, 
    teachers, 
    currentTeacher, 
    currentInstitution, 
    isLoading, 
    addStudent, 
    deleteStudent, 
    deleteTeacher, 
    toggleTeacherApproval, // Bunu dışarı aktardık
    logoutTeacher 
  };
    }
    
