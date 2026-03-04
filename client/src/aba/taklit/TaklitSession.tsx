import { useState, useRef, useEffect, useMemo } from 'react';
import { XCircle, ChevronLeft, ChevronRight, Check, X, Trophy, Video as VideoIcon, Camera as CameraIcon } from 'lucide-react';
import confetti from 'canvas-confetti';

// --- NESNELİ TAKLİT VİDEOLARI ---
import arabasurme from './nesnelitaklit/arabasurme.mp4';
import davulcalma from './nesnelitaklit/davulcalma.mp4';
import kovakupatma from './nesnelitaklit/kovakupatma.mp4';
import ksilofon from './nesnelitaklit/ksilofon.mp4';
import marakas from './nesnelitaklit/marakas.mp4';

// --- NESNESİZ TAKLİT VİDEOLARI ---
import alkis from './nesnesiztaklit/alkis.mp4';
import basgoster from './nesnesiztaklit/basgoster.mp4';
import burungoster from './nesnesiztaklit/burungoster.mp4';
import karnavur from './nesnesiztaklit/karnavur.mp4';
import kulakgoster from './nesnesiztaklit/kulakgoster.mp4';

// --- YÜZ / DUDAK TAKLİT VİDEOLARI ---
import agizac from './yuzdudak/agizac.mp4';
import dilcikar from './yuzdudak/dilcikar.mp4';
import dudakbuz from './yuzdudak/dudakbuz.mp4';

const PLAYLISTS = {
  NESNELI: [
    { id: 'araba', name: 'Araba Sürme', src: arabasurme },
    { id: 'davul', name: 'Davul Çalma', src: davulcalma },
    { id: 'kova', name: 'Kova Kapatma', src: kovakupatma },
    { id: 'ksilofon', name: 'Ksilofon', src: ksilofon },
    { id: 'marakas', name: 'Marakas', src: marakas },
  ],
  NESNESIZ: [
    { id: 'alkis', name: 'Alkış Yapma', src: alkis },
    { id: 'bas', name: 'Baş Gösterme', src: basgoster },
    { id: 'burun', name: 'Burun Gösterme', src: burungoster },
    { id: 'karin', name: 'Karın Vurma', src: karnavur },
    { id: 'kulak', name: 'Kulak Gösterme', src: kulakgoster },
  ],
  YUZDUDAK: [
    { id: 'agiz', name: 'Ağız Açma', src: agizac },
    { id: 'dil', name: 'Dil Çıkarma', src: dilcikar },
    { id: 'dudak', name: 'Dudak Büzme', src: dudakbuz },
  ]
};

interface TaklitSessionProps {
  mode: 'assessment' | 'instruction';
  itemCode: string;
  itemText: string;
  onClose: () => void;
  onSaveStatus: (success: boolean) => void;
}

