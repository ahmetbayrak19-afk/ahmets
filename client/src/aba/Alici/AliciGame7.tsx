import { useState, useEffect, useRef } from 'react';
import { db } from '../../firebase'; 
import { doc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Search, Backpack, Star, Sparkles, User, Move, ZoomIn, ZoomOut } from 'lucide-react';
import { toast } from 'sonner';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'framer-motion';

// --- UZANTILAR DÜZELTİLDİ (.png ve .png) ---
import canta1 from './dedektif/canta1.png';
import canta1x from './dedektif/canta1x.png';

const GAMES = [
  { id: 'dedektif', title: 'Not Defteri', icon: Search, color: 'from-blue-600 to-indigo-900', btnColor: 'bg-blue-600', disabled: true },
  { id: 'canta', title: 'Okul Çantası', icon: Backpack, color: 'from-orange-500 to-red-800', btnColor: 'bg-orange-600', disabled: false },
  { id: 'gizemli_3', title: 'Gizem 3', icon: Star, color: 'from-slate-700 to-slate-900', btnColor: 'bg-slate-700', disabled: true },
  { id: 'gizemli_4', title: 'Gizem 4', icon: Sparkles, color: 'from-slate-700 to-slate-900', btnColor: 'bg-slate-700', disabled: true }
];

export default function AliciGame7({ studentId, onClose }: { studentId: string, onClose: () => void }) {
  const [student, setStudent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeGameId, setActiveGameId] = useState<string | null>(null);

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

  // Direkt Test Motoruna Gider
  if (activeGameId === 'canta') {
      return <HiddenObjectEngine onClose={() => setActiveGameId(null)} />;
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


// --- GİZLİ NESNE BULMA MOTORU (SADECE TEST MANTIĞI) ---
function HiddenObjectEngine({ onClose }: { onClose: () => void }) {
    const [scale, setScale] = useState(1.5); 
    const [showDragHint, setShowDragHint] = useState(true); 

    const containerRef = useRef<HTMLDivElement>(null);
    const overlayImgRef = useRef<HTMLImageElement>(null);

    // RADAR
    const identifyObject = (xPercent: number, yPercent: number) => {
        // Çanta (Yukarıda)
        if (yPercent < 60) return "Çanta 🎒";
        
        // Kitap (En Sağda)
        if (xPercent > 55) return "Kitap 📚";
        
        // Sol taraftaki nesneler
        if (xPercent < 35) {
            // Kalem (Sol alt)
            if (yPercent > 80) return "Kalem ✏️";
            // Silgi (Kalemin üstünde)
            else return "Silgi 🧽";
        }
        
        // Geriye sadece Defter kalıyor (Sağdaki)
        return "Defter 📖";
    };

    const handleTap = (e: any, info: any) => {
        setShowDragHint(false);
        const img = overlayImgRef.current;
        if (!img) return;

        const rect = img.getBoundingClientRect();
        const clickX = info.point.x - rect.left;
        const clickY = info.point.y - rect.top;

        const xPercent = (clickX / rect.width) * 100;
        const yPercent = (clickY / rect.height) * 100;

        const scaleX = img.naturalWidth / rect.width;
        const scaleY = img.naturalHeight / rect.height;
        const targetX = clickX * scaleX;
        const targetY = clickY * scaleY;

        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, -targetX, -targetY);
        const pixelData = ctx.getImageData(0, 0, 1, 1).data;
        const alpha = pixelData[3];

        if (alpha > 10) {
            // Dolu (boyalı) yere tıklandı
            const touchedObjectName = identifyObject(xPercent, yPercent);
            
            toast.success(`Algılanan Nesne: ${touchedObjectName}`, { 
                position: 'top-center',
                duration: 2000 
            });
            
        } else {
            // Boşluğa tıklandı, oyun devam
            console.log("Boşluğa tıklandı, tepki verilmedi.");
        }
    };

    return (
        <div ref={containerRef} className="fixed inset-0 z-[110] bg-black overflow-hidden flex items-center justify-center touch-none">
            
            {/* ÜST GÖREV BARI */}
            <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between pointer-events-none">
                <button onClick={onClose} className="pointer-events-auto w-12 h-12 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 active:scale-95 transition-transform">
                    <ArrowLeft size={24} />
                </button>
                <div className="bg-purple-600/80 backdrop-blur-md border-2 border-purple-400 rounded-2xl px-6 py-2 flex flex-col items-center shadow-xl pointer-events-auto">
                    <span className="text-[10px] text-purple-200 font-bold uppercase tracking-widest animate-pulse">RADAR TEST MODU</span>
                    <span className="text-sm font-bold text-white">Nesnelere Dokun!</span>
                </div>
                <div className="w-12"></div>
            </div>

            {/* ZOOM KONTROLLERİ */}
            <div className="absolute right-4 bottom-8 z-50 flex flex-col gap-3 pointer-events-auto">
                <button 
                    onClick={() => setScale(prev => Math.min(prev + 0.5, 3))} 
                    className="w-14 h-14 bg-slate-800/80 backdrop-blur-md border border-slate-600 rounded-2xl flex items-center justify-center text-white active:scale-90 transition-all shadow-xl"
                >
                    <ZoomIn size={28} />
                </button>
                <button 
                    onClick={() => setScale(prev => Math.max(prev - 0.5, 1))} 
                    className="w-14 h-14 bg-slate-800/80 backdrop-blur-md border border-slate-600 rounded-2xl flex items-center justify-center text-white active:scale-90 transition-all shadow-xl"
                >
                    <ZoomOut size={28} />
                </button>
            </div>

            {/* SÜRÜKLENEBİLİR VE BÜYÜTÜLEBİLİR ALAN */}
            <motion.div 
                drag
                dragConstraints={containerRef} 
                dragElastic={0} 
                dragMomentum={true}
                onDragStart={() => setShowDragHint(false)}
                onTap={handleTap} 
                animate={{ scale: scale }} 
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="w-[100vw] h-[100vh] shrink-0 cursor-grab active:cursor-grabbing relative"
            >
                <img 
                    src={canta1} 
                    alt="Arka Plan" 
                    draggable="false" 
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none" 
                />
                
                <img 
                    ref={overlayImgRef}
                    src={canta1x} 
                    alt="Hedef Katman" 
                    draggable="false" 
                    crossOrigin="anonymous"
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                />
            </motion.div>

            <AnimatePresence>
                {showDragHint && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 pointer-events-none flex items-center justify-center z-40">
                        <div className="relative w-48 h-48">
                            <Move size={64} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white/50 animate-pulse" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
    }
    
