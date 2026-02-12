// DenizBackground.tsx (gok.png YOK)
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

// 2D Physics’teki SEA_LEVEL ile aynı mantık (2D’de aşağı indikçe Y artar)
const SEA_LEVEL_PX = 500;

// 2D px -> 3D sahne birimi çeviri oranı
const PX_TO_3D = 0.015;

function lerpColor(a: string, b: string, t: number) {
  const ca = new THREE.Color(a);
  const cb = new THREE.Color(b);
  return ca.lerp(cb, t);
}

// 🎨 ARKAPLAN + SİS (AŞAĞI İNDİKÇE KOYULAŞAN, SİYAHA DÜŞMEYEN)
function BackgroundManager({ cameraRef }: { cameraRef: any }) {
  const { scene } = useThree();

  useFrame(() => {
    if (!cameraRef.current) return;

    const camY = cameraRef.current.y;

    // Derinlik: SEA_LEVEL’de 0, SEA_LEVEL+900’de 1
    const depth = THREE.MathUtils.clamp((camY - SEA_LEVEL_PX) / 900, 0, 1);
    const isUnderwater = camY > SEA_LEVEL_PX + 20;

    // Renkler (siyah yok)
    const sky = "#87CEEB";      // su üstü
    const shallow = "#0a6aa6";  // yüzeye yakın su
    const deep = "#01223a";     // derin su (siyah değil)

    const bg = isUnderwater ? lerpColor(shallow, deep, depth) : new THREE.Color(sky);

    scene.background = bg;

    if (isUnderwater) {
      // derinleştikçe fog yoğunlaşır
      const density = THREE.MathUtils.lerp(0.012, 0.04, depth);
      scene.fog = new THREE.FogExp2(bg.getHex(), density);
    } else {
      scene.fog = null;
    }
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
  }, [waterNormals]);

  const config = useMemo(
    () => ({
      textureWidth: 512,
      textureHeight: 512,
      waterNormals,
      sunDirection: new THREE.Vector3(0.2, 1, 0.2),
      sunColor: 0xffffff,
      waterColor: 0x001e2d,
      distortionScale: 3.7,
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
          gl.toneMappingExposure = 1.0;
        }}
      >
        <Environment preset="city" background={false} />

        <BackgroundManager cameraRef={cameraRef} />

        <ambientLight intensity={1.2} />
        <directionalLight position={[10, 20, 10]} intensity={2.0} />

        <Suspense fallback={null}>
          <MovingScene cameraRef={cameraRef} />
        </Suspense>
      </Canvas>
    </div>
  );
}
