import React, { Suspense, useRef, useEffect, useMemo } from "react";
import { Canvas, useFrame, extend, useThree, useLoader } from "@react-three/fiber";
import { useGLTF, useAnimations, Environment } from "@react-three/drei";
import * as THREE from "three";
import { Water } from "three-stdlib"; // Standart Su Shader'ı

const DENIZ_GLB_URL = "https://firebasestorage.googleapis.com/v0/b/ogrencitakip-2a775.firebasestorage.app/o/deniz.glb?alt=media&token=6ecb1237-70e1-43c8-b997-77b6e3943497";
const WATER_NORMALS_URL = "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/water/Water_1_M_Normal.jpg";

// React-three-fiber'a "water" etiketini öğretiyoruz
extend({ Water });

// 🔥 PERFORMANSLI GERÇEK OKYANUS 🔥
function Ocean() {
  const ref = useRef<any>();
  const gl = useThree((state) => state.gl);
  
  // Su dokusunu yüklüyoruz
  const waterNormals = useLoader(THREE.TextureLoader, WATER_NORMALS_URL);
  
  // Doku ayarları (Tekrar etsin)
  waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;

  // Su objesi konfigürasyonu
  const config = useMemo(
    () => ({
      textureWidth: 512,
      textureHeight: 512,
      waterNormals,
      sunDirection: new THREE.Vector3(),
      sunColor: 0xffffff,
      waterColor: 0x001e0f, // Koyu Okyanus Yeşili/Mavisi
      distortionScale: 3.7, // Dalga büyüklüğü
      fog: false,
      format: gl.outputColorSpace === "srgb" ? THREE.SRGBColorSpace : undefined, // Renk uzayı düzeltmesi
    }),
    [waterNormals, gl.outputColorSpace]
  );

  useFrame((state, delta) => {
    // Suyu sürekli hareket ettir (Animasyon)
    if (ref.current) {
      ref.current.material.uniforms.time.value += delta * 0.5;
    }
  });

  return (
    // <water /> etiketi 'extend' sayesinde çalışır
    // @ts-ignore
    <water
      ref={ref}
      args={[new THREE.PlaneGeometry(10000, 10000), config]} // Sonsuz büyüklükte deniz
      rotation={[-Math.PI / 2, 0, 0]} // Yatay çevir
      // 🔥 DEĞİŞİKLİK: Deniz yüzeyi 15 metre yukarı alındı 🔥
      position={[0, 15, 0]} 
    />
  );
}

// ESKİ DENİZ DİBİ MODELİ (Süs olarak dursun)
function DenizModel() {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(DENIZ_GLB_URL);
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    Object.keys(actions).forEach((key) => {
      actions[key]?.reset().fadeIn(0.5).play();
    });
  }, [actions]);

  const clone = useMemo(() => scene.clone(), [scene]);

  return (
    <group ref={group}>
      <primitive 
        object={clone} 
        scale={[1, 1, 1]} 
        position={[0, -5, -5]} 
        rotation={[0, -Math.PI / 2, 0]} 
      />
    </group>
  );
}

function MovingScene({ cameraRef }: { cameraRef: any }) {
  const group = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!group.current || !cameraRef.current) return;
    const camX = cameraRef.current.x;
    const camY = cameraRef.current.y;
    
    // Dünyayı kaydır
    group.current.position.x = -camX * 0.015;
    group.current.position.y = camY * 0.015;
  });

  return (
    <group ref={group}>
      <DenizModel />
      <Ocean /> {/* Yeni Hızlı Okyanus */}
    </group>
  );
}

export default function DenizBackground({ cameraRef }: { cameraRef: any }) {
  return (
    <div className="absolute inset-0 bg-black"> 
      <Canvas
        camera={{ position: [0, 5, 20], fov: 45 }} // Kamerayı biraz yukarı aldım suyu gör diye
        style={{ pointerEvents: 'none' }}
      >
        <Environment preset="city" background={false} />
        
        {/* 🔥 DEĞİŞİKLİK: Gök yüzü ve resmi kaldırıldı 🔥 */}
        
        <ambientLight intensity={1.5} color="#ffffff" />
        <directionalLight position={[10, 20, 10]} intensity={2} color="#ffffff" />

        <Suspense fallback={null}>
            <MovingScene cameraRef={cameraRef} />
        </Suspense>
      </Canvas>
    </div>
  );
    }
    
