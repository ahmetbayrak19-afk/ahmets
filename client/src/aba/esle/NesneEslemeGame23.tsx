import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Volume2, RotateCcw, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';

// --- GENEL SESLER ---
import soruSes from './oyku/soru.mp3'; 

import aferin1 from './ses/aferin1.mp3';
import aferin2 from './ses/aferin2.mp3';
import bravo from './ses/bravo.mp3';
import harika1 from './ses/harika1.mp3';
import tekrardene1 from './ses/tekrardene1.mp3';

// --- HİKAYE DOSYALARI ---
import bozukImg from './oyku/bozuk.jpeg';
import bozukAud from './oyku/bozuk.mp3';
import catlakImg from './oyku/catlaktesti.jpeg';
import catlakAud from './oyku/catlaktesti.mp3';
import dunyaImg from './oyku/dunyagunes.jpeg';
import dunyaAud from './oyku/dunyagunes.mp3';
import kamyonImg from './oyku/kamyon.jpeg';
import kamyonAud from './oyku/kamyon.mp3';
import kopekImg from './oyku/kopekbalik.jpeg';
import kopekAud from './oyku/kopekbalik.mp3';
import mavibalikImg from './oyku/mavibalik.jpeg';
import mavibalikAud from './oyku/mavibalik.mp3';
import mavifilImg from './oyku/mavifil.jpeg';
import mavifilAud from './oyku/mavifil.mp3';
import mantarImg from './oyku/minikmantar.jpeg';
import mantarAud from './oyku/minikmantar.mp3';
import serceImg from './oyku/minikserce.jpeg';
import serceAud from './oyku/minikserce.mp3';
import bulutImg from './oyku/pamukbulut.jpeg';
import bulutAud from './oyku/pamukbulut.mp3';
import atesImg from './oyku/piriltiates.jpeg';
import atesAud from './oyku/piriltiates.mp3';
import kirpiImg from './oyku/pofudukkirpi.jpeg';
import kirpiAud from './oyku/pofudukkirpi.mp3';
import yildizImg from './oyku/uykucuyildiz.jpeg';
import yildizAud from './oyku/uykucuyildiz.mp3';
import yumurtaImg from './oyku/yumurta.jpeg';
import yumurtaAud from './oyku/yumurta.mp3';

// --- VERİ LİSTESİ ---
const OYKU_LISTESI = [
    { id: 'bozuk', img: bozukImg, audio: bozukAud },
    { id: 'catlak', img: catlakImg, audio: catlakAud },
    { id: 'dunya', img: dunyaImg, audio: dunyaAud },
    { id: 'kamyon', img: kamyonImg, audio: kamyonAud },
    { id: 'kopek', img: kopekImg, audio: kopekAud },
    { id: 'mavibalik', img: mavibalikImg, audio: mavibalikAud },
    { id: 'mavifil', img: mavifilImg, audio: mavifilAud },
    { id: 'mantar', img: mantarImg, audio: mantarAud },
    { id: 'serce', img: serceImg, audio: serceAud },
    { id: 'bulut', img: bulutImg, audio: bulutAud },
    { id: 'ates', img: atesImg, audio: atesAud },
    { id: 'kirpi', img: kirpiImg, audio: kirpiAud },
    { id: 'yildiz', img: yildizImg, audio: yildizAud },
    { id: 'yumurta', img: yumurtaImg, audio: yumurtaAud },
];

const SUCCESS_SOUNDS = [aferin1, aferin2, bravo, harika1];

interface GameProps {
    onClose: () => void;
}

