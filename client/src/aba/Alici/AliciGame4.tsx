import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, Trash2, Save, ArrowLeft, Check, Play, Settings, User, Users, GraduationCap, Heart, Crop, ZoomIn, Move, ImagePlus, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

// --- YEREL RESİMLER (Jpg olarak) ---
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

// --- VARSAYILAN KİŞİ HAVUZU ---
const DEFAULT_PEOPLE = [
  { id: 'def1', name: 'Bu Kişi', imageUrl: kisi1 },
  { id: 'def2', name: 'Bu Kişi', imageUrl: kisi2 },
  { id: 'def3', name: 'Bu Kişi', imageUrl: kisi3 },
  { id: 'def4', name: 'Bu Kişi', imageUrl: kisi4 },
  { id: 'def5', name: 'Bu Kişi', imageUrl: kisi5 },
  { id: 'def6', name: 'Bu Kişi', imageUrl: kisi6 },
  { id: 'def7', name: 'Bu Kişi', imageUrl: kisi7 },
  { id: 'def8', name: 'Bu Kişi', imageUrl: kisi8 },
  { id: 'def9', name: 'Bu Kişi', imageUrl: kisi9 },
  { id: 'def10', name: 'Bu Kişi', imageUrl: kisi10 },
];

// --- TİPLER ---
type Category = 'ogretmen' | 'aile' | 'tanidik' | 'arkadas';

interface PersonProfile {
  id: string;
  name: string;
  category: Category;
  imageUrl: string;
  isUploaded: boolean; 
}

// --- KATEGORİLER ---
const CATEGORIES: { id: Category; label: string; icon: any; color: string }[] = [
  { id: 'ogretmen', label: 'Öğretmenlerim', icon: GraduationCap, color: 'bg-blue-100 text-blue-600 border-blue-200' },
  { id: 'aile', label: 'Ailem', icon: Heart, color: 'bg-red-100 text-red-600 border-red-200' },
  { id: 'arkadas', label: 'Arkadaşlarım', icon: Users, color: 'bg-green-100 text-green-600 border-green-200' },
  { id: 'tanidik', label: 'Tanıdıklarım', icon: User, color: 'bg-orange-100 text-orange-600 border-orange-200' },
];

interface GameProps {
  onClose: () => void;
}

