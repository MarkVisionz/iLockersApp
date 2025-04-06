import * as THREE from "three";
import { useEffect, useRef, useMemo, useReducer } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF, Float, Environment, Lightformer } from "@react-three/drei";
import { Physics, RigidBody, BallCollider } from "@react-three/rapier";
import { EffectComposer, N8AO } from '@react-three/postprocessing';

const accents = ["#4060ff", "#20ffa0", "#ff4060", "#ffcc00"];
const shuffle = (accent = 0) => [
  { color: "#444", roughness: 0.1 },
  { color: "#444", roughness: 0.75 },
  { color: "#444", roughness: 0.75 },
  { color: "white", roughness: 0.1 },
  { color: "white", roughness: 0.75 },
  { color: "white", roughness: 0.1 },
  { color: accents[accent], roughness: 0.1, accent: true },
  { color: accents[accent], roughness: 0.75, accent: true },
  { color: accents[accent], roughness: 0.1, accent: true },
];

const Pointer = ({ vec = new THREE.Vector3() }) => {
  const ref = useRef();
  useFrame(({ mouse, viewport }) => {
    ref.current?.setNextKinematicTranslation(
      vec.set((mouse.x * viewport.width) / 2, (mouse.y * viewport.height) / 2, 0)
    );
  });
  return (
    <RigidBody type="kinematicPosition" colliders={false} ref={ref}>
      <BallCollider args={[3]} />
    </RigidBody>
  );
};

const FloatingObjects = () => {
  const group = useRef([]);
  const { viewport, mouse, gl } = useThree();
  const [accent, click] = useReducer((state) => ++state % accents.length, 0);

  useEffect(() => {
    const onClick = () => click();
    gl.domElement.addEventListener("click", onClick);
    return () => gl.domElement.removeEventListener("click", onClick);
  }, [gl]);

  const isMobile = window.innerWidth < 768;
  const objectCount = isMobile ? 30 : 200;

  const { scene: detergent } = useGLTF("/assets/models/detergent_bottle.glb");
  const { scene: tshirt } = useGLTF("/assets/models/tshirt.glb");
  const { scene: samsungs } = useGLTF("/assets/models/samsungs.glb");
  const { scene: hangers } = useGLTF("/assets/models/hangers.glb");

  const washerMesh = useMemo(() => {
    let mesh = null;
    samsungs.traverse((child) => {
      if (child.isMesh && !mesh) {
        mesh = child.clone();
        mesh.geometry.center();
      }
    });
    return mesh;
  }, [samsungs]);

  const extractAllGeometries = (scene) => {
    const geometries = [];
    scene.traverse((child) => {
      if (child.isMesh) {
        geometries.push(child.geometry.clone());
      }
    });
    return geometries;
  };

  const detergentGeometries = useMemo(() => extractAllGeometries(detergent), [detergent]);

  const shuffledColors = useMemo(() => {
    const base = shuffle(accent);
    return Array.from({ length: objectCount }, (_, i) => base[i % base.length]);
  }, [accent, objectCount]);

  const models = useMemo(() => {
    const types = ["washer", "detergent", "tshirt", "hangers"];

    return Array.from({ length: objectCount }, (_, i) => {
      const type = types[i % types.length];
      const colorProps = shuffledColors[i];

      const position = [
        (Math.random() - 0.5) * viewport.width * 2,
        (Math.random() - 0.5) * viewport.height * 2,
        (Math.random() - 0.5) * 6,
      ];

      let geometries = [], scale;
      switch (type) {
        case "washer":
          geometries = washerMesh ? [washerMesh.geometry.clone()] : [];
          scale = 8;
          break;
        case "detergent":
          geometries = detergentGeometries;
          scale = 0.7;
          break;
        case "tshirt":
          tshirt.traverse((child) => {
            if (child.isMesh) geometries.push(child.geometry.clone());
          });
          scale = 0.1;
          break;
        case "hangers":
          hangers.traverse((child) => {
            if (child.isMesh) geometries.push(child.geometry.clone());
          });
          scale = 0.3;
          break;
        default:
          return null;
      }

      return { geometries, scale, position, ...colorProps };
    }).filter(Boolean);
  }, [washerMesh, detergentGeometries, tshirt, hangers, viewport, isMobile, shuffledColors]);

  useEffect(() => {
    group.current = [];
  }, [viewport.width, viewport.height]);

  useFrame(() => {
    group.current.forEach((body, i) => {
      if (!body || !body.translation || !body.applyImpulse) return;
      const { x, y, z } = body.translation();
      const toCenter = new THREE.Vector3(-x, -y, -z).normalize().multiplyScalar(10);
      body.applyImpulse(toCenter, true);
    });
  });

  return (
    <>
      <ambientLight intensity={0.4} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />

      <Physics gravity={[0, 0, 0]}>
        <Pointer />

        {models.map(({ geometries, scale, position, color, roughness }, i) => (
          <Float
            key={i}
            speed={1 + Math.random()}
            floatIntensity={1}
            rotationIntensity={0.5}
          >
            <RigidBody
              ref={(ref) => (group.current[i] = ref)}
              position={position}
              linearDamping={3}
              angularDamping={1}
              colliders="cuboid"
            >
              {geometries.map((geometry, j) => (
                <mesh
                  key={j}
                  castShadow
                  receiveShadow
                  geometry={geometry}
                  scale={scale}
                >
                  <meshStandardMaterial
                    color={color}
                    roughness={roughness}
                    metalness={0.4}
                    envMapIntensity={2}
                  />
                </mesh>
              ))}
            </RigidBody>
          </Float>
        ))}
      </Physics>

      <EffectComposer disableNormalPass multisampling={8}>
        <N8AO distanceFalloff={1} aoRadius={1} intensity={4} />
      </EffectComposer>

      <Environment resolution={256}>
        <group rotation={[-Math.PI / 3, 0, 1]}>
          <Lightformer form="circle" intensity={4} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={2} />
          <Lightformer form="circle" intensity={2} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={2} />
          <Lightformer form="circle" intensity={2} rotation-y={Math.PI / 2} position={[-5, -1, -1]} scale={2} />
          <Lightformer form="circle" intensity={2} rotation-y={-Math.PI / 2} position={[10, 1, 0]} scale={8} />
        </group>
      </Environment>
    </>
  );
};

export default FloatingObjects;
