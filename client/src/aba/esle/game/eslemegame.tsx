import { useEffect, useRef, useState } from "react";
import { XCircle, Play } from "lucide-react";

import { loadAssets, AssetLibrary } from "./Assets";
import { PhysicsEngine, WORLD_WIDTH, WORLD_HEIGHT } from "./Physics";
import { GameRenderer } from "./Renderer";
import DenizBackground from "./DenizBackground";

export default function EslemeGame({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // States
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Refs (Oyun Motoru İçin)
  const assets = useRef<AssetLibrary | null>(null);
  const physics = useRef(new PhysicsEngine());
  const renderer = useRef<GameRenderer | null>(null);
  const reqRef = useRef<number>();

  // Balık Başlangıç Pozisyonu (Ortada başlasın)
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

  // Kamera ve Mouse
  const camera = useRef({ x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 });
  const mousePos = useRef({ x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 });

  // 1. Varlıkları Yükle
  useEffect(() => {
    loadAssets().then((loaded) => {
        assets.current = loaded;
        setIsLoaded(true);
    });
  }, []);

  // 2. Input (Dokunma / Mouse)
  const handleInput = (e: any) => {
    if (!isPlaying || !canvasRef.current) return;
    
    // Dokunma veya Mouse koordinatını al
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const rect = canvasRef.current.getBoundingClientRect();
    
    // Ekran koordinatını DÜNYA koordinatına çevir (Kamera pozisyonunu ekleyerek)
    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;
    
    const w = canvasRef.current.clientWidth;
    const h = canvasRef.current.clientHeight;

    // Balığın gitmesi gereken dünya koordinatı
    mousePos.current.x = camera.current.x + (screenX - w / 2);
    mousePos.current.y = camera.current.y + (screenY - h / 2);
  };

  // 3. OYUN DÖNGÜSÜ (Game Loop)
  useEffect(() => {
    if (!isPlaying || !isLoaded || !canvasRef.current) return;

    renderer.current = new GameRenderer(canvasRef.current);

    const loop = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Ekran boyutunu güncelle
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      renderer.current?.resize(w, h);

      // FİZİK GÜNCELLE
      physics.current.updateFish(fish.current as any, mousePos.current.x, mousePos.current.y);

      // KAMERA GÜNCELLE (Yumuşak Takip)
      // Hedef: Balığı merkeze al ama dünya sınırlarını aşma
      let targetCamX = fish.current.x;
      let targetCamY = fish.current.y;

      // Sınır Kontrolü (Kamera boşluğu göstermesin)
      // targetCamX = Math.max(w / 2, Math.min(WORLD_WIDTH - w / 2, targetCamX));
      // targetCamY = Math.max(h / 2, Math.min(WORLD_HEIGHT - h / 2, targetCamY));

      // Lerp (Yumuşak geçiş)
      camera.current.x += (targetCamX - camera.current.x) * 0.1;
      camera.current.y += (targetCamY - camera.current.y) * 0.1;

      // ÇİZİM YAP
      if(assets.current) {
         renderer.current?.draw(assets.current, fish.current as any, camera.current);
      }

      reqRef.current = requestAnimationFrame(loop);
    };

    reqRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(reqRef.current!);
  }, [isPlaying, isLoaded]);

  return (
    <div className="fixed inset-0 bg-black overflow-hidden select-none touch-none">
      
      {/* 3D ARKA PLAN (En altta) */}
      <div className="absolute inset-0 z-0">
        <DenizBackground cameraRef={camera} />
      </div>

      {/* 2D OYUN KATMANI (Üstte) */}
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
                        // Tıklayınca hızlanma efekti (Boost)
                        fish.current.state = "EAT"; // Ağzını açsın
                    }}
                    onMouseUp={() => fish.current.state = "SWIM"}
                />

                <button onClick={onClose} className="fixed top-6 right-6 z-50 bg-white/20 backdrop-blur p-3 rounded-full hover:bg-white/40 transition">
                    <XCircle className="text-white w-8 h-8" />
                </button>

                {!isPlaying && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <button
                            onClick={() => setIsPlaying(true)}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-10 py-5 rounded-2xl text-3xl font-black flex gap-3 shadow-2xl animate-bounce"
                        >
                            <Play size={32} /> YÜZMEYE BAŞLA
                        </button>
                    </div>
                )}
            </>
        ) : (
            <div className="flex items-center justify-center h-full text-white font-bold animate-pulse">
                OKYANUS HAZIRLANIYOR...
            </div>
        )}
      </div>
    </div>
  );
}
