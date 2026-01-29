import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, Upload, Trash2, ArrowLeft, Check, Play, Settings, User, Users, GraduationCap, Heart, X, Plus, Image as ImageIcon } from 'lucide-react';
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
}

// --- KATEGORİLER ---
const CATEGORIES: { id: Category; label: string; icon: any; color: string; iconColor: string }[] = [
  { id: 'ogretmen', label: 'Öğretmenlerim', icon: GraduationCap, color: 'border-blue-900 bg-blue-950/20', iconColor: 'text-blue-400' },
  { id: 'aile', label: 'Ailem', icon: Heart, color: 'border-red-900 bg-red-950/20', iconColor: 'text-red-400' },
  { id: 'arkadas', label: 'Arkadaşlarım', icon: Users, color: 'border-green-900 bg-green-950/20', iconColor: 'text-green-400' },
  { id: 'tanidik', label: 'Tanıdıklarım', icon: User, color: 'border-orange-900 bg-orange-950/20', iconColor: 'text-orange-400' },
];

interface GameProps {
  onClose: () => void;
}

export default function AliciGame4({ onClose }: GameProps) {
  // --- STATE'LER ---
  const [view, setView] = useState<'menu' | 'edit' | 'game'>('menu');
  const [selectedCategory, setSelectedCategory] = useState<Category>('ogretmen');
  
  // PROFİLLERİ YÜKLE (Hata riskine karşı güvenli yükleme - v4)
  const [profiles, setProfiles] = useState<PersonProfile[]>(() => {
    try {
      const saved = localStorage.getItem('insan-tanima-v4');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // Editör State'leri
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const [tempImage, setTempImage] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Oyun State'leri
  const [gameQuestions, setGameQuestions] = useState<PersonProfile[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [options, setOptions] = useState<PersonProfile[]>([]);
  const [gamePhase, setGamePhase] = useState<'playing' | 'success' | 'fail' | 'complete'>('playing');

  // Ses
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  // 1. SCROLL KİLİTLEME (Arka sayfa kaymasın diye)
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
      stopCameraStream(); // Çıkarken kamerayı kapat
    };
  }, []);

  // 2. VERİ KAYDETME
  useEffect(() => {
    localStorage.setItem('insan-tanima-v4', JSON.stringify(profiles));
  }, [profiles]);

  // 3. SESLERİ YÜKLE
  useEffect(() => {
    const loadVoices = () => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            setVoices(window.speechSynthesis.getVoices());
        }
    };
    loadVoices();
    if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  // --- TTS ---
  const speak = (text: string) => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const trVoice = voices.find(v => v.lang.includes('tr'));
      if (trVoice) utterance.voice = trVoice;
      utterance.lang = 'tr-TR';
      window.speechSynthesis.speak(utterance);
  };

  // --- KAMERA FONKSİYONLARI ---
  const startCamera = async () => {
    setTempImage(null);
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 512 }, height: { ideal: 512 } } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error(err);
      toast.error("Kameraya erişilemedi. İzinleri kontrol edin.");
      setIsCameraActive(false);
    }
  };

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    // Kare Kırpma (Otomatik ortalar)
    const size = Math.min(videoRef.current.videoWidth, videoRef.current.videoHeight);
    canvas.width = size;
    canvas.height = size;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
        const startX = (videoRef.current.videoWidth - size) / 2;
        const startY = (videoRef.current.videoHeight - size) / 2;
        ctx.drawImage(videoRef.current, startX, startY, size, size, 0, 0, size, size);
        setTempImage(canvas.toDataURL('image/jpeg', 0.8));
    }
    
    stopCameraStream();
    setIsCameraActive(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        setTempImage(event.target?.result as string);
        setIsCameraActive(false);
    };
    reader.readAsDataURL(file);
  };

  const savePerson = () => {
      if (!newPersonName || !tempImage) {
          toast.warning("İsim yazın ve fotoğraf ekleyin.");
          return;
      }
      const newProfile: PersonProfile = {
          id: Date.now().toString(),
          name: newPersonName,
          category: selectedCategory,
          imageUrl: tempImage
      };
      setProfiles([...profiles, newProfile]);
      setNewPersonName('');
      setTempImage(null);
      stopCameraStream();
      setIsCameraActive(false);
      toast.success("Kişi eklendi!");
  };

  // --- OYUN MANTIĞI ---
  const startMixedGame = () => {
      if (profiles.length < 2) {
          toast.error("Oynamak için en az 2 kişi eklemelisiniz.");
          return;
      }
      const questions = [...profiles].sort(() => 0.5 - Math.random());
      setGameQuestions(questions);
      setCurrentQuestionIndex(0);
      setGamePhase('playing');
      setView('game');
      generateOptions(questions[0], profiles);
  };

  const generateOptions = (target: PersonProfile, pool: PersonProfile[]) => {
      const other = pool.filter(p => p.id !== target.id).sort(() => 0.5 - Math.random());
      const distractors = other.slice(0, Math.min(3, other.length));
      const opts = [target, ...distractors].sort(() => 0.5 - Math.random());
      setOptions(opts);
      setTimeout(() => speak(`Bana ${target.name} kişisini göster.`), 500);
  };

  const handleAnswer = (selected: PersonProfile) => {
      const target = gameQuestions[currentQuestionIndex];
      if (selected.id === target.id) {
          setGamePhase('success');
          speak("Harikasın!");
          setTimeout(() => {
              const next = currentQuestionIndex + 1;
              if (next < gameQuestions.length) {
                  setCurrentQuestionIndex(next);
                  setGamePhase('playing');
                  generateOptions(gameQuestions[next], profiles);
              } else {
                  setGamePhase('complete');
                  speak("Tebrikler bitti!");
                  confetti();
              }
          }, 1500);
      } else {
          setGamePhase('fail');
          speak(`Hayır, bu değil. Bana ${target.name} kişisini göster.`);
          setTimeout(() => setGamePhase('playing'), 1500);
      }
  };

  // --- RENDER ---
  return (
    <div className="fixed inset-0 z-[500] bg-slate-950 flex flex-col font-sans text-slate-100 touch-none">
      
      {/* ÜST BAR */}
      <div className="bg-slate-900 border-b border-slate-800 p-3 flex justify-between items-center z-10 shrink-0">
        <div className="flex items-center gap-3">
            <button onClick={view === 'menu' ? onClose : () => setView('menu')} className="p-2 bg-slate-800 rounded-full active:scale-95">
                <ArrowLeft size={20} className="text-slate-300"/>
            </button>
            <h1 className="text-lg font-bold">
                {view === 'menu' ? 'İnsan Tanıma' : view === 'edit' ? 'Kişi Ekle' : 'Oyun'}
            </h1>
        </div>
      </div>

      {/* --- 1. MENÜ --- */}
      {view === 'menu' && (
          <div className="flex-1 flex flex-col overflow-hidden">
              {/* Scrollable İçerik */}
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
                                      <span className="text-2xl font-black block">{count}</span>
                                      <span className="text-xs font-bold text-slate-400">{cat.label}</span>
                                  </div>
                                  <Button 
                                    size="sm" 
                                    onClick={() => { setSelectedCategory(cat.id); setView('edit'); }}
                                    className="w-full mt-auto bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs h-8"
                                  >
                                      <Settings size={14} className="mr-1"/> EKLE
                                  </Button>
                              </div>
                          );
                      })}
                  </div>
              </div>

              {/* SABİT ALT BUTON */}
              <div className="p-4 bg-slate-900 border-t border-slate-800 shrink-0">
                  <Button 
                    size="lg" 
                    onClick={startMixedGame}
                    disabled={profiles.length < 2}
                    className="w-full py-6 text-lg font-black rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      <Play size={24} className="mr-2 fill-white" />
                      OYUNA BAŞLA
                  </Button>
                  {profiles.length < 2 && <p className="text-center text-[10px] text-slate-500 mt-2">En az 2 kişi eklemelisin.</p>}
              </div>
          </div>
      )}

      {/* --- 2. EDİTÖR (EKLEME) --- */}
      {view === 'edit' && (
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
              <div className="flex-1 overflow-y-auto p-4 overscroll-contain">
                  <h2 className="text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider">
                      {CATEGORIES.find(c => c.id === selectedCategory)?.label} Listesi
                  </h2>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                      {/* EKLEME KARTI */}
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
                              <div className="flex-1 flex flex-col justify-center gap-2">
                                  <Button onClick={startCamera} variant="outline" className="h-10 border-slate-700 bg-slate-800 text-slate-300">
                                      <Camera size={16} className="mr-2"/> Kamera
                                  </Button>
                                  <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="h-10 border-slate-700 bg-slate-800 text-slate-300">
                                      <Upload size={16} className="mr-2"/> Yükle
                                  </Button>
                                  <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileUpload} />
                              </div>
                          )}

                          {!isCameraActive && (
                              <div className="flex flex-col gap-2">
                                  <input 
                                    type="text" 
                                    value={newPersonName}
                                    onChange={(e) => setNewPersonName(e.target.value)}
                                    placeholder="İsim Girin"
                                    className="w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1.5 text-center text-sm text-white placeholder:text-slate-600 focus:border-blue-500 outline-none"
                                  />
                                  <Button onClick={savePerson} size="sm" className="w-full bg-green-600 hover:bg-green-500 font-bold">KAYDET</Button>
                              </div>
                          )}
                          
                          {isCameraActive && <Button variant="ghost" size="sm" onClick={() => { stopCameraStream(); setIsCameraActive(false); }} className="text-red-400 text-xs h-6">İptal</Button>}
                      </div>

                      {/* MEVCUT KİŞİLER */}
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

      {/* --- 3. OYUN --- */}
      {view === 'game' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-950 relative">
              {gamePhase === 'complete' ? (
                  <div className="text-center animate-in zoom-in">
                       <h2 className="text-4xl font-black text-white mb-6">TEBRİKLER!</h2>
                       <Button onClick={() => setView('menu')} size="lg" className="bg-green-600 text-white px-10 py-4 text-xl rounded-2xl">ÇIKIŞ</Button>
                  </div>
              ) : (
                  <>
                      <div className="mb-8 text-center w-full">
                          <h2 className="text-2xl font-bold text-white mb-4">Hadi bana <span className="text-blue-400 underline decoration-wavy">{gameQuestions[currentQuestionIndex]?.name}</span> kişisini göster</h2>
                          <Button variant="secondary" size="sm" onClick={() => speak(`Bana ${gameQuestions[currentQuestionIndex]?.name} kişisini göster`)} className="rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"><Play size={16} className="mr-2"/> Tekrar Dinle</Button>
                      </div>

                      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                          {options.map((opt) => (
                              <motion.div 
                                key={opt.id} 
                                onClick={() => handleAnswer(opt)}
                                whileTap={{ scale: 0.95 }}
                                className={`
                                    relative aspect-square rounded-2xl overflow-hidden border-4 cursor-pointer bg-slate-800
                                    ${gamePhase === 'success' && opt.id === gameQuestions[currentQuestionIndex].id ? 'border-green-500' : 'border-slate-700 hover:border-slate-500'}
                                    ${gamePhase === 'fail' && opt.id !== gameQuestions[currentQuestionIndex].id ? 'opacity-30 grayscale' : ''}
                                `}
                              >
                                  <img src={opt.imageUrl} className="w-full h-full object-cover" />
                                  {gamePhase === 'success' && opt.id === gameQuestions[currentQuestionIndex].id && 
                                    <div className="absolute inset-0 bg-green-500/40 flex items-center justify-center"><Check size={64} className="text-white drop-shadow-md"/></div>
                                  }
                              </motion.div>
                          ))}
                      </div>
                  </>
              )}
          </div>
      )}
    </div>
  );
                        }
