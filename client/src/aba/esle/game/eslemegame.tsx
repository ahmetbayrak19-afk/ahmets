import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, useAnimations, useGLTF, useProgress } from "@react-three/drei";
import * as THREE from "three";

/** ==== AYARLAR ==== */
const SEA_ANIM_NAME = "yeme";
const SEA_ANIM_SPEED = 0.2;

const FISH_SWIM_ANIM_NAME = "yuzme";

const MAX_SPEED = 1.6;

// Kamera
const CAMERA_Z = 12;
const CAMERA_SMOOTH = 6.0;
const LOOK_SMOOTH = 8.0;
const CAMERA_LOOKAHEAD = 1.6;

// Deniz
const SEA_ROT_Y = -Math.PI / 2; // sola 90
const SEA_SCALE_MULT = 2.0;

// Balık
const FISH_SCALE = 3.0;
const TURN_SMOOTH = 10.0;
const BANK_AMOUNT = 0.25;

// Her şey z=0 düzleminde
const Z_PLANE = 0;

function Loader3D() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div style={{
        color: "white",
        background: "rgba(0,0,0,0.75)",
        padding: "10px 12px",
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.2)",
        fontFamily: "monospace",
      }}>
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
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: any) { this.props.onError(error?.message || String(error)); }
  render() {
    if (this.state.hasError) {
      return (
        <Html center>
          <div style={{
            color: "#ff4d4d",
            background: "rgba(0,0,0,0.85)",
            padding: 12,
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.2)",
            fontFamily: "monospace",
            maxWidth: 360,
            textAlign: "center",
          }}>
            HATA: 3D sahne çöktü
          </div>
        </Html>
      );
    }
    return this.props.children as any;
  }
}

/** Fullscreen pointer yakalayıcı */
function CanvasEvents({
  onDown, onMove, onUp,
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
      <meshBasicMaterial transparent opacity={0.01} depthWrite={false} />
    </mesh>
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

  // Deniz anim
  useEffect(() => {
    const a = seaAnim.actions?.[SEA_ANIM_NAME] ?? (seaAnim.names?.[0] ? seaAnim.actions?.[seaAnim.names[0]] : null);
    if (a) {
      a.reset().fadeIn(0.15).play();
      a.timeScale = SEA_ANIM_SPEED;
    }
  }, [seaAnim.actions, seaAnim.names]);

  // Balık anim
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

  // Deniz görünür hale getir
  const boundsRef = useRef<{ minX: number; maxX: number; minY: number; maxY: number } | null>(null);

  useEffect(() => {
    if (!seaGroup.current) return;

    // doubleSide
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
    const targetLongest = 90;
    const s0 = longest > 0 ? targetLongest / longest : 1;
    sea.scene.scale.setScalar(s0 * SEA_SCALE_MULT);

    seaGroup.current.position.set(0, 0, -20);
    seaGroup.current.rotation.set(0, SEA_ROT_Y, 0);

    const box = new THREE.Box3().setFromObject(seaGroup.current);
    const newSize = new THREE.Vector3();
    box.getSize(newSize);

    const padX = Math.max(2.0, newSize.x * 0.04);
    const padY = Math.max(2.0, newSize.y * 0.10);
    boundsRef.current = {
      minX: box.min.x + padX,
      maxX: box.max.x - padX,
      minY: box.min.y + padY,
      maxY: box.max.y - padY,
    };
  }, [sea.scene]);

  // Fish state
  const fishPos = useRef(new THREE.Vector3(0, 0, Z_PLANE));
  const fishTarget = useRef(new THREE.Vector3(0, 0, Z_PLANE));
  const dragging = useRef(false);

  const yawRef = useRef(Math.PI / 2);
  const lookRef = useRef(new THREE.Vector3(0, 0, Z_PLANE));

  useEffect(() => {
    if (!fishGroup.current) return;
    fishGroup.current.scale.setScalar(FISH_SCALE);
    fishGroup.current.rotation.set(0, Math.PI / 2, 0);
    fishGroup.current.position.set(0, 0, Z_PLANE);
  }, [fish.scene]);

  // NDC->world
  const { camera } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), -Z_PLANE), []);

  const ndcToWorld = useCallback((xNdc: number, yNdc: number) => {
    raycaster.setFromCamera({ x: xNdc, y: yNdc }, camera);
    const hit = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, hit);
    return hit;
  }, [camera, plane, raycaster]);

  const onDown = useCallback((e: any) => {
    dragging.current = true;
    fishTarget.current.copy(ndcToWorld(e.pointer.x, e.pointer.y));
  }, [ndcToWorld]);

  const onMove = useCallback((e: any) => {
    if (!dragging.current) return;
    fishTarget.current.copy(ndcToWorld(e.pointer.x, e.pointer.y));
  }, [ndcToWorld]);

  const onUp = useCallback(() => { dragging.current = false; }, []);

  useFrame((state, dt) => {
    if (!fishGroup.current) return;

    const b = boundsRef.current;

    // bounds varsa clamp
    if (b) {
      fishTarget.current.x = THREE.MathUtils.clamp(fishTarget.current.x, b.minX, b.maxX);
      fishTarget.current.y = THREE.MathUtils.clamp(fishTarget.current.y, b.minY, b.maxY);
    }
    fishTarget.current.z = Z_PLANE;

    const toTarget = fishTarget.current.clone().sub(fishPos.current);
    const dist = toTarget.length();
    const moving = dragging.current && dist > 0.01;

    if (moving) {
      const step = Math.min(dist, MAX_SPEED * dt);
      toTarget.normalize().multiplyScalar(step);
      fishPos.current.add(toTarget);
    }

    // clamp again
    if (b) {
      fishPos.current.x = THREE.MathUtils.clamp(fishPos.current.x, b.minX, b.maxX);
      fishPos.current.y = THREE.MathUtils.clamp(fishPos.current.y, b.minY, b.maxY);
    }
    fishPos.current.z = Z_PLANE;

    fishGroup.current.position.copy(fishPos.current);

    const dx = fishTarget.current.x - fishPos.current.x;
    const desiredYaw = dx >= 0 ? Math.PI / 2 : -Math.PI / 2;
    const tTurn = 1 - Math.pow(0.001, dt * TURN_SMOOTH);
    yawRef.current = THREE.MathUtils.lerpAngle(yawRef.current, desiredYaw, tTurn);

    const bank = THREE.MathUtils.clamp(dx * 0.15, -1, 1) * BANK_AMOUNT;
    fishGroup.current.rotation.set(0, yawRef.current, bank);

    const swim = swimActionRef.current;
    if (swim) swim.paused = !moving;

    // kamera X+Y takip
    const cam = state.camera as THREE.PerspectiveCamera;
    const desiredCam = new THREE.Vector3(fishPos.current.x, fishPos.current.y, CAMERA_Z);
    const tCam = 1 - Math.pow(0.001, dt * CAMERA_SMOOTH);
    cam.position.lerp(desiredCam, tCam);

    const desiredLook = new THREE.Vector3(
      fishPos.current.x + (dx >= 0 ? CAMERA_LOOKAHEAD : -CAMERA_LOOKAHEAD),
      fishPos.current.y,
      Z_PLANE
    );
    const tLook = 1 - Math.pow(0.001, dt * LOOK_SMOOTH);
    lookRef.current.lerp(desiredLook, tLook);
    cam.lookAt(lookRef.current);
  });

  return (
    <>
      {/* Yardımcılar: kesin gör diye */}
      <axesHelper args={[5]} />
      <gridHelper args={[200, 40]} />

      <group ref={seaGroup}>
        <primitive object={sea.scene} />
      </group>

      <group ref={fishGroup}>
        <primitive object={fish.scene} />
      </group>

      <CanvasEvents onDown={onDown} onMove={onMove} onUp={onUp} />
    </>
  );
}

