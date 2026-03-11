import { useState, useEffect, useRef } from 'react';
import { db } from '../../firebase'; 
import { doc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Search, Backpack, Star, Sparkles, User, Move, CheckCircle2, XCircle, ZoomIn, ZoomOut } from 'lucide-react';
import { toast } from 'sonner';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

// --- SADECE VAR OLAN RESİMLERİ İÇERİ ALIYORUZ ---
import canta1 from './dedektif/canta1.jpg';
import canta1x from './dedektif/canta1x.png';

const GAMES = [
  { id: 'dedektif', title: 'Not Defteri', icon: Search, color: 'from-blue-600 to-indigo-900', btnColor: 'bg-blue-600', disabled: true },
  { id: 'canta', title: 'Okul Çantası', icon: Backpack, color: 'from-orange-500 to-red-800', btnColor: 'bg-orange-600', disabled: false },
  { id: 'gizemli_3', title: 'Gizem 3', icon: Star, color: 'from-slate-700 to-slate-900', btnColor: 'bg-slate-700', disabled: true },
  { id: 'gizemli_4', title: 'Gizem 4', icon: Sparkles, color: 'from-slate-700 to-slate-900', btnColor: 'bg-slate-700', disabled: true }
];

// --- OYUN GÖREVLERİ (HEPSİ AYNI PNG'Yİ KULLANACAK) ---
const CANTA_LEVELS = [
  { id: 1, bgSrc: canta1, overlaySrc: canta1x, targetName: "Kalem" }, 
  { id: 2, bgSrc: canta1, overlaySrc: canta1x, targetName: "Silgi" },
  { id: 3, bgSrc: canta1, overlaySrc: canta1x, targetName: "Defter" },
  { id: 4, bgSrc: canta1, overlaySrc: canta1x, targetName: "Çanta" },
  { id: 5, bgSrc: canta1, overlaySrc: canta1x, targetName: "Kitap" },
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
                      <span className="text-xs text-purple-300 text-center px-2">Yanlış yaparsan söyler, ipucu verir.</span>
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
              <h2 className="text-2xl font-black">{student?.name?.split(' ')[0]}</h2>
              <p className="text-slate-400 text-sm mt-1">Süper Dedektif</p>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full">
              {GAMES.map((game) => (
                  <div 
                      key={game.id} 
                      className={twMerge(
                          "relative overflow-hidden rounded-[2rem] aspect-square flex flex-col items-center justify-center text-center p-4 transition-all duration-300",
                          game.disabled ? "bg-slate-900/50 border-2 border-slate-800/50 opacity-50 grayscale" : "bg-slate-900 border-2 border-slate-700 hover:border-slate-500 hover:-translate-y-1 active:scale-95 cursor-pointer shadow-xl"
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
    
    // Zoom/Scale State'i
    const [scale, setScale] = useState(1.5); // Başlangıçta biraz büyük açsın

    const [showHint, setShowHint] = useState(false);
    const [showDragHint, setShowDragHint] = useState(true); 
    const [feedback, setFeedback] = useState<'correct'|'wrong'|null>(null);

    const containerRef = useRef<HTMLDivElement>(null);
    const overlayImgRef = useRef<HTMLImageElement>(null);

    const level = levels[currentLvlIndex];

    // 🔥 İŞTE O EFSANE TEK PNG RADARI 🔥
    const identifyObject = (xPercent: number, yPercent: number) => {
        // Çanta çok net şekilde ekranın üst-orta kısmında
        if (yPercent < 60) return "Çanta";
        
        // Kitap sağ tarafta
        if (xPercent > 55) return "Kitap";
        
        // Sol tarafta 2 obje var: Silgi ve Kalem
        if (xPercent < 35) {
            // Kalem en altta, Silgi onun bir tık üstünde
            if (yPercent > 80) return "Kalem";
            else return "Silgi";
        }
        
        // Geriye sadece orta-alt kısımdaki defter kalıyor
        return "Defter";
    };

    const handleTap = (e: any, info: any) => {
        setShowDragHint(false);
        const img = overlayImgRef.current;
        if (!img) return;

        const rect = img.getBoundingClientRect();
        
        // Tıklanan koordinatların resim içindeki yeri (Zoom yapılmış olsa bile doğru çalışır)
        const clickX = info.point.x - rect.left;
        const clickY = info.point.y - rect.top;

        // X ve Y'nin yüzdelik değerini buluyoruz (Örn: %30 soldan, %85 yukarıdan)
        const xPercent = (clickX / rect.width) * 100;
        const yPercent = (clickY / rect.height) * 100;

        const scaleX = img.naturalWidth / rect.width;
        const scaleY = img.naturalHeight / rect.height;
        const targetX = clickX * scaleX;
        const targetY = clickY * scaleY;

        // Gizli canvas ile piksel şeffaflığı kontrolü
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, -targetX, -targetY);
        const pixelData = ctx.getImageData(0, 0, 1, 1).data;
        const alpha = pixelData[3];

        // Eğer alpha > 10 ise BOŞLUĞA DEĞİL BİR CİSME DOKUNDU DEMEKTİR!
        if (alpha > 10) {
            // Hangi cisme dokunduğunu radara soralım
            const touchedObjectName = identifyObject(xPercent, yPercent);
            
            // DENEME İÇİN TOAST MESAJI BASALIM
            toast(`Algılanan Nesne: ${touchedObjectName}`, { icon: '🔍' });

            // Dokunduğu nesne ile hedeflenen nesne aynı mı?
            if (touchedObjectName === level.targetName) {
                handleSuccess();
            } else {
                handleFail();
            }
        } else {
            // Boşluğa dokundu, yanlış say
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
            setTimeout(() => { setFeedback(null); setShowHint(false); }, 1500);
        }
    };

    const nextLevel = () => {
        setFeedback(null);
        setShowHint(false);
        // Her bölümde zoom'u sıfırlayalım ki çocuk rahat etsin
        setScale(1.5); 
        
        if (currentLvlIndex + 1 < levels.length) {
            setCurrentLevelIndex(prev => prev + 1);
            setShowDragHint(true); 
        } else {
            setPhase('result');
            // 🔥 KONFETİ GÜNCELLEMESİ (zIndex: 9999 eklendi)
            if (score >= levels.length / 2) {
                confetti({ particleCount: 200, spread: 80, origin: { y: 0.6 }, zIndex: 9999 });
            }
        }
    };

    if (phase === 'intro') {
        return (
            <div className="fixed inset-0 z-[110] bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white">
                <Search size={80} className="text-blue-500 mb-6" />
                <h2 className="text-3xl font-black mb-4">Görevin: Bul ve Dokun!</h2>
                <p className="text-slate-400 mb-8 text-lg">
                    Resmi parmağınla <strong className="text-white">sağa, sola, yukarı ve aşağı kaydırarak</strong> gizli nesneyi ara. İstersen mercekle büyütebilirsin.
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
        <div ref={containerRef} className="fixed inset-0 z-[110] bg-black overflow-hidden flex items-center justify-center touch-none">
            
            {/* ÜST GÖREV BARI */}
            <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between pointer-events-none">
                <button onClick={onClose} className="pointer-events-auto w-12 h-12 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 active:scale-95 transition-transform">
                    <ArrowLeft size={24} />
                </button>
                <div className="bg-black/70 backdrop-blur-md border-2 border-blue-500 rounded-2xl px-6 py-3 flex flex-col items-center shadow-[0_0_20px_rgba(59,130,246,0.3)] pointer-events-auto">
                    <span className="text-[10px] text-blue-300 font-bold uppercase tracking-widest">Görevin: Bul!</span>
                    <span className="text-xl font-black text-white">{level.targetName}</span>
                </div>
                <div className="w-12"></div>
            </div>

            {/* 🔥 ZOOM KONTROLLERİ (Büyüt / Küçült) 🔥 */}
            <div className="absolute right-4 bottom-8 z-50 flex flex-col gap-3 pointer-events-auto">
                <button 
                    onClick={() => setScale(prev => Math.min(prev + 0.5, 3))} // Maksimum 3x büyüt
                    className="w-14 h-14 bg-slate-800/80 backdrop-blur-md border border-slate-600 rounded-2xl flex items-center justify-center text-white active:scale-90 transition-all shadow-xl"
                >
                    <ZoomIn size={28} />
                </button>
                <button 
                    onClick={() => setScale(prev => Math.max(prev - 0.5, 1))} // Minimum 1x küçült
                    className="w-14 h-14 bg-slate-800/80 backdrop-blur-md border border-slate-600 rounded-2xl flex items-center justify-center text-white active:scale-90 transition-all shadow-xl"
                >
                    <ZoomOut size={28} />
                </button>
            </div>

            <AnimatePresence>
                {feedback && (
                    <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
                        <div className={twMerge("w-32 h-32 rounded-full flex items-center justify-center shadow-2xl", feedback === 'correct' ? "bg-green-500" : "bg-red-500")}>
                            {feedback === 'correct' ? <CheckCircle2 size={64} className="text-white" /> : <XCircle size={64} className="text-white" />}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* SÜRÜKLENEBİLİR VE BÜYÜTÜLEBİLİR ALAN */}
            <motion.div 
                drag
                dragConstraints={containerRef} 
                dragElastic={0} 
                dragMomentum={true}
                onDragStart={() => setShowDragHint(false)}
                onTap={handleTap} 
                animate={{ scale: scale }} // Zoom state'ine bağladık
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="w-[100vw] h-[100vh] shrink-0 cursor-grab active:cursor-grabbing relative"
            >
                <img 
                    src={level.bgSrc} 
                    alt="Arka Plan" 
                    draggable="false" 
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none" 
                />
                
                <img 
                    ref={overlayImgRef}
                    src={level.overlaySrc} 
                    alt="Hedef Katman" 
                    draggable="false" 
                    crossOrigin="anonymous"
                    className={twMerge(
                        "absolute inset-0 w-full h-full object-contain pointer-events-none transition-all duration-300",
                        mode === 'instruction' && showHint ? "drop-shadow-[0_0_30px_rgba(59,130,246,1)]" : ""
                    )}
                />
            </motion.div>

            <AnimatePresence>
                {showDragHint && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 pointer-events-none flex items-center justify-center z-40">
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

        </div>
    );
   }
