import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, Trash2, ArrowLeft, Check, Play, Settings, User, Users, GraduationCap, Heart, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

// --- TİPLER ---
type Category = 'ogretmen' | 'aile' | 'tanidik' | 'arkadas';

interface PersonProfile {
  id: string;
  name: string;
  category: Category;
  imageUrl: string;
  isDummy?: boolean; // Bu kişi gerçek mi yoksa dolgu malzemesi mi?
}

// --- KATEGORİLER ---
const CATEGORIES: { id: Category; label: string; icon: any; color: string; iconColor: string }[] = [
  { id: 'ogretmen', label: 'Öğretmenlerim', icon: GraduationCap, color: 'border-blue-900 bg-blue-950/20', iconColor: 'text-blue-400' },
  { id: 'aile', label: 'Ailem', icon: Heart, color: 'border-red-900 bg-red-950/20', iconColor: 'text-red-400' },
  { id: 'arkadas', label: 'Arkadaşlarım', icon: Users, color: 'border-green-900 bg-green-950/20', iconColor: 'text-green-400' },
  { id: 'tanidik', label: 'Tanıdıklarım', icon: User, color: 'border-orange-900 bg-orange-950/20', iconColor: 'text-orange-400' },
];

// --- SORU KALIPLARI ---
const QUESTION_TEMPLATES = [
    (name: string) => `Hadi göster bakalım, ${name} nerede?`,
    (name: string) => `Hangisi ${name}?`,
    (name: string) => `Bana ${name} olanı bul.`,
    (name: string) => `Peki, ${name} hangisi acaba?`,
    (name: string) => `Hani ${name}, görebiliyor musun?`,
    (name: string) => `Hadi parmağınla ${name} resmine dokun.` 
];

// 🔥 YEDEK OYUNCULAR (kisi1.png ... kisi10.png) 🔥
// Bu resimlerin projenin 'public' klasöründe olduğundan emin ol.
const DUMMY_PROFILES: PersonProfile[] = Array.from({ length: 10 }).map((_, i) => ({
    id: `dummy-${i + 1}`,
    name: '', // İsimsiz görünsünler
    category: 'tanidik',
    imageUrl: `/kisi${i + 1}.png`, // Dosya yolu
    isDummy: true
}));

interface GameProps {
  onClose: () => void;
}

