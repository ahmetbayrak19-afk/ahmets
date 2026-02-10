// eslemegame.tsx
import { useState, useEffect, useRef, useCallback } from "react";
import { XCircle, Play } from "lucide-react";

import { loadAssets, AssetLibrary } from "./Assets";
import { PhysicsEngine, WORLD_WIDTH, WORLD_HEIGHT } from "./Physics";
import { GameRenderer } from "./Renderer";

// 3D BG
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

  // Oyun Durumu
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

  const camera = useRef({ x: 1500, y: 800 });
  const mousePos = useRef({ x: 1500, y: 800 });
  const targets = useRef<any[]>([]);
  const reqRef = useRef<number>();

  // 1) Orientation
  useEffect(() => {
    const check = () => setIsLandscape(window.innerWidth > window.innerHeight);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // 2) Load assets
  useEffect(() => {
    const init = async () => {
      assets.current = await loadAssets();
      setIsLoaded(true);
    };
    init();
  }, []);

  // INPUT: wrapper’dan yakala (en garanti)
  const handlePointer = useCallback((clientX: number, clientY: number) => {
    const c = canvasRef.current;
    if (!isPlaying || !c) return;

    const rect = c.getBoundingClientRect();
    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;

    const w = c.width || c.clientWidth;
    const h = c.height || c.clientHeight;

    mousePos.current.x = camera.current.x + (screenX - w / 2);
    mousePos.current.y = camera.current.y + (screenY - h / 2);
  }, [isPlaying]);

  const onPointerMove = (e: any) => {
    if (e.touches && e.touches.length) {
      handlePointer(e.touches[0].clientX, e.touches[0].clientY);
    } else {
      handlePointer(e.clientX, e.clientY);
    }
  };

  // 4) Game loop
  useEffect(() => {
    if (!isPlaying || !isLoaded || !canvasRef.current || !assets.current) return;

    renderer.current = new GameRenderer(canvasRef.current);

    const loop = () => {
      const c = canvasRef.current;
      if (!c) return;

      // IMPORTANT: clientWidth/Height 0 olmasın diye fallback
      const w = c.clientWidth || window.innerWidth;
      const h = c.clientHeight || window.innerHeight;

      renderer.current?.resize(w, h);

      // Physics
      physics.current.updateFish(
        fish.current as any,
        mousePos.current.x,
        mousePos.current.y
      );

      // Camera follow
      const halfW = w / 2;
      const halfH = h / 2;
      const maxX = Math.max(halfW, WORLD_WIDTH - halfW);
      const maxY = Math.max(halfH, WORLD_HEIGHT - halfH);

      const targetCamX = Math.max(halfW, Math.min(maxX, fish.current.x));
      const targetCamY = Math.max(halfH, Math.min(maxY, fish.current.y));

      camera.current.x += (targetCamX - camera.current.x) * 0.12;
      camera.current.y += (targetCamY - camera.current.y) * 0.12;

      // Draw 2D fish/targets only (zemin/su/ot artık Renderer’da kaldırılmış olmalı)
      renderer.current?.draw(assets.current!, fish.current as any, camera.current, targets.current);

      reqRef.current = requestAnimationFrame(loop);
    };

    reqRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(reqRef.current!);
  }, [isPlaying, isLoaded]);

  if (!isLandscape) {
    return (
      <div className="fixed inset-0 bg-black text-white flex items-center justify-center text-2xl font-bold p-10 text-center">
        LÜTFEN TELEFONU YAN ÇEVİRİN ↻
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black overflow-hidden"
      onMouseMove={onPointerMove}
      onTouchMove={onPointerMove}
      onTouchStart={onPointerMove}
      onClick={onPointerMove}
    >
      {/* 3D ARKAPLAN (ARKADA, INPUT YOK) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <DenizBackground camera={camera.current} />
      </div>

      {/* 2D OYUN CANVAS (ÜSTTE) */}
      {isLoaded ? (
        <>
          <canvas
            ref={canvasRef}
            className="absolute inset-0 z-10 w-full h-full block touch-none"
          />

          <button
            onClick={onClose}
            className="fixed top-5 right-5 z-50 bg-white p-2 rounded-full"
          >
            <XCircle className="text-red-500" />
          </button>

          {!isPlaying && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
              <button
                onClick={() => setIsPlaying(true)}
                className="bg-orange-500 text-white px-8 py-4 rounded-xl text-2xl font-bold flex gap-2 active:scale-95"
              >
                <Play /> BAŞLA
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="absolute inset-0 z-20 flex items-center justify-center text-white text-xl animate-pulse">
          YÜKLENİYOR...
        </div>
      )}
    </div>
  );
}
