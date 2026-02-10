import { useState, useEffect, useRef } from "react";
import { XCircle, Play } from "lucide-react";

import { loadAssets, AssetLibrary } from "./Assets";
import { PhysicsEngine, WORLD_WIDTH, WORLD_HEIGHT, SEA_LEVEL } from "./Physics";
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

  // 1) ORYANTASYON
  useEffect(() => {
    const checkOrientation = () => setIsLandscape(window.innerWidth > window.innerHeight);
    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    return () => window.removeEventListener("resize", checkOrientation);
  }, []);

  // 2) LOAD
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

  // 4) LOOP
  useEffect(() => {
    if (!isPlaying || !isLoaded || !canvasRef.current || !assets.current) return;

    renderer.current = new GameRenderer(canvasRef.current);

    const loop = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const w = Math.max(1, canvas.clientWidth);
      const h = Math.max(1, canvas.clientHeight);

      renderer.current?.resize(w, h);

      physics.current.updateFish(fish.current as any, mousePos.current.x, mousePos.current.y);

      // Kamera takip
      const targetCamX = fish.current.x;
      const targetCamY = fish.current.y;

      camera.current.x += (targetCamX - camera.current.x) * 0.1;
      camera.current.y += (targetCamY - camera.current.y) * 0.1;

      // ✅ Çok sıkma — daha rahat gezsin
      const marginX = 150;
      const topExtra = 900;  // daha yukarı görsün
      const bottomMargin = 80;

      camera.current.x = Math.max(marginX, Math.min(WORLD_WIDTH - marginX, camera.current.x));
      camera.current.y = Math.max(SEA_LEVEL - topExtra, Math.min(WORLD_HEIGHT - bottomMargin, camera.current.y));

      // 2D çizim (balık/target)
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
    // ✅ bg-black YOK. 3D arkayı görmemiz lazım.
    <div className="fixed inset-0 overflow-hidden">
      {/* 3D Background */}
      <div className="absolute inset-0 z-0">
        <DenizBackground camera={camera} />
      </div>

      {/* 2D Canvas üstte */}
      {isLoaded ? (
        <>
          <canvas
            ref={canvasRef}
            className="absolute inset-0 z-10 w-full h-full block touch-none"
            style={{ background: "transparent" }}
            onMouseMove={handleInput}
            onTouchMove={handleInput}
            onClick={handleInput}
          />

          <button onClick={onClose} className="fixed top-5 right-5 z-50 bg-white p-2 rounded-full">
            <XCircle className="text-red-500" />
          </button>

          {!isPlaying && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <button
                onClick={() => setIsPlaying(true)}
                className="bg-orange-500 text-white px-8 py-4 rounded-xl text-2xl font-bold flex gap-2"
              >
                <Play /> BAŞLA
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="absolute inset-0 z-50 flex items-center justify-center text-white text-xl animate-pulse">
          YÜKLENİYOR...
        </div>
      )}
    </div>
  );
}
