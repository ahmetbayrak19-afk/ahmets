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
const FISH_SWIM_ANIM_NAME = "yuzme";
const MAX_SPEED = 7.5;
const ACCEL = 8.0; 
const DRAG_STOP = 0.92;
const Z_PLANE = 0; 
const CAMERA_Z = 12;
const CAMERA_SMOOTH = 5.0;
const SEA_ROT_Y = Math.PI / 2;
const SEA_SCALE_MULT = 2.0;
const FISH_SCALE = 3.2;

// Dönüş Hassasiyetleri
const TURN_SMOOTH_YAW = 8.0;   
const TURN_SMOOTH_PITCH = 8.0; 
const MAX_PITCH_ANGLE = Math.PI / 4; // 45 derece burun kaldırma
const BELLY_ROLL_ANGLE = Math.PI / 6; // Yukarı çıkarken karın gösterme açısı (30 derece)

const BOUNCE = 0.6;
const BG_COLOR = "#0b2a46";

function Loader3D() {
  const { progress } = useProgress();
  return ( <Html center> <div style={{ color: "white", background: "rgba(0,0,0,0.75)", padding: "10px 12px", borderRadius: 10, fontFamily: "monospace" }}> %{progress.toFixed(0)} </div> </Html> );
}

function CanvasEvents({ onDown, onUp }: { onDown: () => void; onUp: () => void; }) {
  return ( 
    <mesh position={[0, 0, Z_PLANE]} onPointerDown={onDown} onPointerUp={onUp} onPointerCancel={onUp} onPointerLeave={onUp}> 
      <planeGeometry args={[5000, 5000]} /> 
      <meshBasicMaterial transparent opacity={0} depthWrite={false} /> 
    </mesh> 
  );
}

