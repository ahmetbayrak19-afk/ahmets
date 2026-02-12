import React, { Suspense, useRef, useEffect, useMemo } from "react";
import { Canvas, useFrame, extend, useThree, useLoader } from "@react-three/fiber";
import { useGLTF, useAnimations, Environment } from "@react-three/drei";
import * as THREE from "three";
import { Water } from "three-stdlib";

// --- SABİTLER ---
const DENIZ_GLB_URL = "https://firebasestorage.googleapis.com/v0/b/ogrencitakip-2a775.firebasestorage.app/o/deniz.glb?alt=media&token=6ecb1237-70e1-43c8-b997-77b6e3943497";
const WATER_NORMALS_URL = "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/water/Water_1_M_Normal.jpg";

extend({ Water });

// --- RENK PALETİ (Döngü dışında tanımladık, tekrar tekrar yaratılmasın) ---
// Bu renkler bellekte sadece 1 kere yer kaplar.
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

  // Geçici renk değişkeni.
  // Her karede yeni renk yaratmak yerine, bu kutunun içini boyayıp kullanacağız.
  // Garbage Collector (Çöp Toplayıcı) buna bayılır.
  const tempColor = useMemo(() => new THREE.Color(), []);

  // 1. ADIM: Sahne açılınca Sisi (Fog) SADECE BİR KERE yarat.
  useEffect(() => {
    // Başlangıçta siyah sis, yoğunluk 0.02
    scene.fog = new THREE.FogExp2(0x000000, 0.02);
    
    // Temizlik (Component silinirse sisi kaldır)
    return () => { scene.fog = null; };
  }, [scene]);

  // 2. ADIM: Her karede (60 FPS) sadece DEĞERLERİ güncelle.
  useFrame(() => {
    if (!cameraRef.current || !scene.fog) return;

    const camY = cameraRef.current.y;
    
    // Derinlik hesabı (0 ile 1 arası)
    // Deniz yüzeyi ~15. 1500 birim aşağı inince tam karanlık (1.0) olsun.
    const depth = THREE.MathUtils.clamp((15 - camY) / 1000, 0, 1);

    // --- RENK KARIŞTIRMA (ALLOCATION FREE) ---
    // Önce tempColor'ı Shallow rengine eşitle.
    // Sonra Mid rengine doğru 'lerp' (yumuşak geçiş) yap.
    // Sonra Deep rengine doğru 'lerp' yap.
    // HİÇBİR YERDE "new THREE.Color" YOK!
    
    const t1 = smoothstep(0.0, 0.3, depth); // Sığdan ortaya geçiş hızı
    const t2 = smoothstep(0.3, 1.0, depth); // Ortadan dibe geçiş hızı

    tempColor
      .copy(C_SHALLOW)      // Kopyala
      .lerp(C_MID, t1)      // Karıştır 1
      .lerp(C_DEEP, t2);    // Karıştır 2

    // --- SİS YOĞUNLUĞU ---
    // Derine indikçe sis 0.02'den 0.05'e çıksın (daha yoğun olsun)
    // Böylece yüzey tamamen kaybolur.
    const targetDensity = THREE.MathUtils.lerp(0.02, 0.05, t2);

    // --- UYGULAMA ---
    scene.background = tempColor;          // Arkaplanı boya
    // @ts-ignore
    scene.fog.color.copy(tempColor);       // Sisi boya (nesne yaratmadan)
    // @ts-ignore
    scene.fog.density = targetDensity;     // Sis yoğunluğunu güncelle
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
      sunColor: 0x0077ff, // Mavi yansıma (Beyaz parlamayı önler)
      waterColor: 0x001e0f,
      distortionScale: 3.7,
      fog: true, // Sisten etkilensin (Dibe dalınca kaybolması için şart)
      format: gl.outputColorSpace === "srgb" ? THREE.SRGBColorSpace : undefined,
    }),
    [waterNormals, gl.outputColorSpace]
  );

  useFrame((_, delta) => {
    // Delta ile zamanı güncelle (Animasyon)
    const t = delta * 0.5;
    if (refTop.current) refTop.current.material.uniforms.time.value += t;
    if (refBottom.current) refBottom.current.material.uniforms.time.value += t;
  });

  return (
    <group position={[0, 15, 0]}>
      {/* Üst Yüzey */}
      <water
        ref={refTop}
        args={[new THREE.PlaneGeometry(20000, 20000), config]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      {/* Alt Yüzey (Ters) - Mavi boşluğu yansıtması için */}
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

  // Modeli clone'luyoruz ki sahnede çakışma olmasın
  const clone = useMemo(() => scene.clone(true), [scene]);

  return (
    <group ref={group}>
      <primitive
        object={clone}
        scale={[1, 1, 4]} // Genişletilmiş
        position={[0, -5, -5]}
        rotation={[0, -Math.PI / 2, 0]}
      />
    </group>
  );
}

// --- HAREKETLİ SAHNE (PARALAKS) ---
function MovingScene({ cameraRef }: { cameraRef: any }) {
  const group = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!group.current || !cameraRef.current) return;

    const camX = cameraRef.current.x;
    const camY = cameraRef.current.y;

    // Kameraya göre sahneyi ters yönde kaydır
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
        // Performance ayarları: Alpha kapalı (daha hızlı), Antialias açık
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      >
        <Environment preset="city" background={false} />

        {/* Optimize edilmiş yönetici */}
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
      
