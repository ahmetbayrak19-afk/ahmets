// EslemeGame.tsx (Ana Dosyan)
import { useState, useEffect, useRef } from 'react';
import { XCircle, Play } from 'lucide-react';
import { loadAssets, AssetLibrary } from './game/Assets';
import { PhysicsEngine } from './game/Physics';
import { GameRenderer } from './game/Renderer';

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

    // 1. BAŞLATMA (INIT)
    useEffect(() => {
        const init = async () => {
            try {
                // Assetleri yükle
                assets.current = await loadAssets();
                
                // Zemin haritasını oluştur
                const newChunks = [];
                for(let i=0; i<10; i++) {
                    const zems = assets.current.zeminler;
                    const usts = assets.current.ustler;
                    newChunks.push({
                        id: i, x: i*2000,
                        base: zems[Math.floor(Math.random()*zems.length)],
                        overlay: Math.random()>0.5 ? usts[Math.floor(Math.random()*usts.length)] : null
                    });
                }
                chunks.current = newChunks;

                setIsLoaded(true); // Oyun hazır!
            } catch (e) {
                console.error("Kritik Hata:", e);
            }
        };
        init();
    }, []);

    // 2. INPUT HANDLER
    const handleInput = (e: any) => {
        if (!isPlaying || !canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        let clientX = e.touches ? e.touches[0].clientX : e.clientX;
        let clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        const isPortrait = window.innerHeight > window.innerWidth;
        const screenX = clientX - rect.left;
        const screenY = clientY - rect.top;

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
            
            // Renderer boyut güncelleme
            renderer.current?.resize(w, h);

            // Fizik
            physics.current.updateFish(fish.current, mousePos.current.x, mousePos.current.y);

            // Kamera Takip
            camera.current.x += (fish.current.x - camera.current.x) * 0.1;
            camera.current.y += (fish.current.y - camera.current.y) * 0.1;

            // Çizim
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
                     {/* UI */}
                    <button onClick={onClose} className="fixed top-5 right-5 z-50 bg-white p-2 rounded-full"><XCircle className="text-red-500"/></button>
                    {!isPlaying && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
                            <button onClick={() => setIsPlaying(true)} className="bg-orange-500 text-white px-8 py-4 rounded-xl text-2xl font-bold flex gap-2">
                                <Play/> BAŞLA
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <div className="text-white text-xl animate-pulse">OYUN YÜKLENİYOR...</div>
            )}
        </div>
    );
      }
                  
