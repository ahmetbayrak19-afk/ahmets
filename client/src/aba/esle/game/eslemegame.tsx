import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, useAnimations, useGLTF, useProgress } from "@react-three/drei";
import * as THREE from "three";

/** ---- Utils ---- */
function lerp(start: number, end: number, t: number) {
  return start * (1 - t) + end * t;
}
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

// Hız / sürüş
const MAX_SPEED = 7.2;        // istersen artır
const ACCEL = 8.0;            // hedef hıza yaklaşma
const DRAG_STOP = 0.90;       // el çekince süzülme
const STOP_DIST = 0.25;       // hedefe yaklaşınca dur (titreme önler)

// Dünya düzlemi
const Z_PLANE = 0;

// Kamera
const CAMERA_Z = 10;
const CAMERA_SMOOTH = 5.0;

// Deniz
const SEA_ROT_Y = Math.PI / 2;
const SEA_SCALE_MULT = 2.0;

// Balık
const FISH_SCALE = 3.0;

// Dönüş (yaw + pitch)
const YAW_TURN_SMOOTH = 10.0;      // sağ/sol yumuşak
const PITCH_TURN_SMOOTH = 10.0;    // yukarı/aşağı burun yumuşak
const MAX_PITCH_ANGLE = Math.PI / 3; // max burun kaldırma
const MIN_VX_FOR_YAW = 0.08;       // vx küçükken yaw değiştirme (kararsızlık biter)
const PITCH_WHEN_GLIDING = 0.0;    // el çekince pitch yavaşça düzleşsin (0)

// Çarpma
const BOUNCE = 0.6;
const FRICTION = 0.92;

// Arkaplan
const BG_COLOR = "#0b2a46";

// Sonsuz su
const WATER_Y_OFFSET = -1.8;
const WATER_THICKNESS = 2.8;
const WATER_WAVE_STRENGTH = 0.35;
const WATER_SCROLL_SPEED = 0.08;
const WATER_TILES = 5;

type LogItem = { msg: string; level: "info" | "warn" | "error" };

/** Basit overlay (sadece başlık) */
function Overlay({ title }: { title: string }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 10,
        left: 10,
        right: 10,
        maxWidth: 820,
        zIndex: 999999,
        background: "rgba(0,0,0,0.55)",
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: 12,
        padding: 12,
        fontFamily: "monospace",
        fontSize: 12,
        color: "#e5e7eb",
        pointerEvents: "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ fontWeight: 800, color: "#ffcc00" }}>{title}</div>
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

/** Fullscreen input plane */
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
      <meshBasicMaterial transparent opacity={0.0} depthWrite={false} />
    </mesh>
  );
}

