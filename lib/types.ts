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
