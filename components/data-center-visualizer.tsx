"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RefreshCw, Server, LogOut, Settings } from "lucide-react"
import DataCenter3DView from "@/components/data-center-3d-view"
import DataCenter2DView from "@/components/data-center-2d-view"
import DeviceDetails from "@/components/device-details"
import RackManager from "@/components/rack-manager"
import { fetchInfrastructureData, getAuthToken, getConnectionConfig, clearAuthData } from "@/lib/api"
import { saveInfrastructureToLocalStorage, loadInfrastructureFromLocalStorage } from "@/lib/utils"
import type { InfrastructureData, Device } from "@/lib/types"

export default function DataCenterVisualizer() {
  const [proxmoxUrl, setProxmoxUrl] = useState("")
  const [proxmoxUser, setProxmoxUser] = useState("")
  const [proxmoxPassword, setProxmoxPassword] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [infrastructureData, setInfrastructureData] = useState<InfrastructureData | null>(null)
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [viewMode, setViewMode] = useState<"2d" | "3d" | "manage">("3d")
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState(30) // segundos
  const [useMockData, setUseMockData] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)

  // Efecto para cargar la sesión guardada al iniciar
  useEffect(() => {
    const initializeSession = async () => {
      try {
        // Verificar si hay una sesión guardada
        const authToken = getAuthToken()
        const connectionConfig = getConnectionConfig()
        const savedInfrastructure = loadInfrastructureFromLocalStorage()

        if (authToken && connectionConfig) {
          setProxmoxUrl(connectionConfig.url)
          setProxmoxUser(connectionConfig.username)
          setUseMockData(connectionConfig.useMockData)

          // Si hay datos guardados, usarlos primero
          if (savedInfrastructure) {
            setInfrastructureData(savedInfrastructure)
            setIsConnected(true)
          }

          // Intentar cargar los datos frescos con la sesión guardada
          setIsLoading(true)
          try {
            const data = await fetchInfrastructureData(
              connectionConfig.url,
              connectionConfig.username,
              null, // No necesitamos contraseña si tenemos token
              connectionConfig.useMockData,
            )

            // Preservar los cambios locales en racks
            if (savedInfrastructure) {
              data.racks = savedInfrastructure.racks

              // Actualizar las referencias de rackId en los dispositivos
              data.nodes = data.nodes.map((node) => {
                const savedNode = savedInfrastructure.nodes.find((n) => n.id === node.id)
                return savedNode ? { ...node, rackId: savedNode.rackId } : node
              })

              data.storage = data.storage.map((storage) => {
                const savedStorage = savedInfrastructure.storage.find((s) => s.id === storage.id)
                return savedStorage ? { ...storage, rackId: savedStorage.rackId } : storage
              })

              data.network = data.network.map((network) => {
                const savedNetwork = savedInfrastructure.network.find((n) => n.id === network.id)
                return savedNetwork ? { ...network, rackId: savedNetwork.rackId } : network
              })

              data.ups = data.ups.map((ups) => {
                const savedUps = savedInfrastructure.ups.find((u) => u.id === ups.id)
                return savedUps ? { ...ups, rackId: savedUps.rackId } : ups
              })
            }

            setInfrastructureData(data)
            saveInfrastructureToLocalStorage(data)
            setIsConnected(true)
          } catch (error) {
            console.warn("Error al cargar datos frescos, usando datos guardados:", error)
            // Si hay un error pero tenemos datos guardados, seguimos conectados
            if (savedInfrastructure) {
              setIsConnected(true)
            } else {
              throw error
            }
          }
        } else if (savedInfrastructure) {
          // Si no hay sesión pero hay datos guardados, mostrarlos
          setInfrastructureData(savedInfrastructure)
          setIsConnected(true)
          setUseMockData(true)
        }
      } catch (err) {
        console.error("Error al restaurar la sesión:", err)
        // Si hay un error, limpiar los datos de autenticación
        clearAuthData()
      } finally {
        setIsLoading(false)
        setIsInitializing(false)
      }
    }

    initializeSession()
  }, [])

  // Efecto para el refresco automático
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isConnected && autoRefresh) {
      interval = setInterval(() => {
        refreshData()
      }, refreshInterval * 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isConnected, autoRefresh, refreshInterval])

  // Función para conectar a Proxmox
  const connectToProxmox = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await fetchInfrastructureData(proxmoxUrl, proxmoxUser, proxmoxPassword, useMockData)

      // Si hay datos guardados, preservar los racks y asignaciones
      const savedInfrastructure = loadInfrastructureFromLocalStorage()
      if (savedInfrastructure) {
        data.racks = savedInfrastructure.racks

        // Actualizar las referencias de rackId en los dispositivos
        data.nodes = data.nodes.map((node) => {
          const savedNode = savedInfrastructure.nodes.find((n) => n.id === node.id)
          return savedNode ? { ...node, rackId: savedNode.rackId } : node
        })

        data.storage = data.storage.map((storage) => {
          const savedStorage = savedInfrastructure.storage.find((s) => s.id === storage.id)
          return savedStorage ? { ...storage, rackId: savedStorage.rackId } : storage
        })

        data.network = data.network.map((network) => {
          const savedNetwork = savedInfrastructure.network.find((n) => n.id === network.id)
          return savedNetwork ? { ...network, rackId: savedNetwork.rackId } : network
        })

        data.ups = data.ups.map((ups) => {
          const savedUps = savedInfrastructure.ups.find((u) => u.id === ups.id)
          return savedUps ? { ...ups, rackId: savedUps.rackId } : ups
        })
      }

      setInfrastructureData(data)
      saveInfrastructureToLocalStorage(data)
      setIsConnected(true)
      // Limpiar la contraseña después de una conexión exitosa
      setProxmoxPassword("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al conectar con Proxmox")
    } finally {
      setIsLoading(false)
    }
  }

  // Función para refrescar los datos
  const refreshData = async () => {
    if (!isConnected) return

    setIsLoading(true)
    try {
      const data = await fetchInfrastructureData(
        proxmoxUrl,
        proxmoxUser,
        null, // No necesitamos contraseña para refrescar
        useMockData,
      )

      // Preservar los racks y asignaciones
      if (infrastructureData) {
        data.racks = infrastructureData.racks

        // Actualizar las referencias de rackId en los dispositivos
        data.nodes = data.nodes.map((node) => {
          const existingNode = infrastructureData.nodes.find((n) => n.id === node.id)
          return existingNode ? { ...node, rackId: existingNode.rackId } : node
        })

        data.storage = data.storage.map((storage) => {
          const existingStorage = infrastructureData.storage.find((s) => s.id === storage.id)
          return existingStorage ? { ...storage, rackId: existingStorage.rackId } : storage
        })

        data.network = data.network.map((network) => {
          const existingNetwork = infrastructureData.network.find((n) => n.id === network.id)
          return existingNetwork ? { ...network, rackId: existingNetwork.rackId } : network
        })

        data.ups = data.ups.map((ups) => {
          const existingUps = infrastructureData.ups.find((u) => u.id === ups.id)
          return existingUps ? { ...ups, rackId: existingUps.rackId } : ups
        })
      }

      setInfrastructureData(data)
      saveInfrastructureToLocalStorage(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al refrescar los datos"
      setError(errorMessage)

      // Si el error es de autenticación, desconectar
      if (errorMessage.includes("Sesión expirada") || errorMessage.includes("autenticación")) {
        handleLogout()
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Función para manejar la selección de dispositivos
  const handleDeviceSelect = (device: Device) => {
    setSelectedDevice(device)
  }

  // Función para cerrar los detalles del dispositivo
  const handleCloseDetails = () => {
    setSelectedDevice(null)
  }

  // Función para cerrar sesión
  const handleLogout = () => {
    clearAuthData()
    setIsConnected(false)
    setInfrastructureData(null)
    setSelectedDevice(null)
  }

  // Función para actualizar la infraestructura
  const handleUpdateInfrastructure = (updatedData: InfrastructureData) => {
    setInfrastructureData(updatedData)
    saveInfrastructureToLocalStorage(updatedData)
  }

  // Mostrar pantalla de carga durante la inicialización
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RefreshCw className="animate-spin h-8 w-8 mx-auto mb-4 text-gray-500" />
          <p className="text-gray-600">Cargando sesión...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col w-full h-screen bg-gray-50 text-gray-900">
      <header className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center">
            <Server className="mr-2" /> Visualizador de Centro de Datos Proxmox
          </h1>
          {isConnected && (
            <div className="flex items-center gap-4">
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "2d" | "3d" | "manage")}>
                <TabsList className="bg-gray-100">
                  <TabsTrigger value="2d">Vista 2D</TabsTrigger>
                  <TabsTrigger value="3d">Vista 3D</TabsTrigger>
                  <TabsTrigger value="manage" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    Gestionar Racks
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="flex items-center">
                <Label htmlFor="auto-refresh" className="mr-2">
                  Auto-refresco:
                </Label>
                <Input
                  id="auto-refresh"
                  type="checkbox"
                  className="w-4 h-4"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                />
              </div>
              {autoRefresh && (
                <div className="flex items-center">
                  <Label htmlFor="refresh-interval" className="mr-2">
                    Intervalo (s):
                  </Label>
                  <Input
                    id="refresh-interval"
                    type="number"
                    className="w-20 h-8"
                    value={refreshInterval}
                    onChange={(e) => setRefreshInterval(Number.parseInt(e.target.value))}
                    min={5}
                  />
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={refreshData}
                disabled={isLoading}
                className="flex items-center"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                Refrescar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center text-red-500 hover:text-red-700"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        {!isConnected ? (
          <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Conectar a Proxmox</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="proxmox-url">URL de API Proxmox</Label>
                <Input
                  id="proxmox-url"
                  placeholder="https://proxmox.ejemplo.com:8006/api2/json"
                  value={proxmoxUrl}
                  onChange={(e) => setProxmoxUrl(e.target.value)}
                  className="bg-white border-gray-300"
                />
              </div>
              <div>
                <Label htmlFor="proxmox-user">Usuario</Label>
                <Input
                  id="proxmox-user"
                  placeholder="root@pam"
                  value={proxmoxUser}
                  onChange={(e) => setProxmoxUser(e.target.value)}
                  className="bg-white border-gray-300"
                />
              </div>
              <div>
                <Label htmlFor="proxmox-password">Contraseña</Label>
                <Input
                  id="proxmox-password"
                  type="password"
                  value={proxmoxPassword}
                  onChange={(e) => setProxmoxPassword(e.target.value)}
                  className="bg-white border-gray-300"
                />
              </div>
              <div className="flex items-center mt-4">
                <Input
                  id="use-mock-data"
                  type="checkbox"
                  className="w-4 h-4 mr-2"
                  checked={useMockData}
                  onChange={(e) => setUseMockData(e.target.checked)}
                />
                <Label htmlFor="use-mock-data" className="text-sm text-gray-600">
                  Usar datos simulados (para desarrollo/vista previa)
                </Label>
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button onClick={connectToProxmox} disabled={isLoading} className="w-full">
                {isLoading ? "Conectando..." : "Conectar"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex h-full">
            {viewMode === "manage" ? (
              <div className="w-full">
                <RackManager
                  infrastructureData={infrastructureData!}
                  onUpdateInfrastructure={handleUpdateInfrastructure}
                />
              </div>
            ) : (
              <div className="flex-1 relative">
                <div className="h-full">
                  {viewMode === "3d" ? (
                    <DataCenter3DView infrastructureData={infrastructureData!} onDeviceSelect={handleDeviceSelect} />
                  ) : (
                    <DataCenter2DView infrastructureData={infrastructureData!} onDeviceSelect={handleDeviceSelect} />
                  )}
                </div>
              </div>
            )}

            {selectedDevice && viewMode !== "manage" && (
              <div className="w-96 border-l border-gray-200 overflow-y-auto">
                <DeviceDetails
                  device={selectedDevice}
                  onClose={handleCloseDetails}
                  infrastructureData={infrastructureData!}
                />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
