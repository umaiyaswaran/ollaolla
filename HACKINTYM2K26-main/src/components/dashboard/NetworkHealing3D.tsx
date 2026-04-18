import React, { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import type { NetworkNode, NetworkConnection, NetworkMetrics } from "@/services/networkHealing";

interface NetworkGraph3DProps {
  nodes: NetworkNode[];
  connections: NetworkConnection[];
  metrics: NetworkMetrics;
}

/**
 * 3D Network Node (Three.js Mesh)
 */
function NetworkNodeMesh({
  node,
  isHovered,
  onHover,
}: {
  node: NetworkNode;
  isHovered: boolean;
  onHover: (id: string | null) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Determine color based on node health
  const getNodeColor = () => {
    if (!node.isHealthy) return 0xff4444; // Red - failed
    if (node.isOverloaded) return 0xffaa00; // Orange - overloaded
    if (node.cpu > 70 || node.memory > 70) return 0xffff00; // Yellow - high load
    return 0x44ff44; // Green - healthy
  };

  // Determine size based on node type
  const getNodeSize = () => {
    switch (node.type) {
      case "core":
        return 8;
      case "edge":
        return 6;
      case "service":
        return 4;
      case "client":
        return 2;
      default:
        return 3;
    }
  };

  useFrame(() => {
    if (meshRef.current) {
      // Pulse based on CPU usage
      const scale = 1 + (node.cpu / 100) * 0.5 + (isHovered ? 1 : 0);
      meshRef.current.scale.set(scale, scale, scale);

      // Rotation for visual feedback
      meshRef.current.rotation.x += 0.005;
      meshRef.current.rotation.y += 0.005;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={[node.position.x, node.position.y, node.position.z]}
      onPointerEnter={() => {
        setHovered(true);
        onHover(node.id);
      }}
      onPointerLeave={() => {
        setHovered(false);
        onHover(null);
      }}
    >
      <sphereGeometry args={[getNodeSize(), 32, 32]} />
      <meshStandardMaterial
        color={getNodeColor()}
        emissive={hovered ? 0xffffff : 0x000000}
        emissiveIntensity={hovered ? 0.5 : 0}
        wireframe={false}
      />
      {/* Wireframe overlay for failed nodes */}
      {!node.isHealthy && (
        <wireframeGeometry attach="geometry">
          <sphereGeometry args={[getNodeSize() + 1, 32, 32]} />
        </wireframeGeometry>
      )}
    </mesh>
  );
}

/**
 * Connection Line between nodes
 */
function ConnectionLine({
  fromNode,
  toNode,
  connection,
}: {
  fromNode: NetworkNode;
  toNode: NetworkNode;
  connection: NetworkConnection;
}) {
  const lineRef = useRef<THREE.Line>(null);

  useFrame(() => {
    if (lineRef.current) {
      // Pulse based on utilization
      const opacity = 0.3 + (connection.utilization / 100) * 0.7;
      (lineRef.current.material as THREE.LineBasicMaterial).opacity = opacity;
      (lineRef.current.material as THREE.LineBasicMaterial).linewidth = 
        Math.max(1, (connection.utilization / 100) * 5);
    }
  });

  // Line color based on connection status
  const getLineColor = () => {
    if (!connection.isActive) return 0xff0000; // Red - failed
    if (connection.utilization > 80) return 0xff6600; // Orange - high utilization
    if (connection.isRerouted) return 0x00ffff; // Cyan - rerouted
    return 0x00ff00; // Green - normal
  };

  const points = [
    new THREE.Vector3(fromNode.position.x, fromNode.position.y, fromNode.position.z),
    new THREE.Vector3(toNode.position.x, toNode.position.y, toNode.position.z),
  ];

  return (
    <line ref={lineRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length}
          array={new Float32Array(points.flatMap((p) => [p.x, p.y, p.z]))}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color={getLineColor()} linewidth={2} opacity={0.6} transparent />
    </line>
  );
}

/**
 * Main Network Graph 3D Component
 */
function NetworkGraph3DContent({
  nodes,
  connections,
}: {
  nodes: NetworkNode[];
  connections: NetworkConnection[];
}) {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const { camera } = useThree();

  useFrame(() => {
    // Auto-rotate camera
    if (camera) {
      camera.position.x = Math.cos(Date.now() * 0.0001) * 300;
      camera.position.z = Math.sin(Date.now() * 0.0001) * 300;
      camera.lookAt(0, 0, 0);
    }
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 100, 300]} />
      <OrbitControls />
      <ambientLight intensity={0.6} />
      <pointLight position={[100, 100, 100]} intensity={1} />

      {/* Render connections */}
      {connections.map((conn) => {
        const fromNode = nodes.find((n) => n.id === conn.fromNode);
        const toNode = nodes.find((n) => n.id === conn.toNode);
        if (!fromNode || !toNode) return null;

        return (
          <ConnectionLine
            key={conn.id}
            fromNode={fromNode}
            toNode={toNode}
            connection={conn}
          />
        );
      })}

      {/* Render nodes */}
      {nodes.map((node) => (
        <NetworkNodeMesh
          key={node.id}
          node={node}
          isHovered={hoveredNodeId === node.id}
          onHover={setHoveredNodeId}
        />
      ))}

      {/* Render grid background */}
      <gridHelper args={[1000, 50]} position={[0, -100, 0]} />
    </>
  );
}

/**
 * Wrapper Component
 */
export default function NetworkGraph3D({ nodes, connections, metrics }: NetworkGraph3DProps) {
  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-950 to-slate-900 rounded-lg overflow-hidden border border-cyan-500/20">
      <Canvas>
        <NetworkGraph3DContent nodes={nodes} connections={connections} />
      </Canvas>
      
      {/* Overlay stats */}
      <div className="absolute top-4 left-4 bg-black/70 p-3 rounded border border-cyan-500/30 text-xs font-mono text-cyan-300 pointer-events-none">
        <div>Nodes: {metrics.activeNodes}/{metrics.totalNodes}</div>
        <div>Connections: {metrics.activeConnections}/{metrics.totalConnections}</div>
        <div>Latency: {metrics.averageLatency.toFixed(1)}ms</div>
        <div>Health: {metrics.systemHealth}%</div>
      </div>
    </div>
  );
}
