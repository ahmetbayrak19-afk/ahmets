import { useState, useEffect, useRef } from 'react';
import { db } from '../../firebase'; 
import { doc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Search, Backpack, Star, Sparkles, User, Move, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { toast } from 'sonner';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'framer-motion';

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

  // 🔥 TAM EKRAN YAPMA FONKSİYONU 🔥
  const enterFullScreen = () => {
      if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch((err) => console.log("Tam ekran hatası:", err));
      }
      setActiveGameId('canta');
  };

  const exitFullScreenAndClose = () => {
      if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
      }
      setActiveGameId(null);
  };

  if (isLoading) return <div className="fixed inset-0 z-[100] bg-slate-950 flex justify-center items-center"><Loader2 className="animate-spin text-blue-500" size={48} /></div>;

  if (activeGameId === 'canta') {
      return <HiddenObjectEngine onClose={exitFullScreenAndClose} />;
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
                      onClick={() => !game.disabled && enterFullScreen()} // Tıklayınca Tam Ekrana Geçer
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
function HiddenObjectEngine({ onClose }: { onClose: () => void }) {
    const [scale, setScale] = useState(1.5); 
    const [showDragHint, setShowDragHint] = useState(true); 

    const containerRef = useRef<HTMLDivElement>(null);
    const overlayImgRef = useRef<HTMLImageElement>(null);

    // 🔥 SENİN YERLEŞİME GÖRE GÜNCELLENMİŞ RADAR 🔥
    const identifyObject = (xPercent: number, yPercent: number) => {
        // 1. Yukarıdaki Çanta
        if (yPercent < 45) return "Çanta 🎒";
        
        // 2. En Sağdaki Kitap
        if (xPercent > 75) return "Kitap 📚";
        
        // 3. Sol Taraf (Kalem ve Silgi)
        if (xPercent < 45) {
            if (yPercent > 70) return "Kalem ✏️"; // Sol alt
            else return "Silgi 🧽"; // Kalemin üstündeki silgi
        }
        
        // 4. Geriye kalan (Kalemin sağındaki Defter)
        return "Defter 📖";
    };

    const handleTap = (e: any, info: any) => {
        setShowDragHint(false);
        const img = overlayImgRef.current;
        if (!img) return;

        const rect = img.getBoundingClientRect();
        
        // Dokunulan koordinat
        const clickX = info.point.x - rect.left;
        const clickY = info.point.y - rect.top;

        // X ve Y yüzdesi
        const xPercent = (clickX / rect.width) * 100;
        const yPercent = (clickY / rect.height) * 100;

        // APK'da hatasız okuma yapabilmesi için gerçek boyutlara dönüştürme
        const naturalClickX = (clickX / rect.width) * img.naturalWidth;
        const naturalClickY = (clickY / rect.height) * img.naturalHeight;

        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Resmi çiz ve sadece dokunulan pikseli oku
        ctx.drawImage(img, 0, 0);
        const pixelData = ctx.getImageData(naturalClickX, naturalClickY, 1, 1).data;
        const alpha = pixelData[3]; // Şeffaflık (Boya) değeri

        if (alpha > 10) {
            // Boyalı (dolu) yere tıklandı!
            const touchedObjectName = identifyObject(xPercent, yPercent);
            toast.success(`Algılanan Nesne: ${touchedObjectName}`, { 
                position: 'top-center',
                duration: 2500 
            });
        } else {
            console.log("Boşluğa tıklandı.");
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
                // Koordinatların şaşmaması için w-max h-max kullanıldı
                className="w-max h-max shrink-0 cursor-grab active:cursor-grabbing relative"
            >
                {/* h-[120vh] veya h-[150vh] vererek resmin en boy oranını asla bozmuyoruz */}
                <img 
                    src={canta1} 
                    alt="Arka Plan" 
                    draggable="false" 
                    className="h-[120vh] sm:h-[150vh] w-auto max-w-none pointer-events-none" 
                />
                
                {/* ŞEFFAF KATMAN (crossOrigin kaldırıldı, APK'da sorun yaratmaz) */}
                <img 
                    ref={overlayImgRef}
                    src={canta1x} 
                    alt="Hedef Katman" 
                    draggable="false" 
                    className="absolute inset-0 h-[120vh] sm:h-[150vh] w-auto max-w-none pointer-events-none"
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
              
