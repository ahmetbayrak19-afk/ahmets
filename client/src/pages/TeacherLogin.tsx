import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, AlertCircle, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase"; 
import { doc, setDoc, getDoc, collection, getDocs, updateDoc } from "firebase/firestore";
import { twMerge } from 'tailwind-merge';

import logoImg from '../logo.png';

type LoginStep = 'institution' | 'institution-register' | 'teacher-name' | 'teacher-password';

export default function TeacherLogin() {
  const [_, setLocation] = useLocation();
  const [step, setStep] = useState<LoginStep>('institution');
  const [loading, setLoading] = useState(true);

  const [institutionName, setInstitutionName] = useState('');
  const [institutionPassword, setInstitutionPassword] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [password, setPassword] = useState('');
  
  const [registeredTeachers, setRegisteredTeachers] = useState<any[]>([]);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const checkSession = async () => {
      const instId = localStorage.getItem("kazanim-takip-institution-id");
      if (instId) {
        await fetchTeachersList(instId);
        setStep("teacher-name");
      }
      setLoading(false);
    };
    checkSession();
  }, []);

  const clearError = () => {
    setIsError(false);
    setErrorMessage('');
  };

  const fetchTeachersList = async (instId: string) => {
    try {
      const teachersRef = collection(db, "institutions", instId, "teachers");
      const snap = await getDocs(teachersRef);
      setRegisteredTeachers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
  };

  const handleGoToRegister = () => {
    localStorage.clear();
    setRegisteredTeachers([]);
    setInstitutionName('');
    setInstitutionPassword('');
    clearError();
    setStep('institution-register');
  };

  const safeEmail = (name: string) => {
    const map: any = { 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u', 'İ': 'i' };
    let cleanName = name.toLowerCase().replace(/[çğıöşüİ]/g, (m) => map[m]);
    return `${cleanName.replace(/\s/g, '')}@kurum.com`;
  };

  const handleInstitutionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      const email = safeEmail(institutionName);
      const userCredential = await signInWithEmailAndPassword(auth, email, institutionPassword);
      localStorage.setItem("kazanim-takip-institution-id", userCredential.user.uid);
      await fetchTeachersList(userCredential.user.uid);
      setStep("teacher-name");
      toast.success("Kurum girişi başarılı.");
    } catch (error) { 
      setIsError(true);
      setErrorMessage("Kurum adı veya şifre hatalı!");
      toast.error("Giriş yapılamadı.");
      setTimeout(() => setIsError(false), 500); 
    }
  };

  const handleInstitutionRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (institutionPassword.length < 6) {
        toast.warning("Şifre en az 6 karakter olmalı.");
        return;
    }
    try {
      const email = safeEmail(institutionName);
      const userCredential = await createUserWithEmailAndPassword(auth, email, institutionPassword);
      await setDoc(doc(db, "institutions", userCredential.user.uid), {
        name: institutionName, email, createdAt: new Date().toISOString()
      });
      localStorage.setItem("kazanim-takip-institution-id", userCredential.user.uid);
      setStep("teacher-name");
      toast.success("Kurum başarıyla oluşturuldu!");
    } catch (error: any) { toast.error("Hata: " + error.message); }
  };

  // --- ÖĞRETMEN ŞİFRE KONTROLÜ VE KAYIT ---
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    const instId = localStorage.getItem("kazanim-takip-institution-id");
    if (!instId) return;

    if (!password.trim()) {
      setIsError(true);
      setErrorMessage('Şifre boş bırakılamaz.');
      return;
    }

    try {
      const teacherRef = doc(db, "institutions", instId, "teachers", teacherName.trim());
      const docSnap = await getDoc(teacherRef);
      
      if (docSnap.exists()) {
        const teacherData = docSnap.data();
        if (teacherData.password) {
          if (teacherData.password !== password) {
            setIsError(true);
            setErrorMessage('Hatalı şifre girdiniz.');
            toast.error("Şifre yanlış!");
            return;
          }
        } else {
          await updateDoc(teacherRef, { password: password });
          toast.success("İlk şifreniz oluşturuldu.");
        }
      } else {
        // --- YENİ KAYIT BURADA OLUŞUYOR ---
        // Eğer isim 'Admin' değilse, isApproved: FALSE olarak kaydet.
        const isAdminName = teacherName.trim().toLowerCase() === 'admin';
        
        await setDoc(teacherRef, { 
          name: teacherName.trim(), 
          password: password,
          isApproved: isAdminName, // Admin ise otomatik onaylı, değilse ONAYSIZ
          createdAt: new Date().toISOString() 
        });
        
        if (!isAdminName) {
            toast.info("Kaydınız oluşturuldu. Yönetici onayı bekleniyor.");
        } else {
            toast.success("Yönetici hesabı oluşturuldu.");
        }
      }

      localStorage.setItem("kazanim-takip-teacher-name", teacherName.trim());
      setLocation('/home'); 
      
    } catch (e) { 
      toast.error("Bir hata oluştu."); 
    }
  };

  const shakeAnimation = isError ? { x: [0, -10, 10, -10, 10, 0] } : {};

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center text-white space-y-8 z-50 fixed inset-0">
        <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 bg-blue-500/30 blur-3xl rounded-full scale-150 animate-pulse"></div>
            <img src={logoImg} alt="Yükleniyor" className="w-24 h-24 object-contain animate-spin relative z-10 drop-shadow-2xl" style={{ animationDuration: '3s' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col items-center justify-center p-4 overflow-hidden relative">
       <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600 rounded-full blur-[120px]" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-600 rounded-full blur-[120px]" />
      </div>

      <div className="text-center mb-8 z-10">
        <div className="flex justify-center mb-4">
            <img src={logoImg} alt="Kazanım Takip Logosu" className="w-24 h-24 object-contain drop-shadow-xl animate-in fade-in zoom-in duration-500" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Kazanım Takip</h1>
        <p className="text-slate-400 text-sm mt-2">Eğitim ve Gelişim Platformu</p>
      </div>

      <AnimatePresence mode="wait">
        {step === 'institution' && (
          <motion.div key="step-1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="w-full max-w-md z-10">
            <motion.div animate={shakeAnimation} transition={{ duration: 0.4 }}>
              <Card className={`bg-slate-900/80 backdrop-blur border-slate-800 text-white transition-colors ${isError ? 'border-red-500 shadow-red-900/20 shadow-lg' : ''}`}>
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto bg-slate-800 p-3 rounded-full mb-2 w-fit"><Building2 className="text-blue-400" size={24}/></div>
                    <CardTitle>Kurum Girişi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Input placeholder="Kurum Adı" value={institutionName} onChange={(e) => { setInstitutionName(e.target.value); clearError(); }} className={`bg-slate-950 border-slate-800 ${isError ? 'border-red-500' : ''}`} />
                    <Input type="password" placeholder="Şifre" value={institutionPassword} onChange={(e) => { setInstitutionPassword(e.target.value); clearError(); }} className={`bg-slate-950 border-slate-800 ${isError ? 'border-red-500' : ''}`} />
                  </div>
                  {isError && <p className="text-red-400 text-xs flex items-center justify-center gap-1"><AlertCircle size={12}/> {errorMessage}</p>}
                  <Button onClick={handleInstitutionSubmit} className={`w-full ${isError ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>Giriş Yap</Button>
                  <Button variant="ghost" onClick={handleGoToRegister} className="w-full text-blue-400 hover:text-blue-300">Yeni Kurum Kaydı</Button>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}

        {step === 'institution-register' && (
          <motion.div key="step-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="w-full max-w-md z-10">
            <Card className="bg-slate-900/80 backdrop-blur border-slate-800 text-white">
              <CardHeader><CardTitle>Yeni Kurum Kaydı</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Input placeholder="Kurum Adı" value={institutionName} onChange={(e) => setInstitutionName(e.target.value)} className="bg-slate-950 border-slate-800" />
                <Input type="password" placeholder="Şifre" value={institutionPassword} onChange={(e) => setInstitutionPassword(e.target.value)} className="bg-slate-950 border-slate-800" />
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep('institution')} className="border-slate-800 text-white hover:bg-slate-800">Geri</Button>
                  <Button onClick={handleInstitutionRegister} className="flex-1 bg-green-600 hover:bg-green-700">Kaydı Tamamla</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 'teacher-name' && (
          <motion.div key="step-3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md z-10">
            <Card className="bg-slate-900/80 backdrop-blur border-slate-800 text-white">
              <CardHeader><CardTitle>Öğretmen Seçimi</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar mb-4">
                  {registeredTeachers.map((t) => (
                    <button key={t.id} onClick={() => { setTeacherName(t.name); setStep('teacher-password'); clearError(); }} className="flex items-center gap-3 p-3 rounded-lg bg-slate-950/50 border border-slate-800 hover:border-blue-500 hover:bg-blue-500/10 transition-all group">
                      <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors">
                        <User size={16} className="text-slate-400 group-hover:text-white" />
                      </div>
                      <span className="font-medium">{t.name}</span>
                    </button>
                  ))}
                  {registeredTeachers.length === 0 && <p className="text-center text-slate-500 text-sm py-4">Kayıtlı öğretmen yok.</p>}
                </div>
                
                <div className="relative">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-800" /></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-900 px-2 text-slate-500">Veya Yeni Giriş</span></div>
                </div>

                <Input placeholder="Adınız Soyadınız" value={teacherName} onChange={(e) => setTeacherName(e.target.value)} className="bg-slate-950 border-slate-800" />
                <Button onClick={() => setStep('teacher-password')} className="w-full bg-blue-600 hover:bg-blue-700">Devam Et</Button>
                <Button variant="ghost" onClick={() => { localStorage.clear(); setStep('institution'); }} className="w-full text-slate-500 text-xs hover:text-red-400">Farklı Kurumla Giriş Yap</Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 'teacher-password' && (
          <motion.div key="step-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md z-10">
            <Card className="bg-slate-900/80 backdrop-blur border-slate-800 text-white">
              <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-blue-500 rounded-full mx-auto mb-2 flex items-center justify-center text-2xl font-bold uppercase">{teacherName.charAt(0)}</div>
                  <CardTitle>{teacherName}</CardTitle>
                  <p className="text-xs text-slate-400">Giriş yapmak için şifrenizi girin</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <motion.div animate={shakeAnimation} transition={{ duration: 0.4 }}>
                  <Input 
                    type="password" 
                    placeholder="Şifre" 
                    value={password} 
                    onChange={(e) => { setPassword(e.target.value); clearError(); }} 
                    className={twMerge(
                      "bg-slate-950 transition-colors h-12 text-center text-lg tracking-widest",
                      isError ? "border-red-500 focus:ring-red-500" : "border-slate-800"
                    )} 
                    autoFocus 
                  />
                </motion.div>
                {isError && (
                  <div className="flex items-center justify-center gap-2 text-red-500 text-sm animate-pulse">
                    <AlertCircle size={14} /> <span>{errorMessage}</span>
                  </div>
                )}
                <Button onClick={handlePasswordSubmit} className={`w-full h-11 ${isError ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>Sisteme Gir</Button>
                <Button variant="ghost" onClick={() => { setStep('teacher-name'); clearError(); setPassword(''); }} className="w-full text-slate-400">Geri Dön</Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
        }
            
