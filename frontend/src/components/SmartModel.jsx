// src/components/SmartModel.jsx
import { useRef, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { easing } from 'maath'

const SmartModel = ({ path, useLusion = false, color = 'white', roughness = 0.1, scale = 3, ...props }) => {
  const ref = useRef()
  const { scene } = useGLTF(path)

  const mesh = useMemo(() => {
    if (!useLusion) return null
    let found
    scene.traverse((child) => {
      if (!found && child.isMesh) found = child
    })
    return found
  }, [scene, useLusion])

  useFrame((_, delta) => {
    if (useLusion && ref.current?.material?.color) {
      easing.dampC(ref.current.material.color, color, 0.2, delta)
    }
  })

  if (useLusion && mesh) {
    return (
      <mesh
        ref={ref}
        castShadow
        receiveShadow
        geometry={mesh.geometry}
        scale={scale}
        {...props}
      >
        <meshStandardMaterial
          metalness={0.2}
          roughness={roughness}
          map={mesh.material?.map}
        />
      </mesh>
    )
  }

  return <primitive object={scene} scale={scale} {...props} />
}

export default SmartModel
