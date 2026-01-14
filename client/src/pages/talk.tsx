import React, { useState, useEffect, useRef } from 'react';
import { Mic, Save, ArrowLeft, Volume2, Trash2, Lock, Square, PlayCircle, Radio, Scan, Layers, BookOpen, ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { twMerge } from 'tailwind-merge';
import { toast } from 'sonner';

// --- FIREBASE IMPORTLARI ---
import { db, storage } from '../firebase'; // storage'ın export edildiğinden emin ol!
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

// --- TİP TANIMLAMALARI ---
interface Card {
  id?: string; // Firebase ID
  nfcId: string;
  text: string;
  audio: string; // Artık Firebase Storage URL'i olacak
}

declare global {
  interface Window {
    handleNfcScan: (nfcId: string) => void;
  }
}

interface TalkProps {
  onBack: () => void;
  studentId: string; // Öğrenci ID'si artık zorunlu
}

export default function Talk({ onBack, studentId }: TalkProps) {
  const [view, setView] = useState<'permissions' | 'setup' | 'list' | 'active'>('permissions');
  
  // Veriler
  const [cards, setCards] = useState<Card[]>([]);
  const [lastReadCard, setLastReadCard] = useState<Card | null>(null);
  
  // Yükleme Durumları
  const [isChecking, setIsChecking] = useState(false);
  const [isLoadingCards, setIsLoadingCards] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  // Kayıt State'leri
  const [isRecording, setIsRecording] = useState(false);
  const [tempAudioUrl, setTempAudioUrl] = useState<string | null>(null); // Oynatmak için (blob:...)
  const [tempAudioBlob, setTempAudioBlob] = useState<Blob | null>(null); // Yüklemek için (Raw Data)
  const [tempName, setTempName] = useState("");
  const [isWaitingNFC, setIsWaitingNFC] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // --- 1. FIREBASE VERİ ÇEKME (REALTIME) ---
  useEffect(() => {
    if (!studentId) return;
    
    const instId = localStorage.getItem("kazanim-takip-institution-id");
    if (!instId) {
      toast.error("Kurum oturumu bulunamadı.");
      return;
    }

    // Koleksiyon yolu: institutions/{instId}/students/{studentId}/talk_cards
    const cardsRef = collection(db, "institutions", instId, "students", studentId, "talk_cards");
    const q = query(cardsRef, orderBy("createdAt", "desc"));

    // Anlık dinleme (Başka öğretmen eklerse hemen düşer)
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedCards = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Card[];
      setCards(fetchedCards);
      setIsLoadingCards(false);
    }, (err) => {
      console.error("Veri çekme hatası:", err);
      toast.error("Kartlar yüklenemedi.");
      setIsLoadingCards(false);
    });

    return () => unsubscribe();
  }, [studentId]);

  // --- 2. SİSTEMİ AKTİF ET ---
  const handleActivateSystem = async () => {
    setIsChecking(true);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("WebView mikrofon API hatası.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      
      toast.success("Sistem Hazır");
      setTimeout(() => {
        setView('setup');
        setIsChecking(false);
      }, 500);
    } catch (err: any) {
      setIsChecking(false);
      toast.error("Mikrofon izni alınamadı.");
    }
  };

  // --- 3. NFC DİNLEME VE KAYDETME ---
  useEffect(() => {
    window.handleNfcScan = async (serialNumber: string) => {
      console.log("NFC OKUNDU:", serialNumber);

      // --- DURUM A: YENİ KART KAYDETME ---
      if (isWaitingNFC && tempAudioBlob) {
        // Zaten kayıtlı mı kontrolü
        const exists = cards.find(c => c.nfcId === serialNumber);
        if (exists) {
          toast.error("Bu kart zaten kayıtlı! Lütfen başka kart kullanın.");
          if (navigator.vibrate) navigator.vibrate(500);
          return;
        }

        await saveCardToFirebase(serialNumber);
      } 
      
      // --- DURUM B: EĞİTİM MODU ---
      else if (view === 'active') {
        const matched = cards.find(c => c.nfcId === serialNumber);
        if (matched) {
          setLastReadCard(matched);
          const audio = new Audio(matched.audio);
          audio.play().catch(e => console.error("Ses hatası:", e));
          if (navigator.vibrate) navigator.vibrate(100);
          toast.success(matched.text);
        } else {
          toast.warning("Tanımsız Kart");
        }
      }
    };

    return () => {
      // @ts-ignore
      window.handleNfcScan = null;
    };
  }, [isWaitingNFC, tempAudioBlob, tempName, view, cards]);

  // --- SES KAYIT ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const media = new MediaRecorder(stream);
      mediaRecorderRef.current = media;
      audioChunksRef.current = [];
      
      media.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      media.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(blob);
        setTempAudioUrl(audioUrl); // Dinlemek için
        setTempAudioBlob(blob);    // Yüklemek için
        stream.getTracks().forEach(t => t.stop());
      };
      
      media.start();
      setIsRecording(true);
    } catch (err) { toast.error("Kayıt başlatılamadı."); }
  };

  // --- FIREBASE'E KAYDETME (CORE) ---
  const saveCardToFirebase = async (nfcId: string) => {
    if (!tempAudioBlob || !studentId) return;
    
    setIsUploading(true);
    const toastId = toast.loading("Ses yükleniyor...");

    try {
      const instId = localStorage.getItem("kazanim-takip-institution-id");
      
      // 1. Sesi Storage'a Yükle
      // Dosya yolu: talk_audio/{instId}/{studentId}/{timestamp}.webm
      const filename = `talk_audio/${instId}/${studentId}/${Date.now()}.webm`;
      const storageRef = ref(storage, filename);
      
      await uploadBytes(storageRef, tempAudioBlob);
      const downloadURL = await getDownloadURL(storageRef);

      // 2. Veriyi Firestore'a Yaz
      await addDoc(collection(db, "institutions", instId!, "students", studentId, "talk_cards"), {
        nfcId: nfcId,
        text: tempName || "İsimsiz Kart",
        audio: downloadURL,
        storagePath: filename, // Silmek için yolu tutuyoruz
        createdAt: serverTimestamp()
      });

      toast.dismiss(toastId);
      toast.success("Kart ve Ses Başarıyla Kaydedildi!");
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      
      resetSetup();
      setIsUploading(false);

    } catch (error: any) {
      console.error(error);
      toast.dismiss(toastId);
      toast.error("Kayıt Hatası: " + error.message);
      setIsUploading(false);
    }
  };

  // --- KART SİLME ---
  const handleDeleteCard = async (card: Card) => {
    if (!confirm(`"${card.text}" kartını silmek istiyor musunuz?`)) return;

    try {
      const instId = localStorage.getItem("kazanim-takip-institution-id");
      
      // 1. Firestore'dan Sil
      await deleteDoc(doc(db, "institutions", instId!, "students", studentId, "talk_cards", card.id!));
      
      // 2. Storage'dan Sesi Sil (Varsa)
      // card objesinde storagePath tutmadıysak URL'den çıkarım yapılabilir ama şimdilik opsiyonel
      try {
        if ((card as any).storagePath) {
            const fileRef = ref(storage, (card as any).storagePath);
            await deleteObject(fileRef);
        }
      } catch (e) { console.log("Ses dosyası silinemedi veya zaten yok", e); }

      toast.success("Kart silindi.");
    } catch (e) {
      toast.error("Silme işlemi başarısız.");
    }
  };

  const resetSetup = () => {
    setTempAudioUrl(null);
    setTempAudioBlob(null);
    setTempName("");
    setIsWaitingNFC(false);
    setIsRecording(false);
  };

  // --- EKRAN 1: İZİN ---
  if (view === 'permissions') {
    return (
      <div className="min-h-screen bg-[#020617] text-white p-8 flex flex-col items-center justify-center text-center font-sans">
        <div className="w-24 h-24 bg-blue-600/10 rounded-full flex items-center justify-center mb-8 border border-blue-500/20 shadow-2xl">
          <ShieldCheck size={48} className="text-blue-500" />
        </div>
        <h1 className="text-3xl font-black mb-4 tracking-tighter">Sistemi Başlat</h1>
        <p className="text-slate-400 text-sm mb-12 max-w-[280px] leading-relaxed">
          Kartları yüklemek için internet bağlantısı gereklidir.
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

  // --- EKRAN 2: KURULUM ---
  if (view === 'setup') {
    return (
      <div className="min-h-screen bg-[#020617] text-white p-6 flex flex-col font-sans">
        <header className="flex items-center justify-between mb-8">
          <Button variant="ghost" size="icon" onClick={onBack} className="text-slate-600"><ArrowLeft /></Button>
          <div className="px-4 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center gap-2">
             <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
             <span className="text-[10px] font-black text-blue-500 uppercase">Online</span>
          </div>
        </header>

        {/* ANA KUTU */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-8 mb-4 shadow-2xl relative">
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 text-center italic">YENİ KART EKLE</h2>
          
          <div className="space-y-4">
            <input 
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              placeholder="Kart Adı (Örn: Elma)" 
              disabled={isUploading}
              className="w-full bg-slate-950 border border-slate-800 h-14 rounded-2xl px-6 text-white text-lg font-bold outline-none focus:border-blue-500 disabled:opacity-50"
            />

            {!tempAudioUrl ? (
              <button 
                onClick={isRecording ? () => mediaRecorderRef.current?.stop() : startRecording}
                disabled={isUploading}
                className={twMerge("w-full h-18 rounded-[1.8rem] flex items-center justify-center gap-3 font-black text-lg transition-all", isRecording ? "bg-red-500 animate-pulse shadow-red-900/20" : "bg-blue-600 shadow-blue-900/20")}
              >
                {isRecording ? <><Square size={20} /> DURDUR</> : <><Mic size={20} /> SES KAYDI BAŞLAT</>}
              </button>
            ) : (
              <div className="space-y-4 animate-in slide-in-from-top-4">
                <button onClick={() => new Audio(tempAudioUrl).play()} className="w-full h-14 bg-slate-800 rounded-2xl flex items-center justify-center gap-3 font-bold text-green-400 border border-slate-700 shadow-lg">
                  <PlayCircle size={24} /> SESİ KONTROL ET
                </button>
                <button 
                  onClick={() => setIsWaitingNFC(true)}
                  disabled={isUploading}
                  className={twMerge("w-full h-24 rounded-[2.2rem] flex flex-col items-center justify-center gap-1 font-black shadow-2xl transition-all", isWaitingNFC ? "bg-orange-500 animate-bounce" : "bg-green-600 shadow-green-900/20")}
                >
                  {isUploading ? <Loader2 className="animate-spin" size={28}/> : <Save size={28} />}
                  <span className="text-sm uppercase">{isUploading ? "YÜKLENİYOR..." : isWaitingNFC ? "KARTI OKUTUN..." : "KARTA KAYDET"}</span>
                </button>
                {!isUploading && <button onClick={resetSetup} className="w-full text-slate-600 font-bold py-2 uppercase text-[10px] tracking-widest">İptal Et</button>}
              </div>
            )}
          </div>
        </div>

        {/* ALT BUTONLAR (Gap azaltıldı: mt-6) */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <button onClick={() => setView('list')} className="h-28 bg-slate-900 border border-slate-800 rounded-[2.2rem] flex flex-col items-center justify-center gap-2 active:scale-95 relative overflow-hidden">
             {isLoadingCards && <div className="absolute inset-0 bg-slate-950/50 flex items-center justify-center"><Loader2 className="animate-spin text-blue-500"/></div>}
            <Layers className="text-slate-500" size={28} />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">KARTLARIM ({cards.length})</span>
          </button>
          <button onClick={() => setView('active')} disabled={cards.length === 0} className="h-28 bg-blue-600 rounded-[2.2rem] flex flex-col items-center justify-center gap-2 active:scale-95 disabled:opacity-10 shadow-lg shadow-blue-900/20">
            <BookOpen className="text-white" size={28} />
            <span className="text-[10px] font-black uppercase tracking-widest text-white">EĞİTİM MODU</span>
          </button>
        </div>

        {/* NFC MODAL */}
        {isWaitingNFC && !isUploading && (
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

  // --- EKRAN 3: LİSTE ---
  if (view === 'list') {
    return (
      <div className="min-h-screen bg-[#020617] text-white p-6 flex flex-col font-sans">
        <header className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => setView('setup')}><ArrowLeft /></Button>
          <h1 className="text-2xl font-black uppercase">Kayıtlı Kartlar ({cards.length})</h1>
        </header>
        <div className="flex-1 space-y-4 overflow-y-auto pr-2 pb-10">
          {cards.map((card, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] flex items-center justify-between shadow-xl">
              <div className="flex items-center gap-4">
                <button onClick={() => new Audio(card.audio).play()} className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 hover:bg-green-500/20 transition-colors"><PlayCircle size={32} /></button>
                <div className="flex flex-col">
                   <span className="font-black text-xl tracking-tight">{card.text}</span>
                   <span className="text-xs text-slate-600 font-mono">{card.nfcId}</span>
                </div>
              </div>
              <button onClick={() => handleDeleteCard(card)} className="text-red-900 bg-red-900/10 p-3 rounded-2xl hover:bg-red-900/20 transition-colors"><Trash2 size={20} /></button>
            </div>
          ))}
          {cards.length === 0 && <p className="text-center text-slate-600 mt-20 font-bold uppercase tracking-widest opacity-30">Henüz kart eklenmedi</p>}
        </div>
      </div>
    );
  }

  // --- EKRAN 4: AKTİF MOD ---
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
