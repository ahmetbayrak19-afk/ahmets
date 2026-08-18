import { arrayUnion, doc, serverTimestamp, updateDoc } from 'firebase/firestore';

import { db } from '@/firebase';

export const getCurrentTeacherAssociationUpdate = () => {
  const teacherName = localStorage.getItem('kazanim-takip-teacher-name')?.trim();
  if (!teacherName) throw new Error('Öğretmen bilgisi bulunamadı.');

  return {
    associatedTeacherIds: arrayUnion(teacherName),
    lastUpdatedBy: teacherName,
    lastUpdatedAt: serverTimestamp(),
  };
};

export const associateCurrentTeacherWithStudent = async (studentId: string) => {
  const institutionId = localStorage.getItem('kazanim-takip-institution-id');
  if (!institutionId) throw new Error('Kurum bilgisi bulunamadı.');
  if (!studentId) throw new Error('Öğrenci bilgisi bulunamadı.');

  await updateDoc(
    doc(db, 'institutions', institutionId, 'students', studentId),
    getCurrentTeacherAssociationUpdate(),
  );
};
