import { Button } from "@/components/ui/button"

export default function UiComponent() {
  return (
    <div className="border p-4 my-4">
      <h2>UI Component</h2>
      <p>This component uses a shadcn/ui Button component.</p>
      <Button>Click me</Button>
    </div>
  )
}
