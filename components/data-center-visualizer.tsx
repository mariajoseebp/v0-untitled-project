"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RefreshCw, Server } from "lucide-react"
import DataCenter3DView from "@/components/data-center-3d-view"
import DataCenter2DView from "@/components/data-center-2d-view"
import DeviceDetails from "@/components/device-details"
import { fetchInfrastructureData } from "@/lib/api"
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
  const [viewMode, setViewMode] = useState<"2d" | "3d">("3d")
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState(30) // seconds

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

  const connectToProxmox = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await fetchInfrastructureData(proxmoxUrl, proxmoxUser, proxmoxPassword)
      setInfrastructureData(data)
      setIsConnected(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect to Proxmox")
    } finally {
      setIsLoading(false)
    }
  }

  const refreshData = async () => {
    if (!isConnected) return

    setIsLoading(true)
    try {
      const data = await fetchInfrastructureData(proxmoxUrl, proxmoxUser, proxmoxPassword)
      setInfrastructureData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeviceSelect = (device: Device) => {
    setSelectedDevice(device)
  }

  const handleCloseDetails = () => {
    setSelectedDevice(null)
  }

  return (
    <div className="flex flex-col w-full h-screen bg-gray-50 text-gray-900">
      <header className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center">
            <Server className="mr-2" /> Proxmox Data Center Visualizer
          </h1>
          {isConnected && (
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <Label htmlFor="auto-refresh" className="mr-2">
                  Auto-refresh:
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
                    Interval (s):
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
                Refresh
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        {!isConnected ? (
          <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Connect to Proxmox</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="proxmox-url">Proxmox API URL</Label>
                <Input
                  id="proxmox-url"
                  placeholder="https://proxmox.example.com:8006/api2/json"
                  value={proxmoxUrl}
                  onChange={(e) => setProxmoxUrl(e.target.value)}
                  className="bg-white border-gray-300"
                />
              </div>
              <div>
                <Label htmlFor="proxmox-user">Username</Label>
                <Input
                  id="proxmox-user"
                  placeholder="root@pam"
                  value={proxmoxUser}
                  onChange={(e) => setProxmoxUser(e.target.value)}
                  className="bg-white border-gray-300"
                />
              </div>
              <div>
                <Label htmlFor="proxmox-password">Password</Label>
                <Input
                  id="proxmox-password"
                  type="password"
                  value={proxmoxPassword}
                  onChange={(e) => setProxmoxPassword(e.target.value)}
                  className="bg-white border-gray-300"
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button onClick={connectToProxmox} disabled={isLoading} className="w-full">
                {isLoading ? "Connecting..." : "Connect"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex h-full">
            <div className="flex-1 relative">
              <div className="absolute top-4 left-4 z-10">
                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "2d" | "3d")}>
                  <TabsList className="bg-gray-100">
                    <TabsTrigger value="2d">2D View</TabsTrigger>
                    <TabsTrigger value="3d">3D View</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="h-full">
                {viewMode === "3d" ? (
                  <DataCenter3DView infrastructureData={infrastructureData!} onDeviceSelect={handleDeviceSelect} />
                ) : (
                  <DataCenter2DView infrastructureData={infrastructureData!} onDeviceSelect={handleDeviceSelect} />
                )}
              </div>
            </div>

            {selectedDevice && (
              <div className="w-96 border-l border-gray-200 overflow-y-auto">
                <DeviceDetails device={selectedDevice} onClose={handleCloseDetails} />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
