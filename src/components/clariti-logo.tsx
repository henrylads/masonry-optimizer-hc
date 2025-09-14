import Image from "next/image"

interface ClaritiLogoProps {
  className?: string
}

export function ClaritiLogo({ className }: ClaritiLogoProps) {
  return (
    <div className={className}>
      <Image src="/logo.png" alt="Clariti Logo" width={120} height={40} className="h-full w-auto" />
    </div>
  )
} 