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

const MAX_SPEED = 10.8; 
const ACCEL = 8.0; 
const DRAG_STOP = 0.90;
const Z_PLANE = 0; 

const GRAVITY = 35.0; 

const CAMERA_Z = 10;
const CAMERA_SMOOTH = 5.0;

const SEA_ROT_Y = Math.PI / 2;
const SEA_SCALE_MULT = 4.0; 
const FISH_SCALE = 3.0;

const TURN_SMOOTH_YAW = 8.0;   
const TURN_SMOOTH_PITCH = 8.0; 

const MAX_PITCH_ANGLE = Math.PI / 2; 
const BELLY_ROLL_ANGLE = Math.PI / 2; 

const BOUNCE = 0.6;

const GRADIENT_TOP = "#3498db"; 
const GRADIENT_BOTTOM = "#104068"; 
const FOG_COLOR = GRADIENT_BOTTOM; 

const JUMP_LIMIT = 2.0;

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

// OPTİMİZE EDİLMİŞ SU TAVANI (64x64 Poligon)
function WaterCeiling({ y }: { y: number }) {
  const mat = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vWorldPos;
        uniform float uTime;
        void main() {
          vUv = uv;
          vec3 pos = position;
          pos.z += sin(pos.x * 0.1 + uTime * 0.8) * cos(pos.y * 0.1 + uTime * 0.6) * 3.0;
          vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
          vWorldPos = worldPosition.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying vec3 vWorldPos;
        uniform float uTime;
        void main() {
          vec2 p = vWorldPos.xz * 0.05;
          float time = uTime * 0.5;
          float w1 = sin(p.x + time) * cos(p.y + time * 0.8);
          float w2 = sin(p.x * 2.3 - time * 1.1) * cos(p.y * 2.1 + time * 0.9);
          float w3 = sin(p.x * 5.1 + time * 1.5) * cos(p.y * 4.8 - time * 1.2);
          float w = (w1 + w2 * 0.5 + w3 * 0.25);
          vec3 deepColor = vec3(0.04, 0.18, 0.35);
          vec3 lightColor = vec3(0.16, 0.71, 0.95);
          vec3 col = mix(deepColor, lightColor, w * 0.5 + 0.5);
          float sun = pow(max(0.0, w), 4.0);
          col += vec3(0.8, 0.9, 1.0) * sun * 0.8;
          float dist = distance(cameraPosition, vWorldPos);
          float alpha = 1.0 - smoothstep(40.0, 120.0, dist);
          gl_FragColor = vec4(col, 0.85 * alpha);
        }
      `
    });
  }, []);
  
  const geom = useMemo(() => new THREE.PlaneGeometry(1000, 1000, 64, 64), []);
  useFrame((_, dt) => { mat.uniforms.uTime.value += dt; });
  return ( <mesh geometry={geom} material={mat} rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]} /> );
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

  const [surfaceY, setSurfaceY] = useState(20);
  const cameraTarget = useMemo(() => new THREE.Vector3(), []); 

  // 🔥 ÇARPMA HİSSİ İÇİN YENİ DEĞİŞKENLER
  const shakeIntensity = useRef(0); 
  const impactScale = useRef(new THREE.Vector3(FISH_SCALE, FISH_SCALE, FISH_SCALE)); 
  const defaultScale = useMemo(() => new THREE.Vector3(FISH_SCALE, FISH_SCALE, FISH_SCALE), []);

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
    
    boundsRef.current = { 
      minX: box.min.x + 8, 
      maxX: box.max.x - 8, 
      minY: box.min.y + 9, 
      maxY: box.max.y - 2  
    };
    
    setSurfaceY(boundsRef.current.maxY - 16);
  }, [sea.scene]);

  const fishPos = useRef(new THREE.Vector3(0, 0, Z_PLANE));
  const fishVel = useRef(new THREE.Vector2(0, 0));
  const fishTarget = useRef(new THREE.Vector3(0, 0, Z_PLANE));
  const dragging = useRef(false);

  const currentYaw = useRef(Math.PI / 2); 
  const currentPitch = useRef(0);
  const currentRoll = useRef(0); 

  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), -Z_PLANE), []);

  useFrame((state, dt) => {
    if (!fishGroup.current || !fishInner.current) return;

    const isAboveWater = fishPos.current.y > surfaceY;
    const maxJumpHeight = surfaceY + JUMP_LIMIT; 

    if (dragging.current) {
      raycaster.setFromCamera(state.pointer, state.camera);
      raycaster.ray.intersectPlane(plane, fishTarget.current);
    }

    const b = boundsRef.current;
    fishTarget.current.x = THREE.MathUtils.clamp(fishTarget.current.x, b.minX, b.maxX);
    fishTarget.current.y = THREE.MathUtils.clamp(fishTarget.current.y, b.minY, maxJumpHeight);

    const dx = fishTarget.current.x - fishPos.current.x;
    const dy = fishTarget.current.y - fishPos.current.y;
    const dist = Math.hypot(dx, dy);
    const moving = dragging.current && dist > 0.2;

    if (moving) {
      const nx = dx / dist; const ny = dy / dist;
      const a = 1 - Math.pow(0.001, dt * ACCEL);
      
      fishVel.current.x = lerp(fishVel.current.x, nx * MAX_SPEED, a);
      fishVel.current.y = lerp(fishVel.current.y, ny * MAX_SPEED, a);

      let targetYaw = currentYaw.current;
      if (nx > 0.05) targetYaw = -Math.PI / 2; 
      else if (nx < -0.05) targetYaw = Math.PI / 2; 
      
      let targetPitch = ny * MAX_PITCH_ANGLE; 
      const rollDirection = (targetYaw < 0) ? 1 : -1;
      let targetRoll = ny * BELLY_ROLL_ANGLE * rollDirection;

      currentYaw.current = lerpAngle(currentYaw.current, targetYaw, 1 - Math.pow(0.001, dt * TURN_SMOOTH_YAW));
      currentPitch.current = lerp(currentPitch.current, targetPitch, 1 - Math.pow(0.001, dt * TURN_SMOOTH_PITCH));
      currentRoll.current = lerp(currentRoll.current, targetRoll, 1 - Math.pow(0.001, dt * TURN_SMOOTH_PITCH));
    } else {
      fishVel.current.multiplyScalar(DRAG_STOP);
      currentPitch.current = lerp(currentPitch.current, 0, 1 - Math.pow(0.001, dt * TURN_SMOOTH_PITCH));
      currentRoll.current = lerp(currentRoll.current, 0, 1 - Math.pow(0.001, dt * TURN_SMOOTH_PITCH));
    }

    if (isAboveWater) {
      fishVel.current.y -= GRAVITY * dt;
      if (!moving && fishVel.current.y < 0) {
         currentPitch.current = lerp(currentPitch.current, -Math.PI/4, 0.1);
      }
    }

    fishPos.current.x += fishVel.current.x * dt;
    fishPos.current.y += fishVel.current.y * dt;

    // 🔥 ÇARPIŞMA (IMPACT) KONTROLLERİ VE EFEKTLERİ 🔥
    let hitOccurred = false;
    let hitAxis = ""; // Hangi yönden çarptı (X yatay, Y dikey)

    // X Ekseni (Sağ ve Sol Duvarlar)
    if (fishPos.current.x <= b.minX) {
        fishPos.current.x = b.minX;
        if (Math.abs(fishVel.current.x) > 2.0) { hitOccurred = true; hitAxis = "X"; } // Sadece hızlı çarpınca etki etsin
        fishVel.current.x *= -BOUNCE;
    } else if (fishPos.current.x >= b.maxX) {
        fishPos.current.x = b.maxX;
        if (Math.abs(fishVel.current.x) > 2.0) { hitOccurred = true; hitAxis = "X"; }
        fishVel.current.x *= -BOUNCE;
    }

    // Y Ekseni (Zemin ve Tavan)
    if (fishPos.current.y <= b.minY) { 
        fishPos.current.y = b.minY; 
        if (Math.abs(fishVel.current.y) > 2.0) { hitOccurred = true; hitAxis = "Y"; }
        fishVel.current.y *= -BOUNCE; 
    }
    else if (fishPos.current.y >= maxJumpHeight) {
        fishPos.current.y = maxJumpHeight;
        if (fishVel.current.y > 2.0) { hitOccurred = true; hitAxis = "Y"; }
        if (fishVel.current.y > 0) fishVel.current.y = 0;
    }

    // 🔥 EFEKTİ TETİKLE: SADECE SERT ÇARPIŞMALARDA
    if (hitOccurred) {
        shakeIntensity.current = 0.4; // Kamera ne kadar sarsılacak
        
        // Jöle Etkisi (Squash & Stretch)
        if (hitAxis === "X") {
            // Yanlara çarptı: Boyu kısalır, karnı şişer
            impactScale.current.set(FISH_SCALE * 0.4, FISH_SCALE * 1.5, FISH_SCALE * 1.5);
        } else {
            // Yere/Tavana çarptı: Karnı yassılaşır, boyu uzar
            impactScale.current.set(FISH_SCALE * 1.5, FISH_SCALE * 0.4, FISH_SCALE * 1.5);
        }

        // Telefonda titreşim hissi (Eğer cihaz destekliyorsa)
        if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate(40); // 40 milisaniyelik tok bir titreşim
        }
    }

    // 🔥 Jöle halinden normal haline (defaultScale) pürüzsüz geri dönüş
    impactScale.current.lerp(defaultScale, 0.15); // Hızlıca eski haline döner
    fishGroup.current.scale.copy(impactScale.current);

    fishGroup.current.position.copy(fishPos.current);
    fishGroup.current.rotation.y = currentYaw.current;
    fishInner.current.rotation.set(currentPitch.current, 0, currentRoll.current, 'XYZ');

    if (swimActionRef.current) swimActionRef.current.paused = !moving;

    // 🔥 KAMERA SARSINTISI UYGULAMA (Screen Shake)
    let camX = fishPos.current.x;
    let camY = fishPos.current.y;

    if (shakeIntensity.current > 0) {
        // Kamerayı rastgele sağa sola titret
        camX += (Math.random() - 0.5) * shakeIntensity.current;
        camY += (Math.random() - 0.5) * shakeIntensity.current;
        
        // Sarsıntı zamanla azalsın (Fade out)
        shakeIntensity.current -= dt * 1.5; 
        if (shakeIntensity.current < 0) shakeIntensity.current = 0;
    }

    const camSmooth = isAboveWater ? CAMERA_SMOOTH * 0.5 : CAMERA_SMOOTH;
    cameraTarget.set(camX, camY, CAMERA_Z);
    state.camera.position.lerp(cameraTarget, 1 - Math.pow(0.001, dt * camSmooth));
    state.camera.lookAt(camX, camY, 0); 
  });

  return (
    <>
      <group ref={seaGroup}> <primitive object={sea.scene} /> </group>
      <WaterCeiling y={surfaceY} />
      <group ref={fishGroup}> 
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
    <div style={{ width: "100vw", height: "100vh", background: `linear-gradient(to bottom, ${GRADIENT_TOP} 0%, ${GRADIENT_BOTTOM} 100%)`, touchAction: "none" }}>
      <Canvas camera={{ position: [0, 0, CAMERA_Z], fov: 45 }}>
        <fog attach="fog" args={[FOG_COLOR, 30, 80]} />
        <ambientLight intensity={1.5} />
        <directionalLight position={[10, 10, 10]} intensity={2} />
        <Suspense fallback={<Loader3D />}>
          {urls.fish && <World fishUrl={urls.fish} seaUrl={urls.sea} dracoBase={urls.draco} />}
        </Suspense>
      </Canvas>
    </div>
  );
      }
