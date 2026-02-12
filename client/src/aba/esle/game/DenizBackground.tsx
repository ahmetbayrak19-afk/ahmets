// DenizBackground.tsx (gok.png YOK, sürekli su-altı gradient + sis)
import React, { Suspense, useRef, useEffect, useMemo } from "react";
import { Canvas, useFrame, extend, useThree, useLoader } from "@react-three/fiber";
import { useGLTF, useAnimations, Environment } from "@react-three/drei";
import * as THREE from "three";
import { Water } from "three-stdlib";

const DENIZ_GLB_URL =
  "https://firebasestorage.googleapis.com/v0/b/ogrencitakip-2a775.firebasestorage.app/o/deniz.glb?alt=media&token=6ecb1237-70e1-43c8-b997-77b6e3943497";

const WATER_NORMALS_URL =
  "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/water/Water_1_M_Normal.jpg";

extend({ Water });

// 2D ile uyumlu referans (yüzey)
const SEA_LEVEL_PX = 500;

// 2D px -> 3D birim dönüşümü
const PX_TO_3D = 0.015;

// Renk yardımcıları
function color(hex: string) {
  return new THREE.Color(hex);
}
function mix(a: THREE.Color, b: THREE.Color, t: number) {
  return a.clone().lerp(b, t);
}
function smoothstep(edge0: number, edge1: number, x: number) {
  const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

/**
 * İSTEDİĞİN LOOK:
 * - Hep "su altı" paleti (asla açık düz gökyüzü yok)
 * - Yüzeye yakın: turkuaz/açık mavi
 * - Aşağı inince: koyu laciverte akar
 * - Sis (fog) hiçbir zaman kapanmaz, derinlikte artar
 */
function BackgroundManager({ cameraRef }: { cameraRef: any }) {
  const { scene } = useThree();

  // Senin ekran görüntüsüne yakın palet:
  // (İstersen sonra ince ayar yaparız)
  const C_SHALLOW = useMemo(() => color("#0B6F8F"), []); // yüzeye yakın su (turkuaz)
  const C_MID = useMemo(() => color("#074B67"), []);     // orta derinlik
  const C_DEEP = useMemo(() => color("#032233"), []);    // derin (koyu mavi)

  useFrame(() => {
    if (!cameraRef.current) return;

    const camY = cameraRef.current.y;

    // Derinlik metriği:
    // SEA_LEVEL’de 0, SEA_LEVEL+1200’de 1
    const rawDepth = (camY - SEA_LEVEL_PX) / 1200;

    // Yüzeye yakınken bile 0’a kilitleme (negatife inmesin)
    const depth01 = THREE.MathUtils.clamp(rawDepth, 0, 1);

    // 2 aşamalı gradyan: shallow->mid->deep
    const t1 = smoothstep(0.0, 0.55, depth01); // 0..0.55 arası hızla otursun
    const t2 = smoothstep(0.45, 1.0, depth01); // 0.45..1 arası deep’e gitsin
    const cSM = mix(C_SHALLOW, C_MID, t1);
    const bg = mix(cSM, C_DEEP, t2);

    // Sis yoğunluğu: yüzeye yakın da var, aşağı indikçe artıyor
    // (senin istediğin "sis kaybolmasın" şartı)
    const fogDensity = THREE.MathUtils.lerp(0.020, 0.045, smoothstep(0.0, 1.0, depth01));

    scene.background = bg;
    scene.fog = new THREE.FogExp2(bg.getHex(), fogDensity);
  });

  return null;
}

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
      sunDirection: new THREE.Vector3(0.2, 1, 0.2),
      sunColor: 0xffffff,
      waterColor: 0x0b3a52,       // daha “deniz” hisli
      distortionScale: 2.6,       // çok kırıp bozmasın
      fog: true,
      format:
        gl.outputColorSpace === THREE.SRGBColorSpace ? THREE.SRGBColorSpace : undefined,
    }),
    [waterNormals, gl.outputColorSpace]
  );

  useFrame((_, delta) => {
    const t = delta * 0.6;
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

function MovingScene({ cameraRef }: { cameraRef: any }) {
  const group = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!group.current || !cameraRef.current) return;

    const camX = cameraRef.current.x;
    const camY = cameraRef.current.y;

    group.current.position.x = -camX * PX_TO_3D;
    group.current.position.y = camY * PX_TO_3D;
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
    <div className="absolute inset-0">
      <Canvas
        camera={{ position: [0, 5, 20], fov: 45 }}
        style={{ pointerEvents: "none" }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
        }}
      >
        <Environment preset="city" background={false} />

        <BackgroundManager cameraRef={cameraRef} />

        <ambientLight intensity={1.1} />
        <directionalLight position={[10, 20, 10]} intensity={2.0} />

        <Suspense fallback={null}>
          <MovingScene cameraRef={cameraRef} />
        </Suspense>
      </Canvas>
    </div>
  );
}
