// client/src/aba/esle/game/eslemegame.tsx
import { useState, useEffect, useRef } from "react";
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

  // Oyun Durumu
  const fish = useRef({
    x: 2000,
    y: 700,
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
  const targets = useRef<any[]>([]);
  const reqRef = useRef<number>();

  // ✅ Pointer ile hedef
  const pointerDownRef = useRef(false);
  const targetRef = useRef({ x: fish.current.x, y: fish.current.y });

  // 1) Orientation
  useEffect(() => {
    const checkOrientation = () => setIsLandscape(window.innerWidth > window.innerHeight);
    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    return () => window.removeEventListener("resize", checkOrientation);
  }, []);

  // 2) Load assets
  useEffect(() => {
    const init = async () => {
      assets.current = await loadAssets();
      setIsLoaded(true);
    };
    init();
  }, []);

  // ✅ dünya koordinatına çevir
  const setWorldTargetFromClient = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;

    const w = canvas.width;
    const h = canvas.height;

    // ekran merkezine göre dünya noktası
    targetRef.current.x = camera.current.x + (sx - w / 2);
    targetRef.current.y = camera.current.y + (sy - h / 2);
  };

  // ✅ Pointer Events (Android WebView’de en stabil)
  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPlaying) return;
    pointerDownRef.current = true;
    (e.currentTarget as any).setPointerCapture?.(e.pointerId);
    setWorldTargetFromClient(e.clientX, e.clientY);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPlaying) return;
    // ister basılı ister değil, hareket ettikçe hedefi güncelle
    setWorldTargetFromClient(e.clientX, e.clientY);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    pointerDownRef.current = false;
    (e.currentTarget as any).releasePointerCapture?.(e.pointerId);
  };

  // 3) Game loop
  useEffect(() => {
    if (!isPlaying || !isLoaded || !canvasRef.current || !assets.current) return;

    renderer.current = new GameRenderer(canvasRef.current);

    const loop = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // resize (canvas width/height = gerçek piksel)
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      renderer.current?.resize(w, h);

      // ✅ Fizik: hedefi targetRef’ten al
      physics.current.updateFish(
        fish.current as any,
        targetRef.current.x,
        targetRef.current.y
      );

      // ✅ Kamera: balığı takip (WORLD içinde clamp)
      const halfW = w / 2;
      const halfH = h / 2;

      const maxX = WORLD_WIDTH - halfW;
      const maxY = WORLD_HEIGHT - halfH;

      const targetCamX = Math.max(halfW, Math.min(maxX, fish.current.x));
      const targetCamY = Math.max(halfH, Math.min(maxY, fish.current.y));

      camera.current.x += (targetCamX - camera.current.x) * 0.12;
      camera.current.y += (targetCamY - camera.current.y) * 0.12;

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
    <div className="fixed inset-0 overflow-hidden bg-black">
      {/* 3D arkada */}
      <div className="absolute inset-0">
        <DenizBackground />
      </div>

      {/* 2D üstte */}
      {isLoaded ? (
        <>
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full block"
            style={{
              background: "transparent",
              touchAction: "none", // ✅ çok kritik
              WebkitUserSelect: "none",
              userSelect: "none",
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          />

          <button onClick={onClose} className="fixed top-5 right-5 z-50 bg-white p-2 rounded-full">
            <XCircle className="text-red-500" />
          </button>

          {!isPlaying && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
              <button
                onClick={() => {
                  // ✅ Başlayınca hedefi balığa eşitle (zıplamasın)
                  targetRef.current.x = fish.current.x;
                  targetRef.current.y = fish.current.y;
                  camera.current.x = fish.current.x;
                  camera.current.y = fish.current.y;
                  setIsPlaying(true);
                }}
                className="bg-orange-500 text-white px-8 py-4 rounded-xl text-2xl font-bold flex gap-2"
              >
                <Play /> BAŞLA
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-white text-xl animate-pulse">
          YÜKLENİYOR...
        </div>
      )}
    </div>
  );
}
