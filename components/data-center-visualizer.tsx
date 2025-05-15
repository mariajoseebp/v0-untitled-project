"use client"

import { useState } from "react"
import DataCenter3DView from "./data-center-3d-view"
import DataCenter2DView from "./data-center-2d-view"
import DeviceDetails from "./device-details"
import RackManager from "./rack-manager"

export default function DataCenterVisualizer() {
  const [viewMode, setViewMode] = useState<"2d" | "3d" | "manage">("3d")

  return (
    <div>
      <h1>Proxmox Data Center Visualizer</h1>

      <div>
        <button onClick={() => setViewMode("2d")}>2D View</button>
        <button onClick={() => setViewMode("3d")}>3D View</button>
        <button onClick={() => setViewMode("manage")}>Manage Racks</button>
      </div>

      <div>
        {viewMode === "3d" && <DataCenter3DView />}
        {viewMode === "2d" && <DataCenter2DView />}
        {viewMode === "manage" && <RackManager />}
      </div>

      <div>
        <DeviceDetails />
      </div>
    </div>
  )
}
