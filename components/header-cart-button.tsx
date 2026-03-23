'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'

const iconBtnClass = 'rounded-full p-2 text-black transition-colors hover:bg-black/10'

export function HeaderCartButton() {
  const pathname = usePathname()
  if (pathname.startsWith('/checkout')) return null
  return (
    <Link href="/cart" className={iconBtnClass} aria-label="Cart">
      <ShoppingCart className="h-5 w-5" />
    </Link>
  )
}
