import { useState } from 'react';
import { XCircle, Check, X, Trophy, Ear, PlayCircle, SkipForward } from 'lucide-react';
import confetti from 'canvas-confetti';

type Posture = 'STAND' | 'SIT' | 'LIE';

interface InstructionDef {
  text: string;
  effect?: Posture;
  req?: Posture[];
}

const INSTRUCTION_POOL: InstructionDef[] = [
  { text: "Ayağa kalk", effect: 'STAND' }, 
  { text: "Zıpla", req: ['STAND'] },
  { text: "Etrafında dön", req: ['STAND'] },
  { text: "Yere yat", effect: 'LIE' },
  { text: "Otur / Yere otur", effect: 'SIT' },
  { text: "Ayaklarını yere vur", req: ['STAND', 'SIT'] }, 
  { text: "Kollarını kaldır" }, 
  { text: "Bay bay yap" },
  { text: "Ellerini çırp / Alkışla" },
  { text: "Kollarını bağla" },
  { text: "Gözlerini kapat" },
  { text: "Ağzını aç" },
  { text: "Karnını ovala" },
  { text: "Burnuna dokun" },
  { text: "Kafanı salla" }
];

const generateSmartSequence = (): string[] => {
  const sequence: string[] = [];
  let currentPosture: Posture = 'STAND'; 
  
  const available = [...INSTRUCTION_POOL];
  
  const firstIndex = available.findIndex(i => i.text === "Ayağa kalk");
  sequence.push(available[firstIndex].text);
  available.splice(firstIndex, 1);
  
  while (sequence.length < 10) {
    const candidates = available.filter(item => {
      if (item.req && !item.req.includes(currentPosture)) return false;
      if (item.effect === currentPosture) return false; 
      return true;
    });
    
    const poolToPickFrom = candidates.length > 0 ? candidates : available;
    const randomIndex = Math.floor(Math.random() * poolToPickFrom.length);
    const selected = poolToPickFrom[randomIndex];
    
    sequence.push(selected.text);
    
    if (selected.effect) currentPosture = selected.effect;
    
    const indexInAvailable = available.findIndex(i => i.text === selected.text);
    available.splice(indexInAvailable, 1);
  }
  
  return sequence;
};

interface Yonerge1Props {
  itemCode?: string;
  itemText?: string;
  onClose: () => void;
  onComplete: (success: boolean) => void;
}

