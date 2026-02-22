import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, useAnimations, useGLTF, useProgress } from "@react-three/drei";
import * as THREE from "three";

/** =========================
 *  STANDARD FISH STEERING
 *  Seek + Arrival + Velocity Heading
 *  ========================= */

// Deniz / Balık anim
const SEA_ANIM_NAME = "yeme";
const SEA_ANIM_SPEED = 0.2;
const FISH_SWIM_ANIM_NAME = "yuzme";

// Dünya düzlemi
const Z_PLANE = 0;

// Balık boyutu
const FISH_SCALE = 3.0;

// Deniz
const SEA_ROT_Y = Math.PI / 2;
const SEA_SCALE_MULT = 2.0;

// Kamera
const CAMERA_Z = 10;
const CAMERA_SMOOTH = 6.0;

// Arkaplan
const BG_COLOR = "#0b2a46";

// ===== Hareket parametreleri (standard) =====
const MAX_SPEED = 7.5;          // max yüzüş hızı
const STEER_ACCEL = 10.0;       // steering kuvveti (yüksek => daha atik)
const ARRIVE_RADIUS = 1.4;      // hedefe yaklaşınca yavaşlama yarıçapı
const STOP_RADIUS = 0.20;       // bu kadar yakında "vardı" say
const GLIDE_DAMPING = 0.92;     // parmağı bırakınca süzülme
const MIN_SPEED_HEADING = 0.12; // bu hızın altında yön kilitlenir

// ===== Görsel yönelim =====
// Blender görüntüne göre burun -X bakıyor demiştin.
// 2D yönelim: XY düzleminde heading'i Z etrafında döndürürüz.
// Burun -X ise heading’e +PI ekliyoruz.
const NOSE_OFFSET_Z = Math.PI;

// Yukarı giderken alt, aşağı giderken sırt görünsün diye "roll" (local forward ekseni etrafında)
// Bu 3D etki: heading ayrı, roll ayrı.
// Max roll açısı:
const MAX_ROLL = Math.PI / 6; // 30° iyi
const ROLL_SMOOTH = 10.0;

// Sonsuz su
const WATER_Y_OFFSET = -1.8;
const WATER_THICKNESS = 2.8;
const WATER_WAVE_STRENGTH = 0.35;
const WATER_SCROLL_SPEED = 0.08;
const WATER_TILES = 5;

function lerpAngle(a: number, b: number, t: number) {
  const TWO_PI = Math.PI * 2;
  let diff = (b - a) % TWO_PI;
  diff = (2 * diff) % TWO_PI - diff;
  return a + diff * t;
}

function Loader3D() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div style={{ color: "white", background: "rgba(0,0,0,0.75)", padding: "10px 12px", borderRadius: 10, fontFamily: "monospace" }}>
        Yükleniyor: %{progress.toFixed(0)}
      </div>
    </Html>
  );
}

class ScreenErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() { if (this.state.hasError) return null; return this.props.children as any; }
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

