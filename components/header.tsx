import Link from "next/link"
import { ShoppingCart, User } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getAuthenticatedUser } from "@/lib/api/helpers"

const iconBtnClass =
  "rounded-full p-2 text-white transition-colors hover:bg-white/10"

export async function Header() {
  const supabase = await createClient()
  const user = await getAuthenticatedUser(supabase)

  return (
    <header className="flex items-center justify-between bg-[#1A1A1A] px-6 py-4">
      <Link href="/" className="text-white font-bold text-xl tracking-tight">
        NYUber Eats
      </Link>

      <div className="flex items-center gap-1">
        <button type="button" className={iconBtnClass} aria-label="Cart">
          <ShoppingCart className="h-5 w-5" />
        </button>

        {user ? (
          <Link href="/account" className={iconBtnClass} aria-label="Account">
            <User className="h-5 w-5" />
          </Link>
        ) : (
          <>
            <Link
              href="/auth/login"
              className="px-3 py-2 text-sm font-medium text-white"
            >
              Log In
            </Link>
            <Link
              href="/auth/login"
              className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-gray-300"
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </header>
  )
}