export default function Yonerge1({ 
  itemCode = "AD.1.1", 
  itemText = "Tek basamaklı yönergeleri takip eder.", 
  onClose, 
  onComplete 
}: Yonerge1Props) {
  
  const [instructions] = useState<string[]>(generateSmartSequence);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [validCount, setValidCount] = useState(0);
  const [phase, setPhase] = useState<'intro' | 'playing' | 'result'>('intro');

  const currentInstruction = instructions[currentIndex];

  // === DÜZELTİLMİŞ handleAssess ===
  const handleAssess = (correct: boolean) => {
    setScore(prev => {
      const newScore = correct ? prev + 1 : prev;
      
      setValidCount(prevValid => {
        const newValid = prevValid + 1;
        
        if (newValid >= 10) {
          setPhase('result');
          if (newScore >= 8) {
            confetti({ particleCount: 250, spread: 90, origin: { y: 0.6 } });
          }
        } else {
          setCurrentIndex(prevIndex => prevIndex + 1);
        }
        
        return newValid;
      });
      
      return newScore;
    });
  };

  // === DÜZELTİLMİŞ GEÇ BUTONU ===
  const handlePass = () => {
    if (validCount < 10) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setPhase('result');
    }
  };

  const completeSession = () => {
    const isSuccess = score >= 8;
    onComplete(isSuccess);
  };

  return (
    <div className="fixed inset-0 h-[100dvh] w-screen z-[100] flex flex-col bg-slate-950 text-white font-sans select-none">
      
      {/* ÜST BAR */}
      <div className="shrink-0 p-4 landscape:py-2 landscape:px-4 flex items-center justify-between border-b border-slate-800 bg-slate-900/80 backdrop-blur-md relative z-10">
        <button onClick={onClose} className="p-2 landscape:p-1.5 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
          <XCircle className="w-7 h-7 landscape:w-6 landscape:h-6" />
        </button>
        <div className="text-center flex flex-col items-center">
          <h2 className="text-lg landscape:text-sm font-bold truncate max-w-[250px] sm:max-w-md text-slate-100">
            {itemCode} - {itemText}
          </h2>
          <p className="text-xs landscape:text-[10px] text-slate-400 font-medium tracking-widest uppercase mt-1 landscape:mt-0">
            {phase === 'playing' ? `ADIM ${currentIndex + 1} / 10` : 'ÖĞRETMEN DEĞERLENDİRMESİ'}
          </p>
        </div>
        <div className="w-10 landscape:w-8"></div> 
      </div>

      {/* ORTA İÇERİK ALANI */}
      <div className="flex-1 relative flex flex-col items-center justify-center p-4 overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 to-slate-950">
        
        {phase === 'intro' && (
          <div className="text-center max-w-md animate-in zoom-in-95 duration-300">
            <Ear size={80} className="mx-auto text-blue-500 mb-6 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
            <h1 className="text-3xl font-black mb-4 text-white">Hazır mısınız?</h1>
            <p className="text-slate-400 mb-8 text-base md:text-lg leading-relaxed">
              Ekranda sırayla fiziksel duruma uygun yönergeler belirecek. Komutu öğrenciye söyleyin ve tepkisini değerlendirin.
            </p>
            <button 
              onClick={() => setPhase('playing')} 
              className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 w-full shadow-xl shadow-blue-900/50 active:scale-95 transition-all"
            >
              <PlayCircle size={24} /> TESTE BAŞLA
            </button>
          </div>
        )}

        {phase === 'playing' && (
          <div className="w-full max-w-3xl flex flex-col items-center justify-center animate-in slide-in-from-right-8 duration-300" key={currentIndex}>
            <div className="w-full bg-slate-800/60 border-2 border-slate-700 rounded-[2.5rem] p-10 md:p-16 flex flex-col items-center justify-center shadow-2xl backdrop-blur-sm min-h-[250px] md:min-h-[350px] relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl"></div>
                <span className="text-blue-400 font-bold tracking-widest uppercase mb-4 md:mb-6 text-sm md:text-base flex items-center gap-2">
                  <Ear size={18} /> Öğrenciye Söyleyin:
                </span>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-center text-white leading-tight tracking-tight">
                  "{currentInstruction}"
                </h1>
            </div>
          </div>
        )}

        {phase === 'result' && (
          <div className="flex flex-col items-center justify-center text-center p-8 bg-slate-900/90 rounded-3xl border border-slate-700 shadow-2xl m-auto max-w-xl animate-in zoom-in-95 duration-500 backdrop-blur-md">
            <Trophy size={80} className={score >= 8 ? "text-yellow-500 mb-6 animate-bounce drop-shadow-[0_0_20px_rgba(234,179,8,0.4)]" : "text-slate-500 mb-6"} />
            <h1 className="text-3xl font-black mb-2 text-white">Değerlendirme Bitti!</h1>
            <p className="text-slate-400 mb-6 text-lg">
              Doğru Tepki: <span className="text-white font-black text-3xl mx-2">{score}</span> / {validCount}
            </p>
            
            {score >= 8 ? (
              <div className="bg-green-500/10 text-green-400 border border-green-500/20 px-6 py-3 rounded-xl mb-8 font-bold text-lg flex items-center gap-2">
                <Check size={24} /> Kazanım başarıyla sağlandı!
              </div>
            ) : (
              <div className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-6 py-3 rounded-xl mb-8 font-bold text-lg flex items-center gap-2">
                <X size={24} /> Henüz yeterli bağımsızlık düzeyinde değil.
              </div>
            )}

            <button onClick={() => onComplete(score >= 8)} className="bg-blue-600 hover:bg-blue-500 text-white px-12 py-4 rounded-xl font-bold text-xl transition-all active:scale-95 shadow-xl shadow-blue-900/50 w-full sm:w-auto">
              KAYDET VE ÇIK
            </button>
          </div>
        )}
      </div>

      {/* ALT BUTONLAR - GEÇ BUTONU EKLENDİ */}
      {phase === 'playing' && (
        <div className="shrink-0 p-6 pb-10 landscape:py-3 landscape:px-6 landscape:pb-4 bg-slate-900 border-t border-slate-800 flex items-stretch justify-center gap-3 sm:gap-4 relative z-10">
          
          <button 
            onClick={handlePass} 
            className="flex-1 max-w-[200px] flex flex-col landscape:flex-row items-center justify-center gap-2 p-4 landscape:p-3 bg-slate-700 border border-slate-600 rounded-2xl active:scale-95 transition-all text-slate-300 hover:bg-slate-600"
          >
            <SkipForward className="w-8 h-8 landscape:w-5 landscape:h-5" />
            <span className="text-sm landscape:text-xs font-bold uppercase tracking-wider">GEÇ</span>
          </button>

          <button 
            onClick={() => handleAssess(false)} 
            className="flex-1 max-w-[250px] flex flex-col landscape:flex-row items-center justify-center gap-2 p-5 landscape:p-3 bg-red-500/10 border border-red-500/30 rounded-2xl active:scale-95 transition-all text-red-500 hover:bg-red-500/20 hover:border-red-500"
          >
            <X className="w-10 h-10 landscape:w-6 landscape:h-6" />
            <span className="text-base landscape:text-sm font-bold uppercase tracking-wider text-center">Yapamadı</span>
          </button>
          
          <button 
            onClick={() => handleAssess(true)} 
            className="flex-1 max-w-[250px] flex flex-col landscape:flex-row items-center justify-center gap-2 p-5 landscape:p-3 bg-green-500/10 border border-green-500/30 rounded-2xl active:scale-95 transition-all text-green-500 hover:bg-green-500/20 hover:border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.1)]"
          >
            <Check className="w-10 h-10 landscape:w-6 landscape:h-6" />
            <span className="text-base landscape:text-sm font-bold uppercase tracking-wider text-center">Yaptı</span>
          </button>
        </div>
      )}
    </div>
  );
}
