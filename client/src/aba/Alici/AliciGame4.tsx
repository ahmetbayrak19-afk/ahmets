import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, Trash2, Save, ArrowLeft, Check, Play, Settings, User, Users, GraduationCap, Heart, X, Plus } from 'lucide-react';
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

// --- KATEGORİ TANIMLARI (KOYU TEMA İÇİN RENKLER GÜNCELLENDİ) ---
const CATEGORIES: { id: Category; label: string; icon: any; color: string; iconColor: string }[] = [
  { id: 'ogretmen', label: 'Öğretmenlerim', icon: GraduationCap, color: 'bg-blue-950/30 border-blue-900', iconColor: 'text-blue-400' },
  { id: 'aile', label: 'Ailem', icon: Heart, color: 'bg-red-950/30 border-red-900', iconColor: 'text-red-400' },
  { id: 'arkadas', label: 'Arkadaşlarım', icon: Users, color: 'bg-green-950/30 border-green-900', iconColor: 'text-green-400' },
  { id: 'tanidik', label: 'Tanıdıklarım', icon: User, color: 'bg-orange-950/30 border-orange-900', iconColor: 'text-orange-400' },
];

interface GameProps {
  onClose: () => void;
}

export default function AliciGame4({ onClose }: GameProps) {
  // --- STATE'LER ---
  const [view, setView] = useState<'menu' | 'edit' | 'game'>('menu');
  const [selectedCategory, setSelectedCategory] = useState<Category>('ogretmen');
  
  // PROFİLLERİ GÜVENLİ YÜKLE
  const [profiles, setProfiles] = useState<PersonProfile[]>(() => {
    try {
      const saved = localStorage.getItem('insan-tanima-profiller-dark');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // Editör State'leri
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const [tempImage, setTempImage] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Oyun State'leri
  const [gameQuestions, setGameQuestions] = useState<PersonProfile[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [options, setOptions] = useState<PersonProfile[]>([]);
  const [gamePhase, setGamePhase] = useState<'playing' | 'success' | 'fail' | 'complete'>('playing');

  // Ses
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    localStorage.setItem('insan-tanima-profiller-dark', JSON.stringify(profiles));
  }, [profiles]);

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

  // --- KAMERA / UPLOAD ---
  const startCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      toast.error("Kamera hatası.");
      setIsCameraOpen(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    // Kare Kırpma Basitleştirilmiş
    const size = Math.min(videoRef.current.videoWidth, videoRef.current.videoHeight);
    canvas.width = size;
    canvas.height = size;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
        const startX = (videoRef.current.videoWidth - size) / 2;
        const startY = (videoRef.current.videoHeight - size) / 2;
        ctx.drawImage(videoRef.current, startX, startY, size, size, 0, 0, size, size);
        setTempImage(canvas.toDataURL('image/jpeg'));
    }
    
    const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
    tracks.forEach(t => t.stop());
    setIsCameraOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        // Yüklenen resmi kare yapma işlemi canvas ile yapılabilir ama
        // şimdilik siyah ekran riskini azaltmak için direkt alıyorum.
        setTempImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const savePerson = () => {
      if (!newPersonName || !tempImage) {
          toast.warning("İsim ve fotoğraf gerekli.");
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
      toast.success("Kişi eklendi!");
  };

  // --- OYUN BAŞLATMA (KARIŞIK) ---
  const startMixedGame = () => {
      // Tüm kategorilerden kişileri al
      if (profiles.length < 2) {
          toast.error("Oyun için toplamda en az 2 kişi eklemelisiniz.");
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
      // Maksimum 4 seçenek
      const distractors = other.slice(0, Math.min(3, other.length));
      const opts = [target, ...distractors].sort(() => 0.5 - Math.random());
      setOptions(opts);
      
      setTimeout(() => speak(`Hadi bana, ${target.name}, kişisini göster.`), 500);
  };

  const handleAnswer = (selected: PersonProfile) => {
      const target = gameQuestions[currentQuestionIndex];
      if (selected.id === target.id) {
          // Doğru
          setGamePhase('success');
          speak("Aferin!");
          setTimeout(() => {
              const next = currentQuestionIndex + 1;
              if (next < gameQuestions.length) {
                  setCurrentQuestionIndex(next);
                  setGamePhase('playing');
                  generateOptions(gameQuestions[next], profiles);
              } else {
                  setGamePhase('complete');
                  speak("Oyun bitti!");
                  confetti();
              }
          }, 1500);
      } else {
          // Yanlış
          setGamePhase('fail');
          speak(`Hayır. Bana ${target.name} kişisini göster.`);
          setTimeout(() => setGamePhase('playing'), 1500);
      }
  };

  // --- RENDER ---
  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col font-sans overflow-hidden text-slate-100">
      
      {/* ÜST BAR */}
      <div className="bg-slate-900/50 border-b border-slate-800 p-4 flex justify-between items-center backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
            <button onClick={view === 'menu' ? onClose : () => setView('menu')} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors">
                <ArrowLeft size={20} className="text-slate-300"/>
            </button>
            <h1 className="text-lg font-bold text-slate-100">
                {view === 'menu' ? 'İnsan Tanıma' : view === 'edit' ? 'Kişi Ekleme' : 'Oyun'}
            </h1>
        </div>
      </div>

      {/* --- 1. MENÜ (KATEGORİLER + BAŞLA) --- */}
      {view === 'menu' && (
          <div className="flex-1 flex flex-col">
              <div className="flex-1 p-6 overflow-y-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
                      {CATEGORIES.map(cat => {
                          const count = profiles.filter(p => p.category === cat.id).length;
                          return (
                              <div key={cat.id} className={`p-5 rounded-2xl border ${cat.color} bg-slate-900/40 relative group`}>
                                  <div className="flex justify-between items-start mb-2">
                                      <div className={`p-3 rounded-xl bg-slate-900 border border-slate-800 ${cat.iconColor}`}>
                                          <cat.icon size={28} />
                                      </div>
                                      <div className="text-right">
                                          <span className="text-2xl font-black block leading-none">{count}</span>
                                          <span className="text-[10px] uppercase font-bold opacity-50">Kişi</span>
                                      </div>
                                  </div>
                                  
                                  <div className="mb-4">
                                      <h3 className="text-lg font-bold text-white">{cat.label}</h3>
                                  </div>

                                  <Button 
                                    size="sm" 
                                    onClick={() => { setSelectedCategory(cat.id); setView('edit'); }}
                                    className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300"
                                  >
                                      <Plus size={16} className="mr-2"/> EKLE / DÜZENLE
                                  </Button>
                              </div>
                          );
                      })}
                  </div>
              </div>

              {/* ALTTA GİRİŞ BUTONU */}
              <div className="p-6 bg-slate-900 border-t border-slate-800 safe-area-bottom">
                  <Button 
                    size="lg" 
                    onClick={startMixedGame}
                    disabled={profiles.length < 2}
                    className="w-full py-8 text-xl font-black rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-xl shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      <Play size={28} className="mr-3 fill-white" />
                      OYUNA BAŞLA
                  </Button>
                  {profiles.length < 2 && (
                      <p className="text-center text-xs text-slate-500 mt-3">
                          Oynamak için kategorilere girip toplam en az 2 kişi ekleyin.
                      </p>
                  )}
              </div>
          </div>
      )}

      {/* --- 2. DÜZENLEME (EKLEME) --- */}
      {view === 'edit' && (
          <div className="flex-1 flex flex-col sm:flex-row overflow-hidden bg-slate-950">
              
              {/* LİSTE */}
              <div className="flex-1 p-6 overflow-y-auto border-r border-slate-800">
                  <div className="flex justify-between items-center mb-6">
                      <h2 className="text-lg font-bold text-slate-300">
                          {CATEGORIES.find(c => c.id === selectedCategory)?.label} Listesi
                      </h2>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {profiles.filter(p => p.category === selectedCategory).map(person => (
                          <div key={person.id} className="relative group bg-slate-900 p-2 rounded-xl border border-slate-800">
                              <img src={person.imageUrl} className="w-full aspect-square object-cover rounded-lg bg-slate-800" />
                              <p className="text-center font-bold text-sm mt-2 text-slate-300">{person.name}</p>
                              <button onClick={() => setProfiles(profiles.filter(p => p.id !== person.id))} className="absolute -top-2 -right-2 bg-red-600 text-white p-1.5 rounded-full"><Trash2 size={14}/></button>
                          </div>
                      ))}
                      
                      {/* YENİ EKLEME KARTI */}
                      <div className="bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center gap-4 min-h-[200px]">
                          {isCameraOpen ? (
                              <div className="relative w-full aspect-square bg-black rounded-lg overflow-hidden">
                                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                                  <button onClick={capturePhoto} className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white rounded-full p-2"><div className="w-8 h-8 bg-red-600 rounded-full"></div></button>
                              </div>
                          ) : tempImage ? (
                              <div className="relative w-full aspect-square">
                                  <img src={tempImage} className="w-full h-full object-cover rounded-lg" />
                                  <button onClick={() => setTempImage(null)} className="absolute top-1 right-1 bg-black/50 p-1 rounded-full"><X size={16}/></button>
                              </div>
                          ) : (
                              <div className="flex flex-col items-center gap-2">
                                  <Button variant="outline" onClick={() => setIsCameraOpen(true)} className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"><Camera className="mr-2 h-4 w-4"/> Kamera</Button>
                                  <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"><Upload className="mr-2 h-4 w-4"/> Yükle</Button>
                                  <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileUpload} />
                              </div>
                          )}

                          {!isCameraOpen && (
                              <>
                                <input 
                                    type="text" 
                                    value={newPersonName}
                                    onChange={(e) => setNewPersonName(e.target.value)}
                                    placeholder="İsim Girin"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-center text-white placeholder:text-slate-600 focus:border-blue-500 outline-none"
                                />
                                <Button onClick={savePerson} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold">KAYDET</Button>
                              </>
                          )}
                          
                          {isCameraOpen && <Button variant="ghost" onClick={() => setIsCameraOpen(false)} className="text-red-400">İptal</Button>}
                      </div>
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
                       <Button onClick={() => setView('menu')} size="lg" className="bg-green-600 text-white px-10 py-6 text-xl rounded-2xl">BİTİR</Button>
                  </div>
              ) : (
                  <>
                      <div className="mb-12 text-center">
                          <h2 className="text-3xl font-bold text-white mb-4">Hadi bana <span className="text-blue-400">{gameQuestions[currentQuestionIndex]?.name}</span> kişisini göster</h2>
                          <Button variant="outline" onClick={() => speak(`Hadi bana, ${gameQuestions[currentQuestionIndex]?.name}, kişisini göster`)} className="rounded-full border-slate-700 text-slate-300 hover:bg-slate-900"><Play size={20} className="mr-2"/> Tekrar Dinle</Button>
                      </div>

                      <div className="grid grid-cols-2 gap-6 w-full max-w-2xl">
                          {options.map((opt) => (
                              <motion.div 
                                key={opt.id} 
                                onClick={() => handleAnswer(opt)}
                                whileTap={{ scale: 0.95 }}
                                className={`
                                    relative aspect-square rounded-2xl overflow-hidden border-4 cursor-pointer bg-slate-800
                                    ${gamePhase === 'success' && opt.id === gameQuestions[currentQuestionIndex].id ? 'border-green-500' : 'border-slate-800 hover:border-slate-600'}
                                    ${gamePhase === 'fail' && opt.id !== gameQuestions[currentQuestionIndex].id ? 'opacity-30' : ''}
                                `}
                              >
                                  <img src={opt.imageUrl} className="w-full h-full object-cover" />
                                  {gamePhase === 'success' && opt.id === gameQuestions[currentQuestionIndex].id && 
                                    <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center"><Check size={64} className="text-white"/></div>
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
