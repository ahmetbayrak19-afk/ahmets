import { useEffect, useRef, useState } from 'react';
import { XCircle, Play } from 'lucide-react';
import confetti from 'canvas-confetti';

import { loadAssets, AssetLibrary } from './Assets';
import { PhysicsEngine, WORLD_WIDTH, WORLD_HEIGHT } from './Physics';
import { GameRenderer } from './Renderer';

export default function EslemeGame({ onClose }: { onClose: () => void }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const assets = useRef<AssetLibrary | null>(null);
    const physics = useRef(new PhysicsEngine());
    const renderer = useRef<GameRenderer | null>(null);

    const fish = useRef({
        x: 3000,
        y: 900,
        vx: 0,
        vy: 0,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        frame: 0,
        timer: 0,
        isEating: false
    });

    const camera = useRef({ x: 3000, y: 900 });
    const target = useRef({ x: 3000, y: 900 });
    const chunks = useRef<any[]>([]);
    const targets = useRef<any[]>([]);
    const score = useRef(0);

    const [, forceUI] = useState(0);
    const [loaded, setLoaded] = useState(false);
    const [playing, setPlaying] = useState(false);

    /* ---------- INIT ---------- */
    useEffect(() => {
        loadAssets().then(a => {
            assets.current = a;

            chunks.current = Array.from({ length: 10 }).map((_, i) => ({
                id: i,
                x: i * 2000,
                base: a.zeminler[Math.floor(Math.random() * a.zeminler.length)],
                overlay: Math.random() > 0.5 ? a.ustler[Math.floor(Math.random() * a.ustler.length)] : null
            }));

            setLoaded(true);
        });
    }, []);

    /* ---------- INPUT ---------- */
    const handleInput = (e: any) => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;

        target.current.x = camera.current.x + (x - rect.width / 2);
        target.current.y = camera.current.y + (y - rect.height / 2);
    };

    /* ---------- GAME LOOP ---------- */
    useEffect(() => {
        if (!playing || !loaded || !canvasRef.current || !assets.current) return;

        renderer.current = new GameRenderer(canvasRef.current);
        let running = true;

        const loop = () => {
            if (!running) return;

            const w = window.innerWidth;
            const h = window.innerHeight;
            renderer.current!.resize(w, h);

            physics.current.updateFish(
                fish.current,
                target.current.x,
                target.current.y
            );

            // Kamera balığın biraz arkasında
            camera.current.x += (fish.current.x - 150 - camera.current.x) * 0.08;
            camera.current.y += (fish.current.y - camera.current.y) * 0.1;

            // Yem spawn
            if (targets.current.length < 25 && Math.random() < 0.02) {
                targets.current.push({
                    id: Date.now(),
                    x: Math.random() * WORLD_WIDTH,
                    y: Math.random() * (WORLD_HEIGHT - 600) + 500,
                    r: 18,
                    pulse: Math.random() * Math.PI * 2,
                    color: ['#ef4444', '#22c55e', '#eab308'][Math.floor(Math.random() * 3)]
                });
            }

            // Yem collision
            targets.current = targets.current.filter(t => {
                t.pulse += 0.1;
                const d = Math.hypot(fish.current.x - t.x, fish.current.y - t.y);
                if (d < 70) {
                    score.current += 10;
                    fish.current.isEating = true;
                    fish.current.frame = 0;
                    setTimeout(() => (fish.current.isEating = false), 250);
                    confetti({ particleCount: 18, spread: 40 });
                    forceUI(s => s + 1);
                    return false;
                }
                return true;
            });

            renderer.current!.draw(
                assets.current!,
                fish.current,
                camera.current,
                chunks.current,
                targets.current
            );

            requestAnimationFrame(loop);
        };

        requestAnimationFrame(loop);
        return () => { running = false; };
    }, [playing, loaded]);

    /* ---------- UI ---------- */
    return (
        <div className="fixed inset-0 bg-black overflow-hidden">
            {loaded && (
                <>
                    <canvas
                        ref={canvasRef}
                        className="touch-none"
                        onMouseMove={handleInput}
                        onTouchMove={handleInput}
                        onClick={handleInput}
                    />

                    <div className="fixed top-4 left-4 z-50 bg-white/90 px-5 py-2 rounded-full text-xl font-black text-orange-600">
                        SKOR: {score.current}
                    </div>

                    <button onClick={onClose} className="fixed top-4 right-4 z-50 bg-white p-2 rounded-full">
                        <XCircle className="w-8 h-8 text-red-500" />
                    </button>

                    {!playing && (
                        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70">
                            <button
                                onClick={() => setPlaying(true)}
                                className="bg-orange-500 text-white px-12 py-6 rounded-3xl text-4xl font-black flex gap-4 items-center"
                            >
                                <Play size={40} fill="currentColor" /> BAŞLA
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
