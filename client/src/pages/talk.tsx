import React, { useState, useEffect, useRef } from 'react';
import { Mic, Save, ArrowLeft, Volume2, Trash2, Lock, Square, PlayCircle, Radio, Scan, Layers, BookOpen, X, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { twMerge } from 'tailwind-merge';
import { toast } from 'sonner';

interface Card {
  nfcId: string;
  text: string;
  audio: string;
}

export default function Talk({ onBack }: { onBack: () => void }) {
  // GÖRÜNÜM: 'permissions' (Başlangıç), 'setup' (Kurulum), 'list' (Liste), 'active' (Eğitim)
  const [view, setView] = useState<'permissions' | 'setup' | 'list' | 'active'>('permissions');
  const [cards, setCards] = useState<Card[]>([]);
  const [lastReadCard, setLastReadCard] = useState<Card | null>(null);

  // Kayıt Durumları
  const [isRecording, setIsRecording] = useState(false);
  const [tempAudio, setTempAudio] = useState<string | null>(null);
  const [tempName, setTempName] = useState("");
  const [isWaitingNFC, setIsWaitingNFC] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // --- 1. SİSTEM İZİNLERİNİ BAŞTA ALMA ---
  const requestAllPermissions = async () => {
    try {
      // Mikrofon İzni
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop()); // İzni aldık, şimdilik kapatalım

      // NFC Kontrolü (Destekleniyorsa)
      if ('NDEFReader' in window) {
        const ndef = new (window as any).NDEFReader();
        await ndef.scan();
      }

      toast.success("Tüm izinler onaylandı!");
      setView('setup'); // İzinler tamamsa kuruluma geç
    } catch (err: any) {
      console.error("İzin Hatası:", err);
      toast.error("Lütfen mikrofon ve NFC izinlerini onaylayın.");
    }
  };

  // --- 2. NFC OKUMA SİSTEMİ ---
  useEffect(() => {
    if (view !== 'permissions' && 'NDEFReader' in window) {
      const reader = new (window as any).NDEFReader();
      const startNFC = async () => {
        try {
          await reader.scan();
          reader.onreading = ({ serialNumber }: any) => {
            if (isWaitingNFC && tempAudio) {
              const newCard: Card = { nfcId: serialNumber, text: tempName || "Yeni Kart", audio: tempAudio };
              setCards(prev => [...prev, newCard]);
              resetSetup();
              toast.success("Kart Tanımlandı!");
              if (navigator.vibrate) navigator.vibrate(200);
            } else if (view === 'active') {
              const matched = cards.find(c => c.nfcId === serialNumber);
              if (matched) {
                setLastReadCard(matched);
                new Audio(matched.audio).play();
                if (navigator.vibrate) navigator.vibrate(100);
              }
            }
          };
        } catch (e) { console.error("NFC Aktif Edilemedi"); }
      };
      startNFC();
    }
  }, [view, isWaitingNFC, tempAudio, tempName, cards]);

  // --- 3. SES KAYIT SİSTEMİ ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const media = new MediaRecorder(stream);
      mediaRecorderRef.current = media;
      audioChunksRef.current = [];
      media.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      media.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setTempAudio(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };
      media.start();
      setIsRecording(true);
    } catch (err) { toast.error("Kayıt başlatılamadı!"); }
  };

  const resetSetup = () => {
    setTempAudio(null);
    setTempName("");
    setIsWaitingNFC(false);
    setIsRecording(false);
  };

  // --- A. İZİN EKRANI (İLK AÇILIŞ) ---
  if (view === 'permissions') {
    return (
      <div className="min-h-screen bg-[#020617] text-white p-8 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 bg-blue-600/20 rounded-full flex items-center justify-center mb-6 border-2 border-blue-500/30">
          <ShieldCheck size={48} className="text-blue-500" />
        </div>
        <h1 className="text-3xl font-black mb-4">Sistem Kontrolü</h1>
        <p className="text-slate-400 mb-10 max-w-xs leading-relaxed">
          Tolkido modunun çalışabilmesi için <span className="text-white">Mikrofon</span> ve <span className="text-white">NFC</span> erişimine ihtiyaç duyuyoruz.
        </p>
        <button 
          onClick={requestAllPermissions}
          className="w-full max-w-sm h-16 bg-blue-600 rounded-2xl font-black text-lg shadow-xl shadow-blue-900/20 active:scale-95 transition-all"
        >
          İZİNLERİ ONAYLA VE BAŞLA
        </button>
        <button onClick={onBack} className="mt-6 text-slate-500 font-bold uppercase text-xs">Vazgeç</button>
      </div>
    );
  }

  // --- B. KURULUM EKRANI (ÖĞRETMEN) ---
  if (view === 'setup') {
    return (
      <div className="min-h-screen bg-[#020617] text-white p-6 flex flex-col">
        <header className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={onBack} className="text-slate-500"><ArrowLeft /></Button>
          <h1 className="text-2xl font-black tracking-tighter uppercase">TOLKİDO PANEL</h1>
        </header>

        <div className="bg-slate-900/60 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl relative">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">YENİ KART TANIMLA</h2>
          <input 
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            placeholder="Kart İsmi (Örn: Elma)" 
            className="w-full bg-slate-950 border border-slate-800 h-14 rounded-2xl px-6 text-white mb-5 outline-none"
          />

          {!tempAudio ? (
            <button 
              onClick={isRecording ? () => mediaRecorderRef.current?.stop() : startRecording}
              className={twMerge("w-full h-16 rounded-2xl flex items-center justify-center gap-3 font-bold text-lg", isRecording ? "bg-red-500 animate-pulse" : "bg-blue-600")}
            >
              {isRecording ? <><Square size={20} /> DURDUR</> : <><Mic size={20} /> SES KAYDI BAŞLAT</>}
            </button>
          ) : (
            <div className="space-y-3">
              <button onClick={() => new Audio(tempAudio).play()} className="w-full h-14 bg-slate-800 rounded-2xl flex items-center justify-center gap-2 font-bold text-green-400">
                <PlayCircle size={20} /> SESİ KONTROL ET
              </button>
              <button onClick={() => setIsWaitingNFC(true)} className="w-full h-20 bg-green-600 rounded-2xl flex items-center justify-center gap-3 font-black text-xl shadow-lg shadow-green-900/20">
                <Save size={24} /> KARTA YÜKLE
              </button>
              <button onClick={resetSetup} className="w-full text-slate-500 text-xs font-bold py-2">İPTAL VE SİL</button>
            </div>
          )}
        </div>

        <div className="mt-auto grid grid-cols-2 gap-4">
          <button onClick={() => setView('list')} className="h-28 bg-slate-900 border border-slate-800 rounded-[2rem] flex flex-col items-center justify-center gap-3 active:scale-95">
            <Layers className="text-blue-400" size={24} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Yüklü Kartlar</span>
          </button>
          <button onClick={() => setView('active')} disabled={cards.length === 0} className="h-28 bg-blue-600 rounded-[2rem] flex flex-col items-center justify-center gap-3 active:scale-95 disabled:opacity-20">
            <BookOpen className="text-white" size={24} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white">Eğitimi Başlat</span>
          </button>
        </div>

        {isWaitingNFC && (
          <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-[200] flex items-center justify-center p-8 text-center">
            <div className="animate-in zoom-in duration-300">
              <div className="w-32 h-32 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-blue-500/50 animate-pulse">
                <Scan size={60} className="text-blue-400" />
              </div>
              <h2 className="text-xl font-black text-white mb-2 uppercase">Kart Okutun</h2>
              <p className="text-slate-400 text-sm mb-10">"{tempName}" sesini yüklemek için kartı yaklaştırın.</p>
              <button onClick={() => setIsWaitingNFC(false)} className="text-slate-500 font-bold uppercase text-sm border-b border-slate-800 pb-1">Vazgeç</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- C. LİSTE EKRANI ---
  if (view === 'list') {
    return (
      <div className="min-h-screen bg-[#020617] text-white p-6 flex flex-col">
        <header className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => setView('setup')}><ArrowLeft /></Button>
          <h1 className="text-xl font-bold uppercase">Kayıtlı Kartlar</h1>
        </header>
        <div className="flex-1 space-y-3 overflow-y-auto">
          {cards.map((card, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => new Audio(card.audio).play()} className="text-green-400"><PlayCircle size={28} /></button>
                <span className="font-black text-lg">{card.text}</span>
              </div>
              <button onClick={() => setCards(cards.filter((_, idx) => idx !== i))} className="text-red-500"><Trash2 size={20} /></button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- D. EĞİTİM MODU ---
  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-8 text-center" onClick={() => cards.length > 0 && new Audio(cards[Math.floor(Math.random()*cards.length)].audio).play()}>
      <button onDoubleClick={() => setView('setup')} className="absolute top-8 left-8 text-slate-900/40"><Lock size={32} /></button>
      <div className="w-full max-w-sm aspect-square bg-slate-900/10 border-2 border-slate-800/50 rounded-[4rem] flex flex-col items-center justify-center">
        {lastReadCard ? (
          <div className="animate-in zoom-in">
            <Volume2 size={100} className="text-blue-500 mx-auto mb-6 animate-pulse" />
            <h2 className="text-5xl font-black text-white uppercase">{lastReadCard.text}</h2>
          </div>
        ) : (
          <div className="opacity-5 flex flex-col items-center gap-6 text-white">
            <Radio size={80} className="animate-pulse" />
            <p className="text-xl font-black tracking-widest uppercase">Bekleniyor</p>
          </div>
        )}
      </div>
    </div>
  );
}
  