export default function EslemeGame() {
  const { logs, push } = useScreenLogger();
  const [showPanel, setShowPanel] = useState(false);

  const [fishUrl, setFishUrl] = useState("");
  const [seaUrl, setSeaUrl] = useState("");
  const [dracoBase, setDracoBase] = useState("");

  const once = useRef(false);
  useEffect(() => {
    if (once.current) return;
    once.current = true;

    const origin = window.location.origin;
    const base = new URL("/assets/public/", origin).toString();

    setFishUrl(new URL("models/balik.glb", base).toString());
    setSeaUrl(new URL("models/deniz.glb", base).toString());
    setDracoBase(new URL("draco/", base).toString());

    push("Fog/background KAPALI (görünür garanti mod).", "info");
  }, [push]);

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#000" }}>
      {!showPanel ? (
        <MiniButton onClick={() => setShowPanel(true)} label="Rapor" />
      ) : (
        <LogOverlay logs={logs} onClose={() => setShowPanel(false)} />
      )}

      <Canvas camera={{ position: [0, 0, CAMERA_Z], fov: 45, near: 0.1, far: 5000 }}>
        {/* Fog/background yok */}
        <ambientLight intensity={1.2} />
        <directionalLight position={[10, 12, 10]} intensity={2.0} />
        <directionalLight position={[-10, -4, 2]} intensity={0.8} />

        <ScreenErrorBoundary onError={(m) => push(m, "error")}>
          <Suspense fallback={<Loader3D />}>
            {fishUrl && seaUrl && dracoBase ? (
              <World fishUrl={fishUrl} seaUrl={seaUrl} dracoBase={dracoBase} />
            ) : (
              <Html center>
                <div style={{ color: "white", fontFamily: "monospace" }}>Model URL bekleniyor...</div>
              </Html>
            )}
          </Suspense>
        </ScreenErrorBoundary>
      </Canvas>
    </div>
  );
           }
