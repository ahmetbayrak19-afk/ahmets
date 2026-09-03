import { useState, useEffect } from 'react';
import { db, auth, storage } from '../firebase'; 
import {
  collection,
  onSnapshot,
  doc,
  addDoc,
  deleteDoc,
  deleteField,
  setDoc,
  query,
  where,
  limit,
  orderBy,
  getDoc,
  getDocs,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'; // 🔥 deleteObject eklendi

export function useStudentData() {
  const [students, setStudents] = useState<any[]>([]);
  const [archivedStudents, setArchivedStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [currentTeacher, setCurrentTeacher] = useState<any>(null);
  const [currentInstitution, setCurrentInstitution] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;
    let unsubStudents: (() => void) | undefined;
    let unsubTeachers: (() => void) | undefined;
    let unsubArchive: (() => void) | undefined;

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
        if (!isActive) return;
        
        if (docSnap.exists()) {
          setCurrentTeacher({ id: docSnap.id, ...docSnap.data() });
          setCurrentInstitution({ id: instId });
          
          const studentsRef = collection(db, "institutions", instId, "students");
          const qStudents = query(studentsRef, orderBy("createdAt", "desc"));
          unsubStudents = onSnapshot(qStudents, (snapshot) => {
            setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          });

          const teachersRef = collection(db, "institutions", instId, "teachers");
          unsubTeachers = onSnapshot(teachersRef, (snapshot) => {
            setTeachers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          });

          if (teacherName.toLocaleLowerCase('tr-TR') === 'admin') {
            const archiveRef = collection(db, "institutions", instId, "archivedStudents");
            unsubArchive = onSnapshot(archiveRef, (snapshot) => {
              setArchivedStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            });
          }

          setIsLoading(false);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error(error);
        setIsLoading(false);
      }
    };
    loadData();

    return () => {
      isActive = false;
      unsubStudents?.();
      unsubTeachers?.();
      unsubArchive?.();
    };
  }, []);

  const normalizeStudentName = (name: string) =>
    name.trim().replace(/\s+/g, ' ').toLocaleLowerCase('tr-TR');

  const findArchivedStudentByName = async (name: string) => {
    const instId = localStorage.getItem("kazanim-takip-institution-id");
    if (!instId || !name.trim()) return null;

    const archiveMatch = await getDocs(query(
      collection(db, "institutions", instId, "archivedStudents"),
      where("normalizedName", "==", normalizeStudentName(name)),
      limit(1),
    ));
    const match = archiveMatch.docs[0];
    return match ? { id: match.id, ...match.data() } : null;
  };

  const addStudent = async (name: string, age: string, diagnosis: string, photoFile: File | null = null) => {
    const instId = localStorage.getItem("kazanim-takip-institution-id");
    const tName = localStorage.getItem("kazanim-takip-teacher-name");
    if (!instId || !name.trim()) return { success: false, message: "Hata" };
    
    try {
      const normalizedName = normalizeStudentName(name);
      const archiveMatch = await findArchivedStudentByName(name);
      if (archiveMatch) {
        return {
          success: false,
          reason: "archived",
          message: "Bu öğrenci kurumun eski öğrencisi ve arşiv kaydında bulunuyor.",
        };
      }

      let photoUrl = null;

      if (photoFile) {
        const fileName = `${Date.now()}_${photoFile.name}`;
        const storageRef = ref(storage, `institutions/${instId}/students/${fileName}`);
        
        await uploadBytes(storageRef, photoFile);
        photoUrl = await getDownloadURL(storageRef); 
      }

      const studentRef = await addDoc(collection(db, "institutions", instId, "students"), {
        name: name.trim(),
        normalizedName,
        age: age.trim(),
        ageReferenceYear: new Date().getFullYear(),
        diagnosis: diagnosis.trim(),
        photoUrl: photoUrl, 
        createdBy: tName,
        associatedTeacherIds: [tName],
        createdAt: new Date().toISOString()
      });
      return { success: true, message: "Öğrenci eklendi", studentId: studentRef.id };
    } catch (e) { 
      console.error(e);
      return { success: false, message: "Başarısız" }; 
    }
  };

  const getSession = () => ({
    instId: localStorage.getItem("kazanim-takip-institution-id"),
    teacherName: localStorage.getItem("kazanim-takip-teacher-name"),
  });

  const getStudentRef = (instId: string, studentId: string) =>
    doc(db, "institutions", instId, "students", studentId);

  const updateStudentProfile = async (id: string, values: {
    name: string; age: string; diagnosis: string; photoFile: File | null; removePhoto: boolean;
  }) => {
    const { instId, teacherName } = getSession();
    if (!instId || !teacherName) return { success: false, message: 'Oturum bulunamadı.' };
    if (!values.name.trim() || !values.age.trim() || !Number.isInteger(Number(values.age)) || Number(values.age) < 0) {
      return { success: false, message: 'İsim ve geçerli bir yaş girin.' };
    }
    try {
      const studentRef = getStudentRef(instId, id);
      const snapshot = await getDoc(studentRef);
      if (!snapshot.exists()) return { success: false, message: 'Öğrenci bulunamadı.' };
      const data = snapshot.data();
      const allowed = teacherName.toLocaleLowerCase('tr-TR') === 'admin'
        || data.createdBy === teacherName || (data.associatedTeacherIds || []).includes(teacherName);
      if (!allowed || data.deletionStatus === 'pending') return { success: false, message: 'Bu öğrenciyi düzenleme yetkiniz yok veya silme talebi bekliyor.' };
      const normalizedName = normalizeStudentName(values.name);
      if (normalizedName !== normalizeStudentName(data.name || '')) {
        const matches = await getDocs(collection(db, 'institutions', instId, 'students'));
        if (matches.docs.some(item => item.id !== id && normalizeStudentName(item.data().name || '') === normalizedName)
          || await findArchivedStudentByName(values.name)) {
          return { success: false, message: 'Bu isimde aktif veya arşivlenmiş öğrenci var.' };
        }
      }
      let photoUrl = values.removePhoto ? null : (data.photoUrl || null);
      if (values.photoFile) {
        const photoRef = ref(storage, `institutions/${instId}/students/${id}_${Date.now()}_${values.photoFile.name}`);
        await uploadBytes(photoRef, values.photoFile);
        photoUrl = await getDownloadURL(photoRef);
      }
      await updateDoc(studentRef, {
        name: values.name.trim(), normalizedName, age: values.age.trim(),
        ageReferenceYear: new Date().getFullYear(), diagnosis: values.diagnosis.trim(), photoUrl,
        lastUpdatedBy: teacherName, lastUpdatedAt: serverTimestamp(),
      });
      return { success: true, message: 'Öğrenci bilgileri güncellendi.' };
    } catch (error) {
      console.error('Öğrenci bilgileri güncellenemedi:', error);
      return { success: false, message: 'Kaydedilemedi. Bağlantınızı kontrol edip tekrar deneyin.' };
    }
  };

  const updateStudentTeachers = async (studentId: string, teacherNames: string[]) => {
    const { instId, teacherName } = getSession();
    if (!instId || teacherName?.toLocaleLowerCase('tr-TR') !== 'admin') return false;

    try {
      const studentDocRef = getStudentRef(instId, studentId);
      const studentSnap = await getDoc(studentDocRef);
      if (!studentSnap.exists()) return false;

      const cleanTeacherNames = Array.from(new Set(
        teacherNames.map(name => name.trim()).filter(Boolean),
      ));
      const existingCreatedBy = studentSnap.data().createdBy;

      await updateDoc(studentDocRef, {
        associatedTeacherIds: cleanTeacherNames,
        createdBy: existingCreatedBy && cleanTeacherNames.includes(existingCreatedBy)
          ? existingCreatedBy
          : null,
        lastUpdatedBy: teacherName,
        lastUpdatedAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.error("Öğretmen kadrosu güncellenirken hata oluştu:", error);
      return false;
    }
  };

  const leaveStudent = async (studentId: string) => {
    const { instId, teacherName } = getSession();
    if (!instId || !teacherName) return false;

    try {
      const studentDocRef = getStudentRef(instId, studentId);
      const studentSnap = await getDoc(studentDocRef);
      if (!studentSnap.exists()) return false;

      const studentData = studentSnap.data();
      const remainingTeachers = (studentData.associatedTeacherIds || [])
        .filter((name: string) => name !== teacherName);

      await updateDoc(studentDocRef, {
        associatedTeacherIds: remainingTeachers,
        createdBy: studentData.createdBy === teacherName ? null : (studentData.createdBy || null),
        lastUpdatedBy: teacherName,
        lastUpdatedAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.error("Öğrenci kadrosundan ayrılırken hata oluştu:", error);
      return false;
    }
  };

  const requestStudentDeletion = async (studentId: string) => {
    const { instId, teacherName } = getSession();
    if (!instId || !teacherName || teacherName.toLocaleLowerCase('tr-TR') === 'admin') return false;

    try {
      const studentDocRef = getStudentRef(instId, studentId);
      const studentSnap = await getDoc(studentDocRef);
      if (!studentSnap.exists()) return false;

      const studentData = studentSnap.data();
      if (!(studentData.associatedTeacherIds || []).includes(teacherName)
        || studentData.deletionStatus === 'pending') return false;

      await updateDoc(studentDocRef, {
        deletionStatus: 'pending',
        deletionRequestedBy: teacherName,
        deletionRequestedAt: serverTimestamp(),
        lastUpdatedBy: teacherName,
        lastUpdatedAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.error("Öğrenci silme talebi oluşturulurken hata oluştu:", error);
      return false;
    }
  };

  const rejectStudentDeletion = async (studentId: string) => {
    const { instId, teacherName } = getSession();
    if (!instId || teacherName?.toLocaleLowerCase('tr-TR') !== 'admin') return false;

    try {
      await updateDoc(getStudentRef(instId, studentId), {
        deletionStatus: deleteField(),
        deletionRequestedBy: deleteField(),
        deletionRequestedAt: deleteField(),
        deletionReviewedBy: teacherName,
        deletionReviewedAt: serverTimestamp(),
        lastUpdatedBy: teacherName,
        lastUpdatedAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.error("Öğrenci silme talebi reddedilirken hata oluştu:", error);
      return false;
    }
  };

  // Yalnızca Admin kullanır. Ad ve fotoğraf arşive taşınır; öğrenciye ait çalışma kayıtları temizlenir.
  const deleteStudent = async (id: string) => {
    const { instId, teacherName } = getSession();
    if (!instId || teacherName?.toLocaleLowerCase('tr-TR') !== 'admin') return false;

    const studentDocRef = getStudentRef(instId, id);
    const archivedStudentRef = doc(db, "institutions", instId, "archivedStudents", id);
    let archiveCreated = false;

    try {
      const studentSnap = await getDoc(studentDocRef);
      if (!studentSnap.exists()) return false;

      const studentData = studentSnap.data();
      await setDoc(archivedStudentRef, {
        name: String(studentData.name || "İsimsiz Öğrenci"),
        normalizedName: String(studentData.name || "")
          .trim()
          .replace(/\s+/g, ' ')
          .toLocaleLowerCase('tr-TR'),
        photoUrl: studentData.photoUrl || null,
        archivedBy: teacherName,
        archivedAt: serverTimestamp(),
      });
      archiveCreated = true;

      const childCollectionNames = ['assessments', 'profiles', 'knownPeople', 'talk_cards', 'ifade'];

      for (const collectionName of childCollectionNames) {
        const childSnapshot = await getDocs(collection(studentDocRef, collectionName));
        for (const childDoc of childSnapshot.docs) {
          const childData = childDoc.data();
          if (childData.storagePath) {
            await deleteObject(ref(storage, childData.storagePath)).catch(error => {
              console.error(`${collectionName} dosyası silinemedi:`, error);
            });
          }
          await deleteDoc(childDoc.ref);
        }
      }

      await deleteDoc(studentDocRef);
      return true;
    } catch (error) {
      console.error("Öğrenci silinirken hata oluştu:", error);
      if (archiveCreated) {
        const activeStudent = await getDoc(studentDocRef).catch(() => null);
        if (activeStudent?.exists()) {
          await deleteDoc(archivedStudentRef).catch(() => {});
        }
      }
      return false;
    }
  };

  const approveStudentDeletion = async (studentId: string) => deleteStudent(studentId);

  const restoreArchivedStudent = async (studentId: string) => {
    const { instId, teacherName } = getSession();
    if (!instId || teacherName?.toLocaleLowerCase('tr-TR') !== 'admin') return false;

    try {
      const archivedStudentRef = doc(db, "institutions", instId, "archivedStudents", studentId);
      const archivedStudentSnap = await getDoc(archivedStudentRef);
      if (!archivedStudentSnap.exists()) return false;

      const archivedStudent = archivedStudentSnap.data();
      const normalizedName = String(archivedStudent.normalizedName || archivedStudent.name || '')
        .trim()
        .replace(/\s+/g, ' ')
        .toLocaleLowerCase('tr-TR');
      const activeStudents = await getDocs(collection(db, "institutions", instId, "students"));
      const hasActiveNameMatch = activeStudents.docs.some(studentDoc => {
        const activeName = String(studentDoc.data().name || '')
          .trim()
          .replace(/\s+/g, ' ')
          .toLocaleLowerCase('tr-TR');
        return activeName === normalizedName;
      });
      if (hasActiveNameMatch) return false;

      const restoreBatch = writeBatch(db);
      restoreBatch.set(getStudentRef(instId, studentId), {
        name: String(archivedStudent.name || "İsimsiz Öğrenci"),
        normalizedName,
        age: "",
        diagnosis: "",
        photoUrl: archivedStudent.photoUrl || null,
        createdBy: null,
        associatedTeacherIds: [],
        createdAt: new Date().toISOString(),
        restoredFromArchive: true,
        restoredBy: teacherName,
        restoredAt: serverTimestamp(),
      });
      restoreBatch.delete(archivedStudentRef);
      await restoreBatch.commit();
      return true;
    } catch (error) {
      console.error("Öğrenci arşivden geri getirilirken hata oluştu:", error);
      return false;
    }
  };

  const deleteTeacher = async (teacherId: string) => {
    const { instId, teacherName } = getSession();
    if (!instId || teacherName?.toLocaleLowerCase('tr-TR') !== 'admin') return false;

    try {
      const teacherDocRef = doc(db, "institutions", instId, "teachers", teacherId);
      const teacherSnap = await getDoc(teacherDocRef);
      const deletedTeacherName = teacherSnap.exists()
        ? String(teacherSnap.data().name || teacherSnap.id)
        : teacherId;

      const studentSnapshot = await getDocs(collection(db, "institutions", instId, "students"));
      const affectedStudents = studentSnapshot.docs.filter(studentDoc => {
        const data = studentDoc.data();
        return data.createdBy === deletedTeacherName
          || (data.associatedTeacherIds || []).includes(deletedTeacherName);
      });

      await Promise.all(affectedStudents.map(studentDoc => {
        const data = studentDoc.data();
        return updateDoc(studentDoc.ref, {
          associatedTeacherIds: (data.associatedTeacherIds || [])
            .filter((name: string) => name !== deletedTeacherName),
          createdBy: data.createdBy === deletedTeacherName ? null : (data.createdBy || null),
          lastUpdatedBy: teacherName,
          lastUpdatedAt: serverTimestamp(),
        });
      }));

      await deleteDoc(teacherDocRef);
      return true;
    } catch (error) {
      console.error("Öğretmen silinirken hata oluştu:", error);
      return false;
    }
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
    archivedStudents,
    teachers, 
    currentTeacher, 
    currentInstitution, 
    isLoading, 
    addStudent,
    updateStudentProfile,
    findArchivedStudentByName,
    deleteStudent, 
    approveStudentDeletion,
    restoreArchivedStudent,
    rejectStudentDeletion,
    requestStudentDeletion,
    updateStudentTeachers,
    leaveStudent,
    deleteTeacher, 
    toggleTeacherApproval,
    logoutTeacher 
  };
    }
