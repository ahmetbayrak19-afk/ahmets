import { useState, useEffect } from 'react';
import { db, auth, storage } from '../firebase'; 
import { collection, onSnapshot, doc, addDoc, deleteDoc, query, orderBy, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'; // 🔥 deleteObject eklendi

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

  const addStudent = async (name: string, age: string, diagnosis: string, photoFile: File | null = null) => {
    const instId = localStorage.getItem("kazanim-takip-institution-id");
    const tName = localStorage.getItem("kazanim-takip-teacher-name");
    if (!instId || !name.trim()) return { success: false, message: "Hata" };
    
    try {
      let photoUrl = null;

      if (photoFile) {
        const fileName = `${Date.now()}_${photoFile.name}`;
        const storageRef = ref(storage, `institutions/${instId}/students/${fileName}`);
        
        await uploadBytes(storageRef, photoFile);
        photoUrl = await getDownloadURL(storageRef); 
      }

      await addDoc(collection(db, "institutions", instId, "students"), {
        name: name.trim(),
        age: age.trim(),
        diagnosis: diagnosis.trim(),
        photoUrl: photoUrl, 
        createdBy: tName,
        associatedTeacherIds: [tName],
        createdAt: new Date().toISOString()
      });
      return { success: true, message: "Öğrenci eklendi" };
    } catch (e) { 
      console.error(e);
      return { success: false, message: "Başarısız" }; 
    }
  };

  // 🔥 YENİ: Hem Firestore kaydını hem de Storage'daki fotoğrafı silen fonksiyon
  const deleteStudent = async (id: string) => {
    const instId = localStorage.getItem("kazanim-takip-institution-id");
    if (!instId) return;

    try {
      // 1. Fotoğraf URL'sini bulmak için öğrenci verisini çek
      const studentDocRef = doc(db, "institutions", instId, "students", id);
      const studentSnap = await getDoc(studentDocRef);

      if (studentSnap.exists()) {
        const studentData = studentSnap.data();

        // 2. Önce Firestore'dan metin verilerini sil
        await deleteDoc(studentDocRef);

        // 3. Eğer kayıtlı bir fotoğraf URL'si varsa, Firebase Storage'dan dosyayı sil
        if (studentData.photoUrl) {
          const photoRef = ref(storage, studentData.photoUrl);
          await deleteObject(photoRef).catch(err => console.error("Fotoğraf silinemedi:", err));
        }
      }
    } catch (error) {
      console.error("Öğrenci silinirken hata oluştu:", error);
    }
  };

  const deleteTeacher = async (teacherId: string) => {
    const instId = localStorage.getItem("kazanim-takip-institution-id");
    if (instId) await deleteDoc(doc(db, "institutions", instId, "teachers", teacherId));
  };

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
    toggleTeacherApproval,
    logoutTeacher 
  };
    }
