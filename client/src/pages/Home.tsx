import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useStudentData } from '@/hooks/useStudentData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, LogOut, Trash2, UserCircle2, ShieldCheck, Loader2, Users, AlertTriangle, Baby, Stethoscope, ClipboardCheck, BookOpen, AlertCircle, Lock, CheckCircle, UserX, ShieldAlert, Camera, X, BellRing, Archive, RotateCcw, Menu, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, AlertDialogDescription
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { toast } from 'sonner';
import { twMerge } from 'tailwind-merge';
import LogoLoader from '@/components/LogoLoader';

export default function Home() {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [duplicateError, setDuplicateError] = useState(false);
  const [isPendingApproval, setIsPendingApproval] = useState(false);

  // --- FOTOĞRAF STATE'LERİ ---
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- EKSİK BİLGİ UYARISI İÇİN STATE ---
  const [missingFieldsWarning, setMissingFieldsWarning] = useState(false);
  const [missingMessage, setMissingMessage] = useState('');

  // --- DAHİLİ KAMERA (WEB RTC) STATE VE REFLERİ ---
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // --- INSTAGRAM TARZI BÜYÜK FOTOĞRAF GÖSTERİCİ STATE'İ ---
  const [viewingStudentPhoto, setViewingStudentPhoto] = useState<{url: string, name: string} | null>(null);

  // --- ÖĞRENCİ KADROSU VE SİLME ONAYI STATE'LERİ ---
  const [teacherAssignmentStudent, setTeacherAssignmentStudent] = useState<any | null>(null);
  const [selectedTeacherNames, setSelectedTeacherNames] = useState<string[]>([]);
  const [leaveStudentTarget, setLeaveStudentTarget] = useState<any | null>(null);
  const [deletionRequestsOpen, setDeletionRequestsOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [personnelDialogOpen, setPersonnelDialogOpen] = useState(false);
  const [archivedDuplicateStudent, setArchivedDuplicateStudent] = useState<any | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [exitWarningVisible, setExitWarningVisible] = useState(false);
  const [studentLeaveHintId, setStudentLeaveHintId] = useState<string | null>(null);
  const lastPendingRequestKey = useRef('');
  const exitWarningTimerRef = useRef<number | null>(null);
  const leaveHintPressTimerRef = useRef<number | null>(null);
  const leaveHintHideTimerRef = useRef<number | null>(null);
  const leaveHintTriggeredRef = useRef(false);

  const [_, setLocation] = useLocation();

  const {
    students,
    archivedStudents,
    teachers,
    addStudent,
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
    currentTeacher,
    isLoading,
  } = useStudentData();
  const isAdmin = currentTeacher?.name?.toLocaleLowerCase('tr-TR') === 'admin';
  const pendingDeletionRequests = students.filter(student => student.deletionStatus === 'pending');
  const pendingRequestKey = pendingDeletionRequests
    .map(student => `${student.id}:${student.deletionRequestedBy || ''}`)
    .sort()
    .join('|');

  useEffect(() => {
    if (!isAdmin || !pendingRequestKey) {
      lastPendingRequestKey.current = '';
      setDeletionRequestsOpen(false);
      return;
    }

    if (lastPendingRequestKey.current !== pendingRequestKey) {
      lastPendingRequestKey.current = pendingRequestKey;
      setDeletionRequestsOpen(true);
    }
  }, [isAdmin, pendingRequestKey]);

  // --- GÜVENLİK KONTROLÜ ---
  useEffect(() => {
    if (isLoading) return;
    if (!currentTeacher) {
      setLocation('/login');
      return;
    }

    if (currentTeacher.name.toLowerCase() === 'admin') {
        setIsPendingApproval(false);
        return;
    }

    const activeUserRecord = teachers.find(t => t.name === currentTeacher.name);

    if (!activeUserRecord && teachers.length > 0) {
        localStorage.removeItem("kazanim-takip-teacher-name");
        toast.error("Erişiminiz yönetici tarafından kaldırıldı.");
        setLocation('/login');
        return;
    }

    if (activeUserRecord && activeUserRecord.isApproved === false) {
        setIsPendingApproval(true);
    } else {
        setIsPendingApproval(false);
    }

  }, [isLoading, currentTeacher, teachers, setLocation]);

  // Modal kapandığında veya sayfa değiştiğinde kamerayı kapat
  useEffect(() => {
    return () => stopCameraStream();
  }, []);

  useEffect(() => {
    const showExitWarning = () => {
      setExitWarningVisible(true);
      if (exitWarningTimerRef.current !== null) {
        window.clearTimeout(exitWarningTimerRef.current);
      }
      exitWarningTimerRef.current = window.setTimeout(() => {
        setExitWarningVisible(false);
      }, 2000);
    };

    window.addEventListener('androidExitWarning', showExitWarning);
    return () => {
      window.removeEventListener('androidExitWarning', showExitWarning);
      if (exitWarningTimerRef.current !== null) window.clearTimeout(exitWarningTimerRef.current);
      if (leaveHintPressTimerRef.current !== null) window.clearTimeout(leaveHintPressTimerRef.current);
      if (leaveHintHideTimerRef.current !== null) window.clearTimeout(leaveHintHideTimerRef.current);
    };
  }, []);

  const handleLogout = async () => {
    localStorage.removeItem("kazanim-takip-teacher-name");
    setLocation('/login');
  };

  const formatName = (fullName: string) => {
    if (!fullName) return "";
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 3) {
      const firstInitial = parts[0].charAt(0).toUpperCase() + '.';
      const rest = parts.slice(1).join(' ');
      return `${firstInitial} ${rest}`;
    }
    return fullName;
  };

  const normalizeNameForMatch = (value: string) =>
    value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('tr-TR');

  const clearStudentForm = () => {
    setName('');
    setAge('');
    setDiagnosis('');
    setPhotoFile(null);
    setPhotoPreview(null);
    setMissingFieldsWarning(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const closeArchivedDuplicateWarning = () => {
    setArchivedDuplicateStudent(null);
    clearStudentForm();
  };

  const startStudentLeaveLongPress = (studentId: string) => {
    if (leaveHintPressTimerRef.current !== null) {
      window.clearTimeout(leaveHintPressTimerRef.current);
    }
    leaveHintTriggeredRef.current = false;
    leaveHintPressTimerRef.current = window.setTimeout(() => {
      leaveHintTriggeredRef.current = true;
      setStudentLeaveHintId(studentId);
      if (leaveHintHideTimerRef.current !== null) {
        window.clearTimeout(leaveHintHideTimerRef.current);
      }
      leaveHintHideTimerRef.current = window.setTimeout(() => {
        setStudentLeaveHintId(null);
      }, 1500);
    }, 500);
  };

  const cancelStudentLeaveLongPress = () => {
    if (leaveHintPressTimerRef.current !== null) {
      window.clearTimeout(leaveHintPressTimerRef.current);
      leaveHintPressTimerRef.current = null;
    }
  };

  const handleStudentLeaveButtonClick = (student: any) => {
    if (leaveHintTriggeredRef.current) {
      leaveHintTriggeredRef.current = false;
      return;
    }
    setLeaveStudentTarget(student);
  };

  // --- DAHİLİ KAMERA FONKSİYONLARI ---
  const startCamera = async () => {
    setIsCameraModalOpen(true);
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        streamRef.current = stream;
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
        }
    } catch (err) {
        toast.error("Kamera açılamadı. Lütfen izinleri kontrol edin.");
        setIsCameraModalOpen(false);
    }
  };

  const stopCameraStream = () => {
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }
    setIsCameraModalOpen(false);
  };

  // Canvas ile videodan görüntüyü alıp 512x512 olarak optimize etme
  const capturePhotoFromVideo = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');

    // Kameradan gelen asıl boyut
    const minDimension = Math.min(video.videoWidth, video.videoHeight);

    // OPTİMİZASYON: Çıktı boyutunu 512x512 piksele kilitliyoruz
    const TARGET_SIZE = 512;
    canvas.width = TARGET_SIZE;
    canvas.height = TARGET_SIZE;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Görüntüyü merkeze al ve hedef boyuta (512x512) sıkıştırarak çiz
    const startX = (video.videoWidth - minDimension) / 2;
    const startY = (video.videoHeight - minDimension) / 2;

    ctx.drawImage(video, startX, startY, minDimension, minDimension, 0, 0, TARGET_SIZE, TARGET_SIZE);

    // Ekranda göstermek için Base64 al (Kalite %80)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setPhotoPreview(dataUrl);

    // Firebase Storage'a yüklemek için Blob ve File objesine çevir
    canvas.toBlob((blob) => {
        if (blob) {
            const file = new File([blob], `photo_${Date.now()}.jpg`, { type: "image/jpeg" });
            setPhotoFile(file);
        }
    }, 'image/jpeg', 0.8);

    stopCameraStream();
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // --- KAYIT İŞLEMLERİ ---
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();

    if(!name.trim() || !age.trim()) {
        toast.warning("İsim ve Yaş zorunludur!");
        return;
    }

    const normalizedName = normalizeNameForMatch(name);
    const isDuplicate = students.some(s => normalizeNameForMatch(s.name) === normalizedName);
    if (isDuplicate) {
      setDuplicateError(true);
      return;
    }

    let archivedMatch = archivedStudents.find(student =>
      normalizeNameForMatch(student.name || '') === normalizedName,
    );
    if (!archivedMatch) {
      try {
        archivedMatch = await findArchivedStudentByName(name);
      } catch (error) {
        console.error('Arşiv kontrolü yapılamadı:', error);
        toast.error('Arşiv kontrolü yapılamadı. Lütfen tekrar deneyin.');
        return;
      }
    }
    if (archivedMatch) {
      setArchivedDuplicateStudent(archivedMatch);
      return;
    }

    const isDiagnosisMissing = !diagnosis.trim();
    const isPhotoMissing = !photoFile;

    if (isDiagnosisMissing || isPhotoMissing) {
        if (isDiagnosisMissing && isPhotoMissing) {
            setMissingMessage("tanı ve fotoğraf");
        } else if (isDiagnosisMissing) {
            setMissingMessage("tanı");
        } else {
            setMissingMessage("fotoğraf");
        }
        setMissingFieldsWarning(true);
        return;
    }

    await proceedToSaveStudent();
  };

  const proceedToSaveStudent = async () => {
    setMissingFieldsWarning(false);

    const loadingToast = toast.loading("Öğrenci kaydediliyor...");
    const result = await addStudent(name, age, diagnosis, photoFile);
    toast.dismiss(loadingToast);

    if (!result.success) {
      if ('reason' in result && result.reason === 'archived') {
        const archivedMatch = archivedStudents.find(student =>
          normalizeNameForMatch(student.name || '') === normalizeNameForMatch(name),
        );
        setArchivedDuplicateStudent(archivedMatch || { name: name.trim() });
      } else {
        toast.error(result.message || 'Öğrenci kaydedilemedi.');
      }
      return;
    }

    clearStudentForm();
    toast.success("Öğrenci başarıyla eklendi");
  };

  const openTeacherAssignment = (student: any) => {
    setTeacherAssignmentStudent(student);
    setSelectedTeacherNames(Array.from(new Set(student.associatedTeacherIds || [])) as string[]);
  };

  const toggleTeacherSelection = (teacherName: string) => {
    setSelectedTeacherNames(current => current.includes(teacherName)
      ? current.filter(name => name !== teacherName)
      : [...current, teacherName]);
  };

  const saveTeacherAssignment = async () => {
    if (!teacherAssignmentStudent) return;
    setBusyAction(`assign-${teacherAssignmentStudent.id}`);
    const success = await updateStudentTeachers(teacherAssignmentStudent.id, selectedTeacherNames);
    setBusyAction(null);

    if (success) {
      toast.success('Öğretmen kadrosu güncellendi.');
      setTeacherAssignmentStudent(null);
    } else {
      toast.error('Öğretmen kadrosu güncellenemedi.');
    }
  };

  const confirmLeaveStudent = async () => {
    if (!leaveStudentTarget) return;
    setBusyAction(`leave-${leaveStudentTarget.id}`);
    const success = await leaveStudent(leaveStudentTarget.id);
    setBusyAction(null);

    if (success) {
      toast.success(`${leaveStudentTarget.name} öğrenci listenizden çıkarıldı.`);
      setLeaveStudentTarget(null);
    } else {
      toast.error('Öğrenci listenizden çıkarılamadı.');
    }
  };

  const sendDeletionRequest = async (student: any) => {
    setBusyAction(`request-delete-${student.id}`);
    const success = await requestStudentDeletion(student.id);
    setBusyAction(null);
    success
      ? toast.success('Silme talebi Admin onayına gönderildi.')
      : toast.error('Silme talebi gönderilemedi.');
  };

  const handleDeletionDecision = async (studentId: string, approve: boolean) => {
    setBusyAction(`${approve ? 'approve' : 'reject'}-${studentId}`);
    const success = approve
      ? await approveStudentDeletion(studentId)
      : await rejectStudentDeletion(studentId);
    setBusyAction(null);

    if (success) {
      toast.success(approve ? 'Öğrenci arşive alındı.' : 'Silme talebi reddedildi. Öğrenci yeniden aktif.');
    } else {
      toast.error('İşlem tamamlanamadı.');
    }
  };

  const handleAdminDelete = async (studentId: string) => {
    setBusyAction(`delete-${studentId}`);
    const success = await deleteStudent(studentId);
    setBusyAction(null);
    success ? toast.success('Öğrenci arşive alındı.') : toast.error('Öğrenci arşive alınamadı.');
  };

  const handleRestoreArchivedStudent = async (student: any) => {
    setBusyAction(`restore-${student.id}`);
    const success = await restoreArchivedStudent(student.id);
    setBusyAction(null);
    success
      ? toast.success(`${student.name} aktif öğrenci listesine geri getirildi.`)
      : toast.error('Öğrenci geri getirilemedi. Aynı isimde aktif bir kayıt olabilir.');
  };

  const normalizedSearchTerm = searchTerm.trim().toLocaleLowerCase('tr-TR');
  const searchedStudents = students.filter(student => {
    if (!normalizedSearchTerm) return true;

    return [student.name, student.diagnosis, student.age].some(value =>
      String(value ?? '').toLocaleLowerCase('tr-TR').includes(normalizedSearchTerm),
    );
  });

  const isStudentMine = (s: any) => {
    const tName = currentTeacher?.name;
    return Boolean(tName && s.associatedTeacherIds?.includes(tName));
  };

  const allStudents = [...searchedStudents].sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  const myStudents = searchedStudents.filter(isStudentMine).sort((a, b) => a.name.localeCompare(b.name, 'tr'));

  const renderStudentGrid = (studentList: any[]) => (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4">
      {studentList.map((student) => {
        const isMyStudent = isStudentMine(student);
        const assignedTeacherNames = Array.from(new Set(
          (student.associatedTeacherIds || []).filter(Boolean),
        )) as string[];
        const activeTeachers = assignedTeacherNames.filter((teacherName: string) =>
          teachers.some(teacher => teacher.name === teacherName),
        );
        const hasValidTeacher = activeTeachers.length > 0;
        const isDeletionPending = student.deletionStatus === 'pending';

        const displayName = formatName(student.name);

        return (
          <motion.div
            key={student.id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={twMerge(
              "group relative overflow-hidden rounded-xl border transition-all p-4 flex flex-col justify-between gap-3",
              isDeletionPending
                ? "border-orange-500/50 bg-orange-950/10 opacity-60 grayscale-[35%]"
                : !hasValidTeacher
                ? "border-red-600/60 bg-red-900/10"
                : isMyStudent
                  ? "border-green-500/50 bg-green-500/5"
                  : "bg-slate-900 border-white/5"
            )}
          >
            <div className="flex justify-between items-start gap-2">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* PROFİL FOTOĞRAFI YUVARLAĞI (TIKLANABİLİR) */}
                    <div
                      onClick={() => student.photoUrl && setViewingStudentPhoto({url: student.photoUrl, name: student.name})}
                      className={twMerge(
                        "h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg border shadow-lg relative shrink-0 overflow-hidden",
                        student.photoUrl ? "cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all" : "",
                        !hasValidTeacher ? "bg-red-600 text-white border-red-400" :
                        isMyStudent ? "bg-green-500 text-black border-green-400" : "bg-blue-600/10 text-blue-500 border-blue-500/20"
                      )}
                    >
                      {student.photoUrl ? (
                        <img src={student.photoUrl} alt={student.name} className="w-full h-full object-cover" />
                      ) : (
                        student.name.charAt(0).toUpperCase()
                      )}

                      {!hasValidTeacher && (
                         <div className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5 border border-slate-900">
                           <AlertTriangle size={12} className="text-white" />
                         </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-base text-white leading-tight line-clamp-2 break-words" title={student.name}>
                        {displayName}
                      </h3>
                      {isDeletionPending && (
                        <p className="mt-1 text-[10px] font-semibold text-orange-300">Silme onayı bekliyor</p>
                      )}
                    </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <div className="bg-slate-950/80 border border-blue-500/20 rounded px-2 py-1 flex items-center gap-1.5 max-w-[90px]">
                       <Stethoscope size={10} className="text-blue-400 shrink-0"/>
                       <span className="text-[10px] text-blue-200 truncate font-medium">
                         {student.diagnosis || "Tanı yok"}
                       </span>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-900/50 px-2 py-0.5 rounded border border-white/5">
                        <Baby size={11} className="text-purple-400 shrink-0" />
                        <span className="text-[10px] text-slate-300 font-medium">{student.age || "-"} Yaş</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 pl-1">
                <div className="flex min-w-0 flex-1 flex-wrap gap-1">
                  {activeTeachers.map((tid: string, idx: number) => (
                    <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-white/5 truncate">
                      {tid}
                    </span>
                  ))}
                  {!hasValidTeacher && <span className="text-[10px] text-red-500 font-bold bg-red-900/20 px-1.5 py-0.5 rounded">Atama Bekliyor</span>}
                </div>

                {!isDeletionPending && !isAdmin && isMyStudent && (
                  <div className="relative ml-auto shrink-0">
                    <AnimatePresence>
                      {studentLeaveHintId === student.id && (
                        <motion.div
                          initial={{ opacity: 0, y: 4, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 4, scale: 0.96 }}
                          className="pointer-events-none absolute bottom-full right-0 z-20 mb-2 whitespace-nowrap rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-[11px] font-medium text-white shadow-xl"
                        >
                          Artık benim öğrencim değil
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Artık benim öğrencim değil"
                      className="h-8 w-8 select-none border border-slate-700/70 bg-slate-950 text-slate-500 hover:bg-orange-500/10 hover:text-orange-400"
                      onPointerDown={() => startStudentLeaveLongPress(student.id)}
                      onPointerUp={cancelStudentLeaveLongPress}
                      onPointerLeave={cancelStudentLeaveLongPress}
                      onPointerCancel={cancelStudentLeaveLongPress}
                      onContextMenu={(event) => event.preventDefault()}
                      onClick={() => handleStudentLeaveButtonClick(student)}
                    >
                      <UserX size={15} />
                    </Button>
                  </div>
                )}
            </div>

            {!isDeletionPending && isAdmin && (
              <Button
                type="button"
                variant="outline"
                className="h-8 w-full border-purple-500/30 bg-purple-500/5 text-[11px] text-purple-300 hover:bg-purple-500/15 hover:text-purple-200"
                onClick={() => openTeacherAssignment(student)}
              >
                <Users size={14} className="mr-2" /> Öğretmen Kadrosunu Düzenle
              </Button>
            )}

            <div className="flex items-center gap-2 mt-1">
                <Button disabled={isDeletionPending} variant="outline" className="flex-1 border-slate-700 bg-slate-950 hover:bg-slate-800 text-slate-300 h-10 text-xs font-semibold px-2 disabled:cursor-not-allowed" onClick={() => setLocation(`/assessment/${student.id}`)}>
                    <ClipboardCheck size={16} className="mr-2 text-orange-500"/> Değerlendirme
                </Button>
                <Button disabled={isDeletionPending} className="flex-1 bg-blue-600 hover:bg-blue-700 h-10 text-xs font-semibold text-white px-2 disabled:cursor-not-allowed" onClick={() => setLocation(`/student/${student.id}`)}>
                    <BookOpen size={16} className="mr-2"/> Çalışma
                </Button>
                {!isDeletionPending && (isAdmin || isMyStudent) && <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-500 hover:text-red-500 hover:bg-red-500/10 border border-white/5 bg-slate-900 shrink-0">
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-slate-900 border-slate-800 text-white">
                      <AlertDialogHeader>
                        <AlertDialogTitle>{isAdmin ? 'Öğrenci arşive alınsın mı?' : 'Silme talebi gönderilsin mi?'}</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-400">
                          {isAdmin
                            ? `${student.name} için çalışma ve değerlendirme kayıtları silinecek; arşivde yalnızca adı ve varsa fotoğrafı kalacak.`
                            : `${student.name} pasif duruma alınacak ve işlem Admin onayına gönderilecek.`}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-slate-800 text-white">İptal</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => isAdmin ? handleAdminDelete(student.id) : sendDeletionRequest(student)}
                          className="bg-red-600"
                          disabled={busyAction !== null}
                        >
                          {isAdmin ? 'Arşive Al' : 'Talebi Gönder'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>}
            </div>
          </motion.div>
        );
      })}
    </div>
  );

  if (isPendingApproval) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center text-white p-6 text-center">
        <div className="bg-orange-500/10 p-6 rounded-full border border-orange-500/20 mb-6 animate-pulse">
            <Lock className="w-16 h-16 text-orange-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2 text-white">Hesap Onay Bekliyor</h1>
        <p className="text-slate-400 max-w-md mb-8">
            Merhaba <strong>{currentTeacher?.name}</strong>, kurum girişini başarıyla yaptınız ancak
            öğrenci verilerine erişmek için <strong>Yönetici Onayı</strong> gerekmektedir.
        </p>
        <Button variant="outline" onClick={handleLogout} className="border-slate-700 hover:bg-slate-800 text-white">
            <LogOut className="mr-2 h-4 w-4" /> Çıkış Yap
        </Button>
      </div>
    );
  }

  if (isLoading) return <LogoLoader fullScreen />;

  if (!currentTeacher) return null;

  return (
    <div className="min-h-screen bg-[#020617] p-4 md:p-8 text-white font-sans">

      {/* --- INSTAGRAM TARZI FOTOĞRAF GÖRÜNTÜLEYİCİ (MODAL) --- */}
      <AnimatePresence>
        {viewingStudentPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setViewingStudentPhoto(null)} // Arkaplana tıklayınca kapat
            className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-sm cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              className="relative flex flex-col items-center max-w-sm w-full"
              onClick={(e) => e.stopPropagation()} // Resme tıklayınca kapanmasını engelle
            >
              <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-full border-4 border-slate-700 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.6)]">
                <img src={viewingStudentPhoto.url} alt={viewingStudentPhoto.name} className="w-full h-full object-cover" />
              </div>
              <h2 className="text-white text-3xl font-bold mt-8 text-center">{viewingStudentPhoto.name}</h2>

              <button
                data-android-back
                onClick={() => setViewingStudentPhoto(null)}
                className="mt-8 bg-slate-800 text-white p-4 rounded-full hover:bg-slate-700 hover:scale-105 active:scale-95 transition-all shadow-lg"
              >
                <X size={28} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {exitWarningVisible && (
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            className="pointer-events-none fixed bottom-6 left-1/2 z-[120] -translate-x-1/2 whitespace-nowrap rounded-full border border-slate-700 bg-slate-950/95 px-4 py-2.5 text-sm font-medium text-white shadow-2xl"
          >
            Çıkmak için geri tuşuna tekrar basın
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- ADMİN YÖNETİM MENÜSÜ --- */}
      <AnimatePresence>
        {isAdmin && adminMenuOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Yönetim menüsünü kapat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAdminMenuOpen(false)}
              className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed inset-y-0 left-0 z-[90] w-[86vw] max-w-sm border-r border-slate-700 bg-slate-950 p-5 shadow-2xl"
            >
              <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Yönetim Menüsü</h2>
                  <p className="mt-1 text-xs text-slate-500">Kurum yönetim seçenekleri</p>
                </div>
                <Button
                  data-android-back
                  variant="ghost"
                  size="icon"
                  onClick={() => setAdminMenuOpen(false)}
                  className="text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  <X size={21} />
                </Button>
              </div>

              <div className="space-y-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setAdminMenuOpen(false);
                    setArchiveOpen(true);
                  }}
                  className="h-14 w-full justify-start border-orange-500/30 bg-orange-500/5 text-orange-300 hover:bg-orange-500/15 hover:text-orange-200"
                >
                  <Archive className="mr-3 h-5 w-5" />
                  <span className="flex-1 text-left">Öğrenci Arşivi</span>
                  <span className="mr-2 rounded-full bg-orange-500/15 px-2 py-0.5 text-xs">{archivedStudents.length}</span>
                  <ChevronRight size={17} />
                </Button>

                <Button
                  variant="outline"
                  disabled={pendingDeletionRequests.length === 0}
                  onClick={() => {
                    setAdminMenuOpen(false);
                    setDeletionRequestsOpen(true);
                  }}
                  className="h-14 w-full justify-start border-red-500/30 bg-red-500/5 text-red-300 hover:bg-red-500/15 hover:text-red-200 disabled:opacity-45"
                >
                  <BellRing className="mr-3 h-5 w-5" />
                  <span className="flex-1 text-left">Silme Talepleri</span>
                  <span className="mr-2 rounded-full bg-red-500/15 px-2 py-0.5 text-xs">{pendingDeletionRequests.length}</span>
                  <ChevronRight size={17} />
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    setAdminMenuOpen(false);
                    setPersonnelDialogOpen(true);
                  }}
                  className="h-14 w-full justify-start border-purple-500/30 bg-purple-500/5 text-purple-300 hover:bg-purple-500/15 hover:text-purple-200"
                >
                  <Users className="mr-3 h-5 w-5" />
                  <span className="flex-1 text-left">Öğretmenler</span>
                  {teachers.some(t => t.isApproved === false) && (
                    <span className="mr-2 h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
                  )}
                  <ChevronRight size={17} />
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    setAdminMenuOpen(false);
                    setLocation('/admin');
                  }}
                  className="h-14 w-full justify-start border-blue-500/30 bg-blue-500/5 text-blue-300 hover:bg-blue-500/15 hover:text-blue-200"
                >
                  <ShieldCheck className="mr-3 h-5 w-5" />
                  <span className="flex-1 text-left">Müfredat</span>
                  <ChevronRight size={17} />
                </Button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* --- DAHİLİ KAMERA PENCERESİ (MODAL) --- */}
      <AnimatePresence>
        {isCameraModalOpen && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-sm"
            >
                <div className="w-full max-w-sm bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
                    <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                        <h3 className="font-bold flex items-center gap-2"><Camera size={18} className="text-blue-500"/> Fotoğraf Çek</h3>
                        <button onClick={stopCameraStream} className="p-1.5 bg-red-900/30 text-red-400 rounded-full hover:bg-red-500 hover:text-white transition-colors">
                            <X size={18} />
                        </button>
                    </div>

                    <div className="relative aspect-square w-full bg-black overflow-hidden flex items-center justify-center">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-4 border-2 border-white/30 rounded-full pointer-events-none border-dashed" />
                    </div>

                    <div className="p-4 bg-slate-950 flex justify-center">
                        <button
                            onClick={capturePhotoFromVideo}
                            className="w-16 h-16 bg-white rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
                        >
                            <div className="w-14 h-14 bg-white border-4 border-black rounded-full" />
                        </button>
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      <AlertDialog open={duplicateError} onOpenChange={setDuplicateError}>
        <AlertDialogContent className="bg-red-950 border-red-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-400"><AlertCircle className="h-6 w-6" /> Kayıt Yapılamadı</AlertDialogTitle>
            <AlertDialogDescription className="text-red-200 text-base mt-2">Bu isimde bir öğrenci zaten kayıtlı!</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogAction onClick={() => setDuplicateError(false)} className="bg-red-600 hover:bg-red-700 text-white border-0">Tamam</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(archivedDuplicateStudent)}
        onOpenChange={(open) => !open && closeArchivedDuplicateWarning()}
      >
        <AlertDialogContent className="bg-slate-900 border-orange-500/30 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-orange-400">
              <Archive className="h-6 w-6" /> Öğrenci Arşivde Bulundu
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300 text-base mt-2">
              <strong>{archivedDuplicateStudent?.name}</strong> kurumun eski öğrencisidir ve arşiv kaydında bulunmaktadır.
              {!isAdmin && ' Lütfen Admin’e danışınız.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {isAdmin ? (
              <>
                <AlertDialogCancel
                  className="bg-slate-800 text-white"
                  onClick={closeArchivedDuplicateWarning}
                >
                  Tamam
                </AlertDialogCancel>
                <AlertDialogAction
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                  onClick={() => {
                    closeArchivedDuplicateWarning();
                    setArchiveOpen(true);
                  }}
                >
                  Beni Arşive Yönlendir
                </AlertDialogAction>
              </>
            ) : (
              <AlertDialogAction
                onClick={closeArchivedDuplicateWarning}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                Tamam
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={missingFieldsWarning} onOpenChange={setMissingFieldsWarning}>
        <AlertDialogContent className="bg-slate-900 border-slate-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-orange-400">
              <AlertTriangle className="h-6 w-6" /> Eksik Bilgi
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300 text-base mt-2">
              Öğrenciye ait <strong>{missingMessage}</strong> girmediniz. Bu şekilde devam edip kaydetmek istiyor musunuz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 text-white border-0 hover:bg-slate-700">Vazgeç</AlertDialogCancel>
            <AlertDialogAction onClick={proceedToSaveStudent} className="bg-blue-600 hover:bg-blue-700 text-white border-0">Yine de Kaydet</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(leaveStudentTarget)}
        onOpenChange={(open) => !open && busyAction === null && setLeaveStudentTarget(null)}
      >
        <AlertDialogContent className="bg-slate-900 border-slate-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Öğrenci listenizden çıkarılsın mı?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300 text-base">
              <strong>{leaveStudentTarget?.name}</strong> artık benim öğrencim değil.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 text-white">İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmLeaveStudent}
              disabled={busyAction !== null}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {busyAction?.startsWith('leave-') && <Loader2 size={15} className="mr-2 animate-spin" />}
              Artık Benim Öğrencim Değil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={Boolean(teacherAssignmentStudent)}
        onOpenChange={(open) => !open && busyAction === null && setTeacherAssignmentStudent(null)}
      >
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="text-purple-400" size={20} /> Öğretmen Kadrosu
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {teacherAssignmentStudent?.name} için görevli öğretmenleri seçin. Admin dahil herkes kadrodan çıkarılabilir.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[50vh] space-y-2 overflow-y-auto py-2">
            {[...teachers]
              .sort((a, b) => a.name.localeCompare(b.name, 'tr'))
              .map(teacher => {
                const selected = selectedTeacherNames.includes(teacher.name);
                const inactive = teacher.isApproved === false;
                return (
                  <label
                    key={teacher.id}
                    className={twMerge(
                      "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
                      selected
                        ? "border-purple-500/50 bg-purple-500/10"
                        : "border-slate-800 bg-slate-950 hover:border-slate-700",
                      inactive && !selected ? "cursor-not-allowed opacity-45" : "",
                    )}
                  >
                    <Checkbox
                      checked={selected}
                      disabled={inactive && !selected}
                      onCheckedChange={() => toggleTeacherSelection(teacher.name)}
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{teacher.name}</span>
                    <span className={twMerge(
                      "text-[10px] font-semibold",
                      inactive ? "text-orange-400" : "text-green-400",
                    )}>
                      {inactive ? 'Pasif' : 'Aktif'}
                    </span>
                  </label>
                );
              })}
          </div>

          {selectedTeacherNames.length === 0 && (
            <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-3 text-xs text-orange-300">
              Kaydedildiğinde öğrenci “Atama Bekliyor” durumuna geçer.
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              className="border-slate-700 bg-slate-800 text-white"
              onClick={() => setTeacherAssignmentStudent(null)}
              disabled={busyAction !== null}
            >
              İptal
            </Button>
            <Button
              className="bg-purple-600 hover:bg-purple-700"
              onClick={saveTeacherAssignment}
              disabled={busyAction !== null}
            >
              {busyAction?.startsWith('assign-') && <Loader2 size={15} className="mr-2 animate-spin" />}
              Kadroyu Kaydet
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={personnelDialogOpen} onOpenChange={setPersonnelDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <ShieldAlert className="text-blue-500" /> Personel Yönetimi
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {teachers.filter(t => t.name.toLowerCase() !== 'admin').map(t => (
              <div key={t.id} className="flex flex-col sm:flex-row items-center justify-between p-4 bg-slate-950 rounded-lg border border-white/5 gap-4">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold shrink-0 ${t.isApproved === false ? 'bg-orange-900/50 text-orange-500' : 'bg-green-900/50 text-green-500'}`}>
                    {t.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-white font-medium truncate">{t.name}</h3>
                    <p className={`text-xs ${t.isApproved === false ? 'text-orange-400' : 'text-green-400'}`}>
                      {t.isApproved === false ? 'Onay Bekliyor' : 'Aktif Personel'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {t.isApproved === false ? (
                    <Button
                      onClick={() => toggleTeacherApproval(t.id, true)}
                      className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white h-9 text-xs"
                    >
                      <CheckCircle size={14} className="mr-2" /> Onayla
                    </Button>
                  ) : (
                    <Button
                      onClick={() => toggleTeacherApproval(t.id, false)}
                      variant="outline"
                      className="flex-1 sm:flex-none border-orange-500/50 text-orange-400 hover:bg-orange-900/20 h-9 text-xs"
                    >
                      <UserX size={14} className="mr-2" /> Dondur
                    </Button>
                  )}

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-500 hover:text-red-500 hover:bg-red-500/10 shrink-0">
                        <Trash2 size={16} />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-slate-900 border-slate-800 text-white">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Personeli Sil?</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-400">
                          Bu işlem geri alınamaz. Öğretmen, görevli olduğu bütün öğrenci kadrolarından da çıkarılacaktır.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-slate-800 text-white">Vazgeç</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={async () => {
                            const success = await deleteTeacher(t.id);
                            success ? toast.success('Personel silindi.') : toast.error('Personel silinemedi.');
                          }}
                          className="bg-red-600"
                        >
                          Sil
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
            {teachers.filter(t => t.name.toLowerCase() !== 'admin').length === 0 && (
              <p className="text-center text-slate-500 py-4">Kayıtlı personel bulunamadı.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Archive className="text-orange-400" size={21} /> Öğrenci Arşivi
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Arşivde yalnızca öğrencinin adı ve varsa fotoğrafı saklanır. Eski çalışma kayıtları görüntülenemez.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {[...archivedStudents]
              .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'tr'))
              .map(student => {
                const isRestoring = busyAction === `restore-${student.id}`;
                return (
                  <div
                    key={student.id}
                    className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3"
                  >
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-orange-500/30 bg-orange-500/10 flex items-center justify-center font-bold text-orange-300">
                      {student.photoUrl ? (
                        <img src={student.photoUrl} alt={student.name} className="h-full w-full object-cover" />
                      ) : (
                        String(student.name || '?').charAt(0).toUpperCase()
                      )}
                    </div>
                    <p className="min-w-0 flex-1 truncate font-semibold text-white">{student.name}</p>
                    <Button
                      className="h-9 shrink-0 bg-green-600 px-3 text-xs text-white hover:bg-green-700"
                      onClick={() => handleRestoreArchivedStudent(student)}
                      disabled={busyAction !== null}
                    >
                      {isRestoring ? (
                        <Loader2 size={14} className="mr-2 animate-spin" />
                      ) : (
                        <RotateCcw size={14} className="mr-2" />
                      )}
                      Öğrenci Geri Geldi
                    </Button>
                  </div>
                );
              })}

            {archivedStudents.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-500">
                Arşivde öğrenci bulunmuyor.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deletionRequestsOpen} onOpenChange={setDeletionRequestsOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BellRing className="text-orange-400" size={21} /> Öğrenci Silme Talepleri
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Onaylanan öğrencinin çalışma kayıtları silinir; adı ve varsa fotoğrafı arşive alınır. Reddedilen öğrenci yeniden aktif olur.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {pendingDeletionRequests.map(student => {
              const isBusy = busyAction?.endsWith(`-${student.id}`);
              return (
                <div key={student.id} className="rounded-xl border border-orange-500/20 bg-orange-950/10 p-4">
                  <div className="mb-3">
                    <p className="font-semibold text-white">{student.name}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Talep eden: <span className="text-orange-300">{student.deletionRequestedBy || 'Bilinmiyor'}</span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800"
                      onClick={() => handleDeletionDecision(student.id, false)}
                      disabled={Boolean(isBusy)}
                    >
                      Reddet
                    </Button>
                    <Button
                      className="flex-1 bg-red-600 text-white hover:bg-red-700"
                      onClick={() => handleDeletionDecision(student.id, true)}
                      disabled={Boolean(isBusy)}
                    >
                      {isBusy && <Loader2 size={15} className="mr-2 animate-spin" />}
                      Arşive Almayı Onayla
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <div className="max-w-6xl mx-auto space-y-8">
        <header className="border-b border-white/5 py-2">
          {isAdmin ? (
            <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-1.5 sm:gap-3">
              <p className="min-w-0 text-[11px] leading-tight text-slate-400 sm:text-sm">
                <span className="block text-[9px] text-slate-500 sm:inline sm:text-sm">Hoş geldin<span className="hidden sm:inline">, </span></span>
                <span className="block break-words font-semibold text-slate-300 sm:inline">{currentTeacher.name}</span>
              </p>
              <Button
                variant="outline"
                onClick={() => setAdminMenuOpen(true)}
                className="relative h-8 justify-self-center border-blue-500/60 bg-blue-500/5 px-2 text-[10px] text-blue-300 hover:bg-blue-500 hover:text-white sm:h-9 sm:px-3 sm:text-sm"
              >
                <Menu className="mr-1 h-4 w-4 sm:mr-2" />
                <span className="sm:hidden">Yönetim</span>
                <span className="hidden sm:inline">Yönetim Paneli</span>
                {(pendingDeletionRequests.length > 0 || teachers.some(t => t.isApproved === false)) && (
                  <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-slate-950 animate-pulse" />
                )}
              </Button>
              <Button
                variant="ghost"
                onClick={handleLogout}
                aria-label="Çıkış"
                title="Çıkış"
                className="h-8 w-8 justify-self-end border border-white/5 p-0 text-slate-400 sm:h-9 sm:w-auto sm:px-3"
              >
                <LogOut className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Çıkış</span>
              </Button>
            </div>
          ) : (
            <div className="flex min-w-0 items-center gap-2">
              <p className="min-w-0 truncate text-sm text-slate-400">
                <UserCircle2 className="mr-1.5 inline h-4 w-4 text-blue-500" />
                Hoş geldin, {currentTeacher.name}
              </p>
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="h-9 shrink-0 border border-white/5 px-3 text-slate-400"
              >
                <LogOut className="mr-2 h-4 w-4" /> Çıkış
              </Button>
            </div>
          )}
        </header>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="md:col-span-1 bg-slate-900 border-white/10">
            <CardHeader><CardTitle className="text-lg">Öğrenci Ekle</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleAddStudent} className="space-y-3">
                <div className="flex gap-2 items-center">

                  <div
                    onClick={startCamera}
                    className="h-10 w-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center cursor-pointer shrink-0 overflow-hidden hover:bg-slate-700 transition-colors relative group"
                    title="Kamerayı Aç"
                  >
                    {photoPreview ? (
                      <>
                        <img src={photoPreview} alt="Önizleme" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center">
                            <Camera size={16} className="text-white" />
                        </div>
                      </>
                    ) : (
                      <Camera size={18} className="text-slate-400" />
                    )}
                  </div>

                  <input type="file" accept="image/*" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" />

                  <Input placeholder="İsim Soyisim" value={name} onChange={(e) => setName(e.target.value)} className="bg-slate-950 border-slate-800 flex-1" />
                </div>

                <div className="flex gap-2">
                  <Input placeholder="Yaş" type="number" value={age} onChange={(e) => setAge(e.target.value)} className="bg-slate-950 border-slate-800 w-20" />
                  <Input placeholder="Tanı" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} className="bg-slate-950 border-slate-800 flex-1" />
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">Kaydet</Button>
              </form>
            </CardContent>
          </Card>
          <Card className="md:col-span-2 bg-slate-900 border-white/10 flex items-center px-6">
            <Search className="mr-3 text-slate-500" />
            <Input placeholder="Öğrenci, tanı veya yaş ara..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-slate-950 border-slate-800" />
          </Card>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="bg-slate-900 border-white/10">
            <TabsTrigger value="all" className="data-[state=active]:bg-blue-600">Hepsi ({allStudents.length})</TabsTrigger>
            <TabsTrigger value="my" className="data-[state=active]:bg-blue-600">Öğrencilerim ({myStudents.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="all">{allStudents.length > 0 ? renderStudentGrid(allStudents) : <p className="text-center text-slate-500 py-10">Kayıt yok.</p>}</TabsContent>
          <TabsContent value="my">{myStudents.length > 0 ? renderStudentGrid(myStudents) : <p className="text-center text-slate-500 py-10">Öğrenciniz yok.</p>}</TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
