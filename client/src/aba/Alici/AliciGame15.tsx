import React, { Suspense, useEffect, useMemo, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Environment, Html, OrbitControls, useGLTF } from "@react-three/drei";
import { ArrowLeft, MousePointer2, AlertCircle } from "lucide-react";

const MODEL_PATH =
  "https://firebasestorage.googleapis.com/v0/b/ogrencitakip-2a775.firebasestorage.app/o/human.glb?alt=media&token=7b979206-e91e-4e34-95ce-370e4c537998";

function Loader({ info }: { info: string }) {
  return (
    <Html center>
      <div className="flex flex-col items-center bg-white/90 p-4 rounded-xl shadow-xl max-w-[280px]">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-gray-800 font-bold text-sm">Model Yükleniyor…</p>
        <p className="text-[10px] text-gray-600 mt-2 whitespace-pre-wrap">{info}</p>
      </div>
    </Html>
  );
}

/** GLTF yüklenince sadece primitive basıyoruz, modelle oynamıyoruz */
function Model({
  onPartClick,
  onLoaded,
}: {
  onPartClick: (name: string) => void;
  onLoaded: (sceneInfo: { meshes: number }) => void;
}) {
  // useGLTF hata fırlatırsa ErrorBoundary yakalayacak
  const gltf = useGLTF(MODEL_PATH) as any;

  // scene içinden mesh sayısı (debug için)
  const meshCount = useMemo(() => {
    let c = 0;
    gltf?.scene?.traverse?.((o: any) => {
      if (o?.isMesh) c++;
    });
    return c;
  }, [gltf]);

  useEffect(() => {
    onLoaded({ meshes: meshCount });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meshCount]);

  return (
    <group
      onPointerDown={(e: any) => {
        e.stopPropagation();
        const obj = e.object;
        const name =
          obj?.name || obj?.material?.name || obj?.geometry?.name || obj?.uuid || "unknown";
        onPartClick(String(name));
      }}
    >
      <primitive object={gltf.scene} />
    </group>
  );
}

/** Kamera: ref yok. OrbitControls makeDefault => state.controls */
function CameraRig({
  ready,
  setDbg,
}: {
  ready: boolean;
  setDbg: (s: string) => void;
}) {
  const { camera, controls } = useThree();

  useEffect(() => {
    if (!ready) return;

    let cancelled = false;
    const start = performance.now();

    const apply = (tries: number) => {
      if (cancelled) return;

      const c: any = controls;
      if (!c) {
        // controls henüz oluşmadıysa 1-2 frame bekle
        if (tries < 120) {
          setDbg(`KAMERA: controls yok, bekleniyor… try=${tries}`);
          requestAnimationFrame(() => apply(tries + 1));
        } else {
          setDbg(`HATA: CONTROLS_TIMEOUT (OrbitControls oluşmadı)`);
        }
        return;
      }

      // ✅ SADECE kamera/target ayarı (2. foto gibi)
      camera.position.set(0, 1.6, 4.2);
      c.target.set(0, 1.35, 0);
      c.update();

      const ms = (performance.now() - start).toFixed(0);
      setDbg(
        `KAMERA_APPLY ✅ (${ms}ms)\n` +
          `cam=[${camera.position.x.toFixed(2)}, ${camera.position.y.toFixed(2)}, ${camera.position.z.toFixed(2)}]\n` +
          `tgt=[${c.target.x.toFixed(2)}, ${c.target.y.toFixed(2)}, ${c.target.z.toFixed(2)}]`
      );
    };

    requestAnimationFrame(() => apply(0));
    return () => {
      cancelled = true;
    };
  }, [ready, camera, controls, setDbg]);

  return null;
}

/** React ErrorBoundary: useGLTF veya render hatalarını yakalar */
class ErrorBoundary extends React.Component<
  { onError: (msg: string) => void; children: any },
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
    const msg = String(error?.message || error || "unknown_error");
    // useGLTF hataları genelde burada yakalanır
    this.props.onError(`HATA: GLTF_LOAD_FAIL\n${msg}`);
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

