import type { InfrastructureData, Device, VirtualMachine } from "./types"

// Función para guardar el token de autenticación
export function saveAuthToken(ticket: string, csrfToken: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("proxmox_ticket", ticket)
    localStorage.setItem("proxmox_csrf", csrfToken)
    localStorage.setItem("proxmox_auth_time", Date.now().toString())
  }
}

// Función para obtener el token de autenticación guardado
export function getAuthToken() {
  if (typeof window !== "undefined") {
    const ticket = localStorage.getItem("proxmox_ticket")
    const csrfToken = localStorage.getItem("proxmox_csrf")
    const authTime = localStorage.getItem("proxmox_auth_time")

    // Verificar si el token ha expirado (2 horas)
    if (ticket && csrfToken && authTime) {
      const expiryTime = Number.parseInt(authTime) + 2 * 60 * 60 * 1000 // 2 horas en milisegundos
      if (Date.now() < expiryTime) {
        return { ticket, csrfToken }
      }
    }
  }
  return null
}

// Función para guardar la configuración de conexión
export function saveConnectionConfig(url: string, username: string, useMockData: boolean) {
  if (typeof window !== "undefined") {
    localStorage.setItem("proxmox_url", url)
    localStorage.setItem("proxmox_username", username)
    localStorage.setItem("proxmox_use_mock", useMockData.toString())
  }
}

// Función para obtener la configuración de conexión guardada
export function getConnectionConfig() {
  if (typeof window !== "undefined") {
    const url = localStorage.getItem("proxmox_url")
    const username = localStorage.getItem("proxmox_username")
    const useMockData = localStorage.getItem("proxmox_use_mock") === "true"

    if (url && username) {
      return { url, username, useMockData }
    }
  }
  return null
}

// Función para limpiar los datos de autenticación
export function clearAuthData() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("proxmox_ticket")
    localStorage.removeItem("proxmox_csrf")
    localStorage.removeItem("proxmox_auth_time")
    localStorage.removeItem("proxmox_url")
    localStorage.removeItem("proxmox_username")
    localStorage.removeItem("proxmox_use_mock")
  }
}

// Función para autenticar con Proxmox
export async function authenticateWithProxmox(
  proxmoxUrl: string,
  username: string,
  password: string,
): Promise<{ ticket: string; csrfToken: string }> {
  try {
    // Intentar autenticar directamente con la API de Proxmox
    const response = await fetch(`${proxmoxUrl}/access/ticket`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        username,
        password,
      }),
    })

    if (!response.ok) {
      throw new Error(`Autenticación fallida: ${response.statusText}`)
    }

    const data = await response.json()

    if (!data.data || !data.data.ticket || !data.data.CSRFPreventionToken) {
      throw new Error("Respuesta de autenticación inválida")
    }

    return {
      ticket: data.data.ticket,
      csrfToken: data.data.CSRFPreventionToken,
    }
  } catch (error) {
    console.error("Error de autenticación:", error)
    throw error
  }
}