export default function AliciGame4({ onClose }: GameProps) {
  // --- STATE'LER ---
  const [view, setView] = useState<'menu' | 'edit' | 'crop' | 'game'>('menu');
  const [selectedCategory, setSelectedCategory] = useState<Category>('ogretmen');
  
  // GÜVENLİ YÜKLEME (SİYAH EKRANI ENGELLEMEK İÇİN TRY-CATCH)
  const [profiles, setProfiles] = useState<PersonProfile[]>(() => {
    try {
      const saved = localStorage.getItem('insan-tanima-profiller');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error("Veri okuma hatası, sıfırlandı:", error);
      return [];
    }
  });

  // Editör & Crop State'leri
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
  const [cropZoom, setCropZoom] = useState(1);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Oyun State'leri
  const [gameQuestions, setGameQuestions] = useState<PersonProfile[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [options, setOptions] = useState<PersonProfile[]>([]);
  const [gamePhase, setGamePhase] = useState<'playing' | 'success' | 'fail' | 'complete'>('playing');
  const [score, setScore] = useState(0);

  // Ses Motoru
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  useEffect(() => {
    const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  useEffect(() => {
    localStorage.setItem('insan-tanima-profiller', JSON.stringify(profiles));
  }, [profiles]);

  // --- TTS ---
  const speak = (text: string) => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const turkishVoice = voices.find(v => v.lang.includes('tr') && v.name.includes('Google')) || 
                           voices.find(v => v.lang.includes('tr'));
      if (turkishVoice) utterance.voice = turkishVoice;
      utterance.lang = 'tr-TR';
      utterance.rate = 0.9;
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
      toast.error("Kamera açılamadı. İzinleri kontrol edin.");
      setIsCameraOpen(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    setRawImage(canvas.toDataURL('image/jpeg'));
    
    const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
    tracks.forEach(t => t.stop());
    setIsCameraOpen(false);
    
    setCropPosition({ x: 0, y: 0 });
    setCropZoom(1);
    setView('crop');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        setRawImage(event.target?.result as string);
        setCropPosition({ x: 0, y: 0 });
        setCropZoom(1);
        setView('crop');
    };
    reader.readAsDataURL(file);
  };

  // --- CROP ---
  const finalizeCrop = () => {
      if (!rawImage || !canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.src = rawImage;
      
      img.onload = () => {
          const outputSize = 400; 
          canvas.width = outputSize;
          canvas.height = outputSize;

          if(ctx) {
              ctx.clearRect(0, 0, outputSize, outputSize);
              ctx.fillStyle = "#ffffff";
              ctx.fillRect(0,0, outputSize, outputSize);
              
              const ratio = Math.max(outputSize / img.width, outputSize / img.height);
              const baseWidth = img.width * ratio;
              const baseHeight = img.height * ratio;

              const finalWidth = baseWidth * cropZoom;
              const finalHeight = baseHeight * cropZoom;

              const centerX = (outputSize - finalWidth) / 2 + cropPosition.x;
              const centerY = (outputSize - finalHeight) / 2 + cropPosition.y;

              ctx.drawImage(img, centerX, centerY, finalWidth, finalHeight);
              
              const finalImage = canvas.toDataURL('image/jpeg');
              
              if (!newPersonName) {
                  toast.warning("Lütfen isim girin.");
                  return;
              }

              const newProfile: PersonProfile = {
                  id: Date.now().toString(),
                  name: newPersonName,
                  category: selectedCategory,
                  imageUrl: finalImage,
                  isUploaded: true
              };
              
              setProfiles([...profiles, newProfile]);
              setNewPersonName('');
              setRawImage(null);
              setView('edit');
              toast.success("Kişi eklendi!");
          }
      };
  };

  const deletePerson = (id: string) => {
      if(confirm("Silmek istiyor musunuz?")) {
          setProfiles(profiles.filter(p => p.id !== id));
      }
  };

  // --- OYUN ---
  const startGame = (category: Category) => {
      const uploadedInCat = profiles.filter(p => p.category === category && p.isUploaded);
      
      if (uploadedInCat.length < 1) {
          toast.error("Oynamak için en az 1 kişi eklemelisiniz.");
          return;
      }

      const questions = [...uploadedInCat].sort(() => 0.5 - Math.random());
      setGameQuestions(questions);
      setCurrentQuestionIndex(0);
      setScore(0);
      setGamePhase('playing');
      setView('game');
      generateOptions(questions[0], uploadedInCat);
  };

  const generateOptions = (target: PersonProfile, uploadedPool: PersonProfile[]) => {
      let currentOptions = [target];
      const otherUploaded = uploadedPool.filter(p => p.id !== target.id);
      
      let totalOptionsNeeded = 2;
      if (uploadedPool.length >= 3) totalOptionsNeeded = 3; 
      if (uploadedPool.length >= 4 || (uploadedPool.length < 3)) totalOptionsNeeded = 4;

      currentOptions = [...currentOptions, ...otherUploaded].slice(0, totalOptionsNeeded);

      if (currentOptions.length < totalOptionsNeeded) {
          const defaultsNeeded = totalOptionsNeeded - currentOptions.length;
          const randomDefaults = [...DEFAULT_PEOPLE].sort(() => 0.5 - Math.random()).slice(0, defaultsNeeded);
          
          const formattedDefaults: PersonProfile[] = randomDefaults.map(d => ({
              ...d,
              category: 'tanidik',
              isUploaded: false
          }));
          
          currentOptions = [...currentOptions, ...formattedDefaults];
      }

      setOptions(currentOptions.sort(() => 0.5 - Math.random()));
      
      setTimeout(() => {
          speak(`Hadi bana, ${target.name}, kişisini göster.`);
      }, 600);
  };

  const handleAnswer = (selected: PersonProfile) => {
      const currentTarget = gameQuestions[currentQuestionIndex];
      
      if (selected.id === currentTarget.id) {
          const audio = new Audio("https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg");
          audio.play().catch(()=>{});
          setGamePhase('success');
          speak("Harikasın!");
          setScore(s => s + 1);
          
          setTimeout(() => {
              const nextIdx = currentQuestionIndex + 1;
              if (nextIdx < gameQuestions.length) {
                  setCurrentQuestionIndex(nextIdx);
                  setGamePhase('playing');
                  const uploadedInCat = profiles.filter(p => p.category === selectedCategory && p.isUploaded);
                  generateOptions(gameQuestions[nextIdx], uploadedInCat);
              } else {
                  setGamePhase('complete');
                  speak("Oyun bitti, tebrikler!");
                  confetti();
              }
          }, 2000);
      } else {
          const audio = new Audio("https://actions.google.com/sounds/v1/cartoon/clank_car_crash.ogg"); 
          audio.play().catch(()=>{});
          setGamePhase('fail');
          
          setTimeout(() => {
              speak(`Bu değil. Bana, ${currentTarget.name}, kişisini göster.`);
              setGamePhase('playing');
          }, 1500);
      }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col font-sans overflow-hidden">
      
      {/* ÜST BAR */}
      <div className="bg-white border-b p-4 flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center gap-3">
            <button onClick={view === 'menu' ? onClose : () => setView('menu')} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                <ArrowLeft size={20} className="text-slate-600"/>
            </button>
            <h1 className="text-xl font-bold text-slate-800">
                {view === 'menu' ? 'İnsan Tanıma' : view === 'edit' ? 'Kişi Listesi' : view === 'crop' ? 'Fotoğrafı Ayarla' : 'Oyun'}
            </h1>
        </div>
      </div>

      {/* --- 1. MENÜ --- */}
      {view === 'menu' && (
          <div className="flex-1 p-6 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
                  {CATEGORIES.map(cat => {
                      const count = profiles.filter(p => p.category === cat.id && p.isUploaded).length;
                      return (
                          <div key={cat.id} className={`p-6 rounded-2xl border-2 ${cat.color} bg-white shadow-sm hover:shadow-md transition-all flex flex-col gap-4`}>
                              <div className="flex justify-between items-start">
                                  <div className={`p-3 rounded-xl ${cat.color.split(' ')[0]}`}><cat.icon size={32} /></div>
                                  <span className="text-2xl font-black">{count}</span>
                              </div>
                              <div>
                                  <h3 className="text-lg font-bold">{cat.label}</h3>
                                  <p className="text-xs opacity-70 mb-4">{count} Kişi eklendi</p>
                                  <div className="flex gap-2">
                                      <Button variant="outline" className="flex-1 bg-white" onClick={() => { setSelectedCategory(cat.id); setView('edit'); }}>
                                          <Settings size={16} className="mr-2"/> Düzenle
                                      </Button>
                                      <Button className="flex-1" disabled={count < 1} onClick={() => { setSelectedCategory(cat.id); startGame(cat.id); }}>
                                          <Play size={16} className="mr-2"/> Oyna
                                      </Button>
                                  </div>
                              </div>
                          </div>
                      );
                  })}
              </div>
          </div>
      )}

      {/* --- 2. LİSTE & EKLEME --- */}
      {view === 'edit' && (
          <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
              <div className="flex-1 p-6 overflow-y-auto bg-slate-50">
                  <div className="flex justify-between items-center mb-6">
                      <h2 className="text-lg font-bold text-slate-700">Kayıtlı Kişiler</h2>
                      <div className="flex gap-2">
                          <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="bg-white"><Upload size={16} className="mr-2"/> Yükle</Button>
                          <Button onClick={startCamera} className="bg-blue-600 hover:bg-blue-700"><Camera size={16} className="mr-2"/> Kamera</Button>
                          <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileUpload} />
                      </div>
                  </div>

                  {isCameraOpen && (
                      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4">
                          <video ref={videoRef} autoPlay playsInline className="w-full max-w-md bg-black rounded-lg" />
                          <div className="flex gap-4 mt-8">
                              <Button variant="destructive" onClick={() => { setIsCameraOpen(false); }}>İptal</Button>
                              <Button onClick={capturePhoto} className="bg-white text-black">ÇEK</Button>
                          </div>
                      </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {profiles.filter(p => p.category === selectedCategory && p.isUploaded).map(person => (
                          <div key={person.id} className="relative group bg-white p-2 rounded-xl shadow border">
                              <img src={person.imageUrl} alt={person.name} className="w-full aspect-square object-cover rounded-lg" />
                              <p className="text-center font-bold text-sm mt-3">{person.name}</p>
                              <button onClick={() => deletePerson(person.id)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-md"><Trash2 size={14}/></button>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* --- 3. CROP --- */}
      {view === 'crop' && rawImage && (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-900 p-4 relative overflow-y-auto">
              <h2 className="text-white font-bold mb-4">Fotoğrafı Ayarla</h2>
              <div className="relative w-full max-w-md aspect-square bg-black rounded-2xl overflow-hidden border-4 border-white">
                  <div style={{ transform: `scale(${cropZoom}) translate(${cropPosition.x}px, ${cropPosition.y}px)`, transformOrigin: 'center center', transition: 'transform 0.05s linear' }} className="w-full h-full relative">
                      <img src={rawImage} className="w-full h-full object-contain" />
                  </div>
              </div>
              <div className="mt-6 w-full max-w-xs space-y-4 bg-slate-800 p-4 rounded-xl">
                  <div className="space-y-2">
                      <label className="text-xs text-slate-400">Yakınlaştır</label>
                      <input type="range" min="1" max="3" step="0.1" value={cropZoom} onChange={(e) => setCropZoom(parseFloat(e.target.value))} className="w-full h-2 bg-slate-600 rounded-lg"/>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                          <label className="text-xs text-slate-400">Yatay</label>
                          <input type="range" min="-150" max="150" value={cropPosition.x} onChange={(e) => setCropPosition(p => ({...p, x: parseInt(e.target.value)}))} className="w-full h-2 bg-slate-600 rounded-lg"/>
                      </div>
                      <div className="space-y-2">
                          <label className="text-xs text-slate-400">Dikey</label>
                          <input type="range" min="-150" max="150" value={cropPosition.y} onChange={(e) => setCropPosition(p => ({...p, y: parseInt(e.target.value)}))} className="w-full h-2 bg-slate-600 rounded-lg"/>
                      </div>
                  </div>
                  <input type="text" value={newPersonName} onChange={(e) => setNewPersonName(e.target.value)} placeholder="İsim Girin" className="w-full p-2 rounded bg-slate-700 text-white border border-slate-600 text-center font-bold"/>
              </div>
              <div className="mt-6 flex gap-4">
                  <Button variant="ghost" onClick={() => setView('edit')} className="text-slate-400">İptal</Button>
                  <Button onClick={finalizeCrop} className="bg-green-600 text-white">KAYDET</Button>
              </div>
              <canvas ref={canvasRef} hidden></canvas>
          </div>
      )}

           {/* --- 4. OYUN --- */}
            {view === 'game' && (
            <div className="flex-1 flex flex-col items-center justify-center p-4 bg-slate-50 relative">
              {gamePhase === 'complete' ? (
                  <div className="text-center animate-in zoom-in">
                      <Trophy size={100} className="text-yellow-500 mx-auto mb-6 animate-bounce" />
                      <h2 className="text-4xl font-black text-slate-800 mb-2">HARİKA!</h2>
                      <Button onClick={() => setView('menu')} size="lg" className="bg-green-600 hover:bg-green-700 text-white px-12 py-6 text-xl rounded-2xl">TAMAMLA</Button>
                  </div>
              ) : (
                  <>
                      <div className="mb-10 text-center w-full max-w-2xl mx-auto">
                          <h2 className="text-3xl font-bold text-slate-800 mb-4">Hadi bana <span className="text-blue-600">{gameQuestions[currentQuestionIndex]?.name}</span> kişisini göster</h2>
                          <Button onClick={() => s
                    
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, Trash2, Save, ArrowLeft, Check, Play, Settings, User, Users, GraduationCap, Heart, Crop, ZoomIn, Move, ImagePlus, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

// --- YEREL RESİMLER (Jpg olarak) ---
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

// --- VARSAYILAN KİŞİ HAVUZU ---
const DEFAULT_PEOPLE = [
  { id: 'def1', name: 'Bu Kişi', imageUrl: kisi1 },
  { id: 'def2', name: 'Bu Kişi', imageUrl: kisi2 },
  { id: 'def3', name: 'Bu Kişi', imageUrl: kisi3 },
  { id: 'def4', name: 'Bu Kişi', imageUrl: kisi4 },
  { id: 'def5', name: 'Bu Kişi', imageUrl: kisi5 },
  { id: 'def6', name: 'Bu Kişi', imageUrl: kisi6 },
  { id: 'def7', name: 'Bu Kişi', imageUrl: kisi7 },
  { id: 'def8', name: 'Bu Kişi', imageUrl: kisi8 },
  { id: 'def9', name: 'Bu Kişi', imageUrl: kisi9 },
  { id: 'def10', name: 'Bu Kişi', imageUrl: kisi10 },
];

// --- TİPLER ---
type Category = 'ogretmen' | 'aile' | 'tanidik' | 'arkadas';

interface PersonProfile {
  id: string;
  name: string;
  category: Category;
  imageUrl: string;
  isUploaded: boolean; 
}

// --- KATEGORİLER ---
const CATEGORIES: { id: Category; label: string; icon: any; color: string }[] = [
  { id: 'ogretmen', label: 'Öğretmenlerim', icon: GraduationCap, color: 'bg-blue-100 text-blue-600 border-blue-200' },
  { id: 'aile', label: 'Ailem', icon: Heart, color: 'bg-red-100 text-red-600 border-red-200' },
  { id: 'arkadas', label: 'Arkadaşlarım', icon: Users, color: 'bg-green-100 text-green-600 border-green-200' },
  { id: 'tanidik', label: 'Tanıdıklarım', icon: User, color: 'bg-orange-100 text-orange-600 border-orange-200' },
];

interface GameProps {
  onClose: () => void;
}

export default function AliciGame4({ onClose }: GameProps) {
  // --- STATE'LER ---
  const [view, setView] = useState<'menu' | 'edit' | 'crop' | 'game'>('menu');
  const [selectedCategory, setSelectedCategory] = useState<Category>('ogretmen');
  
  // GÜVENLİ YÜKLEME (SİYAH EKRANI ENGELLEMEK İÇİN TRY-CATCH)
  const [profiles, setProfiles] = useState<PersonProfile[]>(() => {
    try {
      const saved = localStorage.getItem('insan-tanima-profiller');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error("Veri okuma hatası, sıfırlandı:", error);
      return [];
    }
  });

  // Editör & Crop State'leri
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
  const [cropZoom, setCropZoom] = useState(1);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Oyun State'leri
  const [gameQuestions, setGameQuestions] = useState<PersonProfile[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [options, setOptions] = useState<PersonProfile[]>([]);
  const [gamePhase, setGamePhase] = useState<'playing' | 'success' | 'fail' | 'complete'>('playing');
  const [score, setScore] = useState(0);

  // Ses Motoru
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  useEffect(() => {
    const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  useEffect(() => {
    localStorage.setItem('insan-tanima-profiller', JSON.stringify(profiles));
  }, [profiles]);

  // --- TTS ---
  const speak = (text: string) => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const turkishVoice = voices.find(v => v.lang.includes('tr') && v.name.includes('Google')) || 
                           voices.find(v => v.lang.includes('tr'));
      if (turkishVoice) utterance.voice = turkishVoice;
      utterance.lang = 'tr-TR';
      utterance.rate = 0.9;
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
      toast.error("Kamera açılamadı. İzinleri kontrol edin.");
      setIsCameraOpen(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    setRawImage(canvas.toDataURL('image/jpeg'));
    
    const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
    tracks.forEach(t => t.stop());
    setIsCameraOpen(false);
    
    setCropPosition({ x: 0, y: 0 });
    setCropZoom(1);
    setView('crop');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        setRawImage(event.target?.result as string);
        setCropPosition({ x: 0, y: 0 });
        setCropZoom(1);
        setView('crop');
    };
    reader.readAsDataURL(file);
  };

  // --- CROP ---
  const finalizeCrop = () => {
      if (!rawImage || !canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.src = rawImage;
      
      img.onload = () => {
          const outputSize = 400; 
          canvas.width = outputSize;
          canvas.height = outputSize;

          if(ctx) {
              ctx.clearRect(0, 0, outputSize, outputSize);
              ctx.fillStyle = "#ffffff";
              ctx.fillRect(0,0, outputSize, outputSize);
              
              const ratio = Math.max(outputSize / img.width, outputSize / img.height);
              const baseWidth = img.width * ratio;
              const baseHeight = img.height * ratio;

              const finalWidth = baseWidth * cropZoom;
              const finalHeight = baseHeight * cropZoom;

              const centerX = (outputSize - finalWidth) / 2 + cropPosition.x;
              const centerY = (outputSize - finalHeight) / 2 + cropPosition.y;

              ctx.drawImage(img, centerX, centerY, finalWidth, finalHeight);
              
              const finalImage = canvas.toDataURL('image/jpeg');
              
              if (!newPersonName) {
                  toast.warning("Lütfen isim girin.");
                  return;
              }

              const newProfile: PersonProfile = {
                  id: Date.now().toString(),
                  name: newPersonName,
                  category: selectedCategory,
                  imageUrl: finalImage,
                  isUploaded: true
              };
              
              setProfiles([...profiles, newProfile]);
              setNewPersonName('');
              setRawImage(null);
              setView('edit');
              toast.success("Kişi eklendi!");
          }
      };
  };

  const deletePerson = (id: string) => {
      if(confirm("Silmek istiyor musunuz?")) {
          setProfiles(profiles.filter(p => p.id !== id));
      }
  };

  // --- OYUN ---
  const startGame = (category: Category) => {
      const uploadedInCat = profiles.filter(p => p.category === category && p.isUploaded);
      
      if (uploadedInCat.length < 1) {
          toast.error("Oynamak için en az 1 kişi eklemelisiniz.");
          return;
      }

      const questions = [...uploadedInCat].sort(() => 0.5 - Math.random());
      setGameQuestions(questions);
      setCurrentQuestionIndex(0);
      setScore(0);
      setGamePhase('playing');
      setView('game');
      generateOptions(questions[0], uploadedInCat);
  };

  const generateOptions = (target: PersonProfile, uploadedPool: PersonProfile[]) => {
      let currentOptions = [target];
      const otherUploaded = uploadedPool.filter(p => p.id !== target.id);
      
      let totalOptionsNeeded = 2;
      if (uploadedPool.length >= 3) totalOptionsNeeded = 3; 
      if (uploadedPool.length >= 4 || (uploadedPool.length < 3)) totalOptionsNeeded = 4;

      currentOptions = [...currentOptions, ...otherUploaded].slice(0, totalOptionsNeeded);

      if (currentOptions.length < totalOptionsNeeded) {
          const defaultsNeeded = totalOptionsNeeded - currentOptions.length;
          const randomDefaults = [...DEFAULT_PEOPLE].sort(() => 0.5 - Math.random()).slice(0, defaultsNeeded);
          
          const formattedDefaults: PersonProfile[] = randomDefaults.map(d => ({
              ...d,
              category: 'tanidik',
              isUploaded: false
          }));
          
          currentOptions = [...currentOptions, ...formattedDefaults];
      }

      setOptions(currentOptions.sort(() => 0.5 - Math.random()));
      
      setTimeout(() => {
          speak(`Hadi bana, ${target.name}, kişisini göster.`);
      }, 600);
  };

  const handleAnswer = (selected: PersonProfile) => {
      const currentTarget = gameQuestions[currentQuestionIndex];
      
      if (selected.id === currentTarget.id) {
          const audio = new Audio("https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg");
          audio.play().catch(()=>{});
          setGamePhase('success');
          speak("Harikasın!");
          setScore(s => s + 1);
          
          setTimeout(() => {
              const nextIdx = currentQuestionIndex + 1;
              if (nextIdx < gameQuestions.length) {
                  setCurrentQuestionIndex(nextIdx);
                  setGamePhase('playing');
                  const uploadedInCat = profiles.filter(p => p.category === selectedCategory && p.isUploaded);
                  generateOptions(gameQuestions[nextIdx], uploadedInCat);
              } else {
                  setGamePhase('complete');
                  speak("Oyun bitti, tebrikler!");
                  confetti();
              }
          }, 2000);
      } else {
          const audio = new Audio("https://actions.google.com/sounds/v1/cartoon/clank_car_crash.ogg"); 
          audio.play().catch(()=>{});
          setGamePhase('fail');
          
          setTimeout(() => {
              speak(`Bu değil. Bana, ${currentTarget.name}, kişisini göster.`);
              setGamePhase('playing');
          }, 1500);
      }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col font-sans overflow-hidden">
      
      {/* ÜST BAR */}
      <div className="bg-white border-b p-4 flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center gap-3">
            <button onClick={view === 'menu' ? onClose : () => setView('menu')} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                <ArrowLeft size={20} className="text-slate-600"/>
            </button>
            <h1 className="text-xl font-bold text-slate-800">
                {view === 'menu' ? 'İnsan Tanıma' : view === 'edit' ? 'Kişi Listesi' : view === 'crop' ? 'Fotoğrafı Ayarla' : 'Oyun'}
            </h1>
        </div>
      </div>

      {/* --- 1. MENÜ --- */}
      {view === 'menu' && (
          <div className="flex-1 p-6 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
                  {CATEGORIES.map(cat => {
                      const count = profiles.filter(p => p.category === cat.id && p.isUploaded).length;
                      return (
                          <div key={cat.id} className={`p-6 rounded-2xl border-2 ${cat.color} bg-white shadow-sm hover:shadow-md transition-all flex flex-col gap-4`}>
                              <div className="flex justify-between items-start">
                                  <div className={`p-3 rounded-xl ${cat.color.split(' ')[0]}`}><cat.icon size={32} /></div>
                                  <span className="text-2xl font-black">{count}</span>
                              </div>
                              <div>
                                  <h3 className="text-lg font-bold">{cat.label}</h3>
                                  <p className="text-xs opacity-70 mb-4">{count} Kişi eklendi</p>
                                  <div className="flex gap-2">
                                      <Button variant="outline" className="flex-1 bg-white" onClick={() => { setSelectedCategory(cat.id); setView('edit'); }}>
                                          <Settings size={16} className="mr-2"/> Düzenle
                                      </Button>
                                      <Button className="flex-1" disabled={count < 1} onClick={() => { setSelectedCategory(cat.id); startGame(cat.id); }}>
                                          <Play size={16} className="mr-2"/> Oyna
                                      </Button>
                                  </div>
                              </div>
                          </div>
                      );
                  })}
              </div>
          </div>
      )}

      {/* --- 2. LİSTE & EKLEME --- */}
      {view === 'edit' && (
          <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
              <div className="flex-1 p-6 overflow-y-auto bg-slate-50">
                  <div className="flex justify-between items-center mb-6">
                      <h2 className="text-lg font-bold text-slate-700">Kayıtlı Kişiler</h2>
                      <div className="flex gap-2">
                          <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="bg-white"><Upload size={16} className="mr-2"/> Yükle</Button>
                          <Button onClick={startCamera} className="bg-blue-600 hover:bg-blue-700"><Camera size={16} className="mr-2"/> Kamera</Button>
                          <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileUpload} />
                      </div>
                  </div>

                  {isCameraOpen && (
                      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4">
                          <video ref={videoRef} autoPlay playsInline className="w-full max-w-md bg-black rounded-lg" />
                          <div className="flex gap-4 mt-8">
                              <Button variant="destructive" onClick={() => { setIsCameraOpen(false); }}>İptal</Button>
                              <Button onClick={capturePhoto} className="bg-white text-black">ÇEK</Button>
                          </div>
                      </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {profiles.filter(p => p.category === selectedCategory && p.isUploaded).map(person => (
                          <div key={person.id} className="relative group bg-white p-2 rounded-xl shadow border">
                              <img src={person.imageUrl} alt={person.name} className="w-full aspect-square object-cover rounded-lg" />
                              <p className="text-center font-bold text-sm mt-3">{person.name}</p>
                              <button onClick={() => deletePerson(person.id)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-md"><Trash2 size={14}/></button>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* --- 3. CROP --- */}
      {view === 'crop' && rawImage && (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-900 p-4 relative overflow-y-auto">
              <h2 className="text-white font-bold mb-4">Fotoğrafı Ayarla</h2>
              <div className="relative w-full max-w-md aspect-square bg-black rounded-2xl overflow-hidden border-4 border-white">
                  <div style={{ transform: `scale(${cropZoom}) translate(${cropPosition.x}px, ${cropPosition.y}px)`, transformOrigin: 'center center', transition: 'transform 0.05s linear' }} className="w-full h-full relative">
                      <img src={rawImage} className="w-full h-full object-contain" />
                  </div>
              </div>
              <div className="mt-6 w-full max-w-xs space-y-4 bg-slate-800 p-4 rounded-xl">
                  <div className="space-y-2">
                      <label className="text-xs text-slate-400">Yakınlaştır</label>
                      <input type="range" min="1" max="3" step="0.1" value={cropZoom} onChange={(e) => setCropZoom(parseFloat(e.target.value))} className="w-full h-2 bg-slate-600 rounded-lg"/>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                          <label className="text-xs text-slate-400">Yatay</label>
                          <input type="range" min="-150" max="150" value={cropPosition.x} onChange={(e) => setCropPosition(p => ({...p, x: parseInt(e.target.value)}))} className="w-full h-2 bg-slate-600 rounded-lg"/>
                      </div>
                      <div className="space-y-2">
                          <label className="text-xs text-slate-400">Dikey</label>
                          <input type="range" min="-150" max="150" value={cropPosition.y} onChange={(e) => setCropPosition(p => ({...p, y: parseInt(e.target.value)}))} className="w-full h-2 bg-slate-600 rounded-lg"/>
                      </div>
                  </div>
                  <input type="text" value={newPersonName} onChange={(e) => setNewPersonName(e.target.value)} placeholder="İsim Girin" className="w-full p-2 rounded bg-slate-700 text-white border border-slate-600 text-center font-bold"/>
              </div>
              <div className="mt-6 flex gap-4">
                  <Button variant="ghost" onClick={() => setView('edit')} className="text-slate-400">İptal</Button>
                  <Button onClick={finalizeCrop} className="bg-green-600 text-white">KAYDET</Button>
              </div>
              <canvas ref={canvasRef} hidden></canvas>
          </div>
      )}

      {/* --- 4. OYUN --- */}
      {view === 'game' && (
          <div className="flex-1 flex flex-col items-center justify-center p-4 bg-slate-50 relative">
              {gamePhase === 'complete' ? (
                  <div className="text-center animate-in zoom-in">
                      <Trophy size={100} className="text-yellow-500 mx-auto mb-6 animate-bounce" />
                      <h2 className="text-4xl font-black text-slate-800 mb-2">HARİKA!</h2>
                      <Button onClick={() => setView('menu')} size="lg" className="bg-green-600 hover:bg-green-700 text-white px-12 py-6 text-xl rounded-2xl">TAMAMLA</Button>
                  </div>
              ) : (
                  <>
                      <div className="mb-10 text-center w-full max-w-2xl mx-auto">
                          <h2 className="text-3xl font-bold text-slate-800 mb-4">Hadi bana <span className="text-blue-600">{gameQuestions[currentQuestionIndex]?.name}</span> kişisini göster</h2>
                          <Button onClick={() => speak(`Hadi bana, ${gameQuestions[currentQuestionIndex]?.name}, kişisini göster`)} className="bg-white border rounded-full px-8 py-4 text-slate-600"><Play size={24} className="mr-2"/> Tekrar Söyle</Button>
                      </div>
                      <div className="grid grid-cols-2 gap-4 w-full max-w-4xl px-4">
                          {options.map((opt) => (
                              <motion.div key={opt.id} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleAnswer(opt)} className={`relative aspect-square rounded-3xl overflow-hidden shadow-lg border-4 transition-all bg-white ${gamePhase === 'success' && opt.id === gameQuestions[currentQuestionIndex].id ? 'border-green-500' : ''} ${gamePhase === 'fail' && opt.id !== gameQuestions[currentQuestionIndex].id ? 'opacity-50 grayscale' : 'border-white'}`}>
                                  <img src={opt.imageUrl} alt={opt.name} className="w-full h-full object-cover" />
                                  {gamePhase === 'success' && opt.id === gameQuestions[currentQuestionIndex].id && <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center"><Check size={48} className="text-green-600"/></div>}
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
                                                                    }
