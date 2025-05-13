import type { InfrastructureData, Device, VirtualMachine } from "./types"

// This is a mock implementation that would be replaced with actual API calls to Proxmox
export async function fetchInfrastructureData(
  proxmoxUrl: string,
  username: string,
  password: string,
): Promise<InfrastructureData> {
  // In a real implementation, this would make API calls to Proxmox
  // For now, we'll return mock data

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1500))

  // Check if credentials are provided (simple validation)
  if (!proxmoxUrl || !username || !password) {
    throw new Error("Proxmox API URL, username, and password are required")
  }

  // Mock data
  const racks: Device[] = [
    { id: "rack-1", name: "Rack A1", type: "rack", status: "online", description: "Primary server rack" },
    { id: "rack-2", name: "Rack A2", type: "rack", status: "online", description: "Secondary server rack" },
    { id: "rack-3", name: "Rack B1", type: "rack", status: "online", description: "Storage rack" },
  ]

  const nodes: Device[] = [
    {
      id: "node-1",
      name: "pve-node01",
      type: "node",
      status: "online",
      ipAddress: "192.168.1.10",
      rackId: "rack-1",
      cpuModel: "Intel Xeon E5-2680 v4",
      cpuCores: 28,
      memory: 128 * 1024 * 1024 * 1024, // 128 GB
    },
    {
      id: "node-2",
      name: "pve-node02",
      type: "node",
      status: "online",
      ipAddress: "192.168.1.11",
      rackId: "rack-1",
      cpuModel: "Intel Xeon E5-2680 v4",
      cpuCores: 28,
      memory: 128 * 1024 * 1024 * 1024, // 128 GB
    },
    {
      id: "node-3",
      name: "pve-node03",
      type: "node",
      status: "warning",
      ipAddress: "192.168.1.12",
      rackId: "rack-2",
      cpuModel: "AMD EPYC 7302",
      cpuCores: 32,
      memory: 256 * 1024 * 1024 * 1024, // 256 GB
    },
  ]

  const storage: Device[] = [
    {
      id: "storage-1",
      name: "synology-nas01",
      type: "storage",
      status: "online",
      ipAddress: "192.168.1.20",
      rackId: "rack-3",
      storageType: "NAS",
      storageCapacity: 48 * 1024 * 1024 * 1024 * 1024, // 48 TB
    },
    {
      id: "storage-2",
      name: "ceph-cluster",
      type: "storage",
      status: "online",
      rackId: "rack-2",
      storageType: "Ceph",
      storageCapacity: 120 * 1024 * 1024 * 1024 * 1024, // 120 TB
    },
  ]

  const network: Device[] = [
    {
      id: "network-1",
      name: "core-switch-01",
      type: "network",
      status: "online",
      ipAddress: "192.168.1.254",
      rackId: "rack-1",
      networkPorts: 48,
      networkSpeed: "10 Gbps",
    },
    {
      id: "network-2",
      name: "storage-switch-01",
      type: "network",
      status: "online",
      ipAddress: "192.168.2.254",
      rackId: "rack-3",
      networkPorts: 24,
      networkSpeed: "25 Gbps",
    },
  ]

  const ups: Device[] = [
    {
      id: "ups-1",
      name: "apc-ups-01",
      type: "ups",
      status: "online",
      ipAddress: "192.168.1.30",
      rackId: "rack-1",
      description: "APC Smart-UPS 3000VA",
    },
  ]

  // Generate some VMs for each node
  const vms: VirtualMachine[] = []

  const vmNames = [
    "web-server",
    "db-server",
    "app-server",
    "cache-server",
    "monitoring",
    "backup",
    "mail-server",
    "proxy",
    "dns",
    "ldap",
  ]

  const osList = [
    "Ubuntu 22.04",
    "Debian 11",
    "CentOS 8",
    "Rocky Linux 8",
    "Windows Server 2022",
    "Fedora 36",
    "Alpine Linux 3.16",
  ]

  nodes.forEach((node) => {
    // Generate 5-10 VMs per node
    const vmCount = 5 + Math.floor(Math.random() * 6)

    for (let i = 0; i < vmCount; i++) {
      const vmId = `vm-${vms.length + 100}`
      const nameBase = vmNames[Math.floor(Math.random() * vmNames.length)]
      const name = `${nameBase}-${Math.floor(Math.random() * 10)}`
      const os = osList[Math.floor(Math.random() * osList.length)]
      const status = Math.random() > 0.2 ? "running" : Math.random() > 0.5 ? "stopped" : "paused"
      const ipLastOctet = 100 + vms.length

      vms.push({
        id: vmId,
        name,
        status: status as "running" | "stopped" | "paused",
        os,
        ipAddress: `192.168.1.${ipLastOctet}`,
        cpuCores: 1 + Math.floor(Math.random() * 8),
        memory: [2, 4, 8, 16, 32][Math.floor(Math.random() * 5)] * 1024,
        disk: [10, 20, 50, 100, 200][Math.floor(Math.random() * 5)],
        nodeId: node.id,
      })
    }
  })

  return {
    nodes,
    racks,
    storage,
    network,
    ups,
    vms,
  }
}

// In a real implementation, you would have additional functions for:
// - fetchNodeDetails
// - fetchVirtualMachines
// - fetchStorageDetails
// - etc.