export default function AliciGame4({ onClose }: GameProps) {
  // --- STATE'LER ---
  const [view, setView] = useState<'menu' | 'edit' | 'game'>('menu');
  const [selectedCategory, setSelectedCategory] = useState<Category>('ogretmen');
  
  const [profiles, setProfiles] = useState<PersonProfile[]>(() => {
    try {
      const saved = localStorage.getItem('insan-tanima-v5');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const [tempImage, setTempImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [gameQuestions, setGameQuestions] = useState<PersonProfile[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [options, setOptions] = useState<PersonProfile[]>([]);
  const [gamePhase, setGamePhase] = useState<'playing' | 'success' | 'complete'>('playing');
  const [wrongCount, setWrongCount] = useState(0);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Cleanup
  useEffect(() => {
    return () => { stopCameraStream(); };
  }, []);

  // Kaydetme
  useEffect(() => {
    localStorage.setItem('insan-tanima-v5', JSON.stringify(profiles));
  }, [profiles]);

  // Ses Yükleme
  useEffect(() => {
    const loadVoices = () => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            setVoices(window.speechSynthesis.getVoices());
        }
    };
    loadVoices();
    if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const resetEditor = () => {
      stopCameraStream();
      setIsCameraActive(false);
      setTempImage(null);
      setNewPersonName('');
  };

  const speak = (text: string) => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const trVoice = voices.find(v => v.lang.includes('tr'));
      if (trVoice) utterance.voice = trVoice;
      utterance.lang = 'tr-TR';
      utterance.rate = 0.9; 
      window.speechSynthesis.speak(utterance);
  };

  const processImage = (imageSource: HTMLVideoElement | HTMLImageElement): string => {
      const canvas = document.createElement('canvas');
      const size = 512;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return '';
      const srcW = imageSource instanceof HTMLVideoElement ? imageSource.videoWidth : imageSource.width;
      const srcH = imageSource instanceof HTMLVideoElement ? imageSource.videoHeight : imageSource.height;
      const ratio = Math.max(size / srcW, size / srcH);
      const newW = srcW * ratio;
      const newH = srcH * ratio;
      const offsetX = (size - newW) / 2;
      const offsetY = (size - newH) / 2;
      ctx.drawImage(imageSource, offsetX, offsetY, newW, newH);
      return canvas.toDataURL('image/jpeg', 0.8);
  };

  const startCamera = async () => {
    setTempImage(null);
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 } } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      toast.error("Kamera hatası (İzinleri kontrol edin).");
      setIsCameraActive(false);
    }
  };

  const stopCameraStream = () => {
    const videoEl = document.querySelector('video');
    if (videoEl && videoEl.srcObject) {
        const stream = videoEl.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const optimizedImage = processImage(videoRef.current);
    setTempImage(optimizedImage);
    stopCameraStream();
    setIsCameraActive(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    toast.info("Resim yükleniyor...", { duration: 1500 }); 
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            const optimizedImage = processImage(img);
            setTempImage(optimizedImage);
            setIsCameraActive(false);
        };
        img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = ''; 
  };

  const savePerson = () => {
      const currentCategoryCount = profiles.filter(p => p.category === selectedCategory).length;
      if (currentCategoryCount >= 10) {
          toast.error("Bu kategori doldu (Max 10).");
          return;
      }
      if (!newPersonName || !tempImage) {
          toast.warning("Lütfen isim yazın ve fotoğraf ekleyin.");
          return;
      }
      const newProfile: PersonProfile = {
          id: Date.now().toString(),
          name: newPersonName,
          category: selectedCategory,
          imageUrl: tempImage,
          isDummy: false
      };
      setProfiles([...profiles, newProfile]);
      setNewPersonName('');
      setTempImage(null);
      stopCameraStream();
      setIsCameraActive(false);
      toast.success("Kişi eklendi!");
  };

  const startMixedGame = () => {
      if (profiles.length < 2) {
          toast.error("En az 2 kişi eklemelisiniz.");
          return;
      }
      const questions = [...profiles].sort(() => 0.5 - Math.random());
      setGameQuestions(questions);
      setCurrentQuestionIndex(0);
      setGamePhase('playing');
      setWrongCount(0);
      setView('game');
      generateOptions(questions[0], profiles, 0);
  };

  // 🔥 YEDEK OYUNCULU SEÇENEK OLUŞTURMA 🔥
  const generateOptions = (target: PersonProfile, pool: PersonProfile[], questionIndex: number) => {
      setWrongCount(0); 

      // 1. Hedef Seviyeyi Belirle
      let requiredCount = 3; // Seviye 1 (Varsayılan)
      if (questionIndex >= 3) requiredCount = 4; // Seviye 2
      if (questionIndex >= 6) requiredCount = 6; // Seviye 3

      // 2. Gerçek Çeldiricileri Havuzdan Al (Hedef Hariç)
      const realOthers = pool.filter(p => p.id !== target.id);
      
      // 3. Kaç tane eksiğimiz var?
      // Hedef (1) + Gerçek Çeldiriciler (X) + Yedekler (Y) = requiredCount
      const neededDistractors = requiredCount - 1; // Hedef hariç kaç boşluk var?

      // Havuzu karıştır
      realOthers.sort(() => 0.5 - Math.random());

      // Kullanılacak gerçek çeldiricileri seç (Elimizde ne varsa)
      const selectedRealDistractors = realOthers.slice(0, neededDistractors);

      // Hala eksik var mı? (Gereken - Bulunan Gerçekler)
      const missingCount = neededDistractors - selectedRealDistractors.length;

      // 4. Eksikleri 'kisi1.png'lerden tamamla
      let selectedDummies: PersonProfile[] = [];
      if (missingCount > 0) {
          // Yedekleri karıştır ve ihtiyacımız kadarını al
          selectedDummies = [...DUMMY_PROFILES]
              .sort(() => 0.5 - Math.random())
              .slice(0, missingCount);
      }

      // 5. Hepsini Birleştir: Hedef + Gerçekler + Yedekler
      const finalOptions = [target, ...selectedRealDistractors, ...selectedDummies];
      
      // Son kez karıştır ki hedef hep başta çıkmasın
      finalOptions.sort(() => 0.5 - Math.random());
      
      setOptions(finalOptions);

      // Soruyu sor
      const randomTemplate = QUESTION_TEMPLATES[Math.floor(Math.random() * QUESTION_TEMPLATES.length)];
      setTimeout(() => speak(randomTemplate(target.name)), 600);
  };

  const playSuccessSound = () => {
      console.log("🔊 AFERİN SESİ ÇALIYOR"); 
  };

  const handleAnswer = (selected: PersonProfile) => {
      if (gamePhase !== 'playing') return;

      const target = gameQuestions[currentQuestionIndex];

      if (selected.id === target.id) {
          // DOĞRU
          setGamePhase('success');
          playSuccessSound(); 
          speak("Harikasın!"); 
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });

          setTimeout(() => {
              const next = currentQuestionIndex + 1;
              if (next < gameQuestions.length) {
                  setCurrentQuestionIndex(next);
                  setGamePhase('playing');
                  generateOptions(gameQuestions[next], profiles, next);
              } else {
                  setGamePhase('complete');
                  speak("Oyun bitti, hepsi harikaydı!");
                  confetti();
              }
          }, 2000);
      } else {
          // YANLIŞ
          setWrongCount(prev => prev + 1);
      }
  };

  const getOptionStyle = (opt: PersonProfile, isTarget: boolean) => {
      if (gamePhase === 'success') {
          return isTarget ? "scale-110 border-green-500 shadow-[0_0_30px_green] z-20" : "opacity-20 scale-90 grayscale";
      }

      if (wrongCount === 0) return "border-slate-700 hover:border-blue-400"; 

      if (isTarget) {
          if (wrongCount >= 1) return "animate-pulse border-blue-500 shadow-[0_0_15px_blue] scale-105 z-10"; 
          if (wrongCount >= 2) return "animate-bounce border-green-500 shadow-[0_0_30px_green] scale-110 z-20"; 
      } else {
          if (wrongCount >= 3) return "opacity-10 pointer-events-none grayscale"; 
          if (wrongCount >= 2 && Math.random() > 0.5) return "opacity-30 pointer-events-none"; 
      }
      return "border-slate-700 opacity-80";
  };

  return (
    <div className="fixed inset-0 z-[500] bg-slate-950 flex flex-col font-sans text-slate-100">
      
      {/* ÜST BAR */}
      <div className="bg-slate-900 border-b border-slate-800 p-3 flex justify-between items-center z-10 shrink-0">
        <div className="flex items-center gap-3">
            <button onClick={() => { if (view === 'menu') onClose(); else { resetEditor(); setView('menu'); } }} className="p-2 bg-slate-800 rounded-full active:scale-95">
                <ArrowLeft size={20} className="text-slate-300"/>
            </button>
            <h1 className="text-lg font-bold">{view === 'menu' ? 'İnsan Tanıma' : view === 'edit' ? 'Kişi Ekle' : 'Oyun'}</h1>
        </div>
      </div>

      {/* --- MENÜ --- */}
      {view === 'menu' && (
          <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 overscroll-contain">
                  <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                      {CATEGORIES.map(cat => {
                          const count = profiles.filter(p => p.category === cat.id).length;
                          return (
                              <div key={cat.id} className={`p-4 rounded-xl border ${cat.color} bg-slate-900/50 flex flex-col gap-2 relative`}>
                                  <div className={`self-start p-2 rounded-lg bg-slate-900 border border-slate-800 ${cat.iconColor}`}>
                                      <cat.icon size={24} />
                                  </div>
                                  <div>
                                      <span className="text-2xl font-black block">{count}/10</span>
                                      <span className="text-xs font-bold text-slate-400">{cat.label}</span>
                                  </div>
                                  <Button size="sm" onClick={() => { resetEditor(); setSelectedCategory(cat.id); setView('edit'); }}
                                    className="w-full mt-auto bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs h-8">
                                      <Settings size={14} className="mr-1"/> DÜZENLE
                                  </Button>
                              </div>
                          );
                      })}
                  </div>
              </div>
              <div className="p-4 bg-slate-900 border-t border-slate-800 shrink-0">
                  <Button size="lg" onClick={startMixedGame} disabled={profiles.length < 2}
                    className="w-full py-6 text-lg font-black rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                      <Play size={24} className="mr-2 fill-white" /> OYUNA BAŞLA
                  </Button>
                  {profiles.length < 2 && <p className="text-center text-[10px] text-slate-500 mt-2">Oynamak için en az 2 kişi eklemelisin.</p>}
              </div>
          </div>
      )}

      {/* --- EDİTÖR --- */}
      {view === 'edit' && (
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
             <div className="flex-1 overflow-y-auto p-4 overscroll-contain">
                 <div className="flex justify-between items-center mb-4">
                      <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">{CATEGORIES.find(c => c.id === selectedCategory)?.label}</h2>
                      <span className="text-xs font-bold text-slate-500 bg-slate-900 px-2 py-1 rounded">{profiles.filter(p => p.category === selectedCategory).length} / 10</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                      <div className="bg-slate-900 border-2 border-dashed border-slate-800 rounded-xl p-2 flex flex-col gap-2 min-h-[180px]">
                          {isCameraActive ? (
                              <div className="relative w-full aspect-square bg-black rounded-lg overflow-hidden">
                                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
                                  <button onClick={capturePhoto} className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white rounded-full p-2 active:scale-90 transition-transform">
                                      <div className="w-6 h-6 bg-red-600 rounded-full border-2 border-white"></div>
                                  </button>
                              </div>
                          ) : tempImage ? (
                              <div className="relative w-full aspect-square bg-black rounded-lg overflow-hidden">
                                  <img src={tempImage} className="w-full h-full object-cover" />
                                  <button onClick={() => setTempImage(null)} className="absolute top-1 right-1 bg-black/60 p-1 rounded-full text-white"><X size={14}/></button>
                              </div>
                          ) : (
                              <div className="flex-1 flex flex-col justify-center gap-2 relative">
                                  <Button onClick={startCamera} variant="outline" className="h-10 border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 relative z-20">
                                      <Camera size={16} className="mr-2"/> Kamera
                                  </Button>
                                  <div className="relative h-10 w-full group">
                                      <div className="absolute inset-0 border border-slate-700 bg-slate-800 text-slate-300 flex items-center justify-center rounded-md text-sm font-medium group-hover:bg-slate-700 transition-colors pointer-events-none">
                                          <Upload size={16} className="mr-2"/> Yükle
                                      </div>
                                      <input type="file" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50"/>
                                  </div>
                              </div>
                          )}
                          {!isCameraActive && (
                              <div className="flex flex-col gap-2">
                                  <input type="text" value={newPersonName} onChange={(e) => setNewPersonName(e.target.value)} placeholder="İsim Girin"
                                    className="w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1.5 text-center text-sm text-white placeholder:text-slate-600 focus:border-blue-500 outline-none"/>
                                  <Button onClick={savePerson} size="sm" className="w-full bg-green-600 hover:bg-green-500 font-bold">KAYDET</Button>
                              </div>
                          )}
                          {isCameraActive && <Button variant="ghost" size="sm" onClick={() => { stopCameraStream(); setIsCameraActive(false); }} className="text-red-400 text-xs h-6">İptal</Button>}
                      </div>
                      {profiles.filter(p => p.category === selectedCategory).map(person => (
                          <div key={person.id} className="relative group bg-slate-900 p-2 rounded-xl border border-slate-800">
                              <img src={person.imageUrl} className="w-full aspect-square object-cover rounded-lg bg-slate-800" />
                              <p className="text-center font-bold text-xs mt-2 text-slate-300 truncate">{person.name}</p>
                              <button onClick={() => setProfiles(profiles.filter(p => p.id !== person.id))} className="absolute -top-2 -right-2 bg-red-600 text-white p-1.5 rounded-full shadow-md active:scale-90"><Trash2 size={12}/></button>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* --- OYUN --- */}
      {view === 'game' && (
          <div className="flex-1 flex flex-col bg-slate-950 relative overflow-hidden">
              {gamePhase === 'complete' ? (
                  <div className="flex-1 flex flex-col items-center justify-center animate-in zoom-in p-6">
                       <confetti className="absolute inset-0" />
                       <div className="text-6xl mb-4">👑</div>
                       <h2 className="text-4xl font-black text-white mb-2">HARİKASIN!</h2>
                       <p className="text-slate-400 mb-8">Tüm kişileri başarıyla buldun.</p>
                       <Button onClick={() => setView('menu')} size="lg" className="bg-green-600 text-white px-10 py-4 text-xl rounded-2xl w-full max-w-sm">
                           <RotateCcw className="mr-2"/> TEKRAR OYNA
                       </Button>
                  </div>
              ) : (
                  <>
                      <div className="pt-8 pb-4 px-4 text-center z-10 shrink-0">
                          <Button variant="secondary" size="lg" 
                            onClick={() => {
                                const target = gameQuestions[currentQuestionIndex];
                                const randomTemplate = QUESTION_TEMPLATES[Math.floor(Math.random() * QUESTION_TEMPLATES.length)];
                                speak(randomTemplate(target.name));
                            }} 
                            className="rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 px-6">
                              <Play size={24} className="mr-2 text-blue-400 fill-blue-400"/> Soruyu Tekrarla
                          </Button>
                      </div>

                      <div className="flex-1 flex items-start justify-center pt-4 px-4 overflow-y-auto">
                          <div className={`
                              grid gap-4 w-full max-w-2xl transition-all duration-500
                              ${options.length <= 3 ? 'grid-cols-3' : options.length === 4 ? 'grid-cols-2 max-w-md' : 'grid-cols-3'}
                          `}>
                              {options.map((opt) => {
                                  const isTarget = opt.id === gameQuestions[currentQuestionIndex]?.id;
                                  const styleClass = getOptionStyle(opt, isTarget);

                                  return (
                                      <motion.div 
                                        key={opt.id} 
                                        layout
                                        onClick={() => handleAnswer(opt)}
                                        whileTap={{ scale: 0.95 }}
                                        className={`relative aspect-square rounded-2xl overflow-hidden border-4 cursor-pointer bg-slate-800 transition-all duration-300 ${styleClass}`}>
                                          <img src={opt.imageUrl} className="w-full h-full object-cover pointer-events-none" />
                                          {/* Yedek oyuncuların ismi yazmasın, sadece gerçek kişilerin yazsın */}
                                          {!opt.isDummy && (
                                              <div className="absolute bottom-0 inset-x-0 bg-black/60 text-center py-1">
                                                  <span className="text-xs font-bold text-white truncate px-1">{opt.name}</span>
                                              </div>
                                          )}
                                          
                                          <AnimatePresence>
                                            {gamePhase === 'success' && isTarget && (
                                                <motion.div 
                                                    initial={{ scale: 0, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    className="absolute inset-0 bg-green-500/50 flex items-center justify-center backdrop-blur-sm"
                                                >
                                                    <Check size={80} className="text-white drop-shadow-lg" strokeWidth={4}/>
                                                </motion.div>
                                            )}
                                          </AnimatePresence>
                                      </motion.div>
                                  );
                              })}
                          </div>
                      </div>
                  </>
              )}
          </div>
      )}
    </div>
  );
                        }
