import React, { Suspense, useRef, useEffect, useMemo } from "react";
import { Canvas, useFrame, extend, useThree, useLoader } from "@react-three/fiber";
import { useGLTF, useAnimations, Environment } from "@react-three/drei";
import * as THREE from "three";
import { Water } from "three-stdlib";

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

// 🚀 OPTİMİZE EDİLMİŞ ARKAPLAN & SİS YÖNETİCİSİ 🚀
function BackgroundManager({ cameraRef }: { cameraRef: any }) {
  const { scene } = useThree();

  // Bellek optimizasyonu için renk nesnesi
  const tempColor = useMemo(() => new THREE.Color(), []);

  // 1. ADIM: Sahne açılınca Sisi yarat.
  useEffect(() => {
    scene.fog = new THREE.FogExp2(0x000000, 0.02);
    return () => { scene.fog = null; };
  }, [scene]);

  // 2. ADIM: Her karede güncelle.
  useFrame(() => {
    if (!cameraRef.current || !scene.fog) return;

    const camY = cameraRef.current.y;
    
    // 🔥 DÜZELTME BURADA YAPILDI 🔥
    // Eskisi: (15 - camY) idi. 
    // Yenisi: (camY - 15) oldu.
    // Mantık: Kamera Y değeri arttıkça (aşağı indikçe), depth değeri artsın (koyulaşsın).
    // 15: Yüzey seviyesi.
    // 1500: Tam karanlığa ulaşılacak derinlik mesafesi.
    const depth = THREE.MathUtils.clamp((camY - 15) / 1500, 0, 1);

    // --- RENK KARIŞTIRMA ---
    const t1 = smoothstep(0.0, 0.3, depth); 
    const t2 = smoothstep(0.3, 1.0, depth); 

    tempColor
      .copy(C_SHALLOW)      // Yüzey rengiyle başla
      .lerp(C_MID, t1)      // Orta renge git
      .lerp(C_DEEP, t2);    // Dibe doğru koyulaş

    // --- SİS YOĞUNLUĞU ---
    // Derine indikçe sis artsın
    const targetDensity = THREE.MathUtils.lerp(0.02, 0.05, t2);

    // --- UYGULAMA ---
    scene.background = tempColor;
    // @ts-ignore
    scene.fog.color.copy(tempColor);
    // @ts-ignore
    scene.fog.density = targetDensity;
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

// --- HAREKETLİ SAHNE ---
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

// --- ANA COMPONENT ---
export default function DenizBackground({ cameraRef }: { cameraRef: any }) {
  return (
    <div className="absolute inset-0 bg-black">
      <Canvas
        camera={{ position: [0, 5, 20], fov: 45 }}
        style={{ pointerEvents: "none" }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      >
        <Environment preset="city" background={false} />

        <BackgroundManager cameraRef={cameraRef} />

        <ambientLight intensity={1.5} color="#ffffff" />
        <directionalLight position={[10, 20, 10]} intensity={2} color="#ffffff" />

        <Suspense fallback={null}>
          <MovingScene cameraRef={cameraRef} />
        </Suspense>
      </Canvas>
    </div>
  );
}
  