/** Water shader material (sin/cos dalga) */
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
}: {
  fishUrl: string;
  seaUrl: string;
  dracoBase: string;
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
      w: newSize.x * 1.2,
      y: box.max.y - newSize.y * 0.02,
      z: newCenter.z,
    };
  }, [sea.scene]);

  // ===== Fish steering state =====
  const fishPos = useRef(new THREE.Vector3(0, 0, Z_PLANE));
  const fishVel = useRef(new THREE.Vector3(0, 0, 0));
  const fishTarget = useRef(new THREE.Vector3(0, 0, Z_PLANE));
  const pressed = useRef(false); // parmak basılı mı?

  // heading + roll kilitleri
  const headingZ = useRef(0); // Z etrafında yön
  const rollX = useRef(0);    // local forward ekseni etrafında (belly/back)
  const lastHeadingZ = useRef(0);

  useEffect(() => {
    if (!fishGroup.current) return;
    fishGroup.current.scale.setScalar(FISH_SCALE);
  }, [fish.scene]);

  // Pointer updates (parmak sabit kalsa bile target sabit; pressed true kaldığı sürece takip sürer)
  const setTargetFromEvent = useCallback((e: any) => {
    pressed.current = true;
    if (e.point) {
      fishTarget.current.copy(e.point);
      fishTarget.current.z = Z_PLANE;
    }
  }, []);

  const release = useCallback(() => {
    pressed.current = false;
  }, []);

  useFrame((state, dt) => {
    if (!fishGroup.current) return;

    const b = boundsRef.current;
    if (b) {
      fishTarget.current.x = THREE.MathUtils.clamp(fishTarget.current.x, b.minX, b.maxX);
      fishTarget.current.y = THREE.MathUtils.clamp(fishTarget.current.y, b.minY, b.maxY);
    }

    // SEEK + ARRIVAL
    const toTarget = new THREE.Vector3().subVectors(fishTarget.current, fishPos.current);
    const dist = Math.hypot(toTarget.x, toTarget.y);

    let desiredVel = new THREE.Vector3(0, 0, 0);

    const seeking = pressed.current && dist > STOP_RADIUS;

    if (seeking) {
      // normalize direction
      if (dist > 1e-6) {
        desiredVel.set(toTarget.x / dist, toTarget.y / dist, 0);
      }
      // arrival scaling
      const speedScale = Math.min(1, dist / ARRIVE_RADIUS);
      desiredVel.multiplyScalar(MAX_SPEED * speedScale);

      // steering = desiredVel - currentVel
      const steering = desiredVel.clone().sub(fishVel.current);
      const steerFactor = 1 - Math.pow(0.001, dt * STEER_ACCEL);
      fishVel.current.add(steering.multiplyScalar(steerFactor));
    } else {
      // glide
      fishVel.current.multiplyScalar(GLIDE_DAMPING);
    }

    // integrate position
    fishPos.current.x += fishVel.current.x * dt;
    fishPos.current.y += fishVel.current.y * dt;
    fishPos.current.z = Z_PLANE;

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

    fishGroup.current.position.copy(fishPos.current);

    // ===== Orientation from VELOCITY (no jitter) =====
    const speed = Math.hypot(fishVel.current.x, fishVel.current.y);

    if (speed > MIN_SPEED_HEADING) {
      // heading in XY plane (rotate around Z)
      const dirX = fishVel.current.x / speed;
      const dirY = fishVel.current.y / speed;

      // model nose is -X => add PI
      const desiredHeading = Math.atan2(dirY, dirX) + NOSE_OFFSET_Z;

      const tH = 1 - Math.pow(0.001, dt * 10.0);
      headingZ.current = lerpAngle(headingZ.current, desiredHeading, tH);
      lastHeadingZ.current = headingZ.current;

      // belly/back roll: up => belly (roll +), down => back (roll -)
      // scale by vertical component
      const vyNorm = THREE.MathUtils.clamp(dirY, -1, 1);
      const desiredRoll = THREE.MathUtils.clamp(vyNorm * MAX_ROLL, -MAX_ROLL, MAX_ROLL);

      const tR = 1 - Math.pow(0.001, dt * ROLL_SMOOTH);
      rollX.current = lerpAngle(rollX.current, desiredRoll, tR);
    } else {
      // speed small: keep last heading (do NOT turn to camera)
      headingZ.current = lastHeadingZ.current;
      // roll relax slowly
      const tR = 1 - Math.pow(0.001, dt * ROLL_SMOOTH);
      rollX.current = lerpAngle(rollX.current, 0, tR);
    }

    // Apply rotations:
    // 1) heading around Z (2D direction)
    fishGroup.current.rotation.set(0, 0, headingZ.current);
    // 2) roll around local forward axis (approx: local X after heading)
    fishGroup.current.rotateX(rollX.current);

    // swim anim only when actually moving
    const swim = swimActionRef.current;
    if (swim) swim.paused = !(speed > MIN_SPEED_HEADING);

    // Camera follow XY
    const cam = state.camera as THREE.PerspectiveCamera;
    const desiredCam = new THREE.Vector3(fishPos.current.x, fishPos.current.y, CAMERA_Z);
    const tCam = 1 - Math.pow(0.001, dt * CAMERA_SMOOTH);
    cam.position.lerp(desiredCam, tCam);
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

      <CanvasEvents onDown={setTargetFromEvent} onMove={setTargetFromEvent} onUp={release} />
    </>
  );
}

export default function EslemeGame() {
  // Portrait’te sadece uyarı
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
      <div style={{ position: "fixed", top: 10, left: 10, zIndex: 999999, color: "#fff", fontFamily: "monospace", opacity: 0.8 }}>
        YATAY MOD
      </div>

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
          {/* Balık kaybolmasın */}
          <ambientLight intensity={1.0} />
          <directionalLight position={[10, 12, 10]} intensity={2.1} />
          <directionalLight position={[-10, -4, 2]} intensity={0.9} />
          <pointLight position={[0, 3, 8]} intensity={1.8} />

          <ScreenErrorBoundary>
            <Suspense fallback={<Loader3D />}>
              {fishUrl && seaUrl && dracoBase ? (
                <World fishUrl={fishUrl} seaUrl={seaUrl} dracoBase={dracoBase} />
              ) : null}
            </Suspense>
          </ScreenErrorBoundary>
        </Canvas>
      )}
    </div>
  );
}
