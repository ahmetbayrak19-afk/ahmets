// eslemegame.tsx
import React, { useEffect, useRef, useState } from "react";
import { XCircle, Play } from "lucide-react";

import { loadAssets, AssetLibrary } from "./Assets";
import { PhysicsEngine, WORLD_WIDTH, WORLD_HEIGHT } from "./Physics";
import { GameRenderer } from "./Renderer";
import DenizBackground from "./DenizBackground";

type Crash = {
  where: string;
  message: string;
  stack?: string;
  extra?: string;
};

class BgErrorBoundary extends React.Component<
  { onCrash: (c: Crash) => void; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any) {
    const c: Crash = {
      where: "ErrorBoundary(3D)",
      message: String(error?.message || error),
      stack: String(error?.stack || ""),
    };
    this.props.onCrash(c);
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children as any;
  }
}

function CrashOverlay({ crash, onClose }: { crash: Crash; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 text-white p-4 overflow-auto">
      <div className="max-w-3xl mx-auto space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-red-400 font-black text-lg">CRASH RAPORU</div>
          <button
            onClick={onClose}
            className="px-3 py-2 rounded-lg bg-white/10 border border-white/10"
          >
            Kapat
          </button>
        </div>

        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
          <div className="text-xs opacity-70">where</div>
          <div className="font-mono text-sm break-words">{crash.where}</div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-3">
          <div className="text-xs opacity-70">message</div>
          <div className="font-mono text-sm break-words">{crash.message}</div>
        </div>

        {crash.extra && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <div className="text-xs opacity-70">extra</div>
            <div className="font-mono text-sm break-words">{crash.extra}</div>
          </div>
        )}

        {crash.stack && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <div className="text-xs opacity-70">stack</div>
            <pre className="font-mono text-xs whitespace-pre-wrap break-words">
              {crash.stack}
            </pre>
          </div>
        )}

        <div className="text-xs opacity-60">
          Not: Stack içinde dosya/satır görürsün. Eğer minify yüzünden karışık çıkarsa,
          en azından “hangi modul” patlıyor anlayacağız.
        </div>
      </div>
    </div>
  );
}

export default function EslemeGame({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLandscape, setIsLandscape] = useState(true);

  const [bg3dReady, setBg3dReady] = useState(false);
  const [bg3dFailed, setBg3dFailed] = useState(false);

  const [crash, setCrash] = useState<Crash | null>(null);

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

  // ✅ Global crash yakalama
  useEffect(() => {
    const onErr = (event: any) => {
      // event: ErrorEvent
      setCrash({
        where: "window.onerror",
        message: String(event?.message || "unknown error"),
        stack: String(event?.error?.stack || ""),
        extra: `${event?.filename || ""}:${event?.lineno || ""}:${event?.colno || ""}`,
      });
    };

    const onRej = (event: any) => {
      const reason = event?.reason;
      setCrash({
        where: "unhandledrejection",
        message: String(reason?.message || reason || "promise rejected"),
        stack: String(reason?.stack || ""),
      });
    };

    window.addEventListener("error", onErr);
    window.addEventListener("unhandledrejection", onRej);

    return () => {
      window.removeEventListener("error", onErr);
      window.removeEventListener("unhandledrejection", onRej);
    };
  }, []);

  // Orientation
  useEffect(() => {
    const check = () => setIsLandscape(window.innerWidth > window.innerHeight);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Assets load (hata raporu)
  useEffect(() => {
    const init = async () => {
      try {
        assets.current = await loadAssets();
        setIsLoaded(true);
      } catch (e: any) {
        setCrash({
          where: "loadAssets()",
          message: String(e?.message || e),
          stack: String(e?.stack || ""),
        });
      }
    };
    init();
  }, []);

  const handleInput = (e: any) => {
    if (!isPlaying || !canvasRef.current) return;

    let clientX: number, clientY: number;
    if (e.touches?.length) {
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

  // Loop (try/catch ile)
  useEffect(() => {
    if (!isPlaying || !isLoaded || !canvasRef.current || !assets.current) return;

    try {
      renderer.current = new GameRenderer(canvasRef.current);
    } catch (e: any) {
      setCrash({
        where: "new GameRenderer()",
        message: String(e?.message || e),
        stack: String(e?.stack || ""),
      });
      return;
    }

    const loop = () => {
      try {
        if (!canvasRef.current) return;

        const w = canvasRef.current.clientWidth;
        const h = canvasRef.current.clientHeight;
        renderer.current?.resize(w, h);

        physics.current.updateFish(fish.current as any, mousePos.current.x, mousePos.current.y);

        const targetCamX = Math.max(w / 2, Math.min(WORLD_WIDTH - w / 2, fish.current.x));
        const targetCamY = Math.max(h / 2, Math.min(WORLD_HEIGHT - h / 2, fish.current.y));

        camera.current.x += (targetCamX - camera.current.x) * 0.1;
        camera.current.y += (targetCamY - camera.current.y) * 0.1;

        // Normal draw
        // Eğer burada patlıyorsa crash overlay gösterecek
        renderer.current?.draw(assets.current!, fish.current as any, camera.current, targets.current);

        reqRef.current = requestAnimationFrame(loop);
      } catch (e: any) {
        setCrash({
          where: "loop() / renderer.draw()",
          message: String(e?.message || e),
          stack: String(e?.stack || ""),
        });
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
    <div className="fixed inset-0 overflow-hidden" style={{ background: "#87CEEB" }}>
      {crash && <CrashOverlay crash={crash} onClose={() => setCrash(null)} />}

      {/* 3D */}
      {!bg3dFailed && (
        <BgErrorBoundary
          onCrash={(c) => {
            setBg3dFailed(true);
            setCrash(c);
          }}
        >
          <DenizBackground
            onReady={() => setBg3dReady(true)}
            onCrash={(c) => {
              setBg3dFailed(true);
              setCrash(c);
            }}
          />
        </BgErrorBoundary>
      )}

      {/* 2D */}
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
          <div className="absolute inset-0 z-20 flex items-center justify-center text-white text-xl animate-pulse">
            YÜKLENİYOR...
          </div>
        )}
      </div>

      {/* Debug mini status */}
      <div className="fixed bottom-2 left-2 z-[60] text-[10px] font-mono bg-black/40 text-white/80 px-2 py-1 rounded">
        3D: {bg3dFailed ? "FAILED" : bg3dReady ? "READY" : "LOADING"} · 2D: {isLoaded ? "READY" : "LOADING"}
      </div>
    </div>
  );
    }
