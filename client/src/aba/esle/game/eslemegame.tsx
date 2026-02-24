import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree, extend, useLoader } from "@react-three/fiber";
import { Html, useAnimations, useGLTF, useProgress, Environment } from "@react-three/drei";
import * as THREE from "three";
import { Water } from "three-stdlib";

extend({ Water });

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

// GÜNDÜZ OKYANUSU RENKLERİ
const GRADIENT_TOP = "#3498db"; 
const GRADIENT_BOTTOM = "#104068"; 
const FOG_COLOR = GRADIENT_BOTTOM; 

// Lazer (Park Sensörü) Mesafesi
const SENSOR_DISTANCE = 3.5; 

// 🔥 YENİ: Zıplama Limiti (Suyun ne kadar üstüne çıkabilir)
const JUMP_LIMIT = 2.0;

const WATER_NORMALS_URL = "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg";

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

// ÇİFT TARAFLI GERÇEKÇİ SU EFEKTİ
function RealisticWater({ y }: { y: number }) {
  const refTop = useRef<any>();
  const refBottom = useRef<any>();
  
  const gl = useThree((state) => state.gl);
  const waterNormals = useLoader(THREE.TextureLoader, WATER_NORMALS_URL);
  waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;

  const geom = useMemo(() => new THREE.PlaneGeometry(2000, 2000), []);
  
  const config = useMemo(
    () => ({
      textureWidth: 512,
      textureHeight: 512,
      waterNormals,
      sunDirection: new THREE.Vector3(0.5, 1, 0.5).normalize(),
      sunColor: 0xffffff,
      waterColor: 0x0077be, 
      distortionScale: 3.7,
      fog: true,
      format: gl.encoding,
    }),
    [waterNormals, gl.encoding]
  );

  useFrame((state, delta) => {
    if (refTop.current) refTop.current.material.uniforms.time.value += delta * 0.5;
    if (refBottom.current) refBottom.current.material.uniforms.time.value += delta * 0.5;
  });

  const GAP = 0.02;

  return (
    <group position={[0, y, 0]}>
      <water ref={refTop} args={[geom, config]} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} />
      <water ref={refBottom} args={[geom, config]} rotation={[Math.PI / 2, 0, 0]} position={[0, -GAP, 0]} />
    </group>
  );
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
    
    setSurfaceY(boundsRef.current.maxY - 27);
  }, [sea.scene]);

  const fishPos = useRef(new THREE.Vector3(0, 0, Z_PLANE));
  const fishVel = useRef(new THREE.Vector2(0, 0));
  const fishTarget = useRef(new THREE.Vector3(0, 0, Z_PLANE));
  const dragging = useRef(false);

  const currentYaw = useRef(Math.PI / 2); 
  const currentPitch = useRef(0);
  const currentRoll = useRef(0); 

  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const collisionRaycaster = useMemo(() => new THREE.Raycaster(), []);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), -Z_PLANE), []);

  useFrame((state, dt) => {
    if (!fishGroup.current || !fishInner.current) return;

    const isAboveWater = fishPos.current.y > surfaceY;
    const maxJumpHeight = surfaceY + JUMP_LIMIT; // 🔥 Suyun 2 birim üstü

    if (dragging.current) {
      raycaster.setFromCamera(state.pointer, state.camera);
      raycaster.ray.intersectPlane(plane, fishTarget.current);
    }

    const b = boundsRef.current;
    
    // 🔥 YENİ: Parmağını uzaya kadar çeksen bile hedef suyun en fazla 2 birim üstü olabilir
    fishTarget.current.x = THREE.MathUtils.clamp(fishTarget.current.x, b.minX, b.maxX);
    fishTarget.current.y = THREE.MathUtils.clamp(fishTarget.current.y, b.minY, maxJumpHeight);

    const dx = fishTarget.current.x - fishPos.current.x;
    const dy = fishTarget.current.y - fishPos.current.y;
    const dist = Math.hypot(dx, dy);
    const moving = dragging.current && dist > 0.2;

    // LAZER KONTROLÜ (PARK SENSÖRÜ)
    let hitWall = false;
    if (moving || fishVel.current.lengthSq() > 0.1) {
       let dirX = moving ? dx : fishVel.current.x;
       let dirY = moving ? dy : fishVel.current.y;
       const moveDir = new THREE.Vector3(dirX, dirY, 0).normalize();
       
       collisionRaycaster.set(fishPos.current, moveDir);
       
       if (seaGroup.current) {
           const hits = collisionRaycaster.intersectObject(seaGroup.current, true);
           if (hits.length > 0 && hits[0].distance < SENSOR_DISTANCE) {
               hitWall = true; 
           }
       }
    }

    if (moving) {
      const nx = dx / dist; const ny = dy / dist;
      
      if (!hitWall) {
          const a = 1 - Math.pow(0.001, dt * ACCEL);
          fishVel.current.x = lerp(fishVel.current.x, nx * MAX_SPEED, a);
          fishVel.current.y = lerp(fishVel.current.y, ny * MAX_SPEED, a);
      } else {
          fishVel.current.multiplyScalar(0.7);
      }

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
      
      if (fishVel.current.y < 0) {
          collisionRaycaster.set(fishPos.current, new THREE.Vector3(0, -1, 0));
          if (seaGroup.current) {
              const hits = collisionRaycaster.intersectObject(seaGroup.current, true);
              if (hits.length > 0 && hits[0].distance < 2.0) {
                  fishVel.current.y *= -BOUNCE; 
              }
          }
      }
    }

    fishPos.current.x += fishVel.current.x * dt;
    fishPos.current.y += fishVel.current.y * dt;

    if (fishPos.current.x <= b.minX || fishPos.current.x >= b.maxX) fishVel.current.x *= -BOUNCE;
    
    // 🔥 ZEMİN VE TAVAN KİLİTLERİ
    if (fishPos.current.y <= b.minY) { 
        fishPos.current.y = b.minY; 
        fishVel.current.y *= -BOUNCE; 
    }
    // 🔥 YENİ: Havaya zıpladı ve 2 birim sınırına çarptıysa hızı kes, cup diye suya düşsün!
    else if (fishPos.current.y >= maxJumpHeight) {
        fishPos.current.y = maxJumpHeight;
        // Eğer hala yukarı çıkmaya çalışıyorsa hızını sıfırla ki yerçekimi onu hemen aşağı çeksin
        if (fishVel.current.y > 0) fishVel.current.y = 0;
    }

    fishGroup.current.position.copy(fishPos.current);
    fishGroup.current.rotation.y = currentYaw.current;
    fishInner.current.rotation.set(currentPitch.current, 0, currentRoll.current, 'XYZ');

    if (swimActionRef.current) swimActionRef.current.paused = !moving;

    const camSmooth = isAboveWater ? CAMERA_SMOOTH * 0.5 : CAMERA_SMOOTH;
    state.camera.position.lerp(new THREE.Vector3(fishPos.current.x, fishPos.current.y, CAMERA_Z), 1 - Math.pow(0.001, dt * camSmooth));
    state.camera.lookAt(fishPos.current.x, fishPos.current.y, 0); 
  });

  return (
    <>
      <group ref={seaGroup}> <primitive object={sea.scene} /> </group>
      <RealisticWater y={surfaceY} />
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
    <div style={{ width: "100vw", height: "100vh", background: `linear-gradient(to bottom, ${GRADIENT_TOP} 0%, ${GRADIENT_BOTTOM} 100%)`, touchAction: "none" }}>
      <Canvas camera={{ position: [0, 0, CAMERA_Z], fov: 45 }}>
        <Environment preset="sunset" />
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