export default function AliciGame15({ onClose }: { onClose: () => void }) {
  const [clickedName, setClickedName] = useState("Bir yere dokun...");
  const [dbg, setDbg] = useState("Başlıyor…");
  const [fetchDbg, setFetchDbg] = useState("FETCH: bekleniyor…");
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [modelReady, setModelReady] = useState(false);

  // ✅ 1) URL gerçekten indirilebiliyor mu? (Hata kodu burada net çıkar)
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const r = await fetch(MODEL_PATH, { method: "GET" });
        const ct = r.headers.get("content-type") || "unknown";
        const len = r.headers.get("content-length") || "unknown";
        if (!alive) return;

        if (!r.ok) {
          setFetchDbg(`HATA: FETCH_HTTP_${r.status}\n${r.statusText}\nct=${ct}\nlen=${len}`);
          setFatalError(`FETCH_HTTP_${r.status}`);
          return;
        }

        setFetchDbg(`FETCH_OK ✅\nct=${ct}\nlen=${len}`);
      } catch (e: any) {
        const msg = String(e?.message || e || "fetch_error");
        if (!alive) return;
        setFetchDbg(`HATA: FETCH_THROW\n${msg}`);
        setFatalError("FETCH_THROW");
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[500] bg-slate-900 flex flex-col">
      {/* Geri */}
      <div className="absolute top-4 left-4 z-20">
        <button
          onClick={onClose}
          className="p-3 bg-slate-800/80 rounded-full text-white hover:bg-slate-700 transition"
        >
          <ArrowLeft size={24} />
        </button>
      </div>

      {/* Üst Debug */}
      <div className="absolute top-4 right-4 z-20 bg-black/70 text-white text-[11px] p-3 rounded-lg max-w-[72%] whitespace-pre-wrap">
        {fetchDbg}
        {"\n\n"}
        {dbg}
        {fatalError ? `\n\nFATAL=${fatalError}` : ""}
      </div>

      {/* Hata Banner */}
      {fatalError && (
        <div className="absolute top-20 left-4 right-4 z-30 bg-red-500/90 text-white p-4 rounded-xl flex items-center gap-3 shadow-lg backdrop-blur-md">
          <AlertCircle size={24} />
          <div className="min-w-0">
            <p className="font-bold">Model Yüklenemedi!</p>
            <p className="text-xs opacity-90 break-words">
              Hata Kodu: <b>{fatalError}</b>
            </p>
          </div>
        </div>
      )}

      {/* Sahne */}
      <div className="w-full h-full bg-gradient-to-b from-gray-200 to-gray-400 relative">
        <Canvas camera={{ fov: 50, near: 0.01, far: 5000 }}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 10, 5]} intensity={1.1} />
          <Environment preset="city" />

          <OrbitControls makeDefault />

          <CameraRig ready={modelReady} setDbg={setDbg} />

          <Suspense fallback={<Loader info={`${fetchDbg}\n\n${dbg}`} />}>
            <ErrorBoundary
              onError={(msg) => {
                setDbg(msg);
                setFatalError("GLTF_LOAD_FAIL");
              }}
            >
              <Model
                onPartClick={setClickedName}
                onLoaded={({ meshes }) => {
                  setDbg(`MODEL_READY ✅ meshes=${meshes}\nKamera ayarlanıyor…`);
                  setModelReady(true);
                }}
              />
            </ErrorBoundary>
          </Suspense>
        </Canvas>
      </div>

      {/* Alt bilgi */}
      <div className="absolute bottom-8 w-full flex justify-center pointer-events-none px-4">
        <div className="bg-blue-600/90 text-white w-full max-w-md py-4 rounded-2xl text-center shadow-lg backdrop-blur-md border border-blue-400/30">
          <div className="flex items-center justify-center gap-2 mb-1 opacity-80">
            <MousePointer2 size={16} />
            <span className="font-bold text-xs tracking-widest uppercase">Tespit Edilen Bölge</span>
          </div>
          <p className="font-mono text-xl font-bold truncate px-4">{clickedName}</p>
        </div>
      </div>
    </div>
  );
}

useGLTF.preload(MODEL_PATH);
