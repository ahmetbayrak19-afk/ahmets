import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, useAnimations, useGLTF, useProgress } from "@react-three/drei";
import * as THREE from "three";

/** ==== AYARLAR ==== */
const SEA_ANIM_NAME = "yeme";
const SEA_ANIM_SPEED = 0.2;

const FISH_SWIM_ANIM_NAME = "yuzme";

// hareket
const MAX_SPEED = 1.6;        // balık hızı
const Z_PLANE = 0;            // drag düzlemi z
const CAMERA_Z = 10;          // kamera uzaklık
const CAMERA_SMOOTH = 6.0;    // kamera takip yumuşaklığı
const LOOK_SMOOTH = 8.0;      // lookAt yumuşaklığı

// ortam
const FOG_DENSITY = 0.02;

// deniz
const SEA_ROT_Y = -Math.PI / 2; // sola 90
const SEA_SCALE_MULT = 2.0;

// balık
const FISH_SCALE = 3.0;
const TURN_SMOOTH = 10.0;
const BANK_AMOUNT = 0.35;

function Loader3D() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div style={{
        color: "white",
        background: "rgba(0,0,0,0.6)",
        padding: "10px 12px",
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.2)",
        fontFamily: "monospace",
      }}>
        Yükleniyor: %{progress.toFixed(0)}
      </div>
    </Html>
  );
}

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
      return next.length > 14 ? next.slice(-14) : next;
    });
  }, []);

  return { logs, push };
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

function LogOverlay({ logs, onClose }: { logs: LogItem[]; onClose: () => void }) {
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
      }}
    >
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ fontWeight: 800, color: "#ffcc00" }}>RAPOR</div>
        <button
          onClick={onClose}
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
          Gizle
        </button>
      </div>
      <div style={{ marginTop: 8, display: "grid", gap: 4 }}>
        {logs.map((l, i) => (
          <div
            key={i}
            style={{
              color: l.level === "error" ? "#ff4d4d" : l.level === "warn" ? "#fbbf24" : "#a7f3d0",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {"> "}
            {l.msg}
          </div>
        ))}
      </div>
    </div>
  );
}

class ScreenErrorBoundary extends React.Component<
  { onError: (msg: string) => void; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: any) { this.props.onError(error?.message || String(error)); }
  render() {
    if (this.state.hasError) {
      return (
        <Html center>
          <div style={{
            color: "#ff4d4d",
            background: "rgba(0,0,0,0.75)",
            padding: 12,
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.2)",
            fontFamily: "monospace",
            maxWidth: 340,
            textAlign: "center",
          }}>
            HATA: 3D sahne çöktü
          </div>
        </Html>
      );
    }
    return this.props.children as any;
  }
}

