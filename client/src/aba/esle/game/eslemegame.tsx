import { useEffect, useRef, useState } from "react";
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

  // Motor
  const assets = useRef<AssetLibrary | null>(null);
  const physics = useRef(new PhysicsEngine());
  const renderer = useRef<GameRenderer | null>(null);

  // Oyun Durumu
  const fish = useRef({
    x: WORLD_WIDTH * 0.5,
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

  // 1) Orientation
  useEffect(() => {
    const check = () => setIsLandscape(window.innerWidth > window.innerHeight);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // 2) Assets
  useEffect(() => {
    const init = async () => {
      assets.current = await loadAssets();
      setIsLoaded(true);
    };
    init();
  }, []);

  // 3) Input (mouse/touch -> world coords)
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

    // camera merkezli world hedef
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

      // Fizik
      physics.current.updateFish(fish.current as any, mousePos.current.x, mousePos.current.y);

      // Kamera takibi: clamp’i genişlettim (sağ/sol “daha yeterli” olsun diye)
      // Balık dünya sınırında bile ekranın kenarına yapışmasın diye padding ekliyoruz.
      const padX = Math.min(400, w * 0.35);
      const padY = Math.min(300, h * 0.35);

      const minCamX = w / 2 - padX;
      const maxCamX = WORLD_WIDTH - (w / 2 - padX);

      const minCamY = h / 2 - padY;
      const maxCamY = WORLD_HEIGHT - (h / 2 - padY);

      const targetCamX = Math.max(minCamX, Math.min(maxCamX, fish.current.x));
      const targetCamY = Math.max(minCamY, Math.min(maxCamY, fish.current.y));

      camera.current.x += (targetCamX - camera.current.x) * 0.12;
      camera.current.y += (targetCamY - camera.current.y) * 0.12;

      // Çizim (SADECE balık + hedefler; arka plan yok!)
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
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* 3D ARKAPLAN */}
      <DenizBackground />

      {/* 2D ÜST KATMAN */}
      {isLoaded ? (
        <>
          <canvas
            ref={canvasRef}
            className="absolute inset-0 z-10 w-full h-full block touch-none"
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
                className="bg-orange-500 text-white px-8 py-4 rounded-xl text-2xl font-bold flex gap-2 active:scale-95 transition"
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
