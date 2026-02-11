import React, { Suspense, useRef, useEffect, useMemo } from "react";
import { Canvas, useFrame, extend, useThree, useLoader } from "@react-three/fiber";
import { useGLTF, useAnimations, Environment, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { Water } from "three-stdlib"; 

import gokResmi from "./gok.png";

const DENIZ_GLB_URL = "https://firebasestorage.googleapis.com/v0/b/ogrencitakip-2a775.firebasestorage.app/o/deniz.glb?alt=media&token=6ecb1237-70e1-43c8-b997-77b6e3943497";
const WATER_NORMALS_URL = "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/water/Water_1_M_Normal.jpg";

extend({ Water });

// ☁️ GÖKYÜZÜ (DEVASA BOYUTLANDIRILDI) ☁️
function Gokyuzu({ cameraRef }: { cameraRef: any }) {
  const texture = useTexture(gokResmi);
  const meshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    texture.wrapS = THREE.RepeatWrapping; 
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.repeat.set(5, 1); 
  }, [texture]);

  useFrame(() => {
    if (!meshRef.current || !cameraRef.current) return;
    const camX = cameraRef.current.x;
    
    meshRef.current.position.x = camX;
    texture.offset.x = camX * 0.0002; 

    // YÜKSEKLİK AYARI:
    // Resmi Y=500'e koydum, boyutu 1000. Alt ucu 0'a değer.
    // Su 15'te olduğu için resim suyun içine iyice girer.
    meshRef.current.position.y = 500; 
  });

  return (
    // Z=-300, Yükseklik=1000 (Daha uzun yaptık ki yukarı bakınca bitmesin)
    <mesh ref={meshRef} position={[0, 500, -300]}>
      <planeGeometry args={[10000, 1000]} /> 
      <meshBasicMaterial map={texture} transparent={true} side={THREE.DoubleSide} />
    </mesh>
  );
}

// 🎨 ARKAPLAN & SİS YÖNETİCİSİ (HAYATİ KISIM)
function BackgroundManager({ cameraRef }: { cameraRef: any }) {
  const { scene } = useThree();

  useFrame(() => {
    if (!cameraRef.current) return;
    const camY = cameraRef.current.y;

    if (camY < 14) { 
      // 🌊 SU ALTI MODU:
      // 1. Arkaplanı Koyu Mavi yap
      scene.background = new THREE.Color('#004060');
      
      // 2. SİS EKLE (FOG): Bu sis, su yüzeyini gizler!
      // '0.025' yoğunluk ayarıdır. Artırırsan yüzey daha çabuk kaybolur.
      // Sis rengi ile arkaplan rengi AYNI olmalı (#004060) ki ufuk çizgisi yok olsun.
      scene.fog = new THREE.FogExp2('#004060', 0.025); 

    } else {
      // ☀️ SU ÜSTÜ MODU:
      // Sis yok, arkaplan yok (Gökyüzü resmi görünsün)
      scene.background = null; 
      scene.fog = null;
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
      sunColor: 0x0077ff, // Gökyüzü mavisi yansıma
      waterColor: 0x001e0f, 
      distortionScale: 3.7, 
      fog: true, // 🔥 SİSİ GERİ AÇTIK (Su altında yüzeyin kaybolması için şart)
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
                                                                                            
