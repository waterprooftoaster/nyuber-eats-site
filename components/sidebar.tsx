import Link from "next/link"
import { ClipboardList, Home, LayoutDashboard, ShoppingCart, User } from "lucide-react"
import type { User as SupabaseUser } from "@supabase/supabase-js"

const navBtnClass =
  "flex items-center gap-3 w-full rounded-lg px-4 py-3 text-black text-sm font-medium hover:bg-black/10 transition-colors"

interface Props {
  user: SupabaseUser | null
  isSwiper?: boolean
}

export function Sidebar({ user, isSwiper }: Props) {
  return (
    <aside className="w-56 shrink-0 bg-white border-r border-black flex flex-col gap-1 p-3">
      <Link href="/" className={navBtnClass}>
        <Home className="h-5 w-5" />
        Home
      </Link>
      <Link href="/cart" className={navBtnClass}>
        <ShoppingCart className="h-5 w-5" />
        Cart
      </Link>
      {user && isSwiper && (
        <>
          <Link href="/swiper/dashboard" className={navBtnClass}>
            <LayoutDashboard className="h-5 w-5" />
            Swiper Dashboard
          </Link>
          <Link href="/swiper/orders" className={navBtnClass}>
            <ClipboardList className="h-5 w-5" />
            Pending Orders
          </Link>
        </>
      )}
      {user ? (
        <Link href="/account" className={navBtnClass}>
          <User className="h-5 w-5" />
          Profile
        </Link>
      ) : (
        <Link href="/auth/login" className={navBtnClass}>
          Log In / Sign Up
        </Link>
      )}
    </aside>
  )
}
