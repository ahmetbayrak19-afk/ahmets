import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, Trash2, ArrowLeft, Check, Play, Settings, User, Users, GraduationCap, Heart, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

// --- SES DOSYALARI ---
import aferin1 from '../esle/ses/aferin1.mp3';
import aferin2 from '../esle/ses/aferin2.mp3';
import bravo from '../esle/ses/bravo.mp3';
import esledinbravo from '../esle/ses/esledinbravo.mp3';
import harika1 from '../esle/ses/harika1.mp3';
import harika2 from '../esle/ses/harika2.mp3';
import tekrardene1 from '../esle/ses/tekrardene1.mp3';
import tekrardene2 from '../esle/ses/tekrardene2.mp3';
import arkaplanmusic from '../esle/ses/arkaplanmusic.mp3';

// --- RESİM DOSYALARI (IMPORT) ---
import kisi1 from './kisi1.jpg';
import kisi2 from './kisi2.jpg';
import kisi3 from './kisi3.jpg';
import kisi4 from './kisi4.jpg';
import kisi5 from './kisi5.jpg';
import kisi6 from './kisi6.jpg';
import kisi7 from './kisi7.jpg';
import kisi8 from './kisi8.jpg';
import kisi9 from './kisi9.jpg';
import kisi10 from './kisi10.jpg';

const SUCCESS_SOUNDS = [aferin1, aferin2, bravo, esledinbravo, harika1, harika2];
const ERROR_SOUNDS = [tekrardene1, tekrardene2];
const IMPORTED_IMAGES = [kisi1, kisi2, kisi3, kisi4, kisi5, kisi6, kisi7, kisi8, kisi9, kisi10];

type Category = 'ogretmen' | 'aile' | 'tanidik' | 'arkadas';

interface PersonProfile {
  id: string;
  name: string;
  category: Category;
  imageUrl: string;
  isDummy?: boolean;
}

const CATEGORIES: { id: Category; label: string; icon: any; color: string; iconColor: string }[] = [
  { id: 'ogretmen', label: 'Öğretmenlerim', icon: GraduationCap, color: 'border-blue-900 bg-blue-950/20', iconColor: 'text-blue-400' },
  { id: 'aile', label: 'Ailem', icon: Heart, color: 'border-red-900 bg-red-950/20', iconColor: 'text-red-400' },
  { id: 'arkadas', label: 'Arkadaşlarım', icon: Users, color: 'border-green-900 bg-green-950/20', iconColor: 'text-green-400' },
  { id: 'tanidik', label: 'Tanıdıklarım', icon: User, color: 'border-orange-900 bg-orange-950/20', iconColor: 'text-orange-400' },
];

const QUESTION_TEMPLATES = [
    (name: string) => `Hadi göster bakalım, ${name} nerede?`,
    (name: string) => `Hangisi ${name}?`,
    (name: string) => `Bana ${name} olanı bul.`,
    (name: string) => `Peki, ${name} hangisi acaba?`,
    (name: string) => `Hani ${name}, görebiliyor musun?`,
    (name: string) => `Hadi parmağınla ${name} resmine dokun.` 
];

