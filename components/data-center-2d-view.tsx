"use client"

import { useState } from "react"
import type { InfrastructureData, Device, DeviceType } from "@/lib/types"
import { Server, Database, HardDrive, Network, Zap, Monitor, LayoutGrid } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface DataCenter2DViewProps {
  infrastructureData: InfrastructureData
  onDeviceSelect: (device: Device) => void
}

export default function DataCenter2DView({ infrastructureData, onDeviceSelect }: DataCenter2DViewProps) {
  const [hoveredDevice, setHoveredDevice] = useState<Device | null>(null)

  return (
    <div className="w-full h-full bg-gray-950 p-8 overflow-auto">
      <TooltipProvider>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {infrastructureData.racks.map((rack) => (
            <div key={rack.id} className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
              <div
                className="bg-gray-800 p-4 flex justify-between items-center cursor-pointer"
                onClick={() => onDeviceSelect(rack)}
              >
                <h3 className="font-medium flex items-center">
                  <LayoutGrid className="mr-2 h-5 w-5" />
                  {rack.name}
                </h3>
                <Badge variant="outline">
                  {infrastructureData.nodes.filter((node) => node.rackId === rack.id).length} Devices
                </Badge>
              </div>

              <div className="p-4 space-y-2">
                {infrastructureData.nodes
                  .filter((node) => node.rackId === rack.id)
                  .map((node) => (
                    <Tooltip key={node.id}>
                      <TooltipTrigger asChild>
                        <div
                          className="flex items-center p-3 bg-gray-800 rounded border border-gray-700 hover:border-gray-500 cursor-pointer transition-colors"
                          onClick={() => onDeviceSelect(node)}
                          onMouseEnter={() => setHoveredDevice(node)}
                          onMouseLeave={() => setHoveredDevice(null)}
                        >
                          {getDeviceIcon(node.type)}
                          <div className="ml-3 flex-1">
                            <div className="font-medium">{node.name}</div>
                            <div className="text-xs text-gray-400">{getDeviceTypeLabel(node.type)}</div>
                          </div>
                          {node.type === "node" && (
                            <Badge className="bg-blue-600">
                              {infrastructureData.vms.filter((vm) => vm.nodeId === node.id).length} VMs
                            </Badge>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Click to view details</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </TooltipProvider>
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
