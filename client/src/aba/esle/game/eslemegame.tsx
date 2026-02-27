import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, useAnimations, useGLTF, useProgress } from "@react-three/drei";
import * as THREE from "three";
import { SkeletonUtils } from "three-stdlib";

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
const FISH_EAT_ANIM_NAME = "yeme"; 

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

function WaterCeiling({ y }: { y: number }) {
  const mat = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      uniforms: { uTime: { value: 0 } },
      vertexShader: ` varying vec2 vUv; varying vec3 vWorldPos; uniform float uTime; void main() { vUv = uv; vec3 pos = position; pos.z += sin(pos.x * 0.1 + uTime * 0.8) * cos(pos.y * 0.1 + uTime * 0.6) * 3.0; vec4 worldPosition = modelMatrix * vec4(pos, 1.0); vWorldPos = worldPosition.xyz; gl_Position = projectionMatrix * viewMatrix * worldPosition; } `,
      fragmentShader: ` varying vec2 vUv; varying vec3 vWorldPos; uniform float uTime; void main() { vec2 p = vWorldPos.xz * 0.05; float time = uTime * 0.5; float w1 = sin(p.x + time) * cos(p.y + time * 0.8); float w2 = sin(p.x * 2.3 - time * 1.1) * cos(p.y * 2.1 + time * 0.9); float w3 = sin(p.x * 5.1 + time * 1.5) * cos(p.y * 4.8 - time * 1.2); float w = (w1 + w2 * 0.5 + w3 * 0.25); vec3 deepColor = vec3(0.04, 0.18, 0.35); vec3 lightColor = vec3(0.16, 0.71, 0.95); vec3 col = mix(deepColor, lightColor, w * 0.5 + 0.5); float sun = pow(max(0.0, w), 4.0); col += vec3(0.8, 0.9, 1.0) * sun * 0.8; float dist = distance(cameraPosition, vWorldPos); float alpha = 1.0 - smoothstep(40.0, 120.0, dist); gl_FragColor = vec4(col, 0.85 * alpha); } `
    });
  }, []);
  const geom = useMemo(() => new THREE.PlaneGeometry(1000, 1000, 64, 64), []);
  useFrame((_, dt) => { mat.uniforms.uTime.value += dt; });
  return ( <mesh geometry={geom} material={mat} rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]} /> );
}

function PreyFish({ gltf, boundsRef, playerPos, onEaten, scale, speed }: any) {
  const scene = useMemo(() => SkeletonUtils.clone(gltf.scene), [gltf.scene]);
  const anims = useAnimations(gltf.animations, scene);
  
  const [eaten, setEaten] = useState(false);
  const [isDead, setIsDead] = useState(false);
  // 🔥 YENİ: Ağzın erken açıldığını takip eden state
  const [mouthOpened, setMouthOpened] = useState(false);
  const currentScale = useRef(scale);
  
  const pos = useRef(new THREE.Vector3(
     THREE.MathUtils.randFloat(boundsRef.current.minX, boundsRef.current.maxX),
     THREE.MathUtils.randFloat(boundsRef.current.minY, boundsRef.current.maxY),
     Z_PLANE
  ));
  const target = useRef(new THREE.Vector3().copy(pos.current));
  const vel = useRef(new THREE.Vector3());
  const yaw = useRef(0);
  const pitch = useRef(0);

  const groupRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Group>(null);

  useEffect(() => {
      if (anims.names.length > 0) {
         const action = anims.actions[anims.names[0]];
         action?.reset().play();
      }
  }, [anims]);

  useFrame((state, dt) => {
     if (isDead || !groupRef.current || !innerRef.current) return;
     
     const distToPlayer = pos.current.distanceTo(playerPos.current);

     // 🔥 ZAMANLAMA ÇÖZÜMÜ BURADA 🔥
     
     // 1. AŞAMA: 2.5 birim kala balık ağzını açar (Animasyon başlar)
     if (!mouthOpened && distToPlayer < 2.5) {
         setMouthOpened(true);
         onEaten(); // Animasyonu tetikle ama küçültmeye başlama
     } 
     // Diyelim ki ağzını açtı ama av kaçtı, sistemi sıfırla ki tekrar ağız açabilsin
     else if (mouthOpened && !eaten && distToPlayer > 3.5) {
         setMouthOpened(false);
     }

     // 2. AŞAMA: 1.2 birim kala tam ağzına girdiğinde vakumlama başlar
     if (!eaten && distToPlayer < 1.2) {
         setEaten(true); 
     }

     // Vakumlama (Yutulma) Aksiyonu
     if (eaten) {
         currentScale.current = lerp(currentScale.current, 0, dt * 20.0); 
         pos.current.lerp(playerPos.current, dt * 15.0); 
         
         groupRef.current.position.copy(pos.current);
         groupRef.current.scale.setScalar(currentScale.current);
         
         if (currentScale.current < 0.05) setIsDead(true);
         return; 
     }

     // Rastgele Gezinme Mantığı (Aynı kaldı)
     if (pos.current.distanceTo(target.current) < 2) {
         target.current.set(
            THREE.MathUtils.randFloat(boundsRef.current.minX, boundsRef.current.maxX),
            THREE.MathUtils.randFloat(boundsRef.current.minY, boundsRef.current.maxY),
            Z_PLANE
         );
     }

     const dir = new THREE.Vector3().subVectors(target.current, pos.current).normalize();
     vel.current.lerp(dir.multiplyScalar(speed), 0.05);

     pos.current.add(vel.current.clone().multiplyScalar(dt));
     
     const targetYaw = vel.current.x < 0 ? Math.PI/2 : -Math.PI/2;
     yaw.current = lerpAngle(yaw.current, targetYaw, 0.1);
     const targetPitch = (vel.current.y / speed) * (Math.PI / 4);
     pitch.current = lerp(pitch.current, targetPitch, 0.1);

     groupRef.current.position.copy(pos.current);
     groupRef.current.rotation.y = yaw.current;
     innerRef.current.rotation.x = pitch.current;
     groupRef.current.scale.setScalar(scale); 
  });

  if (isDead) return null; 
  return (
      <group ref={groupRef}>
          <group ref={innerRef}>
              <primitive object={scene} />
          </group>
      </group>
  );
}

