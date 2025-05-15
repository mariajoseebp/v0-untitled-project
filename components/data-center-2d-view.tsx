"use client"

import { useState } from "react"
import type { InfrastructureData, Device } from "@/lib/types"
import { LayoutGrid } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { getDeviceIcon, getDeviceTypeLabel } from "@/lib/utils"

interface DataCenter2DViewProps {
  infrastructureData: InfrastructureData
  onDeviceSelect: (device: Device) => void
}

export default function DataCenter2DView({ infrastructureData, onDeviceSelect }: DataCenter2DViewProps) {
  const [hoveredDevice, setHoveredDevice] = useState<Device | null>(null)

  return (
    <div className="w-full h-full bg-gray-50 p-8 overflow-auto">
      <TooltipProvider>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {infrastructureData.racks.map((rack) => (
            <div key={rack.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              <div
                className="bg-gray-100 p-4 flex justify-between items-center cursor-pointer"
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
                          className="flex items-center p-3 bg-gray-50 rounded border border-gray-200 hover:border-gray-400 cursor-pointer transition-colors"
                          onClick={() => onDeviceSelect(node)}
                          onMouseEnter={() => setHoveredDevice(node)}
                          onMouseLeave={() => setHoveredDevice(null)}
                        >
                          {getDeviceIcon(node.type)}
                          <div className="ml-3 flex-1">
                            <div className="font-medium">{node.name}</div>
                            <div className="text-xs text-gray-500">{getDeviceTypeLabel(node.type)}</div>
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
