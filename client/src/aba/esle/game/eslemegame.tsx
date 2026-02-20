import React, { useEffect, useRef, useState, Suspense, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { XCircle, Play } from "lucide-react";

// Modeli import ediyoruz
import balikModelUrl from "./balik.glb";

// --- Fizik Motoru ---
const LIMIT_LEFT = -5400, LIMIT_RIGHT = 5400, LIMIT_TOP = -1200, LIMIT_BOTTOM = 1000;
const WATER_SURFACE = -1030, GRAVITY = 0.3;

class PhysicsEngine {
  updateFish(fish: any, targetX: number, targetY: number) {
    const dx = targetX - fish.x, dy = targetY - fish.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const isInAir = fish.y < WATER_SURFACE;

    if (!isInAir) {
      if (dist > 10) {
        const force = Math.min(dist * 0.05, 1.2), angle = Math.atan2(dy, dx);
        fish.vx += Math.cos(angle) * force; fish.vy += Math.sin(angle) * force;
      }
      fish.vx *= 0.93; fish.vy *= 0.93;
    } else {
      fish.vy += GRAVITY; fish.vx *= 0.98; fish.vy *= 0.99;
    }
    fish.x += fish.vx; fish.y += fish.vy;

    if (fish.x < LIMIT_LEFT + 50) { fish.x = LIMIT_LEFT + 50; fish.vx *= -0.5; }
    if (fish.x > LIMIT_RIGHT - 50) { fish.x = LIMIT_RIGHT - 50; fish.vx *= -0.5; }
    if (fish.y < LIMIT_TOP) { fish.y = LIMIT_TOP; fish.vy = 0; }
    if (fish.y > LIMIT_BOTTOM - 50) { fish.y = LIMIT_BOTTOM - 50; fish.vy *= -0.5; }
    if (fish.vx > 0.5) fish.lastDirection = 1; else if (fish.vx < -0.5) fish.lastDirection = -1;
  }
}

// --- 3D Balık (Yanıp Sönme Fixli) ---
function Fish3D({ fishRef }: { fishRef: any }) {
  const meshRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(balikModelUrl);

  const clone = useMemo(() => {
    const c = scene.clone();
    c.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.frustumCulled = false; // 🔥 EMÜLATÖRDE KAYBOLMAYI ÖNLER
      }
    });
    return c;
  }, [scene]);

  useFrame(() => {
    if (!meshRef.current || !fishRef.current) return;
    const fish = fishRef.current;
    const SCALE = 0.015;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    meshRef.current.position.x = (fish.x - centerX) * SCALE;
    meshRef.current.position.y = -(fish.y - centerY) * SCALE;
    meshRef.current.rotation.y = fish.lastDirection === 1 ? Math.PI / 2 : -Math.PI / 2;
    meshRef.current.rotation.z = (Math.atan2(fish.vy, Math.abs(fish.vx)) * (fish.lastDirection === -1 ? -1 : 1));
  });

  return <primitive object={clone} ref={meshRef} scale={4.0} />;
}

// --- Ana Oyun ---
export default function EslemeGame({ onClose }: { onClose: () => void }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fish = useRef({ x: 0, y: 0, vx: 0, vy: 0, rotation: 0, lastDirection: 1 });
  const mousePos = useRef({ x: 0, y: 0 });
  const physics = useRef(new PhysicsEngine());

  const handleInput = (e: any) => {
    if (!isPlaying || !containerRef.current) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = window.innerWidth / 2, centerY = window.innerHeight / 2;
    mousePos.current.x = fish.current.x + (clientX - rect.left - centerX);
    mousePos.current.y = fish.current.y + (clientY - rect.top - centerY);
  };

  useEffect(() => {
    if (!isPlaying) return;
    const loop = () => {
      physics.current.updateFish(fish.current, mousePos.current.x, mousePos.current.y);
      requestAnimationFrame(loop);
    };
    const id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [isPlaying]);

  return (
    <div ref={containerRef} className="fixed inset-0 bg-blue-900 overflow-hidden touch-none">
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 15], fov: 50, near: 0.1, far: 1000 }}>
          <ambientLight intensity={2} />
          <directionalLight position={[5, 5, 5]} intensity={1.5} />
          <Suspense fallback={null}><Fish3D fishRef={fish} /></Suspense>
        </Canvas>
      </div>
      <div className="absolute inset-0 z-10" onMouseMove={handleInput} onTouchMove={handleInput} />
      <div className="absolute inset-0 z-20 pointer-events-none">
        <button onClick={onClose} className="absolute top-6 right-6 p-3 bg-white/20 rounded-full pointer-events-auto">
          <XCircle className="text-white w-8 h-8" />
        </button>
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-auto">
            <button onClick={() => setIsPlaying(true)} className="bg-orange-500 text-white px-12 py-6 rounded-3xl text-4xl font-black">BAŞLA</button>
          </div>
        )}
      </div>
    </div>
  );
}
useGLTF.preload(balikModelUrl);
