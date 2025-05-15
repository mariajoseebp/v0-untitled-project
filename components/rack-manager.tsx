"use client"

import { useState } from "react"
import type { Device, InfrastructureData } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { LayoutGrid, Edit, Trash2, Plus, Save, X, MoveHorizontal } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getDeviceIcon } from "@/lib/utils"

interface RackManagerProps {
  infrastructureData: InfrastructureData
  onUpdateInfrastructure: (updatedData: InfrastructureData) => void
}

export default function RackManager({ infrastructureData, onUpdateInfrastructure }: RackManagerProps) {
  const [editingRackId, setEditingRackId] = useState<string | null>(null)
  const [newRackName, setNewRackName] = useState("")
  const [isCreatingRack, setIsCreatingRack] = useState(false)
  const [newRackDialogOpen, setNewRackDialogOpen] = useState(false)
  const [moveDeviceDialogOpen, setMoveDeviceDialogOpen] = useState(false)
  const [deviceToMove, setDeviceToMove] = useState<Device | null>(null)
  const [targetRackId, setTargetRackId] = useState<string | null>(null)
  const [deleteConfirmDialogOpen, setDeleteConfirmDialogOpen] = useState(false)
  const [rackToDelete, setRackToDelete] = useState<Device | null>(null)

  // Función para actualizar el nombre de un rack
  const handleUpdateRackName = (rackId: string, newName: string) => {
    const updatedRacks = infrastructureData.racks.map((rack) => {
      if (rack.id === rackId) {
        return { ...rack, name: newName }
      }
      return rack
    })

    onUpdateInfrastructure({
      ...infrastructureData,
      racks: updatedRacks,
    })

    setEditingRackId(null)
  }

  // Función para crear un nuevo rack
  const handleCreateRack = () => {
    if (!newRackName.trim()) return

    const newRackId = `rack-${Date.now()}`
    const newRack: Device = {
      id: newRackId,
      name: newRackName,
      type: "rack",
      status: "online",
      description: "Nuevo rack de servidores",
    }

    onUpdateInfrastructure({
      ...infrastructureData,
      racks: [...infrastructureData.racks, newRack],
    })

    setNewRackName("")
    setNewRackDialogOpen(false)
  }

  // Función para mover un dispositivo a otro rack
  const handleMoveDevice = () => {
    if (!deviceToMove || !targetRackId) return

    // Actualizar el rackId del dispositivo
    const updatedDevices = (() => {
      switch (deviceToMove.type) {
        case "node":
          return {
            nodes: infrastructureData.nodes.map((node) =>
              node.id === deviceToMove.id ? { ...node, rackId: targetRackId } : node,
            ),
          }
        case "storage":
          return {
            storage: infrastructureData.storage.map((storage) =>
              storage.id === deviceToMove.id ? { ...storage, rackId: targetRackId } : storage,
            ),
          }
        case "network":
          return {
            network: infrastructureData.network.map((network) =>
              network.id === deviceToMove.id ? { ...network, rackId: targetRackId } : network,
            ),
          }
        case "ups":
          return {
            ups: infrastructureData.ups.map((ups) =>
              ups.id === deviceToMove.id ? { ...ups, rackId: targetRackId } : ups,
            ),
          }
        default:
          return {}
      }
    })()

    onUpdateInfrastructure({
      ...infrastructureData,
      ...updatedDevices,
    })

    setMoveDeviceDialogOpen(false)
    setDeviceToMove(null)
    setTargetRackId(null)
  }

  // Función para eliminar un rack
  const handleDeleteRack = () => {
    if (!rackToDelete) return

    // Filtrar el rack a eliminar
    const updatedRacks = infrastructureData.racks.filter((rack) => rack.id !== rackToDelete.id)

    // Mover los dispositivos a un rack predeterminado o dejarlos sin rack
    const defaultRackId = updatedRacks.length > 0 ? updatedRacks[0].id : null

    const updatedNodes = infrastructureData.nodes.map((node) => {
      if (node.rackId === rackToDelete.id) {
        return { ...node, rackId: defaultRackId }
      }
      return node
    })

    const updatedStorage = infrastructureData.storage.map((storage) => {
      if (storage.rackId === rackToDelete.id) {
        return { ...storage, rackId: defaultRackId }
      }
      return storage
    })

    const updatedNetwork = infrastructureData.network.map((network) => {
      if (network.rackId === rackToDelete.id) {
        return { ...network, rackId: defaultRackId }
      }
      return network
    })

    const updatedUps = infrastructureData.ups.map((ups) => {
      if (ups.rackId === rackToDelete.id) {
        return { ...ups, rackId: defaultRackId }
      }
      return ups
    })

    onUpdateInfrastructure({
      ...infrastructureData,
      racks: updatedRacks,
      nodes: updatedNodes,
      storage: updatedStorage,
      network: updatedNetwork,
      ups: updatedUps,
    })

    setDeleteConfirmDialogOpen(false)
    setRackToDelete(null)
  }

  // Obtener todos los dispositivos que se pueden mover
  const getAllDevices = () => {
    return [
      ...infrastructureData.nodes,
      ...infrastructureData.storage,
      ...infrastructureData.network,
      ...infrastructureData.ups,
    ]
  }

  // Obtener dispositivos por rack
  const getDevicesByRack = (rackId: string) => {
    return getAllDevices().filter((device) => device.rackId === rackId)
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Gestión de Racks</h2>
        <Button onClick={() => setNewRackDialogOpen(true)} className="flex items-center">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Rack
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {infrastructureData.racks.map((rack) => (
          <Card key={rack.id} className="bg-white">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <LayoutGrid className="mr-2 h-5 w-5 text-gray-500" />
                  {editingRackId === rack.id ? (
                    <Input
                      value={newRackName}
                      onChange={(e) => setNewRackName(e.target.value)}
                      className="h-8 w-48"
                      autoFocus
                    />
                  ) : (
                    <CardTitle className="text-lg">{rack.name}</CardTitle>
                  )}
                </div>
                <div className="flex space-x-2">
                  {editingRackId === rack.id ? (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          handleUpdateRackName(rack.id, newRackName)
                        }}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingRackId(null)
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingRackId(rack.id)
                          setNewRackName(rack.name)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => {
                          setRackToDelete(rack)
                          setDeleteConfirmDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Badge variant="outline">{getDevicesByRack(rack.id).length} dispositivos</Badge>
                </div>
                {getDevicesByRack(rack.id).map((device) => (
                  <div
                    key={device.id}
                    className="flex justify-between items-center p-2 bg-gray-50 rounded border border-gray-200"
                  >
                    <div className="flex items-center">
                      {getDeviceIcon(device.type)}
                      <span className="ml-2 text-sm">{device.name}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setDeviceToMove(device)
                        setMoveDeviceDialogOpen(true)
                      }}
                    >
                      <MoveHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Diálogo para crear un nuevo rack */}
      <Dialog open={newRackDialogOpen} onOpenChange={setNewRackDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nuevo Rack</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label htmlFor="rack-name" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Rack
            </label>
            <Input
              id="rack-name"
              value={newRackName}
              onChange={(e) => setNewRackName(e.target.value)}
              placeholder="Ingrese el nombre del rack"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewRackDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateRack}>Crear Rack</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para mover un dispositivo */}
      <Dialog open={moveDeviceDialogOpen} onOpenChange={setMoveDeviceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mover Dispositivo</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4">
              Mover <strong>{deviceToMove?.name}</strong> a otro rack:
            </p>
            <div className="space-y-2">
              {infrastructureData.racks
                .filter((rack) => rack.id !== deviceToMove?.rackId)
                .map((rack) => (
                  <div
                    key={rack.id}
                    className={`p-3 border rounded-md cursor-pointer flex items-center ${
                      targetRackId === rack.id ? "border-blue-500 bg-blue-50" : "border-gray-200"
                    }`}
                    onClick={() => setTargetRackId(rack.id)}
                  >
                    <LayoutGrid className="mr-2 h-5 w-5 text-gray-500" />
                    <span>{rack.name}</span>
                  </div>
                ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveDeviceDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleMoveDevice} disabled={!targetRackId}>
              Mover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación para eliminar un rack */}
      <Dialog open={deleteConfirmDialogOpen} onOpenChange={setDeleteConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              ¿Está seguro de que desea eliminar el rack <strong>{rackToDelete?.name}</strong>?
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Los dispositivos en este rack serán movidos al primer rack disponible.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteRack}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
