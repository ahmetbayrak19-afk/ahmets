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
  const [fatal, setFatal] = useState<string | null>(null);

  const assets = useRef<AssetLibrary | null>(null);
  const physics = useRef(new PhysicsEngine());
  const renderer = useRef<GameRenderer | null>(null);

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

  const reqRef = useRef<number>();

  useEffect(() => {
    const check = () => setIsLandscape(window.innerWidth > window.innerHeight);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const a = await loadAssets();
        assets.current = a;
        setIsLoaded(true);
      } catch (e: any) {
        setFatal("loadAssets patladı: " + (e?.message || String(e)));
      }
    };
    init();
  }, []);

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

    mousePos.current.x = camera.current.x + (screenX - w / 2);
    mousePos.current.y = camera.current.y + (screenY - h / 2);
  };

  useEffect(() => {
    if (!isPlaying || !isLoaded || !canvasRef.current || !assets.current) return;

    renderer.current = new GameRenderer(canvasRef.current);

    const loop = () => {
      try {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const w = canvas.clientWidth;
        const h = canvas.clientHeight;

        renderer.current?.resize(w, h);

        physics.current.updateFish(fish.current as any, mousePos.current.x, mousePos.current.y);

        const targetCamX = Math.max(w / 2, Math.min(WORLD_WIDTH - w / 2, fish.current.x));
        const targetCamY = Math.max(h / 2, Math.min(WORLD_HEIGHT - h / 2, fish.current.y));

        camera.current.x += (targetCamX - camera.current.x) * 0.1;
        camera.current.y += (targetCamY - camera.current.y) * 0.1;

        renderer.current?.draw(assets.current!, fish.current as any, camera.current);

        reqRef.current = requestAnimationFrame(loop);
      } catch (e: any) {
        setFatal("LOOP HATASI: " + (e?.message || String(e)));
      }
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
      {/* 3D */}
      <div className="absolute inset-0 z-0">
        <DenizBackground cameraRef={camera} />
      </div>

      {/* 2D */}
      <div className="absolute inset-0 z-10">
        {fatal && (
          <div className="absolute inset-0 z-[999] bg-black/80 text-white p-4 text-xs overflow-auto">
            <div className="font-black mb-2 text-red-300">FATAL</div>
            <pre className="whitespace-pre-wrap break-words">{fatal}</pre>
            <button
              onClick={onClose}
              className="mt-4 bg-white text-black px-4 py-2 rounded font-black"
            >
              KAPAT
            </button>
          </div>
        )}

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
