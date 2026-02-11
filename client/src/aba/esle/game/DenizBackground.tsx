import React, { Suspense, useRef, useEffect, useMemo } from "react";
import { Canvas, useFrame, extend, useThree, useLoader } from "@react-three/fiber";
import { useGLTF, useAnimations, Environment } from "@react-three/drei";
import * as THREE from "three";
import { Water } from "three-stdlib"; 

const DENIZ_GLB_URL = "https://firebasestorage.googleapis.com/v0/b/ogrencitakip-2a775.firebasestorage.app/o/deniz.glb?alt=media&token=6ecb1237-70e1-43c8-b997-77b6e3943497";
const WATER_NORMALS_URL = "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/water/Water_1_M_Normal.jpg";

extend({ Water });

// 🎨 GRADYAN ARKAPLAN (RESİM YOK, SAF MATEMATİK) 🎨
function GradientBackground({ cameraRef }: { cameraRef: any }) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Özel Shader Materyali: Tepeden tırnağa renk geçişi sağlar
  const shaderArgs = useMemo(() => ({
    uniforms: {
      uColorTop: { value: new THREE.Color("#68c3eb") },    // ☀️ ÜST: Açık Mavi
      uColorBottom: { value: new THREE.Color("#00020a") } // 🌑 ALT: Zifiri Karanlık/Lacivert
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColorTop;
      uniform vec3 uColorBottom;
      varying vec2 vUv;
      void main() {
        // Y koordinatına göre (vUv.y) iki rengi karıştır
        gl_FragColor = vec4(mix(uColorBottom, uColorTop, vUv.y), 1.0);
      }
    `
  }), []);

  useFrame(() => {
    if (!meshRef.current || !cameraRef.current) return;
    const camX = cameraRef.current.x;

    // 1. X EKSENİ: Arkaplan kamerayla beraber gitsin (Sonsuzluk)
    meshRef.current.position.x = camX;
    
    // Y EKSENİ: Sabit. 
    // Yükseklik 1000 birim. Merkez 0 olsa, -500 ile +500 arasını kapsar.
    // Deniz 15'te. Yani hem gökyüzünü hem de denizin en dibini kapatır.
  });

  return (
    // Z=-400: En arkada dev bir duvar
    <mesh ref={meshRef} position={[0, 0, -400]}>
      <planeGeometry args={[5000, 1000]} /> 
      <shaderMaterial attach="material" args={[shaderArgs]} side={THREE.DoubleSide} />
    </mesh>
  );
}

// 🌫️ SİS VE ORTAM YÖNETİCİSİ
function EnvironmentManager({ cameraRef }: { cameraRef: any }) {
  const { scene } = useThree();

  useFrame(() => {
    if (!cameraRef.current) return;
    const camY = cameraRef.current.y;

    // Dinamik Sis Ayarı:
    // Su altındaysan (14 altı) sis açılır. 
    // Sis rengi, gradyanın en alt rengiyle (#00020a) AYNI olmalı.
    if (camY < 14) { 
      scene.fog = new THREE.FogExp2('#00020a', 0.025); 
    } else {
      scene.fog = null; // Su üstünde sis yok, gökyüzü net
    }
    // Not: scene.background kullanmıyoruz, çünkü arkada GradientBackground var.
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
      fog: true, // Sis açık ki dibe dalınca yüzey kaybolsun
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
        
        {/* Sis Yönetimi */}
        <EnvironmentManager cameraRef={cameraRef} />

        {/* 🔥 YENİ GRADYAN ARKAPLAN (RESİMSİZ) 🔥 */}
        <Suspense fallback={null}>
            <GradientBackground cameraRef={cameraRef} />
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
      
