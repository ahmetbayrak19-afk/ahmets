// EslemeGame.tsx
import { useState, useEffect, useRef } from "react";
import { XCircle, Play } from "lucide-react";

import DenizBackground from "./DenizBackground";

import { loadAssets, AssetLibrary } from "./Assets";
import { PhysicsEngine, WORLD_WIDTH, WORLD_HEIGHT } from "./Physics";
import { GameRenderer } from "./Renderer";

export default function EslemeGame({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLandscape, setIsLandscape] = useState(true);

  // 3D durum
  const [bg3dOk, setBg3dOk] = useState(false);
  const [bg3dFailed, setBg3dFailed] = useState(false);

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

  // 1) EKRAN YÖNÜ
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

  // 4) OYUN LOOP
  useEffect(() => {
    if (!isPlaying || !isLoaded || !canvasRef.current || !assets.current) return;

    renderer.current = new GameRenderer(canvasRef.current);

    const loop = () => {
      if (!canvasRef.current) return;
      const w = canvasRef.current.clientWidth;
      const h = canvasRef.current.clientHeight;

      renderer.current?.resize(w, h);

      // Fizik
      physics.current.updateFish(fish.current, mousePos.current.x, mousePos.current.y);

      // Kamera
      const targetCamX = Math.max(w / 2, Math.min(WORLD_WIDTH - w / 2, fish.current.x));
      const targetCamY = Math.max(h / 2, Math.min(WORLD_HEIGHT - h / 2, fish.current.y));

      camera.current.x += (targetCamX - camera.current.x) * 0.1;
      camera.current.y += (targetCamY - camera.current.y) * 0.1;

      // 2D çizim (üstte transparan)
      renderer.current?.draw(assets.current!, fish.current, camera.current, targets.current);

      reqRef.current = requestAnimationFrame(loop);
    };

    reqRef.current = requestAnimationFrame(loop);
    return () => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, [isPlaying, isLoaded]);

  const safeClose = () => {
    try {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    } catch {}
    onClose();
  };

  if (!isLandscape) {
    return (
      <div className="fixed inset-0 bg-black text-white flex items-center justify-center text-2xl font-bold p-10 text-center">
        LÜTFEN TELEFONU YAN ÇEVİRİN ↻
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* 3D arkaplan (Firebase Storage) */}
      {!bg3dFailed && (
        <DenizBackground
          storagePath="deniz.glb" // ✅ root’a attığın dosya
          onReady={() => setBg3dOk(true)}
          onCrash={(e) => {
            console.log("3D crash:", e);
            setBg3dFailed(true); // ✅ 3D kapat, 2D devam et
          }}
        />
      )}

      {/* 2D canvas */}
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

            <button onClick={safeClose} className="fixed top-5 right-5 z-50 bg-white p-2 rounded-full">
              <XCircle className="text-red-500" />
            </button>

            {/* Debug küçük etiket */}
            <div className="fixed bottom-3 left-3 z-50 text-[11px] font-mono bg-black/50 text-white px-2 py-1 rounded">
              3D: {bg3dFailed ? "FAILED" : bg3dOk ? "READY" : "LOADING"} · 2D: READY
            </div>

            {!isPlaying && (
              <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
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
          <div className="absolute inset-0 z-20 flex items-center justify-center text-white text-xl animate-pulse">
            YÜKLENİYOR...
          </div>
        )}
      </div>
    </div>
  );
      }
