import React, { useState, useEffect, useRef } from 'react';
import { Mic, Save, ArrowLeft, Plus, Volume2, Trash2, Lock, Square, PlayCircle, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { twMerge } from 'tailwind-merge';
import { toast } from 'sonner';

interface Card {
  id: string;
  text: string;
  image?: string;
  audio?: string;
}

export default function Talk({ onBack }: { onBack: () => void }) {
  const [view, setView] = useState<'setup' | 'active'>('setup');
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [cards, setCards] = useState<(Card | null)[]>([null, null, null, null]);
  const [lastReadCard, setLastReadCard] = useState<Card | null>(null);

  // Ses Kayıt State'leri
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // --- GERÇEK NFC VE DOKUNMA SİMÜLASYONU ---
  useEffect(() => {
    if (view === 'active') {
      // 1. GERÇEK NFC (Web NFC API - Android APK'larda çalışır)
      if ('NDEFReader' in window) {
        const reader = new (window as any).NDEFReader();
        const startNFC = async () => {
          try {
            await reader.scan();
            reader.onreading = ({ serialNumber }: any) => {
              handleCardTrigger();
            };
          } catch (error) {
            console.error("NFC Hatası:", error);
          }
        };
        startNFC();
      }
    }
  }, [view, cards]);

  const handleCardTrigger = () => {
    const filledCards = cards.filter(c => c !== null) as Card[];
    if (filledCards.length > 0) {
      const card = filledCards[Math.floor(Math.random() * filledCards.length)];
      setLastReadCard(card);
      if (card.audio) {
        const audio = new Audio(card.audio);
        audio.play().catch(e => console.error("Ses çalma hatası:", e));
      }
      // Titreşim (Mobil cihazlarda kart okunduğunda hissettirir)
      if (navigator.vibrate) navigator.vibrate(100);
    } else {
      toast.error("Önce kart yüklemelisin!");
    }
  };

  // --- SES KAYIT MANTIĞI ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp4' });
        setRecordedAudio(URL.createObjectURL(audioBlob));
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      toast.error("Mikrofon izni gerekli!");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      setIsRecording(false);
    }
  };

  const handleSaveCard = () => {
    const name = (document.getElementById('card-name') as HTMLInputElement).value || "Yeni Kart";
    if (activeSlot !== null) {
      const newCards = [...cards];
      newCards[activeSlot] = { 
        id: Date.now().toString(), 
        text: name, 
        audio: recordedAudio || undefined 
      };
      setCards(newCards);
      setActiveSlot(null);
      setRecordedAudio(null);
    }
  };

  // --- RENDER HAZIRLIK ---
  if (view === 'setup') {
    return (
      <div className="min-h-screen bg-[#020617] text-white p-6 flex flex-col font-sans">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack} className="text-slate-400"><ArrowLeft /></Button>
            <h1 className="text-2xl font-black tracking-tighter uppercase">TOLKİDO</h1>
          </div>
          {/* NFC Aktif İkonu */}
          {'NDEFReader' in window && <Radio className="text-blue-500 animate-pulse" size={20} />}
        </div>

        <div className="grid grid-cols-2 gap-4 flex-1 content-center">
          {cards.map((card, index) => (
            <div 
              key={index}
              onClick={() => setActiveSlot(index)}
              className={twMerge(
                "aspect-square rounded-[2rem] border-2 flex flex-col items-center justify-center gap-2 transition-all active:scale-95 relative",
                card ? "bg-blue-600/20 border-blue-500 text-blue-400" : "bg-slate-900 border-slate-800 border-dashed text-slate-600"
              )}
            >
              {card ? (
                <>
                  <Volume2 size={40} />
                  <span className="font-bold text-xs">{card.text}</span>
                  <button onClick={(e) => { e.stopPropagation(); const n = [...cards]; n[index] = null; setCards(n); }} className="absolute top-3 right-3 text-red-500 bg-red-500/10 p-1 rounded-lg"><Trash2 size={16} /></button>
                </>
              ) : (
                <>
                  <Plus size={32} />
                  <span className="text-[10px] font-bold uppercase">{index === 3 ? "EKLE" : "KART YÜKLE"}</span>
                </>
              )}
            </div>
          ))}
        </div>

        <button 
          onClick={() => setView('active')}
          disabled={!cards.some(c => c !== null)}
          className="mt-8 w-full bg-blue-600 text-white h-16 rounded-2xl font-black text-xl active:bg-blue-700 disabled:opacity-30"
        >
          BAŞLA
        </button>

        {/* KAYIT PANELİ (MODAL) */}
        {activeSlot !== null && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[150] flex items-end sm:items-center justify-center p-4">
            <div className="bg-slate-900 w-full max-w-sm rounded-[2.5rem] p-8 border border-slate-800 animate-in slide-in-from-bottom-10">
              <h3 className="text-xl font-bold mb-6 text-center">Ses Kaydı Yap</h3>
              <div className="flex flex-col gap-4">
                <button 
                  onClick={isRecording ? stopRecording : startRecording}
                  className={twMerge("h-20 rounded-2xl flex items-center justify-center gap-3 font-bold transition-all", isRecording ? "bg-red-500 animate-pulse text-white" : "bg-blue-600/10 text-blue-500 border border-blue-500/20")}
                >
                  {isRecording ? <><Square /> DURDUR</> : <><Mic /> KAYDI BAŞLAT</>}
                </button>

                {recordedAudio && (
                  <button onClick={() => new Audio(recordedAudio).play()} className="h-12 bg-green-500/10 text-green-500 rounded-xl font-bold flex items-center justify-center gap-2">
                    <PlayCircle size={20} /> DİNLE
                  </button>
                )}

                <input id="card-name" placeholder="Kart Adı" className="bg-slate-950 border border-slate-800 h-14 rounded-xl px-4 outline-none text-white" />
                
                <div className="flex gap-2 mt-2">
                  <Button variant="ghost" className="flex-1" onClick={() => setActiveSlot(null)}>İPTAL</Button>
                  <Button className="flex-1 bg-green-600" onClick={handleSaveCard}>KAYDET</Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- RENDER OKUMA MODU ---
  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6" onClick={handleCardTrigger}>
      <button onDoubleClick={() => setView('setup')} className="absolute top-6 left-6 text-slate-800"><Lock size={24} /></button>
      
      <div className="w-full max-w-sm aspect-square bg-slate-900/30 border-2 border-slate-800 rounded-[3rem] flex flex-col items-center justify-center p-10 text-center shadow-inner">
        {lastReadCard ? (
          <div className="animate-in zoom-in duration-300">
            <div className="w-40 h-40 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Volume2 size={64} className="text-blue-500 animate-pulse" />
            </div>
            <h2 className="text-5xl font-black text-white uppercase tracking-tighter">{lastReadCard.text}</h2>
          </div>
        ) : (
          <div className="opacity-10 space-y-4">
            <Radio size={80} className="mx-auto animate-pulse" />
            <p className="text-xl font-black tracking-widest">KART OKUTUN VEYA EKRANA DOKUNUN</p>
          </div>
        )}
      </div>
    </div>
  );
          }
                                     
