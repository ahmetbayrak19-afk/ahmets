import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, useAnimations, useGLTF, useProgress } from "@react-three/drei";
import * as THREE from "three";

/** ---- Utils ---- */
// Basit ve yumuşak geçiş fonksiyonu
function lerp(start: number, end: number, t: number) {
  return start * (1 - t) + end * t;
}

// Açıları en kısa yoldan yumuşatmak için (U dönüşleri için kritik)
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

// Hız ayarları
const MAX_SPEED = 7.2;
const ACCEL = 8.0; 
const DRAG_STOP = 0.90;
const Z_PLANE = 0; 

// Kamera
const CAMERA_Z = 10;
const CAMERA_SMOOTH = 5.0;

const SEA_ROT_Y = Math.PI / 2;
const SEA_SCALE_MULT = 2.0;
const FISH_SCALE = 3.0;

// Dönüş Hassasiyetleri
const TURN_SMOOTH_YAW = 6.0;   // Sağa/Sola U dönüşü hızı
const TURN_SMOOTH_PITCH = 8.0; // Yukarı/Aşağı burun kaldırma hızı
const MAX_PITCH_ANGLE = Math.PI / 4; // Burnunu en fazla 45 derece kaldırıp/indirsin (Göbek/Sırt açısı)

const BOUNCE = 0.6;
const FRICTION = 0.92;
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
    const key = `${level}:${msg}`; if (lastRef.current === key) return; lastRef.current = key;
    setLines((prev) => { const next = [...prev, { msg, level }]; return next.length > 16 ? next.slice(-16) : next; });
  }, []);
  const clear = useCallback(() => { lastRef.current = ""; setLines([]); }, []);
  return { lines, log, clear };
}

function Overlay({ title, lines, onClear }: { title: string; lines: LogItem[]; onClear: () => void }) {
  return (
    <div style={{ position: "fixed", top: 10, left: 10, right: 10, maxWidth: 820, zIndex: 999999, background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, padding: 12, fontFamily: "monospace", fontSize: 12, color: "#e5e7eb", pointerEvents: "none" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}> <div style={{ fontWeight: 800, color: "#ffcc00" }}>{title}</div> </div>
    </div>
  );
}

function Loader3D() {
  const { progress } = useProgress();
  return ( <Html center> <div style={{ color: "white", background: "rgba(0,0,0,0.75)", padding: "10px 12px", borderRadius: 10, fontFamily: "monospace" }}> Yükleniyor: %{progress.toFixed(0)} </div> </Html> );
}

class ScreenErrorBoundary extends React.Component<{ onError: (msg: string) => void; children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: any) { this.props.onError(error?.message || String(error)); }
  render() { if (this.state.hasError) return null; return this.props.children as any; }
}

function CanvasEvents({ onDown, onMove, onUp }: { onDown: (e: any) => void; onMove: (e: any) => void; onUp: () => void; }) {
  return ( <mesh position={[0, 0, Z_PLANE]} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}> <planeGeometry args={[5000, 5000]} /> <meshBasicMaterial transparent opacity={0.0} depthWrite={false} /> </mesh> );
}

function useWaterRibbonMaterial() {
  return useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { uTime: { value: 0 }, uOpacity: { value: 0.82 }, uWave: { value: WATER_WAVE_STRENGTH }, uScroll: { value: WATER_SCROLL_SPEED }, uColorDeep: { value: new THREE.Color("#06324a") }, uColorLight: { value: new THREE.Color("#2ab6ff") }, },
      vertexShader: `varying vec2 vUv; void main() { vUv = uv; vec4 wp = modelMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * viewMatrix * wp; }`,
      fragmentShader: `varying vec2 vUv; uniform float uTime; uniform float uOpacity; uniform float uWave; uniform float uScroll; uniform vec3 uColorDeep; uniform vec3 uColorLight; float wave(vec2 p) { float w = sin(p.x * 5.0 + uTime * uScroll * 10.0) * 0.5 + 0.5; w += cos(p.y * 3.0 - uTime * uScroll * 5.0) * 0.5 + 0.5; return w * 0.5; } void main() { vec2 uv = vUv; float w1 = wave(uv * vec2(4.0, 1.0)); float w2 = wave(uv * vec2(8.0, 2.0) + vec2(1.2, 0.5)); float combinedWave = (w1 + w2) * uWave; float edge = smoothstep(0.0, 0.35, vUv.y) * smoothstep(1.0, 0.75, vUv.y); float t = clamp(vUv.y + combinedWave * 0.45, 0.0, 1.0); vec3 col = mix(uColorDeep, uColorLight, t); float sparkle = pow(clamp(combinedWave, 0.0, 1.0), 6.0) * 0.35; col += sparkle; float a = uOpacity * (0.72 + 0.28 * smoothstep(0.6, 1.0, vUv.y)); gl_FragColor = vec4(col, a * edge); }`,
    });
  }, []);
}

