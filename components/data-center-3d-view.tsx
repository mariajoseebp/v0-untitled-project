"use client"

import { useState, Suspense } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Environment, Text, Html } from "@react-three/drei"
import type { InfrastructureData, Device, DeviceType } from "@/lib/types"
import { Badge } from "@/components/ui/badge"

interface DataCenter3DViewProps {
  infrastructureData: InfrastructureData
  onDeviceSelect: (device: Device) => void
}

export default function DataCenter3DView({ infrastructureData, onDeviceSelect }: DataCenter3DViewProps) {
  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [0, 10, 15], fov: 50 }}>
        <color attach="background" args={["#f8fafc"]} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <Suspense fallback={null}>
          <Environment preset="city" />
          <DataCenterModel infrastructureData={infrastructureData} onDeviceSelect={onDeviceSelect} />
          <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} minDistance={5} maxDistance={30} />
        </Suspense>
      </Canvas>
    </div>
  )
}

function DataCenterModel({ infrastructureData, onDeviceSelect }: DataCenter3DViewProps) {
  const [hoveredDevice, setHoveredDevice] = useState<Device | null>(null)
  const { nodes, racks, vms } = infrastructureData

  // Calculate layout
  const rackWidth = 1
  const rackDepth = 2
  const rackHeight = 4
  const rackSpacing = 1.5

  return (
    <group position={[0, 0, 0]}>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#e2e8f0" />
      </mesh>

      {/* Racks */}
      {racks.map((rack, index) => {
        const row = Math.floor(index / 5)
        const col = index % 5
        const x = (col - 2) * (rackWidth + rackSpacing)
        const z = (row - 1) * (rackDepth + rackSpacing)

        return (
          <group key={rack.id} position={[x, rackHeight / 2, z]}>
            <RackModel
              rack={rack}
              nodes={nodes.filter((node) => node.rackId === rack.id)}
              onHover={setHoveredDevice}
              onSelect={onDeviceSelect}
            />
            <Text
              position={[0, rackHeight / 2 + 0.3, 0]}
              fontSize={0.2}
              color="white"
              anchorX="center"
              anchorY="bottom"
            >
              {rack.name}
            </Text>
          </group>
        )
      })}

      {/* Hover info */}
      {hoveredDevice && (
        <Html position={[0, 5, 0]} center>
          <div className="bg-white p-2 rounded shadow-lg text-gray-900 text-sm w-48">
            <h3 className="font-bold">{hoveredDevice.name}</h3>
            <p className="text-xs text-gray-500">{getDeviceTypeLabel(hoveredDevice.type)}</p>
            {hoveredDevice.type === "node" && (
              <Badge className="mt-1 bg-blue-600">
                {vms.filter((vm) => vm.nodeId === hoveredDevice.id).length} VMs
              </Badge>
            )}
          </div>
        </Html>
      )}
    </group>
  )
}

function RackModel({
  rack,
  nodes,
  onHover,
  onSelect,
}: {
  rack: Device
  nodes: Device[]
  onHover: (device: Device | null) => void
  onSelect: (device: Device) => void
}) {
  const rackWidth = 1
  const rackDepth = 2
  const rackHeight = 4

  return (
    <group>
      {/* Rack frame */}
      <mesh
        castShadow
        onPointerOver={() => onHover(rack)}
        onPointerOut={() => onHover(null)}
        onClick={() => onSelect(rack)}
      >
        <boxGeometry args={[rackWidth, rackHeight, rackDepth]} />
        <meshStandardMaterial color="#94a3b8" wireframe />
      </mesh>

      {/* Nodes inside rack */}
      {nodes.map((node, index) => {
        const nodeHeight = 0.3
        const y = -rackHeight / 2 + nodeHeight / 2 + index * (nodeHeight + 0.1)

        return (
          <mesh
            key={node.id}
            position={[0, y, 0]}
            castShadow
            onPointerOver={() => onHover(node)}
            onPointerOut={() => onHover(null)}
            onClick={() => onSelect(node)}
          >
            <boxGeometry args={[rackWidth - 0.1, nodeHeight, rackDepth - 0.1]} />
            <meshStandardMaterial color={getDeviceColor(node.type)} metalness={0.8} roughness={0.2} />
          </mesh>
        )
      })}
    </group>
  )
}

function getDeviceColor(type: DeviceType): string {
  switch (type) {
    case "node":
      return "#3b82f6"
    case "storage":
      return "#10b981"
    case "network":
      return "#f59e0b"
    case "ups":
      return "#ef4444"
    default:
      return "#6b7280"
  }
}

function getDeviceTypeLabel(type: DeviceType): string {
  switch (type) {
    case "node":
      return "Proxmox Node"
    case "storage":
      return "Storage Device"
    case "network":
      return "Network Switch"
    case "ups":
      return "UPS / Power"
    case "rack":
      return "Server Rack"
    case "vm":
      return "Virtual Machine"
    default:
      return "Unknown Device"
  }
}
