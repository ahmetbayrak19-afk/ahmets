import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useStudentData } from '@/hooks/useStudentData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, LogOut, Trash2, UserCircle2, ShieldCheck, Loader2, Users, AlertTriangle, Baby, Stethoscope, ClipboardCheck, BookOpen, AlertCircle, Lock, CheckCircle, UserX, ShieldAlert, Camera, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, AlertDialogDescription
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { toast } from 'sonner';
import { twMerge } from 'tailwind-merge';

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
  
  const [_, setLocation] = useLocation();

  const { students, teachers, addStudent, deleteStudent, deleteTeacher, toggleTeacherApproval, currentTeacher, isLoading } = useStudentData();

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

    const normalizedName = name.trim().toLocaleLowerCase('tr');
    const isDuplicate = students.some(s => s.name.trim().toLocaleLowerCase('tr') === normalizedName);
    if (isDuplicate) {
      setDuplicateError(true); 
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
    await addStudent(name, age, diagnosis, photoFile); 
    
    setName(''); setAge(''); setDiagnosis('');
    setPhotoFile(null); 
    setPhotoPreview(null); 
    
    toast.dismiss(loadingToast);
    toast.success("Öğrenci başarıyla eklendi"); 
  };

  const searchedStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isStudentMine = (s: any) => {
    const tName = currentTeacher?.name;
    return s.createdBy === tName || (s.associatedTeacherIds && s.associatedTeacherIds.includes(tName));
  };

  const allStudents = [...searchedStudents].sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  const myStudents = searchedStudents.filter(isStudentMine).sort((a, b) => a.name.localeCompare(b.name, 'tr'));

  const renderStudentGrid = (studentList: any[]) => (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4">
      {studentList.map((student) => {
        const isMyStudent = isStudentMine(student);
        const rawTeacherIds = student.associatedTeacherIds || [student.createdBy];
        const activeTeachers = rawTeacherIds.filter((tid: string) => teachers.some(t => t.name === tid));
        const hasValidTeacher = activeTeachers.length > 0;
        
        const displayName = formatName(student.name);

        return (
          <motion.div
            key={student.id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={twMerge(
              "group relative overflow-hidden rounded-xl border transition-all p-4 flex flex-col justify-between gap-3",
              !hasValidTeacher 
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

            <div className="flex flex-wrap gap-1 pl-1">
                {activeTeachers.slice(0, 3).map((tid: string, idx: number) => (
                  <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-white/5 truncate">
                    {tid}
                  </span>
                ))}
                {activeTeachers.length > 3 && <span className="text-[10px] text-slate-500">+{activeTeachers.length - 3}</span>}
                {!hasValidTeacher && <span className="text-[10px] text-red-500 font-bold bg-red-900/20 px-1.5 py-0.5 rounded">Atama Bekliyor</span>}
            </div>

            <div className="flex items-center gap-2 mt-1">
                <Button variant="outline" className="flex-1 border-slate-700 bg-slate-950 hover:bg-slate-800 text-slate-300 h-10 text-xs font-semibold px-2" onClick={() => setLocation(`/assessment/${student.id}`)}>
                    <ClipboardCheck size={16} className="mr-2 text-orange-500"/> Değerlendirme
                </Button>
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700 h-10 text-xs font-semibold text-white px-2" onClick={() => setLocation(`/student/${student.id}`)}>
                    <BookOpen size={16} className="mr-2"/> Çalışma
                </Button>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-500 hover:text-red-500 hover:bg-red-500/10 border border-white/5 bg-slate-900 shrink-0">
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-slate-900 border-slate-800 text-white">
                      <AlertDialogHeader><AlertDialogTitle>Öğrenci Silinsin mi?</AlertDialogTitle></AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-slate-800 text-white">İptal</AlertDialogCancel>
                        <AlertDialogAction onClick={() => { deleteStudent(student.id); toast.success('Silindi'); }} className="bg-red-600">Sil</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
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

  if (isLoading) return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center text-white">
      <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
      <p className="italic">Veriler doğrulanıyor...</p>
    </div>
  );

  if (!currentTeacher) return null;

  const isAdmin = currentTeacher?.name?.toLowerCase() === 'admin';

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
                onClick={() => setViewingStudentPhoto(null)}
                className="mt-8 bg-slate-800 text-white p-4 rounded-full hover:bg-slate-700 hover:scale-105 active:scale-95 transition-all shadow-lg"
              >
                <X size={28} />
              </button>
            </motion.div>
          </motion.div>
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

      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/5">
          <div>
            <h1 className="text-3xl font-bold tracking-tighter uppercase">Öğrenci Listesi</h1>
            <p className="text-slate-400 flex items-center gap-2 mt-1">
              <UserCircle2 className="h-4 w-4 text-blue-500" /> Hoş geldin, {currentTeacher.name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white">
                      <Users className="mr-2 h-4 w-4" /> Öğretmenler {teachers.some(t => t.isApproved === false) && <span className="ml-2 flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl"><ShieldAlert className="text-blue-500" /> Personel Yönetimi</DialogTitle>
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
                                    <AlertDialogHeader><AlertDialogTitle>Personeli Sil?</AlertDialogTitle><AlertDialogDescription className="text-slate-400">Bu işlem geri alınamaz. Silinen öğretmene ait öğrenciler "Atama Bekliyor" durumuna düşecektir.</AlertDialogDescription></AlertDialogHeader>
                                    <AlertDialogFooter><AlertDialogCancel className="bg-slate-800 text-white">Vazgeç</AlertDialogCancel><AlertDialogAction onClick={() => { deleteTeacher(t.id); toast.success('Silindi'); }} className="bg-red-600">Sil</AlertDialogAction></AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                            </div>
                         </div>
                      ))}
                      {teachers.filter(t => t.name.toLowerCase() !== 'admin').length === 0 && <p className="text-center text-slate-500 py-4">Kayıtlı personel bulunamadı.</p>}
                    </div>
                  </DialogContent>
                </Dialog>
                <Button variant="outline" onClick={() => setLocation('/admin')} className="border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white"><ShieldCheck className="mr-2 h-4 w-4" /> Müfredat</Button>
              </>
            )}
            <Button variant="ghost" onClick={handleLogout} className="text-slate-400 border border-white/5"><LogOut className="mr-2 h-4 w-4" />Çıkış</Button>
          </div>
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
