import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, useAnimations, useGLTF, useProgress } from "@react-three/drei";
import * as THREE from "three";
import { Water } from "three/examples/jsm/objects/Water.js";

function lerpAngle(a: number, b: number, t: number) {
  const TWO_PI = Math.PI * 2;
  let diff = (b - a) % TWO_PI;
  diff = (2 * diff) % TWO_PI - diff;
  return a + diff * t;
}

/** ==== AYARLAR ==== */
const SEA_ANIM_NAME = "yeme";
const SEA_ANIM_SPEED = 0.2;

const FISH_SWIM_ANIM_NAME = "yuzme";

// ✅ biraz daha hızlı
const MAX_SPEED = 6.2;

const Z_PLANE = 0;

// Kamera
const CAMERA_Z = 10;
const CAMERA_SMOOTH = 6.0;
const LOOK_SMOOTH = 8.0;
const CAMERA_LOOKAHEAD = 1.6;

// Deniz
const SEA_ROT_Y = Math.PI / 2;
const SEA_SCALE_MULT = 2.0;

// Balık
const FISH_SCALE = 3.0;
const TURN_SMOOTH = 4.0;
const BANK_AMOUNT = 0.25;
const TURN_DEADZONE = 0.08;

// Water
const WATER_BAND_HEIGHT = 3.5;
const WATER_OPACITY = 0.85;
const WATER_DISTORTION = 3.2;

// ✅ suyu aşağı indir (negatif -> aşağı)
const WATER_Y_OFFSET = -1.2;

// ✅ çarpma/sekme kuvveti
const BOUNCE = 0.55; // 0.3-0.8 arası
const FRICTION = 0.92; // sekmeden sonra biraz hız kaybı

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
      return next.length > 20 ? next.slice(-20) : next;
    });
  }, []);

  const clear = useCallback(() => {
    lastRef.current = "";
    setLines([]);
  }, []);

  return { lines, log, clear };
}

function Overlay({ title, lines, onClear }: { title: string; lines: LogItem[]; onClear: () => void }) {
  return (
    <div style={{
      position: "fixed",
      top: 10, left: 10, right: 10,
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
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ fontWeight: 800, color: "#ffcc00" }}>{title}</div>
        <button onClick={onClear} style={{
          marginLeft: "auto",
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.15)",
          color: "#fff",
          padding: "6px 10px",
          borderRadius: 10,
          cursor: "pointer",
        }}>Temizle</button>
      </div>
      <div style={{ marginTop: 8, display: "grid", gap: 4 }}>
        {lines.map((l, i) => (
          <div key={i} style={{
            color: l.level === "error" ? "#ff4d4d" : l.level === "warn" ? "#fbbf24" : "#a7f3d0",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}>
            {"> "}{l.msg}
          </div>
        ))}
      </div>
    </div>
  );
}

