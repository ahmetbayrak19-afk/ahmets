import React, { Suspense, useRef, useEffect, useMemo } from "react";
import { Canvas, useFrame, extend, useThree, useLoader } from "@react-three/fiber";
import { useGLTF, useAnimations, Environment, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { Water } from "three-stdlib"; 

import gokResmi from "./gok.png";

const DENIZ_GLB_URL = "https://firebasestorage.googleapis.com/v0/b/ogrencitakip-2a775.firebasestorage.app/o/deniz.glb?alt=media&token=6ecb1237-70e1-43c8-b997-77b6e3943497";
const WATER_NORMALS_URL = "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/water/Water_1_M_Normal.jpg";

extend({ Water });

// ☁️ GÖKYÜZÜ (DEVASA VE SONSUZ) ☁️
function Gokyuzu({ cameraRef }: { cameraRef: any }) {
  const texture = useTexture(gokResmi);
  const meshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    texture.wrapS = THREE.RepeatWrapping; 
    texture.wrapT = THREE.ClampToEdgeWrapping;
    // Resmi yatayda 5 kere tekrar et (Sıklık ayarı)
    texture.repeat.set(5, 1); 
  }, [texture]);

  useFrame(() => {
    if (!meshRef.current || !cameraRef.current) return;
    const camX = cameraRef.current.x;
    
    // 1. Pano seninle gelsin (Asla bitmesin)
    meshRef.current.position.x = camX;

    // 2. Doku kaysın (Paralaks)
    // Çarpanı artırırsan bulutlar hızlanır.
    // + veya - yaparak yönü değiştirebilirsin.
    texture.offset.x = camX * 0.0002; 

    // 3. Yükseklik Sabit
    // Resim yüksekliği 1000. Yarısı 500.
    // Merkez 485 olursa alt uç -15 olur.
    // Su seviyesi +15. Yani resim suyun 30 birim altına kadar iner.
    // ASLA SİYAH BOŞLUK GÖRÜNMEZ.
    meshRef.current.position.y = 485; 
  });

  return (
    <mesh ref={meshRef} position={[0, 485, -300]}>
      {/* Genişliği 10000 yaptık, Yüksekliği 1000 yaptık */}
      <planeGeometry args={[10000, 1000]} /> 
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

    if (camY < 14) { // Su seviyesinin (15) biraz altı
      // 🌊 SU ALTI: KOYU MAVİ (Fotoğraftaki o siyahlığı maviye çevirir)
      scene.background = new THREE.Color('#004060'); 
    } else {
      // ☀️ SU ÜSTÜ: BOŞ (Gökyüzü resmi görünsün)
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
      // 🔥 DÜZELTME: Güneş rengi artık BEYAZ değil, GÖKYÜZÜ MAVİSİ.
      // Bu sayede suyun üzerindeki o beyaz patlama gidecek.
      sunColor: 0x0077ff, 
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
      