const DUMMY_PROFILES: PersonProfile[] = IMPORTED_IMAGES.map((imgSrc, i) => ({
    id: `dummy-${i + 1}`,
    name: '',
    category: 'tanidik',
    imageUrl: imgSrc, 
    isDummy: true
}));

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
  const [view, setView] = useState<'menu' | 'edit' | 'game'>('menu');
  const [selectedCategory, setSelectedCategory] = useState<Category>('ogretmen');
  const [selectedLevel, setSelectedLevel] = useState<1 | 2 | 3>(1);

  const [profiles, setProfiles] = useState<PersonProfile[]>(() => {
    try {
      if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('insan-tanima-v5');
          return saved ? JSON.parse(saved) : [];
      }
      return [];
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
  
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  // --- SESLERİ YÜKLEMEYE ZORLA ---
  useEffect(() => {
    const initVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            console.log("Sesler yüklendi:", voices.length);
        }
    };
    
    initVoices();
    window.speechSynthesis.onvoiceschanged = initVoices;

    return () => {
      stopCameraStream();
      stopBackgroundMusic();
      window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('insan-tanima-v5', JSON.stringify(profiles));
    }
  }, [profiles]);

  const resetEditor = () => {
      stopCameraStream();
      setIsCameraActive(false);
      setTempImage(null);
      setNewPersonName('');
  };

  const playSuccessSound = () => {
      try {
          const randomSound = SUCCESS_SOUNDS[Math.floor(Math.random() * SUCCESS_SOUNDS.length)];
          const audio = new Audio(randomSound);
          audio.volume = 1.0;
          audio.play().catch(e => console.log("Ses çalınamadı:", e));
      } catch (e) { console.log("Ses hatası"); }
  };

  const playErrorSound = () => {
      try {
          const randomSound = ERROR_SOUNDS[Math.floor(Math.random() * ERROR_SOUNDS.length)];
          const audio = new Audio(randomSound);
          audio.volume = 1.0;
          audio.play().catch(e => console.log("Ses çalınamadı:", e));
      } catch (e) { console.log("Ses hatası"); }
  };

  const playBackgroundMusic = () => {
      try {
          if (!bgMusicRef.current) {
              bgMusicRef.current = new Audio(arkaplanmusic);
              bgMusicRef.current.loop = true;
              bgMusicRef.current.volume = 0.1; 
          }
          bgMusicRef.current.play().catch(e => console.log("Müzik hatası:", e));
      } catch (e) { console.log("Müzik yüklenemedi"); }
  };

  const stopBackgroundMusic = () => {
      if (bgMusicRef.current) {
          bgMusicRef.current.pause();
          bgMusicRef.current.currentTime = 0;
      }
  };

  // --- 🔥 TAMİR EDİLEN VE DEBUG EKLENEN SORU MOTORU 🔥 ---
  const speakQuestion = (text: string, retryCount = 0) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
          toast.error("Tablet ses özelliği kapalı!");
          return;
      }
      
      // Öncekini sustur
      window.speechSynthesis.cancel();

      // Sesleri al
      let voices = window.speechSynthesis.getVoices();

      // 🔥 EĞER SES LİSTESİ BOŞSA BEKLE VE TEKRAR DENE 🔥
      if (voices.length === 0) {
          if (retryCount < 5) { // 5 kereye kadar dene
              setTimeout(() => speakQuestion(text, retryCount + 1), 200); // 200ms bekle tekrar dene
              return;
          } else {
              // 5 kere denedi hala yoksa varsayılanı kullan (Riskli ama sessizlikten iyidir)
              // toast.error("Ses listesi yüklenemedi!"); // Kullanıcıyı panikletmemek için kapattım
          }
      }
      
      const utterance = new SpeechSynthesisUtterance(text);
      speechRef.current = utterance; // Çöp toplayıcı koruması

      // En iyi Türkçe sesi bul
      const trVoice = voices.find(v => v.lang.includes('tr-TR')) || 
                      voices.find(v => v.lang.includes('tr')) || 
                      voices[0]; // Hiçbiri yoksa ilk bulduğunu al
      
      if (trVoice) {
          utterance.voice = trVoice;
          // Test amaçlı ekrana yaz (Sonra kaldırabilirsin)
          // toast.success(`Ses: ${trVoice.name}`); 
      }

      utterance.lang = 'tr-TR'; 
      utterance.rate = 0.9;
      utterance.volume = 1.0;
      
      utterance.onend = () => { speechRef.current = null; };
      utterance.onerror = (e) => { 
          console.log("TTS Hatası:", e);
          // toast.error("Ses motoru hatası!"); 
      };
      
      window.speechSynthesis.speak(utterance);
  };

  const startMixedGame = () => {
      if (profiles.length < 1) {
          toast.error("En az 1 kişi eklemelisiniz.");
          return;
      }

      playBackgroundMusic();
      
      // Motoru ısıt
      speakQuestion(" ");

      const questions = shuffleArray([...profiles]);
      
      setGameQuestions(questions);
      setCurrentQuestionIndex(0);
      setGamePhase('playing');
      setWrongCount(0);
      setView('game');
      
      // Biraz bekle ki oyun sahnesi yüklensin
      setTimeout(() => {
          generateOptions(questions[0], profiles);
      }, 500);
  };

  const generateOptions = (target: PersonProfile, pool: PersonProfile[]) => {
      setWrongCount(0); 
      
      let requiredCount = 3;
      if (selectedLevel === 2) requiredCount = 4;
      if (selectedLevel === 3) requiredCount = 6;

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

      // Soruyu sor
      const randomTemplate = QUESTION_TEMPLATES[Math.floor(Math.random() * QUESTION_TEMPLATES.length)];
      setTimeout(() => speakQuestion(randomTemplate(target.name)), 800);
  };

  const handleAnswer = (selected: PersonProfile) => {
      if (gamePhase !== 'playing') return;

      const target = gameQuestions[currentQuestionIndex];

      if (selected.id === target.id) {
          setGamePhase('success');
          playSuccessSound();
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });

          setTimeout(() => {
              const next = currentQuestionIndex + 1;
              if (next < gameQuestions.length) {
                  setCurrentQuestionIndex(next);
                  setGamePhase('playing');
                  generateOptions(gameQuestions[next], profiles);
              } else {
                  setGamePhase('complete');
                  stopBackgroundMusic();
                  playSuccessSound();
                  confetti();
              }
          }, 2500); 
      } else {
          setWrongCount(prev => prev + 1);
          playErrorSound();
      }
  };

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

  const getGridClass = () => "grid grid-cols-2 gap-4 w-full"; 

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
                else { resetEditor(); stopBackgroundMusic(); setView('menu'); } 
            }} className="p-2 bg-slate-800 rounded-full active:scale-95">
                <ArrowLeft size={20} className="text-slate-300"/>
            </button>
            <h1 className="text-lg font-bold">{view === 'menu' ? 'İnsan Tanıma' : view === 'edit' ? 'Kişi Ekle' : 'Oyun'}</h1>
        </div>
      </div>

      {view === 'menu' && (
          <div className="flex-1 flex flex-col p-4">
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto flex-1 content-start w-full">
                  {CATEGORIES.map(cat => (
                      <div key={cat.id} className={`p-4 rounded-2xl border-2 ${cat.color} bg-slate-900/60 flex flex-col items-center justify-center gap-3 aspect-square shadow-lg`}>
                          <div className={`p-3 rounded-full bg-slate-900 border border-slate-800 ${cat.iconColor}`}>
                              <cat.icon size={32} />
                          </div>
                          <div className="text-center">
                              <span className="text-3xl font-black block text-white">{profiles.filter(p => p.category === cat.id).length}/10</span>
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">{cat.label}</span>
                          </div>
                          <Button size="sm" onClick={() => { resetEditor(); setSelectedCategory(cat.id); setView('edit'); }} className="mt-2 bg-slate-800 hover:bg-slate-700 text-xs px-4 h-8 rounded-full border border-slate-700">
                              <Settings size={14} className="mr-1"/> DÜZENLE
                          </Button>
                      </div>
                  ))}
              </div>

              {/* SEVİYE SEÇME BUTONLARI */}
              <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 mt-4">
                  <p className="text-center text-xs text-slate-400 font-bold mb-2 uppercase tracking-widest">Zorluk Seviyesi</p>
                  <div className="flex gap-2">
                      {[1, 2, 3].map((lvl) => (
                          <button
                              key={lvl}
                              onClick={() => setSelectedLevel(lvl as 1|2|3)}
                              className={`
                                  flex-1 py-3 rounded-xl font-black text-lg transition-all active:scale-95 border-b-4
                                  ${selectedLevel === lvl 
                                      ? 'bg-blue-600 text-white border-blue-800 shadow-blue-900/50 shadow-lg translate-y-0' 
                                      : 'bg-slate-800 text-slate-400 border-slate-950 hover:bg-slate-700'}
                              `}
                          >
                              {lvl}. SEVİYE
                              <span className="block text-[10px] font-normal opacity-70">
                                  {lvl === 1 ? '3 Resim' : lvl === 2 ? '4 Resim' : '6 Resim'}
                              </span>
                          </button>
                      ))}
                  </div>
              </div>

              <Button size="lg" onClick={startMixedGame} className="w-full py-6 text-xl font-black bg-green-600 hover:bg-green-500 rounded-2xl mt-4 shadow-xl border-b-4 border-green-800 active:border-b-0 active:translate-y-1 transition-all">
                  <Play size={28} className="mr-3 fill-white"/> OYUNA BAŞLA
              </Button>
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
                      {/* SORU TEKRAR BUTONU */}
                      <div className="pt-6 pb-2 px-4 text-center shrink-0">
                          <Button variant="secondary" size="lg" 
                            onClick={() => {
                                const target = gameQuestions[currentQuestionIndex];
                                const randomTemplate = QUESTION_TEMPLATES[Math.floor(Math.random() * QUESTION_TEMPLATES.length)];
                                speakQuestion(randomTemplate(target.name));
                            }} 
                            className="rounded-full bg-slate-800 text-slate-300 border border-slate-700 px-8 py-4 text-lg active:scale-95 transition-transform">
                              <Play size={28} className="mr-2 text-blue-400 fill-blue-400"/> Tekrar Dinle
                          </Button>
                      </div>

                      <div className="flex-1 flex items-center justify-center p-4">
                          <div className={`max-w-md ${getGridClass()}`}>
                              
                              {options.map((opt, index) => {
                                  const isTarget = opt.id === gameQuestions[currentQuestionIndex]?.id;
                                  const styleClass = getOptionStyle(opt, isTarget);

                                  let containerClass = "";
                                  let innerClass = ""; 

                                  if (options.length === 3) {
                                      if (index === 2) {
                                          containerClass = "col-span-2 flex justify-center"; 
                                          innerClass = "w-1/2 aspect-square"; 
                                      } else {
                                          containerClass = "";
                                          innerClass = "w-full aspect-square";
                                      }
                                  } else {
                                      containerClass = "";
                                      innerClass = "w-full aspect-square";
                                  }

                                  return (
                                      <div key={opt.id} className={containerClass}>
                                          <motion.div 
                                            layout
                                            onClick={() => handleAnswer(opt)}
                                            whileTap={{ scale: 0.95 }}
                                            className={`
                                                ${innerClass}
                                                relative rounded-3xl overflow-hidden border-[6px] cursor-pointer bg-slate-800 transition-all duration-300
                                                ${styleClass}
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
                                      </div>
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
