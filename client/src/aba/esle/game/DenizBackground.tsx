import React, { Suspense, useRef, useEffect, useMemo } from "react";
import { Canvas, useFrame, extend, useThree, useLoader } from "@react-three/fiber";
import { useGLTF, useAnimations, Environment } from "@react-three/drei";
import * as THREE from "three";
import { Water } from "three-stdlib"; 

extend({ Water });

const SU_SEVIYESI = 20;
const DENIZ_GLB_URL = "https://firebasestorage.googleapis.com/v0/b/ogrencitakip-2a775.firebasestorage.app/o/deniz.glb?alt=media&token=6ecb1237-70e1-43c8-b997-77b6e3943497";
const WATER_NORMALS_URL = "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/water/Water_1_M_Normal.jpg";

// 1. SU YÜZEYİ (Hareketli - Sonsuzluk için balığı takip eder)
function OceanTop({ targetRef }) {
  const ref = useRef();
  const gl = useThree((state) => state.gl);
  const waterNormals = useLoader(THREE.TextureLoader, WATER_NORMALS_URL);
  waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;

  const config = useMemo(
    () => ({
      textureWidth: 512,
      textureHeight: 512,
      waterNormals,
      sunDirection: new THREE.Vector3(),
      sunColor: 0xffffff,
      waterColor: 0x001e0f,
      distortionScale: 3.7,
      fog: false,
      format: gl.outputColorSpace === "srgb" ? THREE.SRGBColorSpace : undefined,
    }),
    [waterNormals, gl.outputColorSpace]
  );

  useFrame((state, delta) => {
    // Dalga animasyonu
    if (ref.current) {
      ref.current.material.uniforms.time.value += delta * 0.5;
      
      // SUYU BALIKLA BERABER GÖTÜR (X Ekseninde)
      // Böylece sağa ne kadar gidersen git deniz bitmez.
      if (targetRef.current) {
        ref.current.position.x = targetRef.current.x;
      }
    }
  });

  return (
    <water
      ref={ref}
      args={[new THREE.PlaneGeometry(10000, 10000), config]}
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[0, SU_SEVIYESI, 0]} 
    />
  );
}

// 2. BALIK ve HAREKET SİSTEMİ
function BalikVeHareket({ cameraRef }) {
  const group = useRef(null);
  const { scene, animations } = useGLTF(DENIZ_GLB_URL);
  const { actions } = useAnimations(animations, group);
  const { camera } = useThree();

  useEffect(() => {
    Object.keys(actions).forEach((key) => {
      actions[key]?.reset().fadeIn(0.5).play();
    });
  }, [actions]);

  useFrame(() => {
    if (!cameraRef.current || !group.current) return;

    const targetX = cameraRef.current.x;
    const targetY = cameraRef.current.y;

    // A) BALIĞI HAREKET ETTİR
    // Balık senin klavyedeki konumuna gitsin
    group.current.position.x = targetX;
    group.current.position.y = targetY;

    // B) KAMERAYI HAREKET ETTİR (Paralel Takip)
    camera.position.x = targetX;
    camera.position.y = targetY; // Balıkla aynı yükseklik (Tam karşı)
    camera.position.z = 30;      // Mesafe
    
    // Kamera dümdüz baksın
    camera.lookAt(targetX, targetY, 0);
  });

  const clone = useMemo(() => scene.clone(), [scene]);

  return (
    <group ref={group}>
      <primitive 
        object={clone} 
        scale={[1.3, 1.3, 1.3]} 
        rotation={[0, -Math.PI / 2, 0]} 
      />
    </group>
  );
}

export default function DenizBackground({ cameraRef }) {
  return (
    <div className="absolute inset-0 bg-black"> 
      <Canvas
        camera={{ position: [0, 0, 30], fov: 45 }}
        style={{ pointerEvents: 'none' }}
      >
        <ambientLight intensity={2} color="#ffffff" />
        <directionalLight position={[10, 20, 10]} intensity={3} color="#ffffff" />

        {/* 1. Su (Balığı takip etmesi için cameraRef'i veriyoruz) */}
        <OceanTop targetRef={cameraRef} />

        {/* 2. Balık Modeli ve Hareket Mantığı */}
        <Suspense fallback={null}>
            <BalikVeHareket cameraRef={cameraRef} />
        </Suspense>

        {/* Sadece balık parlasın diye environment (Arka plan kapalı) */}
        <Environment preset="city" background={false} />
      </Canvas>
    </div>
  );
        }
          
