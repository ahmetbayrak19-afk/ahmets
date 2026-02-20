import React, { Suspense, useRef, useEffect, useMemo } from "react";
import { Canvas, useFrame, extend, useThree, useLoader } from "@react-three/fiber";
import { useGLTF, Environment } from "@react-three/drei";
import * as THREE from "three";
import { Water } from "three-stdlib";
import { Fish3D } from "./Fish3D";

// Denizi doğrudan import ediyoruz
import denizModelUrl from "./deniz.glb";

const WATER_NORMALS_URL = "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/water/Water_1_M_Normal.jpg";

extend({ Water });

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

// 🔥 DÜZELTME 1: Kameranın da balığın yeni merkez koordinatlarına bakmasını sağladık
function CameraRig({ fishRef }: { fishRef: any }) {
  useFrame((state) => {
    if (!fishRef.current) return;
    const SCALE = 0.015;
    const fish = fishRef.current;

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    // Hedef noktayı merkezleme matematiğine göre ayarlıyoruz
    const targetX = (fish.x - centerX) * SCALE;
    const targetY = -(fish.y - centerY) * SCALE + 2;

    state.camera.position.x += (targetX - state.camera.position.x) * 0.1;
    state.camera.position.y += (targetY - state.camera.position.y) * 0.1;
    state.camera.lookAt(targetX, targetY, 0);
  });
  return null;
}

function Ocean() {
  const refTop = useRef<any>();
  const refBottom = useRef<any>();
  const gl = useThree((s) => s.gl);
  const waterNormals = useLoader(THREE.TextureLoader, WATER_NORMALS_URL);

  useEffect(() => {
    waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;
    waterNormals.repeat.set(4, 4);
  }, [waterNormals]);

  const config = useMemo(() => ({
      textureWidth: 512, textureHeight: 512, waterNormals,
      sunDirection: new THREE.Vector3(), sunColor: 0x0077ff, waterColor: 0x001e0f,
      distortionScale: 3.7, fog: true, format: gl.outputColorSpace === "srgb" ? THREE.SRGBColorSpace : undefined,
    }), [waterNormals, gl.outputColorSpace]);

  useFrame((_, delta) => {
    const t = delta * 0.5;
    if (refTop.current) refTop.current.material.uniforms.time.value += t;
    if (refBottom.current) refBottom.current.material.uniforms.time.value += t;
  });

  return (
    <group position={[0, 15, 0]}>
      {/* @ts-ignore */}
      <water ref={refTop} args={[new THREE.PlaneGeometry(20000, 20000), config]} rotation={[-Math.PI / 2, 0, 0]} />
      {/* @ts-ignore */}
      <water
        ref={refBottom}
        args={[new THREE.PlaneGeometry(20000, 20000), config]}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, -0.05, 0]}
      />
    </group>
  );
}

function DenizModel() {
  const { scene } = useGLTF(denizModelUrl);
  const clone = useMemo(() => scene.clone(), [scene]);
  return <primitive object={clone} scale={[5, 5, 5]} position={[0, -20, -10]} rotation={[0, -Math.PI / 2, 0]} />;
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

        {/* 🔥 DÜZELTME 2: Siyah ekran çökmelerini önlemek için her şeyi ayrı Suspense'e aldık */}
        <Suspense fallback={null}>
            <Fish3D fishRef={fishRef} />
        </Suspense>

        <Suspense fallback={null}>
            <DenizModel />
        </Suspense>

        <Suspense fallback={null}>
            <Ocean />
        </Suspense>

      </Canvas>
    </div>
  );
}

// Preload kısmına da aynı değişkeni veriyoruz
useGLTF.preload(denizModelUrl);
