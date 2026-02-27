'use client'

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Points, PointMaterial } from '@react-three/drei'
import * as THREE from 'three'

function ParticleField() {
    const ref = useRef<THREE.Points>(null)

    // Generate particles in a sphere distribution
    const particles = useMemo(() => {
        const positions = new Float32Array(3000 * 3)
        for (let i = 0; i < 3000; i++) {
            const theta = Math.random() * Math.PI * 2
            const phi = Math.acos(2 * Math.random() - 1)
            const r = 1.5 + Math.random() * 3

            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
            positions[i * 3 + 2] = r * Math.cos(phi)
        }
        return positions
    }, [])

    useFrame((state, delta) => {
        if (ref.current) {
            ref.current.rotation.x -= delta * 0.02
            ref.current.rotation.y -= delta * 0.03
        }
    })

    return (
        <group rotation={[0, 0, Math.PI / 4]}>
            <Points ref={ref} positions={particles} stride={3} frustumCulled={false}>
                <PointMaterial
                    transparent
                    color="#8b5cf6"
                    size={0.008}
                    sizeAttenuation={true}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </Points>
        </group>
    )
}

function AuroraWaves() {
    const mesh = useRef<THREE.Mesh>(null)

    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uColor1: { value: new THREE.Color('#7c3aed') },
        uColor2: { value: new THREE.Color('#06b6d4') },
        uColor3: { value: new THREE.Color('#ec4899') },
    }), [])

    useFrame((state) => {
        uniforms.uTime.value = state.clock.elapsedTime
        if (mesh.current) {
            mesh.current.rotation.z = state.clock.elapsedTime * 0.02
        }
    })

    const vertexShader = `
    varying vec2 vUv;
    varying float vElevation;
    uniform float uTime;
    
    void main() {
      vUv = uv;
      vec3 pos = position;
      
      float elevation = sin(pos.x * 2.0 + uTime * 0.5) * 0.15
                      + sin(pos.y * 3.0 + uTime * 0.3) * 0.1
                      + sin((pos.x + pos.y) * 1.5 + uTime * 0.4) * 0.12;
      
      pos.z += elevation;
      vElevation = elevation;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `

    const fragmentShader = `
    varying vec2 vUv;
    varying float vElevation;
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform vec3 uColor3;
    uniform float uTime;
    
    void main() {
      float mixStrength = (vElevation + 0.25) * 2.0;
      
      vec3 color = mix(uColor1, uColor2, vUv.x);
      color = mix(color, uColor3, vUv.y * 0.6);
      color = mix(color, uColor1, mixStrength * 0.5);
      
      float alpha = 0.4 + mixStrength * 0.3;
      alpha *= smoothstep(0.0, 0.3, vUv.y) * smoothstep(1.0, 0.7, vUv.y);
      alpha *= smoothstep(0.0, 0.2, vUv.x) * smoothstep(1.0, 0.8, vUv.x);
      
      gl_FragColor = vec4(color, alpha * 0.6);
    }
  `

    return (
        <mesh ref={mesh} position={[0, 0, -2]} rotation={[-0.3, 0, 0]}>
            <planeGeometry args={[8, 4, 128, 64]} />
            <shaderMaterial
                uniforms={uniforms}
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                transparent
                blending={THREE.AdditiveBlending}
                side={THREE.DoubleSide}
            />
        </mesh>
    )
}

function GlowingSphere() {
    const mesh = useRef<THREE.Mesh>(null)

    useFrame((state) => {
        if (mesh.current) {
            mesh.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2
            mesh.current.rotation.y = state.clock.elapsedTime * 0.1
        }
    })

    return (
        <mesh ref={mesh} position={[2, 0.5, -1]}>
            <sphereGeometry args={[0.3, 32, 32]} />
            <meshBasicMaterial color="#a855f7" transparent opacity={0.3} />
        </mesh>
    )
}

export default function AuroraBackground() {
    return (
        <div className="fixed inset-0 z-0">
            {/* Base gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(0,0,0,0))]" />
            <div className="absolute inset-0 bg-gradient-to-b from-black via-[#0a0118] to-[#0f0a1e]" />

            {/* 3D Canvas */}
            <Canvas
                camera={{ position: [0, 0, 3], fov: 60 }}
                dpr={[1, 2]}
                style={{ position: 'absolute', inset: 0 }}
            >
                <fog attach="fog" args={['#0a0118', 3, 8]} />
                <ambientLight intensity={0.1} />
                <ParticleField />
                <AuroraWaves />
                <GlowingSphere />
            </Canvas>

            {/* Overlay gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none" />
        </div>
    )
}
