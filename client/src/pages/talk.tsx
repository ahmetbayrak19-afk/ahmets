import React, { useState, useEffect, useRef } from 'react';
import { Mic, Save, ArrowLeft, Volume2, Trash2, Lock, Square, PlayCircle, Radio, Scan, Layers, BookOpen, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { twMerge } from 'tailwind-merge';
import { toast } from 'sonner';

interface Card {
  nfcId: string;
  text: string;
  audio: string;
}

export default function Talk({ onBack }: { onBack: () => void }) {
  const [view, setView] = useState<'setup' | 'list' | 'active'>('setup');
  const [cards, setCards] = useState<Card[]>([]);
  const [lastReadCard, setLastReadCard] = useState<Card | null>(null);

  // Geçici Durumlar
  const [isRecording, setIsRecording] = useState(false);
  const [tempAudio, setTempAudio] = useState<string | null>(null);
  const [tempName, setTempName] = useState("");
  const [isWaitingNFC, setIsWaitingNFC] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // --- NFC MANTIĞI ---
  useEffect(() => {
    if ('NDEFReader' in window) {
      const reader = new (window as any).NDEFReader();
      const startNFC = async () => {
        try {
          await reader.scan();
          reader.onreading = ({ serialNumber }: any) => {
            if (isWaitingNFC && tempAudio) {
              // KAYIT: Kartı sesle eşleştir
              const newCard: Card = { nfcId: serialNumber, text: tempName || "Yeni Kart", audio: tempAudio };
              setCards(prev => [...prev, newCard]);
              resetSetup();
              toast.success("Kart Başarıyla Tanımlandı!");
              if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
            } else if (view === 'active') {
              // EĞİTİM: Sesi çal
              const matched = cards.find(c => c.nfcId === serialNumber);
              if (matched) {
                setLastReadCard(matched);
                new Audio(matched.audio).play();
                if (navigator.vibrate) navigator.vibrate(100);
              }
            }
          };
        } catch (e) { console.error("NFC Hatası"); }
      };
      startNFC();
    }
  }, [view, isWaitingNFC, tempAudio, tempName, cards]);

  const resetSetup = () => {
    setTempAudio(null);
    setTempName("");
    setIsWaitingNFC(false);
    setIsRecording(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const media = new MediaRecorder(stream);
      mediaRecorderRef.current = media;
      audioChunksRef.current = [];
      media.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      media.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/mp4' });
        setTempAudio(URL.createObjectURL(blob));
      };
      media.start();
      setIsRecording(true);
    } catch (err) { toast.error("Mikrofon izni gerekli!"); }
  };

  const handleScreenTouch = () => {
    if (view === 'active' && cards.length > 0) {
      const randomCard = cards[Math.floor(Math.random() * cards.length)];
      setLastReadCard(randomCard);
      new Audio(randomCard.audio).play();
    }
  };

  // --- GÖRÜNÜM: KURULUM ---
  if (view === 'setup') {
    return (
      <div className="min-h-screen bg-[#020617] text-white p-6 flex flex-col font-sans relative">
        <header className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={onBack} className="text-slate-500"><ArrowLeft /></Button>
          <h1 className="text-2xl font-black tracking-tighter uppercase">TOLKİDO PANEL</h1>
        </header>

        {/* Üst Kısım: Yeni Kart Tanımlama Kartı */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 bg-blue-500 h-full"></div>
          
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">YENİ KART TANIMLA</h2>
          
          <div className="space-y-5">
            <input 
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              placeholder="Kart İsmi (Örn: Elma)" 
              className="w-full bg-slate-950 border border-slate-800 h-14 rounded-2xl px-6 text-white outline-none focus:border-blue-500 transition-all"
            />

            {!tempAudio ? (
              <button 
                onClick={isRecording ? () => mediaRecorderRef.current?.stop() : startRecording}
                className={twMerge(
                  "w-full h-16 rounded-2xl flex items-center justify-center gap-3 font-bold text-lg transition-all",
                  isRecording ? "bg-red-500 animate-pulse" : "bg-blue-600 shadow-lg shadow-blue-900/20"
                )}
              >
                {isRecording ? <><Square size={20} /> KAYDI DURDUR</> : <><Mic size={20} /> SES KAYDI BAŞLAT</>}
              </button>
            ) : (
              <div className="grid grid-cols-1 gap-3 animate-in fade-in slide-in-from-top-2">
                <button 
                  onClick={() => new Audio(tempAudio).play()}
                  className="h-14 bg-slate-800 border border-slate-700 rounded-2xl flex items-center justify-center gap-2 font-bold text-green-400 active:scale-95 transition-all"
                >
                  <PlayCircle size={20} /> SESİ KONTROL ET
                </button>
                
                <button 
                  onClick={() => setIsWaitingNFC(true)}
                  className="h-20 bg-green-600 rounded-2xl flex items-center justify-center gap-3 font-black text-xl shadow-lg shadow-green-900/20 active:scale-95 transition-all"
                >
                  <Save size={24} /> KARTA YÜKLE
                </button>

                <button onClick={resetSetup} className="text-slate-500 text-xs font-bold uppercase py-2">İptal Et ve Sil</button>
              </div>
            )}
          </div>
        </div>

        {/* Alt Kısım: İki Büyük Buton */}
        <div className="mt-auto grid grid-cols-2 gap-4">
          <button 
            onClick={() => setView('list')}
            className="h-32 bg-slate-900 border border-slate-800 rounded-[2rem] flex flex-col items-center justify-center gap-3 active:scale-95 transition-all"
          >
            <div className="p-3 bg-blue-500/10 rounded-xl"><Layers className="text-blue-400" size={28} /></div>
            <span className="text-[10px] font-bold uppercase tracking-widest">Yüklü Kartlar</span>
          </button>
          
          <button 
            onClick={() => setView('active')}
            disabled={cards.length === 0}
            className="h-32 bg-blue-600 rounded-[2rem] flex flex-col items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-20"
          >
            <div className="p-3 bg-white/10 rounded-xl"><BookOpen className="text-white" size={28} /></div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white">Eğitimi Başlat</span>
          </button>
        </div>

        {/* NFC BEKLEME EKRANI (OVERLAY) */}
        {isWaitingNFC && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[200] flex items-center justify-center p-8 text-center">
            <div className="animate-in zoom-in duration-300">
              <div className="w-40 h-40 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-8 border-2 border-blue-500/50 animate-pulse">
                <Scan size={80} className="text-blue-400" />
              </div>
              <h2 className="text-2xl font-black text-white mb-2">KART OKUTUN</h2>
              <p className="text-slate-400 text-sm mb-10">"{tempName}" sesini yüklemek için kartı telefonun arkasına dokundurun.</p>
              <Button variant="outline" onClick={() => setIsWaitingNFC(false)} className="border-slate-800 text-slate-400 rounded-full px-8">
                <X size={18} className="mr-2" /> Vazgeç
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- GÖRÜNÜM: KART LİSTESİ ---
  if (view === 'list') {
    return (
      <div className="min-h-screen bg-[#020617] text-white p-6 flex flex-col font-sans">
        <header className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => setView('setup')}><ArrowLeft /></Button>
          <h1 className="text-xl font-bold">Kayıtlı Kartlar ({cards.length})</h1>
        </header>
        <div className="flex-1 overflow-y-auto space-y-3">
          {cards.map((card, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-4">
                <button onClick={() => new Audio(card.audio).play()} className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center text-green-400">
                  <PlayCircle size={24} />
                </button>
                <span className="font-black text-lg">{card.text}</span>
              </div>
              <button onClick={() => setCards(cards.filter((_, idx) => idx !== i))} className="text-red-500 p-2 hover:bg-red-500/10 rounded-xl transition-colors">
                <Trash2 size={20} />
              </button>
            </div>
          ))}
          {cards.length === 0 && (
            <div className="text-center py-20 opacity-20">
              <Layers size={64} className="mx-auto mb-4" />
              <p className="font-bold">Henüz kart eklenmedi.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- GÖRÜNÜM: EĞİTİM MODU (ÖĞRENCİ) ---
  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-8" onClick={handleScreenTouch}>
      <button onDoubleClick={() => { setView('setup'); setLastReadCard(null); }} className="absolute top-8 left-8 text-slate-900/20">
        <Lock size={32} />
      </button>
      
      <div className="w-full max-w-sm aspect-square bg-slate-900/10 border-2 border-slate-800/50 rounded-[5rem] flex flex-col items-center justify-center p-10 relative overflow-hidden">
        {lastReadCard ? (
          <div className="animate-in zoom-in duration-300">
            <div className="relative">
                <Volume2 size={120} className="text-blue-500 mx-auto mb-10 animate-pulse relative z-10" />
                <div className="absolute inset-0 bg-blue-500/20 blur-[60px] rounded-full"></div>
            </div>
            <h2 className="text-6xl font-black text-white uppercase tracking-tighter leading-none">{lastReadCard.text}</h2>
          </div>
        ) : (
          <div className="opacity-5 flex flex-col items-center gap-8">
            <Radio size={120} className="animate-pulse" />
            <p className="text-2xl font-black tracking-[0.5em]">BEKLENİYOR</p>
          </div>
        )}
      </div>
    </div>
  );
            }