function InfiniteWaterRibbon({ width, y, z }: { width: number; y: number; z: number; }) {
  const mat = useWaterRibbonMaterial();
  const geom = useMemo(() => new THREE.PlaneGeometry(width, WATER_THICKNESS, 64, 4), [width]);
  const groupRef = useRef<THREE.Group | null>(null);
  const { camera } = useThree();
  useFrame((_, dt) => { (mat.uniforms.uTime.value as number) += dt; const camX = camera.position.x; const baseX = Math.floor(camX / width) * width; if (!groupRef.current) return; groupRef.current.children.forEach((child, idx) => { const i = idx - Math.floor(WATER_TILES / 2); child.position.x = baseX + i * width; }); });
  return ( <group ref={groupRef} position={[0, y + WATER_Y_OFFSET, z + 0.15]}> {Array.from({ length: WATER_TILES }).map((_, i) => ( <mesh key={i} geometry={geom} material={mat} /> ))} </group> );
}

function World({ fishUrl, seaUrl, dracoBase, log }: { fishUrl: string; seaUrl: string; dracoBase: string; log: (m: string) => void; }) {
  useMemo(() => { useGLTF.setDecoderPath(dracoBase.endsWith("/") ? dracoBase : `${dracoBase}/`); }, [dracoBase]);
  const sea = useGLTF(seaUrl); const fish = useGLTF(fishUrl);
  const seaGroup = useRef<THREE.Group>(null); const fishGroup = useRef<THREE.Group>(null);
  
  const seaAnim = useAnimations(sea.animations, sea.scene); const fishAnim = useAnimations(fish.animations, fish.scene);
  const swimActionRef = useRef<THREE.AnimationAction | null>(null);

  useEffect(() => { const a = seaAnim.actions?.[SEA_ANIM_NAME] ?? (seaAnim.names?.[0] ? seaAnim.actions?.[seaAnim.names[0]] : null); if (a) { a.reset().fadeIn(0.15).play(); a.timeScale = SEA_ANIM_SPEED; } }, [seaAnim.actions, seaAnim.names]);
  useEffect(() => { const a = fishAnim.actions?.[FISH_SWIM_ANIM_NAME] ?? (fishAnim.names?.[0] ? fishAnim.actions?.[fishAnim.names[0]] : null); if (a) { a.reset(); a.paused = true; a.play(); swimActionRef.current = a; } }, [fishAnim.actions, fishAnim.names]);

  const boundsRef = useRef<{ minX: number; maxX: number; minY: number; maxY: number } | null>(null);
  const surfaceRef = useRef<{ w: number; y: number; z: number } | null>(null);

  useEffect(() => {
    if (!seaGroup.current) return;
    sea.scene.traverse((o: any) => { if (o?.isMesh && o.material) { o.material.side = THREE.DoubleSide; o.material.needsUpdate = true; } });
    const rawBox = new THREE.Box3().setFromObject(sea.scene); const size = new THREE.Vector3(); const center = new THREE.Vector3(); rawBox.getSize(size); rawBox.getCenter(center); sea.scene.position.sub(center);
    const longest = Math.max(size.x, size.y, size.z); const baseScale = longest > 0 ? 90 / longest : 1; sea.scene.scale.setScalar(baseScale * SEA_SCALE_MULT);
    seaGroup.current.position.set(0, 0, -20); seaGroup.current.rotation.set(0, SEA_ROT_Y, 0);
    const box = new THREE.Box3().setFromObject(seaGroup.current); const newSize = new THREE.Vector3(); const newCenter = new THREE.Vector3(); box.getSize(newSize); box.getCenter(newCenter);
    const padX = Math.max(2.0, newSize.x * 0.04); const padY = Math.max(2.0, newSize.y * 0.10);
    boundsRef.current = { minX: box.min.x + padX, maxX: box.max.x - padX, minY: box.min.y + padY, maxY: box.max.y - padY };
    surfaceRef.current = { w: newSize.x * 1.2, y: box.max.y - newSize.y * 0.02, z: newCenter.z };
  }, [sea.scene]);

  const fishPos = useRef(new THREE.Vector3(0, 0, Z_PLANE));
  const fishVel = useRef(new THREE.Vector2(0, 0));
  const fishTarget = useRef(new THREE.Vector3(0, 0, Z_PLANE));
  const dragging = useRef(false);

  // ✅ YENİ MANTIK DEĞİŞKENLERİ
  // Yaw = Sağa/Sola Dönüş (U Dönüşü)
  // Pitch = Yukarı/Aşağı Burnunu Kaldırma (Göbek/Sırt)
  const currentYaw = useRef(Math.PI / 2); // Başlangıçta sağa bakıyor
  const currentPitch = useRef(0);

  useEffect(() => { if (!fishGroup.current) return; fishGroup.current.scale.setScalar(FISH_SCALE); }, [fish.scene]);

  const updateTarget = (e: any) => { dragging.current = true; if(e.point) { fishTarget.current.copy(e.point); fishTarget.current.z = Z_PLANE; } };

  useFrame((state, dt) => {
    if (!fishGroup.current) return;
    const b = boundsRef.current;
    if (b) { fishTarget.current.x = THREE.MathUtils.clamp(fishTarget.current.x, b.minX, b.maxX); fishTarget.current.y = THREE.MathUtils.clamp(fishTarget.current.y, b.minY, b.maxY); }

    const dx = fishTarget.current.x - fishPos.current.x;
    const dy = fishTarget.current.y - fishPos.current.y;
    const dist = Math.hypot(dx, dy);
    
    // Titremeyi önlemek için ölü bölge
    const moving = dragging.current && dist > 0.15;

    if (moving) {
      const nx = dx / dist; const ny = dy / dist;
      const targetVx = nx * MAX_SPEED; const targetVy = ny * MAX_SPEED;
      const a = 1 - Math.pow(0.001, dt * ACCEL);
      fishVel.current.x = THREE.MathUtils.lerp(fishVel.current.x, targetVx, a);
      fishVel.current.y = THREE.MathUtils.lerp(fishVel.current.y, targetVy, a);

      // ==========================================
      // ✅ SENİN İSTEDİĞİN GÖBEK/SIRT/YAN PROFİL MATEMATİĞİ
      // ==========================================

      // 1. SAĞA MI SOLA MI GİDİYORUZ? (YAW HESABI)
      // Parmağın sağdaysa Yaw = 90 derece (Math.PI/2)
      // Parmağın soldaysa Yaw = -90 derece (-Math.PI/2)
      let targetYaw = currentYaw.current; // Varsayılan: Yönünü koru
      if (nx > 0.1) targetYaw = Math.PI / 2;       // Net sağ
      else if (nx < -0.1) targetYaw = -Math.PI / 2; // Net sol

      // 2. YUKARI MI AŞAĞI MI GİDİYORUZ? (PITCH HESABI)
      // Parmağın Y eksenindeki yüksekliğine (ny) göre burnunu kaldır/indir.
      // Eğim (ny), -1 ile +1 arasındadır. Bunu MAX_PITCH_ANGLE (45 derece) ile çarpıyoruz.
      // Sola giderken eğimin (ny) ters çevrilmesi gerekir ki göbeği hep aşağıda/yukarıda doğru görünsün.
      const pitchDirection = (targetYaw > 0) ? 1 : -1; 
      let targetPitch = ny * MAX_PITCH_ANGLE * pitchDirection;

      // 3. YUMUŞAK GEÇİŞLER (U Dönüşü ve Burnunu Yumuşakça Kaldırma)
      const tYaw = 1 - Math.pow(0.001, dt * TURN_SMOOTH_YAW);
      const tPitch = 1 - Math.pow(0.001, dt * TURN_SMOOTH_PITCH);
      
      currentYaw.current = lerpAngle(currentYaw.current, targetYaw, tYaw);
      currentPitch.current = lerp(currentPitch.current, targetPitch, tPitch);

    } else {
      fishVel.current.multiplyScalar(DRAG_STOP);
      
      // Durduğunda burnunu düzelt, ama sağa/sola bakışını (Yaw) koru.
      const tPitch = 1 - Math.pow(0.001, dt * TURN_SMOOTH_PITCH);
      currentPitch.current = lerp(currentPitch.current, 0, tPitch);
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

    // ==========================================
    // ✅ BALIĞA ROTASYONU UYGULAMA
    // Roll (Z) = Her zaman 0 (Asla yan yatmaz, ölü balık olmaz)
    // Yaw (Y) = Sağa/Sola bakış (U Dönüşü yapar)
    // Pitch (X) = Yukarı/Aşağı burun kaldırma (Göbek ve sırtı gösterir)
    //
    // NOT: Balığın orjinal burnu -X ekseninde olduğu için, sistemin X ekseni 
    // balığın Pitch ekseni gibi davranır. Y ekseni ise Yaw eksenidir.
    // ==========================================
    
    // Euler rotasyonu sırası 'YXZ' olarak ayarlanmalıdır ki dönüşler birbirini bozmasın.
    fishGroup.current.rotation.set(0, currentYaw.current, 0, 'YXZ');
    
    // Pitch (Burnu kaldırma/indirme) işlemini sadece Z ekseninde (ekran düzleminde) yapıyoruz.
    // Çünkü balık Y ekseninde sağa veya sola döndü. Artık burnunu kaldırmak için 
    // Global Z ekseninde (veya balığın yerel Z/X ekseninde) dönmesi gerekiyor.
    fishGroup.current.rotateZ(currentPitch.current);

    const swim = swimActionRef.current;
    if (swim) swim.paused = !moving;

    const cam = state.camera as THREE.PerspectiveCamera;
    const desiredCam = new THREE.Vector3(fishPos.current.x, fishPos.current.y, CAMERA_Z);
    const tCam = 1 - Math.pow(0.001, dt * CAMERA_SMOOTH);
    cam.position.lerp(desiredCam, tCam);
    cam.lookAt(cam.position.x, cam.position.y, 0); 
  });

  const surface = surfaceRef.current;

  return (
    <>
      <group ref={seaGroup}> <primitive object={sea.scene} /> </group>
      {surface && <InfiniteWaterRibbon width={surface.w} y={surface.y} z={surface.z} />}
      
      <group ref={fishGroup}> 
         <primitive object={fish.scene} /> 
      </group>

      <CanvasEvents onDown={updateTarget} onMove={updateTarget} onUp={() => dragging.current = false} />
    </>
  );
}

export default function EslemeGame() {
  const { lines, log, clear } = useOverlayLog();
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
      <Overlay title="ARCADE HİSSİYATI AKTİF" lines={lines} onClear={clear} />
      <Canvas camera={{ position: [0, 0, CAMERA_Z], fov: 45, near: 0.1, far: 5000 }} onCreated={({ scene }) => { scene.background = new THREE.Color(BG_COLOR); }}>
        <ambientLight intensity={1.0} />
        <directionalLight position={[10, 12, 10]} intensity={2.1} />
        <directionalLight position={[-10, -4, 2]} intensity={0.9} />
        <pointLight position={[0, 3, 8]} intensity={1.8} />
        <ScreenErrorBoundary onError={(m) => log(`Boundary: ${m}`, "error")}>
          <Suspense fallback={<Loader3D />}>
            {fishUrl && seaUrl && dracoBase ? ( <World fishUrl={fishUrl} seaUrl={seaUrl} dracoBase={dracoBase} log={log} /> ) : null}
          </Suspense>
        </ScreenErrorBoundary>
      </Canvas>
    </div>
  );
  }
