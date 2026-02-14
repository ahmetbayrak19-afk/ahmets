import React, { Suspense, useRef, useEffect, useMemo } from "react";
import { Canvas, useFrame, extend, useThree, useLoader } from "@react-three/fiber";
import { useGLTF, useAnimations, Environment } from "@react-three/drei";
import * as THREE from "three";
import { Water } from "three-stdlib";

// 🔥 YENİ: 3D Balık Bileşenini İçe Aktar
import { Fish3D } from "./Fish3D";

// --- SABİTLER ---
const DENIZ_GLB_URL = "https://firebasestorage.googleapis.com/v0/b/ogrencitakip-2a775.firebasestorage.app/o/deniz.glb?alt=media&token=6ecb1237-70e1-43c8-b997-77b6e3943497";
const WATER_NORMALS_URL = "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/water/Water_1_M_Normal.jpg";

extend({ Water });

// --- RENK PALETİ ---
const C_SHALLOW = new THREE.Color("#0B6F8F"); // Yüzey (Turkuaz)
const C_MID = new THREE.Color("#074B67");     // Orta (Mavi)
const C_DEEP = new THREE.Color("#00020a");    // Dip (Zifiri Karanlık)

// Matematiksel yumuşatma fonksiyonu
function smoothstep(edge0: number, edge1: number, x: number) {
  const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

// 🚀 OPTİMİZE EDİLMİŞ ARKAPLAN & SİS YÖNETİCİSİ
function BackgroundManager({ cameraRef }: { cameraRef: any }) {
  const { scene } = useThree();
  const tempColor = useMemo(() => new THREE.Color(), []);

  useEffect(() => {
    scene.fog = new THREE.FogExp2(0x000000, 0.02);
    return () => { scene.fog = null; };
  }, [scene]);

  useFrame(() => {
    if (!cameraRef.current || !scene.fog) return;

    const camY = cameraRef.current.y;
    // Derinlik hesaplama (Aşağı indikçe kararır)
    const depth = THREE.MathUtils.clamp((camY - 15) / 1500, 0, 1);

    const t1 = smoothstep(0.0, 0.3, depth); 
    const t2 = smoothstep(0.3, 1.0, depth); 

    tempColor
      .copy(C_SHALLOW)
      .lerp(C_MID, t1)
      .lerp(C_DEEP, t2);

    const targetDensity = THREE.MathUtils.lerp(0.02, 0.05, t2);

    scene.background = tempColor;
    // @ts-ignore
    scene.fog.color.copy(tempColor);
    // @ts-ignore
    scene.fog.density = targetDensity;
  });

  return null;
}

// 🎥 KAMERA TAKİPÇİSİ (YENİ)
// 3D Kameranın 2D Kamerayı (dolayısıyla balığı) takip etmesini sağlar.
function CameraRig({ cameraRef }: { cameraRef: any }) {
  useFrame((state) => {
    if (!cameraRef.current) return;
    
    // Fish3D dosyasındaki SCALE_FACTOR ile uyumlu olmalı (0.015)
    const SCALE = 0.015;

    // Kamerayı balığın X pozisyonuna götür
    state.camera.position.x = cameraRef.current.x * SCALE;
    
    // Kamerayı balığın Y pozisyonuna göre ayarla (Hafif yukarıdan bakış +5)
    // Fizikte Y aşağı doğru artıyorsa buraya dikkat (- ile çarpma gerekebilir)
    state.camera.position.y = (cameraRef.current.y * SCALE) + 5; 
  });
  return null;
}

// --- OKYANUS ---
function Ocean() {
  const refTop = useRef<any>();
  const refBottom = useRef<any>();
  const gl = useThree((s) => s.gl);

  const waterNormals = useLoader(THREE.TextureLoader, WATER_NORMALS_URL);
  useEffect(() => {
    waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;
    waterNormals.repeat.set(4, 4);
  }, [waterNormals]);

  const config = useMemo(
    () => ({
      textureWidth: 512,
      textureHeight: 512,
      waterNormals,
      sunDirection: new THREE.Vector3(),
      sunColor: 0x0077ff, 
      waterColor: 0x001e0f,
      distortionScale: 3.7,
      fog: true, 
      format: gl.outputColorSpace === "srgb" ? THREE.SRGBColorSpace : undefined,
    }),
    [waterNormals, gl.outputColorSpace]
  );

  useFrame((_, delta) => {
    const t = delta * 0.5;
    if (refTop.current) refTop.current.material.uniforms.time.value += t;
    if (refBottom.current) refBottom.current.material.uniforms.time.value += t;
  });

  return (
    <group position={[0, 15, 0]}>
      <water
        ref={refTop}
        args={[new THREE.PlaneGeometry(20000, 20000), config]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <water
        ref={refBottom}
        args={[new THREE.PlaneGeometry(20000, 20000), config]}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, -0.05, 0]}
      />
    </group>
  );
}

// --- DENİZ DİBİ MODELİ ---
function DenizModel() {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(DENIZ_GLB_URL);
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    Object.keys(actions).forEach((k) => actions[k]?.reset().fadeIn(0.3).play());
  }, [actions]);

  const clone = useMemo(() => scene.clone(true), [scene]);

  return (
    <group ref={group}>
      <primitive
        object={clone}
        scale={[1, 1, 4]} 
        position={[0, -5, -5]}
        rotation={[0, -Math.PI / 2, 0]}
      />
    </group>
  );
}

// --- ANA COMPONENT ---
// Artık fishRef parametresini de alıyor
export default function DenizBackground({ cameraRef, fishRef }: { cameraRef: any, fishRef: any }) {
  return (
    <div className="absolute inset-0 bg-black">
      <Canvas
        camera={{ position: [0, 5, 20], fov: 45 }}
        style={{ pointerEvents: "none" }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      >
        <Environment preset="city" background={false} />

        {/* Arka plan rengini ve sisi yönetir */}
        <BackgroundManager cameraRef={cameraRef} />

        {/* 3D Kameranın balığı takip etmesini sağlar */}
        <CameraRig cameraRef={cameraRef} />

        <ambientLight intensity={1.5} color="#ffffff" />
        <directionalLight position={[10, 20, 10]} intensity={2} color="#ffffff" />

        <Suspense fallback={null}>
            {/* Dekorlar (Deniz, Kayalar) */}
            <DenizModel />
            <Ocean />
            
            {/* 🔥 BİZİM YENİ BALIK 🔥 */}
            <Fish3D fishRef={fishRef} />
        </Suspense>
      </Canvas>
    </div>
  );
    }
