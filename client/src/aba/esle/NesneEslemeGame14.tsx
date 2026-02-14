import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Box, Mic2, Image, Volume2, RefreshCcw, Lightbulb, Coins, Settings } from 'lucide-react';

// --- TİPLER ---
interface GameProps {
  mode: 'assessment' | 'instruction';
  onClose: () => void;
  onComplete: (success: boolean) => void;
}

interface GameBox {
  id: string;
  soundId: number;
  status: 'idle' | 'selected' | 'matched';
}

// --- DOSYA YOLLARI ---
const BASE_PATH = "/client/src/aba/esle/sesesleme";
const getSoundPath = (id: number) => `${BASE_PATH}/${id}siseici.mp3`;
const getSmallBoxImage = () => `${BASE_PATH}/eslekutucuk.png`;
const getChestParts = () => ({
  left: `${BASE_PATH}/kutusol.png`,
  mid: `${BASE_PATH}/kutuorta.png`,
  right: `${BASE_PATH}/kutusag.png`
});

export default function NesneEslemeGame14({ mode, onClose, onComplete }: GameProps) {
  // --- EKRAN YÖNÜ KONTROLÜ (ZORLA YATAY) ---
  const [isPortrait, setIsPortrait] = useState(false);
  const [windowSize, setWindowSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setWindowSize({ w, h });
      setIsPortrait(h > w); // Yükseklik genişlikten büyükse diktir
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [selectedLevel, setSelectedLevel] = useState<1 | 2 | 3 | null>(null);

  // --- OYUN STATE ---
  const [boxes, setBoxes] = useState<GameBox[]>([]);
  const [selectedBoxIds, setSelectedBoxIds] = useState<string[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [score, setScore] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playSound = (soundId: number) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    const audio = new Audio(getSoundPath(soundId));
    audioRef.current = audio;
    audio.play().catch(e => console.error("Ses hatası:", e));
  };

  const initLevel1 = () => {
    const availableSounds = [1, 2, 3, 4, 5, 6, 7];
    const chosenSounds = availableSounds.sort(() => 0.5 - Math.random()).slice(0, 4);
    
    const gameDeck: GameBox[] = [...chosenSounds, ...chosenSounds]
      .map((soundId, index) => ({
        id: `box-${index}`,
        soundId,
        status: 'idle'
      }))
      .sort(() => 0.5 - Math.random());

    setBoxes(gameDeck);
    setSelectedBoxIds([]);
    setIsChecking(false);
    setScore(0);
  };

  const handleBoxClick = (boxId: string) => {
    const box = boxes.find(b => b.id === boxId);
    if (isChecking || !box || box.status !== 'idle') return;
    if (selectedBoxIds.length >= 2) return;

    playSound(box.soundId);
    setBoxes(prev => prev.map(b => b.id === boxId ? { ...b, status: 'selected' } : b));
    
    const newSelected = [...selectedBoxIds, boxId];
    setSelectedBoxIds(newSelected);

    if (newSelected.length === 2) {
      setIsChecking(true);
      checkMatch(newSelected[0], newSelected[1]);
    }
  };

  const checkMatch = (id1: string, id2: string) => {
    const box1 = boxes.find(b => b.id === id1);
    const box2 = boxes.find(b => b.id === id2);

    if (!box1 || !box2) return;

    if (box1.soundId === box2.soundId) {
      setTimeout(() => {
        setBoxes(prev => prev.map(b => 
          (b.id === id1 || b.id === id2) ? { ...b, status: 'matched' } : b
        ));
        setSelectedBoxIds([]);
        setIsChecking(false);
        setScore(prev => prev + 20);

        const remaining = boxes.filter(b => b.status === 'idle' && b.id !== id1 && b.id !== id2).length;
        if (remaining === 0) setTimeout(() => alert("Tebrikler! Hepsini buldun!"), 500);
      }, 1000);
    } else {
      setTimeout(() => {
        setBoxes(prev => prev.map(b => 
          (b.id === id1 || b.id === id2) ? { ...b, status: 'idle' } : b
        ));
        setSelectedBoxIds([]);
        setIsChecking(false);
      }, 1500);
    }
  };

  useEffect(() => {
    if (selectedLevel === 1) initLevel1();
  }, [selectedLevel]);

  // --- İÇERİK OLUŞTURUCU ---
  const renderGameContent = () => {
    switch (selectedLevel) {
      case 1:
        const slot1Box = boxes.find(b => b.id === selectedBoxIds[0]);
        const slot2Box = boxes.find(b => b.id === selectedBoxIds[1]);

        return (
          <div className="flex flex-col h-full relative">
            <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
                <div className="bg-slate-900/80 backdrop-blur border border-yellow-600/50 px-4 py-2 rounded-full flex items-center gap-2 text-yellow-400 font-bold shadow-lg">
                    <Coins size={20} />
                    <span>{score}</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={initLevel1} className="p-3 bg-blue-900/80 rounded-full border border-blue-500 text-blue-300 hover:bg-blue-800 transition shadow-lg">
                        <RefreshCcw size={24} />
                    </button>
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center relative">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 opacity-90 -z-10"></div>
                {/* Işık Efekti */}
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[60%] h-[60%] bg-blue-500/10 blur-[100px] rounded-full -z-10"></div>

                {/* --- BÜYÜK SANDIK --- */}
                <div className="relative flex items-end justify-center drop-shadow-2xl scale-90 md:scale-100 transition-transform duration-500">
                    <h1 className="absolute -top-16 text-4xl font-black text-amber-400 tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" style={{ textShadow: '0 0 10px #d97706' }}>
                        SESLİ SANDIK
                    </h1>

                    <img src={getChestParts().left} alt="Chest Left" className="h-48 md:h-64 object-contain translate-x-1" />
                    
                    <div className="h-48 md:h-64 relative flex items-center justify-center bg-repeat-x" 
                         style={{ backgroundImage: `url(${getChestParts().mid})`, backgroundSize: 'auto 100%', minWidth: '300px' }}>
                        
                        <div className="flex gap-8 mt-8 z-10">
                            {/* SOL SLOT */}
                            <div className="flex flex-col items-center gap-2">
                                <span className="text-amber-200 font-bold text-xs bg-black/50 px-2 py-0.5 rounded border border-amber-700/50">EŞLEŞTİR</span>
                                <div className="w-20 h-20 md:w-24 md:h-24 bg-black/40 border-4 border-amber-900/60 rounded-lg shadow-inner flex items-center justify-center relative transition-all duration-300">
                                    {slot1Box && <img src={getSmallBoxImage()} alt="Box" className="w-16 h-16 md:w-20 md:h-20 object-contain drop-shadow-xl animate-in zoom-in duration-300" />}
                                    {slot1Box && <Settings className="absolute -top-4 -right-4 text-cyan-400 animate-spin opacity-50" size={20} />}
                                </div>
                            </div>
                            
                            {/* KİLİT */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/3">
                                <div className="w-10 h-14 bg-gradient-to-b from-yellow-600 to-yellow-800 rounded-b-xl border-2 border-yellow-300 shadow-xl flex items-center justify-center">
                                    <div className="w-2 h-5 bg-black/60 rounded-full"></div>
                                </div>
                            </div>

                            {/* SAĞ SLOT */}
                            <div className="flex flex-col items-center gap-2">
                                <span className="text-amber-200 font-bold text-xs bg-black/50 px-2 py-0.5 rounded border border-amber-700/50">EŞLEŞTİR</span>
                                <div className="w-20 h-20 md:w-24 md:h-24 bg-black/40 border-4 border-amber-900/60 rounded-lg shadow-inner flex items-center justify-center transition-all duration-300">
                                    {slot2Box && <img src={getSmallBoxImage()} alt="Box" className="w-16 h-16 md:w-20 md:h-20 object-contain drop-shadow-xl animate-in zoom-in duration-300" />}
                                </div>
                            </div>
                        </div>
                    </div>
                    <img src={getChestParts().right} alt="Chest Right" className="h-48 md:h-64 object-contain -translate-x-1" />
                </div>
            </div>

            {/* ALT KUTULAR */}
            <div className="h-40 bg-slate-950/80 backdrop-blur-md border-t border-slate-800 p-4 flex items-center justify-center gap-4 overflow-x-auto">
                {boxes.map((box) => (
                    <div key={box.id} className="relative w-20 h-20 md:w-24 md:h-24 flex-shrink-0 transition-all duration-300">
                       {box.status === 'idle' ? (
                           <button onClick={() => handleBoxClick(box.id)} className="w-full h-full group hover:-translate-y-2 transition-transform duration-300">
                               <img src={getSmallBoxImage()} alt="Kutu" className="w-full h-full object-contain drop-shadow-lg group-hover:drop-shadow-[0_10px_10px_rgba(59,130,246,0.5)]" />
                           </button>
                       ) : (
                           <div className="w-full h-full border-2 border-slate-800 border-dashed rounded-lg opacity-20"></div>
                       )}
                    </div>
                ))}
            </div>
          </div>
        );
      default: return null;
    }
  };

  // --- 🔥 ANA RETURN (ZORLA YÖN DÖNDÜRME MANTIĞI) 🔥 ---
  // Ekran dik olsa bile CSS ile zorla 90 derece döndürerek yataymış gibi gösteriyoruz.
  
  const containerStyle: React.CSSProperties = isPortrait
  ? {
      position: 'fixed',
      top: '50%',
      left: '50%',
      // Dik ekranda: Genişlik ekranın boyu kadar, Yükseklik ekranın eni kadar olur.
      width: `${windowSize.h}px`,
      height: `${windowSize.w}px`,
      // Ortadan 90 derece döndür
      transform: 'translate(-50%, -50%) rotate(90deg)',
      zIndex: 100,
      backgroundColor: '#020617', // Arka plan rengi (kenarlar için)
    }
  : {
      // Yatay ekranda normal davran
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      backgroundColor: '#020617',
    };

  return (
    <div style={containerStyle} className="text-white flex flex-col font-sans select-none overflow-hidden">
      
      {/* HEADER (Menüdeyken) */}
      {!selectedLevel ? (
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between shadow-lg">
            <button onClick={onClose} className="p-3 bg-slate-800 rounded-full hover:bg-slate-700 transition border border-slate-700">
                <ArrowLeft size={24} />
            </button>
            <h2 className="text-xl font-bold text-slate-200">Ses Eşleme Becerileri</h2>
            <div className="w-12" />
        </div>
      ) : (
         <button onClick={() => setSelectedLevel(null)} className="absolute top-4 left-4 z-50 p-2 bg-slate-800/80 rounded-full text-slate-300 hover:bg-red-900/80 hover:text-white transition">
            <ArrowLeft size={20} />
         </button>
      )}

      {/* İÇERİK */}
      <div className="flex-1 relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-950 to-black w-full h-full overflow-hidden">
        
        {/* --- ANA MENÜ --- */}
        {!selectedLevel && (
            <div className="h-full flex flex-col items-center justify-center p-6 gap-6 animate-in fade-in zoom-in duration-300">
                <button onClick={() => setSelectedLevel(1)} className="w-full max-w-md bg-gradient-to-r from-amber-900 to-slate-900 border border-amber-700 p-6 rounded-2xl flex items-center gap-6 hover:scale-105 active:scale-95 transition-all shadow-xl group">
                    <div className="w-16 h-16 rounded-full bg-amber-600 flex items-center justify-center shadow-lg group-hover:bg-amber-500 transition-colors">
                        <Box size={32} className="text-white animate-bounce" />
                    </div>
                    <div className="text-left">
                        <h4 className="text-xl font-bold text-white">Sesli Sandık</h4>
                        <p className="text-sm text-amber-300">Aynı sesi çıkaran kutuları bul.</p>
                    </div>
                </button>
                {/* Diğer menü öğeleri... */}
            </div>
        )}

        {/* --- OYUN ALANI --- */}
        {selectedLevel && (
            <div className="w-full h-full animate-in slide-in-from-bottom duration-500">
                {renderGameContent()}
            </div>
        )}
      </div>
    </div>
  );
}
