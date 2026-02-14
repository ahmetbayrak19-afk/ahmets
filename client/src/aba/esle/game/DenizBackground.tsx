import React, { Suspense, useRef, useEffect, useMemo } from "react";
import { Canvas, useFrame, extend, useThree, useLoader } from "@react-three/fiber";
import { useGLTF, useAnimations, Environment } from "@react-three/drei";
import * as THREE from "three";
import { Water } from "three-stdlib";
import { Fish3D } from "./Fish3D";

// --- SABİTLER ---
const DENIZ_GLB_URL = "https://firebasestorage.googleapis.com/v0/b/ogrencitakip-2a775.firebasestorage.app/o/deniz.glb?alt=media&token=6ecb1237-70e1-43c8-b997-77b6e3943497";
const WATER_NORMALS_URL = "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/water/Water_1_M_Normal.jpg";

extend({ Water });

// --- RENK VE SİS ---
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
    // Kameranın Yüksekliğine göre rengi ayarla
    const camY = state.camera.position.y; 
    // Yüksekte (pozitif) açık renk, derinde (negatif/düşük) koyu renk
    // ThreeJS'de YUKARI pozitif olduğu için mantığı ters çevirmiyoruz.
    // Deniz yüzeyi 0 civarı.
    const depth = THREE.MathUtils.clamp((10 - camY) / 50, 0, 1);

    tempColor.copy(C_SHALLOW).lerp(C_DEEP, depth);

    scene.background = tempColor;
    // @ts-ignore
    scene.fog.color.copy(tempColor);
  });
  return null;
}

// 🔥 DÜZELTME: KAMERA RİGİ - ARTIK DİREKT BALIĞA KİLİTLİ 🔥
function CameraRig({ fishRef }: { fishRef: any }) {
  useFrame((state) => {
    if (!fishRef.current) return;
    
    const SCALE = 0.015;
    const fish = fishRef.current;

    // Balığın 3D dünyadaki gerçek konumu
    const targetX = fish.x * SCALE;
    const targetY = (-fish.y * SCALE) + 2; // +2 ile balığı biraz aşağıda tut (Kamera üstte)

    // Kamerayı yumuşakça ama sıkı takip ettir
    state.camera.position.x += (targetX - state.camera.position.x) * 0.1;
    state.camera.position.y += (targetY - state.camera.position.y) * 0.1;
    
    // Kamera hep balığa baksın
    state.camera.lookAt(targetX, targetY, 0);
  });
  return null;
}

// --- OKYANUS (SABİT) ---
function Ocean() {
  const refTop = useRef<any>();
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
    if (refTop.current) refTop.current.material.uniforms.time.value += delta * 0.5;
  });

  return (
    <group position={[0, 10, 0]}> {/* Su yüzeyini biraz yukarı aldım */}
      <water ref={refTop} args={[new THREE.PlaneGeometry(20000, 20000), config]} rotation={[-Math.PI / 2, 0, 0]} />
    </group>
  );
}

// --- DENİZ DİBİ MODELİ (SABİT) ---
function DenizModel() {
  const { scene } = useGLTF(DENIZ_GLB_URL);
  // Modeli çok büyük yapıp aşağı atıyoruz
  return <primitive object={scene} scale={[5, 5, 5]} position={[0, -50, -20]} rotation={[0, -Math.PI / 2, 0]} />;
}

// --- ANA COMPONENT ---
export default function DenizBackground({ cameraRef, fishRef }: { cameraRef: any, fishRef: any }) {
  return (
    <div className="absolute inset-0 bg-black">
      <Canvas
        shadows
        // 🔥 KAMERA Z: 20'den 14'e çekildi (Daha yakın)
        camera={{ position: [0, 0, 14], fov: 50 }}
        style={{ pointerEvents: "none" }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      >
        <Environment preset="city" background={false} />
        
        <BackgroundManager cameraRef={cameraRef} />

        {/* 🔥 ARTIK DİREKT FISH REF KULLANIYORUZ */}
        <CameraRig fishRef={fishRef} />

        <ambientLight intensity={1.5} color="#ffffff" />
        <directionalLight position={[10, 20, 10]} intensity={2} color="#ffffff" castShadow />

        <Suspense fallback={null}>
            <DenizModel />
            <Ocean />
            <Fish3D fishRef={fishRef} />
        </Suspense>
      </Canvas>
    </div>
  );
      }
