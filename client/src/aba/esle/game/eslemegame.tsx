import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, useAnimations, useGLTF, useProgress } from "@react-three/drei";
import * as THREE from "three";

const SEA_ANIM_NAME = "yeme";
const SEA_ANIM_SPEED = 0.2;

const FISH_SWIM_ANIM_NAME = "yuzme";
const MAX_SPEED = 1.6;

const CAMERA_Z = 10;
const CAMERA_LOOKAHEAD = 2.0;

// Fog fazla olursa denizi “yutar” → daha düşük
const FOG_DENSITY = 0.03;

type LogItem = { t: number; msg: string; level: "info" | "warn" | "error" };

function useScreenLogger() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const lastMsgRef = useRef<string>("");

  const push = useCallback((msg: string, level: LogItem["level"] = "info") => {
    const key = `${level}:${msg}`;
    if (lastMsgRef.current === key) return;
    lastMsgRef.current = key;

    setLogs((prev) => {
      const next = [...prev, { t: Date.now(), msg, level }];
      return next.length > 35 ? next.slice(-35) : next;
    });
  }, []);

  const clear = useCallback(() => {
    lastMsgRef.current = "";
    setLogs([]);
  }, []);

  return { logs, push, clear };
}

function LogOverlay({
  title,
  logs,
  onClear,
  onClose,
}: {
  title: string;
  logs: LogItem[];
  onClear: () => void;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        top: 10,
        left: 10,
        right: 10,
        maxWidth: 760,
        zIndex: 999999,
        background: "rgba(0,0,0,0.88)",
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: 12,
        padding: 12,
        fontFamily: "monospace",
        fontSize: 12,
        color: "#e5e7eb",
        pointerEvents: "auto",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ fontWeight: 800, color: "#ffcc00" }}>{title}</div>
        <button
          onClick={onClear}
          style={{
            marginLeft: "auto",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            color: "#fff",
            padding: "6px 10px",
            borderRadius: 10,
            cursor: "pointer",
          }}
        >
          Temizle
        </button>
        <button
          onClick={onClose}
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            color: "#fff",
            padding: "6px 10px",
            borderRadius: 10,
            cursor: "pointer",
          }}
        >
          Gizle
        </button>
      </div>

      <div style={{ marginTop: 8, display: "grid", gap: 4 }}>
        {logs.length === 0 ? (
          <div style={{ color: "#9ca3af" }}>Log yok.</div>
        ) : (
          logs.map((l, i) => (
            <div
              key={i}
              style={{
                color:
                  l.level === "error"
                    ? "#ff4d4d"
                    : l.level === "warn"
                      ? "#fbbf24"
                      : "#a7f3d0",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {"> "}
              {l.msg}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function MiniButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: "fixed",
        top: 10,
        right: 10,
        zIndex: 999999,
        background: "rgba(0,0,0,0.65)",
        border: "1px solid rgba(255,255,255,0.18)",
        color: "#fff",
        padding: "8px 10px",
        borderRadius: 12,
        cursor: "pointer",
        fontFamily: "monospace",
        fontSize: 12,
      }}
    >
      {label}
    </button>
  );
}

function Loader3D() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div
        style={{
          color: "white",
          background: "rgba(0,0,0,0.6)",
          padding: "10px 12px",
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.2)",
          fontFamily: "monospace",
        }}
      >
        Yükleniyor: %{progress.toFixed(0)}
      </div>
    </Html>
  );
}

class ScreenErrorBoundary extends React.Component<
  { onError: (msg: string) => void; fallback?: React.ReactNode; children: React.ReactNode },
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
    const msg = error?.message || String(error);
    this.props.onError(`REACT BOUNDARY HATA: ${msg}`);
  }
  render() {
    if (this.state.hasError) return this.props.fallback ?? null;
    return this.props.children as any;
  }
}