/** Water shader material (normal map yok, sin/cos dalga) */
function useWaterRibbonMaterial() {
  return useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
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
        uniform float uOpacity;
        uniform float uWave;
        uniform float uScroll;
        uniform vec3 uColorDeep;
        uniform vec3 uColorLight;

        float wave(vec2 p) {
          float w = sin(p.x * 5.0 + uTime * uScroll * 10.0) * 0.5 + 0.5;
          w += cos(p.y * 3.0 - uTime * uScroll * 5.0) * 0.5 + 0.5;
          return w * 0.5;
        }

        void main() {
          vec2 uv = vUv;
          float w1 = wave(uv * vec2(4.0, 1.0));
          float w2 = wave(uv * vec2(8.0, 2.0) + vec2(1.2, 0.5));
          float combinedWave = (w1 + w2) * uWave;

          float edge = smoothstep(0.0, 0.35, vUv.y) * smoothstep(1.0, 0.75, vUv.y);

          float t = clamp(vUv.y + combinedWave * 0.45, 0.0, 1.0);
          vec3 col = mix(uColorDeep, uColorLight, t);

          float sparkle = pow(clamp(combinedWave, 0.0, 1.0), 6.0) * 0.35;
          col += sparkle;

          float a = uOpacity * (0.72 + 0.28 * smoothstep(0.6, 1.0, vUv.y));
          gl_FragColor = vec4(col, a * edge);
        }
      `,
    });
  }, []);
}

/** Infinite water ribbon tiles */
function InfiniteWaterRibbon({ width, y, z }: { width: number; y: number; z: number }) {
  const mat = useWaterRibbonMaterial();
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
  onError,
}: {
  fishUrl: string;
  seaUrl: string;
  dracoBase: string;
  onError: (m: string) => void;
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
    const a =
      seaAnim.actions?.[SEA_ANIM_NAME] ??
      (seaAnim.names?.[0] ? seaAnim.actions?.[seaAnim.names[0]] : null);
    if (a) {
      a.reset().fadeIn(0.15).play();
      a.timeScale = SEA_ANIM_SPEED;
    }
  }, [seaAnim.actions, seaAnim.names]);

  useEffect(() => {
    const a =
      fishAnim.actions?.[FISH_SWIM_ANIM_NAME] ??
      (fishAnim.names?.[0] ? fishAnim.actions?.[fishAnim.names[0]] : null);
    if (a) {
      a.reset();
      a.paused = true;
      a.play();
      swimActionRef.current = a;
    }
  }, [fishAnim.actions, fishAnim.names]);

  // Bounds + surface
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
      w: newSize.x * 1.2,
      y: box.max.y - newSize.y * 0.02,
      z: newCenter.z,
    };
  }, [sea.scene]);

  // Fish state
  const fishPos = useRef(new THREE.Vector3(0, 0, Z_PLANE));
  const fishVel = useRef(new THREE.Vector2(0, 0));
  const fishTarget = useRef(new THREE.Vector3(0, 0, Z_PLANE));
  const dragging = useRef(false);

  // Start: sağa yatay
  const currentYaw = useRef(-Math.PI / 2); // sağ
  const currentPitch = useRef(0);

  useEffect(() => {
    if (!fishGroup.current) return;
    fishGroup.current.scale.setScalar(FISH_SCALE);
  }, [fish.scene]);

  // NDC -> world plane
  const { camera } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), -Z_PLANE), []);

  const updateTarget = useCallback(
    (e: any) => {
      dragging.current = true;
      if (e.point) {
        fishTarget.current.copy(e.point);
        fishTarget.current.z = Z_PLANE;
      }
    },
    []
  );

  useFrame((state, dt) => {
    if (!fishGroup.current) return;

    const b = boundsRef.current;
    if (b) {
      fishTarget.current.x = THREE.MathUtils.clamp(fishTarget.current.x, b.minX, b.maxX);
      fishTarget.current.y = THREE.MathUtils.clamp(fishTarget.current.y, b.minY, b.maxY);
    }

    const dx = fishTarget.current.x - fishPos.current.x;
    const dy = fishTarget.current.y - fishPos.current.y;
    const dist = Math.hypot(dx, dy);

    // hedefe yaklaşınca dur: kararsız flip biter
    const moving = dragging.current && dist > STOP_DIST;

    if (moving) {
      const nx = dx / dist;
      const ny = dy / dist;

      const targetVx = nx * MAX_SPEED;
      const targetVy = ny * MAX_SPEED;

      const a = 1 - Math.pow(0.001, dt * ACCEL);
      fishVel.current.x = THREE.MathUtils.lerp(fishVel.current.x, targetVx, a);
      fishVel.current.y = THREE.MathUtils.lerp(fishVel.current.y, targetVy, a);

      // ✅ YAW: sadece X hızına göre sağ/sol seç, vx küçükse kilitli kalsın
      if (fishVel.current.x > MIN_VX_FOR_YAW) {
        const tYaw = 1 - Math.pow(0.001, dt * YAW_TURN_SMOOTH);
        currentYaw.current = lerpAngle(currentYaw.current, -Math.PI / 2, tYaw);
      } else if (fishVel.current.x < -MIN_VX_FOR_YAW) {
        const tYaw = 1 - Math.pow(0.001, dt * YAW_TURN_SMOOTH);
        currentYaw.current = lerpAngle(currentYaw.current, Math.PI / 2, tYaw);
      }

      // ✅ PITCH: sadece Y hızına göre burun yukarı/aşağı
      const vyNorm = THREE.MathUtils.clamp(fishVel.current.y / MAX_SPEED, -1, 1);
      const targetPitch = vyNorm * MAX_PITCH_ANGLE;

      const tPitch = 1 - Math.pow(0.001, dt * PITCH_TURN_SMOOTH);
      currentPitch.current = lerp(currentPitch.current, targetPitch, tPitch);
    } else {
      // el çekince süzül ve dur
      fishVel.current.multiplyScalar(DRAG_STOP);

      // yaw sabit: ekrana dönme yok

      // pitch yumuşakça düzleşsin
      const tPitch = 1 - Math.pow(0.001, dt * PITCH_TURN_SMOOTH);
      currentPitch.current = lerp(currentPitch.current, PITCH_WHEN_GLIDING, tPitch);
    }

    // Position integrate
    fishPos.current.x += fishVel.current.x * dt;
    fishPos.current.y += fishVel.current.y * dt;

    // Bounce bounds
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

    // ✅ Rotation apply: yaw + pitch (X)
    fishGroup.current.rotation.set(0, currentYaw.current, 0);
    fishGroup.current.rotateX(-currentPitch.current); // ters olursa işareti değiştir

    // Swim anim
    const swim = swimActionRef.current;
    if (swim) swim.paused = !moving;

    // Camera follow XY (smooth)
    const cam = state.camera as THREE.PerspectiveCamera;
    const desiredCam = new THREE.Vector3(fishPos.current.x, fishPos.current.y, CAMERA_Z);
    const tCam = 1 - Math.pow(0.001, dt * CAMERA_SMOOTH);
    cam.position.lerp(desiredCam, tCam);

    // Kamera balığa baksın
    cam.lookAt(fishPos.current.x, fishPos.current.y, 0);
  });

  const surface = surfaceRef.current;

  return (
    <>
      <group ref={seaGroup}>
        <primitive object={sea.scene} />
      </group>

      {surface && <InfiniteWaterRibbon width={surface.w} y={surface.y} z={surface.z} />}

      <group ref={fishGroup}>
        <primitive object={fish.scene} />
      </group>

      <CanvasEvents onDown={updateTarget} onMove={updateTarget} onUp={() => (dragging.current = false)} />
    </>
  );
}

export default function EslemeGame() {
  // Yatay uyarısı (manifest yok)
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    const check = () => setIsPortrait(window.innerHeight > window.innerWidth);
    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check as any);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check as any);
    };
  }, []);

  const [fishUrl, setFishUrl] = useState("");
  const [seaUrl, setSeaUrl] = useState("");
  const [dracoBase, setDracoBase] = useState("");

  useEffect(() => {
    const origin = window.location.origin;
    const base = new URL("/assets/public/", origin).toString();
    setFishUrl(new URL("models/balik.glb", base).toString());
    setSeaUrl(new URL("models/deniz.glb", base).toString());
    setDracoBase(new URL("draco/", base).toString());
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", background: BG_COLOR }}>
      <Overlay title="YATAY MOD / ARCADE KONTROL" />

      {isPortrait && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999999,
            background: "#000",
            display: "grid",
            placeItems: "center",
            padding: 24,
            textAlign: "center",
            fontFamily: "monospace",
            color: "#fff",
          }}
        >
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>Telefonu yatay çevir</div>
            <div style={{ opacity: 0.8, fontSize: 13 }}>Oyun yatay modda oynanır.</div>
          </div>
        </div>
      )}

      {!isPortrait && (
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

          <ScreenErrorBoundary onError={() => {}}>
            <Suspense fallback={<Loader3D />}>
              {fishUrl && seaUrl && dracoBase ? (
                <World fishUrl={fishUrl} seaUrl={seaUrl} dracoBase={dracoBase} onError={() => {}} />
              ) : null}
            </Suspense>
          </ScreenErrorBoundary>
        </Canvas>
      )}
    </div>
  );
}
