import { useState, useEffect, useRef } from 'react';
import { db } from '../../firebase'; 
import { doc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Search, Backpack, Star, Sparkles, User, Move, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

// --- RESİMLER ---
import canta1 from './dedektif/canta1.jpg';
import canta2 from './dedektif/canta2.jpg';
import canta3 from './dedektif/canta3.jpg';
import canta4 from './dedektif/canta4.jpg';
import canta5 from './dedektif/canta5.jpg';

const GAMES = [
  {
    id: 'dedektif',
    title: 'Not Defteri',
    icon: Search,
    color: 'from-blue-600 to-indigo-900',
    btnColor: 'bg-blue-600',
    disabled: true 
  },
  {
    id: 'canta',
    title: 'Okul Çantası',
    icon: Backpack,
    color: 'from-orange-500 to-red-800',
    btnColor: 'bg-orange-600',
    disabled: false 
  },
  {
    id: 'gizemli_3',
    title: 'Gizem 3',
    icon: Star,
    color: 'from-slate-700 to-slate-900',
    btnColor: 'bg-slate-700',
    disabled: true
  },
  {
    id: 'gizemli_4',
    title: 'Gizem 4',
    icon: Sparkles,
    color: 'from-slate-700 to-slate-900',
    btnColor: 'bg-slate-700',
    disabled: true
  }
];

// --- ÇANTA OYUNU BÖLÜM VERİLERİ ---
// Ekranda çıkan X ve Y değerlerini buraya yazacaksın. width ve height hitbox (dokunma alanı) genişliğidir.
const CANTA_LEVELS = [
  { id: 1, src: canta1, targetName: "Kalem", targetX: 50, targetY: 50, width: 15, height: 15 }, 
  { id: 2, src: canta2, targetName: "Silgi", targetX: 30, targetY: 40, width: 15, height: 15 },
  { id: 3, src: canta3, targetName: "Defter", targetX: 70, targetY: 60, width: 15, height: 15 },
  { id: 4, src: canta4, targetName: "Matara", targetX: 20, targetY: 80, width: 15, height: 15 },
  { id: 5, src: canta5, targetName: "Makas", targetX: 80, targetY: 20, width: 15, height: 15 },
];


export default function AliciGame7({ studentId, onClose }: { studentId: string, onClose: () => void }) {
  const [student, setStudent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  
  const [gameMode, setGameMode] = useState<'instruction' | 'assessment' | null>(null);

  useEffect(() => {
    const instId = localStorage.getItem("kazanim-takip-institution-id");
    if (!studentId || !instId) return onClose();

    const fetchStudent = async () => {
      try {
        const studentRef = doc(db, "institutions", instId, "students", studentId);
        const docSnap = await getDoc(studentRef);
        if (docSnap.exists()) setStudent({ id: docSnap.id, ...docSnap.data() });
      } catch (error) {
        toast.error("Öğrenci yüklenirken hata oluştu.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudent();
  }, [studentId]);

  if (isLoading) return <div className="fixed inset-0 z-[100] bg-slate-950 flex justify-center items-center"><Loader2 className="animate-spin text-blue-500" size={48} /></div>;

  if (activeGameId === 'canta' && !gameMode) {
      return (
          <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center p-6 text-white">
              <h2 className="text-3xl font-black mb-8">Nasıl Oynayacağız?</h2>
              <div className="flex gap-4">
                  <button onClick={() => setGameMode('instruction')} className="w-40 h-40 bg-purple-600/20 border-2 border-purple-500 rounded-3xl flex flex-col items-center justify-center gap-4 hover:bg-purple-600/40 active:scale-95 transition-all">
                      <Search size={40} className="text-purple-400" />
                      <span className="font-bold text-lg">Çalışma</span>
                      <span className="text-xs text-purple-300 text-center px-2">Yardım edilebilir, hedefler parlar.</span>
                  </button>
                  <button onClick={() => setGameMode('assessment')} className="w-40 h-40 bg-blue-600/20 border-2 border-blue-500 rounded-3xl flex flex-col items-center justify-center gap-4 hover:bg-blue-600/40 active:scale-95 transition-all">
                      <CheckCircle2 size={40} className="text-blue-400" />
                      <span className="font-bold text-lg">Test</span>
                      <span className="text-xs text-blue-300 text-center px-2">Yardım yok. Tek şans.</span>
                  </button>
              </div>
              <button onClick={() => setActiveGameId(null)} className="mt-12 text-slate-500 underline">Geri Dön</button>
          </div>
      );
  }

  if (activeGameId === 'canta' && gameMode) {
      return <HiddenObjectEngine 
                  mode={gameMode} 
                  levels={CANTA_LEVELS} 
                  onClose={() => { setGameMode(null); setActiveGameId(null); }} 
              />;
  }

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 text-white font-sans flex flex-col overflow-y-auto">
      <div className="shrink-0 p-4 flex items-center justify-between border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
        <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400"><ArrowLeft size={24} /></button>
        <div className="text-center">
            <h1 className="text-lg font-bold">Macera Seçimi</h1>
        </div>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 flex flex-col items-center p-6 w-full max-w-md mx-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 mb-8 w-full flex flex-col items-center text-center shadow-xl">
              {student?.photoUrl ? (
                  <img src={student.photoUrl} alt="Profil" className="w-24 h-24 rounded-full border-4 border-slate-700 object-cover mb-4" />
              ) : (
                  <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center border-4 border-slate-700 mb-4"><User size={40} className="text-slate-500" /></div>
              )}
              <h2 className="text-2xl font-black">{student?.name.split(' ')[0]}</h2>
              <p className="text-slate-400 text-sm mt-1">Süper Dedektif</p>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full">
              {GAMES.map((game) => (
                  <div 
                      key={game.id} 
                      className={twMerge(
                          "relative overflow-hidden rounded-[2rem] aspect-square flex flex-col items-center justify-center text-center p-4 transition-all duration-300",
                          game.disabled 
                            ? "bg-slate-900/50 border-2 border-slate-800/50 opacity-50 grayscale" 
                            : "bg-slate-900 border-2 border-slate-700 hover:border-slate-500 hover:-translate-y-1 active:scale-95 cursor-pointer shadow-xl"
                      )}
                      onClick={() => !game.disabled && setActiveGameId(game.id)}
                  >
                      <div className={twMerge("absolute inset-0 bg-gradient-to-br opacity-20", game.color)}></div>
                      <div className={twMerge("w-14 h-14 rounded-2xl flex items-center justify-center mb-3 relative z-10", game.disabled ? "bg-slate-800 text-slate-500" : game.btnColor)}>
                          <game.icon size={28} className={game.disabled ? "opacity-50" : "text-white"} />
                      </div>
                      <h4 className="text-sm font-bold text-white relative z-10">{game.title}</h4>
                      {game.disabled && <span className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-wider relative z-10">Yakında</span>}
                  </div>
              ))}
          </div>
      </div>
    </div>
  );
}


// --- GİZLİ NESNE BULMA MOTORU ---
function HiddenObjectEngine({ mode, levels, onClose }: { mode: 'instruction'|'assessment', levels: any[], onClose: () => void }) {
    const [currentLvlIndex, setCurrentLevelIndex] = useState(0);
    const [phase, setPhase] = useState<'intro'|'playing'|'result'>('intro');
    const [score, setScore] = useState(0);
    
    const [showHint, setShowHint] = useState(false);
    const [showDragHint, setShowDragHint] = useState(true); 
    const [feedback, setFeedback] = useState<'correct'|'wrong'|null>(null);

    // 🔥 APK'da test edebilmen için ekranda koordinatları tutacağımız state
    const [debugCoords, setDebugCoords] = useState<{x: number, y: number} | null>(null);

    const level = levels[currentLvlIndex];

    const handleDragStart = () => {
        setShowDragHint(false);
    };

    const handleImageClick = (e: any) => {
        const rect = e.currentTarget.getBoundingClientRect();
        
        // Touch eventleri (telefonda dokunma) veya fare tıklamasını destekler
        const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
        const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;

        const xPercent = ((clientX - rect.left) / rect.width) * 100;
        const yPercent = ((clientY - rect.top) / rect.height) * 100;
        
        // Ekrana basması için state'i güncelliyoruz
        setDebugCoords({ x: xPercent, y: yPercent });
        
        setShowDragHint(false);

        const hitX = Math.abs(xPercent - level.targetX) <= (level.width / 2);
        const hitY = Math.abs(yPercent - level.targetY) <= (level.height / 2);

        if (hitX && hitY) {
            handleSuccess();
        } else {
            handleFail();
        }
    };

    const handleSuccess = () => {
        setFeedback('correct');
        setScore(prev => prev + 1);
        setTimeout(() => nextLevel(), 1500);
    };

    const handleFail = () => {
        setFeedback('wrong');
        
        if (mode === 'assessment') {
            setTimeout(() => nextLevel(), 1000);
        } else {
            setShowHint(true);
            setTimeout(() => setFeedback(null), 1000);
        }
    };

    const nextLevel = () => {
        setFeedback(null);
        setShowHint(false);
        setDebugCoords(null); // Yeni bölüme geçerken koordinat yazısını temizle
        if (currentLvlIndex + 1 < levels.length) {
            setCurrentLevelIndex(prev => prev + 1);
            setShowDragHint(true); 
        } else {
            setPhase('result');
            if (score >= levels.length / 2) confetti({ particleCount: 200, spread: 80, origin: { y: 0.6 } });
        }
    };

    if (phase === 'intro') {
        return (
            <div className="fixed inset-0 z-[110] bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white">
                <Search size={80} className="text-blue-500 mb-6" />
                <h2 className="text-3xl font-black mb-4">Görevin: Bul ve Dokun!</h2>
                <p className="text-slate-400 mb-8 text-lg">
                    Resmi parmağınla <strong className="text-white">sağa, sola, yukarı ve aşağı kaydırarak</strong> gizli nesneyi ara. Bulduğunda üzerine dokun!
                </p>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8 w-full max-w-sm">
                    <span className="text-slate-500 uppercase font-bold text-xs tracking-widest">İlk Aranacak Nesne:</span>
                    <h3 className="text-3xl font-black text-blue-400 mt-2">{level.targetName}</h3>
                </div>
                <Button onClick={() => setPhase('playing')} className="bg-blue-600 hover:bg-blue-500 w-full max-w-sm h-14 text-lg rounded-2xl font-bold">HAZIRIM, BAŞLA!</Button>
            </div>
        );
    }

    if (phase === 'result') {
        return (
            <div className="fixed inset-0 z-[110] bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white">
                <CheckCircle2 size={80} className="text-green-500 mb-6" />
                <h2 className="text-3xl font-black mb-2">Bölüm Tamamlandı!</h2>
                <p className="text-slate-400 mb-8 text-lg">Doğru Bulunan: {score} / {levels.length}</p>
                <Button onClick={onClose} className="bg-blue-600 hover:bg-blue-500 px-10 h-14 text-lg rounded-2xl font-bold">MENÜYE DÖN</Button>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[110] bg-black overflow-hidden flex flex-col">
            
            {/* ÜST GÖREV BARI */}
            <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between">
                <button onClick={onClose} className="w-12 h-12 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20">
                    <ArrowLeft size={24} />
                </button>
                <div className="bg-black/70 backdrop-blur-md border-2 border-blue-500 rounded-2xl px-6 py-3 flex flex-col items-center shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                    <span className="text-[10px] text-blue-300 font-bold uppercase tracking-widest">Görevin: Bul!</span>
                    <span className="text-xl font-black text-white">{level.targetName}</span>
                </div>
                <div className="w-12"></div>
            </div>

            {/* GERİ BİLDİRİM İKONLARI */}
            <AnimatePresence>
                {feedback && (
                    <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
                        <div className={twMerge("w-32 h-32 rounded-full flex items-center justify-center shadow-2xl", feedback === 'correct' ? "bg-green-500" : "bg-red-500")}>
                            {feedback === 'correct' ? <CheckCircle2 size={64} className="text-white" /> : <XCircle size={64} className="text-white" />}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* SÜRÜKLENEBİLİR RESİM */}
            <motion.div 
                className="w-full h-full cursor-grab active:cursor-grabbing relative touch-none" // Telefondaki varsayılan kaydırmaları engellemek için touch-none eklendi
                drag
                dragConstraints={{ top: -500, left: -500, right: 500, bottom: 500 }} 
                dragElastic={0.1}
                onDragStart={handleDragStart}
                onPointerUp={handleImageClick} 
            >
                <img 
                    src={level.src} 
                    alt="Arka Plan" 
                    draggable="false" 
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 min-w-[200vw] min-h-[200vh] object-cover pointer-events-none" 
                />

                {mode === 'instruction' && showHint && (
                    <div 
                        className="absolute bg-blue-500/40 rounded-full animate-ping border-2 border-blue-300 shadow-[0_0_30px_rgba(59,130,246,0.8)] pointer-events-none"
                        style={{ 
                            left: `${level.targetX}%`, 
                            top: `${level.targetY}%`, 
                            width: `${level.width}%`, 
                            height: `${level.height}%`,
                            transform: 'translate(-50%, -50%)'
                        }}
                    />
                )}
            </motion.div>

            {/* SÜRÜKLE İPUCU */}
            <AnimatePresence>
                {showDragHint && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 pointer-events-none flex items-center justify-center z-40"
                    >
                        <div className="relative w-48 h-48">
                            <Move size={64} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white/50 animate-pulse" />
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 border-t-4 border-l-4 border-white/50 rotate-45 animate-bounce"></div>
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 border-b-4 border-r-4 border-white/50 rotate-45 animate-bounce"></div>
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 border-b-4 border-l-4 border-white/50 rotate-45 animate-bounce"></div>
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 border-t-4 border-r-4 border-white/50 rotate-45 animate-bounce"></div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 🔥 GELİŞTİRİCİ CANLI KOORDİNAT PANELİ (Telefonda görmek için) 🔥 */}
            {debugCoords && (
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-yellow-400 font-mono px-4 py-2 rounded-xl z-[120] pointer-events-none shadow-xl border border-yellow-400/30 text-sm font-bold tracking-widest whitespace-nowrap">
                    X: {debugCoords.x.toFixed(2)} | Y: {debugCoords.y.toFixed(2)}
                </div>
            )}

        </div>
    );
}
