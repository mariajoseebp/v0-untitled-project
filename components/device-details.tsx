"use client"

import { useState } from "react"
import type { Device, InfrastructureData } from "@/lib/types"
import { X, Cpu, MemoryStickIcon as Memory, DiscIcon as DiskIcon, Globe, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  getDeviceIcon,
  getDeviceTypeLabel,
  formatMemory,
  formatStorage,
  getStatusVariant,
  getVmStatusVariant,
} from "@/lib/utils"

interface DeviceDetailsProps {
  device: Device
  onClose: () => void
  infrastructureData: InfrastructureData
}

export default function DeviceDetails({ device, onClose, infrastructureData }: DeviceDetailsProps) {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="h-full bg-white">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
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
                Resumen
              </TabsTrigger>
              <TabsTrigger value="vms" className="flex-1">
                VMs
              </TabsTrigger>
              <TabsTrigger value="resources" className="flex-1">
                Recursos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 space-y-4">
              <DeviceOverview device={device} />
            </TabsContent>

            <TabsContent value="vms" className="mt-4">
              <VirtualMachinesList nodeId={device.id} infrastructureData={infrastructureData} />
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
      <Card className="bg-white border border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Detalles</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-gray-500">ID:</dt>
            <dd>{device.id}</dd>

            <dt className="text-gray-500">Estado:</dt>
            <dd>
              <Badge variant={getStatusVariant(device.status)}>{device.status}</Badge>
            </dd>

            <dt className="text-gray-500">Dirección IP:</dt>
            <dd>{device.ipAddress || "N/A"}</dd>

            {device.type === "node" && (
              <>
                <dt className="text-gray-500">Modelo CPU:</dt>
                <dd>{device.cpuModel || "N/A"}</dd>

                <dt className="text-gray-500">Núcleos CPU:</dt>
                <dd>{device.cpuCores || "N/A"}</dd>

                <dt className="text-gray-500">Memoria:</dt>
                <dd>{formatMemory(device.memory || 0)}</dd>
              </>
            )}

            {device.type === "storage" && (
              <>
                <dt className="text-gray-500">Tipo de almacenamiento:</dt>
                <dd>{device.storageType || "N/A"}</dd>

                <dt className="text-gray-500">Capacidad:</dt>
                <dd>{formatStorage(device.storageCapacity || 0)}</dd>
              </>
            )}

            {device.type === "network" && (
              <>
                <dt className="text-gray-500">Puertos:</dt>
                <dd>{device.networkPorts || "N/A"}</dd>

                <dt className="text-gray-500">Velocidad:</dt>
                <dd>{device.networkSpeed || "N/A"}</dd>
              </>
            )}
          </dl>
        </CardContent>
      </Card>

      {device.description && (
        <Card className="bg-white border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Descripción</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{device.description}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function VirtualMachinesList({
  nodeId,
  infrastructureData,
}: {
  nodeId: string
  infrastructureData: InfrastructureData
}) {
  // Filtrar las VMs que pertenecen a este nodo
  const nodeVMs = infrastructureData.vms.filter((vm) => vm.nodeId === nodeId)

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">Máquinas Virtuales ({nodeVMs.length})</h3>

      {nodeVMs.length === 0 ? (
        <p className="text-sm text-gray-500">No se encontraron máquinas virtuales en este nodo.</p>
      ) : (
        nodeVMs.map((vm) => (
          <Card key={vm.id} className="bg-white border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  {getDeviceIcon("vm")}
                  <span className="font-medium ml-2">{vm.name}</span>
                </div>
                <Badge variant={getVmStatusVariant(vm.status)}>{vm.status}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
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
                  {formatMemory(vm.memory * 1024 * 1024)} {/* Convertir MB a bytes */}
                </div>
                <div className="flex items-center col-span-2">
                  <DiskIcon className="h-3 w-3 mr-1" />
                  {formatStorage(vm.disk * 1024 * 1024 * 1024)} {/* Convertir GB a bytes */}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}

function ResourceUsage({ device }: { device: Device }) {
  // Datos simulados - en una implementación real, se obtendrían del dispositivo
  const cpuUsage = 45
  const memoryUsage = 68
  const diskUsage = 32
  const networkUsage = 12

  return (
    <div className="space-y-4">
      <Card className="bg-white border border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Uso de CPU</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uso</span>
              <span>{cpuUsage}%</span>
            </div>
            <Progress value={cpuUsage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Uso de Memoria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uso</span>
              <span>
                {memoryUsage}% ({formatMemory(device.memory ? (device.memory * memoryUsage) / 100 : 0)} /{" "}
                {formatMemory(device.memory || 0)})
              </span>
            </div>
            <Progress value={memoryUsage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Uso de Disco</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uso</span>
              <span>{diskUsage}%</span>
            </div>
            <Progress value={diskUsage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Uso de Red</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uso</span>
              <span>{networkUsage}%</span>
            </div>
            <Progress value={networkUsage} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
