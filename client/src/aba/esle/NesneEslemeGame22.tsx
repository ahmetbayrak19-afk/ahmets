import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, XCircle, Trophy, GraduationCap, ClipboardCheck, RefreshCcw, Volume2, VolumeX } from 'lucide-react';
import confetti from 'canvas-confetti';
import { twMerge } from 'tailwind-merge';

import arkaplanMusic from './ses/arkaplanmusic.mp3';
import aferin1 from './ses/aferin1.mp3';
import aferin2 from './ses/aferin2.mp3';
import bravo from './ses/bravo.mp3';
import esledinbravo from './ses/esledinbravo.mp3';
import harika1 from './ses/harika1.mp3';
import harika2 from './ses/harika2.mp3';
import tekrardene1 from './ses/tekrardene1.mp3';
import tekrardene2 from './ses/tekrardene2.mp3';

import zanahtarImg from './iliski/zanahtar.png';
import zkilitImg from './iliski/zkilit.png';
import zsonImg from './iliski/zson.png';
import jariImg from './iliski/jari.png';
import jbalImg from './iliski/jbal.png';
import jsonImg from './iliski/json.jpeg';
import btavukImg from './iliski/btavuk.png';
import byumurtaImg from './iliski/byumurta.png';
import bsonImg from './iliski/bson.jpeg';
import hkediImg from './iliski/hkedi.png';
import hipImg from './iliski/hip.png';
import hsonImg from './iliski/hson.jpeg';
import disfircaImg from './iliski/disfirca.png';
import dismacunImg from './iliski/dismacun.png';
import disImg from './iliski/dis.jpeg';
import dissonImg from './iliski/disson.jpeg';
import ytencereImg from './iliski/ytencere.png';
import ykapakImg from './iliski/ykapak.png';
import ykepceImg from './iliski/ykepce.png';
import ysonImg from './iliski/yson.png';
import xcekicImg from './iliski/xcekic.png';
import xciviImg from './iliski/xcivi.png';
import xtahtaImg from './iliski/xtahta.png';
import xsonImg from './iliski/xson.jpeg';
import ckalemImg from './iliski/ckalem.png';
import csilgiImg from './iliski/csilgi.png';
import cdefterImg from './iliski/cdefter.png';
import csonImg from './iliski/cson.jpg';
import kyatakImg from './iliski/kyatak.png';
import kyorganImg from './iliski/kyorgan.png';
import kyastikImg from './iliski/kyastik.png';
import ksonImg from './iliski/kson.png';
import payakImg from './iliski/payak.png';
import pcorapImg from './iliski/pcorap.png';
import pterlikImg from './iliski/pterlik.png';
import psonImg from './iliski/pson.jpg';

const POSITIVE_SOUNDS = [aferin1, aferin2, bravo, esledinbravo, harika1, harika2];
const NEGATIVE_SOUNDS = [tekrardene1, tekrardene2];

type Piece = { id: string; name: string; src: string };
type Group = {
  id: string;
  level: 1 | 2 | 3;
  pieces: Piece[];
  finalImage: string;
};

const GROUPS: Group[] = [
  { id: 'z', level: 1, pieces: [
      { id: 'zanahtar', name: 'Anahtar', src: zanahtarImg },
      { id: 'zkilit', name: 'Kilit', src: zkilitImg },
    ], finalImage: zsonImg },
  { id: 'j', level: 1, pieces: [
      { id: 'jari', name: 'Arı', src: jariImg },
      { id: 'jbal', name: 'Bal', src: jbalImg },
    ], finalImage: jsonImg },
  { id: 'b', level: 1, pieces: [
      { id: 'btavuk', name: 'Tavuk', src: btavukImg },
      { id: 'byumurta', name: 'Yumurta', src: byumurtaImg },
    ], finalImage: bsonImg },
  { id: 'h', level: 1, pieces: [
      { id: 'hkedi', name: 'Kedi', src: hkediImg },
      { id: 'hip', name: 'İp', src: hipImg },
    ], finalImage: hsonImg },
  { id: 'dis', level: 2, pieces: [
      { id: 'disfirca', name: 'Diş Fırçası', src: disfircaImg },
      { id: 'dismacun', name: 'Diş Macunu', src: dismacunImg },
      { id: 'dis', name: 'Diş', src: disImg },
    ], finalImage: dissonImg },
  { id: 'y', level: 2, pieces: [
      { id: 'ytencere', name: 'Tencere', src: ytencereImg },
      { id: 'ykapak', name: 'Kapak', src: ykapakImg },
      { id: 'ykepce', name: 'Kepçe', src: ykepceImg },
    ], finalImage: ysonImg },
  { id: 'x', level: 2, pieces: [
      { id: 'xcekic', name: 'Çekiç', src: xcekicImg },
      { id: 'xcivi', name: 'Çivi', src: xciviImg },
      { id: 'xtahta', name: 'Tahta', src: xtahtaImg },
    ], finalImage: xsonImg },
  { id: 'c', level: 3, pieces: [
      { id: 'ckalem', name: 'Kalem', src: ckalemImg },
      { id: 'csilgi', name: 'Silgi', src: csilgiImg },
      { id: 'cdefter', name: 'Defter', src: cdefterImg },
    ], finalImage: csonImg },
  { id: 'k', level: 3, pieces: [
      { id: 'kyatak', name: 'Yatak', src: kyatakImg },
      { id: 'kyorgan', name: 'Yorgan', src: kyorganImg },
      { id: 'kyastik', name: 'Yastık', src: kyastikImg },
    ], finalImage: ksonImg },
  { id: 'p', level: 3, pieces: [
      { id: 'payak', name: 'Ayak', src: payakImg },
      { id: 'pcorap', name: 'Çorap', src: pcorapImg },
      { id: 'pterlik', name: 'Terlik', src: pterlikImg },
    ], finalImage: psonImg },
];

