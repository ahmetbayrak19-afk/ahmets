import React, { Suspense, useRef, useEffect, useMemo } from "react";
import { Canvas, useFrame, extend, useThree, useLoader } from "@react-three/fiber";
import { useGLTF, useAnimations, Environment, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { Water } from "three-stdlib"; 
import gokResmi from "./gok.png";

// --- SABİTLER ---
const SU_SEVIYESI = 20; // Senin kodundaki su yüksekliği
const DENIZ_GLB_URL = "https://firebasestorage.googleapis.com/v0/b/ogrencitakip-2a775.firebasestorage.app/o/deniz.glb?alt=media&token=6ecb1237-70e1-43c8-b997-77b6e3943497";
const WATER_NORMALS_URL = "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/water/Water_1_M_Normal.jpg";

extend({ Water });

// ☁️ GÖKYÜZÜ (Resimli Arka Plan)
function Gokyuzu() {
  const texture = useTexture(gokResmi);
  // Y Hesabı: Su seviyesi 20. Yükseklik 500. Merkez = 20 + (500/2) = 270.
  return (
    <mesh position={[0, 270, -100]}> 
      <planeGeometry args={[2000, 500]} />
      <meshBasicMaterial map={texture} side={THREE.DoubleSide} />
    </mesh>
  );
}

// 🟦 DERİN DENİZ (Arka Fon - Koyu Lacivert)
function DerinDenizArka() {
  // Y Hesabı: Su seviyesi 20. Yükseklik 500. Merkez = 20 - (500/2) = -230.
  // Böylece üst kenarı tam 20'de (suda) biter.
  return (
    <mesh position={[0, -230, -100]}>
      <planeGeometry args={[2000, 500]} />
      <meshBasicMaterial color="#00008B" side={THREE.DoubleSide} /> 
    </mesh>
  );
}

// 💧 ÖN SU KATMANI (Şeffaf Efekt - Balığın Önü)
function OnSuKatmani() {
  // Bu katman balığın (Z=-5) önünde durmalı. Z=2 verdik.
  // Y Konumu arka denizle aynı.
  return (
    <mesh position={[0, -230, 2]}>
      <planeGeometry args={[2000, 500]} />
      <meshBasicMaterial 
        color="#00BFFF" 
        transparent={true} 
        opacity={0.3} // Şeffaflık ayarı
        side={THREE.DoubleSide} 
        depthWrite={false} // Z-Fighting önlemek için önemli
      />
    </mesh>
  );
}

// 🌊 SU YÜZEYİ YÖNETİCİSİ (Fog vb.)
function UnderwaterManager({ cameraRef }: { cameraRef: any }) {
  const { scene } = useThree();
  
  useFrame(() => {
    if (!cameraRef.current) return;
    const camY = cameraRef.current.y;

    // Kamera suyun (20) altına inince sis koyu olsun
    if (camY < SU_SEVIYESI) { 
      scene.fog = new THREE.FogExp2('#001e0f', 0.02); 
    } else {
      scene.fog = new THREE.FogExp2('#ffffff', 0.0005); 
    }
    // Scene background'ı iptal ettik çünkü kendi plane'lerimizi kullanıyoruz
    scene.background = null; 
  });
  return null;
}

// 🌊 DENİZİN ÜST YÜZEYİ (Dalgalı)
function OceanTop() {
  const ref = useRef<any>();
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
    if (ref.current) ref.current.material.uniforms.time.value += delta * 0.5;
  });

  return (
    // @ts-ignore
    <water
      ref={ref}
      args={[new THREE.PlaneGeometry(10000, 10000), config]}
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[0, SU_SEVIYESI, 0]} 
    />
  );
}

// 🌊 DENİZİN ALT YÜZEYİ (Ters - Alttan bakınca görünsün diye)
function OceanBottom() {
  const ref = useRef<any>();
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
      waterColor: 0x004040, 
      distortionScale: 3.7,
      fog: false,
      format: gl.outputColorSpace === "srgb" ? THREE.SRGBColorSpace : undefined,
    }),
    [waterNormals, gl.outputColorSpace]
  );

  useFrame((state, delta) => {
    if (ref.current) ref.current.material.uniforms.time.value += delta * 0.5;
  });

  return (
    // @ts-ignore
    <water
      ref={ref}
      args={[new THREE.PlaneGeometry(10000, 10000), config]}
      rotation={[Math.PI / 2, 0, 0]} 
      position={[0, SU_SEVIYESI, 0]} 
    />
  );
}

// 🗿 3D MODEL
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
        scale={[1.3, 1.3, 1.3]} 
        position={[0, -5, -5]} 
        rotation={[0, -Math.PI / 2, 0]} 
      />
    </group>
  );
}

// 🚶 HAREKETLİ SAHNE VE ARKA PLANLAR
function MovingScene({ cameraRef }: { cameraRef: any }) {
  const group = useRef<THREE.Group>(null);
  // Arka planlar kamerayı tam takip etsin (parallax yok)
  const bgGroup = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!group.current || !cameraRef.current || !bgGroup.current) return;
    const camX = cameraRef.current.x;
    const camY = cameraRef.current.y;
    
    // Model ve zemin hafif parallax yapabilir (Senin eski ayarın)
    group.current.position.x = -camX * 0.007;
    group.current.position.y = camY * 0.007;

    // AMA Arka Planlar (Gök, Derin Deniz, Ön Su) kamerayı X ekseninde takip etmeli
    // Böylece sağa gidince arka plan bitmez.
    bgGroup.current.position.x = camX;
    // Y ekseninde takip etmesin, yerleri sabit kalsın (asansör gibi inip çıkalım)
  });

  return (
    <>
      {/* Sabit Arka Plan Grubu (Kamerayla X'te gider) */}
      <group ref={bgGroup}>
        <Suspense fallback={null}><Gokyuzu /></Suspense>
        <DerinDenizArka />
        <OnSuKatmani />
      </group>

      {/* Hareketli Parallax Grubu */}
      <group ref={group}>
        <DenizModel />
        <OceanTop />
        <OceanBottom />
      </group>
    </>
  );
}

export default function DenizBackground({ cameraRef }: { cameraRef: any }) {
  return (
    <div className="absolute inset-0 bg-black"> 
      <Canvas
        camera={{ position: [0, 15, 20], fov: 45 }}
        style={{ pointerEvents: 'none' }}
      >
        <UnderwaterManager cameraRef={cameraRef} />
        <Environment preset="city" background={false} />
        
        <ambientLight intensity={2} color="#ffffff" />
        <directionalLight position={[10, 20, 10]} intensity={3} color="#ffffff" />
        <pointLight position={[0, -10, 0]} intensity={2} color="#00aaff" />

        <Suspense fallback={null}>
            <MovingScene cameraRef={cameraRef} />
        </Suspense>
      </Canvas>
    </div>
  );
    }
