import React, { Suspense, useRef, useEffect, useMemo } from "react";
import { Canvas, useFrame, extend, useThree, useLoader } from "@react-three/fiber";
import { useGLTF, useAnimations, Environment } from "@react-three/drei";
import * as THREE from "three";
import { Water } from "three-stdlib"; 

extend({ Water });

// --- AYARLAR ---
const SU_SEVIYESI = 0;      // Su tam merkezde (0)
const ZEMIN_DERINLIGI = -10; // 3D Modeli 10 birim aşağı ittik (Modelin boyuna göre bunu değiştirirsin)
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
      position={[0, SU_SEVIYESI, 0]} // SIFIR NOKTASI
    />
  );
}

// 2. 3D MODEL (ZEMİN)
function ZeminModel({ targetRef }) {
  const { scene } = useGLTF(DENIZ_GLB_URL);
  const clone = useMemo(() => scene.clone(), [scene]);
  const ref = useRef();

  useFrame(() => {
    // Modeli de seninle beraber sağa sola taşıyoruz ki zemin bitmesin
    if (ref.current && targetRef.current) {
        ref.current.position.x = targetRef.current.x;
    }
  });

  return (
    <primitive 
      ref={ref}
      object={clone} 
      scale={[1.5, 1.5, 1.5]} 
      position={[0, ZEMIN_DERINLIGI, 0]} // Modeli aşağı itiyoruz
      rotation={[0, -Math.PI / 2, 0]} 
    />
  );
}

// 3. BALIK VE OYUN MANTIĞI
function GameContent({ cameraRef }) {
  const group = useRef(null);
  const { scene, animations } = useGLTF(DENIZ_GLB_URL); // Balık için aynı modeli kullanıyorum, farklıysa değiştir
  const { actions } = useAnimations(animations, group);
  const { camera } = useThree();

  useEffect(() => {
    Object.keys(actions).forEach((key) => {
      actions[key]?.reset().fadeIn(0.5).play();
    });
  }, [actions]);

  // Balık Modelini Klonla (Zeminle karışmasın diye)
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
    camera.position.y = targetY; // Balıkla aynı kata çık
    camera.position.z = 30;      // Karşıdan bak
    camera.lookAt(targetX, targetY, 0);
  });

  return (
    <>
      {/* BALIK (Ortada yüzüyor) */}
      <group ref={group}>
        <primitive 
          object={fishClone} 
          scale={[1, 1, 1]} 
          rotation={[0, -Math.PI / 2, 0]} 
        />
      </group>

      {/* DÜNYA (Su tavanda, Zemin dipte) */}
      <OceanTop targetRef={cameraRef} />
      <ZeminModel targetRef={cameraRef} />
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
      