export default function TaklitSession({ mode, itemCode, itemText, onClose, onSaveStatus }: TaklitSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<'playing' | 'result'>('playing');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const webcamRef = useRef<HTMLVideoElement>(null);

  const activePlaylist = useMemo(() => {
    if (itemCode.includes("1.1")) return PLAYLISTS.NESNELI;
    if (itemCode.includes("1.2")) return PLAYLISTS.NESNESIZ;
    if (itemCode.includes("2.3")) return PLAYLISTS.YUZDUDAK;
    return PLAYLISTS.NESNESIZ; 
  }, [itemCode]);

  const currentVideo = activePlaylist[currentIndex];

  useEffect(() => {
    let stream: MediaStream | null = null;
    
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (webcamRef.current) {
          webcamRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Kamera açılamadı veya izin verilmedi:", err);
      }
    };

    if (phase === 'playing') {
      startCamera();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [phase]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [currentIndex]);

  const handlePrev = () => {
    setCurrentIndex(prev => (prev === 0 ? activePlaylist.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev === activePlaylist.length - 1 ? 0 : prev + 1));
  };

  const handleAssess = (correct: boolean) => {
    if (correct) setScore(prev => prev + 1);

    if (currentIndex + 1 < activePlaylist.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setPhase('result');
      if (score + (correct ? 1 : 0) >= Math.ceil(activePlaylist.length / 2)) {
        confetti({ particleCount: 200, spread: 80, origin: { y: 0.6 } });
      }
    }
  };

  const completeSession = () => {
    const isSuccess = score >= Math.ceil(activePlaylist.length / 2);
    onSaveStatus(isSuccess);
    onClose();
  };

  return (
    <div className="fixed inset-0 h-[100dvh] w-screen z-[100] flex flex-col bg-slate-950 text-white">
      {/* Üst Bar - padding daraltıldı, shrink-0 eklendi */}
      <div className="shrink-0 py-2 px-4 flex items-center justify-between border-b border-slate-800 bg-slate-900/80 backdrop-blur-md relative z-10">
        <button onClick={onClose} className="p-1.5 sm:p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
          <XCircle size={24} />
        </button>
        <div className="text-center flex flex-col items-center">
          <h2 className="text-sm sm:text-lg font-bold truncate max-w-[200px] sm:max-w-md">{itemCode} - {currentVideo.name}</h2>
          <p className="text-[10px] sm:text-xs text-slate-400 font-medium tracking-widest uppercase">
            {mode === 'instruction' ? 'ÇALIŞMA MODU' : `TEST MODU (${currentIndex + 1}/${activePlaylist.length})`}
          </p>
        </div>
        <div className="w-8 sm:w-10"></div> 
      </div>

      {/* Ekran (Yarı Video / Yarı Kamera) - p-4'ten p-2'ye düşürüldü */}
      <div className="flex-1 relative flex flex-row p-2 gap-2 overflow-hidden bg-black">
        {phase === 'playing' ? (
          <>
            {/* SOL: ÖRNEK VİDEO */}
            <div className="flex-1 relative bg-slate-900 rounded-xl overflow-hidden border border-slate-800 flex flex-col justify-center">
              <div className="absolute top-2 left-2 bg-black/60 backdrop-blur px-2 py-1 rounded-md flex items-center gap-1.5 z-10 text-slate-200 text-[10px] font-bold tracking-wider">
                <VideoIcon size={12} className="text-blue-400" /> VİDEO
              </div>
              <video
                ref={videoRef}
                src={currentVideo.src}
                autoPlay
                loop
                playsInline
                muted
                className="w-full h-full object-contain"
              />
            </div>

            {/* SAĞ: KAMERA */}
            <div className="flex-1 relative bg-slate-900 rounded-xl overflow-hidden border border-slate-800 flex flex-col justify-center">
              <div className="absolute top-2 left-2 bg-black/60 backdrop-blur px-2 py-1 rounded-md flex items-center gap-1.5 z-10 text-slate-200 text-[10px] font-bold tracking-wider">
                <CameraIcon size={12} className="text-purple-400" /> SEN
              </div>
              <video
                ref={webcamRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100" 
              />
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl m-auto max-w-xl">
            <Trophy size={64} className={score >= Math.ceil(activePlaylist.length / 2) ? "text-yellow-500 mb-4 animate-bounce" : "text-slate-500 mb-4"} />
            <h1 className="text-2xl sm:text-3xl font-black mb-2">Test Bitti!</h1>
            <p className="text-slate-400 mb-6 text-base sm:text-lg">Doğru Sayısı: {score} / {activePlaylist.length}</p>
            <button onClick={completeSession} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold text-base transition-all active:scale-95 shadow-xl shadow-blue-900/50">
              KAYDET VE ÇIK
            </button>
          </div>
        )}
      </div>

      {/* Alt Kontrol Paneli - Yatay butonlar ile inceltildi */}
      {phase === 'playing' && (
        <div className="shrink-0 py-2 sm:py-3 px-4 bg-slate-900 border-t border-slate-800 flex items-center justify-center gap-4 relative z-10">
          {mode === 'instruction' ? (
            <>
              <button onClick={handlePrev} className="flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-800 rounded-xl active:scale-95 transition-all text-slate-300 hover:bg-slate-700 hover:text-white min-w-[120px] border border-slate-700">
                <ChevronLeft size={20} />
                <span className="text-xs font-bold uppercase tracking-wider">Önceki</span>
              </button>
              <button onClick={handleNext} className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 rounded-xl active:scale-95 transition-all text-white hover:bg-blue-500 min-w-[120px] shadow-lg shadow-blue-900/50">
                <span className="text-xs font-bold uppercase tracking-wider">Sonraki</span>
                <ChevronRight size={20} />
              </button>
            </>
          ) : (
            <>
              <button onClick={() => handleAssess(false)} className="flex items-center justify-center gap-2 px-6 py-2.5 bg-red-500/10 border border-red-500/50 rounded-xl active:scale-95 transition-all text-red-500 hover:bg-red-500/20 min-w-[130px]">
                <X size={20} />
                <span className="text-xs font-bold uppercase tracking-wider text-center">Yapamadı</span>
              </button>
              <button onClick={() => handleAssess(true)} className="flex items-center justify-center gap-2 px-6 py-2.5 bg-green-500 rounded-xl active:scale-95 transition-all text-white hover:bg-green-400 min-w-[130px] shadow-lg shadow-green-900/50 border border-green-400">
                <Check size={20} />
                <span className="text-xs font-bold uppercase tracking-wider text-center">Yaptı</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
      }
              
