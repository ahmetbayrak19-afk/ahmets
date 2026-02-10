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

  const assets = useRef<AssetLibrary | null>(null);
  const physics = useRef(new PhysicsEngine());
  const renderer = useRef<GameRenderer | null>(null);
  const reqRef = useRef<number>();

  // Balık Başlangıçta tam ortada
  const fish = useRef({
    x: WORLD_WIDTH / 2,
    y: WORLD_HEIGHT / 2,
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

  // Kamera da tam balığın olduğu yerde başlasın
  const camera = useRef({ x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 });
  const mousePos = useRef({ x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 });

  useEffect(() => {
    loadAssets().then((loaded) => {
      assets.current = loaded;
      setIsLoaded(true);
    });
  }, []);

  const handleInput = (e: any) => {
    if (!isPlaying || !canvasRef.current) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const rect = canvasRef.current.getBoundingClientRect();
    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;
    
    const w = canvasRef.current.clientWidth;
    const h = canvasRef.current.clientHeight;

    // 🔥 KRİTİK NOKTA: Mouse pozisyonu hesaplanırken kameranın güncel yerini ekliyoruz
    // Böylece kamera kaydıkça hedefimiz de ileri gidiyor.
    mousePos.current.x = camera.current.x + (screenX - w / 2);
    mousePos.current.y = camera.current.y + (screenY - h / 2);
  };

  useEffect(() => {
    if (!isPlaying || !isLoaded || !canvasRef.current) return;

    renderer.current = new GameRenderer(canvasRef.current);

    const loop = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      renderer.current?.resize(w, h);

      // 1. Fizik Güncelle
      physics.current.updateFish(fish.current as any, mousePos.current.x, mousePos.current.y);

      // 2. KAMERA TAKİBİ (Yumuşak Geçiş)
      // Balık nereye, kamera oraya. 
      // 0.1 değeri takip hızını belirler (daha yüksek = daha sıkı takip)
      camera.current.x += (fish.current.x - camera.current.x) * 0.1;
      camera.current.y += (fish.current.y - camera.current.y) * 0.1;

      // 3. Çizim
      if (assets.current) {
        renderer.current?.draw(assets.current, fish.current as any, camera.current);
      }

      reqRef.current = requestAnimationFrame(loop);
    };

    reqRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(reqRef.current!);
  }, [isPlaying, isLoaded]);

  return (
    <div className="fixed inset-0 bg-black overflow-hidden select-none touch-none">
      
      {/* ARKAPLAN */}
      <div className="absolute inset-0 z-0">
        <DenizBackground cameraRef={camera} />
      </div>

      {/* OYUN ALANI */}
      <div className="absolute inset-0 z-10">
        {isLoaded ? (
          <>
            <canvas
              ref={canvasRef}
              className="w-full h-full block cursor-crosshair"
              onMouseMove={handleInput}
              onTouchMove={handleInput}
              onMouseDown={(e) => {
                  handleInput(e);
                  fish.current.state = "EAT";
              }}
              onMouseUp={() => fish.current.state = "SWIM"}
            />
            <button onClick={onClose} className="fixed top-6 right-6 z-50 bg-white/20 backdrop-blur p-3 rounded-full">
              <XCircle className="text-white w-8 h-8" />
            </button>
            {!isPlaying && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <button
                  onClick={() => setIsPlaying(true)}
                  className="bg-orange-500 text-white px-10 py-5 rounded-2xl text-3xl font-black animate-bounce flex gap-2"
                >
                  <Play size={32} /> BAŞLA
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-white animate-pulse">
            YÜKLENİYOR...
          </div>
        )}
      </div>
    </div>
  );
}
  
