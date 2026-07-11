import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, useAnimations, useGLTF, useProgress } from "@react-three/drei";
import * as THREE from "three";
import { SkeletonUtils } from "three-stdlib";

function lerp(start: number, end: number, t: number) {
  return start * (1 - t) + end * t;
}
function lerpAngle(a: number, b: number, t: number) {
  const TWO_PI = Math.PI * 2;
  let diff = (b - a) % TWO_PI;
  diff = (2 * diff) % TWO_PI - diff;
  return a + diff * t;
}

const SEA_ANIM_NAME = "yeme";
const FISH_SWIM_ANIM_NAME = "yuzme";
const FISH_EAT_ANIM_NAME = "yeme";

const MAX_SPEED = 10.8;
const ACCEL = 8.0;
const DRAG_STOP = 0.90;
const MAIN_PLAY_Z_PLANE = 0;
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
  return (
    <Html center>
      <div style={{ color: "white", background: "rgba(0,0,0,0.75)", padding: "10px 12px", borderRadius: 10, fontFamily: "monospace" }}>
        Yükleniyor: %{progress.toFixed(0)}
      </div>
    </Html>
  );
}

function CanvasEvents({ onDown, onUp }: { onDown: () => void; onUp: () => void; }) {
  return (
    <mesh position={[0, 0, MAIN_PLAY_Z_PLANE]} onPointerDown={onDown} onPointerUp={onUp} onPointerCancel={onUp} onPointerLeave={onUp}>
      <planeGeometry args={[5000, 5000]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

function WaterCeiling({ y }: { y: number }) {
  const mat = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        varying vec2 vUv; varying vec3 vWorldPos; uniform float uTime;
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
        varying vec2 vUv; varying vec3 vWorldPos; uniform float uTime;
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
  return <mesh geometry={geom} material={mat} rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]} />;
}

function PreyFish({ gltf, boundsRef, playerPos, onEaten, scale, speed }: any) {
  const scene = useMemo(() => SkeletonUtils.clone(gltf.scene), [gltf.scene]);
  const anims = useAnimations(gltf.animations, scene);
  const [eaten, setEaten] = useState(false);
  const [isDead, setIsDead] = useState(false);
  const [mouthOpened, setMouthOpened] = useState(false);
  const currentScale = useRef(scale);
  const pos = useRef(new THREE.Vector3(
    THREE.MathUtils.randFloat(boundsRef.current.minX, boundsRef.current.maxX),
    THREE.MathUtils.randFloat(boundsRef.current.minY, boundsRef.current.maxY),
    MAIN_PLAY_Z_PLANE
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

    if (!mouthOpened && distToPlayer < 2.5) {
      setMouthOpened(true);
      onEaten();
    } else if (mouthOpened && !eaten && distToPlayer > 3.5) {
      setMouthOpened(false);
    }
    if (!eaten && distToPlayer < 1.2) setEaten(true);

    if (eaten) {
      currentScale.current = lerp(currentScale.current, 0, dt * 20.0);
      pos.current.lerp(playerPos.current, dt * 15.0);
      groupRef.current.position.copy(pos.current);
      groupRef.current.scale.setScalar(currentScale.current);
      if (currentScale.current < 0.05) setIsDead(true);
      return;
    }

    if (pos.current.distanceTo(target.current) < 2) {
      target.current.set(
        THREE.MathUtils.randFloat(boundsRef.current.minX, boundsRef.current.maxX),
        THREE.MathUtils.randFloat(boundsRef.current.minY, boundsRef.current.maxY),
        MAIN_PLAY_Z_PLANE
      );
    }

    const dir = new THREE.Vector3().subVectors(target.current, pos.current).normalize();
    vel.current.lerp(dir.multiplyScalar(speed), 0.05);
    pos.current.add(vel.current.clone().multiplyScalar(dt));

    const targetYaw = vel.current.x < 0 ? Math.PI / 2 : -Math.PI / 2;
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

function BackgroundDecoration({ gltfFiles, boundary, count, zRange }: any) {
  const preyModels = useMemo(() => [
    { gltf: gltfFiles.vatoz, scaleMult: 1.2 },
    { gltf: gltfFiles.kilicbalik, scaleMult: 1.5 },
    { gltf: gltfFiles.hamsi, scaleMult: 1.0 }
  ], [gltfFiles]);

  return (
    <group>
      {Array.from({ length: count }).map((_, i) => {
        const randomModel = preyModels[THREE.MathUtils.randInt(0, preyModels.length - 1)];
        return (
          <BackgroundFish
            key={i}
            gltf={randomModel.gltf}
            scaleMult={randomModel.scaleMult}
            boundary={boundary}
            zRange={zRange}
          />
        );
      })}
    </group>
  );
}

function BackgroundFish({ gltf, scaleMult, boundary, zRange }: any) {
  const scene = useMemo(() => SkeletonUtils.clone(gltf.scene), [gltf.scene]);
  const anims = useAnimations(gltf.animations, scene);
  const z = useMemo(() => THREE.MathUtils.randFloat(zRange[0], zRange[1]), [zRange]);
  const speed = useMemo(() => THREE.MathUtils.randFloat(1, 4), []);
  const direction = useMemo(() => (Math.random() > 0.5 ? 1 : -1), []);
  const depthFactor = (z - zRange[0]) / (zRange[1] - zRange[0]);
  const scale = (0.5 + depthFactor * 1.0) * scaleMult;
  const pos = useRef(new THREE.Vector3(
    THREE.MathUtils.randFloat(boundary.minX - 50, boundary.maxX + 50),
    THREE.MathUtils.randFloat(boundary.minY - 20, boundary.maxY + 10),
    z
  ));
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (anims.names.length > 0) {
      const action = anims.actions[anims.names[0]];
      action?.reset().play();
      action!.timeScale = THREE.MathUtils.randFloat(0.5, 1.2);
    }
  }, [anims]);

  useFrame((state, dt) => {
    if (!groupRef.current) return;
    pos.current.x += speed * direction * dt;
    if (direction === 1 && pos.current.x > boundary.maxX + 50) pos.current.x = boundary.minX - 50;
    else if (direction === -1 && pos.current.x < boundary.minX - 50) pos.current.x = boundary.maxX + 50;
    groupRef.current.position.copy(pos.current);
    groupRef.current.rotation.y = direction === 1 ? -Math.PI / 2 : Math.PI / 2;
    groupRef.current.scale.setScalar(scale);
  });

  return <group ref={groupRef}><primitive object={scene} /></group>;
}

function World({ urls, setFishPosition }: any) {
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

  useEffect(() => {
    if (fishAnim.actions) {
      const swimName = fishAnim.names.includes(FISH_SWIM_ANIM_NAME) ? FISH_SWIM_ANIM_NAME : fishAnim.names[0];
      const eatName = fishAnim.names.includes(FISH_EAT_ANIM_NAME) ? FISH_EAT_ANIM_NAME : fishAnim.names.find(n => n.toLowerCase().includes("yeme"));
      const swim = fishAnim.actions[swimName];
      const eat = eatName ? fishAnim.actions[eatName] : null;
      if (swim) { swim.reset().play(); swim.setEffectiveWeight(1); swimActionRef.current = swim; }
      if (eat) { eat.reset().play(); eat.setEffectiveWeight(0); eatActionRef.current = eat; }
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
      minX: box.min.x + 50,
      maxX: box.max.x - 27,
      minY: box.min.y + 28,
      maxY: box.max.y - 2
    };
    setSurfaceY(boundsRef.current.maxY - 16);
    setBoundsReady(true);
  }, [sea.scene]);

  const fishPos = useRef(new THREE.Vector3(0, 0, MAIN_PLAY_Z_PLANE));
  const fishVel = useRef(new THREE.Vector2(0, 0));
  const fishTarget = useRef(new THREE.Vector3(0, 0, MAIN_PLAY_Z_PLANE));
  const dragging = useRef(false);
  const currentYaw = useRef(Math.PI / 2);
  const currentPitch = useRef(0);
  const currentRoll = useRef(0);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), -MAIN_PLAY_Z_PLANE), []);

  const handleEaten = useCallback(() => {
    if (eatActionRef.current) {
      if (swimActionRef.current) swimActionRef.current.setEffectiveWeight(0);
      eatActionRef.current.setEffectiveWeight(1);
      eatActionRef.current.reset().play();
    }
    eatTimer.current = 1.0;
  }, []);

  const preys = useMemo(() => [
    ...Array(10).fill({ gltf: vatoz, scale: 3.0, speed: 1.0 }),
    ...Array(10).fill({ gltf: kilicbalik, scale: 3.75, speed: 1.5 }),
    ...Array(15).fill({ gltf: hamsi, scale: 3.0, speed: 1.2 })
  ], [vatoz, kilicbalik, hamsi]);

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
      const nx = dx / dist;
      const ny = dy / dist;
      const a = 1 - Math.pow(0.001, dt * ACCEL);
      fishVel.current.x = lerp(fishVel.current.x, nx * MAX_SPEED, a);
      fishVel.current.y = lerp(fishVel.current.y, ny * MAX_SPEED, a);
      let targetYaw = currentYaw.current;
      if (nx > 0.05) targetYaw = -Math.PI / 2;
      else if (nx < -0.05) targetYaw = Math.PI / 2;
      currentYaw.current = lerpAngle(currentYaw.current, targetYaw, 1 - Math.pow(0.001, dt * TURN_SMOOTH_YAW));
      currentPitch.current = lerp(currentPitch.current, ny * MAX_PITCH_ANGLE, 1 - Math.pow(0.001, dt * TURN_SMOOTH_PITCH));
    } else {
      fishVel.current.multiplyScalar(DRAG_STOP);
      currentPitch.current = lerp(currentPitch.current, 0, 1 - Math.pow(0.001, dt * TURN_SMOOTH_PITCH));
    }

    // === DANGER ZONE ===
    const dangerDistance = 18;
    const nearLeft = fishPos.current.x < b.minX + dangerDistance;
    const nearRight = fishPos.current.x > b.maxX - dangerDistance;
    const nearBottom = fishPos.current.y < b.minY + dangerDistance;

    if (nearLeft) {
      const force = ((b.minX + dangerDistance) - fishPos.current.x) / dangerDistance;
      fishVel.current.x += force * 18 * dt;
    }
    if (nearRight) {
      const force = (fishPos.current.x - (b.maxX - dangerDistance)) / dangerDistance;
      fishVel.current.x -= force * 18 * dt;
    }
    if (nearBottom) {
      const force = ((b.minY + dangerDistance) - fishPos.current.y) / dangerDistance;
      fishVel.current.y += force * 22 * dt;
    }

    fishPos.current.x += fishVel.current.x * dt;
    fishPos.current.y += fishVel.current.y * dt;

    if (fishPos.current.x < b.minX) fishPos.current.x = b.minX;
    if (fishPos.current.x > b.maxX) fishPos.current.x = b.maxX;
    if (fishPos.current.y < b.minY) {
      fishPos.current.y = b.minY;
      fishVel.current.y = 0;
    }
    if (fishPos.current.y > maxJumpHeight) {
      fishPos.current.y = maxJumpHeight;
      if (fishVel.current.y > 0) fishVel.current.y = 0;
    }

    if (eatTimer.current > 0) {
      eatTimer.current -= dt;
      if (eatTimer.current <= 0) {
        if (eatActionRef.current) eatActionRef.current.setEffectiveWeight(0);
        if (swimActionRef.current) {
          swimActionRef.current.setEffectiveWeight(1);
          swimActionRef.current.paused = !moving;
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

    // === KOORDİNAT GÜNCELLEME ===
    if (setFishPosition) {
      setFishPosition({
        x: fishPos.current.x,
        y: fishPos.current.y
      });
    }
  });

  return (
    <>
      <group ref={seaGroup}><primitive object={sea.scene} /></group>
      <WaterCeiling y={surfaceY} />
      <group ref={fishGroup} scale={FISH_SCALE}>
        <group ref={fishInner}><primitive object={fish.scene} /></group>
      </group>

      {boundsReady && (
        <>
          <BackgroundDecoration
            gltfFiles={{ vatoz, kilicbalik, hamsi }}
            boundary={boundsRef.current}
            count={50}
            zRange={[-30, -10]}
          />
          {preys.map((p, i) => (
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
        </>
      )}
      <CanvasEvents onDown={() => (dragging.current = true)} onUp={() => (dragging.current = false)} />
    </>
  );
}

export default function EslemeGame() {
  const [urls, setUrls] = useState<any>(null);
  const [fishPosition, setFishPosition] = useState({ x: 0, y: 0 });

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
    <div style={{ width: "100vw", height: "100vh", background: `linear-gradient(to bottom, ${GRADIENT_TOP} 0%, ${GRADIENT_BOTTOM} 100%)`, touchAction: "none", position: "relative" }}>
      
      {/* === GEÇİCİ KOORDİNAT KUTUCUĞU === */}
      <div style={{
        position: "absolute",
        top: 10,
        left: 10,
        background: "rgba(0,0,0,0.75)",
        color: "white",
        padding: "8px 12px",
        borderRadius: "8px",
        fontFamily: "monospace",
        fontSize: "14px",
        zIndex: 1000,
        pointerEvents: "none"
      }}>
        X: {fishPosition.x.toFixed(1)}<br />
        Y: {fishPosition.y.toFixed(1)}
      </div>

      <Canvas camera={{ position: [0, 0, CAMERA_Z], fov: 45 }}>
        <fog attach="fog" args={[FOG_COLOR, 30, 80]} />
        <ambientLight intensity={1.5} />
        <directionalLight position={[10, 10, 10]} intensity={2} />
        <Suspense fallback={<Loader3D />}>
          {urls && <World urls={urls} setFishPosition={setFishPosition} />}
        </Suspense>
      </Canvas>
    </div>
  );
    }
