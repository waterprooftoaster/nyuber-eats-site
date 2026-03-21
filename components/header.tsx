import Link from "next/link"
import { ShoppingCart } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getAuthenticatedUser } from "@/lib/api/helpers"

const iconBtnClass =
  "rounded-full p-2 text-black transition-colors hover:bg-black/10"

export async function Header() {
  const supabase = await createClient()
  const user = await getAuthenticatedUser(supabase)

  return (
    <header className="flex items-center justify-between bg-white border-b border-black px-6 py-4">
      <Link href="/" className="text-black font-bold text-xl tracking-tight">
        NYUber Eats
      </Link>

      <div className="flex items-center gap-1">
        <Link href="/cart" className={iconBtnClass} aria-label="Cart">
          <ShoppingCart className="h-5 w-5" />
        </Link>

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
