import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eraser, Check, XCircle, Volume2, ChevronRight, Trophy, RefreshCcw, Pencil, Eye
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { twMerge } from 'tailwind-merge';

// --- SES DOSYALARI (Yollar güncellendi & esledinbravo çıkarıldı) ---
import aferin1 from '@/aba/esle/ses/aferin1.mp3';
import bravo from '@/aba/esle/ses/bravo.mp3';
import harika1 from '@/aba/esle/ses/harika1.mp3';
import tekrardene1 from '@/aba/esle/ses/tekrardene1.mp3';

// --- 1. ANIMALS (Video) ---
import aslanVid from '@/animals/aslan.mp4';
import ayiVid from '@/animals/ayi.mp4';
import atVid from '@/animals/at.mp4';
import kediVid from '@/animals/kedi.mp4';
import kopekVid from '@/animals/kopek.mp4';
import maymunVid from '@/animals/maymun.mp4';
import yilanVid from '@/animals/yilan.mp4';

// --- 2. CLOTHES (Image) ---
import ayakkabiImg from '@/clothes/ayakkabi.jpg';
import atletImg from '@/clothes/atlet.jpg';
import kazakImg from '@/clothes/kazak.jpg';
import pantolonImg from '@/clothes/pantolon.jpg';
import sapkaImg from '@/clothes/sapka.jpg';

// --- 3. FRUITS (Image) ---
import ananasImg from '@/fruits/ananas.jpg';
import armutImg from '@/fruits/armut.jpg';
import elmaImg from '@/fruits/elma.jpg';
import karpuzImg from '@/fruits/karpuz.jpg';
import muzImg from '@/fruits/muz.jpg';

// --- 4. VEGETABLES (Image) ---
import biberImg from '@/vegetables/biber.jpg';
import havucImg from '@/vegetables/havuc.jpg';

// --- 5. VEHICLES (Video) ---
import arabaVid from '@/vehicles/araba.mp4';
import otobusVid from '@/vehicles/otobus.mp4';
import trenVid from '@/vehicles/tren.mp4';
import ucakVid from '@/vehicles/ucak.mp4';

// --- SES HAVUZLARI ---
const POSITIVE_SOUNDS = [aferin1, bravo, harika1]; // esledinbravo YOK
const NEGATIVE_SOUNDS = [tekrardene1];

// --- VERİ HAVUZU ---
const POOL = [
  // A İle Başlayanlar (DOĞRULAR)
  { id: 'aslan', src: aslanVid, type: 'video', startsWithA: true },
  { id: 'ayi', src: ayiVid, type: 'video', startsWithA: true },
  { id: 'at', src: atVid, type: 'video', startsWithA: true },
  { id: 'ayakkabi', src: ayakkabiImg, type: 'image', startsWithA: true },
  { id: 'atlet', src: atletImg, type: 'image', startsWithA: true },
  { id: 'ananas', src: ananasImg, type: 'image', startsWithA: true },
  { id: 'armut', src: armutImg, type: 'image', startsWithA: true },
  { id: 'araba', src: arabaVid, type: 'video', startsWithA: true },

  // Çeldiriciler
  { id: 'kedi', src: kediVid, type: 'video', startsWithA: false },
  { id: 'kopek', src: kopekVid, type: 'video', startsWithA: false },
  { id: 'maymun', src: maymunVid, type: 'video', startsWithA: false },
  { id: 'yilan', src: yilanVid, type: 'video', startsWithA: false },
  { id: 'kazak', src: kazakImg, type: 'image', startsWithA: false },
  { id: 'pantolon', src: pantolonImg, type: 'image', startsWithA: false },
  { id: 'sapka', src: sapkaImg, type: 'image', startsWithA: false },
  { id: 'elma', src: elmaImg, type: 'image', startsWithA: false }, 
  { id: 'muz', src: muzImg, type: 'image', startsWithA: false },
  { id: 'karpuz', src: karpuzImg, type: 'image', startsWithA: false },
  { id: 'havuc', src: havucImg, type: 'image', startsWithA: false },
  { id: 'biber', src: biberImg, type: 'image', startsWithA: false },
  { id: 'ucak', src: ucakVid, type: 'video', startsWithA: false },
  { id: 'tren', src: trenVid, type: 'video', startsWithA: false },
  { id: 'otobus', src: otobusVid, type: 'video', startsWithA: false },
];

