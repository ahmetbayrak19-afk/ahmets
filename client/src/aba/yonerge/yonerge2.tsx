import { useMemo, useState } from 'react';
import {
  XCircle,
  Check,
  X,
  Trophy,
  Ear,
  PlayCircle,
  SkipForward,
  RefreshCw,
  PackageCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface Question {
  id: number;
  text: string;
  material: string;
}

interface Yonerge2Props {
  itemCode?: string;
  itemText?: string;
  onClose: () => void;
  onComplete: (success: boolean) => void;
}

const ALL_QUESTIONS: Question[] = [
  { id: 1, text: 'Topu al', material: 'Top' },
  { id: 2, text: 'Kitabı masaya koy', material: 'Kitap' },
  { id: 3, text: 'Kalemi bana ver', material: 'Kalem' },
  { id: 4, text: 'Çantayı aç', material: 'Çanta' },
  { id: 5, text: 'Bebeği yere bırak', material: 'Oyuncak bebek' },
  { id: 6, text: 'Arabayı it', material: 'Oyuncak araba' },
  { id: 7, text: 'Topu bana at', material: 'Top' },
  { id: 8, text: 'Kitabı aç', material: 'Kitap' },
  { id: 9, text: 'Kalemi masaya koy', material: 'Kalem' },
  { id: 10, text: 'Çiçeği göster', material: 'Çiçek' },
  { id: 11, text: 'Elmayı al', material: 'Elma' },
  { id: 12, text: 'Bardağı al', material: 'Bardak' },
  { id: 13, text: 'Kutuyu aç', material: 'Kutu' },
  { id: 14, text: 'Topu masaya koy', material: 'Top' },
  { id: 15, text: 'Kitabı bana ver', material: 'Kitap' },
  { id: 16, text: 'Kalemi yere bırak', material: 'Kalem' },
  { id: 17, text: 'Çantayı kapat', material: 'Çanta' },
  { id: 18, text: 'Bebeği al', material: 'Oyuncak bebek' },
  { id: 19, text: 'Kalemi al', material: 'Kalem' },
  { id: 20, text: 'Kitabı kapat', material: 'Kitap' },
  { id: 21, text: 'Topu bana ver', material: 'Top' },
  { id: 22, text: 'Çantayı masaya koy', material: 'Çanta' },
  { id: 23, text: 'Bebeği göster', material: 'Oyuncak bebek' },
  { id: 24, text: 'Arabayı al', material: 'Oyuncak araba' },
  { id: 25, text: 'Bardağı masaya koy', material: 'Bardak' },
];

const shuffleQuestions = (questions: Question[]) => {
  const shuffled = [...questions];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
};

export default function Yonerge2({
  itemCode = "YTB 1.2",
  itemText = "Bir nesneyle ilgili tek basamaklı yönergeleri takip eder.",
  onClose,
  onComplete
}: Yonerge2Props) {

  const [initialPool] = useState(() => shuffleQuestions(ALL_QUESTIONS));
  const [instructions, setInstructions] = useState<Question[]>(() => initialPool.slice(0, 10));
  const [unusedQuestions, setUnusedQuestions] = useState<Question[]>(() => initialPool.slice(10));

  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [validCount, setValidCount] = useState(0);
  const [phase, setPhase] = useState<'intro' | 'playing' | 'result'>('intro');

  const currentInstruction = instructions[currentIndex]?.text ?? '';
  const materialsList = useMemo(
    () => Array.from(new Set(instructions.map((instruction) => instruction.material))),
    [instructions],
  );

  const replacePreparationInstruction = (instructionIndex: number) => {
    if (unusedQuestions.length === 0) return;
    const [replacement, ...remainingQuestions] = unusedQuestions;
    setInstructions((currentInstructions) => currentInstructions.map(
      (instruction, index) => index === instructionIndex ? replacement : instruction,
    ));
    setUnusedQuestions(remainingQuestions);
  };

  const handleAssess = (correct: boolean) => {
    if (correct) setScore(prev => prev + 1);

    const newValidCount = validCount + 1;
    setValidCount(newValidCount);

    if (newValidCount >= 10) {
      setPhase('result');
      if (score + (correct ? 1 : 0) >= 8) {
        confetti({ particleCount: 250, spread: 90, origin: { y: 0.6 } });
      }
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePass = () => {
    const preparedMaterials = new Set(instructions.map((instruction) => instruction.material));
    const replacementIndex = unusedQuestions.findIndex((question) => preparedMaterials.has(question.material));
    if (replacementIndex < 0) return;

    const replacement = unusedQuestions[replacementIndex];
    setInstructions((currentInstructions) => currentInstructions.map(
      (instruction, index) => index === currentIndex ? replacement : instruction,
    ));
    setUnusedQuestions((currentQuestions) => currentQuestions.filter((_, index) => index !== replacementIndex));
  };

  const canPass = unusedQuestions.some((question) => materialsList.includes(question.material));

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
            {phase === 'playing' ? `ADIM ${validCount} / 10` : 'ÖĞRETMEN DEĞERLENDİRMESİ'}
          </p>
        </div>
        <div className="w-10 landscape:w-8"></div> 
      </div>

      {/* ORTA İÇERİK ALANI */}
      <div className={`flex-1 relative flex flex-col items-center p-4 overflow-y-auto bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 to-slate-950 ${phase === 'intro' ? 'justify-start' : 'justify-center'}`}>
        
        {phase === 'intro' && (
          <div className="w-full max-w-5xl py-3 animate-in zoom-in-95 duration-300">
            <div className="text-center mb-5">
              <Ear size={52} className="mx-auto text-blue-500 mb-2 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
              <h1 className="text-2xl md:text-3xl font-black mb-2 text-white">Değerlendirme Hazırlığı</h1>
              <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                Aşağıdaki 10 yönerge sorulacak. Değiştirmek istediğiniz yönergeye dokunun.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
              {instructions.map((instruction, index) => (
                <button
                  key={`${index}-${instruction.id}`}
                  type="button"
                  onClick={() => replacePreparationInstruction(index)}
                  disabled={unusedQuestions.length === 0}
                  className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2.5 text-left transition-all hover:border-blue-500/60 hover:bg-slate-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-xs font-black text-blue-300">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 text-sm font-semibold text-slate-100">{instruction.text}</span>
                  <RefreshCw size={16} className="shrink-0 text-slate-500" />
                </button>
              ))}
            </div>

            <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 mb-5">
              <div className="flex items-center gap-2 mb-3 text-amber-300">
                <PackageCheck size={20} />
                <h2 className="text-sm font-black uppercase tracking-wider">Hazır Bulundurulacak Malzemeler</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {materialsList.map((material) => (
                  <span key={material} className="rounded-full border border-amber-400/25 bg-slate-950/60 px-3 py-1.5 text-xs font-semibold text-amber-100">
                    {material}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
                Yönergeleri değiştirdiğinizde ihtiyaç duyulan malzemeler otomatik güncellenir.
              </p>
            </div>

            <button 
              onClick={() => setPhase('playing')} 
              className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-3.5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 w-full shadow-xl shadow-blue-900/50 active:scale-95 transition-all"
            >
              <PlayCircle size={22} /> DEĞERLENDİRMEYİ BAŞLAT
            </button>
          </div>
        )}

        {phase === 'playing' && (
          <div className="w-full max-w-3xl flex flex-col items-center justify-center animate-in slide-in-from-right-8 duration-300">
            <div className="w-full bg-slate-800/60 border-2 border-slate-700 rounded-[2.5rem] p-10 md:p-16 flex flex-col items-center justify-center shadow-2xl backdrop-blur-sm min-h-[250px] md:min-h-[350px]">
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

      {/* ALT BUTONLAR */}
      {phase === 'playing' && (
        <div className="shrink-0 p-6 pb-10 landscape:py-3 landscape:px-6 landscape:pb-4 bg-slate-900 border-t border-slate-800 flex items-stretch justify-center gap-3 sm:gap-4 relative z-10">
          
          <button 
            onClick={handlePass} 
            disabled={!canPass}
            className="flex-1 max-w-[200px] flex flex-col landscape:flex-row items-center justify-center gap-2 p-4 landscape:p-3 bg-slate-700 border border-slate-600 rounded-2xl active:scale-95 transition-all text-slate-300 hover:bg-slate-600 disabled:opacity-35 disabled:cursor-not-allowed disabled:active:scale-100"
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
