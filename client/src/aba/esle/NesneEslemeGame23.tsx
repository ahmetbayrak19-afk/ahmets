import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Volume2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';

// --- GENEL SESLER ---
// 🔥 soru.mp3 BURADA (oyku klasöründe)
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
    const [view, setView] = useState<'menu' | 'game'>('menu');
    const [level, setLevel] = useState<1 | 2>(1);
    
    // Oyun State'leri
    const [currentStory, setCurrentStory] = useState<any>(null);
    const [options, setOptions] = useState<any[]>([]);
    const [isLocked, setIsLocked] = useState(true); // Başta kilitli
    const [wrongCount, setWrongCount] = useState(0);
    const [status, setStatus] = useState<'listening' | 'answering' | 'success'>('listening');
    const [lastWrongId, setLastWrongId] = useState<string | null>(null);

    const audioRef = useRef<HTMLAudioElement | null>(null);

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
        setView('game');

        // --- AKIŞ MANTIĞI ---
        setTimeout(() => {
            // 1. Hikayeyi Çal
            playSound(target.audio, () => {
                
                // Hikaye bitti, 500ms bekle
                setTimeout(() => {
                    
                    // 2. Soruyu Çal ("Bu hikayenin resmi hangisi?")
                    playSound(soruSes, () => {
                        // Soru bitti -> KİLİTLER AÇILSIN
                        setIsLocked(false);
                        setStatus('answering'); // Mod: Cevaplama
                    });
                    
                }, 500);
            });
        }, 800);
    };

    // --- CEVAP KONTROLÜ ---
    const handleAnswer = (selectedId: string) => {
        // Eğer kilitliyse veya dinleme modundaysa işlem yapma
        if (isLocked || status !== 'answering') return;

        if (selectedId === currentStory.id) {
            // DOĞRU
            setStatus('success');
            setIsLocked(true);
            confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
            
            const successSound = SUCCESS_SOUNDS[Math.floor(Math.random() * SUCCESS_SOUNDS.length)];
            playSound(successSound, () => {
                // 1.5 saniye sonra menüye dön
                setTimeout(() => setView('menu'), 1500);
            });
        } else {
            // YANLIŞ
            setWrongCount(prev => prev + 1);
            setLastWrongId(selectedId);
            playSound(tekrardene1);
        }
    };

    // Temizlik
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    // --- RENDER ---
    return (
        <div className="fixed inset-0 z-[600] bg-slate-950 text-white flex flex-col font-sans">
            
            {/* ÜST HEADER */}
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center shadow-lg">
                <button 
                    onClick={onClose} 
                    className="p-3 bg-slate-800 rounded-full hover:bg-slate-700 active:scale-95 transition-all border border-slate-700"
                >
                    <ArrowLeft size={24} />
                </button>
                <h2 className="text-xl font-bold tracking-wide text-blue-100">Öykü Eşleme</h2>
                <div className="w-12" />
            </div>

            {view === 'menu' ? (
                // --- MENÜ ---
                <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8">
                    <h3 className="text-3xl font-black text-center text-white mb-4">SEVİYE SEÇ</h3>
                    
                    <div className="w-full max-w-sm flex flex-col gap-5">
                        <Button 
                            onClick={() => startGame(1)} 
                            className="h-24 text-2xl font-black rounded-3xl bg-gradient-to-r from-blue-600 to-blue-500 border-b-8 border-blue-800 active:border-b-0 active:translate-y-2 transition-all shadow-xl"
                        >
                            1. SEVİYE
                            <span className="block text-sm font-normal opacity-80 ml-2">(3 Resim)</span>
                        </Button>

                        <Button 
                            onClick={() => startGame(2)} 
                            className="h-24 text-2xl font-black rounded-3xl bg-gradient-to-r from-purple-600 to-purple-500 border-b-8 border-purple-800 active:border-b-0 active:translate-y-2 transition-all shadow-xl"
                        >
                            2. SEVİYE
                            <span className="block text-sm font-normal opacity-80 ml-2">(4 Resim)</span>
                        </Button>
                    </div>
                </div>
            ) : (
                // --- OYUN ALANI ---
                <div className="flex-1 flex flex-col p-4 relative overflow-hidden">
                    
                    {/* BİLGİ LABELI */}
                    <div className="flex justify-center mb-4">
                        <div className={`
                            px-6 py-2 rounded-full font-bold text-lg shadow-lg flex items-center gap-2 transition-all duration-500
                            ${status === 'listening' ? 'bg-orange-500 animate-pulse text-white' : 'bg-green-600 text-white'}
                        `}>
                            {status === 'listening' ? (
                                <><Volume2 size={20} className="animate-bounce"/> Öyküyü Dinle...</>
                            ) : status === 'answering' ? (
                                "Bu öykü hangisi?"
                            ) : (
                                "HARİKA!"
                            )}
                        </div>
                    </div>

                    {/* RESİMLER (ALT ALTA) */}
                    <div className="flex-1 flex flex-col gap-4 max-w-md mx-auto w-full h-full pb-8">
                        {options.map((opt) => {
                            const isCorrect = opt.id === currentStory.id;
                            
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
                                            {/* İsteğe bağlı kilit ikonu konabilir */}
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* TEKRAR DİNLE BUTONU (Sadece seçim aşamasında aktif) */}
                    {status === 'answering' && (
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
            )}
        </div>
    );
}