/** Tek event yakalayıcı plane */
function CanvasEvents({
  onDown, onMove, onUp,
}: {
  onDown: (e: any) => void;
  onMove: (e: any) => void;
  onUp: () => void;
}) {
  return (
    <mesh
      position={[0, 0, Z_PLANE]}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <planeGeometry args={[5000, 5000]} />
      <meshBasicMaterial transparent opacity={0.01} depthWrite={false} />
    </mesh>
  );
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
  report: (m: string, lvl?: "info" | "warn" | "error") => void;
}) {
  useMemo(() => {
    useGLTF.setDecoderPath(dracoBase.endsWith("/") ? dracoBase : `${dracoBase}/`);
  }, [dracoBase]);

  const sea = useGLTF(seaUrl);
  const fish = useGLTF(fishUrl);

  const seaGroup = useRef<THREE.Group>(null);
  const fishGroup = useRef<THREE.Group>(null);

  const seaAnim = useAnimations(sea.animations, sea.scene);
  const fishAnim = useAnimations(fish.animations, fish.scene);
  const swimActionRef = useRef<THREE.AnimationAction | null>(null);

  useEffect(() => {
    const actions = seaAnim.actions;
    const names = seaAnim.names;
    const target = actions?.[SEA_ANIM_NAME] ? SEA_ANIM_NAME : names?.[0];
    if (target && actions[target]) {
      const a = actions[target]!;
      a.reset().fadeIn(0.15).play();
      a.timeScale = SEA_ANIM_SPEED;
    }
  }, [seaAnim.actions, seaAnim.names]);

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
    }
  }, [fishAnim.actions, fishAnim.names]);

  const boundsRef = useRef<{ minX: number; maxX: number; minY: number; maxY: number } | null>(null);

  useEffect(() => {
    if (!seaGroup.current) return;

    sea.scene.traverse((o: any) => {
      if (o?.isMesh && o.material) {
        o.material.side = THREE.DoubleSide;
        o.material.needsUpdate = true;
      }
    });

    const rawBox = new THREE.Box3().setFromObject(sea.scene);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    rawBox.getSize(size);
    rawBox.getCenter(center);

    sea.scene.position.sub(center);

    const longest = Math.max(size.x, size.y, size.z);
    const targetLongest = 80;
    const s0 = longest > 0 ? targetLongest / longest : 1;
    const s = s0 * SEA_SCALE_MULT;
    sea.scene.scale.setScalar(s);

    seaGroup.current.position.set(0, 0, -25);
    seaGroup.current.rotation.set(0, SEA_ROT_Y, 0);

    const box = new THREE.Box3().setFromObject(seaGroup.current);
    const newSize = new THREE.Vector3();
    box.getSize(newSize);

    const padX = Math.max(1.5, newSize.x * 0.04);
    const padY = Math.max(1.5, newSize.y * 0.10);

    boundsRef.current = {
      minX: box.min.x + padX,
      maxX: box.max.x - padX,
      minY: box.min.y + padY,
      maxY: box.max.y - padY,
    };

    report?.(`Bounds OK`, "info");
  }, [sea.scene]);

  // fish state
  const fishPos = useRef(new THREE.Vector3(0, 0, Z_PLANE));
  const fishTarget = useRef(new THREE.Vector3(0, 0, Z_PLANE));
  const dragging = useRef(false);

  const yawRef = useRef(Math.PI / 2);
  const lookRef = useRef(new THREE.Vector3(0, 0, Z_PLANE)); // camera look target smooth

  useEffect(() => {
    if (!fishGroup.current) return;
    fishGroup.current.scale.setScalar(FISH_SCALE);
    fishGroup.current.rotation.set(0, Math.PI / 2, 0);
  }, [fish.scene]);

  // NDC -> world
  const { camera } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), -Z_PLANE), []);

  const ndcToWorld = useCallback((xNdc: number, yNdc: number) => {
    raycaster.setFromCamera({ x: xNdc, y: yNdc }, camera);
    const hit = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, hit);
    return hit;
  }, [camera, plane, raycaster]);

  const onDown = useCallback((e: any) => {
    dragging.current = true;
    fishTarget.current.copy(ndcToWorld(e.pointer.x, e.pointer.y));
  }, [ndcToWorld]);

  const onMove = useCallback((e: any) => {
    if (!dragging.current) return;
    fishTarget.current.copy(ndcToWorld(e.pointer.x, e.pointer.y));
  }, [ndcToWorld]);

  const onUp = useCallback(() => {
    dragging.current = false;
  }, []);

  useFrame((state, dt) => {
    const b = boundsRef.current;
    if (!fishGroup.current || !b) return;

    // clamp target
    fishTarget.current.x = THREE.MathUtils.clamp(fishTarget.current.x, b.minX, b.maxX);
    fishTarget.current.y = THREE.MathUtils.clamp(fishTarget.current.y, b.minY, b.maxY);
    fishTarget.current.z = Z_PLANE;

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
    fishPos.current.z = Z_PLANE;

    fishGroup.current.position.copy(fishPos.current);

    // smooth yaw + bank
    const dx = fishTarget.current.x - fishPos.current.x;
    const desiredYaw = dx >= 0 ? Math.PI / 2 : -Math.PI / 2;
    const tTurn = 1 - Math.pow(0.001, dt * TURN_SMOOTH);
    yawRef.current = THREE.MathUtils.lerpAngle(yawRef.current, desiredYaw, tTurn);

    const bank = THREE.MathUtils.clamp(dx * 0.15, -1, 1) * BANK_AMOUNT;
    fishGroup.current.rotation.set(0, yawRef.current, bank);

    // swim anim
    const swim = swimActionRef.current;
    if (swim) swim.paused = !moving;

    // ✅ Kamera: balığı X+Y paralel takip etsin (Y sabit değil)
    const cam = state.camera as THREE.PerspectiveCamera;
    const desiredCam = new THREE.Vector3(fishPos.current.x, fishPos.current.y, CAMERA_Z);
    const tCam = 1 - Math.pow(0.001, dt * CAMERA_SMOOTH);
    cam.position.lerp(desiredCam, tCam);

    // lookAt da smooth: balığın biraz önüne
    const desiredLook = new THREE.Vector3(
      fishPos.current.x + (dx >= 0 ? CAMERA_LOOKAHEAD : -CAMERA_LOOKAHEAD),
      fishPos.current.y,
      Z_PLANE
    );
    const tLook = 1 - Math.pow(0.001, dt * LOOK_SMOOTH);
    lookRef.current.lerp(desiredLook, tLook);
    cam.lookAt(lookRef.current);
  });

  return (
    <>
      <group ref={seaGroup}>
        <primitive object={sea.scene} />
      </group>

      <group ref={fishGroup}>
        <primitive object={fish.scene} />
      </group>

      <CanvasEvents onDown={onDown} onMove={onMove} onUp={onUp} />
    </>
  );
}

