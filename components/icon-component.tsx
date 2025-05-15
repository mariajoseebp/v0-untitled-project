import { Server } from "lucide-react"

export default function IconComponent() {
  return (
    <div className="border p-4 my-4">
      <h2 className="flex items-center">
        <Server className="mr-2 h-5 w-5" />
        Icon Component
      </h2>
      <p>This component uses a Lucide React icon.</p>
    </div>
  )
}
