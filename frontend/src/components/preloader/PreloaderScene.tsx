import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sphere, Icosahedron } from "@react-three/drei";
import * as THREE from "three";

function CoreStructure({ progress }: { progress: number }) {
  const group = useRef<THREE.Group>(null!);
  const ring = useRef<THREE.Mesh>(null!);
  const scale = 0.4 + (progress / 100) * 0.6;
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (group.current) {
      group.current.rotation.y = t * 0.5;
      group.current.rotation.x = Math.sin(t * 0.3) * 0.2;
      group.current.position.y = Math.sin(t * 0.8) * 0.15;
    }
    if (ring.current) {
      ring.current.rotation.z = -t * 0.4;
      ring.current.rotation.x = Math.PI / 2 + Math.sin(t * 0.5) * 0.2;
    }
  });

  return (
    <group ref={group} scale={scale}>
      <Float speed={2} rotationIntensity={0.4} floatIntensity={0.6}>
        <mesh>
          <boxGeometry args={[1.2, 1.2, 1.2]} />
          <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.6} metalness={0.6} roughness={0.2} wireframe />
        </mesh>
        <mesh rotation={[Math.PI / 4, Math.PI / 4, 0]}>
          <octahedronGeometry args={[1.1, 0]} />
          <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={0.5} transparent opacity={0.6} wireframe />
        </mesh>
        <Sphere args={[0.55, 32, 32]}>
          <MeshDistortMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.4} distort={0.25} speed={2} transparent opacity={0.7} />
        </Sphere>
      </Float>
      <mesh ref={ring}>
        <torusGeometry args={[1.8, 0.03, 16, 100]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.7} />
      </mesh>
      <mesh rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[2.1, 0.02, 16, 100]} />
        <meshBasicMaterial color="#8b5cf6" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

function Particles() {
  const count = 120;
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 14;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 10;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    return arr;
  }, []);
  const ref = useRef<THREE.Points>(null!);
  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = state.clock.getElapsedTime() * 0.03;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.04} color="#60a5fa" transparent opacity={0.7} sizeAttenuation />
    </points>
  );
}

export default function PreloaderScene({ progress }: { progress: number }) {
  return (
    <Canvas camera={{ position: [0, 0, 6], fov: 50 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
      <color attach="background" args={["#080D1B"]} />
      <fog attach="fog" args={["#080D1B", 6, 14]} />
      <ambientLight intensity={0.4} />
      <pointLight position={[4, 4, 4]} intensity={2} color="#3b82f6" />
      <pointLight position={[-4, -2, 3]} intensity={1.5} color="#8b5cf6" />
      <pointLight position={[0, 3, -3]} intensity={1.2} color="#22d3ee" />
      <Particles />
      {progress > 15 && <CoreStructure progress={progress} />}
      <Float speed={1.5} floatIntensity={0.4}>
        <Icosahedron args={[0.18, 0]} position={[-2.8, 1.2, -1]}>
          <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.8} />
        </Icosahedron>
      </Float>
      <Float speed={1.2} floatIntensity={0.5}>
        <Icosahedron args={[0.14, 0]} position={[2.6, -1.3, -0.5]}>
          <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={0.8} />
        </Icosahedron>
      </Float>
    </Canvas>
  );
}
