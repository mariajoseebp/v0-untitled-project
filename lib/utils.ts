import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

import type { DeviceType } from "./types"
import { Server, Database, HardDrive, Network, Zap, Monitor, LayoutGrid } from "lucide-react"

// Función para obtener el icono de un dispositivo según su tipo
export function getDeviceIcon(type: DeviceType) {
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

// Función para obtener la etiqueta de un tipo de dispositivo
export function getDeviceTypeLabel(type: DeviceType): string {
  switch (type) {
    case "node":
      return "Nodo Proxmox"
    case "storage":
      return "Dispositivo de Almacenamiento"
    case "network":
      return "Switch de Red"
    case "ups":
      return "UPS / Energía"
    case "rack":
      return "Rack de Servidores"
    case "vm":
      return "Máquina Virtual"
    default:
      return "Dispositivo Desconocido"
  }
}

// Función para formatear memoria
export function formatMemory(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

// Función para formatear almacenamiento
export function formatStorage(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  if (bytes < 1024 * 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
  return `${(bytes / (1024 * 1024 * 1024 * 1024)).toFixed(2)} TB`
}

// Función para obtener la variante de estado
export function getStatusVariant(status: string): "default" | "destructive" | "outline" | "secondary" {
  switch (status) {
    case "online":
      return "default"
    case "offline":
      return "destructive"
    case "warning":
      return "secondary"
    default:
      return "outline"
  }
}

// Función para obtener la variante de estado de VM
export function getVmStatusVariant(status: string): "default" | "destructive" | "outline" | "secondary" {
  switch (status) {
    case "running":
      return "default"
    case "stopped":
      return "destructive"
    case "paused":
      return "secondary"
    default:
      return "outline"
  }
}

// Función para guardar la infraestructura en localStorage
export function saveInfrastructureToLocalStorage(infrastructureData: any) {
  if (typeof window !== "undefined") {
    localStorage.setItem("proxmox_infrastructure", JSON.stringify(infrastructureData))
  }
}

// Función para cargar la infraestructura desde localStorage
export function loadInfrastructureFromLocalStorage() {
  if (typeof window !== "undefined") {
    const savedData = localStorage.getItem("proxmox_infrastructure")
    if (savedData) {
      try {
        return JSON.parse(savedData)
      } catch (error) {
        console.error("Error al cargar datos de infraestructura:", error)
      }
    }
  }
  return null
}
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
