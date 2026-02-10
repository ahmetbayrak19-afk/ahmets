// eslemegame.tsx
import { useState, useEffect, useRef } from "react";
import { XCircle, Play } from "lucide-react";

import { loadAssets, AssetLibrary } from "./Assets";
import { PhysicsEngine, WORLD_WIDTH, WORLD_HEIGHT } from "./Physics";
import { GameRenderer } from "./Renderer";

export default function EslemeGame({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLandscape, setIsLandscape] = useState(true);

  // Motor
  const assets = useRef<AssetLibrary | null>(null);
  const physics = useRef(new PhysicsEngine());
  const renderer = useRef<GameRenderer | null>(null);

  // Oyun Durumu
  const fish = useRef({
    x: WORLD_WIDTH * 0.25,
    y: WORLD_HEIGHT * 0.55,
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

  const camera = useRef({ x: fish.current.x, y: fish.current.y });
  const mousePos = useRef({ x: fish.current.x, y: fish.current.y });
  const targets = useRef<any[]>([]);
  const reqRef = useRef<number>();

  // 1) EKRAN YÖNÜ KONTROLÜ
  useEffect(() => {
    const checkOrientation = () => setIsLandscape(window.innerWidth > window.innerHeight);
    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    return () => window.removeEventListener("resize", checkOrientation);
  }, []);

  // 2) YÜKLEME
  useEffect(() => {
    const init = async () => {
      assets.current = await loadAssets();
      setIsLoaded(true);
    };
    init();
  }, []);

  // 3) INPUT
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

    const w = canvasRef.current.width;
    const h = canvasRef.current.height;

    mousePos.current.x = camera.current.x + (screenX - w / 2);
    mousePos.current.y = camera.current.y + (screenY - h / 2);
  };

  // 4) OYUN DÖNGÜSÜ
  useEffect(() => {
    if (!isPlaying || !isLoaded || !canvasRef.current || !assets.current) return;

    renderer.current = new GameRenderer(canvasRef.current);

    const loop = () => {
      const c = canvasRef.current;
      if (!c) return;

      const w = c.clientWidth;
      const h = c.clientHeight;

      renderer.current?.resize(w, h);

      // Fizik
      physics.current.updateFish(fish.current as any, mousePos.current.x, mousePos.current.y);

      // Kamera Takibi (daha hızlı takip = “kısıtlı” hissi azalır)
      const targetCamX = Math.max(w / 2, Math.min(WORLD_WIDTH - w / 2, fish.current.x));
      const targetCamY = Math.max(h / 2, Math.min(WORLD_HEIGHT - h / 2, fish.current.y));

      camera.current.x += (targetCamX - camera.current.x) * 0.18;
      camera.current.y += (targetCamY - camera.current.y) * 0.18;

      // Çizim
      renderer.current?.draw(assets.current!, fish.current as any, camera.current, targets.current);

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
    <div className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden">
      {isLoaded ? (
        <>
          <canvas
            ref={canvasRef}
            className="w-full h-full block touch-none"
            onMouseMove={handleInput}
            onTouchMove={handleInput}
            onClick={handleInput}
          />

          <button onClick={onClose} className="fixed top-5 right-5 z-50 bg-white p-2 rounded-full">
            <XCircle className="text-red-500" />
          </button>

          {!isPlaying && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
              <button
                onClick={() => setIsPlaying(true)}
                className="bg-orange-500 text-white px-8 py-4 rounded-xl text-2xl font-bold flex gap-2 items-center"
              >
                <Play /> BAŞLA
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-white text-xl animate-pulse">YÜKLENİYOR...</div>
      )}
    </div>
  );
}