function World({
  fishUrl,
  seaUrl,
  dracoBase,
  report,
}: {
  fishUrl: string;
  seaUrl: string;
  dracoBase: string;
  report: (msg: string, level?: "info" | "warn" | "error") => void;
}) {
  useMemo(() => {
    useGLTF.setDecoderPath(dracoBase.endsWith("/") ? dracoBase : `${dracoBase}/`);
  }, [dracoBase]);

  const sea = useGLTF(seaUrl);
  const fish = useGLTF(fishUrl);

  const seaGroupRef = useRef<THREE.Group | null>(null);
  const fishGroupRef = useRef<THREE.Group | null>(null);

  const seaAnim = useAnimations(sea.animations, sea.scene);
  const fishAnim = useAnimations(fish.animations, fish.scene);
  const swimActionRef = useRef<THREE.AnimationAction | null>(null);

  // Deniz animasyonu
  useEffect(() => {
    const actions = seaAnim.actions;
    const names = seaAnim.names;
    const target = actions?.[SEA_ANIM_NAME] ? SEA_ANIM_NAME : names?.[0];
    if (target && actions[target]) {
      const a = actions[target]!;
      a.reset().fadeIn(0.15).play();
      a.timeScale = SEA_ANIM_SPEED;
      report(`Deniz animasyonu: ${target} (speed ${SEA_ANIM_SPEED})`, "info");
    } else {
      report("Uyarı: Deniz animasyonu bulunamadı.", "warn");
    }
  }, [seaAnim.actions, seaAnim.names, report]);

  // Balık yüzme animasyonu
  useEffect(() => {
    const actions = fishAnim.actions;
    const names = fishAnim.names;
    const target = actions?.[FISH_SWIM_ANIM_NAME] ? FISH_SWIM_ANIM_NAME : names?.[0];
    if (target && actions[target]) {
      const a = actions[target]!;
      a.reset();
      a.paused = true;
      a.play();
      swimActionRef.current = a;
      report(`Balık animasyonu hazır: ${target}`, "info");
    } else {
      report("Uyarı: Balık 'yuzme' animasyonu bulunamadı.", "warn");
    }
  }, [fishAnim.actions, fishAnim.names, report]);

  // ✅ DENİZİ OTOMATİK “GÖRÜNÜR” HALE GETİR:
  // - center
  // - scale (fit)
  // - materyal doubleSide (bazı glb’lerde içten bakınca görünmez)
  // - box helper (deniz nerde göreyim diye)
  const boundsRef = useRef<{ minX: number; maxX: number; minY: number; maxY: number; fixedY: number } | null>(null);
  const seaBoxHelperRef = useRef<THREE.Box3Helper | null>(null);

  useEffect(() => {
    if (!seaGroupRef.current) return;

    // materyal düzelt (içeriden bakınca görünmeme ihtimali)
    sea.scene.traverse((obj: any) => {
      if (obj?.isMesh && obj.material) {
        obj.material.side = THREE.DoubleSide;
        obj.material.needsUpdate = true;
      }
    });

    // önce deniz sahnesinin box'ını çıkar
    const rawBox = new THREE.Box3().setFromObject(sea.scene);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    rawBox.getSize(size);
    rawBox.getCenter(center);

    // denizi kendi merkezine çek
    sea.scene.position.sub(center);

    // denizi “fit” ölçeğe getir (çok büyük/çok küçük olmasın)
    const longest = Math.max(size.x, size.y, size.z);
    const targetLongest = 60; // sahnede görmek için iyi bir ölçü
    const scale = longest > 0 ? targetLongest / longest : 1;
    sea.scene.scale.setScalar(scale);

    // group pozisyonu: z biraz geride
    seaGroupRef.current.position.set(0, 0, -8);

    // yeni box (ölçek+merkez sonrası)
    const box = new THREE.Box3().setFromObject(seaGroupRef.current);
    const newSize = new THREE.Vector3();
    box.getSize(newSize);

    // bounds
    const padX = Math.max(1.0, newSize.x * 0.04);
    const padY = Math.max(1.0, newSize.y * 0.10);

    const minX = box.min.x + padX;
    const maxX = box.max.x - padX;
    const minY = box.min.y + padY;
    const maxY = box.max.y - padY;
    const fixedY = minY + (maxY - minY) * 0.55;

    boundsRef.current = { minX, maxX, minY, maxY, fixedY };

    report(
      `Deniz fit: scale=${scale.toFixed(3)} size=(${newSize.x.toFixed(1)},${newSize.y.toFixed(
        1
      )},${newSize.z.toFixed(1)})`,
      "info"
    );

    // Box helper (deniz nerede gör diye)
    if (seaBoxHelperRef.current) {
      seaGroupRef.current.remove(seaBoxHelperRef.current);
      seaBoxHelperRef.current = null;
    }
    const helper = new THREE.Box3Helper(box, new THREE.Color("#00ff88"));
    seaBoxHelperRef.current = helper;
    seaGroupRef.current.add(helper);
  }, [sea.scene, report]);

  // fish state + drag
  const fishPos = useRef(new THREE.Vector3(0, 0, 0));
  const fishTarget = useRef(new THREE.Vector3(0, 0, 0));
  const dragging = useRef(false);

  useEffect(() => {
    const b = boundsRef.current;
    if (!b || !fishGroupRef.current) return;
    fishPos.current.set((b.minX + b.maxX) * 0.5, b.fixedY, 0);
    fishTarget.current.copy(fishPos.current);
    fishGroupRef.current.position.copy(fishPos.current);
    fishGroupRef.current.rotation.y = Math.PI / 2; // yan duruş
  }, [fish.scene]);

  // pointer->world
  const { camera, size: viewportSize } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);

  const pointerToWorld = useCallback(
    (clientX: number, clientY: number) => {
      const xNdc = (clientX / viewportSize.width) * 2 - 1;
      const yNdc = -(clientY / viewportSize.height) * 2 + 1;
      raycaster.setFromCamera({ x: xNdc, y: yNdc }, camera);
      const hit = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, hit);
      return hit;
    },
    [camera, viewportSize.width, viewportSize.height, plane, raycaster]
  );

  const onPointerDown = useCallback(
    (e: any) => {
      dragging.current = true;
      fishTarget.current.copy(pointerToWorld(e.clientX, e.clientY));
    },
    [pointerToWorld]
  );
  const onPointerMove = useCallback(
    (e: any) => {
      if (!dragging.current) return;
      fishTarget.current.copy(pointerToWorld(e.clientX, e.clientY));
    },
    [pointerToWorld]
  );
  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  useFrame((state, dt) => {
    const b = boundsRef.current;
    if (!b || !fishGroupRef.current) return;

    // clamp target
    fishTarget.current.x = THREE.MathUtils.clamp(fishTarget.current.x, b.minX, b.maxX);
    fishTarget.current.y = THREE.MathUtils.clamp(fishTarget.current.y, b.minY, b.maxY);
    fishTarget.current.z = 0;

    const toTarget = fishTarget.current.clone().sub(fishPos.current);
    const dist = toTarget.length();
    const moving = dragging.current && dist > 0.01;

    if (moving) {
      const step = Math.min(dist, MAX_SPEED * dt);
      toTarget.normalize().multiplyScalar(step);
      fishPos.current.add(toTarget);
    }

    fishPos.current.x = THREE.MathUtils.clamp(fishPos.current.x, b.minX, b.maxX);
    fishPos.current.y = THREE.MathUtils.clamp(fishPos.current.y, b.minY, b.maxY);
    fishPos.current.z = 0;

    fishGroupRef.current.position.copy(fishPos.current);

    // yön
    const dx = fishTarget.current.x - fishPos.current.x;
    if (Math.abs(dx) > 0.005) {
      fishGroupRef.current.rotation.y = dx >= 0 ? Math.PI / 2 : -Math.PI / 2;
    }

    // swim anim
    const swim = swimActionRef.current;
    if (swim) {
      swim.paused = !moving;
      if (moving) swim.timeScale = 1.0;
    }

    // kamera: X takip, Y sabit
    const cam = state.camera as THREE.PerspectiveCamera;
    const desiredCam = new THREE.Vector3(fishPos.current.x, b.fixedY, CAMERA_Z);
    cam.position.lerp(desiredCam, 1 - Math.pow(0.001, dt));
    cam.lookAt(
      new THREE.Vector3(
        fishPos.current.x + (dx >= 0 ? CAMERA_LOOKAHEAD : -CAMERA_LOOKAHEAD),
        b.fixedY,
        0
      )
    );
  });

  return (
    <>
      {/* Balık */}
      <group ref={fishGroupRef}>
        <primitive object={fish.scene} />
      </group>

      {/* Fullscreen drag plane */}
      <mesh
        position={[0, 0, 0]}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <planeGeometry args={[2000, 2000]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </>
  );
}

