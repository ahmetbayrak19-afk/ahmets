import { useState, useEffect, useRef } from 'react';
import { XCircle, Play } from 'lucide-react';
import confetti from 'canvas-confetti';

import { loadAssets, AssetLibrary } from './Assets';
import { PhysicsEngine } from './Physics';
import { GameRenderer } from './Renderer';
import { Camera } from './Camera';

export default function EslemeGame({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);

  // Engine
  const assets = useRef<AssetLibrary | null>(null);
  const physics = useRef(new PhysicsEngine());
  const renderer = useRef<GameRenderer | null>(null);
  const camera = useRef(new Camera());

  // World
  const fish = useRef({
    x: 1000,
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

  const mouse = useRef({ x: 1000, y: 900 });
  const chunks = useRef<any[]>([]);
  const targets = useRef<any[]>([]);
  const raf = useRef<number>();

  /* ================= INIT ================= */
  useEffect(() => {
    const init = async () => {
      assets.current = await loadAssets();

      const list = [];
      for (let i = 0; i < 12; i++) {
        const base = assets.current.zeminler[Math.floor(Math.random() * assets.current.zeminler.length)];
        const overlay =
          Math.random() > 0.5
            ? assets.current.ustler[Math.floor(Math.random() * assets.current.ustler.length)]
            : null;

        list.push({ id: i, x: i * 2000, base, overlay });
      }

      chunks.current = list;
      setIsLoaded(true);
    };

    init();
  }, []);

  /* ================= INPUT ================= */
  const handleInput = (e: any) => {
    if (!canvasRef.current || !isPlaying) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;

    mouse.current.x = camera.current.x + (cx - rect.width / 2);
    mouse.current.y = camera.current.y + (cy - rect.height / 2);
  };

  /* ================= LOOP ================= */
  useEffect(() => {
    if (!isLoaded || !isPlaying || !canvasRef.current || !assets.current) return;

    renderer.current = new GameRenderer(canvasRef.current);

    const loop = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;

      renderer.current!.resize(w, h);

      physics.current.updateFish(fish.current, mouse.current.x, mouse.current.y);
      camera.current.update(fish.current.x, fish.current.y);

      // Yem spawn
      if (Math.random() < 0.025) {
        targets.current.push({
          id: Date.now(),
          x: camera.current.x + Math.random() * 1200 - 600,
          y: camera.current.y + Math.random() * 600 - 300,
          color: ['#ef4444', '#22c55e', '#eab308'][Math.floor(Math.random() * 3)]
        });
      }

      // Çarpışma
      targets.current = targets.current.filter(t => {
        const d = Math.hypot(fish.current.x - t.x, fish.current.y - t.y);
        if (d < 80) {
          setScore(s => s + 10);
          confetti({ particleCount: 20, spread: 50 });
          fish.current.isEating = true;
          fish.current.frame = 0;
          setTimeout(() => (fish.current.isEating = false), 250);
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

      raf.current = requestAnimationFrame(loop);
    };

    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current!);
  }, [isLoaded, isPlaying]);

  /* ================= UI ================= */
  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center text-white text-xl animate-pulse">
          OYUN YÜKLENİYOR…
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="absolute inset-0 touch-none"
        onMouseMove={handleInput}
        onTouchMove={handleInput}
        onClick={handleInput}
      />

      <div className="fixed top-5 left-5 bg-white/90 px-6 py-2 rounded-full border-4 border-orange-400 font-bold text-2xl text-orange-600 z-50">
        SKOR: {score}
      </div>

      <button
        onClick={onClose}
        className="fixed top-5 right-5 z-50 bg-white p-2 rounded-full shadow-lg"
      >
        <XCircle className="text-red-500 w-8 h-8" />
      </button>

      {!isPlaying && isLoaded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <button
            onClick={() => setIsPlaying(true)}
            className="bg-orange-500 text-white px-12 py-6 rounded-3xl text-4xl font-black flex gap-4 items-center shadow-2xl hover:scale-105 transition"
          >
            <Play size={40} fill="currentColor" /> BAŞLA
          </button>
        </div>
      )}
    </div>
  );
            }
