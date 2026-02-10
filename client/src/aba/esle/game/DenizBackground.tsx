import React, { Suspense, useRef, useEffect, useMemo } from "react";
import { Canvas, useFrame, extend, useThree, useLoader } from "@react-three/fiber";
import { useGLTF, useAnimations, Environment, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { Water } from "three-stdlib"; 
import gokResmi from "./gok.png";

const DENIZ_GLB_URL = "https://firebasestorage.googleapis.com/v0/b/ogrencitakip-2a775.firebasestorage.app/o/deniz.glb?alt=media&token=6ecb1237-70e1-43c8-b997-77b6e3943497";
const WATER_NORMALS_URL = "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/water/Water_1_M_Normal.jpg";

extend({ Water });

function Gokyuzu() {
  const texture = useTexture(gokResmi);
  return (
    <mesh position={[0, 0, -50]}>
      <planeGeometry args={[500, 500]} />
      <meshBasicMaterial map={texture} side={THREE.DoubleSide} />
    </mesh>
  );
}

// 🔥 SU ALTI EFEKT YÖNETİCİSİ (GÜNCELLENDİ) 🔥
function UnderwaterManager({ cameraRef }: { cameraRef: any }) {
  const { scene } = useThree();
  
  useFrame(() => {
    if (!cameraRef.current) return;
    
    // Kameranın Yüksekliği
    const camY = cameraRef.current.y;

    // 🔥 AYAR: Su artık 5. seviyede olduğu için, 6'nın altına inince sis başlasın
    if (camY < 6) { 
      // 🌊 SU ALTI MODU
      scene.fog = new THREE.FogExp2('#001e0f', 0.02); // Biraz daha yoğun sis
      scene.background = new THREE.Color('#001e0f'); 
    } else {
      // ☀️ SU ÜSTÜ MODU
      scene.fog = new THREE.FogExp2('#ffffff', 0.0005); 
      scene.background = null; 
    }
  });

  return null;
}

// 🔥 SUYUN TAVANI (YÜKSELTİLDİ) 🔥
function WaterCeiling() {
  return (
    // Yüksekliği 0'dan 5'e çektim
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 5, 0]}>
      <planeGeometry args={[10000, 10000]} />
      <meshBasicMaterial 
        color="#00aaff" 
        transparent={true} 
        opacity={0.3} 
        side={THREE.FrontSide} 
      />
    </mesh>
  );
}

// PERFORMANSLI GERÇEK OKYANUS (YÜKSELTİLDİ)
function Ocean() {
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
      rotation={[-Math.PI / 2, 0, 0]}
      // 🔥 İŞTE BURASI: Suyu 0'dan 5'e yükselttim 🔥
      position={[0, 5, 0]} 
    />
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
    
    group.current.position.x = -camX * 0.015;
    group.current.position.y = camY * 0.015;
  });

  return (
    <group ref={group}>
      <DenizModel />
      <Ocean /> 
      <WaterCeiling /> 
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
        <UnderwaterManager cameraRef={cameraRef} />

        <Environment preset="city" background={false} />

        <Suspense fallback={null}>
           <Gokyuzu />
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
