// eslemegame.tsx
import { useState, useEffect, useRef } from "react";
import { XCircle, Play } from "lucide-react";

import { loadAssets, AssetLibrary } from "./Assets";
import { PhysicsEngine, WORLD_WIDTH, WORLD_HEIGHT } from "./Physics";
import { GameRenderer } from "./Renderer";

// ✅ 3D Background
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

  // ✅ Bu camera ref’i 2D renderer için de, 3D background için de kullanılacak
  const camera = useRef({ x: 1500, y: 800 });

  const mousePos = useRef({ x: 1500, y: 800 });
  const targets = useRef<any[]>([]);
  const reqRef = useRef<number>();

  // 1) Orientation
  useEffect(() => {
    const checkOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };
    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    return () => window.removeEventListener("resize", checkOrientation);
  }, []);

  // 2) Assets load
  useEffect(() => {
    let alive = true;
    const init = async () => {
      try {
        const lib = await loadAssets();
        if (!alive) return;
        assets.current = lib;
        setIsLoaded(true);
      } catch (e) {
        console.error("Asset load error:", e);
      }
    };
    init();
    return () => {
      alive = false;
    };
  }, []);

  // 3) Input
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

  // 4) Game loop
  useEffect(() => {
    if (!isPlaying || !isLoaded || !canvasRef.current || !assets.current) return;

    renderer.current = new GameRenderer(canvasRef.current);

    const loop = () => {
      if (!canvasRef.current) return;

      const w = canvasRef.current.clientWidth;
      const h = canvasRef.current.clientHeight;

      renderer.current?.resize(w, h);

      // Physics
      physics.current.updateFish(
        fish.current,
        mousePos.current.x,
        mousePos.current.y
      );

      // Camera follow
      const targetCamX = Math.max(w / 2, Math.min(WORLD_WIDTH - w / 2, fish.current.x));
      const targetCamY = Math.max(h / 2, Math.min(WORLD_HEIGHT - h / 2, fish.current.y));

      camera.current.x += (targetCamX - camera.current.x) * 0.1;
      camera.current.y += (targetCamY - camera.current.y) * 0.1;

      // Draw (senin mevcut 2D çizimin)
      renderer.current?.draw(assets.current!, fish.current, camera.current, targets.current);

      reqRef.current = requestAnimationFrame(loop);
    };

    reqRef.current = requestAnimationFrame(loop);

    return () => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, [isPlaying, isLoaded]);

  // Orientation screen
  if (!isLandscape) {
    return (
      <div className="fixed inset-0 bg-black text-white flex items-center justify-center text-2xl font-bold p-10 text-center">
        LÜTFEN TELEFONU YAN ÇEVİRİN ↻
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* ✅ 3D BACKGROUND (en altta) */}
      <div
        className="absolute inset-0 z-0"
        style={{
          pointerEvents: "none", // ✅ en kritik: dokunma/klik 3D’yi yakalamasın
        }}
      >
        <DenizBackground
          worldCameraRef={camera}
          worldWidth={WORLD_WIDTH}
          worldHeight={WORLD_HEIGHT}
        />
      </div>

      {/* ✅ 2D GAME CANVAS (üstte) */}
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
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="text-white text-xl animate-pulse">YÜKLENİYOR...</div>
          </div>
        )}
      </div>
    </div>
  );
      }
