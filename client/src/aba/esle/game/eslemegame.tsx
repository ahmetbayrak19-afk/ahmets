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
const SEA_ANIM_NAME = "yeme"; //
const SEA_ANIM_SPEED = 0.2;

const FISH_SWIM_ANIM_NAME = "yuzme";

// Hareket
const MAX_SPEED = 7.2;     
const ACCEL = 10.0;        
const DRAG_STOP = 0.90;    
const Z_PLANE = 0; // Balık hep bu düzlemde kalacak (yan profil için)

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

// ✅ Pivot burnunda olduğu için NOSE_OFFSET düzeltildi. 
// Eğer balık ters dönerse burayı 0 veya Math.PI olarak değiştir.
const NOSE_OFFSET_RAD = Math.PI;

// Dönüş yumuşaklığı
const TURN_SMOOTH = 8.0;

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
  // ... (Overlay kodu aynı kalabilir, yer kaplamasın diye kısalttım, sen kendi orijinalini kullan)
  return null; 
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

class ScreenErrorBoundary extends React.Component<{ onError: (msg: string) => void; children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: any) { this.props.onError(error?.message || String(error)); }
  render() { if (this.state.hasError) return null; return this.props.children as any; }
}

function CanvasEvents({ onDown, onMove, onUp }: { onDown: (e: any) => void; onMove: (e: any) => void; onUp: () => void; }) {
  return (
    <mesh position={[0, 0, Z_PLANE]} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
      <planeGeometry args={[5000, 5000]} />
      <meshBasicMaterial transparent opacity={0.01} depthWrite={false} />
    </mesh>
  );
}