function World({ fishUrl, seaUrl, dracoBase }: { fishUrl: string; seaUrl: string; dracoBase: string; }) {
  useMemo(() => { useGLTF.setDecoderPath(dracoBase.endsWith("/") ? dracoBase : `${dracoBase}/`); }, [dracoBase]);
  const sea = useGLTF(seaUrl); const fish = useGLTF(fishUrl);
  const seaGroup = useRef<THREE.Group>(null); 
  const fishGroup = useRef<THREE.Group>(null); // Pozisyon ve Sağ-Sol (Yaw)
  const fishInner = useRef<THREE.Group>(null); // Burun Kaldırma (Pitch) ve Göbek Gösterme (Roll)
  
  const seaAnim = useAnimations(sea.animations, sea.scene); 
  const fishAnim = useAnimations(fish.animations, fish.scene);
  const swimActionRef = useRef<THREE.AnimationAction | null>(null);

  useEffect(() => { 
    const a = seaAnim.actions?.[SEA_ANIM_NAME] || (seaAnim.names?.[0] ? seaAnim.actions?.[seaAnim.names[0]] : null); 
    if (a) { a.reset().fadeIn(0.2).play(); a.timeScale = 0.2; } 
  }, [seaAnim]);
  
  useEffect(() => { 
    const a = fishAnim.actions?.[FISH_SWIM_ANIM_NAME] || (fishAnim.names?.[0] ? fishAnim.actions?.[fishAnim.names[0]] : null); 
    if (a) { a.reset(); a.paused = true; a.play(); swimActionRef.current = a; } 
  }, [fishAnim]);

  const boundsRef = useRef({ minX: -50, maxX: 50, minY: -30, maxY: 30 });

  useEffect(() => {
    if (!seaGroup.current) return;
    sea.scene.traverse((o: any) => { if (o?.isMesh) o.material.side = THREE.DoubleSide; });
    const rawBox = new THREE.Box3().setFromObject(sea.scene);
    const size = new THREE.Vector3(); rawBox.getSize(size);
    sea.scene.scale.setScalar((size.x > 0 ? 90 / size.x : 1) * SEA_SCALE_MULT);
    seaGroup.current.position.set(0, 0, -20);
    seaGroup.current.rotation.set(0, SEA_ROT_Y, 0);
    const box = new THREE.Box3().setFromObject(seaGroup.current);
    boundsRef.current = { minX: box.min.x + 3, maxX: box.max.x - 3, minY: box.min.y + 3, maxY: box.max.y - 3 };
  }, [sea.scene]);

  const fishPos = useRef(new THREE.Vector3(0, 0, Z_PLANE));
  const fishVel = useRef(new THREE.Vector2(0, 0));
  const fishTarget = useRef(new THREE.Vector3(0, 0, Z_PLANE));
  const dragging = useRef(false);

  // Başlangıç: Modelin sola bakması (0 derece)
  const currentYaw = useRef(0); 
  const currentPitch = useRef(0);
  const currentRoll = useRef(0);

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
      const lerpVal = 1 - Math.pow(0.001, dt * ACCEL);
      fishVel.current.x = lerp(fishVel.current.x, nx * MAX_SPEED, lerpVal);
      fishVel.current.y = lerp(fishVel.current.y, ny * MAX_SPEED, lerpVal);

      // ✅ YAW: Sola (0), Sağa (Math.PI)
      let targetYaw = (nx > 0.05) ? Math.PI : 0; 
      
      // ✅ PITCH (BURUN): Sola giderken ny, sağa giderken -ny (Kuyruk dikmeyi engeller)
      const pitchFix = (targetYaw > 1) ? -1 : 1;
      let targetPitch = ny * MAX_PITCH_ANGLE * pitchFix;

      // ✅ ROLL (GÖBEK): Yukarı çıkarken bize doğru (turuncu karın), aşağı inerken arkaya doğru
      let targetRoll = ny * BELLY_ROLL_ANGLE * pitchFix;

      currentYaw.current = lerpAngle(currentYaw.current, targetYaw, 1 - Math.pow(0.001, dt * TURN_SMOOTH_YAW));
      currentPitch.current = lerp(currentPitch.current, targetPitch, 1 - Math.pow(0.001, dt * TURN_SMOOTH_PITCH));
      currentRoll.current = lerp(currentRoll.current, targetRoll, 1 - Math.pow(0.001, dt * TURN_SMOOTH_PITCH));
    } else {
      fishVel.current.multiplyScalar(DRAG_STOP);
      currentPitch.current = lerp(currentPitch.current, 0, 1 - Math.pow(0.001, dt * TURN_SMOOTH_PITCH));
      currentRoll.current = lerp(currentRoll.current, 0, 1 - Math.pow(0.001, dt * TURN_SMOOTH_PITCH));
    }

    fishPos.current.x += fishVel.current.x * dt;
    fishPos.current.y += fishVel.current.y * dt;

    if (fishPos.current.x <= b.minX || fishPos.current.x >= b.maxX) fishVel.current.x *= -BOUNCE;
    if (fishPos.current.y <= b.minY || fishPos.current.y >= b.maxY) fishVel.current.y *= -BOUNCE;

    fishGroup.current.position.copy(fishPos.current);
    
    // ✅ DIŞ KUTU: Sadece Yaw (Sağ-Sol)
    fishGroup.current.rotation.y = currentYaw.current;
    
    // ✅ İÇ KUTU: Burun Kaldırma (Pitch) + Karın Gösterme (Roll)
    // Local Z ekseninde büküyoruz, böylece modelin burnu hep parmağı takip eder
    fishInner.current.rotation.z = currentPitch.current;
    
    // Local X ekseninde hafif yatırıyoruz, böylece yukarı çıkarken göbek görünür
    fishInner.current.rotation.x = currentRoll.current;

    if (swimActionRef.current) swimActionRef.current.paused = !moving;

    state.camera.position.lerp(new THREE.Vector3(fishPos.current.x, fishPos.current.y, CAMERA_Z), 1 - Math.pow(0.001, dt * CAMERA_SMOOTH));
    state.camera.lookAt(fishPos.current.x, fishPos.current.y, 0); 
  });

  return (
    <>
      <group ref={seaGroup}> <primitive object={sea.scene} /> </group>
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
        <ambientLight intensity={1.5} />
        <directionalLight position={[10, 10, 10]} intensity={2} />
        <Suspense fallback={<Loader3D />}>
          {urls.fish && <World fishUrl={urls.fish} seaUrl={urls.sea} dracoBase={urls.draco} />}
        </Suspense>
      </Canvas>
    </div>
  );
}
