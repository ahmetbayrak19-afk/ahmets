import React, { Suspense, useRef, useEffect, useMemo } from "react";
import { Canvas, useFrame, extend, useThree, useLoader } from "@react-three/fiber";
import { useGLTF, useAnimations, Environment, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { Water } from "three-stdlib"; 

import gokResmi from "./gok.png";

const DENIZ_GLB_URL = "https://firebasestorage.googleapis.com/v0/b/ogrencitakip-2a775.firebasestorage.app/o/deniz.glb?alt=media&token=6ecb1237-70e1-43c8-b997-77b6e3943497";
const WATER_NORMALS_URL = "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/water/Water_1_M_Normal.jpg";

extend({ Water });

// ☁️ GÖKYÜZÜ (DÜZELTİLDİ: TERS YÖNE AKAN SONSUZ BULUTLAR) ☁️
function Gokyuzu({ cameraRef }: { cameraRef: any }) {
  const texture = useTexture(gokResmi);
  const meshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    // Resmi yan yana döşemek için ayarlar
    texture.wrapS = THREE.RepeatWrapping; // Yatayda sürekli tekrar et
    texture.wrapT = THREE.ClampToEdgeWrapping;
    // Resmi 3 kere yan yana sığdır (Sıklığını buradan ayarlayabilirsin)
    texture.repeat.set(3, 1); 
  }, [texture]);

  useFrame(() => {
    if (!meshRef.current || !cameraRef.current) return;
    const camX = cameraRef.current.x;
    
    // 1. PANOYU TAŞI: Pano hep seninle gelsin ki asla boşluğa düşme.
    meshRef.current.position.x = camX;

    // 2. RESMİ KAYDIR (SİHİR BURADA):
    // Sen SAĞA (+X) gidince, resim ofsetini artırıyoruz.
    // Three.js'de offset artınca resim SOLA kayar. Tam istediğin gibi.
    // 0.0005 çarpanı bulutların ne kadar "uzakta" olduğunu hissettirir.
    // Sayıyı küçültürsen bulutlar çok yavaş (çok uzak), büyütürsen hızlı akar.
    texture.offset.x = camX * 0.0005; 

    // 3. YÜKSEKLİK: Sabit (Suya gömülü)
    meshRef.current.position.y = 250; 
  });

  return (
    // Panoyu yine devasa tutuyoruz
    <mesh ref={meshRef} position={[0, 250, -200]}>
      <planeGeometry args={[5000, 500]} /> 
      <meshBasicMaterial map={texture} transparent={true} side={THREE.DoubleSide} />
    </mesh>
  );
}

// 🎨 ARKAPLAN RENGİ YÖNETİCİSİ
function BackgroundManager({ cameraRef }: { cameraRef: any }) {
  const { scene } = useThree();

  useFrame(() => {
    if (!cameraRef.current) return;
    const camY = cameraRef.current.y;

    if (camY < 15) {
      // 🌊 SU ALTI: MAVİ (Aşağıdan bakınca güzel görünsün)
      scene.background = new THREE.Color('#006994'); 
    } else {
      // ☀️ SU ÜSTÜ: BOŞ (Gökyüzü resmi net görünsün)
      scene.background = null; 
    }
  });

  return null;
}

function Ocean() {
  const refTop = useRef<any>();     
  const refBottom = useRef<any>();  
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
    const timeValue = delta * 0.5;
    if (refTop.current) refTop.current.material.uniforms.time.value += timeValue;
    if (refBottom.current) refBottom.current.material.uniforms.time.value += timeValue;
  });

  return (
    <group position={[0, 15, 0]}>
      <water ref={refTop} args={[new THREE.PlaneGeometry(20000, 20000), config]} rotation={[-Math.PI / 2, 0, 0]} />
      {/* Alt yüzey mavi arkaplanı yansıtarak daha doğal duracak */}
      <water ref={refBottom} args={[new THREE.PlaneGeometry(20000, 20000), config]} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} />
    </group>
  );
}

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
      <primitive object={clone} scale={[1, 1, 4]} position={[0, -5, -5]} rotation={[0, -Math.PI / 2, 0]} />
    </group>
  );
}

function MovingScene({ cameraRef }: { cameraRef: any }) {
  const group = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!group.current || !cameraRef.current) return;
    const camX = cameraRef.current.x;
    const camY = cameraRef.current.y;
    
    group.current.position.x = -camX * 0.015;
    group.current.position.y = camY * 0.015;
  });

  return (
    <group ref={group}>
      <DenizModel />
      <Ocean /> 
    </group>
  );
}

export default function DenizBackground({ cameraRef }: { cameraRef: any }) {
  return (
    <div className="absolute inset-0 bg-black"> 
      <Canvas
        camera={{ position: [0, 5, 20], fov: 45 }} 
        style={{ pointerEvents: 'none' }}
      >
        <Environment preset="city" background={false} />
        
        <BackgroundManager cameraRef={cameraRef} />

        <Suspense fallback={null}>
            <Gokyuzu cameraRef={cameraRef} />
        </Suspense>

        <ambientLight intensity={1.5} color="#ffffff" />
        <directionalLight position={[10, 20, 10]} intensity={2} color="#ffffff" />

        <Suspense fallback={null}>
            <MovingScene cameraRef={cameraRef} />
        </Suspense>
      </Canvas>
    </div>
  );
      }
    