function World({ urls }: any) {
  useMemo(() => { useGLTF.setDecoderPath(urls.draco.endsWith("/") ? urls.draco : `${urls.draco}/`); }, [urls.draco]);
  const sea = useGLTF(urls.sea); 
  const fish = useGLTF(urls.fish);
  const vatoz = useGLTF(urls.vatoz);
  const kilicbalik = useGLTF(urls.kilicbalik);
  const hamsi = useGLTF(urls.hamsi);

  const seaGroup = useRef<THREE.Group>(null); 
  const fishGroup = useRef<THREE.Group>(null); 
  const fishInner = useRef<THREE.Group>(null); 
  
  const seaAnim = useAnimations(sea.animations, sea.scene); 
  const fishAnim = useAnimations(fish.animations, fish.scene);
  
  const swimActionRef = useRef<THREE.AnimationAction | null>(null);
  const eatActionRef = useRef<THREE.AnimationAction | null>(null);
  const eatTimer = useRef(0); 

  const [surfaceY, setSurfaceY] = useState(20);
  const [boundsReady, setBoundsReady] = useState(false);
  const cameraTarget = useMemo(() => new THREE.Vector3(), []); 

  useEffect(() => { 
    if (seaAnim.actions?.[SEA_ANIM_NAME]) { 
        seaAnim.actions[SEA_ANIM_NAME].reset().fadeIn(0.15).play(); 
        seaAnim.actions[SEA_ANIM_NAME].timeScale = 0.2; 
    } 
  }, [seaAnim]);
  
  // 🔥 ANİMASYON AĞIRLIKLARI (WEIGHT) BURADA AYARLANDI
  useEffect(() => { 
    if (fishAnim.actions) {
        // Büyük/Küçük harf duyarlılığını kaldırdık
        const swimName = fishAnim.names.includes(FISH_SWIM_ANIM_NAME) ? FISH_SWIM_ANIM_NAME : fishAnim.names[0];
        const eatName = fishAnim.names.includes(FISH_EAT_ANIM_NAME) ? FISH_EAT_ANIM_NAME : fishAnim.names.find(n => n.toLowerCase().includes("yeme"));

        const swim = fishAnim.actions[swimName];
        const eat = eatName ? fishAnim.actions[eatName] : null;
        
        if (swim) { 
            swim.reset().play(); 
            swim.setEffectiveWeight(1); // Yüzme başlangıçta tam görünür
            swimActionRef.current = swim; 
        }
        if (eat) { 
            eat.reset().play(); 
            eat.setEffectiveWeight(0); // Yeme animasyonu başlangıçta görünmez
            eatActionRef.current = eat; 
        }
    }
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
      minX: box.min.x + 28, 
      maxX: box.max.x - 23, 
      minY: box.min.y + 14, 
      maxY: box.max.y - 2  
    };
    
    setSurfaceY(boundsRef.current.maxY - 16);
    setBoundsReady(true); 
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

  // 🔥 YEDİĞİ AN ÇALIŞACAK MANTIK
  const handleEaten = useCallback(() => {
      if (eatActionRef.current) {
          // Yüzmeyi tamamen kapat
          if (swimActionRef.current) swimActionRef.current.setEffectiveWeight(0);
          
          // Yemeyi aç ve baştan oynat
          eatActionRef.current.setEffectiveWeight(1);
          eatActionRef.current.reset().play();
      }
      eatTimer.current = 1.0; // 1 saniye boyunca yeme animasyonu devrede kalacak
  }, []);

  const preys = useMemo(() => {
      return [
          ...Array(10).fill({ gltf: vatoz, scale: 3.0, speed: 1.0 }), 
          ...Array(10).fill({ gltf: kilicbalik, scale: 3.75, speed: 1.5 }), 
          ...Array(15).fill({ gltf: hamsi, scale: 3.0, speed: 1.2 }) 
      ];
  }, [vatoz, kilicbalik, hamsi]);

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

    if (fishPos.current.x <= b.minX || fishPos.current.x >= b.maxX) fishVel.current.x *= -BOUNCE;
    if (fishPos.current.y <= b.minY) { 
        fishPos.current.y = b.minY; 
        fishVel.current.y *= -BOUNCE; 
    }
    else if (fishPos.current.y >= maxJumpHeight) {
        fishPos.current.y = maxJumpHeight;
        if (fishVel.current.y > 0) fishVel.current.y = 0;
    }

    // 🔥 SÜRE BİTİNCE YÜZMEYE GERİ DÖN
    if (eatTimer.current > 0) {
        eatTimer.current -= dt;
        
        if (eatTimer.current <= 0) {
            // Yeme bitti, yemeyi tamamen kapat
            if (eatActionRef.current) eatActionRef.current.setEffectiveWeight(0);
            
            // Yüzmeyi tekrar aç
            if (swimActionRef.current) {
                swimActionRef.current.setEffectiveWeight(1);
                swimActionRef.current.paused = !moving; // Sadece duruyorsa pause yap
            }
        }
    } else {
        if (swimActionRef.current) swimActionRef.current.paused = !moving;
    }

    fishGroup.current.position.copy(fishPos.current);
    fishGroup.current.rotation.y = currentYaw.current;
    fishInner.current.rotation.set(currentPitch.current, 0, currentRoll.current, 'XYZ');

    const camSmooth = isAboveWater ? CAMERA_SMOOTH * 0.5 : CAMERA_SMOOTH;
    cameraTarget.set(fishPos.current.x, fishPos.current.y, CAMERA_Z);
    state.camera.position.lerp(cameraTarget, 1 - Math.pow(0.001, dt * camSmooth));
    state.camera.lookAt(fishPos.current.x, fishPos.current.y, 0); 
  });

  return (
    <>
      <group ref={seaGroup}> <primitive object={sea.scene} /> </group>
      <WaterCeiling y={surfaceY} />
      
      <group ref={fishGroup} scale={FISH_SCALE}> 
         <group ref={fishInner}>
            <primitive object={fish.scene} /> 
         </group>
      </group>

      {boundsReady && preys.map((p, i) => (
          <PreyFish 
             key={i} 
             gltf={p.gltf} 
             boundsRef={boundsRef} 
             playerPos={fishPos} 
             onEaten={handleEaten} 
             scale={p.scale} 
             speed={p.speed} 
          />
      ))}

      <CanvasEvents onDown={() => (dragging.current = true)} onUp={() => (dragging.current = false)} />
    </>
  );
}

export default function EslemeGame() {
  const [urls, setUrls] = useState<any>(null);
  
  useEffect(() => {
    const base = new URL("/assets/public/", window.location.origin).toString();
    setUrls({ 
        fish: new URL("models/balik.glb", base).toString(), 
        sea: new URL("models/deniz.glb", base).toString(), 
        vatoz: new URL("models/vatoz.glb", base).toString(), 
        kilicbalik: new URL("models/kilicbalik.glb", base).toString(), 
        hamsi: new URL("models/hamsi.glb", base).toString(), 
        draco: new URL("draco/", base).toString() 
    });
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", background: `linear-gradient(to bottom, ${GRADIENT_TOP} 0%, ${GRADIENT_BOTTOM} 100%)`, touchAction: "none" }}>
      <Canvas camera={{ position: [0, 0, CAMERA_Z], fov: 45 }}>
        <fog attach="fog" args={[FOG_COLOR, 30, 80]} />
        <ambientLight intensity={1.5} />
        <directionalLight position={[10, 10, 10]} intensity={2} />
        <Suspense fallback={<Loader3D />}>
          {urls && <World urls={urls} />}
        </Suspense>
      </Canvas>
    </div>
  );
  }