// Función principal para obtener datos de infraestructura
export async function fetchInfrastructureData(
  proxmoxUrl: string,
  username: string,
  password: string | null,
  useMockData = false,
): Promise<InfrastructureData> {
  // Si se solicitan datos simulados, devolver datos de prueba
  if (useMockData) {
    console.log("Usando datos simulados para visualización de infraestructura")
    return getMockInfrastructureData()
  }

  try {
    // Obtener o renovar el token de autenticación
    let authToken = getAuthToken()

    if (!authToken && !password) {
      throw new Error("Se requiere contraseña para la autenticación inicial")
    }

    if (!authToken && password) {
      const auth = await authenticateWithProxmox(proxmoxUrl, username, password)
      authToken = auth
      saveAuthToken(auth.ticket, auth.csrfToken)
      saveConnectionConfig(proxmoxUrl, username, useMockData)
    }

    if (!authToken) {
      throw new Error("No se pudo obtener token de autenticación")
    }

    // Obtener lista de nodos
    const nodesResponse = await fetch(`${proxmoxUrl}/nodes`, {
      headers: {
        Authorization: `PVEAuthCookie=${authToken.ticket}`,
      },
    })

    if (!nodesResponse.ok) {
      if (nodesResponse.status === 401 || nodesResponse.status === 403) {
        // Token expirado, limpiar datos de autenticación
        clearAuthData()
        throw new Error("Sesión expirada. Por favor, inicie sesión nuevamente.")
      }
      throw new Error(`Error al obtener nodos: ${nodesResponse.statusText}`)
    }

    const nodesData = await nodesResponse.json()

    if (!nodesData.data) {
      throw new Error("Formato de respuesta de nodos inválido")
    }

    // Procesar datos de nodos
    const nodes: Device[] = await Promise.all(
      nodesData.data.map(async (node: any) => {
        // Obtener detalles adicionales del nodo
        let cpuModel = "Desconocido"
        let cpuCores = 0
        let memory = 0

        try {
          const statusResponse = await fetch(`${proxmoxUrl}/nodes/${node.node}/status`, {
            headers: {
              Authorization: `PVEAuthCookie=${authToken!.ticket}`,
            },
          })

          if (statusResponse.ok) {
            const statusData = await statusResponse.json()
            if (statusData.data) {
              cpuModel = statusData.data.cpuinfo?.model || "Desconocido"
              cpuCores = statusData.data.cpuinfo?.cpus || 0
              memory = statusData.data.memory?.total || 0
            }
          }
        } catch (error) {
          console.warn(`No se pudieron obtener detalles para el nodo ${node.node}:`, error)
        }

        return {
          id: `node-${node.node}`,
          name: node.node,
          type: "node",
          status: node.status === "online" ? "online" : "offline",
          ipAddress: node.ip || "Desconocido",
          cpuModel,
          cpuCores,
          memory,
          rackId: "rack-1", // Asignación de rack predeterminada
          description: `Nodo Proxmox ${node.node}`,
        }
      }),
    )

    // Obtener VMs para cada nodo
    const vms: VirtualMachine[] = []
    for (const node of nodes) {
      const nodeId = node.name.replace("node-", "") // Proxmox usa el nombre del nodo como ID

      try {
        const vmsResponse = await fetch(`${proxmoxUrl}/nodes/${nodeId}/qemu`, {
          headers: {
            Authorization: `PVEAuthCookie=${authToken.ticket}`,
          },
        })

        if (vmsResponse.ok) {
          const vmsData = await vmsResponse.json()

          if (vmsData.data) {
            // Procesar datos de VMs
            const nodeVms = await Promise.all(
              vmsData.data.map(async (vm: any) => {
                let os = "Desconocido"
                let ipAddress = "Desconocido"
                let disk = 0

                // Intentar obtener detalles adicionales de la VM
                try {
                  const vmConfigResponse = await fetch(`${proxmoxUrl}/nodes/${nodeId}/qemu/${vm.vmid}/config`, {
                    headers: {
                      Authorization: `PVEAuthCookie=${authToken!.ticket}`,
                    },
                  })

                  if (vmConfigResponse.ok) {
                    const vmConfigData = await vmConfigResponse.json()
                    if (vmConfigData.data) {
                      // Intentar determinar el sistema operativo basado en la configuración
                      if (vmConfigData.data.ostype) {
                        switch (vmConfigData.data.ostype) {
                          case "win10":
                            os = "Windows 10"
                            break
                          case "win11":
                            os = "Windows 11"
                            break
                          case "win8":
                            os = "Windows 8"
                            break
                          case "win7":
                            os = "Windows 7"
                            break
                          case "l26":
                            os = "Linux 2.6/3.x/4.x/5.x"
                            break
                          case "debian":
                            os = "Debian Linux"
                            break
                          case "ubuntu":
                            os = "Ubuntu Linux"
                            break
                          case "centos":
                            os = "CentOS Linux"
                            break
                          default:
                            os = vmConfigData.data.ostype || "Desconocido"
                        }
                      }

                      // Calcular espacio en disco total
                      const diskKeys = Object.keys(vmConfigData.data).filter(
                        (key) => key.startsWith("scsi") || key.startsWith("ide") || key.startsWith("sata"),
                      )
                      for (const key of diskKeys) {
                        const diskValue = vmConfigData.data[key]
                        if (typeof diskValue === "string" && diskValue.includes("size=")) {
                          const sizeMatch = diskValue.match(/size=(\d+)([GMK])/)
                          if (sizeMatch) {
                            let size = Number.parseInt(sizeMatch[1])
                            const unit = sizeMatch[2]

                            // Convertir a GB
                            if (unit === "K") size = size / (1024 * 1024)
                            else if (unit === "M") size = size / 1024

                            disk += size
                          }
                        }
                      }
                    }
                  }
                } catch (error) {
                  console.warn(`No se pudieron obtener detalles para la VM ${vm.vmid}:`, error)
                }

                // Intentar obtener la dirección IP si la VM está en ejecución
                if (vm.status === "running") {
                  try {
                    const vmAgentResponse = await fetch(
                      `${proxmoxUrl}/nodes/${nodeId}/qemu/${vm.vmid}/agent/network-get-interfaces`,
                      {
                        headers: {
                          Authorization: `PVEAuthCookie=${authToken!.ticket}`,
                        },
                      },
                    )

                    if (vmAgentResponse.ok) {
                      const vmAgentData = await vmAgentResponse.json()
                      if (vmAgentData.data && vmAgentData.data.result) {
                        // Buscar la primera interfaz con una dirección IPv4
                        for (const iface of vmAgentData.data.result) {
                          if (iface["ip-addresses"]) {
                            const ipv4 = iface["ip-addresses"].find((ip: any) => ip["ip-address-type"] === "ipv4")
                            if (ipv4) {
                              ipAddress = ipv4["ip-address"]
                              break
                            }
                          }
                        }
                      }
                    }
                  } catch (error) {
                    console.warn(`No se pudo obtener la dirección IP para la VM ${vm.vmid}:`, error)
                  }
                }

                return {
                  id: `vm-${vm.vmid}`,
                  name: vm.name || `VM ${vm.vmid}`,
                  status: vm.status,
                  os,
                  ipAddress,
                  cpuCores: vm.cpus || 1,
                  memory: vm.maxmem / (1024 * 1024), // Convertir a MB
                  disk,
                  nodeId: node.id,
                }
              }),
            )

            vms.push(...nodeVms)
          }
        }
      } catch (error) {
        console.warn(`Error al obtener VMs para el nodo ${nodeId}:`, error)
      }
    }

    // Crear dispositivos adicionales (en una implementación real, esto vendría de SNMP, IPMI, etc.)
    const racks: Device[] = [
      { id: "rack-1", name: "Rack A1", type: "rack", status: "online", description: "Rack principal de servidores" },
      { id: "rack-2", name: "Rack A2", type: "rack", status: "online", description: "Rack secundario de servidores" },
    ]

    const storage: Device[] = [
      {
        id: "storage-1",
        name: "synology-nas01",
        type: "storage",
        status: "online",
        ipAddress: "192.168.1.20",
        rackId: "rack-1",
        storageType: "NAS",
        storageCapacity: 48 * 1024 * 1024 * 1024 * 1024, // 48 TB
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

    return {
      nodes,
      racks,
      storage,
      network,
      ups,
      vms,
    }
  } catch (error) {
    console.error("Error al obtener datos de infraestructura:", error)

    if (error instanceof Error) {
      if (error.message.includes("Failed to fetch")) {
        throw new Error(
          "No se puede conectar a la API de Proxmox. Esto puede deberse a restricciones CORS o problemas de conectividad de red. Considere usar datos simulados para la vista previa.",
        )
      }
      throw error
    }
    throw new Error("Error desconocido al obtener datos de infraestructura")
  }
}

// Función para obtener datos simulados
function getMockInfrastructureData(): InfrastructureData {
  // Crear nodos simulados
  const nodes: Device[] = [
    {
      id: "node-pve1",
      name: "pve1",
      type: "node",
      status: "online",
      ipAddress: "192.168.1.101",
      cpuModel: "Intel Xeon E5-2680 v4",
      cpuCores: 14,
      memory: 128 * 1024 * 1024 * 1024, // 128 GB
      rackId: "rack-1",
      description: "Nodo Proxmox principal",
    },
    {
      id: "node-pve2",
      name: "pve2",
      type: "node",
      status: "online",
      ipAddress: "192.168.1.102",
      cpuModel: "AMD EPYC 7302",
      cpuCores: 16,
      memory: 256 * 1024 * 1024 * 1024, // 256 GB
      rackId: "rack-1",
      description: "Nodo Proxmox secundario",
    },
    {
      id: "node-pve3",
      name: "pve3",
      type: "node",
      status: "warning",
      ipAddress: "192.168.1.103",
      cpuModel: "Intel Xeon E5-2680 v4",
      cpuCores: 14,
      memory: 128 * 1024 * 1024 * 1024, // 128 GB
      rackId: "rack-2",
      description: "Nodo Proxmox terciario",
    },
  ]

  // Crear racks simulados
  const racks: Device[] = [
    { id: "rack-1", name: "Rack A1", type: "rack", status: "online", description: "Rack principal de servidores" },
    { id: "rack-2", name: "Rack A2", type: "rack", status: "online", description: "Rack secundario de servidores" },
  ]

  // Crear dispositivos de almacenamiento simulados
  const storage: Device[] = [
    {
      id: "storage-1",
      name: "synology-nas01",
      type: "storage",
      status: "online",
      ipAddress: "192.168.1.20",
      rackId: "rack-1",
      storageType: "NAS",
      storageCapacity: 48 * 1024 * 1024 * 1024 * 1024, // 48 TB
    },
    {
      id: "storage-2",
      name: "ceph-cluster",
      type: "storage",
      status: "online",
      ipAddress: "192.168.1.21",
      rackId: "rack-2",
      storageType: "Ceph",
      storageCapacity: 120 * 1024 * 1024 * 1024 * 1024, // 120 TB
    },
  ]

  // Crear dispositivos de red simulados
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
      name: "access-switch-01",
      type: "network",
      status: "online",
      ipAddress: "192.168.1.253",
      rackId: "rack-2",
      networkPorts: 24,
      networkSpeed: "1 Gbps",
    },
  ]

  // Crear dispositivos UPS simulados
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

  // Crear VMs simuladas
  const vms: VirtualMachine[] = [
    {
      id: "vm-101",
      name: "web-server-1",
      status: "running",
      os: "Ubuntu 22.04",
      ipAddress: "192.168.1.101",
      cpuCores: 4,
      memory: 8192,
      disk: 50,
      nodeId: "node-pve1",
    },
    {
      id: "vm-102",
      name: "db-server-1",
      status: "running",
      os: "CentOS 8",
      ipAddress: "192.168.1.102",
      cpuCores: 8,
      memory: 16384,
      disk: 200,
      nodeId: "node-pve1",
    },
    {
      id: "vm-103",
      name: "cache-server",
      status: "stopped",
      os: "Debian 11",
      ipAddress: "192.168.1.103",
      cpuCores: 2,
      memory: 4096,
      disk: 20,
      nodeId: "node-pve2",
    },
    {
      id: "vm-104",
      name: "monitoring",
      status: "running",
      os: "Ubuntu 22.04",
      ipAddress: "192.168.1.104",
      cpuCores: 2,
      memory: 4096,
      disk: 40,
      nodeId: "node-pve2",
    },
    {
      id: "vm-105",
      name: "backup-server",
      status: "paused",
      os: "Debian 11",
      ipAddress: "192.168.1.105",
      cpuCores: 2,
      memory: 8192,
      disk: 500,
      nodeId: "node-pve3",
    },
  ]

  return {
    nodes,
    racks,
    storage,
    network,
    ups,
    vms,
  }
}
