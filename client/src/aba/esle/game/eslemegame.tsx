import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, useAnimations, useGLTF, useProgress } from "@react-three/drei";
import * as THREE from "three";

/** ✅ Her ortamda çalışan angle lerp (THREE.MathUtils.lerpAngle yerine) */
function lerpAngle(a: number, b: number, t: number) {
  const TWO_PI = Math.PI * 2;
  let diff = (b - a) % TWO_PI;
  diff = (2 * diff) % TWO_PI - diff; // shortest path
  return a + diff * t;
}

/** ==== AYARLAR ==== */
const SEA_ANIM_NAME = "yeme";
const SEA_ANIM_SPEED = 0.2;

const FISH_SWIM_ANIM_NAME = "yuzme";

const MAX_SPEED = 1.6;
const Z_PLANE = 0;

// Kamera
const CAMERA_Z = 10;
const CAMERA_SMOOTH = 6.0;
const LOOK_SMOOTH = 8.0;
const CAMERA_LOOKAHEAD = 1.6;

// Deniz
const SEA_ROT_Y = -Math.PI / 2; // sola 90
const SEA_SCALE_MULT = 2.0;

// Balık
const FISH_SCALE = 3.0;
const TURN_SMOOTH = 10.0;
const BANK_AMOUNT = 0.35;

type LogItem = { msg: string; level: "info" | "warn" | "error" };

function useOverlayLog() {
  const [lines, setLines] = useState<LogItem[]>([]);
  const lastRef = useRef<string>("");

  const log = useCallback((msg: string, level: LogItem["level"] = "info") => {
    const key = `${level}:${msg}`;
    if (lastRef.current === key) return;
    lastRef.current = key;
    setLines((prev) => {
      const next = [...prev, { msg, level }];
      return next.length > 22 ? next.slice(-22) : next;
    });
  }, []);

  const clear = useCallback(() => {
    lastRef.current = "";
    setLines([]);
  }, []);

  return { lines, log, clear };
}

function Overlay({
  title,
  lines,
  onClear,
}: {
  title: string;
  lines: LogItem[];
  onClear: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        top: 10,
        left: 10,
        right: 10,
        maxWidth: 820,
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
      </div>

      <div style={{ marginTop: 8, display: "grid", gap: 4 }}>
        {lines.length === 0 ? (
          <div style={{ color: "#9ca3af" }}>Log yok.</div>
        ) : (
          lines.map((l, i) => (
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
          ))
        )}
      </div>
    </div>
  );
}

function Loader3D() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div
        style={{
          color: "white",
          background: "rgba(0,0,0,0.75)",
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
  { onError: (msg: string) => void; children: React.ReactNode },
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
    this.props.onError(error?.message || String(error));
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children as any;
  }
}

