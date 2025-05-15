export type DeviceType = "node" | "storage" | "network" | "ups" | "rack" | "vm"
export type DeviceStatus = "online" | "offline" | "warning" | "error"

export interface Device {
  id: string
  name: string
  type: DeviceType
  status: DeviceStatus
  ipAddress?: string
  description?: string
  rackId?: string

  // Node specific properties
  cpuModel?: string
  cpuCores?: number
  memory?: number // in bytes

  // Storage specific properties
  storageType?: string
  storageCapacity?: number // in bytes

  // Network specific properties
  networkPorts?: number
  networkSpeed?: string
}

export interface VirtualMachine {
  id: string
  name: string
  status: "running" | "stopped" | "paused"
  os: string
  ipAddress: string
  cpuCores: number
  memory: number // in MB
  disk: number // in GB
  nodeId: string
}

export interface InfrastructureData {
  nodes: Device[]
  racks: Device[]
  storage: Device[]
  network: Device[]
  ups: Device[]
  vms: VirtualMachine[]
}

// Nuevos tipos para la gestión de racks y dispositivos
export interface RackEditorState {
  isEditing: boolean
  selectedRackId: string | null
  isCreatingRack: boolean
  isDraggingDevice: boolean
  draggedDeviceId: string | null
  targetRackId: string | null
}

export interface EditableInfrastructureData extends InfrastructureData {
  // Métodos para modificar la infraestructura
  updateRackName: (rackId: string, newName: string) => void
  createRack: (name: string) => string // Devuelve el ID del nuevo rack
  moveDeviceToRack: (deviceId: string, targetRackId: string) => void
  deleteRack: (rackId: string) => void
}
