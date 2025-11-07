import Image from "next/image"

interface ClaritiLogoProps {
  className?: string
}

export function ClaritiLogo({ className }: ClaritiLogoProps) {
  return (
    <div className={className}>
      <Image src="/logo.png" alt="Clariti Logo" width={90} height={30} className="h-auto w-auto" />
    </div>
  )
} 