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
      
      {/* ÜST BAR: Dikeyde geniş (p-4), Yatayda dar (landscape:py-2) */}
      <div className="shrink-0 p-4 landscape:py-2 landscape:px-4 flex items-center justify-between border-b border-slate-800 bg-slate-900/80 backdrop-blur-md relative z-10">
        <button onClick={onClose} className="p-2 landscape:p-1.5 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
          <XCircle className="w-7 h-7 landscape:w-6 landscape:h-6" />
        </button>
        <div className="text-center flex flex-col items-center">
          <h2 className="text-lg landscape:text-sm font-bold truncate max-w-[200px] sm:max-w-md">{itemCode} - {currentVideo.name}</h2>
          <p className="text-xs landscape:text-[10px] text-slate-400 font-medium tracking-widest uppercase mt-1 landscape:mt-0">
            {mode === 'instruction' ? 'ÇALIŞMA MODU' : `TEST MODU (${currentIndex + 1}/${activePlaylist.length})`}
          </p>
        </div>
        <div className="w-10 landscape:w-8"></div> 
      </div>

      {/* VİDEO EKRANI: Dikeyde alt alta (flex-col), Yatayda yan yana (landscape:flex-row) */}
      <div className="flex-1 relative flex flex-col landscape:flex-row p-4 landscape:p-2 gap-4 landscape:gap-2 overflow-hidden bg-black">
        {phase === 'playing' ? (
          <>
            {/* ÖRNEK VİDEO */}
            <div className="flex-1 relative bg-slate-900 rounded-2xl landscape:rounded-xl overflow-hidden border border-slate-800 flex flex-col justify-center">
              <div className="absolute top-3 left-3 landscape:top-2 landscape:left-2 bg-black/60 backdrop-blur px-3 py-1.5 landscape:px-2 landscape:py-1 rounded-lg landscape:rounded-md flex items-center gap-2 landscape:gap-1.5 z-10 text-slate-200 text-xs landscape:text-[10px] font-bold tracking-wider">
                <VideoIcon className="w-4 h-4 landscape:w-3 landscape:h-3 text-blue-400" />
                {/* Dikeyde uzun yazı, yatayda kısa yazı */}
                <span className="hidden landscape:inline">VİDEO</span>
                <span className="landscape:hidden">ÖRNEK VİDEO</span>
              </div>
              <video
                ref={videoRef}
                src={currentVideo.src}
                autoPlay
                loop
                playsInline
                muted
                className="w-full h-full object-cover landscape:object-contain"
              />
            </div>

            {/* KAMERA */}
            <div className="flex-1 relative bg-slate-900 rounded-2xl landscape:rounded-xl overflow-hidden border border-slate-800 flex flex-col justify-center">
              <div className="absolute top-3 left-3 landscape:top-2 landscape:left-2 bg-black/60 backdrop-blur px-3 py-1.5 landscape:px-2 landscape:py-1 rounded-lg landscape:rounded-md flex items-center gap-2 landscape:gap-1.5 z-10 text-slate-200 text-xs landscape:text-[10px] font-bold tracking-wider">
                <CameraIcon className="w-4 h-4 landscape:w-3 landscape:h-3 text-purple-400" />
                <span className="hidden landscape:inline">SEN</span>
                <span className="landscape:hidden">ÖĞRENCİ (SEN)</span>
              </div>
              <video
                ref={webcamRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover landscape:object-contain transform -scale-x-100" 
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

      {/* ALT BUTONLAR: Dikeyde kare (flex-col), Yatayda kapsül (landscape:flex-row) */}
      {phase === 'playing' && (
        <div className="shrink-0 p-6 pb-10 landscape:py-2 landscape:px-4 landscape:pb-2 bg-slate-900 border-t border-slate-800 flex items-center justify-center gap-6 landscape:gap-4 relative z-10">
          {mode === 'instruction' ? (
            <>
              <button onClick={handlePrev} className="flex flex-col landscape:flex-row items-center justify-center gap-2 p-4 w-32 landscape:w-auto landscape:px-6 landscape:py-2.5 landscape:min-w-[120px] bg-slate-800 rounded-2xl landscape:rounded-xl active:scale-95 transition-all text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700">
                <ChevronLeft className="w-8 h-8 landscape:w-5 landscape:h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Önceki</span>
              </button>
              
              <button onClick={handleNext} className="flex flex-col landscape:flex-row items-center justify-center gap-2 p-4 w-32 landscape:w-auto landscape:px-6 landscape:py-2.5 landscape:min-w-[120px] bg-blue-600 rounded-2xl landscape:rounded-xl active:scale-95 transition-all text-white hover:bg-blue-500 shadow-lg shadow-blue-900/50">
                <ChevronRight className="w-8 h-8 landscape:w-5 landscape:h-5 landscape:order-last" />
                <span className="text-xs font-bold uppercase tracking-wider">Sonraki</span>
              </button>
            </>
          ) : (
            <>
              <button onClick={() => handleAssess(false)} className="flex flex-col landscape:flex-row items-center justify-center gap-2 p-4 w-32 landscape:w-auto landscape:px-6 landscape:py-2.5 landscape:min-w-[130px] bg-red-500/10 border-2 border-red-500/50 rounded-2xl landscape:rounded-xl active:scale-95 transition-all text-red-500 hover:bg-red-500/20">
                <X className="w-8 h-8 landscape:w-5 landscape:h-5" />
                <span className="text-xs font-bold uppercase tracking-wider text-center">Yapamadı</span>
              </button>
              
              <button onClick={() => handleAssess(true)} className="flex flex-col landscape:flex-row items-center justify-center gap-2 p-4 w-32 landscape:w-auto landscape:px-6 landscape:py-2.5 landscape:min-w-[130px] bg-green-500 rounded-2xl landscape:rounded-xl active:scale-95 transition-all text-white hover:bg-green-400 shadow-lg shadow-green-900/50 border border-green-400">
                <Check className="w-8 h-8 landscape:w-5 landscape:h-5" />
                <span className="text-xs font-bold uppercase tracking-wider text-center">Yaptı</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
          }