export default function NesneEslemeGame23({ onClose }: GameProps) {
    const [level, setLevel] = useState<1 | 2>(1);
    
    // Oyun State'leri
    const [currentStory, setCurrentStory] = useState<any>(null);
    const [options, setOptions] = useState<any[]>([]);
    const [isLocked, setIsLocked] = useState(true);
    const [wrongCount, setWrongCount] = useState(0);
    const [status, setStatus] = useState<'listening' | 'answering' | 'success'>('listening');
    const [lastWrongId, setLastWrongId] = useState<string | null>(null);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const timersRef = useRef<NodeJS.Timeout[]>([]); // Zamanlayıcıları takip etmek için

    // --- TEMİZLİK FONKSİYONU ---
    const clearAllTimers = () => {
        timersRef.current.forEach(t => clearTimeout(t));
        timersRef.current = [];
    };

    // --- SES ÇALMA YÖNETİCİSİ ---
    const playSound = (src: string, onEnd?: () => void) => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current = null;
        }

        const audio = new Audio(src);
        audioRef.current = audio;
        
        audio.onended = () => {
            if (onEnd) onEnd();
        };

        audio.play().catch(e => console.error("Ses çalma hatası:", e));
    };

    // --- OYUNU BAŞLAT ---
    const startGame = (selectedLevel: 1 | 2) => {
        clearAllTimers(); // Önceki bekleyen işlemleri iptal et (Hızlı geçişler için)
        
        setLevel(selectedLevel);
        
        // Rastgele bir hikaye seç
        const shuffledList = [...OYKU_LISTESI].sort(() => 0.5 - Math.random());
        const target = shuffledList[0];
        
        // Seviyeye göre seçenek sayısı (3 veya 4)
        const count = selectedLevel === 1 ? 3 : 4;
        const gameOptions = shuffledList.slice(0, count).sort(() => 0.5 - Math.random());

        setCurrentStory(target);
        setOptions(gameOptions);
        
        setWrongCount(0);
        setLastWrongId(null);
        setIsLocked(true); // Kilidi kapat
        setStatus('listening'); // Mod: Dinleme

        // --- AKIŞ MANTIĞI ---
        const startTimer = setTimeout(() => {
            // 1. Hikayeyi Çal
            playSound(target.audio, () => {
                
                // Hikaye bitti, 500ms bekle
                const questionTimer = setTimeout(() => {
                    
                    // 2. Soruyu Çal ("Bu hikayenin resmi hangisi?")
                    playSound(soruSes, () => {
                        // Soru bitti -> KİLİTLER AÇILSIN
                        setIsLocked(false);
                        setStatus('answering'); // Mod: Cevaplama
                    });
                    
                }, 500);
                timersRef.current.push(questionTimer);
            });
        }, 500);
        timersRef.current.push(startTimer);
    };

    // Sayfa açılınca otomatik başlat (Seviye 1)
    useEffect(() => {
        startGame(1);
        return () => {
            clearAllTimers();
            if (audioRef.current) {
                audioRef.current.pause();
            }
        };
    }, []);

    // --- CEVAP KONTROLÜ ---
    const handleAnswer = (selectedId: string) => {
        if (isLocked || status !== 'answering') return;

        if (selectedId === currentStory.id) {
            // DOĞRU
            setStatus('success');
            setIsLocked(true);
            confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
            
            const successSound = SUCCESS_SOUNDS[Math.floor(Math.random() * SUCCESS_SOUNDS.length)];
            playSound(successSound, () => {
                // 1.5 saniye sonra YENİ OYUN BAŞLAT (Aynı seviyede)
                const nextGameTimer = setTimeout(() => startGame(level), 1500);
                timersRef.current.push(nextGameTimer);
            });
        } else {
            // YANLIŞ
            setWrongCount(prev => prev + 1);
            setLastWrongId(selectedId);
            playSound(tekrardene1);
        }
    };

    // --- RENDER ---
    return (
        <div className="fixed inset-0 z-[600] bg-slate-950 text-white flex flex-col font-sans">
            
            {/* ÜST HEADER ve KONTROLLER */}
            <div className="p-2 sm:p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center shadow-lg gap-2">
                <button 
                    onClick={onClose} 
                    className="p-2 sm:p-3 bg-slate-800 rounded-full hover:bg-slate-700 active:scale-95 transition-all border border-slate-700 shrink-0"
                >
                    <ArrowLeft size={20} />
                </button>

                {/* SEVİYE BUTONLARI (ORTADA) */}
                <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
                    <button
                        onClick={() => startGame(1)}
                        className={`
                            px-4 py-2 rounded-lg text-sm font-bold transition-all
                            ${level === 1 ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}
                        `}
                    >
                        1. Seviye
                    </button>
                    <button
                        onClick={() => startGame(2)}
                        className={`
                            px-4 py-2 rounded-lg text-sm font-bold transition-all
                            ${level === 2 ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}
                        `}
                    >
                        2. Seviye
                    </button>
                </div>

                <div className="w-10 sm:w-12" /> {/* Dengelemek için boşluk */}
            </div>

            {/* OYUN ALANI */}
            <div className="flex-1 flex flex-col p-4 relative overflow-hidden">
                
                {/* BİLGİ LABELI */}
                <div className="flex justify-center mb-4">
                    <div className={`
                        px-6 py-2 rounded-full font-bold text-lg shadow-lg flex items-center gap-2 transition-all duration-500 text-center
                        ${status === 'listening' ? 'bg-orange-500 animate-pulse text-white' : 'bg-green-600 text-white'}
                    `}>
                        {status === 'listening' ? (
                            <><Volume2 size={20} className="animate-bounce"/> Öykü Dinleniyor...</>
                        ) : status === 'answering' ? (
                            "Hangi Resim?"
                        ) : (
                            "HARİKA!"
                        )}
                    </div>
                </div>

                {/* RESİMLER (ALT ALTA) */}
                <div className="flex-1 flex flex-col gap-4 max-w-md mx-auto w-full h-full pb-8">
                    {options.map((opt) => {
                        const isCorrect = currentStory && opt.id === currentStory.id;
                        
                        // 2. Yanlışta doğru olmayanlar kararır
                        const shouldDarken = wrongCount >= 2 && !isCorrect;

                        // Son tıklanan yanlışsa zıplasın
                        const isJustClickedWrong = wrongCount > 0 && lastWrongId === opt.id && !isCorrect;

                        return (
                            <motion.div
                                key={opt.id}
                                onClick={() => handleAnswer(opt.id)}
                                // Yanlış efekti (Pulse)
                                animate={isJustClickedWrong ? { scale: [1, 0.9, 1.05, 1], x: [0, -5, 5, 0] } : {}}
                                transition={{ duration: 0.4 }}
                                className={`
                                    flex-1 relative rounded-2xl overflow-hidden border-4 cursor-pointer shadow-md transition-all duration-500
                                    ${shouldDarken ? 'brightness-[0.2] grayscale pointer-events-none border-transparent' : 'bg-slate-800'}
                                    ${status === 'success' && isCorrect ? 'border-green-500 ring-4 ring-green-400 z-10 scale-105' : 'border-slate-700'}
                                    ${isLocked ? 'active:none' : 'active:scale-95'}
                                `}
                            >
                                <img 
                                    src={opt.img} 
                                    className="w-full h-full object-cover" 
                                    alt="secenek"
                                />

                                {/* KİLİT PERDESİ (Dinlerken hafif koyu) */}
                                {isLocked && status === 'listening' && (
                                    <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] flex items-center justify-center">
                                        {/* İsteğe bağlı kilit ikonu */}
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>

                {/* TEKRAR DİNLE BUTONU (Sadece seçim aşamasında aktif) */}
                {status === 'answering' && currentStory && (
                    <div className="absolute bottom-6 right-6 z-20">
                        <Button 
                            onClick={() => playSound(currentStory.audio)} 
                            className="w-16 h-16 rounded-full bg-slate-800 border-2 border-blue-500 hover:bg-slate-700 shadow-xl"
                        >
                            <RotateCcw className="text-blue-400" size={28} />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
