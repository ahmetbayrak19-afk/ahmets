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
      position={[0, 20, 0]} 
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

// 🔥 KAMERA VE SAHNE HAREKETİ BURADA 🔥
function MovingScene({ cameraRef }: { cameraRef: any }) {
  const group = useRef<THREE.Group>(null);
  const { camera } = useThree(); // Three.js kamerasını yakalıyoruz

  useFrame(() => {
    if (!group.current || !cameraRef.current) return;
    
    // Balığın o anki pozisyonlarını alıyoruz
    const camX = cameraRef.current.x;
    const camY = cameraRef.current.y;
    
    // 1. Arkaplanı kaydır (Sanki balık ilerliyormuş gibi)
    group.current.position.x = -camX * 0.015;
    group.current.position.y = camY * 0.015;

    // 🔥 2. KAMERAYI BALIĞA KİLİTLE (ASANSÖR MANTIĞI) 🔥
    // X = 0 (Sabit kalsın, sağa sola gitmesin)
    // Y = camY (Balık 20 ise kamera 20, balık 30 ise kamera 30 olsun)
    // Z = 20 (Balıktan 20 metre geride dursun)
    camera.position.set(0, camY, 20); 
    
    // NOT: camera.lookAt() kullanmadığımız için kamera asla kafasını çevirmez.
    // Başlangıçta nereye bakıyorsa (dümdüz karşıya) hep oraya bakar.
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
        // Başlangıç ayarı: Y=10, Z=20.
        // Oyun başlayınca MovingScene içindeki kod bunu hemen balığın Y'sine eşitleyecek.
        camera={{ position: [0, 10, 20], fov: 45 }} 
        style={{ pointerEvents: 'none' }}
      >
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