export default function EslemeGame() {
  const { logs, push, clear } = useScreenLogger();
  const [showPanel, setShowPanel] = useState(false);

  const [fishUrl, setFishUrl] = useState("");
  const [seaUrl, setSeaUrl] = useState("");
  const [dracoBase, setDracoBase] = useState("");
  const [glReady, setGlReady] = useState(false);

  const report = useCallback(
    (msg: string, level: "info" | "warn" | "error" = "info") => {
      push(msg, level);
      if (level === "error") setShowPanel(true);
    },
    [push]
  );

  // init
  const initOnceRef = useRef(false);
  useEffect(() => {
    if (initOnceRef.current) return;
    initOnceRef.current = true;

    const origin = window.location.origin;
    const base = new URL("/assets/public/", origin).toString();

    setFishUrl(new URL("models/balik.glb", base).toString());
    setSeaUrl(new URL("models/deniz.glb", base).toString());
    setDracoBase(new URL("draco/", base).toString());

    push(`origin: ${origin}`, "info");
    push(`BASE: ${base}`, "info");
  }, [push]);

  const onCreated = useCallback(
    ({ gl, scene }: any) => {
      setGlReady(true);
      scene.background = new THREE.Color("#001623");
      scene.fog = new THREE.FogExp2("#001623", FOG_DENSITY);

      const canvas = gl.domElement as HTMLCanvasElement;
      const onLost = (e: Event) => {
        e.preventDefault();
        report("WEBGL CONTEXT LOST (siyah ekran sebebi olabilir).", "error");
      };
      canvas.addEventListener("webglcontextlost", onLost as any, false);
    },
    [report]
  );

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#001018" }}>
      {!showPanel ? (
        <MiniButton onClick={() => setShowPanel(true)} label="Rapor" />
      ) : (
        <LogOverlay
          title="NATIVE / 3D RAPOR (Console Yok)"
          logs={logs}
          onClear={clear}
          onClose={() => setShowPanel(false)}
        />
      )}

      <Canvas camera={{ position: [0, 0, CAMERA_Z], fov: 45, near: 0.1, far: 5000 }} onCreated={onCreated}>
        {/* Işık biraz güçlü: deniz görünür olsun */}
        <ambientLight intensity={1.0} />
        <directionalLight position={[8, 10, 8]} intensity={1.4} />
        <directionalLight position={[-8, -3, 2]} intensity={0.55} />

        <ScreenErrorBoundary
          onError={(m) => report(m, "error")}
          fallback={
            <Html center>
              <div
                style={{
                  color: "#ff4d4d",
                  background: "rgba(0,0,0,0.75)",
                  padding: 12,
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.2)",
                  fontFamily: "monospace",
                  maxWidth: 340,
                  textAlign: "center",
                }}
              >
                HATA: 3D sahne çöktü (Boundary)
              </div>
            </Html>
          }
        >
          <Suspense fallback={<Loader3D />}>
            {fishUrl && seaUrl && dracoBase ? (
              <World fishUrl={fishUrl} seaUrl={seaUrl} dracoBase={dracoBase} report={report} />
            ) : (
              <Html center>
                <div style={{ color: "white", fontFamily: "monospace" }}>
                  Model URL bekleniyor...
                </div>
              </Html>
            )}
          </Suspense>
        </ScreenErrorBoundary>
      </Canvas>

      {!glReady && (
        <div
          style={{
            position: "fixed",
            bottom: 12,
            left: 12,
            right: 12,
            zIndex: 999999,
            color: "#fbbf24",
            fontFamily: "monospace",
            background: "rgba(0,0,0,0.7)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 12,
            padding: 10,
          }}
        >
          UYARI: WebGL henüz hazır değil. Cihaz WebGL’i engelliyor olabilir.
        </div>
      )}
    </div>
  );
      }