function Loader3D() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div style={{
        color: "white",
        background: "rgba(0,0,0,0.75)",
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

class ScreenErrorBoundary extends React.Component<
  { onError: (msg: string) => void; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: any) { this.props.onError(error?.message || String(error)); }
  render() { if (this.state.hasError) return null; return this.props.children as any; }
}

function CanvasEvents({ onDown, onMove, onUp }: { onDown: (e: any) => void; onMove: (e: any) => void; onUp: () => void; }) {
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

function WaterSurface({ width, y, z, baseUrl }: { width: number; y: number; z: number; baseUrl: string; }) {
  const waterRef = useRef<Water | null>(null);

  const waterObj = useMemo(() => {
    const geom = new THREE.PlaneGeometry(width, WATER_BAND_HEIGHT);

    const normalsUrl = new URL("textures/waternormals.jpg", baseUrl).toString();
    const normals = new THREE.TextureLoader().load(normalsUrl);
    normals.wrapS = normals.wrapT = THREE.RepeatWrapping;
    normals.repeat.set(4, 1);

    const w = new Water(geom, {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: normals,
      sunDirection: new THREE.Vector3(0.2, 1.0, 0.2),
      sunColor: 0xffffff,
      waterColor: 0x0a4b6a,
      distortionScale: WATER_DISTORTION,
      fog: false,
      alpha: 1.0,
    });

    w.position.set(0, y + WATER_Y_OFFSET, z + 0.1);

    (w.material as any).transparent = true;
    (w.material as any).opacity = WATER_OPACITY;
    (w.material as any).depthWrite = false;

    waterRef.current = w;
    return w;
  }, [baseUrl, width, y, z]);

  useFrame((_, dt) => {
    if (!waterRef.current) return;
    const mat: any = waterRef.current.material;
    if (mat?.uniforms?.time) mat.uniforms.time.value += dt;
  });

  return <primitive object={waterObj} />;
}

function World({
  fishUrl, seaUrl, dracoBase, baseUrl, log,
}: {
  fishUrl: string;
  seaUrl: string;
  dracoBase: string;
  baseUrl: string;
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

  useEffect(() => {
    const a = seaAnim.actions?.[SEA_ANIM_NAME] ?? (seaAnim.names?.[0] ? seaAnim.actions?.[seaAnim.names[0]] : null);
    if (a) { a.reset().fadeIn(0.15).play(); a.timeScale = SEA_ANIM_SPEED; }
  }, [seaAnim.actions, seaAnim.names]);

  useEffect(() => {
    const a = fishAnim.actions?.[FISH_SWIM_ANIM_NAME] ?? (fishAnim.names?.[0] ? fishAnim.actions?.[fishAnim.names[0]] : null);
    if (a) { a.reset(); a.paused = true; a.play(); swimActionRef.current = a; }
  }, [fishAnim.actions, fishAnim.names]);

  const boundsRef = useRef<{ minX: number; maxX: number; minY: number; maxY: number } | null>(null);
  const surfaceRef = useRef<{ w: number; y: number; z: number } | null>(null);

  useEffect(() => {
    if (!seaGroup.current) return;

    sea.scene.traverse((o: any) => {
      if (o?.isMesh && o.material) { o.material.side = THREE.DoubleSide; o.material.needsUpdate = true; }
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
    const newCenter = new THREE.Vector3();
    box.getSize(newSize);
    box.getCenter(newCenter);

    const padX = Math.max(2.0, newSize.x * 0.04);
    const padY = Math.max(2.0, newSize.y * 0.10);

    boundsRef.current = {
      minX: box.min.x + padX,
      maxX: box.max.x - padX,
      minY: box.min.y + padY,
      maxY: box.max.y - padY,
    };

    surfaceRef.current = {
      w: newSize.x * 1.05,
      y: box.max.y - newSize.y * 0.02,
      z: newCenter.z,
    };

    log("Deniz + bounds + surface hazır.", "info");
  }, [sea.scene, log]);

  const fishPos = useRef(new THREE.Vector3(0, 0, Z_PLANE));
  const fishVel = useRef(new THREE.Vector2(0, 0)); // ✅ bounce için hız vektörü
  const fishTarget = useRef(new THREE.Vector3(0, 0, Z_PLANE));
  const dragging = useRef(false);

  const desiredYawRef = useRef<number>(Math.PI / 2);
  const yawRef = useRef<number>(Math.PI / 2);
  const lookRef = useRef(new THREE.Vector3(0, 0, Z_PLANE));

  useEffect(() => {
    if (!fishGroup.current) return;
    fishGroup.current.scale.setScalar(FISH_SCALE);
    fishGroup.current.rotation.set(0, Math.PI / 2, 0);
  }, [fish.scene]);

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
    if (!fishGroup.current) return;

    const b = boundsRef.current;
    if (b) {
      fishTarget.current.x = THREE.MathUtils.clamp(fishTarget.current.x, b.minX, b.maxX);
      fishTarget.current.y = THREE.MathUtils.clamp(fishTarget.current.y, b.minY, b.maxY);
    }
    fishTarget.current.z = Z_PLANE;

    // İstenen yön
    const dxT = fishTarget.current.x - fishPos.current.x;
    const dyT = fishTarget.current.y - fishPos.current.y;

    const dist = Math.hypot(dxT, dyT);
    const moving = dragging.current && dist > 0.01;

    // Hedefe doğru ivme (velocity)
    if (moving) {
      const nx = dxT / dist;
      const ny = dyT / dist;
      // hız yaklaşımı: hedef yönde hızlan
      fishVel.current.x = nx * MAX_SPEED;
      fishVel.current.y = ny * MAX_SPEED;
    } else {
      // sürüklemiyorken yavaşça dur
      fishVel.current.multiplyScalar(0.85);
    }

    // pozisyon güncelle
    fishPos.current.x += fishVel.current.x * dt;
    fishPos.current.y += fishVel.current.y * dt;
    fishPos.current.z = Z_PLANE;

    // ✅ çarpma / sekme
    if (b) {
      if (fishPos.current.x <= b.minX) {
        fishPos.current.x = b.minX;
        fishVel.current.x = Math.abs(fishVel.current.x) * BOUNCE;
        fishVel.current.multiplyScalar(FRICTION);
      } else if (fishPos.current.x >= b.maxX) {
        fishPos.current.x = b.maxX;
        fishVel.current.x = -Math.abs(fishVel.current.x) * BOUNCE;
        fishVel.current.multiplyScalar(FRICTION);
      }

      if (fishPos.current.y <= b.minY) {
        fishPos.current.y = b.minY;
        fishVel.current.y = Math.abs(fishVel.current.y) * BOUNCE;
        fishVel.current.multiplyScalar(FRICTION);
      } else if (fishPos.current.y >= b.maxY) {
        fishPos.current.y = b.maxY;
        fishVel.current.y = -Math.abs(fishVel.current.y) * BOUNCE;
        fishVel.current.multiplyScalar(FRICTION);
      }
    }

    fishGroup.current.position.copy(fishPos.current);

    // dönüş yönü (x'e göre)
    const dx = fishVel.current.x;
    if (Math.abs(dx) > TURN_DEADZONE) {
      desiredYawRef.current = dx >= 0 ? Math.PI / 2 : -Math.PI / 2;
    }

    const tTurn = 1 - Math.pow(0.001, dt * TURN_SMOOTH);
    yawRef.current = lerpAngle(yawRef.current, desiredYawRef.current, tTurn);

    const bank = THREE.MathUtils.clamp(dx * 0.04, -1, 1) * BANK_AMOUNT;
    fishGroup.current.rotation.set(0, yawRef.current, bank);

    const swim = swimActionRef.current;
    if (swim) swim.paused = !moving;

    // kamera XY takip
    const cam = state.camera as THREE.PerspectiveCamera;
    const desiredCam = new THREE.Vector3(fishPos.current.x, fishPos.current.y, CAMERA_Z);
    const tCam = 1 - Math.pow(0.001, dt * CAMERA_SMOOTH);
    cam.position.lerp(desiredCam, tCam);

    const desiredLook = new THREE.Vector3(
      fishPos.current.x + (desiredYawRef.current > 0 ? CAMERA_LOOKAHEAD : -CAMERA_LOOKAHEAD),
      fishPos.current.y,
      Z_PLANE
    );
    const tLook = 1 - Math.pow(0.001, dt * LOOK_SMOOTH);
    lookRef.current.lerp(desiredLook, tLook);
    cam.lookAt(lookRef.current);
  });

  const surface = surfaceRef.current;

  return (
    <>
      <group ref={seaGroup}>
        <primitive object={sea.scene} />
      </group>

      {surface && (
        <WaterSurface width={surface.w} y={surface.y} z={surface.z} baseUrl={baseUrl} />
      )}

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
  const [baseUrl, setBaseUrl] = useState("");

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

  useEffect(() => {
    const origin = window.location.origin;
    const base = new URL("/assets/public/", origin).toString();
    setBaseUrl(base);

    setFishUrl(new URL("models/balik.glb", base).toString());
    setSeaUrl(new URL("models/deniz.glb", base).toString());
    setDracoBase(new URL("draco/", base).toString());

    log(`base: ${base}`, "info");
  }, [log]);

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#0b2a46" /* ✅ mavi */ }}>
      <Overlay title="NATIVE / 3D DURUM" lines={lines} onClear={clear} />

      <Canvas
        camera={{ position: [0, 0, CAMERA_Z], fov: 45, near: 0.1, far: 5000 }}
        onCreated={({ scene }) => {
          // ✅ mavi background (fog yok)
          scene.background = new THREE.Color("#0b2a46");
        }}
      >
        {/* ✅ Balık kaybolmasın: güçlü ışık + rim light */}
        <ambientLight intensity={1.0} />
        <directionalLight position={[10, 12, 10]} intensity={2.0} />
        <directionalLight position={[-10, -4, 2]} intensity={0.8} />
        <pointLight position={[0, 3, 8]} intensity={1.8} />

        <ScreenErrorBoundary onError={(m) => log(`Boundary: ${m}`, "error")}>
          <Suspense fallback={<Loader3D />}>
            {fishUrl && seaUrl && dracoBase && baseUrl ? (
              <World
                fishUrl={fishUrl}
                seaUrl={seaUrl}
                dracoBase={dracoBase}
                baseUrl={baseUrl}
                log={log}
              />
            ) : null}
          </Suspense>
        </ScreenErrorBoundary>
      </Canvas>
    </div>
  );
      }
