import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, Trash2, ArrowLeft, Check, Play, Settings, User, Users, GraduationCap, Heart, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

// --- SES DOSYALARI (Senin verdiğin yollar) ---
import aferin1 from '../esle/ses/aferin1.mp3';
import aferin2 from '../esle/ses/aferin2.mp3';
import bravo from '../esle/ses/bravo.mp3';
import esledinbravo from '../esle/ses/esledinbravo.mp3';
import harika1 from '../esle/ses/harika1.mp3';
import harika2 from '../esle/ses/harika2.mp3';
import tekrardene1 from '../esle/ses/tekrardene1.mp3';
import tekrardene2 from '../esle/ses/tekrardene2.mp3';
import arkaplanmusic from '../esle/ses/arkaplanmusic.mp3';

const SUCCESS_SOUNDS = [aferin1, aferin2, bravo, esledinbravo, harika1, harika2];
const ERROR_SOUNDS = [tekrardene1, tekrardene2];

// --- TİPLER ---
type Category = 'ogretmen' | 'aile' | 'tanidik' | 'arkadas';

interface PersonProfile {
  id: string;
  name: string;
  category: Category;
  imageUrl: string;
  isDummy?: boolean;
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

// YEDEK OYUNCULAR (public klasöründe kisi1.png ... kisi10.png)
const DUMMY_PROFILES: PersonProfile[] = Array.from({ length: 10 }).map((_, i) => ({
    id: `dummy-${i + 1}`,
    name: '',
    category: 'tanidik',
    imageUrl: `/kisi${i + 1}.png`,
    isDummy: true
}));

// Karıştırma Fonksiyonu
function shuffleArray<T>(array: T[]): T[] {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
}

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
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);

  const [gameQuestions, setGameQuestions] = useState<PersonProfile[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [options, setOptions] = useState<PersonProfile[]>([]);
  const [gamePhase, setGamePhase] = useState<'playing' | 'success' | 'complete'>('playing');
  const [wrongCount, setWrongCount] = useState(0);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Cleanup
  useEffect(() => {
    return () => {
      stopCameraStream();
      stopBackgroundMusic();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('insan-tanima-v5', JSON.stringify(profiles));
  }, [profiles]);

  // Sesleri Yükle (TTS)
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

  // --- SES FONKSİYONLARI ---
  const playSuccessSound = () => {
      const randomSound = SUCCESS_SOUNDS[Math.floor(Math.random() * SUCCESS_SOUNDS.length)];
      const audio = new Audio(randomSound);
      audio.volume = 1.0;
      audio.play().catch(e => console.log("Ses hatası:", e));
  };

  const playErrorSound = () => {
      const randomSound = ERROR_SOUNDS[Math.floor(Math.random() * ERROR_SOUNDS.length)];
      const audio = new Audio(randomSound);
      audio.volume = 1.0;
      audio.play().catch(e => console.log("Ses hatası:", e));
  };

  const playBackgroundMusic = () => {
      if (!bgMusicRef.current) {
          bgMusicRef.current = new Audio(arkaplanmusic);
          bgMusicRef.current.loop = true;
          bgMusicRef.current.volume = 0.1; // Müzik sesi kısık (Soruyu bastırmasın)
      }
      bgMusicRef.current.play().catch(e => console.log("Müzik hatası:", e));
  };

  const stopBackgroundMusic = () => {
      if (bgMusicRef.current) {
          bgMusicRef.current.pause();
          bgMusicRef.current.currentTime = 0;
      }
  };

  // --- GÜÇLENDİRİLMİŞ TTS (Daha Doğal Ses İçin) ---
  const speakQuestion = (text: string) => {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // HEDEF: Google Türkçe sesini bul
      const allVoices = window.speechSynthesis.getVoices();
      let selectedVoice = allVoices.find(v => v.lang.includes('tr') && v.name.includes('Google'));
      
      // Bulamazsa herhangi bir Türkçe ses
      if (!selectedVoice) selectedVoice = allVoices.find(v => v.lang.includes('tr'));

      if (selectedVoice) utterance.voice = selectedVoice;

      utterance.lang = 'tr-TR';
      utterance.rate = 0.9; 
      
      window.speechSynthesis.speak(utterance);
  };

  const startMixedGame = () => {
      if (profiles.length < 1) {
          toast.error("En az 1 kişi eklemelisiniz.");
          return;
      }

      playBackgroundMusic();

      const questions = shuffleArray([...profiles]);
      
      setGameQuestions(questions);
      setCurrentQuestionIndex(0);
      setGamePhase('playing');
      setWrongCount(0);
      setView('game');
      
      setTimeout(() => {
          generateOptions(questions[0], profiles, 0);
      }, 500);
  };

  const generateOptions = (target: PersonProfile, pool: PersonProfile[], questionIndex: number) => {
      setWrongCount(0); 
      
      // SEVİYE MANTIĞI
      let requiredCount = 3; 
      if (questionIndex >= 2) requiredCount = 4; // 3. soru
      if (questionIndex >= 5) requiredCount = 6; // 6. soru

      const realOthers = pool.filter(p => p.id !== target.id);
      const neededDistractors = requiredCount - 1;
      
      const shuffledRealOthers = shuffleArray(realOthers);
      const selectedRealDistractors = shuffledRealOthers.slice(0, neededDistractors);
      const missingCount = neededDistractors - selectedRealDistractors.length;

      let selectedDummies: PersonProfile[] = [];
      if (missingCount > 0) {
          selectedDummies = shuffleArray([...DUMMY_PROFILES]).slice(0, missingCount);
      }

      const finalOptions = shuffleArray([target, ...selectedRealDistractors, ...selectedDummies]);
      setOptions(finalOptions);

      // Soruyu oku
      const randomTemplate = QUESTION_TEMPLATES[Math.floor(Math.random() * QUESTION_TEMPLATES.length)];
      setTimeout(() => speakQuestion(randomTemplate(target.name)), 600);
  };

  const handleAnswer = (selected: PersonProfile) => {
      if (gamePhase !== 'playing') return;

      const target = gameQuestions[currentQuestionIndex];

      if (selected.id === target.id) {
          // --- DOĞRU ---
          setGamePhase('success');
          playSuccessSound();
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });

          setTimeout(() => {
              const next = currentQuestionIndex + 1;
              if (next < gameQuestions.length) {
                  setCurrentQuestionIndex(next);
                  setGamePhase('playing');
                  generateOptions(gameQuestions[next], profiles, next);
              } else {
                  setGamePhase('complete');
                  stopBackgroundMusic();
                  playSuccessSound();
                  confetti();
              }
          }, 2500); 
      } else {
          // --- YANLIŞ ---
          setWrongCount(prev => prev + 1);
          playErrorSound();
      }
  };

  // --- STİL VE DÜZEN ---
  const getOptionStyle = (opt: PersonProfile, isTarget: boolean) => {
      if (gamePhase === 'success') {
          return isTarget ? "scale-105 border-green-500 shadow-[0_0_30px_green] z-20 ring-4 ring-green-400" : "opacity-20 scale-90 grayscale";
      }

      if (wrongCount === 0) return "border-slate-700 active:scale-95"; 

      if (isTarget) {
          if (wrongCount >= 1) return "animate-pulse border-blue-500 shadow-[0_0_20px_blue] scale-105 z-10"; 
          if (wrongCount >= 2) return "animate-bounce border-green-500 shadow-[0_0_40px_green] scale-110 z-20"; 
      } else {
          if (wrongCount >= 3) return "opacity-5 pointer-events-none grayscale"; 
          if (wrongCount >= 2 && Math.random() > 0.5) return "opacity-20 pointer-events-none"; 
      }
      return "border-slate-700 opacity-60";
  };

  const getGridClass = (count: number) => {
      // 3 Kişiyken Piramit düzeni için grid yerine özel ayar
      if (count === 3) return "grid grid-cols-2 gap-4 place-items-center w-full"; 
      if (count === 4) return "grid grid-cols-2 gap-4 w-full";
      return "grid grid-cols-2 gap-3 w-full"; 
  };

  // --- STANDART FONKSİYONLAR ---
  const processImage = (s:any) => {
    const c = document.createElement('canvas'); const z=512; c.width=z; c.height=z;
    const x = c.getContext('2d'); if(!x)return'';
    const sw = s instanceof HTMLVideoElement?s.videoWidth:s.width;
    const sh = s instanceof HTMLVideoElement?s.videoHeight:s.height;
    const r = Math.max(z/sw, z/sh); const nw=sw*r; const nh=sh*r;
    x.drawImage(s,(z-nw)/2,(z-nh)/2,nw,nh); return c.toDataURL('image/jpeg',0.8);
  };
  const startCamera = async()=>{ setIsCameraActive(true); try{ const s=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user'}}); if(videoRef.current){videoRef.current.srcObject=s;videoRef.current.play();}}catch{toast.error("Kamera hatası");setIsCameraActive(false);} };
  const stopCameraStream=()=>{ const v=document.querySelector('video'); if(v&&v.srcObject){ (v.srcObject as MediaStream).getTracks().forEach(t=>t.stop()); } };
  const capturePhoto=()=>{ if(!videoRef.current)return; setTempImage(processImage(videoRef.current)); stopCameraStream(); setIsCameraActive(false); };
  const handleFileUpload=(e:any)=>{ const f=e.target.files?.[0]; if(!f)return; const r=new FileReader(); r.onload=(ev)=>{ const i=new Image(); i.onload=()=>{ setTempImage(processImage(i)); setIsCameraActive(false); }; i.src=ev.target?.result as string; }; r.readAsDataURL(f); e.target.value=''; };
  const savePerson=()=>{ if(profiles.filter(p=>p.category===selectedCategory).length>=10){toast.error("Dolu");return;} if(!newPersonName||!tempImage){toast.warning("Eksik bilgi");return;} setProfiles([...profiles,{id:Date.now().toString(),name:newPersonName,category:selectedCategory,imageUrl:tempImage,isDummy:false}]); setNewPersonName(''); setTempImage(null); stopCameraStream(); setIsCameraActive(false); toast.success("Eklendi"); };


  // --- RENDER ---
  return (
    <div className="fixed inset-0 z-[500] bg-slate-950 flex flex-col font-sans text-slate-100">
      
      {/* ÜST BAR */}
      <div className="bg-slate-900 border-b border-slate-800 p-3 flex justify-between items-center z-10 shrink-0">
        <div className="flex items-center gap-3">
            <button onClick={() => { 
                if (view === 'menu') onClose(); 
                else { 
                    resetEditor(); 
                    stopBackgroundMusic(); 
                    setView('menu'); 
                } 
            }} className="p-2 bg-slate-800 rounded-full active:scale-95">
                <ArrowLeft size={20} className="text-slate-300"/>
            </button>
            <h1 className="text-lg font-bold">{view === 'menu' ? 'İnsan Tanıma' : view === 'edit' ? 'Kişi Ekle' : 'Oyun'}</h1>
        </div>
      </div>

      {view === 'menu' && (
          <div className="flex-1 flex flex-col p-4">
              <div className="grid grid-cols-2 gap-3 max-w-md mx-auto flex-1 content-start">
                  {CATEGORIES.map(cat => (
                      <div key={cat.id} className={`p-4 rounded-xl border ${cat.color} bg-slate-900/50 flex flex-col gap-2`}>
                          <cat.icon size={24} className={cat.iconColor} />
                          <span className="text-2xl font-black">{profiles.filter(p => p.category === cat.id).length}/10</span>
                          <span className="text-xs font-bold text-slate-400">{cat.label}</span>
                          <Button size="sm" onClick={() => { resetEditor(); setSelectedCategory(cat.id); setView('edit'); }} className="mt-auto bg-slate-800 text-xs">DÜZENLE</Button>
                      </div>
                  ))}
              </div>
              <Button size="lg" onClick={startMixedGame} className="w-full py-6 text-lg font-black bg-blue-600 rounded-xl mt-4"><Play size={24} className="mr-2"/> OYUNA BAŞLA</Button>
          </div>
      )}

      {view === 'edit' && (
          <div className="flex-1 flex flex-col p-4 bg-slate-950 overflow-y-auto">
             <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-900 border-2 border-dashed border-slate-800 rounded-xl p-2 flex flex-col gap-2 min-h-[180px]">
                      {isCameraActive ? (
                          <div className="relative w-full aspect-square bg-black rounded-lg overflow-hidden">
                              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
                              <button onClick={capturePhoto} className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white p-2 rounded-full"><div className="w-6 h-6 bg-red-600 rounded-full border-2 border-white"/></button>
                          </div>
                      ) : tempImage ? (
                          <div className="relative w-full aspect-square"><img src={tempImage} className="w-full h-full object-cover rounded-lg"/><button onClick={()=>setTempImage(null)} className="absolute top-1 right-1 bg-black/60 p-1 rounded-full"><X size={14}/></button></div>
                      ) : (
                          <div className="flex-1 flex flex-col justify-center gap-2 relative">
                              <Button onClick={startCamera} variant="outline" className="h-10 bg-slate-800 text-slate-300"><Camera size={16} className="mr-2"/> Kamera</Button>
                              <div className="relative h-10 w-full group">
                                  <div className="absolute inset-0 border border-slate-700 bg-slate-800 text-slate-300 flex items-center justify-center rounded-md text-sm font-medium"> <Upload size={16} className="mr-2"/> Yükle </div>
                                  <input type="file" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50"/>
                              </div>
                          </div>
                      )}
                      {!isCameraActive && <div className="flex flex-col gap-2"><input type="text" value={newPersonName} onChange={e=>setNewPersonName(e.target.value)} placeholder="İsim" className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-center"/><Button onClick={savePerson} size="sm" className="bg-green-600 font-bold">KAYDET</Button></div>}
                      {isCameraActive && <Button variant="ghost" size="sm" onClick={()=>{stopCameraStream();setIsCameraActive(false);}} className="text-red-400 text-xs">İptal</Button>}
                  </div>
                  {profiles.filter(p=>p.category===selectedCategory).map(p=>(
                      <div key={p.id} className="relative bg-slate-900 p-2 rounded-xl border border-slate-800"><img src={p.imageUrl} className="w-full aspect-square object-cover rounded-lg"/><p className="text-center text-xs mt-1 font-bold">{p.name}</p><button onClick={()=>setProfiles(profiles.filter(x=>x.id!==p.id))} className="absolute -top-2 -right-2 bg-red-600 text-white p-1.5 rounded-full"><Trash2 size={12}/></button></div>
                  ))}
             </div>
          </div>
      )}

      {view === 'game' && (
          <div className="flex-1 flex flex-col bg-slate-950 relative overflow-hidden">
              {gamePhase === 'complete' ? (
                  <div className="flex-1 flex flex-col items-center justify-center animate-in zoom-in p-6">
                       <confetti className="absolute inset-0" />
                       <h2 className="text-4xl font-black text-white mb-2">HARİKASIN!</h2>
                       <Button onClick={() => { stopBackgroundMusic(); setView('menu'); }} size="lg" className="bg-green-600 text-white px-10 py-4 text-xl rounded-2xl w-full max-w-sm"><RotateCcw className="mr-2"/> TEKRAR OYNA</Button>
                  </div>
              ) : (
                  <>
                      <div className="pt-6 pb-2 px-4 text-center shrink-0">
                          <Button variant="secondary" size="lg" 
                            onClick={() => {
                                const target = gameQuestions[currentQuestionIndex];
                                const randomTemplate = QUESTION_TEMPLATES[Math.floor(Math.random() * QUESTION_TEMPLATES.length)];
                                speakQuestion(randomTemplate(target.name));
                            }} 
                            className="rounded-full bg-slate-800 text-slate-300 border border-slate-700 px-8 py-6 text-xl">
                              <Play size={32} className="mr-2 text-blue-400 fill-blue-400"/> Tekrar Dinle
                          </Button>
                      </div>

                      <div className="flex-1 flex items-center justify-center p-4">
                          <div className={`max-w-md ${getGridClass(options.length)}`}>
                              
                              {options.map((opt, index) => {
                                  const isTarget = opt.id === gameQuestions[currentQuestionIndex]?.id;
                                  const styleClass = getOptionStyle(opt, isTarget);

                                  // --- PİRAMİT DÜZENİ ---
                                  // Seviye 1 (3 Kişi) ise:
                                  // 0 ve 1. resimler üstte, 2. resim altta ortada ve büyük
                                  let layoutClass = "";
                                  if (options.length === 3) {
                                      if (index === 2) {
                                          layoutClass = "col-span-2 w-3/4 mx-auto aspect-square"; // 3. resim (Altta Ortada)
                                      } else {
                                          layoutClass = "aspect-square"; // Üstteki 2 resim
                                      }
                                  } else {
                                      layoutClass = "aspect-square"; // Diğer seviyeler
                                  }

                                  return (
                                      <motion.div 
                                        key={opt.id} 
                                        layout
                                        onClick={() => handleAnswer(opt)}
                                        whileTap={{ scale: 0.95 }}
                                        className={`
                                            relative rounded-3xl overflow-hidden border-[6px] cursor-pointer bg-slate-800 transition-all duration-300
                                            ${styleClass} ${layoutClass}
                                        `}
                                      >
                                          <img src={opt.imageUrl} className="w-full h-full object-cover pointer-events-none" />
                                          {!opt.isDummy && (
                                              <div className="absolute bottom-0 inset-x-0 bg-black/40 text-center py-2">
                                                  <span className="text-sm font-black text-white px-1 drop-shadow-md">{opt.name}</span>
                                              </div>
                                          )}
                                          
                                          <AnimatePresence>
                                            {gamePhase === 'success' && isTarget && (
                                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute inset-0 bg-green-500/40 flex items-center justify-center">
                                                    <Check size={90} className="text-white drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)]" strokeWidth={5}/>
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
