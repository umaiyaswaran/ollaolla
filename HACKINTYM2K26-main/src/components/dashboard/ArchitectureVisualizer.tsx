import { useMemo, useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import type { AnalysisResult, ServiceNode } from "@/services/codeAnalyzer";

interface AnalyzedNode {
  id: string;
  label: string;
  x: number;
  y: number;
  z: number;
  type: "service" | "database" | "cache" | "gateway" | "frontend" | "api";
  status: "healthy" | "active" | "idle";
  load: number;
}

interface AnalyzedEdge {
  from: string;
  to: string;
  active: boolean;
  traffic: number;
}

const TYPE_COLOR: Record<string, string> = {
  service: "#00ffa3",
  database: "#00d4ff",
  cache: "#ffaa00",
  gateway: "#ff006e",
  frontend: "#00f5ff",
  api: "#00ff88",
};

const STATUS_COLOR: Record<string, string> = {
  healthy: "#00ffa3",
  active: "#00d4ff",
  idle: "#444466",
};

function convertAnalysisToGraph(analysis: AnalysisResult): {
  nodes: AnalyzedNode[];
  edges: AnalyzedEdge[];
} {
  const nodes: AnalyzedNode[] = [];
  const nodeMap = new Map<string, AnalyzedNode>();

  // Create nodes from services
  analysis.services.forEach((service, idx) => {
    // Arrange in a circle
    const angle = (idx / analysis.services.length) * Math.PI * 2;
    const radius = 2.5;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = Math.random() * 1.5 - 0.75;

    const node: AnalyzedNode = {
      id: service.id,
      label: service.name,
      x,
      y,
      z,
      type: service.type as any,
      status: "healthy",
      load: Math.random() * 0.8 + 0.2,
    };
    nodes.push(node);
    nodeMap.set(service.id, node);
  });

  // Create nodes from databases
  analysis.databases.forEach((db, idx) => {
    const angle = Math.PI * 2 * (analysis.services.length / (analysis.services.length + analysis.databases.length)) + 
                  (idx / analysis.databases.length) * Math.PI * 2 * 0.3;
    const radius = 3.5;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = -2;

    const node: AnalyzedNode = {
      id: db.id,
      label: db.name,
      x,
      y,
      z,
      type: db.type as any,
      status: "idle",
      load: Math.random() * 0.6 + 0.1,
    };
    nodes.push(node);
    nodeMap.set(db.id, node);
  });

  // Create edges from dependencies
  const edges: AnalyzedEdge[] = analysis.dependencies.map((dep) => ({
    from: dep.from,
    to: dep.to,
    active: Math.random() > 0.3,
    traffic: Math.random() * 0.8 + 0.2,
  }));

  return { nodes, edges };
}

function AnalyzedNodeMesh({ node }: { node: AnalyzedNode }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const baseSize = node.type === "gateway" ? 0.5 : node.type === "database" ? 0.45 : 0.35;
  const color = TYPE_COLOR[node.type] || "#00ffa3";

  useFrame((state) => {
    if (!meshRef.current || !ringRef.current) return;
    const t = state.clock.elapsedTime;

    // Pulsing based on load
    const pulse = 0.1 * node.load;
    meshRef.current.scale.setScalar(baseSize * (1 + Math.sin(t * 2.5 + node.load * 10) * pulse));

    // Rotating ring
    ringRef.current.rotation.z += 0.01;
    ringRef.current.rotation.x = Math.PI / 2;

    // Slight bobbing animation
    const bobbing = Math.sin(t * 1.5 + node.load * 5) * 0.1;
    meshRef.current.position.y = bobbing;
  });

  return (
    <group position={[node.x, node.y, node.z]}>
      {/* Outer rotating ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[baseSize * 1.6, 0.01, 16, 64]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={hovered ? 0.8 : 0.4}
        />
      </mesh>

      {/* Core sphere */}
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.6 + node.load * 0.4}
          roughness={0.3}
          metalness={0.4}
        />
      </mesh>

      {/* Outer glow */}
      <mesh scale={baseSize * 2.2}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.15} />
      </mesh>

      {/* Label */}
      <Html position={[0, baseSize + 0.4, 0]} center distanceFactor={8}>
        <div className="font-mono text-[10px] tracking-widest text-foreground/90 pointer-events-none whitespace-nowrap px-2 py-1 bg-black/50 rounded">
          {node.label}
          <div className="text-[8px] text-bio-cyan/70 mt-1">
            {Math.round(node.load * 100)}% load
          </div>
        </div>
      </Html>
    </group>
  );
}

function AnalyzedEdgeLine({
  edge,
  nodes,
}: {
  edge: AnalyzedEdge;
  nodes: AnalyzedNode[];
}) {
  const lineRef = useRef<THREE.Line>(null);
  const from = nodes.find((n) => n.id === edge.from);
  const to = nodes.find((n) => n.id === edge.to);

  if (!from || !to) return null;

  const points = new THREE.BufferGeometry();
  points.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array([from.x, from.y, from.z, to.x, to.y, to.z]), 3)
  );

  return (
    <>
      <line ref={lineRef} geometry={points}>
        <lineBasicMaterial
          color={edge.active ? "#00ffa3" : "#444466"}
          transparent
          opacity={edge.active ? 0.6 : 0.15}
          linewidth={edge.active ? 2 : 1}
        />
      </line>
      {edge.active && (
        <TrafficFlow
          from={from}
          to={to}
          traffic={edge.traffic}
        />
      )}
    </>
  );
}

function TrafficFlow({
  from,
  to,
  traffic,
}: {
  from: AnalyzedNode;
  to: AnalyzedNode;
  traffic: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const PARTICLE_COUNT = 3;

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;

    groupRef.current.children.forEach((mesh, i) => {
      const progress = ((t * (0.4 + traffic * 0.6) + i / PARTICLE_COUNT) % 1);
      mesh.position.x = THREE.MathUtils.lerp(from.x, to.x, progress);
      mesh.position.y = THREE.MathUtils.lerp(from.y, to.y, progress);
      mesh.position.z = THREE.MathUtils.lerp(from.z, to.z, progress);
      (mesh as any).material.opacity = Math.sin(progress * Math.PI) * 0.8;
    });
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
        <mesh key={i} position={[from.x, from.y, from.z]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshBasicMaterial
            color="#00ffa3"
            transparent
            opacity={0.6}
          />
        </mesh>
      ))}
    </group>
  );
}

function AnalyzedNetworkScene({ nodes, edges }: { nodes: AnalyzedNode[]; edges: AnalyzedEdge[] }) {
  return (
    <>
      <color attach="background" args={["#0a0e27"]} />
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={0.8} />
      <pointLight position={[-10, -10, -10]} intensity={0.4} color="#0088ff" />

      {nodes.map((node) => (
        <AnalyzedNodeMesh key={node.id} node={node} />
      ))}

      {edges.map((edge, idx) => (
        <AnalyzedEdgeLine key={`${edge.from}-${edge.to}-${idx}`} edge={edge} nodes={nodes} />
      ))}

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        autoRotate
        autoRotateSpeed={2}
        enableZoom={true}
        enablePan={true}
      />
    </>
  );
}

interface ArchitectureVisualizerProps {
  analysis: AnalysisResult;
}

export default function ArchitectureVisualizer({ analysis }: ArchitectureVisualizerProps) {
  const { nodes, edges } = useMemo(
    () => convertAnalysisToGraph(analysis),
    [analysis]
  );

  return (
    <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
      <AnalyzedNetworkScene nodes={nodes} edges={edges} />
    </Canvas>
  );
}
