"use client"

import { useState } from "react"
import type { Device, DeviceType, VirtualMachine } from "@/lib/types"
import {
  X,
  Server,
  Database,
  HardDrive,
  Network,
  Zap,
  Monitor,
  LayoutGrid,
  Cpu,
  MemoryStickIcon as Memory,
  DiscIcon as DiskIcon,
  Globe,
  Activity,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface DeviceDetailsProps {
  device: Device
  onClose: () => void
}

export default function DeviceDetails({ device, onClose }: DeviceDetailsProps) {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="h-full bg-gray-900">
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <h2 className="text-lg font-medium flex items-center">
          {getDeviceIcon(device.type)}
          <span className="ml-2">{device.name}</span>
        </h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4">
        <Badge className="mb-4" variant="outline">
          {getDeviceTypeLabel(device.type)}
        </Badge>

        {device.type === "node" && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value="overview" className="flex-1">
                Overview
              </TabsTrigger>
              <TabsTrigger value="vms" className="flex-1">
                VMs
              </TabsTrigger>
              <TabsTrigger value="resources" className="flex-1">
                Resources
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 space-y-4">
              <DeviceOverview device={device} />
            </TabsContent>

            <TabsContent value="vms" className="mt-4">
              <VirtualMachinesList nodeId={device.id} />
            </TabsContent>

            <TabsContent value="resources" className="mt-4 space-y-4">
              <ResourceUsage device={device} />
            </TabsContent>
          </Tabs>
        )}

        {device.type !== "node" && <DeviceOverview device={device} />}
      </div>
    </div>
  )
}

function DeviceOverview({ device }: { device: Device }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-gray-400">ID:</dt>
            <dd>{device.id}</dd>

            <dt className="text-gray-400">Status:</dt>
            <dd>
              <Badge variant={device.status === "online" ? "default" : "destructive"}>{device.status}</Badge>
            </dd>

            <dt className="text-gray-400">IP Address:</dt>
            <dd>{device.ipAddress || "N/A"}</dd>

            {device.type === "node" && (
              <>
                <dt className="text-gray-400">CPU Model:</dt>
                <dd>{device.cpuModel || "N/A"}</dd>

                <dt className="text-gray-400">CPU Cores:</dt>
                <dd>{device.cpuCores || "N/A"}</dd>

                <dt className="text-gray-400">Memory:</dt>
                <dd>{formatMemory(device.memory || 0)}</dd>
              </>
            )}

            {device.type === "storage" && (
              <>
                <dt className="text-gray-400">Storage Type:</dt>
                <dd>{device.storageType || "N/A"}</dd>

                <dt className="text-gray-400">Capacity:</dt>
                <dd>{formatStorage(device.storageCapacity || 0)}</dd>
              </>
            )}

            {device.type === "network" && (
              <>
                <dt className="text-gray-400">Ports:</dt>
                <dd>{device.networkPorts || "N/A"}</dd>

                <dt className="text-gray-400">Speed:</dt>
                <dd>{device.networkSpeed || "N/A"}</dd>
              </>
            )}
          </dl>
        </CardContent>
      </Card>

      {device.description && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{device.description}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function VirtualMachinesList({ nodeId }: { nodeId: string }) {
  // This would be fetched from the actual data
  const mockVMs: VirtualMachine[] = [
    {
      id: "vm-101",
      name: "web-server-1",
      status: "running",
      os: "Ubuntu 22.04",
      ipAddress: "192.168.1.101",
      cpuCores: 4,
      memory: 8192,
      disk: 50,
      nodeId,
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
      nodeId,
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
      nodeId,
    },
  ]

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">Virtual Machines ({mockVMs.length})</h3>

      {mockVMs.map((vm) => (
        <Card key={vm.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Monitor className="h-4 w-4 mr-2 text-purple-500" />
                <span className="font-medium">{vm.name}</span>
              </div>
              <Badge variant={vm.status === "running" ? "default" : "secondary"}>{vm.status}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
              <div className="flex items-center">
                <Globe className="h-3 w-3 mr-1" />
                {vm.ipAddress}
              </div>
              <div className="flex items-center">
                <Activity className="h-3 w-3 mr-1" />
                {vm.os}
              </div>
              <div className="flex items-center">
                <Cpu className="h-3 w-3 mr-1" />
                {vm.cpuCores} vCPUs
              </div>
              <div className="flex items-center">
                <Memory className="h-3 w-3 mr-1" />
                {formatMemory(vm.memory)}
              </div>
              <div className="flex items-center col-span-2">
                <DiskIcon className="h-3 w-3 mr-1" />
                {formatStorage(vm.disk * 1024 * 1024 * 1024)}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function ResourceUsage({ device }: { device: Device }) {
  // Mock data - would be fetched from the actual device
  const cpuUsage = 45
  const memoryUsage = 68
  const diskUsage = 32
  const networkUsage = 12

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Usage</span>
              <span>{cpuUsage}%</span>
            </div>
            <Progress value={cpuUsage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Usage</span>
              <span>
                {memoryUsage}% ({formatMemory(device.memory ? (device.memory * memoryUsage) / 100 : 0)} /{" "}
                {formatMemory(device.memory || 0)})
              </span>
            </div>
            <Progress value={memoryUsage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Usage</span>
              <span>{diskUsage}%</span>
            </div>
            <Progress value={diskUsage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Network Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Usage</span>
              <span>{networkUsage}%</span>
            </div>
            <Progress value={networkUsage} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function getDeviceIcon(type: DeviceType) {
  switch (type) {
    case "node":
      return <Server className="h-5 w-5 text-blue-500" />
    case "storage":
      return <Database className="h-5 w-5 text-emerald-500" />
    case "network":
      return <Network className="h-5 w-5 text-amber-500" />
    case "ups":
      return <Zap className="h-5 w-5 text-red-500" />
    case "vm":
      return <Monitor className="h-5 w-5 text-purple-500" />
    case "rack":
      return <LayoutGrid className="h-5 w-5 text-gray-500" />
    default:
      return <HardDrive className="h-5 w-5 text-gray-500" />
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

function formatMemory(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function formatStorage(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  if (bytes < 1024 * 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
  return `${(bytes / (1024 * 1024 * 1024 * 1024)).toFixed(2)} TB`
}
