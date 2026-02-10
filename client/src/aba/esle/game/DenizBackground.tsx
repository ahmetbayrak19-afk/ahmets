import React, { Suspense, useRef, useEffect, useMemo } from "react";
import { Canvas, useFrame, extend, useThree, useLoader } from "@react-three/fiber";
import { useGLTF, useAnimations, Environment, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { Water } from "three-stdlib"; 
import gokResmi from "./gok.png";

const DENIZ_GLB_URL = "https://firebasestorage.googleapis.com/v0/b/ogrencitakip-2a775.firebasestorage.app/o/deniz.glb?alt=media&token=6ecb1237-70e1-43c8-b997-77b6e3943497";
const WATER_NORMALS_URL = "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/water/Water_1_M_Normal.jpg";

extend({ Water });

// ☁️ GÖKYÜZÜ
function Gokyuzu() {
  const texture = useTexture(gokResmi);
  return (
    <mesh position={[0, 40, -50]}>
      <planeGeometry args={[500, 500]} />
      <meshBasicMaterial map={texture} side={THREE.DoubleSide} />
    </mesh>
  );
}

// 🌊 SU ALTI EFEKT YÖNETİCİSİ
function UnderwaterManager({ cameraRef }: { cameraRef: any }) {
  const { scene } = useThree();
  
  useFrame(() => {
    if (!cameraRef.current) return;
    const camY = cameraRef.current.y;

    if (camY < 20) { 
      // SU ALTI: Sis rengi ve yoğunluğu
      scene.fog = new THREE.FogExp2('#001e0f', 0.02); 
      scene.background = new THREE.Color('#001e0f'); 
    } else {
      // SU ÜSTÜ: Berrak
      scene.fog = new THREE.FogExp2('#ffffff', 0.0005); 
      scene.background = null; 
    }
  });
  return null;
}

// 🌊 DENİZİN ÜST YÜZEYİ (Orjinal)
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
    if (ref.current) {
      ref.current.material.uniforms.time.value += delta * 0.5;
    }
  });

  return (
    // @ts-ignore
    <water
      ref={ref}
      args={[new THREE.PlaneGeometry(10000, 10000), config]}
      rotation={[-Math.PI / 2, 0, 0]} // Yukarı bakıyor
      position={[0, 20, 0]} 
    />
  );
}

// 🔥 DENİZİN ALT YÜZEYİ (YENİ - TERS ÇEVRİLMİŞ) 🔥
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
      // Alt taraf biraz daha açık renk olsun ki yukarıdaki ışık vuruyormuş gibi görünsün
      waterColor: 0x004040, 
      distortionScale: 3.7,
      fog: false,
      format: gl.outputColorSpace === "srgb" ? THREE.SRGBColorSpace : undefined,
    }),
    [waterNormals, gl.outputColorSpace]
  );

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.material.uniforms.time.value += delta * 0.5;
    }
  });

  return (
    // @ts-ignore
    <water
      ref={ref}
      args={[new THREE.PlaneGeometry(10000, 10000), config]}
      // 🔥 İŞTE BURASI: Tam tersine çevirdik (PI / 2) 🔥
      rotation={[Math.PI / 2, 0, 0]} 
      position={[0, 20, 0]} // Aynı yükseklikte
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

// 🚶 HAREKETLİ SAHNE
function MovingScene({ cameraRef }: { cameraRef: any }) {
  const group = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!group.current || !cameraRef.current) return;
    const camX = cameraRef.current.x;
    const camY = cameraRef.current.y;
    
    group.current.position.x = -camX * 0.007;
    group.current.position.y = camY * 0.007;
  });

  return (
    <group ref={group}>
      <DenizModel />
      <OceanTop />    {/* Üst Yüzey */}
      <OceanBottom /> {/* Alt Yüzey (Ters) */}
    </group>
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
        
        <Suspense fallback={null}>
           <Gokyuzu />
        </Suspense>
        
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
