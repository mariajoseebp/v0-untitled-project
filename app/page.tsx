import SimpleComponent from "@/components/simple-component"
import StyledComponent from "@/components/styled-component"
import IconComponent from "@/components/icon-component"
import UiComponent from "@/components/ui-component"

export default function Home() {
  return (
    <div>
      <h1>Proxmox Data Center Visualizer</h1>
      <p>Simplified version for debugging</p>
      <SimpleComponent />
      <StyledComponent />
      <IconComponent />
      <UiComponent />
    </div>
  )
}
