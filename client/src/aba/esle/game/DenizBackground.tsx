import React, { Suspense, useRef, useEffect, useMemo } from "react";
import { Canvas, useFrame, extend, useThree, useLoader } from "@react-three/fiber";
import { useGLTF, useAnimations, Environment } from "@react-three/drei";
import * as THREE from "three";
import { Water } from "three-stdlib"; 

extend({ Water });

// --- AYARLAR ---
const SU_SEVIYESI = 15; // İsteğin üzerine 15 metre yukarı aldım
const DENIZ_GLB_URL = "https://firebasestorage.googleapis.com/v0/b/ogrencitakip-2a775.firebasestorage.app/o/deniz.glb?alt=media&token=6ecb1237-70e1-43c8-b997-77b6e3943497";
const WATER_NORMALS_URL = "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/water/Water_1_M_Normal.jpg";

// 1. SU YÜZEYİ (TAVAN)
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
    if (ref.current) {
      ref.current.material.uniforms.time.value += delta * 0.5;
      
      // Suyu seninle beraber sağa sola taşıyoruz ki deniz bitmesin
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
      position={[0, SU_SEVIYESI, 0]} // Y=15 olarak ayarlandı
    />
  );
}

// 2. BALIK VE OYUN MANTIĞI
function GameContent({ cameraRef }) {
  const group = useRef(null);
  const { scene, animations } = useGLTF(DENIZ_GLB_URL);
  const { actions } = useAnimations(animations, group);
  const { camera } = useThree();

  useEffect(() => {
    Object.keys(actions).forEach((key) => {
      actions[key]?.reset().fadeIn(0.5).play();
    });
  }, [actions]);

  // Modeli klonluyoruz
  const fishClone = useMemo(() => scene.clone(), [scene]);

  useFrame(() => {
    if (!cameraRef.current || !group.current) return;

    const targetX = cameraRef.current.x;
    const targetY = cameraRef.current.y;

    // A) Balığı hareket ettir
    group.current.position.x = targetX;
    group.current.position.y = targetY;

    // B) Kamerayı hareket ettir (Paralel Takip)
    camera.position.x = targetX;
    camera.position.y = targetY; 
    camera.position.z = 30;      
    camera.lookAt(targetX, targetY, 0);
  });

  return (
    <>
      {/* SADECE HAREKETLİ BALIK KALDI (Sabit olanı sildim) */}
      <group ref={group}>
        <primitive 
          object={fishClone} 
          scale={[1.3, 1.3, 1.3]} 
          rotation={[0, -Math.PI / 2, 0]} 
        />
      </group>

      {/* Su Yüzeyi */}
      <OceanTop targetRef={cameraRef} />
    </>
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

        <Suspense fallback={null}>
            <GameContent cameraRef={cameraRef} />
        </Suspense>

        <Environment preset="city" background={false} />
      </Canvas>
    </div>
  );
                                 }
