import MasonryDensityCalculator from "@/components/masonry-density-calculator"
import { AuthHeader } from "@/components/auth-header"
import { MainNavigation } from "@/components/main-navigation"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Masonry Density Calculator | Clariti",
  description: "Calculate brick density and loading on piers",
}

export default function DensityCalculatorPage() {
  return (
    <div className="min-h-screen">
      <AuthHeader />
      <MainNavigation />
      <MasonryDensityCalculator />
    </div>
  )
}
