// src/components/Auth/LoginBackground.jsx
import * as THREE from 'three';
import { useRef, useReducer, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MeshTransmissionMaterial, Environment, Lightformer } from '@react-three/drei';
import { CuboidCollider, BallCollider, Physics, RigidBody } from '@react-three/rapier';
import { EffectComposer, N8AO } from '@react-three/postprocessing';
import SmartModel from './SmartModel';

const accents = ['#4060ff', '#20ffa0', '#ff4060', '#ffcc00'];
const shuffle = (accent = 0) => [
  { color: '#444', roughness: 0.1 },
  { color: '#444', roughness: 0.75 },
  { color: 'white', roughness: 0.1 },
  { color: accents[accent], roughness: 0.1, accent: true },
];

export const LoginBackground = ({ children }) => {
  const [accent, click] = useReducer((state) => ++state % accents.length, 0);
  const connectors = useMemo(() => {
    const count = 60; // Reducido para mejor rendimiento
    const base = shuffle(accent);
    return Array.from({ length: count }, (_, i) => base[i % base.length]);
  }, [accent]);

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
      <Canvas
        onClick={click}
        shadows
        dpr={[1, 1.5]}
        gl={{ antialias: false }}
        camera={{ position: [0, 0, 15], fov: 17.5, near: 1, far: 20 }}
      >
        <color attach="background" args={['#d2d2d2']} />
        <ambientLight intensity={0.3} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={0.8} castShadow />
        <Physics gravity={[0, 0, 0]}>
          <Pointer />
          {connectors.map((props, i) => (
            <Connector key={i} {...props} />
          ))}
          <Connector position={[10, 10, 5]}>
            <SmartModel
              path="/assets/models/samsungs.glb"
              useLusion
              color="#ffffff"
              roughness={0.1}
              scale={3}
            >
              <MeshTransmissionMaterial
                clearcoat={0.8}
                thickness={0.05}
                samples={4} // Reducido para rendimiento
                resolution={256} // Reducido
              />
            </SmartModel>
          </Connector>
        </Physics>
        <EffectComposer multisampling={4}> {/* Reducido */}
          <N8AO distanceFalloff={0.5} aoRadius={0.5} intensity={2} /> {/* Ajustado */}
        </EffectComposer>
        <Environment resolution={128}> {/* Reducido */}
          <group rotation={[-Math.PI / 3, 0, 1]}>
            <Lightformer form="circle" intensity={3} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={1.5} />
            <Lightformer form="circle" intensity={1} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={1.5} />
          </group>
        </Environment>
      </Canvas>
      {children} {/* Renderiza los hijos (como el formulario) encima */}
    </div>
  );
};

function Connector({ position, children, vec = new THREE.Vector3(), scale, r = THREE.MathUtils.randFloatSpread, accent, ...props }) {
  const api = useRef();
  const pos = useMemo(() => position || [r(10), r(10), r(10)], [position]);
  useFrame((_, delta) => {
    delta = Math.min(0.1, delta);
    api.current?.applyImpulse(vec.copy(api.current.translation()).negate().multiplyScalar(0.1));
  });
  return (
    <RigidBody linearDamping={2} angularDamping={0.5} friction={0.1} position={pos} ref={api} colliders={false}>
      <CuboidCollider args={[0.38, 1.27, 0.38]} />
      {children ? (
        children
      ) : (
        <SmartModel
          path="/assets/models/samsungs.glb"
          useLusion
          color={props.color}
          roughness={props.roughness}
          scale={2} // Reducido para rendimiento
        />
      )}
      {accent && <pointLight intensity={2} distance={2} color={props.color} />}
    </RigidBody>
  );
}

function Pointer({ vec = new THREE.Vector3() }) {
  const ref = useRef();
  useFrame(({ mouse, viewport }) => {
    ref.current?.setNextKinematicTranslation(
      vec.set((mouse.x * viewport.width) / 2, (mouse.y * viewport.height) / 2, 0)
    );
  });
  return (
    <RigidBody type="kinematicPosition" colliders={false} ref={ref}>
      <BallCollider args={[1]} />
    </RigidBody>
  );
}