interface GameProps {
  mode: 'assessment' | 'instruction';
  onClose: () => void;
  onComplete: (success: boolean) => void;
}

const shuffle = <T,>(arr: T[]) => [...arr].sort(() => 0.5 - Math.random());

export default function NesneEslemeGame22({ mode, onClose, onComplete }: GameProps) {
  const [level, setLevel] = useState<1 | 2 | 3>(1);
  const [phase, setPhase] = useState<'playing' | 'success' | 'fail'>('playing');
  const [isMuted, setIsMuted] = useState(false);

  const [assessmentCount, setAssessmentCount] = useState(0);
  const [assessmentScore, setAssessmentScore] = useState(0);

  const [questionGroup, setQuestionGroup] = useState<Group | null>(null);
  const [targetPiece, setTargetPiece] = useState<Piece | null>(null);
  const [options, setOptions] = useState<Piece[]>([]);
  const [matchedPieceIds, setMatchedPieceIds] = useState<string[]>([]);
  const [showFinalImage, setShowFinalImage] = useState(false);
  const [showFeedback, setShowFeedback] = useState<'correct' | 'wrong' | null>(null);

  const dropZoneRef = useRef<HTMLDivElement>(null);
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);

  const availableGroups = GROUPS.filter(group => group.level <= level);
  const allAvailablePieces = availableGroups.flatMap(group => group.pieces);

  const requiredPieceIds = questionGroup && targetPiece
    ? questionGroup.pieces.filter(piece => piece.id !== targetPiece.id).map(piece => piece.id)
    : [];

  const isCompleted = requiredPieceIds.length > 0 && requiredPieceIds.every(id => matchedPieceIds.includes(id));

  const playSoundEffect = (type: 'success' | 'fail') => {
    const sourcePool = type === 'success' ? POSITIVE_SOUNDS : NEGATIVE_SOUNDS;
    const randomIndex = Math.floor(Math.random() * sourcePool.length);
    const audio = new Audio(sourcePool[randomIndex]);
    audio.volume = 1;
    audio.play().catch(() => {});
  };

  const generateQuestion = () => {
    const group = shuffle(availableGroups)[0];
    const selectedTarget = shuffle(group.pieces)[0];

    const mustInclude = group.pieces.filter(piece => piece.id !== selectedTarget.id);
    let optionCount = level === 1 ? 4 : level === 2 ? 5 : 6;
    optionCount = Math.max(optionCount, mustInclude.length + 1);

    const distractors = shuffle(
      allAvailablePieces.filter(
        piece => !group.pieces.some(groupPiece => groupPiece.id === piece.id),
      ),
    ).slice(0, optionCount - mustInclude.length);

    setQuestionGroup(group);
    setTargetPiece(selectedTarget);
    setOptions(shuffle([...mustInclude, ...distractors]));
    setMatchedPieceIds([]);
    setShowFinalImage(false);
    setShowFeedback(null);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    bgMusicRef.current = new Audio(arkaplanMusic);
    bgMusicRef.current.loop = true;
    bgMusicRef.current.volume = 0.15;

    if (!isMuted) {
      bgMusicRef.current.play().catch(() => {});
    }

    return () => {
      if (bgMusicRef.current) {
        bgMusicRef.current.pause();
        bgMusicRef.current.currentTime = 0;
      }
    };
  }, []);

  useEffect(() => {
    if (!bgMusicRef.current) return;
    if (isMuted) bgMusicRef.current.pause();
    else bgMusicRef.current.play().catch(() => {});
  }, [isMuted]);

  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  useEffect(() => {
    generateQuestion();
  }, [level]);

  useEffect(() => {
    if (!isCompleted || !questionGroup) return;

    playSoundEffect('success');
    setShowFinalImage(true);
    setShowFeedback('correct');

    if (mode === 'assessment') {
      setAssessmentScore(prev => prev + 1);
    }

    setTimeout(() => {
      if (mode === 'instruction') {
        generateQuestion();
      } else {
        const nextCount = assessmentCount + 1;
        setAssessmentCount(nextCount);
        if (nextCount < 10) {
          generateQuestion();
        }
      }
    }, 1700);
  }, [isCompleted]);

  useEffect(() => {
    if (mode === 'assessment' && assessmentCount === 10) {
      if (assessmentScore >= 9) {
        setPhase('success');
        confetti({ particleCount: 250, spread: 90, origin: { y: 0.65 } });
      } else {
        setPhase('fail');
      }
    }
  }, [assessmentCount, assessmentScore, mode]);

  const handleDragEnd = (event: any, info: any, droppedPiece: Piece) => {
    if (!targetPiece || !questionGroup || showFinalImage) return;

    const dropZone = dropZoneRef.current;
    if (!dropZone) return;

    const dropRect = dropZone.getBoundingClientRect();
    const clientX = event.changedTouches?.[0]?.clientX ?? event.clientX ?? info.point.x;
    const clientY = event.changedTouches?.[0]?.clientY ?? event.clientY ?? info.point.y;

    const isInside =
      clientX >= dropRect.left - 40 &&
      clientX <= dropRect.right + 40 &&
      clientY >= dropRect.top - 40 &&
      clientY <= dropRect.bottom + 40;

    if (!isInside) return;

    const isRequiredPiece = requiredPieceIds.includes(droppedPiece.id);
    const alreadyMatched = matchedPieceIds.includes(droppedPiece.id);

    if (isRequiredPiece && !alreadyMatched) {
      setMatchedPieceIds(prev => [...prev, droppedPiece.id]);
      setOptions(prev => prev.filter(option => option.id !== droppedPiece.id));
      setShowFeedback(null);
      return;
    }

    playSoundEffect('fail');
    setShowFeedback('wrong');
    setTimeout(() => setShowFeedback(null), 900);

    if (mode === 'assessment') {
      setTimeout(() => {
        const nextCount = assessmentCount + 1;
        setAssessmentCount(nextCount);
        if (nextCount < 10) generateQuestion();
      }, 850);
    }
  };

  if (!targetPiece || !questionGroup) return null;

  return (
    <div className="fixed inset-0 h-[100dvh] w-screen z-[100] flex flex-col items-center justify-between p-4 font-sans select-none overflow-hidden touch-none overscroll-none text-slate-800 bg-slate-50">
      <div className="w-full max-w-2xl flex justify-between items-center text-slate-500 mb-2 relative z-10">
        <button onClick={onClose} className="p-2 bg-white border border-slate-200 rounded-full shadow-sm hover:bg-slate-100">
          <XCircle size={24} className="text-slate-300" />
        </button>

        <div className="flex items-center gap-3">
          {mode === 'instruction' && (
            <div className="flex bg-slate-100 p-1 rounded-full border border-slate-200 items-center">
              {[1, 2, 3].map(l => (
                <button
                  key={l}
                  onClick={() => setLevel(l as 1 | 2 | 3)}
                  className={twMerge(
                    'px-4 py-1.5 text-xs font-bold rounded-full transition-all',
                    level === l ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600',
                  )}
                >
                  LVL {l}
                </button>
              ))}
            </div>
          )}

          <div className={twMerge(
            'px-4 py-2 rounded-full shadow-sm border flex items-center gap-2',
            mode === 'assessment' ? 'bg-blue-50 border-blue-100' : 'bg-purple-50 border-purple-100',
          )}>
            {mode === 'assessment' ? <ClipboardCheck size={16} className="text-blue-600" /> : <GraduationCap size={16} className="text-purple-600" />}
            <span className={twMerge('font-bold text-xs uppercase', mode === 'assessment' ? 'text-blue-600' : 'text-purple-600')}>
              {mode === 'assessment' ? `TEST: ${Math.min(assessmentCount + 1, 10)}/10` : 'EĞİTİM'}
            </span>
          </div>

          <button onClick={() => setIsMuted(!isMuted)} className="p-2 bg-white border rounded-full shadow-sm active:scale-95">
            {isMuted ? <VolumeX size={20} className="text-slate-400" /> : <Volume2 size={20} className="text-blue-500" />}
          </button>
        </div>
      </div>

      {phase === 'playing' && (
        <div className="flex-1 flex flex-col justify-around w-full max-w-md h-full">
          <div className="flex flex-col items-center">
            <div
              ref={dropZoneRef}
              className={twMerge(
                'w-72 h-72 bg-white rounded-[3rem] border-4 border-dashed flex items-center justify-center shadow-inner relative z-0 transition-all duration-300',
                showFinalImage ? 'border-green-500 bg-green-50 border-solid' : 'border-slate-300',
              )}
            >
              <img
                src={showFinalImage ? questionGroup.finalImage : targetPiece.src}
                alt={showFinalImage ? 'eşleşme sonucu' : targetPiece.name}
                className={twMerge(
                  'object-contain transition-all duration-500 pointer-events-none',
                  showFinalImage ? 'w-56 h-56 opacity-100 scale-105 drop-shadow-2xl' : 'w-48 h-48 opacity-90',
                )}
              />
            </div>

            {!showFinalImage && (
              <p className="mt-4 text-slate-500 font-bold text-xs tracking-widest uppercase text-center">
                İlişkili parçaları sırayla bırak ({matchedPieceIds.length}/{requiredPieceIds.length})
              </p>
            )}
          </div>

          <div className={twMerge('grid gap-3 w-full px-1 justify-items-center mx-auto pb-8', level === 1 ? 'grid-cols-2' : 'grid-cols-3')}>
            {options.map(item => (
              <div key={item.id} className="relative flex justify-center items-center h-28 w-full">
                <motion.div
                  drag={!showFinalImage}
                  dragConstraints={false}
                  dragSnapToOrigin={true}
                  dragElastic={0.1}
                  dragMomentum={false}
                  onDragEnd={(e, info) => handleDragEnd(e, info, item)}
                  whileDrag={{ scale: 1.1, zIndex: 100 }}
                  className="w-24 h-24 bg-white rounded-2xl shadow-[0_6px_0_0_#e2e8f0] flex items-center justify-center border-2 touch-none relative z-10 cursor-grab active:cursor-grabbing border-slate-100"
                >
                  <img src={item.src} alt={item.name} className="w-16 h-16 object-contain pointer-events-none" />
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      )}

      {phase === 'success' && (
        <div className="absolute inset-0 bg-white z-50 flex flex-col items-center justify-center text-center p-8">
          <Trophy size={100} className="text-yellow-500 mb-6 animate-bounce" />
          <h1 className="text-3xl font-black text-slate-800 mb-2 uppercase">Tamamlandı!</h1>
          <p className="text-slate-500 mb-8 font-medium text-lg">Başarı Oranı: {assessmentScore * 10}%</p>
          <button onClick={() => onComplete(true)} className="bg-green-600 text-white px-12 py-5 rounded-2xl font-bold text-xl shadow-xl active:scale-95 transition-all">
            KAYDET VE ÇIK
          </button>
        </div>
      )}

      {phase === 'fail' && (
        <div className="absolute inset-0 bg-white z-50 flex flex-col items-center justify-center text-center p-8">
          <div className="text-8xl mb-6 italic font-black text-slate-200">!</div>
          <h1 className="text-2xl font-black text-slate-800 mb-2 uppercase">Tekrar Deneyelim</h1>
          <p className="text-slate-500 mb-10 font-medium">Skor: {assessmentScore} / 10</p>
          <div className="flex gap-4">
            <button onClick={onClose} className="bg-slate-100 text-slate-600 px-8 py-4 rounded-xl font-bold text-lg">KAPAT</button>
            <button onClick={() => window.location.reload()} className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg flex items-center gap-2">
              <RefreshCcw size={20} /> YENİDEN BAŞLA
            </button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showFeedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[110] flex flex-col items-center justify-start pt-32 pointer-events-none"
          >
            <div className={twMerge(
              'px-10 py-5 rounded-full shadow-2xl flex items-center gap-4',
              showFeedback === 'correct' ? 'bg-green-500' : 'bg-red-500',
            )}>
              {showFeedback === 'correct' ? (
                <Check size={48} className="text-white" />
              ) : (
                <>
                  <XCircle size={36} className="text-white" />
                  <span className="text-white text-3xl font-black tracking-widest">HAYIR</span>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
