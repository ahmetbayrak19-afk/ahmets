import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, Trash2, Save, ArrowLeft, Check, Play, Settings, User, Users, GraduationCap, Heart, Crop, ZoomIn, Move, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

// --- VARSAYILAN KİŞİLER (YEDEK OYUNCULAR) ---
// DÜZELTME: Uzantılar .jpg yapıldı
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
  isUploaded: boolean; // true ise öğretmen yükledi, false ise varsayılan resim
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
  
  // Profil Verisi (LocalStorage)
  const [profiles, setProfiles] = useState<PersonProfile[]>(() => {
    const saved = localStorage.getItem('insan-tanima-profiller');
    return saved ? JSON.parse(saved) : [];
  });

  // Editör & Crop State'leri
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const [rawImage, setRawImage] = useState<string | null>(null); // İşlenmemiş resim
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

  // --- TTS (KONUŞMA MOTORU) ---
  const speak = (text: string) => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      // En iyi Türkçe sesi bul
      const turkishVoice = voices.find(v => v.lang.includes('tr') && v.name.includes('Google')) || 
                           voices.find(v => v.lang.includes('tr'));
      if (turkishVoice) utterance.voice = turkishVoice;
      utterance.lang = 'tr-TR';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
  };

  // --- GÖRÜNTÜ ALMA (KAMERA/UPLOAD) ---
  const startCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      toast.error("Kamera açılamadı.");
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
    
    // Kamerayı kapat, Crop ekranına geç
    const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
    tracks.forEach(t => t.stop());
    setIsCameraOpen(false);
    
    // Crop ayarlarını sıfırla
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

  // --- MANUEL KARE KIRPMA (CROP MANTIĞI) ---
  const finalizeCrop = () => {
      if (!rawImage || !canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.src = rawImage;
      
      img.onload = () => {
          // Çıktı boyutu (Kare)
          const outputSize = 400; 
          canvas.width = outputSize;
          canvas.height = outputSize;

          if(ctx) {
              // Arkaplanı beyaz yap
              ctx.clearRect(0, 0, outputSize, outputSize);
              ctx.fillStyle = "#ffffff";
              ctx.fillRect(0,0, outputSize, outputSize);
              
              // Zoom ve Pozisyon hesapla
              const scale = cropZoom;
              // Resmin o anki çizim boyutu (Eğer zoom yaptıysak büyür)
              const drawWidth = img.width * scale;
              const drawHeight = img.height * scale;
              
              // Resmi canvas'ın merkezine oturt + kullanıcının kaydırma (pan) değeri
              // Mantık: (CanvasOrtası - ResimOrtası) + Kaydırma
              // Eğer zoom = 1 ve x=0, y=0 ise resim tam ortalanır.
              
              // Ancak kullanıcının gördüğü ekrandaki oranla buradaki oran tutmalı.
              // Basit bir scale-fit mantığı: Önce resmi canvasa "cover" olacak şekilde oranlayalım
              const ratio = Math.max(outputSize / img.width, outputSize / img.height);
              const baseWidth = img.width * ratio;
              const baseHeight = img.height * ratio;

              // Kullanıcının yaptığı ekstra zoom
              const finalWidth = baseWidth * cropZoom;
              const finalHeight = baseHeight * cropZoom;

              const centerX = (outputSize - finalWidth) / 2 + cropPosition.x;
              const centerY = (outputSize - finalHeight) / 2 + cropPosition.y;

              ctx.drawImage(img, centerX, centerY, finalWidth, finalHeight);
              
              const finalImage = canvas.toDataURL('image/jpeg');
              
              if (!newPersonName) {
                  toast.warning("Lütfen bir isim girin.");
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
      if(confirm("Bu kişiyi silmek istediğine emin misin?")) {
          setProfiles(profiles.filter(p => p.id !== id));
      }
  };

  // --- OYUN KURULUMU VE MANTIĞI ---
  const startGame = (category: Category) => {
      // 1. ADIM: Sadece bu kategoride ÖĞRETMENİN YÜKLEDİĞİ kişileri bul
      const uploadedInCat = profiles.filter(p => p.category === category && p.isUploaded);
      
      if (uploadedInCat.length < 1) {
          toast.error("Oynamak için en az 1 kişi eklemelisiniz.");
          return;
      }

      // Sorular SADECE yüklenen kişiler olacak
      const questions = [...uploadedInCat].sort(() => 0.5 - Math.random());
      setGameQuestions(questions);
      setCurrentQuestionIndex(0);
      setScore(0);
      setGamePhase('playing');
      setView('game');
      generateOptions(questions[0], uploadedInCat);
  };

  const generateOptions = (target: PersonProfile, uploadedPool: PersonProfile[]) => {
      // Hedef kişiyi havuza koy
      let currentOptions = [target];

      // Diğer YÜKLENEN kişileri (hedef olmayanları) al
      const otherUploaded = uploadedPool.filter(p => p.id !== target.id);
      
      // Toplam seçenek sayısı (Minimum 2, maksimum 4)
      let totalOptionsNeeded = 2;
      if (uploadedPool.length >= 3) totalOptionsNeeded = 3; 
      if (uploadedPool.length >= 4 || (uploadedPool.length < 3 && DEFAULT_PEOPLE.length > 0)) totalOptionsNeeded = 4; // Eğer yeterince kişi yoksa defaultlarla 4'e tamamla

      // Diğer yüklenenlerden al (yettiği kadar)
      currentOptions = [...currentOptions, ...otherUploaded].slice(0, totalOptionsNeeded);

      // EĞER HALA EKSİK VARSA -> YEDEK OYUNCULARI (DEFAULT) KULLAN
      if (currentOptions.length < totalOptionsNeeded) {
          const defaultsNeeded = totalOptionsNeeded - currentOptions.length;
          // Defaultları karıştır ve al
          const randomDefaults = [...DEFAULT_PEOPLE].sort(() => 0.5 - Math.random()).slice(0, defaultsNeeded);
          
          const formattedDefaults: PersonProfile[] = randomDefaults.map(d => ({
              ...d,
              category: 'tanidik', // Kategori önemsiz, maksat tip uyuşsun
              isUploaded: false
          }));
          
          currentOptions = [...currentOptions, ...formattedDefaults];
      }

      // Seçenekleri karıştır
      setOptions(currentOptions.sort(() => 0.5 - Math.random()));
      
      // Soruyu sor
      setTimeout(() => {
          speak(`Hadi bana, ${target.name}, kişisini göster.`);
      }, 600);
  };

  const handleAnswer = (selected: PersonProfile) => {
      const currentTarget = gameQuestions[currentQuestionIndex];
      
      if (selected.id === currentTarget.id) {
          // DOĞRU
          const audio = new Audio("https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg"); // Basit efekt
          audio.play().catch(()=>{});
          setGamePhase('success');
          speak("Aferin sana!");
          setScore(s => s + 1);
          
          setTimeout(() => {
              const nextIdx = currentQuestionIndex + 1;
              if (nextIdx < gameQuestions.length) {
                  setCurrentQuestionIndex(nextIdx);
                  setGamePhase('playing');
                  // Yeni soru için seçenek üret
                  const uploadedInCat = profiles.filter(p => p.category === selectedCategory && p.isUploaded);
                  generateOptions(gameQuestions[nextIdx], uploadedInCat);
              } else {
                  setGamePhase('complete');
                  speak("Harikasın, hepsini bildin!");
                  confetti();
              }
          }, 2000);
      } else {
          // YANLIŞ
          const audio = new Audio("https://actions.google.com/sounds/v1/cartoon/clank_car_crash.ogg"); 
          audio.play().catch(()=>{});
          setGamePhase('fail');
          
          // Yanlışta doğruyu söyle
          setTimeout(() => {
              speak(`Yanlış. Bana, ${currentTarget.name}, kişisini göster.`);
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
        {view === 'menu' && <div className="px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold border border-blue-200">ADB 2.1</div>}
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
                      <div>
                          <h2 className="text-lg font-bold text-slate-700">Kayıtlı Kişiler</h2>
                          <p className="text-xs text-slate-500">{CATEGORIES.find(c => c.id === selectedCategory)?.label}</p>
                      </div>
                      <div className="flex gap-2">
                          <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="bg-white"><Upload size={16} className="mr-2"/> Yükle</Button>
                          <Button onClick={startCamera} className="bg-blue-600 hover:bg-blue-700"><Camera size={16} className="mr-2"/> Kamera</Button>
                          <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileUpload} />
                      </div>
                  </div>

                  {isCameraOpen && (
                      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4">
                          <div className="relative w-full max-w-md aspect-square bg-black overflow-hidden rounded-2xl border-4 border-white">
                              <video ref={videoRef} autoPlay playsInline className="absolute w-full h-full object-cover" />
                          </div>
                          <div className="flex gap-4 mt-8">
                              <Button variant="destructive" size="lg" onClick={() => { 
                                  const tracks = (videoRef.current?.srcObject as MediaStream)?.getTracks();
                                  tracks?.forEach(t => t.stop());
                                  setIsCameraOpen(false); 
                              }}>İptal</Button>
                              <Button size="lg" onClick={capturePhoto} className="bg-white text-black hover:bg-gray-200">FOTOĞRAF ÇEK</Button>
                          </div>
                      </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {profiles.filter(p => p.category === selectedCategory && p.isUploaded).map(person => (
                          <div key={person.id} className="relative group bg-white p-2 rounded-xl shadow border hover:shadow-md transition-all">
                              <img src={person.imageUrl} alt={person.name} className="w-full aspect-square object-cover rounded-lg bg-slate-100" />
                              <p className="text-center font-bold text-sm mt-3 text-slate-700">{person.name}</p>
                              <button onClick={() => deletePerson(person.id)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                          </div>
                      ))}
                      
                      {profiles.filter(p => p.category === selectedCategory && p.isUploaded).length === 0 && (
                          <div className="col-span-full py-20 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                              <ImagePlus size={48} className="mx-auto mb-2 opacity-50"/>
                              <p>Henüz kimse eklenmemiş.</p>
                              <p className="text-xs">Yukarıdaki butonlarla kişi ekleyebilirsin.</p>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* --- 3. CROP (FOTOĞRAF AYARLAMA) --- */}
      {view === 'crop' && rawImage && (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-900 p-4 relative overflow-y-auto">
              <div className="w-full max-w-md flex flex-col gap-6">
                  <div className="text-center">
                      <h2 className="text-white font-bold text-xl flex items-center justify-center gap-2"><Crop size={24}/> Fotoğrafı Ayarla</h2>
                      <p className="text-slate-400 text-sm">Fotoğrafı kareye oturtmak için kaydırın ve yakınlaştırın.</p>
                  </div>
                  
                  {/* CROP ALANI */}
                  <div className="relative w-full aspect-square bg-black rounded-2xl overflow-hidden border-4 border-white shadow-2xl mx-auto">
                      {/* Resim Container */}
                      <div 
                        className="w-full h-full relative cursor-move"
                        style={{
                            transform: `scale(${cropZoom}) translate(${cropPosition.x}px, ${cropPosition.y}px)`,
                            transformOrigin: 'center center',
                            transition: 'transform 0.05s linear'
                        }}
                      >
                          <img src={rawImage} className="w-full h-full object-contain pointer-events-none select-none" />
                      </div>
                      
                      {/* Kılavuz Çizgileri (Izgara) */}
                      <div className="absolute inset-0 pointer-events-none opacity-30">
                          <div className="absolute top-1/3 w-full h-px bg-white"></div>
                          <div className="absolute top-2/3 w-full h-px bg-white"></div>
                          <div className="absolute left-1/3 h-full w-px bg-white"></div>
                          <div className="absolute left-2/3 h-full w-px bg-white"></div>
                      </div>
                  </div>

                  {/* KONTROLLER */}
                  <div className="bg-slate-800 p-6 rounded-2xl space-y-5 shadow-lg">
                      <div className="space-y-2">
                          <label className="text-xs text-slate-400 font-bold uppercase flex items-center gap-2"><ZoomIn size={14}/> Yakınlaştır</label>
                          <input type="range" min="1" max="3" step="0.1" value={cropZoom} onChange={(e) => setCropZoom(parseFloat(e.target.value))} className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500"/>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                              <label className="text-xs text-slate-400 font-bold uppercase flex items-center gap-2"><Move size={14}/> Yatay</label>
                              <input type="range" min="-150" max="150" value={cropPosition.x} onChange={(e) => setCropPosition(p => ({...p, x: parseInt(e.target.value)}))} className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500"/>
                          </div>
                          <div className="space-y-2">
                              <label className="text-xs text-slate-400 font-bold uppercase flex items-center gap-2"><Move size={14} className="rotate-90"/> Dikey</label>
                              <input type="range" min="-150" max="150" value={cropPosition.y} onChange={(e) => setCropPosition(p => ({...p, y: parseInt(e.target.value)}))} className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500"/>
                          </div>
                      </div>

                      <div className="pt-2">
                          <label className="text-xs text-slate-400 font-bold uppercase block mb-2">Kişi İsmi</label>
                          <input 
                            type="text" 
                            value={newPersonName} 
                            onChange={(e) => setNewPersonName(e.target.value)} 
                            placeholder="Örn: Ayşe Öğretmen" 
                            className="w-full p-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-blue-500 outline-none font-bold text-lg text-center placeholder:text-slate-500"
                          />
                      </div>
                  </div>

                  <div className="flex gap-4">
                      <Button variant="ghost" size="lg" onClick={() => setView('edit')} className="flex-1 text-slate-400 hover:text-white hover:bg-white/10">İptal</Button>
                      <Button size="lg" onClick={finalizeCrop} className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold">KAYDET</Button>
                  </div>
                  
                  {/* Canvas (Görünmez - İşlem için) */}
                  <canvas ref={canvasRef} hidden></canvas>
              </div>
          </div>
      )}

      {/* --- 4. OYUN --- */}
      {view === 'game' && (
          <div className="flex-1 flex flex-col items-center justify-center p-4 bg-slate-50 relative">
              {gamePhase === 'complete' ? (
                  <div className="text-center animate-in zoom-in duration-500">
                      <Trophy size={100} className="text-yellow-500 mx-auto mb-6 animate-bounce" />
                      <h2 className="text-4xl font-black text-slate-800 mb-2">HARİKA!</h2>
                      <p className="text-xl text-slate-500 mb-8">Tanıdıklarını çok iyi biliyorsun!</p>
                      <Button onClick={() => setView('menu')} size="lg" className="bg-green-600 hover:bg-green-700 text-white px-12 py-6 text-xl rounded-2xl shadow-xl active:scale-95 transition-transform">
                          TAMAMLA
                      </Button>
                  </div>
              ) : (
                  <>
                      <div className="mb-8 sm:mb-12 text-center w-full max-w-2xl mx-auto">
                          <h2 className="text-2xl sm:text-4xl font-bold text-slate-800 mb-4 animate-in slide-in-from-top duration-500 leading-tight">
                              Hadi bana <span className="text-blue-600 underline decoration-wavy decoration-blue-300 underline-offset-4">{gameQuestions[currentQuestionIndex]?.name}</span> kişisini göster
                          </h2>
                          <Button 
                            variant="secondary" 
                            size="lg" 
                            onClick={() => speak(`Hadi bana, ${gameQuestions[currentQuestionIndex]?.name}, kişisini göster`)}
                            className="bg-white border shadow-sm rounded-full px-8 py-6 text-slate-600 hover:text-blue-600 text-lg"
                          >
                              <Play size={24} className="mr-2 fill-current"/> Tekrar Söyle
                          </Button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 w-full max-w-5xl px-4">
                          {options.map((opt) => (
                              <motion.div
                                key={opt.id}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleAnswer(opt)}
                                className={`
                                    relative aspect-square rounded-3xl overflow-hidden shadow-lg cursor-pointer border-4 transition-all bg-white
                                    ${gamePhase === 'success' && opt.id === gameQuestions[currentQuestionIndex].id ? 'border-green-500 ring-4 ring-green-200' : ''}
                                    ${gamePhase === 'fail' && opt.id !== gameQuestions[currentQuestionIndex].id ? 'border-red-200 opacity-50 grayscale' : 'border-white hover:border-blue-200'}
                                `}
                              >
                                  <img src={opt.imageUrl} alt={opt.name} className="w-full h-full object-cover" />
                                  
                                  {gamePhase === 'success' && opt.id === gameQuestions[currentQuestionIndex].id && (
                                      <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center animate-in zoom-in duration-300">
                                          <div className="bg-white p-4 rounded-full shadow-xl">
                                              <Check size={48} className="text-green-600 stroke-[3]"/>
                                          </div>
                                      </div>
                                  )}
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
