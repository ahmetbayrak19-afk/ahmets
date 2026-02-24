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

// 🔥 1. İSTEK: Balık 1.5 kat hızlandı (7.2 * 1.5 = 10.8)
const MAX_SPEED = 10.8; 
const ACCEL = 8.0; 
const DRAG_STOP = 0.90;
const Z_PLANE = 0; 

const CAMERA_Z = 10;
const CAMERA_SMOOTH = 5.0;

const SEA_ROT_Y = Math.PI / 2;
// 🔥 2. İSTEK: Deniz 2 kat büyüdü (2.0'dan 4.0'a çıktı)
const SEA_SCALE_MULT = 4.0; 
const FISH_SCALE = 3.0;

const TURN_SMOOTH_YAW = 8.0;   
const TURN_SMOOTH_PITCH = 8.0; 
const MAX_PITCH_ANGLE = Math.PI / 3; 

const BOUNCE = 0.6;
const BG_COLOR = "#0b2a46";

// 🔥 3. İSTEK: DENİZ YÜZEYİ İÇİN AYARLAR
const WATER_Y_OFFSET = -1.8;
const WATER_THICKNESS = 2.8;
const WATER_WAVE_STRENGTH = 0.35;
const WATER_SCROLL_SPEED = 0.08;
const WATER_TILES = 5;

function Loader3D() {
  const { progress } = useProgress();
  return ( <Html center> <div style={{ color: "white", background: "rgba(0,0,0,0.75)", padding: "10px 12px", borderRadius: 10, fontFamily: "monospace" }}> Yükleniyor: %{progress.toFixed(0)} </div> </Html> );
}

function CanvasEvents({ onDown, onUp }: { onDown: () => void; onUp: () => void; }) {
  return ( 
    <mesh position={[0, 0, Z_PLANE]} onPointerDown={onDown} onPointerUp={onUp} onPointerCancel={onUp} onPointerLeave={onUp}> 
      <planeGeometry args={[5000, 5000]} /> 
      <meshBasicMaterial transparent opacity={0} depthWrite={false} /> 
    </mesh> 
  );
}

// 🔥 DENİZ YÜZEYİ SHADER'I
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

