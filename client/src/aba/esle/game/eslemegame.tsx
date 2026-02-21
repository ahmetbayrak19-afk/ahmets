import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls, useAnimations, useGLTF, useProgress } from "@react-three/drei";
import * as THREE from "three";

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
      return next.length > 30 ? next.slice(-30) : next;
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

/**
 * Hungry Shark kontroller:
 * - pointer drag => hedef world koordinat
 * - fish dünya içinde hareket eder, ama kamera fish'i takip eder => fish ekranda merkezde
 * - sea (deniz) modelinin bounds'u => fish clamp
 * - fish "yuzme" animasyonu sadece hareket ederken oynar
 */
function World({
  fishUrl,
  seaUrl,
  dracoBase,
  report,
  seaAnimName = "yeme",
  seaAnimSpeed = 0.2,
  fishSwimAnimName = "yuzme",
}: {
  fishUrl: string;
  seaUrl: string;
  dracoBase: string;
  report: (msg: string, level?: "info" | "warn" | "error") => void;
  seaAnimName?: string;
  seaAnimSpeed?: number;
  fishSwimAnimName?: string;
}) {
  useMemo(() => {
    useGLTF.setDecoderPath(dracoBase.endsWith("/") ? dracoBase : `${dracoBase}/`);
  }, [dracoBase]);

  const sea = useGLTF(seaUrl);
  const fish = useGLTF(fishUrl);

  // Deniz animasyonu (ot sallanması)
  const seaAnim = useAnimations(sea.animations, sea.scene);

  useEffect(() => {
    const actions = seaAnim.actions;
    const names = seaAnim.names;
    const target = actions?.[seaAnimName] ? seaAnimName : names?.[0];
    if (target && actions[target]) {
      const a = actions[target]!;
      a.reset().fadeIn(0.2).play();
      a.timeScale = seaAnimSpeed;
      report(`Deniz animasyonu: ${target} (speed ${seaAnimSpeed})`, "info");
    } else {
      report("Uyarı: Deniz animasyonu bulunamadı.", "warn");
    }
  }, [seaAnim.actions, seaAnim.names, seaAnimName, seaAnimSpeed, report]);

  // Balık animasyonu (yuzme)
  const fishAnim = useAnimations(fish.animations, fish.scene);
  const swimActionRef = useRef<THREE.AnimationAction | null>(null);

  useEffect(() => {
    const actions = fishAnim.actions;
    const names = fishAnim.names;
    const target = actions?.[fishSwimAnimName] ? fishSwimAnimName : names?.[0];
    if (target && actions[target]) {
      const a = actions[target]!;
      a.reset();
      a.paused = true; // başlangıçta dur
      a.play(); // play edip pause etmek, sonra resume etmeyi kolaylaştırır
      swimActionRef.current = a;
      report(`Balık animasyonu hazır: ${target} (hareket edince oynar)`, "info");
    } else {
      report("Uyarı: Balık 'yuzme' animasyonu bulunamadı.", "warn");
    }
  }, [fishAnim.actions, fishAnim.names, fishSwimAnimName, report]);

  // Deniz bounds => balık sınırları
  const boundsRef = useRef<{ minX: number; maxX: number; minY: number; maxY: number } | null>(null);

  useEffect(() => {
    const box = new THREE.Box3().setFromObject(sea.scene);
    const size = new THREE.Vector3();
    box.getSize(size);

    // padding: balık duvara girmesin
    const padX = Math.max(0.6, size.x * 0.03);
    const padY = Math.max(0.6, size.y * 0.08);

    const minX = box.min.x + padX;
    const maxX = box.max.x - padX;

    // Y sınırı: suyun alt/üst bandı (deniz glb'ye göre)
    const minY = box.min.y + padY;
    const maxY = box.max.y - padY;

    boundsRef.current = { minX, maxX, minY, maxY };
    report(
      `Bounds: X[${minX.toFixed(2)}, ${maxX.toFixed(2)}] Y[${minY.toFixed(2)}, ${maxY.toFixed(
        2
      )}]`,
      "info"
    );
  }, [sea.scene, report]);

  // Fish state (world coords)
  const fishPos = useRef(new THREE.Vector3(0, 0, 0));
  const fishTarget = useRef(new THREE.Vector3(0, 0, 0));
  const isDragging = useRef(false);

  // İlk yerleşim: denizin orta-üst bandına
  useEffect(() => {
    const b = boundsRef.current;
    if (!b) return;
    fishPos.current.set((b.minX + b.maxX) * 0.5, (b.minY + b.maxY) * 0.55, 0);
    fishTarget.current.copy(fishPos.current);
    fish.scene.position.copy(fishPos.current);
  }, [fish.scene]);

  // Pointer -> world hedef dönüşümü
  const { camera, size } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []); // z=0 düzlemi

  const pointerToWorld = useCallback(
    (clientX: number, clientY: number) => {
      const xNdc = (clientX / size.width) * 2 - 1;
      const yNdc = -(clientY / size.height) * 2 + 1;
      raycaster.setFromCamera({ x: xNdc, y: yNdc }, camera);
      const hit = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, hit);
      return hit;
    },
    [camera, size.width, size.height, plane, raycaster]
  );

  // Drag handlers: canvas üzerine bağlayacağız (Html değil)
  const onPointerDown = useCallback(
    (e: any) => {
      isDragging.current = true;
      const hit = pointerToWorld(e.clientX, e.clientY);
      fishTarget.current.copy(hit);
    },
    [pointerToWorld]
  );

  const onPointerMove = useCallback(
    (e: any) => {
      if (!isDragging.current) return;
      const hit = pointerToWorld(e.clientX, e.clientY);
      fishTarget.current.copy(hit);
    },
    [pointerToWorld]
  );

  const onPointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // Hareket + animasyon + kamera takip
  useFrame((state, dt) => {
    const b = boundsRef.current;
    if (!b) return;

    // hedefi clamp et
    fishTarget.current.x = THREE.MathUtils.clamp(fishTarget.current.x, b.minX, b.maxX);
    fishTarget.current.y = THREE.MathUtils.clamp(fishTarget.current.y, b.minY, b.maxY);
    fishTarget.current.z = 0;

    // fish -> target yönünde smooth yaklaşım (hungry shark hissi)
    const speed = 4.0; // arttırırsan daha hızlı takip eder
    const alpha = 1 - Math.pow(0.001, dt * speed);
    fishPos.current.lerp(fishTarget.current, alpha);

    // clamp tekrar (duvarın içine sızmasın)
    fishPos.current.x = THREE.MathUtils.clamp(fishPos.current.x, b.minX, b.maxX);
    fishPos.current.y = THREE.MathUtils.clamp(fishPos.current.y, b.minY, b.maxY);
    fishPos.current.z = 0;

    // Balık yönü (sağa/sola dönsün)
    const dx = fishTarget.current.x - fishPos.current.x;
    if (Math.abs(dx) > 0.01) {
      fish.scene.scale.x = dx >= 0 ? 1 : -1; // basit flip
    }

    fish.scene.position.copy(fishPos.current);

    // ✅ Swim animasyonu: sadece hareket ederken
    const swim = swimActionRef.current;
    if (swim) {
      const moving =
        isDragging.current &&
        fishPos.current.distanceToSquared(fishTarget.current) > 0.0005;

      if (moving) {
        swim.paused = false;
        swim.timeScale = 1.0;
      } else {
        swim.paused = true;
      }
    }

    // ✅ Kamera fish'i takip => fish ekranda merkezde
    const cam = state.camera as THREE.PerspectiveCamera;
    const desired = new THREE.Vector3(fishPos.current.x, fishPos.current.y + 0.5, 6);
    cam.position.lerp(desired, 1 - Math.pow(0.001, dt));
    cam.lookAt(new THREE.Vector3(fishPos.current.x, fishPos.current.y + 0.25, 0));
  });

  return (
    <>
      {/* Deniz */}
      <primitive object={sea.scene} scale={1} position={[0, 0, -1]} />

      {/* Balık (pointer eventleri burada yakalayalım) */}
      <group
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <primitive object={fish.scene} scale={1} />
      </group>

      {/* Tüm ekran drag için: boş alanda da çalışsın */}
      <mesh
        position={[0, 0, 0]}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <planeGeometry args={[500, 500]} />
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

  // INIT
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

      <Canvas
        camera={{ position: [0, 1, 6], fov: 45 }}
        onCreated={({ gl, scene }) => {
          setGlReady(true);

          // Sis + mavilik
          scene.background = new THREE.Color("#001623");
          scene.fog = new THREE.FogExp2("#001623", 0.08);

          const canvas = gl.domElement;
          const onLost = (e: Event) => {
            e.preventDefault();
            report("WEBGL CONTEXT LOST (siyah ekran sebebi olabilir).", "error");
          };
          canvas.addEventListener("webglcontextlost", onLost as any, false);
        }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 5, 5]} intensity={1.0} />
        <directionalLight position={[-5, -3, 2]} intensity={0.35} />

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
              <World
                fishUrl={fishUrl}
                seaUrl={seaUrl}
                dracoBase={dracoBase}
                report={report}
                seaAnimName="yeme"
                seaAnimSpeed={0.2}
                fishSwimAnimName="yuzme"
              />
            ) : (
              <Html center>
                <div style={{ color: "white", fontFamily: "monospace" }}>
                  Model URL bekleniyor...
                </div>
              </Html>
            )}
          </Suspense>
        </ScreenErrorBoundary>

        {/* OrbitControls kapat: hungry shark hissi için */}
        <OrbitControls enabled={false} />
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
