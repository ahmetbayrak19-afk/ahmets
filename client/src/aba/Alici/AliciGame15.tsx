import React, { Suspense, useEffect, useMemo, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Environment, Html, OrbitControls, useGLTF } from "@react-three/drei";
import { ArrowLeft, MousePointer2, AlertCircle } from "lucide-react";
import * as THREE from "three";

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

type FitInfo = {
  center: [number, number, number];
  radius: number;
  meshes: number;
};

function Model({
  onPartClick,
  onLoaded,
}: {
  onPartClick: (name: string) => void;
  onLoaded: (fit: FitInfo) => void;
}) {
  const gltf = useGLTF(MODEL_PATH) as any;

  const fit = useMemo<FitInfo>(() => {
    const scene = gltf?.scene;
    if (!scene) return { center: [0, 0, 0], radius: 1, meshes: 0 };

    let meshes = 0;
    scene.traverse?.((o: any) => {
      if (o?.isMesh) meshes++;
    });

    const box = new THREE.Box3().setFromObject(scene);
    const sphere = new THREE.Sphere();
    box.getBoundingSphere(sphere);

    // bazı modellerde sphere radius 0 gelebiliyor, güvenlik:
    const r = Number.isFinite(sphere.radius) && sphere.radius > 0 ? sphere.radius : 1;

    return {
      center: [sphere.center.x, sphere.center.y, sphere.center.z],
      radius: r,
      meshes,
    };
  }, [gltf]);

  useEffect(() => {
    onLoaded(fit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fit.center[0], fit.center[1], fit.center[2], fit.radius, fit.meshes]);

  return (
    <group
      onPointerDown={(e: any) => {
        e.stopPropagation();
        const obj = e.object;
        const name =
          obj?.name ||
          obj?.material?.name ||
          obj?.geometry?.name ||
          obj?.uuid ||
          "unknown";
        onPartClick(String(name));
      }}
    >
      <primitive object={gltf.scene} />
    </group>
  );
}

function CameraFit({
  ready,
  fit,
  setDbg,
}: {
  ready: boolean;
  fit: FitInfo | null;
  setDbg: (s: string) => void;
}) {
  const { camera, controls } = useThree();

  useEffect(() => {
    if (!ready || !fit) return;

    let cancelled = false;
    const start = performance.now();

    const apply = (tries: number) => {
      if (cancelled) return;

      const c: any = controls;
      if (!c) {
        if (tries < 120) {
          setDbg(`KAMERA: controls yok, bekleniyor… try=${tries}`);
          requestAnimationFrame(() => apply(tries + 1));
        } else {
          setDbg(`HATA: CONTROLS_TIMEOUT (OrbitControls oluşmadı)`);
        }
        return;
      }

      const [cx, cy, cz] = fit.center;
      const r = fit.radius;

      // ✅ hedefi modelin GERÇEK merkezine al
      c.target.set(cx, cy + r * 0.15, cz); // biraz yukarı: göğüs hissi

      // ✅ kamerayı modele göre geriye ve biraz yukarı koy
      // mesafe: radius * 2.6 → çoğu insan modeli için ideal
      const dist = r * 2.6;
      camera.position.set(cx, cy + r * 0.35, cz + dist);

      camera.near = Math.max(0.01, dist / 200);
      camera.far = Math.max(5000, dist * 50);
      camera.updateProjectionMatrix();

      c.update();

      const ms = (performance.now() - start).toFixed(0);
      setDbg(
        `FETCH_OK ✅\n` +
          `KAMERA_FIT ✅ (${ms}ms)\n` +
          `meshes=${fit.meshes}\n` +
          `center=[${cx.toFixed(2)}, ${cy.toFixed(2)}, ${cz.toFixed(2)}]\n` +
          `radius=${r.toFixed(2)}\n` +
          `cam=[${camera.position.x.toFixed(2)}, ${camera.position.y.toFixed(2)}, ${camera.position.z.toFixed(2)}]\n` +
          `tgt=[${c.target.x.toFixed(2)}, ${c.target.y.toFixed(2)}, ${c.target.z.toFixed(2)}]`
      );
    };

    // 1 frame bekleyip uygula (controls kesin otursun)
    requestAnimationFrame(() => apply(0));

    return () => {
      cancelled = true;
    };
  }, [ready, fit, camera, controls, setDbg]);

  return null;
}

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

  const [fit, setFit] = useState<FitInfo | null>(null);
  const [modelReady, setModelReady] = useState(false);

  // URL gerçekten indirilebiliyor mu?
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch(MODEL_PATH);
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
      <div className="absolute top-4 left-4 z-20">
        <button
          onClick={onClose}
          className="p-3 bg-slate-800/80 rounded-full text-white hover:bg-slate-700 transition"
        >
          <ArrowLeft size={24} />
        </button>
      </div>

      {/* Debug */}
      <div className="absolute top-4 right-4 z-20 bg-black/70 text-white text-[11px] p-3 rounded-lg max-w-[72%] whitespace-pre-wrap">
        {fetchDbg}
        {"\n\n"}
        {dbg}
        {fatalError ? `\n\nFATAL=${fatalError}` : ""}
      </div>

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

      <div className="w-full h-full bg-gradient-to-b from-gray-200 to-gray-400 relative">
        <Canvas camera={{ fov: 50, near: 0.01, far: 5000 }}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 10, 5]} intensity={1.1} />
          <Environment preset="city" />

          {/* Dokunma hareketleri aynen kalsın */}
          <OrbitControls makeDefault />

          {/* ✅ Model yüklenince gerçek merkeze göre kamerayı oturt */}
          <CameraFit ready={modelReady} fit={fit} setDbg={setDbg} />

          <Suspense fallback={<Loader info={`${fetchDbg}\n\n${dbg}`} />}>
            <ErrorBoundary
              onError={(msg) => {
                setDbg(msg);
                setFatalError("GLTF_LOAD_FAIL");
              }}
            >
              <Model
                onPartClick={setClickedName}
                onLoaded={(f) => {
                  setFit(f);
                  setModelReady(true);
                  setDbg(`MODEL_READY ✅ meshes=${f.meshes}\nKamera fit uygulanıyor…`);
                }}
              />
            </ErrorBoundary>
          </Suspense>
        </Canvas>
      </div>

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
