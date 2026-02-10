// client/src/aba/esle/game/EslemeGame.tsx
import { useEffect, useRef, useState } from "react";
import { XCircle, Play } from "lucide-react";

import { loadAssets, AssetLibrary } from "./Assets";
import { PhysicsEngine, WORLD_WIDTH, WORLD_HEIGHT } from "./Physics";
import { GameRenderer } from "./Renderer";
import DenizBackground from "./DenizBackground";

export default function EslemeGame({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLandscape, setIsLandscape] = useState(true);

  // Motor
  const assets = useRef<AssetLibrary | null>(null);
  const physics = useRef(new PhysicsEngine());
  const renderer = useRef<GameRenderer | null>(null);

  // Oyun durumu
  const fish = useRef({
    x: 1500,
    y: 800,
    vx: 0,
    vy: 0,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    frame: 0,
    timer: 0,
    state: "SWIM" as any,
    lastDirection: 1 as any,
  });

  // ✅ Kamera world koordinatı (bu ref 3D’ye de gidecek)
  const camera = useRef({ x: 1500, y: 800 });

  const mousePos = useRef({ x: 1500, y: 800 });
  const targets = useRef<any[]>([]);
  const reqRef = useRef<number>();

  // 1) Orientation kontrol
  useEffect(() => {
    const check = () => setIsLandscape(window.innerWidth > window.innerHeight);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // 2) Asset yükle
  useEffect(() => {
    const init = async () => {
      assets.current = await loadAssets();
      setIsLoaded(true);
    };
    init();
  }, []);

  // 3) Input → mousePos world koordinatı
  const handleInput = (e: any) => {
    if (!isPlaying || !canvasRef.current) return;

    let clientX: number, clientY: number;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;

    const w = canvasRef.current.clientWidth;
    const h = canvasRef.current.clientHeight;

    // Screen -> World
    mousePos.current.x = camera.current.x + (screenX - w / 2);
    mousePos.current.y = camera.current.y + (screenY - h / 2);
  };

  // 4) Game loop
  useEffect(() => {
    if (!isPlaying || !isLoaded || !canvasRef.current || !assets.current) return;

    renderer.current = new GameRenderer(canvasRef.current);

    const loop = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      renderer.current?.resize(w, h);

      // Fizik: balığı hedefe sür
      physics.current.updateFish(fish.current, mousePos.current.x, mousePos.current.y);

      // Kamera: balığı takip et (world sınırlarına clamp)
      const targetCamX = Math.max(w / 2, Math.min(WORLD_WIDTH - w / 2, fish.current.x));
      const targetCamY = Math.max(h / 2, Math.min(WORLD_HEIGHT - h / 2, fish.current.y));

      camera.current.x += (targetCamX - camera.current.x) * 0.10;
      camera.current.y += (targetCamY - camera.current.y) * 0.10;

      // Çizim (artık transparan: sadece balık)
      renderer.current?.draw(assets.current!, fish.current, camera.current, targets.current);

      reqRef.current = requestAnimationFrame(loop);
    };

    reqRef.current = requestAnimationFrame(loop);
    return () => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, [isPlaying, isLoaded]);

  if (!isLandscape) {
    return (
      <div className="fixed inset-0 bg-black text-white flex items-center justify-center text-2xl font-bold p-10 text-center">
        LÜTFEN TELEFONU YAN ÇEVİRİN ↻
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* ✅ 3D ARKAPLAN */}
      <div className="absolute inset-0 z-0">
        {/* cameraRef ile bağlandı: artık 3D “dekor” değil, kamera ile akıyor */}
        <DenizBackground cameraRef={camera} />
      </div>

      {/* ✅ 2D CANVAS (transparan) */}
      <div className="absolute inset-0 z-10">
        {isLoaded ? (
          <>
            <canvas
              ref={canvasRef}
              className="w-full h-full block touch-none"
              onMouseMove={handleInput}
              onTouchMove={handleInput}
              onClick={handleInput}
            />

            <button
              onClick={onClose}
              className="fixed top-5 right-5 z-50 bg-white p-2 rounded-full"
            >
              <XCircle className="text-red-500" />
            </button>

            {!isPlaying && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                <button
                  onClick={() => setIsPlaying(true)}
                  className="bg-orange-500 text-white px-8 py-4 rounded-xl text-2xl font-bold flex gap-2 active:scale-95 transition"
                >
                  <Play /> BAŞLA
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white text-xl animate-pulse z-20">
            YÜKLENİYOR...
          </div>
        )}
      </div>
    </div>
  );
    }
