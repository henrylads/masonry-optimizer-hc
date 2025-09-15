import MasonryDesignerForm from "@/components/masonry-designer-form"
import { AuthHeader } from "@/components/auth-header"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Masonry Support Designer | Clariti",
  description: "Design and optimise masonry support systems",
}

export default function Home() {
  return (
    <div className="min-h-screen">
      <AuthHeader />
      <MasonryDesignerForm />
    </div>
  )
}