// --- SORULAR ---
const QUESTIONS = [
  { targetId: 'aslan', options: ['aslan', 'kedi', 'kopek'] },
  { targetId: 'ananas', options: ['ananas', 'muz', 'karpuz'] },
  { targetId: 'araba', options: ['araba', 'ucak', 'tren'] },
  { targetId: 'ayakkabi', options: ['sapka', 'ayakkabi', 'kazak'] },
  { targetId: 'ayi', options: ['havuc', 'elma', 'ayi'] },
  { targetId: 'armut', options: ['biber', 'armut', 'elma'] },
  { targetId: 'at', options: ['yilan', 'maymun', 'at'] },
  { targetId: 'atlet', options: ['pantolon', 'atlet', 'otobus'] },
];

export default function SesliHarfEtkinlikleri() {
  const [activeTab, setActiveTab] = useState<'cizim' | 'farkindalik'>('cizim');
  
  const playSound = (type: 'success' | 'fail') => {
    const sounds = type === 'success' ? POSITIVE_SOUNDS : NEGATIVE_SOUNDS;
    const randomSound = sounds[Math.floor(Math.random() * sounds.length)];
    const audio = new Audio(randomSound);
    audio.play().catch(() => {});
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none overflow-hidden">
      
      {/* --- ÜST BAR (NAVİGASYON) --- */}
      <div className="bg-white px-4 py-3 shadow-md flex justify-between items-center sticky top-0 z-50 border-b border-slate-100">
        
        {/* SOL: Etkinlik Değiştirme Butonları */}
        <div className="flex gap-2">
            <button 
              onClick={() => setActiveTab('cizim')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                activeTab === 'cizim' 
                  ? 'bg-orange-100 text-orange-600 border-orange-200' 
                  : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Pencil size={14} />
              <span>Çizim</span>
            </button>

            <button 
              onClick={() => setActiveTab('farkindalik')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                activeTab === 'farkindalik' 
                  ? 'bg-orange-100 text-orange-600 border-orange-200' 
                  : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Eye size={14} />
              <span>Farkındalık</span>
            </button>
        </div>

        {/* ORTA: Başlık */}
        <h1 className="absolute left-1/2 -translate-x-1/2 text-2xl font-black text-slate-800 tracking-wider">
          A SESİ
        </h1>
        
        {/* SAĞ: Sonraki Ses */}
        <button className="flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold border border-blue-100 hover:bg-blue-100 transition-colors">
          <span>Sonraki (E)</span>
          <ChevronRight size={14} />
        </button>
      </div>

      {/* --- İÇERİK ALANI --- */}
      <div className="flex-1 relative">
        {activeTab === 'cizim' && <CizimEtkinligi />}
        {activeTab === 'farkindalik' && <FarkindalikEtkinligi playSound={playSound} />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 1. ETKİNLİK: ÇİZİM (Canvas)
// ---------------------------------------------------------------------------
function CizimEtkinligi() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
        const parent = canvas.parentElement;
        if(parent) {
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = '#f97316'; 
            ctx.lineWidth = 20; 
        }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const startDrawing = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    const { offsetX, offsetY } = getCoordinates(e, canvas);
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { offsetX, offsetY } = getCoordinates(e, canvas);
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
  };

  const stopDrawing = () => { setIsDrawing(false); };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const getCoordinates = (e: any, canvas: HTMLCanvasElement) => {
    let offsetX, offsetY;
    if (e.nativeEvent instanceof TouchEvent) {
        const rect = canvas.getBoundingClientRect();
        offsetX = e.nativeEvent.touches[0].clientX - rect.left;
        offsetY = e.nativeEvent.touches[0].clientY - rect.top;
    } else {
        offsetX = e.nativeEvent.offsetX;
        offsetY = e.nativeEvent.offsetY;
    }
    return { offsetX, offsetY };
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')]">
      <div className="bg-white rounded-[2rem] shadow-xl w-full max-w-lg aspect-[4/5] sm:aspect-square relative border-4 border-slate-100 overflow-hidden">
        
        {/* REHBER HARFLER */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-[0.15] select-none">
             <span className="text-[200px] leading-none font-sans font-bold text-slate-900">A</span>
             <span className="text-[180px] leading-none font-sans font-bold text-slate-900 mt-4">a</span>
        </div>

        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
        />

        <div className="absolute top-4 right-4 z-10">
            <button 
                onClick={clearCanvas} 
                className="bg-red-50 text-red-500 p-3 rounded-xl shadow-sm border border-red-100 active:scale-95 transition-transform"
            >
                <Eraser size={24} />
            </button>
        </div>
      </div>
      <p className="mt-4 text-slate-400 font-bold text-center text-sm uppercase tracking-widest animate-pulse">
        Hadi Çizelim
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. ETKİNLİK: FARKINDALIK (VİDEO VE RESİM DESTEKLİ)
// ---------------------------------------------------------------------------
function FarkindalikEtkinligi({ playSound }: { playSound: (t: 'success' | 'fail') => void }) {
  const [qIndex, setQIndex] = useState(0);
  const [wrongSelections, setWrongSelections] = useState<string[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const currentQ = QUESTIONS[qIndex];
  const currentOptions = currentQ.options.map(optId => POOL.find(p => p.id === optId)!);

  const handleSelect = (item: typeof POOL[0]) => {
    if (isSuccess || wrongSelections.includes(item.id)) return;

    if (item.id === currentQ.targetId) {
        setIsSuccess(true);
        playSound('success');
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });

        setTimeout(() => {
            if (qIndex + 1 < QUESTIONS.length) {
                setQIndex(prev => prev + 1);
                setIsSuccess(false);
                setWrongSelections([]);
            } else {
                setIsFinished(true);
            }
        }, 2500);
    } else {
        playSound('fail');
        setWrongSelections(prev => [...prev, item.id]);
    }
  };

  const restartGame = () => {
    setQIndex(0);
    setIsFinished(false);
    setIsSuccess(false);
    setWrongSelections([]);
  };

  if (isFinished) {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-slate-50">
            <div className="bg-white p-10 rounded-[3rem] shadow-2xl flex flex-col items-center">
                <Trophy size={80} className="text-yellow-500 mb-4 animate-bounce" />
                <h2 className="text-3xl font-black text-slate-800 mb-2">HARİKASIN!</h2>
                <p className="text-slate-400 mb-8">Tüm "A" seslerini başarıyla buldun.</p>
                <button 
                    onClick={restartGame}
                    className="bg-orange-500 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg active:scale-95 flex items-center gap-2"
                >
                    <RefreshCcw /> Tekrar Oyna
                </button>
            </div>
        </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center pt-6 px-4">
        
        {/* Yönerge */}
        <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100 mb-6 flex items-center gap-3 animate-in slide-in-from-top-4">
            <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                <Volume2 size={20} />
            </div>
            <span className="text-lg font-bold text-slate-700">"A" ile başlayanı bul!</span>
        </div>

        {/* Seçenekler Alanı */}
        <div className="grid grid-cols-3 gap-3 sm:gap-6 w-full max-w-2xl h-[50vh] sm:h-auto">
            <AnimatePresence mode='popLayout'>
                {currentOptions.map((item) => {
                    const isCorrect = item.id === currentQ.targetId;
                    const isWrong = wrongSelections.includes(item.id);
                    const showSuccess = isSuccess && isCorrect;

                    return (
                        <motion.div
                            key={item.id}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ 
                                scale: showSuccess ? [1, 1.05, 1] : 1,
                                opacity: isWrong ? 0.4 : 1
                            }}
                            exit={{ scale: 0, opacity: 0 }}
                            onClick={() => handleSelect(item)}
                            className={twMerge(
                                "relative aspect-square bg-white rounded-2xl shadow-sm border-2 flex items-center justify-center cursor-pointer overflow-hidden transition-all",
                                showSuccess ? 'border-green-500 ring-4 ring-green-100 z-10' : 'border-slate-100 hover:border-blue-200',
                                isWrong ? 'cursor-not-allowed grayscale' : 'active:scale-95'
                            )}
                        >
                            {/* MEDYA GÖSTERİMİ (VIDEO veya IMAGE) */}
                            {item.type === 'video' ? (
                                <video 
                                    src={item.src} 
                                    className="w-full h-full object-cover pointer-events-none"
                                    autoPlay 
                                    loop 
                                    muted 
                                    playsInline
                                />
                            ) : (
                                <img 
                                    src={item.src} 
                                    alt={item.id} 
                                    className="w-full h-full object-cover pointer-events-none" 
                                />
                            )}

                            {/* Geri Bildirim İkonları */}
                            {showSuccess && (
                                <motion.div 
                                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                                    className="absolute inset-0 bg-green-500/20 flex items-center justify-center backdrop-blur-[1px]"
                                >
                                    <div className="bg-green-500 text-white p-3 rounded-full shadow-lg">
                                        <Check size={32} strokeWidth={4} />
                                    </div>
                                </motion.div>
                            )}
                             {isWrong && (
                                <div className="absolute inset-0 bg-slate-100/50 flex items-center justify-center">
                                    <XCircle size={40} className="text-slate-400 opacity-50" />
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>

        {/* İlerleme Çubuğu */}
        <div className="absolute bottom-8 w-full max-w-xs px-4">
            <div className="flex justify-between text-xs font-bold text-slate-400 mb-1">
                <span>İlerleme</span>
                <span>{qIndex + 1} / {QUESTIONS.length}</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-orange-500 transition-all duration-500" 
                    style={{ width: `${((qIndex + (isSuccess ? 1 : 0)) / QUESTIONS.length) * 100}%` }}
                />
            </div>
        </div>
    </div>
  );
    }
      