/** ---- ✅ RESİMSİZ (PROSEDÜREL) WATER SHADER ---- */
// waternormals.jpg GİTTİ! Tamamen matematiksel, bizim eski pürüzsüz denizimiz.
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
        varying vec3 vPos;
        void main() {
          vUv = uv;
          vPos = position;
          vec4 wp = modelMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying vec3 vPos;
        uniform float uTime;
        uniform float uOpacity;
        uniform float uWave;
        uniform float uScroll;
        uniform vec3 uColorDeep;
        uniform vec3 uColorLight;

        // Basit bir gürültü/dalga fonksiyonu (JPG yerine bunu kullanıyoruz)
        float wave(vec2 p) {
            float w = sin(p.x * 5.0 + uTime * uScroll * 10.0) * 0.5 + 0.5;
            w += cos(p.y * 3.0 - uTime * uScroll * 5.0) * 0.5 + 0.5;
            return w * 0.5;
        }

        void main() {
          vec2 uv = vUv;
          
          // Matematiksel dalga üretimi
          float w1 = wave(uv * vec2(4.0, 1.0));
          float w2 = wave(uv * vec2(8.0, 2.0) + vec2(1.2, 0.5));
          float combinedWave = (w1 + w2) * uWave;

          float edge = smoothstep(0.0, 0.35, vUv.y) * smoothstep(1.0, 0.75, vUv.y);
          
          float t = clamp(vUv.y + combinedWave * 0.45, 0.0, 1.0);
          vec3 col = mix(uColorDeep, uColorLight, t);

          // Pırıltı efekti (matematiksel)
          float sparkle = pow(clamp(combinedWave, 0.0, 1.0), 6.0) * 0.35;
          col += sparkle;

          float a = uOpacity * (0.72 + 0.28 * smoothstep(0.6, 1.0, vUv.y));
          gl_FragColor = vec4(col, a * edge);
        }
      `,
    });
  }, []);
}

function InfiniteWaterRibbon({ width, y, z }: { width: number; y: number; z: number; }) {
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

function World({ fishUrl, seaUrl, dracoBase, log }: { fishUrl: string; seaUrl: string; dracoBase: string; log: (m: string, lvl?: "info" | "warn" | "error") => void; }) {
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
    sea.scene.traverse((o: any) => { if (o?.isMesh && o.material) { o.material.side = THREE.DoubleSide; o.material.needsUpdate = true; } });

    const rawBox = new THREE.Box3().setFromObject(sea.scene);
    const size = new THREE.Vector3(); const center = new THREE.Vector3();
    rawBox.getSize(size); rawBox.getCenter(center);
    sea.scene.position.sub(center);

    const longest = Math.max(size.x, size.y, size.z);
    const baseScale = longest > 0 ? 90 / longest : 1;
    sea.scene.scale.setScalar(baseScale * SEA_SCALE_MULT);

    seaGroup.current.position.set(0, 0, -20);
    seaGroup.current.rotation.set(0, SEA_ROT_Y, 0);

    const box = new THREE.Box3().setFromObject(seaGroup.current);
    const newSize = new THREE.Vector3(); const newCenter = new THREE.Vector3();
    box.getSize(newSize); box.getCenter(newCenter);

    const padX = Math.max(2.0, newSize.x * 0.04);
    const padY = Math.max(2.0, newSize.y * 0.10);

    boundsRef.current = { minX: box.min.x + padX, maxX: box.max.x - padX, minY: box.min.y + padY, maxY: box.max.y - padY };
    surfaceRef.current = { w: newSize.x * 1.2, y: box.max.y - newSize.y * 0.02, z: newCenter.z };
  }, [sea.scene]);

  // ✅ YEM TAKİBİ VE DÜZ DURUŞ
  const fishPos = useRef(new THREE.Vector3(0, 0, Z_PLANE));
  const fishVel = useRef(new THREE.Vector2(0, 0));
  const fishTarget = useRef(new THREE.Vector3(0, 0, Z_PLANE));
  const dragging = useRef(false);

  const rotZRef = useRef(0);
  const lookRef = useRef(new THREE.Vector3(0, 0, Z_PLANE));

  useEffect(() => {
    if (!fishGroup.current) return;
    fishGroup.current.scale.setScalar(FISH_SCALE);
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

  const updateTarget = (e: any) => {
    dragging.current = true;
    const hit = ndcToWorld(e.pointer.x, e.pointer.y);
    fishTarget.current.copy(hit);
  };

  useFrame((state, dt) => {
    if (!fishGroup.current) return;

    const b = boundsRef.current;
    if (b) {
      fishTarget.current.x = THREE.MathUtils.clamp(fishTarget.current.x, b.minX, b.maxX);
      fishTarget.current.y = THREE.MathUtils.clamp(fishTarget.current.y, b.minY, b.maxY);
    }
    fishTarget.current.z = Z_PLANE;

    // ✅ Balığın burnu hedefe (parmağına) bakacak şekilde yönelmesi
    const dx = fishTarget.current.x - fishPos.current.x;
    const dy = fishTarget.current.y - fishPos.current.y;
    const dist = Math.hypot(dx, dy);

    const moving = dragging.current && dist > 0.05;

    if (moving) {
      const nx = dx / dist;
      const ny = dy / dist;

      const targetVx = nx * MAX_SPEED;
      const targetVy = ny * MAX_SPEED;

      const a = 1 - Math.pow(0.001, dt * ACCEL);
      fishVel.current.x = THREE.MathUtils.lerp(fishVel.current.x, targetVx, a);
      fishVel.current.y = THREE.MathUtils.lerp(fishVel.current.y, targetVy, a);

      // ✅ BURNUNUN UCU PİVOT OLDUĞU İÇİN ROTASYON HESABI
      // Sadece Z ekseninde (2D düzlemde) dönecek, böylece arkasını dönmeyecek (hep yan profil)
      let desiredRotZ = Math.atan2(ny, nx);
      
      // Eğer balık ters gidiyorsa, balığın orijinal yönelimine göre offset ekliyoruz.
      // Blender'daki export duruma göre bu Math.PI (180 derece) veya 0 olmalı.
      desiredRotZ += NOSE_OFFSET_RAD; 

      const tTurn = 1 - Math.pow(0.001, dt * TURN_SMOOTH);
      rotZRef.current = lerpAngle(rotZRef.current, desiredRotZ, tTurn);
      
      // Balık sola dönerken başaşağı olmasını engellemek için Y ekseni taklası:
      // Yön vektörü (nx) negatifse (sola gidiyorsa), balığın arkasını dönmesini istemiyoruz, 
      // bu yüzden sadece Z ekseninde dönmesini (yukarı/aşağı bakmasını) ve gerekirse 
      // modelin içinde bir flip yapmasını sağlayabiliriz. Ancak 2D oyun hissiyatı için 
      // Z rotasyonu genellikle yeterlidir. Eğer balık sola giderken sırtüstü dönüyorsa,
      // aşağıdaki Math.abs kodunu açmalısın.
      /*
      if (nx < 0) {
          fishGroup.current.rotation.x = Math.PI; // Sola giderken takla atmasın
      } else {
          fishGroup.current.rotation.x = 0;
      }
      */

    } else {
      fishVel.current.multiplyScalar(DRAG_STOP);
    }

    fishPos.current.x += fishVel.current.x * dt;
    fishPos.current.y += fishVel.current.y * dt;

    if (b) {
      if (fishPos.current.x <= b.minX) { fishPos.current.x = b.minX; fishVel.current.x *= -BOUNCE; }
      if (fishPos.current.x >= b.maxX) { fishPos.current.x = b.maxX; fishVel.current.x *= -BOUNCE; }
      if (fishPos.current.y <= b.minY) { fishPos.current.y = b.minY; fishVel.current.y *= -BOUNCE; }
      if (fishPos.current.y >= b.maxY) { fishPos.current.y = b.maxY; fishVel.current.y *= -BOUNCE; }
    }

    fishGroup.current.position.copy(fishPos.current);
    
    // ✅ Sadece Z etrafında dön, X ve Y rotasyonları sıfır kalsın. (Yan profil garantisi)
    fishGroup.current.rotation.set(0, 0, rotZRef.current);

    const swim = swimActionRef.current;
    if (swim) swim.paused = !moving;

    const cam = state.camera as THREE.PerspectiveCamera;
    const desiredCam = new THREE.Vector3(fishPos.current.x, fishPos.current.y, CAMERA_Z);
    const tCam = 1 - Math.pow(0.001, dt * CAMERA_SMOOTH);
    cam.position.lerp(desiredCam, tCam);

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
      <group ref={seaGroup}><primitive object={sea.scene} /></group>
      {surface && <InfiniteWaterRibbon width={surface.w} y={surface.y} z={surface.z} />}
      <group ref={fishGroup}><primitive object={fish.scene} /></group>
      <CanvasEvents onDown={updateTarget} onMove={updateTarget} onUp={() => dragging.current = false} />
    </>
  );
}

export default function EslemeGame() {
  const { log } = useOverlayLog();
  const [fishUrl, setFishUrl] = useState("");
  const [seaUrl, setSeaUrl] = useState("");
  const [dracoBase, setDracoBase] = useState("");

  useEffect(() => {
    const origin = window.location.origin;
    // URL yollarını senin çalıştığını bildiğimiz lokal yollarla değiştirdik
    setFishUrl(origin + "/models/balik.glb");
    setSeaUrl(origin + "/models/deniz.glb");
    setDracoBase("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", background: BG_COLOR }}>
      <Canvas camera={{ position: [0, 0, CAMERA_Z], fov: 45, near: 0.1, far: 5000 }} onCreated={({ scene }) => { scene.background = new THREE.Color(BG_COLOR); }}>
        <ambientLight intensity={1.0} />
        <directionalLight position={[10, 12, 10]} intensity={2.1} />
        <directionalLight position={[-10, -4, 2]} intensity={0.9} />
        <pointLight position={[0, 3, 8]} intensity={1.8} />

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
    