export default function EslemeGame() {
  const { logs, push } = useScreenLogger();
  const [showPanel, setShowPanel] = useState(false);

  const [fishUrl, setFishUrl] = useState("");
  const [seaUrl, setSeaUrl] = useState("");
  const [dracoBase, setDracoBase] = useState("");

  const report = useCallback((m: string, lvl: "info" | "warn" | "error" = "info") => {
    push(m, lvl);
    if (lvl === "error") setShowPanel(true);
  }, [push]);

  const once = useRef(false);
  useEffect(() => {
    if (once.current) return;
    once.current = true;

    const origin = window.location.origin;
    const base = new URL("/assets/public/", origin).toString();

    setFishUrl(new URL("models/balik.glb", base).toString());
    setSeaUrl(new URL("models/deniz.glb", base).toString());
    setDracoBase(new URL("draco/", base).toString());
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#001018" }}>
      {!showPanel ? (
        <MiniButton onClick={() => setShowPanel(true)} label="Rapor" />
      ) : (
        <LogOverlay logs={logs} onClose={() => setShowPanel(false)} />
      )}

      <Canvas
        camera={{ position: [0, 0, CAMERA_Z], fov: 45, near: 0.1, far: 5000 }}
        onCreated={({ scene }) => {
          scene.background = new THREE.Color("#001623");
          scene.fog = new THREE.FogExp2("#001623", FOG_DENSITY);
        }}
      >
        <ambientLight intensity={1.1} />
        <directionalLight position={[10, 12, 10]} intensity={1.6} />
        <directionalLight position={[-10, -4, 2]} intensity={0.6} />

        <ScreenErrorBoundary onError={(m) => report(m, "error")}>
          <Suspense fallback={<Loader3D />}>
            {fishUrl && seaUrl && dracoBase ? (
              <World fishUrl={fishUrl} seaUrl={seaUrl} dracoBase={dracoBase} report={report} />
            ) : (
              <Html center>
                <div style={{ color: "white", fontFamily: "monospace" }}>Model URL bekleniyor...</div>
              </Html>
            )}
          </Suspense>
        </ScreenErrorBoundary>
      </Canvas>
    </div>
  );
          }
