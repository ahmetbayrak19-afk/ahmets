// eslemegame.tsx
import { useState, useEffect, useRef } from 'react';
import { XCircle, Play } from 'lucide-react';
import confetti from 'canvas-confetti';

import { loadAssets, AssetLibrary } from './Assets';
import { PhysicsEngine, WORLD_WIDTH, WORLD_HEIGHT, SEA_LEVEL } from './Physics';
import { GameRenderer } from './Renderer';

export default function EslemeGame({ onClose }: { onClose: () => void }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [score, setScore] = useState(0);

    // Motor Parçaları
    const assets = useRef<AssetLibrary | null>(null);
    const physics = useRef(new PhysicsEngine());
    const renderer = useRef<GameRenderer | null>(null);
    
    // Oyun Durumu
    const fish = useRef({ x: 10000, y: 800, vx: 0, vy: 0, rotation: 0, scaleX: 1, scaleY: 1, frame: 0, timer: 0, isEating: false });
    const camera = useRef({ x: 10000, y: 800 });
    const mousePos = useRef({ x: 10000, y: 800 });
    const chunks = useRef<any[]>([]);
    const targets = useRef<any[]>([]);
    const reqRef = useRef<number>();

    // 1. BAŞLATMA
    useEffect(() => {
        const init = async () => {
            try {
                assets.current = await loadAssets();
                
                // Zemin haritası oluştur
                const newChunks = [];
                for(let i=0; i<10; i++) {
                    const zems = assets.current.zeminler;
                    const usts = assets.current.ustler;
                    const base = zems.length > 0 ? zems[i % zems.length] : null;
                    const overlay = (usts.length > 0 && Math.random()>0.6) ? usts[Math.floor(Math.random()*usts.length)] : null;
                    newChunks.push({ id: i, x: i*2000, base, overlay });
                }
                chunks.current = newChunks;
                setIsLoaded(true);
            } catch (e) {
                console.error("Başlatma hatası:", e);
            }
        };
        init();
    }, []);

    // 2. INPUT (Dokunmatik ve Mouse)
    const handleInput = (e: any) => {
        if (!isPlaying || !canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        let clientX = e.touches ? e.touches[0].clientX : e.clientX;
        let clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        const isPortrait = window.innerHeight > window.innerWidth;
        const screenX = clientX - rect.left;
        const screenY = clientY - rect.top;

        // Koordinat çevrimi (Yatay/Dikey ekran için)
        if (isPortrait) {
            const cx = window.innerHeight / 2;
            const cy = window.innerWidth / 2;
            mousePos.current.x = camera.current.x + (screenY - cx);
            mousePos.current.y = camera.current.y + ((window.innerWidth - screenX) - cy);
        } else {
            const cx = window.innerWidth / 2;
            const cy = window.innerHeight / 2;
            mousePos.current.x = camera.current.x + (screenX - cx);
            mousePos.current.y = camera.current.y + (screenY - cy);
        }
    };

    // 3. OYUN DÖNGÜSÜ
    useEffect(() => {
        if (!isPlaying || !isLoaded || !canvasRef.current || !assets.current) return;
        
        renderer.current = new GameRenderer(canvasRef.current);

        const loop = () => {
            const isPortrait = window.innerHeight > window.innerWidth;
            const w = isPortrait ? window.innerHeight : window.innerWidth;
            const h = isPortrait ? window.innerWidth : window.innerHeight;
            
            // Ekran boyutunu güncelle
            renderer.current?.resize(w, h);
            
            // Fiziği güncelle
            physics.current.updateFish(fish.current, mousePos.current.x, mousePos.current.y);

            // Kamera Takip (Yumuşak Geçiş)
            const safeY = Math.max(SEA_LEVEL + 150, fish.current.y);
            camera.current.x += (fish.current.x - camera.current.x) * 0.08;
            camera.current.y += (safeY - camera.current.y) * 0.06;
            
            // Kamera Sınırları
            camera.current.x = Math.max(0, Math.min(WORLD_WIDTH, camera.current.x));
            camera.current.y = Math.max(SEA_LEVEL + 120, Math.min(WORLD_HEIGHT, camera.current.y));

            // Yem Oluşturma Mantığı
            if (Math.random() < 0.03) {
                 targets.current.push({ 
                     id: Date.now(), 
                     x: Math.random() * WORLD_WIDTH, 
                     y: Math.random() * (WORLD_HEIGHT - SEA_LEVEL - 400) + SEA_LEVEL + 100, 
                     color: ['#ef4444', '#22c55e', '#eab308'][Math.floor(Math.random() * 3)] 
                 });
            }
            
            // Yem Yeme Kontrolü
            targets.current = targets.current.filter(t => {
                const dist = Math.hypot(fish.current.x - t.x, fish.current.y - t.y);
                if (dist < 80) {
                    setScore(s => s + 10);
                    confetti({ origin: { x: 0.5, y: 0.5 }, particleCount: 20, spread: 40 });
                    fish.current.isEating = true; 
                    fish.current.frame = 0;
                    setTimeout(() => fish.current.isEating = false, 300);
                    return false;
                }
                return true;
            });

            // Ekrana Çiz
            renderer.current?.draw(assets.current!, fish.current, camera.current, chunks.current, targets.current);
            reqRef.current = requestAnimationFrame(loop);
        };
        reqRef.current = requestAnimationFrame(loop);

        return () => cancelAnimationFrame(reqRef.current!);
    }, [isPlaying, isLoaded]);

    return (
        <div className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden">
            {isLoaded ? (
                <>
                    <canvas 
                        ref={canvasRef}
                        className="block touch-none"
                        style={{
                            width: window.innerHeight > window.innerWidth ? '100vh' : '100vw',
                            height: window.innerHeight > window.innerWidth ? '100vw' : '100vh',
                            transform: window.innerHeight > window.innerWidth ? 'rotate(90deg)' : 'none'
                        }}
                        onMouseMove={handleInput} onTouchMove={handleInput} onClick={handleInput}
                    />
                    
                    {/* UI Katmanı */}
                    <div className="fixed top-5 left-5 bg-white/90 px-6 py-2 rounded-full border-4 border-orange-400 z-50 font-bold text-2xl text-orange-600">
                        SKOR: {score}
                    </div>
                    <button onClick={onClose} className="fixed top-5 right-5 z-50 bg-white p-2 rounded-full shadow-lg">
                        <XCircle className="text-red-500 w-8 h-8"/>
                    </button>
                    
                    {!isPlaying && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                            <button onClick={() => setIsPlaying(true)} className="bg-orange-500 text-white px-12 py-6 rounded-3xl text-4xl font-black flex gap-4 items-center shadow-2xl hover:scale-105 transition border-b-8 border-orange-700 active:translate-y-2 active:border-b-0">
                                <Play size={40} fill="currentColor"/> BAŞLA
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <div className="text-white text-xl animate-pulse">
                    Grafikler Yükleniyor...
                </div>
            )}
        </div>
    );
                  }
                              
