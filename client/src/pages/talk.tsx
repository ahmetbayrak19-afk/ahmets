import React, { useState, useEffect, useRef } from 'react';
import { Mic, Save, ArrowLeft, Volume2, Trash2, Lock, Square, PlayCircle, Radio, Scan, Layers, BookOpen, ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { twMerge } from 'tailwind-merge';
import { toast } from 'sonner';

// --- TİP TANIMLAMALARI ---
interface Card {
  nfcId: string;
  text: string;
  audio: string;
}

// Java'dan gelen fonksiyonu TypeScript'e tanıtıyoruz
declare global {
  interface Window {
    handleNfcScan: (nfcId: string) => void;
  }
}

export default function Talk({ onBack }: { onBack: () => void }) {
  const [view, setView] = useState<'permissions' | 'setup' | 'list' | 'active'>('permissions');
  const [cards, setCards] = useState<Card[]>([]);
  const [lastReadCard, setLastReadCard] = useState<Card | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  // Kayıt ve İşlem State'leri
  const [isRecording, setIsRecording] = useState(false);
  const [tempAudio, setTempAudio] = useState<string | null>(null);
  const [tempName, setTempName] = useState("");
  const [isWaitingNFC, setIsWaitingNFC] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // --- 1. SİSTEMİ AKTİF ET (SADECE MİKROFON) ---
  const handleActivateSystem = async () => {
    setIsChecking(true);
    
    try {
      // 1. MİKROFON İZNİ
      // Java tarafında zaten izin verdik ama JS tarafında da stream'i tetiklemek iyidir.
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("WebView mikrofon API hatası.");
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      toast.success("Mikrofon Bağlantısı Başarılı");

      // NFC İÇİN BİR ŞEY YAPMAYA GEREK YOK
      // Çünkü Java tarafı (MainActivity) onu hallediyor.

      setTimeout(() => {
        setView('setup');
        setIsChecking(false);
      }, 500);

    } catch (err: any) {
      setIsChecking(false);
      console.error("İzin Hatası:", err);
      toast.error("Mikrofon başlatılamadı.");
      alert("Hata: " + err.message);
    }
  };

  // --- 2. NFC DİNLEME KÖPRÜSÜ (JAVA -> REACT) ---
  useEffect(() => {
    // Java tarafı kart okuduğunda bu fonksiyonu çağıracak
    window.handleNfcScan = (serialNumber: string) => {
      console.log("NFC OKUNDU (React):", serialNumber);

      // 1. Durum: Yeni Kart Kaydediyoruz
      if (isWaitingNFC && tempAudio) {
        const newCard = { nfcId: serialNumber, text: tempName || "İsimsiz Kart", audio: tempAudio };
        
        // Kartın daha önce eklenip eklenmediğine bak (Opsiyonel)
        setCards(prevCards => {
          const exists = prevCards.find(c => c.nfcId === serialNumber);
          if (exists) {
            toast.error("Bu kart zaten kayıtlı!");
            return prevCards;
          }
          return [...prevCards, newCard];
        });

        // İşlemi tamamla
        toast.success(`KART EŞLEŞTİ! ID: ${serialNumber}`);
        resetSetup();
        
        // Titreşim (Varsa)
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      } 
      
      // 2. Durum: Eğitim Modundayız (Kart Okutup Ses Çalma)
      else if (view === 'active') {
        // State içindeki kartları anlık okumak için setCards callback'ini kullanıyoruz
        // ya da cards dependency'e ekli olduğu için direkt 'cards' kullanabiliriz.
        const matched = cards.find(c => c.nfcId === serialNumber);
        
        if (matched) {
          setLastReadCard(matched);
          const audio = new Audio(matched.audio);
          audio.play().catch(e => console.error("Ses çalma hatası:", e));
          
          if (navigator.vibrate) navigator.vibrate(100);
          toast.success("Kart Okundu: " + matched.text);
        } else {
          toast.warning("Bu kart tanımlı değil.");
        }
      }
    };

    // Temizlik: Component unmount olduğunda
    return () => {
      // @ts-ignore
      window.handleNfcScan = null;
    };
  }, [isWaitingNFC, tempAudio, tempName, view, cards]); // Bu değişkenler değiştiğinde fonksiyon yenilenmeli

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const media = new MediaRecorder(stream);
      mediaRecorderRef.current = media;
      audioChunksRef.current = [];
      
      media.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      media.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(blob);
        setTempAudio(audioUrl);
        stream.getTracks().forEach(t => t.stop());
      };
      
      media.start();
      setIsRecording(true);
    } catch (err) { 
      toast.error("Kayıt başlatılamadı."); 
    }
  };

  const resetSetup = () => {
    setTempAudio(null);
    setTempName("");
    setIsWaitingNFC(false);
    setIsRecording(false);
  };

  // --- EKRANLAR ---

  // 1. İZİN EKRANI
  if (view === 'permissions') {
    return (
      <div className="min-h-screen bg-[#020617] text-white p-8 flex flex-col items-center justify-center text-center font-sans">
        <div className="w-24 h-24 bg-blue-600/10 rounded-full flex items-center justify-center mb-8 border border-blue-500/20 shadow-2xl">
          <ShieldCheck size={48} className="text-blue-500" />
        </div>
        <h1 className="text-3xl font-black mb-4 tracking-tighter">Sistemi Başlat</h1>
        <p className="text-slate-400 text-sm mb-12 max-w-[280px] leading-relaxed">
          Tolkido'yu kullanmak için mikrofon erişimini onaylayın. NFC otomatik olarak aktiftir.
        </p>
        
        <button 
          onClick={handleActivateSystem}
          disabled={isChecking}
          className="w-full max-w-sm h-18 py-5 bg-blue-600 rounded-[2rem] font-black text-xl shadow-xl shadow-blue-900/30 active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          {isChecking ? <><Loader2 className="animate-spin" /> BAŞLATILIYOR...</> : "BAŞLAT"}
        </button>

        <button onClick={onBack} className="mt-8 text-slate-700 font-bold uppercase text-xs tracking-widest">Geri Dön</button>
      </div>
    );
  }

  // 2. KURULUM (KAYIT) EKRANI
  if (view === 'setup') {
    return (
      <div className="min-h-screen bg-[#020617] text-white p-6 flex flex-col font-sans">
        <header className="flex items-center justify-between mb-8">
          <Button variant="ghost" size="icon" onClick={onBack} className="text-slate-600"><ArrowLeft /></Button>
          <div className="px-4 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center gap-2">
             <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
             <span className="text-[10px] font-black text-blue-500 uppercase">Hazır</span>
          </div>
        </header>

        <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-8 mb-8 shadow-2xl relative">
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 text-center italic">YENİ KART EKLE</h2>
          
          <div className="space-y-4">
            <input 
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              placeholder="Kart Adı (Örn: Elma)" 
              className="w-full bg-slate-950 border border-slate-800 h-14 rounded-2xl px-6 text-white text-lg font-bold outline-none focus:border-blue-500"
            />

            {!tempAudio ? (
              <button 
                onClick={isRecording ? () => mediaRecorderRef.current?.stop() : startRecording}
                className={twMerge("w-full h-18 rounded-[1.8rem] flex items-center justify-center gap-3 font-black text-lg transition-all", isRecording ? "bg-red-500 animate-pulse shadow-red-900/20" : "bg-blue-600 shadow-blue-900/20")}
              >
                {isRecording ? <><Square size={20} /> DURDUR</> : <><Mic size={20} /> SES KAYDI BAŞLAT</>}
              </button>
            ) : (
              <div className="space-y-4 animate-in slide-in-from-top-4">
                <button onClick={() => new Audio(tempAudio).play()} className="w-full h-14 bg-slate-800 rounded-2xl flex items-center justify-center gap-3 font-bold text-green-400 border border-slate-700 shadow-lg">
                  <PlayCircle size={24} /> SESİ KONTROL ET
                </button>
                <button 
                  onClick={() => setIsWaitingNFC(true)}
                  className={twMerge("w-full h-24 rounded-[2.2rem] flex flex-col items-center justify-center gap-1 font-black shadow-2xl transition-all", isWaitingNFC ? "bg-orange-500 animate-bounce" : "bg-green-600 shadow-green-900/20")}
                >
                  <Save size={28} />
                  <span className="text-sm uppercase">{isWaitingNFC ? "KARTI OKUTUN..." : "KARTA KAYDET"}</span>
                </button>
                <button onClick={resetSetup} className="w-full text-slate-600 font-bold py-2 uppercase text-[10px] tracking-widest">Sil ve Yeniden Başla</button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-auto grid grid-cols-2 gap-4">
          <button onClick={() => setView('list')} className="h-28 bg-slate-900 border border-slate-800 rounded-[2.2rem] flex flex-col items-center justify-center gap-2 active:scale-95">
            <Layers className="text-slate-500" size={28} />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">KARTLARIM</span>
          </button>
          <button onClick={() => setView('active')} disabled={cards.length === 0} className="h-28 bg-blue-600 rounded-[2.2rem] flex flex-col items-center justify-center gap-2 active:scale-95 disabled:opacity-10 shadow-lg shadow-blue-900/20">
            <BookOpen className="text-white" size={28} />
            <span className="text-[10px] font-black uppercase tracking-widest text-white">EĞİTİM MODU</span>
          </button>
        </div>

        {/* NFC BEKLEME MODAL'I */}
        {isWaitingNFC && (
          <div className="fixed inset-0 bg-slate-950/98 backdrop-blur-2xl z-[200] flex items-center justify-center p-12 text-center">
             <div className="animate-in zoom-in-95 duration-300">
                <div className="w-36 h-36 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-10 border border-blue-500/30 animate-pulse">
                   <Scan size={70} className="text-blue-500" />
                </div>
                <h2 className="text-4xl font-black text-white mb-4 uppercase tracking-tighter">Kart Bekleniyor</h2>
                <p className="text-slate-500 mb-12 text-lg">"{tempName}" sesini kaydetmek için kartı telefonun arkasına dokundurun.</p>
                <button onClick={() => setIsWaitingNFC(false)} className="px-12 py-4 bg-slate-900 rounded-full text-slate-400 font-bold uppercase text-xs border border-slate-800">İptal Et</button>
             </div>
          </div>
        )}
      </div>
    );
  }

  // 3. KART LİSTESİ
  if (view === 'list') {
    return (
      <div className="min-h-screen bg-[#020617] text-white p-6 flex flex-col font-sans">
        <header className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => setView('setup')}><ArrowLeft /></Button>
          <h1 className="text-2xl font-black uppercase">Kayıtlı Kartlar ({cards.length})</h1>
        </header>
        <div className="flex-1 space-y-4 overflow-y-auto pr-2">
          {cards.map((card, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] flex items-center justify-between shadow-xl">
              <div className="flex items-center gap-4">
                <button onClick={() => new Audio(card.audio).play()} className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center text-green-500"><PlayCircle size={32} /></button>
                <div className="flex flex-col">
                   <span className="font-black text-xl tracking-tight">{card.text}</span>
                   <span className="text-xs text-slate-600 font-mono">{card.nfcId}</span>
                </div>
              </div>
              <button onClick={() => setCards(cards.filter((_, idx) => idx !== i))} className="text-red-900 bg-red-900/10 p-3 rounded-2xl"><Trash2 size={20} /></button>
            </div>
          ))}
          {cards.length === 0 && <p className="text-center text-slate-600 mt-20 font-bold uppercase tracking-widest opacity-30">Henüz kart eklenmedi</p>}
        </div>
      </div>
    );
  }

  // 4. EĞİTİM (OYUN) MODU
  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-10 text-center font-sans">
      <button onDoubleClick={() => setView('setup')} className="absolute top-10 left-10 text-slate-900/50">
        <Lock size={32} />
      </button>
      
      <div className="w-full max-w-sm aspect-square bg-slate-950 border border-slate-900 rounded-[5rem] flex flex-col items-center justify-center shadow-[inset_0_2px_20px_rgba(0,0,0,0.5)] relative">
        {lastReadCard ? (
          <div className="animate-in zoom-in duration-300">
            <Volume2 size={120} className="text-blue-500 mx-auto mb-10 animate-pulse" />
            <h2 className="text-6xl font-black text-white uppercase tracking-tighter leading-none">{lastReadCard.text}</h2>
          </div>
        ) : (
          <div className="opacity-5 flex flex-col items-center gap-10">
            <Radio size={120} className="animate-pulse text-white" />
            <p className="text-3xl font-black tracking-[0.6em] text-white">BEKLENİYOR</p>
          </div>
        )}
      </div>
      <p className="text-slate-600 mt-12 font-bold uppercase tracking-widest text-xs">Kartı Okutun</p>
    </div>
  );
    }
