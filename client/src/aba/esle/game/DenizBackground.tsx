import React, { Suspense, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import * as THREE from "three";
import { Fish3D } from "./Fish3D";

// DENİZ VE OKYANUS (WATER) İLE İLGİLİ HER ŞEYİ KÖKTEN SİLDİM!

function BackgroundManager({ cameraRef }: { cameraRef: any }) {
  const { scene } = useThree();
  const tempColor = useMemo(() => new THREE.Color(), []);
  const C_SHALLOW = new THREE.Color("#0B6F8F"); 
  const C_MID = new THREE.Color("#074B67");
  const C_DEEP = new THREE.Color("#00020a");

  useEffect(() => {
    scene.fog = new THREE.FogExp2(0x000000, 0.02);
    return () => { scene.fog = null; };
  }, [scene]);

  useFrame((state) => {
    const camY = state.camera.position.y; 
    const depth = THREE.MathUtils.clamp((15 - camY) / 100, 0, 1);
    tempColor.copy(C_SHALLOW).lerp(C_DEEP, depth);
    scene.background = tempColor;
    // @ts-ignore
    scene.fog.color.copy(tempColor);
  });
  return null;
}

function CameraRig({ fishRef }: { fishRef: any }) {
  useFrame((state) => {
    if (!fishRef.current) return;
    const SCALE = 0.015;
    const fish = fishRef.current;
    const targetX = fish.x * SCALE;
    const targetY = (-fish.y * SCALE) + 2; 

    state.camera.position.x += (targetX - state.camera.position.x) * 0.1;
    state.camera.position.y += (targetY - state.camera.position.y) * 0.1;
    state.camera.lookAt(targetX, targetY, 0);
  });
  return null;
}

export default function DenizBackground({ cameraRef, fishRef }: { cameraRef: any, fishRef: any }) {
  return (
    <div className="absolute inset-0 bg-black">
      <Canvas
        shadows
        camera={{ position: [0, 0, 14], fov: 50 }}
        style={{ pointerEvents: "none" }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      >
        <Environment preset="city" background={false} />
        <BackgroundManager cameraRef={cameraRef} />
        <CameraRig fishRef={fishRef} />

        <ambientLight intensity={1.5} color="#ffffff" />
        <directionalLight position={[10, 20, 10]} intensity={2} color="#ffffff" castShadow />

        {/* SAHNEDE SADECE VE SADECE BALIK VAR! */}
        <Suspense fallback={null}>
          <Fish3D fishRef={fishRef} />
        </Suspense>

      </Canvas>
    </div>
  );
      }
