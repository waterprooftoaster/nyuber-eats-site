import Link from "next/link"
import { ClipboardList, Home, LogIn, User } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getAuthenticatedUser } from "@/lib/api/helpers"
import { HeaderCartButton } from "@/components/header-cart-button"

const iconBtnClass = "rounded-full p-2 text-black transition-colors hover:bg-black/10"

export async function Header() {
  const supabase = await createClient()
  const user = await getAuthenticatedUser(supabase)

  const isSwiper = user
    ? ((await supabase.from('profiles').select('is_swiper').eq('id', user.id).single())
        .data?.is_swiper ?? false)
    : false

  return (
    <header className="flex items-center justify-between bg-white border-b border-black px-6 py-4">
      <Link href="/" className="text-black font-bold text-xl tracking-tight">
        NYUber Eats
      </Link>

      <div className="flex items-center gap-1">
        {/* Mobile-only sidebar nav icons */}
        <div className="flex items-center md:hidden">
          <Link href="/" className={iconBtnClass} aria-label="Home">
            <Home className="h-5 w-5" />
          </Link>
          {user && isSwiper && (
            <Link href="/swiper/orders" className={iconBtnClass} aria-label="Pending Orders">
              <ClipboardList className="h-5 w-5" />
            </Link>
          )}
          {user ? (
            <Link href="/account" className={iconBtnClass} aria-label="Profile">
              <User className="h-5 w-5" />
            </Link>
          ) : (
            <Link href="/auth/login" className={iconBtnClass} aria-label="Log In">
              <LogIn className="h-5 w-5" />
            </Link>
          )}
        </div>

        <HeaderCartButton />

        {!user && (
          <>
            <Link
              href="/auth/login"
              className="px-3 py-2 text-sm font-medium text-black"
            >
              Log In
            </Link>
            <Link
              href="/auth/login"
              className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </header>
  )
}