function World({ fishUrl, seaUrl, dracoBase }: { fishUrl: string; seaUrl: string; dracoBase: string; }) {
  useMemo(() => { useGLTF.setDecoderPath(dracoBase.endsWith("/") ? dracoBase : `${dracoBase}/`); }, [dracoBase]);
  const sea = useGLTF(seaUrl); const fish = useGLTF(fishUrl);
  const seaGroup = useRef<THREE.Group>(null); 
  const fishGroup = useRef<THREE.Group>(null); 
  const fishInner = useRef<THREE.Group>(null); 
  
  const seaAnim = useAnimations(sea.animations, sea.scene); 
  const fishAnim = useAnimations(fish.animations, fish.scene);
  const swimActionRef = useRef<THREE.AnimationAction | null>(null);

  // Deniz yüzeyi için state
  const [surface, setSurface] = useState<{w: number, y: number, z: number} | null>(null);

  useEffect(() => { 
    const a = seaAnim.actions?.[SEA_ANIM_NAME] || (seaAnim.names?.[0] ? seaAnim.actions?.[seaAnim.names[0]] : null); 
    if (a) { a.reset().fadeIn(0.15).play(); a.timeScale = SEA_ANIM_SPEED; } 
  }, [seaAnim]);
  
  useEffect(() => { 
    const a = fishAnim.actions?.[FISH_SWIM_ANIM_NAME] || (fishAnim.names?.[0] ? fishAnim.actions?.[fishAnim.names[0]] : null); 
    if (a) { a.reset(); a.paused = true; a.play(); swimActionRef.current = a; } 
  }, [fishAnim]);

  const boundsRef = useRef({ minX: -50, maxX: 50, minY: -30, maxY: 30 });

  useEffect(() => {
    if (!seaGroup.current) return;
    const rawBox = new THREE.Box3().setFromObject(sea.scene);
    const size = new THREE.Vector3(); rawBox.getSize(size);
    sea.scene.scale.setScalar((Math.max(size.x, size.y, size.z) > 0 ? 90 / Math.max(size.x, size.y, size.z) : 1) * SEA_SCALE_MULT);
    seaGroup.current.position.set(0, 0, -20);
    seaGroup.current.rotation.set(0, SEA_ROT_Y, 0);
    
    const box = new THREE.Box3().setFromObject(seaGroup.current);
    boundsRef.current = { minX: box.min.x + 2, maxX: box.max.x - 2, minY: box.min.y + 2, maxY: box.max.y - 2 };
    
    // Yüzeyin konumunu hesaplayıp state'e atıyoruz
    setSurface({ w: (box.max.x - box.min.x) * 1.5, y: box.max.y, z: -20 });
  }, [sea.scene]);

  const fishPos = useRef(new THREE.Vector3(0, 0, Z_PLANE));
  const fishVel = useRef(new THREE.Vector2(0, 0));
  const fishTarget = useRef(new THREE.Vector3(0, 0, Z_PLANE));
  const dragging = useRef(false);

  const currentYaw = useRef(Math.PI / 2); 
  const currentPitch = useRef(0);

  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), -Z_PLANE), []);

  useFrame((state, dt) => {
    if (!fishGroup.current || !fishInner.current) return;

    if (dragging.current) {
      raycaster.setFromCamera(state.pointer, state.camera);
      raycaster.ray.intersectPlane(plane, fishTarget.current);
    }

    const b = boundsRef.current;
    fishTarget.current.x = THREE.MathUtils.clamp(fishTarget.current.x, b.minX, b.maxX);
    fishTarget.current.y = THREE.MathUtils.clamp(fishTarget.current.y, b.minY, b.maxY);

    const dx = fishTarget.current.x - fishPos.current.x;
    const dy = fishTarget.current.y - fishPos.current.y;
    const dist = Math.hypot(dx, dy);
    const moving = dragging.current && dist > 0.2;

    if (moving) {
      const nx = dx / dist; const ny = dy / dist;
      const a = 1 - Math.pow(0.001, dt * ACCEL);
      fishVel.current.x = lerp(fishVel.current.x, nx * MAX_SPEED, a);
      fishVel.current.y = lerp(fishVel.current.y, ny * MAX_SPEED, a);

      // KUSURSUZ DÖNÜŞ KODLARIN (Zerre dokunulmadı)
      let targetYaw = (nx > 0.05) ? -Math.PI / 2 : Math.PI / 2; 
      let targetPitch = -ny * MAX_PITCH_ANGLE; 

      currentYaw.current = lerpAngle(currentYaw.current, targetYaw, 1 - Math.pow(0.001, dt * TURN_SMOOTH_YAW));
      currentPitch.current = lerp(currentPitch.current, targetPitch, 1 - Math.pow(0.001, dt * TURN_SMOOTH_PITCH));
    } else {
      fishVel.current.multiplyScalar(DRAG_STOP);
      currentPitch.current = lerp(currentPitch.current, 0, 1 - Math.pow(0.001, dt * TURN_SMOOTH_PITCH));
    }

    fishPos.current.x += fishVel.current.x * dt;
    fishPos.current.y += fishVel.current.y * dt;

    if (fishPos.current.x <= b.minX || fishPos.current.x >= b.maxX) fishVel.current.x *= -BOUNCE;
    if (fishPos.current.y <= b.minY || fishPos.current.y >= b.maxY) fishVel.current.y *= -BOUNCE;

    fishGroup.current.position.copy(fishPos.current);
    fishGroup.current.rotation.y = currentYaw.current;
    fishInner.current.rotation.x = currentPitch.current;

    if (swimActionRef.current) swimActionRef.current.paused = !moving;

    state.camera.position.lerp(new THREE.Vector3(fishPos.current.x, fishPos.current.y, CAMERA_Z), 1 - Math.pow(0.001, dt * CAMERA_SMOOTH));
    state.camera.lookAt(fishPos.current.x, fishPos.current.y, 0); 
  });

  return (
    <>
      <group ref={seaGroup}> <primitive object={sea.scene} /> </group>
      
      {/* Yüzey Varsa Render Et */}
      {surface && <InfiniteWaterRibbon width={surface.w} y={surface.y} z={surface.z} />}

      <group ref={fishGroup} scale={FISH_SCALE}> 
         <group ref={fishInner}>
            <primitive object={fish.scene} /> 
         </group>
      </group>
      <CanvasEvents onDown={() => (dragging.current = true)} onUp={() => (dragging.current = false)} />
    </>
  );
}

export default function EslemeGame() {
  const [urls, setUrls] = useState({ fish: "", sea: "", draco: "" });
  useEffect(() => {
    const base = new URL("/assets/public/", window.location.origin).toString();
    setUrls({ fish: new URL("models/balik.glb", base).toString(), sea: new URL("models/deniz.glb", base).toString(), draco: new URL("draco/", base).toString() });
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", background: BG_COLOR, touchAction: "none" }}>
      <Canvas camera={{ position: [0, 0, CAMERA_Z], fov: 45 }}>
        
        {/* 🔥 4. İSTEK: SİS (FOG) EKLENDİ - Derinlik hissini arşa çıkarır */}
        <fog attach="fog" args={[BG_COLOR, 15, 45]} />

        <ambientLight intensity={1.5} />
        <directionalLight position={[10, 10, 10]} intensity={2} />
        <Suspense fallback={<Loader3D />}>
          {urls.fish && <World fishUrl={urls.fish} seaUrl={urls.sea} dracoBase={urls.draco} />}
        </Suspense>
      </Canvas>
    </div>
  );
    }
    