function CanvasEvents({
  onDown,
  onMove,
  onUp,
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
  log,
}: {
  fishUrl: string;
  seaUrl: string;
  dracoBase: string;
  log: (m: string, lvl?: "info" | "warn" | "error") => void;
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

  // Deniz anim
  useEffect(() => {
    const a =
      seaAnim.actions?.[SEA_ANIM_NAME] ??
      (seaAnim.names?.[0] ? seaAnim.actions?.[seaAnim.names[0]] : null);

    if (a) {
      a.reset().fadeIn(0.15).play();
      a.timeScale = SEA_ANIM_SPEED;
      log(`Deniz anim: ${SEA_ANIM_NAME} speed=${SEA_ANIM_SPEED}`, "info");
    } else {
      log("Deniz animasyonu bulunamadı.", "warn");
    }
  }, [seaAnim.actions, seaAnim.names, log]);

  // Balık anim
  useEffect(() => {
    const a =
      fishAnim.actions?.[FISH_SWIM_ANIM_NAME] ??
      (fishAnim.names?.[0] ? fishAnim.actions?.[fishAnim.names[0]] : null);

    if (a) {
      a.reset();
      a.paused = true;
      a.play();
      swimActionRef.current = a;
      log(`Balık anim hazır: ${FISH_SWIM_ANIM_NAME}`, "info");
    } else {
      log("Balık yuzme animasyonu bulunamadı.", "warn");
    }
  }, [fishAnim.actions, fishAnim.names, log]);

  // Deniz center+scale+rotate + bounds
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
    const baseScale = longest > 0 ? 90 / longest : 1;
    sea.scene.scale.setScalar(baseScale * SEA_SCALE_MULT);

    seaGroup.current.position.set(0, 0, -20);
    seaGroup.current.rotation.set(0, SEA_ROT_Y, 0);

    const box = new THREE.Box3().setFromObject(seaGroup.current);
    const newSize = new THREE.Vector3();
    box.getSize(newSize);

    const padX = Math.max(2.0, newSize.x * 0.04);
    const padY = Math.max(2.0, newSize.y * 0.10);

    boundsRef.current = {
      minX: box.min.x + padX,
      maxX: box.max.x - padX,
      minY: box.min.y + padY,
      maxY: box.max.y - padY,
    };

    log("Deniz sahneye oturdu (center+scale+rotate).", "info");
  }, [sea.scene, log]);

  // Fish state
  const fishPos = useRef(new THREE.Vector3(0, 0, Z_PLANE));
  const fishTarget = useRef(new THREE.Vector3(0, 0, Z_PLANE));
  const dragging = useRef(false);

  const yawRef = useRef(Math.PI / 2);
  const lookRef = useRef(new THREE.Vector3(0, 0, Z_PLANE));

  useEffect(() => {
    if (!fishGroup.current) return;
    fishGroup.current.scale.setScalar(FISH_SCALE);
    fishGroup.current.rotation.set(0, Math.PI / 2, 0);
  }, [fish.scene]);

  // NDC->World
  const { camera } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), -Z_PLANE), []);

  const ndcToWorld = useCallback(
    (xNdc: number, yNdc: number) => {
      raycaster.setFromCamera({ x: xNdc, y: yNdc }, camera);
      const hit = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, hit);
      return hit;
    },
    [camera, plane, raycaster]
  );

  const onDown = useCallback(
    (e: any) => {
      dragging.current = true;
      fishTarget.current.copy(ndcToWorld(e.pointer.x, e.pointer.y));
    },
    [ndcToWorld]
  );

  const onMove = useCallback(
    (e: any) => {
      if (!dragging.current) return;
      fishTarget.current.copy(ndcToWorld(e.pointer.x, e.pointer.y));
    },
    [ndcToWorld]
  );

  const onUp = useCallback(() => {
    dragging.current = false;
  }, []);

  useFrame((state, dt) => {
    if (!fishGroup.current) return;

    const b = boundsRef.current;

    if (b) {
      fishTarget.current.x = THREE.MathUtils.clamp(fishTarget.current.x, b.minX, b.maxX);
      fishTarget.current.y = THREE.MathUtils.clamp(fishTarget.current.y, b.minY, b.maxY);
    }
    fishTarget.current.z = Z_PLANE;

    const toTarget = fishTarget.current.clone().sub(fishPos.current);
    const dist = toTarget.length();
    const moving = dragging.current && dist > 0.01;

    if (moving) {
      const step = Math.min(dist, MAX_SPEED * dt);
      toTarget.normalize().multiplyScalar(step);
      fishPos.current.add(toTarget);
    }

    if (b) {
      fishPos.current.x = THREE.MathUtils.clamp(fishPos.current.x, b.minX, b.maxX);
      fishPos.current.y = THREE.MathUtils.clamp(fishPos.current.y, b.minY, b.maxY);
    }
    fishPos.current.z = Z_PLANE;

    fishGroup.current.position.copy(fishPos.current);

    // ✅ smooth turn (lerpAngle yerine kendi fonksiyon)
    const dx = fishTarget.current.x - fishPos.current.x;
    const desiredYaw = dx >= 0 ? Math.PI / 2 : -Math.PI / 2;
    const tTurn = 1 - Math.pow(0.001, dt * TURN_SMOOTH);
    yawRef.current = lerpAngle(yawRef.current, desiredYaw, tTurn);

    const bank = THREE.MathUtils.clamp(dx * 0.15, -1, 1) * BANK_AMOUNT;
    fishGroup.current.rotation.set(0, yawRef.current, bank);

    const swim = swimActionRef.current;
    if (swim) swim.paused = !moving;

    // Kamera X+Y takip
    const cam = state.camera as THREE.PerspectiveCamera;
    const desiredCam = new THREE.Vector3(fishPos.current.x, fishPos.current.y, CAMERA_Z);
    const tCam = 1 - Math.pow(0.001, dt * CAMERA_SMOOTH);
    cam.position.lerp(desiredCam, tCam);

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
  const { lines, log, clear } = useOverlayLog();

  const [fishUrl, setFishUrl] = useState("");
  const [seaUrl, setSeaUrl] = useState("");
  const [dracoBase, setDracoBase] = useState("");

  // Global hata yakala (console yok)
  useEffect(() => {
    const onErr = (e: ErrorEvent) => log(`window.onerror: ${e.message}`, "error");
    const onRej = (e: PromiseRejectionEvent) => {
      const msg = (e.reason && (e.reason.message || String(e.reason))) || "unhandledrejection";
      log(`unhandledrejection: ${msg}`, "error");
    };
    window.addEventListener("error", onErr);
    window.addEventListener("unhandledrejection", onRej);
    return () => {
      window.removeEventListener("error", onErr);
      window.removeEventListener("unhandledrejection", onRej);
    };
  }, [log]);

  // init urls
  useEffect(() => {
    const origin = window.location.origin;
    const base = new URL("/assets/public/", origin).toString();
    setFishUrl(new URL("models/balik.glb", base).toString());
    setSeaUrl(new URL("models/deniz.glb", base).toString());
    setDracoBase(new URL("draco/", base).toString());
    log(`init base: ${base}`, "info");
  }, [log]);

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#000" }}>
      <Overlay title="NATIVE / 3D DURUM" lines={lines} onClear={clear} />

      <Canvas camera={{ position: [0, 0, CAMERA_Z], fov: 45, near: 0.1, far: 5000 }}>
        {/* Fog yok, background yok */}
        <ambientLight intensity={1.2} />
        <directionalLight position={[10, 12, 10]} intensity={2.0} />
        <directionalLight position={[-10, -4, 2]} intensity={0.8} />

        <ScreenErrorBoundary onError={(m) => log(`Boundary: ${m}`, "error")}>
          <Suspense fallback={<Loader3D />}>
            {fishUrl && seaUrl && dracoBase ? (
              <World fishUrl={fishUrl} seaUrl={seaUrl} dracoBase={dracoBase} log={log} />
            ) : null}
          </Suspense>
        </ScreenErrorBoundary>
      </Canvas>
    </div>
  );
        }
