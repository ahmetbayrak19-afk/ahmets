import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, useAnimations, useGLTF, useProgress } from "@react-three/drei";
import * as THREE from "three";

/** ---- Utils ---- */
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

// Hareket
const MAX_SPEED = 7.2;     // hız (istersen artır)
const ACCEL = 10.0;        // hedef hıza yaklaşma (yumuşak takip)
const DRAG_STOP = 0.90;    // bırakınca yavaşlama
const Z_PLANE = 0;

// Kamera (balığı XY takip)
const CAMERA_Z = 10;
const CAMERA_SMOOTH = 7.0;
const LOOK_SMOOTH = 9.0;
const LOOKAHEAD = 1.2;

// Deniz
const SEA_ROT_Y = Math.PI / 2;
const SEA_SCALE_MULT = 2.0;

// Balık
const FISH_SCALE = 3.0;

// Burnu -X bakıyor (senin ekran görüntüne göre)
const NOSE_OFFSET_RAD = Math.PI;

// Dönüş yumuşaklığı
const TURN_SMOOTH = 10.0;

// Çarpma
const BOUNCE = 0.6;
const FRICTION = 0.92;

// Arkaplan
const BG_COLOR = "#0b2a46";

// Sonsuz su
const WATER_Y_OFFSET = -1.8;      // suyu aşağı indir (daha da aşağı istersen -2.2)
const WATER_THICKNESS = 2.8;
const WATER_WAVE_STRENGTH = 0.35;
const WATER_SCROLL_SPEED = 0.08;
const WATER_TILES = 5;            // sonsuz hissi (3 de olur, 5 daha iyi)

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
      return next.length > 16 ? next.slice(-16) : next;
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
        {lines.map((l, i) => (
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

/** ---- Water material (side-view ribbon) ---- */
function useWaterRibbonMaterial(baseUrl: string) {
  return useMemo(() => {
    const normalsUrl = new URL("textures/waternormals.jpg", baseUrl).toString();
    const normalTex = new THREE.TextureLoader().load(normalsUrl);
    normalTex.wrapS = normalTex.wrapT = THREE.RepeatWrapping;
    normalTex.repeat.set(4, 1);

    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uNormalMap: { value: normalTex },
        uOpacity: { value: 0.82 },
        uWave: { value: WATER_WAVE_STRENGTH },
        uScroll: { value: WATER_SCROLL_SPEED },
        uColorDeep: { value: new THREE.Color("#06324a") },
        uColorLight: { value: new THREE.Color("#2ab6ff") },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec4 wp = modelMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uTime;
        uniform sampler2D uNormalMap;
        uniform float uOpacity;
        uniform float uWave;
        uniform float uScroll;
        uniform vec3 uColorDeep;
        uniform vec3 uColorLight;

        void main() {
          vec2 uv = vUv;
          uv.x += uTime * uScroll;
          vec3 n = texture2D(uNormalMap, uv).xyz * 2.0 - 1.0;

          float edge = smoothstep(0.0, 0.35, vUv.y) * smoothstep(1.0, 0.75, vUv.y);
          float wave = (n.x * 0.5 + n.y * 0.5) * uWave;

          float t = clamp(vUv.y + wave * 0.45, 0.0, 1.0);
          vec3 col = mix(uColorDeep, uColorLight, t);

          float sparkle = pow(clamp(n.z, 0.0, 1.0), 6.0) * 0.35;
          col += sparkle;

          float a = uOpacity * (0.72 + 0.28 * smoothstep(0.6, 1.0, vUv.y));
          gl_FragColor = vec4(col, a * edge);
        }
      `,
    });

    return mat;
  }, [baseUrl]);
}

/** ✅ Sonsuz su yüzeyi: tile’lar kameraya göre hizalanır */
function InfiniteWaterRibbon({
  width,
  y,
  z,
  baseUrl,
}: {
  width: number;
  y: number;
  z: number;
  baseUrl: string;
}) {
  const mat = useWaterRibbonMaterial(baseUrl);
  const geom = useMemo(() => new THREE.PlaneGeometry(width, WATER_THICKNESS, 64, 4), [width]);
  const groupRef = useRef<THREE.Group | null>(null);
  const { camera } = useThree();

  useFrame((_, dt) => {
    (mat.uniforms.uTime.value as number) += dt;

    const camX = camera.position.x;
    const baseX = Math.floor(camX / width) * width;

    if (!groupRef.current) return;
    groupRef.current.children.forEach((child, idx) => {
      const i = idx - Math.floor(WATER_TILES / 2);
      child.position.x = baseX + i * width;
    });
  });

  return (
    <group ref={groupRef} position={[0, y + WATER_Y_OFFSET, z + 0.15]}>
      {Array.from({ length: WATER_TILES }).map((_, i) => (
        <mesh key={i} geometry={geom} material={mat} />
      ))}
    </group>
  );
}

function World({
  fishUrl,
  seaUrl,
  dracoBase,
  baseUrl,
  log,
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
      log("Deniz anim bulunamadı.", "warn");
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
      log("Balık yuzme anim bulunamadı.", "warn");
    }
  }, [fishAnim.actions, fishAnim.names, log]);

  // Deniz bounds + surface
  const boundsRef = useRef<{ minX: number; maxX: number; minY: number; maxY: number } | null>(null);
  const surfaceRef = useRef<{ w: number; y: number; z: number } | null>(null);

  useEffect(() => {
    if (!seaGroup.current) return;

    sea.scene.traverse((o: any) => {
      if (o?.isMesh && o.material) {
        o.material.side = THREE.DoubleSide;
        o.material.needsUpdate = true;
      }
    });

    // center + scale
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

    // final bbox
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
      w: newSize.x * 1.2,                 // su biraz daha geniş
      y: box.max.y - newSize.y * 0.02,    // denizin üst bandı
      z: newCenter.z,
    };

    log("Deniz bounds + surface hazır.", "info");
  }, [sea.scene, log]);

  // Fish motion toward "food"
  const fishPos = useRef(new THREE.Vector3(0, 0, Z_PLANE));
  const fishVel = useRef(new THREE.Vector2(0, 0));
  const fishTarget = useRef(new THREE.Vector3(0, 0, Z_PLANE));
  const dragging = useRef(false);

  // rotation around Z (2D)
  const rotZRef = useRef(0);
  const lookRef = useRef(new THREE.Vector3(0, 0, Z_PLANE));

  useEffect(() => {
    if (!fishGroup.current) return;
    fishGroup.current.scale.setScalar(FISH_SCALE);
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

    const dx = fishTarget.current.x - fishPos.current.x;
    const dy = fishTarget.current.y - fishPos.current.y;
    const dist = Math.hypot(dx, dy);

    const moving = dragging.current && dist > 0.02;

    if (moving) {
      const nx = dx / dist;
      const ny = dy / dist;

      // hedef velocity
      const targetVx = nx * MAX_SPEED;
      const targetVy = ny * MAX_SPEED;

      // vel -> hedefe yumuşak yaklaş
      const a = 1 - Math.pow(0.001, dt * ACCEL);
      fishVel.current.x = THREE.MathUtils.lerp(fishVel.current.x, targetVx, a);
      fishVel.current.y = THREE.MathUtils.lerp(fishVel.current.y, targetVy, a);

      // ✅ burun hedefe dönsün (burnun -X)
      const desiredRotZ = Math.atan2(ny, nx) + NOSE_OFFSET_RAD;
      const tTurn = 1 - Math.pow(0.001, dt * TURN_SMOOTH);
      rotZRef.current = lerpAngle(rotZRef.current, desiredRotZ, tTurn);
    } else {
      // bırakınca yavaşla
      fishVel.current.multiplyScalar(DRAG_STOP);
    }

    // pozisyon
    fishPos.current.x += fishVel.current.x * dt;
    fishPos.current.y += fishVel.current.y * dt;

    // bounce
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

    fishPos.current.z = Z_PLANE;
    fishGroup.current.position.copy(fishPos.current);

    // ✅ 2D dönüş: Z etrafında
    fishGroup.current.rotation.set(0, 0, rotZRef.current);

    // swim anim
    const swim = swimActionRef.current;
    if (swim) swim.paused = !moving;

    // kamera XY takip
    const cam = state.camera as THREE.PerspectiveCamera;
    const desiredCam = new THREE.Vector3(fishPos.current.x, fishPos.current.y, CAMERA_Z);
    const tCam = 1 - Math.pow(0.001, dt * CAMERA_SMOOTH);
    cam.position.lerp(desiredCam, tCam);

    // look (balığın önüne)
    const forwardX = Math.cos(rotZRef.current - NOSE_OFFSET_RAD);
    const forwardY = Math.sin(rotZRef.current - NOSE_OFFSET_RAD);

    const desiredLook = new THREE.Vector3(
      fishPos.current.x + forwardX * LOOKAHEAD,
      fishPos.current.y + forwardY * LOOKAHEAD,
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
        <InfiniteWaterRibbon width={surface.w} y={surface.y} z={surface.z} baseUrl={baseUrl} />
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
    <div style={{ width: "100vw", height: "100vh", background: BG_COLOR }}>
      <Overlay title="NATIVE / 3D DURUM" lines={lines} onClear={clear} />

      <Canvas
        camera={{ position: [0, 0, CAMERA_Z], fov: 45, near: 0.1, far: 5000 }}
        onCreated={({ scene }) => {
          scene.background = new THREE.Color(BG_COLOR);
        }}
      >
        {/* Balık kaybolmasın diye ışıklar */}
        <ambientLight intensity={1.0} />
        <directionalLight position={[10, 12, 10]} intensity={2.1} />
        <directionalLight position={[-10, -4, 2]} intensity={0.9} />
        <pointLight position={[0, 3, 8]} intensity={1.8} />

        <ScreenErrorBoundary onError={(m) => log(`Boundary: ${m}`, "error")}>
          <Suspense fallback={<Loader3D />}>
            {fishUrl && seaUrl && dracoBase && baseUrl ? (
              <World fishUrl={fishUrl} seaUrl={seaUrl} dracoBase={dracoBase} baseUrl={baseUrl} log={log} />
            ) : null}
          </Suspense>
        </ScreenErrorBoundary>
      </Canvas>
    </div>
  );
  }
